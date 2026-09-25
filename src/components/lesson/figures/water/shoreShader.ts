// ── Shore & Rain Lab shader ───────────────────────────────────────────────────
// A small bay seen from above: a sphere-traced terrain (sand island, sea bed,
// sea grass) with rocks and posts, under a flat water plane whose ripples
// live in the normal only. Shows the shallow-water effects the open-ocean lab
// cannot: colour by depth, cellular shore foam, contact foam from the distance
// field, caustics and shadows on the bed, and rain (ring ripples, splashes,
// falling streaks).

import { PROC_SKY_GLSL, sunDirection, type SkyParams } from "../sky/proceduralSky";
import type { Vec3 } from "../../kit/gl/gl";

export type ShoreParams = {
  level: number;        // water level (m)
  waves: number;        // ripple strength
  windDir: number;      // degrees
  absorb: Vec3; scatter: Vec3; clarity: number;
  foamWidth: number;    // shore foam reaches this far (m of water depth)
  contact: number;      // contact foam width around objects (m)
  cells: number;        // foam cell size (1/m)
  caustics: number;
  grass: boolean;
  rain: number;         // 0 … 1
  streaks: boolean; splashes: boolean;
  style: 0 | 1;
  view: number;         // 0 final, 1 thickness, 2 foam mask, 3 water normal, 4 caustics
};

export const DEFAULT_SHORE: ShoreParams = {
  level: 0, waves: 1, windDir: 30,
  absorb: [0.32, 0.055, 0.06], scatter: [0.01, 0.07, 0.07], clarity: 1.6,
  foamWidth: 0.5, contact: 0.3, cells: 5, caustics: 1, grass: true,
  rain: 0, streaks: true, splashes: true, style: 0, view: 0,
};

export const SHORE_PRESETS: { id: string; label: string; shore: Partial<ShoreParams>; sky: Partial<SkyParams> }[] = [
  { id: "clear", label: "Clear shallows", shore: { rain: 0, style: 0, waves: 1 }, sky: { sunEl: 50, sunAz: 140, cover: 0.3, exposure: 1.1 } },
  { id: "rain", label: "Rain", shore: { rain: 0.8, style: 0, waves: 0.5, clarity: 1.1 }, sky: { sunEl: 35, sunAz: 140, cover: 0.95, exposure: 1.5 } },
  { id: "stylised", label: "Stylised lake", shore: { rain: 0, style: 1, waves: 0.8, foamWidth: 0.5, cells: 4 }, sky: { sunEl: 55, sunAz: 140, cover: 0.2, model: 0, exposure: 1.1 } },
  { id: "evening", label: "Evening", shore: { rain: 0, style: 0, waves: 1.2 }, sky: { sunEl: 7, sunAz: 100, cover: 0.4, exposure: 1.6 } },
];

export const SHORE_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;

uniform vec3  uCamPos, uCamF, uCamR, uCamU;
uniform float uTanHalf, uAspect;
uniform float uT;                 // animation time
uniform float uLevel, uWaves, uWindDir;
uniform vec3  uAbsorb, uScatter;
uniform float uFoamW, uContact, uCells, uCaustics, uGrass, uRain, uStreaks, uSplash;
uniform int   uStyle, uView;
uniform vec2  uRes;

${PROC_SKY_GLSL}

const float ETA = 1.0 / 1.333;
vec3 ambientSky(vec3 sun) { return sky(vec3(0.0, 1.0, 0.0)) * 0.9 + sunLight(sun) * max(sun.y, 0.0) * 0.12; }

