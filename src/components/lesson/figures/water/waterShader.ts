// ── The Water Lab shaders (Gerstner waves) ────────────────────────────────────
// The water is a mesh: a ring grid of rest positions x₀ around the camera
// (waterGrid.ts), moved by the Gerstner waves in the vertex shader. Each
// fragment receives its x₀, so the exact normal and Jacobian come straight
// from the analytic derivatives — no ray march, and no search for the
// particle that ends up under a pixel. A full-screen pass drawn first paints
// the sky and the dry beach and writes their depth, so the beach hides the
// water behind it. Shading lives in waterCommon.ts.

import { PROC_SKY_GLSL, type SkyParams } from "../sky/proceduralSky";
import { norm, cross, mat4, type Vec3 } from "../../kit/gl/gl";
import { WATER_COMMON_GLSL, commonUniforms, type UniformSet } from "./waterCommon";
import { MAX_WAVES, type WaterParams } from "./waterParams";

/**
 * The wave set: the longest wave first, each next one 0.62× as long, at
 * pseudo-random angles around the wind. Amplitude ∝ wavelength keeps every
 * wave equally steep. Returns uniform arrays (dir.x, dir.z, k, A) and (ω, phase, Q, 0).
 */
export function waveSet(p: WaterParams) {
  const n = Math.max(1, Math.min(MAX_WAVES, Math.round(p.waves)));
  const a = new Float32Array(MAX_WAVES * 4), b = new Float32Array(MAX_WAVES * 4);
  let hmax = 0;
  for (let i = 0; i < n; i++) {
    const r1 = fract(Math.sin((i + 1) * 12.9898) * 43758.5453), r2 = fract(Math.sin((i + 1) * 78.233) * 43758.5453);
    const lambda = p.wavelength * Math.pow(0.62, i);
    const k = (2 * Math.PI) / lambda;
    const A = p.amp * lambda / p.wavelength;
    const ang = (p.windDir * Math.PI) / 180 + (r1 * 2 - 1) * p.spread * 1.3;
    const w = Math.sqrt(9.81 * k);
    const Q = p.chop / (k * A * n);
    a.set([Math.cos(ang), Math.sin(ang), k, A], i * 4);
    b.set([w, r2 * Math.PI * 2, Q, 0], i * 4);
    hmax += A;
  }
  return { a, b, n, hmax };
}
const fract = (x: number) => x - Math.floor(x);

/** Height of the Gerstner surface above (x, z), as the shader's heightAt computes it. */
export function gerstnerHeight(w: ReturnType<typeof waveSet>, t: number, x: number, z: number) {
  const { a, b, n } = w;
  let x0 = x, z0 = z;
  for (let j = 0; j < 3; j++) {
    let dx = 0, dz = 0;
    for (let i = 0; i < n; i++) {
      const c = Math.cos(a[i * 4 + 2] * (a[i * 4] * x0 + a[i * 4 + 1] * z0) - b[i * 4] * t + b[i * 4 + 1]) * b[i * 4 + 2] * a[i * 4 + 3];
      dx += a[i * 4] * c; dz += a[i * 4 + 1] * c;
    }
    x0 = x - dx; z0 = z - dz;
  }
  let h = 0;
  for (let i = 0; i < n; i++) h += a[i * 4 + 3] * Math.sin(a[i * 4 + 2] * (a[i * 4] * x0 + a[i * 4 + 1] * z0) - b[i * 4] * t + b[i * 4 + 1]);
  return h;
}

/** Camera basis for a first-person look at (yaw, pitch). */
export function cameraBasis(yaw: number, pitch: number): { f: Vec3; r: Vec3; u: Vec3 } {
  const f = norm([Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)]);
  const r = norm(cross(f, [0, 1, 0]));
  return { f, r, u: cross(r, f) };
}

