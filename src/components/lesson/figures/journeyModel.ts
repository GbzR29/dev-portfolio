// ── The numbers behind VertexJourneyFigure ────────────────────────────────────
// One cube, one camera and one tracked corner, pushed through the real
// matrices (column-major, as GLM builds them): model, view (glm::lookAt),
// projection (glm::perspective), the divide by w and the viewport. The figure
// draws from `stageAt(p)`; the panel prints the exact values from `STATIONS`.

import { mat4, type Mat4 } from "../kit/gl/gl";
import { add, lerp3, scale, type Vec3 } from "../kit/vec3";

export type Vec4 = [number, number, number, number];

// ── The scene ────────────────────────────────────────────────────────────────
export const V_LOCAL: Vec3 = [0.5, 0.5, 0.5];                 // the corner we follow
export const MODEL_POS: Vec3 = [1, 0, -1];
export const MODEL_YAW_DEG = 35;
export const EYE: Vec3 = [1.9, 1.1, 1.7];
export const TARGET: Vec3 = [0.7, 0.1, -0.7];
export const FOV_DEG = 50, ASPECT = 1.6, NEAR = 1, FAR = 4;
export const WIN = { w: 1280, h: 800 };

const rad = (d: number) => (d * Math.PI) / 180;

/** glm::rotate(glm::mat4(1), angle, (0, 1, 0)) */
function rotY(a: number): Mat4 {
  const m = mat4.identity(), c = Math.cos(a), s = Math.sin(a);
  m[0] = c; m[2] = -s; m[8] = s; m[10] = c;
  return m;
}

export const M = mat4.multiply(mat4.translation(...MODEL_POS), rotY(rad(MODEL_YAW_DEG)));
export const V = mat4.lookAt(EYE, TARGET, [0, 1, 0]);
export const P = mat4.perspective(rad(FOV_DEG), ASPECT, NEAR, FAR);

/** Matrix × vec4, column-major. */
export function mulV(m: Mat4, v: Vec4): Vec4 {
  const o: Vec4 = [0, 0, 0, 0];
  for (let r = 0; r < 4; r++) o[r] = m[r] * v[0] + m[4 + r] * v[1] + m[8 + r] * v[2] + m[12 + r] * v[3];
  return o;
}
const pt = (m: Mat4, p: Vec3): Vec3 => { const o = mulV(m, [...p, 1]); return [o[0], o[1], o[2]]; };

// ── The tracked vertex, station by station ───────────────────────────────────
const local: Vec4 = [...V_LOCAL, 1];
const world = mulV(M, local);
const view = mulV(V, world);
const clip = mulV(P, view);
const ndc: Vec3 = [clip[0] / clip[3], clip[1] / clip[3], clip[2] / clip[3]];
const screen: Vec3 = [((ndc[0] + 1) / 2) * WIN.w, ((ndc[1] + 1) / 2) * WIN.h, (ndc[2] + 1) / 2];

export type StationId = "local" | "world" | "view" | "clip" | "ndc" | "screen";
export type Station = {
  id: StationId;
  name: string;
  color: string;
  /** The operation that leads INTO this station (none for the first). */
  op: { label: string; matrix?: Mat4; formula?: string } | null;
  value: number[];
};

export const STATIONS: Station[] = [
  { id: "local",  name: "Local",  color: "#60a5fa", op: null, value: local },
  { id: "world",  name: "World",  color: "#34d399", op: { label: "M · v", matrix: M }, value: world },
  { id: "view",   name: "View",   color: "#a78bfa", op: { label: "V · M · v", matrix: V }, value: view },
  { id: "clip",   name: "Clip",   color: "#f472b6", op: { label: "P · V · M · v", matrix: P }, value: clip },
  { id: "ndc",    name: "NDC",    color: "#fb923c", op: { label: "÷ w", formula: "(x / w, y / w, z / w)" }, value: ndc },
  { id: "screen", name: "Screen", color: "#f59e0b", op: { label: "viewport", formula: `((x+1)/2 · ${WIN.w}, (y+1)/2 · ${WIN.h}, (z+1)/2)` }, value: screen },
];

// ── Drawing: every point through the stations, partway ──────────────────────
// p runs 0…5. Station k is reached at p = k; between two stations the point
// slides from one to the next. Clip space is drawn like view space (nothing
// moves until the divide); the NDC cube is drawn K units wide at NDC_C, with z
// flipped back so the picture keeps the same handedness as view space.
export const K = 1.6;
export const NDC_C: Vec3 = [0, 0, -3.4];
const ndcDisplay = (n: Vec3): Vec3 => add(NDC_C, [n[0] * K, n[1] * K, -n[2] * K]);

const amount = (p: number, k: number) => Math.max(0, Math.min(1, p - (k - 1)));

/** Where a point is drawn at progress p. `isLocal` points get the model matrix; world points (camera, frustum) do not. */
export function stageAt(q: Vec3, p: number, isLocal: boolean): Vec3 {
  const aM = amount(p, 1), aV = amount(p, 2), aN = amount(p, 4), aS = amount(p, 5);
  const w = isLocal ? lerp3(q, pt(M, q), aM) : q;
  const v = lerp3(w, pt(V, w), aV);
  if (aN === 0) return v;
  const c = mulV(P, [...v, 1]);
  const n = ndcDisplay([c[0] / c[3], c[1] / c[3], c[2] / c[3]]);
  const m = lerp3(v, n, aN);
  // The viewport: stretch x back out to the window's shape, flatten z onto the window
  return [NDC_C[0] + (m[0] - NDC_C[0]) * (1 + (ASPECT - 1) * aS), m[1], m[2] + (NDC_C[2] - m[2]) * aS];
}

/** The window rectangle of the screen station, in drawing units. */
export const WINDOW_RECT: Vec3[] = [[-K * ASPECT, -K, NDC_C[2]], [K * ASPECT, -K, NDC_C[2]], [K * ASPECT, K, NDC_C[2]], [-K * ASPECT, K, NDC_C[2]]];

/** The frustum's 8 corners in world space (near rectangle, then far). */
export const FRUSTUM: Vec3[] = (() => {
  const inv = invertRigid(V);
  const th = Math.tan(rad(FOV_DEG) / 2);
  const rect = (d: number): Vec3[] => {
    const h = th * d, w = h * ASPECT;
    return [[-w, -h, -d], [w, -h, -d], [w, h, -d], [-w, h, -d]];
  };
  return [...rect(NEAR), ...rect(FAR)].map(c => pt(inv, c));
})();

/** Inverse of a rotation + translation matrix (the view matrix). */
function invertRigid(m: Mat4): Mat4 {
  const o = mat4.identity();
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[c * 4 + r] = m[r * 4 + c];
  for (let r = 0; r < 3; r++) o[12 + r] = -(o[r] * m[12] + o[4 + r] * m[13] + o[8 + r] * m[14]);
  return o;
}

/** The camera's forward direction in world space, for its little arrow. */
export const CAM_AHEAD: Vec3 = add(EYE, scale(pt(invertRigid(V), [0, 0, -1]).map((n, i) => n - EYE[i]) as Vec3, 0.8));