// ── Scene: terrain + rocks + posts ──────────────────────────────────────────
float fbmq(vec2 p) {                                // 3 octaves: cheap enough to trace
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * noise3(vec3(p, 1.7)); p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.03 + 5.1; a *= 0.5; }
  return s;
}
// Bed height: an island whose shoreline is bent by noise, over a sea floor
// (two noise lookups only: this runs at every step of every ray)
float bed(vec2 xz) {
  float r = length(xz - vec2(-1.0, 0.5)) + (noise3(vec3(xz * 0.22, 1.7)) - 0.5) * 4.5;
  // beach → a shallow sand shelf → the drop-off into deep water
  float island = mix(0.9, -0.7, smoothstep(2.0, 3.8, r)) + mix(0.0, -3.5, smoothstep(5.5, 10.0, r));
  return island + (noise3(vec3(xz * 0.9, 3.3)) - 0.5) * 0.35;
}
float sdRoundBox(vec3 p, vec3 b, float r) { vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float rocks(vec3 p) {
  vec3 q = p - vec3(3.2, 0.1, 3.6);  q.xz = rot(0.6) * q.xz;
  float d = sdRoundBox(q, vec3(1.1, 1.5, 0.9), 0.35);
  q = p - vec3(5.6, -0.4, -1.5);     q.xz = rot(-0.4) * q.xz;
  d = min(d, sdRoundBox(q, vec3(0.8, 0.8, 0.7), 0.3));
  q = p - vec3(6.3, -0.2, -0.2);     q.xz = rot(1.1) * q.xz;
  d = min(d, sdRoundBox(q, vec3(0.6, 0.7, 0.55), 0.28));
  if (d > 0.5) return d;                            // far away: the smooth boxes are enough
  return d + (noise3(p * 2.1) - 0.5) * 0.22 + (noise3(p * 5.3) - 0.5) * 0.06;   // rough stone
}
float posts(vec3 p) {                               // two wooden posts of an old jetty
  vec2 a = p.xz - vec2(-6.2, -2.0), b = p.xz - vec2(-6.9, -3.6);
  float h = abs(p.y - 0.2) - 1.6;
  return max(min(length(a), length(b)) - 0.16, h);
}
float objects(vec3 p) { return min(rocks(p), posts(p)); }
float map(vec3 p) { return min((p.y - bed(p.xz)) * 0.6, objects(p) * 0.8); }
vec3 mapNormal(vec3 p) {                            // tetrahedron: 4 samples instead of 6
  const vec2 k = vec2(1.0, -1.0);
  const float e = 0.004;
  return normalize(k.xyy * map(p + k.xyy * e) + k.yyx * map(p + k.yyx * e) + k.yxy * map(p + k.yxy * e) + k.xxx * map(p + k.xxx * e));
}
float trace(vec3 o, vec3 d, float tmax) {
  // Nothing exists above y = 2.5: start where the ray enters that slab
  float t = (o.y > 2.5 && d.y < 0.0) ? (2.5 - o.y) / d.y : 0.0;
  if (o.y > 2.5 && d.y >= 0.0) return tmax + 1.0;
  for (int i = 0; i < 90; i++) {
    float h = map(o + d * t);
    if (h < 0.002 * (1.0 + t) || t > tmax) break;
    t += h;
  }
  return t;
}
float softShadow(vec3 o, vec3 d) {
  float res = 1.0, t = 0.05;
  for (int i = 0; i < 16; i++) {
    float h = map(o + d * t);
    res = min(res, 10.0 * h / t);
    t += clamp(h, 0.08, 0.8);
    if (res < 0.01 || t > 12.0) break;
  }
  return clamp(res, 0.0, 1.0);
}

// ── Water surface: wind ripples + rain rings, in the normal only ────────────
// Four travelling sines; their Hessian is exact and feeds the caustics
vec4 waveDir(int i) {
  float fi = float(i);
  float a = radians(uWindDir) + (hash13(vec3(fi, 2.0, 9.0)) - 0.5) * 1.6;   // scattered around the wind
  float k = 2.6 * pow(1.47, fi);
  return vec4(cos(a), sin(a), k, 0.01 * uWaves / pow(1.35, fi));
}
vec2 windSlope(vec2 x) {
  vec2 g = vec2(0.0);
  for (int i = 0; i < 4; i++) {
    vec4 w = waveDir(i);
    g += w.w * w.z * w.xy * cos(w.z * dot(w.xy, x) - sqrt(9.81 * w.z) * uT);
  }
  // Irregular small ripples: the gradient of drifting noise breaks up the sines
  vec2 q = x * 3.0 + vec2(uT * 0.35, uT * 0.2);
  const float e = 0.05;
  float n0 = noise3(vec3(q, uT * 0.3));
  g += vec2(noise3(vec3(q + vec2(e, 0.0), uT * 0.3)) - n0, noise3(vec3(q + vec2(0.0, e), uT * 0.3)) - n0) / e * 0.018 * uWaves;
  return g;
}
mat2 windHessian(vec2 x) {
  mat2 H = mat2(0.0);
  for (int i = 0; i < 4; i++) {
    vec4 w = waveDir(i);
    H -= w.w * w.z * w.z * sin(w.z * dot(w.xy, x) - sqrt(9.81 * w.z) * uT) * outerProduct(w.xy, w.xy);
  }
  return H;
}
vec2 hash22(vec2 p) { return vec2(hash13(vec3(p, 3.1)), hash13(vec3(p, 7.7))); }

// Rain: every cell of a 0.7 m grid gets a drop, over and over. A drop is a
// ring-shaped wave packet: radius grows with age, height fades with age.
const float CELL = 0.7, PERIOD = 1.1;
vec3 rainSlope(vec2 x, out float splash) {       // xy: slope, z: ring height (for display)
  vec3 acc = vec3(0.0);
  splash = 0.0;
  if (uRain <= 0.0) return acc;
  vec2 c0 = floor(x / CELL);
  for (int j = -1; j <= 1; j++)
  for (int i = -1; i <= 1; i++) {
    vec2 cell = c0 + vec2(i, j);
    float ph = hash13(vec3(cell, 1.3));
    if (ph > uRain) continue;                    // lighter rain: fewer cells active
    float tt = uT / PERIOD + ph * 7.0;
    float cycle = floor(tt), age = fract(tt) * PERIOD;
    vec2 centre = (cell + 0.15 + 0.7 * hash22(cell + cycle * 13.1)) * CELL;
    vec2 v = x - centre;
    float r = length(v) + 1e-4;
    float front = r - age * 0.55;                // ring speed 0.55 m/s
    // h = A·sin(k·front)·e^(−β·front²)·e^(−γ·age); its derivative along r gives the slope
    const float A = 0.012, k = 45.0, beta = 110.0;
    float env = exp(-front * front * beta) * exp(-age * 2.2);
    float dh = A * env * (k * cos(k * front) - 2.0 * beta * front * sin(k * front));
    acc.xy += dh * v / r;
    acc.z += A * env * sin(k * front);
    // the splash: a bright crown for the first tenth of a second
    splash += uSplash * smoothstep(0.03, 0.0, abs(r - 0.02 - age * 0.5)) * smoothstep(0.14, 0.0, age);
  }
  return acc;
}

// ── Foam pattern: cellular (Voronoi) noise ──────────────────────────────────
// F1 = distance to the nearest random feature point. Cells are the regions
// closest to one point: foam fills the cell borders first, the centres last.
float voronoiF1(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float d = 8.0;
  for (int y = -1; y <= 1; y++)
  for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(x, y);
    vec2 o = hash22(i + g);
    o = 0.5 + 0.4 * sin(uT * 0.6 + 6.2831 * o);     // feature points wander
    d = min(d, length(g + o - f));
  }
  return d;
}
// amount 0 … 1 → foam: at 1 everything is white, as it drops only cell borders stay
float cellFoam(vec2 p, float amount) {
  if (amount <= 0.0) return 0.0;
  float f1 = voronoiF1(p) / 0.75;                   // ≈ 0 at a feature point … ≈ 1 on the far borders
  float thr = 1.05 - amount * 1.1;                  // amount 0 → above every border; 1 → below every centre
  return smoothstep(thr - 0.05, thr + 0.05, f1);
}

