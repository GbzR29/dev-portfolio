"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, C, T, mulberry32 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Three views of pseudo-random numbers:
//   pairs  — plot consecutive outputs (xᵢ, xᵢ₊₁). A weak linear congruential
//            generator puts every pair on a few parallel lines; a good
//            generator fills the square evenly.
//   seeds  — the same seed always gives the same sequence (a level, a loot
//            roll, a replay); a different seed gives an unrelated one.
//   shapes — how combining uniform numbers changes the distribution: sums
//            pile up in the middle, min() leans low, a weighted table picks
//            items by probability.

type Mode = "pairs" | "seeds" | "shapes";
type Shape = "uniform" | "sum2" | "sum3" | "sum12" | "min2" | "table";

/** A deliberately poor LCG: xₙ₊₁ = (13·xₙ + 1) mod 4096. */
function badLcg(seed: number) {
  let x = seed % 4096;
  return () => { x = (13 * x + 1) % 4096; return x / 4096; };
}

const LOOT = [["common", 0.62, C.muted], ["uncommon", 0.25, C.green], ["rare", 0.1, C.sky], ["epic", 0.03, C.purple]] as const;

export function RandomFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("pairs");
  const [gen, setGen] = useState<"lcg" | "good">("lcg");
  const [seed, setSeed] = useState(42);
  const [shape, setShape] = useState<Shape>("sum3");
  const [n, setN] = useState(2000);

  const W = 560, H = 250;
  const pairs = useMemo(() => {
    const r = gen === "lcg" ? badLcg(seed) : mulberry32(seed);
    const out: [number, number][] = [];
    let prev = r();
    for (let i = 0; i < n; i++) { const x = r(); out.push([prev, x]); prev = x; }
    return out;
  }, [gen, seed, n]);

  const bins = 40;
  const hist = useMemo(() => {
    const r = mulberry32(seed * 7 + 1), h = new Array(bins).fill(0);
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < n * 5; i++) {
      let v = 0;
      if (shape === "uniform") v = r();
      else if (shape === "sum2") v = (r() + r()) / 2;
      else if (shape === "sum3") v = (r() + r() + r()) / 3;
      else if (shape === "sum12") { for (let k = 0; k < 12; k++) v += r(); v /= 12; }
      else if (shape === "min2") v = Math.min(r(), r());
      else {
        // Weighted table: walk the cumulative weights until the roll falls inside one
        let roll = r(), k = 0;
        while (k < LOOT.length - 1 && roll >= LOOT[k][1]) { roll -= LOOT[k][1]; k++; }
        counts[k]++;
        continue;
      }
      h[Math.min(bins - 1, Math.floor(v * bins))]++;
    }
    return { h, counts, total: n * 5 };
  }, [shape, seed, n]);

  const seq = useMemo(() => {
    const r = mulberry32(seed);
    return Array.from({ length: 48 }, () => r());
  }, [seed]);

  const sq = 220, ox = 20, oy = 16;
  return (
    <Figure
      title={tx(t, "figRand_title", "Pseudo-random numbers up close")}
      head={<Choice value={mode} onChange={setMode} options={[["pairs", tx(t, "figRand_pairs", "pairs")], ["seeds", tx(t, "figRand_seeds", "seeds")], ["shapes", tx(t, "figRand_shapes", "distributions")]] as const} />}
      controls={<>
        {mode === "pairs" && <Row>
          <Btn active={gen === "lcg"} onClick={() => setGen("lcg")}>{tx(t, "figRand_lcg", "weak LCG (13x + 1) mod 4096")}</Btn>
          <Btn active={gen === "good"} onClick={() => setGen("good")}>mulberry32</Btn>
          <div className="flex-1 min-w-[200px]"><Slider label={tx(t, "figRand_n", "samples")} value={n} min={200} max={4000} step={100} onChange={setN} fmt={v => `${v}`} /></div>
        </Row>}
        {mode === "seeds" && <Row>
          <div className="flex-1 min-w-[220px]"><Slider label="seed" value={seed} min={0} max={100} step={1} onChange={setSeed} fmt={v => `${v}`} /></div>
          <Btn onClick={() => setSeed(42)}>seed = 42</Btn>
        </Row>}
        {mode === "shapes" && <Row>
          {([["uniform", "r"], ["sum2", "(r+r)/2"], ["sum3", "(r+r+r)/3"], ["sum12", "Σ₁₂ r / 12"], ["min2", "min(r, r)"], ["table", tx(t, "figRand_table", "loot table")]] as const).map(([k, l]) =>
            <Btn key={k} active={shape === k} onClick={() => setShape(k)}>{l}</Btn>)}
        </Row>}
      </>}
      note={mode === "pairs"
        ? tx(t, "figRand_notePairs", "Each dot is two consecutive numbers from the generator, used as (x, y). A linear congruential generator computes the next number as a straight-line function of the previous one, wrapped around, so all pairs fall on a handful of parallel lines: the gaps between them are places your game can never spawn anything. The weak LCG also repeats after at most 4096 numbers. mulberry32 mixes its 32-bit state with multiplies and shifts and fills the square evenly.")
        : mode === "seeds"
          ? tx(t, "figRand_noteSeeds", "A PRNG is a deterministic function: the seed picks the starting state and everything after it follows. Move the slider away and back to 42: the bars come back exactly. That is what lets a game regenerate a level from one number, replay a match from recorded inputs, or let players share a world seed. It also means the seed must be stored, not the output.")
          : tx(t, "figRand_noteShapes", "Every bar chart uses 5 × the sample count. Averaging several uniform numbers makes values near the middle more likely (the central limit theorem: with 12 it is already close to a bell curve). min(r, r) leans towards 0: good for \"usually small, sometimes big\". A loot table maps one uniform roll to items with chosen probabilities by walking the cumulative weights.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {mode === "pairs" && <>
          <rect x={ox} y={oy} width={sq} height={sq} fill="var(--code-surface)" stroke="var(--code-border)" />
          {pairs.map(([a, b], i) => <rect key={i} x={ox + a * sq - 0.9} y={oy + (1 - b) * sq - 0.9} width={1.8} height={1.8} fill={gen === "lcg" ? C.red : C.green} />)}
          <T x={ox} y={oy + sq + 12} size={8.5}>xᵢ →</T>
          <T x={ox + sq + 4} y={oy + 8} size={8.5}>↑ xᵢ₊₁</T>
          <g transform={`translate(${ox + sq + 40}, ${oy})`}>
            <T x={0} y={10} size={9} color={C.fg}>{tx(t, "figRand_first", "first outputs")}</T>
            {pairs.slice(0, 10).map(([a], i) => <T key={i} x={0} y={30 + i * 17} size={9}>{`x${i} = ${a.toFixed(5)}`}</T>)}
          </g>
        </>}
        {mode === "seeds" && <>
          <T x={20} y={20} size={9} color={C.fg}>{`mulberry32(${seed}) → 48 ${tx(t, "figRand_vals", "values")}`}</T>
          {seq.map((v, i) => {
            const bw = (W - 40) / seq.length;
            return <rect key={i} x={20 + i * bw + 1} y={H - 24 - v * 190} width={bw - 2} height={v * 190} rx={1.5} fill={seed === 42 ? C.teal : C.sky} />;
          })}
          <line x1={20} x2={W - 20} y1={H - 24} y2={H - 24} stroke={C.axis} />
        </>}
        {mode === "shapes" && (shape === "table" ? <>
          {LOOT.map(([name, p, col], i) => {
            const got = hist.counts[i] / hist.total, bw = 90, x = 40 + i * 130;
            return (
              <g key={name}>
                <rect x={x} y={H - 30 - got * 300} width={bw} height={got * 300} rx={3} fill={col} opacity={0.85} />
                <line x1={x - 4} x2={x + bw + 4} y1={H - 30 - p * 300} y2={H - 30 - p * 300} stroke={C.fg} strokeDasharray="3 2" />
                <T x={x + bw / 2} y={H - 14} size={9} anchor="middle" color={C.fg}>{name}</T>
                <T x={x + bw / 2} y={H - 36 - Math.max(got, p) * 300} size={8.5} anchor="middle">{`${(got * 100).toFixed(1)}% (${(p * 100).toFixed(0)}%)`}</T>
              </g>
            );
          })}
        </> : <>
          {(() => {
            const max = Math.max(...hist.h);
            const bw = (W - 40) / bins;
            return hist.h.map((c, i) => <rect key={i} x={20 + i * bw + 1} y={H - 24 - (c / max) * 200} width={bw - 2} height={(c / max) * 200} rx={1.5} fill={C.purple} opacity={0.85} />);
          })()}
          <line x1={20} x2={W - 20} y1={H - 24} y2={H - 24} stroke={C.axis} />
          <T x={20} y={H - 10} size={8.5}>0</T>
          <T x={W / 2} y={H - 10} size={8.5} anchor="middle">0.5</T>
          <T x={W - 20} y={H - 10} size={8.5} anchor="end">1</T>
        </>)}
      </svg>
      {mode === "shapes" && shape !== "table" && <div className="px-4 pb-2 -mt-1"><Readout>{tx(t, "figRand_count", "samples")}: {hist.total}</Readout></div>}
    </Figure>
  );
}
