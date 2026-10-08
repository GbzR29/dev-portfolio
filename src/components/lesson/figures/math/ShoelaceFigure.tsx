"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, C, T, Handle, plot, Grid, useDrag, nearest, clamp, type Pt } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// The shoelace formula for the area of any polygon from its corner
// coordinates. Each edge Pᵢ → Pᵢ₊₁ contributes xᵢ·yᵢ₊₁ − xᵢ₊₁·yᵢ, which is
// twice the signed area of the triangle (origin, Pᵢ, Pᵢ₊₁): positive (green)
// when that triangle turns anticlockwise, negative (red) when it turns
// clockwise. Half the sum is the polygon's signed area: the parts outside
// the polygon cancel. Its sign tells which way the corners go round.
// The lab: check a rectangle, reshape it, flip the order, and cross the
// outline to see where the formula stops meaning "area".

const p = plot({ W: 560, H: 300, x0: -7, x1: 7, y0: -3.75, y1: 3.75 });
const START: Pt[] = [{ x: -4, y: -2 }, { x: 3, y: -3 }, { x: 5, y: 1 }, { x: 1, y: 3 }, { x: -3, y: 2 }];
const RECT: Pt[] = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }, { x: 0, y: 3 }];
const V = (q: Pt) => ({ x: p.X(q.x), y: p.Y(q.y) });
const sgn = (v: number) => (v < 0 ? `− ${-v}` : `+ ${v}`);
const m = (v: number) => String(v).replace("-", "−");
const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

/** True when two edges that do not share a corner cross each other. */
function selfCrossing(P: Pt[]) {
  const n = P.length;
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue;
    const a = P[i], b = P[(i + 1) % n], c = P[j], d = P[(j + 1) % n];
    if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) return true;
  }
  return false;
}

// ── The drawing (owns its drag: it is mounted twice while the lab is open) ────

function ShoeStage({ P, setP, fan, terms }: { P: Pt[]; setP: (f: (o: Pt[]) => Pt[]) => void; fan: boolean; terms: number[] }) {
  const drag = useDrag<number>(
    q => nearest(q, P.map((v, i) => [i, V(v)] as [number, Pt]), 18),
    (i, q) => {
      const w = p.inv(q);
      const s = { x: clamp(Math.round(w.x), -6, 6), y: clamp(Math.round(w.y), -3, 3) };
      setP(o => o.some((v, j) => j !== i && v.x === s.x && v.y === s.y) ? o : o.map((v, j) => (j === i ? s : v)));
    });
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto">
      <Grid p={p} step={1} />
      {fan && P.map((a, i) => {
        const b = P[(i + 1) % P.length], A = V(a), B = V(b), O = V({ x: 0, y: 0 });
        const col = terms[i] >= 0 ? C.green : C.red;
        return <polygon key={i} points={`${O.x},${O.y} ${A.x},${A.y} ${B.x},${B.y}`} fill={col} fillOpacity={0.14} stroke={col} strokeOpacity={0.6} strokeDasharray="3 3" />;
      })}
      <polygon points={P.map(q => `${V(q).x},${V(q).y}`).join(" ")} fill={C.sky} fillOpacity={fan ? 0.08 : 0.2} stroke={C.sky} strokeWidth={2.2} strokeLinejoin="round" />
      {P.map((a, i) => {
        const b = P[(i + 1) % P.length], A = V(a), B = V(b);
        const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, ang = Math.atan2(B.y - A.y, B.x - A.x);
        const hx = mx - 8 * Math.cos(ang), hy = my - 8 * Math.sin(ang);
        return <polygon key={i} fill={C.sky} points={`${mx + 6 * Math.cos(ang)},${my + 6 * Math.sin(ang)} ${hx - 5 * Math.sin(ang)},${hy + 5 * Math.cos(ang)} ${hx + 5 * Math.sin(ang)},${hy - 5 * Math.cos(ang)}`} />;
      })}
      {P.map((q, i) => <g key={i}>
        <Handle {...V(q)} color={C.orange} active={drag.dragging === i} />
        <T x={V(q).x + 9} y={V(q).y - 9} size={10} color={C.fg} bold>{`P${i + 1} (${m(q.x)}, ${m(q.y)})`}</T>
      </g>)}
    </svg>
  );
}

