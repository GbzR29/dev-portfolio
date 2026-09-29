// ── Shading shared by every water surface ─────────────────────────────────────
// Whatever produces the waves (a sum of Gerstner waves, an FFT ocean), the
// light that leaves the surface is the same: Fresnel mixes the reflected sky
// with the refracted view of the bed, Beer–Lambert colours what comes up
// through the water, crests glow toward the sun, glints sparkle, foam covers
// the folds and the shore, and caustics light the bed. This module holds those
// terms, the sea bed (a flat bottom that ramps up to a beach) and the uniforms
// that drive them.
//
// A shader that includes WATER_COMMON_GLSL must include PROC_SKY_GLSL before it
// and define the two functions it declares: waterHeight (the surface height
// above a world point) and causticAt (the caustic intensity on the bed).
// The sky it reflects comes from the sky probe (skyProbe.ts), bound by the caller.

import { sunDirection, type SkyParams } from "../sky/proceduralSky";
import type { Vec3 } from "../../kit/gl/gl";
import { PHOTO_GLSL } from "./photoTextures";
import { SKY_ENV_GLSL } from "./skyProbe";
import type { WaterParams } from "./waterParams";

export const WATER_COMMON_GLSL = `
${SKY_ENV_GLSL}
uniform vec3  uCamPos;
uniform float uWaveTime;
uniform float uHmax;
uniform float uDetail;
uniform vec3  uAbsorb, uScatter;
uniform float uDepth, uSlope;
uniform int   uBed;
uniform float uFoamAmt, uFoamEdge, uShoreFoam, uCaustics, uSSS, uGlint;
uniform vec4  uTerms;             // reflection, refraction, subsurface, foam
uniform int   uView, uStyle;
uniform float uBands;
// Photo textures for the bed; uHave = (sand, pool tiles) loaded
uniform sampler2D uSandA, uSandN, uSandAO, uPoolA, uPoolN;
uniform vec2  uHave;
uniform float uPix;               // world size of one pixel at distance 1

const float ETA = 1.0 / 1.333;     // air → water

float waterHeight(vec2 x);         // defined by the wave source
float causticAt(vec2 x, float d);  // likewise: caustic intensity d metres below the surface

// ── Sea bed ─────────────────────────────────────────────────────────────────
// Flat bottom for x ≤ 0, a ramp up to a beach, then a flat top 1.2 m above the sea
const float BEACH = 1.2;
float beachStart() { return uSlope > 0.0 ? (uDepth + BEACH) / uSlope : 1e9; }
float bedY(float x) { return min(-uDepth + uSlope * max(x, 0.0), BEACH); }
vec3 bedNormal(float x) { return (x > 0.0 && x < beachStart()) ? normalize(vec3(-uSlope, 1.0, 0.0)) : vec3(0.0, 1.0, 0.0); }
// Distance along o + t·d to the bed, or -1: the nearest valid hit of its three planes
float traceBed(vec3 o, vec3 d) {
  float best = 1e9, xt = beachStart();
  float t = (-uDepth - o.y) / d.y;                       // the flat bottom
  if (t > 0.0 && o.x + t * d.x <= 0.0) best = t;
  float den = d.y - uSlope * d.x;                        // the ramp: y = -depth + slope·x
  if (abs(den) > 1e-6) {
    t = (-uDepth + uSlope * o.x - o.y) / den;
    float x = o.x + t * d.x;
    if (t > 0.0 && x > 0.0 && x < xt) best = min(best, t);
  }
  t = (BEACH - o.y) / d.y;                               // the beach top
  if (t > 0.0 && o.x + t * d.x >= xt) best = min(best, t);
  return best < 1e8 ? best : -1.0;
}
${PHOTO_GLSL}
const float SAND_TILE = 2.2, POOL_TILE = 1.2;
vec3 bedAlbedo(vec3 q);                                  // procedural fallback, below
// The bed's colour at q, seen dist metres along the ray; bends n by the
// normal map and writes the ambient occlusion (1 without a map)
vec3 bedSurface(vec3 q, float dist, inout vec3 n, out float ao) {
  ao = 1.0;
  if (uBed == 1 && uHave.y > 0.5) {
    vec2 uv = planarUV(q, POOL_TILE);
    float lod = lodFor(dist, POOL_TILE, n);
    n = bumped(n, uPoolN, uv, lod);
    return srgbTex(uPoolA, uv, lod);
  }
  if (uBed == 0 && uHave.x > 0.5) {
    vec2 uv = planarUV(q, SAND_TILE);
    float lod = lodFor(dist, SAND_TILE, n);
    n = bumped(n, uSandN, uv, lod);
    ao = textureLod(uSandAO, uv, lod).r;
    return srgbTex(uSandA, uv, lod) * (0.82 + 0.3 * fbm2(q.xz * 0.35));   // break up the tiling far away
  }
  return bedAlbedo(q);
}
// Procedural fallbacks, used until (or unless) the photo textures load
vec3 bedAlbedo(vec3 q) {
  if (uBed == 1) {
    vec2 g = abs(fract(q.xz * 1.6) - 0.5);
    float grout = smoothstep(0.46, 0.49, max(g.x, g.y));
    vec3 tile = mix(vec3(0.3, 0.58, 0.72), vec3(0.42, 0.68, 0.8), step(0.5, fract(floor(q.x * 1.6) * 0.5 + floor(q.z * 1.6) * 0.5)));
    return mix(tile, vec3(0.12, 0.22, 0.3), grout);
  }
  float n = fbm2(q.xz * 1.5) * 0.6 + fbm2(q.xz * 14.0) * 0.4;
  return mix(vec3(0.62, 0.55, 0.4), vec3(0.86, 0.8, 0.64), n);
}

// ── Lighting helpers ────────────────────────────────────────────────────────
float fresnel(float cosT) { return 0.02 + 0.98 * pow(1.0 - cosT, 5.0); }
float ggx(float nh, float a) { float a2 = a * a; float d = nh * nh * (a2 - 1.0) + 1.0; return a2 / (PI * d * d); }
// Light from the whole sky above: a blurred look straight up, plus a little sun
vec3 ambientLight(vec3 sun) { return skyEnv(vec3(0.0, 1.0, 0.0), 4.0) * 0.9 + sunLight(sun) * max(sun.y, 0.0) * 0.12; }
// The haze colour at the horizon in the direction of d
vec3 horizonHaze(vec3 d, float y) { return skyEnv(vec3(d.x, y, d.z), 1.0); }
// The sky model's sun is bright enough to read as a disc against the sky;
// matte surfaces take a fraction of it so they share the sky's exposure.
vec3 matteSun(vec3 sun) { return sunLight(sun) * 0.18; }

// Small ripples that only bend the normal (too small to be geometry)
vec2 rippleSlope(vec2 p) {
  vec2 g = vec2(0.0);
  float amp = 0.035, f = 1.7;
  for (int i = 0; i < 5; i++) {
    float an = float(i) * 2.39996;
    vec2 d = vec2(cos(an), sin(an));
    float th = dot(d, p) * f + uWaveTime * sqrt(9.81 * f) * 0.9 + float(i) * 1.7;
    g += d * cos(th) * amp * f;
    f *= 1.83; amp *= 0.62;
  }
  return g;
}

// ── The dry beach, seen directly (the background pass) ──────────────────────
vec3 shadeBeach(vec3 rd, float tBed) {
  vec3 sun = normalize(uSun);
  vec3 q = uCamPos + rd * tBed;
  float wet = smoothstep(0.35, 0.0, q.y - waterHeight(q.xz));   // darker and wetter near the water line
  vec3 nb = bedNormal(q.x);
  float ao;
  vec3 alb = bedSurface(q, tBed, nb, ao) * mix(1.0, 0.55, wet);
  vec3 col = alb * (matteSun(sun) * max(dot(nb, sun), 0.0) * mix(1.0, ao, 0.5) + ambientLight(sun) * ao) / PI;
  col = mix(col, horizonHaze(rd, 0.02), 1.0 - exp(-tBed / 350.0));
  return uView == 0 ? display(col) : vec3(0.15);
}

// ── The water surface ───────────────────────────────────────────────────────
// p: the surface point; N: its normal (with ripples); J: the Jacobian
// determinant of the horizontal displacement; crest: 0 in troughs … 1 on
// crests; foam: the source's crest foam, already patterned (0 … 1);
// bubbles: air mixed into the water under the foam, which scatters light
// back up and lightens the water (0 … 1). Returns the displayed colour, or
// the selected debug view.
vec3 shadeWater(vec3 p, vec3 N, float J, float crest, float foam, float bubbles, vec3 rd) {
  vec3 sun = normalize(uSun);
  vec3 L = sunLight(sun), Ld = matteSun(sun);
  float dist = length(p - uCamPos);
  float fade = exp(-dist / 45.0);
  vec3 V = -rd;
  float NV = max(dot(N, V), 1e-3);
  float F = fresnel(NV);

  // Reflection: the sky in the mirrored direction (bounced off the water if it points down)
  vec3 R = reflect(rd, N); R.y = abs(R.y);
  vec3 refl = skyEnv(R, 0.0);

  // Sun glint: a sharp microfacet lobe on the rippled normal
  vec3 Hv = normalize(sun + V);
  float glint = ggx(max(dot(N, Hv), 0.0), 0.06 + 0.1 * (1.0 - fade)) * F * max(dot(N, sun), 0.0) / (4.0 * NV) * uGlint;

  // Refraction: follow the bent ray to the bed through the water
  vec3 T = refract(rd, N, ETA);
  float s = traceBed(p, T);
  float column = s > 0.0 ? min(s, 80.0) : 80.0;
  vec3 trans = exp(-uAbsorb * column);                 // Beer–Lambert, per channel
  vec3 amb = ambientLight(sun);
  vec3 body = uScatter * amb * 3.0 * (1.0 - trans);    // light scattered back up by the water
  // Bubbles scatter white light; what comes back up has crossed some water, so it is tinted
  body += bubbles * amb * exp(-uAbsorb * 1.5) * 0.35;
  vec3 bedLit = vec3(0.0);
  float caus = 1.0;
  if (s > 0.0) {
    vec3 q = p + T * s;
    float above = max(waterHeight(q.xz) - q.y, 0.0);   // water above the bed point
    vec3 Ls = refract(-sun, vec3(0.0, 1.0, 0.0), ETA); // sunlight inside the water
    vec3 sunIn = Ld * (1.0 - fresnel(max(sun.y, 0.0))) * exp(-uAbsorb * above / max(-Ls.y, 0.2));
    // Far away the caustic network is finer than a pixel: fade it to its average (1)
    caus = mix(1.0, causticAt(q.xz, above), uCaustics * exp(-(dist + s) / 25.0));
    vec3 nb = bedNormal(q.x);
    float ao;
    vec3 alb = bedSurface(q, dist + s, nb, ao);
    bedLit = alb * (sunIn * max(dot(nb, -Ls), 0.0) * caus * mix(1.0, ao, 0.5) + amb * 0.5 * ao) / PI;
  }
  vec3 refr = bedLit * trans + body;

  // Light passing through thin crests: brightest looking toward the sun
  vec3 sss = uScatter * L * pow(max(dot(rd, sun) * 0.5 + 0.5, 0.0), 6.0) * crest * crest * uSSS * 1.5;

  // Foam: the source's crest foam, plus foam where the water gets shallow
  float shallow = max(p.y - bedY(p.x), 0.0);
  float sf = 0.0;
  if (uShoreFoam > 0.0) {
    float lines = 0.5 + 0.5 * sin(shallow * 18.0 - uWaveTime * 1.6);
    float breakup = smoothstep(0.35, 0.75, fbm2(p.xz * 2.2 + uWaveTime * 0.15) + 0.25 * fbm2(p.xz * 9.0));
    sf = uShoreFoam * smoothstep(0.45, 0.0, shallow) * (0.55 + 0.45 * lines) * breakup * 1.6;
  }
  float crestFoam = foam;
  foam = clamp(foam + sf, 0.0, 1.0) * uTerms.w;
  vec3 foamCol = vec3(0.9) * (Ld * max(dot(N, sun), 0.0) + amb) / PI;

  vec3 col;
  if (uStyle == 1) {
    // Stylised: colour bands by water thickness, hard foam lines, cel highlight
    float depthT = 1.0 - exp(-column * 0.25);
    float band = floor(depthT * uBands) / uBands;
    vec3 shallowC = vec3(0.35, 0.85, 0.8), deepC = vec3(0.02, 0.2, 0.42);
    vec3 base = mix(shallowC, deepC, band) * (0.55 + 0.45 * step(0.3, dot(N, sun)));
    base = mix(base, srgb(vec3(0.72, 0.86, 0.95)), step(0.55, F) * 0.35);
    float ring = step(0.7, fract(shallow * 3.0 - uWaveTime * 0.4)) * step(shallow, 0.9);
    float edge = step(shallow, 0.12);
    float tf = max(max(ring, edge) * uShoreFoam, step(0.88, crestFoam)) * uTerms.w;
    col = srgb(base) * 1.2;
    col += step(0.985, dot(N, Hv)) * uGlint * 3.0;
    col = mix(col, vec3(1.1), clamp(tf, 0.0, 1.0));
  } else {
    col = mix(refr * uTerms.y, refl * uTerms.x, F) + glint * L;
    col += sss * uTerms.z;
    col = mix(col, foamCol, foam);
  }
  // Far water fades into the horizon haze
  col = mix(col, horizonHaze(rd, 0.015), 1.0 - exp(-dist / 450.0));

  if (uView == 1) return N * 0.5 + 0.5;
  if (uView == 2) return J < 0.0 ? vec3(1.0, 0.1, 0.1) : vec3(clamp(J, 0.0, 1.5) / 1.5);
  if (uView == 3) return vec3(1.0 - exp(-column * 0.15)) * vec3(0.4, 0.8, 1.0);
  if (uView == 4) return vec3(caus * 0.35);
  if (uView == 5) return vec3(pow(F, 1.0 / 2.2));
  return display(col);
}
`;

