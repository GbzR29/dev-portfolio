// Playground presets for the noise, texturing and effect-recipe chapters.
import type { PlaygroundPreset } from "@/components/lesson/glsl/ShaderPlayground";
import { pickTexture } from "@/components/lesson/glsl/textures";

const POOL = pickTexture("mat:squareceramic-glossytiletexture-aqua-blue:albedo", "uvgrid");
const PAVER = pickTexture("mat:squarestackedpavertexture-grey:albedo", "checker");
const PAVER_N = pickTexture("mat:squarestackedpavertexture-grey:normal", "mat:clayceramicglossy:normal", "noise");
const PAVER_R = pickTexture("mat:squarestackedpavertexture-grey:roughness", "clouds");
const GRID = pickTexture("proto:orange:8", "checker");

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

// ── Texturing tricks ──────────────────────────────────────────────────────────
export const TEXTURE_PRESETS: PlaygroundPreset[] = [
  {
    id: "sampling", label: "nearest · bilinear · explicit LOD",
    channels: [GRID],
    note: "Left: texelFetch with integer coordinates (nearest, no filtering). Middle: texture(), bilinear + mipmaps picked by the hardware. Right: textureLod with a mip level you choose. Zoom out (small uZoom) to see aliasing on the left and mips on the right.",
    frag: `uniform float uZoom;   // @slider 0.05 4.0 0.3
uniform float uLod;    // @slider 0.0 8.0 2.0

void main() {
    vec2 uv  = gl_FragCoord.xy / uResolution.y / uZoom + vec2(uTime * 0.02, 0.0);
    vec2 sz  = vec2(textureSize(uTex0, 0));
    float x  = gl_FragCoord.x / uResolution.x;
    vec3 col;
    if (x < 0.333)      col = texelFetch(uTex0, ivec2(mod(floor(uv * sz), sz)), 0).rgb;  // nearest, by hand
    else if (x < 0.667) col = texture(uTex0, uv).rgb;                                     // automatic
    else                col = textureLod(uTex0, uv, uLod).rgb;                            // chosen mip
    float e = min(abs(x - 0.333), abs(x - 0.667)) * uResolution.x;
    FragColor = vec4(mix(vec3(0.0), col, smoothstep(0.0, 2.0, e)), 1.0);
}`,
  },
  {
    id: "distort", label: "heat haze / flowing distortion",
    channels: [PAVER, "clouds"],
    note: "A second texture (uTex1, smooth noise) is scrolled in two directions and used to offset the UV of the first. The same trick makes heat haze, underwater wobble, force fields and flowing lava.",
    frag: `uniform float uStrength;  // @slider 0.0 0.08 0.025
uniform float uSpeed;     // @slider 0.0 1.0 0.2

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.y;
    // two layers of noise moving in different directions never look like a simple scroll
    vec2 n1 = texture(uTex1, uv * 0.7 + vec2(uTime * uSpeed, 0.0)).rg;
    vec2 n2 = texture(uTex1, uv * 1.3 - vec2(0.0, uTime * uSpeed * 0.7)).rg;
    vec2 offset = (n1 + n2 - 1.0) * uStrength;
    // stronger at the bottom, like hot air rising from the ground
    offset *= smoothstep(0.9, 0.0, gl_FragCoord.y / uResolution.y);
    FragColor = vec4(texture(uTex0, uv + offset).rgb, 1.0);
}`,
  },
  {
    id: "triplanar", label: "triplanar mapping",
    mode: "mesh", mesh: "torus", channels: [PAVER],
    note: "No UVs: the texture is projected along X, Y and Z in world space and the three samples are blended by the normal. Seamless on any shape, which is why terrain and rocks use it. Toggle the weights to see which projection wins where.",
    frag: `uniform float uScale;   // @slider 0.2 4.0 1.3
uniform float uSharp;   // @slider 1.0 16.0 4.0
uniform float uWeights; // @toggle 0

void main() {
    vec3 N = normalize(vNormal);
    vec3 w = pow(abs(N), vec3(uSharp));
    w /= w.x + w.y + w.z;                                   // weights sum to 1

    vec3 p  = vWorld * uScale;
    vec3 cx = texture(uTex0, p.zy).rgb;                     // seen from ±X
    vec3 cy = texture(uTex0, p.xz).rgb;                     // seen from ±Y
    vec3 cz = texture(uTex0, p.xy).rgb;                     // seen from ±Z
    vec3 albedo = cx * w.x + cy * w.y + cz * w.z;
    if (uWeights > 0.5) albedo = w;

    float diff = max(dot(N, uLightDir), 0.0);
    FragColor = vec4(pow(albedo * (0.15 + 0.85 * diff), vec3(1.0 / 2.2)) * 1.3, 1.0);
}`,
  },
  {
    id: "normalmap", label: "normal + roughness maps",
    mode: "mesh", mesh: "sphere", channels: [PAVER, PAVER_N, PAVER_R],
    note: "Albedo (uTex0), tangent-space normal map (uTex1) and roughness (uTex2) from a real material set. The TBN matrix turns the map's normals into world space. Set strength to 0 to see how flat the geometry really is.",
    frag: `uniform float uStrength;  // @slider 0.0 2.0 1.0
uniform float uTiling;    // @slider 1.0 8.0 3.0

void main() {
    vec2 uv = vUV * vec2(2.0, 1.0) * uTiling;
    vec3 N = normalize(vNormal);
    vec3 T = normalize(vTangent - N * dot(vTangent, N));      // Gram-Schmidt
    vec3 B = cross(N, T);

    vec3 tn = texture(uTex1, uv).xyz * 2.0 - 1.0;             // [0,1] → [-1,1]
    tn.xy *= uStrength;
    vec3 n = normalize(mat3(T, B, N) * tn);

    float rough  = texture(uTex2, uv).r;
    vec3  albedo = pow(texture(uTex0, uv).rgb, vec3(2.2));    // sRGB → linear
    vec3  V = normalize(uCamPos - vWorld), H = normalize(uLightDir + V);
    float diff = max(dot(n, uLightDir), 0.0);
    float spec = pow(max(dot(n, H), 0.0), mix(256.0, 8.0, rough)) * (1.0 - rough) * 1.5;

    vec3 col = albedo * (0.06 + diff) + spec;
    FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`,
  },
];

