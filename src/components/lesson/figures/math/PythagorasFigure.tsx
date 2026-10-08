"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, C, T, Handle, plot, Grid, useDrag, nearest, clamp, type Pt } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// squares  — a right triangle with legs a and b (drag their ends) and a square
//            built on each side. The two small squares' areas always add up
//            to the big one's: a² + b² = c².
// proof    — a square of side a + b holding four copies of the triangle.
//            Arranged one way they leave a tilted square c² uncovered; the
//            Transport slides them into another arrangement that leaves a²
//            and b². Same big square, same four triangles, so the uncovered
//            areas are equal.
// distance — two points on a grid; the horizontal and vertical steps between
//            them are the legs of a right triangle whose hypotenuse is the
//            straight-line distance.
// The lab: find a whole-number triangle, watch the proof, then measure
// distances on the grid.

type Mode = "squares" | "proof" | "distance";
type Id = "a" | "b" | "P" | "Q";
const W = 560, H = 303;
const f1 = (v: number) => (+v.toFixed(2)).toString();
const m = (v: number) => String(v).replace("-", "−");
const paren = (v: number) => (v < 0 ? `(${m(v)})` : m(v));
const ps = plot({ W, H, x0: -10, x1: 14, y0: -4.5, y1: 8.5 });
const pd = plot({ W, H: 300, x0: -7, x1: 7, y0: -3.75, y1: 3.75 });
const SLIDE = "transform 1.2s ease";

// ── The drawings ──────────────────────────────────────────────────────────────

function SquaresDrawing({ a, b, dragging }: { a: number; b: number; dragging: Id | null }) {
  const c = Math.hypot(a, b);
  const V = (x: number, y: number) => `${ps.X(x)},${ps.Y(y)}`;
  // Square on the hypotenuse, outward (away from the right angle)
  const hyp = [V(a, 0), V(a + b, a), V(b, a + b), V(0, b)].join(" ");
  return <>
    <Grid p={ps} step={1} labels={false} />
    <polygon points={[V(0, 0), V(a, 0), V(a, -a), V(0, -a)].join(" ")} fill={C.sky} fillOpacity={0.25} stroke={C.sky} strokeWidth={1.5} />
    <polygon points={[V(0, 0), V(0, b), V(-b, b), V(-b, 0)].join(" ")} fill={C.pink} fillOpacity={0.25} stroke={C.pink} strokeWidth={1.5} />
    <polygon points={hyp} fill={C.amber} fillOpacity={0.22} stroke={C.amber} strokeWidth={1.5} />
    <polygon points={[V(0, 0), V(a, 0), V(0, b)].join(" ")} fill={C.fg} fillOpacity={0.12} stroke={C.fg} strokeWidth={2.2} strokeLinejoin="round" />
    <path d={`M${ps.X(0) + 10},${ps.Y(0)} v-10 h-10`} fill="none" stroke={C.fg} strokeWidth={1.2} />
    <T x={ps.X(a / 2)} y={ps.Y(-a / 2) + 4} size={11} anchor="middle" color={C.sky} bold>{`a² = ${f1(a * a)}`}</T>
    <T x={ps.X(-b / 2)} y={ps.Y(b / 2) + 4} size={11} anchor="middle" color={C.pink} bold>{`b² = ${f1(b * b)}`}</T>
    <T x={ps.X((a + b) / 2)} y={ps.Y((a + b) / 2) + 4} size={11} anchor="middle" color={C.amber} bold>{`c² = ${f1(c * c)}`}</T>
    <T x={ps.X(a / 2)} y={ps.Y(0) - 5} size={9.5} anchor="middle" color={C.fg}>{`a = ${f1(a)}`}</T>
    <T x={ps.X(0) + 5} y={ps.Y(b / 2)} size={9.5} color={C.fg}>{`b = ${f1(b)}`}</T>
    <Handle x={ps.X(a)} y={ps.Y(0)} color={C.sky} active={dragging === "a"} />
    <Handle x={ps.X(0)} y={ps.Y(b)} color={C.pink} active={dragging === "b"} />
  </>;
}

