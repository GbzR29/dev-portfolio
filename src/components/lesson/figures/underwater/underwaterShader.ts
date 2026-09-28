// ── The Underwater Lab shaders ────────────────────────────────────────────────
// The same Gerstner mesh and bed as the Water Lab, seen from below. Water is a
// participating medium: every metre absorbs some light (σa, per channel) and
// scatters some (σs, grey). A ray from the eye is marched through it, adding
// the sunlight and skylight scattered toward the eye at each step. Sunlight
// under a wavy surface is patterned by the caustics, so the scattered light
// forms shafts. The underside of the surface shows the sky through Snell's
// window and, outside it, the water below by total internal reflection.
// Above the surface the lab switches back to the Water Lab's own shaders.

import { PROC_SKY_GLSL, type SkyParams } from "../sky/proceduralSky";
import { mat4, type Vec3 } from "../../kit/gl/gl";
import { WATER_COMMON_GLSL, commonUniforms, type UniformSet } from "../water/waterCommon";
import { GERSTNER_SOURCE_GLSL, waveSet, gerstnerHeight, cameraBasis, NEAR, FAR } from "../water/waterShader";
import { MAX_WAVES, type WaterParams } from "../water/waterParams";

// ── The medium (GLSL) ─────────────────────────────────────────────────────────
// Needs PROC_SKY_GLSL, WATER_COMMON_GLSL and GERSTNER_SOURCE_GLSL before it.
// The mean surface is the plane y = 0, so a point's depth is −y: the waves
// change it by centimetres to decimetres, which the light cannot tell apart.
const MEDIUM_GLSL = `
uniform float uTurbid;            // σs: scattering per metre, the same for every colour
uniform float uShafts;            // contrast of the caustic pattern in the scattered light
uniform vec4  uUTerms;            // fog, light shafts, caustics, reflection under the surface

const float N_WATER = 1.333;
const float G_WATER = 0.8;        // Henyey–Greenstein asymmetry: water scatters mostly forward

vec3 sigmaT() { return uAbsorb + uTurbid; }   // extinction: what leaves the ray per metre

// The sun's direction of travel inside the water (pointing down)
vec3 sunInWater() {
  vec3 s = normalize(vec3(uSun.x, max(uSun.y, 0.02), uSun.z));
  return refract(-s, vec3(0.0, 1.0, 0.0), ETA);
}
// Sunlight d metres deep, on a surface facing it: what crossed the surface
// (1 − Fresnel), dimmed along the slanted path d / cos θ it took down
vec3 sunAtDepth(float d) {
  vec3 sun = normalize(uSun);
  return matteSun(sun) * (1.0 - fresnel(max(sun.y, 0.0))) * exp(-sigmaT() * d / max(-sunInWater().y, 0.2));
}
// Skylight from above at depth d. Inside the water the whole sky fits in a
// cone of 48.6° around the vertical; averaged over it, the light crosses 1.21×
// the depth.
vec3 skyAtDepth(float d) { return ambientLight(normalize(uSun)) * exp(-sigmaT() * d * 1.21); }

// Exact Fresnel reflectance of unpolarised light; eta = n on the incident side / n on the other
float fresnelExact(float cosi, float eta) {
  float sint2 = eta * eta * (1.0 - cosi * cosi);
  if (sint2 >= 1.0) return 1.0;                        // total internal reflection
  float cost = sqrt(1.0 - sint2);
  float rs = (eta * cosi - cost) / (eta * cosi + cost);
  float rp = (cosi - eta * cost) / (cosi + eta * cost);
  return 0.5 * (rs * rs + rp * rp);
}

// Hessian of the surface height, with waves shorter than a few res faded out
mat2 hessianRes(vec2 x, float res) {
  mat2 H = mat2(0.0);
  for (int i = 0; i < ${MAX_WAVES}; i++) {
    if (i >= uN) break;
    vec4 a = uWA[i];
    H -= a.w * a.z * a.z * waveWeight(a.z, res) * sin(phaseOf(i, x)) * outerProduct(a.xy, a.xy);
  }
  return H;
}
// Relative sunlight at x, d metres deep (1 = flat water). Follow the refracted
// sun ray back up to the surface point it crossed, then apply the Water Lab's
// caustic formula there: the inverse of the area change of a thin beam.
float causticAtDepth(vec3 x, float d, float res) {
  vec3 Ls = sunInWater();
  vec2 xs = x.xz + Ls.xz * (d / Ls.y);                   // Ls.y < 0: back along the ray
  mat2 M = mat2(1.0) + d * (1.0 - ETA) * hessianRes(xs, res);
  return 1.0 / max(abs(determinant(M)), 0.12);
}

// Interleaved gradient noise: a different offset per pixel, in a pattern the eye reads as fine grain
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }

// Light scattered toward the eye along o + t·rd for 0 ≤ t ≤ s, and the
// fraction of what lies behind that survives (trans)
vec3 inscatter(vec3 o, vec3 rd, float s, out vec3 trans) {
  trans = vec3(1.0);
  if (uUTerms.x < 0.5) return vec3(0.0);
  const int STEPS = 32;
  const float MARCH = 60.0;                              // metres marched; the rest is one analytic step
  vec3 st = sigmaT(), Ls = sunInWater();
  float ph = phaseHG(dot(Ls, -rd), G_WATER);
  float sm = min(s, MARCH), dt = sm / float(STEPS);
  float j = ign(gl_FragCoord.xy);
  vec3 stepT = exp(-st * dt), L = vec3(0.0);
  for (int i = 0; i < STEPS; i++) {
    vec3 x = o + rd * ((float(i) + j) * dt);
    float d = max(-x.y, 0.0);
    float c = uUTerms.y > 0.5 ? mix(1.0, causticAtDepth(x, d, dt * 0.35 + d * 0.02), uShafts) : 1.0;
    vec3 S = uTurbid * (sunAtDepth(d) * c * ph + skyAtDepth(d) / (4.0 * PI));
    L += trans * S * (1.0 - stepT) / st;                 // this step's light, integrated exactly
    trans *= stepT;
  }
  if (s > sm) {
    float d = max(-(o.y + rd.y * sm), 0.0);
    vec3 S = uTurbid * (sunAtDepth(d) * ph + skyAtDepth(d) / (4.0 * PI));
    vec3 rest = exp(-st * min(s - sm, 1e4));
    L += trans * S * (1.0 - rest) / st;
    trans *= rest;
  }
  return L;
}

// The bed at q, lit through the water, seen dist metres away
vec3 shadeBedUnder(vec3 q, float dist) {
  float d = max(-q.y, 0.0);
  vec3 nb = bedNormal(q.x);
  float ao;
  vec3 alb = bedSurface(q, dist, nb, ao);
  // Filter the pattern to the pixel's footprint on the bed
  float caus = uUTerms.z > 0.5 ? mix(1.0, causticAtDepth(q, d, dist * uPix * 1.5), uCaustics) : 1.0;
  return alb * (sunAtDepth(d) * max(dot(nb, -sunInWater()), 0.0) * caus * mix(1.0, ao, 0.5) + skyAtDepth(d) * 0.5 * ao) / PI;
}

// The water under a point of the surface, seen along the mirrored ray R. A
// cheap version of inscatter: one analytic step, lit at the depth halfway
// along the first 20 m, and no shafts.
vec3 waterBelow(vec3 p, vec3 R, float dist) {
  float s = traceBed(p, R);
  float len = s > 0.0 ? s : 1e4;
  vec3 tr = vec3(1.0), col = vec3(0.0);
  if (uUTerms.x > 0.5) {
    vec3 st = sigmaT();
    float dm = max(-(p.y + R.y * min(len, 20.0) * 0.5), 0.0);
    vec3 S = uTurbid * (sunAtDepth(dm) * phaseHG(dot(sunInWater(), -R), G_WATER) + skyAtDepth(dm) / (4.0 * PI));
    tr = exp(-st * min(len, 1e4));
    col = (1.0 - tr) * S / st;
  }
  // Neighbouring pixels' mirrored rays fan out with the ripples, so each one
  // stands for a wide patch of bed: filter as if it were four times further
  if (s > 0.0) col += shadeBedUnder(p + R * s, dist + 4.0 * s) * tr;
  return col;
}

// The surface seen from below. N is the upward normal, rd the view ray (going up).
vec3 shadeUnderside(vec3 p, vec3 N, vec3 rd, float dist, out float F) {
  float cosi = clamp(dot(rd, N), 1e-3, 1.0);
  F = fresnelExact(cosi, N_WATER);
  vec3 col = vec3(0.0);
  if (F < 1.0) {
    vec3 T = refract(rd, -N, N_WATER);                   // out into the air
    vec3 sun = normalize(uSun);
    vec3 sky = skyEnv(T, 0.0) + sunLight(sun) * pow(max(dot(T, sun), 0.0), 4000.0) * 2.0;
    col = sky * (1.0 - F);
  }
  if (uUTerms.w > 0.5) col += waterBelow(p, reflect(rd, -N), dist) * F;
  return col;
}
`;

