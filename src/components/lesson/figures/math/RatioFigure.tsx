"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, Handle, useDrag, nearest, clamp, f2 } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// change — two percentage changes in a row multiply: ×(1 + p₁) then ×(1 + p₂).
//          The naive sum p₁ + p₂ is wrong, most visibly for +50 % then −50 %.
// remap  — a value x in [a, b] becomes the fraction t = (x − a)/(b − a) of the
//          way along (inverse lerp), and that fraction is placed in [c, d]
//          (lerp). Drag x; outside [a, b], t leaves [0, 1] unless clamped.
// aspect — fitting a picture of one aspect ratio into a screen of another:
//          scale by the smaller of the two ratios, the rest becomes bars.
// The lab walks through all three with goals and quick questions.

type Mode = "change" | "remap" | "aspect";
const ASPECTS = [["16:9", 16, 9], ["4:3", 4, 3], ["21:9", 21, 9], ["1:1", 1, 1], ["9:16", 9, 16]] as const;
type Aspect = (typeof ASPECTS)[number][0];
const pct = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${f2(Math.abs(v * 100), 1)} %`;
const W = 560;
const L0 = 70, L1 = 490;                            // remap: pixel span of both lines

type State = {
  mode: Mode; p1: number; p2: number; a: number; b: number; c: number; d: number; x: number;
  clampT: "on" | "off"; content: Aspect; screen: Aspect;
};

/** The remap numbers: t before and after clamping, and y. */
function remap(s: State) {
  const tRaw = s.b === s.a ? 0 : (s.x - s.a) / (s.b - s.a);
  const tt = s.clampT === "on" ? clamp(tRaw, 0, 1) : tRaw;
  return { tRaw, tt, y: s.c + tt * (s.d - s.c) };
}

// ── The drawing (owns its drag: it is mounted twice while the lab is open) ────

function RatioStage({ s, setX, t }: { s: State; setX: (v: number) => void; t?: TrackTranslations }) {
  const { mode, p1, p2, a, b, c, d, x } = s;
  const lo = Math.min(a, b) - 4, hi = Math.max(a, b) + 4;
  const PX = (v: number) => L0 + ((v - lo) / (hi - lo)) * (L1 - L0);
  const { tRaw, tt, y } = remap(s);
  const drag = useDrag<"x">(q => (mode === "remap" ? nearest(q, [["x", { x: PX(x), y: 40 }]], 22) : null),
    (_, q) => setX(clamp(Math.round((lo + ((q.x - L0) / (L1 - L0)) * (hi - lo)) * 10) / 10, lo, hi)));

  let svg: React.ReactNode, H = 150;
  if (mode === "change") {
    const v0 = 100, v1 = v0 * (1 + p1), v2 = v1 * (1 + p2), naive = v0 * (1 + p1 + p2);
    const top = Math.max(v0, v1, v2, naive, 1), BW = 400, bx = 110;
    const bar = (yy: number, v: number, col: string, lbl: string) => <g>
      <rect x={bx} y={yy} width={(v / top) * BW} height={20} rx={3} fill={col} fillOpacity={0.75} />
      <T x={bx - 8} y={yy + 14} size={9.5} anchor="end" color={col} bold>{lbl}</T>
      <T x={bx + (v / top) * BW + 6} y={yy + 14} size={10} color={C.fg} bold>{f2(v, 1)}</T>
    </g>;
    svg = <>
      {bar(14, v0, C.sky, tx(t, "figRat_start", "start"))}
      {bar(44, v1, C.amber, pct(p1))}
      {bar(74, v2, C.green, `${pct(p1)}, ${pct(p2)}`)}
      <rect x={bx} y={112} width={(Math.max(0, naive) / top) * BW} height={20} rx={3} fill="none" stroke={C.red} strokeDasharray="4 3" strokeWidth={1.5} />
      <T x={bx - 8} y={126} size={9.5} anchor="end" color={C.red}>{tx(t, "figRat_naive", "naive sum")}</T>
      <T x={bx + (Math.max(0, naive) / top) * BW + 6} y={126} size={10} color={C.red}>{f2(naive, 1)}</T>
    </>;
  } else if (mode === "remap") {
    const ylo = Math.min(c, d) - 1, yhi = Math.max(c, d) + 1;
    const QX = (v: number) => L0 + ((v - ylo) / (yhi - ylo)) * (L1 - L0);
    H = 170;
    svg = <>
      <line x1={L0} x2={L1} y1={40} y2={40} stroke={C.axis} />
      <line x1={PX(a)} x2={PX(b)} y1={40} y2={40} stroke={C.sky} strokeWidth={4} opacity={0.5} />
      <T x={PX(a)} y={60} size={9} anchor="middle" color={C.sky}>{`a = ${f2(a, 1)}`}</T>
      <T x={PX(b)} y={60} size={9} anchor="middle" color={C.sky}>{`b = ${f2(b, 1)}`}</T>
      <T x={L0 - 8} y={44} size={9.5} anchor="end" color={C.sky}>x</T>
      <Handle x={PX(x)} y={40} color={C.sky} active={drag.dragging === "x"} />

      <rect x={L0} y={80} width={L1 - L0} height={14} rx={3} fill="none" stroke={C.axis} />
      <rect x={L0} y={80} width={clamp(tt, 0, 1) * (L1 - L0)} height={14} rx={3} fill={tRaw < 0 || tRaw > 1 ? C.red : C.amber} fillOpacity={0.7} />
      <T x={L0 - 8} y={91} size={9.5} anchor="end" color={C.amber}>t</T>
      <T x={L1 + 6} y={91} size={9.5} color={C.amber}>{`${f2(tt * 100, 0)} %`}</T>

      <line x1={L0} x2={L1} y1={132} y2={132} stroke={C.axis} />
      <line x1={QX(c)} x2={QX(d)} y1={132} y2={132} stroke={C.green} strokeWidth={4} opacity={0.5} />
      <T x={QX(c)} y={152} size={9} anchor="middle" color={C.green}>{`c = ${f2(c, 1)}`}</T>
      <T x={QX(d)} y={152} size={9} anchor="middle" color={C.green}>{`d = ${f2(d, 1)}`}</T>
      <circle cx={QX(y)} cy={132} r={6} fill={C.green} />
      <T x={L0 - 8} y={136} size={9.5} anchor="end" color={C.green}>y</T>
    </>;
  } else {
    const [, cw, ch] = ASPECTS.find(e => e[0] === s.content)!;
    const [, sw, sh] = ASPECTS.find(e => e[0] === s.screen)!;
    const box = 150, sS = box / Math.max(sw, sh);          // draw the screen inside a 150×150 box
    const SW = sw * sS, SH = sh * sS, sc = Math.min(SW / cw, SH / ch), CW = cw * sc, CH = ch * sc;
    const ox = W / 2 - SW / 2, oy = 12;
    H = box + 24;
    svg = <>
      <rect x={ox} y={oy} width={SW} height={SH} fill="#000" stroke={C.fg} strokeWidth={1.4} />
      <rect x={ox + (SW - CW) / 2} y={oy + (SH - CH) / 2} width={CW} height={CH} fill={C.sky} fillOpacity={0.55} stroke={C.sky} />
      <T x={W / 2} y={oy + SH / 2 + 4} size={10} anchor="middle" color={C.fg} bold>{s.content}</T>
      <T x={ox - 8} y={oy + 12} size={9} anchor="end">{`${tx(t, "figRat_screen", "screen")} ${s.screen}`}</T>
    </>;
  }

  return <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>;
}

// ── The figure and its lab ────────────────────────────────────────────────────

const START: State = { mode: "change", p1: 0.5, p2: -0.5, a: 2, b: 10, c: 1, d: 0, x: 4, clampT: "on", content: "16:9", screen: "4:3" };

export function RatioFigure({ t }: { t?: TrackTranslations }) {
  const [s, setS] = useState<State>(START);
  const lab = useLab("math-ratios");
  const up = (p: Partial<State>) => setS(o => ({ ...o, ...p }));
  const { mode, p1, p2, a, b, c, d, x, clampT, content, screen } = s;
  const { tRaw, y } = remap(s);
  const factor = (1 + p1) * (1 + p2);

  const [, cw, ch] = ASPECTS.find(e => e[0] === content)!;
  const [, sw, sh] = ASPECTS.find(e => e[0] === screen)!;
  const wide = cw / ch > sw / sh;

  const stage = <RatioStage s={s} setX={v => up({ x: v })} t={t} />;
  const modeChoice = <Choice value={mode} onChange={(m: Mode) => up({ mode: m })} options={[["change", tx(t, "figRat_change", "% changes")], ["remap", tx(t, "figRat_remap", "remap")], ["aspect", tx(t, "figRat_aspect", "aspect ratio")]] as const} />;
  const controls = mode === "change" ? <>
    <Sliders>
      <Slider label={tx(t, "figRat_p1", "first change")} value={p1} min={-0.9} max={1} step={0.05} onChange={v => up({ p1: v })} fmt={pct} width="w-28" />
      <Slider label={tx(t, "figRat_p2", "second change")} value={p2} min={-0.9} max={1} step={0.05} onChange={v => up({ p2: v })} fmt={pct} width="w-28" />
    </Sliders>
    <Row>
      <Readout color={C.green}>100 × {f2(1 + p1)} × {f2(1 + p2)} = {f2(100 * factor, 1)}</Readout>
      <Readout color={C.green}>{tx(t, "figRat_total", "total")}: {pct(factor - 1)}</Readout>
      <Readout color={C.red}>{tx(t, "figRat_notSum", "not")} {pct(p1 + p2)}</Readout>
    </Row>
  </> : mode === "remap" ? <>
    <Sliders>
      <Slider label="a" value={a} min={-10} max={20} step={1} onChange={v => up({ a: v })} fmt={v => f2(v, 0)} />
      <Slider label="b" value={b} min={-10} max={20} step={1} onChange={v => up({ b: v })} fmt={v => f2(v, 0)} />
      <Slider label="c" value={c} min={-5} max={5} step={0.5} onChange={v => up({ c: v })} fmt={v => f2(v, 1)} />
      <Slider label="d" value={d} min={-5} max={5} step={0.5} onChange={v => up({ d: v })} fmt={v => f2(v, 1)} />
    </Sliders>
    <Row>
      <Choice value={clampT} onChange={(v: "on" | "off") => up({ clampT: v })} options={[["on", tx(t, "figRat_clamp", "clamp t to [0, 1]")], ["off", tx(t, "figRat_noClamp", "no clamp")]] as const} />
      <Readout color={C.amber}>t = (x − a)/(b − a) = ({f2(x, 1)} − {f2(a, 0)})/({f2(b, 0)} − {f2(a, 0)}) = {b === a ? "÷0" : f2(tRaw)}</Readout>
      <Readout color={C.green}>y = c + t(d − c) = {f2(y)}</Readout>
    </Row>
  </> : <>
    <Row><span className="text-[10px] font-mono text-[var(--text-muted)] w-16">{tx(t, "figRat_picture", "picture")}</span><Choice value={content} onChange={(v: Aspect) => up({ content: v })} options={ASPECTS.map(e => [e[0], e[0]] as const)} /></Row>
    <Row><span className="text-[10px] font-mono text-[var(--text-muted)] w-16">{tx(t, "figRat_screen", "screen")}</span><Choice value={screen} onChange={(v: Aspect) => up({ screen: v })} options={ASPECTS.map(e => [e[0], e[0]] as const)} /></Row>
    <Row>
      <Readout>{content} = {f2(cw / ch, 3)}, {screen} = {f2(sw / sh, 3)}</Readout>
      <Readout color={C.amber}>{cw / ch === sw / sh ? tx(t, "figRat_exact", "same ratio: fills the screen")
        : wide ? tx(t, "figRat_letter", "picture is wider: bars top and bottom (letterbox)")
          : tx(t, "figRat_pillar", "picture is taller: bars left and right (pillarbox)")}</Readout>
    </Row>
  </>;

  // ── Lab ──
  const near = (u: number, v: number) => Math.abs(u - v) < 1e-9;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figRatL1_t", "+50 %, then −50 %"),
      body: <>
        <p>{tx(t, "figRatL1_b1", "Start with 100. Add 50 %: 150. Now take 50 % off: 75, not 100. The second percentage is taken of 150, a bigger amount.")}</p>
        <p>{tx(t, "figRatL1_b2", "Each change multiplies: ×1.5 then ×0.5 is ×0.75. Make the first change +25 % and find the second change that brings you back to exactly 100.")}</p>
      </>,
      goal: { text: tx(t, "figRatL1_g", "First change +25 %, final value exactly 100."), done: mode === "change" && near(p1, 0.25) && near(factor, 1) },
      hint: tx(t, "figRatL1_h", "Undoing ×1.25 needs ×1/1.25 = ×0.8."),
      setup: () => setS({ ...START }),
    },
    {
      title: tx(t, "figRatL2_t", "Quick check"),
      body: <p>{tx(t, "figRatL2_b", "Multiply the factors.")}</p>,
      quiz: {
        q: tx(t, "figRatL2_q", "A price of 100 goes up 10 % and then down 10 %. What is it now?"),
        options: ["99", "100", "101", "90"],
        answer: 0,
        why: tx(t, "figRatL2_w", "100 × 1.1 × 0.9 = 100 × 0.99 = 99. The 10 % off is taken of 110, so it removes 11, more than the 10 that was added."),
      },
    },
    {
      title: tx(t, "figRatL3_t", "Does the order matter?"),
      body: <p>{tx(t, "figRatL3_b", "Swap the two changes: −50 % first, then +50 %. Before you do, guess the result.")}</p>,
      goal: { text: tx(t, "figRatL3_g", "First change −50 %, second change +50 %."), done: mode === "change" && near(p1, -0.5) && near(p2, 0.5) },
      setup: () => setS({ ...START }),
    },
    {
      title: tx(t, "figRatL4_t", "Fraction of the way"),
      body: <>
        <p>{tx(t, "figRatL4_b1", "A test is scored from 0 to 20, and the mark must go from 0 to 10. The top line is the score x, the amber bar t is the fraction of the way from a to b, and the bottom line puts the same fraction of the way from c to d.")}</p>
        <p>{tx(t, "figRatL4_b2", "Drag x to the score that gets a mark of 2.5.")}</p>
      </>,
      goal: { text: tx(t, "figRatL4_g", "Make y = 2.5."), done: mode === "remap" && a === 0 && b === 20 && near(y, 2.5) },
      hint: tx(t, "figRatL4_h", "2.5 is a quarter of the way from 0 to 10, so x must be a quarter of the way from 0 to 20."),
      setup: () => setS({ ...START, mode: "remap", a: 0, b: 20, c: 0, d: 10, x: 14 }),
    },
    {
      title: tx(t, "figRatL5_t", "Ranges that point the other way"),
      body: <p>{tx(t, "figRatL5_b", "Make c bigger than d. Now drag x to the right: what does y do?")}</p>,
      goal: { text: tx(t, "figRatL5_g", "Set c above d."), done: mode === "remap" && c > d },
      setup: () => setS({ ...START, mode: "remap", a: 0, b: 20, c: 0, d: 5, x: 5 }),
    },
    {
      title: tx(t, "figRatL6_t", "Leaving the range"),
      body: <p>{tx(t, "figRatL6_b", "Turn clamping off and drag x past b. The formula keeps working, but t goes beyond 100 %: that is extrapolation.")}</p>,
      goal: { text: tx(t, "figRatL6_g", "No clamp, and t above 1."), done: mode === "remap" && clampT === "off" && tRaw > 1 },
      hint: tx(t, "figRatL6_h", "Choose \"no clamp\", then drag x to the right of b."),
      setup: () => setS({ ...START, mode: "remap", a: 0, b: 20, c: 0, d: 5, x: 10 }),
    },
    {
      title: tx(t, "figRatL7_t", "Fitting a picture"),
      body: <>
        <p>{tx(t, "figRatL7_b1", "A 16:9 picture on a 4:3 screen: the picture is wider, so it is scaled until its width fits, and black bars fill the top and bottom.")}</p>
        <p>{tx(t, "figRatL7_b2", "Choose a picture and a screen that give bars on the left and right instead.")}</p>
      </>,
      goal: { text: tx(t, "figRatL7_g", "Bars on the left and right (pillarbox)."), done: mode === "aspect" && cw / ch < sw / sh },
      hint: tx(t, "figRatL7_h", "The picture must be narrower than the screen: try 4:3 on 16:9."),
      setup: () => setS({ ...START, mode: "aspect" }),
    },
    {
      title: tx(t, "figRatL8_t", "Quick check"),
      body: <p>{tx(t, "figRatL8_b", "Two discounts in a row.")}</p>,
      quiz: {
        q: tx(t, "figRatL8_q", "20 % off, and then a further 30 % off the reduced price. What is the total discount?"),
        options: ["44 %", "50 %", "56 %", "6 %"],
        answer: 0,
        why: tx(t, "figRatL8_w", "The factors multiply: 0.8 × 0.7 = 0.56, so you pay 56 % and the discount is 44 %."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "loss", tone: "warn", when: mode === "change" && p1 !== 0 && near(p1, -p2),
      title: tx(t, "figRatI1_t", "Up and down by the same percentage loses"),
      body: fill(tx(t, "figRatI1_b", "(1 + p)(1 − p) = 1 − p², so ±{p} always ends below the start: {v} instead of 100."), { p: pct(Math.abs(p1)).replace("+", ""), v: f2(100 * factor, 1) }),
    },
    {
      id: "order", tone: "info", when: mode === "change" && near(p1, -0.5) && near(p2, 0.5),
      title: tx(t, "figRatI2_t", "The order does not matter"),
      body: tx(t, "figRatI2_b", "×0.5 then ×1.5 is the same product as ×1.5 then ×0.5: 0.75 either way. Multiplication is commutative, and percentage changes are multiplications."),
    },
    {
      id: "flip", tone: "info", when: mode === "remap" && c > d,
      title: tx(t, "figRatI3_t", "A reversed range"),
      body: tx(t, "figRatI3_b", "d − c is negative, so as t grows, y moves down. The fraction of the way is the same; only the direction of the output range changed."),
    },
    {
      id: "extra", tone: "warn", when: mode === "remap" && clampT === "off" && (tRaw < 0 || tRaw > 1),
      title: tx(t, "figRatI4_t", "Outside the range: extrapolation"),
      body: fill(tx(t, "figRatI4_b", "t = {t}: x lies outside a…b, so y lands outside c…d too. That may be what you want (a temperature below freezing) or a mistake (a mark above 10)."), { t: f2(tRaw) }),
    },
    {
      id: "clamped", tone: "info", when: mode === "remap" && clampT === "on" && (tRaw < 0 || tRaw > 1),
      title: tx(t, "figRatI5_t", "Clamped"),
      body: tx(t, "figRatI5_b", "x is outside a…b, but t is held between 0 and 1, so y stops at the end of its range."),
    },
    {
      id: "zero", tone: "warn", when: mode === "remap" && a === b,
      title: tx(t, "figRatI6_t", "a = b: no range"),
      body: tx(t, "figRatI6_b", "b − a = 0, and t would divide by zero. A range needs two different ends."),
    },
    {
      id: "fits", tone: "ok", when: mode === "aspect" && cw / ch === sw / sh,
      title: tx(t, "figRatI7_t", "Same ratio, no bars"),
      body: tx(t, "figRatI7_b", "Width and height scale by the same factor and both reach the edges."),
    },
  ];

  const title = tx(t, "figRat_title", "Percentages, remapping and aspect ratios");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={mode === "change"
          ? tx(t, "figRat_noteChange", "A change of p percent multiplies by (1 + p), with p written as a decimal: +50 % is ×1.5, −50 % is ×0.5. Two changes in a row multiply, so +50 % then −50 % is ×0.75, a 25 % loss, not 0 %. The second percentage is taken of a different, already changed amount. The dashed red bar is what adding the percentages would wrongly predict.")
          : mode === "remap"
            ? tx(t, "figRat_noteRemap", "Drag x. The first step asks what fraction of the way from a to b x is: t = (x − a)/(b − a), 0 at a, 1 at b, 50 % halfway. The second step walks the same fraction of the way from c to d. Here the default maps 2 to 10 onto 1 down to 0: the ranges can point in opposite directions, so as x grows, y shrinks. Turn clamping off and drag past a or b: t leaves 0–100 % and y lands outside the range from c to d, which is extrapolation.")
            : tx(t, "figRat_noteAspect", "An aspect ratio is width : height. To show a picture on a screen without stretching it, scale both sides by the same factor, the largest one that still fits: s = min(screen width / picture width, screen height / picture height). Whichever side limits the scale touches the screen edges; the other leaves black bars. Scaling width and height by different factors would distort circles into ellipses.")}
      >
        {stage}
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={stage}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figRatR1", "A change of p multiplies by (1 + p); changes in a row multiply, they do not add."),
          tx(t, "figRatR2", "Undoing a change needs the reciprocal factor: −20 % is undone by +25 %."),
          tx(t, "figRatR3", "Remapping is two steps: t = (x − a)/(b − a), then y = c + t(d − c)."),
          tx(t, "figRatR4", "To fit a picture without stretching, scale both sides by the same factor; the leftover becomes bars."),
        ]}
      />
    </>
  );
}
