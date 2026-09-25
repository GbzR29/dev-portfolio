// ── Fog Lab shader ────────────────────────────────────────────────────────────
// A valley of hills and trees under the procedural sky, with every kind of
// fog the chapter derives: distance fogs (linear, exp, exp²), exponential
// height fog, a ground layer with a soft top (analytic integral), and mist:
// the same layer with animated noise, raymarched, lit by the sun through the
// fog itself.

import { PROC_SKY_GLSL, sunDirection, type SkyParams } from "../sky/proceduralSky";
import type { Vec3 } from "../gl";

export type FogParams = {
  mode: number;          // 0 none, 1 linear, 2 exp, 3 exp², 4 height, 5 ground layer, 6 mist
  density: number;       // per metre
  height: number;        // layer top / height-fog reference (m above the valley floor)
  soft: number;          // thickness of the layer's soft top (m); falloff for height fog
  noise: number;         // 0 … 1, mist only
  wind: number;          // m/s, mist only
  colour: Vec3;
  scatter: number;       // strength of the sun's forward-scattering glow
  camHeight: number;     // metres above the ground under the camera
  fogSky: boolean;
  view: number;          // 0 final, 1 fog amount, 2 scene without fog
};

export const DEFAULT_FOG: FogParams = {
  mode: 5, density: 0.12, height: 3, soft: 1.5, noise: 0.6, wind: 1.2,
  colour: [0.72, 0.76, 0.8], scatter: 1, camHeight: 2, fogSky: true, view: 0,
};

export const FOG_LAB_PRESETS: { id: string; label: string; fog: Partial<FogParams>; sky: Partial<SkyParams> }[] = [
  { id: "valley", label: "Morning valley", fog: { mode: 6, density: 0.07, height: 2.5, soft: 1.2, noise: 0.95, camHeight: 3 }, sky: { sunEl: 8, sunAz: 60, cover: 0.3, exposure: 1.4 } },
  { id: "sea", label: "Sea of clouds", fog: { mode: 6, density: 0.35, height: 7, soft: 2, noise: 0.8, camHeight: 22, colour: [0.85, 0.85, 0.88] }, sky: { sunEl: 12, sunAz: 40, cover: 0.2, exposure: 1.3 } },
  { id: "ground", label: "Ground layer", fog: { mode: 5, density: 0.15, height: 2, soft: 1, camHeight: 1.8 }, sky: { sunEl: 25, sunAz: 120, cover: 0.4, exposure: 1.3 } },
  { id: "height", label: "Height fog", fog: { mode: 4, density: 0.08, height: 0, soft: 4, camHeight: 3 }, sky: { sunEl: 30, sunAz: 80, cover: 0.4, exposure: 1.3 } },
  { id: "dense", label: "Uniform (exp)", fog: { mode: 2, density: 0.04, camHeight: 2 }, sky: { sunEl: 30, sunAz: 80, cover: 0.6, exposure: 1.3 } },
  { id: "sunset", label: "Sunset haze", fog: { mode: 4, density: 0.05, height: 0, soft: 6, camHeight: 3, colour: [0.8, 0.72, 0.65], scatter: 1.5 }, sky: { sunEl: 4, sunAz: 10, cover: 0.3, exposure: 1.6 } },
];

export const FOG_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;

uniform vec3  uCamPos, uCamF, uCamR, uCamU;
uniform float uTanHalf, uAspect;
uniform int   uMode, uView;
uniform float uDens, uH, uSoft, uNoise, uWind, uScatterK, uFogSky;
uniform vec3  uFogCol;
uniform float uT;

${PROC_SKY_GLSL}

// ── Scene: rolling hills and trees ──────────────────────────────────────────
float terrain(vec2 x) {
  float h = (noise3(vec3(x * 0.035, 0.5)) - 0.5) * 18.0 + (noise3(vec3(x * 0.11, 2.5)) - 0.5) * 4.0;
  float valley = 1.0 - exp(-pow(x.x / 16.0, 2.0));          // a valley along z, floor at x = 0
  return h * valley + valley * 6.0 - 3.0;
}
// Trees: a cone per 6 m cell (jittered, some cells empty), checked over 3×3 cells
float trees(vec3 p) {
  vec2 cell = floor(p.xz / 6.0);
  float d = 1e9;
  for (int j = -1; j <= 1; j++)
  for (int i = -1; i <= 1; i++) {
    vec2 c = cell + vec2(i, j);
    float h = hash13(vec3(c, 4.0));
    if (h > 0.55) continue;
    vec2 centre = (c + 0.2 + 0.6 * vec2(hash13(vec3(c, 1.0)), hash13(vec3(c, 2.0)))) * 6.0;
    float base = terrain(centre);
    float hh = 3.5 + 4.0 * h;
    vec3 q = p - vec3(centre.x, base, centre.y);
    // cone: radius shrinks from 1.3 at the base to 0 at the top
    float r = length(q.xz), k = 1.3 / hh;
    float cone = max((r - (hh - q.y) * k) / sqrt(1.0 + k * k), -q.y);
    d = min(d, max(cone, q.y - hh));
  }
  return d;
}
float map(vec3 p) { return min((p.y - terrain(p.xz)) * 0.5, trees(p) * 0.9); }
vec3 mapNormal(vec3 p) {
  const vec2 k = vec2(1.0, -1.0);
  const float e = 0.01;
  return normalize(k.xyy * map(p + k.xyy * e) + k.yyx * map(p + k.yyx * e) + k.yxy * map(p + k.yxy * e) + k.xxx * map(p + k.xxx * e));
}
float trace(vec3 o, vec3 d) {
  float t = 0.05;
  for (int i = 0; i < 140; i++) {
    float h = map(o + d * t);
    if (h < 0.002 * t || t > 400.0) break;
    t += h;
  }
  return t;
}