// ── Water ─────────────────────────────────────────────────────────────────────
export const WATER_PRESETS: PlaygroundPreset[] = [
  {
    id: "ripples", label: "raindrops on a pool",
    channels: [POOL],
    note: "Each drop is a travelling wave packet: a ring whose radius grows with age and whose height fades. The heights are summed, the gradient gives the surface normal, and the normal bends the view of the tiles below (refraction) and adds a highlight.",
    frag: `uniform float uDrops;     // @slider 1 12 7
uniform float uStrength;  // @slider 0.0 0.05 0.018
uniform float uSpeed;     // @slider 0.1 1.0 0.35

float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }

// A ring-shaped wave packet: centred on the front, decaying with age
float ripple(vec2 p, vec2 c, float age) {
    float x = length(p - c) - age * uSpeed;              // distance behind the front
    return sin(x * 55.0) * exp(-x * x * 90.0) * exp(-age * 1.3);
}

float height(vec2 p) {
    float h = 0.0;
    const float PERIOD = 2.5;
    for (int i = 0; i < 12; i++) {
        if (float(i) >= uDrops) break;
        float fi = float(i);
        float t = uTime + hash11(fi * 7.13) * PERIOD;     // each drop has its own clock
        float cycle = floor(t / PERIOD), age = mod(t, PERIOD);
        vec2 c = vec2(hash11(fi * 3.1 + cycle * 1.7), hash11(fi * 5.7 + cycle * 2.3)) * 2.0 - 1.0;
        c.x *= uResolution.x / uResolution.y;
        h += ripple(p, c, age);
    }
    return h;
}

void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    float e = 2.0 / uResolution.y;
    float h  = height(p);
    vec2 grad = vec2(height(p + vec2(e, 0.0)) - h, height(p + vec2(0.0, e)) - h) / e;
    vec3 n = normalize(vec3(-grad * uStrength, 1.0));

    vec2 uv = p * 0.6 + n.xy * 0.12;                      // refraction: look through a tilted surface
    vec3 col = texture(uTex0, uv).rgb * (0.9 + 0.35 * h);  // crests focus light (fake caustics)
    vec3 L = normalize(vec3(0.4, 0.6, 1.0));
    float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 80.0);
    FragColor = vec4(col + spec * 0.8, 1.0);
}`,
  },
  {
    id: "ocean", label: "Gerstner ocean (vertex shader)",
    mode: "mesh", mesh: "plane",
    note: "Four Gerstner waves displace the grid in the vertex shader (see the 'vertex' tab), which also builds the exact normal from the analytic tangents. The fragment shader mixes a sky reflection and the water body with Schlick's Fresnel (R₀ ≈ 0.02 for water). Toggle Gerstner off to get plain sines.",
    vert: `uniform float uSteep;     // @slider 0.0 1.2 0.75
uniform float uAmp;       // @slider 0.0 0.1 0.04
uniform float uGerstner;  // @toggle 1

void main() {
    vec2  dirs[4] = vec2[4](normalize(vec2(1.0, 0.3)), normalize(vec2(0.6, 1.0)),
                            normalize(vec2(-0.4, 0.9)), normalize(vec2(0.9, -0.5)));
    float wls[4]  = float[4](0.9, 0.55, 0.37, 0.23);        // wavelengths

    vec3 disp = vec3(0.0);
    vec3 T = vec3(1.0, 0.0, 0.0), B = vec3(0.0, 0.0, 1.0);  // ∂P/∂x, ∂P/∂z
    for (int i = 0; i < 4; i++) {
        vec2  D = dirs[i];
        float k = 6.28318 / wls[i];
        float A = uAmp * wls[i] / wls[0];                   // shorter waves are lower
        float w = sqrt(9.81 * k) * 0.35;                    // deep-water dispersion, slowed down
        float Q = uGerstner * uSteep / (k * A * 4.0 + 1e-5);// steepness, shared by 4 waves
        float th = k * dot(D, aPos.xz) - w * uTime;
        float s = sin(th), c = cos(th);
        disp += vec3(Q * A * D.x * c, A * s, Q * A * D.y * c);
        T += vec3(-Q * A * k * D.x * D.x * s, A * k * D.x * c, -Q * A * k * D.x * D.y * s);
        B += vec3(-Q * A * k * D.x * D.y * s, A * k * D.y * c, -Q * A * k * D.y * D.y * s);
    }
    vec3 p = (aPos + disp) * 1.6;

    vec4 world = uModel * vec4(p, 1.0);
    vWorld   = world.xyz;
    vNormal  = normalize(cross(B, T));
    vUV      = aUV;
    vTangent = normalize(T);
    gl_Position = uProjection * uView * world;
}`,
    frag: `uniform vec3 uDeep;     // @color 0.01 0.1 0.18
uniform vec3 uShallow;  // @color 0.06 0.38 0.45

vec3 sky(vec3 d) {
    vec3 col = mix(vec3(0.75, 0.82, 0.9), vec3(0.2, 0.4, 0.75), clamp(d.y * 1.5, 0.0, 1.0));
    return col + vec3(6.0, 5.0, 4.0) * pow(max(dot(d, uLightDir), 0.0), 600.0);   // the sun
}

void main() {
    vec3 N = normalize(vNormal);
    if (!gl_FrontFacing) N = -N;
    vec3 V = normalize(uCamPos - vWorld);
    float F = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);  // Schlick, water
    vec3 refl = sky(reflect(-V, N));
    vec3 body = mix(uDeep, uShallow, clamp(vWorld.y * 5.0 + 0.4, 0.0, 1.0));  // crests look lighter
    vec3 col = mix(body, refl, F);
    col += vec3(0.8) * smoothstep(0.07, 0.11, vWorld.y);                    // foam on the highest crests
    FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`,
  },
];

