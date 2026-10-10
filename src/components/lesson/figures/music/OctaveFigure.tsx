"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { midiToFreq, noteName } from "@/components/lesson/kit/audio/notes";
import { playPiano } from "@/components/lesson/kit/audio/piano";
import { playTone } from "@/components/lesson/kit/audio/synth";
import { usePiano } from "@/components/lesson/kit/audio/usePiano";
import { useSequence } from "@/components/lesson/kit/audio/useSequence";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";

// ── What this figure shows ────────────────────────────────────────────────────
// One note name in four octaves (octaves 2 to 5), each a pure tone drawn over
// the same stretch of time: two periods of the lowest. Each row fits exactly
// twice as many cycles as the row above, so at every dashed line (one period
// of the lowest note) all four waves start a new cycle together. That lining
// up is why notes an octave apart sound like "the same note, higher".

const W = 600, ROW_H = 46, TOP = 8, LABEL_W = 92, PAD_R = 10;
const OCTAVES = [2, 3, 4, 5];
const H = TOP + ROW_H * OCTAVES.length + 16;
const LETTERS: [string, number][] = [["C", 0], ["D", 2], ["E", 4], ["F", 5], ["G", 7], ["A", 9], ["B", 11]];
const COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#f43f5e"];

type Instrument = "sine" | "piano";

/** One row's wave: `cycles` full cycles across the plot. */
function wavePath(cycles: number, y: number) {
  const x0 = LABEL_W, w = W - LABEL_W - PAD_R, amp = ROW_H * 0.36, n = 480;
  return Array.from({ length: n + 1 }, (_, i) => {
    const s = i / n;
    return `${i ? "L" : "M"}${(x0 + s * w).toFixed(1)},${(y - amp * Math.sin(2 * Math.PI * cycles * s)).toFixed(1)}`;
  }).join("");
}

export function MusicOctaveFigure({ t }: { t?: TrackTranslations }) {
  const [pc, setPc] = useState(9);                          // pitch class: A
  const [inst, setInst] = useState<Instrument>("sine");
  const [mode, setMode] = useState<"up" | "together" | number | null>(null);   // what is playing; a number = one row
  const vis = useVisible<HTMLDivElement>();
  const seq = useSequence(vis.on);
  const piano = usePiano();

  const notes = OCTAVES.map(o => 12 * (o + 1) + pc);
  const voice = (m: number, quiet = 1) => inst === "piano"
    ? playPiano(m, { velocity: 0.75 * Math.sqrt(quiet) })
    : playTone(midiToFreq(m), { level: 0.26 * quiet / Math.max(1, Math.sqrt(midiToFreq(m) / 500)) });

  // The piano needs its recordings first; the sine plays at once
  const withSound = (go: () => void) => {
    startAudio();
    if (inst === "piano") piano.ensure().then(go, () => {});
    else go();
  };
  const run = (m: "up" | "together") => {
    if (seq.playing && mode === m) return seq.stop();
    setMode(m);
    withSound(() => m === "up"
      ? seq.play(notes.length, i => voice(notes[i]), { gap: 0.6, hold: 0.55 })
      : seq.play(1, () => notes.map(n => voice(n, 0.55)), { hold: 2.2 }));
  };
  const playRow = (i: number) => { setMode(i); withSound(() => seq.play(1, () => voice(notes[i]), { hold: 0.8 })); };

  const lit = (i: number) => seq.playing && (mode === "together" || mode === i || (mode === "up" && seq.step === i));
  const plotW = W - LABEL_W - PAD_R;

  return (
    <Figure title={tx(t, "figMus_octTitle", "The same note in four octaves")}
      head={<Choice value={inst} onChange={v => { seq.stop(); setInst(v); }} options={[
        ["sine", tx(t, "figMus_sine", "sine")],
        ["piano", tx(t, "figMus_piano", "🎹 piano")],
      ]} />}
      controls={<>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_octNote", "note:")}</span>
          {LETTERS.map(([name, p]) => <Btn key={p} active={pc === p} onClick={() => { seq.stop(); setPc(p); }}>{name}</Btn>)}
        </Row>
        <Row>
          <Readout color="#f43f5e">{notes.map(m => midiToFreq(m).toFixed(1)).join(" → ")} Hz</Readout>
          <Readout>{tx(t, "figMus_octEach", "each ×2")}</Readout>
          {inst === "piano" && piano.load === "loading" && <Readout>{tx(t, "figMus_loading", "loading the piano (1.3 MB)…")}</Readout>}
          {inst === "piano" && piano.load === "error" && <Readout>{tx(t, "figMus_loadError", "the piano failed to load — click a key to retry")}</Readout>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_octFigNote", "Play them upward, then together. Upward, you hear the same note climbing. Together, the four blend into one rich sound instead of four separate ones. Look at the dashed lines: at each of them every wave starts a new cycle at the same moment. Click a row to hear one note alone.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
          {[0, 0.5, 1].map(k => (
            <line key={k} x1={LABEL_W + k * plotW} x2={LABEL_W + k * plotW} y1={TOP} y2={TOP + ROW_H * OCTAVES.length}
              stroke={C.muted} strokeDasharray="3 4" strokeWidth={k === 0.5 ? 1.2 : 0.8} />
          ))}
          {notes.map((m, i) => {
            const y = TOP + ROW_H * (i + 0.5);
            const on = lit(i);
            return (
              <g key={m} onClick={() => playRow(i)} style={{ cursor: "pointer" }}>
                <rect x={0} y={y - ROW_H / 2} width={W} height={ROW_H} fill={on ? COLORS[i] : "transparent"} fillOpacity={on ? 0.1 : 0} />
                <line x1={LABEL_W} x2={W - PAD_R} y1={y} y2={y} stroke={C.grid} />
                <T x={8} y={y - 2} size={11} bold color={COLORS[i]}>{noteName(m)}</T>
                <T x={8} y={y + 12} size={8.5}>{midiToFreq(m).toFixed(1)} Hz</T>
                <path d={wavePath(2 * 2 ** i, y)} fill="none" stroke={COLORS[i]} strokeWidth={on ? 2 : 1.5} strokeLinejoin="round" />
              </g>
            );
          })}
          <T x={LABEL_W} y={H - 3} size={8}>0</T>
          <T x={LABEL_W + plotW / 2} y={H - 3} anchor="middle" size={8}>{tx(t, "figMus_octT1", "1 period of the lowest")}</T>
          <T x={W - PAD_R} y={H - 3} anchor="end" size={8}>{tx(t, "figMus_octT2", "2 periods")}</T>
        </svg>
        <div className="px-3 pb-3 flex flex-wrap items-center gap-2">
          <SoundButton on={seq.playing && mode === "up"} onClick={() => run("up")}>
            {seq.playing && mode === "up" ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_playUp", "play upward")}
          </SoundButton>
          <SoundButton on={seq.playing && mode === "together"} onClick={() => run("together")}>
            {seq.playing && mode === "together" ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_playTogether", "play together")}
          </SoundButton>
        </div>
      </div>
    </Figure>
  );
}
