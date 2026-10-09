"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Btn, C } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// Choosing k items from n letters, with the two questions that decide every
// count: does the order of the picks matter, and may an item be picked again?
// Every possible selection is listed as a chip, so the formula in the readout
// can be checked by counting the chips. With order and repetition both off,
// each chip stands for k! chips of the ordered list: that factor is exactly
// what the combination formula divides out.
// The lab: podiums, then committees (÷ k!), symmetry, ice-cream multisets.

const LETTERS = "ABCDEFG";
const COLORS = [C.red, C.blue, C.green, C.amber, C.purple, C.teal, C.pink];
const MAX_SHOWN = 240;

const fact = (n: number) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
const choose = (n: number, k: number) => (k < 0 || k > n ? 0 : Math.round(fact(n) / (fact(k) * fact(n - k))));

/** Every selection in dictionary order, stopping after `cap` of them. */
function list(n: number, k: number, order: boolean, rep: boolean, cap: number) {
  const out: number[][] = [], cur: number[] = [];
  const go = (start: number) => {
    if (out.length >= cap) return;
    if (cur.length === k) { out.push([...cur]); return; }
    for (let i = order ? 0 : start; i < n; i++) {
      if (!rep && cur.includes(i)) continue;
      cur.push(i); go(rep ? i : i + 1); cur.pop();
    }
  };
  go(0);
  return out;
}

/** The formula that fits the two answers, written out, and its value. */
function count(n: number, k: number, order: boolean, rep: boolean): [string, number] {
  if (order && rep) return [`nᵏ = ${n}^${k}`, n ** k];
  if (order) return [`n!/(n−k)! = ${n}!/${n - k}!`, fact(n) / fact(n - k)];
  if (rep) return [`C(n+k−1, k) = C(${n + k - 1}, ${k})`, choose(n + k - 1, k)];
  return [`n!/(k!(n−k)!) = ${n}!/(${k}!·${n - k}!)`, choose(n, k)];
}

