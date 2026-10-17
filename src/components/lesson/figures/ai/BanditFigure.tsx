"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Slider, Btn, C, T, mulberry32, useFrame, useRerender, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { choose, learn, makeAgent, pullBernoulli, type Agent, type Rule } from "./bandit";

// ── What this figure shows ────────────────────────────────────────────────────
// Five slot machines that pay 1 with hidden probabilities (0.30, 0.55, 0.45,
// 0.70, 0.60). Pull them yourself, or let an agent pull: greedy, ε-greedy or
// UCB1. Each machine shows how often it was pulled and its average payout so
// far; with UCB1 a line shows the optimistic bound the agent actually ranks
// by. The curve is the regret: what was lost, in expectation, by not pulling
// the best machine every time.

const P = [0.3, 0.55, 0.45, 0.7, 0.6];
const BEST = Math.max(...P);
const NAMES = ["A", "B", "C", "D", "E"];
type Mode = "you" | "greedy" | "eps" | "ucb";

const W = 640, H = 262;
const MX = (i: number) => 26 + i * 124, MW = 96, TOP = 22, BAR = 118;
const GY = 196, GH = 56;

type State = { agent: Agent; rng: () => number; regret: number[]; reward: number; last: { arm: number; r: number } | null };

export function BanditFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("you");
  const [eps, setEps] = useState(0.1);
  const [c, setC] = useState(Math.SQRT2);
  const [reveal, setReveal] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [seed, setSeed] = useState(1);
  const vis = useVisible<HTMLDivElement>();
  const rerender = useRerender();
  const acc = useRef(0);
  const L = (k: string, en: string) => tx(t, `figAiBandit_${k}`, en);

  const rule = (m: Mode, e = eps, cc = c): Rule => (m === "ucb" ? { kind: "ucb", c: cc } : m === "eps" ? { kind: "eps", eps: e } : { kind: "greedy" });
  const st = useRef<State | null>(null);
  const fresh = (m = mode, e = eps, cc = c, sd = seed): State => ({ agent: makeAgent(5, rule(m, e, cc)), rng: mulberry32(sd), regret: [0], reward: 0, last: null });
  if (!st.current) st.current = fresh();
  const S = st.current;

  const reset = (m = mode, e = eps, cc = c, sd = seed) => { st.current = fresh(m, e, cc, sd); setPlaying(false); rerender(); };
  const pull = (arm: number) => {
    const r = pullBernoulli(P[arm], S.rng);
    learn(S.agent, arm, r);
    S.reward += r;
    S.regret.push(S.regret[S.regret.length - 1] + BEST - P[arm]);
    S.last = { arm, r };
  };
  const agentPull = (n: number) => { for (let i = 0; i < n; i++) pull(choose(S.agent, S.rng)); rerender(); };

  // About 12 pulls a second while playing (then faster after the first hundred, so long runs are watchable)
  useFrame(playing && vis.on && mode !== "you", dt => {
    acc.current += dt * (S.agent.t < 100 ? 12 : 60);
    const n = Math.floor(acc.current);
    if (n > 0) { acc.current -= n; agentPull(Math.min(n, 2000 - S.agent.t)); }
    if (S.agent.t >= 2000) setPlaying(false);
  });

  const a = S.agent;
  const bestShare = a.t ? a.N[3] / a.t : 0;
  const ucbBound = (i: number) => (a.N[i] === 0 ? 1 : Math.min(1.25, a.Q[i] + c * Math.sqrt(Math.log(Math.max(1, a.t)) / a.N[i])));
  const yOf = (v: number) => TOP + BAR - BAR * Math.max(0, Math.min(1, v));
  const R = S.regret, maxR = Math.max(10, R[R.length - 1]), maxT = Math.max(100, R.length - 1);

  return (
    <Figure
      title={L("title", "Five slot machines: explore or exploit?")}
      head={<Choice value={mode} onChange={m => { setMode(m); reset(m); }}
        options={[["you", L("you", "you pull")], ["greedy", "greedy"], ["eps", "ε-greedy"], ["ucb", "UCB1"]] as const} />}
      controls={<>
        {mode === "eps" && <Slider label="ε" value={eps} min={0} max={0.5} step={0.01} onChange={v => { setEps(v); reset(mode, v); }} />}
        {mode === "ucb" && <Slider label="c" value={c} min={0} max={3} step={0.05} onChange={v => { setC(v); reset(mode, eps, v); }} />}
        <Row>
          {mode !== "you" && <Btn onClick={() => agentPull(Math.min(100, 2000 - a.t))}>+100</Btn>}
          <Btn active={reveal} onClick={() => setReveal(v => !v)}>{L("reveal", "reveal the odds")}</Btn>
          <Btn onClick={() => { const s2 = seed + 1; setSeed(s2); reset(mode, eps, c, s2); }}>{L("again", "new run")}</Btn>
        </Row>
        <Row>
          <Readout>{L("pulls", "pulls")} {a.t}</Readout>
          <Readout>{L("won", "won")} {S.reward}</Readout>
          <Readout color={C.red}>{L("regret", "regret")} {R[R.length - 1].toFixed(1)}</Readout>
          <Readout color={bestShare > 0.6 ? C.green : C.fg}>{L("onBest", "pulls on D")} {(100 * bestShare).toFixed(0)}%</Readout>
        </Row>
      </>}
      note={L("note", "Each machine pays 1 or 0. The filled bar is the average it has paid you so far, Q; N is how many times it was pulled. Pull them yourself first: how many pulls before you trust a machine? Then let the agents play (press play). Greedy always pulls the best average so far, so it stays with the first machine that pays out, whichever it is: in about 3 runs out of 4 that is not the best machine, D (press \"new run\" a few times). ε-greedy pulls a random machine a fraction ε of the time, so it keeps checking. UCB1 ranks machines by the line above each bar, the average plus a bonus that is large for machines pulled rarely: it explores where it is still unsure. Regret adds up, pull by pull, how much less the chosen machine pays on average than D (0.70). A rule that keeps exploring at a fixed rate, like ε-greedy, makes its regret grow in a straight line forever; UCB1's grows ever more slowly.")}
    >
      <div ref={vis.ref} className="flex flex-col">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
          {P.map((p, i) => {
            const x = MX(i), last = S.last?.arm === i;
            return (
              <g key={i} onClick={() => { if (mode === "you") { pull(i); rerender(); } }} style={{ cursor: mode === "you" ? "pointer" : "default" }}>
                <rect x={x} y={TOP - 14} width={MW} height={BAR + 52} rx={10} fill="var(--card)" stroke={last ? (S.last!.r ? C.green : C.muted) : C.axis} strokeWidth={last ? 2.4 : 1.2} />
                <T x={x + 10} y={TOP + 2} size={12} bold color={C.fg}>{NAMES[i]}</T>
                {/* the payout scale, 0 to 1 */}
                <rect x={x + 40} y={TOP} width={22} height={BAR} rx={3} fill={C.axis} fillOpacity={0.25} />
                {a.N[i] > 0 && <rect x={x + 40} y={yOf(a.Q[i])} width={22} height={TOP + BAR - yOf(a.Q[i])} rx={3} fill={C.sky} fillOpacity={0.8} />}
                {mode === "ucb" && a.t > 0 && <g>
                  <line x1={x + 51} y1={yOf(a.Q[i])} x2={x + 51} y2={yOf(ucbBound(i))} stroke={C.purple} strokeWidth={2} />
                  <line x1={x + 44} y1={yOf(ucbBound(i))} x2={x + 58} y2={yOf(ucbBound(i))} stroke={C.purple} strokeWidth={2.4} />
                </g>}
                {reveal && <line x1={x + 34} y1={yOf(p)} x2={x + 68} y2={yOf(p)} stroke={C.red} strokeWidth={2} strokeDasharray="4 2" />}
                {reveal && <T x={x + 70} y={yOf(p) + 3.5} size={9} color={C.red}>{p.toFixed(2)}</T>}
                <T x={x + 10} y={TOP + BAR + 18} size={9.5} color={C.fg}>N {a.N[i]}</T>
                <T x={x + 10} y={TOP + BAR + 31} size={9.5} color={C.sky}>Q {a.N[i] ? a.Q[i].toFixed(2) : "–"}</T>
                {last && <T x={x + MW - 10} y={TOP + 2} size={11} anchor="end" bold color={S.last!.r ? C.green : C.muted}>{S.last!.r ? "+1" : "0"}</T>}
              </g>
            );
          })}
          {/* regret so far */}
          <line x1={26} y1={GY + GH} x2={W - 18} y2={GY + GH} stroke={C.axis} />
          <polyline fill="none" stroke={C.red} strokeWidth={1.8}
            points={R.map((v, i) => `${(26 + ((W - 44) * i) / maxT).toFixed(1)},${(GY + GH - (GH * v) / maxR).toFixed(1)}`).join(" ")} />
          <T x={28} y={GY + 4} size={9} color={C.red}>{L("regretCurve", "regret")} ({maxR.toFixed(0)})</T>
          <T x={W - 18} y={GY + GH - 4} size={9} anchor="end">{maxT} {L("pullsAxis", "pulls")}</T>
        </svg>
        {mode !== "you" && <Transport t={t} playing={playing} onPlay={() => setPlaying(v => !v)}
          onStep={() => { setPlaying(false); agentPull(1); }} onReset={() => reset()}
          readout={`${L("pulls", "pulls")} ${a.t} / 2000`} />}
      </div>
    </Figure>
  );
}
