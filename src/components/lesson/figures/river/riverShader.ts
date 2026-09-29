// ── The River Lab shaders ─────────────────────────────────────────────────────
// Four passes a frame: the sky (a full-screen pass), the valley mirrored
// through the water plane into a reflection texture, the valley itself, and
// the water on top. The valley is a grid displaced by terrain() in its vertex
// shader. The water is one big quad at y = 0; every pixel of it reads the
// flow map, carries the ripple and foam texture along the flow, traces its
// refracted ray to the bed, and reads its reflection from the mirrored pass.

import { PROC_SKY_GLSL } from "../sky/proceduralSky";
import { SKY_ENV_GLSL } from "../water/skyProbe";
import { PHOTO_GLSL } from "../water/photoTextures";
import { TERRAIN_GLSL } from "./riverScene";
import { FLOW_GLSL } from "./riverDetail";

/** Half-size of the valley grid (m), and how its rows crowd toward the middle. */
export const GRID_A = 60, GRID_B = 190, GRID_N = 512;

// ── Ground shading (GLSL) ─────────────────────────────────────────────────────
const GROUND_GLSL = `
${SKY_ENV_GLSL}
${TERRAIN_GLSL}
uniform float uPix;
${PHOTO_GLSL}
uniform vec3  uCamPos;
uniform vec3  uAbsorb, uScatter;
uniform sampler2D uGrassA, uGrassN, uSandA, uSandN;
uniform vec2  uHave;               // 1 once the grass / sand photos are loaded
const vec3 UP = vec3(0.0, 1.0, 0.0);
const float ETA = 1.0 / 1.333;

vec3 sunDir() { return normalize(uSun); }
float fresnel(float c) { return 0.02 + 0.98 * pow(1.0 - c, 5.0); }
vec3 matteSun() { return sunLight(sunDir()) * 0.18; }
vec3 ambient() { return skyEnv(UP, 4.0) * 0.9 + sunLight(sunDir()) * max(sunDir().y, 0.0) * 0.1; }
// The sun's direction of travel under flat water
vec3 lightIn() { return refract(-normalize(vec3(uSun.x, max(uSun.y, 0.02), uSun.z)), UP, ETA); }

// Terrain normal by central differences, e metres apart
vec3 terrainNormal(vec2 p, float e) {
  float r;
  float hx = terrain(p + vec2(e, 0.0), r) - terrain(p - vec2(e, 0.0), r);
  float hz = terrain(p + vec2(0.0, e), r) - terrain(p - vec2(0.0, e), r);
  return normalize(vec3(-hx, 2.0 * e, -hz));
}

// Grass on the land, sand and gravel by the water and on the bed, grey rock,
// darker where it is wet
vec3 groundAlbedo(vec3 q, vec3 n, float rock, float dist, out vec3 nb) {
  nb = n;
  float noise = vnoise(q.xz * 0.6) * 0.6 + vnoise(q.xz * 3.1) * 0.4;
  float sand = 1.0 - smoothstep(0.25, 1.1, q.y + (noise - 0.5) * 0.8);
  float steep = 1.0 - smoothstep(0.55, 0.8, n.y);
  vec3 grass, sandC;
  if (uHave.x > 0.5) {
    vec2 uv = planarUV(q, 3.0);
    grass = srgbTex(uGrassA, uv, lodFor(dist, 3.0, n));
    if (sand < 0.99 && rock < 0.5) nb = bumped(n, uGrassN, uv, lodFor(dist, 3.0, n));
  } else grass = srgb(mix(vec3(0.3, 0.42, 0.16), vec3(0.45, 0.5, 0.22), noise));
  if (uHave.y > 0.5) {
    vec2 uv = planarUV(q, 2.0);
    sandC = srgbTex(uSandA, uv, lodFor(dist, 2.0, n)) * mix(0.75, 1.0, noise);
    if (sand > 0.5 && rock < 0.5) nb = bumped(n, uSandN, uv, lodFor(dist, 2.0, n));
  } else sandC = srgb(mix(vec3(0.55, 0.5, 0.4), vec3(0.68, 0.62, 0.5), noise));
  vec3 dirt = srgb(mix(vec3(0.38, 0.32, 0.25), vec3(0.5, 0.44, 0.35), noise));
  vec3 stone = srgb(mix(vec3(0.36, 0.36, 0.34), vec3(0.55, 0.54, 0.5), vnoise(q.xz * 5.0 + q.y * 3.0)));
  vec3 alb = mix(grass, sandC, sand);
  alb = mix(alb, dirt, steep * (1.0 - sand));
  alb = mix(alb, stone, max(rock, steep * smoothstep(8.0, 14.0, q.y)));
  // Wet just above the water line: water fills the pores, and the surface darkens
  float wet = 1.0 - smoothstep(0.0, 0.3 + rock * 0.4, q.y);
  return alb * mix(1.0, 0.55, wet);
}

// A point of ground above the water, lit by the sun and the sky
vec3 shadeLand(vec3 q, vec3 n, float rock, float dist) {
  vec3 nb;
  vec3 alb = groundAlbedo(q, n, rock, dist, nb);
  vec3 sun = sunDir();
  vec3 lit = matteSun() * max(dot(nb, sun), 0.0) + ambient() * (0.55 + 0.45 * n.y);
  return alb * lit / PI;
}

// A point of the bed, lit through the water: sunlight refracted in at the
// surface and absorbed on its way down, plus the skylight dimmed with depth
vec3 shadeBed(vec3 q, vec3 n, float rock, float dist, float caustic) {
  vec3 nb;
  vec3 alb = groundAlbedo(q, n, rock, dist, nb);
  vec3 L = lightIn();
  float d = max(-q.y, 0.0);
  vec3 lit = matteSun() * (1.0 - fresnel(max(sunDir().y, 0.0))) * caustic * max(dot(nb, -L), 0.0) * exp(-uAbsorb * d / -L.y)
           + ambient() * exp(-uAbsorb * d * 1.21) * (0.55 + 0.45 * n.y);
  return alb * lit / PI;
}

// Haze: far away, everything fades into the sky at the horizon
vec3 haze(vec3 col, vec3 rd, float dist) {
  return mix(col, skyEnv(vec3(rd.x, 0.03, rd.z), 1.0), 1.0 - exp(-dist / 900.0));
}
`;

