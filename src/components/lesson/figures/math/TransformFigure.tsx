"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, Btn, C, T, Handle, plot, Grid, useDrag, nearest, clamp, lerp, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// An F-shaped polygon (it has no symmetry, so every flip and turn is visible)
// and its image under one transformation, as coordinate rules:
// translate — (x + a, y + b)
// reflect   — across the x-axis, the y-axis, y = x or a vertical line x = c;
//             the corners' winding flips, so the shoelace area changes sign
// rotate    — quarter turns about a draggable pivot: (x, y) → (−y, x) about
//             the origin, with a translation to and from the pivot
// scale     — (sx·x, sy·y); area × sx·sy, a negative factor mirrors
// shear     — (x + k·y, y); the area never changes
// order     — "turn, then move" against "move, then turn": not the same

type Mode = "translate" | "reflect" | "rotate" | "scale" | "shear" | "order";
type Mirror = "x" | "y" | "diag" | "line";
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

export function TransformFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("reflect");
  const [ta, setTa] = useState(-4), [tb, setTb] = useState(1);
  const [mirror, setMirror] = useState<Mirror>("y");
  const [mc, setMc] = useState(-1);
  const [ang, setAng] = useState(90);
  const [pv, setPv] = useState<Pt>({ x: 0, y: 0 });
  const [sx, setSx] = useState(1.5), [sy, setSy] = useState(0.5);
  const [k, setK] = useState(1);
  const [order, setOrder] = useState<"rt" | "tr">("rt");

  const drag = useDrag<"pv">(
    q => mode === "rotate" ? nearest(q, [["pv", { x: p.X(pv.x), y: p.Y(pv.y) }]], 20) : null,
    (_, q) => { const w = p.inv(q); setPv({ x: clamp(Math.round(w.x), -5, 5), y: clamp(Math.round(w.y), -3, 3) }); });

  let img: Pt[] = F, extra: React.ReactNode = null, rule = "", controls: React.ReactNode = null, note = "";

  if (mode === "translate") {
    img = F.map(v => ({ x: v.x + ta, y: v.y + tb }));
    extra = <line x1={p.X(F[0].x)} y1={p.Y(F[0].y)} x2={p.X(img[0].x)} y2={p.Y(img[0].y)} stroke={C.green} strokeWidth={1.5} strokeDasharray="4 3" />;
    rule = `(x, y) → (x + ${n2(ta)}, y + ${n2(tb)})`;
    controls = <Sliders>
      <Slider label="a" value={ta} min={-7} max={4} step={0.5} onChange={setTa} fmt={n2} />
      <Slider label="b" value={tb} min={-2} max={2} step={0.5} onChange={setTb} fmt={n2} />
    </Sliders>;
    note = tx(t, "figTr_noteT", "A translation slides every point by the same step (a, b). Nothing turns, flips or stretches: lengths, angles, area and even the direction the shape faces stay the same. It is the simplest move, and the one a game applies every frame to everything that moves.");
  } else if (mode === "reflect") {
    const f = (v: Pt): Pt => mirror === "x" ? { x: v.x, y: -v.y } : mirror === "y" ? { x: -v.x, y: v.y } : mirror === "diag" ? { x: v.y, y: v.x } : { x: 2 * mc - v.x, y: v.y };
    img = F.map(f);
    const line = mirror === "x" ? [{ x: -8, y: 0 }, { x: 8, y: 0 }] : mirror === "y" ? [{ x: 0, y: -5 }, { x: 0, y: 5 }] : mirror === "diag" ? [{ x: -5, y: -5 }, { x: 5, y: 5 }] : [{ x: mc, y: -5 }, { x: mc, y: 5 }];
    extra = <>
      <line x1={p.X(line[0].x)} y1={p.Y(line[0].y)} x2={p.X(line[1].x)} y2={p.Y(line[1].y)} stroke={C.purple} strokeWidth={2.2} />
      {[0, 7, 9].map(i => <line key={i} x1={p.X(F[i].x)} y1={p.Y(F[i].y)} x2={p.X(img[i].x)} y2={p.Y(img[i].y)} stroke={C.muted} strokeWidth={0.9} strokeDasharray="3 3" />)}
    </>;
    rule = mirror === "x" ? "(x, y) → (x, −y)" : mirror === "y" ? "(x, y) → (−x, y)" : mirror === "diag" ? "(x, y) → (y, x)" : `(x, y) → (2·${n2(mc)} − x, y)`;
    controls = <>
      <Row>
        {([["x", tx(t, "figTr_xAxis", "x-axis")], ["y", tx(t, "figTr_yAxis", "y-axis")], ["diag", "y = x"], ["line", "x = c"]] as const).map(([m, l]) =>
          <Btn key={m} active={mirror === m} onClick={() => setMirror(m)}>{l}</Btn>)}
      </Row>
      {mirror === "line" && <Slider label="c" value={mc} min={-4} max={3} step={0.5} onChange={setMc} fmt={n2} width="w-10" />}
    </>;
    note = tx(t, "figTr_noteR", "A reflection flips the shape over a mirror line: each point goes straight across the line to the same distance on the other side (dashed). Lengths and angles survive, but the shape now faces the other way, like your left hand in a mirror becoming a right hand. The winding readout shows it: corners listed anticlockwise come out clockwise, and the shoelace area changes sign.");
  } else if (mode === "rotate") {
    const q = Math.floor(ang / 90), rest = (ang - q * 90) / 90;
    img = F.map(v => rotA(rot90(v, q, pv), (rest * Math.PI) / 2, pv));
    extra = <>
      <line x1={p.X(pv.x)} y1={p.Y(pv.y)} x2={p.X(F[8].x)} y2={p.Y(F[8].y)} stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
      <line x1={p.X(pv.x)} y1={p.Y(pv.y)} x2={p.X(img[8].x)} y2={p.Y(img[8].y)} stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
      <Handle x={p.X(pv.x)} y={p.Y(pv.y)} color={C.green} active={drag.dragging === "pv"} />
    </>;
    const r90 = ["(x, y)", "(−y, x)", "(−x, −y)", "(y, −x)"][q % 4];
    rule = ang % 90 === 0 ? (pv.x === 0 && pv.y === 0 ? `(x, y) → ${r90}` : `${tx(t, "figTr_pivotRule", "about the pivot")}: ${r90}`) : `${Math.round(ang)}°`;
    controls = <Slider label={tx(t, "figTr_angle", "turn")} value={ang} min={0} max={360} step={5} onChange={setAng} fmt={v => `${v}°`} width="w-12" />;
    note = tx(t, "figTr_noteO", "A rotation turns every point around a pivot (drag the green dot) by the same angle; anticlockwise is the positive direction. Quarter turns about the origin have simple rules: 90° sends (x, y) to (−y, x), 180° to (−x, −y), 270° to (y, −x). For any other angle you need sine and cosine, in the Trigonometry section. Unlike a reflection, a rotation never changes which way the shape faces.");
  } else if (mode === "scale") {
    img = F.map(v => ({ x: sx * v.x, y: sy * v.y }));
    rule = `(x, y) → (${n2(sx)}x, ${n2(sy)}y)`;
    controls = <Sliders>
      <Slider label="sx" value={sx} min={-2} max={2} step={0.25} onChange={setSx} fmt={n2} />
      <Slider label="sy" value={sy} min={-2} max={2} step={0.25} onChange={setSy} fmt={n2} />
    </Sliders>;
    note = tx(t, "figTr_noteS", "Scaling multiplies each coordinate by its own factor. With sx = sy it is a dilation about the origin, and the image is similar to the original. With different factors the shape is stretched: angles change and a circle would become an ellipse. The area is multiplied by sx · sy. A negative factor also mirrors the shape, which is why engines treat negative scale as a reflection.");
  } else if (mode === "shear") {
    img = F.map(v => ({ x: v.x + k * v.y, y: v.y }));
    rule = `(x, y) → (x + ${n2(k)}y, y)`;
    controls = <Slider label="k" value={k} min={-2} max={2} step={0.1} onChange={setK} fmt={n2} width="w-10" />;
    note = tx(t, "figTr_noteH", "A shear slides each horizontal row sideways in proportion to its height, like pushing the top of a deck of cards. Rows keep their length and their height, so by Cavalieri's principle the area does not change, even though angles do. Shears make italic text and the slanted look of fake 3D.");
  } else {
    const turn = (v: Pt) => rot90(v, 1), move = (v: Pt) => ({ x: v.x - 3, y: v.y });
    img = F.map(v => (order === "rt" ? move(turn(v)) : turn(move(v))));
    const other = F.map(v => (order === "rt" ? turn(move(v)) : move(turn(v))));
    extra = <polygon points={pts(other)} fill="none" stroke={C.muted} strokeWidth={1.2} strokeDasharray="4 3" />;
    rule = order === "rt" ? tx(t, "figTr_rt", "turn 90°, then move (−3, 0)") : tx(t, "figTr_tr", "move (−3, 0), then turn 90°");
    controls = <Row>
      <Btn active={order === "rt"} onClick={() => setOrder("rt")}>{tx(t, "figTr_rtB", "turn, then move")}</Btn>
      <Btn active={order === "tr"} onClick={() => setOrder("tr")}>{tx(t, "figTr_trB", "move, then turn")}</Btn>
    </Row>;
    note = tx(t, "figTr_noteC", "Doing two transformations one after the other is a composition, and the order matters. Turn the F a quarter turn about the origin and then move it 3 to the left, or move it first and then turn: the results (amber, and dashed for the other order) end up in different places, because the turn is about the origin and the move changed how far the shape was from it. In game code this is the difference between spinning an object in place and swinging it around the world's centre.");
  }

  const a0 = shoelace(F), a1 = shoelace(img);
  const wind = (a: number) => (a > 0 ? tx(t, "figTr_ccw", "anticlockwise") : a < 0 ? tx(t, "figTr_cw", "clockwise") : "–");

  return (
    <Figure
      title={tx(t, "figTr_title", "Moving shapes with coordinate rules")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["translate", tx(t, "figTr_mT", "translate")],
        ["reflect", tx(t, "figTr_mR", "reflect")],
        ["rotate", tx(t, "figTr_mO", "rotate")],
        ["scale", tx(t, "figTr_mS", "scale")],
        ["shear", tx(t, "figTr_mH", "shear")],
        ["order", tx(t, "figTr_mC", "order")],
      ] as const} />}
      controls={<>
        {controls}
        <Row>
          <Readout color={C.amber}>{rule}</Readout>
          <Readout>{`${tx(t, "figTr_area", "area")}: ${n2(a0)} → ${n2(a1)}`}</Readout>
          <Readout color={C.pink}>{`${tx(t, "figTr_winding", "winding")}: ${wind(a0)} → ${wind(a1)}`}</Readout>
        </Row>
      </>}
      note={note}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <Grid p={p} step={1} />
        {extra}
        <polygon points={pts(F)} fill={C.sky} fillOpacity={0.25} stroke={C.sky} strokeWidth={1.8} strokeLinejoin="round" />
        <polygon points={pts(img)} fill={C.amber} fillOpacity={0.3} stroke={C.amber} strokeWidth={2} strokeLinejoin="round" />
        <circle cx={p.X(F[0].x)} cy={p.Y(F[0].y)} r={3.5} fill={C.sky} />
        <circle cx={p.X(img[0].x)} cy={p.Y(img[0].y)} r={3.5} fill={C.amber} />
        <T x={p.X(lerp(F[8].x, F[9].x, 0.5))} y={p.Y(F[8].y) - 6} size={10} anchor="middle" color={C.sky} bold>F</T>
      </svg>
    </Figure>
  );
}
