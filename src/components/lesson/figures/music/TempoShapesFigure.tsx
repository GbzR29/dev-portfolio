"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, Slider, T, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { audio, startAudio, type Voice } from "@/components/lesson/kit/audio/context";
import { playPiano } from "@/components/lesson/kit/audio/piano";
import { playClick } from "@/components/lesson/kit/audio/click";
import { usePiano } from "@/components/lesson/kit/audio/usePiano";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";

// ── What this figure shows ────────────────────────────────────────────────────
// The opening of Beethoven's "Ode to Joy" (1824, Ninth Symphony) played four
// ways: at a steady tempo, speeding up (accelerando), slowing down at the end
// (ritardando) and pushing and pulling inside each phrase (rubato). The top
// graph is the tempo in BPM over time; the dots are the notes placed at the
// moment they sound, with the steady version's beats underneath as grey ticks
// for comparison. The tempo of a shaped version at beat position b is
// bpm(b), and a beat lasts 60 / bpm(b) seconds, so the onsets are the running
// sum of those durations.

const W = 600, H = 250, X0 = 40, X1 = 584;
const TG_Y0 = 22, TG_Y1 = 86;                              // tempo graph
const NOTE_Y0 = 120, NOTE_Y1 = 186, GRID_Y = 204;           // notes (by pitch) and the steady beats
const NOTES = [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62];
const BEATS = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 0.5, 2];
const TOTAL = BEATS.reduce((s, b) => s + b, 0);            // 16 beats
const NAMES: Record<number, string> = { 60: "C", 62: "D", 64: "E", 65: "F", 67: "G" };

type Shape = "steady" | "accel" | "rit" | "rubato";
const SHAPES: Shape[] = ["steady", "accel", "rit", "rubato"];

/** Tempo multiplier at beat position b (0 … 16). */
const SHAPE_OF: Record<Shape, (b: number) => number> = {
  steady: () => 1,
  accel: b => 0.75 + 0.6 * (b / TOTAL),
  rit: b => 1 - 0.5 * Math.max(0, (b - 10) / (TOTAL - 10)),
  rubato: b => 1 + 0.28 * Math.sin((Math.PI * (b % 8)) / 8),
};

/** Seconds from the start to beat position `b`: the sum of 60 / bpm over tiny slices. */
function timeAt(shape: Shape, bpm: number, b: number) {
  const n = Math.ceil(b * 32), db = b / Math.max(1, n);
  return Array.from({ length: n }, (_, i) => (60 / (bpm * SHAPE_OF[shape]((i + 0.5) * db))) * db).reduce((s, x) => s + x, 0);
}

function timeline(shape: Shape, bpm: number) {
  const starts = BEATS.map((_, i) => BEATS.slice(0, i).reduce((s, x) => s + x, 0));
  const onsets = starts.map(b => timeAt(shape, bpm, b));
  const beats = Array.from({ length: TOTAL + 1 }, (_, b) => timeAt(shape, bpm, b));
  return { onsets, beats, end: beats[TOTAL] };
}

