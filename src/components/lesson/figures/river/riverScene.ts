// ── The River Lab's valley and its flow map ───────────────────────────────────
// A river runs toward +z along a meandering centre line, then widens and
// deepens into a lake and narrows again. The bed across the channel is a
// parabola, the banks rise into hills, and a few rocks stand in the rapids.
// The same channel functions exist twice: in TypeScript, to compute the flow
// map on the CPU, and in GLSL (generated from the same constants), to draw the
// terrain. The water's rest level is y = 0 everywhere.

import type { Vec3 } from "../../kit/gl/gl";

// ── The channel ───────────────────────────────────────────────────────────────
const smooth = (a: number, b: number, x: number) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };

/** How much of the lake there is at z: 0 in the river, 1 in the lake. */
const lakeAt = (z: number) => smooth(-6, 16, z) * (1 - smooth(46, 70, z));

/** Centre line x, half-width W and depth D of the channel at z (metres). */
export function channel(z: number) {
  const L = lakeAt(z);
  const c = (1 - 0.75 * L) * (7 * Math.sin(0.045 * z) + 3 * Math.sin(0.11 * z + 1.3));
  return { c, W: 4.5 + 13 * L, D: 1.1 + 2.4 * L, L };
}

// ── Rocks: placed across the channel (s = −1 … 1) at a given z ───────────────
// radius at the water line (m), top above the water (m)
const ROCK_SPOTS: [number, number, number, number][] = [
  // z,    s,     r,    top
  [-44, -0.35, 0.9, 0.45],
  [-36, 0.3, 1.2, 0.6],
  [-29, -0.1, 0.7, 0.3],
  [-21, 0.45, 1.0, 0.5],
  [-15, -0.4, 0.8, 0.35],
  [-9, 0.15, 1.1, 0.55],
];
export type Rock = { x: number; z: number; r: number; top: number };
export const ROCKS: Rock[] = ROCK_SPOTS.map(([z, s, r, top]) => {
  const ch = channel(z);
  return { x: ch.c + s * ch.W, z, r, top };
});

// ── Flow map: domain and resolution ───────────────────────────────────────────
export const DOMAIN = { x0: -40, z0: -80, w: 80, h: 152 };
export const FLOW_W = 256, FLOW_H = 512;

/** ∫₋₁¹ (1 − s²)^(5/3) ds: the shape factor of Manning flow over a parabolic bed. */
const SHAPE = (() => {
  let sum = 0;
  const n = 2000;
  for (let i = 0; i < n; i++) { const s = -1 + (i + 0.5) * (2 / n); sum += Math.pow(1 - s * s, 5 / 3) * (2 / n); }
  return sum;
})();

/** Cross-section area of the channel at z: a parabola of width 2W and depth D has area 4/3·W·D. */
export const areaAt = (z: number) => { const { W, D } = channel(z); return (4 / 3) * W * D; };

/** Flow of the river alone (no rocks) at (x, z), for a discharge Q in m³/s. */
function streamAt(x: number, z: number, Q: number): [number, number] {
  const { c, W, D } = channel(z);
  const s = (x - c) / W;
  if (Math.abs(s) >= 1) return [0, 0];
  // Manning: at a fixed slope, speed grows as depth^(2/3); k makes the total discharge Q
  const d = D * (1 - s * s);
  const k = Q / (W * Math.pow(D, 5 / 3) * SHAPE);
  const u = k * Math.pow(d, 2 / 3);
  // Along the centre line's direction
  const tx = channel(z + 0.5).c - channel(z - 0.5).c, len = Math.hypot(tx, 1);
  return [(u * tx) / len, u / len];
}

export type FlowMap = { data: Float32Array; stream: Float32Array };

/**
 * Builds the flow map: RGBA = (velocity x, velocity z) in m/s, foam amount,
 * 1 where there is water. `stream` keeps the untouched velocities, so painting
 * can be undone.
 */
