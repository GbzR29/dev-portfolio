// ── The Water Lab shader ──────────────────────────────────────────────────────
// One full-screen fragment shader: every pixel casts a ray from the camera,
// finds the Gerstner surface (a height-field march), and shades it with the
// terms the chapter builds one by one — Fresnel reflection of the procedural
// sky, refraction down to a sea bed with per-channel absorption, crest
// translucency, sun glints, foam where the surface folds (Jacobian) or meets
// the shore, and caustics on the bed. A stylised mode swaps the physically
// motivated terms for bands and hard edges.

import { PROC_SKY_GLSL, sunDirection, type SkyParams } from "../sky/proceduralSky";
import { norm, cross, type Vec3 } from "../../kit/gl/gl";

export const MAX_WAVES = 8;

export type WaterParams = {
  // waves
  amp: number;          // height of the longest wave (m)
  wavelength: number;   // longest wavelength (m)
  chop: number;         // Gerstner steepness Σ Q·A·k over all waves (crests fold where several line up)
  waves: number;        // 1 … MAX_WAVES
  windDir: number;      // degrees
  spread: number;       // 0 = all waves along the wind, 1 = wide spread
  detail: number;       // small ripples on the normal only
  // water
  absorb: Vec3;         // σa per metre, per channel
  scatter: Vec3;        // colour of light scattered back by the water body
  clarity: number;      // divides the absorption: higher = clearer
  depth: number;        // bed depth under the camera (m)
  slope: number;        // bed slope toward +X (a beach), 0 = flat
  bed: 0 | 1;           // 0 sand, 1 pool tiles
  // effects
  foam: number; foamEdge: number; shoreFoam: number;
  caustics: number; sss: number; glint: number;
  terms: { reflect: boolean; refract: boolean; sss: boolean; foam: boolean };
  view: number;         // 0 final, 1 normals, 2 Jacobian, 3 water thickness, 4 caustics, 5 Fresnel
  style: 0 | 1;         // 0 realistic, 1 stylised
  bands: number;
  camHeight: number;
  speed: number;
};

export const WATER_PRESETS: { id: string; label: string; water: Partial<WaterParams>; sky: Partial<SkyParams> }[] = [
  {
    id: "ocean", label: "Open ocean",
    water: { amp: 0.8, wavelength: 30, chop: 2.2, waves: 8, windDir: 20, spread: 0.55, detail: 0.6,
      absorb: [0.45, 0.075, 0.05], scatter: [0.0, 0.018, 0.045], clarity: 1, depth: 400, slope: 0, bed: 0,
      foam: 0.8, foamEdge: 0.8, shoreFoam: 0.6, caustics: 0.8, sss: 1, glint: 1, style: 0, camHeight: 4 },
    sky: { sunEl: 14, sunAz: 70, cover: 0.45, model: 1 },
  },
  {
    id: "lagoon", label: "Tropical lagoon",
    water: { amp: 0.12, wavelength: 9, chop: 0.8, waves: 7, windDir: -30, spread: 0.6, detail: 0.7,
      absorb: [0.32, 0.055, 0.06], scatter: [0.01, 0.07, 0.07], clarity: 1.4, depth: 3.5, slope: 0.08, bed: 0,
      foam: 0.6, foamEdge: 0.25, shoreFoam: 0.7, caustics: 1, sss: 0.8, glint: 1, style: 0, camHeight: 2.5 },
    sky: { sunEl: 55, sunAz: 150, cover: 0.3, model: 1, exposure: 1.0 },
  },
  {
    id: "pool", label: "Swimming pool",
    water: { amp: 0.025, wavelength: 2.2, chop: 0.5, waves: 6, windDir: 40, spread: 0.9, detail: 0.5,
      absorb: [0.3, 0.05, 0.04], scatter: [0.0, 0.03, 0.05], clarity: 2.5, depth: 1.8, slope: 0, bed: 1,
      foam: 0, foamEdge: 0.2, shoreFoam: 0, caustics: 1.4, sss: 0.3, glint: 0.8, style: 0, camHeight: 1.6 },
    sky: { sunEl: 62, sunAz: 30, cover: 0.2, model: 1, exposure: 1.0 },
  },
  {
    id: "storm", label: "Stormy sea",
    water: { amp: 2.2, wavelength: 55, chop: 3, waves: 8, windDir: 0, spread: 0.45, detail: 1,
      absorb: [0.5, 0.12, 0.1], scatter: [0.01, 0.03, 0.03], clarity: 0.7, depth: 400, slope: 0, bed: 0,
      foam: 1, foamEdge: 0.95, shoreFoam: 0.6, caustics: 0.5, sss: 1.2, glint: 0.5, style: 0, camHeight: 6 },
    sky: { sunEl: 9, sunAz: 40, cover: 0.9, model: 1 },
  },
  {
    id: "toon", label: "Stylised (toon)",
    water: { amp: 0.18, wavelength: 12, chop: 0.8, waves: 5, windDir: -20, spread: 0.6, detail: 0.3,
      absorb: [0.32, 0.055, 0.06], scatter: [0.01, 0.07, 0.07], clarity: 1.4, depth: 3.5, slope: 0.08, bed: 0,
      foam: 0.7, foamEdge: 0.3, shoreFoam: 0.8, caustics: 1, sss: 0.8, glint: 1, style: 1, bands: 4, camHeight: 3 },
    sky: { sunEl: 40, sunAz: 150, cover: 0.35, model: 0 },
  },
];