// ── Uniforms ──────────────────────────────────────────────────────────────────
export type UniformSet = {
  f1: Record<string, number>;
  i1: Record<string, number>;
  v3: Record<string, Vec3 | number[]>;
  v4: Record<string, number[]>;
  arrays?: Record<string, Float32Array>;
  m4?: Record<string, Float32Array>;
};

/** The uniforms WATER_COMMON_GLSL and the procedural sky read. */
export function commonUniforms(p: WaterParams, sky: SkyParams, camPos: Vec3, time: number, hmax: number): UniformSet {
  const absorb = p.absorb.map(v => v / Math.max(0.05, p.clarity)) as Vec3;
  return {
    f1: {
      uWaveTime: time * p.speed, uHmax: hmax,
      uDetail: p.detail, uDepth: p.depth, uSlope: p.slope, uFoamAmt: p.foam, uFoamEdge: p.foamEdge,
      uShoreFoam: p.shoreFoam, uCaustics: p.caustics, uSSS: p.sss, uGlint: p.glint, uBands: p.bands,
      uTime: time, uCover: sky.cover, uDensity: sky.density, uExposure: sky.exposure,
    },
    i1: { uBed: p.bed, uView: p.view, uStyle: p.style, uModel: sky.model, uSolo: -1 },
    v3: { uCamPos: camPos, uAbsorb: absorb, uScatter: p.scatter, uSun: sunDirection(sky.sunEl, sky.sunAz) },
    v4: {
      uTerms: [+p.terms.reflect, +p.terms.refract, +p.terms.sss, +p.terms.foam],
      uLayers: [+sky.sun, +sky.stars, +sky.milky, +sky.clouds],
    },
  };
}

