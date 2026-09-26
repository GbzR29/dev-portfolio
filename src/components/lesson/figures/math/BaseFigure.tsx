"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, Sliders, C, T, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// bits    — one byte as eight clickable bits with their place values 128 … 1.
//           The value is the sum of the place values that are on; each nibble
//           is one hex digit. +1 shows carrying, << and >> show ×2 and ÷2.
// convert — decimal to base B by repeated division: the remainders, read from
//           the last one up, are the digits.
// color   — #RRGGBB: three bytes, each as two hex digits, eight bits and the
//           0–1 float a shader sees.

type Mode = "bits" | "convert" | "color";
const W = 560;
const HEX = "0123456789ABCDEF";
const DIGIT_COLS = [C.sky, C.amber, C.green, C.purple, C.pink, C.teal, C.orange, C.red, C.blue, C.sky];
const toBase = (n: number, b: number) => n.toString(b).toUpperCase();
const bin8 = (v: number) => v.toString(2).padStart(8, "0");

export function BaseFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("bits");
  const [byte, setByte] = useState(214);
  const [n, setN] = useState(214);
  const [base, setBase] = useState<"2" | "3" | "8" | "16">("2");
  const [rgb, setRgb] = useState<[number, number, number]>([255, 136, 0]);

  let svg: React.ReactNode, H = 150, controls: React.ReactNode, note: string;

  if (mode === "bits") {
    const cw = 54, gap = 8, ox = (W - 8 * cw - 7 * gap - gap) / 2, y0 = 30;
    const X = (i: number) => ox + i * (cw + gap) + (i >= 4 ? gap : 0);     // extra gap between the nibbles
    const on = (i: number) => ((byte >> (7 - i)) & 1) === 1;
    H = 138;
    svg = <>
      {Array.from({ length: 8 }, (_, i) => {
        const pv = 1 << (7 - i), set = on(i);
        return <g key={i} onClick={() => setByte(byte ^ pv)} style={{ cursor: "pointer" }}>
          <T x={X(i) + cw / 2} y={y0 - 10} size={9} anchor="middle" color={set ? C.fg : C.muted} bold={set}>{String(pv)}</T>
          <rect x={X(i)} y={y0} width={cw} height={40} rx={6} fill={set ? C.sky : "transparent"} fillOpacity={0.3} stroke={set ? C.sky : C.axis} strokeWidth={set ? 2 : 1} />
          <T x={X(i) + cw / 2} y={y0 + 26} size={16} anchor="middle" color={set ? C.fg : C.axis} bold>{set ? "1" : "0"}</T>
          <T x={X(i) + cw / 2} y={y0 + 54} size={8} anchor="middle" color={C.muted}>{`2${"⁷⁶⁵⁴³²¹⁰"[i]}`}</T>
        </g>;
      })}
      {[0, 4].map(s => {
        const x0 = X(s), x1 = X(s + 3) + cw, d = (byte >> (4 - s)) & 15;
        return <g key={s}>
          <path d={`M${x0} ${y0 + 64} v6 H${x1} v-6`} fill="none" stroke={C.amber} />
          <T x={(x0 + x1) / 2} y={y0 + 88} size={12} anchor="middle" color={C.amber} bold>{`${bin8(byte).slice(s, s + 4)} = ${HEX[d]}`}</T>
        </g>;
      })}
    </>;
    const parts = Array.from({ length: 8 }, (_, i) => 1 << (7 - i)).filter(pv => byte & pv);
    controls = <>
      <Row>
        <Btn onClick={() => setByte((byte + 1) & 255)}>+1</Btn>
        <Btn onClick={() => setByte((byte - 1) & 255)}>−1</Btn>
        <Btn onClick={() => setByte((byte << 1) & 255)}>{"<< 1  (×2)"}</Btn>
        <Btn onClick={() => setByte(byte >> 1)}>{">> 1  (÷2)"}</Btn>
        <Btn onClick={() => setByte(0)}>{tx(t, "figBase_clear", "clear")}</Btn>
      </Row>
      <Row>
        <Readout color={C.sky}>{bin8(byte).slice(0, 4)} {bin8(byte).slice(4)}₂</Readout>
        <Readout>= {parts.length ? parts.join(" + ") : "0"} = {byte}</Readout>
        <Readout color={C.amber}>= 0x{toBase(byte, 16).padStart(2, "0")}</Readout>
        <Readout color={C.muted}>= 0{toBase(byte, 8)}₈</Readout>
      </Row>
    </>;
    note = tx(t, "figBase_noteBits", "Click the bits. Each one is worth the power of two above it, and the byte's value is the sum of the ones that are on; with all eight on it is 255 = 2⁸ − 1. Press +1 repeatedly and watch the carry ripple left whenever a 1 turns into 0, exactly like 199 + 1 in decimal; 255 + 1 wraps to 0 because a ninth bit does not exist. Shifting left doubles (the top bit falls off), shifting right halves and drops the ones bit. Each group of four bits is one hex digit.");
  } else if (mode === "convert") {
    const B = +base;
    const rows: [number, number, number][] = [];
    let q = n;
    do { rows.push([q, Math.floor(q / B), q % B]); q = Math.floor(q / B); } while (q > 0);
    const rh = 15, y0 = 18;
    H = Math.max(80, y0 + rows.length * rh + 14);
    const digits = rows.map(r => HEX[r[2]]).reverse();
    const dw = Math.min(26, 200 / digits.length), rx = W - 30 - digits.length * dw;
    svg = <>
      {rows.map(([a, qq, rem], i) => {
        const y = y0 + i * rh + 10, col = DIGIT_COLS[i % DIGIT_COLS.length];
        return <g key={i}>
          <T x={110} y={y} size={10} anchor="end" color={C.fg}>{String(a)}</T>
          <T x={118} y={y} size={10} color={C.muted}>{`÷ ${B} =`}</T>
          <T x={200} y={y} size={10} anchor="end" color={C.fg}>{String(qq)}</T>
          <T x={212} y={y} size={10} color={C.muted}>{tx(t, "figBase_rem", "remainder")}</T>
          <T x={290} y={y} size={11} anchor="middle" color={col} bold>{`${rem}${B === 16 && rem > 9 ? ` = ${HEX[rem]}` : ""}`}</T>
        </g>;
      })}
      {rows.length > 1 && <>
        <line x1={310} x2={310} y1={y0 + (rows.length - 1) * rh + 8} y2={y0 + 6} stroke={C.axis} strokeWidth={1.4} />
        <path d={`M306 ${y0 + 12} L310 ${y0 + 4} L314 ${y0 + 12}`} fill="none" stroke={C.axis} strokeWidth={1.4} />
      </>}
      <T x={rx - 8} y={H / 2 + 5} size={12} anchor="end" color={C.muted}>=</T>
      {digits.map((d, i) => <T key={i} x={rx + i * dw + dw / 2} y={H / 2 + 6} size={Math.min(18, dw * 0.9)} anchor="middle"
        color={DIGIT_COLS[(digits.length - 1 - i) % DIGIT_COLS.length]} bold>{d}</T>)}
      <T x={W - 26} y={H / 2 + 12} size={12} color={C.muted}>{base === "2" ? "₂" : base === "3" ? "₃" : base === "8" ? "₈" : "₁₆"}</T>
    </>;
    controls = <>
      <Row>
        <Slider label="n" value={n} min={0} max={1000} step={1} onChange={setN} fmt={v => String(v)} width="w-40" />
        <Choice value={base} onChange={setBase} options={[["2", tx(t, "figBase_base", "base") + " 2"], ["3", "3"], ["8", "8"], ["16", "16"]] as const} />
      </Row>
      <Row>
        <Readout color={C.green}>{n} = {toBase(n, B)}</Readout>
        <Readout>{digits.map((d, i) => `${HEX.indexOf(d)}·${B}${"⁰¹²³⁴⁵⁶⁷⁸⁹"[digits.length - 1 - i]}`).join(" + ")} = {n}</Readout>
      </Row>
    </>;
    note = tx(t, "figBase_noteConvert", "Pick a number and a base. Each row divides by the base and keeps the remainder, always between 0 and base − 1, so it is a valid digit. The first remainder is the last digit: it is what is left after taking out every full group of B, the ones. The next row does the same with the groups themselves, and so on until nothing is left. Read the remainders upward, as the arrow shows; the readout multiplies each digit by its place value to check the result.");
  } else {
    const [R, G, Bc] = rgb, hex = "#" + rgb.map(v => v.toString(16).toUpperCase().padStart(2, "0")).join("");
    const names = [tx(t, "figBase_red", "red"), tx(t, "figBase_green", "green"), tx(t, "figBase_blue", "blue")];
    const cols = [C.red, C.green, C.blue];
    H = 130;
    svg = <>
      <rect x={24} y={14} width={130} height={100} rx={8} fill={`rgb(${R},${G},${Bc})`} stroke={C.axis} />
      <T x={89} y={126} size={11} anchor="middle" color={C.fg} bold>{hex}</T>
      {rgb.map((v, i) => {
        const x0 = 190 + i * 120;
        return <g key={i}>
          <T x={x0} y={24} size={9} color={cols[i]} bold>{names[i]}</T>
          <T x={x0} y={48} size={16} color={C.fg} bold>{v.toString(16).toUpperCase().padStart(2, "0")}</T>
          <T x={x0 + 34} y={48} size={10} color={C.muted}>{`= ${v}`}</T>
          <T x={x0} y={70} size={10} color={C.sky}>{`${bin8(v).slice(0, 4)} ${bin8(v).slice(4)}`}</T>
          <T x={x0} y={92} size={10} color={C.amber}>{`${v}/255 = ${f2(v / 255, 3)}`}</T>
          <rect x={x0} y={102} width={100} height={6} rx={3} fill={C.grid} />
          <rect x={x0} y={102} width={(v / 255) * 100} height={6} rx={3} fill={cols[i]} />
        </g>;
      })}
    </>;
    const set = (i: number) => (v: number) => setRgb(rgb.map((c, j) => (j === i ? v : c)) as [number, number, number]);
    controls = <>
      <Sliders>
        {rgb.map((v, i) => <Slider key={i} label={names[i]} value={v} min={0} max={255} step={1} onChange={set(i)} fmt={x => String(x)} />)}
      </Sliders>
      <Row>
        <Readout>0x{hex.slice(1)} = {R}·65536 + {G}·256 + {Bc} = {(R << 16) + (G << 8) + Bc}</Readout>
        <Readout color={C.amber}>vec3({f2(R / 255, 3)}, {f2(G / 255, 3)}, {f2(Bc / 255, 3)})</Readout>
      </Row>
    </>;
    note = tx(t, "figBase_noteColor", "A web colour is three bytes. Each byte is written as two hex digits, the first counting sixteens and the second ones, so FF = 15 × 16 + 15 = 255 and 88 = 8 × 16 + 8 = 136. The binary row shows why two hex digits are exactly one byte: one digit per nibble. Packed into one integer, red is worth 256² because it sits two bytes up. Shaders divide each byte by 255 to get a channel between 0 and 1.");
  }

  return (
    <Figure
      title={tx(t, "figBase_title", "Bits, bases and hex")}
      head={<Choice value={mode} onChange={setMode} options={[["bits", tx(t, "figBase_bits", "bits")], ["convert", tx(t, "figBase_convert", "convert")], ["color", tx(t, "figBase_color", "hex colour")]] as const} />}
      controls={controls}
      note={note}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
