// ── The Pool Lab shaders ──────────────────────────────────────────────────────
// Everything but the water is simple enough to trace analytically in a
// fragment shader: an open box (the pool), the deck around it (a plane) and
// the ball (a sphere). So the scene pass traces them per pixel and writes their
// depth, the water mesh draws on top, and each of its pixels traces the same
// scene again along its reflected and refracted rays.
// Caustics are drawn first into a map: the water mesh, with each vertex moved
// to where its refracted sunbeam lands, rasterised with additive blending.
// A triangle's brightness there is its area before over its area after.

import { PROC_SKY_GLSL, sunDirection, type SkyParams } from "../sky/proceduralSky";
import { SKY_ENV_GLSL } from "../water/skyProbe";
import { PHOTO_GLSL } from "../water/photoTextures";
import type { UniformSet } from "../water/waterCommon";
import { POOL_HALF, POOL_DEPTH } from "./poolSim";

export const RIM = 0.12;           // the deck, above the rest water level (m)
export const CAUSTIC_N = 1024;     // caustic map resolution
export const CAUSTIC_K = 1.15;     // the map covers keys in [−K, K]² (m)

// ── Geometry (GLSL), shared by the caustic and the render passes ──────────────
// The including shader declares uSun (toward the sun): PROC_SKY_GLSL already does.
const GEOM_GLSL = `
uniform vec4 uBall;               // centre, radius
const float HALF = ${POOL_HALF.toFixed(2)}, DEPTH = ${POOL_DEPTH.toFixed(2)}, RIM = ${RIM.toFixed(2)}, K = ${CAUSTIC_K.toFixed(2)};
const float ETA = 1.0 / 1.333;
const vec3 UP = vec3(0.0, 1.0, 0.0);

// The sun's direction of travel in the water under a flat surface
vec3 lightIn() { return refract(-normalize(vec3(uSun.x, max(uSun.y, 0.02), uSun.z)), UP, ETA); }

// Nearest hit of o + t·d with the ball, or −1
float hitBall(vec3 o, vec3 d) {
  vec3 oc = o - uBall.xyz;
  float b = dot(oc, d), c = dot(oc, oc) - uBall.w * uBall.w, h = b * b - c;
  if (h < 0.0) return -1.0;
  h = sqrt(h);
  if (-b - h > 1e-4) return -b - h;
  return -b + h > 1e-4 ? -b + h : -1.0;
}
// Soft shadow of the ball on a ray of length tMax: 0 through its middle, 1 clear of it
float ballShadow(vec3 o, vec3 d, float tMax) {
  vec3 oc = uBall.xyz - o;
  float tc = dot(oc, d);
  if (tc < 0.0 || tc > tMax + uBall.w) return 1.0;
  return smoothstep(uBall.w * 0.8, uBall.w * 1.1, length(oc - d * tc));
}
// Leaving the pool from a point inside it: distance to a wall or the floor, and that face's inward normal
float poolExit(vec3 o, vec3 d, out vec3 n) {
  float tx = d.x > 0.0 ? (HALF - o.x) / d.x : d.x < 0.0 ? (-HALF - o.x) / d.x : 1e9;
  float tz = d.z > 0.0 ? (HALF - o.z) / d.z : d.z < 0.0 ? (-HALF - o.z) / d.z : 1e9;
  float ty = d.y < 0.0 ? (-DEPTH - o.y) / d.y : 1e9;
  float t = min(tx, min(ty, tz));
  n = t == tx ? vec3(-sign(d.x), 0.0, 0.0) : t == tz ? vec3(0.0, 0.0, -sign(d.z)) : UP;
  return max(t, 0.0);
}
// The caustic map's key for a point q: where sunlight reaching q would have
// entered flat water. Every lit point of the pool has its own key.
vec2 causticKey(vec3 q) { vec3 L = lightIn(); return q.xz - L.xz * (q.y / L.y); }
`;

