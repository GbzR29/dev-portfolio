// src/components/lesson/figures/ndc/ndc3dDraw.ts
// The canvas pass of the NDC 3D widget: grid, NDC cube, axes, shape, handles, gizmo, legend.
import {
  SIZE, NEAR, NEAR_FADE, GIZMO_LEN, PALETTES, GRID_GAIN, AXIS_COLOR, AXIS_NAME, AXIS_DIR,
  CUBE_V, CUBE_FACES, CUBE_E, GRID_FAR, GRID_STEP, GRID_Y, GRID_N, GRID_BASE,
  toView, viewToScreen, clipNear, clamp01, dt, hexRgb,
  type Vec3, type Pt, type Axis, type GridKind, type ShapeData,
} from "./ndc3dScene";

export type Ndc3dFrame = {
  theme: "dark" | "light";
  rot: { x: number; y: number };
  zoom: number;
  pan: Pt;
  shape: ShapeData;
  verts: Vec3[];
  selected: number | null;
  hover: { vertex: number | null; axis: Axis | null };
  dragAxis: Axis | null;   // gizmo arm being dragged, drawn highlighted
};

/** Paints one frame and returns what hit testing needs: projected vertices and gizmo arms. */
export function drawNdc3d(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, f: Ndc3dFrame) {
  const { theme, rot, zoom, pan, shape, verts, selected, hover, dragAxis } = f;
  let gizmo: { origin: Pt; tips: Pt[] } | null = null;

  // The canvas sits on --code-bg, which follows the theme.
  const C = PALETTES[theme];
  const gridGain = GRID_GAIN[theme];

  // Shown at up to 400 CSS px, so render a little above the logical size to stay sharp
  const dpr = Math.min(window.devicePixelRatio || 1, 2) * (400 / SIZE);
  const px  = Math.round(SIZE * dpr);
  if (canvas.width !== px) { canvas.width = px; canvas.height = px; }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, SIZE, SIZE);

  const view = (x: number, y: number, z: number) => toView(x, y, z, rot.x, rot.y);
  const proj = (x: number, y: number, z: number) => viewToScreen(view(x, y, z), zoom, pan);

  // ── Reference grid at y = GRID_Y ───────────────────────────────────────
  const paths: Record<GridKind, Map<number, Path2D>> = {
    axis: new Map(), unit: new Map(), sub: new Map(),
  };

  const addSeg = (kind: GridKind, x0: number, z0: number, x1: number, z1: number) => {
    const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
    const radial = 1 - Math.min(1, Math.hypot(mx, mz) / GRID_FAR) ** 2;
    if (radial <= 0.001) return;

    const seg = clipNear(view(x0, GRID_Y, z0), view(x1, GRID_Y, z1));
    if (!seg) return;

    const nearFade = clamp01((Math.min(seg[0].z, seg[1].z) - NEAR) / NEAR_FADE);
    const alpha = Math.min(1, GRID_BASE[kind] * gridGain * radial * nearFade);
    if (alpha < 0.012) return;

    const bucket = Math.round(alpha * 50) / 50;
    let path = paths[kind].get(bucket);
    if (!path) { path = new Path2D(); paths[kind].set(bucket, path); }
    const a = viewToScreen(seg[0], zoom, pan), b = viewToScreen(seg[1], zoom, pan);
    path.moveTo(a.x, a.y);
    path.lineTo(b.x, b.y);
  };

  const kindOf = (v: number): GridKind =>
    Math.abs(v) < 1e-6 ? "axis" : Math.abs(v - Math.round(v)) < 1e-6 ? "unit" : "sub";

  for (let i = -GRID_N; i <= GRID_N; i++) {
    const v = i * GRID_STEP;
    const kind = kindOf(v);
    for (let j = -GRID_N; j < GRID_N; j++) {
      const a = j * GRID_STEP, b = a + GRID_STEP;
      addSeg(kind, v, a, v, b);
      addSeg(kind, a, v, b, v);
    }
  }

  (["sub", "unit", "axis"] as GridKind[]).forEach(kind => {
    ctx.lineWidth = kind === "axis" ? 1.2 : 0.6;
    paths[kind].forEach((path, alpha) => {
      ctx.strokeStyle = C.grid(alpha);
      ctx.stroke(path);
    });
  });

  // ── NDC cube ──────────────────────────────────────────────────────────
  const cubeP = CUBE_V.map(([x,y,z]) => ({ p: proj(x,y,z), z: view(x,y,z).z }));

  CUBE_FACES
    .map(f => ({ f, depth: f.reduce((s,i) => s + cubeP[i].z, 0) / f.length }))
    .sort((a, b) => b.depth - a.depth)
    .forEach(({ f, depth }) => {
      ctx.beginPath();
      ctx.moveTo(cubeP[f[0]].p.x, cubeP[f[0]].p.y);
      f.slice(1).forEach(i => ctx.lineTo(cubeP[i].p.x, cubeP[i].p.y));
      ctx.closePath();
      ctx.fillStyle = C.cube(0.04 + (1 - dt(depth)) * 0.06);
      ctx.fill();
    });

  CUBE_E
    .map(([a, b]) => ({ a, b, depth: (cubeP[a].z + cubeP[b].z) / 2 }))
    .sort((x, y) => y.depth - x.depth)
    .forEach(({ a, b, depth }) => {
      const t = dt(depth);
      ctx.beginPath();
      ctx.moveTo(cubeP[a].p.x, cubeP[a].p.y);
      ctx.lineTo(cubeP[b].p.x, cubeP[b].p.y);
      ctx.strokeStyle = C.cube(0.07 + (1 - t) * 0.58);
      ctx.lineWidth   = t < 0.4 ? 1.8 : 0.8;
      ctx.setLineDash(t > 0.55 ? [4, 4] : []);
      ctx.stroke();
      ctx.setLineDash([]);
    });

  cubeP.forEach(({ p, z }) => {
    const t = dt(z);
    ctx.beginPath();
    ctx.arc(p.x, p.y, t < 0.4 ? 3.5 : 2, 0, Math.PI * 2);
    ctx.fillStyle = C.cube(0.1 + (1 - t) * 0.6);
    ctx.fill();
  });

  // ── World axes ────────────────────────────────────────────────────────
  const o = proj(0, 0, 0);
  AXIS_DIR.forEach((d, i) => {
    const v = proj(d[0] * 0.85, d[1] * 0.85, d[2] * 0.85);
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.lineTo(v.x, v.y);
    ctx.strokeStyle = AXIS_COLOR[i];
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = AXIS_COLOR[i];
    ctx.font = "bold 11px monospace";
    ctx.fillText(AXIS_NAME[i], v.x + 4, v.y - 3);
  });

  // ── Shape ─────────────────────────────────────────────────────────────
  const { r, g, b } = hexRgb(shape.color);
  const shapeV = verts.map(([x,y,z]) => view(x,y,z));
  const shapeP = shapeV.map(v => viewToScreen(v, zoom, pan));
  const screenVerts = shapeP;

  shape.faces
    .filter(f => f.every(i => i < shapeP.length))
    .map(f => ({ f, depth: f.reduce((s,i) => s + shapeV[i].z, 0) / f.length }))
    .sort((a, b) => b.depth - a.depth)
    .forEach(({ f, depth }) => {
      const t = dt(depth);
      const pts = f.map(i => shapeP[i]);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fillStyle   = `rgba(${r},${g},${b},${0.20 + (1-t) * 0.18})`;
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.55 + (1-t) * 0.35})`;
      ctx.lineWidth   = 1.6;
      ctx.fill();
      ctx.stroke();
    });

  // Vertex handles
  shapeP.forEach((p, i) => {
    const active   = selected === i || hover.vertex === i;
    const inBounds = verts[i].every(c => Math.abs(c) <= 1.0001);
    const color    = inBounds ? shape.color : "#ef4444";

    if (active) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},0.18)`;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, active ? 6.5 : 5, 0, Math.PI * 2);
    ctx.fillStyle   = color;
    ctx.strokeStyle = active ? C.ringActive : C.ring;
    ctx.lineWidth   = 1.5;
    ctx.setLineDash(inBounds ? [] : [3, 2]);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = color;
    ctx.font      = "bold 9px monospace";
    ctx.fillText(`v${i}`, p.x + 8, p.y - 3);
  });

  // ── Gizmo on the selected vertex ──────────────────────────────────────
  if (selected !== null && selected < verts.length) {
    const [vx, vy, vz] = verts[selected];
    const origin = proj(vx, vy, vz);
    const tips = AXIS_DIR.map(d =>
      proj(vx + d[0] * GIZMO_LEN, vy + d[1] * GIZMO_LEN, vz + d[2] * GIZMO_LEN));
    gizmo = { origin, tips };

    // Draw the arm pointing most away from the camera first
    const order = [0, 1, 2].sort((a, c) => {
      const za = toView(vx + AXIS_DIR[a][0] * GIZMO_LEN, vy + AXIS_DIR[a][1] * GIZMO_LEN,
                        vz + AXIS_DIR[a][2] * GIZMO_LEN, rot.x, rot.y).z;
      const zc = toView(vx + AXIS_DIR[c][0] * GIZMO_LEN, vy + AXIS_DIR[c][1] * GIZMO_LEN,
                        vz + AXIS_DIR[c][2] * GIZMO_LEN, rot.x, rot.y).z;
      return zc - za;
    });

    order.forEach(i => {
      const tip    = tips[i];
      const active = hover.axis === i || dragAxis === i;
      const len    = Math.hypot(tip.x - origin.x, tip.y - origin.y);

      // An arm pointing almost straight at the camera cannot be dragged
      const usable = len > 6;

      ctx.globalAlpha = usable ? 1 : 0.25;
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.strokeStyle = AXIS_COLOR[i];
      ctx.lineWidth   = active ? 3.5 : 2;
      ctx.lineCap     = "round";
      ctx.stroke();

      // Arrow head
      if (len > 8) {
        const ux = (tip.x - origin.x) / len, uy = (tip.y - origin.y) / len;
        const size = active ? 7 : 5.5;
        ctx.beginPath();
        ctx.moveTo(tip.x + ux * size, tip.y + uy * size);
        ctx.lineTo(tip.x - uy * size * 0.5, tip.y + ux * size * 0.5);
        ctx.lineTo(tip.x + uy * size * 0.5, tip.y - ux * size * 0.5);
        ctx.closePath();
        ctx.fillStyle = AXIS_COLOR[i];
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.lineCap = "butt";
    });
  } else {
    gizmo = null;
  }

  // ── Legend ────────────────────────────────────────────────────────────
  ctx.fillStyle = C.legend;
  ctx.font      = "9px monospace";
  ctx.fillText("NDC cube  [-1, 1]³", 8, 15);
  ctx.fillText(
    selected !== null
      ? `v${selected} selected · drag an arrow to move on one axis`
      : `zoom ${zoom.toFixed(1)}×  ·  click a vertex  ·  drag to orbit`,
    8, SIZE - 7);

  return { screenVerts, gizmo };
}
