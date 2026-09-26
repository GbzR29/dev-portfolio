"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, Sliders, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// sieve  — the sieve of Eratosthenes on 1…100. Each step takes the next number
//          still standing (a prime) and crosses out its multiples from p².
//          Uncrossed numbers below the next prime's square are known primes.
// factor — trial division of n drawn as a chain: n splits into its smallest
//          prime and the rest, until the rest is prime.
// gcd    — Euclid's algorithm as a rectangle a × b: cut off the largest squares,
//          repeat on the leftover strip; the last square size is gcd(a, b).

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

export function DivisibilityFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("sieve");
  const [round, setRound] = useState(0);          // how many sieve primes have been processed
  const [n, setN] = useState(360);
  const [a, setA] = useState(48), [b, setB] = useState(36);

  let svg: React.ReactNode, H = 150, controls: React.ReactNode, note: string;

  if (mode === "sieve") {
    const cols = 20, cs = 26, ox = (W - cols * cs) / 2, oy = 10;
    const done = round >= SIEVE.length;
    const next = done ? 11 : SIEVE[round];
    const cur = round > 0 ? SIEVE[round - 1] : 0;
    const crossedBy = (k: number) => SIEVE.slice(0, round).find(p => k >= p * p && k % p === 0) ?? 0;
    H = 5 * cs + 20;
    svg = Array.from({ length: 100 }, (_, i) => {
      const k = i + 1, x = ox + (i % cols) * cs, y = oy + Math.floor(i / cols) * cs;
      const by = k > 1 ? crossedBy(k) : 0;
      const prime = k > 1 && !by && k < next * next;
      const fill = k === 1 ? "transparent" : by === cur && cur ? C.red : prime ? C.green : "transparent";
      const col = k === 1 || by ? C.axis : C.fg;
      return <g key={k}>
        <rect x={x + 1} y={y + 1} width={cs - 2} height={cs - 2} rx={3} fill={fill} fillOpacity={by === cur && cur ? 0.18 : 0.28}
          stroke={k === cur ? C.amber : C.grid} strokeWidth={k === cur ? 2 : 1} />
        <T x={x + cs / 2} y={y + cs / 2 + 3.5} size={9.5} anchor="middle" color={col} bold={prime}>{String(k)}</T>
        {by > 0 && <line x1={x + 5} y1={y + cs - 5} x2={x + cs - 5} y2={y + 5} stroke={by === cur ? C.red : C.axis} strokeWidth={1.2} />}
      </g>;
    });
    const primes = Array.from({ length: 100 }, (_, i) => i + 1).filter(k => k > 1 && !crossedBy(k) && k < next * next);
    controls = <Row>
      <Btn onClick={() => setRound(Math.min(round + 1, SIEVE.length))}>{done ? tx(t, "figDiv_done", "done") : `${tx(t, "figDiv_sieveBy", "cross out multiples of")} ${next}`}</Btn>
      <Btn onClick={() => setRound(0)}>{tx(t, "figDiv_reset", "reset")}</Btn>
      <Readout color={C.green}>{tx(t, "figDiv_known", "known primes")}: {primes.length}</Readout>
      <Readout>{done ? tx(t, "figDiv_all", "11² = 121 > 100: every number left is prime")
        : `${tx(t, "figDiv_below", "certain below")} ${next}² = ${next * next}`}</Readout>
    </Row>;
    note = tx(t, "figDiv_noteSieve", "Press the button to sieve. Each round takes the smallest number still standing, which must be prime because nothing smaller divides it, and crosses out its multiples in red. Crossing starts at p², since smaller multiples such as 2p or 3p were already crossed by a smaller prime. Green numbers are proven primes: anything uncrossed below the next prime's square has no divisor left to try. After 2, 3, 5 and 7 the job is finished, because 11² is already past 100. 1 is grey: it is not prime.");
  } else if (mode === "factor") {
    const f = factorise(n);
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
    const divisors = Array.from({ length: n }, (_, i) => i + 1).filter(d => n % d === 0);
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
    // Euclid as square cutting: each step removes q squares of side s from the current strip
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
    const g = squares[squares.length - 1].s;
    const sc = Math.min((W - 40) / a, 200 / b), ox = (W - a * sc) / 2, oy = 10;
    H = b * sc + 20;
    svg = <>
      {squares.map((q, i) => <rect key={i} x={ox + q.x * sc} y={oy + q.y * sc} width={q.s * sc} height={q.s * sc}
        fill={STEP_COLS[q.step % STEP_COLS.length]} fillOpacity={0.3} stroke={STEP_COLS[q.step % STEP_COLS.length]} strokeWidth={1.2} />)}
      <rect x={ox} y={oy} width={a * sc} height={b * sc} fill="none" stroke={C.fg} strokeWidth={1.5} />
      {g * sc > 16 && <T x={ox + squares[squares.length - 1].x * sc + (g * sc) / 2} y={oy + squares[squares.length - 1].y * sc + (g * sc) / 2 + 4} size={10} anchor="middle" color={C.fg} bold>{String(g)}</T>}
    </>;
    controls = <>
      <Sliders>
        <Slider label="a" value={a} min={1} max={60} step={1} onChange={setA} fmt={v => String(v)} />
        <Slider label="b" value={b} min={1} max={60} step={1} onChange={setB} fmt={v => String(v)} />
      </Sliders>
      <Row>{lines.map((l, i) => <Readout key={i} color={STEP_COLS[i % STEP_COLS.length]}>{l}</Readout>)}</Row>
      <Row>
        <Readout color={C.green}>gcd({a}, {b}) = {g}</Readout>
        <Readout>lcm({a}, {b}) = {a} × {b} / {g} = {(a * b) / g}</Readout>
        {g === 1 && <Readout color={C.amber}>{tx(t, "figDiv_coprime", "coprime")}</Readout>}
      </Row>
    </>;
    note = tx(t, "figDiv_noteGcd", "An a × b rectangle. Cut off as many squares with the short side as fit (one colour per step); the strip left over has the short side and the remainder as its sides, which is Euclid's step gcd(a, b) = gcd(b, a mod b). Repeat until nothing is left. The last squares tile their strip exactly, and so, working backwards, they tile every earlier strip and the whole rectangle: their side is the largest square that tiles a × b, the gcd. Coprime sides end with 1 × 1 squares.");
  }

  return (
    <Figure
      title={tx(t, "figDiv_title", "Primes, factors and the gcd")}
      head={<Choice value={mode} onChange={setMode} options={[["sieve", tx(t, "figDiv_sieve", "sieve")], ["factor", tx(t, "figDiv_factor", "factorise")], ["gcd", tx(t, "figDiv_gcd", "Euclid")]] as const} />}
      controls={controls}
      note={note}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
