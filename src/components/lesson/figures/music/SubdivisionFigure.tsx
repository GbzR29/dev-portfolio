"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, Slider, T, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { audio, startAudio } from "@/components/lesson/kit/audio/context";
import { playClick } from "@/components/lesson/kit/audio/click";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";

// ── What this figure shows ────────────────────────────────────────────────────
// Subdividing the beat. Four layers of clicks loop over two beats: the beat
// itself, the beat split in 2 (eighth notes), in 3 (triplet eighths) and in 4
// (sixteenths). Each layer has its own pitch, so several can sound together:
// 2 and 3 at once is the "three against two" polyrhythm. Swing moves the
// second eighth of each beat late, onto the third triplet, so the eighths go
// long–short (2/3 + 1/3 of a beat). Clicks are booked on the audio clock a
// moment ahead, as in the metronome, so layers can change while it runs.

const W = 600, H = 222, X0 = 172, X1 = 584, SPAN = 2;         // two beats wide
const ROW0 = 50, ROW_H = 44;
const AHEAD = 0.15, TICK_MS = 25;

type Layer = 1 | 2 | 3 | 4;
const LAYERS: Layer[] = [1, 2, 3, 4];
const COLOR: Record<Layer, string> = { 1: C.sky, 2: C.amber, 3: C.purple, 4: C.pink };
const HZ: Record<Layer, number> = { 1: 900, 2: 1500, 3: 2100, 4: 2800 };

/** Where in the beat (0 … 1) each click of a layer falls. */
const positions = (n: Layer, swing: boolean) => (n === 2 && swing ? [0, 2 / 3] : Array.from({ length: n }, (_, k) => k / n));

const xB = (b: number) => X0 + (b / SPAN) * (X1 - X0);
const yRow = (i: number) => ROW0 + i * ROW_H;

