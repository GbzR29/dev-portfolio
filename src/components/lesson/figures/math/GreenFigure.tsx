"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, C, T, Handle, useDrag, clamp, nearest, type Pt } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { Axes, FIELDS, FieldArrows, H, W, curlAt, divAt, n2, pv, type Field } from "./vector/fields";

// ── What this figure shows ────────────────────────────────────────────────────
// Green's theorem on a rectangle you drag. The boundary, travelled
// counterclockwise, gives the circulation ∮ F · dr (or, in flux mode, the
// outflow ∮ F · n ds). The rectangle is cut into n × n cells; each cell's own
// circulation is drawn as a small loop, purple for counterclockwise and
// orange for clockwise, brighter for more. Neighbouring cells travel every
// shared edge in opposite directions, so all inner edges cancel and the cells
// add up to exactly the boundary. As the cells shrink, each one is about
// curl × area, so the boundary integral equals ∬ curl F dA (flux: ∬ div F dA).
// "Break it: go clockwise" reverses the boundary. The whirl, with its hole at
// the origin, is where the theorem's condition fails.

type Mode = "circ" | "flux";
const LIST = ["vortex", "spiral", "shear", "source", "saddle", "hills", "whirl"] as const;
type Id = (typeof LIST)[number];
const LEVELS = [1, 2, 4, 8, 16];
const SEG = 120;

/** ∫ along the segment p → q of F · dr (circulation) or F · n ds with n the right-hand normal (outflow). */
function segInt(f: Field, p: Pt, q: Pt, mode: Mode) {
  const dx = (q.x - p.x) / SEG, dy = (q.y - p.y) / SEG;
  let s = 0;
  for (let i = 0; i < SEG; i++) {
    const F = f.F(p.x + (i + 0.5) * dx, p.y + (i + 0.5) * dy);
    s += mode === "circ" ? F.x * dx + F.y * dy : F.x * dy - F.y * dx;
  }
  return s;
}
/** Counterclockwise boundary integral of the rectangle [x0, x1] × [y0, y1]. */
function boxInt(f: Field, x0: number, y0: number, x1: number, y1: number, mode: Mode) {
  const a = { x: x0, y: y0 }, b = { x: x1, y: y0 }, c = { x: x1, y: y1 }, d = { x: x0, y: y1 };
  return segInt(f, a, b, mode) + segInt(f, b, c, mode) + segInt(f, c, d, mode) + segInt(f, d, a, mode);
}
/** ∬ curl (or div) by the midpoint rule on a fine grid. */
function areaInt(f: Field, x0: number, y0: number, x1: number, y1: number, mode: Mode) {
  const M = 60, hx = (x1 - x0) / M, hy = (y1 - y0) / M;
  let s = 0;
  for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) {
    const x = x0 + (i + 0.5) * hx, y = y0 + (j + 0.5) * hy;
    s += (mode === "circ" ? curlAt(f, x, y) : divAt(f, x, y)) * hx * hy;
  }
  return s;
}
function cells(f: Field, x0: number, y0: number, x1: number, y1: number, n: number, mode: Mode) {
  const out: { x0: number; y0: number; x1: number; y1: number; v: number }[] = [];
  const hx = (x1 - x0) / n, hy = (y1 - y0) / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const a = x0 + i * hx, b = y0 + j * hy;
    out.push({ x0: a, y0: b, x1: a + hx, y1: b + hy, v: boxInt(f, a, b, a + hx, b + hy, mode) });
  }
  return out;
}

