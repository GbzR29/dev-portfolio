"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, Slider, T, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import type { ToneVoice } from "@/components/lesson/kit/audio/synth";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { RICH, beatRate, cents, richTone } from "./tuning";

// ── What this figure shows ────────────────────────────────────────────────────
// Two tones held together: A3 (220 Hz) and a note above it near a pure ratio
// q : p, which the reader can push sharp or flat in cents. Top: the harmonics
// of both tones on one frequency axis (lower tone up, upper tone down); in a
// pure interval harmonic q of the lower tone and harmonic p of the upper one
// land on the same frequency. Bottom: when they miss by Δ Hz, their sum swells
// and fades Δ times a second (4 seconds drawn, a playhead while it sounds).
// "Equal temperament" sets the offset the piano uses for that interval.

const W = 600, H = 284;
const F_MAX = 1400, AX0 = 40, AX1 = 586, AXIS_Y = 74, BAR = 46;   // spectrum: 0…F_MAX Hz
const ENV_Y = 218, ENV_H = 40, SPAN = 4;                          // beat strip: SPAN seconds
const BASE = 220;

type IntId = "unison" | "octave" | "fifth" | "fourth" | "major3" | "minor3";
const INTERVALS: Record<IntId, { q: number; p: number; semis: number; key: string; en: string }> = {
  unison: { q: 1, p: 1, semis: 0, key: "figMus_btUnison", en: "unison 1:1" },
  octave: { q: 2, p: 1, semis: 12, key: "figMus_btOctave", en: "octave 2:1" },
  fifth: { q: 3, p: 2, semis: 7, key: "figMus_btFifth", en: "fifth 3:2" },
  fourth: { q: 4, p: 3, semis: 5, key: "figMus_btFourth", en: "fourth 4:3" },
  major3: { q: 5, p: 4, semis: 4, key: "figMus_btMajor3", en: "major third 5:4" },
  minor3: { q: 6, p: 5, semis: 3, key: "figMus_btMinor3", en: "minor third 6:5" },
};
const IDS = Object.keys(INTERVALS) as IntId[];

/** How far the equal-tempered interval sits from the pure one, in cents. */
const etOffset = (id: IntId) => { const { q, p, semis } = INTERVALS[id]; return 100 * semis - cents(q / p); };

const fx = (f: number) => AX0 + (f / F_MAX) * (AX1 - AX0);

/** The sum of the two meeting harmonics over SPAN seconds: a fast wave inside an envelope |cos(π Δ t)|. */
function beatPath(delta: number) {
  const N = 900, CARRIER = 70;                           // drawn cycles of the (slowed) wave in the strip
  return Array.from({ length: N + 1 }, (_, i) => {
    const s = i / N, time = s * SPAN, env = Math.abs(Math.cos(Math.PI * delta * time));
    const y = ENV_Y - ENV_H * env * Math.sin(2 * Math.PI * CARRIER * s);
    return `${i ? "L" : "M"}${(AX0 + s * (AX1 - AX0)).toFixed(1)},${y.toFixed(1)}`;
  }).join("");
}

