// ── The black-hole fragment shader ────────────────────────────────────────────
// One ray per pixel, traced backwards from the camera along a light path bent
// by a Schwarzschild black hole (units r_s = 1, c = 1). Each RK4 step checks
// whether the path crossed the disk plane y = 0; the path ends in the horizon,
// in the sky (stars or a coordinate grid, read in the final direction), or when
// the disk has become opaque.

import { T_MIN, T_MAX, BB_SIZE } from "./blackbody";

export const MAX_STEPS = 400;

export const BLACKHOLE_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;

uniform vec3 uCamPos, uCamF, uCamR, uCamU;
uniform float uTanHalf, uAspect, uPix, uTime;
uniform float uStepK, uDiskIn, uDiskOut, uTemp, uDensity, uExposure, uPeriod;
uniform int uBending, uDisk, uDoppler, uGravShift, uBack, uView;
uniform sampler2D uBB;

const int MAX_STEPS = ${MAX_STEPS};

// ── Noise ───────────────────────────────────────────────────────────────────
float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
vec3 hash33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}
float vnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash31(i), hash31(i + vec3(1, 0, 0)), f.x),
                 mix(hash31(i + vec3(0, 1, 0)), hash31(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash31(i + vec3(0, 0, 1)), hash31(i + vec3(1, 0, 1)), f.x),
                 mix(hash31(i + vec3(0, 1, 1)), hash31(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return s / 0.9375;
}

// ── Blackbody colour: linear sRGB, luminance 1 at 6500 K ────────────────────
vec3 blackbody(float T) {
  float s = (log2(T) - log2(${T_MIN.toFixed(1)})) / (log2(${T_MAX.toFixed(1)}) - log2(${T_MIN.toFixed(1)}));
  if (s < 0.0) return vec3(0.0);
  vec3 c = texture(uBB, vec2((0.5 + min(s, 1.0) * ${(BB_SIZE - 1).toFixed(1)}) / ${BB_SIZE.toFixed(1)}, 0.5)).rgb;
  // Past the table, the visible part of the spectrum grows like T (Rayleigh–Jeans)
  return s > 1.0 ? c * T / ${T_MAX.toFixed(1)} : c;
}

// ── The sky ─────────────────────────────────────────────────────────────────
vec3 stars(vec3 d) {
  vec3 col = vec3(0.0);
  for (int layer = 0; layer < 2; layer++) {
    float sc = layer == 0 ? 45.0 : 110.0;
    vec3 p = d * sc, id = floor(p);
    float h = hash31(id + float(layer) * 17.0);
    if (h > (layer == 0 ? 0.1 : 0.06)) continue;
    // The star sits in the middle of its cell, on the sphere, and is never wider
    // than a sixth of the cell, so the cell's walls do not clip it
    vec3 sp = normalize(id + 0.3 + 0.4 * hash33(id)) * sc;
    float w = clamp(uPix * sc * 0.7, 0.03, 0.16);
    float dd = length(p - sp) / w;
    float bright = pow(hash31(id + 5.3), 6.0) * 3.0 + 0.08;
    float temp = mix(3200.0, 12000.0, pow(hash31(id + 9.1), 1.5));
    vec3 tint = blackbody(temp);
    col += tint / max(max(tint.r, tint.g), tint.b) * bright * exp(-dd * dd);
  }
  // A faint band of the galaxy, with a dark dust lane along its middle
  vec3 gn = normalize(vec3(0.25, 0.92, 0.3));
  float lat = dot(d, gn);
  float band = exp(-lat * lat / 0.03) * (0.4 + 0.9 * fbm(d * 5.0));
  band *= 1.0 - 0.75 * exp(-lat * lat / 0.0015) * fbm(d * 11.0 + 3.0);
  col += band * vec3(0.05, 0.045, 0.04);
  return col;
}

// Lines of latitude and longitude every 15°, the four quarters of the sky in four colours
vec3 grid(vec3 d) {
  float lon = atan(d.z, d.x), lat = asin(clamp(d.y, -1.0, 1.0));
  vec2 g = vec2(lon, lat) / radians(15.0);
  vec2 fw = max(fwidth(g), 1e-4);
  vec2 l = abs(fract(g - 0.5) - 0.5) / fw;
  float line = 1.0 - clamp(min(l.x, l.y) - 0.5, 0.0, 1.0);
  vec3 base = d.y > 0.0 ? (d.x > 0.0 ? vec3(0.45, 0.2, 0.1) : vec3(0.1, 0.3, 0.45))
                        : (d.x > 0.0 ? vec3(0.15, 0.35, 0.12) : vec3(0.35, 0.3, 0.1));
  return mix(base * 0.35, vec3(0.9), line * 0.8);
}

// ── The disk ────────────────────────────────────────────────────────────────
// Thin-disk temperature, normalised to 1 at its peak r = (49/36)·r_in
float profile(float r) {
  float x = r / uDiskIn;
  if (x <= 1.0) return 0.0;
  return pow(x, -0.75) * pow(1.0 - inversesqrt(x), 0.25) / 0.48788;
}

// Turbulent gas: noise on a cylinder (cos θ, sin θ, r). Few cells around and many
// across give streaks along the orbit. Each ring turns at its own Ω, which shears
// the pattern for ever, so two copies on clocks half a period apart are blended
// (the flow-map trick of the rivers chapter).
float gas(float r, float th, float omega) {
  float s = 0.0, wsum = 0.0;
  for (int k = 0; k < 2; k++) {
    float fk = 0.5 * float(k), ph = fract(uTime / uPeriod + fk);
    float w = 1.0 - abs(1.0 - 2.0 * ph);
    float a = th + omega * ph * uPeriod;
    vec3 q = vec3(cos(a) * 2.6, sin(a) * 2.6, r * 1.7) + floor(uTime / uPeriod + fk) * vec3(3.1, 1.7, 5.3) + fk * 7.0;
    s += w * fbm(q);
    wsum += w * w;
  }
  // Keep the contrast of the blend constant (see the rivers chapter)
  return clamp(0.5 + (s - 0.5) / sqrt(wsum), 0.0, 1.0);
}

// ── Equation of motion ──────────────────────────────────────────────────────
vec3 accel(vec3 x, float h2) {
  float r2 = dot(x, x), r = sqrt(r2);
  if (uBending == 0) return vec3(0.0);
  if (uBending == 1) return -0.5 * x / (r2 * r);        // Newton, GM = 1/2
  return -1.5 * h2 * x / (r2 * r2 * r);                  // Schwarzschild light path
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
vec3 heat(float t) {
  return clamp(vec3(1.5 * t, 1.5 * t - 0.5, 3.0 * t - 2.0), 0.0, 1.0) + vec3(0.02, 0.02, 0.1) * (1.0 - t);
}

void main() {
  vec2 ndc = vUV * 2.0 - 1.0;
  vec3 n = normalize(uCamF + uCamR * ndc.x * uTanHalf * uAspect + uCamU * ndc.y * uTanHalf);

  // Starting state. The camera hovers at distance D; its locally measured
  // direction n splits into a radial and a sideways part, and the sideways part
  // is divided by √(1 − 1/D) so the path has the right impact parameter.
  vec3 x = uCamPos;
  float D = length(x);
  vec3 rh = x / D;
  float nr = dot(n, rh);
  vec3 nt = n - nr * rh;
  float lapseCam = sqrt(max(1.0 - 1.0 / D, 1e-4));
  vec3 v = uBending == 2 ? nr * rh + nt / lapseCam : n;
  vec3 L = cross(x, v);
  float h2 = dot(L, L);
  float ell = -L.y;               // the photon's angular momentum about the disk axis (it travels along −v)
  float rFar = max(D, uDiskOut) * 1.2 + 10.0;

  vec3 col = vec3(0.0);
  float trans = 1.0;              // how much light from further along the path still gets through
  int crossings = 0, steps = 0;
  bool captured = false, escaped = false;

  for (int i = 0; i < MAX_STEPS; i++) {
    steps = i;
    float r = length(x);
    if (uBending != 0 && r < 1.0) { captured = true; break; }
    if (r > rFar && dot(x, v) > 0.0) { escaped = true; break; }
    if (trans < 0.004) break;

    float dt = uStepK * r;
    vec3 k1x = v,                    k1v = accel(x, h2);
    vec3 k2x = v + 0.5 * dt * k1v,   k2v = accel(x + 0.5 * dt * k1x, h2);
    vec3 k3x = v + 0.5 * dt * k2v,   k3v = accel(x + 0.5 * dt * k2x, h2);
    vec3 k4x = v + dt * k3v,         k4v = accel(x + dt * k3x, h2);
    vec3 x1 = x + dt / 6.0 * (k1x + 2.0 * k2x + 2.0 * k3x + k4x);
    vec3 v1 = v + dt / 6.0 * (k1v + 2.0 * k2v + 2.0 * k3v + k4v);

    // Did this step cross the disk plane?
    if (uDisk == 1 && x.y * x1.y < 0.0) {
      float f = x.y / (x.y - x1.y);
      vec3 p = mix(x, x1, f);
      float rp = length(p.xz);
      if (rp > uDiskIn && rp < uDiskOut) {
        crossings++;
        float om = sqrt(0.5 / (rp * rp * rp));
        float th = atan(p.z, p.x);
        float gasAmt = gas(rp, th, om);
        float edge = smoothstep(uDiskIn, uDiskIn * 1.15, rp) * (1.0 - smoothstep(uDiskOut * 0.7, uDiskOut, rp));
        // A layer that absorbs α of the light also emits α·B (Kirchhoff); a
        // slanted path crosses more gas: 1 − (1 − α)^(1/|cos i|)
        float a0 = clamp(uDensity * (0.25 + 0.9 * gasAmt) * edge, 0.0, 0.98);
        vec3 vd = normalize(mix(v, v1, f));
        float alpha = 1.0 - pow(1.0 - a0, 1.0 / max(abs(vd.y), 0.03));

        // Frequency ratio g: gravity (a clock deep in the well runs slow) and the
        // Doppler effect of the orbit, seen by the camera, itself deep in the well
        float gGrav = sqrt(1.0 - 1.0 / rp) / lapseCam;
        float gDop = sqrt((1.0 - 1.5 / rp) / (1.0 - 1.0 / rp)) / (1.0 - om * ell);
        float g = (uGravShift == 1 ? gGrav : 1.0) * (uDoppler == 1 ? gDop : 1.0);
        float T = uTemp * profile(rp);
        vec3 emit = blackbody(g * T) * (0.55 + 0.9 * gasAmt);

        if (uView == 1) {
          vec3 order = crossings == 1 ? vec3(1.0, 0.55, 0.15) : crossings == 2 ? vec3(0.15, 0.8, 0.75) : vec3(0.9, 0.3, 0.9);
          emit = order * (0.35 + 0.65 * gasAmt);
        } else if (uView == 2) {
          float s = clamp(log2(g) * 1.4, -1.0, 1.0);
          emit = (s > 0.0 ? mix(vec3(0.85), vec3(0.2, 0.45, 1.0), s) : mix(vec3(0.85), vec3(1.0, 0.2, 0.1), -s)) * (0.4 + 0.6 * gasAmt);
        }
        col += trans * alpha * emit;
        trans *= 1.0 - alpha;
      }
    }
    x = x1; v = v1;
  }

  // The sky is evaluated for every pixel (grid lines need screen derivatives,
  // which are only defined outside branches) and kept where the ray got out
  vec3 d = normalize(v);
  vec3 sky = uBack == 0 ? stars(d) : grid(d);
  if (uView != 0) sky *= 0.35;
  col += (escaped ? trans : 0.0) * sky;

  if (uView == 3) {
    FragColor = vec4(heat(float(steps) / float(MAX_STEPS)), 1.0);
    return;
  }
  vec3 c = uView == 0 ? aces(col * exp2(uExposure)) : clamp(col, 0.0, 1.0);
  FragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;