// ── Glass & Fresnel ───────────────────────────────────────────────────────────
export const GLASS_PRESETS: PlaygroundPreset[] = [
  {
    id: "glass", label: "glass ball: refraction + dispersion",
    channels: [POOL],
    note: "A glass sphere in front of a textured wall. Each ray refracts twice (air → glass, glass → air) with refract(); red, green and blue use slightly different indices, which splits the colours (dispersion). Fresnel blends in the reflection at the rim.",
    frag: `uniform float uIOR;         // @slider 1.0 2.4 1.5
uniform float uDispersion;  // @slider 0.0 0.1 0.03
uniform float uFresnel;     // @toggle 1
uniform vec3  uTint;        // @color 0.9 0.97 1.0

vec3 wall(vec3 ro, vec3 rd) {                         // the backdrop: plane z = -2.5
    float t = (-2.5 - ro.z) / rd.z;
    vec2 uv = (ro + rd * t).xy * 0.22 + vec2(uTime * 0.02, 0.0);
    return texture(uTex0, uv).rgb;
}
vec3 env(vec3 d) {                                    // what the reflection shows
    vec3 c = mix(vec3(0.08, 0.09, 0.12), vec3(0.8, 0.85, 0.95), smoothstep(-0.2, 0.9, d.y));
    return c + 4.0 * pow(max(dot(d, normalize(vec3(0.6, 0.7, 0.5))), 0.0), 120.0);
}
vec2 sphere(vec3 ro, vec3 rd, float r) {             // entry and exit distances
    float b = dot(ro, rd), c = dot(ro, ro) - r * r, h = b * b - c;
    if (h < 0.0) return vec2(-1.0);
    h = sqrt(h);
    return vec2(-b - h, -b + h);
}
vec3 through(vec3 ro, vec3 rd, float ior) {
    vec3 p  = ro + rd * sphere(ro, rd, 1.0).x;
    vec3 r1 = refract(rd, normalize(p), 1.0 / ior);    // entering: eta = n_air / n_glass
    vec3 q  = p + r1 * sphere(p, r1, 1.0).y;           // exit point
    vec3 n2 = -normalize(q);                           // normal facing the ray, inside
    vec3 r2 = refract(r1, n2, ior);                    // leaving: eta = n_glass / n_air
    if (dot(r2, r2) < 1e-4) return env(reflect(r1, n2)) * 0.5;   // total internal reflection
    return wall(q, r2);
}

void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    vec3 ro = vec3(0.0, 0.0, 3.5), rd = normalize(vec3(p, -2.2));
    vec3 col = wall(ro, rd);
    float t = sphere(ro, rd, 1.0).x;
    if (t > 0.0) {
        vec3 n = normalize(ro + rd * t);
        vec3 refr = vec3(through(ro, rd, uIOR - uDispersion).r,
                         through(ro, rd, uIOR).g,
                         through(ro, rd, uIOR + uDispersion).b) * uTint;
        float r0 = pow((uIOR - 1.0) / (uIOR + 1.0), 2.0);
        float F  = r0 + (1.0 - r0) * pow(1.0 - max(dot(-rd, n), 0.0), 5.0);
        col = mix(refr, env(reflect(rd, n)), uFresnel * F);
    }
    FragColor = vec4(col, 1.0);
}`,
  },
  {
    id: "rim", label: "Fresnel on a mesh",
    mode: "mesh", mesh: "torus",
    note: "Schlick's term alone, painted on a mesh: dark where the surface faces you, bright at grazing angles. Raise uPower to thin the rim. The same number drives reflections, rim lights and force-field shields.",
    frag: `uniform float uR0;     // @slider 0.0 1.0 0.04
uniform float uPower;  // @slider 1.0 10.0 5.0
uniform float uShowF;  // @toggle 0

vec3 env(vec3 d) {
    vec3 c = mix(vec3(0.1, 0.1, 0.12), vec3(0.75, 0.8, 0.9), smoothstep(-0.3, 0.8, d.y));
    return c + 3.0 * pow(max(dot(d, uLightDir), 0.0), 200.0);
}

void main() {
    vec3 N = normalize(vNormal), V = normalize(uCamPos - vWorld);
    float F = uR0 + (1.0 - uR0) * pow(1.0 - max(dot(N, V), 0.0), uPower);
    vec3 base = vec3(0.05, 0.06, 0.08) * (0.3 + max(dot(N, uLightDir), 0.0));
    vec3 col = mix(base, env(reflect(-V, N)), F);
    if (uShowF > 0.5) col = vec3(F);
    FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`,
  },
];

