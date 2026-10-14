"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, C, T, f2, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// square  — a square of side a + b cut into a², two ab rectangles and b²:
//           (a + b)² = a² + 2ab + b², with the numbers for the chosen a and b.
// cube    — a cube of side a + b cut into 8 blocks, drawn in a fixed isometric
//           view and pulled apart by the "explode" slider: one a³, three a²b,
//           three ab², one b³. A block type can be highlighted.
// choices — (a + b)ⁿ multiplied out means picking a or b from each of the n
//           brackets. Every pick is a word such as "aba"; the words are sorted
//           into columns by how many b's they have, and the column sizes are
//           the coefficients (a row of Pascal's triangle). The Transport writes
//           the 2ⁿ words one at a time.
// The lab walks through all three modes.

type Mode = "square" | "cube" | "choices";
type Hl = "all" | "0" | "1" | "2" | "3";
const W = 560;
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n: number) => String(n).split("").map(d => SUP[+d]).join("");
/** Colour of a term by its number of b's. */
const KCOL = [C.sky, C.amber, C.pink, C.green, C.purple, C.teal];
const choose = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
/** aⁿ⁻ᵏbᵏ as text: "a²b", "b³", "1". */
const mono = (n: number, k: number) => {
  const p = (v: string, e: number) => (e === 0 ? "" : e === 1 ? v : v + sup(e));
  return p("a", n - k) + p("b", k) || "1";
};
const num = (v: number) => f2(v, 3).replace(/\.?0+$/, "");

// ── Isometric blocks for the cube ──
type V3 = [number, number, number];
const ISO = (p: V3): [number, number] => [(p[0] - p[2]) * 0.866, -p[1] + (p[0] + p[2]) * 0.5];

/** The 8 blocks: min corner, size, number of b's. */
function blocks(a: number, b: number, gap: number) {
  const out: { o: V3; s: V3; k: number }[] = [];
  for (let m = 0; m < 8; m++) {
    const bit = [m & 1, (m >> 1) & 1, (m >> 2) & 1];
    // the b part of each side comes first, so the big a³ block is the nearest
    const o = bit.map(i => (i ? 0 : b + gap)) as V3;
    const s = bit.map(i => (i ? b : a)) as V3;
    out.push({ o, s, k: bit[0] + bit[1] + bit[2] });
  }
  // far to near: the viewer looks from +x, +y, +z
  return out.sort((p, q) => (p.o[0] + p.o[1] + p.o[2] + (p.s[0] + p.s[1] + p.s[2]) / 2) - (q.o[0] + q.o[1] + q.o[2] + (q.s[0] + q.s[1] + q.s[2]) / 2));
}

/** The three visible faces of a box: top (+y), right (+x), front (+z). */
function faces(o: V3, s: V3): { pts: V3[]; shade: number }[] {
  const [x0, y0, z0] = o, x1 = x0 + s[0], y1 = y0 + s[1], z1 = z0 + s[2];
  return [
    { pts: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], shade: 0 },
    { pts: [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], shade: 0.25 },
    { pts: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], shade: 0.45 },
  ];
}

/** Every pick of a or b from n brackets, in counting order (aaa, aab, aba…). */
const words = (n: number) => Array.from({ length: 2 ** n }, (_, i) =>
  Array.from({ length: n }, (_, j) => ((i >> (n - 1 - j)) & 1 ? "b" : "a")).join(""));

