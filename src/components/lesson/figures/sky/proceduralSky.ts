// ── A layered procedural sky ──────────────────────────────────────────────────
// One function, sky(dir), built from independent layers that the chapter
// explains one at a time: a base sky (an artist gradient or a Rayleigh + Mie
// single-scattering approximation), the sun disc and halo, stars, the Milky
// Way band and a layer of 2D clouds. Everything is radiance in linear units;
// the caller tone maps and gamma-encodes once at the end.

import type { Vec3 } from "../../kit/gl/gl";

export type SkyParams = {
  sunEl: number;        // degrees above the horizon
  sunAz: number;        // degrees, 0 = looking down −Z, positive toward +X
  model: 0 | 1;         // 0 gradient, 1 Rayleigh + Mie
  sun: boolean; stars: boolean; milky: boolean; clouds: boolean;
  cover: number;        // cloud coverage 0…1
  density: number;      // star density 0…1
  exposure: number;
  time: number;         // seconds, drives cloud drift and twinkle
  solo: number;         // −1 everything, 0 base, 1 sun, 2 stars, 3 Milky Way, 4 clouds
};

export const DEFAULT_SKY_PARAMS: SkyParams = {
  sunEl: 18, sunAz: 55, model: 1, sun: true, stars: true, milky: true, clouds: true,
  cover: 0.5, density: 0.5, exposure: 1.6, time: 0, solo: -1,
};

/** Unit vector toward the sun from elevation and azimuth in degrees. */
export function sunDirection(el: number, az: number): Vec3 {
  const e = (el * Math.PI) / 180, a = (az * Math.PI) / 180;
  return [Math.cos(e) * Math.sin(a), Math.sin(e), -Math.cos(e) * Math.cos(a)];
}

