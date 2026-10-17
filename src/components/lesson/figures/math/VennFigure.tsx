"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, C, T } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// The universe U = {1, …, 20} with A = the even numbers, B = the multiples of
// 3 and (with three sets) C = the primes. Every number sits in the region of
// the Venn diagram that matches its memberships. Picking an operation shades
// its region and lights up its elements; the readouts count them, and for a
// union they show inclusion–exclusion. Two operations are a "break it" pair:
// (A ∪ B)ᶜ and the tempting but wrong Aᶜ ∪ Bᶜ, against De Morgan's Aᶜ ∩ Bᶜ.

type Op = "A" | "B" | "union" | "inter" | "diff" | "symdiff" | "compA" | "compUnion" | "deMorgan" | "wrongDM"
  | "C" | "union3" | "inter3" | "distrib";
type Sets = 2 | 3;
const W = 560, H = 300;
const U = Array.from({ length: 20 }, (_, i) => i + 1);
const isPrime = (x: number) => { if (x < 2) return false; for (let d = 2; d * d <= x; d++) if (x % d === 0) return false; return true; };
const inA = (x: number) => x % 2 === 0, inB = (x: number) => x % 3 === 0, inC = isPrime;

/** Which points of the plane (in each of A, B, C) an operation keeps. */
const OPS: Record<Op, { tex: string; keep: (a: boolean, b: boolean, c: boolean) => boolean; sets: Sets }> = {
  A:         { tex: "A",                keep: a => a, sets: 2 },
  B:         { tex: "B",                keep: (_, b) => b, sets: 2 },
  union:     { tex: "A ∪ B",            keep: (a, b) => a || b, sets: 2 },
  inter:     { tex: "A ∩ B",            keep: (a, b) => a && b, sets: 2 },
  diff:      { tex: "A − B",            keep: (a, b) => a && !b, sets: 2 },
  symdiff:   { tex: "A △ B",            keep: (a, b) => a !== b, sets: 2 },
  compA:     { tex: "Aᶜ",               keep: a => !a, sets: 2 },
  compUnion: { tex: "(A ∪ B)ᶜ",         keep: (a, b) => !(a || b), sets: 2 },
  deMorgan:  { tex: "Aᶜ ∩ Bᶜ",          keep: (a, b) => !a && !b, sets: 2 },
  wrongDM:   { tex: "Aᶜ ∪ Bᶜ",          keep: (a, b) => !a || !b, sets: 2 },
  C:         { tex: "C",                keep: (_, __, c) => c, sets: 3 },
  union3:    { tex: "A ∪ B ∪ C",        keep: (a, b, c) => a || b || c, sets: 3 },
  inter3:    { tex: "(A ∩ B) ∪ C",      keep: (a, b, c) => (a && b) || c, sets: 3 },
  distrib:   { tex: "A ∩ (B ∪ C)",      keep: (a, b, c) => a && (b || c), sets: 3 },
};
const OPS2: Op[] = ["A", "B", "union", "inter", "diff", "symdiff", "compA", "compUnion", "deMorgan", "wrongDM"];
const OPS3: Op[] = ["C", "union3", "inter3", "distrib"];

// ── Geometry: circles, and where each region's numbers sit ───────────────────
type Circle = { x: number; y: number; r: number };
const CIRCLES: Record<Sets, Circle[]> = {
  2: [{ x: 220, y: 150, r: 105 }, { x: 340, y: 150, r: 105 }],
  3: [{ x: 230, y: 118, r: 92 }, { x: 330, y: 118, r: 92 }, { x: 280, y: 200, r: 92 }],
};
const inside = (c: Circle, x: number, y: number) => (x - c.x) ** 2 + (y - c.y) ** 2 <= c.r * c.r;

