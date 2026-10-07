"use client";

import { useEffect, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, useVisible } from "@/components/lesson/kit/figure";
import { scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import { gcd } from "./FractionFigure";

// ── What this figure shows ────────────────────────────────────────────────────
// Long division of n by d, one digit at a time, in base 10 or base 2. Each
// step multiplies the remainder by the base, the next digit is how many times
// d fits, and the new remainder is what is left. There are only d possible
// remainders, so either one of them is 0 (the expansion ends) or one repeats,
// and from then on the digits repeat too. The expansion ends exactly when the
// reduced denominator has no prime factors other than those of the base.

const MAX = 24;

function expand(n: number, d: number, base: number) {
  const whole = Math.floor(n / d);
  let r = n % d;
  const digits: { r: number; digit: number }[] = [];
  const seen = new Map<number, number>();
  let cycle = -1;
  while (r !== 0 && digits.length < MAX) {
    if (seen.has(r)) { cycle = seen.get(r)!; break; }
    seen.set(r, digits.length);
    const digit = Math.floor((r * base) / d);
    digits.push({ r, digit });
    r = (r * base) % d;
  }
  return { whole, digits, cycle, ends: r === 0 };
}

/** Splits d into the base's primes and the rest, e.g. 40 → "2³·5¹ × 1"; rest 1 ⇒ the expansion ends. */
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
function split(d: number, base: number) {
  const parts = (base === 10 ? [2, 5] : [2]).map(p => {
    let e = 0;
    while (d % p === 0) { d /= p; e++; }
    return `${p}${String(e).split("").map(c => SUP[+c]).join("")}`;
  });
  return { rest: d, text: `${parts.join("·")} × ${d}` };
}

export function DecimalFigure({ t }: { t?: TrackTranslations }) {
  const [n, setN] = useState(1);
  const [d, setD] = useState(7);
  const [base, setBase] = useState<"10" | "2">("10");
  const [shown, setShown] = useState(MAX);              // digits revealed so far (all, until ⟲)
  const [playing, setPlaying] = useState(false);
  const [speed] = useFigureSpeed();
  const vis = useVisible<HTMLDivElement>();
  const B = Number(base);
  const { whole, digits, cycle, ends } = expand(n, d, B);
  const g = gcd(n, d), dr = d / g, fac = split(dr, B);
  const wholeStr = B === 10 ? `${whole}` : whole.toString(2);
  const total = digits.length;
  const k = Math.min(shown, total);                      // digits on screen
  const all = k >= total;
  // A new fraction is shown whole; ⟲ then ▶ or ⏭ replays it one digit at a time
  const change = (f: () => void) => { f(); setShown(MAX); setPlaying(false); };

  // Playing reveals one more digit per beat
  useEffect(() => {
    if (!playing || !vis.on) return;
    if (k >= total) { setPlaying(false); return; }
    const id = setTimeout(() => setShown(Math.min(total, k + 1)), scaledMs(700, speed));
    return () => clearTimeout(id);
  }, [playing, k, total, speed, vis.on]);

  const W = 560, cw = 19, x0 = 90;
  const text = `${wholeStr}.` + digits.map((q, i) => (i === cycle ? "(" : "") + q.digit).join("") + (cycle >= 0 ? ")" : ends ? "" : "…");

  return (
    <Figure
      title={tx(t, "figDec_title", "Long division, digit by digit")}
      head={<Choice value={base} onChange={v => change(() => setBase(v))} options={[["10", tx(t, "figDec_b10", "base 10")], ["2", tx(t, "figDec_b2", "base 2")]] as const} />}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figDec_n", "numerator n")} value={n} min={1} max={40} step={1} onChange={v => change(() => setN(v))} fmt={v => `${v}`} width="w-28" />
          <Slider label={tx(t, "figDec_d", "denominator d")} value={d} min={1} max={40} step={1} onChange={v => change(() => setD(v))} fmt={v => `${v}`} width="w-28" />
        </Sliders>
        <Row>
          <Readout color={C.fg}>{n}/{d} = {digits.length ? text : wholeStr}{B === 2 ? " ₂" : ""}</Readout>
          <Readout color={ends ? C.green : C.amber}>
            {ends ? tx(t, "figDec_ends", "terminates")
              : cycle >= 0 ? `${tx(t, "figDec_repeats", "repeats every")} ${digits.length - cycle} ${tx(t, "figDec_digits", "digits")}`
                : tx(t, "figDec_long", "repeats, period longer than shown")}
          </Readout>
          <Readout>{tx(t, "figDec_reduced", "reduced")}: {n / g}/{dr}; {dr} = {fac.text}</Readout>
        </Row>
      </>}
      note={tx(t, "figDec_note2", "Each column is one step of long division. The small number under a digit is the remainder before that step: multiply it by the base, see how many times d fits (that is the digit), keep what is left. Press ⟲ and then ⏭ to redo it one digit at a time. Only the remainders 0 … d − 1 exist, so within d steps a remainder must either be 0, and the expansion ends, or repeat, and then every later digit repeats too (amber). An expansion ends exactly when the reduced denominator is built only from the base's prime factors: 2 and 5 in base 10, only 2 in base 2. That is why 1/10 ends in base 10 but repeats forever in base 2.")}
    >
      <div ref={vis.ref}>
      <svg viewBox={`0 0 ${W} 96`} className="w-full h-auto">
        <T x={x0 - 8} y={44} size={14} anchor="end" color={C.fg} bold>{`${wholeStr}.`}</T>
        {digits.slice(0, k).map((q, i) => {
          const rep = all && cycle >= 0 && i >= cycle;
          const x = x0 + i * cw;
          return (
            <g key={i}>
              <rect x={x} y={26} width={cw - 3} height={26} rx={4} fill={rep ? C.amber : C.sky} fillOpacity={rep ? 0.3 : 0.15} stroke={rep ? C.amber : C.sky} strokeOpacity={0.6} />
              <T x={x + (cw - 3) / 2} y={44} size={13} anchor="middle" color={C.fg} bold>{q.digit}</T>
              <T x={x + (cw - 3) / 2} y={66} size={7.5} anchor="middle" color={rep ? C.amber : C.axis}>{q.r}</T>
            </g>
          );
        })}
        {all && cycle >= 0 && <line x1={x0 + cycle * cw} x2={x0 + digits.length * cw - 3} y1={20} y2={20} stroke={C.amber} strokeWidth={2} />}
        {all && !ends && cycle < 0 && <T x={x0 + digits.length * cw + 4} y={44} size={13} color={C.muted}>…</T>}
        {!all && <T x={x0 + k * cw + 4} y={66} size={7.5} color={C.amber}>{`${tx(t, "figDec_nextRem", "next")}: ${digits[k].r} × ${B} = ${digits[k].r * B}`}</T>}
        {digits.length === 0 && <T x={x0} y={44} size={11} color={C.green}>{tx(t, "figDec_whole", "a whole number: nothing left over")}</T>}
        <T x={x0 - 8} y={66} size={7.5} anchor="end">{tx(t, "figDec_rem", "remainder")}</T>
        <T x={x0 - 8} y={86} size={8} anchor="end">{`× ${B} ÷ ${d}`}</T>
        <T x={x0} y={86} size={8}>{tx(t, "figDec_how", "each step: remainder × base, digit = how many d fit, new remainder = what is left")}</T>
      </svg>
      {total > 0 && (
        <Transport t={t} speed playing={playing}
          onPlay={() => { if (playing) { setPlaying(false); return; } if (all) setShown(0); setPlaying(true); }}
          playLabel={tx(t, "figDec_play", "divide digit by digit")}
          onStep={!all ? () => { setPlaying(false); setShown(k + 1); } : undefined}
          onBack={k > 0 ? () => { setPlaying(false); setShown(k - 1); } : undefined}
          onReset={() => { setPlaying(false); setShown(0); }}
          readout={`${tx(t, "figDec_digits", "digits")}: ${k} / ${total}${cycle < 0 && !ends ? "+" : ""}`} />
      )}
      </div>
    </Figure>
  );
}
