"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, Sliders, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// bits    — one byte as eight clickable bits with their place values 128 … 1.
//           The value is the sum of the place values that are on; each nibble
//           is one hex digit. +1 shows carrying; ×2 appends a 0, ÷2 drops the last digit.
// convert — decimal to base B by repeated division: the remainders, read from
//           the last one up, are the digits.
// add     — column addition of two binary numbers, with the carries shown
//           above the columns they go into.

type Mode = "bits" | "convert" | "add";
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
  const [addA, setAddA] = useState(107), [addB, setAddB] = useState(54);

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
        <Btn onClick={() => setByte((byte << 1) & 255)}>{tx(t, "figBase_times2", "×2 (append 0)")}</Btn>
        <Btn onClick={() => setByte(byte >> 1)}>{tx(t, "figBase_div2", "÷2 (drop last digit)")}</Btn>
        <Btn onClick={() => setByte(0)}>{tx(t, "figBase_clear", "clear")}</Btn>
      </Row>
      <Row>
        <Readout color={C.sky}>{bin8(byte).slice(0, 4)} {bin8(byte).slice(4)}₂</Readout>
        <Readout>= {parts.length ? parts.join(" + ") : "0"} = {byte}</Readout>
        <Readout color={C.amber}>= 0x{toBase(byte, 16).padStart(2, "0")}</Readout>
        <Readout color={C.muted}>= {toBase(byte, 8)}₈</Readout>
      </Row>
    </>;
    note = tx(t, "figBase_noteBits", "Click the bits. Each one is worth the power of two above it, and the byte's value is the sum of the ones that are on; with all eight on it is 255 = 2⁸ − 1. Press +1 repeatedly and watch the carry ripple left whenever a 1 turns into 0, exactly like 199 + 1 in decimal. The display has only eight places, so 255 + 1 rolls over to 0, like a car's odometer going from 999 to 000. ×2 appends a 0 on the right (the top digit falls off the display); ÷2 drops the last digit, which is the remainder. Each group of four bits is one hex digit.");
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
    // Column addition: cols[p] holds bit p of a, of b, the carry into p and the sum bit
    const sum = addA + addB, cw = 42, ox = 118, NB = 9;
    const X = (p: number) => ox + (NB - 1 - p) * cw;             // bit 8 on the left, bit 0 on the right
    const bit = (v: number, p: number) => (v >> p) & 1;
    const carry: number[] = [0];
    for (let p = 0; p < NB; p++) carry.push((bit(addA, p) + bit(addB, p) + carry[p]) >> 1);
    const rows: [string, number, number][] = [[tx(t, "figBase_carry", "carry"), 24, 0], ["a", 52, 1], ["+ b", 78, 2], ["=", 112, 3]];
    H = 146;
    svg = <>
      {rows.map(([lbl, y, k]) => <T key={k} x={ox - 18} y={y} size={k === 0 ? 9 : 11} anchor="end" color={k === 0 ? C.amber : k === 3 ? C.green : C.sky} bold={k !== 0}>{lbl}</T>)}
      <line x1={ox - 12} x2={X(0) + cw - 8} y1={90} y2={90} stroke={C.axis} strokeWidth={1.4} />
      {Array.from({ length: NB }, (_, p) => {
        const x = X(p) + cw / 2, lead = (v: number) => v < 1 << p;   // digit left of the number's first 1
        return <g key={p}>
          {carry[p] === 1 && <>
            <rect x={x - 9} y={12} width={18} height={16} rx={4} fill={C.amber} fillOpacity={0.18} />
            <T x={x} y={24} size={10} anchor="middle" color={C.amber} bold>1</T>
          </>}
          {p < 8 && <T x={x} y={52} size={15} anchor="middle" color={lead(addA) && p > 0 ? C.axis : C.fg} bold>{String(bit(addA, p))}</T>}
          {p < 8 && <T x={x} y={78} size={15} anchor="middle" color={lead(addB) && p > 0 ? C.axis : C.fg} bold>{String(bit(addB, p))}</T>}
          <T x={x} y={112} size={15} anchor="middle" color={lead(sum) && p > 0 ? C.axis : C.green} bold>{String(bit(sum, p))}</T>
          <T x={x} y={136} size={8} anchor="middle" color={C.muted}>{String(1 << p)}</T>
        </g>;
      })}
    </>;
    const nCarry = carry.filter(c => c === 1).length;
    controls = <>
      <Sliders>
        <Slider label="a" value={addA} min={0} max={255} step={1} onChange={setAddA} fmt={v => String(v)} />
        <Slider label="b" value={addB} min={0} max={255} step={1} onChange={setAddB} fmt={v => String(v)} />
      </Sliders>
      <Row>
        <Readout color={C.sky}>{toBase(addA, 2)}₂ + {toBase(addB, 2)}₂ = {toBase(sum, 2)}₂</Readout>
        <Readout color={C.green}>{addA} + {addB} = {sum}</Readout>
        <Readout color={C.amber}>{tx(t, "figBase_carries", "carries")}: {nCarry}</Readout>
      </Row>
    </>;
    note = tx(t, "figBase_noteAdd", "Pick two numbers. Each column adds its two digits plus the carry coming from the column on its right. 1 + 1 = 10₂: write 0 and carry 1 (amber) into the next column; 1 + 1 + 1 = 11₂: write 1 and carry 1. It is the same procedure as column addition in decimal, only a column carries when it reaches 2 instead of 10. The small numbers underneath are the place values, and the decimal readout checks the result.");
  }

  return (
    <Figure
      title={tx(t, "figBase_title", "Bits, bases and hex")}
      head={<Choice value={mode} onChange={setMode} options={[["bits", tx(t, "figBase_bits", "bits")], ["convert", tx(t, "figBase_convert", "convert")], ["add", tx(t, "figBase_add", "addition")]] as const} />}
      controls={controls}
      note={note}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