// ── Fog ───────────────────────────────────────────────────────────────────────
export const FOG_PRESETS: PlaygroundPreset[] = [
  {
    id: "fog", label: "four kinds of fog",
    note: "A raymarched field of pillars. uFog: 0 none, 1 linear, 2 exponential, 3 exp², 4 height fog (analytic integral). The fog colour picks up the sun when looking toward it, a cheap trick that reads as light scattering.",
    frag: `uniform int   uFog;      // @slider 0 4 4
uniform float uDensity;  // @slider 0.0 0.12 0.04
uniform float uFalloff;  // @slider 0.05 1.5 0.35
uniform vec3  uFogColor; // @color 0.62 0.68 0.76

float sdBox(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
float hash21(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

// Pillars repeat every 4 units, each cell with its own height. With a
// different shape per cell, the nearest surface may be in a NEIGHBOURING
// cell, so the 3×3 cells around p are all checked. Checking only p's own
// cell lets the ray jump into a taller neighbour and cut its top off.
float pillars(vec3 p) {
    vec2 cell = floor(p.xz / 4.0);
    float d = 1e9;
    for (int j = -1; j <= 1; j++)
    for (int i = -1; i <= 1; i++) {
        vec2 c = cell + vec2(i, j);
        float h = 0.5 + 3.5 * hash21(c);
        vec3 q = p - vec3(c.x * 4.0 + 2.0, h, c.y * 4.0 + 2.0);   // centre of that cell's pillar
        d = min(d, sdBox(q, vec3(0.45, h, 0.45)));
    }
    return d;
}
float map(vec3 p) { return min(p.y, pillars(p)); }
vec3 normal(vec3 p) {
    const vec2 e = vec2(1e-3, 0.0);
    return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
}

void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    vec3 ro = vec3(0.0, 1.6, uTime * 2.0);                   // x = 0: between two rows of pillars
    vec3 rd = normalize(vec3(p.x, p.y - 0.15, 1.6));
    vec3 sun = normalize(vec3(0.3, 0.35, 1.0));

    float t = 0.0;
    for (int i = 0; i < 160; i++) {
        float h = map(ro + rd * t);
        if (h < 0.001 * t || t > 150.0) break;
        t += h;
    }
    vec3 col = mix(vec3(0.75, 0.8, 0.88), vec3(0.3, 0.45, 0.7), clamp(rd.y * 2.0, 0.0, 1.0));
    if (t < 150.0) {
        vec3 pos = ro + rd * t, n = normal(pos);
        bool floorHit = pos.y < pillars(pos);                 // which surface is closer
        vec3 albedo = floorHit ? vec3(0.3 + 0.1 * mod(floor(pos.x) + floor(pos.z), 2.0)) : vec3(0.75, 0.6, 0.45);
        col = albedo * (0.25 + 0.9 * max(dot(n, sun), 0.0));
    } else t = 400.0;

    vec3 fogCol = mix(uFogColor, vec3(1.0, 0.85, 0.6), pow(max(dot(rd, sun), 0.0), 8.0));
    float vis = 1.0;
    if      (uFog == 1) vis = clamp((60.0 - t) / (60.0 - 5.0), 0.0, 1.0);
    else if (uFog == 2) vis = exp(-uDensity * t);
    else if (uFog == 3) vis = exp(-pow(uDensity * t, 2.0));
    else if (uFog == 4) {
        // density a·e^(-b·y) integrated from the camera along the ray
        float a = uDensity * 3.0, b = uFalloff;
        // near-horizontal rays: the limit of the formula, a·e^(-b·y0)·t (avoids 0/0)
        float amount = abs(rd.y) < 1e-4 ? a * exp(-b * ro.y) * t
                     : (a / b) * exp(-b * ro.y) * (1.0 - exp(-b * rd.y * t)) / rd.y;
        vis = exp(-amount);
    }
    col = mix(fogCol, col, vis);
    FragColor = vec4(pow(col, vec3(0.9)), 1.0);
}`,
  },
];