// ── Caustics ──────────────────────────────────────────────────────────────────
export const CAUSTIC_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aXZ;  // rest position on the water, in metres
uniform sampler2D uSim;
uniform vec3 uAbsorb;
uniform vec3 uSun;
${GEOM_GLSL}
out vec2 vKey0, vKey;
out vec3 vAtt;
void main() {
  vec4 s = textureLod(uSim, aXZ / (2.0 * HALF) + 0.5, 0.0);
  vec3 n = vec3(s.b, sqrt(max(1.0 - s.b * s.b - s.a * s.a, 0.0)), s.a);
  vec3 sun = normalize(vec3(uSun.x, max(uSun.y, 0.02), uSun.z));
  vec3 P = vec3(aXZ.x, s.r, aXZ.y);
  vec3 R = refract(-sun, n, ETA);                        // the real beam, bent by the wavy surface
  vec3 nq;
  float t = poolExit(P, R, nq);
  vKey0 = aXZ;                                           // flat water: the key is the entry point itself
  vKey = causticKey(P + R * t);
  // Absorbed on its way down; blocked by the ball above or below the water
  vAtt = exp(-uAbsorb * t) * ballShadow(P, R, t) * ballShadow(P, sun, 10.0);
  gl_Position = vec4(vKey / K, 0.0, 1.0);
}`;

export const CAUSTIC_FS = `#version 300 es
precision highp float;
in vec2 vKey0, vKey;
in vec3 vAtt;
out vec4 FragColor;
uniform float uStore;              // 1 in a float map; a smaller scale in 8 bits
float area(vec2 a, vec2 b) { return abs(a.x * b.y - a.y * b.x); }
void main() {
  // The varyings are linear across a triangle, so their screen derivatives
  // measure the triangle: its area in key space per pixel, before and after
  float before = area(dFdx(vKey0), dFdy(vKey0));
  float after = area(dFdx(vKey), dFdy(vKey));
  FragColor = vec4(vAtt * min(before / max(after, 1e-12), 40.0) * uStore, 1.0);
}`;

// ── Shading (GLSL) ────────────────────────────────────────────────────────────
const SHADE_GLSL = `
${SKY_ENV_GLSL}
${GEOM_GLSL}
uniform vec3  uCamPos;
uniform sampler2D uSim, uCaustic;
uniform float uCausRead;          // undoes uStore
uniform vec3  uAbsorb, uScatter;
uniform sampler2D uPoolA, uPoolN;
uniform float uHave;              // 1 once the tile photos are loaded
uniform float uPix;               // world size of one pixel at distance 1
uniform int   uView;              // 0 final, 1 heights, 2 caustics
${PHOTO_GLSL}
const float TILE = 1.0;           // the tile photo repeats every metre

vec3 sunDir() { return normalize(uSun); }
float fresnel(float c) { return 0.02 + 0.98 * pow(1.0 - c, 5.0); }
float ggx(float nh, float a) { float a2 = a * a; float d = nh * nh * (a2 - 1.0) + 1.0; return a2 / (PI * d * d); }
vec3 matteSun() { return sunLight(sunDir()) * 0.18; }
vec3 ambient() { return skyEnv(UP, 4.0) * 0.9 + sunLight(sunDir()) * max(sunDir().y, 0.0) * 0.12; }

vec4 simAt(vec2 xz) { return texture(uSim, clamp(xz, -HALF, HALF) / (2.0 * HALF) + 0.5); }
vec3 waterNormal(vec2 xz) { vec2 n = simAt(xz).ba; return vec3(n.x, sqrt(max(1.0 - dot(n, n), 0.0)), n.y); }
vec3 causticAt(vec3 q) { return texture(uCaustic, causticKey(q) / (2.0 * K) + 0.5).rgb * uCausRead; }

// Tiles, mapped on the plane of each face
vec3 tileAlbedo(vec3 q, vec3 n, float dist) {
  vec2 uv = abs(n.y) > 0.5 ? q.xz : abs(n.x) > 0.5 ? q.zy : q.xy;
  if (uHave > 0.5) return srgbTex(uPoolA, uv / TILE, lodFor(dist, TILE, UP));
  vec2 g = abs(fract(uv * 6.0) - 0.5);
  float grout = smoothstep(0.44, 0.48, max(g.x, g.y));
  vec3 tile = mix(vec3(0.55, 0.78, 0.86), vec3(0.62, 0.84, 0.9), step(0.5, fract(floor(uv.x * 6.0) * 0.5 + floor(uv.y * 6.0) * 0.5)));
  return srgb(mix(tile, vec3(0.3, 0.42, 0.5), grout));
}

