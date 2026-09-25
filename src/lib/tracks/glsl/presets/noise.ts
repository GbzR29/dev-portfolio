// src/lib/tracks/glsl/presets/noise.ts
import type { PlaygroundPreset } from "@/components/lesson/glsl/ShaderPlayground";
// ── Noise ─────────────────────────────────────────────────────────────────────
const NOISE_LIB = `// ── hashes ──
float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
vec2  hash22(vec2 p) {                                    // random gradient in [-1, 1]²
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// ── value noise: random values at the lattice, smoothstep blend ──
float valueNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i),                 hash21(i + vec2(1.0, 0.0)), u.x),
               mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}

// ── gradient (Perlin-style) noise: random slopes at the lattice, quintic blend ──
float gradientNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    float a = dot(hash22(i),                 f);
    float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
    float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
    float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);      // about [-0.7, 0.7]
}

// ── simplex noise (IQ's 2D version): 3 corners instead of 4 ──
float simplexNoise(vec2 p) {
    const float K1 = 0.366025404;                         // (sqrt(3) - 1) / 2
    const float K2 = 0.211324865;                         // (3 - sqrt(3)) / 6
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    float m = step(a.y, a.x);
    vec2 o = vec2(m, 1.0 - m);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * h * vec3(dot(a, hash22(i)), dot(b, hash22(i + o)), dot(c, hash22(i + 1.0)));
    return dot(n, vec3(70.0));                            // about [-1, 1]
}

// ── Worley / cellular noise: distance to the nearest feature point ──
float worley(vec2 p, float t) {
    vec2 i = floor(p), f = fract(p);
    float d = 8.0;
    for (int y = -1; y <= 1; y++)
    for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = 0.5 + 0.5 * sin(t + 6.2831 * (0.5 + 0.5 * hash22(i + g)));   // animated feature point
        d = min(d, length(g + o - f));
    }
    return d;
}`;