// ── Stylised: toon, dissolve, hologram ────────────────────────────────────────
const NOISE3 = `float hash31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float noise3(vec3 p) {                                     // value noise in 3D
    vec3 i = floor(p), f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash31(i),                   hash31(i + vec3(1, 0, 0)), u.x),
                   mix(hash31(i + vec3(0, 1, 0)),   hash31(i + vec3(1, 1, 0)), u.x), u.y),
               mix(mix(hash31(i + vec3(0, 0, 1)),   hash31(i + vec3(1, 0, 1)), u.x),
                   mix(hash31(i + vec3(0, 1, 1)),   hash31(i + vec3(1, 1, 1)), u.x), u.y), u.z);
}
float fbm3(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * noise3(p); p *= 2.03; a *= 0.5; } return s; }`;

export const STYLE_PRESETS: PlaygroundPreset[] = [
  {
    id: "toon", label: "toon shading",
    mode: "mesh", mesh: "torus",
    note: "Diffuse light quantised into bands, a hard specular spot, a rim light, and an outline where the surface turns away from the camera (N·V near 0). Every edge is anti-aliased with fwidth, so bands stay clean at any zoom.",
    frag: `uniform int   uBands;    // @slider 1 6 3
uniform vec3  uBase;     // @color 0.95 0.45 0.3
uniform float uSpec;     // @slider 0.0 1.0 0.4
uniform float uRim;      // @slider 0.0 1.0 0.5
uniform float uOutline;  // @slider 0.0 0.5 0.22

void main() {
    vec3 N = normalize(vNormal), V = normalize(uCamPos - vWorld), H = normalize(uLightDir + V);
    float ndl = max(dot(N, uLightDir), 0.0);

    float x = ndl * float(uBands);                         // diffuse in steps
    float w = fwidth(x);
    float toon = (floor(x) + smoothstep(1.0 - w, 1.0, fract(x))) / float(uBands);

    float ndh = dot(N, H);
    float spec = smoothstep(1.0 - uSpec * 0.05 - fwidth(ndh), 1.0 - uSpec * 0.05, ndh) * step(0.001, uSpec);
    float ndv = dot(N, V);
    float rim = smoothstep(1.0 - uRim, 1.0 - uRim + fwidth(ndv) * 2.0, 1.0 - ndv) * ndl;
    float edge = 1.0 - smoothstep(uOutline - fwidth(ndv), uOutline + fwidth(ndv), ndv);

    vec3 col = uBase * (0.3 + 0.7 * toon) + spec * 0.9 + rim * 0.45;
    col = mix(col, vec3(0.05, 0.03, 0.05), edge);
    FragColor = vec4(col, 1.0);
}`,
  },
  {
    id: "dissolve", label: "dissolve with burning edge",
    mode: "mesh", mesh: "sphere",
    note: "3D noise sampled at the world position; every fragment whose noise is below the threshold is discarded. A thin band just above the threshold glows. You can see through the holes into the back faces, darkened.",
    frag: `uniform float uAmount;  // @slider 0.0 1.0 0.45
uniform float uAuto;    // @toggle 1
uniform float uEdge;    // @slider 0.0 0.15 0.05
uniform float uScale;   // @slider 0.5 6.0 2.5
uniform vec3  uGlow;    // @color 1.0 0.45 0.1

${NOISE3}

void main() {
    float n = clamp((fbm3(vWorld * uScale) - 0.22) / 0.52, 0.0, 1.0);   // stretch fBm (~0.22..0.74) to 0..1
    float amount = uAuto > 0.5 ? smoothstep(-0.9, 0.9, sin(uTime * 0.6 - 1.2)) : uAmount;
    if (n < amount) discard;                               // the hole

    vec3 N = normalize(vNormal);
    bool back = !gl_FrontFacing;
    if (back) N = -N;
    float diff = max(dot(N, uLightDir), 0.0);
    vec3 col = vec3(0.75, 0.78, 0.82) * (0.15 + 0.85 * diff) * (back ? 0.35 : 1.0);

    float edge = 1.0 - smoothstep(0.0, uEdge, n - amount); // 1 right at the border
    col = mix(col, uGlow * 3.0, edge);
    FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`,
  },
  {
    id: "hologram", label: "hologram",
    mode: "mesh", mesh: "torus", blend: "additive",
    note: "Additive blending with depth writes off, so front and back faces add up like light. Fresnel makes the silhouette glow, scanlines scroll in world space, a bright band sweeps upward, and the whole thing flickers on a random timer.",
    frag: `uniform vec3  uColor;    // @color 0.2 0.85 1.0
uniform float uLines;    // @slider 20.0 300.0 110.0
uniform float uFlicker;  // @slider 0.0 1.0 0.35

float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }

void main() {
    vec3 N = normalize(vNormal), V = normalize(uCamPos - vWorld);
    float fres = pow(1.0 - abs(dot(N, V)), 2.5);                      // abs: back faces glow too
    float scan = pow(0.5 + 0.5 * sin(vWorld.y * uLines - uTime * 6.0), 6.0);
    float band = smoothstep(0.08, 0.0, abs(fract(vWorld.y * 0.3 - uTime * 0.25) - 0.5));
    float flick = 1.0 - uFlicker * step(0.85, hash11(floor(uTime * 18.0)));
    float a = (0.06 + 0.9 * fres + 0.25 * scan + 0.5 * band) * flick;
    FragColor = vec4(uColor * a, 1.0);                                // added onto what is behind
}`,
  },
];