export const DEFAULT_WATER: WaterParams = {
  amp: 0.8, wavelength: 30, chop: 2.2, waves: 8, windDir: 20, spread: 0.55, detail: 0.6,
  absorb: [0.45, 0.075, 0.05], scatter: [0.0, 0.018, 0.045], clarity: 1, depth: 400, slope: 0, bed: 0,
  foam: 0.8, foamEdge: 0.8, shoreFoam: 0.6, caustics: 0.8, sss: 1, glint: 1,
  terms: { reflect: true, refract: true, sss: true, foam: true },
  view: 0, style: 0, bands: 4, camHeight: 4, speed: 1,
};

/** Water body colours: absorption per metre and scattered colour. */
export const WATER_COLOURS: { id: string; label: string; absorb: Vec3; scatter: Vec3 }[] = [
  { id: "ocean", label: "deep ocean", absorb: [0.45, 0.075, 0.05], scatter: [0.0, 0.03, 0.05] },
  { id: "tropical", label: "tropical", absorb: [0.32, 0.055, 0.06], scatter: [0.01, 0.07, 0.07] },
  { id: "lake", label: "green lake", absorb: [0.4, 0.1, 0.25], scatter: [0.025, 0.06, 0.025] },
  { id: "murky", label: "murky", absorb: [0.8, 0.6, 0.65], scatter: [0.06, 0.055, 0.035] },
];

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

/** Camera basis for a first-person look at (yaw, pitch). */
export function cameraBasis(yaw: number, pitch: number): { f: Vec3; r: Vec3; u: Vec3 } {
  const f = norm([Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)]);
  const r = norm(cross(f, [0, 1, 0]));
  return { f, r, u: cross(r, f) };
}

export const WATER_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;

uniform vec3  uCamPos, uCamF, uCamR, uCamU;
uniform float uTanHalf, uAspect;
uniform float uWaveTime;
uniform vec4  uWA[${MAX_WAVES}];   // dir.x, dir.z, k, A
uniform vec4  uWB[${MAX_WAVES}];   // omega, phase, Q, 0
uniform int   uN;
uniform float uHmax;
uniform float uDetail;
uniform vec3  uAbsorb, uScatter;
uniform float uDepth, uSlope;
uniform int   uBed;
uniform float uFoamAmt, uFoamEdge, uShoreFoam, uCaustics, uSSS, uGlint;
uniform vec4  uTerms;             // reflection, refraction, subsurface, foam
uniform int   uView, uStyle;
uniform float uBands;

${PROC_SKY_GLSL}

const float ETA = 1.0 / 1.333;     // air → water

// ── Gerstner surface ────────────────────────────────────────────────────────
// Horizontal displacement of the particle that rests at x0
vec2 displaceXZ(vec2 x0) {
  vec2 d = vec2(0.0);
  for (int i = 0; i < ${MAX_WAVES}; i++) {
    if (i >= uN) break;
    vec4 a = uWA[i], b = uWB[i];
    float th = a.z * dot(a.xy, x0) - b.x * uWaveTime + b.y;
    d += b.z * a.w * a.xy * cos(th);
  }
  return d;
}
// The rest position whose displaced point lands on x: solve x0 + D(x0) = x
vec2 restPos(vec2 x) {
  vec2 x0 = x;
  for (int j = 0; j < 3; j++) x0 = x - displaceXZ(x0);
  return x0;
}
float heightAtRest(vec2 x0) {
  float h = 0.0;
  for (int i = 0; i < ${MAX_WAVES}; i++) {
    if (i >= uN) break;
    vec4 a = uWA[i], b = uWB[i];
    h += a.w * sin(a.z * dot(a.xy, x0) - b.x * uWaveTime + b.y);
  }
  return h;
}
float heightAt(vec2 x) { return heightAtRest(restPos(x)); }

