"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Figure, Readout, Row, T, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { freqToMidi, noteName } from "@/components/lesson/kit/audio/notes";
import { playTone } from "@/components/lesson/kit/audio/synth";
import { useSequence } from "@/components/lesson/kit/audio/useSequence";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";

// ── What this figure shows ────────────────────────────────────────────────────
// A string fixed at both ends can only vibrate in shapes that fit a whole
// number of half-waves between the ends: mode n has n bumps and vibrates at
// n·f₁ (here f₁ = 110 Hz, A2). Each row is one mode, slowed right down, with
// its still points (nodes) marked, and the note nearest to n·110 Hz with how
// many cents it is off. "All together" plays one tone holding the first eight
// harmonics at amplitude 1/n: it sounds like one note, A2, not a chord.

const W = 600, ROW_H = 31, TOP = 6, X0 = 46, X1 = 396, AMP = 10;
const N = 8, F1 = 110;
const H = TOP + ROW_H * N + 4;
const SLOW = 0.5;                                          // visual cycles per second of mode 1

/** Nearest note to f and how far off, in cents. */
function nearestNote(f: number) {
  const m = freqToMidi(f), k = Math.round(m);
  return { name: noteName(k), cents: Math.round(100 * (m - k)) };
}

function modePath(n: number, y: number, time: number) {
  const swing = AMP * Math.cos(2 * Math.PI * SLOW * n * time);
  return Array.from({ length: 121 }, (_, i) => {
    const s = i / 120;
    return `${i ? "L" : "M"}${(X0 + s * (X1 - X0)).toFixed(1)},${(y - swing * Math.sin(n * Math.PI * s)).toFixed(1)}`;
  }).join("");
}

const ROWS = Array.from({ length: N }, (_, i) => ({ n: i + 1, f: F1 * (i + 1), ...nearestNote(F1 * (i + 1)) }));
const COLORS = ["#f43f5e", "#f97316", "#f59e0b", "#22c55e", "#14b8a6", "#0ea5e9", "#3b82f6", "#a855f7"];

export function MusicHarmonicSeriesFigure({ t }: { t?: TrackTranslations }) {
  const [time, setTime] = useState(0);
  const [mode, setMode] = useState<"climb" | "all" | number | null>(null);
  const vis = useVisible<HTMLDivElement>();
  const seq = useSequence(vis.on);
  useFrame(vis.on, dt => setTime(s => s + dt));

  const tone = (n: number) => playTone(F1 * n, { level: 0.28 / Math.max(1, Math.sqrt(n / 4)), env: { attack: 0.02, decay: 0.05, sustain: 0.9, release: 0.15 } });
  const run = (m: "climb" | "all") => {
    if (seq.playing && mode === m) return seq.stop();
    startAudio();
    setMode(m);
    if (m === "climb") seq.play(N, i => tone(i + 1), { gap: 0.5, hold: 0.46 });
    else seq.play(1, () => playTone(F1, { wave: { amps: ROWS.map(r => 1 / r.n) }, level: 0.3 }), { hold: 2.4 });
  };
  const playRow = (n: number) => { startAudio(); setMode(n); seq.play(1, () => tone(n), { hold: 0.8 }); };

  const lit = (n: number) => seq.playing && (mode === "all" || mode === n || (mode === "climb" && seq.step === n - 1));
  const shown = typeof mode === "number" ? ROWS[mode - 1] : mode === "climb" && seq.step !== null ? ROWS[seq.step] : null;

  return (
    <Figure title={tx(t, "figMus_hsTitle", "The harmonic series on a string")}
      controls={<>
        <Row>
          {shown
            ? <Readout color={COLORS[shown.n - 1]}>{tx(t, "figMus_hsHarm", "harmonic")} {shown.n}: {shown.n} × 110 = {shown.f} Hz ≈ {shown.name} {shown.cents >= 0 ? "+" : ""}{shown.cents} ¢</Readout>
            : <Readout>{tx(t, "figMus_hsPick", "click a row, climb the series, or play all eight at once")}</Readout>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_hsNote", "Each row is one way the string can vibrate, slowed down thousands of times. The dots are the nodes, points that never move. Mode n fits n half-waves, so it vibrates n times as fast: 110, 220, 330… Hz. Climb the series and you hear a bugle call; play all eight together and they merge into one note, A2. The ¢ column is the distance to the nearest piano key, in cents (chapter 2).")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
          {ROWS.map(({ n, f, name, cents }, i) => {
            const y = TOP + ROW_H * (i + 0.5), on = lit(n);
            return (
              <g key={n} onClick={() => playRow(n)} style={{ cursor: "pointer" }}>
                <rect x={0} y={y - ROW_H / 2} width={W} height={ROW_H} fill={on ? COLORS[i] : "transparent"} fillOpacity={on ? 0.12 : 0} />
                <T x={8} y={y + 3.5} size={10} bold color={COLORS[i]}>n = {n}</T>
                <line x1={X0} x2={X1} y1={y} y2={y} stroke={C.grid} />
                <path d={modePath(n, y, time)} fill="none" stroke={COLORS[i]} strokeWidth={on ? 2.2 : 1.6} />
                {Array.from({ length: n + 1 }, (_, k) => (
                  <circle key={k} cx={X0 + (k / n) * (X1 - X0)} cy={y} r={k === 0 || k === n ? 3 : 2.4} fill={k === 0 || k === n ? C.fg : COLORS[i]} />
                ))}
                <T x={X1 + 18} y={y + 3.5} size={9.5} color={on ? COLORS[i] : C.fg} bold={on}>{f} Hz</T>
                <T x={X1 + 80} y={y + 3.5} size={9.5} color={on ? COLORS[i] : C.fg} bold={on}>{name}</T>
                <T x={W - 8} y={y + 3.5} anchor="end" size={9} color={Math.abs(cents) > 10 ? C.amber : C.muted}>{cents >= 0 ? "+" : ""}{cents} ¢</T>
              </g>
            );
          })}
        </svg>
        <div className="px-3 pb-3 flex flex-wrap items-center gap-2">
          <SoundButton on={seq.playing && mode === "climb"} onClick={() => run("climb")}>
            {seq.playing && mode === "climb" ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_hsClimb", "climb the series")}
          </SoundButton>
          <SoundButton on={seq.playing && mode === "all"} onClick={() => run("all")}>
            {seq.playing && mode === "all" ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_hsAll", "all eight together")}
          </SoundButton>
        </div>
      </div>
    </Figure>
  );
}