// ── Raymarching ───────────────────────────────────────────────────────────────
const RM_LIB = `float sdSphere(vec3 p, float r) { return length(p) - r; }
float sdBox(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
float sdTorus(vec3 p, vec2 t) { vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) { vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - r; }
float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

// Orbit camera: drag to turn, otherwise it circles slowly
mat3 camera(vec3 ro, vec3 ta) {
    vec3 w = normalize(ta - ro), u = normalize(cross(w, vec3(0.0, 1.0, 0.0))), v = cross(u, w);
    return mat3(u, v, w);
}
vec3 orbit(float dist) {
    vec2 m = uMouse.xy / uResolution;
    float yaw   = uMouse.x + uMouse.y > 0.0 ? (m.x - 0.5) * 6.2832 : 0.5 + uTime * 0.15;
    float pitch = uMouse.x + uMouse.y > 0.0 ? clamp(m.y * 1.6 - 0.3, -0.1, 1.3) : 0.4;
    return dist * vec3(cos(pitch) * sin(yaw), sin(pitch), cos(pitch) * cos(yaw));
}
vec3 heat(float x) { return clamp(vec3(1.5 - abs(4.0 * x - 3.0), 1.5 - abs(4.0 * x - 2.0), 1.5 - abs(4.0 * x - 1.0)), 0.0, 1.0); }`;