// A pool face at q (inward normal n), dist metres from the eye
vec3 shadePool(vec3 q, vec3 n, float dist) {
  // Edges and corners see less of the sky
  float e = n.y > 0.5 ? min(HALF - abs(q.x), HALF - abs(q.z)) : min(q.y + DEPTH, HALF - (abs(n.x) > 0.5 ? abs(q.z) : abs(q.x)));
  float ao = 0.55 + 0.45 * smoothstep(0.0, 0.3, e);
  float level = simAt(q.xz).r;
  vec3 sun = sunDir();
  if (uView == 2) return q.y < level ? causticAt(q) * 0.3 : vec3(0.1);
  vec3 nb = n;
  vec2 uv = q.xz / TILE;
  if (n.y > 0.5 && uHave > 0.5) nb = bumped(n, uPoolN, uv, lodFor(dist, TILE, UP));
  vec3 lit;
  if (q.y < level) {
    float d = level - q.y;
    lit = matteSun() * (1.0 - fresnel(max(sun.y, 0.0))) * causticAt(q) * max(dot(nb, -lightIn()), 0.0)
        + ambient() * exp(-uAbsorb * d * 1.21) * ao;
  } else {
    lit = matteSun() * max(dot(nb, sun), 0.0) * ballShadow(q, sun, 10.0) + ambient() * ao;
  }
  return tileAlbedo(q, n, dist) * lit / PI;
}

// The ball: beach-ball stripes, lit through the water where it is submerged
vec3 shadeBall(vec3 q, vec3 rd) {
  vec3 n = normalize(q - uBall.xyz);
  float a = atan(n.z, n.x);
  bool red = mod(floor(a / (PI / 3.0)), 2.0) < 0.5 && abs(n.y) < 0.93;
  vec3 alb = srgb(red ? vec3(0.9, 0.22, 0.16) : vec3(0.95, 0.93, 0.88));
  vec3 sun = sunDir();
  float level = simAt(q.xz).r;
  vec3 amb = ambient() * (0.6 + 0.4 * n.y);
  vec3 lit;
  if (uView == 2) return vec3(0.1);
  if (q.y < level && abs(q.x) < HALF && abs(q.z) < HALF) {
    float d = level - q.y;
    vec3 L = lightIn();
    lit = matteSun() * (1.0 - fresnel(max(sun.y, 0.0))) * exp(-uAbsorb * d / -L.y) * max(dot(n, -L), 0.0) + amb * exp(-uAbsorb * d * 1.21);
    return alb * lit / PI;
  }
  lit = matteSun() * max(dot(n, sun), 0.0) + amb;
  vec3 H = normalize(sun - rd);
  return alb * lit / PI + sunLight(sun) * 0.015 * pow(max(dot(n, H), 0.0), 120.0);
}

// Paving slabs around the pool, with a pale coping stone along its edge
vec3 shadeDeck(vec3 q, vec3 rd, float dist) {
  vec2 g = abs(fract(q.xz / 0.6) - 0.5);
  float joint = smoothstep(0.47, 0.49, max(g.x, g.y));
  vec3 alb = mix(vec3(0.72, 0.67, 0.58), vec3(0.84, 0.8, 0.72), fbm2(q.xz * 3.0)) * (1.0 - 0.25 * joint);
  float edge = max(abs(q.x), abs(q.z)) - HALF;
  alb = srgb(mix(vec3(0.92, 0.92, 0.9), alb, smoothstep(0.14, 0.16, edge)));
  vec3 sun = sunDir();
  vec3 col = alb * (matteSun() * max(sun.y, 0.0) * ballShadow(q, sun, 10.0) + ambient()) / PI;
  return mix(col, skyEnv(vec3(rd.x, 0.02, rd.z), 1.0), 1.0 - exp(-dist / 60.0));
}

