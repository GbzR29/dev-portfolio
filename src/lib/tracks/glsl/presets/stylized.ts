// src/lib/tracks/glsl/presets/stylized.ts
import type { PlaygroundPreset } from "@/components/lesson/glsl/ShaderPlayground";
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