// ── Fog density and its integral along a ray ────────────────────────────────
// Ground layer: constant below H, then e^(-(y-H)/soft) above it
float layerDensity(float y) { return uDens * (y <= uH ? 1.0 : exp(-(y - uH) / uSoft)); }

// ∫ density along o + t·d for t in [0, L], split where the ray crosses y = H
float layerIntegral(float y0, float dy, float L) {
  if (abs(dy) < 1e-5) return layerDensity(y0) * L;
  float tH = (uH - y0) / dy;
  // interval below H and interval above H, clipped to [0, L]
  float b0 = dy > 0.0 ? 0.0 : tH, b1 = dy > 0.0 ? tH : 1e9;
  float a0 = dy > 0.0 ? tH : 0.0, a1 = dy > 0.0 ? 1e9 : tH;
  b0 = clamp(b0, 0.0, L); b1 = clamp(b1, 0.0, L);
  a0 = clamp(a0, 0.0, L); a1 = clamp(a1, 0.0, L);
  float below = uDens * max(b1 - b0, 0.0);
  // above: ∫ e^(-(y0 + t·dy - H)/soft) dt = soft/dy · [e^(-(y(a0)-H)/soft) − e^(-(y(a1)-H)/soft)]
  float e0 = exp(-(y0 + a0 * dy - uH) / uSoft), e1 = exp(-(y0 + a1 * dy - uH) / uSoft);
  float above = a1 > a0 ? uDens * uSoft / dy * (e0 - e1) : 0.0;
  return below + above;
}
// Exponential height fog: density a·e^(-b(y - H)), integrated in closed form
float heightIntegral(float y0, float dy, float L) {
  float b = 1.0 / uSoft;
  float a = uDens * exp(-b * (y0 - uH));
  if (abs(dy) < 1e-5) return a * L;
  return a * (1.0 - exp(-b * dy * L)) / (b * dy);
}

// Colour the fog sends toward the eye: ambient sky light + sun, forward-scattered
vec3 fogLight(vec3 rd, vec3 sun, float sunVis) {
  vec3 amb = sky(vec3(0.0, 1.0, 0.0)) * 0.8;
  float ph = phaseHG(dot(rd, sun), 0.6) * 4.0 * PI;          // 1 for isotropic, up to ~10 toward the sun
  vec3 sunC = sunLight(sun) * 0.06 * max(smoothstep(-0.1, 0.1, sun.y), 0.0);
  return srgb(uFogCol) * amb + sunC * mix(1.0, ph, uScatterK) * sunVis;
}