function ProofDrawing({ a, b, slid }: { a: number; b: number; slid: boolean }) {
  const S = a + b, sc = 250 / S;
  const pp = plot({ W, H: 300, x0: S / 2 - W / (2 * sc), x1: S / 2 + W / (2 * sc), y0: S / 2 - 150 / sc, y1: S / 2 + 150 / sc });
  const V = (x: number, y: number) => `${pp.X(x)},${pp.Y(y)}`;
  // Four copies, each with its own slide from arrangement 1 to arrangement 2
  const tris: { pts: Pt[]; d: Pt; col: string }[] = [
    { pts: [{ x: 0, y: 0 }, { x: a, y: 0 }, { x: 0, y: b }], d: { x: 0, y: a }, col: C.sky },
    { pts: [{ x: S, y: 0 }, { x: a, y: 0 }, { x: S, y: a }], d: { x: 0, y: 0 }, col: C.pink },
    { pts: [{ x: S, y: S }, { x: b, y: S }, { x: S, y: a }], d: { x: -b, y: 0 }, col: C.teal },
    { pts: [{ x: 0, y: S }, { x: b, y: S }, { x: 0, y: b }], d: { x: a, y: -b }, col: C.purple },
  ];
  const fade = (on: boolean) => ({ opacity: on ? 1 : 0, transition: "opacity 0.4s ease" });
  return <>
    <rect x={pp.X(0)} y={pp.Y(S)} width={S * sc} height={S * sc} fill={C.amber} fillOpacity={0.14} stroke={C.fg} strokeWidth={2} />
    <g style={fade(!slid)}><T x={pp.X(S / 2)} y={pp.Y(S / 2) + 4} size={13} anchor="middle" color={C.amber} bold>c²</T></g>
    <g style={fade(slid)}>
      <T x={pp.X(a / 2)} y={pp.Y(a / 2) + 4} size={13} anchor="middle" color={C.amber} bold>a²</T>
      <T x={pp.X(a + b / 2)} y={pp.Y(a + b / 2) + 4} size={13} anchor="middle" color={C.amber} bold>b²</T>
    </g>
    {tris.map((tr, i) => <polygon key={i} points={tr.pts.map(q => V(q.x, q.y)).join(" ")}
      style={{ transform: slid ? `translate(${tr.d.x * sc}px, ${-tr.d.y * sc}px)` : "translate(0px, 0px)", transition: SLIDE }}
      fill={tr.col} fillOpacity={0.55} stroke={tr.col} strokeWidth={1.5} strokeLinejoin="round" />)}
    <T x={pp.X(a / 2)} y={pp.Y(0) + 14} size={9.5} anchor="middle" color={C.fg}>a</T>
    <T x={pp.X(a + b / 2)} y={pp.Y(0) + 14} size={9.5} anchor="middle" color={C.fg}>b</T>
    <T x={pp.X(0) - 8} y={pp.Y(slid ? a / 2 : b / 2) + 3} size={9.5} anchor="end" color={C.fg}>{slid ? "a" : "b"}</T>
    <T x={pp.X(0) - 8} y={pp.Y(slid ? a + b / 2 : b + a / 2) + 3} size={9.5} anchor="end" color={C.fg}>{slid ? "b" : "a"}</T>
  </>;
}

function DistanceDrawing({ P, Q, dragging }: { P: Pt; Q: Pt; dragging: Id | null }) {
  const dx = Q.x - P.x, dy = Q.y - P.y;
  const X = pd.X, Y = pd.Y;
  return <>
    <Grid p={pd} step={1} />
    <line x1={X(P.x)} y1={Y(P.y)} x2={X(Q.x)} y2={Y(P.y)} stroke={C.sky} strokeWidth={2.5} />
    <line x1={X(Q.x)} y1={Y(P.y)} x2={X(Q.x)} y2={Y(Q.y)} stroke={C.pink} strokeWidth={2.5} />
    <line x1={X(P.x)} y1={Y(P.y)} x2={X(Q.x)} y2={Y(Q.y)} stroke={C.amber} strokeWidth={3} />
    {dx !== 0 && dy !== 0 && <path d={`M${X(Q.x) - Math.sign(dx) * 9},${Y(P.y)} v${-Math.sign(dy) * 9} h${Math.sign(dx) * 9}`} fill="none" stroke={C.fg} strokeWidth={1.1} />}
    <T x={(X(P.x) + X(Q.x)) / 2} y={Y(P.y) + (dy >= 0 ? 15 : -7)} size={10} anchor="middle" color={C.sky} bold>{`Δx = ${m(dx)}`}</T>
    <T x={X(Q.x) + (dx >= 0 ? 7 : -7)} y={(Y(P.y) + Y(Q.y)) / 2 + 3} size={10} anchor={dx >= 0 ? "start" : "end"} color={C.pink} bold>{`Δy = ${m(dy)}`}</T>
    <Handle x={X(P.x)} y={Y(P.y)} color={C.green} active={dragging === "P"} />
    <Handle x={X(Q.x)} y={Y(Q.y)} color={C.orange} active={dragging === "Q"} />
    <T x={X(P.x) - 8} y={Y(P.y) + (dy >= 0 ? 16 : -9)} size={9.5} anchor="end" color={C.green} bold>{`P (${m(P.x)}, ${m(P.y)})`}</T>
    <T x={X(Q.x) + 8} y={Y(Q.y) + (dy >= 0 ? -9 : 16)} size={9.5} color={C.orange} bold>{`Q (${m(Q.x)}, ${m(Q.y)})`}</T>
  </>;
}

