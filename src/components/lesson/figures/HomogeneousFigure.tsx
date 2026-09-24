"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { useStepper, stepAmount, StepperControls } from "./Stepper";
import { Arrow, Label, pts } from "./svg";
import { type V3, makeProjector, useOrbit } from "./scene3d";

// ── What this figure shows ────────────────────────────────────────────────────
// The 2D version of the w trick. A 2D point (x, y) becomes (x, y, 1): the plane
// is lifted to height w = 1. A 3×3 matrix with (tx, ty) in its last column is a
// shear of 3D space — linear, the origin stays put — but on the w = 1 plane it
// slides everything by (tx, ty). A direction (x, y, 0) lives on the w = 0 floor,
// where the shear does nothing: directions ignore translation.
//
// World layout for drawing: [x, w, y] — x to the right, w up, y into depth.

const VW = 560, VH = 300;
const COL_W   = "#a855f7";
const COL_T   = "#f59e0b";
const COL_DIR = "#06b6d4";

// An "F", so the slide is easy to follow
const SHAPE: [number, number][] = [
  [-1.2, -0.9], [-1.2, 0.9], [-0.2, 0.9], [-0.2, 0.6], [-0.9, 0.6], [-0.9, 0.2],
  [-0.4, 0.2], [-0.4, -0.1], [-0.9, -0.1], [-0.9, -0.9],
];
const DIR: [number, number] = [0.9, 0.5];

const f2 = (n: number) => (Math.abs(n) < 0.005 ? 0 : n).toFixed(2);