// ── Sky ───────────────────────────────────────────────────────────────────────
export const SKY_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;
uniform vec3  uCamF, uCamR, uCamU;
uniform float uTanHalf, uAspect;
${PROC_SKY_GLSL}
void main() {
  vec2 ndc = vUV * 2.0 - 1.0;
  vec3 rd = normalize(uCamF + uCamR * ndc.x * uTanHalf * uAspect + uCamU * ndc.y * uTanHalf);
  FragColor = vec4(display(sky(rd)), 1.0);
}`;

// ── The valley ────────────────────────────────────────────────────────────────
// uMirror = 1 draws it upside down through y = 0 (the reflection pass): the
// mirrored valley, seen by the real camera, lands on screen exactly where its
// reflection in flat water appears.
export const TERRAIN_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aG;   // −1 … 1 across the grid
uniform mat4  uViewProj;
uniform vec2  uCentre;
uniform float uMirror;
out vec3 vP, vN;
out float vRock;
${TERRAIN_GLSL}
void main() {
  // Rows and columns crowd toward the middle: fine near the river, coarse at the hills
  vec2 xz = uCentre + sign(aG) * (${GRID_A.toFixed(1)} * abs(aG) + ${GRID_B.toFixed(1)} * aG * aG);
  float h = terrain(xz, vRock);
  float r, e = 0.12;
  float hx = terrain(xz + vec2(e, 0.0), r) - terrain(xz - vec2(e, 0.0), r);
  float hz = terrain(xz + vec2(0.0, e), r) - terrain(xz - vec2(0.0, e), r);
  vN = normalize(vec3(-hx, 2.0 * e, -hz));
  vP = vec3(xz.x, h, xz.y);
  gl_Position = uViewProj * vec4(xz.x, uMirror > 0.5 ? -h : h, xz.y, 1.0);
}`;