// Normal and Jacobian at a rest position, from the analytic derivatives
void surface(vec2 x0, out vec3 N, out float J) {
  vec3 T = vec3(1.0, 0.0, 0.0), B = vec3(0.0, 0.0, 1.0);
  float jxx = 1.0, jzz = 1.0, jxz = 0.0;
  for (int i = 0; i < ${MAX_WAVES}; i++) {
    if (i >= uN) break;
    vec4 a = uWA[i], b = uWB[i];
    float th = a.z * dot(a.xy, x0) - b.x * uWaveTime + b.y;
    float s = sin(th), c = cos(th);
    float qak = b.z * a.w * a.z, ak = a.w * a.z;
    T += vec3(-qak * a.x * a.x * s, ak * a.x * c, -qak * a.x * a.y * s);
    B += vec3(-qak * a.x * a.y * s, ak * a.y * c, -qak * a.y * a.y * s);
    jxx -= qak * a.x * a.x * s;
    jzz -= qak * a.y * a.y * s;
    jxz -= qak * a.x * a.y * s;
  }
  N = normalize(cross(B, T));
  J = jxx * jzz - jxz * jxz;
}

// Height-only (sine) Hessian of the same waves: used for caustics
mat2 hessian(vec2 x) {
  mat2 H = mat2(0.0);
  for (int i = 0; i < ${MAX_WAVES}; i++) {
    if (i >= uN) break;
    vec4 a = uWA[i], b = uWB[i];
    float s = sin(a.z * dot(a.xy, x) - b.x * uWaveTime + b.y);
    H -= a.w * a.z * a.z * s * outerProduct(a.xy, a.xy);
  }
  return H;
}

// Small ripples that only bend the normal (too small to trace)
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

vec3 ambientLight(vec3 sun) { return sky(vec3(0.0, 1.0, 0.0)) * 0.9 + sunLight(sun) * max(sun.y, 0.0) * 0.12; }

// Caustics: sunlight through a surface point lands on the bed shifted by
// d·(1 − η)·∇h, so an area element is scaled by det(I + d·(1 − η)·H).
// Intensity is the inverse of that area change.
float caustic(vec2 xz, float d) {
  mat2 M = mat2(1.0) + d * (1.0 - ETA) * hessian(xz);
  return 1.0 / max(abs(determinant(M)), 0.12);
}

