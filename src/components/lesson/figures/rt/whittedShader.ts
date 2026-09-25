// ── A Whitted ray tracer in one fragment shader ───────────────────────────────
// Spheres on a checkered plane, one point light, sky background. Every hit
// shades locally (diffuse + highlight, shadow ray to the light) and may spawn
// a reflected and a refracted ray. GLSL has no recursion, so the ray tree is
// walked with an explicit stack of pending rays, each carrying the weight it
// contributes to the pixel.

export type WhittedParams = {
  shadows: boolean; reflections: boolean; refraction: boolean;
  depth: number;          // maximum bounces along any branch
  ior: number;
  view: number;           // 0 final, 1 normals, 2 distance, 3 rays per pixel
  lightAngle: number;     // degrees around the scene
};

export const DEFAULT_WHITTED: WhittedParams = {
  shadows: true, reflections: true, refraction: true, depth: 5, ior: 1.5, view: 0, lightAngle: 40,
};

export const WHITTED_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;
uniform vec3  uCamPos, uCamF, uCamR, uCamU;
uniform float uTanHalf, uAspect, uIor;
uniform int   uDepth, uView;
uniform bool  uShadows, uReflect, uRefract;
uniform vec3  uLight;

// ── Scene ───────────────────────────────────────────────────────────────────
// Materials: 0 diffuse, 1 mirror, 2 glass, 3 checker floor (slightly glossy)
struct Hit { float t; vec3 n; int mat; vec3 albedo; };
const int NS = 5;
const vec4 SPH[NS] = vec4[NS](                    // centre xyz, radius
  vec4(-1.3, 0.6, 0.0, 0.6), vec4(0.2, 0.75, -0.9, 0.75), vec4(1.35, 0.55, 0.55, 0.55),
  vec4(-0.25, 0.32, 1.15, 0.32), vec4(0.55, 0.22, 1.6, 0.22));
const int SMAT[NS] = int[NS](0, 1, 2, 0, 2);
const vec3 SCOL[NS] = vec3[NS](vec3(0.85, 0.2, 0.15), vec3(0.95), vec3(1.0), vec3(0.2, 0.45, 0.9), vec3(1.0));

// Ray–sphere: solve |o + t·d − c|² = r² for t, the smaller positive root
float sphere(vec3 o, vec3 d, vec4 s) {
  vec3 oc = o - s.xyz;
  float b = dot(oc, d), c = dot(oc, oc) - s.w * s.w;
  float h = b * b - c;                              // quarter of the discriminant
  if (h < 0.0) return -1.0;
  h = sqrt(h);
  float t = -b - h;                                 // the near root…
  if (t < 1e-3) t = -b + h;                         // …or the far one, from inside
  return t;
}

Hit intersect(vec3 o, vec3 d) {
  Hit h; h.t = 1e9; h.mat = -1;
  // plane y = 0
  if (d.y < 0.0) {
    float t = -o.y / d.y;
    vec3 p = o + d * t;
    if (t > 1e-3 && t < h.t && length(p.xz) < 14.0) {       // a round floor, 14 units across
      h.t = t; h.n = vec3(0, 1, 0); h.mat = 3;
      float ch = mod(floor(p.x) + floor(p.z), 2.0);
      h.albedo = mix(vec3(0.85), vec3(0.25), ch);
    }
  }
  for (int i = 0; i < NS; i++) {
    float t = sphere(o, d, SPH[i]);
    if (t > 1e-3 && t < h.t) { h.t = t; h.n = normalize(o + d * t - SPH[i].xyz); h.mat = SMAT[i]; h.albedo = SCOL[i]; }
  }
  return h;
}

vec3 skyCol(vec3 d) { return mix(vec3(0.75, 0.82, 0.9), vec3(0.25, 0.45, 0.8), clamp(d.y * 1.4, 0.0, 1.0)); }