export function MusicSubdivisionFigure({ t }: { t?: TrackTranslations }) {
  const [on, setOn] = useState<Record<Layer, boolean>>({ 1: true, 2: true, 3: false, 4: false });
  const [swing, setSwing] = useState(false);
  const [bpm, setBpm] = useState(70);
  const [running, setRunning] = useState(false);
  const [pos, setPos] = useState<number | null>(null);       // heard position in the two-beat loop, in beats
  const vis = useVisible<HTMLDivElement>();
  const live = useRef({ on, swing, bpm });
  useEffect(() => { live.current = { on, swing, bpm }; }, [on, swing, bpm]);
  const beats = useRef<{ at: number; k: number; len: number }[]>([]);   // booked beats (start, count, length), newest last
  const head = useRef<SVGLineElement>(null);

  // One common way to count each layer out loud
  const and = tx(t, "figMus_sdAnd", "&"), trip = tx(t, "figMus_sdTrip", "trip"), let_ = tx(t, "figMus_sdLet", "let");
  const e = tx(t, "figMus_sdE", "e"), a = tx(t, "figMus_sdA", "a");
  const syll = (n: Layer) => ({
    1: ["1", "2"],
    2: ["1", and, "2", and],
    3: ["1", trip, let_, "2", trip, let_],
    4: ["1", e, and, a, "2", e, and, a],
  })[n];

  // The scheduler: book each beat's clicks, for the layers switched on, just before it comes
  useEffect(() => {
    if (!running || !vis.on) return;
    const { ctx } = audio();
    let next = ctx.currentTime + 0.1, k = 0;
    beats.current = [];
    const id = setInterval(() => {
      while (next < ctx.currentTime + AHEAD) {
        const { on: layers, swing: sw, bpm: tempo } = live.current, period = 60 / tempo;
        LAYERS.filter(n => layers[n]).forEach(n => positions(n, sw).forEach((p, i) =>
          playClick(next + p * period, { hz: HZ[n], level: n === 1 ? 0.6 : 0.4, accent: n === 1 && i === 0 && k % 2 === 0 })));
        beats.current = [...beats.current.slice(-7), { at: next, k, len: period }];
        next += period; k++;
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running, vis.on]);
  useEffect(() => { if (!vis.on) { setRunning(false); setPos(null); } }, [vis.on]);

  // The playhead and the lit dots follow the heard beats
  useFrame(vis.on && running, () => {
    const { ctx } = audio(), now = ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0);
    const last = [...beats.current].reverse().find(b => b.at <= now);
    if (!last) return;
    const b = (last.k % SPAN) + Math.min(1, (now - last.at) / last.len);
    head.current?.setAttribute("x1", String(xB(b)));
    head.current?.setAttribute("x2", String(xB(b)));
    const q = Math.floor(b * 48) / 48;
    setPos(p => (p === q ? p : q));
  });

  const toggle = () => { startAudio(); setRunning(r => !r); setPos(null); };
  const flip = (n: Layer) => setOn(o => ({ ...o, [n]: !o[n] }));
  const ms = (n: Layer) => Math.round(60000 / bpm / n);
  const label = (n: Layer) => ({
    1: tx(t, "figMus_sd1", "the beat (quarters)"),
    2: tx(t, "figMus_sd2", "2 per beat (eighths)"),
    3: tx(t, "figMus_sd3", "3 per beat (triplets)"),
    4: tx(t, "figMus_sd4", "4 per beat (sixteenths)"),
  })[n];

  return (
    <Figure title={tx(t, "figMus_sdTitle", "Split the beat in 2, 3 or 4")}
      controls={<>
        <Row>
          {LAYERS.map(n => <Btn key={n} active={on[n]} onClick={() => flip(n)}><span style={{ color: COLOR[n] }}>●</span> {label(n)}</Btn>)}
          <Btn active={swing} onClick={() => setSwing(s => !s)}>{tx(t, "figMus_sdSwing", "swing the eighths")}</Btn>
        </Row>
        <Slider label={tx(t, "figMus_sdBpm", "tempo (BPM)")} value={bpm} min={40} max={140} step={1} onChange={setBpm} fmt={v => `${v} BPM`} width="w-28" />
        <Row>
          {LAYERS.filter(n => on[n]).map(n => (
            <Readout key={n} color={COLOR[n]}>{n === 2 && swing
              ? `(⅔ + ⅓) × 60/${bpm} s = ${Math.round((2 / 3) * 60000 / bpm)} + ${Math.round((1 / 3) * 60000 / bpm)} ms`
              : `${n === 1 ? `60/${bpm}` : `60/(${bpm}·${n})`} s = ${ms(n)} ms`}</Readout>
          ))}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_sdNote", "Start it with the beat and the eighths, and count along out loud. Then swap the eighths for the triplets: the beat stays, but it now splits in three, which feels rounder, like a waltz inside each beat. Turn on 2 and 3 together for three against two (they only meet on the beat), and try swing: the second eighth moves late, onto the last triplet.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
          {/* the two beats */}
          {Array.from({ length: SPAN + 1 }, (_, b) => (
            <line key={b} x1={xB(b)} x2={xB(b)} y1={ROW0 - 26} y2={yRow(LAYERS.length - 1) + 24} stroke={b === SPAN ? C.grid : C.axis} strokeWidth={b === SPAN ? 1 : 1.5}
              strokeDasharray={b === SPAN ? "3 4" : undefined} />
          ))}
          <T x={xB(0) + 4} y={ROW0 - 30} size={8.5}>{tx(t, "figMus_sdBeat", "beat")} 1</T>
          <T x={xB(1) + 4} y={ROW0 - 30} size={8.5}>{tx(t, "figMus_sdBeat", "beat")} 2</T>
          <T x={X1} y={ROW0 - 30} anchor="end" size={8}>{tx(t, "figMus_sdLoop", "then again")} ↺</T>

          {LAYERS.map((n, i) => {
            const y = yRow(i), ps = Array.from({ length: SPAN }, (_, b) => positions(n, swing).map(p => b + p)).flat(), names = syll(n);
            return (
              <g key={n} opacity={on[n] ? 1 : 0.3} onClick={() => flip(n)} style={{ cursor: "pointer" }}>
                <rect x={0} y={y - 20} width={W} height={ROW_H - 2} fill="transparent" />
                <T x={8} y={y + 3} size={9} bold color={on[n] ? COLOR[n] : C.muted}>{label(n)}</T>
                <line x1={X0} x2={X1} y1={y} y2={y} stroke={C.grid} />
                {/* where the straight eighths would be, when swung */}
                {n === 2 && swing && [0.5, 1.5].map(b => <circle key={b} cx={xB(b)} cy={y} r={5} fill="none" stroke={COLOR[2]} strokeDasharray="2 2" opacity={0.6} />)}
                {n === 3 && [0, 1].map(b => (
                  <g key={b}>
                    <path d={`M${xB(b) + 2},${y - 9} v-5 H${xB(b + 2 / 3) - 2} v5`} fill="none" stroke={COLOR[3]} opacity={0.6} />
                    <T x={(xB(b) + xB(b + 2 / 3)) / 2} y={y - 16} anchor="middle" size={8} color={COLOR[3]}>3</T>
                  </g>
                ))}
                {ps.map((p, k) => {
                  const lit = on[n] && pos !== null && pos >= p && pos < p + 0.1;
                  return (
                    <g key={k}>
                      <circle cx={xB(p)} cy={y} r={lit ? 7 : p % 1 === 0 ? 5.5 : 4} fill={COLOR[n]} opacity={lit ? 1 : 0.7} />
                      <T x={xB(p)} y={y + 17} anchor="middle" size={8.5} bold={p % 1 === 0} color={lit ? C.fg : C.muted}>{names[k]}</T>
                    </g>
                  );
                })}
              </g>
            );
          })}
          <line ref={head} x1={X0} x2={X0} y1={ROW0 - 24} y2={yRow(LAYERS.length - 1) + 22} stroke={C.fg} strokeWidth={1.2} opacity={running ? 0.6 : 0} />
        </svg>
        <div className="px-3 pb-3 flex items-center gap-3">
          <SoundButton on={running} onClick={toggle}>
            {running ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_sdStart", "start the loop")}
          </SoundButton>
        </div>
      </div>
    </Figure>
  );
}
