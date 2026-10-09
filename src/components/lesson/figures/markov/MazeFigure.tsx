"use client";

import { useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, f2, mulberry32, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { Transport } from "@/components/lesson/kit/Transport";
import { fNum, fStr, type Frac } from "./model";
import { ALL_OPEN, NAMES, ROOMS, doorOf, solveMaze } from "./mazeModel";
import { MazeStage, roomXY, type Mode } from "./MazeStage";

// ── What this figure shows ────────────────────────────────────────────────────
// A mouse in a 3 × 3 maze looks for the cheese, leaving each room through one
// of its open doors at random. The rooms show, exactly, either the expected
// number of moves to the cheese from each room (first-step analysis,
// t = 1 + Q·t) or the expected number of visits to each room on the way from
// the start (a row of the fundamental matrix N = (I − Q)⁻¹). Doors open and
// close with a click. Mice run one by one, or 100 at once, to check by
// simulation.

type Tool = "look" | "start" | "cheese";
const EX = { cheese: 8, start: 0 };
const HI = doorOf(7, 8);

/** Joins equation terms into lines short enough for the panel. */
function wrap(head: string, terms: string[], indent: string, width = 34) {
  const out: string[] = [];
  let cur = head;
  terms.forEach((term, i) => {
    const piece = (i === 0 ? "" : " + ") + term;
    if (cur.length + piece.length > width && cur.trim() !== indent.trim()) { out.push(cur); cur = indent + (i === 0 ? "" : "+ ") + term; }
    else cur += piece;
  });
  out.push(cur);
  return out;
}

const show = (f: Frac) => (f.d < BigInt(100) ? fStr(f) : f2(fNum(f), 2));

/** One mouse from `start` until the cheese: its number of moves and visits per room. */
function runMouse(nb: number[][], start: number, cheese: number, rnd: () => number) {
  const visits = Array(ROOMS).fill(0);
  let r = start, moves = 0;
  visits[r]++;
  while (r !== cheese && moves < 100000) {
    r = nb[r][Math.floor(rnd() * nb[r].length)];
    moves++;
    if (r !== cheese) visits[r]++;
  }
  return { moves, visits };
}

export function MazeFigure({ t }: { t?: TrackTranslations }) {
  const [doors, setDoors] = useState<boolean[]>(() => [...ALL_OPEN]);
  const [cheese, setCheese] = useState(EX.cheese);
  const [start, setStart] = useState(EX.start);
  const [mode, setMode] = useState<Mode>("time");
  const [tool, setTool] = useState<Tool>("look");
  const [focus, setFocus] = useState<number | null>(4);
  const [touchedRoom, setTouchedRoom] = useState(false);
  // Simulation: the animated mouse, and the totals of finished runs
  const [mouse, setMouse] = useState({ at: EX.start, from: EX.start, u: 1 });
  const [running, setRunning] = useState(false);
  const [stepMode, setStepMode] = useState(false);
  const [runs, setRuns] = useState(0);
  const [moveSum, setMoveSum] = useState(0);
  const [visitSum, setVisitSum] = useState<number[]>(() => Array(ROOMS).fill(0));
  const [speed] = useFigureSpeed();
  const lab = useLab("markov-maze");
  const vis = useVisible<HTMLDivElement>();

  const sol = useMemo(() => solveMaze(doors, cheese, start), [doors, cheese, start]);
  const reachable = sol.visits !== null && start !== cheese;

  const rnd = useRef(mulberry32(7));
  const cur = useRef({ moves: 0, visits: Array(ROOMS).fill(0) as number[] });
  const mouseRef = useRef(mouse); mouseRef.current = mouse;
  const single = useRef<null | "go" | "done">(null);

  const clearSim = (s = start) => {
    setRuns(0); setMoveSum(0); setVisitSum(Array(ROOMS).fill(0));
    setRunning(false); setStepMode(false); single.current = null;
    cur.current = { moves: 0, visits: Array.from({ length: ROOMS }, (_, r) => (r === s ? 1 : 0)) };
    setMouse({ at: s, from: s, u: 1 });
  };
  const reset = (d: readonly boolean[], c: number, s: number) => {
    setDoors([...d]); setCheese(c); setStart(s); clearSim(s);
  };
  const toggleDoor = (e: number) => {
    setDoors(d => d.map((o, i) => (i === e ? !o : o)));
    clearSim();
  };
  const clickRoom = (r: number) => {
    if (tool === "start" && r !== cheese) { setStart(r); clearSim(r); }
    else if (tool === "cheese" && r !== start) { setCheese(r); clearSim(); }
    setFocus(r); setTouchedRoom(true);
  };
  const addRuns = (n: number) => {
    if (!reachable) return;
    let m = 0;
    const v = Array(ROOMS).fill(0);
    for (let i = 0; i < n; i++) {
      const run = runMouse(sol.nb, start, cheese, rnd.current);
      m += run.moves; run.visits.forEach((x, r) => (v[r] += x));
    }
    setRuns(x => x + n); setMoveSum(x => x + m); setVisitSum(s => s.map((x, r) => x + v[r]));
  };

  const playPause = () => {
    if (running && !stepMode) { setRunning(false); return; }
    if (!reachable) return;
    single.current = null; setStepMode(false); setRunning(true);
  };
  const stepOnce = () => {
    if (!reachable) return;
    single.current = "go"; setStepMode(true); setRunning(true);
  };

  // Each tick glides the mouse to the next room; at the cheese the run is counted and a new mouse starts
  useFrame(running && (vis.on || lab.open), dt => {
    const m = mouseRef.current;
    const u = m.u + (dt * 1000) / scaledMs(240, speed);
    if (u < 1) { setMouse({ ...m, u }); return; }
    if (single.current === "done") { single.current = null; setStepMode(false); setRunning(false); setMouse({ ...m, u: 1 }); return; }
    let at = m.at, from = m.at;
    if (at === cheese) {
      const c = cur.current;
      setRuns(x => x + 1); setMoveSum(x => x + c.moves); setVisitSum(s => s.map((x, r) => x + c.visits[r]));
      cur.current = { moves: 0, visits: Array.from({ length: ROOMS }, (_, r) => (r === start ? 1 : 0)) };
      at = start; from = start;
    } else {
      const ns = sol.nb[at];
      if (!ns.length) { setRunning(false); return; }
      at = ns[Math.floor(rnd.current() * ns.length)];
      cur.current.moves++;
      if (at !== cheese) cur.current.visits[at]++;
    }
    if (single.current === "go") single.current = "done";
    setMouse({ at, from, u: from === at ? 1 : 0 });
  });

  // ── What the rooms and the panel show ──
  const values = Array.from({ length: ROOMS }, (_, r) => {
    const f = mode === "time" ? sol.time[r] : sol.visits ? sol.visits[r] : null;
    return f ? { text: show(f), num: fNum(f) } : null;
  });
  const sim = runs > 0 ? (mode === "time"
    ? Array.from({ length: ROOMS }, (_, r) => (r === start ? moveSum / runs : NaN))
    : visitSum.map(x => x / runs)) : null;

  const L = (r: number) => NAMES[r];
  let lines: string[] = [];
  const f = focus;
  if (f !== null) {
    if (f === cheese) lines = [mode === "time" ? `t(${L(f)}) = 0` : `v(${L(f)}): —`, tx(t, "figMkMaze_atCheese", "the cheese: the walk stops here")];
    else if (mode === "time") {
      const tf = sol.time[f];
      const ns = sol.nb[f];
      if (!tf || !ns.length) lines = [`t(${L(f)}) = ∞`, tx(t, "figMkMaze_noWay", "no way to the cheese from here")];
      else {
        const k = ns.length;
        lines = [
          ...wrap(`t(${L(f)}) = 1 + 1/${k}·[`, ns.map(n => `t(${L(n)})`), "        ").map((l, i, a) => (i === a.length - 1 ? l + "]" : l)),
          ...wrap(`     = 1 + 1/${k}·[`, ns.map(n => show(sol.time[n]!)), "        ").map((l, i, a) => (i === a.length - 1 ? l + "]" : l)),
          `     = ${show(tf)}`,
        ];
      }
    } else if (!sol.visits) lines = [`v(${L(f)}) = ∞`, tx(t, "figMkMaze_noWay", "no way to the cheese from here")];
    else {
      const ins = sol.nb[f].filter(n => n !== cheese);
      const head = `v(${L(f)}) = `;
      const terms = [...(f === start ? ["1"] : []), ...ins.map(n => `v(${L(n)})/${sol.nb[n].length}`)];
      const nums = [...(f === start ? ["1"] : []), ...ins.map(n => `${show(sol.visits![n])}/${sol.nb[n].length}`)];
      lines = terms.length
        ? [...wrap(head, terms, "       "), ...wrap("     = ", nums, "       "), `     = ${show(sol.visits[f])}`]
        : [`${head}0`];
    }
  }
  const heading = mode === "time"
    ? tx(t, "figMkMaze_hTime", "EXPECTED MOVES TO THE CHEESE")
    : fill(tx(t, "figMkMaze_hVisits", "EXPECTED VISITS, STARTING AT {s}"), { s: L(start) });

  const pa = roomXY(mouse.from), pb = roomXY(mouse.at);
  const e = mouse.u >= 1 ? 1 : mouse.u * mouse.u * (3 - 2 * mouse.u);
  const mouseXY = { x: pa.x + (pb.x - pa.x) * e, y: pa.y + (pb.y - pa.y) * e - 30 };

  const drawing = (
    <MazeStage doors={doors} nb={sol.nb} cheese={cheese} start={start} mode={mode} values={values} sim={sim} focus={focus}
      mouse={mouseXY} onDoor={toggleDoor} onRoom={clickRoom} lines={lines}
      labels={{
        start: tx(t, "figMkMaze_start", "start"), heading, sim: tx(t, "figMkMaze_simShort", "sim"),
        never: tx(t, "figMkMaze_never", "∞: from these rooms the cheese cannot be reached"),
      }} />
  );
  const stage = (
    <>
      {drawing}
      <Transport t={t} speed playing={running && !stepMode} onPlay={playPause} onStep={stepOnce} onReset={() => clearSim()}
        playLabel={tx(t, "figMkMaze_play", "let mice run, one after another")}
        readout={`${tx(t, "figMkMaze_mice", "mice")}: ${runs}`} />
    </>
  );

  const modeChoice = (
    <Choice value={mode} onChange={(m: Mode) => setMode(m)} options={[
      ["time", tx(t, "figMkMaze_mTime", "moves to the cheese")],
      ["visits", tx(t, "figMkMaze_mVisits", "visits to each room")],
    ]} />
  );
  const toolChoice = (
    <>
      <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figMkMaze_click", "click a room to")}</span>
      <Choice value={tool} onChange={(v: Tool) => setTool(v)} options={[
        ["look", tx(t, "figMkMaze_tLook", "see its equation")],
        ["start", tx(t, "figMkMaze_tStart", "start there")],
        ["cheese", tx(t, "figMkMaze_tCheese", "put the cheese there")],
      ]} />
    </>
  );
  const totalVisits = sol.visits ? sol.visits.reduce((s, x) => s + fNum(x), 0) : NaN;
  const readouts = (
    <Row>
      {reachable && <Readout color={C.purple}>t({L(start)}) = {show(sol.time[start]!)}</Readout>}
      {reachable && mode === "visits" && <Readout color={C.teal}>Σ v = {f2(totalVisits, 2)}</Readout>}
      {runs > 0 && <Readout color={C.amber}>{tx(t, "figMkMaze_avg", "simulated average")}: {f2(moveSum / runs, 2)} {tx(t, "figMkMaze_moves", "moves")} ({runs} {tx(t, "figMkMaze_mice", "mice")})</Readout>}
      {reachable && <Btn onClick={() => addRuns(100)}>{tx(t, "figMkMaze_add100", "+100 mice at once")}</Btn>}
    </Row>
  );

  // ── Lab ──
  const exact = reachable ? fNum(sol.time[start]!) : NaN;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figMkMazeL1_t", "A mouse looking for cheese"),
      body: <>
        <p>{tx(t, "figMkMazeL1_b1", "Nine rooms, A to I. Every door is open, and the cheese is in I. From any room the mouse leaves through one of its open doors, each with the same chance: 1/2 from a corner, 1/3 from the middle of a side, 1/4 from the centre.")}</p>
        <p>{tx(t, "figMkMazeL1_b2", "This is a Markov chain with 9 states, and I is absorbing: once the mouse is there, it stays. Press the big ▶ and watch one mouse find the cheese.")}</p>
      </>,
      goal: { text: tx(t, "figMkMazeL1_g", "Let at least one mouse reach the cheese."), done: runs >= 1 },
      focus: "play",
      setup: () => { setMode("time"); setTool("look"); setFocus(4); reset(ALL_OPEN, EX.cheese, EX.start); },
    },
    {
      title: tx(t, "figMkMazeL2_t", "One move, then start afresh"),
      body: <>
        <p>{tx(t, "figMkMazeL2_b1", "The number in each room is t, the expected number of moves from that room to the cheese. First-step analysis gives it: one move is made, and then the mouse is in a neighbouring room, each with chance 1/(number of doors). So t(room) = 1 + the average of t over its neighbours, and t(I) = 0.")}</p>
        <p>{tx(t, "figMkMazeL2_b2", "The arrows show the doors of the chosen room and their chances; the panel on the right does the arithmetic.")}</p>
      </>,
      goal: { text: tx(t, "figMkMazeL2_g", "Click (or tap) another room to see its equation."), done: touchedRoom && focus !== 4 },
    },
    {
      title: tx(t, "figMkMazeL3_t", "Quick check"),
      body: <p>{tx(t, "figMkMazeL3_b", "Room F has three doors: to C, to E and to I.")}</p>,
      quiz: {
        q: tx(t, "figMkMazeL3_q", "t(C) = 15 and t(E) = 15. What is t(F)?"),
        options: ["11", "10", "15", "31/3"],
        answer: 0,
        why: tx(t, "figMkMazeL3_w", "t(F) = 1 + (t(C) + t(E) + t(I))/3 = 1 + (15 + 15 + 0)/3 = 1 + 10 = 11. Forgetting the 1 for the move itself gives 10."),
      },
    },
    {
      title: tx(t, "figMkMazeL4_t", "Many mice against the exact answer"),
      body: <p>{tx(t, "figMkMazeL4_b", "From A the exact answer is t(A) = 18 moves. One mouse can take 4 moves or 60. Send a hundred and compare their average with 18.")}</p>,
      goal: { text: tx(t, "figMkMazeL4_g", "Send at least 100 mice (the \"+100 mice\" button is the fastest way)."), done: runs >= 100 },
    },
    {
      title: tx(t, "figMkMazeL5_t", "Where the time goes"),
      body: <>
        <p>{tx(t, "figMkMazeL5_b1", "Now count visits instead: for each room, how many times, on average, the mouse that starts in A is in that room before it reaches the cheese. The start counts as one visit.")}</p>
        <p>{tx(t, "figMkMazeL5_b2", "These numbers are row A of the fundamental matrix N = (I − Q)⁻¹. Visits arrive through doors: v(room) = (1 if it is the start) + the sum, over its neighbours, of their visits divided by their number of doors.")}</p>
      </>,
      goal: { text: tx(t, "figMkMazeL5_g", "Choose \"visits to each room\"."), done: mode === "visits" },
    },
    {
      title: tx(t, "figMkMazeL6_t", "Quick check"),
      body: <p>{tx(t, "figMkMazeL6_b", "Row A of N is 3, 3, 3/2, 3, 3, 3/2, 3/2, 3/2 for the rooms A to H.")}</p>,
      quiz: {
        q: tx(t, "figMkMazeL6_q", "What do these eight numbers add up to, and why?"),
        options: [
          tx(t, "figMkMazeL6_o1", "18, the expected number of moves from A"),
          tx(t, "figMkMazeL6_o2", "1, because they are probabilities"),
          tx(t, "figMkMazeL6_o3", "9, one per room"),
          tx(t, "figMkMazeL6_o4", "17, one less than the moves"),
        ],
        answer: 0,
        why: tx(t, "figMkMazeL6_w", "Every visit to a room without cheese is followed by exactly one move. So the total number of visits is the number of moves, and on average 3 + 3 + 1.5 + 3 + 3 + 1.5 + 1.5 + 1.5 = 18 = t(A). In matrix form: t = N·1."),
      },
    },
    {
      title: tx(t, "figMkMazeL7_t", "One door makes a big difference"),
      body: <p>{tx(t, "figMkMazeL7_b", "Close the door between H and I, so that the only way into I is from F. Guess first: does t(A) grow by a little or by a lot?")}</p>,
      goal: { text: tx(t, "figMkMazeL7_g", "Click the wall between H and I to close that door."), done: !doors[HI] && cheese === 8 },
      setup: () => { setMode("time"); setTool("look"); reset(ALL_OPEN, EX.cheese, EX.start); },
    },
    {
      title: tx(t, "figMkMazeL8_t", "Move the cheese"),
      body: <p>{tx(t, "figMkMazeL8_b", "Pick \"put the cheese there\" and put it in the centre room E. Every room touches the centre or a room that does, so the mouse should find it much sooner.")}</p>,
      goal: { text: tx(t, "figMkMazeL8_g", "Put the cheese in E."), done: cheese === 4 },
      setup: () => { setMode("time"); setTool("cheese"); reset(ALL_OPEN, EX.cheese, EX.start); },
    },
  ];

  const deadEnd = sol.nb.findIndex((ns, r) => r !== cheese && ns.length === 1);
  const insights: Insight[] = [
    {
      id: "never", tone: "warn", when: !reachable && start !== cheese,
      title: tx(t, "figMkMazeI1_t", "The cheese is out of reach"),
      body: tx(t, "figMkMazeI1_b", "No path of open doors joins the start to the cheese, so the mouse wanders for ever: the expected time is infinite. In the matrix, I − Q has no inverse, because the rooms cut off from the cheese form a closed class of their own."),
    },
    {
      id: "sim", tone: "ok", when: runs >= 100 && reachable,
      title: tx(t, "figMkMazeI2_t", "Simulation against the exact answer"),
      body: fill(tx(t, "figMkMazeI2_b", "{n} mice took {m} moves on average; the exact expected value is {e}. The times vary a lot from mouse to mouse, so even 100 mice usually miss by a move or two. Add more and the average settles near the exact value."), {
        n: runs, m: f2(moveSum / runs, 2), e: f2(exact, 2),
      }),
    },
    {
      id: "sum", tone: "info", when: mode === "visits" && reachable,
      title: tx(t, "figMkMazeI3_t", "Visits add up to moves"),
      body: fill(tx(t, "figMkMazeI3_b", "The visits add up to {s}, which is t({a}): each visit to a room without cheese is followed by one move. That is t = N·1, the row sums of N."), {
        s: f2(totalVisits, 2), a: L(start),
      }),
    },
    {
      id: "dead", tone: "info", when: deadEnd >= 0 && reachable,
      title: tx(t, "figMkMazeI4_t", "A dead end"),
      body: fill(tx(t, "figMkMazeI4_b", "Room {r} has only one door, so the mouse always walks straight back out: t({r}) = 1 + t of its only neighbour. Dead ends cost time, but they never trap the mouse."), { r: deadEnd >= 0 ? L(deadEnd) : "" }),
    },
    {
      id: "oneway", tone: "warn", when: !doors[HI] && cheese === 8 && reachable && start === 0,
      title: tx(t, "figMkMazeI5_t", "Almost twice as long"),
      body: fill(tx(t, "figMkMazeI5_b", "With one door fewer into the cheese, t(A) went from 18 to {t}. The mouse now has to be in F and pick the right door of three, and every wrong pick sends it back into the maze."), { t: f2(exact, 2) }),
    },
  ];

  const controls = <Row>{modeChoice}<span className="w-px h-5 bg-[var(--border)] mx-1" />{toolChoice}</Row>;
  return (
    <>
      <Figure fullscreen={false}
        title={tx(t, "figMkMaze_title", "A mouse in a maze: expected moves and visits")}
        head={<>
          <Btn onClick={() => { setMode("time"); setTool("look"); setFocus(4); reset(ALL_OPEN, EX.cheese, EX.start); }}>{tx(t, "figMkMaze_reset", "all doors open")}</Btn>
          <LabButton lab={lab} t={t} />
        </>}
        controls={<>{controls}{readouts}</>}
        note={tx(t, "figMkMaze_note", "The numbers are exact. Click a wall to open or close its door, click a room to see its first-step equation, and let mice run to check the average. Close doors until a room is cut off, and its number becomes ∞.")}
      >
        <div ref={vis.ref}>{stage}</div>
      </Figure>

      <Lab lab={lab} t={t}
        recap={[
          tx(t, "figMkMazeR1", "Expected time: one move, then a fresh start from a neighbour, so t(room) = 1 + the average of the neighbours' t, with t = 0 at the cheese."),
          tx(t, "figMkMazeR2", "Expected visits from a start are a row of N = (I − Q)⁻¹; the start counts as one visit."),
          tx(t, "figMkMazeR3", "The visits add up to the expected time: t = N·1."),
          tx(t, "figMkMazeR4", "If the cheese cannot be reached, the time is infinite and I − Q has no inverse."),
        ]}
        title={tx(t, "figMkMaze_title", "A mouse in a maze: expected moves and visits")}
        steps={labSteps} insights={insights} stage={stage}
        controls={<>{controls}{readouts}</>}
      />
    </>
  );
}