// ── Surface shading for the dry scene and the underwater scene ──────────────
vec3 albedoAt(vec3 p, vec3 n, bool underwater) {
  if (objects(p) < 0.02) {
    if (posts(p) < rocks(p)) return vec3(0.33, 0.23, 0.15) * (0.8 + 0.4 * noise3(vec3(p.y * 30.0, p.xz * 3.0)));
    float lichen = smoothstep(0.55, 0.7, noise3(p * 3.0 + 4.0));
    return mix(vec3(0.42, 0.4, 0.37), vec3(0.3, 0.36, 0.2), lichen) * (0.75 + 0.5 * noise3(p * 9.0));
  }
  float sandN = 0.8 + 0.3 * noise3(vec3(p.xz * 18.0, 0.0));
  vec3 sand = vec3(0.78, 0.7, 0.52) * sandN;
  vec3 grassy = vec3(0.32, 0.55, 0.2);
  if (p.y > uLevel + 0.2) {
    // Grass takes over above the beach, with a ragged edge and some variation
    float g = smoothstep(0.35, 0.6, p.y - uLevel + (noise3(vec3(p.xz * 1.3, 2.0)) - 0.5) * 0.5);
    vec3 grass = mix(vec3(0.25, 0.48, 0.14), vec3(0.42, 0.6, 0.2), noise3(vec3(p.xz * 4.0, 6.0)));
    return mix(sand, grass, g);
  }
  if (underwater && uGrass > 0.5) {
    // Sea grass: patches (low-frequency mask) of blades (stretched noise), swaying
    float depth = uLevel - p.y;
    float mask = smoothstep(0.52, 0.62, fbmq(p.xz * 0.45 + 3.0)) * smoothstep(0.3, 0.8, depth);
    vec2 q = p.xz + vec2(sin(uT * 1.3 + p.x * 0.8), cos(uT * 1.1 + p.z * 0.7)) * 0.04 * depth;
    float blades = noise3(vec3(q.x * 22.0, q.y * 3.0, 0.0)) * noise3(vec3(q.x * 4.0, q.y * 20.0, 5.0));
    float g = mask * smoothstep(0.15, 0.4, blades);
    sand = mix(sand, grassy * (0.6 + 0.8 * blades), g);
  }
  return sand;
}

