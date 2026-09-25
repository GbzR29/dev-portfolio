"use client";

import { useId, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { useStepper, stepAmount, StepperControls } from "../kit/Stepper";
import { Arrow, Label, pts } from "../kit/svg";
import {
  type V3, type Face, type CamBasis, add, sub, scale, dot,
  makeProjector, useOrbit, boxFaces, fmtV, lookAtBasis, viewTransform, frontFacing, lightAmount,
  towardEye, visibleRuns, cylinderFaces, type Box,
} from "../kit/scene3d";
import { TexturedFace, useProtoTextures, type ProtoName } from "../kit/protoTexture";

// ── What this figure shows ────────────────────────────────────────────────────
// How glm::lookAt builds a camera, one vector at a time, and what the resulting
// view matrix does: it moves and turns the whole world until the camera sits at
// the origin looking down -Z. Same convention as the chapter's code.

const VW = 560, VH = 300;
const TARGET: V3 = [0, 0, 0];
const WORLD_UP: V3 = [0, 1, 0];

const COL_R = "#ef4444";   // right
const COL_U = "#22c55e";   // up
const COL_F = "#3b82f6";   // forward
const COL_WUP = "var(--code-muted)";

const deg = (d: number) => (d * Math.PI) / 180;
const f2 = (n: number) => (Math.abs(n) < 0.005 ? 0 : n).toFixed(2);

// Ground grid under the target
const GRID: { a: V3; b: V3; axis: boolean }[] = Array.from({ length: 7 }, (_, i) => i - 3).flatMap(k => [
  { a: [k, -0.35, -3] as V3, b: [k, -0.35, 3] as V3, axis: k === 0 },
  { a: [-3, -0.35, k] as V3, b: [3, -0.35, k] as V3, axis: k === 0 },
]);

function cameraBasis(orbitDeg: number, heightDeg: number, dist: number): CamBasis {
  const th = deg(heightDeg), ph = deg(orbitDeg);
  const pos: V3 = [dist * Math.cos(th) * Math.sin(ph), dist * Math.sin(th), dist * Math.cos(th) * Math.cos(ph)];
  return lookAtBasis(pos, TARGET, WORLD_UP);
}

// ── The camera model ──────────────────────────────────────────────────────────
// A small film camera built from primitives in the camera's own basis:
// a textured body, a lens barrel with a hood and blue glass, two film reels.
type RGB = [number, number, number];
const flatFill = (c: RGB, light: number) => {
  const k = 0.38 + 0.62 * Math.max(0, Math.min(1, light));
  return `rgb(${Math.round(c[0] * k)},${Math.round(c[1] * k)},${Math.round(c[2] * k)})`;
};
const at = (b: CamBasis, r: number, u: number, f: number): V3 =>
  add(b.pos, add(scale(b.r, r), add(scale(b.u, u), scale(b.f, f))));

const CAMERA_PARTS = {
  faces(b: CamBasis): (Face & { tex?: ProtoName; flat?: RGB })[] {
    const out: (Face & { tex?: ProtoName; flat?: RGB })[] = [];
    // Body, longer along the viewing direction
    boxFaces(at(b, 0, 0, -0.2), [0.13, 0.15, 0.22], [b.r, b.u, b.f]).forEach(fc => out.push({ ...fc, tex: "light" }));
    // Lens barrel and hood along forward (u × r = f keeps the winding right)
    cylinderFaces(at(b, 0, 0, 0.1), b.f, b.u, b.r, 0.085, 0.08).forEach(fc => out.push({ ...fc, flat: [58, 62, 70] }));
    cylinderFaces(at(b, 0, 0, 0.2), b.f, b.u, b.r, 0.11, 0.025).forEach(fc =>
      out.push({ ...fc, flat: fc.pts.length > 4 && dot(fc.normal, b.f) > 0.9 ? [90, 150, 235] : [40, 44, 50] }));
    // Two film reels on top, their axis along right (f × u = r)
    for (const f of [-0.32, -0.08]) {
      cylinderFaces(at(b, 0, 0.27, f), b.r, b.f, b.u, 0.12, 0.04).forEach(fc => out.push({ ...fc, flat: [74, 78, 88] }));
    }
    return out;
  },
  /** Rough boxes around each part, for hiding lines behind the camera. */
  boxes(b: CamBasis): Box[] {
    const ax: [V3, V3, V3] = [b.r, b.u, b.f];
    return [
      { c: at(b, 0, 0, -0.2), half: [0.13, 0.15, 0.22], ax },
      { c: at(b, 0, 0, 0.13), half: [0.1, 0.1, 0.11], ax },
      { c: at(b, 0, 0.27, -0.32), half: [0.04, 0.12, 0.12], ax },
      { c: at(b, 0, 0.27, -0.08), half: [0.04, 0.12, 0.12], ax },
    ];
  },
};

// ── Figure ────────────────────────────────────────────────────────────────────
export function CameraLookAtFigure({ t }: { t?: TrackTranslations }) {
  const [orbitDeg, setOrbitDeg]   = useState(35);
  const [heightDeg, setHeightDeg] = useState(25);
  const [dist, setDist]           = useState(3);
  const st = useStepper(4, 1200);
  const { orbit, handlers, ref, reset } = useOrbit({ yaw: deg(-8), pitch: deg(22), zoom: 1 });

  const textures = useProtoTextures();
  const uid = useId().replace(/:/g, "");
  const b = cameraBasis(orbitDeg, heightDeg, dist);
  const p = st.p;
  const aF = stepAmount(p, 1), aR = stepAmount(p, 2), aU = stepAmount(p, 3), aV = stepAmount(p, 4);

  const W = viewTransform(b, aV);
  // Frame the midpoint between camera and target. It moves with the world,
  // so the shot stays steady while the view transform plays.
  const P0 = makeProjector(orbit, VW / 2, VH / 2 + 10, 64);
  const mid = W.point(scale(b.pos, 0.5));
  const P = (q: V3) => P0(sub(q, mid));          // view-space point → screen
  const S = (q: V3) => P(W.point(q));            // world-space point → screen

  // ── Scene geometry ────────────────────────────────────────────────────────
  // The same boxes, in the transformed space, for line-vs-solid occlusion
  const occluders: Box[] = [
    { c: W.point(TARGET), half: [0.35, 0.35, 0.35], ax: [W.dir([1, 0, 0]), W.dir([0, 1, 0]), W.dir([0, 0, 1])] },
    ...CAMERA_PARTS.boxes(b).map(bx => ({ c: W.point(bx.c), half: bx.half, ax: bx.ax.map(W.dir) as [V3, V3, V3] })),
  ];
  const toward = towardEye(orbit);
  const WORLD_AXES: V3[] = [[1.6, 0, 0], [0, 1.4, 0], [0, 0, 1.6]];

  const faces: (Face & { tex?: ProtoName; flat?: RGB; light: number })[] = [];
  const lit = (n: V3) => lightAmount(W.dir(n));
  // The target: a prototype cube at the origin
  boxFaces(TARGET, [0.35, 0.35, 0.35]).forEach(fc => faces.push({ ...fc, tex: "orange", light: lit(fc.normal) }));
  // The camera: a film camera oriented by (right, up, forward)
  CAMERA_PARTS.faces(b).forEach(fc => faces.push({ ...fc, light: lit(fc.normal) }));

  // Back faces are dropped, then the rest is painted far to near
  const drawn = faces
    .map(fc => { const sp = fc.pts.map(S); return { sp, quad: fc.pts, tex: fc.tex, flat: fc.flat, light: fc.light, depth: sp.reduce((s, q) => s + q.depth, 0) / sp.length }; })
    .filter(d => frontFacing(d.sp))
    .sort((x, y) => y.depth - x.depth);

  // Camera vectors, all starting at the camera
  const cam = S(b.pos);
  const tip = (d: V3, l: number, a: number) => S(add(b.pos, scale(d, l * a)));
  const fTip = tip(b.f, 1.1, aF), rTip = tip(b.r, 0.9, aR), uTip = tip(b.u, 0.9, aU);
  const wupAlpha = Math.min(1, aR * 3) * (1 - aU * 0.7);
  const wupTip = tip(WORLD_UP, 0.9, 1);

  // Fixed view-space axes that the camera lands on in the last step
  const O = P([0, 0, 0]);
  const viewAxes: { d: V3; label: string; color: string }[] = [
    { d: [1.4, 0, 0], label: "+X", color: COL_R },
    { d: [0, 1.4, 0], label: "+Y", color: COL_U },
    { d: [0, 0, -1.8], label: "−Z", color: COL_F },
  ];

  const stepText: [string, string, string][] = [
    ["figCam_s0", "Position", `cameraPos = ${fmtV(b.pos)}`],
    ["figCam_s1", "Forward", `forward = normalize(target − cameraPos) = ${fmtV(b.f)}`],
    ["figCam_s2", "Right", `right = normalize(cross(forward, worldUp)) = ${fmtV(b.r)}`],
    ["figCam_s3", "Up", `up = cross(right, forward) = ${fmtV(b.u)}`],
    ["figCam_s4", "View matrix", tx(t, "figCam_s4body", "the world moves and turns until the camera sits at the origin looking down −Z")],
  ];
  const current = Math.round(st.raw);

  // View matrix rows, revealed as each vector becomes known
  const rows: { cells: string[]; color: string; known: boolean }[] = [
    { cells: [f2(b.r[0]), f2(b.r[1]), f2(b.r[2]), f2(-dot(b.r, b.pos))], color: COL_R, known: aR >= 1 },
    { cells: [f2(b.u[0]), f2(b.u[1]), f2(b.u[2]), f2(-dot(b.u, b.pos))], color: COL_U, known: aU >= 1 },
    { cells: [f2(-b.f[0]), f2(-b.f[1]), f2(-b.f[2]), f2(dot(b.f, b.pos))], color: COL_F, known: aF >= 1 },
    { cells: ["0", "0", "0", "1"], color: "var(--text-muted)", known: true },
  ];

  const slider = (label: string, value: number, set: (n: number) => void, min: number, max: number, step: number, unit = "") => (
    <label className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-[var(--text-muted)] w-16">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
      <span className="text-[10px] font-mono text-[var(--primary)] w-12 text-right">{value}{unit}</span>
    </label>
  );

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figCam_title", "Building the LookAt Matrix — Step by Step")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono text-right">
          {tx(t, "figCam_hint", "drag the figure to look around · scroll to zoom")}
        </span>
      </div>

      <div>
        {/* ── Scene ── */}
        <div className="bg-[var(--code-bg)] border-b border-[var(--border)] relative">
          <svg ref={ref} viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto select-none cursor-grab active:cursor-grabbing"
            style={{ touchAction: "none" }} role="img" aria-label="Camera basis vectors" {...handlers}>

            {/* Ground grid */}
            {GRID.map((g, i) => {
              const a = S(g.a), c = S(g.b);
              return <line key={i} x1={a.x} y1={a.y} x2={c.x} y2={c.y}
                stroke={g.axis ? "var(--code-muted)" : "var(--code-line)"} strokeWidth={g.axis ? 1 : 0.8} />;
            })}

            {/* World axes (they belong to the world, so they move with it) */}
            {([[1.6, 0, 0], [0, 1.4, 0], [0, 0, 1.6]] as V3[]).map((d, i) => {
              const a = S([0, 0, 0]), c = S(d);
              return (
                <g key={i}>
                  <Arrow a={a} b={c} color="var(--code-muted)" w={1.2} head={5} />
                  <text x={c.x + 4} y={c.y - 3} fill="var(--code-muted)" fontSize="9" fontFamily="monospace">
                    {"xyz"[i]}
                  </text>
                </g>
              );
            })}

            {/* View-space axes fade in during the last step */}
            {aV > 0 && viewAxes.map(v => {
              const c = P(v.d);
              return (
                <g key={v.label} opacity={aV * 0.55}>
                  <Arrow a={O} b={c} color={v.color} w={1} head={5} dash="3 3" />
                  <text x={c.x + 4} y={c.y + 3} fill={v.color} fontSize="8.5" fontFamily="monospace">{v.label}</text>
                </g>
              );
            })}

            {/* Line of sight */}
            {aF > 0 && (
              <line x1={cam.x} y1={cam.y} x2={S(TARGET).x} y2={S(TARGET).y}
                stroke={COL_F} strokeWidth="1" strokeDasharray="3 4" opacity={0.6 * aF} />
            )}

            {/* Solid geometry, back to front */}
            {drawn.map((d, i) => d.tex ? (
              <TexturedFace key={i} id={`${uid}-f${i}`} quad={d.quad} project={S} name={d.tex} tex={textures?.[d.tex]} light={d.light} />
            ) : (
              <polygon key={i} points={pts(d.sp)} fill={flatFill(d.flat ?? [90, 90, 90], d.light)}
                stroke="rgba(0,0,0,0.35)" strokeWidth="0.5" strokeLinejoin="round" />
            ))}

            {/* World axes again, only where they are in front of the solids */}
            {WORLD_AXES.map((d, i) => {
              const tipW = W.point(d);
              const runs = visibleRuns(W.point([0, 0, 0]), tipW, occluders, toward);
              return runs.map(([ra, rb], k) => {
                const endsAtTip = Math.hypot(rb[0] - tipW[0], rb[1] - tipW[1], rb[2] - tipW[2]) < 1e-6;
                const A = P(ra), B = P(rb);
                return endsAtTip ? (
                  <g key={`${i}-${k}`}>
                    <Arrow a={A} b={B} color="var(--code-muted)" w={1.2} head={5} />
                    <text x={B.x + 4} y={B.y - 3} fill="var(--code-muted)" fontSize="9" fontFamily="monospace">{"xyz"[i]}</text>
                  </g>
                ) : (
                  <line key={`${i}-${k}`} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="var(--code-muted)" strokeWidth="1.2" strokeLinecap="round" />
                );
              });
            })}

            {/* Camera vectors */}
            {wupAlpha > 0.02 && (
              <g opacity={wupAlpha}>
                <Arrow a={cam} b={wupTip} color={COL_WUP} w={1.6} head={6} dash="4 3" />
                <Label x={wupTip.x + 6} y={wupTip.y} color="var(--code-muted)">worldUp</Label>
              </g>
            )}
            {aF > 0 && <Arrow a={cam} b={fTip} color={COL_F} w={2.6} head={8} />}
            {aR > 0 && <Arrow a={cam} b={rTip} color={COL_R} w={2.6} head={8} />}
            {aU > 0 && <Arrow a={cam} b={uTip} color={COL_U} w={2.6} head={8} />}
            {aF >= 1 && <Label x={fTip.x + 6} y={fTip.y + 4} color={COL_F} bold>forward</Label>}
            {aR >= 1 && <Label x={rTip.x + 6} y={rTip.y + 4} color={COL_R} bold>right</Label>}
            {aU >= 1 && <Label x={uTip.x + 6} y={uTip.y - 2} color={COL_U} bold>up</Label>}

            {/* Labels for the two points that define everything */}
            <Label x={cam.x + 26} y={cam.y + 26} color="var(--text-main)">
              {aV >= 1 ? "camera (0, 0, 0)" : `cameraPos ${fmtV(b.pos, 1)}`}
            </Label>
            {(() => { const q = S(TARGET); return <Label x={q.x + 12} y={q.y + 26} color="var(--text-main)">target</Label>; })()}

            {b.degenerate && (
              <Label x={VW / 2} y={VH - 10} anchor="middle" color={COL_R} bold>
                {tx(t, "figCam_degenerate", "forward ≈ worldUp → cross() ≈ 0, right is undefined")}
              </Label>
            )}
          </svg>
          <button onClick={reset}
            className="absolute top-3 right-3 text-[9px] font-mono px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--primary)]">
            {tx(t, "figCam_resetView", "reset view")}
          </button>
        </div>

        {/* ── Panel ── */}
        <div className="p-4 md:p-5 grid gap-5 md:grid-cols-2 min-w-0">
          <ol className="space-y-1">
            {stepText.map(([key, title, body], i) => {
              const state = i === current ? "now" : i < current ? "done" : "todo";
              return (
                <li key={key} onClick={() => st.scrub(i)}
                  className={`cursor-pointer rounded-lg px-2.5 py-1.5 transition-colors ${
                    state === "now" ? "bg-[var(--primary-low)]" : "hover:bg-[var(--primary-low)]/50"
                  } ${state === "todo" ? "opacity-55" : ""}`}>
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--text-main)]">
                    <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center ${
                      state === "todo" ? "border border-[var(--border)] text-[var(--text-muted)]" : "bg-[var(--primary)] text-white"
                    }`}>{i}</span>
                    {tx(t, key, title)}
                  </div>
                  <div className="font-mono text-[10px] text-[var(--text-muted)] mt-0.5 ml-6 break-words">{body}</div>
                </li>
              );
            })}
          </ol>

          <div className="space-y-4 min-w-0">
          {/* View matrix, row by row */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
              {tx(t, "figCam_matrix", "view = lookAt(...)")}
            </p>
            <div className="inline-grid grid-cols-[repeat(4,auto)] gap-x-3 gap-y-0.5 font-mono text-[10.5px] border-x-2 border-[var(--text-muted)]/50 rounded px-2.5 py-1">
              {rows.map((row, ri) => row.cells.map((c, ci) => (
                <span key={`${ri}-${ci}`} className={`text-right transition-opacity ${ci === 3 ? "pl-2 border-l border-[var(--border)]" : ""}`}
                  style={{ color: row.color, opacity: row.known ? 1 : 0.2 }}>
                  {row.known ? c : "?"}
                </span>
              )))}
            </div>
            <p className="mt-1.5 text-[10.5px] text-[var(--text-muted)] leading-relaxed">
              {tx(t, "figCam_matrixNote", "Rows are right, up and −forward; the last column moves the world by −cameraPos in that basis.")}
            </p>
          </div>

          <div className="space-y-1.5">
            {slider(tx(t, "figCam_orbit", "orbit"), orbitDeg, setOrbitDeg, -180, 180, 1, "°")}
            {slider(tx(t, "figCam_height", "height"), heightDeg, setHeightDeg, -89, 89, 1, "°")}
            {slider(tx(t, "figCam_dist", "distance"), dist, setDist, 1.5, 4.5, 0.1)}
          </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-5 pb-4 pt-1 space-y-3">
        <StepperControls s={st} />
        <figcaption className="text-[12.5px] text-[var(--text-muted)] leading-relaxed border-l-2 border-[var(--primary)]/50 pl-3">
          {tx(t, "figCam_caption",
            "Push the height slider to ±89° and watch right shrink: forward is almost parallel to worldUp, so their cross product nearly vanishes. That is exactly why FPS cameras clamp pitch.")}
        </figcaption>
      </div>
    </figure>
  );
}
