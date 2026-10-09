"use client";

import { useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, Slider, f2, mulberry32, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { fill } from "@/components/lesson/kit/lab/Lab";
import { Transport } from "@/components/lesson/kit/Transport";
import { fNum } from "./model";
import { runPatterns, solvePattern, type Flip } from "./patternModel";
import { LETTER, PatternStage, showF } from "./PatternStage";

// ── What this figure shows ────────────────────────────────────────────────────
// Waiting for a pattern of coin flips (any H/T word of 2 to 6 letters, with a
// coin of any bias). The pattern becomes a chain whose state is the progress,
// the longest beginning of the pattern that the last flips spell, and the
// figure solves it exactly by first-step analysis. Underneath, the overlap
// formula gets the same number by adding 1/P(first k letters) over every k
// where the first k letters equal the last k. The Transport flips the coin;
// runs that finish are averaged to compare with the exact answer.

const PRESETS = ["HH", "HT", "HTH", "HHT", "THTH"];
type Sim = { flips: Flip[]; state: number; last: { from: number; to: number; c: Flip } | null; done: boolean };
const FRESH: Sim = { flips: [], state: 0, last: null, done: false };

export function PatternFigure({ t }: { t?: TrackTranslations }) {
  const [pat, setPat] = useState("HTH");
  const [p, setP] = useState(0.5);
  const [sim, setSim] = useState<Sim>(FRESH);
  const [running, setRunning] = useState(false);
  const [runs, setRuns] = useState(0);
  const [flipSum, setFlipSum] = useState(0);
  const [u, setU] = useState(0);
  const [speed] = useFigureSpeed();
  const vis = useVisible<HTMLDivElement>();
  const rnd = useRef(mulberry32(11));

  const sol = useMemo(() => solvePattern(pat, p), [pat, p]);
  const exact = fNum(sol.total);

  const clear = () => { setSim(FRESH); setRuns(0); setFlipSum(0); setRunning(false); setU(0); };
  const choose = (next: string) => { setPat(next); clear(); };

  /** One flip; after a finished run, the next press starts a new one. */
  const step = () => {
    if (sim.done) { setSim(FRESH); return; }
    const c: Flip = rnd.current() < p ? "H" : "T";
    const to = c === "H" ? sol.next[sim.state].H : sol.next[sim.state].T;
    const flips = [...sim.flips, c];
    const done = to === pat.length;
    setSim({ flips, state: to, last: { from: sim.state, to, c }, done });
    if (done) { setRuns(x => x + 1); setFlipSum(x => x + flips.length); }
  };

  useFrame(running && vis.on, dt => {
    const nu = u + (dt * 1000) / scaledMs(sim.done ? 900 : 420, speed);
    if (nu < 1) { setU(nu); return; }
    setU(0);
    step();
  });

  const addRuns = () => {
    const r = runPatterns(sol.next, fNum(sol.p), rnd.current, 1000);
    setRuns(x => x + r.runs); setFlipSum(x => x + r.flips);
  };

  const qText = (c: Flip) => showF(c === "H" ? sol.p : sol.q);
  const editor = (
    <Row>
      <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figMkPat_pattern", "pattern (click a letter to flip it)")}</span>
      {pat.split("").map((c, i) => (
        <button key={i} type="button" onClick={() => choose(pat.slice(0, i) + (c === "H" ? "T" : "H") + pat.slice(i + 1))}
          className="h-7 w-7 rounded-full text-[12px] font-bold font-mono text-white shadow-sm hover:scale-110 transition-transform"
          style={{ background: LETTER[c as Flip] }}>{c}</button>
      ))}
      <Btn onClick={() => pat.length > 2 && choose(pat.slice(0, -1))}>−</Btn>
      <Btn onClick={() => pat.length < 6 && choose(pat + "H")}>+</Btn>
      <span className="w-px h-5 bg-[var(--border)] mx-1" />
      {PRESETS.map(s => <Btn key={s} active={s === pat} onClick={() => choose(s)}>{s}</Btn>)}
    </Row>
  );
  const readouts = (
    <Row>
      <Readout color={C.purple}>E[T] = {showF(sol.total)}{sol.total.d > BigInt(1) ? ` ≈ ${f2(exact, 2)}` : ""}</Readout>
      {runs > 0 && <Readout color={C.amber}>{tx(t, "figMkPat_avg", "simulated average")}: {f2(flipSum / runs, 2)} ({runs} {tx(t, "figMkPat_runs", "runs")})</Readout>}
      <Btn onClick={addRuns}>{tx(t, "figMkPat_add", "+1000 runs at once")}</Btn>
    </Row>
  );

  return (
    <Figure
      title={tx(t, "figMkPat_title", "Waiting for a pattern: the progress chain and the overlaps")}
      controls={<>
        {editor}
        <Slider label={tx(t, "figMkPat_p", "chance of heads, p")} value={p} min={0.05} max={0.95} step={0.05}
          onChange={v => { setP(v); clear(); }} width="w-32" />
        {readouts}
      </>}
      note={tx(t, "figMkPat_note", "Each node is the progress so far, with the exact expected number of flips still to go. The right letter moves one node forward; a wrong letter falls back along an arc to the longest ending that still starts the pattern. The bottom rows test every overlap: both ways give the same expected wait. Try HH against HT, or HTH against HHT.")}
    >
      <div ref={vis.ref}>
        <PatternStage pat={pat} next={sol.next} time={sol.time} overlaps={sol.overlaps} total={sol.total}
          chance={{ H: qText("H"), T: qText("T") }} flips={sim.flips} state={sim.state} last={sim.last} done={sim.done}
          labels={{
            flips: tx(t, "figMkPat_hFlips", "FLIPS IN THIS RUN"),
            chain: tx(t, "figMkPat_hChain", "PROGRESS CHAIN (t = EXPECTED FLIPS STILL TO GO)"),
            overlaps: tx(t, "figMkPat_hOverlaps", "OVERLAPS: FIRST k LETTERS = LAST k LETTERS?"),
            found: fill(tx(t, "figMkPat_found", "found after {n} flips"), { n: sim.flips.length }),
            chainSays: tx(t, "figMkPat_chainSays", "the chain gives"),
          }} />
        <Transport t={t} speed playing={running} onPlay={() => setRunning(r => !r)} onStep={() => { setRunning(false); step(); }} onReset={clear}
          playLabel={tx(t, "figMkPat_play", "flip the coin")}
          readout={`${tx(t, "figMkPat_flips", "flips")}: ${sim.flips.length}`} />
      </div>
    </Figure>
  );
}