vec3 shade(vec3 p, vec3 n, vec3 sun, vec3 Ld, vec3 amb, bool underwater, float caus) {
  vec3 alb = albedoAt(p, n, underwater);
  float sh = softShadow(p + n * 0.02, sun);
  float wet = underwater ? 1.0 : smoothstep(0.35, 0.0, p.y - uLevel);
  alb *= mix(1.0, 0.6, wet * 0.8);
  return alb * (Ld * max(dot(n, sun), 0.0) * sh * caus + amb * (0.5 + 0.5 * n.y)) / PI;
}

// ── Rain streaks: screen space, three depth layers ──────────────────────────
float streaks(vec2 frag) {
  float s = 0.0;
  for (int l = 0; l < 3; l++) {
    float fl = float(l);
    float scale = 90.0 - fl * 25.0;                   // far layers: more, thinner streaks
    vec2 uv = frag / uRes.y * vec2(scale, scale * 0.12);
    uv.x += uv.y * 0.9 * 0.12;                       // slant with the wind
    uv.y += uT * (6.0 - fl * 1.2);
    vec2 cell = floor(uv);
    float h = hash13(vec3(cell.x, fl, 3.0));
    if (h > uRain * 0.6) continue;
    float y = fract(uv.y + h * 13.0);
    float x = fract(uv.x) - 0.5;
    s += (1.0 - smoothstep(0.02, 0.08, abs(x))) * smoothstep(0.0, 0.3, y) * smoothstep(0.7, 0.3, y) * (0.5 - fl * 0.12);
  }
  return s;
}