/** The procedural sky's uniforms alone (for a sky probe or a background pass). */
export function skyUniforms(sky: SkyParams, time: number): UniformSet {
  return {
    f1: { uTime: time, uCover: sky.cover, uDensity: sky.density, uExposure: sky.exposure },
    i1: { uModel: sky.model, uSolo: -1 },
    v3: { uSun: sunDirection(sky.sunEl, sky.sunAz) },
    v4: { uLayers: [+sky.sun, +sky.stars, +sky.milky, +sky.clouds] },
  };
}

// Uniform locations are looked up once per program and name, not every frame
const locCache = new WeakMap<WebGLProgram, Map<string, WebGLUniformLocation | null>>();
export function uniformLoc(gl: WebGL2RenderingContext, prog: WebGLProgram, name: string) {
  let m = locCache.get(prog);
  if (!m) { m = new Map(); locCache.set(prog, m); }
  if (!m.has(name)) m.set(name, gl.getUniformLocation(prog, name));
  return m.get(name)!;
}

/** Uploads a set (or several) to the bound program; names it does not use are skipped. */
export function applyUniforms(gl: WebGL2RenderingContext, prog: WebGLProgram, ...sets: UniformSet[]) {
  const loc = (n: string) => uniformLoc(gl, prog, n);
  for (const u of sets) {
    for (const [k, v] of Object.entries(u.f1)) gl.uniform1f(loc(k), v);
    for (const [k, v] of Object.entries(u.i1)) gl.uniform1i(loc(k), v);
    for (const [k, v] of Object.entries(u.v3)) gl.uniform3fv(loc(k), v as number[]);
    for (const [k, v] of Object.entries(u.v4)) gl.uniform4fv(loc(k), v);
    for (const [k, v] of Object.entries(u.arrays ?? {})) gl.uniform4fv(loc(`${k}[0]`), v);
    for (const [k, v] of Object.entries(u.m4 ?? {})) gl.uniformMatrix4fv(loc(k), false, v);
  }
}