/** Anchor point of each membership pattern "abc" (a/b/c = 1 inside). */
const ANCHOR: Record<Sets, Record<string, [number, number]>> = {
  2: { "100": [160, 150], "010": [400, 150], "110": [280, 150], "000": [500, 60] },
  3: { "100": [190, 92], "010": [370, 92], "001": [280, 250], "110": [280, 78], "101": [222, 178], "011": [338, 178], "111": [280, 145], "000": [500, 50] },
};

function layout(sets: Sets) {
  const groups = new Map<string, number[]>();
  for (const x of U) {
    const key = `${+inA(x)}${+inB(x)}${sets === 3 ? +inC(x) : 0}`;
    groups.set(key, [...(groups.get(key) ?? []), x]);
  }
  const pos = new Map<number, [number, number]>();
  for (const [key, xs] of groups) {
    const [ax, ay] = ANCHOR[sets][key];
    const cols = key === "000" ? 2 : Math.min(3, Math.ceil(Math.sqrt(xs.length)));
    const rows = Math.ceil(xs.length / cols), dx = 26, dy = 22;
    xs.forEach((x, i) => pos.set(x, [ax + ((i % cols) - (cols - 1) / 2) * dx, ay + (Math.floor(i / cols) - (rows - 1) / 2) * dy]));
  }
  return pos;
}

/** One path of 6 × 6 cells covering the shaded region. */
function shade(sets: Sets, op: Op) {
  const cs = CIRCLES[sets], keep = OPS[op].keep, s = 6;
  let d = "";
  for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s) {
    const cx = x + s / 2, cy = y + s / 2;
    if (keep(inside(cs[0], cx, cy), inside(cs[1], cx, cy), sets === 3 && inside(cs[2], cx, cy))) d += `M${x},${y}h${s}v${s}h${-s}Z`;
  }
  return d;
}