export function ShoelaceFigure({ t }: { t?: TrackTranslations }) {
  const [P, setP] = useState<Pt[]>(START);
  const [fan, setFan] = useState(false);
  const lab = useLab("math-shoelace");

  const terms = P.map((a, i) => { const b = P[(i + 1) % P.length]; return a.x * b.y - b.x * a.y; });
  const sum = terms.reduce((a, b) => a + b, 0);
  const area = sum / 2;
  const crossed = selfCrossing(P);
  const turn = sum > 0 ? tx(t, "figShoe_ccw", "anticlockwise (positive)") : sum < 0 ? tx(t, "figShoe_cw", "clockwise (negative)") : tx(t, "figShoe_zero", "zero: flat or crossed");

  const stage = <ShoeStage P={P} setP={setP} fan={fan} terms={terms} />;
  const buttons = <>
    <Btn active={fan} onClick={() => setFan(f => !f)}>{tx(t, "figShoe_fan", "triangles from origin")}</Btn>
    <Btn onClick={() => setP(o => [...o].reverse())}>{tx(t, "figShoe_rev", "reverse order")}</Btn>
    <Btn onClick={() => setP(START)}>{tx(t, "figShoe_reset", "reset")}</Btn>
  </>;
  const controls = <>
    <Row>
      <Readout>{`Σ = ${terms.map((v, i) => (i ? sgn(v) : m(v))).join(" ")} = ${m(sum)}`}</Readout>
    </Row>
    <Row>
      <Readout color={sum >= 0 ? C.green : C.red}>{`${tx(t, "figShoe_signed", "signed area")} = Σ / 2 = ${m(area)}`}</Readout>
      <Readout color={C.sky}>{`${tx(t, "figShoe_area", "area")} = ${Math.abs(area)}`}</Readout>
      <Readout>{`${tx(t, "figShoe_order", "order")}: ${turn}`}</Readout>
    </Row>
  </>;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figShoeL1_t", "Check it on a rectangle"),
      body: <>
        <p>{tx(t, "figShoeL1_b1", "A 4 by 3 rectangle with a corner on the origin. The readout lists one crosswise term per edge, and half their sum is 12 = 4 · 3 ✓.")}</p>
        <p>{tx(t, "figShoeL1_b2", "Drag only P3 to make the area 15. No side of the new shape needs to be parallel to another.")}</p>
      </>,
      goal: { text: tx(t, "figShoeL1_g", "Area 15, moving only P3."), done: P.length === 4 && P[0].x === 0 && P[0].y === 0 && P[1].x === 4 && P[3].y === 3 && Math.abs(area) === 15 },
      hint: tx(t, "figShoeL1_h", "Here the area is (4y + 3x) / 2 for P3 = (x, y). Try the top row, y = 3."),
      setup: () => { setP(RECT); setFan(false); },
    },
    {
      title: tx(t, "figShoeL2_t", "Where the terms come from"),
      body: <p>{tx(t, "figShoeL2_b", "Each term is twice the signed area of a triangle with one corner at the origin and the other two on one edge. Turn those triangles on.")}</p>,
      goal: { text: tx(t, "figShoeL2_g", "Show the triangles from the origin."), done: fan },
      setup: () => { setP(START); setFan(false); },
    },
    {
      title: tx(t, "figShoeL3_t", "Red cancels green"),
      body: <p>{tx(t, "figShoeL3_b", "Drag a corner so that one triangle turns red (its term goes negative). The area outside the polygon is covered once in green and once in red, and the two cancel.")}</p>,
      goal: { text: tx(t, "figShoeL3_g", "At least one negative term."), done: fan && terms.some(v => v < 0) && sum > 0 },
      hint: tx(t, "figShoeL3_h", "Move a corner so its edge passes on the other side of the origin, e.g. drag P5 to the right of P4."),
    },
    {
      title: tx(t, "figShoeL4_t", "Walk the other way"),
      body: <p>{tx(t, "figShoeL4_b", "List the same corners in the opposite order.")}</p>,
      goal: { text: tx(t, "figShoeL4_g", "A negative signed area."), done: sum < 0 && !crossed },
    },
    {
      title: tx(t, "figShoeL5_t", "Quick check"),
      body: <p>{tx(t, "figShoeL5_b", "The triangle (1, 1), (5, 2), (2, 4). Terms: 1·2 − 5·1, 5·4 − 2·2, 2·1 − 1·4.")}</p>,
      quiz: {
        q: tx(t, "figShoeL5_q", "What is its signed area?"),
        options: ["+5.5", "−5.5", "+11", "+16"],
        answer: 0,
        why: tx(t, "figShoeL5_w", "The terms are −3, 16 and −2. Their sum is 11, and half of it is 5.5. It is positive, so the corners go anticlockwise."),
      },
    },
    {
      title: tx(t, "figShoeL6_t", "Break it"),
      body: <p>{tx(t, "figShoeL6_b", "Drag one corner across the opposite side so that the outline crosses itself, like a figure eight. Then look at the area readout.")}</p>,
      goal: { text: tx(t, "figShoeL6_g", "Make the outline cross itself."), done: crossed },
      setup: () => { setP(START); setFan(false); },
    },
    {
      title: tx(t, "figShoeL7_t", "Quick check"),
      body: <p>{tx(t, "figShoeL7_b", "A surveyor lists a field's posts clockwise and gets a shoelace sum of −86.")}</p>,
      quiz: {
        q: tx(t, "figShoeL7_q", "How big is the field?"),
        options: ["43", "−43", "86", "172"],
        answer: 0,
        why: tx(t, "figShoeL7_w", "Half the sum is −43; the minus sign only says clockwise. The area is the absolute value, 43."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "cw", tone: "info", when: sum < 0 && !crossed,
      title: tx(t, "figShoeI1_t", "Clockwise"),
      body: fill(tx(t, "figShoeI1_b", "The corners go round clockwise, so every term changed sign and the sum is negative. The area is the same, {a}; only the sign tells the direction."), { a: Math.abs(area) }),
    },
    {
      id: "cross", tone: "warn", when: crossed,
      title: tx(t, "figShoeI2_t", "Not an area any more"),
      body: tx(t, "figShoeI2_b", "The outline crosses itself. One loop now goes round anticlockwise and the other clockwise, so the formula gives the difference of the two loops' areas. The shoelace formula needs a simple polygon."),
    },
    {
      id: "flat", tone: "warn", when: sum === 0 && !crossed,
      title: tx(t, "figShoeI3_t", "Zero area"),
      body: tx(t, "figShoeI3_b", "The corners all lie on one line: the polygon is flat and encloses nothing."),
    },
  ];

  const title = tx(t, "figShoe_title", "The shoelace formula");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{buttons}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={tx(t, "figShoe_note", "Drag the corners, numbered in order. The readout lists one term xᵢ·yᵢ₊₁ − xᵢ₊₁·yᵢ per edge; half their sum is the area. Turn on the triangles from the origin: each term is twice the signed area of one of them, green when it turns anticlockwise and red when it turns clockwise, and the overlapping green and red parts outside the polygon cancel. Reverse the order and only the sign flips. Drag one corner across an edge so the outline crosses itself and the formula stops giving a meaningful area.")}
      >
        {stage}
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={stage}
        controls={<><Row>{buttons}</Row>{controls}</>}
        recap={[
          tx(t, "figShoeR1", "Shoelace: half the sum of xᵢ·yᵢ₊₁ − xᵢ₊₁·yᵢ over every edge, including the closing one."),
          tx(t, "figShoeR2", "Each term is a triangle from the origin; the parts outside the polygon cancel."),
          tx(t, "figShoeR3", "The sign gives the direction (+ anticlockwise, − clockwise); the area is the absolute value, for outlines that do not cross."),
        ]}
      />
    </>
  );
}