// ── Main ────────────────────────────────────────────────────────────────────
void main() {
  vec3 sun = normalize(uSun);
  vec2 ndc = vUV * 2.0 - 1.0;
  vec3 rd = normalize(uCamF + uCamR * ndc.x * uTanHalf * uAspect + uCamU * ndc.y * uTanHalf);
  vec3 ro = uCamPos;
  vec3 L = sunLight(sun);
  // The sky model's sun is bright enough to read as a disc against the sky;
  // matte surfaces take a fraction of it so they share the sky's exposure.
  vec3 Ld = L * 0.18;

  // 1. March the ray against the height field between the slab |y| ≤ Hmax
  float tHit = -1.0;
  if (rd.y < 0.0) {
    float t0 = max((uHmax - ro.y) / rd.y, 0.0), t1 = min((-uHmax - ro.y) / rd.y, 600.0);
    float tPrev = t0, fPrev = ro.y + rd.y * t0 - heightAt(ro.xz + rd.xz * t0);
    for (int i = 1; i <= 48; i++) {
      float t = mix(t0, t1, pow(float(i) / 48.0, 1.6));    // denser steps near the camera
      float f = ro.y + rd.y * t - heightAt(ro.xz + rd.xz * t);
      if (f < 0.0) {
        float a = tPrev, b = t;                            // bisection on the crossing
        for (int k = 0; k < 6; k++) {
          float m = 0.5 * (a + b);
          if (ro.y + rd.y * m - heightAt(ro.xz + rd.xz * m) > 0.0) a = m; else b = m;
        }
        tHit = 0.5 * (a + b);
        break;
      }
      tPrev = t; fPrev = f;
    }
    if (tHit < 0.0 && t1 >= 600.0) tHit = -ro.y / rd.y;   // beyond the march: flat sea
  }
  float tBed = traceBed(ro, rd);

  vec3 col;
  if (tHit < 0.0 && tBed < 0.0) {
    col = sky(rd);                                         // looking at the sky
  } else if (tBed > 0.0 && (tHit < 0.0 || tBed < tHit)) {
    // Dry beach: sand, darker and wetter near the water line
    vec3 q = ro + rd * tBed;
    float wet = smoothstep(0.35, 0.0, q.y - heightAt(q.xz));
    vec3 alb = bedAlbedo(q) * mix(1.0, 0.55, wet);
    col = alb * (Ld * max(dot(bedNormal(q.x), sun), 0.0) + ambientLight(sun)) / PI;
    col = mix(col, sky(normalize(vec3(rd.x, 0.02, rd.z))), 1.0 - exp(-tBed / 350.0));
    if (uView == 0) { FragColor = vec4(display(col), 1.0); return; }
    FragColor = vec4(vec3(0.15), 1.0); return;
  } else {
    vec3 p = ro + rd * tHit;
    vec2 x0 = restPos(p.xz);
    vec3 N; float J;
    surface(x0, N, J);
    // Ripples fade with distance, before they turn into shimmering noise
    float fade = exp(-tHit / 45.0);
    vec2 rs = rippleSlope(p.xz) * uDetail * fade;
    N = normalize(N + vec3(-rs.x, 0.0, -rs.y));
    vec3 V = -rd;
    float NV = max(dot(N, V), 1e-3);
    float F = fresnel(NV);

    // Reflection: the sky in the mirrored direction (bounced off the water if it points down)
    vec3 R = reflect(rd, N); R.y = abs(R.y);
    vec3 refl = sky(R);

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
    vec3 bedLit = vec3(0.0);
    float caus = 1.0;
    float thick = 80.0;
    if (s > 0.0) {
      vec3 q = p + T * s;
      float above = max(heightAt(q.xz) - q.y, 0.0);      // water above the bed point
      thick = above;
      vec3 Ls = refract(-sun, vec3(0.0, 1.0, 0.0), ETA);   // sunlight inside the water
      vec3 sunIn = Ld * (1.0 - fresnel(max(sun.y, 0.0))) * exp(-uAbsorb * above / max(-Ls.y, 0.2));
      // Far away the caustic network is finer than a pixel: fade it to its average (1)
      caus = mix(1.0, caustic(q.xz, above), uCaustics * exp(-(tHit + s) / 25.0));
      bedLit = bedAlbedo(q) * (sunIn * max(dot(bedNormal(q.x), -Ls), 0.0) * caus + amb * 0.5) / PI;
    }
    vec3 refr = bedLit * trans + body;

    // Light passing through thin crests: brightest looking toward the sun
    float crest = clamp(p.y / max(uHmax, 1e-3) * 0.5 + 0.5, 0.0, 1.0);
    vec3 sss = uScatter * L * pow(max(dot(rd, sun) * 0.5 + 0.5, 0.0), 6.0) * crest * crest * uSSS * 1.5;

    // Foam: where the surface folds (J small) and where the water gets shallow
    float jf = smoothstep(uFoamEdge, uFoamEdge - 0.5, J);
    float shallow = max(p.y - bedY(p.x), 0.0);
    float lines = 0.5 + 0.5 * sin(shallow * 18.0 - uWaveTime * 1.6);
    float sf = uShoreFoam * smoothstep(0.45, 0.0, shallow) * (0.55 + 0.45 * lines);
    float breakup = smoothstep(0.35, 0.75, fbm2(p.xz * 2.2 + uWaveTime * 0.15) + 0.25 * fbm2(p.xz * 9.0));
    float foam = clamp((jf * uFoamAmt + sf) * breakup * 1.6, 0.0, 1.0) * uTerms.w;
    vec3 foamCol = vec3(0.9) * (Ld * max(dot(N, sun), 0.0) + amb) / PI;

    if (uStyle == 1) {
      // Stylised: colour bands by water thickness, hard foam lines, cel highlight
      float depthT = 1.0 - exp(-column * 0.25);
      float band = floor(depthT * uBands) / uBands;
      vec3 shallowC = vec3(0.35, 0.85, 0.8), deepC = vec3(0.02, 0.2, 0.42);
      vec3 base = mix(shallowC, deepC, band) * (0.55 + 0.45 * step(0.3, dot(N, sun)));
      base = mix(base, srgb(vec3(0.72, 0.86, 0.95)), step(0.55, F) * 0.35);
      float ring = step(0.7, fract(shallow * 3.0 - uWaveTime * 0.4)) * step(shallow, 0.9);
      float edge = step(shallow, 0.12);
      float tf = max(max(ring, edge) * uShoreFoam, step(0.55, jf * uFoamAmt * breakup)) * uTerms.w;
      col = srgb(base) * 1.2;
      col += step(0.985, dot(N, Hv)) * uGlint * 3.0;
      col = mix(col, vec3(1.1), clamp(tf, 0.0, 1.0));
    } else {
      col = mix(refr * uTerms.y, refl * uTerms.x, F) + glint * L;
      col += sss * uTerms.z;
      col = mix(col, foamCol, foam);
    }
    // Far water fades into the horizon haze
    col = mix(col, sky(normalize(vec3(rd.x, 0.015, rd.z))), 1.0 - exp(-tHit / 450.0));

    if (uView == 1) { FragColor = vec4(N * 0.5 + 0.5, 1.0); return; }
    if (uView == 2) { FragColor = vec4(J < 0.0 ? vec3(1.0, 0.1, 0.1) : vec3(clamp(J, 0.0, 1.5) / 1.5), 1.0); return; }
    if (uView == 3) { float v = 1.0 - exp(-column * 0.15); FragColor = vec4(vec3(v) * vec3(0.4, 0.8, 1.0), 1.0); return; }
    if (uView == 4) { FragColor = vec4(vec3(caus * 0.35), 1.0); return; }
    if (uView == 5) { FragColor = vec4(vec3(pow(F, 1.0 / 2.2)), 1.0); return; }
  }
  FragColor = vec4(display(col), 1.0);
}`;

/** Every uniform the water shader reads (the sky's included), ready to upload. */
export function waterUniforms(p: WaterParams, sky: SkyParams, look: { yaw: number; pitch: number; fov: number }, aspect: number, time: number) {
  const { a, b, n, hmax } = waveSet(p);
  const { f, r, u } = cameraBasis(look.yaw, look.pitch);
  const absorb = p.absorb.map(v => v / Math.max(0.05, p.clarity)) as Vec3;
  return {
    f1: {
      uTanHalf: Math.tan(look.fov / 2), uAspect: aspect, uWaveTime: time * p.speed, uHmax: hmax * (1 + p.chop * 0.2) + 0.01,
      uDetail: p.detail, uDepth: p.depth, uSlope: p.slope, uFoamAmt: p.foam, uFoamEdge: p.foamEdge,
      uShoreFoam: p.shoreFoam, uCaustics: p.caustics, uSSS: p.sss, uGlint: p.glint, uBands: p.bands,
      uTime: time, uCover: sky.cover, uDensity: sky.density, uExposure: sky.exposure,
    } as Record<string, number>,
    i1: { uN: n, uBed: p.bed, uView: p.view, uStyle: p.style, uModel: sky.model, uSolo: -1 } as Record<string, number>,
    v3: {
      uCamPos: [0, p.camHeight, 0], uCamF: f, uCamR: r, uCamU: u, uAbsorb: absorb, uScatter: p.scatter,
      uSun: sunDirection(sky.sunEl, sky.sunAz),
    } as Record<string, Vec3 | number[]>,
    v4: {
      uTerms: [+p.terms.reflect, +p.terms.refract, +p.terms.sss, +p.terms.foam],
      uLayers: [+sky.sun, +sky.stars, +sky.milky, +sky.clouds],
    } as Record<string, number[]>,
    arrays: { uWA: a, uWB: b },
  };
}

export function applyUniforms(gl: WebGL2RenderingContext, prog: WebGLProgram, u: ReturnType<typeof waterUniforms>) {
  const loc = (n: string) => gl.getUniformLocation(prog, n);
  for (const [k, v] of Object.entries(u.f1)) gl.uniform1f(loc(k), v);
  for (const [k, v] of Object.entries(u.i1)) gl.uniform1i(loc(k), v);
  for (const [k, v] of Object.entries(u.v3)) gl.uniform3fv(loc(k), v as number[]);
  for (const [k, v] of Object.entries(u.v4)) gl.uniform4fv(loc(k), v);
  for (const [k, v] of Object.entries(u.arrays)) gl.uniform4fv(loc(`${k}[0]`), v);
}