export const NOISE_PRESETS: PlaygroundPreset[] = [
  {
    id: "compare", label: "value · gradient · simplex · Worley",
    note: "Four noises at the same scale: value (top-left) shows its grid as blocky blobs; gradient (top-right) hides it; simplex (bottom-left) is similar but cheaper and without axis bias; Worley (bottom-right) is cellular. Toggle the lattice to see the grid each one is built on.",
    frag: `uniform float uScale;    // @slider 2.0 24.0 6.0
uniform float uLattice;  // @toggle 0

${NOISE_LIB}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec2 q  = fract(uv * 2.0);                          // each quadrant: its own 0..1
    vec2 p  = q * uScale * vec2(uResolution.x / uResolution.y, 1.0) + uTime * 0.2;
    float v;
    if (uv.y > 0.5) v = uv.x < 0.5 ? valueNoise(p) : gradientNoise(p) + 0.5;
    else            v = uv.x < 0.5 ? simplexNoise(p) * 0.5 + 0.5 : worley(p, uTime);
    vec3 col = vec3(v);
    if (uLattice > 0.5) {
        vec2 g = abs(fract(p) - 0.5);
        col = mix(col, vec3(1.0, 0.4, 0.1), step(0.48, max(g.x, g.y)) * 0.7);   // cell borders
    }
    vec2 e = abs(uv - 0.5);
    col = mix(vec3(0.05), col, smoothstep(0.0, 0.003, min(e.x, e.y)));   // separators
    FragColor = vec4(col, 1.0);
}`,
  },
  {
    id: "fbm", label: "fBm, turbulence & ridges",
    note: "Octaves of gradient noise, each rotated by a fixed matrix so their grids never line up. uMode 0 = fBm (clouds), 1 = turbulence Σ|n| (fire, marble veins), 2 = ridged Σ(1−|n|)² (mountain ridges). Coloured as terrain.",
    frag: `uniform int   uOctaves;     // @slider 1 8 5
uniform float uLacunarity;  // @slider 1.5 3.0 2.0
uniform float uGain;        // @slider 0.2 0.8 0.5
uniform int   uMode;        // @slider 0 2 0

${NOISE_LIB}

float fbm(vec2 p) {
    const mat2 R = mat2(0.8, 0.6, -0.6, 0.8);           // rotate each octave
    float sum = 0.0, amp = 0.5, norm = 0.0;
    for (int i = 0; i < 8; i++) {
        if (i >= uOctaves) break;
        float n = gradientNoise(p) * 1.4;                // ~[-1, 1]
        if (uMode == 1) n = abs(n);
        if (uMode == 2) { n = 1.0 - abs(n); n *= n; }
        sum  += amp * n;
        norm += amp;
        p = R * p * uLacunarity;
        amp *= uGain;
    }
    return sum / norm;
}

void main() {
    vec2 p = (gl_FragCoord.xy / uResolution.y) * 3.0 + vec2(uTime * 0.1, 0.0);
    float h = fbm(p);
    if (uMode == 0) h = h * 0.5 + 0.5;
    vec3 col = mix(vec3(0.05, 0.2, 0.45), vec3(0.1, 0.45, 0.6), smoothstep(0.2, 0.45, h));   // water
    col = mix(col, vec3(0.85, 0.8, 0.55), smoothstep(0.45, 0.47, h));                         // sand
    col = mix(col, vec3(0.25, 0.5, 0.2), smoothstep(0.48, 0.55, h));                          // grass
    col = mix(col, vec3(0.45, 0.4, 0.35), smoothstep(0.62, 0.7, h));                          // rock
    col = mix(col, vec3(0.95), smoothstep(0.75, 0.8, h));                                     // snow
    FragColor = vec4(col, 1.0);
}`,
  },
  {
    id: "warp", label: "domain warping",
    note: "Íñigo Quílez's domain warping: f(p + 4·q) where q is itself made of fBm, and a second layer on top of that. Noise that bends noise gives flowing, marble-like structures. The colours come from the intermediate vectors q and r.",
    frag: `uniform float uWarp;   // @slider 0.0 8.0 4.0
uniform float uSpeed;  // @slider 0.0 1.0 0.15

${NOISE_LIB}

float fbm(vec2 p) {
    const mat2 R = mat2(0.8, 0.6, -0.6, 0.8);
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { s += a * gradientNoise(p); p = R * p * 2.02; a *= 0.5; }
    return s;
}

void main() {
    vec2 p = gl_FragCoord.xy / uResolution.y * 3.0;
    float t = uTime * uSpeed;
    vec2 q = vec2(fbm(p + vec2(0.0, 0.0) + t), fbm(p + vec2(5.2, 1.3) - t));
    vec2 r = vec2(fbm(p + uWarp * q + vec2(1.7, 9.2) + 0.7 * t), fbm(p + uWarp * q + vec2(8.3, 2.8) - 0.6 * t));
    float f = fbm(p + uWarp * r);

    vec3 col = mix(vec3(0.1, 0.3, 0.4), vec3(0.7, 0.65, 0.5), clamp(f * 2.0 + 0.5, 0.0, 1.0));
    col = mix(col, vec3(0.0, 0.1, 0.25), clamp(length(q) * 1.5, 0.0, 1.0));
    col = mix(col, vec3(0.9, 0.55, 0.3), clamp(abs(r.x) * 1.5, 0.0, 1.0));
    FragColor = vec4(col * (0.6 + 0.8 * (f + 0.5)), 1.0);
}`,
  },
  {
    id: "materials", label: "wood & marble from noise",
    note: "Two classic procedural materials. Wood: concentric rings, fract(r·k), whose radius is perturbed by noise. Marble: a sine of x plus turbulence. The left and right halves use the same noise functions.",
    frag: `uniform float uRings;   // @slider 4.0 40.0 14.0
uniform float uTurb;    // @slider 0.0 12.0 5.0

${NOISE_LIB}

float turbulence(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 6; i++) { s += a * abs(gradientNoise(p)); p *= 2.0; a *= 0.5; }
    return s;
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.y;
    vec3 col;
    if (gl_FragCoord.x < uResolution.x * 0.5) {
        vec2 p = uv - vec2(0.2, -0.3);
        float r = length(p * vec2(1.0, 0.25)) + 0.08 * gradientNoise(uv * 6.0);  // stretched rings + wobble
        float ring = fract(r * uRings);
        ring = smoothstep(0.0, 0.7, ring) - smoothstep(0.75, 1.0, ring);
        col = mix(vec3(0.45, 0.25, 0.1), vec3(0.8, 0.55, 0.3), ring);
        col *= 0.85 + 0.15 * gradientNoise(uv * vec2(80.0, 4.0));                // grain
    } else {
        float v = sin(uv.x * 8.0 + uTurb * turbulence(uv * 3.0 + uTime * 0.02));
        v = 0.5 + 0.5 * v;
        col = mix(vec3(0.25, 0.27, 0.32), vec3(0.93, 0.92, 0.9), pow(v, 0.35));
    }
    FragColor = vec4(col, 1.0);
}`,
  },
];
