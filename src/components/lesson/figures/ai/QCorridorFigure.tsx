"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Readout, Row, Btn, C, T, mulberry32, useFrame, useRerender, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Runner, corridor, makeAgent, qAt, type StepLog } from "./qlearn";

// ── What this figure shows ────────────────────────────────────────────────────
// Q-learning on a corridor of five cells, one step at a time: the agent starts
// at the left, the goal on the right pays +1, other steps pay 0, α = 0.5,
// γ = 0.9. It always takes the action with the larger Q (a coin decides ties),
// so the first episode is a random walk. Each step shows its update written
// out. The value of reaching the goal travels back one cell per episode, and
// the table converges to 0.9³, 0.9², 0.9, 1 = 0.729, 0.81, 0.9, 1.

const N = 5;
const W = 640, H = 196;
const CW = 104, X0 = 60, CY = 30, CH = 54;
const ARW = ["←", "→"];

export function QCorridorFigure({ t }: { t?: TrackTranslations }) {
  const make = () => new Runner(makeAgent(corridor(N), 0.5, 0.9, 0), "q", mulberry32(4), 500);
  const run = useRef<Runner | null>(null);
  if (!run.current) run.current = make();
  const [last, setLast] = useState<StepLog | null>(null);
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();
  const rerender = useRerender();
  const acc = useRef(0);
  const L = (k: string, en: string) => tx(t, `figAiQc_${k}`, en);
  const R = run.current;

  const step = () => { setLast(R.step()); rerender(); };
  useFrame(playing && vis.on, dt => {
    acc.current += dt * 3;
    if (acc.current >= 1) { acc.current -= 1; step(); }
  });
  const finish = () => { setPlaying(false); let l: StepLog | null = null; R.finish(x => { l = x; }); setLast(l); rerender(); };
  const reset = () => { run.current = make(); setLast(null); setPlaying(false); };

  const ag = R.ag;
  const agentCell = R.s;
  const f = (v: number) => v.toFixed(3);
  const changed = last && Math.abs(last.next - last.old) > 1e-12;

  return (
    <Figure
      title={L("title", "Q-learning, one update at a time")}
      controls={<Row>
        <Btn onClick={finish}>{L("finish", "finish this episode")}</Btn>
        <Readout>{L("episode", "episode")} {R.episodes + 1}</Readout>
        <Readout>{L("step", "step")} {R.steps}</Readout>
        {R.returns.length > 0 && <Readout>{L("lastLen", "episodes so far")} {R.returns.length}</Readout>}
      </Row>}
      note={L("note", "Five cells; the agent (purple) starts on the left and the episode ends when it reaches the goal, which pays +1. Under each cell are its two action values, Q(←) and Q(→), all 0 at first. The agent takes the action with the larger Q and tosses a coin on ties, so the first episode wanders. Nothing changes until the very last step of episode 1: stepping into the goal gives the target 1, and Q(3, →) moves halfway there, to 0.5. In episode 2, stepping from cell 2 to cell 3 now finds max Q = 0.5 there, so Q(2, →) gets 0.9 · 0.5 · 0.5 = 0.225. Each episode carries the news one cell further back. Keep finishing episodes: the → values approach 0.729, 0.81, 0.9 and 1, the goal's +1 discounted once per step still needed.")}
    >
      <div ref={vis.ref} className="flex flex-col">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
          {Array.from({ length: N }, (_, i) => {
            const x = X0 + i * CW, goal = i === N - 1;
            const q = qAt(ag, i);
            const hot = last && changed && last.s === i;
            return (
              <g key={i}>
                <rect x={x + 3} y={CY} width={CW - 6} height={CH} rx={8} fill={goal ? C.green : "var(--card)"} fillOpacity={goal ? 0.2 : 1}
                  stroke={hot ? C.amber : C.axis} strokeWidth={hot ? 2.6 : 1.2} />
                <T x={x + 10} y={CY + 14} size={9}>{goal ? L("goal", "goal +1") : String(i)}</T>
                {agentCell === i && <circle cx={x + CW / 2} cy={CY + CH / 2 + 4} r={11} fill={C.purple} />}
                {!goal && q.map((v, d) => (
                  <g key={d}>
                    <T x={x + 14} y={CY + CH + 26 + d * 22} size={12} bold color={d === 1 ? C.sky : C.muted}>{ARW[d]}</T>
                    <rect x={x + 30} y={CY + CH + 15 + d * 22} width={58} height={14} rx={3} fill={C.axis} fillOpacity={0.25} />
                    <rect x={x + 30} y={CY + CH + 15 + d * 22} width={58 * Math.min(1, v)} height={14} rx={3} fill={d === 1 ? C.sky : C.muted} fillOpacity={0.75} />
                    <T x={x + 59} y={CY + CH + 26 + d * 22} size={9.5} anchor="middle" color={C.fg} bold={!!(hot && last!.a === d)}>{f(v)}</T>
                  </g>
                ))}
              </g>
            );
          })}
          <T x={X0} y={H - 12} size={9}>{L("legend", "Q(s, ←) and Q(s, →) under each cell")}</T>
        </svg>
        <div className="px-4 pb-1 min-h-[3.4rem]">
          {last
            ? <>
                <p className="text-[12.5px] text-[var(--text-main)] leading-snug">
                  {L("did", "In cell {s} the agent went {a}, got r = {r}{goal}.").replace("{s}", String(last.s)).replace("{a}", ARW[last.a]).replace("{r}", String(last.r))
                    .replace("{goal}", last.done ? L("reached", " and reached the goal (nothing comes after it, so max Q′ = 0)") : L("landed", " and landed in cell {n}, whose best Q is {m}").replace("{n}", String(last.s2)).replace("{m}", f(last.nextQ)))}
                </p>
                <p className="text-[11.5px] font-mono text-[var(--primary)] mt-1 break-words">
                  {`Q(${last.s}, ${ARW[last.a]}) ← ${f(last.old)} + 0.5 · (${last.r} + 0.9 · ${f(last.nextQ)} − ${f(last.old)}) = ${f(last.next)}`}
                </p>
              </>
            : <p className="text-[12.5px] text-[var(--text-main)] leading-snug">{L("start", "Every Q is 0. Press play or step.")}</p>}
        </div>
        <Transport t={t} playing={playing} onPlay={() => setPlaying(v => !v)} onStep={() => { setPlaying(false); step(); }} onReset={reset}
          readout={`${L("episode", "episode")} ${R.episodes + 1}`} />
      </div>
    </Figure>
  );
}