void main() {
  vec3 sun = normalize(uSun);
  vec2 ndc = vUV * 2.0 - 1.0;
  vec3 rd = normalize(uCamF + uCamR * ndc.x * uTanHalf * uAspect + uCamU * ndc.y * uTanHalf);
  vec3 ro = uCamPos;
  vec3 L = sunLight(sun);
  vec3 Ld = L * 0.18 * (1.0 - 0.6 * uRain);
  vec3 amb = ambientSky(sun);

  float tScene = trace(ro, rd, 80.0);
  float tWater = rd.y < 0.0 ? (uLevel - ro.y) / rd.y : 1e9;
  vec3 col;

  if (tWater < tScene && tWater > 0.0) {
    vec3 p = ro + rd * tWater;
    // Water normal: wind ripples + rain rings
    float splash;
    vec3 rain = rainSlope(p.xz, splash);
    vec2 slope = windSlope(p.xz) + rain.xy;
    vec3 N = normalize(vec3(-slope.x, 1.0, -slope.y));
    vec3 V = -rd;
    float F = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
    vec3 refl = sky(reflect(rd, N));
    // Objects reflected in the water (only the dry part, one trace)
    vec3 R = reflect(rd, N);
    float tr = trace(p + R * 0.05, R, 30.0);
    if (tr < 30.0) { vec3 q = p + R * (tr + 0.05); refl = shade(q, mapNormal(q), sun, Ld, amb, false, 1.0); }

    // Refraction: trace the bent ray through the water to the bed or a rock
    vec3 T = refract(rd, N, ETA);
    float s = trace(p, T, 40.0);
    vec3 q = p + T * s;
    vec3 nq = mapNormal(q);
    float depthQ = max(uLevel - q.y, 0.0);
    mat2 M = mat2(1.0) + depthQ * (1.0 - ETA) * windHessian(q.xz);
    float caus = mix(1.0, 1.0 / max(abs(determinant(M)), 0.15), uCaustics);
    vec3 bedCol = shade(q, nq, sun, Ld * exp(-uAbsorb * depthQ), amb, true, caus);
    vec3 trans = exp(-uAbsorb * s);
    vec3 refr = bedCol * trans + uScatter * amb * (1.0 - trans);

    // Foam: shore (water thickness) and contact (distance to objects)
    float thick = uLevel - bed(p.xz);
    float near = objects(vec3(p.x, uLevel, p.z));
    float shoreAmt = clamp(1.0 - thick / max(uFoamW, 1e-3), 0.0, 1.0);
    float contactAmt = clamp(1.0 - near / max(uContact, 1e-3), 0.0, 1.0);
    shoreAmt *= 0.85 + 0.15 * sin(thick * 25.0 - uT * 2.0);          // waves of foam washing in
    float amount = max(shoreAmt, contactAmt);
    float foam = cellFoam(p.xz * uCells + windSlope(p.xz) * 3.0, amount * 0.95);
    foam = max(foam, smoothstep(0.06, 0.0, min(thick, near)));      // solid line at the very edge
    foam = clamp(foam + splash, 0.0, 1.0);
    // Ring crests catch the bright overcast sky: a soft highlight that makes rain readable
    float ringGlow = clamp(rain.z / 0.012, 0.0, 1.0);
    vec3 foamCol = vec3(0.92) * (Ld * max(dot(N, sun), 0.0) + amb) / PI;

    if (uStyle == 1) {
      // Stylised: depth bands, flat reflection tint, cel sparkles
      float d = 1.0 - exp(-thick * 0.7);
      float band = floor(d * 4.0) / 4.0;
      vec3 base = mix(srgb(vec3(0.4, 0.9, 0.85)), srgb(vec3(0.05, 0.35, 0.75)), band);
      base = mix(bedCol, base, 0.45 + 0.5 * band);
      float spark = step(0.992, dot(reflect(-sun, N), V)) * 4.0;
      col = mix(base * 1.4, refl, F * 0.5) + spark;
      col = mix(col, vec3(1.2), step(0.5, foam));
    } else {
      vec3 H = normalize(sun + V);
      float nh = max(dot(N, H), 0.0);
      float a2 = 0.004;
      float spec = a2 / (PI * pow(nh * nh * (a2 - 1.0) + 1.0, 2.0)) * F / (4.0 * max(dot(N, V), 0.05));
      col = mix(refr, refl, F) + L * spec * 0.05 * (1.0 - uRain * 0.7);
      col = mix(col, foamCol, foam * 0.9);
      col += amb * ringGlow * 0.12 * uRain;
    }

    if (uView == 1) { FragColor = vec4(vec3(1.0 - exp(-thick * 0.8)) * vec3(0.4, 0.8, 1.0), 1.0); return; }
    if (uView == 2) { FragColor = vec4(vec3(foam), 1.0); return; }
    if (uView == 3) { FragColor = vec4(N * 0.5 + 0.5, 1.0); return; }
    if (uView == 4) { FragColor = vec4(vec3(caus * 0.35), 1.0); return; }
  } else if (tScene < 80.0) {
    vec3 p = ro + rd * tScene;
    col = shade(p, mapNormal(p), sun, Ld, amb, false, 1.0);
    if (uView > 0) { FragColor = vec4(vec3(0.12), 1.0); return; }
  } else {
    col = sky(rd);
  }
  col = mix(col, sky(normalize(vec3(rd.x, 0.02, rd.z))), 1.0 - exp(-max(min(tScene, tWater), 0.0) / 400.0));
  // Rain: streaks in front of everything, and a grey veil
  if (uRain > 0.0) {
    col = mix(col, ambientSky(sun) * 0.45, 0.08 * uRain);
    if (uStreaks > 0.5) col += streaks(gl_FragCoord.xy) * uRain * (amb * 0.6 + 0.05);
  }
  FragColor = vec4(display(col), 1.0);
}`;

export function shoreUniforms(p: ShoreParams, sky: SkyParams, cam: { pos: Vec3; f: Vec3; r: Vec3; u: Vec3 }, fov: number, size: { w: number; h: number }, time: number) {
  const absorb = p.absorb.map(v => v / Math.max(0.05, p.clarity)) as Vec3;
  return {
    f1: {
      uTanHalf: Math.tan(fov / 2), uAspect: size.w / size.h, uT: time, uLevel: p.level, uWaves: p.waves, uWindDir: p.windDir,
      uFoamW: p.foamWidth, uContact: p.contact, uCells: p.cells, uCaustics: p.caustics, uGrass: +p.grass,
      uRain: p.rain, uStreaks: +p.streaks, uSplash: +p.splashes,
      uTime: time, uCover: sky.cover, uDensity: sky.density, uExposure: sky.exposure,
    } as Record<string, number>,
    i1: { uStyle: p.style, uView: p.view, uModel: sky.model, uSolo: -1 } as Record<string, number>,
    v2: { uRes: [size.w, size.h] } as Record<string, number[]>,
    v3: { uCamPos: cam.pos, uCamF: cam.f, uCamR: cam.r, uCamU: cam.u, uAbsorb: absorb, uScatter: p.scatter, uSun: sunDirection(sky.sunEl, sky.sunAz) } as Record<string, number[]>,
    v4: { uLayers: [+sky.sun, +sky.stars, +sky.milky, +sky.clouds] } as Record<string, number[]>,
  };
}

export function applyShoreUniforms(gl: WebGL2RenderingContext, prog: WebGLProgram, u: ReturnType<typeof shoreUniforms>) {
  const loc = (n: string) => gl.getUniformLocation(prog, n);
  for (const [k, v] of Object.entries(u.f1)) gl.uniform1f(loc(k), v);
  for (const [k, v] of Object.entries(u.i1)) gl.uniform1i(loc(k), v);
  for (const [k, v] of Object.entries(u.v2)) gl.uniform2fv(loc(k), v);
  for (const [k, v] of Object.entries(u.v3)) gl.uniform3fv(loc(k), v);
  for (const [k, v] of Object.entries(u.v4)) gl.uniform4fv(loc(k), v);
}
