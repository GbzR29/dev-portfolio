"use client";

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { useStepper, stepAmount } from "../kit/Stepper";
import { Transport } from "../kit/Transport";
import { Arrow, Label, pts } from "../kit/svg";
import { type V3, sub, lerp3, makeProjector, boxFaces, frontFacing, lightAmount, rotY } from "../kit/scene3d";
import { FigureShell } from "@/components/lesson/kit/FigureShell";
import {
  STATIONS, V_LOCAL, EYE, CAM_AHEAD, FRUSTUM, WINDOW_RECT, NDC_C, K, WIN, MODEL_YAW_DEG,
  stageAt, type Station,
} from "./journeyModel";

// ── What this figure shows ────────────────────────────────────────────────────
// One vertex on its way to the screen, seen from a FIXED viewpoint: the scene
// itself changes from one space to the next, the way the matrices change the
// numbers. Six stations: local → world (M) → view (V) → clip (P) → NDC (÷ w)
// → screen (viewport). Clip space looks like view space (nothing is divided
// yet); the pink line is the w the projection stored. In the last step the
// drawing turns to face the window. The panel shows the tracked vertex and
// the exact matrix that took it there.

const VW = 520, VH = 330;

/** Where the drawing is centred, and how big a unit is, at each station. */
const FRAME: { c: V3; unit: number }[] = [
  { c: [0, 0, 0], unit: 95 },
  { c: [1.1, 0.5, 0.2], unit: 46 },
  { c: [0.2, 0, -2.0], unit: 46 },
  { c: [0.2, 0, -2.0], unit: 46 },
  { c: NDC_C, unit: 50 },
  { c: NDC_C, unit: 56 },
];
const ORBIT = { yaw: -0.62, pitch: 0.34 };

const f2 = (n: number) => (Math.abs(n) < 0.005 ? 0 : n).toFixed(2);
const fv = (v: number[]) => `(${v.map(f2).join(", ")})`;

// Ground grid at y = −0.5 (world space); drawn in world and view space only
const GRID: [V3, V3][] = Array.from({ length: 7 }, (_, i) => i - 3).flatMap(k => [
  [[k, -0.5, -3], [k, -0.5, 3]] as [V3, V3],
  [[-3, -0.5, k], [3, -0.5, k]] as [V3, V3],
]);
const FR_EDGES = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];

function MatrixGrid({ m, color }: { m: Float32Array; color: string }) {
  return (
    <span className="inline-grid grid-cols-4 gap-x-2 px-1.5 py-0.5 border-x font-mono text-[10.5px] tabular-nums" style={{ borderColor: color }}>
      {Array.from({ length: 16 }, (_, i) => {
        const r = Math.floor(i / 4), c = i % 4;
        return <span key={i} className="text-right">{f2(m[c * 4 + r])}</span>;
      })}
    </span>
  );
}

