// ── A progressive path tracer ────────────────────────────────────────────────
// A Cornell box (red and green side walls, white elsewhere, an area light in
// the ceiling) with two spheres. Each frame traces `spp` random paths per
// pixel and blends them into a running average stored in a float texture
// (ping-pong between two targets). A second pass tone maps the average.

export type PathParams = {
  bounces: number;
  spp: number;              // samples per pixel per frame
  sampling: 0 | 1;          // 0 uniform hemisphere, 1 cosine-weighted
  nee: boolean;             // next event estimation (direct light sampling)
  roulette: boolean;
  matA: number; matB: number;   // 0 diffuse, 1 metal, 2 glass
  rough: number;            // metal roughness
  lightSize: number;        // half-size of the ceiling light (box units)
  exposure: number;
  view: number;             // 0 image, 1 samples heat (variance proxy): unused, 2 first-bounce albedo
};

export const DEFAULT_PATH: PathParams = {
  bounces: 5, spp: 2, sampling: 1, nee: true, roulette: true, matA: 1, matB: 2, rough: 0.15, lightSize: 0.25, exposure: 1, view: 0,
};

export const PATH_TRACE_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;
uniform sampler2D uPrev;
uniform float uFrame;              // how many frames are already averaged in uPrev
uniform vec2  uRes;
uniform vec3  uCamPos, uCamF, uCamR, uCamU;
uniform float uTanHalf, uAspect, uRough, uLightSize;
uniform int   uBounces, uSpp, uSampling, uMatA, uMatB;
uniform bool  uNee, uRoulette;

const float PI = 3.14159265;

// ── Random numbers: a PCG hash, reseeded per pixel, frame and sample ────────
uint seed;
uint pcg(uint v) { uint s = v * 747796405u + 2891336453u; uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u; return (w >> 22u) ^ w; }
float rnd() { seed = pcg(seed); return float(seed) / 4294967296.0; }

// ── Scene: the box is 5 quads (the front is open), the light a 6th ─────────
struct Hit { float t; vec3 n; vec3 albedo; int mat; vec3 emit; };
const vec3 LIGHT_C = vec3(0.0, 1.999, 0.0);
const vec3 LIGHT_E = vec3(17.0, 12.0, 6.0);

// Axis-aligned rectangle: plane coordinate 'k' on axis 'axis', extent 'lo…hi' in the other two
void quad(vec3 o, vec3 d, int axis, float k, vec2 lo, vec2 hi, vec3 n, vec3 alb, inout Hit h) {
  float dd = d[axis];
  if (abs(dd) < 1e-6) return;
  float t = (k - o[axis]) / dd;
  if (t < 1e-4 || t > h.t) return;
  vec3 p = o + d * t;
  vec2 q = axis == 0 ? p.yz : axis == 1 ? p.xz : p.xy;
  if (any(lessThan(q, lo)) || any(greaterThan(q, hi))) return;
  h.t = t; h.n = n; h.albedo = alb; h.mat = 0; h.emit = vec3(0.0);
}
void sphere(vec3 o, vec3 d, vec4 s, int mat, vec3 alb, inout Hit h) {
  vec3 oc = o - s.xyz;
  float b = dot(oc, d), c = dot(oc, oc) - s.w * s.w, disc = b * b - c;
  if (disc < 0.0) return;
  disc = sqrt(disc);
  float t = -b - disc;
  if (t < 1e-4) t = -b + disc;
  if (t < 1e-4 || t > h.t) return;
  h.t = t; h.n = normalize(o + d * t - s.xyz); h.albedo = alb; h.mat = mat; h.emit = vec3(0.0);
}
Hit scene(vec3 o, vec3 d) {
  Hit h; h.t = 1e9; h.mat = -1; h.emit = vec3(0.0);
  vec3 W = vec3(0.73), R = vec3(0.63, 0.065, 0.05), G = vec3(0.14, 0.45, 0.091);
  quad(o, d, 1, -2.0, vec2(-2.0), vec2(2.0), vec3(0, 1, 0), W, h);     // floor
  quad(o, d, 1,  2.0, vec2(-2.0), vec2(2.0), vec3(0, -1, 0), W, h);    // ceiling
  quad(o, d, 2, -2.0, vec2(-2.0), vec2(2.0), vec3(0, 0, 1), W, h);     // back
  quad(o, d, 0, -2.0, vec2(-2.0), vec2(2.0), vec3(1, 0, 0), R, h);     // left
  quad(o, d, 0,  2.0, vec2(-2.0), vec2(2.0), vec3(-1, 0, 0), G, h);    // right
  // the light: a square just below the ceiling, facing down
  float tl = (LIGHT_C.y - o.y) / d.y;
  if (d.y > 0.0 && tl > 1e-4 && tl < h.t) {
    vec3 p = o + d * tl;
    if (abs(p.x) < uLightSize * 2.0 && abs(p.z) < uLightSize * 2.0) { h.t = tl; h.n = vec3(0, -1, 0); h.mat = 3; h.emit = LIGHT_E; h.albedo = vec3(0.0); }
  }
  sphere(o, d, vec4(-0.8, -1.2, -0.6, 0.8), uMatA, vec3(0.9, 0.85, 0.7), h);
  sphere(o, d, vec4(0.9, -1.35, 0.6, 0.65), uMatB, vec3(0.95), h);
  return h;
}