// Local shading: ambient + Lambert + Blinn-Phong highlight, dimmed by a shadow ray
vec3 local(vec3 p, vec3 n, vec3 v, vec3 albedo) {
  vec3 L = uLight - p;
  float dist = length(L); L /= dist;
  float lit = 1.0;
  if (uShadows) {
    Hit s = intersect(p + n * 1e-3, L);
    if (s.mat >= 0 && s.t < dist) lit = s.mat == 2 ? 0.55 : 0.0;   // glass casts a lighter shadow
  }
  float diff = max(dot(n, L), 0.0);
  float spec = pow(max(dot(n, normalize(L + v)), 0.0), 64.0);
  return albedo * (0.12 + 0.95 * diff * lit) + vec3(0.5) * spec * lit;
}

float schlick(float cosT, float n1, float n2) {
  float r0 = pow((n1 - n2) / (n1 + n2), 2.0);
  return r0 + (1.0 - r0) * pow(1.0 - cosT, 5.0);
}

// ── The ray tree, walked with a stack ───────────────────────────────────────
struct Ray { vec3 o; vec3 d; vec3 w; int depth; };
const int STACK = 24;

void main() {
  vec2 ndc = vUV * 2.0 - 1.0;
  vec3 rd = normalize(uCamF + uCamR * ndc.x * uTanHalf * uAspect + uCamU * ndc.y * uTanHalf);

  Hit first = intersect(uCamPos, rd);
  if (uView == 1) { FragColor = vec4(first.mat < 0 ? vec3(0.0) : first.n * 0.5 + 0.5, 1.0); return; }
  if (uView == 2) { FragColor = vec4(vec3(first.mat < 0 ? 0.0 : exp(-first.t * 0.12)), 1.0); return; }

  Ray stack[STACK];
  int sp = 0;
  stack[sp++] = Ray(uCamPos, rd, vec3(1.0), 0);
  vec3 col = vec3(0.0);
  int rays = 0;
  for (int iter = 0; iter < 64; iter++) {
    if (sp == 0) break;
    Ray r = stack[--sp];
    rays++;
    Hit h = intersect(r.o, r.d);
    if (h.mat < 0) { col += r.w * skyCol(r.d); continue; }
    vec3 p = r.o + r.d * h.t;
    vec3 v = -r.d;
    bool canBranch = r.depth < uDepth && sp < STACK - 2;
    if (h.mat == 0) { col += r.w * local(p, h.n, v, h.albedo); continue; }
    if (h.mat == 3) {
      col += r.w * 0.85 * local(p, h.n, v, h.albedo);
      if (uReflect && canBranch) stack[sp++] = Ray(p + h.n * 1e-3, reflect(r.d, h.n), r.w * 0.15, r.depth + 1);
      continue;
    }
    if (h.mat == 1) {                                        // mirror: 90% reflective, a little local light
      col += r.w * 0.1 * local(p, h.n, v, h.albedo);
      if (uReflect && canBranch) stack[sp++] = Ray(p + h.n * 1e-3, reflect(r.d, h.n), r.w * 0.9, r.depth + 1);
      continue;
    }
    // glass: split into reflected and refracted rays, weighted by Fresnel
    bool inside = dot(r.d, h.n) > 0.0;
    vec3 n = inside ? -h.n : h.n;
    float n1 = inside ? uIor : 1.0, n2 = inside ? 1.0 : uIor;
    vec3 T = refract(r.d, n, n1 / n2);
    float F = dot(T, T) == 0.0 ? 1.0 : schlick(max(dot(-r.d, n), 0.0), n1, n2);   // TIR: all reflected
    col += r.w * vec3(0.5) * pow(max(dot(n, normalize(normalize(uLight - p) + v)), 0.0), 128.0);
    if (canBranch) {
      if (uReflect) stack[sp++] = Ray(p + n * 1e-3, reflect(r.d, n), r.w * F, r.depth + 1);
      if (uRefract && F < 1.0) stack[sp++] = Ray(p - n * 1e-3, T, r.w * (1.0 - F) * vec3(0.95, 0.98, 1.0), r.depth + 1);
      else if (!uRefract) col += r.w * (1.0 - F) * vec3(0.08);
    }
  }
  if (uView == 3) {                                          // cost: rays traced for this pixel
    float k = float(rays) / 16.0;
    FragColor = vec4(k, k * 0.5, 1.0 - k, 1.0) * 0.9;
    return;
  }
  FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;