/** The svg; owns the corner drag (it is mounted twice while the lab is open). */
function GreenStage({ field, mode, a, b, setCorners, level, cw }: { field: Field; mode: Mode; a: Pt; b: Pt; setCorners: (a: Pt, b: Pt) => void; level: number; cw: boolean }) {
  const drag = useDrag<"a" | "b">(
    q => nearest<"a" | "b">(q, [["a", { x: pv.X(a.x), y: pv.Y(a.y) }], ["b", { x: pv.X(b.x), y: pv.Y(b.y) }]], 18),
    (k, q) => { const w = pv.inv(q), p = { x: clamp(w.x, -3.3, 3.3), y: clamp(w.y, -1.85, 1.85) }; if (k === "a") setCorners(p, b); else setCorners(a, p); });
  const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
  const n = LEVELS[level], cs = cells(field, x0, y0, x1, y1, n, mode);
  const vmax = Math.max(1e-9, ...cs.map(c => Math.abs(c.v)));
  const X = pv.X, Y = pv.Y;
  // arrowheads on the outer boundary, in the direction of travel
  const corners = cw ? [[x0, y0], [x0, y1], [x1, y1], [x1, y0]] : [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const heads = corners.map(([px, py], i) => {
    const [qx, qy] = corners[(i + 1) % 4], mx = (X(px) + X(qx)) / 2, my = (Y(py) + Y(qy)) / 2;
    const dx = X(qx) - X(px), dy = Y(qy) - Y(py), L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    return <path key={i} d={`M${mx + ux * 8},${my + uy * 8} L${mx - ux * 6 - uy * 6},${my - uy * 6 + ux * 6} L${mx - ux * 6 + uy * 6},${my - uy * 6 - ux * 6} Z`} fill={cw ? C.red : C.amber} />;
  });
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <Axes />
      <FieldArrows field={field} opacity={0.35} />
      {cs.map((c, i) => {
        const s = c.v / vmax, col = Math.abs(s) < 0.03 ? C.muted : s > 0 ? C.purple : C.orange;
        const ix = (c.x1 - c.x0) * 0.18, iy = (c.y1 - c.y0) * 0.18;
        return (
          <g key={i}>
            <rect x={X(c.x0)} y={Y(c.y1)} width={X(c.x1) - X(c.x0)} height={Y(c.y0) - Y(c.y1)} fill={col} opacity={0.08 + 0.32 * Math.abs(s)} stroke={C.grid} strokeWidth={0.8} />
            {n <= 8 && <rect x={X(c.x0 + ix)} y={Y(c.y1 - iy)} width={X(c.x1 - ix) - X(c.x0 + ix)} height={Y(c.y0 + iy) - Y(c.y1 - iy)} rx={4} fill="none" stroke={col} strokeWidth={1.4} opacity={0.4 + 0.6 * Math.abs(s)} strokeDasharray={mode === "flux" ? "3 3" : undefined} />}
          </g>
        );
      })}
      <rect x={X(x0)} y={Y(y1)} width={X(x1) - X(x0)} height={Y(y0) - Y(y1)} fill="none" stroke={cw ? C.red : C.amber} strokeWidth={3} />
      {heads}
      {field.singular && <circle cx={X(0)} cy={Y(0)} r={4} fill={C.bg} stroke={C.red} strokeWidth={2} />}
      <Handle x={X(a.x)} y={Y(a.y)} color={C.amber} active={drag.dragging === "a"} />
      <Handle x={X(b.x)} y={Y(b.y)} color={C.amber} active={drag.dragging === "b"} />
      <T x={10} y={18} size={11} color={C.fg} bold>{`F = ${field.label}`}</T>
      <T x={10} y={H - 10} size={10.5} color={C.muted}>{`${n} × ${n}`}</T>
    </svg>
  );
}

