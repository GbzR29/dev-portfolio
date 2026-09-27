// ── The Ocean Lab shaders (FFT waves) ─────────────────────────────────────────
// The same ring grid as the Water Lab, displaced by three FFT cascades instead
// of a handful of Gerstner waves. Each cascade is a tile of N×N texels that
// repeats every L metres; the vertex shader samples the displacement at a mip
// level that matches the grid spacing (so waves the mesh cannot carry are
// averaged away), the fragment shader sums the cascades' derivatives into the
// normal and the Jacobian, and shades with waterCommon.ts. Foam comes from the
// simulation's foam textures, drawn through a web-like pattern.

import { PROC_SKY_GLSL, type SkyParams } from "../sky/proceduralSky";
import { mat4, type Vec3 } from "../../kit/gl/gl";
import { WATER_COMMON_GLSL, commonUniforms, type UniformSet } from "../water/waterCommon";
import { cameraBasis, NEAR, FAR } from "../water/waterShader";
import type { WaterParams } from "../water/waterParams";
import { N, CASCADES } from "./spectrum";

const TILES = `
uniform vec3 uL;                   // tile size of each cascade (m)
uniform vec3 uOn;                  // 1 = cascade switched on
const float N = ${N.toFixed(1)};
`;

// ── The water mesh ────────────────────────────────────────────────────────────
export const OCEAN_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aX0;
uniform mat4  uViewProj;
uniform float uGridK, uGridA;      // vertex spacing at distance r: max(uGridK·r, uGridA·r²)
uniform sampler2D uDisp0, uDisp1, uDisp2;
${TILES}
out vec2 vX0;
out vec3 vP;
// One cascade's displacement, at the mip whose texels are two vertex gaps wide
vec3 tile(sampler2D d, float L, float spacing) {
  return textureLod(d, aX0 / L, log2(max(2.0 * spacing * N / L, 1.0))).xyz;
}
void main() {
  float r = length(aX0);
  float spacing = max(max(r * uGridK, r * r * uGridA), 0.01);
  vec3 D = tile(uDisp0, uL.x, spacing) * uOn.x + tile(uDisp1, uL.y, spacing) * uOn.y + tile(uDisp2, uL.z, spacing) * uOn.z;
  vec3 P = vec3(aX0.x + D.x, D.y, aX0.y + D.z);
  vX0 = aX0;
  vP = P;
  gl_Position = uViewProj * vec4(P, 1.0);
}`;

// ── Foam pattern ──────────────────────────────────────────────────────────────
// The simulation gives a foam density f per point: how much of a small patch
// is white. The pattern decides which parts. Bubbles gather along the borders
// between cells, so a Voronoi border pattern (warped so the cells are not
// polygons, two sizes, plus fine grain) switches on first where it is highest:
// thin webs at low density, solid white at high density.
const FOAM_GLSL = `
uniform float uFoamScale;          // cells per metre
vec2 hash22(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy);
}
// F2 − F1: 0 on a border between two cells, growing toward the centres
float cellBorder(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)), r = g + hash22(i + g) - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return sqrt(d2) - sqrt(d1);
}
// Density f → white coverage; px is the size of a pixel in metres
float foamPattern(vec2 x, float f, float px) {
  if (f < 0.002) return 0.0;
  float s = uFoamScale;
  vec2 w = x + 0.4 / s * vec2(fbm2(x * s * 0.5), fbm2(x * s * 0.5 + 17.0));
  // How well each layer of cells is resolved: 1 while a cell spans several
  // pixels, 0 once it is down to about two. An unresolved layer is replaced
  // by its average, so it fades out instead of sparkling.
  float r1 = 1.0 - smoothstep(0.15, 0.5, px * s), r2 = 1.0 - smoothstep(0.15, 0.5, px * s * 3.1);
  float big = 1.0 - smoothstep(0.0, 0.3, cellBorder(w * s));
  float small = 1.0 - smoothstep(0.0, 0.25, cellBorder(w * s * 3.1 + 5.0));
  float web = 0.6 * mix(0.45, big, r1) + 0.4 * mix(0.45, small, r2);
  float pattern = clamp(web * 0.8 + fbm2(x * s * 9.0) * 0.3 * r2, 0.0, 1.0);
  float m = smoothstep(1.0 - f, 1.0 - f + 0.2, pattern);
  // Far away even the big cells are finer than a pixel: use the average, about f
  return mix(f, m, r1);
}
`;

export const OCEAN_FS = `#version 300 es
precision highp float;
in vec2 vX0;
in vec3 vP;
out vec4 FragColor;
uniform sampler2D uDisp0, uDisp1, uDisp2, uDeriv0, uDeriv1, uDeriv2;
uniform sampler2D uFoam;           // foam density, over the largest tile
uniform float uHs;                 // significant wave height (m)
uniform int   uOceanView;          // 0 shading, 1 foam density, 2 cascades
${TILES}
${PROC_SKY_GLSL}
${WATER_COMMON_GLSL}
${FOAM_GLSL}
// Height of the surface above x, ignoring the small sideways shift (only the
// deep bed asks for it, and the ocean floor is out of sight anyway)
float waterHeight(vec2 x) {
  return textureLod(uDisp0, x / uL.x, 0.0).y * uOn.x + textureLod(uDisp1, x / uL.y, 0.0).y * uOn.y
       + textureLod(uDisp2, x / uL.z, 0.0).y * uOn.z;
}
float causticAt(vec2 x, float d) { return 1.0; }

