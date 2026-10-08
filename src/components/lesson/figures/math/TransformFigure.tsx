"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, Btn, C, T, Handle, plot, Grid, useDrag, useRaf, nearest, clamp, lerp, type Pt } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// An F-shaped polygon (it has no symmetry, so every flip and turn is visible)
// and its image under one transformation, as coordinate rules:
// translate — (x + a, y + b)
// reflect   — across the x-axis, the y-axis, y = x or a vertical line x = c;
//             the corners' winding flips, so the shoelace area changes sign
// rotate    — quarter turns about a draggable pivot: (x, y) → (−y, x) about
//             the origin, with a translation to and from the pivot; the
//             Transport turns it a quarter turn at a time
// scale     — (sx·x, sy·y); area × sx·sy, a negative factor mirrors
// shear     — (x + k·y, y); the area never changes
// order     — "turn, then move" against "move, then turn": not the same; the
//             Transport applies the two moves one at a time
// The lab: a mirror that makes the copy touch, half a turn, a stretch that
// keeps the area, a scale that mirrors, a shear, and the two orders.

type Mode = "translate" | "reflect" | "rotate" | "scale" | "shear" | "order";
type Mirror = "x" | "y" | "diag" | "line";
type Order = "rt" | "tr";
const W = 560, H = 300;
const p = plot({ W, H, x0: -7.467, x1: 7.467, y0: -4, y1: 4 });
const n2 = (v: number) => (+v.toFixed(2)).toString().replace("-", "−");
const F: Pt[] = [[0, 0], [0.6, 0], [0.6, 1.4], [1.6, 1.4], [1.6, 2], [0.6, 2], [0.6, 2.6], [2, 2.6], [2, 3.2], [0, 3.2]]
  .map(([x, y]) => ({ x: x + 1, y: y - 1.6 }));
const pts = (q: Pt[]) => q.map(v => `${p.X(v.x)},${p.Y(v.y)}`).join(" ");
const shoelace = (q: Pt[]) => q.reduce((s, a, i) => { const b = q[(i + 1) % q.length]; return s + a.x * b.y - b.x * a.y; }, 0) / 2;
const rot90 = (v: Pt, turns: number, c: Pt = { x: 0, y: 0 }): Pt => {
  let x = v.x - c.x, y = v.y - c.y;
  for (let i = 0; i < turns; i++) [x, y] = [-y, x];
  return { x: x + c.x, y: y + c.y };
};
/** Smooth rotation by angle a about c, only to animate between quarter turns. */
const rotA = (v: Pt, a: number, c: Pt): Pt => {
  const cs = Math.cos(a), sn = Math.sin(a), x = v.x - c.x, y = v.y - c.y;
  return { x: c.x + cs * x - sn * y, y: c.y + sn * x + cs * y };
};
const turnQ = (v: Pt) => rot90(v, 1), moveL = (v: Pt) => ({ x: v.x - 3, y: v.y });
/** The F after `stage` of the two moves, in the given order. */
const ordered = (order: Order, stage: number) => F.map(v => {
  const [first, second] = order === "rt" ? [turnQ, moveL] : [moveL, turnQ];
  return stage === 0 ? v : stage === 1 ? first(v) : second(first(v));
});

type State = { mode: Mode; ta: number; tb: number; mirror: Mirror; mc: number; ang: number; pv: Pt; sx: number; sy: number; k: number; order: Order; stage: number };