export function VertexJourneyFigure({ t }: { t?: TrackTranslations }) {
  const st = useStepper(5, 1500, 700);
  const p = st.p;
  const aM = stepAmount(p, 1), aC = stepAmount(p, 3), aN = stepAmount(p, 4), aS = stepAmount(p, 5);
  const current = Math.round(st.raw);

  // ── The fixed viewpoint; only the frame (centre, scale) follows the scene ─
  const i0 = Math.min(4, Math.floor(p)), fr = p - i0;
  const centre = lerp3(FRAME[i0].c, FRAME[i0 + 1].c, fr);
  const unit = FRAME[i0].unit + (FRAME[i0 + 1].unit - FRAME[i0].unit) * fr;
  // In the last step the drawing turns to face the window, as the camera sees it
  const P0 = makeProjector({ yaw: ORBIT.yaw * (1 - aS), pitch: ORBIT.pitch * (1 - aS), zoom: 1 }, VW / 2, VH / 2 + 8, unit, 14);
  const D = (q: V3) => P0(sub(q, centre));
  const L = (q: V3) => D(stageAt(q, p, true));        // a point of the cube (local space)
  const Wd = (q: V3) => D(stageAt(q, p, false));      // a point of the scene (world space)

  // ── The cube: faces turned toward the viewer, far to near ────────────────
  const preP = Math.min(p, 4);
  const faces = boxFaces([0, 0, 0], [0.5, 0.5, 0.5]).map(fc => {
    const sp = fc.pts.map(L);
    const depth = fc.pts.map(q => P0(sub(stageAt(q, preP, true), centre)).depth).reduce((a, b) => a + b, 0) / 4;
    const n = rotY(fc.normal, (MODEL_YAW_DEG * Math.PI / 180) * aM);
    return { sp, depth, light: lightAmount(n), front: frontFacing(sp) };
  }).filter(f => f.front).sort((a, b) => b.depth - a.depth);

  const vtx = L(V_LOCAL);
  const st0 = STATIONS[current];
  const showWorld = aM > 0 && aN === 0;                // grid, camera: until the divide
  // The w of clip space: the vertex's distance in front of the camera, along −z
  // (from view space on, the camera is at (0, 0, 0) and the drawing is in view units)
  const vView = stageAt(V_LOCAL, 3, true);
  const origin = D([0, 0, 0]), wFoot = D([0, 0, vView[2]]);
  const wAlpha = aC * (1 - aN);

  const captions: Record<string, string> = {
    local: tx(t, "figVJ_c0", "Local space: the cube as you typed it in vertices[], centred on its own (0, 0, 0). The orange dot is the corner we follow, (0.5, 0.5, 0.5)."),
    world: tx(t, "figVJ_c1", "The model matrix turns the cube 35° around y and moves it to (1, 0, −1), its place in the scene. The camera and the space it can see (the blue frustum) are part of the scene too."),
    view: tx(t, "figVJ_c2", "The view matrix moves the whole scene so the camera sits at (0, 0, 0), looking down −z. Nothing changed shape: the numbers are now measured from the camera."),
    clip: tx(t, "figVJ_c3", "The projection matrix adds a fourth number, w: how far the vertex is in front of the camera (the pink line). x, y and z are scaled so the frustum's walls will land on −1 and 1. Nothing is divided yet, so the picture does not move."),
    ndc: tx(t, "figVJ_c4", "The GPU divides x, y and z by w. Far things shrink, and the frustum becomes the NDC cube: −1 to 1 on every axis, near at z = −1, far at z = +1."),
    screen: tx(t, "figVJ_c5", `The viewport turns x and y into pixels of a ${WIN.w} × ${WIN.h} window, with (0, 0) at the bottom-left. z goes to the depth buffer, from 0 at the near plane to 1 at the far plane.`),
  };

  const opLine = (s: Station, i: number) => {
    const prev = STATIONS[i - 1];
    if (!s.op || !prev) return <span className="text-[var(--text-muted)]">{tx(t, "figVJ_start", "the numbers in vertices[], with w = 1")}</span>;
    if (s.op.matrix) return (
      <span className="inline-flex items-center gap-1.5 flex-wrap">
        <MatrixGrid m={s.op.matrix} color={s.color} />
        <span>· {fv(prev.value)} = <b style={{ color: s.color }}>{fv(s.value)}</b></span>
      </span>
    );
    return <span>{s.op.formula} = <b style={{ color: s.color }}>{s.id === "screen" ? `(${s.value[0].toFixed(0)}, ${s.value[1].toFixed(0)}, ${s.value[2].toFixed(3)})` : fv(s.value)}</b></span>;
  };

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figVJ_title", "A vertex's journey, local to screen")}
        </span>
        <div className="flex gap-1 flex-wrap">
          {STATIONS.map((s, i) => (
            <button key={s.id} type="button" onClick={() => st.scrub(i)}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg border transition-all ${i === current
                ? "bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`}
              style={i === current ? { color: s.color, borderColor: s.color } : undefined}>
              {tx(t, `figVJ_n_${s.id}`, s.name)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto select-none" role="img" aria-label="A vertex travelling from local space to the screen">
          {/* Ground grid */}
          {showWorld && GRID.map(([a, b], i) => {
            const A = Wd(a), B = Wd(b);
            return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="var(--code-line)" strokeWidth="0.8" opacity={Math.min(1, aM * 2)} />;
          })}

          {/* Axes: the cube's own in local space, the scene's (or the camera's) afterwards */}
          {aN === 0 && ([[1, 0, 0], [0, 1, 0], [0, 0, 1]] as V3[]).map((d, i) => {
            const o = aM > 0 ? Wd([0, 0, 0]) : L([0, 0, 0]);
            const e = aM > 0 ? Wd(d) : L(d.map(n => n * 1.25) as V3);
            return (
              <g key={i} opacity={0.85}>
                <Arrow a={o} b={e} color="var(--code-muted)" w={1.1} head={5} />
                <text x={e.x + 4} y={e.y + 3} fill="var(--code-muted)" fontSize="9" fontFamily="monospace">{"xyz"[i]}</text>
              </g>
            );
          })}

          {/* Frustum: a pyramid in the scene, a box after the divide, the window at the end */}
          {aM > 0 && FR_EDGES.map(([a, b], i) => {
            const A = Wd(FRUSTUM[a]), B = Wd(FRUSTUM[b]);
            return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#3b82f6" strokeOpacity={0.65 * (1 - aS)} strokeWidth="1" opacity={Math.min(1, aM * 2)} />;
          })}

          {/* The window */}
          {aS > 0 && (() => {
            const r = WINDOW_RECT.map(D);
            return (
              <g opacity={aS}>
                <polygon points={pts(r)} fill="rgba(245,158,11,0.07)" stroke="#f59e0b" strokeWidth="1.4" />
                <Label x={r[0].x} y={r[0].y + 14} color="#f59e0b">(0, 0)</Label>
                <Label x={r[2].x} y={r[2].y - 6} anchor="end" color="#f59e0b">{`(${WIN.w}, ${WIN.h})`}</Label>
              </g>
            );
          })()}

          {/* NDC cube corners */}
          {aN > 0 && aS < 1 && (() => {
            const a = D([NDC_C[0] - K, NDC_C[1] - K, NDC_C[2] + K]), b = D([NDC_C[0] + K, NDC_C[1] + K, NDC_C[2] - K]);
            return (
              <g opacity={aN * (1 - aS)}>
                <Label x={a.x - 6} y={a.y + 14} anchor="end" color="#fb923c">(−1, −1, −1)</Label>
                <Label x={b.x + 6} y={b.y - 4} color="#fb923c">(1, 1, 1)</Label>
              </g>
            );
          })()}

          {/* The camera */}
          {showWorld && (() => {
            const c = Wd(EYE);
            return (
              <g opacity={Math.min(1, aM * 2)}>
                <Arrow a={c} b={Wd(CAM_AHEAD)} color="#3b82f6" w={2} head={6} />
                <circle cx={c.x} cy={c.y} r={4.5} fill="var(--text-main)" />
                <Label x={c.x + 9} y={c.y - 7} color="var(--text-main)">{tx(t, "figVJ_camera", "camera")}</Label>
              </g>
            );
          })()}

          {/* The cube */}
          {faces.map((f, i) => {
            const g = Math.round(90 + 110 * f.light);
            return <polygon key={i} points={pts(f.sp)} fill={`rgb(${g - 10},${g - 30},${g + 40})`} stroke="#c4b5fd" strokeOpacity={0.6} strokeWidth="1" strokeLinejoin="round" />;
          })}

          {/* w: the distance in front of the camera, along −z */}
          {wAlpha > 0 && (
            <g opacity={wAlpha}>
              <line x1={origin.x} y1={origin.y} x2={wFoot.x} y2={wFoot.y} stroke="#f472b6" strokeWidth="2.5" />
              <line x1={wFoot.x} y1={wFoot.y} x2={vtx.x} y2={vtx.y} stroke="#f472b6" strokeWidth="1.2" strokeDasharray="3 3" />
              <Label x={(origin.x + wFoot.x) / 2 - 6} y={(origin.y + wFoot.y) / 2 + 14} anchor="end" color="#f472b6" bold>
                {`w = ${f2(STATIONS[3].value[3])}`}
              </Label>
            </g>
          )}

          {/* The tracked vertex */}
          <circle cx={vtx.x} cy={vtx.y} r={5} fill="#f59e0b" stroke="var(--code-bg)" strokeWidth="1.5" />
          <Label x={vtx.x + 9} y={vtx.y - 6} color="#f59e0b" bold>
            {aS > 0.5 ? `(${STATIONS[5].value[0].toFixed(0)}, ${STATIONS[5].value[1].toFixed(0)}) px` : "v"}
          </Label>

          {/* Name of the space */}
          <Label x={12} y={22} color={st0.color} bold size={11}>
            {tx(t, `figVJ_s_${st0.id}`, `${st0.name} space`)}
          </Label>
        </svg>
        <Transport t={t} speed playing={st.playing} onPlay={st.play} onStep={st.next} onBack={st.prev} onReset={st.restart}
          playLabel={tx(t, "figVJ_play", "follow the vertex")} readout={`${current} / 5`} />
      </div>

      <div className="p-4 md:p-5 space-y-3">
        <p className="text-[12.5px] text-[var(--text-main)] leading-relaxed min-h-[40px]">{captions[st0.id]}</p>
        <div className="font-mono text-[11px] text-[var(--text-main)] overflow-x-auto">{opLine(st0, current)}</div>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-[10.5px] border-collapse">
            <tbody>
              {STATIONS.map((s, i) => (
                <tr key={s.id} onClick={() => st.scrub(i)}
                  className={`cursor-pointer transition-colors ${i === current ? "bg-[var(--primary-low)]" : "hover:bg-[var(--primary-low)]/50"}`}
                  style={{ opacity: i > current ? 0.4 : 1 }}>
                  <td className="py-1 px-2 whitespace-nowrap font-bold" style={{ color: s.color }}>{tx(t, `figVJ_n_${s.id}`, s.name)}</td>
                  <td className="py-1 px-2 whitespace-nowrap text-[var(--text-muted)]">{s.op?.label ?? "v"}</td>
                  <td className="py-1 px-2 whitespace-nowrap">
                    {i > current ? "…" : s.id === "screen"
                      ? `(${s.value[0].toFixed(0)}, ${s.value[1].toFixed(0)}) px · ${tx(t, "figVJ_depth", "depth")} ${s.value[2].toFixed(3)}`
                      : fv(s.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </FigureShell>
  );
}