void main() {
  vec3 rd = normalize(vP - uCamPos);
  vec2 u0 = vX0 / uL.x, u1 = vX0 / uL.y, u2 = vX0 / uL.z;
  // Derivatives add up across cascades: (∂h/∂x, ∂h/∂z, λ∂Dx/∂x, λ∂Dz/∂z), and λ∂Dx/∂z
  vec4 d = texture(uDeriv0, u0) * uOn.x + texture(uDeriv1, u1) * uOn.y + texture(uDeriv2, u2) * uOn.z;
  float dxz = texture(uDisp0, u0).w * uOn.x + texture(uDisp1, u1).w * uOn.y + texture(uDisp2, u2).w * uOn.z;
  // Tangents ∂P/∂x₀ and ∂P/∂z₀ of the displaced surface, as in the Gerstner lab
  vec3 T = vec3(1.0 + d.z, d.x, dxz), B = vec3(dxz, d.y, 1.0 + d.w);
  vec3 Nrm = normalize(cross(B, T));
  float J = (1.0 + d.z) * (1.0 + d.w) - dxz * dxz;

  float f = clamp(texture(uFoam, u0).r * uFoamAmt, 0.0, 1.0);
  // Pixel size on the water: the geometric mean of its two sides, since at
  // grazing angles the side along the view is much longer than the other
  float px = sqrt(length(dFdx(vX0)) * length(dFdy(vX0)));
  float foam = foamPattern(vX0, f, px);
  float crest = clamp(vP.y / max(uHs, 0.1) + 0.5, 0.0, 1.0);

  if (uOceanView == 1) { FragColor = vec4(vec3(f), 1.0); return; }
  if (uOceanView == 2) {
    // Which cascade moves this point most: red = 500 m tile, green = 83 m, blue = 14 m
    vec3 h = abs(vec3(texture(uDisp0, u0).y * uOn.x, texture(uDisp1, u1).y * uOn.y, texture(uDisp2, u2).y * uOn.z));
    FragColor = vec4(h / max(max(h.x, h.y), max(h.z, 1e-3)) * (0.35 + 0.65 * max(Nrm.y, 0.0)), 1.0);
    return;
  }
  FragColor = vec4(shadeWater(vP, Nrm, J, crest, foam, f * 0.6, rd), 1.0);
}`;

export const OCEAN_SKY_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;
uniform vec3  uCamF, uCamR, uCamU;
uniform float uTanHalf, uAspect;
${PROC_SKY_GLSL}
void main() {
  vec2 ndc = vUV * 2.0 - 1.0;
  FragColor = vec4(display(sky(uCamF + uCamR * ndc.x * uTanHalf * uAspect + uCamU * ndc.y * uTanHalf)), 1.0);
}`;

// ── Per-frame uniforms ────────────────────────────────────────────────────────
export type OceanView = { on: [boolean, boolean, boolean]; view: number; foamScale: number; hs: number };

export function oceanUniforms(w: WaterParams, sky: SkyParams, look: { yaw: number; pitch: number; fov: number },
  aspect: number, time: number, grid: { spacingK: number; spacingA: number }, o: OceanView): UniformSet {
  const { f, r, u } = cameraBasis(look.yaw, look.pitch);
  // Stay above the crests: rarely more than one significant height over the mean
  const camY = Math.max(w.camHeight, o.hs + 1);
  const eye: Vec3 = [0, camY, 0];
  const proj = mat4.perspective(look.fov, aspect, NEAR, FAR);
  const viewProj = mat4.multiply(proj, mat4.lookAt(eye, [f[0], camY + f[1], f[2]], [0, 1, 0]));
  const c = commonUniforms(w, sky, eye, time, o.hs);
  // Water Lab debug views 1–5 keep their meaning; the ocean's own views follow
  const common = o.view <= 5 ? o.view : 0;
  return {
    f1: { ...c.f1, uTanHalf: Math.tan(look.fov / 2), uAspect: aspect, uGridK: grid.spacingK, uGridA: grid.spacingA,
      uHs: o.hs, uFoamScale: o.foamScale },
    i1: { ...c.i1, uView: common, uOceanView: o.view > 5 ? o.view - 5 : 0 },
    v3: { ...c.v3, uCamF: f, uCamR: r, uCamU: u, uL: CASCADES.map(x => x.L), uOn: o.on.map(Number) },
    v4: c.v4,
    m4: { uViewProj: viewProj },
  };
}
