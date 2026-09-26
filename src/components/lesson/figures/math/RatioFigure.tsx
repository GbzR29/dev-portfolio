"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, Handle, useDrag, nearest, clamp, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// change — two percentage changes in a row multiply: ×(1 + p₁) then ×(1 + p₂).
//          The naive sum p₁ + p₂ is wrong, most visibly for +50 % then −50 %.
// remap  — a value x in [a, b] becomes the fraction t = (x − a)/(b − a) of the
//          way along (inverse lerp), and that fraction is placed in [c, d]
//          (lerp). Drag x; outside [a, b], t leaves [0, 1] unless clamped.
// aspect — fitting a picture of one aspect ratio into a screen of another:
//          scale by the smaller of the two ratios, the rest becomes bars.

type Mode = "change" | "remap" | "aspect";
const ASPECTS = [["16:9", 16, 9], ["4:3", 4, 3], ["21:9", 21, 9], ["1:1", 1, 1], ["9:16", 9, 16]] as const;
type Aspect = (typeof ASPECTS)[number][0];
const pct = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${f2(Math.abs(v * 100), 1)} %`;

export function RatioFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("change");
  const [p1, setP1] = useState(0.5), [p2, setP2] = useState(-0.5);
  const [a, setA] = useState(2), [b, setB] = useState(10);
  const [c, setC] = useState(1), [d, setD] = useState(0);
  const [x, setX] = useState(4);
  const [clampT, setClampT] = useState<"on" | "off">("on");
  const [content, setContent] = useState<Aspect>("16:9");
  const [screen, setScreen] = useState<Aspect>("4:3");
  const W = 560;

  // remap geometry: both lines span the same pixels so the fraction lines up
  const L0 = 70, L1 = 490;                        // pixel span of both lines
  const lo = Math.min(a, b) - 4, hi = Math.max(a, b) + 4;
  const PX = (v: number) => L0 + ((v - lo) / (hi - lo)) * (L1 - L0);
  const tRaw = b === a ? 0 : (x - a) / (b - a);
  const tt = clampT === "on" ? clamp(tRaw, 0, 1) : tRaw;
  const y = c + tt * (d - c);
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
    H = 150;
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
    const [, cw, ch] = ASPECTS.find(e => e[0] === content)!;
    const [, sw, sh] = ASPECTS.find(e => e[0] === screen)!;
    const box = 150, sS = box / Math.max(sw, sh);          // draw the screen inside a 150×150 box
    const SW = sw * sS, SH = sh * sS, s = Math.min(SW / cw, SH / ch), CW = cw * s, CH = ch * s;
    const ox = W / 2 - SW / 2, oy = 12;
    H = box + 24;
    svg = <>
      <rect x={ox} y={oy} width={SW} height={SH} fill="#000" stroke={C.fg} strokeWidth={1.4} />
      <rect x={ox + (SW - CW) / 2} y={oy + (SH - CH) / 2} width={CW} height={CH} fill={C.sky} fillOpacity={0.55} stroke={C.sky} />
      <T x={W / 2} y={oy + SH / 2 + 4} size={10} anchor="middle" color={C.fg} bold>{content}</T>
      <T x={ox - 8} y={oy + 12} size={9} anchor="end">{`${tx(t, "figRat_screen", "screen")} ${screen}`}</T>
    </>;
  }

  const [, cw, ch] = ASPECTS.find(e => e[0] === content)!;
  const [, sw, sh] = ASPECTS.find(e => e[0] === screen)!;
  const wide = cw / ch > sw / sh;

  return (
    <Figure
      title={tx(t, "figRat_title", "Percentages, remapping and aspect ratios")}
      head={<Choice value={mode} onChange={setMode} options={[["change", tx(t, "figRat_change", "% changes")], ["remap", tx(t, "figRat_remap", "remap")], ["aspect", tx(t, "figRat_aspect", "aspect ratio")]] as const} />}
      controls={mode === "change" ? <>
        <Sliders>
          <Slider label={tx(t, "figRat_p1", "first change")} value={p1} min={-0.9} max={1} step={0.05} onChange={setP1} fmt={pct} width="w-28" />
          <Slider label={tx(t, "figRat_p2", "second change")} value={p2} min={-0.9} max={1} step={0.05} onChange={setP2} fmt={pct} width="w-28" />
        </Sliders>
        <Row>
          <Readout color={C.green}>100 × {f2(1 + p1)} × {f2(1 + p2)} = {f2(100 * (1 + p1) * (1 + p2), 1)}</Readout>
          <Readout color={C.green}>{tx(t, "figRat_total", "total")}: {pct((1 + p1) * (1 + p2) - 1)}</Readout>
          <Readout color={C.red}>{tx(t, "figRat_notSum", "not")} {pct(p1 + p2)}</Readout>
        </Row>
      </> : mode === "remap" ? <>
        <Sliders>
          <Slider label="a" value={a} min={-10} max={20} step={1} onChange={setA} fmt={v => f2(v, 0)} />
          <Slider label="b" value={b} min={-10} max={20} step={1} onChange={setB} fmt={v => f2(v, 0)} />
          <Slider label="c" value={c} min={-5} max={5} step={0.5} onChange={setC} fmt={v => f2(v, 1)} />
          <Slider label="d" value={d} min={-5} max={5} step={0.5} onChange={setD} fmt={v => f2(v, 1)} />
        </Sliders>
        <Row>
          <Choice value={clampT} onChange={setClampT} options={[["on", tx(t, "figRat_clamp", "clamp t to [0, 1]")], ["off", tx(t, "figRat_noClamp", "no clamp")]] as const} />
          <Readout color={C.amber}>t = (x − a)/(b − a) = ({f2(x, 1)} − {f2(a, 0)})/({f2(b, 0)} − {f2(a, 0)}) = {b === a ? "÷0" : f2(tRaw)}</Readout>
          <Readout color={C.green}>y = c + t(d − c) = {f2(y)}</Readout>
        </Row>
      </> : <>
        <Row><span className="text-[10px] font-mono text-[var(--text-muted)] w-16">{tx(t, "figRat_picture", "picture")}</span><Choice value={content} onChange={setContent} options={ASPECTS.map(e => [e[0], e[0]] as const)} /></Row>
        <Row><span className="text-[10px] font-mono text-[var(--text-muted)] w-16">{tx(t, "figRat_screen", "screen")}</span><Choice value={screen} onChange={setScreen} options={ASPECTS.map(e => [e[0], e[0]] as const)} /></Row>
        <Row>
          <Readout>{content} = {f2(cw / ch, 3)}, {screen} = {f2(sw / sh, 3)}</Readout>
          <Readout color={C.amber}>{cw / ch === sw / sh ? tx(t, "figRat_exact", "same ratio: fills the screen")
            : wide ? tx(t, "figRat_letter", "picture is wider: bars top and bottom (letterbox)")
              : tx(t, "figRat_pillar", "picture is taller: bars left and right (pillarbox)")}</Readout>
        </Row>
      </>}
      note={mode === "change"
        ? tx(t, "figRat_noteChange", "A change of p percent multiplies by (1 + p), with p written as a decimal: +50 % is ×1.5, −50 % is ×0.5. Two changes in a row multiply, so +50 % then −50 % is ×0.75, a 25 % loss, not 0 %. The second percentage is taken of a different, already changed amount. The dashed red bar is what adding the percentages would wrongly predict.")
        : mode === "remap"
          ? tx(t, "figRat_noteRemap", "Drag x. The first step asks what fraction of the way from a to b x is: t = (x − a)/(b − a), 0 at a, 1 at b, 50 % halfway. The second step walks the same fraction of the way from c to d. Here the default maps 2 to 10 onto 1 down to 0: the ranges can point in opposite directions, so as x grows, y shrinks. Turn clamping off and drag past a or b: t leaves 0–100 % and y lands outside the range from c to d, which is extrapolation.")
          : tx(t, "figRat_noteAspect", "An aspect ratio is width : height. To show a picture on a screen without stretching it, scale both sides by the same factor, the largest one that still fits: s = min(screen width / picture width, screen height / picture height). Whichever side limits the scale touches the screen edges; the other leaves black bars. Scaling width and height by different factors would distort circles into ellipses.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
