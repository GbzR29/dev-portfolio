"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, C, T, mulberry32, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// Dropout on a 2-6-6-1 network. In training, every step draws a fresh random
// mask: each hidden neuron is switched off with probability p, and the
// survivors' outputs are multiplied by 1/(1 − p) so that the expected input of
// the next layer is unchanged ("inverted dropout"). Every step trains a
// different thinned network; at test time all neurons are on, unscaled.

const LAYERS = [2, 6, 6, 1];
const W = 560, H = 250;
const colX = [60, 210, 360, 500];
const nodeY = (l: number, i: number) => H / 2 + (i - (LAYERS[l] - 1) / 2) * 36;
const HIDDEN = LAYERS.slice(1, -1).reduce((s, n) => s + n, 0);

function masks(seed: number, p: number) {
  const rng = mulberry32(seed * 7919 + 1);
  return LAYERS.map((n, l) => Array.from({ length: n }, () => (l === 0 || l === LAYERS.length - 1 ? true : rng() >= p)));
}

export function DropoutFigure({ t }: { t?: TrackTranslations }) {
  const [p, setP] = useState("0.5");
  const [mode, setMode] = useState<"train" | "test">("train");
  const [step, setStep] = useState(1);
  const [playing, setPlaying] = useState(false);
  const acc = useRef(0);                                   // seconds since the last new mask
  const vis = useVisible<HTMLDivElement>();
  const L = (k: string, en: string) => tx(t, `figAiDrop_${k}`, en);

  useFrame(playing && vis.on, dt => {
    acc.current += dt;
    if (acc.current >= 0.9) { acc.current = 0; setStep(s => s + 1); }
  });

  const pv = Number(p);
  const on = mode === "test" ? LAYERS.map(n => Array(n).fill(true)) : masks(step, pv);
  const alive = on.slice(1, -1).flat().filter(Boolean).length;
  const scale = mode === "train" ? 1 / (1 - pv) : 1;

  return (
    <Figure
      title={L("title", "Dropout: a different thinned network every step")}
      head={<Choice value={mode} onChange={setMode} options={[["train", L("train", "training")], ["test", L("test", "testing")]] as const} />}
      controls={<>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{L("p", "drop probability p")}</span>
          <Choice value={p} onChange={setP} options={[["0.2", "0.2"], ["0.5", "0.5"]] as const} />
          <Readout>{L("alive", "hidden neurons on")} {alive} / {HIDDEN}</Readout>
          <Readout color={C.amber}>{L("scale", "survivors ×")} {scale.toFixed(2)}</Readout>
        </Row>
      </>}
      note={L("note", "Each training step switches off a random set of hidden neurons (grey), so the step trains only the thinned network that is left; the next step draws a new set. With 12 hidden neurons there are 2¹² = 4096 possible thinned networks, and they all share the same weights. No neuron can rely on one particular partner being there, so each must learn something useful on its own. The survivors' outputs are multiplied by 1/(1 − p), 2 for p = 0.5, so the next layer receives on average the same total as with every neuron on. That is why at test time nothing is dropped and nothing is scaled.")}
    >
      <div ref={vis.ref} className="flex flex-col">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
          {LAYERS.slice(1).map((n, l1) => {
            const l = l1 + 1;
            return Array.from({ length: n }, (_, j) => Array.from({ length: LAYERS[l - 1] }, (_, i) => {
              const live = on[l - 1][i] && on[l][j];
              return <line key={`${l}-${i}-${j}`} x1={colX[l - 1]} y1={nodeY(l - 1, i)} x2={colX[l]} y2={nodeY(l, j)}
                stroke={live ? C.sky : C.muted} strokeOpacity={live ? 0.55 : 0.08} strokeWidth={live ? 1.3 : 1} />;
            }));
          })}
          {LAYERS.map((n, l) => Array.from({ length: n }, (_, i) => {
            const live = on[l][i];
            const hidden = l > 0 && l < LAYERS.length - 1;
            return (
              <g key={`${l}-${i}`}>
                <circle cx={colX[l]} cy={nodeY(l, i)} r={12} fill={live ? "var(--card)" : "var(--code-bg)"}
                  stroke={live ? (hidden ? C.teal : l === 0 ? C.muted : C.purple) : C.muted} strokeOpacity={live ? 1 : 0.35}
                  strokeWidth={1.8} strokeDasharray={live ? undefined : "3 3"} />
                {hidden && live && mode === "train" && <T x={colX[l] + 15} y={nodeY(l, i) - 8} size={8} color={C.amber}>×{scale.toFixed(scale % 1 ? 2 : 0)}</T>}
                {hidden && !live && <path d={`M${colX[l] - 5},${nodeY(l, i) - 5}l10,10m0,-10l-10,10`} stroke={C.muted} strokeOpacity={0.6} strokeWidth={1.4} />}
              </g>
            );
          }))}
          <T x={colX[0]} y={H - 8} size={8.5} anchor="middle">{L("in", "inputs")}</T>
          <T x={(colX[1] + colX[2]) / 2} y={H - 8} size={8.5} anchor="middle">{L("hid", "hidden layers (dropout here)")}</T>
          <T x={colX[3]} y={H - 8} size={8.5} anchor="middle">{L("out", "output")}</T>
        </svg>
        <Transport t={t} playing={playing && mode === "train"} onPlay={() => { setMode("train"); setPlaying(v => !v); }}
          onStep={() => { setMode("train"); setPlaying(false); setStep(s => s + 1); }} onReset={() => { setPlaying(false); setStep(1); }}
          readout={mode === "train" ? `${L("step", "training step")} ${step}` : L("allOn", "all neurons on, no scaling")} />
      </div>
    </Figure>
  );
}
