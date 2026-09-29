// ── The detail texture the flow carries ───────────────────────────────────────
// One tileable 256 × 256 RGBA8 texture, made on the CPU once:
//   R, G  the x and z slopes of a field of small ripples (0.5 = flat)
//   B     a foam pattern: bright webs between cells, like foam on moving water
//   A     smooth low-frequency noise, for the per-point phase offset
// Everything is periodic over the tile, so it repeats without seams.

export const DETAIL_N = 256;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/** Periodic value noise with `f` cells across the tile. */
function periodicNoise(f: number, seed: number) {
  const r = rng(seed), g = Array.from({ length: f * f }, r);
  return (u: number, v: number) => {
    const x = u * f, y = v * f, ix = Math.floor(x), iy = Math.floor(y), tx = x - ix, ty = y - iy;
    const at = (a: number, b: number) => g[((a % f) + f) % f + (((b % f) + f) % f) * f];
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    return (at(ix, iy) * (1 - sx) + at(ix + 1, iy) * sx) * (1 - sy) + (at(ix, iy + 1) * (1 - sx) + at(ix + 1, iy + 1) * sx) * sy;
  };
}

/** Periodic cellular noise: F2 − F1, small on the borders between cells. */
function periodicCells(f: number, seed: number) {
  const r = rng(seed), pts = Array.from({ length: f * f }, () => [r(), r()]);
  return (u: number, v: number) => {
    const x = u * f, y = v * f, ix = Math.floor(x), iy = Math.floor(y);
    let d1 = 9, d2 = 9;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const cx = ix + i, cy = iy + j, p = pts[((cx % f) + f) % f + (((cy % f) + f) % f) * f];
      const d = Math.hypot(cx + p[0] - x, cy + p[1] - y);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
    }
    return d2 - d1;
  };
}

export function makeDetailTexture(gl: WebGL2RenderingContext): WebGLTexture {
  const N = DETAIL_N;
  // Ripple heights: four octaves, each with twice the cells and 55% of the height
  const oct = [4, 8, 16, 32].map((f, i) => periodicNoise(f, 11 + i));
  const H = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let h = 0, a = 1;
    for (const o of oct) { h += a * o(x / N, y / N); a *= 0.55; }
    H[y * N + x] = h;
  }
  const cellsA = periodicCells(10, 5), cellsB = periodicCells(23, 9);
  const breakup = periodicNoise(6, 21), blobs = periodicNoise(16, 27), phase = periodicNoise(4, 33);
  const px = new Uint8Array(N * N * 4);
  const at = (x: number, y: number) => H[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    // Slopes by central differences (height per texel), scaled into 0…255
    const sx = (at(x + 1, y) - at(x - 1, y)) * 0.5, sz = (at(x, y + 1) - at(x, y - 1)) * 0.5;
    const u = x / N, v = y / N;
    // Soft webs between cells at two sizes, broken up into patches, plus small blobs
    const web = Math.max(1 - cellsA(u, v) / 0.3, 0) ** 2 * 0.65 + Math.max(1 - cellsB(u, v) / 0.25, 0) ** 2 * 0.45;
    const foam = Math.min(Math.max(web * (0.3 + breakup(u, v)) + (blobs(u, v) - 0.45) * 0.6, 0), 1);
    const o = (y * N + x) * 4;
    px[o] = Math.round(Math.min(Math.max(0.5 + sx * 12, 0), 1) * 255);
    px[o + 1] = Math.round(Math.min(Math.max(0.5 + sz * 12, 0), 1) * 255);
    px[o + 2] = Math.round(foam * 255);
    px[o + 3] = Math.round(phase(u, v) * 255);
  }
  const t = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
  if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
  return t;
}

// ── Advection by two phases (GLSL) ────────────────────────────────────────────
// Declares uDetail, uFlowTime, uPeriod, uOffset. flowDetail(xz, vel, tile)
// samples the detail texture carried along by the velocity vel (m/s), tiled
// every `tile` metres. It returns the blended slopes (xy, zero-mean) and foam (z).
export const FLOW_GLSL = `
uniform sampler2D uDetail;
uniform float uFlowTime;           // seconds
uniform float uPeriod;             // T: seconds between resets of one phase
uniform float uOffset;             // 0…1: how much the noise offsets each point's phase
uniform int   uFlowMode;           // 0 scroll, 1 one phase, 2 two phases

vec3 flowDetail(vec2 xz, vec2 vel, float tile) {
  // Fast water draws its ripples and foam out into streaks along the current:
  // the texture is read in a frame turned to the flow (d along it, e across)
  // and stretched k times along it. Slopes read in that frame turn back to
  // world axes by the chain rule: ∂/∂world = (∂/∂u)·d/k + (∂/∂v)·e.
  float spd = length(vel);
  vec2 d = spd > 1e-3 ? vel / spd : vec2(1.0, 0.0), e = vec2(-d.y, d.x);
  float k = 1.0 + 0.9 * min(spd, 2.0);
  mat2 toTex = mat2(d.x / k, e.x, d.y / k, e.y);        // rows: d/k, e
  mat2 toWorld = mat2(d / k, e);                          // columns: d/k, e
  if (uFlowMode == 0) {
    vec4 s = texture(uDetail, toTex * (xz - vel * uFlowTime) / tile);
    return vec3(toWorld * (s.rg * 2.0 - 1.0), s.b);
  }
  float tt = uFlowTime / uPeriod + texture(uDetail, xz / (tile * 6.0)).a * uOffset * 2.0;
  vec3 acc = vec3(0.0);
  float w2 = 0.0;
  int phases = uFlowMode == 1 ? 1 : 2;
  for (int k = 0; k < 2; k++) {
    if (k >= phases) break;
    float fk = float(k) * 0.5;
    float ph = fract(tt + fk);
    // Triangle weight: 0 at the reset, 1 half-way; the two phases always sum to 1
    float w = phases == 1 ? 1.0 : 1.0 - abs(1.0 - 2.0 * ph);
    // A jump at every reset, so the same pattern does not come back each cycle
    vec2 jump = floor(tt + fk) * vec2(0.213, 0.371) + fk;
    vec4 s = texture(uDetail, toTex * (xz - vel * ph * uPeriod) / tile + jump);
    acc += w * vec3(toWorld * (s.rg * 2.0 - 1.0), s.b);
    w2 += w * w;
  }
  // Two uncorrelated patterns averaged half and half are flatter than either:
  // dividing the zero-mean slopes by √(Σw²) keeps their strength constant
  return vec3(acc.xy / sqrt(max(w2, 0.25)), acc.z);
}
`;