export function VennFigure({ t }: { t?: TrackTranslations }) {
  const [sets, setSets] = useState<Sets>(2);
  const [op, setOp] = useState<Op>("union");
  const lab = useLab("math-sets");

  const pos = useMemo(() => layout(sets), [sets]);
  const region = useMemo(() => shade(sets, op), [sets, op]);
  const keep = OPS[op].keep;
  const result = U.filter(x => keep(inA(x), inB(x), sets === 3 && inC(x)));
  const nA = U.filter(inA).length, nB = U.filter(inB).length, nAB = U.filter(x => inA(x) && inB(x)).length;
  const names = sets === 2 ? ["A", "B"] : ["A", "B", "C"];
  const colours = [C.sky, C.amber, C.green];

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <rect x={6} y={6} width={W - 12} height={H - 12} rx={10} fill="none" stroke={C.axis} />
      <T x={16} y={24} color={C.muted} bold>U = {"{1, …, 20}"}</T>
      <path d={region} fill={C.purple} opacity={0.22} />
      {CIRCLES[sets].map((c, i) => <g key={i}>
        <circle cx={c.x} cy={c.y} r={c.r} fill="none" stroke={colours[i]} strokeWidth={2} />
        <T x={c.x + (i === 0 ? -c.r + 6 : i === 1 ? c.r - 6 : 0)} y={i === 2 ? c.y + c.r - 6 : c.y - c.r + 14} anchor={i === 0 ? "start" : i === 1 ? "end" : "middle"} color={colours[i]} bold size={11}>{names[i]}</T>
      </g>)}
      {U.map(x => {
        const [px, py] = pos.get(x)!, on = result.includes(x);
        return <g key={x}>
          <circle cx={px} cy={py} r={10} fill={on ? C.purple : "var(--code-bg)"} stroke={on ? C.purple : C.axis} opacity={on ? 0.9 : 1} />
          <T x={px} y={py + 3.5} anchor="middle" color={on ? "#fff" : C.muted} size={9} bold={on}>{x}</T>
        </g>;
      })}
      <T x={W - 16} y={H - 16} anchor="end" color={C.purple} bold size={11}>{`${OPS[op].tex} = {${result.join(", ")}}`.slice(0, 70)}</T>
    </svg>
  );

  const ops = sets === 2 ? OPS2 : [...OPS3, "union", "inter"] as Op[];
  // inline wrap: on phones figure.css turns long button rows into a sideways scroller, which would hide half the operations
  const opChoice = <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}><Choice value={op} onChange={setOp} options={ops.map(o => [o, OPS[o].tex] as const)} /></div>;
  const setsChoice = <Choice value={String(sets) as "2" | "3"} onChange={v => { const s = Number(v) as Sets; setSets(s); setOp(s === 3 ? "union3" : "union"); }} options={[
    ["2", tx(t, "figVenn_two", "two sets")],
    ["3", tx(t, "figVenn_three", "three sets")],
  ] as const} />;
  const controls = <>
    {opChoice}
    <Row>
      <Readout color={C.sky}>{`A = ${tx(t, "figVenn_evens", "even")}: ${nA}`}</Readout>
      <Readout color={C.amber}>{`B = ${tx(t, "figVenn_mult3", "multiples of 3")}: ${nB}`}</Readout>
      {sets === 3 && <Readout color={C.green}>{`C = ${tx(t, "figVenn_primes", "primes")}: ${U.filter(inC).length}`}</Readout>}
      <Readout color={C.purple}>{`|${OPS[op].tex}| = ${result.length}`}</Readout>
    </Row>
    {op === "union" && <Row><Readout color={C.green}>{`|A ∪ B| = |A| + |B| − |A ∩ B| = ${nA} + ${nB} − ${nAB} = ${nA + nB - nAB}`}</Readout></Row>}
  </>;
  const note = tx(t, "figVenn_note", "The box is the universe U, the numbers 1 to 20. Circle A holds the even numbers, B the multiples of 3, and with three sets C holds the primes. Each number sits in the region that matches what it belongs to: 6 and 12 and 18 are in both A and B, so they sit where the circles overlap. Pick an operation to shade its region and light up its elements. Compare (A ∪ B)ᶜ with Aᶜ ∩ Bᶜ (De Morgan: the same), and with Aᶜ ∪ Bᶜ, the tempting wrong version.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figVennL1_t", "Either one"),
      body: <p>{tx(t, "figVennL1_b", "A ∪ B (\"A union B\") holds everything in A or in B or in both. Shade it.")}</p>,
      goal: { text: tx(t, "figVennL1_g", "A ∪ B shaded."), done: sets === 2 && op === "union" },
      setup: () => { setSets(2); setOp("A"); },
    },
    {
      title: tx(t, "figVennL2_t", "Counting a union"),
      body: <p>{fill(tx(t, "figVennL2_b", "|A| = {a} and |B| = {b}, but |A ∪ B| is not {s}."), { a: nA, b: nB, s: nA + nB })}</p>,
      quiz: {
        q: tx(t, "figVennL2_q", "Why is |A ∪ B| = 13 and not 16?"),
        options: [tx(t, "figVennL2_o1", "6, 12 and 18 were counted twice"), tx(t, "figVennL2_o2", "the primes are left out"), tx(t, "figVennL2_o3", "20 is not in U")],
        answer: 0,
        why: tx(t, "figVennL2_w", "They are in both A and B. Inclusion–exclusion subtracts the overlap once: 10 + 6 − 3 = 13."),
      },
    },
    {
      title: tx(t, "figVennL3_t", "Both"),
      body: <p>{tx(t, "figVennL3_b", "A ∩ B (\"A intersect B\") holds what is in A and in B. Which numbers are even and multiples of 3?")}</p>,
      goal: { text: tx(t, "figVennL3_g", "A ∩ B shaded."), done: sets === 2 && op === "inter" },
    },
    {
      title: tx(t, "figVennL4_t", "De Morgan"),
      body: <>
        <p>{tx(t, "figVennL4_b1", "(A ∪ B)ᶜ is everything outside both circles: odd and not a multiple of 3.")}</p>
        <p>{tx(t, "figVennL4_b2", "Look at it, then at Aᶜ ∩ Bᶜ, then at Aᶜ ∪ Bᶜ.")}</p>
      </>,
      goal: { text: tx(t, "figVennL4_g", "Aᶜ ∪ Bᶜ shaded (the wrong one)."), done: sets === 2 && op === "wrongDM" },
      setup: () => { setSets(2); setOp("compUnion"); },
    },
    {
      title: tx(t, "figVennL5_t", "Quick check"),
      body: <p>{tx(t, "figVennL5_b", "De Morgan's laws turn the complement of a union into an intersection of complements.")}</p>,
      quiz: {
        q: tx(t, "figVennL5_q", "Which set equals (A ∩ B)ᶜ?"),
        options: ["Aᶜ ∪ Bᶜ", "Aᶜ ∩ Bᶜ", "A ∪ B", "A − B"],
        answer: 0,
        why: tx(t, "figVennL5_w", "Not in both means: missing from A, or missing from B. The complement swaps ∩ and ∪. Here it has 20 − 3 = 17 elements."),
      },
    },
    {
      title: tx(t, "figVennL6_t", "Three sets"),
      body: <p>{tx(t, "figVennL6_b", "Add C, the primes. Shade A ∩ (B ∪ C): even, and a multiple of 3 or prime.")}</p>,
      goal: { text: tx(t, "figVennL6_g", "A ∩ (B ∪ C) shaded."), done: sets === 3 && op === "distrib" },
      setup: () => { setSets(3); setOp("union3"); },
    },
    {
      title: tx(t, "figVennL7_t", "Quick check"),
      body: <p>{tx(t, "figVennL7_b", "Intersection distributes over union, like multiplication over addition.")}</p>,
      quiz: {
        q: tx(t, "figVennL7_q", "A ∩ (B ∪ C) equals…"),
        options: ["(A ∩ B) ∪ (A ∩ C)", "(A ∩ B) ∪ C", "A ∪ (B ∩ C)"],
        answer: 0,
        why: tx(t, "figVennL7_w", "{2, 6, 12, 18}: the even multiples of 3 together with the even prime 2. (A ∩ B) ∪ C would add all the odd primes too."),
      },
    },
  ];
  const insights: Insight[] = [
    {
      id: "dm", tone: "ok", when: op === "deMorgan" || op === "compUnion",
      title: tx(t, "figVennI1_t", "De Morgan"),
      body: tx(t, "figVennI1_b", "(A ∪ B)ᶜ and Aᶜ ∩ Bᶜ shade exactly the same region: {1, 5, 7, 11, 13, 17, 19}."),
    },
    {
      id: "wrong", tone: "warn", when: op === "wrongDM",
      title: tx(t, "figVennI2_t", "Not De Morgan"),
      body: tx(t, "figVennI2_b", "Aᶜ ∪ Bᶜ is far bigger: everything except the overlap. It equals (A ∩ B)ᶜ, the other De Morgan law."),
    },
  ];

  const title = tx(t, "figVenn_title", "Sets in a Venn diagram");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{setsChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls} note={note}>
        {view}
      </Figure>
      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{setsChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figVennR1", "A ∪ B: in A or B (or both). A ∩ B: in both. A − B: in A, not in B. Aᶜ: not in A."),
          tx(t, "figVennR2", "|A ∪ B| = |A| + |B| − |A ∩ B|: the overlap was counted twice."),
          tx(t, "figVennR3", "De Morgan: (A ∪ B)ᶜ = Aᶜ ∩ Bᶜ and (A ∩ B)ᶜ = Aᶜ ∪ Bᶜ."),
          tx(t, "figVennR4", "∩ distributes over ∪: A ∩ (B ∪ C) = (A ∩ B) ∪ (A ∩ C)."),
        ]}
      />
    </>
  );
}