export const PROC_SKY_GLSL = `
uniform vec3  uSun;
uniform float uTime;
uniform int   uModel;
uniform vec4  uLayers;      // sun, stars, Milky Way, clouds (1 = on)
uniform float uCover;
uniform float uDensity;
uniform float uExposure;
uniform int   uSolo;

const float PI = 3.14159265;

// ── Hash and noise ──────────────────────────────────────────────────────────
float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
vec3 hash33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}
float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), u.x),
                 mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), u.x), u.y),
             mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), u.x),
                 mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), u.x), u.y), u.z);
}
float fbm3(vec3 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * noise3(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return s;
}
float fbm2(vec2 p) {
  float s = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 6; i++) { s += a * noise3(vec3(p, 0.5)); p = r * p * 2.02 + 3.7; a *= 0.5; }
  return s;
}

// ── Scattering helpers ──────────────────────────────────────────────────────
// Path length through a flat slab of air, in units of its thickness: 1/cos θ,
// with a small offset so the horizon gives ~40 instead of infinity.
float airMass(float y) { return 1.0 / (max(y, 0.0) + 0.025); }
// Rayleigh phase: scattering is a little stronger forward and backward
float phaseRayleigh(float mu) { return 3.0 / (16.0 * PI) * (1.0 + mu * mu); }
// Henyey–Greenstein phase: g > 0 throws light forward (haze glows around the sun)
float phaseHG(float mu, float g) {
  float d = 1.0 + g * g - 2.0 * g * mu;
  return (1.0 - g * g) / (4.0 * PI * d * sqrt(d));
}
// Scattering per unit of air for the three channels. Rayleigh ∝ 1/λ⁴, taken
// at λ = 700, 530, 400 nm: (400/700)⁴ ≈ 0.107, (400/530)⁴ ≈ 0.324.
const vec3 BETA_R = vec3(0.035, 0.107, 0.33);
const float BETA_M = 0.012;                        // haze: grey, much weaker
// Ozone absorbs orange and green (it scatters nothing): it keeps twilight blue
const vec3 BETA_O = vec3(0.021, 0.06, 0.003);

// Light the sun delivers into the air, after crossing it at its own elevation.
// Below the horizon the Earth's shadow switches it off over a few degrees.
// "thin" scales the air it crosses: 1 at the ground, less for air higher up.
vec3 sunLight(vec3 sun, float thin) {
  float shadow = smoothstep(-0.12, 0.02, sun.y);
  return 20.0 * exp(-(BETA_R + BETA_M + BETA_O) * airMass(sun.y + 0.03) * thin) * shadow * shadow;
}
vec3 sunLight(vec3 sun) { return sunLight(sun, 1.0); }

vec3 srgb(vec3 c) { return pow(c, vec3(2.2)); }   // artist colours → linear

// ── Layers ──────────────────────────────────────────────────────────────────
vec3 baseSky(vec3 d, vec3 sun) {
  float mu = dot(d, sun);
  if (uModel == 0) {
    // Artist gradient: two colours and a curve, warmed near the horizon at dusk
    float day = smoothstep(-0.25, 0.35, sun.y);
    float dusk = exp(-pow(sun.y * 5.0, 2.0));
    vec3 zenith  = mix(vec3(0.02, 0.03, 0.08), vec3(0.18, 0.40, 0.78), day);
    vec3 horizon = mix(vec3(0.05, 0.07, 0.15), vec3(0.78, 0.86, 0.94), day);
    float toSun = max(dot(normalize(d.xz + 1e-5), normalize(sun.xz + 1e-5)), 0.0);
    horizon = mix(horizon, vec3(1.0, 0.45, 0.2), dusk * (0.35 + 0.65 * toSun));
    return srgb(mix(horizon, zenith, pow(max(d.y, 0.0), 0.45))) * 1.4;
  }
  // Single scattering in a uniform slab: of the light the sun delivers, the
  // fraction 1 − e^(−β m) scatters somewhere along the view path, weighted by
  // how much of it turns toward the eye (the phase function).
  // Looking up, the air that scatters toward us sits higher, where the
  // sunlight reaching it has crossed less air: roughly e^(−3y) as much.
  vec3 L = sunLight(sun, 0.25 + 0.75 * exp(-3.0 * max(d.y, 0.0)));
  float m = airMass(d.y);
  vec3 rayleigh = (1.0 - exp(-BETA_R * m)) * phaseRayleigh(mu);
  vec3 mie = (1.0 - exp(-BETA_M * m)) * vec3(phaseHG(mu, 0.8));
  vec3 night = vec3(0.0015, 0.0025, 0.006);              // airglow + starlight floor
  return L * (rayleigh + mie) + night;
}

vec3 sunDisc(vec3 d, vec3 sun) {
  float mu = dot(d, sun);
  const float R = 0.0122;                                 // 0.7°: the real sun is 0.27°
  float disc = smoothstep(cos(R * 1.15), cos(R), mu);
  vec3 col = uModel == 0 ? srgb(mix(vec3(1.0, 0.55, 0.25), vec3(1.0, 0.97, 0.9), smoothstep(-0.05, 0.3, sun.y))) * 20.0
                         : sunLight(sun);
  float glow = uModel == 0 ? pow(max(mu, 0.0), 300.0) * 0.8 + pow(max(mu, 0.0), 8.0) * 0.08 : 0.0;
  return col * (disc * 4.0 + glow) * step(-0.02, d.y);
}

float nightFactor(vec3 sun) { return 1.0 - smoothstep(-0.18, 0.04, sun.y); }

vec3 stars(vec3 d, vec3 sun) {
  // Cut the sphere into cells, drop at most one star in each
  vec3 p = d * 70.0;
  vec3 cell = floor(p);
  float h = hash13(cell);
  if (h > uDensity * 0.35) return vec3(0.0);
  vec3 c = cell + 0.5 + (hash33(cell) - 0.5) * 0.6;       // jitter inside the cell
  float r = length(p - c);
  float mag = pow(hash13(cell + 7.1), 6.0);               // most stars are faint
  float core = exp(-r * r * 90.0) * (0.3 + 6.0 * mag);
  float twinkle = 0.75 + 0.25 * sin(uTime * (2.0 + 6.0 * h) + h * 60.0);
  vec3 tint = mix(vec3(0.75, 0.82, 1.0), vec3(1.0, 0.85, 0.65), hash13(cell + 3.3));
  float extinction = smoothstep(0.0, 0.25, d.y);          // thick air near the horizon
  return tint * core * twinkle * extinction * nightFactor(sun);
}

vec3 milkyWay(vec3 d, vec3 sun) {
  // A band around the great circle whose plane has normal G
  const vec3 G = normalize(vec3(0.35, 0.55, 0.76));
  const vec3 CORE = normalize(vec3(0.8, 0.25, -0.55));    // toward the galactic centre
  float x = dot(d, G);                                    // sin of the angle off the plane
  float band = exp(-x * x / (2.0 * 0.12 * 0.12));
  float core = exp(-pow(acos(clamp(dot(d, CORE), -1.0, 1.0)) / 0.9, 2.0));
  float clump = fbm3(d * 6.0);
  // A dark dust lane along the middle of the band, ragged at finer scale
  float lane = exp(-pow((x - 0.02) / 0.07, 2.0));
  float dust = 1.0 - 0.6 * lane * (0.35 + 0.65 * smoothstep(0.35, 0.7, fbm3(d * 7.0 + 5.0)));
  vec3 col = mix(vec3(0.55, 0.6, 0.85), vec3(1.0, 0.85, 0.65), core);
  float extinction = smoothstep(0.0, 0.3, d.y);
  return col * band * (0.2 + 0.8 * clump) * dust * (0.12 + 0.4 * core) * extinction * nightFactor(sun);
}

// Clouds on a flat layer at height 1: returns colour and coverage (alpha)
vec4 clouds(vec3 d, vec3 sun, vec3 behind) {
  if (d.y < 0.01) return vec4(0.0);
  float t = 1.0 / d.y;                                    // ray reaches the layer at y = 1
  vec2 p = d.xz * t * 0.7 + vec2(uTime * 0.02, uTime * 0.007);
  float n = fbm2(p);
  // fbm2 mostly lands in 0.3…0.75: coverage slides the threshold across that range
  float edge = mix(0.7, 0.3, uCover);
  float dens = smoothstep(edge, edge + 0.2, n);
  // One step toward the sun: denser there means this point is in shadow
  vec2 toSun = normalize(sun.xz + 1e-5) * 0.12;
  float n2 = fbm2(p + toSun);
  float lit = exp(-max(n2 - n + 0.05, 0.0) * 8.0);
  vec3 sunCol = uModel == 0 ? srgb(mix(vec3(1.0, 0.6, 0.35), vec3(1.0), smoothstep(0.0, 0.4, sun.y))) * 3.0
                            : sunLight(sun) * 0.15;
  vec3 ambient = behind * 0.6 + vec3(0.02);
  float silver = phaseHG(dot(d, sun), 0.6) * 2.0;         // bright rims looking toward the sun
  vec3 col = ambient + sunCol * (lit * 0.6 + silver * lit) * max(smoothstep(-0.15, 0.1, sun.y), 0.05);
  // Thick cloud lets little light through to its underside
  col *= 1.0 - 0.65 * smoothstep(0.0, 0.3, n - edge);
  float fade = exp(-t * 0.12);                            // far clouds dissolve into the haze
  return vec4(col, dens * fade);
}

vec3 ground(vec3 d, vec3 sun, vec3 horizon) {
  float day = smoothstep(-0.2, 0.3, sun.y);
  vec3 g = srgb(vec3(0.22, 0.25, 0.22)) * (0.03 + 1.2 * day);
  return mix(g, horizon, pow(1.0 - min(1.0, -d.y * 4.0), 3.0));
}

vec3 sky(vec3 d) {
  d = normalize(d);
  vec3 sun = normalize(uSun);
  vec3 base = baseSky(d, sun);
  if (d.y < 0.0) {
    vec3 h = baseSky(normalize(vec3(d.x, 0.0, d.z)), sun);
    return uSolo <= 0 ? ground(d, sun, h) : vec3(0.0);
  }
  vec3 s = uLayers.x > 0.5 ? sunDisc(d, sun) : vec3(0.0);
  vec3 st = uLayers.y > 0.5 ? stars(d, sun) : vec3(0.0);
  vec3 mw = uLayers.z > 0.5 ? milkyWay(d, sun) : vec3(0.0);
  vec3 behind = base + st + mw;
  vec4 cl = uLayers.w > 0.5 ? clouds(d, sun, base) : vec4(0.0);
  if (uSolo == 0) return base;
  if (uSolo == 1) return s;
  if (uSolo == 2) return st;
  if (uSolo == 3) return mw * 6.0;
  if (uSolo == 4) return cl.rgb * cl.a;
  // Clouds cover whatever is behind them, the sun included
  return mix(behind + s, cl.rgb, cl.a);
}

// Radiance → display: exponential tone map, then gamma
vec3 display(vec3 c) { return pow(1.0 - exp(-c * uExposure), vec3(1.0 / 2.2)); }
`;

/** Sets every uniform PROC_SKY_GLSL reads. */
export function setSkyUniforms(gl: WebGL2RenderingContext, prog: WebGLProgram, p: SkyParams) {
  const u = (n: string) => gl.getUniformLocation(prog, n);
  gl.uniform3fv(u("uSun"), sunDirection(p.sunEl, p.sunAz));
  gl.uniform1f(u("uTime"), p.time);
  gl.uniform1i(u("uModel"), p.model);
  gl.uniform4f(u("uLayers"), +p.sun, +p.stars, +p.milky, +p.clouds);
  gl.uniform1f(u("uCover"), p.cover);
  gl.uniform1f(u("uDensity"), p.density);
  gl.uniform1f(u("uExposure"), p.exposure);
  gl.uniform1i(u("uSolo"), p.solo);
}

/** Skybox fragment shader around PROC_SKY_GLSL (pairs with the usual xyww skybox vertex shader). */
export const PROC_SKY_FS = `#version 300 es
precision highp float;
in vec3 vDir;
out vec4 FragColor;
${PROC_SKY_GLSL}
void main() { FragColor = vec4(display(sky(vDir)), 1.0); }`;