export const TERRAIN_FS = `#version 300 es
precision highp float;
in vec3 vP, vN;
in float vRock;
out vec4 FragColor;
uniform float uMirror;
uniform int uView;
${PROC_SKY_GLSL}
${GROUND_GLSL}
void main() {
  // Under the water it is the water pass's job (through refraction)
  if (vP.y < 0.0) discard;
  float dist = length(vP - uCamPos);
  vec3 col = haze(shadeLand(vP, normalize(vN), vRock, dist), normalize(vP - uCamPos), dist);
  if (uView == 1) col = mix(col, vec3(dot(col, vec3(0.3, 0.5, 0.2))), 0.7) * 0.6;
  // The reflection is stored as c / (1 + c), so 8-bit targets hold it too
  FragColor = uMirror > 0.5 ? vec4(col / (1.0 + col), 1.0) : vec4(display(col), 1.0);
}`;

// ── The water ─────────────────────────────────────────────────────────────────
export const WATER_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aG;
uniform mat4 uViewProj;
uniform vec2 uCentre;
out vec3 vP;
void main() {
  vec2 xz = uCentre + aG * ${(GRID_A + GRID_B).toFixed(1)};
  vP = vec3(xz.x, 0.0, xz.y);
  gl_Position = uViewProj * vec4(vP, 1.0);
}`;

export const WATER_FS = `#version 300 es
precision highp float;
in vec3 vP;
out vec4 FragColor;
${PROC_SKY_GLSL}
${GROUND_GLSL}
${FLOW_GLSL}
uniform sampler2D uFlow, uRefl;
uniform vec2  uScreen;
uniform float uRipple, uWind, uFoamAmt, uDistort, uCaustics;
uniform vec2  uWindVec;            // wind drift of the fine ripples (m/s)
uniform int   uView;               // 0 final, 1 flow, 2 texture coordinates, 3 foam
float ggx(float nh, float a) { float a2 = a * a; float d = nh * nh * (a2 - 1.0) + 1.0; return a2 / (PI * d * d); }

vec3 hue(float h) { return clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }

void main() {
  vec3 d = vP - uCamPos;
  float dist = length(d);
  vec3 rd = d / dist;
  float rock;
  // Dry land is drawn over the water by the valley pass; where the valley's
  // triangles dip a little below the exact terrain, the water fills in at depth 0
  float bed = terrain(vP.xz, rock);
  float depth = max(-bed, 0.0);

  // The flow map: velocity in m/s and the amount of foam
  vec2 fuv = (vP.xz - DOMAIN.xy) / DOMAIN.zw;
  vec4 fl = texture(uFlow, fuv);
  vec2 vel = fl.xy;
  float speed = length(vel);

  if (uView == 1) {
    // Direction as hue, speed as brightness, and streaks carried by the flow
    vec3 s = flowDetail(vP.xz, vel, 3.0);
    vec3 c = hue(atan(vel.y, vel.x) / 6.2831853) * min(speed / 1.5, 1.0);
    FragColor = vec4(mix(c, vec3(1.0), smoothstep(0.35, 0.6, s.z) * 0.35 * min(speed * 2.0, 1.0)), 1.0);
    return;
  }
  if (uView == 2) {
    // The texture coordinates the ripples are read at, as a checkerboard
    float tt = uFlowTime / uPeriod + texture(uDetail, vP.xz / 18.0).a * uOffset * 2.0;
    vec3 acc = vec3(0.0);
    int phases = uFlowMode == 0 ? 0 : uFlowMode == 1 ? 1 : 2;
    if (phases == 0) { vec2 g = floor((vP.xz - vel * uFlowTime) / 1.5); acc = vec3(mod(g.x + g.y, 2.0)); }
    for (int k = 0; k < 2; k++) {
      if (k >= phases) break;
      float fk = float(k) * 0.5, ph = fract(tt + fk);
      float w = phases == 1 ? 1.0 : 1.0 - abs(1.0 - 2.0 * ph);
      vec2 g = floor((vP.xz - vel * ph * uPeriod) / 1.5 + floor(tt + fk) * vec2(0.213, 0.371) + fk);
      acc += w * (k == 0 ? vec3(1.0, 0.55, 0.2) : vec3(0.2, 0.55, 1.0)) * mod(g.x + g.y, 2.0);
    }
    FragColor = vec4(pow(acc * 0.9 + 0.05, vec3(1.0 / 2.2)), 1.0);
    return;
  }

  // Ripples carried along by the flow, at two scales; rough in the rapids, calm where it is slow
  vec3 a = flowDetail(vP.xz, vel, 2.4);
  vec3 b = flowDetail(vP.xz + 7.3, vel, 0.9);
  // (turbulent water, where the map asks for foam, is rough even when slow)
  float amp = uRipple * (0.04 + 0.55 * min(speed, 2.5) + 0.8 * fl.z);
  vec2 slope = (a.xy * 0.6 + b.xy * 0.4) * amp;
  // Wind: fine ripples drifting with it, in patches that come and go (catspaws)
  float patchy = smoothstep(0.35, 0.75, vfbm(vP.xz * 0.05 - uWindVec * uFlowTime * 0.25, 3));
  vec4 wr = texture(uDetail, (vP.xz - uWindVec * uFlowTime * 0.5) / 0.7 + 0.37);
  slope += (wr.rg * 2.0 - 1.0) * uWind * (0.15 + 0.85 * patchy) * 0.35;
  // Far away the ripples are smaller than a pixel: fade them rather than let them shimmer
  slope *= 1.0 / (1.0 + dist * uPix * 60.0);
  vec3 N = normalize(vec3(-slope.x, 1.0, -slope.y));

  // Foam: where the flow map asks for it, shaped by the carried foam pattern
  float fp = a.z * 0.55 + b.z * 0.45;
  float want = clamp(fl.z * uFoamAmt, 0.0, 1.0);
  float foam = smoothstep(1.0 - want, 1.0 - want + 0.3, fp) * step(0.02, want);
  // A thin wet rim of foam where rocks break the surface
  foam = max(foam, smoothstep(-0.12, 0.0, bed) * rock * 0.8 * uFoamAmt);
  if (uView == 3) { FragColor = vec4(vec3(pow(foam, 1.0 / 2.2)), 1.0); return; }

  float cosV = max(dot(N, -rd), 1e-3);
  float F = fresnel(cosV);

  // Refraction: follow the bent ray down to the bed, then light the bed there
  vec3 R = refract(rd, N, ETA);
  float t = depth / max(-R.y, 0.15);
  vec2 q = vP.xz + R.xz * t;
  float rk;
  float hb = min(terrain(q, rk), 0.0);
  t = -hb / max(-R.y, 0.15);
  vec3 qp = vec3(q.x, hb, q.y);
  // Caustics, cheaply: the ripples' curvature focuses light on the bed
  vec3 cs = flowDetail(q - lightIn().xz * (-hb / -lightIn().y), texture(uFlow, (q - DOMAIN.xy) / DOMAIN.zw).xy, 2.4);
  float caustic = 1.0 + uCaustics * min(speed + 0.2 + uWind * 0.3, 1.0) * (cs.z - 0.3) * 1.6 * exp(-(-hb) * 0.5);
  vec3 bedCol = shadeBed(qp, terrainNormal(q, 0.15), rk, dist + t, max(caustic, 0.0));
  vec3 tr = exp(-uAbsorb * t);
  vec3 refr = bedCol * tr + uScatter * ambient() * 3.0 * (1.0 - tr);

  // Reflection: the mirrored valley, nudged by the ripples, else the sky
  vec2 suv = gl_FragCoord.xy / uScreen + N.xz * uDistort / (1.0 + dist * 0.02);
  vec4 rf = texture(uRefl, suv);
  vec3 rdir = reflect(rd, N);
  rdir.y = abs(rdir.y);
  vec3 refl = mix(skyEnv(rdir, 0.0), rf.rgb / max(1.0 - rf.rgb, 1e-3), rf.a);

  vec3 sun = sunDir(), H = normalize(sun - rd);
  float rough = 0.02 + 0.08 * min(speed, 1.5) + 0.05 * uWind;
  float spec = ggx(max(dot(N, H), 0.0), rough) * F * max(dot(N, sun), 0.0) / (4.0 * cosV);
  vec3 col = mix(refr, refl, F) + spec * sunLight(sun) * (1.0 - foam);
  // Foam is white and rough: it scatters sun and sky like a matte surface
  vec3 foamCol = vec3(0.9) * (matteSun() * max(sun.y, 0.0) + ambient()) / PI;
  col = mix(col, foamCol, foam * 0.9);
  FragColor = vec4(display(haze(col, rd, dist)), 1.0);
}`;