/** The svg of the current mode; owns the drag (it is mounted twice while the lab is open). */
function PyStage({ mode, a, b, setA, setB, slid, P, Q, setP, setQ }: {
  mode: Mode; a: number; b: number; setA: (v: number) => void; setB: (v: number) => void;
  slid: boolean; P: Pt; Q: Pt; setP: (v: Pt) => void; setQ: (v: Pt) => void;
}) {
  const drag = useDrag<Id>(
    q => mode === "squares"
      ? nearest(q, [["a", { x: ps.X(a), y: ps.Y(0) }], ["b", { x: ps.X(0), y: ps.Y(b) }]], 20)
      : mode === "distance" ? nearest(q, [["P", { x: pd.X(P.x), y: pd.Y(P.y) }], ["Q", { x: pd.X(Q.x), y: pd.Y(Q.y) }]], 20) : null,
    (id, q) => {
      if (id === "a") setA(clamp(Math.round(ps.inv(q).x * 2) / 2, 0.5, 4));
      else if (id === "b") setB(clamp(Math.round(ps.inv(q).y * 2) / 2, 0.5, 4));
      else {
        const w = pd.inv(q), s = { x: clamp(Math.round(w.x), -6, 6), y: clamp(Math.round(w.y), -3, 3) };
        (id === "P" ? setP : setQ)(s);
      }
    });
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${mode === "squares" ? H : 300}`} className="w-full h-auto">
      {mode === "squares" ? <SquaresDrawing a={a} b={b} dragging={drag.dragging} />
        : mode === "proof" ? <ProofDrawing a={a} b={b} slid={slid} />
          : <DistanceDrawing P={P} Q={Q} dragging={drag.dragging} />}
    </svg>
  );
}

export function PythagorasFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("squares");
  const [a, setA] = useState(4), [b, setB] = useState(3);
  const [slid, setSlid] = useState(false);
  const [P, setP] = useState<Pt>({ x: -4, y: -2 }), [Q, setQ] = useState<Pt>({ x: 3, y: 2 });
  const lab = useLab("math-pythagoras");
  const pick = (v: Mode) => { setMode(v); setSlid(false); };

  const c = Math.hypot(a, b), c2 = a * a + b * b;
  const dx = Q.x - P.x, dy = Q.y - P.y, d2 = dx * dx + dy * dy;
  const S = a + b;

  const view = (
    <div>
      <PyStage mode={mode} a={a} b={b} setA={setA} setB={setB} slid={slid} P={P} Q={Q} setP={setP} setQ={setQ} />
      {mode === "proof" && (
        <Transport t={t} playing={false}
          onPlay={() => setSlid(s => !s)}
          playLabel={tx(t, "figPy_play", "slide the triangles")}
          onStep={!slid ? () => setSlid(true) : undefined}
          onBack={slid ? () => setSlid(false) : undefined}
          onReset={() => setSlid(false)}
          readout={slid ? tx(t, "figPy_sSlid", "uncovered: a² + b²") : tx(t, "figPy_sStart", "uncovered: c²")} />
      )}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["squares", tx(t, "figPy_mSquares", "squares")],
    ["proof", tx(t, "figPy_mProof", "proof")],
    ["distance", tx(t, "figPy_mDist", "distance")],
  ] as const} />;
  const controls = mode === "squares" ? <Row>
    <Readout color={C.sky}>{`a² = ${f1(a * a)}`}</Readout>
    <Readout color={C.pink}>{`b² = ${f1(b * b)}`}</Readout>
    <Readout color={C.amber}>{`a² + b² = ${f1(c2)} = c²`}</Readout>
    <Readout color={C.green}>{`c = √${f1(c2)} ≈ ${f1(c)}`}</Readout>
  </Row> : mode === "proof" ? <Row>
    <Readout>{`(a + b)² = ${f1(S * S)}`}</Readout>
    <Readout>{`4 · ab/2 = ${f1(2 * a * b)}`}</Readout>
    <Readout color={C.amber}>{!slid ? `c² = ${f1(S * S)} − ${f1(2 * a * b)} = ${f1(S * S - 2 * a * b)}` : `a² + b² = ${f1(a * a)} + ${f1(b * b)} = ${f1(c2)}`}</Readout>
  </Row> : <Row>
    <Readout color={C.sky}>{`Δx = ${m(Q.x)} − ${paren(P.x)} = ${m(dx)}`}</Readout>
    <Readout color={C.pink}>{`Δy = ${m(Q.y)} − ${paren(P.y)} = ${m(dy)}`}</Readout>
    <Readout color={C.amber}>{`d = √(${dx * dx} + ${dy * dy}) = √${d2} ≈ ${f1(Math.sqrt(d2))}`}</Readout>
  </Row>;
  const note = mode === "squares"
    ? tx(t, "figPy_noteS", "Drag the blue and pink points to change the two legs of the right triangle. On each side stands a square; its area is that side's length squared. However you change the legs, the blue and pink areas add up exactly to the amber one. Try a = 4, b = 3: 16 + 9 = 25, so the hypotenuse is exactly 5.")
    : mode === "proof"
      ? tx(t, "figPy_noteP2", "The big square has side a + b and holds four copies of the right triangle. At the start they leave a tilted square in the middle whose side is the hypotenuse c, so the uncovered area is c². Press play to slide them: nothing is added or removed, the four triangles only move, and at the end the uncovered area is two squares, a² and b². The same big square minus the same four triangles, so c² = a² + b². The legs used here are the ones set in the first mode.")
      : tx(t, "figPy_noteD", "Drag P and Q. Going from P to Q you move Δx sideways and Δy up or down; those two moves are the legs of a right triangle, and the straight-line distance is its hypotenuse. The legs are squared, so their signs do not matter: moving left 3 counts the same as moving right 3.");

  // ── Lab ──
  const whole = Number.isInteger(c2) && Number.isInteger(Math.sqrt(c2));
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figPyL1_t", "Squares on the sides"),
      body: <>
        <p>{tx(t, "figPyL1_b1", "The blue and pink squares stand on the two legs, the amber one on the hypotenuse. The two small areas always add up to the big one.")}</p>
        <p>{tx(t, "figPyL1_b2", "Usually c comes out as a long decimal. Drag the legs until the hypotenuse is a whole number.")}</p>
      </>,
      goal: { text: tx(t, "figPyL1_g", "A whole-number hypotenuse."), done: mode === "squares" && whole },
      hint: tx(t, "figPyL1_h", "The builder's triangle: legs 3 and 4."),
      setup: () => { pick("squares"); setA(2); setB(2); },
    },
    {
      title: tx(t, "figPyL2_t", "Quick check"),
      body: <p>{tx(t, "figPyL2_b", "c = √(a² + b²).")}</p>,
      quiz: {
        q: tx(t, "figPyL2_q", "The legs are 5 and 12. How long is the hypotenuse?"),
        options: ["13", "17", "√17", "7"],
        answer: 0,
        why: tx(t, "figPyL2_w", "25 + 144 = 169 = 13². Adding the legs (17) is the classic mistake: the squares add, not the sides."),
      },
    },
    {
      title: tx(t, "figPyL3_t", "Why it is true"),
      body: <>
        <p>{tx(t, "figPyL3_b1", "A square of side a + b holds four copies of the triangle. The space they leave is the tilted square c².")}</p>
        <p>{tx(t, "figPyL3_b2", "Slide the triangles and watch what the space turns into.")}</p>
      </>,
      goal: { text: tx(t, "figPyL3_g", "Slide the four triangles."), done: mode === "proof" && slid },
      focus: "play",
      setup: () => { pick("proof"); setA(4); setB(3); },
    },
    {
      title: tx(t, "figPyL4_t", "Quick check"),
      body: <p>{tx(t, "figPyL4_b", "A 5 m ladder leans on a wall with its foot 3 m from the wall.")}</p>,
      quiz: {
        q: tx(t, "figPyL4_q", "How high up the wall does it reach?"),
        options: ["4 m", "2 m", "√34 m", "8 m"],
        answer: 0,
        why: tx(t, "figPyL4_w", "The ladder is the hypotenuse: √(5² − 3²) = √(25 − 9) = √16 = 4 m. For a leg, subtract."),
      },
    },
    {
      title: tx(t, "figPyL5_t", "Distance on a grid"),
      body: <>
        <p>{tx(t, "figPyL5_b1", "From P to Q you move Δx across and Δy up: the legs of a right triangle. The straight distance is its hypotenuse.")}</p>
        <p>{tx(t, "figPyL5_b2", "Place Q exactly 5 away from P, on a slant (not straight across or up).")}</p>
      </>,
      goal: { text: tx(t, "figPyL5_g", "d = 5, with Δx ≠ 0 and Δy ≠ 0."), done: mode === "distance" && d2 === 25 && dx !== 0 && dy !== 0 },
      hint: tx(t, "figPyL5_h", "Use the 3-4-5 triangle: 3 across and 4 up, or 4 across and 3 up."),
      setup: () => { pick("distance"); setP({ x: -4, y: -2 }); setQ({ x: 3, y: 2 }); },
    },
    {
      title: tx(t, "figPyL6_t", "Quick check"),
      body: <p>{tx(t, "figPyL6_b", "Compare squared distances and skip the root.")}</p>,
      quiz: {
        q: tx(t, "figPyL6_q", "Is the point (7, 4) within 8 of the origin?"),
        options: [tx(t, "figPyL6_o1", "no: 65 > 64"), tx(t, "figPyL6_o2", "yes: 7 + 4 = 11 > 8"), tx(t, "figPyL6_o3", "yes: 7 < 8 and 4 < 8"), tx(t, "figPyL6_o4", "exactly on the edge")],
        answer: 0,
        why: tx(t, "figPyL6_w", "7² + 4² = 49 + 16 = 65, and 8² = 64. 65 > 64, so it is just outside, at √65 ≈ 8.06."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "triple", tone: "ok", when: mode === "squares" && whole,
      title: tx(t, "figPyI1_t", "A whole-number triangle"),
      body: fill(tx(t, "figPyI1_b", "{a}² + {b}² = {c2} = {c}². Right triangles with all-whole sides are rare; this one is a multiple of 3, 4, 5."), { a: f1(a), b: f1(b), c2: f1(c2), c: f1(c) }),
    },
    {
      id: "flatd", tone: "info", when: mode === "distance" && (dx === 0 || dy === 0) && d2 > 0,
      title: tx(t, "figPyI2_t", "One leg is zero"),
      body: fill(tx(t, "figPyI2_b", "P and Q are on one grid line, so the triangle is flat and the distance is just {d}: √(d²) gives back the length. The formula still works."), { d: Math.sqrt(d2) }),
    },
    {
      id: "neg", tone: "info", when: mode === "distance" && (dx < 0 || dy < 0),
      title: tx(t, "figPyI3_t", "Negative steps"),
      body: fill(tx(t, "figPyI3_b", "Δx = {dx}, Δy = {dy}. Squaring makes every step positive, so the distance does not care which way you went."), { dx: m(dx), dy: m(dy) }),
    },
  ];

  const title = tx(t, "figPy_title", "The Pythagorean theorem");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        {view}
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figPyR1", "In a right triangle a² + b² = c²: the squares on the legs fill the square on the hypotenuse."),
          tx(t, "figPyR2", "For the hypotenuse add the squares; for a leg subtract them; then take the root."),
          tx(t, "figPyR3", "The distance between two points is √(Δx² + Δy²); compare squared distances to skip the root."),
        ]}
      />
    </>
  );
}