/** The image of the F under the current transformation, and the rule as text. */
function image(s: State, t?: TrackTranslations): { img: Pt[]; rule: string } {
  if (s.mode === "translate") return { img: F.map(v => ({ x: v.x + s.ta, y: v.y + s.tb })), rule: `(x, y) → (x + ${n2(s.ta)}, y + ${n2(s.tb)})` };
  if (s.mode === "reflect") {
    const f = (v: Pt): Pt => s.mirror === "x" ? { x: v.x, y: -v.y } : s.mirror === "y" ? { x: -v.x, y: v.y } : s.mirror === "diag" ? { x: v.y, y: v.x } : { x: 2 * s.mc - v.x, y: v.y };
    return { img: F.map(f), rule: s.mirror === "x" ? "(x, y) → (x, −y)" : s.mirror === "y" ? "(x, y) → (−x, y)" : s.mirror === "diag" ? "(x, y) → (y, x)" : `(x, y) → (2·${n2(s.mc)} − x, y)` };
  }
  if (s.mode === "rotate") {
    const q = Math.floor(s.ang / 90), rest = (s.ang - q * 90) / 90;
    const r90 = ["(x, y)", "(−y, x)", "(−x, −y)", "(y, −x)"][q % 4];
    const rule = Math.abs(rest) < 1e-9 ? (s.pv.x === 0 && s.pv.y === 0 ? `(x, y) → ${r90}` : `${tx(t, "figTr_pivotRule", "about the pivot")}: ${r90}`) : `${Math.round(s.ang)}°`;
    return { img: F.map(v => rotA(rot90(v, q, s.pv), (rest * Math.PI) / 2, s.pv)), rule };
  }
  if (s.mode === "scale") return { img: F.map(v => ({ x: s.sx * v.x, y: s.sy * v.y })), rule: `(x, y) → (${n2(s.sx)}x, ${n2(s.sy)}y)` };
  if (s.mode === "shear") return { img: F.map(v => ({ x: v.x + s.k * v.y, y: v.y })), rule: `(x, y) → (x + ${n2(s.k)}y, y)` };
  return { img: ordered(s.order, s.stage), rule: s.order === "rt" ? tx(t, "figTr_rt", "turn 90°, then move (−3, 0)") : tx(t, "figTr_tr", "move (−3, 0), then turn 90°") };
}

// ── The drawing (owns its drag: it is mounted twice while the lab is open) ────

function TransformStage({ s, img, setPv }: { s: State; img: Pt[]; setPv: (v: Pt) => void }) {
  const drag = useDrag<"pv">(
    q => s.mode === "rotate" ? nearest(q, [["pv", { x: p.X(s.pv.x), y: p.Y(s.pv.y) }]], 20) : null,
    (_, q) => { const w = p.inv(q); setPv({ x: clamp(Math.round(w.x), -5, 5), y: clamp(Math.round(w.y), -3, 3) }); });

  let extra: React.ReactNode = null;
  if (s.mode === "translate") {
    extra = <line x1={p.X(F[0].x)} y1={p.Y(F[0].y)} x2={p.X(img[0].x)} y2={p.Y(img[0].y)} stroke={C.green} strokeWidth={1.5} strokeDasharray="4 3" />;
  } else if (s.mode === "reflect") {
    const line = s.mirror === "x" ? [{ x: -8, y: 0 }, { x: 8, y: 0 }] : s.mirror === "y" ? [{ x: 0, y: -5 }, { x: 0, y: 5 }] : s.mirror === "diag" ? [{ x: -5, y: -5 }, { x: 5, y: 5 }] : [{ x: s.mc, y: -5 }, { x: s.mc, y: 5 }];
    extra = <>
      <line x1={p.X(line[0].x)} y1={p.Y(line[0].y)} x2={p.X(line[1].x)} y2={p.Y(line[1].y)} stroke={C.purple} strokeWidth={2.2} />
      {[0, 7, 9].map(i => <line key={i} x1={p.X(F[i].x)} y1={p.Y(F[i].y)} x2={p.X(img[i].x)} y2={p.Y(img[i].y)} stroke={C.muted} strokeWidth={0.9} strokeDasharray="3 3" />)}
    </>;
  } else if (s.mode === "rotate") {
    extra = <>
      <line x1={p.X(s.pv.x)} y1={p.Y(s.pv.y)} x2={p.X(F[8].x)} y2={p.Y(F[8].y)} stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
      <line x1={p.X(s.pv.x)} y1={p.Y(s.pv.y)} x2={p.X(img[8].x)} y2={p.Y(img[8].y)} stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
      <Handle x={p.X(s.pv.x)} y={p.Y(s.pv.y)} color={C.green} active={drag.dragging === "pv"} />
    </>;
  } else if (s.mode === "order" && s.stage === 2) {
    extra = <polygon points={pts(ordered(s.order === "rt" ? "tr" : "rt", 2))} fill="none" stroke={C.muted} strokeWidth={1.2} strokeDasharray="4 3" />;
  }

  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <Grid p={p} step={1} />
      {extra}
      <polygon points={pts(F)} fill={C.sky} fillOpacity={0.25} stroke={C.sky} strokeWidth={1.8} strokeLinejoin="round" />
      <polygon points={pts(img)} fill={C.amber} fillOpacity={0.3} stroke={C.amber} strokeWidth={2} strokeLinejoin="round" />
      <circle cx={p.X(F[0].x)} cy={p.Y(F[0].y)} r={3.5} fill={C.sky} />
      <circle cx={p.X(img[0].x)} cy={p.Y(img[0].y)} r={3.5} fill={C.amber} />
      <T x={p.X(lerp(F[8].x, F[9].x, 0.5))} y={p.Y(F[8].y) - 6} size={10} anchor="middle" color={C.sky} bold>F</T>
    </svg>
  );
}