// ── Sampling directions ─────────────────────────────────────────────────────
// Orthonormal basis around n (Frisvad / Duff et al.)
void basis(vec3 n, out vec3 t, out vec3 b) {
  float s = n.z >= 0.0 ? 1.0 : -1.0;
  float a = -1.0 / (s + n.z), c = n.x * n.y * a;
  t = vec3(1.0 + s * n.x * n.x * a, s * c, -s * n.x);
  b = vec3(c, s + n.y * n.y * a, -n.y);
}
// Returns a direction on the hemisphere around n, and its pdf
vec3 sampleHemisphere(vec3 n, out float pdf) {
  float u1 = rnd(), u2 = rnd();
  float phi = 2.0 * PI * u2;
  float cosT = uSampling == 1 ? sqrt(1.0 - u1) : 1.0 - u1;   // cosine-weighted : uniform
  float sinT = sqrt(max(0.0, 1.0 - cosT * cosT));
  pdf = uSampling == 1 ? cosT / PI : 1.0 / (2.0 * PI);
  vec3 t, b; basis(n, t, b);
  return normalize(t * cos(phi) * sinT + b * sin(phi) * sinT + n * cosT);
}
vec3 randomInSphere() {
  vec3 p = vec3(rnd(), rnd(), rnd()) * 2.0 - 1.0 + 1e-6;         // never exactly zero
  return normalize(p) * pow(rnd(), 1.0 / 3.0);
}

// Direct light: pick a point on the light, trace a shadow ray, return its contribution
vec3 directLight(vec3 p, vec3 n, vec3 albedo) {
  float s = uLightSize * 2.0;
  vec3 q = LIGHT_C + vec3((rnd() * 2.0 - 1.0) * s, 0.0, (rnd() * 2.0 - 1.0) * s);
  vec3 L = q - p;
  float d2 = dot(L, L), d = sqrt(d2);
  L /= d;
  // cosines at the surface and at the light, which faces down (normal (0, −1, 0)): cosL = −L·n_light = L.y
  float cosX = dot(n, L), cosL = L.y;
  if (cosX <= 0.0 || cosL <= 0.0) return vec3(0.0);
  Hit h = scene(p + n * 1e-3, L);
  if (h.mat != 3) return vec3(0.0);                            // something in the way
  float area = (2.0 * s) * (2.0 * s);
  // Lambert BRDF (albedo/π) × Le × cosX × (cosL / d²) × area   (pdf of picking the point = 1/area)
  return albedo / PI * LIGHT_E * cosX * cosL / d2 * area;
}

