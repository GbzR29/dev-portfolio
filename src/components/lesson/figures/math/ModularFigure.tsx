"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Slider, C, T, Vec, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// clock — n positions round a circle, 0 at the top. A walk starts at s and
//         repeats one move: "+ k" (add k, wrap past n − 1) or "× a" (multiply by
//         a, starting at 1, which lists the powers a⁰, a¹, a² … mod n). The walk
//         stops as soon as it reaches a position it has already visited, so the
//         cycle shows. The steps run on the Transport bar.
// table — the multiplication (or addition) table mod n, each value in its own
//         colour. Clicking a row picks a: the cells equal to 1 mark its inverse;
//         a row with no 1 has no inverse (gcd(a, n) > 1), and its zeros show
//         that a product can be 0 mod n with neither factor 0.
// The lab walks through both modes.

type Mode = "clock" | "table";
type Op = "add" | "mul";
const W = 560;
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
const mod = (a: number, n: number) => ((a % n) + n) % n;
/** Data colour for a residue: spread round the hue circle; 0 is grey. */
const hue = (v: number, n: number) => (v === 0 ? "#64748b" : `hsl(${Math.round((v - 1) / Math.max(1, n - 1) * 300)}, 70%, 55%)`);

/** The walk until the first repeat: the visited values and where the cycle starts. */
function walk(n: number, op: Op, k: number, s: number) {
  const seq: number[] = [], at = new Map<number, number>();
  let x = op === "mul" ? 1 : mod(s, n);
  while (!at.has(x)) { at.set(x, seq.length); seq.push(x); x = op === "mul" ? mod(x * k, n) : mod(x + k, n); }
  return { seq, next: x, loopFrom: at.get(x)! };
}

