"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Figure, Readout, Row, Slider, T, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { audio, startAudio } from "@/components/lesson/kit/audio/context";
import { playClick } from "@/components/lesson/kit/audio/click";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";

// ── What this figure shows ────────────────────────────────────────────────────
// A metronome. Pick a tempo in beats per minute (BPM) and it clicks every
// 60/BPM seconds; the pendulum and the ruler of Italian tempo words follow.
// Stopped, the tap button measures a tempo: tap along to a song in your head
// and BPM = 60 / (average gap between taps). Running, every tap is compared
// with the nearest click: the strip shows how many milliseconds early or late
// you were. Most people tap a little early. Clicks are scheduled on the audio
// clock a moment ahead (not with timers), so they stay exactly even.

const W = 600, H = 226;
const PIV = { x: 96, y: 168 }, ARM = 118, SWING = 0.42;   // pendulum pivot, length, max angle (rad)
const RX0 = 210, RX1 = 584, RY = 64;                       // tempo ruler
const BPM_MIN = 30, BPM_MAX = 240;
const SX0 = 210, SX1 = 584, SY = 172, S_MS = 150;          // timing strip, ±150 ms
const AHEAD = 0.12, TICK_MS = 25;                          // scheduler: look 120 ms ahead every 25 ms
const WIND = 0.3;                                          // s from "start" to the first click: the arm leans out

const MARKINGS: [string, number, number][] = [
  ["Grave", 30, 40], ["Largo", 40, 60], ["Adagio", 60, 76], ["Andante", 76, 108], ["Moderato", 108, 120],
  ["Allegro", 120, 156], ["Vivace", 156, 176], ["Presto", 176, 200], ["Prestissimo", 200, 240],
];
const BAND = ["#0ea5e9", "#14b8a6", "#22c55e", "#84cc16", "#eab308", "#f59e0b", "#f97316", "#ef4444", "#ec4899"];

const xBpm = (b: number) => RX0 + ((b - BPM_MIN) / (BPM_MAX - BPM_MIN)) * (RX1 - RX0);
const xMs = (ms: number) => (SX0 + SX1) / 2 + (Math.max(-S_MS, Math.min(S_MS, ms)) / S_MS) * ((SX1 - SX0) / 2);
const markingOf = (b: number) => MARKINGS.find(([, lo, hi]) => b >= lo && b < hi)?.[0] ?? "Prestissimo";
/** When a click is heard: its scheduled time plus the device's output delay. */
const latency = (ctx: AudioContext) => ctx.outputLatency || ctx.baseLatency || 0;
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const gaps = (ts: number[]) => ts.slice(1).map((x, i) => x - ts[i]);

