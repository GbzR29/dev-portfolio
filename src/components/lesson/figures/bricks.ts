// ── Procedural brick maps shared by the normal- and parallax-mapping figures ──
// Albedo, a tangent-space normal map and a depth map (1 − height), all derived
// from one analytic height field so they always agree.

export type BrickMaps = { albedo: HTMLCanvasElement; normal: HTMLCanvasElement; depth: HTMLCanvasElement };

// ── Procedural bricks (generated in UV space: row y ↔ v = y / size) ──────────
export const SIZE = 256; const ROWS = 6, COLS = 3, MORTAR = 0.035;
const hash = (x: number, y: number) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };

export function brickHeight(u: number, v: number) {
  const row = Math.floor(v * ROWS);
  const off = row % 2 ? 0.5 / COLS : 0;
  const bu = ((u + off) * COLS) % 1, bv = (v * ROWS) % 1;
  const edge = Math.min(bu, 1 - bu, bv * (COLS / ROWS) * 2, (1 - bv) * (COLS / ROWS) * 2) / COLS;  // distance to mortar in u units
  const bevel = Math.min(1, Math.max(0, (edge - MORTAR * 0.5) / 0.03));
  const noise = (hash(Math.floor(u * 120), Math.floor(v * 120)) - 0.5) * 0.08;
  return bevel * 0.9 + noise * bevel;
}

export function makeBrickMaps(): BrickMaps {
  const mk = () => { const c = document.createElement("canvas"); c.width = c.height = SIZE; return c; };
  const albedo = mk(), normal = mk(), depth = mk();
  const ga = albedo.getContext("2d")!, gn = normal.getContext("2d")!, gd = depth.getContext("2d")!;
  const ia = ga.createImageData(SIZE, SIZE), inn = gn.createImageData(SIZE, SIZE), id = gd.createImageData(SIZE, SIZE);
  const e = 1 / SIZE, k = 18;                     // gradient step and bump scale
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const u = (x + 0.5) / SIZE, v = (y + 0.5) / SIZE;
    const h = brickHeight(u, v);
    // Tangent-space normal from the height gradient: (−∂h/∂u, −∂h/∂v, 1)
    const dhdu = (brickHeight(u + e, v) - brickHeight(u - e, v)) / (2 * e);
    const dhdv = (brickHeight(u, v + e) - brickHeight(u, v - e)) / (2 * e);
    let nx = -dhdu / k, ny = -dhdv / k, nz = 1;
    const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const o = (y * SIZE + x) * 4;
    const dv = (1 - Math.min(1, Math.max(0, h))) * 255;          // depth = 1 − height (LearnOpenGL convention)
    id.data[o] = id.data[o + 1] = id.data[o + 2] = dv; id.data[o + 3] = 255;
    inn.data[o] = (nx * 0.5 + 0.5) * 255; inn.data[o + 1] = (ny * 0.5 + 0.5) * 255; inn.data[o + 2] = (nz * 0.5 + 0.5) * 255; inn.data[o + 3] = 255;
    const row = Math.floor(v * ROWS), col = Math.floor((u + (row % 2 ? 0.5 / COLS : 0)) * COLS);
    const tone = 0.85 + hash(row, col) * 0.3;
    const brick = h > 0.3;
    const base = brick ? [0.62 * tone, 0.3 * tone, 0.22 * tone] : [0.55, 0.53, 0.5];
    const grain = 0.9 + hash(x, y) * 0.2;
    ia.data[o] = base[0] * grain * 255; ia.data[o + 1] = base[1] * grain * 255; ia.data[o + 2] = base[2] * grain * 255; ia.data[o + 3] = 255;
  }
  ga.putImageData(ia, 0, 0); gn.putImageData(inn, 0, 0); gd.putImageData(id, 0, 0);
  return { albedo, normal, depth };
}