export function buildFlow(Q: number, rocks: boolean): FlowMap {
  const data = new Float32Array(FLOW_W * FLOW_H * 4);
  // The free stream each rock sits in
  const free = ROCKS.map(r => streamAt(r.x, r.z, Q));
  for (let j = 0; j < FLOW_H; j++) {
    const z = DOMAIN.z0 + ((j + 0.5) / FLOW_H) * DOMAIN.h;
    const { c, W } = channel(z);
    for (let i = 0; i < FLOW_W; i++) {
      const x = DOMAIN.x0 + ((i + 0.5) / FLOW_W) * DOMAIN.w;
      const o = (j * FLOW_W + i) * 4;
      if (Math.abs(x - c) >= W) continue;
      let [vx, vz] = streamAt(x, z, Q);
      let foam = 0, inRock = false;
      if (rocks) ROCKS.forEach((rk, n) => {
        const [ux, uz] = free[n], U = Math.hypot(ux, uz);
        const px = x - rk.x, pz = z - rk.z, r2 = px * px + pz * pz, a = rk.r;
        if (r2 < a * a) { inRock = true; return; }
        // Circle theorem: the rock adds −V·a²/ζ² to the complex velocity u − i·v,
        // with ζ = px + i·pz and V = ux + i·uz the free stream
        const zr = (px * px - pz * pz) / (r2 * r2), zi = (-2 * px * pz) / (r2 * r2);   // 1/ζ²
        const pr = -(ux * zr - uz * zi) * a * a, pi = -(ux * zi + uz * zr) * a * a;     // −V·a²/ζ²
        vx += pr; vz -= pi;
        // The wake behind it, which potential flow does not have: slower, and white
        const l = (px * ux + pz * uz) / Math.max(U, 1e-6), q = (px * uz - pz * ux) / Math.max(U, 1e-6);
        const r = Math.sqrt(r2);
        if (l > 0) {
          const spread = a * (1 + l / (3 * a));
          const wake = Math.exp(-l / (7 * a)) * Math.exp(-((q / spread) ** 2)) * Math.min(1, r / a - 0.8);
          vx *= 1 - 0.55 * wake; vz *= 1 - 0.55 * wake;
          foam += wake * Math.min(U, 1.5);
        }
        // Where the water piles up against its upstream face
        foam += Math.exp(-(r - a) / (0.35 * a)) * (l < 0 ? 0.9 : 0.35) * Math.min(U, 1.5);
      });
      // Inside a rock's outline at the water line: still, broken water hugging the stone
      if (inRock) { data[o + 2] = 0.8; data[o + 3] = 1; continue; }
      // Fast water breaks white on its own
      foam += Math.max(Math.hypot(vx, vz) - 1.7, 0) * 0.6;
      data[o] = vx; data[o + 1] = vz; data[o + 2] = Math.min(foam, 1); data[o + 3] = 1;
    }
  }
  return { data, stream: data.slice() };
}

/** Adds a brush stroke: velocity `dir` (m/s) with a Gaussian falloff of radius R around (x, z). */
export function paintFlow(f: FlowMap, x: number, z: number, dir: [number, number], R: number) {
  const ci = ((x - DOMAIN.x0) / DOMAIN.w) * FLOW_W - 0.5, cj = ((z - DOMAIN.z0) / DOMAIN.h) * FLOW_H - 0.5;
  const ri = Math.ceil((R / DOMAIN.w) * FLOW_W * 2), rj = Math.ceil((R / DOMAIN.h) * FLOW_H * 2);
  for (let j = Math.max(0, Math.floor(cj - rj)); j <= Math.min(FLOW_H - 1, Math.ceil(cj + rj)); j++) {
    for (let i = Math.max(0, Math.floor(ci - ri)); i <= Math.min(FLOW_W - 1, Math.ceil(ci + ri)); i++) {
      const o = (j * FLOW_W + i) * 4;
      if (f.data[o + 3] === 0) continue;
      const dx = ((i - ci) / FLOW_W) * DOMAIN.w, dz = ((j - cj) / FLOW_H) * DOMAIN.h;
      const w = Math.exp(-(dx * dx + dz * dz) / (R * R));
      // Blend toward the brush, so strokes steer the water rather than pile up
      f.data[o] += (dir[0] - f.data[o]) * w * 0.35;
      f.data[o + 1] += (dir[1] - f.data[o + 1]) * w * 0.35;
    }
  }
}

