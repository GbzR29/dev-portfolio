"use client";

import { useEffect, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, Sliders, C, T, useVisible } from "@/components/lesson/kit/figure";
import { scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// bits    — one byte as eight clickable bits with their place values 128 … 1.
//           The value is the sum of the place values that are on; each nibble
//           is one hex digit. +1 shows carrying; ×2 appends a 0, ÷2 drops the last digit.
// convert — decimal to base B by repeated division: the remainders, read from
//           the last one up, are the digits. One division per Transport step.
// add     — column addition of two binary numbers, with the carries shown
//           above the columns they go into. One column per Transport step,
//           right to left.
// The lab walks through all three modes.

type Mode = "bits" | "convert" | "add";
const W = 560;
const HEX = "0123456789ABCDEF";
const DIGIT_COLS = [C.sky, C.amber, C.green, C.purple, C.pink, C.teal, C.orange, C.red, C.blue, C.sky];
const NB = 9;                                       // columns in the addition: 8 bits + one for the last carry
const ALL = 99;                                     // "show every step"
const toBase = (n: number, b: number) => n.toString(b).toUpperCase();
const bin8 = (v: number) => v.toString(2).padStart(8, "0");
const bit = (v: number, p: number) => (v >> p) & 1;

/** Rows of repeated division: [number, quotient, remainder]. */
function divisions(n: number, B: number) {
  const rows: [number, number, number][] = [];
  let q = n;
  do { rows.push([q, Math.floor(q / B), q % B]); q = Math.floor(q / B); } while (q > 0);
  return rows;
}

/** carry[p]: the carry into column p of a + b. */
function carries(a: number, b: number) {
  const carry: number[] = [0];
  for (let p = 0; p < NB; p++) carry.push((bit(a, p) + bit(b, p) + carry[p]) >> 1);
  return carry;
}

export function BaseFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("bits");
  const [byte, setByte] = useState(214);
  const [n, setN] = useState(214);
  const [base, setBase] = useState<"2" | "3" | "8" | "16">("2");
  const [addA, setAddA] = useState(107), [addB, setAddB] = useState(54);
  const [shown, setShown] = useState(ALL);          // division rows or addition columns revealed
  const [playing, setPlaying] = useState(false);
  const [speed] = useFigureSpeed();
  const lab = useLab("math-bases");
  const vis = useVisible<HTMLDivElement>();

  const B = +base;
  const rows = divisions(n, B);
  const carry = carries(addA, addB);
  const sum = addA + addB;
  const nCarry = carry.filter(c => c === 1).length;
  const end = mode === "convert" ? rows.length : NB;
  const pos = Math.min(shown, end);
  const all = pos >= end;

  // Playing reveals one division (or one column) per beat
  useEffect(() => {
    if (!playing || !(vis.on || lab.open)) return;
    if (pos >= end) { setPlaying(false); return; }
    const id = setTimeout(() => setShown(pos + 1), scaledMs(800, speed));
    return () => clearTimeout(id);
  }, [playing, pos, end, speed, vis.on, lab.open]);

  // Any new input is shown complete; ⟲ then ⏭ replays it step by step
  const change = (f: () => void) => { f(); setShown(ALL); setPlaying(false); };
  const pick = (m: Mode) => change(() => setMode(m));

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
    const rh = 15, y0 = 18;
    H = Math.max(80, y0 + rows.length * rh + 14);
    const digits = rows.map(r => HEX[r[2]]).reverse();
    const dw = Math.min(26, 200 / digits.length), rx = W - 30 - digits.length * dw;
    svg = <>
      {rows.slice(0, pos).map(([a, qq, rem], i) => {
        const y = y0 + i * rh + 10, col = DIGIT_COLS[i % DIGIT_COLS.length];
        return <g key={i}>
          <T x={110} y={y} size={10} anchor="end" color={C.fg}>{String(a)}</T>
          <T x={118} y={y} size={10} color={C.muted}>{`÷ ${B} =`}</T>
          <T x={200} y={y} size={10} anchor="end" color={C.fg}>{String(qq)}</T>
          <T x={212} y={y} size={10} color={C.muted}>{tx(t, "figBase_rem", "remainder")}</T>
          <T x={290} y={y} size={11} anchor="middle" color={col} bold>{`${rem}${B === 16 && rem > 9 ? ` = ${HEX[rem]}` : ""}`}</T>
        </g>;
      })}
      {all && rows.length > 1 && <>
        <line x1={310} x2={310} y1={y0 + (rows.length - 1) * rh + 8} y2={y0 + 6} stroke={C.axis} strokeWidth={1.4} />
        <path d={`M306 ${y0 + 12} L310 ${y0 + 4} L314 ${y0 + 12}`} fill="none" stroke={C.axis} strokeWidth={1.4} />
      </>}
      <T x={rx - 8} y={H / 2 + 5} size={12} anchor="end" color={C.muted}>=</T>
      {digits.map((d, i) => {
        const row = digits.length - 1 - i;                       // the division that produced this digit
        return <T key={i} x={rx + i * dw + dw / 2} y={H / 2 + 6} size={Math.min(18, dw * 0.9)} anchor="middle"
          color={row < pos ? DIGIT_COLS[row % DIGIT_COLS.length] : C.axis} bold>{row < pos ? d : "?"}</T>;
      })}
      <T x={W - 26} y={H / 2 + 12} size={12} color={C.muted}>{base === "2" ? "₂" : base === "3" ? "₃" : base === "8" ? "₈" : "₁₆"}</T>
    </>;
    controls = <>
      <Row>
        <Slider label="n" value={n} min={0} max={1000} step={1} onChange={v => change(() => setN(v))} fmt={v => String(v)} width="w-40" />
        <Choice value={base} onChange={v => change(() => setBase(v))} options={[["2", tx(t, "figBase_base", "base") + " 2"], ["3", "3"], ["8", "8"], ["16", "16"]] as const} />
      </Row>
      <Row>
        <Readout color={C.green}>{n} = {toBase(n, B)}</Readout>
        <Readout>{digits.map((d, i) => `${HEX.indexOf(d)}·${B}${"⁰¹²³⁴⁵⁶⁷⁸⁹"[digits.length - 1 - i]}`).join(" + ")} = {n}</Readout>
      </Row>
    </>;
    note = tx(t, "figBase_noteConvert2", "Pick a number and a base, then ⟲ and ⏭ to divide one row at a time. Each row divides by the base and keeps the remainder, always between 0 and base − 1, so it is a valid digit. The first remainder is the last digit: it is what is left after taking out every full group of B, the ones. The next row does the same with the groups themselves, and so on until nothing is left. Read the remainders upward, as the arrow shows; the readout multiplies each digit by its place value to check the result.");
  } else {
    const cw = 42, ox = 118;
    const X = (p: number) => ox + (NB - 1 - p) * cw;             // bit 8 on the left, bit 0 on the right
    const labels: [string, number, number][] = [[tx(t, "figBase_carry", "carry"), 24, 0], ["a", 52, 1], ["+ b", 78, 2], ["=", 112, 3]];
    H = 146;
    svg = <>
      {labels.map(([lbl, y, k]) => <T key={k} x={ox - 18} y={y} size={k === 0 ? 9 : 11} anchor="end" color={k === 0 ? C.amber : k === 3 ? C.green : C.sky} bold={k !== 0}>{lbl}</T>)}
      <line x1={ox - 12} x2={X(0) + cw - 8} y1={90} y2={90} stroke={C.axis} strokeWidth={1.4} />
      {!all && <rect x={X(pos) + 3} y={36} width={cw - 6} height={84} rx={6} fill={C.amber} fillOpacity={0.1} stroke={C.amber} strokeOpacity={0.5} />}
      {Array.from({ length: NB }, (_, p) => {
        const x = X(p) + cw / 2, lead = (v: number) => v < 1 << p;   // digit left of the number's first 1
        const done = p < pos;
        return <g key={p}>
          {carry[p] === 1 && p <= pos && <>
            <rect x={x - 9} y={12} width={18} height={16} rx={4} fill={C.amber} fillOpacity={0.18} />
            <T x={x} y={24} size={10} anchor="middle" color={C.amber} bold>1</T>
          </>}
          {p < 8 && <T x={x} y={52} size={15} anchor="middle" color={lead(addA) && p > 0 ? C.axis : C.fg} bold>{String(bit(addA, p))}</T>}
          {p < 8 && <T x={x} y={78} size={15} anchor="middle" color={lead(addB) && p > 0 ? C.axis : C.fg} bold>{String(bit(addB, p))}</T>}
          {done && <T x={x} y={112} size={15} anchor="middle" color={lead(sum) && p > 0 ? C.axis : C.green} bold>{String(bit(sum, p))}</T>}
          <T x={x} y={136} size={8} anchor="middle" color={C.muted}>{String(1 << p)}</T>
        </g>;
      })}
    </>;
    controls = <>
      <Sliders>
        <Slider label="a" value={addA} min={0} max={255} step={1} onChange={v => change(() => setAddA(v))} fmt={v => String(v)} />
        <Slider label="b" value={addB} min={0} max={255} step={1} onChange={v => change(() => setAddB(v))} fmt={v => String(v)} />
      </Sliders>
      <Row>
        <Readout color={C.sky}>{toBase(addA, 2)}₂ + {toBase(addB, 2)}₂ = {toBase(sum, 2)}₂</Readout>
        <Readout color={C.green}>{addA} + {addB} = {sum}</Readout>
        <Readout color={C.amber}>{tx(t, "figBase_carries", "carries")}: {nCarry}</Readout>
      </Row>
    </>;
    note = tx(t, "figBase_noteAdd2", "Pick two numbers, then ⟲ and ⏭ to add one column at a time, from the right. Each column adds its two digits plus the carry coming from the column on its right. 1 + 1 = 10₂: write 0 and carry 1 (amber) into the next column; 1 + 1 + 1 = 11₂: write 1 and carry 1. It is the same procedure as column addition in decimal, only a column carries when it reaches 2 instead of 10. The small numbers underneath are the place values, and the decimal readout checks the result.");
  }

  const stage = (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
      {mode !== "bits" && (
        <Transport t={t} speed playing={playing}
          onPlay={() => { if (playing) { setPlaying(false); return; } if (all) setShown(0); setPlaying(true); }}
          playLabel={mode === "convert" ? tx(t, "figBase_playConv", "divide row by row") : tx(t, "figBase_playAdd", "add column by column")}
          onStep={!all ? () => { setPlaying(false); setShown(pos + 1); } : undefined}
          onBack={pos > 0 ? () => { setPlaying(false); setShown(pos - 1); } : undefined}
          onReset={() => { setPlaying(false); setShown(0); }}
          readout={`${mode === "convert" ? tx(t, "figBase_rows", "divisions") : tx(t, "figBase_cols", "columns")}: ${pos} / ${end}`} />
      )}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[["bits", tx(t, "figBase_bits", "bits")], ["convert", tx(t, "figBase_convert", "convert")], ["add", tx(t, "figBase_add", "addition")]] as const} />;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figBaseL1_t", "Build a number from bits"),
      body: <>
        <p>{tx(t, "figBaseL1_b1", "Eight bits, each worth the power of two above it. Click a bit to turn it on or off; the value is the sum of the ones that are on.")}</p>
        <p>{tx(t, "figBaseL1_b2", "Make 100.")}</p>
      </>,
      goal: { text: tx(t, "figBaseL1_g", "Bits worth exactly 100."), done: mode === "bits" && byte === 100 },
      hint: tx(t, "figBaseL1_h", "Take the biggest place value that fits, 64, then 32 of the remaining 36, then 4."),
      setup: () => { pick("bits"); setByte(0); },
    },
    {
      title: tx(t, "figBaseL2_t", "Counting and carrying"),
      body: <p>{tx(t, "figBaseL2_b", "0000 0111₂ = 7. Press +1 and watch: every 1 at the right turns into 0 and the carry runs left, like 999 + 1 in decimal.")}</p>,
      goal: { text: tx(t, "figBaseL2_g", "Go from 7 to 8 with +1."), done: mode === "bits" && byte === 8 },
      setup: () => { pick("bits"); setByte(7); },
    },
    {
      title: tx(t, "figBaseL3_t", "Quick check"),
      body: <p>{tx(t, "figBaseL3_b", "All eight bits on.")}</p>,
      quiz: {
        q: tx(t, "figBaseL3_q", "1111 1111₂ = ?"),
        options: ["255", "256", "128", "11111111"],
        answer: 0,
        why: tx(t, "figBaseL3_w", "128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255 = 2⁸ − 1, just as 999 = 10³ − 1."),
      },
    },
    {
      title: tx(t, "figBaseL4_t", "Decimal to binary"),
      body: <>
        <p>{tx(t, "figBaseL4_b1", "Divide 214 by 2 again and again, keeping the remainders. The first remainder is the last digit.")}</p>
        <p>{tx(t, "figBaseL4_b2", "Step through every division and watch the digits fill in from the right.")}</p>
      </>,
      goal: { text: tx(t, "figBaseL4_g", "Convert 214 to base 2, division by division."), done: mode === "convert" && n === 214 && base === "2" && all },
      focus: "step",
      setup: () => { pick("convert"); setN(214); setBase("2"); setShown(0); },
    },
    {
      title: tx(t, "figBaseL5_t", "Three hex digits"),
      body: <p>{tx(t, "figBaseL5_b", "Switch to base 16. Two hex digits reach FF = 255. What is the smallest number that needs three?")}</p>,
      goal: { text: tx(t, "figBaseL5_g", "The smallest number with three hex digits."), done: mode === "convert" && base === "16" && n === 256 },
      hint: tx(t, "figBaseL5_h", "The third position is worth 16² = 256: it is 100₁₆."),
      setup: () => { pick("convert"); setN(200); setBase("16"); },
    },
    {
      title: tx(t, "figBaseL6_t", "Adding in columns"),
      body: <p>{tx(t, "figBaseL6_b", "107 + 54 in binary. Each column adds two digits and the carry from the right; 1 + 1 writes 0 and carries 1. Play it column by column.")}</p>,
      goal: { text: tx(t, "figBaseL6_g", "Add 107 + 54 to the last column."), done: mode === "add" && addA === 107 && addB === 54 && all },
      focus: "play",
      setup: () => { pick("add"); setAddA(107); setAddB(54); setShown(0); },
    },
    {
      title: tx(t, "figBaseL7_t", "A carry in every column"),
      body: <p>{tx(t, "figBaseL7_b", "Choose a and b so that every one of the eight columns sends a carry to the left.")}</p>,
      goal: { text: tx(t, "figBaseL7_g", "Eight carries."), done: mode === "add" && nCarry >= 8 },
      hint: tx(t, "figBaseL7_h", "255 + 1: the carry runs all the way through, like 999 + 1."),
      setup: () => { pick("add"); setAddA(107); setAddB(54); },
    },
    {
      title: tx(t, "figBaseL8_t", "Quick check"),
      body: <p>{tx(t, "figBaseL8_b", "Add by hand, column by column.")}</p>,
      quiz: {
        q: tx(t, "figBaseL8_q", "1011₂ + 0110₂ = ?"),
        options: ["10001₂", "1121₂", "1101₂", "11001₂"],
        answer: 0,
        why: tx(t, "figBaseL8_w", "Ones: 1 + 0 = 1. Twos: 1 + 1 = 10₂, write 0, carry 1. Fours: 0 + 1 + 1 = 10₂, write 0, carry 1. Eights: 1 + 0 + 1 = 10₂, write 0, carry 1. Result 10001₂ = 17 = 11 + 6. A digit 2 never appears in binary."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "full", tone: "info", when: mode === "bits" && byte === 255,
      title: tx(t, "figBaseI1_t", "All ones: 2⁸ − 1"),
      body: tx(t, "figBaseI1_b", "255 is the largest number eight bits can write. One more and the display rolls over to 0, like an odometer at 999."),
    },
    {
      id: "pow2", tone: "info", when: mode === "bits" && byte > 0 && (byte & (byte - 1)) === 0,
      title: tx(t, "figBaseI2_t", "A single 1: a power of two"),
      body: fill(tx(t, "figBaseI2_b", "{v} has exactly one bit on, so it is a power of two, just as 1000 is a power of ten."), { v: byte }),
    },
    {
      id: "letters", tone: "info", when: mode === "convert" && base === "16" && rows.some(r => r[2] > 9),
      title: tx(t, "figBaseI3_t", "Digits past 9"),
      body: tx(t, "figBaseI3_b", "Base 16 needs sixteen digits, so 10 to 15 are written A to F. A remainder of 13 is the single digit D."),
    },
    {
      id: "ninth", tone: "warn", when: mode === "add" && sum > 255,
      title: tx(t, "figBaseI4_t", "The sum needs a ninth column"),
      body: fill(tx(t, "figBaseI4_b", "{s} is more than 255, so the last carry opens a new column worth 256. With only eight places it would be lost."), { s: sum }),
    },
    {
      id: "nocarry", tone: "ok", when: mode === "add" && nCarry === 0 && sum > 0,
      title: tx(t, "figBaseI5_t", "No carries at all"),
      body: tx(t, "figBaseI5_b", "a and b never have a 1 in the same column, so each column is just 0 + 0, 0 + 1 or 1 + 0."),
    },
  ];

  const title = tx(t, "figBase_title", "Bits, bases and hex");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        <div ref={vis.ref}>{stage}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={stage}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figBaseR1", "A number in base B is a sum of digits times powers of B; in binary the place values are 1, 2, 4, 8…"),
          tx(t, "figBaseR2", "To convert, divide by the base again and again; the remainders, read upward, are the digits."),
          tx(t, "figBaseR3", "Column addition works in any base; in binary a column carries when it reaches 2."),
          tx(t, "figBaseR4", "One hex digit is exactly four bits, because 16 = 2⁴."),
        ]}
      />
    </>
  );
}