export function TransformFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("reflect");
  const [ta, setTa] = useState(-4), [tb, setTb] = useState(1);
  const [mirror, setMirror] = useState<Mirror>("y");
  const [mc, setMc] = useState(-1);
  const [ang, setAng] = useState(90);
  const [target, setTarget] = useState(90);           // the quarter turn the rotation is animating to
  const [pv, setPv] = useState<Pt>({ x: 0, y: 0 });
  const [sx, setSx] = useState(1.5), [sy, setSy] = useState(0.5);
  const [k, setK] = useState(1);
  const [order, setOrder] = useState<Order>("rt");
  const [stage, setStage] = useState(2);
  const lab = useLab("math-transform");

  // The rotation glides to its target quarter turn
  const ref = useRaf(ang !== target, dt => {
    const d = target - ang, max = dt * 150;
    setAng(Math.abs(d) <= max ? target : ang + Math.sign(d) * max);
  });
  const snapRot = (v: number) => { setAng(v); setTarget(v); };
  const playRot = () => {
    if (ang !== target) { snapRot(Math.round(ang)); return; }            // pause where it is
    if (ang >= 360) { setAng(0); setTarget(90); return; }                // start a new lap
    setTarget(Math.floor(ang / 90) * 90 + 90);
  };

  const s: State = { mode, ta, tb, mirror, mc, ang, pv, sx, sy, k, order, stage };
  const { img, rule } = image(s, t);
  const a0 = shoelace(F), a1 = shoelace(img);
  const wind = (a: number) => (a > 0 ? tx(t, "figTr_ccw", "anticlockwise") : a < 0 ? tx(t, "figTr_cw", "clockwise") : "–");
  const pick = (m: Mode) => { setMode(m); setTarget(ang); };

  const orderNames = order === "rt"
    ? [tx(t, "figTr_s0", "the F"), tx(t, "figTr_sTurned", "turned 90°"), tx(t, "figTr_sThenMoved", "then moved (−3, 0)")]
    : [tx(t, "figTr_s0", "the F"), tx(t, "figTr_sMoved", "moved (−3, 0)"), tx(t, "figTr_sThenTurned", "then turned 90°")];
  const settled = ang === target;
  const view = (
    <div>
      <TransformStage s={s} img={img} setPv={setPv} />
      {mode === "rotate" && (
        <Transport t={t} playing={!settled}
          onPlay={playRot}
          playLabel={tx(t, "figTr_playRot", "turn a quarter")}
          onStep={ang < 360 ? () => snapRot(Math.min(360, Math.floor(ang / 90) * 90 + 90)) : undefined}
          onBack={ang > 0 ? () => snapRot(Math.max(0, Math.ceil(ang / 90) * 90 - 90)) : undefined}
          onReset={() => snapRot(0)}
          readout={`${Math.round(ang)}°`} />
      )}
      {mode === "order" && (
        <Transport t={t} playing={false}
          onPlay={() => setStage(stage >= 2 ? 0 : stage + 1)}
          playLabel={tx(t, "figTr_playOrder", "next move")}
          onStep={stage < 2 ? () => setStage(stage + 1) : undefined}
          onBack={stage > 0 ? () => setStage(stage - 1) : undefined}
          onReset={() => setStage(0)}
          readout={orderNames[stage]} />
      )}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["translate", tx(t, "figTr_mT", "translate")],
    ["reflect", tx(t, "figTr_mR", "reflect")],
    ["rotate", tx(t, "figTr_mO", "rotate")],
    ["scale", tx(t, "figTr_mS", "scale")],
    ["shear", tx(t, "figTr_mH", "shear")],
    ["order", tx(t, "figTr_mC", "order")],
  ] as const} />;

  const modeControls = mode === "translate" ? <Sliders>
    <Slider label="a" value={ta} min={-7} max={4} step={0.5} onChange={setTa} fmt={n2} />
    <Slider label="b" value={tb} min={-2} max={2} step={0.5} onChange={setTb} fmt={n2} />
  </Sliders> : mode === "reflect" ? <>
    <Row>
      {([["x", tx(t, "figTr_xAxis", "x-axis")], ["y", tx(t, "figTr_yAxis", "y-axis")], ["diag", "y = x"], ["line", "x = c"]] as const).map(([m, l]) =>
        <Btn key={m} active={mirror === m} onClick={() => setMirror(m)}>{l}</Btn>)}
    </Row>
    {mirror === "line" && <Slider label="c" value={mc} min={-4} max={3} step={0.5} onChange={setMc} fmt={n2} width="w-10" />}
  </> : mode === "scale" ? <Sliders>
    <Slider label="sx" value={sx} min={-2} max={2} step={0.25} onChange={setSx} fmt={n2} />
    <Slider label="sy" value={sy} min={-2} max={2} step={0.25} onChange={setSy} fmt={n2} />
  </Sliders> : mode === "shear" ? <Slider label="k" value={k} min={-2} max={2} step={0.1} onChange={setK} fmt={n2} width="w-10" />
    : mode === "order" ? <Row>
      <Btn active={order === "rt"} onClick={() => setOrder("rt")}>{tx(t, "figTr_rtB", "turn, then move")}</Btn>
      <Btn active={order === "tr"} onClick={() => setOrder("tr")}>{tx(t, "figTr_trB", "move, then turn")}</Btn>
    </Row> : null;
  const controls = <>
    {modeControls}
    <Row>
      <Readout color={C.amber}>{rule}</Readout>
      <Readout>{`${tx(t, "figTr_area", "area")}: ${n2(a0)} → ${n2(a1)}`}</Readout>
      <Readout color={C.pink}>{`${tx(t, "figTr_winding", "winding")}: ${wind(a0)} → ${wind(a1)}`}</Readout>
    </Row>
  </>;
  const note = mode === "translate" ? tx(t, "figTr_noteT", "A translation slides every point by the same step (a, b). Nothing turns, flips or stretches: lengths, angles, area and even the direction the shape faces stay the same. It is the simplest move, and the one a game applies every frame to everything that moves.")
    : mode === "reflect" ? tx(t, "figTr_noteR", "A reflection flips the shape over a mirror line: each point goes straight across the line to the same distance on the other side (dashed). Lengths and angles survive, but the shape now faces the other way, like your left hand in a mirror becoming a right hand. The winding readout shows it: corners listed anticlockwise come out clockwise, and the shoelace area changes sign.")
      : mode === "rotate" ? tx(t, "figTr_noteO2", "A rotation turns every point around a pivot (drag the green dot) by the same angle; anticlockwise is the positive direction. Press play to turn a quarter turn at a time. Quarter turns about the origin have simple rules: 90° sends (x, y) to (−y, x), 180° to (−x, −y), 270° to (y, −x). For any other angle you need sine and cosine, in the Trigonometry section. Unlike a reflection, a rotation never changes which way the shape faces.")
        : mode === "scale" ? tx(t, "figTr_noteS", "Scaling multiplies each coordinate by its own factor. With sx = sy it is a dilation about the origin, and the image is similar to the original. With different factors the shape is stretched: angles change and a circle would become an ellipse. The area is multiplied by sx · sy. A negative factor also mirrors the shape, which is why engines treat negative scale as a reflection.")
          : mode === "shear" ? tx(t, "figTr_noteH", "A shear slides each horizontal row sideways in proportion to its height, like pushing the top of a deck of cards. Rows keep their length and their height, so by Cavalieri's principle the area does not change, even though angles do. Shears make italic text and the slanted look of fake 3D.")
            : tx(t, "figTr_noteC2", "Doing two transformations one after the other is a composition, and the order matters. Step through the two moves: turn the F a quarter turn about the origin and then move it 3 to the left, or move it first and then turn. The results (amber, and dashed for the other order) end up in different places, because the turn is about the origin and the move changed how far the shape was from it. It is the difference between a door turning on its hinge and a door carried around the room's centre.");

  // ── Lab ──
  const near = (u: number, v: number) => Math.abs(u - v) < 1e-9;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figTrL1_t", "A mirror that touches"),
      body: <>
        <p>{tx(t, "figTrL1_b1", "Reflect across the vertical line x = c: every point jumps straight across the line to the same distance on the other side.")}</p>
        <p>{tx(t, "figTrL1_b2", "Place the mirror so that the flipped F touches the original along its left edge.")}</p>
      </>,
      goal: { text: tx(t, "figTrL1_g", "The two F's share their left edge."), done: mode === "reflect" && mirror === "line" && mc === 1 },
      hint: tx(t, "figTrL1_h", "The F's left edge is the line x = 1. Put the mirror on it."),
      setup: () => { pick("reflect"); setMirror("line"); setMc(-1); },
    },
    {
      title: tx(t, "figTrL2_t", "Quick check"),
      body: <p>{tx(t, "figTrL2_b", "Reflecting across y = x swaps the two coordinates.")}</p>,
      quiz: {
        q: tx(t, "figTrL2_q", "Where does (3, −2) land when reflected across y = x?"),
        options: ["(−2, 3)", "(3, 2)", "(−3, −2)", "(2, −3)"],
        answer: 0,
        why: tx(t, "figTrL2_w", "(x, y) → (y, x): (3, −2) → (−2, 3). (3, 2) is the reflection across the x-axis."),
      },
    },
    {
      title: tx(t, "figTrL3_t", "Half a turn"),
      body: <p>{tx(t, "figTrL3_b", "Turn the F about the origin, one quarter turn at a time, until it is upside down. Read the rule for each quarter.")}</p>,
      goal: { text: tx(t, "figTrL3_g", "180° about the origin."), done: mode === "rotate" && ang === 180 && pv.x === 0 && pv.y === 0 },
      focus: "step",
      setup: () => { pick("rotate"); snapRot(0); setPv({ x: 0, y: 0 }); },
    },
    {
      title: tx(t, "figTrL4_t", "Stretch, same area"),
      body: <p>{tx(t, "figTrL4_b", "Scaling multiplies the area by sx · sy. Stretch the F out of shape without changing its area, and without flipping it.")}</p>,
      goal: { text: tx(t, "figTrL4_g", "sx ≠ sy, both positive, area unchanged."), done: mode === "scale" && sx > 0 && sy > 0 && sx !== sy && near(sx * sy, 1) },
      hint: tx(t, "figTrL4_h", "2 × 0.5 = 1."),
      setup: () => { pick("scale"); setSx(1.5); setSy(1.5); },
    },
    {
      title: tx(t, "figTrL5_t", "A scale that mirrors"),
      body: <p>{tx(t, "figTrL5_b", "Now make the winding readout flip from anticlockwise to clockwise, using only the scale factors.")}</p>,
      goal: { text: tx(t, "figTrL5_g", "A clockwise image."), done: mode === "scale" && a1 < 0 },
      hint: tx(t, "figTrL5_h", "Make exactly one of the two factors negative."),
    },
    {
      title: tx(t, "figTrL6_t", "Push the deck"),
      body: <p>{tx(t, "figTrL6_b", "A shear slides each row sideways in proportion to its height. Push it hard either way and watch the area readout.")}</p>,
      goal: { text: tx(t, "figTrL6_g", "|k| ≥ 1.5."), done: mode === "shear" && Math.abs(k) >= 1.5 - 1e-9 },
      setup: () => { pick("shear"); setK(0); },
    },
    {
      title: tx(t, "figTrL7_t", "Order matters"),
      body: <>
        <p>{tx(t, "figTrL7_b1", "Step through \"turn, then move\": the F turns about the origin, then slides 3 to the left.")}</p>
        <p>{tx(t, "figTrL7_b2", "Then switch to \"move, then turn\" and step through it too. The dashed outline is where the other order ended.")}</p>
      </>,
      goal: { text: tx(t, "figTrL7_g", "Finish \"move, then turn\"."), done: mode === "order" && order === "tr" && stage === 2 },
      setup: () => { pick("order"); setOrder("rt"); setStage(0); },
    },
    {
      title: tx(t, "figTrL8_t", "Quick check"),
      body: <p>{tx(t, "figTrL8_b", "Rotations about the origin turn (x, y) into (−y, x).")}</p>,
      quiz: {
        q: tx(t, "figTrL8_q", "Move (1, 0) by (−3, 0), then turn it 90° about the origin. Where does it end?"),
        options: ["(0, −2)", "(−3, 1)", "(0, 1)", "(−2, 0)"],
        answer: 0,
        why: tx(t, "figTrL8_w", "Moving gives (−2, 0); turning gives (−0, −2) = (0, −2). The other order, turn then move, gives (0, 1) then (−3, 1)."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "flip", tone: "warn", when: a0 * a1 < 0,
      title: tx(t, "figTrI1_t", "The F faces the other way"),
      body: fill(tx(t, "figTrI1_b", "The winding flipped from anticlockwise to clockwise, so the shoelace area changed sign ({a0} → {a1}). Only a reflection, or a scale with one negative factor, does that."), { a0: n2(a0), a1: n2(a1) }),
    },
    {
      id: "area", tone: "ok", when: (mode === "scale" || mode === "shear") && near(Math.abs(a1), Math.abs(a0)) && !(mode === "scale" && near(sx, 1) && near(sy, 1)),
      title: tx(t, "figTrI2_t", "Same area"),
      body: mode === "shear"
        ? tx(t, "figTrI2_shear", "A shear never changes the area: each row keeps its length and its height.")
        : tx(t, "figTrI2_scale", "sx · sy = 1, so the area is unchanged, even though the shape is stretched."),
    },
    {
      id: "pivot", tone: "info", when: mode === "rotate" && (pv.x !== 0 || pv.y !== 0),
      title: tx(t, "figTrI3_t", "A different pivot"),
      body: fill(tx(t, "figTrI3_b", "Turning about ({x}, {y}) is: move the pivot to the origin, turn, move back. Same shape and angle, different place."), { x: n2(pv.x), y: n2(pv.y) }),
    },
  ];

  const title = tx(t, "figTr_title", "Moving shapes with coordinate rules");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        <div ref={ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figTrR1", "Translations, reflections and rotations keep lengths and angles; only a reflection makes the shape face the other way."),
          tx(t, "figTrR2", "Scaling multiplies the area by sx · sy (a negative factor mirrors); a shear keeps the area."),
          tx(t, "figTrR3", "In a composition the order matters: turn-then-move and move-then-turn land in different places."),
        ]}
      />
    </>
  );
}