export function MusicMetronomeFigure({ t }: { t?: TrackTranslations }) {
  const [bpm, setBpm] = useState(100);
  const [running, setRunning] = useState(false);
  const [taps, setTaps] = useState<number[]>([]);           // tap times (stopped: tap tempo)
  const [offsets, setOffsets] = useState<number[]>([]);     // ms, tap − nearest click (running)
  const vis = useVisible<HTMLDivElement>();
  const bpmRef = useRef(bpm);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  const beats = useRef<{ at: number; n: number; gap: number }[]>([]);   // booked clicks: time, count since start, seconds to the next; newest last
  const arm = useRef<SVGGElement>(null);
  const flash = useRef<SVGCircleElement>(null);

  // The scheduler: keep the next clicks booked on the audio clock
  useEffect(() => {
    if (!running || !vis.on) return;
    const { ctx } = audio();
    let next = ctx.currentTime + WIND, n = 0;
    beats.current = [];
    const id = setInterval(() => {
      while (next < ctx.currentTime + AHEAD) {
        const gap = 60 / bpmRef.current;
        playClick(next);
        beats.current = [...beats.current.slice(-15), { at: next, n: n++, gap }];
        next += gap;
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running, vis.on]);
  useEffect(() => { if (!vis.on) setRunning(false); }, [vis.on]);

  // Pendulum and beat light follow the heard clicks
  useFrame(vis.on, () => {
    if (!arm.current || !flash.current) return;
    const bs = beats.current;
    if (!running || bs.length === 0) {
      arm.current.setAttribute("transform", `rotate(0 ${PIV.x} ${PIV.y})`);
      flash.current.setAttribute("opacity", "0.15");
      return;
    }
    const { ctx } = audio(), now = ctx.currentTime - latency(ctx);
    // the last heard click and the real gap to the next one (already fixed when it
    // was booked, even if the tempo changes meanwhile); before the first, lean out to one side
    const i = bs.findLastIndex(b => b.at <= now);
    if (i < 0) {
      const u = Math.min(1, Math.max(0, 1 - (bs[0].at - now) / WIND)), lean = SWING * (1 - Math.cos(Math.PI * u)) / 2;
      arm.current.setAttribute("transform", `rotate(${(lean * 180) / Math.PI} ${PIV.x} ${PIV.y})`);
      return;
    }
    const last = bs[i].at, phase = Math.min(1, (now - last) / bs[i].gap);
    // swing from one side to the other between beats; the side alternates each beat
    const side = bs[i].n % 2 === 0 ? 1 : -1;
    const ang = side * SWING * Math.cos(Math.PI * phase);
    arm.current.setAttribute("transform", `rotate(${(ang * 180) / Math.PI} ${PIV.x} ${PIV.y})`);
    flash.current.setAttribute("opacity", String(0.15 + 0.85 * Math.exp(-(now - last) / 0.08)));
  });

  const toggle = () => {
    startAudio();
    setOffsets([]);
    setRunning(r => !r);
  };

  const tap = () => {
    const { ctx } = startAudio(), now = ctx.currentTime;
    if (!running) {
      const keep = taps.length && now - taps[taps.length - 1] > 2 ? [] : taps;   // a long pause starts over
      const next = [...keep, now].slice(-8);
      setTaps(next);
      if (next.length >= 2) setBpm(Math.round(Math.min(BPM_MAX, Math.max(BPM_MIN, 60 / mean(gaps(next))))));
      playClick(0, { level: 0.35, accent: true });
      return;
    }
    const heard = beats.current.map(b => b.at + latency(ctx));
    if (!heard.length) return;
    const near = heard.reduce((a, b) => (Math.abs(b - now) < Math.abs(a - now) ? b : a));
    setOffsets(os => [...os.slice(-15), (now - near) * 1000]);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (!e.repeat) tap(); }
  };

  const tapped = taps.length >= 2 ? 60 / mean(gaps(taps)) : null;
  const avg = offsets.length ? mean(offsets) : null;

  return (
    <Figure title={tx(t, "figMus_mtTitle", "A metronome: tempo in beats per minute")}
      controls={<>
        <Slider label={tx(t, "figMus_mtBpm", "tempo (BPM)")} value={bpm} min={BPM_MIN} max={BPM_MAX} step={1}
          onChange={v => { setBpm(v); setTaps([]); }} fmt={v => `${v} BPM`} width="w-40" />
        <Row>
          <Readout color="#f43f5e">{markingOf(bpm)} · {tx(t, "figMus_mtBeat", "one beat every")} {Math.round(60000 / bpm)} ms</Readout>
          {!running && tapped !== null && <Readout>{tx(t, "figMus_mtTapped", "your taps")}: {taps.length} → {tapped.toFixed(1)} BPM</Readout>}
          {running && avg !== null && <Readout color={C.purple}>{offsets.length} {tx(t, "figMus_mtTaps", "taps")}: {tx(t, "figMus_mtAvg", "on average")} {Math.abs(avg).toFixed(0)} ms {avg < 0 ? tx(t, "figMus_mtEarly", "early") : tx(t, "figMus_mtLate", "late")}</Readout>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={<>
        {tx(t, "figMus_mtNote", "Stopped, the tap button measures a tempo: tap a steady beat (a song you know, your heartbeat) and the slider jumps to it. Running, tap along with the clicks: each dot shows how early or late you were.")}
        {" "}<span data-mouse-only>{tx(t, "figMus_mtNoteKey", "The space bar taps too once the button has focus.")}</span>
        {" "}{tx(t, "figMus_mtNoteLat", "Your device adds a few milliseconds of its own between a tap and the sound, so treat small offsets as approximate.")}
      </>}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
          {/* the metronome body and its swinging arm */}
          <path d={`M${PIV.x - 56},${PIV.y + 34} L${PIV.x - 26},${PIV.y - 140} L${PIV.x + 26},${PIV.y - 140} L${PIV.x + 56},${PIV.y + 34} Z`}
            fill={C.bg} stroke={C.axis} strokeWidth={1.5} strokeLinejoin="round" />
          <g ref={arm}>
            <line x1={PIV.x} y1={PIV.y} x2={PIV.x} y2={PIV.y - ARM} stroke={C.fg} strokeWidth={2.5} strokeLinecap="round" />
            {/* the sliding weight: higher on the arm = slower, as on a real metronome */}
            <rect x={PIV.x - 9} y={PIV.y - 18 - (ARM - 34) * (1 - (bpm - BPM_MIN) / (BPM_MAX - BPM_MIN)) - 6} width={18} height={12} rx={2} fill="#f43f5e" />
          </g>
          <circle cx={PIV.x} cy={PIV.y} r={4} fill={C.axis} />
          <circle ref={flash} cx={PIV.x} cy={PIV.y + 20} r={7} fill={C.amber} opacity={0.15} />

          {/* tempo words */}
          <T x={RX0} y={RY - 34} size={9.5} bold color={C.fg}>{tx(t, "figMus_mtRuler", "tempo words (ranges vary between books)")}</T>
          {MARKINGS.map(([name, lo, hi], i) => (
            <g key={name}>
              <rect x={xBpm(lo)} y={RY - 12} width={xBpm(hi) - xBpm(lo)} height={12} fill={BAND[i]} opacity={markingOf(bpm) === name ? 0.9 : 0.3} />
              {xBpm(hi) - xBpm(lo) > 26 && <T x={(xBpm(lo) + xBpm(hi)) / 2} y={RY - 16} anchor="middle" size={7.5} color={markingOf(bpm) === name ? C.fg : C.muted}>{name}</T>}
            </g>
          ))}
          {[30, 60, 90, 120, 150, 180, 210, 240].map(b => (
            <g key={b}>
              <line x1={xBpm(b)} x2={xBpm(b)} y1={RY} y2={RY + 4} stroke={C.axis} />
              <T x={xBpm(b)} y={RY + 14} anchor="middle" size={8}>{b}</T>
            </g>
          ))}
          <line x1={xBpm(bpm)} x2={xBpm(bpm)} y1={RY - 15} y2={RY + 3} stroke={C.fg} strokeWidth={2.5} strokeLinecap="round" />
          {/* timing strip */}
          <T x={SX0} y={SY - 36} size={9.5} bold color={C.fg}>{tx(t, "figMus_mtStrip", "your taps against the clicks (start it, then tap)")}</T>
          <line x1={SX0} x2={SX1} y1={SY} y2={SY} stroke={C.axis} />
          {[-150, -100, -50, 0, 50, 100, 150].map(ms => (
            <g key={ms}>
              <line x1={xMs(ms)} x2={xMs(ms)} y1={SY - (ms === 0 ? 14 : 4)} y2={SY + 4} stroke={ms === 0 ? C.amber : C.axis} strokeWidth={ms === 0 ? 2 : 1} />
              <T x={xMs(ms)} y={SY + 15} anchor="middle" size={7.5}>{ms === 0 ? tx(t, "figMus_mtOn", "on the click") : `${ms > 0 ? "+" : ""}${ms}`}</T>
            </g>
          ))}
          <T x={SX0} y={SY + 30} size={8}>← {tx(t, "figMus_mtEarlyAx", "early (ms)")}</T>
          <T x={SX1} y={SY + 30} anchor="end" size={8}>{tx(t, "figMus_mtLateAx", "late (ms)")} →</T>
          {offsets.map((ms, i) => (
            <circle key={i} cx={xMs(ms)} cy={SY - 8 - (i % 3) * 5} r={i === offsets.length - 1 ? 5 : 3.5}
              fill={C.purple} fillOpacity={0.35 + 0.65 * ((i + 1) / offsets.length)} />
          ))}
        </svg>
        <div className="px-3 pb-3 flex flex-wrap gap-2 items-center">
          <SoundButton on={running} onClick={toggle}>
            {running ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_mtStart", "start the metronome")}
          </SoundButton>
          <button type="button" onPointerDown={tap} onKeyDown={onKey}
            className="h-11 px-6 rounded-full border-2 border-[var(--primary)] text-[var(--primary)] bg-[var(--card)] text-[12px] font-semibold active:bg-[var(--primary)] active:text-[var(--card)] touch-manipulation">
            {tx(t, "figMus_mtTap", "tap")}
          </button>
        </div>
      </div>
    </Figure>
  );
}