export function BinomialFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("square");
  const [a, setA] = useState(3);
  const [b, setB] = useState(2);
  const [gap, setGap] = useState(0.6);
  const [hl, setHl] = useState<Hl>("all");
  const [n, setN] = useState(3);
  const [shown, setShown] = useState(8);
  const [playing, setPlaying] = useState(false);
  const acc = useRef(0);
  const lab = useLab("math-binomial");
  const vis = useVisible<HTMLDivElement>();

  const total = 2 ** n;
  useFrame(playing && (vis.on || lab.open), dt => {
    if (shown >= total) { setPlaying(false); return; }
    acc.current += dt;
    if (acc.current > 0.55) { acc.current = 0; setShown(shown + 1); }
  });
  const pick = (m: Mode) => { setMode(m); setPlaying(false); };
  const pickN = (v: number) => { setN(v); setShown(2 ** v); setPlaying(false); };

  let svg: React.ReactNode, H = 220, controls: React.ReactNode, note: string;
  const sliders = <Row>
    <Slider label="a" value={a} min={1} max={5} step={0.5} onChange={setA} fmt={num} />
    <Slider label="b" value={b} min={0.5} max={4} step={0.5} onChange={setB} fmt={num} />
  </Row>;

  if (mode === "square") {
    const side = 190, u = side / (a + b), x0 = 70, y0 = 18, A = a * u, B = b * u;
    const piece = (x: number, y: number, w: number, h: number, col: string, label: string, val: number) => (
      <g>
        <rect x={x} y={y} width={w} height={h} fill={col} fillOpacity={0.3} stroke={col} strokeWidth={1.6} />
        <T x={x + w / 2} y={y + h / 2 - (h > 34 ? 3 : -3)} size={12} anchor="middle" color={C.fg} bold>{label}</T>
        {h > 34 && <T x={x + w / 2} y={y + h / 2 + 12} size={9.5} anchor="middle" color={C.fg}>{`= ${num(val)}`}</T>}
      </g>
    );
    H = side + 40;
    svg = <>
      {piece(x0, y0, A, A, KCOL[0], "a²", a * a)}
      {piece(x0 + A, y0, B, A, KCOL[1], "ab", a * b)}
      {piece(x0, y0 + A, A, B, KCOL[1], "ab", a * b)}
      {piece(x0 + A, y0 + A, B, B, KCOL[2], "b²", b * b)}
      <T x={x0 + A / 2} y={y0 + side + 14} size={10} anchor="middle" color={C.sky}>a</T>
      <T x={x0 + A + B / 2} y={y0 + side + 14} size={10} anchor="middle" color={C.amber}>b</T>
      <T x={x0 - 8} y={y0 + A / 2 + 3} size={10} anchor="end" color={C.sky}>a</T>
      <T x={x0 - 8} y={y0 + A + B / 2 + 3} size={10} anchor="end" color={C.amber}>b</T>
      <T x={320} y={60} size={13} color={C.fg} bold>{"(a + b)² = a² + 2ab + b²"}</T>
      <T x={320} y={88} size={11} color={C.muted}>{`(${num(a)} + ${num(b)})² = ${num((a + b) ** 2)}`}</T>
      <T x={320} y={110} size={11} color={C.muted}>{`${num(a * a)} + 2·${num(a * b)} + ${num(b * b)} = ${num((a + b) ** 2)}`}</T>
      <T x={320} y={146} size={10} color={C.red}>{`a² + b² = ${num(a * a + b * b)}`}</T>
      <T x={320} y={162} size={10} color={C.red}>{`${tx(t, "figBnm_missing", "misses the two ab pieces")}: ${num(2 * a * b)}`}</T>
    </>;
    controls = sliders;
    note = tx(t, "figBnm_noteSquare", "A square with side a + b. Its area is (a + b)², and the cuts split it into four pieces: a² at the top left, b² at the bottom right, and two a × b rectangles. That is why (a + b)² has the term 2ab. Writing just a² + b² leaves out the two amber rectangles. Move a and b: the totals on the right always agree.");
  } else if (mode === "cube") {
    const bs = blocks(a, b, gap);
    const pts = bs.flatMap(q => faces(q.o, q.s).flatMap(f => f.pts.map(ISO)));
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    H = 250;
    const sc = Math.min(330 / (maxX - minX), (H - 20) / (maxY - minY));
    const ox = 200 - ((minX + maxX) / 2) * sc, oy = 10 - minY * sc;
    const P = (p: V3) => { const [x, y] = ISO(p); return `${ox + x * sc},${oy + y * sc}`; };
    svg = <>
      {bs.map((q, i) => {
        const on = hl === "all" || +hl === q.k, col = KCOL[q.k];
        return <g key={i} opacity={on ? 1 : 0.13}>
          {faces(q.o, q.s).map((f, j) => <g key={j}>
            <polygon points={f.pts.map(P).join(" ")} fill={col} stroke="var(--code-bg)" strokeWidth={1} />
            {f.shade > 0 && <polygon points={f.pts.map(P).join(" ")} fill="#000" fillOpacity={f.shade} />}
          </g>)}
        </g>;
      })}
      {[0, 1, 2, 3].map(k => <g key={k}>
        <rect x={410} y={42 + k * 34} width={14} height={14} rx={3} fill={KCOL[k]} opacity={hl === "all" || +hl === k ? 1 : 0.25} />
        <T x={432} y={53 + k * 34} size={12} color={C.fg} bold>{`${choose(3, k)} × ${mono(3, k)}`}</T>
        <T x={432} y={66 + k * 34} size={9} color={C.muted}>{`= ${choose(3, k)} × ${num(a ** (3 - k) * b ** k)}`}</T>
      </g>)}
      <T x={410} y={190} size={10} color={C.fg}>{`(${num(a)} + ${num(b)})³ = ${num((a + b) ** 3)}`}</T>
    </>;
    controls = <>
      {sliders}
      <Row>
        <Slider label={tx(t, "figBnm_explode", "pull apart")} value={gap} min={0} max={1.5} step={0.05} onChange={setGap} fmt={v => f2(v, 2)} />
        <Choice value={hl} onChange={setHl} options={[["all", tx(t, "figBnm_all", "all")], ["0", "a³"], ["1", "a²b"], ["2", "ab²"], ["3", "b³"]] as const} />
      </Row>
    </>;
    note = tx(t, "figBnm_noteCube", "A cube with side a + b, cut once along each of its three directions. The cuts make 8 blocks: one a × a × a cube, one b × b × b cube, three slabs a × a × b and three rods a × b × b. So (a + b)³ = a³ + 3a²b + 3ab² + b³. Pull the blocks apart and highlight one kind to count it.");
  } else {
    const ws = words(n), cols = n + 1, cw = W / cols, rowH = 15, top = 40;
    const maxRows = Math.max(...Array.from({ length: cols }, (_, k) => choose(n, k)));
    H = top + maxRows * rowH + 34;
    const seen = Array(cols).fill(0);
    const placed = ws.slice(0, shown).map(w => { const k = [...w].filter(c => c === "b").length; return { w, k, row: seen[k]++ }; });
    svg = <>
      {Array.from({ length: cols }, (_, k) => <g key={k}>
        <rect x={k * cw + 3} y={top - 14} width={cw - 6} height={maxRows * rowH + 8} rx={6} fill={KCOL[k]} fillOpacity={0.07} stroke={KCOL[k]} strokeOpacity={0.4} />
        <T x={k * cw + cw / 2} y={top - 22} size={11} anchor="middle" color={KCOL[k]} bold>{mono(n, k)}</T>
        <T x={k * cw + cw / 2} y={H - 8} size={12} anchor="middle" color={C.fg} bold>{`${seen[k]}`}</T>
      </g>)}
      {placed.map(({ w, k, row }, i) => (
        <text key={w} x={k * cw + cw / 2} y={top + row * rowH} fontSize={11} textAnchor="middle" fontFamily="var(--font-mono, monospace)"
          fontWeight={i === shown - 1 ? 700 : 400}>
          {[...w].map((c, j) => <tspan key={j} fill={c === "a" ? C.sky : C.amber}>{c}</tspan>)}
        </text>
      ))}
    </>;
    const full = shown >= total;
    controls = <>
      <Slider label={tx(t, "figBnm_brackets", "brackets n")} value={n} min={1} max={5} step={1} onChange={pickN} fmt={v => String(v)} />
      <Row>
        <Readout>{`${tx(t, "figBnm_words", "picks")}: ${shown} / 2${sup(n)} = ${total}`}</Readout>
        {full && <Readout color={C.green}>{`(a + b)${sup(n)} = ${Array.from({ length: cols }, (_, k) => `${choose(n, k) === 1 ? "" : choose(n, k)}${mono(n, k)}`).join(" + ")}`}</Readout>}
      </Row>
    </>;
    note = tx(t, "figBnm_noteChoices", "Multiplying out (a + b)ⁿ means taking a or b from each of the n brackets and multiplying what you took. Each pick is written as a word: \"aba\" means a from the first bracket, b from the second, a from the third, and its product is a²b. The words are sorted into columns by how many b's they have. The number under a column is how many picks give that term: its coefficient. Press ▶ to write the 2ⁿ picks one by one.");
  }

  const stage = (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
      {mode === "choices" && (
        <Transport t={t} playing={playing}
          onPlay={() => { if (playing) { setPlaying(false); return; } if (shown >= total) setShown(0); acc.current = 0; setPlaying(true); }}
          playLabel={tx(t, "figBnm_play", "write every pick")}
          onStep={shown < total ? () => { setPlaying(false); setShown(shown + 1); } : undefined}
          onBack={shown > 0 ? () => { setPlaying(false); setShown(shown - 1); } : undefined}
          onReset={() => { setPlaying(false); setShown(0); }}
          readout={`${shown} / ${total}`} />
      )}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[["square", "(a + b)²"], ["cube", "(a + b)³"], ["choices", tx(t, "figBnm_choices", "picks")]] as const} />;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figBnmL1_t", "Four pieces, not two"),
      body: <>
        <p>{tx(t, "figBnmL1_b1", "The square has side a + b, so its area is (a + b)². The cuts give a², b² and two amber rectangles of area ab each.")}</p>
        <p>{tx(t, "figBnmL1_b2", "Make a = 4 and b = 1. Check that 25 = 16 + 2·4 + 1.")}</p>
      </>,
      goal: { text: tx(t, "figBnmL1_g", "Set a = 4 and b = 1."), done: mode === "square" && a === 4 && b === 1 },
      setup: () => { pick("square"); setA(3); setB(2); },
    },
    {
      title: tx(t, "figBnmL2_t", "Quick check"),
      body: <p>{tx(t, "figBnmL2_b", "Use the square with a = x and b = 3.")}</p>,
      quiz: {
        q: tx(t, "figBnmL2_q", "(x + 3)² = ?"),
        options: ["x² + 9", "x² + 6x + 9", "x² + 3x + 9", "x² + 6x + 6"],
        answer: 1,
        why: tx(t, "figBnmL2_w", "a² = x², b² = 9 and each rectangle is 3x, so 2ab = 6x. Leaving out 6x is the most common slip."),
      },
    },
    {
      title: tx(t, "figBnmL3_t", "The cube in eight blocks"),
      body: <>
        <p>{tx(t, "figBnmL3_b1", "A cube of side a + b, cut along all three directions, falls into 8 blocks.")}</p>
        <p>{tx(t, "figBnmL3_b2", "Pull them apart and highlight the a²b slabs: two sides a, one side b.")}</p>
      </>,
      goal: { text: tx(t, "figBnmL3_g", "Pull apart and highlight a²b."), done: mode === "cube" && hl === "1" && gap >= 0.5 },
      setup: () => { pick("cube"); setGap(0); setHl("all"); },
    },
    {
      title: tx(t, "figBnmL4_t", "Quick check"),
      body: <p>{tx(t, "figBnmL4_b", "Highlight the other kinds too and count them.")}</p>,
      quiz: {
        q: tx(t, "figBnmL4_q", "How many ab² rods are there?"),
        options: ["1", "2", "3", "6"],
        answer: 2,
        why: tx(t, "figBnmL4_w", "Three: the single a side can point along x, y or z. So (a + b)³ = a³ + 3a²b + 3ab² + b³."),
      },
    },
    {
      title: tx(t, "figBnmL5_t", "Every pick, written down"),
      body: <>
        <p>{tx(t, "figBnmL5_b1", "(a + b)³ = (a + b)(a + b)(a + b). Multiplying out takes a or b from each bracket: 2 · 2 · 2 = 8 picks.")}</p>
        <p>{tx(t, "figBnmL5_b2", "Write all 8 picks and watch the columns fill.")}</p>
      </>,
      goal: { text: tx(t, "figBnmL5_g", "All 8 picks for n = 3."), done: mode === "choices" && n === 3 && shown === 8 },
      focus: "play",
      setup: () => { pick("choices"); setN(3); setShown(0); },
    },
    {
      title: tx(t, "figBnmL6_t", "One bracket more"),
      body: <p>{tx(t, "figBnmL6_b", "Now four brackets. Fill the columns and read the coefficients.")}</p>,
      goal: { text: tx(t, "figBnmL6_g", "All 16 picks for n = 4."), done: mode === "choices" && n === 4 && shown === 16 },
      setup: () => { pick("choices"); setN(4); setShown(0); },
    },
    {
      title: tx(t, "figBnmL7_t", "Quick check"),
      body: <p>{tx(t, "figBnmL7_b", "Count the picks with exactly two b's.")}</p>,
      quiz: {
        q: tx(t, "figBnmL7_q", "The coefficient of a²b² in (a + b)⁴ is…"),
        options: ["2", "4", "6", "8"],
        answer: 2,
        why: tx(t, "figBnmL7_w", "Six words have two b's: aabb, abab, abba, baab, baba, bbaa. That is choosing 2 of the 4 brackets for b."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "equal", tone: "ok", when: mode === "square" && a === b,
      title: tx(t, "figBnmI1_t", "a = b"),
      body: tx(t, "figBnmI1_b", "With equal sides all four pieces are equal squares, and the two rectangles together are exactly half the area. For any other a and b they are less than half: 2ab ≤ a² + b²."),
    },
    {
      id: "slabs", tone: "info", when: mode === "cube" && hl !== "all",
      title: tx(t, "figBnmI2_t", "Same shape, turned"),
      body: fill(tx(t, "figBnmI2_b", "The {m} blocks are copies of one shape pointing different ways. There are {c} of them: the number of ways to choose which of the 3 directions get side b."), { m: mono(3, +hl), c: choose(3, +hl) }),
    },
    {
      id: "row", tone: "ok", when: mode === "choices" && shown === total,
      title: tx(t, "figBnmI3_t", "A row of Pascal's triangle"),
      body: fill(tx(t, "figBnmI3_b", "The column sizes {row} add up to {tot} = 2{n}: every pick lands in exactly one column."), { row: Array.from({ length: n + 1 }, (_, k) => choose(n, k)).join(", "), tot: total, n: sup(n) }),
    },
  ];

  const title = tx(t, "figBnm_title", "Where the coefficients come from");
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
          tx(t, "figBnmR1", "(a + b)² is a square cut into a², b² and two ab rectangles: a² + 2ab + b²."),
          tx(t, "figBnmR2", "(a + b)³ is a cube cut into 8 blocks: a³ + 3a²b + 3ab² + b³."),
          tx(t, "figBnmR3", "The coefficient of aⁿ⁻ᵏbᵏ counts the picks with b from exactly k of the n brackets."),
        ]}
      />
    </>
  );
}