export function GreenFigure({ t }: { t?: TrackTranslations }) {
  const [id, setId] = useState<Id>("vortex");
  const [mode, setMode] = useState<Mode>("circ");
  const [a, setA] = useState<Pt>({ x: -1.5, y: -1 });
  const [b, setB] = useState<Pt>({ x: 1.5, y: 1 });
  const [level, setLevel] = useState(1);
  const [cw, setCw] = useState(false);
  const lab = useLab("math-green");
  const field = FIELDS[id];

  const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
  const area = (x1 - x0) * (y1 - y0);
  const boundary = (cw ? -1 : 1) * boxInt(field, x0, y0, x1, y1, mode);
  const cellSum = cells(field, x0, y0, x1, y1, LEVELS[level], mode).reduce((s, c) => s + c.v, 0);
  const inside = areaInt(field, x0, y0, x1, y1, mode);
  const holeIn = !!field.singular && x0 < 0 && x1 > 0 && y0 < 0 && y1 > 0;
  const agree = Math.abs(boundary - inside) < 0.02 * Math.max(1, Math.abs(inside));

  const view = (
    <div>
      <GreenStage field={field} mode={mode} a={a} b={b} setCorners={(p, q) => { setA(p); setB(q); }} level={level} cw={cw} />
      <Transport t={t} playing={false}
        onPlay={() => setLevel(l => (l + 1) % LEVELS.length)}
        playLabel={tx(t, "figGs_refine", "cut finer")}
        onStep={() => setLevel(l => Math.min(LEVELS.length - 1, l + 1))}
        onBack={() => setLevel(l => Math.max(0, l - 1))}
        onReset={() => setLevel(0)}
        readout={`${LEVELS[level]} × ${LEVELS[level]}`} />
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={setMode} options={[["circ", tx(t, "figGs_mCirc", "circulation (Green)")], ["flux", tx(t, "figGs_mFlux", "flux (divergence)")]] as const} />;
  const what = mode === "circ" ? "curl F" : "div F";
  const controls = <>
    <Row>
      {LIST.map(k => <Btn key={k} active={id === k} onClick={() => setId(k)}>{FIELDS[k].label}</Btn>)}
    </Row>
    <Row>
      <Btn active={cw} onClick={() => setCw(v => !v)}>{tx(t, "figGs_break", "break it: go clockwise")}</Btn>
    </Row>
    <Row>
      <Readout color={cw ? C.red : C.amber}>{fill(mode === "circ" ? tx(t, "figGs_bCirc", "boundary ∮ F · dr = {v}") : tx(t, "figGs_bFlux", "boundary ∮ F · n ds = {v}"), { v: n2(boundary) })}</Readout>
      <Readout color={C.purple}>{fill(tx(t, "figGs_cells", "sum over the {k} cells = {v}"), { k: LEVELS[level] ** 2, v: n2(cellSum) })}</Readout>
      <Readout color={agree ? C.green : C.red}>{`∬ ${what} dA = ${n2(inside)}`}</Readout>
    </Row>
    <Row>
      <Readout>{fill(tx(t, "figGs_area", "area = {a}"), { a: n2(area) })}</Readout>
      <Readout color={agree ? C.green : C.red}>{agree ? tx(t, "figGs_ok", "boundary = inside: the theorem holds") : tx(t, "figGs_bad", "boundary ≠ inside")}</Readout>
    </Row>
  </>;
  const note = tx(t, "figGs_note", "Drag the two amber corners to change the rectangle. Its boundary is travelled counterclockwise (the arrows). Each cell's own loop is coloured by its circulation, purple counterclockwise and orange clockwise; the inner edges are travelled twice in opposite directions and cancel, so the cells always add up to the boundary. Cut finer with the play button: each small cell is about (curl × its area), so the total is the integral of the curl over the region. Flux mode does the same with the outflow and the divergence.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figGsL1_t", "Round the edge"),
      body: <p>{tx(t, "figGsL1_b", "F = (−y, x)/2 has curl 1 everywhere. Drag the corners to make the rectangle larger and watch the boundary circulation: it equals the area.")}</p>,
      goal: { text: tx(t, "figGsL1_g", "A rectangle of area at least 6: circulation 6."), done: id === "vortex" && mode === "circ" && !cw && area >= 6 },
      setup: () => { setId("vortex"); setMode("circ"); setCw(false); setLevel(1); },
    },
    {
      title: tx(t, "figGsL2_t", "Quick check"),
      body: <p>{tx(t, "figGsL2_b", "Green's theorem: the circulation round the edge is the integral of the curl over the inside.")}</p>,
      quiz: {
        q: tx(t, "figGsL2_q", "F = (−y, x) (curl 2). What is the circulation round a 3 × 2 rectangle?"),
        options: ["12", "6", "10", "0"],
        answer: 0,
        why: tx(t, "figGsL2_w", "∬ 2 dA = 2 · 6 = 12, wherever the rectangle is."),
      },
    },
    {
      title: tx(t, "figGsL3_t", "Cancellation"),
      body: <p>{tx(t, "figGsL3_b", "Cut finer with the play button. Every cell has its own small circulation, yet the purple total never changes: each inner edge is walked once each way.")}</p>,
      goal: { text: tx(t, "figGsL3_g", "16 × 16 cells, and the sum still equals the boundary."), done: level === LEVELS.length - 1 && !cw },
    },
    {
      title: tx(t, "figGsL4_t", "Clockwise cells"),
      body: <p>{tx(t, "figGsL4_b", "Switch to the shear (0.6y, 0). The cells turn orange: each one circulates clockwise, and so does the whole boundary.")}</p>,
      goal: { text: tx(t, "figGsL4_g", "Shear: a negative circulation equal to −0.6 × area."), done: id === "shear" && mode === "circ" && !cw && boundary < -0.5 },
    },
    {
      title: tx(t, "figGsL5_t", "Flux out of a region"),
      body: <p>{tx(t, "figGsL5_b", "Choose \"flux\" and the source (x, y)/2, whose divergence is 1: the outflow through the edge equals the area. That is the divergence theorem in the plane.")}</p>,
      goal: { text: tx(t, "figGsL5_g", "Source in flux mode: outflow = area."), done: id === "source" && mode === "flux" && !cw && agree },
      setup: () => { setId("source"); setMode("flux"); setCw(false); },
    },
    {
      title: tx(t, "figGsL6_t", "Break it"),
      body: <p>{tx(t, "figGsL6_b", "Turn on \"go clockwise\". The boundary integral changes sign and no longer matches the inside: the theorem is stated for the counterclockwise boundary, with the region on the left.")}</p>,
      goal: { text: tx(t, "figGsL6_g", "Clockwise: boundary = −(inside)."), done: cw && !agree },
    },
    {
      title: tx(t, "figGsL7_t", "A hole inside"),
      body: <p>{tx(t, "figGsL7_b", "Turn the break-it off and choose the whirl (−y, x)/(x² + y²). Its curl is 0 wherever it is defined. Put the origin inside the rectangle, then outside it.")}</p>,
      goal: { text: tx(t, "figGsL7_g", "Origin inside: boundary 2π, inside 0."), done: id === "whirl" && mode === "circ" && !cw && holeIn },
      setup: () => { setId("whirl"); setMode("circ"); setCw(false); },
    },
  ];

  const insights: Insight[] = [
    {
      id: "cw", tone: "warn", when: cw,
      title: tx(t, "figGsI1_t", "Orientation"),
      body: tx(t, "figGsI1_b", "Green's theorem uses the boundary with the region on the left as you walk: counterclockwise for the outer edge. Going the other way flips every dr."),
    },
    {
      id: "hole", tone: "warn", when: holeIn && mode === "circ" && !cw,
      title: tx(t, "figGsI2_t", "The field is not defined at a point inside"),
      body: tx(t, "figGsI2_b", "Green's theorem needs F to be smooth on the whole region. The whirl blows up at the origin, so the theorem does not apply: the boundary gives 2π while the curl, 0 wherever it exists, integrates to 0."),
    },
    {
      id: "cells", tone: "info", when: level >= 2 && !cw,
      title: tx(t, "figGsI3_t", "Inner edges cancel"),
      body: fill(tx(t, "figGsI3_b", "{k} cells, each with its own circulation, add up to the boundary integral exactly, not just approximately."), { k: LEVELS[level] ** 2 }),
    },
  ];

  const title = tx(t, "figGs_title", "Green's theorem: the edge and the inside");
  return (
    <>
      <Figure fullscreen={false} title={title} head={<>{modeChoice}<LabButton lab={lab} t={t} /></>} controls={controls} note={note}>
        {view}
      </Figure>
      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figGsR1", "Cut a region into cells: inner edges are walked twice in opposite directions and cancel."),
          tx(t, "figGsR2", "Each tiny cell's circulation is curl × area, so ∮ F · dr = ∬ curl F dA (Green)."),
          tx(t, "figGsR3", "The same with outflow: ∮ F · n ds = ∬ div F dA (the divergence theorem in the plane)."),
          tx(t, "figGsR4", "The boundary goes counterclockwise, and F must be smooth on the whole region: a hole breaks it."),
        ]}
      />
    </>
  );
}