export function ModularFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("clock");
  const [n, setN] = useState(12);
  const [op, setOp] = useState<Op>("add");
  const [k, setK] = useState(5);
  const [shown, setShown] = useState(12);
  const [tOp, setTOp] = useState<Op>("mul");
  const [row, setRow] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const acc = useRef(0);
  const lab = useLab("math-modular");
  const vis = useVisible<HTMLDivElement>();

  const w = walk(n, op, mod(k, n), 0);
  const total = w.seq.length;                 // steps until the repeat is reached
  const steps = Math.min(shown, total);
  useFrame(playing && (vis.on || lab.open), dt => {
    if (steps >= total) { setPlaying(false); return; }
    acc.current += dt;
    if (acc.current > 0.6) { acc.current = 0; setShown(steps + 1); }
  });
  const pick = (m: Mode) => { setMode(m); setPlaying(false); };
  const reset = (full = true) => { setPlaying(false); setShown(full ? 99 : 0); };
  const setNk = (nn: number, kk: number) => { setN(nn); setK(kk); setRow(null); reset(); };

  let svg: React.ReactNode, H = 260, controls: React.ReactNode, note: string;

  if (mode === "clock") {
    const cx = 140, cy = 130, R = 104;
    const pos = (v: number) => {
      const a = (v / n) * 2 * Math.PI - Math.PI / 2;
      return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
    };
    const visited = new Set(w.seq.slice(0, steps));
    const cur = steps > 0 ? w.seq[steps - 1] : null;
    const done = steps >= total;
    svg = <>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.grid} strokeWidth={1.5} />
      {w.seq.slice(0, Math.max(0, steps - 1)).map((v, i) => {
        const a = pos(v), b = pos(w.seq[i + 1]);
        return <Vec key={i} a={a} b={b} color={C.amber} w={1.6} head={6} opacity={0.75} />;
      })}
      {done && steps > 0 && <Vec a={pos(w.seq[total - 1])} b={pos(w.next)} color={C.red} w={1.8} head={7} dash="4 3" />}
      {Array.from({ length: n }, (_, v) => {
        const p = pos(v), on = visited.has(v), now = v === cur;
        return <g key={v}>
          <circle cx={p.x} cy={p.y} r={now ? 12 : 10} fill={on ? C.amber : "var(--surface)"} fillOpacity={on ? (now ? 0.9 : 0.35) : 1}
            stroke={on ? C.amber : "var(--border)"} strokeWidth={now ? 2 : 1} />
          <T x={p.x} y={p.y + 3.5} size={n > 16 ? 8 : 9.5} anchor="middle" color={C.fg} bold={now}>{String(v)}</T>
        </g>;
      })}
      <T x={290} y={34} size={12} color={C.fg} bold>
        {op === "add" ? `x → x + ${mod(k, n)}  (mod ${n})` : `x → x · ${mod(k, n)}  (mod ${n})`}
      </T>
      <T x={290} y={56} size={10} color={C.muted}>
        {op === "add" ? tx(t, "figMod_fromZero", "start at 0") : fill(tx(t, "figMod_powers", "start at 1: the powers {a}⁰, {a}¹, {a}² …"), { a: mod(k, n) })}
      </T>
      {w.seq.slice(0, steps).map((v, i) => (
        <T key={i} x={290 + (i % 8) * 32} y={86 + Math.floor(i / 8) * 20} size={11} color={i >= w.loopFrom ? C.amber : C.muted} bold={i === steps - 1}>{String(v)}</T>
      ))}
      {done && <>
        <T x={290} y={86 + (Math.floor((total - 1) / 8) + 1) * 20 + 6} size={10.5} color={C.red}>
          {fill(tx(t, "figMod_repeat", "next: {v} again, so the walk repeats"), { v: w.next })}
        </T>
        <T x={290} y={86 + (Math.floor((total - 1) / 8) + 1) * 20 + 26} size={10.5} color={C.fg}>
          {fill(tx(t, "figMod_cycle", "cycle length {c}"), { c: total - w.loopFrom })}
          {op === "add" ? `  = ${n} / ${tx(t, "figMod_gcd", "gcd")}(${mod(k, n)}, ${n})` : ""}
        </T>
      </>}
    </>;
    controls = <>
      <Row>
        <Choice value={op} onChange={v => { setOp(v); reset(); }} options={[["add", tx(t, "figMod_add", "add k")], ["mul", tx(t, "figMod_mul", "multiply by a")]] as const} />
      </Row>
      <Row>
        <Slider label="n" value={n} min={2} max={20} step={1} onChange={v => setNk(v, Math.min(k, v - 1))} fmt={v => String(v)} />
        <Slider label={op === "add" ? "k" : "a"} value={k} min={1} max={n - 1} step={1} onChange={v => { setK(v); reset(); }} fmt={v => String(v)} />
      </Row>
    </>;
    note = tx(t, "figMod_noteClock", "Numbers mod n live on a circle of n positions, 0 to n − 1. Adding k moves k places clockwise, and passing n − 1 wraps round to 0. The walk stops when it lands on a position it has already visited; from then on it would only repeat. With \"add\", the walk visits n / gcd(k, n) positions, so all of them exactly when gcd(k, n) = 1. With \"multiply\", it lists the powers of a mod n. They always end in a cycle. The cycle runs back to 1 when gcd(a, n) = 1.");
  } else {
    const size = Math.min(23, Math.floor(250 / (n + 1))), x0 = 20, y0 = 8;
    H = y0 + (n + 1) * size + 8;
    const val = (a: number, b: number) => (tOp === "mul" ? (a * b) % n : (a + b) % n);
    const g = row === null ? 1 : gcd(row, n);
    const ones = row === null ? [] : Array.from({ length: n }, (_, b) => b).filter(b => val(row, b) === (tOp === "mul" ? 1 : 0));
    const zeros = row === null || tOp !== "mul" ? [] : Array.from({ length: n - 1 }, (_, b) => b + 1).filter(b => val(row, b) === 0);
    const px = x0 + (n + 1) * size + 26;
    svg = <>
      <T x={x0 + size / 2} y={y0 + size / 2 + 4} size={11} anchor="middle" color={C.fg} bold>{tOp === "mul" ? "×" : "+"}</T>
      {Array.from({ length: n }, (_, i) => <g key={i}>
        <T x={x0 + (i + 1.5) * size} y={y0 + size / 2 + 4} size={size > 18 ? 10 : 8} anchor="middle" color={C.muted}>{String(i)}</T>
        <g onClick={() => setRow(row === i ? null : i)} style={{ cursor: "pointer" }}>
          <rect x={x0} y={y0 + (i + 1) * size} width={size} height={size} fill={row === i ? C.amber : "transparent"} fillOpacity={0.3} />
          <T x={x0 + size / 2} y={y0 + (i + 1.5) * size + 4} size={size > 18 ? 10 : 8} anchor="middle" color={row === i ? C.fg : C.muted} bold={row === i}>{String(i)}</T>
        </g>
      </g>)}
      {Array.from({ length: n }, (_, a) => Array.from({ length: n }, (_, b) => {
        const v = val(a, b), dim = row !== null && row !== a;
        const mark = row === a && ((tOp === "mul" && v === 1) || (tOp === "add" && v === 0));
        return <g key={`${a}-${b}`} onClick={() => setRow(row === a ? null : a)} style={{ cursor: "pointer" }} opacity={dim ? 0.25 : 1}>
          <rect x={x0 + (b + 1) * size + 1} y={y0 + (a + 1) * size + 1} width={size - 2} height={size - 2} rx={3}
            fill={hue(v, n)} fillOpacity={0.75} stroke={mark ? C.fg : "none"} strokeWidth={2} />
          {size >= 16 && <T x={x0 + (b + 1.5) * size} y={y0 + (a + 1.5) * size + 3.5} size={size > 20 ? 9.5 : 8} anchor="middle" color="#0b1020" bold={mark}>{String(v)}</T>}
        </g>;
      }))}
      {row === null
        ? <T x={px} y={40} size={10.5} color={C.muted}>{tx(t, "figMod_pickRow", "Pick a row: click its number.")}</T>
        : tOp === "mul" ? <>
          <T x={px} y={40} size={12} color={C.fg} bold>{`a = ${row}`}</T>
          <T x={px} y={62} size={10.5} color={C.muted}>{`${tx(t, "figMod_gcd", "gcd")}(${row}, ${n}) = ${g}`}</T>
          {ones.length
            ? <T x={px} y={88} size={11} color={C.green}>{`${row} · ${ones[0]} ≡ 1  →  ${row}⁻¹ = ${ones[0]}`}</T>
            : <T x={px} y={88} size={11} color={C.red}>{tx(t, "figMod_noInv", "no 1 in this row: no inverse")}</T>}
          {zeros.length > 0 && <T x={px} y={112} size={10.5} color={C.red}>{`${row} · ${zeros[0]} = ${row * zeros[0]} ≡ 0`}</T>}
          {zeros.length > 0 && <T x={px} y={130} size={9.5} color={C.muted}>{tx(t, "figMod_zeroDiv", "a product is 0 with neither factor 0")}</T>}
        </> : <>
          <T x={px} y={40} size={12} color={C.fg} bold>{`a = ${row}`}</T>
          <T x={px} y={64} size={11} color={C.green}>{`${row} + ${ones[0]} ≡ 0  →  −${row} ≡ ${ones[0]}`}</T>
        </>}
    </>;
    controls = <Row>
      <Choice value={tOp} onChange={v => { setTOp(v); }} options={[["mul", tx(t, "figMod_tMul", "multiplication")], ["add", tx(t, "figMod_tAdd", "addition")]] as const} />
      <Slider label="n" value={n} min={2} max={13} step={1} onChange={v => { setN(v); setRow(r => (r !== null && r < v ? r : null)); }} fmt={v => String(v)} />
    </Row>;
    note = tx(t, "figMod_noteTable", "Row a, column b holds a × b mod n (or a + b mod n), and each value has its own colour, with 0 in grey. Pick a row to study one number a. In the addition table every row holds every value once, so −a always exists. In the multiplication table a row contains 1 exactly when gcd(a, n) = 1, and the column of that 1 is the inverse of a. When n is prime, every row except 0 is a reshuffle of 1 … n − 1. That fact is behind Fermat's little theorem.");
  }

  const stage = (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
      {mode === "clock" && (
        <Transport t={t} playing={playing}
          onPlay={() => { if (playing) { setPlaying(false); return; } if (steps >= total) setShown(0); acc.current = 0; setPlaying(true); }}
          playLabel={tx(t, "figMod_play", "walk")}
          onStep={steps < total ? () => { setPlaying(false); setShown(steps + 1); } : undefined}
          onBack={steps > 0 ? () => { setPlaying(false); setShown(steps - 1); } : undefined}
          onReset={() => reset(false)}
          readout={`${steps} / ${total}`} />
      )}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[["clock", tx(t, "figMod_clock", "clock")], ["table", tx(t, "figMod_table", "table")]] as const} />;

  // ── Lab ──
  const clockDone = mode === "clock" && steps >= total;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figModL1_t", "Steps of 5 on a clock"),
      body: <>
        <p>{tx(t, "figModL1_b1", "A 12-hour clock, written 0 to 11. Start at 0 and keep adding 5 hours.")}</p>
        <p>{tx(t, "figModL1_b2", "Run the walk to the end. Does it visit every hour?")}</p>
      </>,
      goal: { text: tx(t, "figModL1_g", "Walk +5 mod 12 to the end."), done: clockDone && op === "add" && n === 12 && k === 5 },
      focus: "play",
      setup: () => { pick("clock"); setOp("add"); setNk(12, 5); setShown(0); },
    },
    {
      title: tx(t, "figModL2_t", "A step that shares a factor"),
      body: <p>{tx(t, "figModL2_b", "Now try steps of 4 on the same clock. 4 and 12 share the factor 4.")}</p>,
      goal: { text: tx(t, "figModL2_g", "Walk +4 mod 12 to the end."), done: clockDone && op === "add" && n === 12 && k === 4 },
      hint: tx(t, "figModL2_h", "Set k = 4 and press ▶."),
      setup: () => { pick("clock"); setOp("add"); setNk(12, 5); },
    },
    {
      title: tx(t, "figModL3_t", "Quick check"),
      body: <p>{tx(t, "figModL3_b", "The walk visits n / gcd(k, n) positions.")}</p>,
      quiz: {
        q: tx(t, "figModL3_q", "How many hours does a walk of +9 on a 12-hour clock visit?"),
        options: ["3", "4", "9", "12"],
        answer: 1,
        why: tx(t, "figModL3_w", "gcd(9, 12) = 3, so 12 / 3 = 4 hours: 0, 9, 6, 3."),
      },
    },
    {
      title: tx(t, "figModL4_t", "Powers of 7, last digit"),
      body: <>
        <p>{tx(t, "figModL4_b1", "The last digit of a number is its remainder mod 10. Switch to \"multiply\" with n = 10 and a = 7: the walk lists 7⁰, 7¹, 7², … mod 10.")}</p>
        <p>{tx(t, "figModL4_b2", "Run it and find how long the cycle is.")}</p>
      </>,
      goal: { text: tx(t, "figModL4_g", "Powers of 7 mod 10 to the end."), done: clockDone && op === "mul" && n === 10 && k === 7 },
      setup: () => { pick("clock"); setOp("mul"); setNk(10, 7); setShown(0); },
    },
    {
      title: tx(t, "figModL5_t", "Quick check"),
      body: <p>{tx(t, "figModL5_b", "The last digits repeat 1, 7, 9, 3 every 4 powers.")}</p>,
      quiz: {
        q: tx(t, "figModL5_q", "The last digit of 7¹⁰⁰ is…"),
        options: ["1", "3", "7", "9"],
        answer: 0,
        why: tx(t, "figModL5_w", "100 = 4 × 25, so 7¹⁰⁰ = (7⁴)²⁵ ≡ 1²⁵ = 1 (mod 10)."),
      },
    },
    {
      title: tx(t, "figModL6_t", "Who has an inverse?"),
      body: <>
        <p>{tx(t, "figModL6_b1", "The multiplication table mod 12. A row contains 1 only if a has an inverse.")}</p>
        <p>{tx(t, "figModL6_b2", "Find a row with no 1 in it.")}</p>
      </>,
      goal: { text: tx(t, "figModL6_g", "Select a row a > 0 of the × table mod 12 that has no inverse."), done: mode === "table" && tOp === "mul" && n === 12 && row !== null && row > 0 && gcd(row, 12) > 1 },
      hint: tx(t, "figModL6_h", "Try a number that shares a factor with 12, such as 4 or 6."),
      setup: () => { pick("table"); setTOp("mul"); setN(12); setRow(null); },
    },
    {
      title: tx(t, "figModL7_t", "A prime modulus"),
      body: <p>{tx(t, "figModL7_b", "Set n = 7. Every row except row 0 now contains 1 exactly once. Pick row 3 and read off its inverse.")}</p>,
      goal: { text: tx(t, "figModL7_g", "Row 3 of the × table mod 7."), done: mode === "table" && tOp === "mul" && n === 7 && row === 3 },
      setup: () => { pick("table"); setTOp("mul"); setN(12); setRow(null); },
    },
    {
      title: tx(t, "figModL8_t", "Quick check"),
      body: <p>{tx(t, "figModL8_b", "Use the table or multiply it out.")}</p>,
      quiz: {
        q: tx(t, "figModL8_q", "Solve 3x ≡ 4 (mod 7)."),
        options: ["x = 6", "x = 4", "x = 5", "x = 1"],
        answer: 0,
        why: tx(t, "figModL8_w", "3⁻¹ = 5, because 3 · 5 = 15 ≡ 1. Multiply both sides by 5: x ≡ 20 ≡ 6. Check: 3 · 6 = 18 ≡ 4 ✓."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "all", tone: "ok", when: mode === "clock" && op === "add" && steps >= total && total === n,
      title: tx(t, "figModI1_t", "Every position visited"),
      body: fill(tx(t, "figModI1_b", "gcd({k}, {n}) = 1, so steps of {k} reach every one of the {n} positions before coming back to 0."), { k: mod(k, n), n }),
    },
    {
      id: "some", tone: "info", when: mode === "clock" && op === "add" && steps >= total && total < n,
      title: tx(t, "figModI2_t", "Only the multiples"),
      body: fill(tx(t, "figModI2_b", "gcd({k}, {n}) = {g}: the walk only lands on multiples of {g}, which is {c} positions."), { k: mod(k, n), n, g: gcd(k, n), c: total }),
    },
    {
      id: "tail", tone: "info", when: mode === "clock" && op === "mul" && steps >= total && w.loopFrom > 0,
      title: tx(t, "figModI3_t", "A tail before the cycle"),
      body: fill(tx(t, "figModI3_b", "gcd({a}, {n}) > 1, so the powers never come back to 1: they enter a cycle that starts at {v}."), { a: mod(k, n), n, v: w.next }),
    },
    {
      id: "prime", tone: "ok", when: mode === "table" && tOp === "mul" && row !== null && row > 0 && [2, 3, 5, 7, 11, 13].includes(n),
      title: tx(t, "figModI4_t", "A reshuffle of 1 … n − 1"),
      body: fill(tx(t, "figModI4_b", "n = {n} is prime, so row {a} holds each of 1 … {m} exactly once, in a new order. Multiplying all of them gives the same product as 1 · 2 ⋯ {m}."), { n, a: row ?? 0, m: n - 1 }),
    },
  ];

  const title = tx(t, "figMod_title", "Arithmetic mod n");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={<>
          {note}{" "}
          {mode === "table" && <>
            <span data-mouse-only>{tx(t, "figMod_click", "Click a row number to select it.")}</span>
            <span data-touch-only>{tx(t, "figMod_tap", "Tap a row number to select it.")}</span>
          </>}
        </>}
      >
        <div ref={vis.ref}>{stage}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={stage}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figModR1", "Mod n, numbers live on a circle of n positions; steps of k visit n / gcd(k, n) of them."),
          tx(t, "figModR2", "Powers mod n always end in a cycle, which makes huge powers easy to reduce."),
          tx(t, "figModR3", "a has an inverse mod n exactly when gcd(a, n) = 1; for a prime n every a ≠ 0 has one."),
        ]}
      />
    </>
  );
}
