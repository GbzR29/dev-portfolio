"use client";

import { useEffect, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, useVisible } from "@/components/lesson/kit/figure";
import { scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// sieve  — the sieve of Eratosthenes on 1…100. Each step takes the next number
//          still standing (a prime) and crosses out its multiples from p².
//          Uncrossed numbers below the next prime's square are known primes.
// factor — trial division of n drawn as a chain: n splits into its smallest
//          prime and the rest, until the rest is prime.
// gcd    — Euclid's algorithm as a rectangle a × b: cut off the largest squares,
//          repeat on the leftover strip; the last square size is gcd(a, b).
// The sieve and Euclid run step by step on the Transport bar; the lab walks
// through all three modes.

type Mode = "sieve" | "factor" | "gcd";
const W = 560;
const SIEVE = [2, 3, 5, 7];                      // 11² > 100, so four rounds finish the job
const STEP_COLS = [C.sky, C.amber, C.green, C.purple, C.pink, C.teal, C.orange, C.red];

function factorise(n: number) {
  const f: number[] = [];
  for (let d = 2; d * d <= n; d++) while (n % d === 0) { f.push(d); n /= d; }
  if (n > 1) f.push(n);
  return f;
}
const sup = (e: number) => String(e).split("").map(c => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+c]).join("");
const powers = (f: number[]) => [...new Set(f)].map(p => { const e = f.filter(x => x === p).length; return e > 1 ? `${p}${sup(e)}` : `${p}`; }).join(" × ");

/** Euclid as square cutting: each step removes q squares of side s from the current strip. */
function euclid(a: number, b: number) {
  type Sq = { x: number; y: number; s: number; step: number };
  const squares: Sq[] = [], lines: string[] = [];
  let x = 0, y = 0, w = a, h = b, step = 0;
  while (w > 0 && h > 0) {
    const s = Math.min(w, h), q = Math.floor(Math.max(w, h) / s), rem = Math.max(w, h) % s;
    for (let i = 0; i < q; i++) squares.push(w >= h ? { x: x + i * s, y, s, step } : { x, y: y + i * s, s, step });
    lines.push(`${Math.max(w, h)} = ${q} × ${s} + ${rem}`);
    if (w >= h) { x += q * s; w = rem; } else { y += q * s; h = rem; }
    step++;
  }
  return { squares, lines, g: squares[squares.length - 1].s };
}