vec3 trace(vec3 o, vec3 d) {
  vec3 col = vec3(0.0), thr = vec3(1.0);
  bool specular = true;                                        // camera ray or mirror/glass bounce
  for (int b = 0; b < 12; b++) {
    if (b > uBounces) break;
    Hit h = scene(o, d);
    if (h.mat < 0) break;
    if (h.mat == 3) {                                          // hit the light
      // with NEE, diffuse bounces already counted it: only camera/specular paths may add it
      if (!uNee || specular) col += thr * h.emit;
      break;
    }
    vec3 p = o + d * h.t;
    vec3 n = h.n;
    if (h.mat == 0) {
      if (uNee) col += thr * directLight(p, n, h.albedo);
      float pdf;
      vec3 nd = sampleHemisphere(n, pdf);
      // throughput × BRDF × cos / pdf ; the BRDF of a Lambert surface is albedo/π
      thr *= h.albedo / PI * max(dot(n, nd), 0.0) / pdf;
      o = p + n * 1e-3; d = nd; specular = false;
    } else if (h.mat == 1) {                                   // rough metal: mirror + fuzz
      vec3 r = normalize(reflect(d, n) + uRough * randomInSphere());
      if (dot(r, n) <= 0.0) break;
      thr *= h.albedo;
      o = p + n * 1e-3; d = r; specular = true;
    } else {                                                   // glass: choose reflect or refract by Fresnel
      bool inside = dot(d, n) > 0.0;
      vec3 nn = inside ? -n : n;
      float eta = inside ? 1.5 : 1.0 / 1.5;
      float cosI = min(dot(-d, nn), 1.0);
      float r0 = pow((1.0 - 1.5) / (1.0 + 1.5), 2.0);
      float F = r0 + (1.0 - r0) * pow(1.0 - cosI, 5.0);
      vec3 T = refract(d, nn, eta);
      if (dot(T, T) == 0.0 || rnd() < F) { d = reflect(d, nn); o = p + nn * 1e-3; }
      else { d = T; o = p - nn * 1e-3; }
      specular = true;
    }
    // Russian roulette: after 3 bounces, continue with probability q and divide by q
    if (uRoulette && b >= 3) {
      float q = clamp(max(thr.r, max(thr.g, thr.b)), 0.05, 0.95);
      if (rnd() > q) break;
      thr /= q;
    }
  }
  return col;
}

void main() {
  seed = uint(gl_FragCoord.x) * 1973u + uint(gl_FragCoord.y) * 9277u + uint(uFrame) * 26699u;
  vec3 sum = vec3(0.0);
  for (int s = 0; s < 16; s++) {
    if (s >= uSpp) break;
    // jitter inside the pixel: free antialiasing
    vec2 px = (gl_FragCoord.xy + vec2(rnd(), rnd())) / uRes * 2.0 - 1.0;
    vec3 rd = normalize(uCamF + uCamR * px.x * uTanHalf * uAspect + uCamU * px.y * uTanHalf);
    vec3 c = trace(uCamPos, rd);
    // Drop broken samples (NaN) and clamp fireflies: a half-float target overflows past 65504
    if (any(isnan(c)) || any(isinf(c))) c = vec3(0.0);
    sum += min(c, vec3(64.0));
  }
  vec3 cur = sum / float(uSpp);
  // running average: after N frames, avg_N = avg_(N-1) + (x − avg_(N-1)) / N
  vec3 prev = texture(uPrev, vUV).rgb;
  FragColor = vec4(uFrame < 0.5 ? cur : mix(prev, cur, 1.0 / (uFrame + 1.0)), 1.0);
}`;

export const PATH_DISPLAY_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;
uniform sampler2D uAcc;
uniform float uExposure;
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() { FragColor = vec4(pow(aces(texture(uAcc, vUV).rgb * uExposure * 0.6), vec3(1.0 / 2.2)), 1.0); }`;
