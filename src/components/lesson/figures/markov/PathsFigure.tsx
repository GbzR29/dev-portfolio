"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, Slider, Sliders, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { Transport } from "@/components/lesson/kit/Transport";
import { EXERCISE, fAdd, fIsZero, fMatPow, fMul, fNum, fStr, pathsBetween, sub, sup, walkMatrix, ZERO, type Walk } from "./model";
import { MarkovMatrixTable } from "./MatrixTable";
import { PathsStage } from "./PathsStage";

// ── What this figure shows ────────────────────────────────────────────────────
// Why the n-step probabilities are the entries of Pⁿ. Every route through the
// trellis from i (time 0) to j (time n) is one possible history; its
// probability is the product of its steps. "Add up the paths" adds them one by
// one into a bar whose full length is the entry (Pⁿ)ᵢⱼ. The lab adds the
// matrix, the path list and the row × column view: grouping the paths by the
// state they visit just before the end gives Σₖ (Pⁿ⁻¹)ᵢₖ pₖⱼ, which is how
// matrix multiplication computes an entry.

const SHOWN = 10;

export function MatrixPathsFigure({ t }: { t?: TrackTranslations }) {
  const [walk, setWalk] = useState<Walk>(EXERCISE);
  const [from, setFrom] = useState(2);
  const [to, setTo] = useState(1);
  const [n, setN] = useState(3);
  const [focus, setFocus] = useState<number | null>(null);
  const [group, setGroup] = useState<number | null>(null);
  const [added, setAdded] = useState(Infinity);          // paths in the bar; Infinity = all of them
  const [building, setBuilding] = useState(false);
  const [touched, setTouched] = useState({ path: false, built: false, term: false });
  const lab = useLab("markov-paths");
  const vis = useVisible<HTMLDivElement>();

  const P = useMemo(() => walkMatrix(walk), [walk]);
  const pows = useMemo(() => Array.from({ length: n + 1 }, (_, s) => fMatPow(P, s)), [P, n]);
  const paths = useMemo(() => pathsBetween(P, from, to, n), [P, from, to, n]);
  const entry = pows[n][from][to];
  const shownAdded = Math.min(added, paths.length);

  // A new question shows its full sum at once
  useEffect(() => { setAdded(Infinity); setBuilding(false); setFocus(null); setGroup(null); }, [from, to, n, walk]);

  // Adding the paths: about 0.8 s each for the first few, faster for long lists, 6 s at most
  const addedRef = useRef(0);
  useFrame(building && (vis.on || lab.open), dt => {
    const per = Math.min(0.8, 6 / Math.max(1, paths.length));
    const next = Math.min(paths.length, addedRef.current + dt / per);
    addedRef.current = next; setAdded(next);
    if (next >= paths.length) { setBuilding(false); setTouched(s => ({ ...s, built: true })); }
  });
  const build = () => { addedRef.current = 0; setAdded(0); setFocus(null); setGroup(null); setBuilding(paths.length > 0); };
  const playPause = () => {
    if (building) { setBuilding(false); return; }
    if (shownAdded >= paths.length) { build(); return; }
    addedRef.current = shownAdded; setFocus(null); setGroup(null); setBuilding(true);
  };
  /** Shows exactly `m` whole paths in the bar (the stepping buttons). */
  const showPaths = (m: number) => {
    setBuilding(false); setFocus(null); setGroup(null);
    const c = Math.max(0, Math.min(paths.length, m));
    addedRef.current = c; setAdded(c);
    if (c === paths.length && c > 0) setTouched(s => ({ ...s, built: true }));
  };

  const setK = (k: number) => { setWalk(w => ({ ...w, k })); setFrom(f => Math.min(f, k)); setTo(v => Math.min(v, k)); };
  const exercise = () => { setWalk(EXERCISE); setFrom(2); setTo(1); setN(3); };
  const S = walk.k + 1;
  const entryName = `(P${n === 1 ? "" : sup(n)})${sub(from)}${sub(to)}`;
  const product = (states: number[]) => states.slice(1).map((b, s) => fStr(P[states[s]][b])).join(" · ");
  const pick = (i: number | null) => { setFocus(i); setGroup(null); if (i !== null) setTouched(s => ({ ...s, path: true })); };

  const stage = (
    <>
    <PathsStage P={P} pows={pows} from={from} to={to} n={n} paths={paths} entry={entry} focus={focus} group={group}
      added={shownAdded} labels={{ none: tx(t, "figMkPaths_none", "no path: this move is impossible in exactly n steps"), sum: entryName }} />
      {paths.length > 0 && (
        <Transport t={t} playing={building} onPlay={playPause} playLabel={tx(t, "figMkPaths_build", "add up the paths")}
          onBack={() => showPaths(Math.ceil(shownAdded) - 1)}
          onStep={() => showPaths(shownAdded >= paths.length ? 1 : Math.floor(shownAdded) + 1)}
          onReset={() => showPaths(0)}
          readout={`${Math.floor(shownAdded)} / ${paths.length} ${tx(t, "figMkPaths_list", "paths")}`} />
      )}
    </>
  );

  const pickers = (
    <Row>
      <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figMkPaths_from", "from i")}</span>
      {Array.from({ length: S }, (_, i) => <Btn key={i} active={from === i} onClick={() => setFrom(i)}>{i}</Btn>)}
      <span className="w-px h-5 bg-[var(--border)] mx-1" />
      <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figMkPaths_to", "to j")}</span>
      {Array.from({ length: S }, (_, j) => <Btn key={j} active={to === j} onClick={() => setTo(j)}>{j}</Btn>)}
    </Row>
  );
  const nSlider = <Slider label={tx(t, "figMkPaths_n", "steps n")} value={n} min={1} max={8} step={1} onChange={setN} fmt={v => String(v)} width="w-24" />;
  const sumReadout = <Readout color={C.green}>{entryName} = {fStr(entry)} ≈ {fNum(entry).toFixed(4)}</Readout>;

  // ── Row × column: group the paths by their last stop k ──
  const terms = Array.from({ length: S }, (_, k) => ({ k, a: pows[n - 1][from][k], b: P[k][to] }));

  const pathList = (
    <div className="min-w-0">
      <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">
        {tx(t, "figMkPaths_list", "paths")} {from} → {to} ({paths.length})
      </p>
      <div className="font-mono text-[11px] space-y-0.5">
        {paths.slice(0, SHOWN).map((p, i) => (
          <div key={i} onMouseEnter={() => pick(i)} onMouseLeave={() => setFocus(null)} onClick={() => pick(focus === i ? null : i)}
            className={`flex justify-between gap-3 px-1.5 rounded cursor-pointer ${focus === i ? "bg-[var(--primary-low)]" : ""}`}>
            <span className="text-[var(--text-main)]">{p.states.join(" → ")}</span>
            <span className="text-[var(--text-muted)] text-right">{product(p.states)} = <span className="text-[var(--text-main)]">{fStr(p.prob)}</span></span>
          </div>
        ))}
        {paths.length > SHOWN && (
          <div className="px-1.5 text-[var(--text-muted)]">
            + {paths.length - SHOWN} {tx(t, "figMkPaths_more", "more paths")} = {fStr(paths.slice(SHOWN).reduce((s, p) => fAdd(s, p.prob), ZERO))}
          </div>
        )}
      </div>
    </div>
  );
  const rowCol = (
    <div className="min-w-0">
      <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">
        {tx(t, "figMkPaths_rowCol", "row × column: group by the last stop k")}
      </p>
      <div className="font-mono text-[11px] space-y-0.5">
        {terms.map(({ k, a, b }) => {
          const zero = fIsZero(a) || fIsZero(b);
          return (
            <div key={k} onMouseEnter={() => { setGroup(k); setFocus(null); setTouched(s => ({ ...s, term: true })); }} onMouseLeave={() => setGroup(null)}
              onClick={() => { setGroup(group === k ? null : k); setFocus(null); setTouched(s => ({ ...s, term: true })); }}
              className={`flex justify-between gap-3 px-1.5 rounded cursor-pointer ${group === k ? "bg-[var(--primary-low)]" : ""} ${zero ? "opacity-45" : ""}`}>
              <span>k = {k}</span>
              <span className="text-[var(--text-muted)]">
                (P{n - 1 === 1 ? "" : sup(n - 1)}){sub(from)}{sub(k)} · p{sub(k)}{sub(to)} = {fStr(a)} · {fStr(b)} = <span className="text-[var(--text-main)]">{fStr(fMul(a, b))}</span>
              </span>
            </div>
          );
        })}
        <div className="px-1.5 pt-1 border-t border-[var(--border)] flex justify-between"><span>Σ</span><span className="text-[#22c55e]">{fStr(entry)}</span></div>
      </div>
    </div>
  );

  // ── Lab ──
  const parityZero = paths.length === 0 && walk.hold === 0 && (from + to + n) % 2 === 1;
  const single = P[from][to];
  const naive = Array.from({ length: n }, () => single).reduce((s, x) => fMul(s, x));
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figMkPathsL1_t", "A path is a product"),
      body: <>
        <p>{tx(t, "figMkPathsL1_b1", "The grid has one column per time and one row per state. A route from the big dot on the left to the big dot on the right is one possible history of the walk.")}</p>
        <p>{tx(t, "figMkPathsL1_b2", "Its probability is the product of its steps: the Markov property lets each step forget the ones before.")}</p>
      </>,
      goal: { text: tx(t, "figMkPathsL1_g", "Point at (or tap) a path in the list and find it in the grid."), done: touched.path },
      setup: exercise,
    },
    {
      title: tx(t, "figMkPathsL2_t", "Different paths add up"),
      body: <>
        <p>{tx(t, "figMkPathsL2_b1", "The paths are different ways of getting from 2 to 1, and only one of them can happen. So their probabilities add.")}</p>
        <p>{tx(t, "figMkPathsL2_b2", "The dashed box is exactly as long as the entry (P³)₂₁ of the matrix. Watch the paths fill it.")}</p>
      </>,
      goal: { text: tx(t, "figMkPathsL2_g2", "Press the big ▶ under the drawing (add up the paths) and let it finish, or add them one by one with ⏭."), done: touched.built },
      focus: "play",
    },
    {
      title: tx(t, "figMkPathsL3_t", "Group by the last stop"),
      body: <>
        <p>{tx(t, "figMkPathsL3_b1", "Sort the paths by the state k they visit one step before the end. The paths through k add up to (Pⁿ⁻¹)ᵢₖ, the ways of reaching k, times pₖⱼ, the last step.")}</p>
        <p>{tx(t, "figMkPathsL3_b2", "One term per k, then add: that is row i of Pⁿ⁻¹ times column j of P. Matrix multiplication is nothing but \"add up over the middle\".")}</p>
      </>,
      goal: { text: tx(t, "figMkPathsL3_g", "Point at a line of the row × column list. Its paths turn pink."), done: touched.term },
    },
    {
      title: tx(t, "figMkPathsL4_t", "Quick check"),
      body: <p>{tx(t, "figMkPathsL4_b", "The exercise's chain: from 0 the walker always goes to 1; from 1 it goes left with 1/4 and right with 3/4.")}</p>,
      quiz: {
        q: tx(t, "figMkPathsL4_q", "What is (P²)₀₀, the chance of being back at 0 two steps after leaving it?"),
        options: ["1/4", "0", "1", "3/4"],
        answer: 0,
        why: tx(t, "figMkPathsL4_w", "The only path is 0 → 1 → 0, and its product is 1 · 1/4 = 1/4. Check it: choose from 0, to 0, n = 2."),
      },
    },
    {
      title: tx(t, "figMkPathsL5_t", "Impossible moves"),
      body: <p>{tx(t, "figMkPathsL5_b", "Some entries of every power are 0. Find out why.")}</p>,
      goal: { text: tx(t, "figMkPathsL5_g", "Choose from 1, to 1, with n = 3."), done: from === 1 && to === 1 && n === 3 && walk.hold === 0 },
      setup: () => { setWalk(EXERCISE); },
    },
    {
      title: tx(t, "figMkPathsL6_t", "Too many paths to list"),
      body: <p>{tx(t, "figMkPathsL6_b", "Each extra step multiplies the number of paths. The matrix power never lists them: it adds them up one middle state at a time.")}</p>,
      goal: { text: tx(t, "figMkPathsL6_g", "Raise n to 7 or 8."), done: n >= 7 },
    },
    {
      title: tx(t, "figMkPathsL7_t", "Break the rhythm"),
      body: <p>{tx(t, "figMkPathsL7_b", "The slider h lets the walker stay put. A loop is a step that does not change the state, so it can fix the parity.")}</p>,
      goal: { text: tx(t, "figMkPathsL7_g", "With from 1, to 1 and n = 3, raise h until the entry is no longer 0."), done: walk.hold > 0 && from === to && n % 2 === 1 && !fIsZero(entry) },
    },
  ];

  const insights: Insight[] = [
    {
      id: "parity", tone: "warn", when: parityZero,
      title: tx(t, "figMkPathsI1_t", "Wrong parity: no path at all"),
      body: fill(tx(t, "figMkPathsI1_b", "Every step moves the walker by ±1, so it changes the state from even to odd or back. After {n} steps from {i} the parity has flipped {n} times, so the walker can't be at {j}. That is why (Pⁿ)ᵢⱼ = 0 here, and why the powers of P look like a checkerboard."), { n, i: from, j: to }),
    },
    {
      id: "many", tone: "info", when: paths.length > 40,
      title: tx(t, "figMkPathsI2_t", "The matrix never lists them"),
      body: fill(tx(t, "figMkPathsI2_b", "There are {c} paths here. Pⁿ needs only n − 1 = {m} matrix products, each one adding over the middle state once. With 20 steps there would be about 10¹¹ sequences, and still only 19 products (5 by repeated squaring)."), { c: paths.length, m: n - 1 }),
    },
    {
      id: "naive", tone: "warn", when: n >= 2 && !fIsZero(single) && fStr(naive) !== fStr(entry),
      title: tx(t, "figMkPathsI3_t", "Not the same as (pᵢⱼ)ⁿ"),
      body: fill(tx(t, "figMkPathsI3_b", "A tempting mistake: (p{i}{j})ⁿ = ({p}){nsup} = {naive}. That multiplies one entry by itself, as if the walker had to make the same move {n} times in a row, which is not even a path. The right answer, {name} = {e}, adds up every path."), { i: sub(from), j: sub(to), p: fStr(single), n, nsup: sup(n), naive: fStr(naive), name: entryName, e: fStr(entry) }),
    },
    {
      id: "loops", tone: "ok", when: walk.hold > 0,
      title: tx(t, "figMkPathsI4_t", "Loops add paths"),
      body: tx(t, "figMkPathsI4_b", "With h > 0 a path may stay put for a step, drawn as a flat segment in the grid. Staying put does not change the state, so an odd number of steps can now end at a state of the same parity, and the zeros of the checkerboard fill in."),
    },
  ];

  return (
    <>
      <Figure fullscreen={false}
        title={tx(t, "figMkPaths_title", "Why Pⁿ: adding up every path")}
        head={<>
          <Btn onClick={exercise}>{tx(t, "figMkPaths_ex", "exercise (b): 2 → 1 in 3 steps")}</Btn>
          <LabButton lab={lab} t={t} />
        </>}
        controls={<>
          {pickers}
          <Sliders>{nSlider}</Sliders>
          <Row>{sumReadout}</Row>
        </>}
        note={tx(t, "figMkPaths_note2", "Each route from the left dot to the right dot is one history; multiply along it. Different routes are different ways of getting there, so add them. \"Add up the paths\" fills the bar one path at a time, and the total is exactly the entry of Pⁿ. The lab shows the same sum grouped by the last stop, which is row × column.")}
      >
        <div ref={vis.ref}>{stage}</div>
      </Figure>

      <Lab lab={lab} t={t}
        recap={[
          tx(t, "figMkPathsR1", "A path's probability is the product of its steps; different paths add up."),
          tx(t, "figMkPathsR2", "Grouping the paths by their last stop k gives Σₖ (Pⁿ⁻¹)ᵢₖ pₖⱼ: row times column, which is matrix multiplication."),
          tx(t, "figMkPathsR3", "So (Pⁿ)ᵢⱼ adds up every path, and it is not (pᵢⱼ)ⁿ."),
          tx(t, "figMkPathsR4", "With moves of ±1 only, parity makes half the entries 0; a chance of staying put fills them in."),
        ]}
        title={tx(t, "figMkPaths_title", "Why Pⁿ: adding up every path")}
        steps={labSteps} insights={insights} stage={stage}
        controls={<>
          {pickers}
          <Sliders>
            {nSlider}
            <Slider label={tx(t, "figMkChain_p", "right, p")} value={walk.p} min={0.05} max={0.95} step={0.05} onChange={v => setWalk(w => ({ ...w, p: v }))} width="w-24" />
            <Slider label={tx(t, "figMkChain_hold", "stay put, h")} value={walk.hold} min={0} max={0.5} step={0.05} onChange={v => setWalk(w => ({ ...w, hold: v }))} width="w-24" />
            <Slider label={tx(t, "figMkChain_k", "last state k")} value={walk.k} min={2} max={5} step={1} onChange={setK} fmt={v => String(v)} width="w-24" />
          </Sliders>
          <Row><Btn onClick={exercise}>{tx(t, "figMkPaths_ex", "exercise (b): 2 → 1 in 3 steps")}</Btn>{sumReadout}</Row>
          <div className="grid gap-5 lg:grid-cols-2 items-start">
            {pathList}
            {rowCol}
          </div>
          <MarkovMatrixTable P={pows[n]} row={from} cell={[from, to]} onPick={(i, j) => { setFrom(i); setTo(j); }} t={t} label={`P${n === 1 ? "" : sup(n)}`} />
        </>}
      />
    </>
  );
}