export function MusicBeatsFigure({ t }: { t?: TrackTranslations }) {
  const [id, setId] = useState<IntId>("fifth");
  const [off, setOff] = useState(0);
  const [on, setOn] = useState(false);
  const [clock, setClock] = useState(0);
  const vis = useVisible<HTMLDivElement>();
  const voices = useRef<ToneVoice[]>([]);

  const { q, p } = INTERVALS[id];
  const f2 = BASE * (q / p) * 2 ** (off / 1200);
  const delta = beatRate(BASE, f2, p, q);
  const meet = q * BASE;
  const et = etOffset(id);

  const stop = () => { voices.current.forEach(v => v.stop()); voices.current = []; setOn(false); };
  const toggle = () => {
    if (on) return stop();
    startAudio();
    voices.current = [richTone(BASE), richTone(f2)];
    setClock(0);
    setOn(true);
  };
  useEffect(() => { voices.current[1]?.setFreq(f2); }, [f2]);
  useEffect(() => { if (!vis.on) stop(); }, [vis.on]);
  useEffect(() => () => voices.current.forEach(v => v.stop()), []);
  useFrame(on && vis.on, dt => setClock(c => (c + dt) % SPAN));

  const pick = (k: IntId) => { setId(k); setOff(0); };
  const lower = RICH.amps.map((a, i) => ({ f: BASE * (i + 1), a }));
  const upper = RICH.amps.map((a, i) => ({ f: f2 * (i + 1), a })).filter(h => h.f < F_MAX);
  const rough = delta > 15;

  return (
    <Figure title={tx(t, "figMus_btTitle", "Beats: two tones that almost agree")}
      head={<Choice value={id} onChange={pick} options={IDS.map(k => [k, tx(t, INTERVALS[k].key, INTERVALS[k].en)] as const)} />}
      controls={<>
        <Slider label={tx(t, "figMus_btOff", "upper note off by")} value={off} min={-30} max={30} step={0.5} onChange={setOff}
          fmt={v => `${v > 0 ? "+" : ""}${v.toFixed(1)} ¢`} width="w-32" />
        <Row>
          <Btn active={off === 0} onClick={() => setOff(0)}>{tx(t, "figMus_btPure", "pure")}</Btn>
          {Math.abs(et) > 0.01 && (
            <Btn active={Math.abs(off - et) < 0.3} onClick={() => setOff(Math.round(et * 2) / 2)}>
              {tx(t, "figMus_btEqual", "equal temperament")} ({et > 0 ? "+" : ""}{et.toFixed(1)} ¢)
            </Btn>
          )}
        </Row>
        <Row>
          <Readout>220.00 Hz + {f2.toFixed(2)} Hz</Readout>
          <Readout color={C.amber}>{q} × 220 = {meet.toFixed(1)} · {p} × {f2.toFixed(2)} = {(p * f2).toFixed(1)}</Readout>
          <Readout color={delta < 0.05 ? C.green : rough ? C.red : C.fg}>
            {delta < 0.05 ? tx(t, "figMus_btNone", "no beats: pure") : `${delta.toFixed(2)} ${tx(t, "figMus_btPerSec", "beats per second")}`}
          </Readout>
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_btNote", "Hold the fifth and slide it a few cents off: a slow wah-wah appears, faster the further you go. That pulse is two harmonics, one from each tone, that should land on the same frequency and miss. Pure intervals have no beats, which is why they sound so still. Now press equal temperament: the piano's fifth beats less than once a second, its major third almost nine times a second here (and faster higher up). Past about 15 beats a second the pulse turns into a rough buzz.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
          {/* harmonics: the lower tone above the axis, the upper tone below */}
          <line x1={AX0} x2={AX1} y1={AXIS_Y} y2={AXIS_Y} stroke={C.axis} />
          {[0, 200, 400, 600, 800, 1000, 1200].map(f => (
            <g key={f}>
              <line x1={fx(f)} x2={fx(f)} y1={AXIS_Y - 3} y2={AXIS_Y + 3} stroke={C.axis} />
              <T x={fx(f)} y={AXIS_Y + BAR + 30} anchor="middle" size={7.5}>{f}</T>
            </g>
          ))}
          <T x={AX1} y={AXIS_Y + BAR + 30} anchor="end" size={7.5}>Hz</T>
          <T x={4} y={AXIS_Y - 30} size={8} bold color={C.sky}>220</T>
          <T x={4} y={AXIS_Y + 36} size={8} bold color={C.amber}>{f2.toFixed(0)}</T>
          {lower.map(({ f, a }, i) => {
            const hit = i + 1 === q;
            return (
              <g key={`l${i}`}>
                <line x1={fx(f)} x2={fx(f)} y1={AXIS_Y} y2={AXIS_Y - BAR * a - 6} stroke={C.sky} strokeWidth={hit ? 4 : 2.5} strokeLinecap="round" />
                <T x={fx(f)} y={AXIS_Y - BAR * a - 11} anchor="middle" size={7.5} color={hit ? C.sky : C.muted} bold={hit}>{i + 1}</T>
              </g>
            );
          })}
          {upper.map(({ f, a }, i) => {
            const hit = i + 1 === p;
            return (
              <g key={`u${i}`}>
                <line x1={fx(f)} x2={fx(f)} y1={AXIS_Y} y2={AXIS_Y + BAR * a + 6} stroke={C.amber} strokeWidth={hit ? 4 : 2.5} strokeLinecap="round" />
                <T x={fx(f)} y={AXIS_Y + BAR * a + 15} anchor="middle" size={7.5} color={hit ? C.amber : C.muted} bold={hit}>{i + 1}</T>
              </g>
            );
          })}
          <circle cx={fx(meet)} cy={AXIS_Y} r={11} fill="none" stroke={delta < 0.05 ? C.green : C.red} strokeWidth={1.8} />

          {/* the beat of the meeting pair */}
          <T x={AX0} y={ENV_Y - ENV_H - 10} size={8.5} bold color={C.fg}>
            {tx(t, "figMus_btSum", "the two meeting harmonics added, over 4 seconds")}
          </T>
          <path d={beatPath(delta)} fill="none" stroke={delta < 0.05 ? C.green : C.purple} strokeWidth={0.9} opacity={0.85} />
          {[0, 1, 2, 3, 4].map(s => (
            <T key={s} x={AX0 + (s / SPAN) * (AX1 - AX0)} y={ENV_Y + ENV_H + 14} anchor="middle" size={7.5}>{s} s</T>
          ))}
          {on && <line x1={AX0 + (clock / SPAN) * (AX1 - AX0)} x2={AX0 + (clock / SPAN) * (AX1 - AX0)} y1={ENV_Y - ENV_H - 2} y2={ENV_Y + ENV_H + 2} stroke={C.fg} strokeWidth={1.5} opacity={0.6} />}
        </svg>
        <div className="px-3 pb-3">
          <SoundButton on={on} onClick={toggle}>
            {on ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_btPlay", "hold the two notes")}
          </SoundButton>
        </div>
      </div>
    </Figure>
  );
}