// ── Gerstner surface (GLSL, shared by the vertex and fragment shaders) ────────
// `res` is the smallest detail the caller can show, in metres (the grid
// spacing in the vertex shader, the pixel footprint in the fragment shader).
// Waves shorter than a few res fade out instead of aliasing into noise.
// The including shader declares uWaveTime.
const GERSTNER_GLSL = `
uniform vec4  uWA[${MAX_WAVES}];   // dir.x, dir.z, k, A
uniform vec4  uWB[${MAX_WAVES}];   // omega, phase, Q, 0
uniform int   uN;

float waveWeight(float k, float res) { return smoothstep(3.0 * res, 6.0 * res, 6.2831853 / k); }
float phaseOf(int i, vec2 x0) { return uWA[i].z * dot(uWA[i].xy, x0) - uWB[i].x * uWaveTime + uWB[i].y; }

// Where the particle resting at x0 is now
vec3 gerstner(vec2 x0, float res) {
  vec3 P = vec3(x0.x, 0.0, x0.y);
  for (int i = 0; i < ${MAX_WAVES}; i++) {
    if (i >= uN) break;
    vec4 a = uWA[i];
    float A = a.w * waveWeight(a.z, res), th = phaseOf(i, x0);
    P.xz += uWB[i].z * A * a.xy * cos(th);
    P.y += A * sin(th);
  }
  return P;
}

// Normal and Jacobian at a rest position, from the analytic derivatives
void gerstnerFrame(vec2 x0, float res, out vec3 N, out float J) {
  vec3 T = vec3(1.0, 0.0, 0.0), B = vec3(0.0, 0.0, 1.0);
  float jxx = 1.0, jzz = 1.0, jxz = 0.0;
  for (int i = 0; i < ${MAX_WAVES}; i++) {
    if (i >= uN) break;
    vec4 a = uWA[i];
    float th = phaseOf(i, x0), s = sin(th), c = cos(th);
    float ak = a.w * a.z * waveWeight(a.z, res), qak = uWB[i].z * ak;
    T += vec3(-qak * a.x * a.x * s, ak * a.x * c, -qak * a.x * a.y * s);
    B += vec3(-qak * a.x * a.y * s, ak * a.y * c, -qak * a.y * a.y * s);
    jxx -= qak * a.x * a.x * s;
    jzz -= qak * a.y * a.y * s;
    jxz -= qak * a.x * a.y * s;
  }
  N = normalize(cross(B, T));
  J = jxx * jzz - jxz * jxz;
}

// The surface height above a world point x: first find the particle that
// ends up there (x0 + D(x0) = x, by fixed-point iteration), then its height
vec2 displaceXZ(vec2 x0) {
  vec2 d = vec2(0.0);
  for (int i = 0; i < ${MAX_WAVES}; i++) {
    if (i >= uN) break;
    d += uWB[i].z * uWA[i].w * uWA[i].xy * cos(phaseOf(i, x0));
  }
  return d;
}
float heightAt(vec2 x) {
  vec2 x0 = x;
  for (int j = 0; j < 3; j++) x0 = x - displaceXZ(x0);
  float h = 0.0;
  for (int i = 0; i < ${MAX_WAVES}; i++) {
    if (i >= uN) break;
    h += uWA[i].w * sin(phaseOf(i, x0));
  }
  return h;
}

// Height-only (sine) Hessian of the same waves: used for caustics
mat2 hessian(vec2 x) {
  mat2 H = mat2(0.0);
  for (int i = 0; i < ${MAX_WAVES}; i++) {
    if (i >= uN) break;
    vec4 a = uWA[i];
    H -= a.w * a.z * a.z * sin(phaseOf(i, x)) * outerProduct(a.xy, a.xy);
  }
  return H;
}
`;

// Caustics: sunlight through a surface point lands on the bed shifted by
// d·(1 − η)·∇h, so an area element is scaled by det(I + d·(1 − η)·H).
// Intensity is the inverse of that area change.
const GERSTNER_SOURCE_GLSL = `
${GERSTNER_GLSL}
float waterHeight(vec2 x) { return heightAt(x); }
float causticAt(vec2 x, float d) {
  mat2 M = mat2(1.0) + d * (1.0 - ETA) * hessian(x);
  return 1.0 / max(abs(determinant(M)), 0.12);
}
`;