export const RAYMARCH_PRESETS: PlaygroundPreset[] = [
  {
    id: "basic", label: "sphere tracing, step by step",
    note: "The smallest complete raymarcher: a camera ray per pixel, sphere tracing against map(), a normal from the gradient, diffuse light. Toggle the heat map to colour each pixel by the number of steps. Silhouettes and grazing floor are where the steps pile up.",
    frag: `uniform int   uSteps;  // @slider 8 200 80
uniform float uHeat;   // @toggle 0

${RM_LIB}

float map(vec3 p) {
    float ground = p.y + 1.0;
    float ball   = sdSphere(p - vec3(0.0, 0.2 * sin(uTime * 1.3), 0.0), 0.9);
    return min(ground, ball);
}
vec3 calcNormal(vec3 p) {
    const vec2 e = vec2(1e-3, 0.0);                          // central differences of the SDF
    return normalize(vec3(map(p + e.xyy) - map(p - e.xyy),
                          map(p + e.yxy) - map(p - e.yxy),
                          map(p + e.yyx) - map(p - e.yyx)));
}

void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    vec3 ro = orbit(4.0);
    vec3 rd = camera(ro, vec3(0.0)) * normalize(vec3(p, 1.8));

    float t = 0.0;
    int steps = 0;
    bool hit = false;
    for (int i = 0; i < 200; i++) {
        if (i >= uSteps) break;
        float h = map(ro + rd * t);          // safe distance
        steps = i + 1;
        if (h < 0.001 * t) { hit = true; break; }
        t += h;                              // jump exactly that far
        if (t > 40.0) break;
    }

    vec3 col = vec3(0.6, 0.7, 0.85) - rd.y * 0.3;
    if (hit) {
        vec3 pos = ro + rd * t, n = calcNormal(pos);
        vec3 L = normalize(vec3(0.6, 0.8, 0.4));
        bool floorHit = pos.y + 1.0 <= map(pos) + 1e-4;        // which SDF won the min()?
        vec3 albedo = floorHit ? vec3(0.4 + 0.2 * mod(floor(pos.x) + floor(pos.z), 2.0)) : vec3(0.9, 0.4, 0.25);
        col = albedo * (0.15 + 0.85 * max(dot(n, L), 0.0));
    }
    if (uHeat > 0.5) col = heat(float(steps) / float(uSteps));
    FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`,
  },
  {
    id: "scene", label: "shapes, smooth union, shadows, AO",
    note: "Several SDF primitives blended with smin, lit with soft shadows (a second march toward the light that records how close it passes to geometry) and ambient occlusion (a few samples along the normal). Drag to orbit.",
    frag: `uniform float uK;        // @slider 0.0 0.8 0.3
uniform float uShadowK;  // @slider 2.0 64.0 12.0
uniform float uAO;       // @toggle 1

${RM_LIB}

float map(vec3 p) {
    float ground = p.y + 1.0;
    float s   = sdSphere(p - vec3(0.9 * sin(uTime * 0.8), 0.0, 0.0), 0.55);
    float b   = sdBox(p - vec3(-0.5, -0.4, 0.3), vec3(0.4));
    float tor = sdTorus(p - vec3(0.8, -0.3, -0.7), vec2(0.45, 0.14));
    float cap = sdCapsule(p, vec3(-1.2, -1.0, -0.8), vec3(-0.9, 0.3, -0.9), 0.18);
    float k = max(uK, 1e-3);
    return min(ground, smin(smin(smin(s, b, k), tor, k), cap, k));
}
vec3 calcNormal(vec3 p) {
    const vec2 e = vec2(1e-3, 0.0);
    return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
}
// Soft shadow: how close does the shadow ray pass to anything, relative to how far it went?
float softShadow(vec3 ro, vec3 rd, float k) {
    float res = 1.0, t = 0.02;
    for (int i = 0; i < 64; i++) {
        float h = map(ro + rd * t);
        res = min(res, k * h / t);
        t += clamp(h, 0.02, 0.25);
        if (res < 0.001 || t > 8.0) break;
    }
    return clamp(res, 0.0, 1.0);
}
// Ambient occlusion: compare the SDF with the distance travelled along the normal
float ambientOcclusion(vec3 p, vec3 n) {
    float occ = 0.0, w = 1.0;
    for (int i = 0; i < 5; i++) {
        float h = 0.02 + 0.12 * float(i);
        occ += (h - map(p + n * h)) * w;
        w *= 0.85;
    }
    return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
}

void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    vec3 ro = orbit(4.5);
    vec3 rd = camera(ro, vec3(0.0, -0.3, 0.0)) * normalize(vec3(p, 1.8));

    float t = 0.0;
    bool hit = false;
    for (int i = 0; i < 160; i++) {
        float h = map(ro + rd * t);
        if (h < 0.0005 * t) { hit = true; break; }
        t += h;
        if (t > 40.0) break;
    }
    vec3 col = vec3(0.62, 0.72, 0.86) - rd.y * 0.35;
    if (hit) {
        vec3 pos = ro + rd * t, n = calcNormal(pos);
        vec3 L = normalize(vec3(0.6, 0.7, 0.3));
        float dif = max(dot(n, L), 0.0) * softShadow(pos + n * 0.002, L, uShadowK);
        float ao  = uAO > 0.5 ? ambientOcclusion(pos, n) : 1.0;
        bool floorHit = pos.y + 1.0 <= map(pos) + 1e-4;
        vec3 albedo = floorHit ? vec3(0.35 + 0.15 * mod(floor(pos.x * 2.0) + floor(pos.z * 2.0), 2.0)) : vec3(0.85, 0.5, 0.3);
        col = albedo * (vec3(1.0, 0.92, 0.8) * dif * 1.2 + vec3(0.18, 0.22, 0.3) * ao);
        col = mix(col, vec3(0.62, 0.72, 0.86), 1.0 - exp(-0.004 * t * t));
    }
    FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`,
  },
  {
    id: "repeat", label: "infinite repetition",
    note: "One sphere-box shape, repeated forever with mod() on the position before evaluating it. The cost of an infinite field is the cost of one object, the same trick as tiling in 2D. Fog hides where the march gives up.",
    frag: `uniform float uSpacing;  // @slider 1.5 6.0 3.0
uniform float uMorph;    // @slider 0.0 1.0 0.5

${RM_LIB}

float map(vec3 p) {
    vec3 q = p;
    q = mod(q + 0.5 * uSpacing, uSpacing) - 0.5 * uSpacing;   // every cell holds the same copy
    float s = sdSphere(q, 0.6);
    float b = sdBox(q, vec3(0.45)) - 0.05;
    return mix(s, b, uMorph * (0.5 + 0.5 * sin(uTime + p.z * 0.3)));
}
vec3 calcNormal(vec3 p) {
    const vec2 e = vec2(1e-3, 0.0);
    return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
}

void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    vec3 ro = vec3(0.5 * uSpacing, 0.5 * uSpacing, uTime * 2.0);
    float a = uTime * 0.1;
    vec3 rd = normalize(vec3(p.x * cos(a) - 1.6 * sin(a) * 0.3, p.y, 1.6));
    float t = 0.0;
    for (int i = 0; i < 120; i++) {
        float h = map(ro + rd * t);
        if (h < 0.001 * t || t > 60.0) break;
        t += h;
    }
    vec3 pos = ro + rd * t, n = calcNormal(pos);
    vec3 col = 0.5 + 0.5 * cos(vec3(0.0, 2.0, 4.0) + floor(pos.z / uSpacing) * 0.7);
    col *= 0.25 + 0.75 * max(dot(n, normalize(vec3(0.5, 0.8, -0.3))), 0.0);
    col = mix(col, vec3(0.05, 0.06, 0.09), 1.0 - exp(-0.0015 * t * t));
    FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`,
  },
];

