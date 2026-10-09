"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Btn, Choice, C, T, f2 } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// A standard deck of 52 cards, one suit per row. Two events A and B pick out
// cards: blue cells are in A only, amber in B only, purple in both. The
// readouts check the addition rule |A ∪ B| = |A| + |B| − |A ∩ B|: the purple
// cards would otherwise be counted twice. "Given B" dims every card outside B,
// because knowing that B happened makes B the new set of possible outcomes:
// P(A | B) = |A ∩ B| / |B|. When that equals P(A), the events are independent.
// The lab: the double-counted overlap, disjoint events, a first look at
// "given" and at independence (disjoint is not independent).

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
  const lab = useLab("math-cards");

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
  const nU = nA + nB - nAB;
  const setAll = (na: Ev, nb: Ev, g: boolean) => { setA(na); setB(nb); setGiven(g); };

  const head = <Btn active={given} onClick={() => setGiven(v => !v)}>{tx(t, "figCards_given", "given B")}</Btn>;
  const controls = <>
    <Row><span className="text-[10px] font-mono font-bold w-5" style={{ color: C.blue }}>A</span><Choice value={a} onChange={setA} options={opts} /></Row>
    <Row><span className="text-[10px] font-mono font-bold w-5" style={{ color: C.amber }}>B</span><Choice value={b} onChange={setB} options={opts} /></Row>
    {!given ? (
      <Row>
        <Readout color={C.blue}>{`|A| = ${nA}`}</Readout>
        <Readout color={C.amber}>{`|B| = ${nB}`}</Readout>
        <Readout color={C.purple}>{`|A ∩ B| = ${nAB}`}</Readout>
        <Readout>{`P(A ∪ B) = (${nA} + ${nB} − ${nAB})/52 = ${nU}/52 = ${f2(nU / 52, 3)}`}</Readout>
      </Row>
    ) : (
      <Row>
        <Readout color={C.purple}>{`P(A | B) = |A ∩ B|/|B| = ${nAB}/${nB} = ${f2(pAgB, 3)}`}</Readout>
        <Readout color={C.blue}>{`P(A) = ${nA}/52 = ${f2(pA, 3)}`}</Readout>
        <Readout color={indep ? C.green : C.red}>{indep ? tx(t, "figCards_indep", "equal: independent") : tx(t, "figCards_dep", "different: dependent")}</Readout>
      </Row>
    )}
  </>;
  const view = (
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
  );
  const note = tx(t, "figCards_note", "All 52 cards are equally likely to be drawn, so the probability of an event is its number of cards over 52. Purple cards belong to both events; adding |A| and |B| counts them twice, which is why the addition rule subtracts |A ∩ B| once. Turn on \"given B\": only the B cards remain possible, and the chance of A becomes the purple share of them. Try heart given face card (independent) and heart given red (dependent).");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figCardsL1_t", "Counted twice"),
      body: <>
        <p>{tx(t, "figCardsL1_b1", "A = hearts (13 cards, blue), B = face cards J, Q, K (12 cards, amber). The 3 purple cards, J♥ Q♥ K♥, are in both.")}</p>
        <p>{tx(t, "figCardsL1_b2", "13 + 12 = 25, but only 22 cards are coloured: the purple ones were counted once as hearts and once as face cards.")}</p>
      </>,
      quiz: {
        q: tx(t, "figCardsL1_q", "What is P(heart or face card)?"),
        options: ["22/52", "25/52", "3/52", "13/52 · 12/52"],
        answer: 0,
        why: tx(t, "figCardsL1_w", "13/52 + 12/52 − 3/52 = 22/52 ≈ 0.42. 25/52 counts the three purple cards twice; 3/52 is \"heart and face card\", the overlap alone."),
      },
      setup: () => setAll("heart", "face", false),
    },
    {
      title: tx(t, "figCardsL2_t", "No overlap"),
      body: <>
        <p>{tx(t, "figCardsL2_b1", "Two events are mutually exclusive when no card is in both: then there is nothing to subtract and the probabilities simply add.")}</p>
        <p>{tx(t, "figCardsL2_b2", "Keep A = hearts and pick a B with no purple card.")}</p>
      </>,
      goal: { text: fill(tx(t, "figCardsL2_g", "A = heart and |A ∩ B| = 0 (now {k})."), { k: nAB }), done: a === "heart" && nAB === 0 },
      hint: tx(t, "figCardsL2_h", "A card has only one suit."),
      setup: () => setAll("heart", "face", false),
    },
    {
      title: tx(t, "figCardsL3_t", "Quick check"),
      body: <p>{tx(t, "figCardsL3_b", "Count the overlap before you add.")}</p>,
      quiz: {
        q: tx(t, "figCardsL3_q", "What is P(red card or king)?"),
        options: ["28/52", "30/52", "26/52", "2/52"],
        answer: 0,
        why: tx(t, "figCardsL3_w", "26 red cards plus 4 kings, minus the 2 red kings counted twice: 26 + 4 − 2 = 28, so 28/52 = 7/13."),
      },
    },
    {
      title: tx(t, "figCardsL4_t", "Knowing B happened"),
      body: <>
        <p>{tx(t, "figCardsL4_b1", "Someone peeks and says: the card is red. Now only the 26 red cards are possible, and the question is what share of them are hearts.")}</p>
        <p>{tx(t, "figCardsL4_b2", "Set A = heart, B = red and turn on \"given B\".")}</p>
      </>,
      goal: { text: tx(t, "figCardsL4_g", "Heart given red."), done: a === "heart" && b === "red" && given },
      hint: tx(t, "figCardsL4_h", "13 of the 26 red cards are hearts: P(heart | red) = 1/2, double the 1/4 you started with."),
      setup: () => setAll("heart", "face", false),
    },
    {
      title: tx(t, "figCardsL5_t", "News that changes nothing"),
      body: <>
        <p>{tx(t, "figCardsL5_b1", "Sometimes the news does not change the chance at all. Then A and B are called independent, and the next chapter is about exactly this.")}</p>
        <p>{tx(t, "figCardsL5_b2", "With A = heart and \"given B\" on, find a B that leaves P(A | B) at 1/4.")}</p>
      </>,
      goal: { text: fill(tx(t, "figCardsL5_g", "A = heart, given B, and P(A | B) = P(A) (now {p})."), { p: f2(pAgB, 3) }), done: a === "heart" && given && indep && b !== "heart" },
      hint: tx(t, "figCardsL5_h", "Pick an event about the rank, not the colour: a quarter of the face cards, of the aces and of the kings are hearts."),
      setup: () => setAll("heart", "red", true),
    },
    {
      title: tx(t, "figCardsL6_t", "Quick check"),
      body: <p>{tx(t, "figCardsL6_b", "Mutually exclusive and independent sound alike, but they are very different.")}</p>,
      quiz: {
        q: tx(t, "figCardsL6_q", "A = heart, B = spade. These events are mutually exclusive. Are they independent?"),
        options: [
          tx(t, "figCardsL6_o1", "No: given a spade, a heart is impossible"),
          tx(t, "figCardsL6_o2", "Yes: they have nothing to do with each other"),
          tx(t, "figCardsL6_o3", "Yes, because P(A ∩ B) = 0"),
          tx(t, "figCardsL6_o4", "It depends on the deck"),
        ],
        answer: 0,
        why: tx(t, "figCardsL6_w", "P(heart | spade) = 0, while P(heart) = 1/4: learning B changed the chance of A completely. Mutually exclusive events with positive probabilities are always dependent."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "double", tone: "info", when: !given && nAB > 0 && nAB < Math.min(nA, nB),
      title: tx(t, "figCardsI1_t", "Overlap subtracted once"),
      body: fill(tx(t, "figCardsI1_b", "{a} + {b} = {s}, but only {u} different cards are coloured: the {k} purple ones were in both counts."), { a: nA, b: nB, s: nA + nB, u: nU, k: nAB }),
    },
    {
      id: "disjoint", tone: "ok", when: !given && nAB === 0,
      title: tx(t, "figCardsI2_t", "Mutually exclusive"),
      body: fill(tx(t, "figCardsI2_b", "No card is in both, so P(A ∪ B) = P(A) + P(B) = {a}/52 + {b}/52, with nothing to subtract."), { a: nA, b: nB }),
    },
    {
      id: "subset", tone: "info", when: !given && a !== b && nAB === nA && nA < nB,
      title: tx(t, "figCardsI3_t", "A inside B"),
      body: tx(t, "figCardsI3_b", "Every A card is also a B card, so A ∪ B is just B, and P(A) ≤ P(B)."),
    },
    {
      id: "same", tone: "warn", when: a === b,
      title: tx(t, "figCardsI4_t", "The same event twice"),
      body: tx(t, "figCardsI4_b", "A and B are the same event, so every coloured card is purple and A ∪ B = A."),
    },
    {
      id: "indep", tone: "ok", when: given && indep && a !== b,
      title: tx(t, "figCardsI5_t", "Independent"),
      body: fill(tx(t, "figCardsI5_b", "Among the {b} B cards, A has the same share as in the whole deck: {p}. Knowing B tells you nothing about A."), { b: nB, p: f2(pA, 3) }),
    },
    {
      id: "zero", tone: "warn", when: given && nAB === 0,
      title: tx(t, "figCardsI6_t", "Ruled out"),
      body: tx(t, "figCardsI6_b", "Given B, no A card is left: P(A | B) = 0. Mutually exclusive events are strongly dependent."),
    },
  ];

  const title = tx(t, "figCards_title", "Events in a deck of cards");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{head}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        {view}
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{head}</Row>{controls}</>}
        recap={[
          tx(t, "figCardsR1", "P(A ∪ B) = P(A) + P(B) − P(A ∩ B): the overlap would otherwise count twice."),
          tx(t, "figCardsR2", "Mutually exclusive events have no overlap, so their probabilities simply add."),
          tx(t, "figCardsR3", "Given B, only the B outcomes remain: P(A | B) = |A ∩ B| / |B|."),
          tx(t, "figCardsR4", "Independent means the news changes nothing; mutually exclusive events are never independent."),
        ]}
      />
    </>
  );
}
