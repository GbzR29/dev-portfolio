"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Slider, Btn, C, T, mulberry32, useFrame, useRerender, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { CLIFF, Runner, greedyPath, makeAgent, qAt, type Learner } from "./qlearn";

// ── What this figure shows ────────────────────────────────────────────────────
// Cliff walking (Sutton & Barto): Q-learning or SARSA learning live with
// ε-greedy exploration. Each cell shows its best action and is shaded by its
// best Q; the purple line is the greedy route. The curve below is the reward
// of each episode as actually played (with exploration). Q-learning learns the
// shortest route along the edge but keeps falling off while it explores
// (about −49 per episode); SARSA learns the values of what it really does,
// exploration included, and takes the safe route along the top (about −27).

const G = CLIFF;
const CS = 46, GX = 20, GY = 10;
const W = 600, GRIDH = CS * G.h;
const PY = GY + GRIDH + 18, PH = 70;
const H = PY + PH + 18;
const ARROW = ["↑", "→", "↓", "←"];
const MAXE = 500;

export function CliffFigure({ t }: { t?: TrackTranslations }) {
  const [kind, setKind] = useState<Learner>("q");
  const [eps, setEps] = useState(0.1);
  const [seed, setSeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();
  const rerender = useRerender();
  const acc = useRef(0);
  const L = (k: string, en: string) => tx(t, `figAiCliff_${k}`, en);

  const make = (k = kind, e = eps, sd = seed) => new Runner(makeAgent(G, 0.5, 1, e), k, mulberry32(sd), 1000);
  const run = useRef<Runner | null>(null);
  if (!run.current) run.current = make();
  const R = run.current;
  const reset = (k = kind, e = eps, sd = seed) => { run.current = make(k, e, sd); setPlaying(false); };

  // Steps per second grow with experience, so the early wandering is visible and later episodes do not drag
  useFrame(playing && vis.on, dt => {
    acc.current += dt * (R.episodes < 3 ? 25 : R.episodes < 30 ? 120 : 600);
    let n = Math.floor(acc.current);
    acc.current -= n;
    while (n-- > 0 && R.episodes < MAXE) R.step();
    if (R.episodes >= MAXE) setPlaying(false);
    rerender();
  });
  const episodes = (k: number) => { setPlaying(false); for (let i = 0; i < k && R.episodes < MAXE; i++) R.finish(); rerender(); };

  const ag = R.ag;
  const best = (s: number) => Math.max(...qAt(ag, s));
  let vmin = 0;
  for (let s = 0; s < G.w * G.h; s++) vmin = Math.min(vmin, best(s));
  const path = R.episodes > 0 ? greedyPath(ag) : [];
  const reaches = path.length > 0 && path[path.length - 1] === G.goal[1] * G.w + G.goal[0];
  const center = (s: number) => ({ x: GX + (s % G.w) * CS + CS / 2, y: GY + Math.floor(s / G.w) * CS + CS / 2 });
  const rets = R.returns;
  const recent = rets.slice(-50);
  const avg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
  const py = (v: number) => PY + PH * Math.min(1, Math.max(v, -150) / -150);
  const px = (i: number) => GX + ((W - GX - 20) * i) / Math.max(100, rets.length);

  return (
    <Figure
      title={L("title", "Cliff walking: Q-learning against SARSA")}
      head={<Choice value={kind} onChange={k => { setKind(k); reset(k); }} options={[["q", "Q-learning"], ["sarsa", "SARSA"]] as const} />}
      controls={<>
        <Slider label={L("eps", "exploration ε")} value={eps} min={0} max={0.3} step={0.01} onChange={v => { setEps(v); reset(kind, v); }} />
        <Row>
          <Btn onClick={() => episodes(1)}>{L("one", "+1 episode")}</Btn>
          <Btn onClick={() => episodes(100)}>{L("hundred", "+100 episodes")}</Btn>
          <Btn onClick={() => { const s2 = seed + 1; setSeed(s2); reset(kind, eps, s2); }}>{L("again", "new run")}</Btn>
        </Row>
        <Row>
          <Readout>{L("episodes", "episodes")} {R.episodes}</Readout>
          {rets.length > 0 && <Readout>{L("last", "last episode")} {rets[rets.length - 1]}</Readout>}
          {rets.length > 0 && <Readout color={C.red}>{L("avg", "average of the last 50")} {avg.toFixed(1)}</Readout>}
          {path.length > 1 && <Readout color={C.purple}>{reaches ? L("route", "greedy route: {n} steps").replace("{n}", String(path.length - 1)) : L("noRoute", "greedy route: not found yet")}</Readout>}
        </Row>
      </>}
      note={L("note", "The agent starts at S and must reach G; each step costs −1, and the dark cells are a cliff: stepping on one costs −100 and sends the agent back to S. Each cell shows the action with the highest Q and is shaded by that value (fainter = worse). Press play: the first episode wanders for hundreds of steps, then the values spread back from G. With Q-learning the purple greedy route soon runs right along the cliff edge, 13 steps, the shortest; but the agent still explores 10% of the time, and a random step there drops it off the cliff, so the episodes it actually plays average about −49. Switch to SARSA: it learns the value of what it really does, random steps included, so the edge looks dangerous to it, and its route goes along the top, 17 steps, while its episodes average about −27. Set ε to 0 and both learn the edge route and score −13 every time, since nothing random ever happens.")}
    >
      <div ref={vis.ref} className="flex flex-col">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
          {Array.from({ length: G.w * G.h }, (_, s) => {
            const x = s % G.w, y = Math.floor(s / G.w), cx = GX + x * CS, cy = GY + y * CS;
            const cliff = G.cliff(x, y), isGoal = x === G.goal[0] && y === G.goal[1], isStart = x === G.start[0] && y === G.start[1];
            const q = qAt(ag, s), v = Math.max(...q);
            const a = q.indexOf(v);
            const tried = q.some(z => z !== 0);
            return (
              <g key={s}>
                <rect x={cx + 1} y={cy + 1} width={CS - 2} height={CS - 2} rx={4}
                  fill={cliff ? C.red : isGoal ? C.green : vmin < 0 && tried ? C.sky : "var(--card)"}
                  fillOpacity={cliff ? 0.55 : isGoal ? 0.3 : vmin < 0 && tried ? 0.08 + 0.5 * (1 - v / vmin) : 1}
                  stroke={C.axis} strokeWidth={0.8} />
                {isStart && <T x={cx + 5} y={cy + 13} size={9.5} bold color={C.fg}>S</T>}
                {isGoal && <T x={cx + CS / 2} y={cy + CS / 2 + 5} size={13} anchor="middle" bold color={C.fg}>G</T>}
                {!cliff && !isGoal && tried && <T x={cx + CS / 2} y={cy + CS / 2 + 6} size={15} anchor="middle" color={C.fg}>{ARROW[a]}</T>}
              </g>
            );
          })}
          {path.length > 1 && <polyline fill="none" stroke={C.purple} strokeWidth={3} strokeOpacity={0.75} strokeLinejoin="round"
            points={path.map(s => { const p = center(s); return `${p.x},${p.y}`; }).join(" ")} />}
          {(() => { const p = center(R.s); return <circle cx={p.x} cy={p.y} r={9} fill={C.amber} stroke="var(--card)" strokeWidth={2} />; })()}
          {/* reward of each episode, clipped at −150 */}
          <line x1={GX} y1={py(-13)} x2={W - 20} y2={py(-13)} stroke={C.green} strokeDasharray="4 3" strokeOpacity={0.7} />
          <T x={W - 22} y={py(-13) - 4} size={8.5} anchor="end" color={C.green}>−13</T>
          <line x1={GX} y1={PY + PH} x2={W - 20} y2={PY + PH} stroke={C.axis} />
          {rets.length > 1 && <polyline fill="none" stroke={C.red} strokeWidth={1.2} strokeOpacity={0.8}
            points={rets.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ")} />}
          <T x={GX} y={PY - 4} size={8.5} color={C.red}>{L("curve", "reward per episode (clipped at −150)")}</T>
        </svg>
        <Transport t={t} playing={playing} onPlay={() => setPlaying(v => !v)} onStep={() => { setPlaying(false); R.step(); rerender(); }}
          onReset={() => reset()} readout={`${L("episodes", "episodes")} ${R.episodes} / ${MAXE}`} />
      </div>
    </Figure>
  );
}