// Following a ray under the water from p: the ball or the pool, dimmed by the water
vec3 underwaterRay(vec3 p, vec3 d, float dist) {
  float tb = hitBall(p, d);
  vec3 n;
  float tw = poolExit(p, d, n), t = tw;
  vec3 col;
  if (tb > 0.0 && tb < tw) { t = tb; col = shadeBall(p + d * tb, d); }
  else col = shadePool(p + d * tw, n, dist + tw);
  if (uView == 2) return col;
  vec3 tr = exp(-uAbsorb * t);
  return col * tr + uScatter * ambient() * 3.0 * (1.0 - tr);
}
// Following a reflected ray up from the water at p: the ball, the band of wall above the water, or the sky
vec3 aboveRay(vec3 p, vec3 d, float dist) {
  d.y = abs(d.y);
  float tb = hitBall(p, d);
  if (tb > 0.0) return shadeBall(p + d * tb, d);
  vec3 n;
  float tw = poolExit(p, d, n);
  vec3 q = p + d * tw;
  if (q.y < RIM) return shadePool(q, n, dist + tw);
  return skyEnv(d, 0.0);
}
`;

// ── The scene pass: sky, deck, pool and ball, with their depth ────────────────
export const SCENE_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;
uniform vec3  uCamF, uCamR, uCamU;
uniform float uTanHalf, uAspect;
uniform float uDepthA, uDepthB;
${PROC_SKY_GLSL}
${SHADE_GLSL}
void main() {
  vec2 ndc = vUV * 2.0 - 1.0;
  vec3 rd = normalize(uCamF + uCamR * ndc.x * uTanHalf * uAspect + uCamU * ndc.y * uTanHalf);
  float tb = hitBall(uCamPos, rd), ts = -1.0;
  vec3 col = vec3(0.0), n;
  // The deck's plane: either the deck, or the opening into the pool
  float tp = rd.y < 0.0 ? (RIM - uCamPos.y) / rd.y : -1.0;
  bool deck = false;
  if (tp > 0.0) {
    vec3 q = uCamPos + rd * tp;
    deck = max(abs(q.x), abs(q.z)) > HALF;
    ts = deck ? tp : tp + poolExit(q, rd, n);
  }
  float t = tb > 0.0 && (ts < 0.0 || tb < ts) ? tb : ts;
  if (t < 0.0) { FragColor = vec4(display(sky(rd)), 1.0); gl_FragDepth = 1.0; return; }
  vec3 q = uCamPos + rd * t;
  if (t == tb) col = shadeBall(q, rd);
  else if (deck) col = shadeDeck(q, rd, t);
  else col = shadePool(q, n, t);
  float z = t * dot(rd, uCamF);
  gl_FragDepth = 0.5 * (uDepthA * -z + uDepthB) / z + 0.5;
  FragColor = vec4(uView == 2 ? pow(col, vec3(1.0 / 2.2)) : display(col), 1.0);
}`;

// ── The water surface ─────────────────────────────────────────────────────────
export const WATER_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aXZ;
uniform mat4 uViewProj;
uniform sampler2D uSim;
out vec3 vP;
void main() {
  float h = textureLod(uSim, aXZ / ${(2 * POOL_HALF).toFixed(1)} + 0.5, 0.0).r;
  vP = vec3(aXZ.x, h, aXZ.y);
  gl_Position = uViewProj * vec4(vP, 1.0);
}`;

export const WATER_FS = `#version 300 es
precision highp float;
in vec3 vP;
out vec4 FragColor;
${PROC_SKY_GLSL}
${SHADE_GLSL}
void main() {
  vec3 d = vP - uCamPos;
  float dist = length(d);
  vec3 rd = d / dist;
  if (uView == 1) {
    // Heights: red above the rest level, blue below, white at rest
    float h = simAt(vP.xz).r * 40.0;
    FragColor = vec4(h > 0.0 ? mix(vec3(0.95), vec3(0.9, 0.2, 0.15), min(h, 1.0)) : mix(vec3(0.95), vec3(0.15, 0.35, 0.95), min(-h, 1.0)), 1.0);
    return;
  }
  vec3 N = waterNormal(vP.xz);
  float cosV = max(dot(N, -rd), 1e-3);
  float F = fresnel(cosV);
  vec3 refr = underwaterRay(vP, refract(rd, N, ETA), dist);
  if (uView == 2) { FragColor = vec4(pow(refr, vec3(1.0 / 2.2)), 1.0); return; }
  vec3 refl = aboveRay(vP, reflect(rd, N), dist);
  vec3 sun = sunDir(), H = normalize(sun - rd);
  float spec = ggx(max(dot(N, H), 0.0), 0.02) * F * max(dot(N, sun), 0.0) / (4.0 * cosV);
  vec3 col = mix(refr, refl, F) + spec * sunLight(sun) * ballShadow(vP, sun, 10.0);
  FragColor = vec4(display(col), 1.0);
}`;

// ── Uniforms ──────────────────────────────────────────────────────────────────
/** The procedural sky's uniforms (for the probe and the background). */
export function skyUniforms(sky: SkyParams, time: number): UniformSet {
  return {
    f1: { uTime: time, uCover: sky.cover, uDensity: sky.density, uExposure: sky.exposure },
    i1: { uModel: sky.model, uSolo: -1 },
    v3: { uSun: sunDirection(sky.sunEl, sky.sunAz) },
    v4: { uLayers: [+sky.sun, +sky.stars, +sky.milky, +sky.clouds] },
  };
}