// ── The water mesh ────────────────────────────────────────────────────────────
export const WATER_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aX0;
uniform mat4  uViewProj;
uniform float uGridK, uGridA;      // vertex spacing at distance r: max(uGridK·r, uGridA·r²)
uniform float uWaveTime;
${GERSTNER_GLSL}
out vec2 vX0;
out vec3 vP;
void main() {
  // The camera stays at x = z = 0, so the grid is already centred on it
  float r = length(aX0);
  float spacing = max(max(r * uGridK, r * r * uGridA), 0.01);
  vec3 P = gerstner(aX0, spacing);
  vX0 = aX0;
  vP = P;
  gl_Position = uViewProj * vec4(P, 1.0);
}`;

export const WATER_FS = `#version 300 es
precision highp float;
precision highp int;               // uN is shared with the vertex shader, whose ints are highp
in vec2 vX0;
in vec3 vP;
out vec4 FragColor;
${PROC_SKY_GLSL}
${WATER_COMMON_GLSL}
${GERSTNER_SOURCE_GLSL}
void main() {
  vec3 rd = normalize(vP - uCamPos);
  // Waves shorter than a couple of pixels would only shimmer: fade them
  float res = 0.5 * length(fwidth(vX0));
  vec3 N; float J;
  gerstnerFrame(vX0, res, N, J);
  // Ripples fade with distance, before they turn into shimmering noise
  vec2 rs = rippleSlope(vP.xz) * uDetail * exp(-length(vP - uCamPos) / 45.0);
  N = normalize(N + vec3(-rs.x, 0.0, -rs.y));
  float crest = clamp(vP.y / max(uHmax, 1e-3) * 0.5 + 0.5, 0.0, 1.0);
  // Foam where the surface folds (J small or negative), broken up by noise
  float foamCover = smoothstep(uFoamEdge, uFoamEdge - 0.5, J) * uFoamAmt;
  float breakup = smoothstep(0.35, 0.75, fbm2(vP.xz * 2.2 + uWaveTime * 0.15) + 0.25 * fbm2(vP.xz * 9.0));
  float foam = clamp(foamCover * breakup * 1.6, 0.0, 1.0);
  FragColor = vec4(shadeWater(vP, N, J, crest, foam, 0.0, rd), 1.0);
}`;

// ── Sky and dry beach, with their depth ───────────────────────────────────────
export const BACKGROUND_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;
uniform vec3  uCamF, uCamR, uCamU;
uniform float uTanHalf, uAspect;
uniform float uDepthA, uDepthB;    // projection terms: ndc z = (A·z + B) / −z for view-space z
${PROC_SKY_GLSL}
${WATER_COMMON_GLSL}
${GERSTNER_SOURCE_GLSL}
void main() {
  vec2 ndc = vUV * 2.0 - 1.0;
  vec3 rd = normalize(uCamF + uCamR * ndc.x * uTanHalf * uAspect + uCamU * ndc.y * uTanHalf);
  float tBed = traceBed(uCamPos, rd);
  if (tBed < 0.0) { FragColor = vec4(display(sky(rd)), 1.0); gl_FragDepth = 1.0; return; }
  float z = tBed * dot(rd, uCamF);                       // distance in front of the camera
  gl_FragDepth = 0.5 * (uDepthA * -z + uDepthB) / z + 0.5;
  FragColor = vec4(shadeBeach(rd, tBed), 1.0);
}`;

// ── Per-frame uniforms ────────────────────────────────────────────────────────
export const NEAR = 0.05, FAR = 2e5;

/** Every uniform the lab's two passes read. */
export function waterUniforms(p: WaterParams, sky: SkyParams, look: { yaw: number; pitch: number; fov: number },
  aspect: number, time: number, grid: { spacingK: number; spacingA: number }): UniformSet {
  const w = waveSet(p);
  const { f, r, u } = cameraBasis(look.yaw, look.pitch);
  const t = time * p.speed;
  // The camera floats: it never sinks below the wave passing under it
  const camY = Math.max(p.camHeight, gerstnerHeight(w, t, 0, 0) + 0.3);
  const eye: Vec3 = [0, camY, 0];
  const proj = mat4.perspective(look.fov, aspect, NEAR, FAR);
  const viewProj = mat4.multiply(proj, mat4.lookAt(eye, [f[0], camY + f[1], f[2]], [0, 1, 0]));
  const c = commonUniforms(p, sky, eye, time, w.hmax * (1 + p.chop * 0.2) + 0.01);
  return {
    f1: { ...c.f1, uTanHalf: Math.tan(look.fov / 2), uAspect: aspect, uGridK: grid.spacingK, uGridA: grid.spacingA, uDepthA: proj[10], uDepthB: proj[14] },
    i1: { ...c.i1, uN: w.n },
    v3: { ...c.v3, uCamF: f, uCamR: r, uCamU: u },
    v4: c.v4,
    arrays: { uWA: w.a, uWB: w.b },
    m4: { uViewProj: viewProj },
  };
}