// ── The surface, from below ───────────────────────────────────────────────────
// Pairs with the Water Lab's WATER_VS: the same displaced ring grid.
export const UNDER_SURFACE_FS = `#version 300 es
precision highp float;
precision highp int;
in vec2 vX0;
in vec3 vP;
out vec4 FragColor;
${PROC_SKY_GLSL}
${WATER_COMMON_GLSL}
${GERSTNER_SOURCE_GLSL}
${MEDIUM_GLSL}
void main() {
  vec3 d = vP - uCamPos;
  float dist = length(d);
  vec3 rd = d / dist;
  float res = 0.5 * length(fwidth(vX0));
  vec3 N; float J;
  gerstnerFrame(vX0, res, N, J);
  vec2 rs = rippleSlope(vP.xz) * uDetail * exp(-dist / 45.0);
  N = normalize(N + vec3(-rs.x, 0.0, -rs.y));
  // Far away, a pixel covers many tilts of the surface and a single normal
  // would flicker between window and mirror: flatten it toward the average
  float keep = exp(-dist / 30.0);
  N = normalize(vec3(N.x * keep, N.y, N.z * keep));
  float F;
  vec3 col = shadeUnderside(vP, N, rd, dist, F);
  vec3 tr;
  vec3 L = inscatter(uCamPos, rd, dist, tr);
  if (uView == 1) {
    // Snell's window: green where light gets through (brighter = more of it), red where it cannot
    FragColor = vec4(F >= 1.0 ? vec3(0.75, 0.12, 0.1) : mix(vec3(0.1, 0.85, 0.35), vec3(0.95, 0.8, 0.15), F), 1.0);
    return;
  }
  if (uView == 2) { FragColor = vec4(display(L), 1.0); return; }
  if (uView == 3) { FragColor = vec4(vec3(0.08), 1.0); return; }
  FragColor = vec4(display(col * tr + L), 1.0);
}`;