void main() {
  vec3 sun = normalize(uSun);
  vec2 ndc = vUV * 2.0 - 1.0;
  vec3 rd = normalize(uCamF + uCamR * ndc.x * uTanHalf * uAspect + uCamU * ndc.y * uTanHalf);
  vec3 ro = uCamPos;
  ro.y += terrain(ro.xz);                                     // camera height is above the ground

  float t = trace(ro, rd);
  bool hit = t < 400.0;
  vec3 col;
  if (hit) {
    vec3 p = ro + rd * t, n = mapNormal(p);
    bool tree = trees(p) < 0.05;
    vec3 alb = tree ? vec3(0.07, 0.16, 0.08) : mix(vec3(0.2, 0.3, 0.12), vec3(0.34, 0.32, 0.28), smoothstep(0.75, 0.55, n.y));
    alb *= 0.8 + 0.4 * noise3(p * 1.7);
    vec3 L = sunLight(sun) * 0.18;
    // sunlight reaching the surface has crossed the fog too (layer modes)
    float sunVis = uMode >= 5 ? exp(-layerIntegral(p.y, sun.y, 200.0) * 0.5) : 1.0;
    col = alb * (L * max(dot(n, sun), 0.0) * sunVis + sky(vec3(0.0, 1.0, 0.0)) * (0.5 + 0.5 * n.y)) / PI;
  } else {
    col = sky(rd);
  }
  if (uView == 2 || uMode == 0) { FragColor = vec4(display(col), 1.0); return; }

  float d = hit ? t : (uFogSky > 0.5 ? 1000.0 : 0.0);
  float vis = 1.0;
  vec3 inscatter = vec3(0.0);
  float sunVis = 1.0;
  if (uMode == 1) vis = clamp((1.0 / uDens - d) / (1.0 / uDens - 2.0), 0.0, 1.0);   // linear: end at 1/density
  else if (uMode == 2) vis = exp(-uDens * d);
  else if (uMode == 3) vis = exp(-pow(uDens * d, 2.0));
  else if (uMode == 4) vis = exp(-heightIntegral(ro.y, rd.y, d));
  else if (uMode == 5) {
    vis = exp(-layerIntegral(ro.y, rd.y, d));
    // light reaching the middle of the fogged path, dimmed by the fog above it
    sunVis = exp(-layerIntegral(max(ro.y + rd.y * min(d, 60.0) * 0.5, -3.0), sun.y, 200.0) * 0.5);
  }
  if (uMode == 6) {
    // Mist: march the ray through the layer, density modulated by drifting noise
    float y1 = uH + 3.0 * uSoft;                              // above this the fog is negligible
    float tEnter = 0.0, tExit = min(d, 250.0);
    if (abs(rd.y) > 1e-4) {
      float tTop = (y1 - ro.y) / rd.y;
      if (ro.y > y1) { if (rd.y >= 0.0) tExit = -1.0; else tEnter = tTop; }
      else if (rd.y > 0.0) tExit = min(tExit, tTop);
    } else if (ro.y > y1) tExit = -1.0;
    float T = 1.0;
    vec3 acc = vec3(0.0);
    if (tExit > tEnter) {
      const int N = 40;
      float dt = (tExit - tEnter) / float(N);
      float jitter = hash13(vec3(gl_FragCoord.xy, uT));        // hides the step banding
      for (int i = 0; i < N; i++) {
        float s = tEnter + (float(i) + jitter) * dt;
        vec3 p = ro + rd * s;
        vec3 q = p * 0.12 + vec3(uWind * uT * 0.12, 0.0, uWind * uT * 0.04);
        float n = fbm3(q);
        float dens = layerDensity(p.y) * mix(1.0, smoothstep(0.25, 0.75, n) * 2.2, uNoise);
        if (dens < 1e-4) continue;
        float sv = exp(-layerIntegral(p.y, sun.y, 200.0) * 0.5);
        vec3 Lf = fogLight(rd, sun, sv);
        float a = 1.0 - exp(-dens * dt);                       // fraction of light this step absorbs…
        acc += T * a * Lf;                                     // …and replaces with fog light
        T *= 1.0 - a;
        if (T < 0.01) break;
      }
    }
    col = col * T + acc;
    if (uView == 1) { FragColor = vec4(vec3(1.0 - T), 1.0); return; }
    FragColor = vec4(display(col), 1.0);
    return;
  }
  inscatter = fogLight(rd, sun, sunVis);
  if (uView == 1) { FragColor = vec4(vec3(1.0 - vis), 1.0); return; }
  col = col * vis + inscatter * (1.0 - vis);
  FragColor = vec4(display(col), 1.0);
}`;

export function fogUniforms(p: FogParams, sky: SkyParams, cam: { pos: Vec3; f: Vec3; r: Vec3; u: Vec3 }, fov: number, aspect: number, time: number) {
  return {
    f1: {
      // heights are given above the valley floor, which sits at y = −3
      uTanHalf: Math.tan(fov / 2), uAspect: aspect, uDens: p.density, uH: p.height - 3, uSoft: Math.max(0.05, p.soft),
      uNoise: p.noise, uWind: p.wind, uScatterK: p.scatter, uFogSky: +p.fogSky, uT: time,
      uTime: time, uCover: sky.cover, uDensity: sky.density, uExposure: sky.exposure,
    } as Record<string, number>,
    i1: { uMode: p.mode, uView: p.view, uModel: sky.model, uSolo: -1 } as Record<string, number>,
    v3: { uCamPos: cam.pos, uCamF: cam.f, uCamR: cam.r, uCamU: cam.u, uFogCol: p.colour, uSun: sunDirection(sky.sunEl, sky.sunAz) } as Record<string, number[]>,
    v4: { uLayers: [+sky.sun, +sky.stars, +sky.milky, +sky.clouds] } as Record<string, number[]>,
  };
}

export function applyFogUniforms(gl: WebGL2RenderingContext, prog: WebGLProgram, u: ReturnType<typeof fogUniforms>) {
  const loc = (n: string) => gl.getUniformLocation(prog, n);
  for (const [k, v] of Object.entries(u.f1)) gl.uniform1f(loc(k), v);
  for (const [k, v] of Object.entries(u.i1)) gl.uniform1i(loc(k), v);
  for (const [k, v] of Object.entries(u.v3)) gl.uniform3fv(loc(k), v);
  for (const [k, v] of Object.entries(u.v4)) gl.uniform4fv(loc(k), v);
}
