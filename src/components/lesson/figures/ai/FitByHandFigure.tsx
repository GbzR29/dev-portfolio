"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, C, T, Grid, Handle, plot, useDrag, nearest, f2, type Pt } from "@/components/lesson/kit/figure";
import { DELIVERY, BEST, mse } from "./data";

// ── What this figure shows ────────────────────────────────────────────────────
// Five past pizza deliveries (distance → minutes) and a straight line the
// reader places by dragging its two handles. The line is a model with two
// parameters, slope w and intercept b. Each vertical segment is one error
// (prediction − real time); the squares have those errors as sides, and the
// mean of their areas is the loss the reader is trying to make small. This is
// learning done by hand: the next chapters let an algorithm move the handles.

const P = plot({ W: 620, H: 280, x0: -0.3, x1: 6.3, y0: -2, y1: 38 });
const XA = 0.5, XB = 5.5;                                   // where the two handles sit

export function FitByHandFigure({ t }: { t?: TrackTranslations }) {
  const [ya, setYa] = useState(22);
  const [yb, setYb] = useState(24);
  const [squares, setSquares] = useState(true);
  const L = (k: string, en: string) => tx(t, `figAiFit_${k}`, en);

  const w = (yb - ya) / (XB - XA), b = ya - w * XA;
  const loss = mse(DELIVERY, w, b);
  const pred = (x: number) => w * x + b;

  const hA: Pt = { x: P.X(XA), y: P.Y(ya) }, hB: Pt = { x: P.X(XB), y: P.Y(yb) };
  const drag = useDrag<"a" | "b">(
    p => nearest(p, [["a", hA], ["b", hB]], 22),
    (id, p) => {
      const y = Math.min(Math.max(P.inv(p).y, P.y0), P.y1);
      if (id === "a") setYa(y); else setYb(y);
    },
  );
  const setLine = (w2: number, b2: number) => { setYa(w2 * XA + b2); setYb(w2 * XB + b2); };

  return (
    <Figure
      title={L("title", "Be the learning algorithm: fit the line by hand")}
      head={<>
        <Btn active={squares} onClick={() => setSquares(v => !v)}>{squares ? "☑" : "☐"} {L("squares", "squared errors")}</Btn>
        <Btn onClick={() => setLine(BEST.w, BEST.b)}>{L("best", "best line")}</Btn>
        <Btn onClick={() => { setYa(22); setYb(24); }}>{L("reset", "reset")}</Btn>
      </>}
      controls={<Row>
        <Readout>w = {f2(w, 2)} {L("minPerKm", "min/km")}</Readout>
        <Readout>b = {f2(b, 2)} min</Readout>
        <Readout color={loss < 0.35 ? C.green : loss < 3 ? C.amber : C.red}>MSE = {f2(loss, 2)}</Readout>
        <Readout color={C.muted}>{L("bestIs", "best possible")} 0.30</Readout>
        <Readout color={C.sky}>{L("at6", "prediction at 6 km")}: {f2(pred(6), 1)} min</Readout>
      </Row>}
      note={L("note", "Drag the two orange handles. The line predicts time = w · distance + b: b is the time at 0 km (preparation), w the extra minutes per km. For each delivery the red segment is the error, prediction minus real time; its square is drawn as a square. The loss (MSE) is the average area of the squares. Try to make it as small as you can: you will get close to 0.3, never to 0, because no straight line passes through all five points. \"Best line\" shows w = 3.5 and b = 8.5, which the Linear Regression chapter computes exactly.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${P.W} ${P.H}`} className="w-full h-auto" role="img">
        <Grid p={P} step={1} labels={false} />
        {[0, 1, 2, 3, 4, 5, 6].map(x => <T key={x} x={P.X(x)} y={P.H - 4} size={8} anchor="middle">{x} km</T>)}
        {[10, 20, 30].map(y => <T key={y} x={P.X(0) + 4} y={P.Y(y) - 3} size={8}>{y} min</T>)}
        {squares && DELIVERY.map(([x, y], i) => {
          const e = pred(x) - y, s = Math.abs(e) * P.sy;       // side in pixels along y, drawn square
          return <rect key={i} x={P.X(x)} y={Math.min(P.Y(y), P.Y(pred(x)))} width={s} height={s} fill={C.red} fillOpacity={0.12} stroke={C.red} strokeOpacity={0.4} />;
        })}
        {DELIVERY.map(([x, y], i) => <line key={i} x1={P.X(x)} x2={P.X(x)} y1={P.Y(y)} y2={P.Y(pred(x))} stroke={C.red} strokeWidth={1.6} />)}
        <line x1={P.X(P.x0)} y1={P.Y(pred(P.x0))} x2={P.X(P.x1)} y2={P.Y(pred(P.x1))} stroke={C.amber} strokeWidth={2} />
        {DELIVERY.map(([x, y], i) => <circle key={i} cx={P.X(x)} cy={P.Y(y)} r={5} fill={C.sky} stroke="var(--code-bg)" strokeWidth={1.5} />)}
        <Handle x={hA.x} y={hA.y} color={C.amber} active={drag.dragging === "a"} />
        <Handle x={hB.x} y={hB.y} color={C.amber} active={drag.dragging === "b"} />
      </svg>
    </Figure>
  );
}
