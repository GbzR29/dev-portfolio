"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Readout, Row, Slider, Sliders, C, T } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { useStepper } from "@/components/lesson/kit/Stepper";
import { RN43, outcomes, policy, qValues, sweep, type Dir, type Params } from "./mdp";

// ── What this figure shows ────────────────────────────────────────────────────
// Value iteration on Russell & Norvig's 4 × 3 world, one sweep per step. Each
// cell shows its value V and the action that is best for the current values.
// Click a cell to see its Bellman update written out. The sliders change the
// problem: the living reward (paid on every ordinary step), the chance of
// slipping sideways, and the discount γ. A large cost of living sends the agent
// into the pit to end the pain; a positive one makes it avoid both exits.

const MAXS = 40;
const CS = 96, GX = 10, GY = 10;
const W = 640, H = CS * 3 + 20;
const PX = GX + CS * 4 + 22;
const ARROW = ["↑", "→", "↓", "←"];

export function GridWorldFigure({ t }: { t?: TrackTranslations }) {
  const [p, setP] = useState<Params>({ living: -0.04, slip: 0.2, gamma: 1 });
  const [sel, setSel] = useState<[number, number]>([2, 0]);
  const s = useStepper(MAXS, 450, 120);
  const k = Math.round(s.raw);
  const L = (key: string, en: string) => tx(t, `figAiGrid_${key}`, en);
  const g = RN43;

  const { V, prev, delta } = useMemo(() => {
    let V = new Float64Array(12), prev = V, delta = 0;
    for (let i = 0; i < k; i++) { prev = V; const r = sweep(g, V, p); V = r.V; delta = r.delta; }
    return { V, prev, delta };
  }, [k, p, g]);
  const pi = policy(g, V, p);

  const [sx, sy] = sel;
  const selExit = g.exit(sx, sy), selWall = g.wall(sx, sy);
  const q = !selExit && !selWall ? qValues(g, prev, sx, sy, p) : null;   // the update that produced the shown V
  const bestA = q ? (q.indexOf(Math.max(...q)) as Dir) : 0;
  const v2 = (x: number) => (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(3));
  const shade = (v: number) => (v >= 0 ? C.green : C.red);
  const set = (patch: Partial<Params>) => setP(o => ({ ...o, ...patch }));

  return (
    <Figure
      title={L("title", "Value iteration on a 4 × 3 world")}
      controls={<>
        <Sliders>
          <Slider label={L("living", "living reward")} value={p.living} min={-2} max={0.5} step={0.01} onChange={v => set({ living: v })} />
          <Slider label={L("slip", "slip chance")} value={p.slip} min={0} max={0.5} step={0.05} onChange={v => set({ slip: v })} />
          <Slider label="γ" value={p.gamma} min={0.5} max={1} step={0.01} onChange={v => set({ gamma: v })} />
        </Sliders>
        <Row>
          <Readout>{L("sweep", "sweep")} {k}</Readout>
          <Readout color={k > 0 && delta < 1e-4 ? C.green : C.fg}>{L("change", "largest change")} {k ? delta.toExponential(1) : "–"}</Readout>
        </Row>
      </>}
      note={L("note", "The agent starts anywhere and wants to reach the +1 exit without falling into the −1 exit (the pit); the dark cell is a wall. A move goes the intended way 80% of the time and slides to each side 10% of the time; bumping into a wall or the edge means staying put. Every ordinary step pays the living reward, −0.04 by default. Value iteration starts with every value at 0 and, on each sweep, replaces each cell's value with the best action's expected reward plus discounted next value. Watch the values spread outward from the exits, one cell per sweep, and settle after about 30 sweeps. Click a cell to see its update. Then break it: a living reward of −2 makes every step so painful that the two cells beside the pit jump in; at −0.04 the bottom-right cell takes the long way round to avoid passing beside the pit; at 0 the cell beside the pit walks into the wall on purpose, since staying put risks nothing; above 0 the agent avoids both exits forever, and with γ = 1 the values never stop growing.")}
    >
      <div className="flex flex-col">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
          {Array.from({ length: 12 }, (_, i) => {
            const x = i % 4, y = Math.floor(i / 4), cx = GX + x * CS, cy = GY + y * CS;
            const wall = g.wall(x, y), ex = g.exit(x, y), v = V[i];
            const isSel = sx === x && sy === y;
            const a = Math.min(1, Math.abs(v)) * (ex !== null ? 0.45 : 0.32);
            return (
              <g key={i} onClick={() => setSel([x, y])} style={{ cursor: "pointer" }}>
                <rect x={cx + 2} y={cy + 2} width={CS - 4} height={CS - 4} rx={8}
                  fill={wall ? C.axis : k === 0 && ex === null ? "var(--card)" : shade(v)} fillOpacity={wall ? 0.9 : k === 0 && ex === null ? 1 : a}
                  stroke={isSel ? C.amber : C.axis} strokeWidth={isSel ? 3 : 1} />
                {!wall && <T x={cx + CS / 2} y={cy + (ex !== null ? CS / 2 + 6 : 40)} size={ex !== null ? 18 : 14} anchor="middle" bold color={C.fg}>
                  {ex !== null ? (ex > 0 ? "+1" : "−1") : k === 0 ? "0" : v2(v)}
                </T>}
                {!wall && ex === null && k > 0 && <T x={cx + CS / 2} y={cy + 72} size={22} anchor="middle" bold color={C.purple}>{ARROW[pi[i]]}</T>}
                <T x={cx + 8} y={cy + 16} size={8.5}>{`(${x}, ${y})`}</T>
              </g>
            );
          })}
          {/* the Bellman update of the selected cell */}
          <T x={PX} y={22} size={10.5} bold color={C.fg}>{L("update", "update of")} ({sx}, {sy})</T>
          {selWall && <T x={PX} y={46} size={10}>{L("isWall", "a wall: never visited")}</T>}
          {selExit !== null && <T x={PX} y={46} size={10}>{L("isExit", "an exit: worth its reward, then the episode ends")}</T>}
          {q && k > 0 && <>
            <T x={PX} y={42} size={9.5}>{L("qLine", "Q = Σ P · (r + γ V′), with V of sweep {k}").replace("{k}", String(k - 1))}</T>
            {q.map((qv, d) => (
              <g key={d}>
                <T x={PX} y={66 + d * 20} size={11} bold color={d === bestA ? C.purple : C.muted}>{ARROW[d]}</T>
                <T x={PX + 18} y={66 + d * 20} size={10.5} color={d === bestA ? C.fg : C.muted} bold={d === bestA}>{v2(qv)}</T>
              </g>
            ))}
            {outcomes(g, sx, sy, bestA, p.slip).map(([pr, nx, ny], j) => (
              <T key={j} x={PX} y={160 + j * 18} size={9.5} color={C.fg}>
                {`${j === 0 ? "" : "+ "}${pr.toFixed(2)} · (${p.living.toFixed(2)} + ${p.gamma.toFixed(2)} · ${v2(prev[ny * 4 + nx])})`}
              </T>
            ))}
            <T x={PX} y={222} size={10.5} bold color={C.purple}>{`V = max = ${v2(q[bestA])}`}</T>
          </>}
          {q && k === 0 && <T x={PX} y={46} size={10}>{L("start", "every value starts at 0: press play")}</T>}
        </svg>
        <Transport t={t} playing={s.playing} onPlay={s.play} onStep={s.next} onBack={s.prev} onReset={s.restart} speed
          readout={`${L("sweep", "sweep")} ${k} / ${MAXS}`} />
      </div>
    </Figure>
  );
}
