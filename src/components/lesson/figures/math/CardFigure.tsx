"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Btn, Choice, C, T, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A standard deck of 52 cards, one suit per row. Two events A and B pick out
// cards: blue cells are in A only, amber in B only, purple in both. The
// readouts check the addition rule |A ∪ B| = |A| + |B| − |A ∩ B|: the purple
// cards would otherwise be counted twice. "Given B" dims every card outside B,
// because knowing that B happened makes B the new set of possible outcomes:
// P(A | B) = |A ∩ B| / |B|. When that equals P(A), the events are independent.

type Ev = "heart" | "red" | "spade" | "face" | "ace" | "low" | "even" | "king";
const EV: Record<Ev, (s: number, r: number) => boolean> = {
  heart: s => s === 1,
  red: s => s === 1 || s === 2,
  spade: s => s === 0,
  face: (_, r) => r >= 10,
  ace: (_, r) => r === 0,
  low: (_, r) => r <= 4,
  even: (_, r) => r >= 1 && r <= 9 && r % 2 === 1,
  king: (_, r) => r === 12,
};
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const W = 560, CW = 40, CH = 40, X0 = 24, Y0 = 8, H = Y0 + 4 * (CH + 6) + 2;

/** |A|, |B| and |A ∩ B| over the whole deck. */
function sizes(a: Ev, b: Ev) {
  let nA = 0, nB = 0, nAB = 0;
  for (let s = 0; s < 4; s++) for (let r = 0; r < 13; r++) {
    const inA = EV[a](s, r), inB = EV[b](s, r);
    if (inA) nA++;
    if (inB) nB++;
    if (inA && inB) nAB++;
  }
  return [nA, nB, nAB];
}

export function CardFigure({ t }: { t?: TrackTranslations }) {
  const [a, setA] = useState<Ev>("heart");
  const [b, setB] = useState<Ev>("face");
  const [given, setGiven] = useState(false);

  const opts: [Ev, string][] = [
    ["heart", tx(t, "figCards_heart", "heart ♥")],
    ["red", tx(t, "figCards_red", "red")],
    ["spade", tx(t, "figCards_spade", "spade ♠")],
    ["face", tx(t, "figCards_face", "face card")],
    ["ace", tx(t, "figCards_ace", "ace")],
    ["low", tx(t, "figCards_low", "A to 5")],
    ["even", tx(t, "figCards_even", "even number")],
    ["king", tx(t, "figCards_king", "king")],
  ];

  const [nA, nB, nAB] = sizes(a, b);
  const pAgB = nAB / nB, pA = nA / 52, indep = Math.abs(pAgB - pA) < 1e-9;

  return (
    <Figure
      title={tx(t, "figCards_title", "Events in a deck of cards")}
      head={<Btn active={given} onClick={() => setGiven(v => !v)}>{tx(t, "figCards_given", "given B")}</Btn>}
      controls={<>
        <Row><span className="text-[10px] font-mono font-bold w-5" style={{ color: C.blue }}>A</span><Choice value={a} onChange={setA} options={opts} /></Row>
        <Row><span className="text-[10px] font-mono font-bold w-5" style={{ color: C.amber }}>B</span><Choice value={b} onChange={setB} options={opts} /></Row>
        {!given ? (
          <Row>
            <Readout color={C.blue}>{`|A| = ${nA}`}</Readout>
            <Readout color={C.amber}>{`|B| = ${nB}`}</Readout>
            <Readout color={C.purple}>{`|A ∩ B| = ${nAB}`}</Readout>
            <Readout>{`P(A ∪ B) = (${nA} + ${nB} − ${nAB})/52 = ${nA + nB - nAB}/52 = ${f2((nA + nB - nAB) / 52, 3)}`}</Readout>
          </Row>
        ) : (
          <Row>
            <Readout color={C.purple}>{`P(A | B) = |A ∩ B|/|B| = ${nAB}/${nB} = ${f2(pAgB, 3)}`}</Readout>
            <Readout color={C.blue}>{`P(A) = ${nA}/52 = ${f2(pA, 3)}`}</Readout>
            <Readout color={indep ? C.green : C.red}>{indep ? tx(t, "figCards_indep", "equal: independent") : tx(t, "figCards_dep", "different: dependent")}</Readout>
          </Row>
        )}
      </>}
      note={tx(t, "figCards_note", "All 52 cards are equally likely to be drawn, so the probability of an event is its number of cards over 52. Purple cards belong to both events; adding |A| and |B| counts them twice, which is why the addition rule subtracts |A ∩ B| once. Turn on \"given B\": only the B cards remain possible, and the chance of A becomes the purple share of them. Try heart given face card (independent) and heart given red (dependent).")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {SUITS.map((su, s) => <T key={su} x={X0 - 8} y={Y0 + s * (CH + 6) + CH / 2 + 4} anchor="end" color={s === 1 || s === 2 ? C.red : C.fg} size={13}>{su}</T>)}
        {SUITS.map((su, s) => RANKS.map((rk, r) => {
          const inA = EV[a](s, r), inB = EV[b](s, r);
          const col = inA && inB ? C.purple : inA ? C.blue : inB ? C.amber : null;
          const dim = given && !inB;
          const x = X0 + r * CW + 2, y = Y0 + s * (CH + 6);
          return (
            <g key={`${s}-${r}`} opacity={dim ? 0.18 : 1}>
              <rect x={x} y={y} width={CW - 4} height={CH} rx={5}
                fill={col ?? "var(--surface)"} fillOpacity={col ? 0.3 : 1} stroke={col ?? "var(--border)"} strokeWidth={col ? 1.6 : 1} />
              <T x={x + (CW - 4) / 2} y={y + 17} anchor="middle" color={s === 1 || s === 2 ? C.red : C.fg} bold size={11}>{rk}</T>
              <T x={x + (CW - 4) / 2} y={y + 32} anchor="middle" color={s === 1 || s === 2 ? C.red : C.fg} size={11}>{su}</T>
            </g>
          );
        }))}
      </svg>
    </Figure>
  );
}
