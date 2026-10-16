"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Readout, Row, Slider, C, T, plot, useFrame, useVisible, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { contourPaths, geoLevels } from "./contours";
import { OPTS, SURF, path, stepsTo, type OptName, type Surface } from "./optRace";

// ── What this figure shows ────────────────────────────────────────────────────
// SGD, momentum, RMSProp and Adam racing from the same start on a loss with
// two parameters. "Ravine" is a long narrow bowl, curvature 1 along x and 100
// along y: plain SGD's learning rate is capped by the steep direction, so it
// crawls along the flat one. "Banana" is Rosenbrock's curved valley. Each
// optimiser starts with a learning rate that suits it; the slider scales all
// four together, so you can push SGD past its limit and watch it explode.

const MAX = 1000;
const COLOR: Record<OptName, string> = { sgd: C.red, momentum: C.sky, rmsprop: C.amber, adam: C.green };
const P = (s: Surface) => { const [x0, x1, y0, y1] = SURF[s].view; return plot({ W: 620, H: 300, x0, x1, y0, y1 }); };

export function OptimiserFigure({ t }: { t?: TrackTranslations }) {
  const [surf, setSurf] = useState<Surface>("ravine");
  const [scale, setScale] = useState(1);
  const [on, setOn] = useState<Record<OptName, boolean>>({ sgd: true, momentum: true, rmsprop: true, adam: true });
  const [n, setN] = useState(0);
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();
  const L = (k: string, en: string) => tx(t, `figAiOpt_${k}`, en);
  const names: Record<OptName, string> = { sgd: "SGD", momentum: L("momentum", "momentum"), rmsprop: "RMSProp", adam: "Adam" };

  const p = P(surf), S = SURF[surf];
  const paths = useMemo(() => Object.fromEntries(OPTS.map(o => [o, path(surf, o, S.lr[o] * scale, MAX)])) as Record<OptName, [number, number][]>, [surf, scale, S]);
  const done = useMemo(() => Object.fromEntries(OPTS.map(o => [o, stepsTo(surf, paths[o])])) as Record<OptName, number>, [surf, paths]);
  const contours = useMemo(() => {
    const [x0, x1, y0, y1] = S.view;
    return contourPaths(p, S.f, x0, x1, y0, y1, geoLevels(surf === "ravine" ? 0.02 : 0.05, surf === "ravine" ? 40 : 60, 12), 90, 60);
  }, [surf, S, p]);

  useFrame(playing && vis.on, dt => setN(v => {
    const next = v + dt * 90;                                   // 90 steps per second
    if (next >= MAX) { setPlaying(false); return MAX; }
    return next;
  }));
  const k = Math.floor(n);
  const restart = () => { setN(0); setPlaying(false); };
  const change = (fn: () => void) => { fn(); restart(); };

  const inView = ([x, y]: [number, number]) => Number.isFinite(x) && Number.isFinite(y);
  const clampPt = ([x, y]: [number, number]): [number, number] => [
    Math.max(p.x0 - 5, Math.min(p.x1 + 5, x)), Math.max(p.y0 - 5, Math.min(p.y1 + 5, y))];

  return (
    <Figure
      title={L("title", "Four optimisers, one valley")}
      head={<Choice value={surf} onChange={v => change(() => setSurf(v))} options={[["ravine", L("ravine", "narrow ravine")], ["banana", L("banana", "curved valley")]] as const} />}
      controls={<>
        <Slider label={L("scale", "learning rates ×")} value={scale} min={0.25} max={2} step={0.05} onChange={v => change(() => setScale(v))} fmt={v => f2(v, 2)} />
        <Row>
          {OPTS.map(o => (
            <Btn key={o} active={on[o]} onClick={() => setOn(s => ({ ...s, [o]: !s[o] }))}>
              <span style={{ color: COLOR[o] }}>■</span> {names[o]} η = {f2(S.lr[o] * scale, 4).replace(/0+$/, "")}
            </Btn>
          ))}
        </Row>
        <Row>
          {OPTS.map(o => {
            const d = done[o], blown = paths[o].some(q => !inView(q));
            return (
              <Readout key={o} color={COLOR[o]}>
                {names[o]}: {blown ? L("diverged", "diverged") : d >= 0 ? `${d} ${L("steps", "steps")}` : L("notYet", "not in 1000 steps")}
              </Readout>
            );
          })}
        </Row>
      </>}
      note={L("note", "The contours are the loss; the minimum is the cross. Each path is one optimiser taking steps from the same start, and the readouts say how many steps it needs before the loss stays below 0.001. In the ravine, SGD's learning rate cannot exceed 2/100 = 0.02 (the steep direction) and then crawls along the flat one: 241 steps. Momentum keeps a running sum of past gradients: the zigzags across the ravine cancel out and the pushes along it add up, 91 steps. RMSProp divides each coordinate by its own recent gradient size, so both directions get similar steps; without momentum it bounces around the bottom and needs a small rate, 924 steps. Adam is momentum plus that per-coordinate scaling: 87 steps. Raise the scale to 1.1 and SGD explodes. On the curved valley the same ideas hold, with bends to follow.")}
    >
      <div ref={vis.ref} className="flex flex-col">
        <svg viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto" role="img">
          <defs><clipPath id="opt-clip"><rect x={0} y={0} width={p.W} height={p.H} /></clipPath></defs>
          {contours.map((c, i) => <path key={i} d={c.d} stroke={C.purple} strokeOpacity={0.18 + 0.03 * i} strokeWidth={1} fill="none" />)}
          <path d={`M${p.X(S.min[0]) - 6},${p.Y(S.min[1])}h12M${p.X(S.min[0])},${p.Y(S.min[1]) - 6}v12`} stroke={C.fg} strokeWidth={2} />
          <circle cx={p.X(S.start[0])} cy={p.Y(S.start[1])} r={5} fill={C.fg} />
          <T x={p.X(S.start[0]) + 8} y={p.Y(S.start[1]) - 6} size={9} color={C.fg}>{L("start", "start")}</T>
          <g clipPath="url(#opt-clip)">
            {OPTS.filter(o => on[o]).map(o => {
              const pts = paths[o].slice(0, k + 1).filter(inView).map(clampPt);
              if (pts.length < 2) return null;
              const last = pts[pts.length - 1];
              return (
                <g key={o}>
                  <polyline points={pts.map(([x, y]) => `${p.X(x).toFixed(1)},${p.Y(y).toFixed(1)}`).join(" ")}
                    fill="none" stroke={COLOR[o]} strokeWidth={1.8} strokeOpacity={0.9} strokeLinejoin="round" />
                  <circle cx={p.X(last[0])} cy={p.Y(last[1])} r={4.5} fill={COLOR[o]} stroke="var(--code-bg)" strokeWidth={1.4} />
                </g>
              );
            })}
          </g>
        </svg>
        <Transport t={t} playing={playing} onPlay={() => { if (n >= MAX) setN(0); setPlaying(v => !v); }}
          onStep={() => { setPlaying(false); setN(v => Math.min(MAX, Math.floor(v) + 10)); }} onReset={restart}
          readout={`${L("step", "step")} ${k} / ${MAX}`} />
      </div>
    </Figure>
  );
}