// ── Bed and open water, from below, with the bed's depth ──────────────────────
export const UNDER_BG_FS = `#version 300 es
precision highp float;
precision highp int;
in vec2 vUV;
out vec4 FragColor;
uniform vec3  uCamF, uCamR, uCamU;
uniform float uTanHalf, uAspect;
uniform float uDepthA, uDepthB;    // projection terms: ndc z = (A·z + B) / −z for view-space z
${PROC_SKY_GLSL}
${WATER_COMMON_GLSL}
${GERSTNER_SOURCE_GLSL}
${MEDIUM_GLSL}
void main() {
  vec2 ndc = vUV * 2.0 - 1.0;
  vec3 rd = normalize(uCamF + uCamR * ndc.x * uTanHalf * uAspect + uCamU * ndc.y * uTanHalf);
  float tBed = traceBed(uCamPos, rd);
  // A ray that reaches the surface before the bed: the surface mesh covers this pixel
  if (rd.y > 0.0 && (tBed < 0.0 || uCamPos.y + rd.y * tBed > 0.0)) { FragColor = vec4(0.0); gl_FragDepth = 1.0; return; }
  float s = tBed > 0.0 ? tBed : 1e4;
  vec3 tr;
  vec3 L = inscatter(uCamPos, rd, s, tr);
  vec3 col = vec3(0.0);
  gl_FragDepth = 1.0;
  if (tBed > 0.0) {
    vec3 q = uCamPos + rd * tBed;
    col = shadeBedUnder(q, tBed);
    float z = tBed * dot(rd, uCamF);
    gl_FragDepth = 0.5 * (uDepthA * -z + uDepthB) / z + 0.5;
    if (uView == 3) { FragColor = vec4(vec3(causticAtDepth(q, max(-q.y, 0.0), tBed * uPix * 1.5) * 0.35), 1.0); return; }
  }
  if (uView == 1) { FragColor = vec4(vec3(0.12), 1.0); return; }
  if (uView == 2) { FragColor = vec4(display(L), 1.0); return; }
  if (uView == 3) { FragColor = vec4(vec3(0.08), 1.0); return; }
  FragColor = vec4(display(col * tr + L), 1.0);
}`;