export function CountingFigure({ t }: { t?: TrackTranslations }) {
  const [n, setN] = useState(4);
  const [kRaw, setK] = useState(2);
  const [order, setOrder] = useState(true);
  const [rep, setRep] = useState(false);
  const lab = useLab("math-counting");

  const k = rep ? kRaw : Math.min(kRaw, n);
  const [formula, total] = count(n, k, order, rep);
  const items = list(n, k, order, rep, MAX_SHOWN);
  const more = total - items.length;
  const is = (o: boolean, r: boolean, nn: number, kk: number) => order === o && rep === r && n === nn && k === kk;
  const setAll = (o: boolean, r: boolean, nn: number, kk: number) => { setOrder(o); setRep(r); setN(nn); setK(kk); };

  const head = <>
    <Btn active={order} onClick={() => setOrder(v => !v)}>{tx(t, "figCnt_order", "order matters")}</Btn>
    <Btn active={rep} onClick={() => setRep(v => !v)}>{tx(t, "figCnt_rep", "repetition allowed")}</Btn>
  </>;
  const controls = <>
    <Slider label={tx(t, "figCnt_n", "items n")} value={n} min={2} max={7} step={1} onChange={setN} fmt={v => String(v)} />
    <Slider label={tx(t, "figCnt_k", "picks k")} value={k} min={1} max={rep ? 5 : n} step={1} onChange={setK} fmt={v => String(v)} />
    <Row>
      <Readout color={C.blue}>{`${formula} = ${total}`}</Readout>
      {!order && !rep && <Readout color={C.amber}>{`${tx(t, "figCnt_ordered", "ordered")}: ${fact(n) / fact(n - k)} = ${total} × ${k}!`}</Readout>}
    </Row>
  </>;
  const view = (
    <div className="p-4 flex flex-wrap content-start gap-1.5 max-h-[300px] overflow-y-auto">
      {items.map((s, i) => (
        <span key={i} className="font-mono text-[12px] font-semibold px-1.5 py-0.5 rounded-md border border-[var(--border)] bg-[var(--surface)]">
          {s.map((j, q) => <span key={q} style={{ color: COLORS[j] }}>{LETTERS[j]}</span>)}
        </span>
      ))}
      {more > 0 && <span className="font-mono text-[12px] px-1.5 py-0.5 text-[var(--text-muted)]">{`+ ${more} …`}</span>}
    </div>
  );

  // ── Lab ──
  const now = { c: total };
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figCntL1_t", "A podium"),
      body: <>
        <p>{tx(t, "figCntL1_b1", "Five runners A to E race. Gold, silver and bronze go to three different runners, and ABC (A gold) is not the same podium as CBA (C gold): order matters, no repetition.")}</p>
        <p>{tx(t, "figCntL1_b2", "Set up the figure to list every podium.")}</p>
      </>,
      goal: { text: fill(tx(t, "figCntL1_g", "Order on, repetition off, n = 5, k = 3 (now {c} chips)."), now), done: is(true, false, 5, 3) },
      hint: tx(t, "figCntL1_h", "5 choices for gold, then 4 for silver, then 3 for bronze: 5 · 4 · 3 = 60 chips."),
      setup: () => setAll(true, false, 4, 2),
    },
    {
      title: tx(t, "figCntL2_t", "Quick check"),
      body: <p>{tx(t, "figCntL2_b", "Each medal leaves one runner fewer for the next.")}</p>,
      quiz: {
        q: tx(t, "figCntL2_q", "Seven runners race. In how many ways can gold, silver and bronze be awarded?"),
        options: ["210", "343", "35", "5040"],
        answer: 0,
        why: tx(t, "figCntL2_w", "7 · 6 · 5 = 210 = 7!/4!. 343 = 7³ would let one runner win two medals; 35 ignores the order of the medals; 5040 = 7! orders all seven runners."),
      },
    },
    {
      title: tx(t, "figCntL3_t", "From podiums to committees"),
      body: <>
        <p>{tx(t, "figCntL3_b1", "Now pick 3 of the 5 for a committee. A committee has no gold or silver: ABC, ACB, BAC, BCA, CAB and CBA are all the same group.")}</p>
        <p>{tx(t, "figCntL3_b2", "Switch order off and watch the 60 chips collapse.")}</p>
      </>,
      goal: { text: fill(tx(t, "figCntL3_g", "Order off, repetition off, n = 5, k = 3 (now {c} chips)."), now), done: is(false, false, 5, 3) },
      hint: tx(t, "figCntL3_h", "Each group of 3 was counted 3! = 6 times among the podiums: 60 / 6 = 10."),
      setup: () => setAll(true, false, 5, 3),
    },
    {
      title: tx(t, "figCntL4_t", "Quick check"),
      body: <p>{tx(t, "figCntL4_b", "A handshake is a pair of people, and the pair (Ana, Bruno) is the same handshake as (Bruno, Ana).")}</p>,
      quiz: {
        q: tx(t, "figCntL4_q", "Seven people all shake hands once with each other. How many handshakes?"),
        options: ["21", "42", "49", "14"],
        answer: 0,
        why: tx(t, "figCntL4_w", "C(7, 2) = (7 · 6)/2 = 21. 42 counts each handshake twice, once from each person; 49 = 7² even lets people shake their own hand."),
      },
    },
    {
      title: tx(t, "figCntL5_t", "Choosing who stays"),
      body: <>
        <p>{tx(t, "figCntL5_b1", "With 6 letters there are C(6, 2) = 15 ways to choose 2. Choosing which 2 go is the same as choosing which 4 stay.")}</p>
        <p>{tx(t, "figCntL5_b2", "Find another k that also gives 15 chips.")}</p>
      </>,
      goal: { text: fill(tx(t, "figCntL5_g", "Order off, repetition off, n = 6, and 15 chips with k ≠ 2 (now k = {k}, {c} chips)."), { k, c: total }), done: is(false, false, 6, 4) },
      hint: tx(t, "figCntL5_h", "C(n, k) = C(n, n − k): try k = 6 − 2."),
      setup: () => setAll(false, false, 6, 2),
    },
    {
      title: tx(t, "figCntL6_t", "Ice cream"),
      body: <>
        <p>{tx(t, "figCntL6_b1", "Five flavours A to E, three scoops in a cup, the same flavour as often as you like, and the order of the scoops does not matter: AAB is the same cup as ABA.")}</p>
        <p>{tx(t, "figCntL6_b2", "List every cup.")}</p>
      </>,
      goal: { text: fill(tx(t, "figCntL6_g", "Order off, repetition on, n = 5, k = 3 (now {c} chips)."), now), done: is(false, true, 5, 3) },
      hint: tx(t, "figCntL6_h", "Stars and bars: 3 stars and 4 bars, C(7, 3) = 35 cups."),
      setup: () => setAll(false, false, 5, 3),
    },
    {
      title: tx(t, "figCntL7_t", "Quick check"),
      body: <p>{tx(t, "figCntL7_b", "Two questions decide the formula: does the order matter, and may an item repeat?")}</p>,
      quiz: {
        q: tx(t, "figCntL7_q", "A bike lock has 4 dials, each with the digits 0 to 9. How many codes are there?"),
        options: ["10⁴ = 10 000", "10 · 9 · 8 · 7 = 5040", "C(10, 4) = 210", "C(13, 4) = 715"],
        answer: 0,
        why: tx(t, "figCntL7_w", "The order of the dials matters (1234 is not 4321) and digits may repeat (0000 is a code), so every dial has all 10 options: 10⁴."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "kfact", tone: "info", when: !order && !rep && k > 1 && k < n,
      title: tx(t, "figCntI1_t", "Divided by k!"),
      body: fill(tx(t, "figCntI1_b", "Each chip stands for the {f} orders of its {k} letters, which were all separate chips with order on: {p} ÷ {f} = {c}."),
        { f: fact(k), k, p: fact(n) / fact(n - k), c: total }),
    },
    {
      id: "all", tone: "ok", when: order && !rep && k === n,
      title: tx(t, "figCntI2_t", "Every order of everything"),
      body: fill(tx(t, "figCntI2_b", "Arranging all {n} letters gives n! = {c}. The formula reads n!/(n − n)! = n!/0!, which is why 0! must be 1."), { n, c: total }),
    },
    {
      id: "sym", tone: "info", when: !order && !rep && k > n / 2 && k < n,
      title: tx(t, "figCntI3_t", "The mirror count"),
      body: fill(tx(t, "figCntI3_b", "Choosing {k} to keep is the same as choosing {r} to leave out, so C({n}, {k}) = C({n}, {r}) = {c}."), { n, k, r: n - k, c: total }),
    },
    {
      id: "one", tone: "info", when: !order && !rep && k === n,
      title: tx(t, "figCntI4_t", "Only one group"),
      body: tx(t, "figCntI4_b", "Taking every letter leaves no choice at all: C(n, n) = 1."),
    },
    {
      id: "stars", tone: "info", when: !order && rep,
      title: tx(t, "figCntI5_t", "Stars and bars"),
      body: fill(tx(t, "figCntI5_b", "Each chip is {k} stars placed among the {b} bars that separate the {n} letters: choose which {k} of the {s} places hold stars, C({s}, {k}) = {c}."),
        { k, b: n - 1, n, s: n + k - 1, c: total }),
    },
    {
      id: "big", tone: "warn", when: more > 0,
      title: tx(t, "figCntI6_t", "Too many to list"),
      body: fill(tx(t, "figCntI6_b", "{c} selections: only the first {m} are shown. Once lists get this long, a formula is the only practical way to count."), { c: total, m: MAX_SHOWN }),
    },
  ];

  const title = tx(t, "figCnt_title", "Counting selections");
  const note = tx(t, "figCnt_note", "Each chip is one possible selection of k letters out of the first n. Switch \"order matters\" off and AB and BA become the same chip: the list shrinks by a factor of k!, because every set of k different letters can be put in order in k! ways. Switch repetition on and letters may repeat (AA, BB): with order it gives nᵏ sequences, without order it gives the multisets counted by stars and bars.");
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
          tx(t, "figCntR1", "Order matters, no repetition: n!/(n − k)! arrangements, one option fewer at each pick."),
          tx(t, "figCntR2", "Order ignored: divide by k!, the orders of each group, to get C(n, k)."),
          tx(t, "figCntR3", "C(n, k) = C(n, n − k): choosing who goes is choosing who stays."),
          tx(t, "figCntR4", "Repetition allowed: nᵏ sequences with order, C(n + k − 1, k) multisets without."),
        ]}
      />
    </>
  );
}
