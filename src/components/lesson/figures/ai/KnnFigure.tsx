"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, C, T, Handle, plot, useDrag, nearest, f2 } from "@/components/lesson/kit/figure";
import { STUDENTS } from "./data";

// ── What this figure shows ────────────────────────────────────────────────────
// k-nearest neighbours on the students (hours studied, hours slept). Drag the
// orange query point: its k nearest students are joined to it, the circle
// reaches the k-th of them, and the majority of their labels is the
// prediction. The background shows what the classifier would predict at
// every point: with k = 1 it is a patchwork around every single student,
// noise included; larger k smooths it. The readout also runs leave-one-out
// cross-validation on the 14 students for the current k.

const P = plot({ W: 620, H: 300, x0: 0, x1: 7, y0: 2.5, y1: 10 });
const CELL = 10;
type Lab = 0 | 1;

/** Votes of the k nearest labelled points to (h, s), optionally weighted by 1/distance. */
function vote(h: number, s: number, k: number, weighted: boolean, skip = -1) {
  const nb = STUDENTS.map(([x, y, lab], i) => ({ i, d: Math.hypot(x - h, y - s), lab }))
    .filter(n => n.i !== skip)
    .sort((a, b) => a.d - b.d)
    .slice(0, k);
  let pass = 0, fail = 0;
  for (const n of nb) {
    const w = weighted ? 1 / Math.max(n.d, 1e-6) : 1;
    if (n.lab) pass += w; else fail += w;
  }
  return { nb, pass, fail, pred: (pass > fail ? 1 : 0) as Lab };
}

export function KnnFigure({ t }: { t?: TrackTranslations }) {
  const [q, setQ] = useState({ h: 4, s: 6 });
  const [k, setK] = useState(3);
  const [weighted, setWeighted] = useState(false);
  const [regions, setRegions] = useState(true);
  const L = (key: string, en: string) => tx(t, `figAiKnn_${key}`, en);

  const res = vote(q.h, q.s, k, weighted);
  const radius = res.nb[res.nb.length - 1].d;
  const cells = useMemo(() => {
    if (!regions) return [];
    const out: { x: number; y: number; pred: Lab }[] = [];
    for (let x = 0; x < P.W; x += CELL)
      for (let y = 0; y < P.H; y += CELL) {
        const w = P.inv({ x: x + CELL / 2, y: y + CELL / 2 });
        out.push({ x, y, pred: vote(w.x, w.y, k, weighted).pred });
      }
    return out;
  }, [k, weighted, regions]);
  const looErrors = useMemo(() => STUDENTS.filter(([h, s, lab], i) => vote(h, s, k, weighted, i).pred !== lab).length, [k, weighted]);

  const hq = { x: P.X(q.h), y: P.Y(q.s) };
  const drag = useDrag<"q">(
    p => nearest(p, [["q", hq]], 26),
    (_, p) => { const w = P.inv(p); setQ({ h: Math.min(Math.max(w.x, 0.2), 6.8), s: Math.min(Math.max(w.y, 2.7), 9.8) }); },
  );
  // the circle is round in world units; the plot scales x and y differently, so draw an ellipse
  const rx = radius * P.sx, ry = radius * P.sy;

  return (
    <Figure
      title={L("title", "k-nearest neighbours")}
      head={<>
        <Btn active={regions} onClick={() => setRegions(v => !v)}>{regions ? "☑" : "☐"} {L("regions", "regions")}</Btn>
        <Btn active={weighted} onClick={() => setWeighted(v => !v)}>{weighted ? "☑" : "☐"} {L("weighted", "weight by 1/distance")}</Btn>
      </>}
      controls={<>
        <Slider label="k" value={k} min={1} max={13} step={2} onChange={setK} fmt={v => `${v}`} />
        <Row>
          <Readout>{L("query", "query")} ({f2(q.h, 1)} h, {f2(q.s, 1)} h)</Readout>
          <Readout color={C.green}>{L("pass", "pass")} {weighted ? f2(res.pass, 2) : res.pass}</Readout>
          <Readout color={C.red}>{L("fail", "fail")} {weighted ? f2(res.fail, 2) : res.fail}</Readout>
          <Readout color={res.pred ? C.green : C.red}>→ {res.pred ? L("predPass", "predicts pass") : L("predFail", "predicts fail")}</Readout>
          <Readout color={C.muted}>{L("loo", "leave-one-out errors")} {looErrors} / {STUDENTS.length}</Readout>
        </Row>
      </>}
      note={L("note", "Drag the orange point. The lines join it to its k nearest students (straight-line distance in hours) and the ellipse passes through the k-th one; it is a circle in hours, stretched only because the two axes are drawn at different scales. At (4, 6), k = 1 says pass (the student at (4.5, 6.5)), but k = 3 and k = 5 say fail, because the noisy student at (5, 7) is among the neighbours. With k = 1 the regions wrap every student, including the two noisy ones: zero training error, many leave-one-out errors (8). k = 5 makes only 4 errors; very large k drifts toward always predicting the majority class, \"fail\" (8 of 14).")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${P.W} ${P.H}`} className="w-full h-auto" role="img">
        {cells.map((c, i) => <rect key={i} x={c.x} y={c.y} width={CELL} height={CELL} fill={c.pred ? C.green : C.red} fillOpacity={0.13} />)}
        {[1, 2, 3, 4, 5, 6].map(x => <T key={x} x={P.X(x)} y={P.H - 4} size={8} anchor="middle">{x} h</T>)}
        {[4, 6, 8].map(y => <T key={y} x={4} y={P.Y(y) + 3} size={8}>{y} h</T>)}
        <T x={P.W - 6} y={P.H - 16} size={9} anchor="end" bold color={C.fg}>{L("studied", "studied →")}</T>
        <T x={22} y={14} size={9} bold color={C.fg}>{L("slept", "↑ slept")}</T>
        <ellipse cx={hq.x} cy={hq.y} rx={rx} ry={ry} fill="none" stroke={C.amber} strokeDasharray="4 3" strokeWidth={1.2} />
        {res.nb.map(n => <line key={n.i} x1={hq.x} y1={hq.y} x2={P.X(STUDENTS[n.i][0])} y2={P.Y(STUDENTS[n.i][1])} stroke={C.amber} strokeWidth={1.4} />)}
        {STUDENTS.map(([h, s, lab], i) => <circle key={i} cx={P.X(h)} cy={P.Y(s)} r={6} fill={lab ? C.green : C.red}
          stroke={res.nb.some(n => n.i === i) ? C.amber : "var(--code-bg)"} strokeWidth={res.nb.some(n => n.i === i) ? 2.5 : 1.8} />)}
        <Handle x={hq.x} y={hq.y} color={C.amber} r={7} active={drag.dragging === "q"} />
      </svg>
    </Figure>
  );
}