/** Uploads (or creates) the flow texture: RGBA16F, linear, clamped. */
export function uploadFlow(gl: WebGL2RenderingContext, tex: WebGLTexture | null, f: FlowMap) {
  const t = tex ?? gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, FLOW_W, FLOW_H, 0, gl.RGBA, gl.FLOAT, f.data);
  if (!tex) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  return t;
}

// ── The same valley in GLSL ───────────────────────────────────────────────────
const f = (v: number) => v.toFixed(3);
const rockList = ROCKS.map(r => `vec4(${f(r.x)}, ${f(r.z)}, ${f(r.r)}, ${f(r.top)})`).join(", ");

/** terrain(xz, rock) → height; rock is how much of the point is rock (0…1). */
export const TERRAIN_GLSL = `
const vec4 DOMAIN = vec4(${f(DOMAIN.x0)}, ${f(DOMAIN.z0)}, ${f(DOMAIN.w)}, ${f(DOMAIN.h)});
const int ROCK_N = ${ROCKS.length};
const vec4 ROCKS[${ROCKS.length}] = vec4[${ROCKS.length}](${rockList});

float vhash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(vhash(i), vhash(i + vec2(1, 0)), u.x), mix(vhash(i + vec2(0, 1)), vhash(i + vec2(1, 1)), u.x), u.y);
}
float vfbm(vec2 p, int oct) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 6; i++) { if (i >= oct) break; v += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v;
}

// The channel at z: centre line, half-width, depth (the same formulas as riverScene.ts)
vec3 channelAt(float z) {
  float L = smoothstep(-6.0, 16.0, z) * (1.0 - smoothstep(46.0, 70.0, z));
  float c = (1.0 - 0.75 * L) * (7.0 * sin(0.045 * z) + 3.0 * sin(0.11 * z + 1.3));
  return vec3(c, 4.5 + 13.0 * L, 1.1 + 2.4 * L);
}

float terrain(vec2 p, out float rock) {
  vec3 ch = channelAt(p.y);
  float e = abs(p.x - ch.x) - ch.y;                        // metres beyond the water's edge
  float h;
  if (e < 0.0) { float s = (p.x - ch.x) / ch.y; h = -ch.z * (1.0 - s * s); }
  else h = 0.45 * e + 7.0 * smoothstep(5.0, 32.0, e) + 14.0 * smoothstep(40.0, 140.0, e);
  // Pebbles and dunes on the bed, bumps and hills on land
  float land = smoothstep(-0.5, 3.0, e);
  h += (vfbm(p * 0.35, 4) - 0.5) * mix(0.35, 2.2, land) + (vfbm(p * 0.02 + 3.0, 3) - 0.5) * 18.0 * smoothstep(20.0, 80.0, e);
  rock = 0.0;
  for (int i = 0; i < ROCK_N; i++) {
    vec4 r = ROCKS[i];
    vec2 d = p - r.xy;
    // Squash along the flow a little, and roughen the outline
    float q = length(d * vec2(1.0, 0.85)) / (r.z * 1.25) + (vnoise(p * 2.3 + float(i) * 7.0) - 0.5) * 0.25;
    if (q < 1.0) {
      float hr = r.w + 0.35 - (r.w + 0.35 + ch.z) * q * q * q + (vnoise(p * 4.0) - 0.5) * 0.18;
      if (hr > h) { rock = smoothstep(h, h + 0.15, hr); h = hr; }
    }
  }
  return h;
}
`;

/** The camera views the lab can jump to. */
export const RIVER_VIEWS: { id: string; target: Vec3; yaw: number; pitch: number; dist: number }[] = [
  { id: "rapids", target: [ROCKS[3].x, 0, -24], yaw: 2.6, pitch: -0.38, dist: 16 },
  { id: "lake", target: [0, 0, 30], yaw: 0.2, pitch: -0.12, dist: 34 },
  { id: "aerial", target: [0, 0, -10], yaw: 2.9, pitch: -0.95, dist: 70 },
];