export function MusicTempoShapesFigure({ t }: { t?: TrackTranslations }) {
  const [shape, setShape] = useState<Shape>("steady");
  const [bpm, setBpm] = useState(100);
  const [clicks, setClicks] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [lit, setLit] = useState<number | null>(null);
  const vis = useVisible<HTMLDivElement>();
  const piano = usePiano();
  const voices = useRef<Voice[]>([]);
  const ticks = useRef<{ cancel: () => void }[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const start = useRef(0);
  const head = useRef<SVGLineElement>(null);

  const tl = timeline(shape, bpm);
  const steady = timeline("steady", bpm);
  const span = Math.max(...SHAPES.map(s => timeline(s, bpm).end));   // same scale for all four
  const xT = (s: number) => X0 + (s / span) * (X1 - X0);
  const yNote = (m: number) => NOTE_Y1 - ((m - 60) / 7) * (NOTE_Y1 - NOTE_Y0);
  const yBpm = (v: number) => TG_Y1 - ((v - 40) / 200) * (TG_Y1 - TG_Y0);

  const stop = () => {
    timers.current.forEach(clearTimeout); timers.current = [];
    voices.current.forEach(v => v.stop(0.1)); voices.current = [];
    ticks.current.forEach(c => c.cancel()); ticks.current = [];
    setPlaying(false); setLit(null);
  };
  useEffect(() => { if (!vis.on) stop(); }, [vis.on]);
  useEffect(() => stop, []);

  const play = async () => {
    if (playing) return stop();
    startAudio();
    try { await piano.ensure(); } catch { return; }
    const { ctx } = audio(), t0 = ctx.currentTime + 0.12;
    start.current = t0;
    tl.onsets.forEach((on, i) => {
      const v = playPiano(NOTES[i], { when: t0 + on, velocity: 0.7 });
      if (v) voices.current.push(v);
      const end = i + 1 < tl.onsets.length ? tl.onsets[i + 1] : tl.end;
      timers.current.push(setTimeout(() => v?.stop(), (0.12 + end - 0.02) * 1000));
    });
    if (clicks) ticks.current = tl.beats.slice(0, TOTAL).map((b, k) => playClick(t0 + b, { level: 0.3, accent: k % 4 === 0 }));
    timers.current.push(setTimeout(() => { setPlaying(false); setLit(null); }, (0.12 + tl.end + 0.3) * 1000));
    setPlaying(true);
  };

  // Playhead and lit note follow the audio clock
  useFrame(vis.on && playing, () => {
    const { ctx } = audio(), now = ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0) - start.current;
    head.current?.setAttribute("x1", String(xT(Math.max(0, now))));
    head.current?.setAttribute("x2", String(xT(Math.max(0, now))));
    const i = tl.onsets.reduce((k, on, j) => (now >= on ? j : k), -1);
    setLit(l => (l === (i < 0 ? null : i) ? l : i < 0 ? null : i));
  });

  const change = (s: Shape) => { stop(); setShape(s); };
  const curve = Array.from({ length: 81 }, (_, i) => (i / 80) * TOTAL)
    .map((b, i) => `${i ? "L" : "M"}${xT(timeAt(shape, bpm, b)).toFixed(1)},${yBpm(bpm * SHAPE_OF[shape](b)).toFixed(1)}`).join("");
  const nowBpm = lit !== null ? bpm * SHAPE_OF[shape](BEATS.slice(0, lit).reduce((s, x) => s + x, 0)) : null;

  return (
    <Figure title={tx(t, "figMus_tsTitle", "One tune, four ways to shape its tempo")}
      head={<Choice value={shape} onChange={change} options={[
        ["steady", tx(t, "figMus_tsSteady", "steady")],
        ["accel", "accelerando"],
        ["rit", "ritardando"],
        ["rubato", "rubato"],
      ]} />}
      controls={<>
        <Slider label={tx(t, "figMus_tsBpm", "tempo of the steady version")} value={bpm} min={60} max={160} step={1}
          onChange={v => { stop(); setBpm(v); }} fmt={v => `${v} BPM`} width="w-36" />
        <Row>
          <Btn active={clicks} onClick={() => setClicks(c => !c)}>{tx(t, "figMus_tsClicks", "click on every beat")}</Btn>
          <Readout>{tx(t, "figMus_tsLength", "length")}: {tl.end.toFixed(2)} s ({tx(t, "figMus_tsSteadyLen", "steady")}: {steady.end.toFixed(2)} s)</Readout>
          {nowBpm !== null && <Readout color="#f43f5e">{tx(t, "figMus_tsNow", "now")}: {Math.round(nowBpm)} BPM</Readout>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_tsNote", "Play \"steady\" first, then the others with the clicks on. The notes and their order never change, only when they arrive: accelerando squeezes the dots together, ritardando spreads the last ones out, rubato breathes, a little faster in the middle of each phrase and back at its ends. The grey ticks are where the steady beats would fall.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
          {/* tempo graph */}
          <T x={X0} y={TG_Y0 - 8} size={9} bold color={C.fg}>{tx(t, "figMus_tsGraph", "tempo (BPM) over time")}</T>
          {[60, 120, 180].map(v => (
            <g key={v}>
              <line x1={X0} x2={X1} y1={yBpm(v)} y2={yBpm(v)} stroke={C.grid} />
              <T x={X0 - 4} y={yBpm(v) + 3} anchor="end" size={7.5}>{v}</T>
            </g>
          ))}
          <path d={curve} fill="none" stroke={C.purple} strokeWidth={2} />

          {/* notes, by pitch, at the moment they sound */}
          {[60, 62, 64, 65, 67].map(m => (
            <g key={m}>
              <line x1={X0} x2={X1} y1={yNote(m)} y2={yNote(m)} stroke={C.grid} strokeDasharray="2 4" />
              <T x={X0 - 6} y={yNote(m) + 3} anchor="end" size={7.5}>{NAMES[m]}</T>
            </g>
          ))}
          {tl.onsets.map((on, i) => {
            const end = i + 1 < tl.onsets.length ? tl.onsets[i + 1] : tl.end;
            return (
              <g key={i}>
                <rect x={xT(on)} y={yNote(NOTES[i]) - 3} width={Math.max(2, xT(end) - xT(on) - 3)} height={6} rx={3}
                  fill={i === lit ? "#f43f5e" : C.sky} opacity={i === lit ? 1 : 0.75} />
              </g>
            );
          })}
          {steady.beats.map((b, k) => (
            <line key={k} x1={xT(b)} x2={xT(b)} y1={GRID_Y - 5} y2={GRID_Y + 5} stroke={C.muted} strokeWidth={k % 4 === 0 ? 2 : 1} />
          ))}
          {tl.beats.map((b, k) => (
            <circle key={k} cx={xT(b)} cy={GRID_Y} r={2.5} fill={C.amber} />
          ))}
          <T x={X0} y={GRID_Y + 20} size={8}>{tx(t, "figMus_tsBeats", "orange: this version's beats · grey: steady beats")}</T>
          <T x={X1} y={GRID_Y + 20} anchor="end" size={8}>{span.toFixed(1)} s</T>
          <line ref={head} x1={X0} x2={X0} y1={TG_Y0} y2={GRID_Y + 6} stroke={C.fg} strokeWidth={1} opacity={playing ? 0.6 : 0} />
        </svg>
        <div className="px-3 pb-3 flex items-center gap-3">
          <SoundButton on={playing} onClick={play}>
            {playing ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_tsPlay", "play the tune")}
          </SoundButton>
          {piano.load === "loading" && <span className="text-[11px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_loading", "loading the piano (1.3 MB)…")}</span>}
        </div>
      </div>
    </Figure>
  );
}