// ── Per-frame uniforms ────────────────────────────────────────────────────────
export type UnderParams = {
  turbid: number;                  // σs per metre
  shafts: number;                  // caustic contrast in the scattered light
  terms: { fog: boolean; shafts: boolean; caustics: boolean; mirror: boolean };
};

/**
 * Every uniform both lab modes read. p.camHeight may be negative: the camera
 * is then under water, kept at least 15 cm below the wave passing over it (and
 * above the water, 30 cm over it), so the lens never straddles the surface.
 */
export function underUniforms(p: WaterParams, u: UnderParams, sky: SkyParams, look: { yaw: number; pitch: number; fov: number },
  aspect: number, time: number, grid: { spacingK: number; spacingA: number }): { set: UniformSet; under: boolean } {
  const w = waveSet(p);
  const { f, r, u: up } = cameraBasis(look.yaw, look.pitch);
  const h = gerstnerHeight(w, time * p.speed, 0, 0);
  const under = p.camHeight < 0;
  const camY = under ? Math.max(Math.min(p.camHeight, h - 0.15), -p.depth + 0.15) : Math.max(p.camHeight, h + 0.3);
  const eye: Vec3 = [0, camY, 0];
  const proj = mat4.perspective(look.fov, aspect, NEAR, FAR);
  const viewProj = mat4.multiply(proj, mat4.lookAt(eye, [f[0], camY + f[1], f[2]], [0, 1, 0]));
  const c = commonUniforms(p, sky, eye, time, w.hmax * (1 + p.chop * 0.2) + 0.01);
  return {
    under,
    set: {
      f1: { ...c.f1, uTanHalf: Math.tan(look.fov / 2), uAspect: aspect, uGridK: grid.spacingK, uGridA: grid.spacingA,
        uDepthA: proj[10], uDepthB: proj[14], uTurbid: u.turbid, uShafts: u.shafts },
      i1: { ...c.i1, uN: w.n },
      v3: { ...c.v3, uCamF: f, uCamR: r, uCamU: up },
      v4: { ...c.v4, uUTerms: [+u.terms.fog, +u.terms.shafts, +u.terms.caustics, +u.terms.mirror] },
      arrays: { uWA: w.a, uWB: w.b },
      m4: { uViewProj: viewProj },
    },
  };
}