export function HomogeneousFigure({ t }: { t?: TrackTranslations }) {
  const [tx_, setTx] = useState(1.6);
  const [ty_, setTy] = useState(0.8);
  const st = useStepper(3, 1300);
  const { orbit, handlers, ref, reset } = useOrbit({ yaw: -0.5, pitch: 0.42, zoom: 1 });

  const p = st.p;
  const lift  = stepAmount(p, 1);          // plane rises to w = 1
  const shear = stepAmount(p, 2);          // the 3×3 matrix is applied
  const drop  = stepAmount(p, 3);          // back to 2D: read x, y, ignore w

  const w = lift * (1 - drop);             // height the shape is drawn at
  const P = makeProjector(orbit, VW / 2 - 10, VH / 2 + 34, 58, 12);

  // Applying the shear to (x, y, w) adds (tx, ty)·w — a point's slide grows with its height.
  const sheared = (x: number, y: number, hw: number): V3 => [x + tx_ * shear * hw, hw, y + ty_ * shear * hw];
  // Heights: the shape reached w = 1 before the shear, so it slides by the full amount,
  // then drops back to the floor keeping its new x, y.
  const shapePt = (x: number, y: number): V3 => {
    const moved = sheared(x, y, lift);
    return [moved[0], w, moved[2]];
  };
  const shape3 = SHAPE.map(([x, y]) => P(shapePt(x, y)));
  const ghost  = SHAPE.map(([x, y]) => P([x, 0, y]));

  // Planes: w = 0 floor (fixed) and w = 1 (appears with the lift, slides with the shear)
  const quad = (hw: number, s = 1.8): V3[] =>
    [[-s, hw, -s], [s, hw, -s], [s, hw, s], [-s, hw, s]].map(([x, h, y]) => {
      const q = sheared(x, y, h);
      return [q[0], h, q[2]] as V3;
    });
  const floor = quad(0).map(P);
  const top   = quad(1).map(P);

  // Vertical grid-lines of the shear: segments from the floor to w = 1 lean over
  const posts = [[-1.8, -1.8], [1.8, -1.8], [1.8, 1.8], [-1.8, 1.8], [0, 0]].map(([x, y]) => ({
    a: P([x, 0, y]), b: P(sheared(x, y, 1)),
  }));

  // A direction on the floor: w = 0, so the shear leaves it alone
  const dirA = P([0.5, 0, 1.0]);
  const dirB = P([0.5 + DIR[0], 0, 1.0 + DIR[1]]);
  // Plane labels go on the outermost corner so they never sit on the shape
  const leftmost  = (q: { x: number; y: number }[]) => q.reduce((a, b) => (b.x < a.x ? b : a));
  const rightmost = (q: { x: number; y: number }[]) => q.reduce((a, b) => (b.x > a.x ? b : a));
  const floorLbl = leftmost(floor), topLbl = rightmost(top);

  const O = P([0, 0, 0]);
  const wTip = P([0, 1.6, 0]);
  const px = SHAPE[1];                      // tracked vertex (top-left of the F)
  const trackedIn: V3 = [px[0], px[1], 1];
  const trackedOut: V3 = [px[0] + tx_, px[1] + ty_, 1];

  const steps: [string, string][] = [
    ["figHom_s0", "A translation moves the origin — no matrix can do that in 2D, because M·(0,0) is always (0,0)."],
    ["figHom_s1", "Add a third coordinate w = 1: every point (x, y) becomes (x, y, 1). The whole plane now floats at height 1."],
    ["figHom_s2", "Apply a 3×3 matrix with (tx, ty) in the last column. In 3D it is a shear — the origin stays put — but the w = 1 plane slides by exactly (tx, ty)."],
    ["figHom_s3", "Drop w and read x, y: the shape was translated. The direction on the w = 0 floor never moved."],
  ];
  const current = Math.round(st.raw);

  const cell = (v: string, hot: boolean) => (
    <span className={`text-right ${hot ? "font-bold" : ""}`} style={{ color: hot ? COL_T : "var(--text-main)" }}>{v}</span>
  );

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figHom_title", "Why w? Translation as a Shear")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono text-right">
          {tx(t, "figCam_hint", "drag the figure to look around · scroll to zoom")}
        </span>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] relative">
        <svg ref={ref} viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto select-none cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }} role="img" aria-label="Translation as a shear in homogeneous coordinates" {...handlers}>

          {/* w = 0 floor */}
          <polygon points={pts(floor)} fill="rgba(148,163,184,0.06)" stroke="var(--code-muted)" strokeWidth="1" />
          <Label x={floorLbl.x + 4} y={floorLbl.y + 14}>w = 0</Label>

          {/* Shear posts from the floor up to w = 1 */}
          {lift > 0.02 && posts.map((q, i) => (
            <line key={i} x1={q.a.x} y1={q.a.y} x2={q.b.x} y2={q.b.y}
              stroke={COL_W} strokeWidth="1" strokeDasharray="3 3" opacity={0.55 * lift} />
          ))}

          {/* The original shape, as a ghost on the floor */}
          <polygon points={pts(ghost)} fill="none" stroke="var(--code-muted)" strokeWidth="1" strokeDasharray="3 2" />

          {/* w = 1 plane */}
          {lift > 0.02 && (
            <g opacity={lift * (1 - drop * 0.8)}>
              <polygon points={pts(top)} fill="rgba(168,85,247,0.10)" stroke={COL_W} strokeWidth="1.2" />
              <Label x={topLbl.x - 4} y={topLbl.y - 6} anchor="end" color={COL_W}>w = 1</Label>
            </g>
          )}

          {/* Axes */}
          <Arrow a={O} b={P([2.8, 0, 0])} color="var(--code-muted)" w={1} head={5} />
          <Arrow a={O} b={P([0, 0, 2.8])} color="var(--code-muted)" w={1} head={5} />
          <Arrow a={O} b={wTip} color={COL_W} w={1.4} head={6} />
          <text x={P([2.8, 0, 0]).x + 4} y={P([2.8, 0, 0]).y + 3} fill="var(--code-muted)" fontSize="9" fontFamily="monospace">x</text>
          <text x={P([0, 0, 2.8]).x + 4} y={P([0, 0, 2.8]).y + 3} fill="var(--code-muted)" fontSize="9" fontFamily="monospace">y</text>
          <text x={wTip.x + 5} y={wTip.y} fill={COL_W} fontSize="9" fontFamily="monospace" fontWeight="bold">w</text>
          <circle cx={O.x} cy={O.y} r={3.5} fill="var(--text-main)" />
          {shear > 0 && <Label x={O.x - 8} y={O.y + 16} anchor="end" color="var(--text-main)">origin stays put</Label>}

          {/* Where the shape sat on the w = 1 plane before the shear */}
          {shear > 0 && drop < 1 && (
            <polygon points={pts(SHAPE.map(([x, y]) => P([x, w, y])))} fill="none"
              stroke={COL_W} strokeWidth="1" strokeDasharray="3 2" opacity={0.8} />
          )}

          {/* Translation arrow on the w = 1 plane */}
          {shear > 0.05 && (() => {
            const a = P([px[0], w, px[1]]), b = shape3[1];
            return <Arrow a={a} b={b} color={COL_T} w={2} head={7} />;
          })()}

          {/* The shape */}
          <polygon points={pts(shape3)} fill="rgba(59,130,246,0.30)" stroke="var(--primary)" strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx={shape3[1].x} cy={shape3[1].y} r={3.2} fill={COL_T} />

          {/* A direction vector with w = 0 */}
          <Arrow a={dirA} b={dirB} color={COL_DIR} w={2.2} head={7} />
          <Label x={dirB.x + 6} y={dirB.y + 4} color={COL_DIR}>direction, w = 0</Label>
        </svg>
        <button onClick={reset}
          className="absolute top-3 right-3 text-[9px] font-mono px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--primary)]">
          {tx(t, "figCam_resetView", "reset view")}
        </button>
      </div>

      <div className="p-4 md:p-5 grid gap-5 md:grid-cols-2">
        <ol className="space-y-1">
          {steps.map(([key, text], i) => (
            <li key={key} onClick={() => st.scrub(i)}
              className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-[12px] leading-snug transition-colors flex gap-2 ${
                i === current ? "bg-[var(--primary-low)] text-[var(--text-main)]" : "text-[var(--text-muted)] hover:bg-[var(--primary-low)]/50"
              } ${i > current ? "opacity-55" : ""}`}>
              <span className={`flex-shrink-0 w-4 h-4 mt-px rounded-full text-[9px] font-bold flex items-center justify-center ${
                i <= current ? "bg-[var(--primary)] text-white" : "border border-[var(--border)]"
              }`}>{i}</span>
              <span>{tx(t, key, text)}</span>
            </li>
          ))}
        </ol>

        <div className="space-y-3 min-w-0">
          <div className="flex items-center gap-3 flex-wrap font-mono text-[11px]">
            <div className="inline-grid grid-cols-3 gap-x-3 gap-y-0.5 border-x-2 border-[var(--text-muted)]/50 rounded px-2.5 py-1">
              {cell("1", false)}{cell("0", false)}{cell(f2(tx_), true)}
              {cell("0", false)}{cell("1", false)}{cell(f2(ty_), true)}
              {cell("0", false)}{cell("0", false)}{cell("1", false)}
            </div>
            <span className="text-[var(--text-muted)]">×</span>
            <div className="inline-grid grid-cols-1 gap-y-0.5 border-x-2 border-[var(--text-muted)]/50 rounded px-2 py-1 text-right">
              <span>{f2(trackedIn[0])}</span><span>{f2(trackedIn[1])}</span>
              <span style={{ color: COL_W }} className="font-bold">1</span>
            </div>
            <span className="text-[var(--text-muted)]">=</span>
            <div className="inline-grid grid-cols-1 gap-y-0.5 border-x-2 border-[var(--text-muted)]/50 rounded px-2 py-1 text-right">
              <span style={{ color: COL_T }}>{f2(trackedOut[0])}</span>
              <span style={{ color: COL_T }}>{f2(trackedOut[1])}</span>
              <span style={{ color: COL_W }} className="font-bold">1</span>
            </div>
          </div>
          <p className="font-mono text-[10.5px] text-[var(--text-muted)] leading-relaxed">
            {tx(t, "figHom_rowNote", "Row 1: x + tx·w. With w = 1 you get x + tx; with w = 0 (a direction) you get x — unchanged.")}
          </p>
          <div className="space-y-1.5">
            {([["tx", tx_, setTx], ["ty", ty_, setTy]] as const).map(([label, value, set]) => (
              <label key={label} className="flex items-center gap-2">
                <span className="text-[9px] font-mono w-6" style={{ color: COL_T }}>{label}</span>
                <input type="range" min={-2} max={2} step={0.1} value={value}
                  onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
                <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{f2(value)}</span>
              </label>
            ))}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            {tx(t, "figHom_3dNote", "OpenGL does exactly this one dimension up: vec3 positions become vec4(x, y, z, 1) and a 4×4 matrix shears 4D space to translate them.")}
          </p>
        </div>
      </div>

      <div className="px-4 md:px-5 pb-4">
        <StepperControls s={st} />
      </div>
    </figure>
  );
}