export function DivisibilityFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("sieve");
  const [round, setRound] = useState(0);          // how many sieve primes have been processed
  const [n, setN] = useState(360);
  const [a, setA] = useState(48), [b, setB] = useState(36);
  const [cuts, setCuts] = useState(99);           // Euclid steps shown (all, until ⟲)
  const [playing, setPlaying] = useState(false);
  const [speed] = useFigureSpeed();
  const lab = useLab("math-divisibility");
  const vis = useVisible<HTMLDivElement>();

  const E = euclid(a, b);
  const eSteps = E.lines.length;
  const shownCuts = Math.min(cuts, eSteps);
  const pos = mode === "sieve" ? round : shownCuts;          // where the animated modes stand
  const end = mode === "sieve" ? SIEVE.length : eSteps;
  const setPos = (v: number) => (mode === "sieve" ? setRound(v) : setCuts(v));

  // Playing does one round of the sieve, or one Euclid step, per beat
  useEffect(() => {
    if (!playing || !(vis.on || lab.open)) return;
    if (pos >= end) { setPlaying(false); return; }
    const id = setTimeout(() => setPos(pos + 1), scaledMs(mode === "sieve" ? 1100 : 900, speed));
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, pos, end, speed, vis.on, lab.open, mode]);

  const pick = (m: Mode) => { setMode(m); setPlaying(false); };
  const setAB = (na: number, nb: number) => { setA(na); setB(nb); setCuts(99); setPlaying(false); };

  // ── Drawing and controls per mode ──
  let svg: React.ReactNode, H = 150, controls: React.ReactNode, note: string;
  const f = factorise(n);
  const divisors = Array.from({ length: n }, (_, i) => i + 1).filter(d => n % d === 0);
  const sieveDone = round >= SIEVE.length;
  const next = sieveDone ? 11 : SIEVE[round];
  const crossedBy = (k: number) => SIEVE.slice(0, round).find(p => k >= p * p && k % p === 0) ?? 0;
  const known = Array.from({ length: 100 }, (_, i) => i + 1).filter(k => k > 1 && !crossedBy(k) && k < next * next);

  if (mode === "sieve") {
    const cols = 20, cs = 26, ox = (W - cols * cs) / 2, oy = 10;
    const cur = round > 0 ? SIEVE[round - 1] : 0;
    H = 5 * cs + 20;
    svg = Array.from({ length: 100 }, (_, i) => {
      const k = i + 1, x = ox + (i % cols) * cs, y = oy + Math.floor(i / cols) * cs;
      const by = k > 1 ? crossedBy(k) : 0;
      const prime = k > 1 && !by && k < next * next;
      const fillC = k === 1 ? "transparent" : by === cur && cur ? C.red : prime ? C.green : "transparent";
      const col = k === 1 || by ? C.axis : C.fg;
      return <g key={k}>
        <rect x={x + 1} y={y + 1} width={cs - 2} height={cs - 2} rx={3} fill={fillC} fillOpacity={by === cur && cur ? 0.18 : 0.28}
          stroke={k === cur ? C.amber : C.grid} strokeWidth={k === cur ? 2 : 1} />
        <T x={x + cs / 2} y={y + cs / 2 + 3.5} size={9.5} anchor="middle" color={col} bold={prime}>{String(k)}</T>
        {by > 0 && <line x1={x + 5} y1={y + cs - 5} x2={x + cs - 5} y2={y + 5} stroke={by === cur ? C.red : C.axis} strokeWidth={1.2} />}
      </g>;
    });
    controls = <Row>
      <Readout color={C.green}>{tx(t, "figDiv_known", "known primes")}: {known.length}</Readout>
      <Readout>{sieveDone ? tx(t, "figDiv_all", "11² = 121 > 100: every number left is prime")
        : `${tx(t, "figDiv_below", "certain below")} ${next}² = ${next * next}`}</Readout>
    </Row>;
    note = tx(t, "figDiv_noteSieve2", "Press ⏭ (or ▶) to sieve. Each round takes the smallest number still standing, which must be prime because nothing smaller divides it, and crosses out its multiples in red. Crossing starts at p², since smaller multiples such as 2p or 3p were already crossed by a smaller prime. Green numbers are proven primes: anything uncrossed below the next prime's square has no divisor left to try. After 2, 3, 5 and 7 the job is finished, because 11² is already past 100. 1 is grey: it is not prime.");
  } else if (mode === "factor") {
    const chain: number[] = [n];                  // n, n/p₁, n/(p₁p₂), …, last prime
    for (let i = 0; i < f.length - 1; i++) chain.push(chain[i] / f[i]);
    const step = Math.min(62, (W - 80) / Math.max(1, chain.length - 1));
    const X = (i: number) => 40 + i * step;
    H = 130;
    svg = <>
      {chain.map((v, i) => {
        const last = i === chain.length - 1;
        return <g key={i}>
          {!last && <>
            <line x1={X(i)} y1={34} x2={X(i + 1)} y2={34} stroke={C.axis} />
            <line x1={X(i)} y1={34} x2={X(i) + step / 2} y2={92} stroke={C.axis} />
            <circle cx={X(i) + step / 2} cy={92} r={14} fill={C.green} fillOpacity={0.25} stroke={C.green} />
            <T x={X(i) + step / 2} y={96} size={10} anchor="middle" color={C.fg} bold>{String(f[i])}</T>
          </>}
          <circle cx={X(i)} cy={34} r={last ? 14 : 17} fill={last ? C.green : C.bg} fillOpacity={last ? 0.25 : 1} stroke={last ? C.green : C.sky} />
          <T x={X(i)} y={38} size={v >= 100 ? 9 : 10} anchor="middle" color={C.fg} bold>{String(v)}</T>
        </g>;
      })}
    </>;
    controls = <>
      <Slider label="n" value={n} min={2} max={500} step={1} onChange={setN} fmt={v => String(v)} width="w-40" />
      <Row>
        <Readout color={C.green}>{n} = {f.length === 1 ? tx(t, "figDiv_prime", "prime") : `${f.join(" × ")} = ${powers(f)}`}</Readout>
        <Readout>{divisors.length} {tx(t, "figDiv_divisors", "divisors")}</Readout>
      </Row>
      <Row><Readout color={C.sky}>{divisors.join(", ")}</Readout></Row>
    </>;
    note = tx(t, "figDiv_noteFactor", "Move n. Trial division splits off the smallest prime that divides what is left (green) and continues with the quotient (blue), until the quotient is itself prime. The primes collected along the bottom are the factorisation, and it is the same whatever order you split in. Count them per prime to get the exponents; the number of divisors is the product of (exponent + 1). Primes give a chain of one node: their only divisors are 1 and themselves.");
  } else {
    const shown = E.squares.filter(q => q.step < shownCuts);
    const sc = Math.min((W - 40) / a, 200 / b), ox = (W - a * sc) / 2, oy = 10;
    const last = E.squares[E.squares.length - 1];
    H = b * sc + 20;
    svg = <>
      {shown.map((q, i) => <rect key={i} x={ox + q.x * sc} y={oy + q.y * sc} width={q.s * sc} height={q.s * sc}
        fill={STEP_COLS[q.step % STEP_COLS.length]} fillOpacity={0.3} stroke={STEP_COLS[q.step % STEP_COLS.length]} strokeWidth={1.2} />)}
      <rect x={ox} y={oy} width={a * sc} height={b * sc} fill="none" stroke={C.fg} strokeWidth={1.5} />
      {shownCuts >= eSteps && E.g * sc > 16 && <T x={ox + last.x * sc + (E.g * sc) / 2} y={oy + last.y * sc + (E.g * sc) / 2 + 4} size={10} anchor="middle" color={C.fg} bold>{String(E.g)}</T>}
    </>;
    controls = <>
      <Sliders>
        <Slider label="a" value={a} min={1} max={60} step={1} onChange={v => setAB(v, b)} fmt={v => String(v)} />
        <Slider label="b" value={b} min={1} max={60} step={1} onChange={v => setAB(a, v)} fmt={v => String(v)} />
      </Sliders>
      <Row>{E.lines.slice(0, shownCuts).map((l, i) => <Readout key={i} color={STEP_COLS[i % STEP_COLS.length]}>{l}</Readout>)}</Row>
      {shownCuts >= eSteps && <Row>
        <Readout color={C.green}>gcd({a}, {b}) = {E.g}</Readout>
        <Readout>lcm({a}, {b}) = {a} × {b} / {E.g} = {(a * b) / E.g}</Readout>
        {E.g === 1 && <Readout color={C.amber}>{tx(t, "figDiv_coprime", "coprime")}</Readout>}
      </Row>}
    </>;
    note = tx(t, "figDiv_noteGcd2", "An a × b rectangle. Each step cuts off as many squares with the short side as fit (one colour per step); the strip left over has the short side and the remainder as its sides, which is Euclid's step gcd(a, b) = gcd(b, a mod b). Press ⟲ and then ⏭ to cut one step at a time. The last squares tile their strip exactly, and so, working backwards, they tile every earlier strip and the whole rectangle: their side is the largest square that tiles a × b, the gcd. Coprime sides end with 1 × 1 squares.");
  }

  const stage = (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
      {mode !== "factor" && (
        <Transport t={t} speed playing={playing}
          onPlay={() => { if (playing) { setPlaying(false); return; } if (pos >= end) setPos(0); setPlaying(true); }}
          playLabel={mode === "sieve" ? tx(t, "figDiv_playSieve", "run the sieve") : tx(t, "figDiv_playGcd", "cut the squares")}
          onStep={pos < end ? () => { setPlaying(false); setPos(pos + 1); } : undefined}
          onBack={pos > 0 ? () => { setPlaying(false); setPos(pos - 1); } : undefined}
          onReset={() => { setPlaying(false); setPos(0); }}
          readout={mode === "sieve"
            ? (sieveDone ? tx(t, "figDiv_done", "done") : `${tx(t, "figDiv_sieveBy", "cross out multiples of")} ${next}`)
            : `${tx(t, "figDiv_step", "step")} ${pos} / ${end}`} />
      )}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[["sieve", tx(t, "figDiv_sieve", "sieve")], ["factor", tx(t, "figDiv_factor", "factorise")], ["gcd", tx(t, "figDiv_gcd", "Euclid")]] as const} />;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figDivL1_t", "Sieve out the primes"),
      body: <>
        <p>{tx(t, "figDivL1_b1", "The numbers 1 to 100. 2 is the first prime; cross out every other even number. The next one still standing, 3, must be prime too, because nothing smaller divides it.")}</p>
        <p>{tx(t, "figDivL1_b2", "Run the sieve round by round with ⏭.")}</p>
      </>,
      goal: { text: tx(t, "figDivL1_g", "Finish the sieve (four rounds)."), done: mode === "sieve" && sieveDone },
      focus: "step",
      setup: () => { pick("sieve"); setRound(0); },
    },
    {
      title: tx(t, "figDivL2_t", "Quick check"),
      body: <p>{tx(t, "figDivL2_b", "Look at where the red crossing starts in each round.")}</p>,
      quiz: {
        q: tx(t, "figDivL2_q", "In the round for 7, why does crossing out start at 49 and not at 14?"),
        options: [
          tx(t, "figDivL2_o1", "14, 21, 28, 35, 42 were already crossed by 2, 3 or 5"),
          tx(t, "figDivL2_o2", "14 is not a multiple of 7"),
          tx(t, "figDivL2_o3", "49 is the first prime after 7"),
        ],
        answer: 0,
        why: tx(t, "figDivL2_w", "Each smaller multiple 7 × k has a factor k < 7, so a smaller prime already crossed it out. The first new one is 7 × 7."),
      },
    },
    {
      title: tx(t, "figDivL3_t", "Exactly three divisors"),
      body: <>
        <p>{tx(t, "figDivL3_b1", "Now factorise. Below the chain are the primes; the readout lists every divisor.")}</p>
        <p>{tx(t, "figDivL3_b2", "The number of divisors is (e₁ + 1)(e₂ + 1)… Find a number with exactly 3 divisors.")}</p>
      </>,
      goal: { text: tx(t, "figDivL3_g", "A number with exactly 3 divisors."), done: mode === "factor" && divisors.length === 3 },
      hint: tx(t, "figDivL3_h", "3 can only be written as 2 + 1: a single prime with exponent 2. Try the square of a prime, such as 25 or 49."),
      setup: () => { pick("factor"); setN(360); },
    },
    {
      title: tx(t, "figDivL4_t", "A big prime"),
      body: <p>{tx(t, "figDivL4_b", "A prime gives a chain of a single node. Find a prime bigger than 400.")}</p>,
      goal: { text: tx(t, "figDivL4_g", "A prime above 400."), done: mode === "factor" && n > 400 && f.length === 1 },
      hint: tx(t, "figDivL4_h", "Skip the even numbers and the ones ending in 5. 401 is a good place to start."),
      setup: () => { pick("factor"); setN(400); },
    },
    {
      title: tx(t, "figDivL5_t", "Euclid cuts squares"),
      body: <>
        <p>{tx(t, "figDivL5_b1", "A 48 × 36 rectangle. Cut off the biggest square that fits (36 × 36); a 12 × 36 strip is left. Cut squares from that strip, and so on.")}</p>
        <p>{tx(t, "figDivL5_b2", "Each cut is one line of Euclid's algorithm. Step through it.")}</p>
      </>,
      goal: { text: tx(t, "figDivL5_g", "Cut 48 × 36 to the end."), done: mode === "gcd" && a === 48 && b === 36 && shownCuts >= eSteps },
      focus: "step",
      setup: () => { pick("gcd"); setA(48); setB(36); setCuts(0); },
    },
    {
      title: tx(t, "figDivL6_t", "Down to 1 × 1"),
      body: <p>{tx(t, "figDivL6_b", "When the last squares are 1 × 1, the gcd is 1 and the numbers are coprime: they share no factor. Find two coprime numbers, both above 20.")}</p>,
      goal: { text: tx(t, "figDivL6_g", "a, b > 20 with gcd 1."), done: mode === "gcd" && a > 20 && b > 20 && E.g === 1 },
      hint: tx(t, "figDivL6_h", "Two numbers next to each other are always coprime: 34 and 35."),
      setup: () => { pick("gcd"); setAB(48, 36); },
    },
    {
      title: tx(t, "figDivL7_t", "Quick check"),
      body: <p>{tx(t, "figDivL7_b", "Do Euclid by hand.")}</p>,
      quiz: {
        q: tx(t, "figDivL7_q", "gcd(84, 36) = ?"),
        options: ["12", "6", "4", "252"],
        answer: 0,
        why: tx(t, "figDivL7_w", "84 = 2 × 36 + 12, then 36 = 3 × 12 + 0. The last non-zero remainder is 12. (252 is the lcm: 84 × 36 / 12.)"),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "round", tone: "info", when: mode === "sieve" && round > 0 && !sieveDone,
      title: fill(tx(t, "figDivI1_t", "Round {r}: multiples of {p}"), { r: round, p: SIEVE[round - 1] }),
      body: fill(tx(t, "figDivI1_b", "Crossing starts at {p}² = {pp}. Every number below {nn} that is still standing is now certainly prime."), { p: SIEVE[round - 1], pp: SIEVE[round - 1] ** 2, nn: next * next }),
    },
    {
      id: "sieved", tone: "ok", when: mode === "sieve" && sieveDone,
      title: tx(t, "figDivI2_t", "25 primes below 100"),
      body: tx(t, "figDivI2_b", "Four rounds were enough: a composite number up to 100 has a factor no bigger than √100 = 10, so it was crossed by 2, 3, 5 or 7."),
    },
    {
      id: "square", tone: "info", when: mode === "factor" && divisors.length % 2 === 1 && n > 1,
      title: tx(t, "figDivI3_t", "An odd number of divisors"),
      body: fill(tx(t, "figDivI3_b", "Divisors come in pairs d and n/d, except when d = n/d. That happens only for a perfect square: {n} = {r}²."), { n, r: Math.round(Math.sqrt(n)) }),
    },
    {
      id: "prime", tone: "ok", when: mode === "factor" && f.length === 1,
      title: tx(t, "figDivI4_t", "A prime"),
      body: fill(tx(t, "figDivI4_b", "No prime up to √{n} ≈ {s} divides {n}, so its only divisors are 1 and itself."), { n, s: Math.floor(Math.sqrt(n)) }),
    },
    {
      id: "coprime", tone: "ok", when: mode === "gcd" && shownCuts >= eSteps && E.g === 1,
      title: tx(t, "figDivI5_t", "Coprime"),
      body: fill(tx(t, "figDivI5_b", "gcd({a}, {b}) = 1: they share no prime factor, so lcm = a × b = {l}."), { a, b, l: a * b }),
    },
    {
      id: "divides", tone: "info", when: mode === "gcd" && E.g === Math.min(a, b) && a !== b,
      title: tx(t, "figDivI6_t", "One divides the other"),
      body: fill(tx(t, "figDivI6_b", "{s} fits into {l} exactly, so one step finishes: the gcd is the smaller number, {s}."), { s: Math.min(a, b), l: Math.max(a, b) }),
    },
  ];

  const title = tx(t, "figDiv_title", "Primes, factors and the gcd");
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
          tx(t, "figDivR1", "The sieve crosses out the multiples of each prime from p²; up to 100, the primes 2, 3, 5 and 7 are enough."),
          tx(t, "figDivR2", "Every number splits into primes in one way only; the number of divisors is (e₁ + 1)(e₂ + 1)…"),
          tx(t, "figDivR3", "Euclid: gcd(a, b) = gcd(b, a mod b), until the remainder is 0."),
          tx(t, "figDivR4", "gcd × lcm = a × b; coprime numbers have gcd 1."),
        ]}
      />
    </>
  );
}
