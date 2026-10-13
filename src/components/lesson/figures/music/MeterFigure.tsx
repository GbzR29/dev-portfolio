"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, Slider, T, useVisible } from "@/components/lesson/kit/figure";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { accentClick, usePulseLoop, type Hit } from "./usePulseLoop";

// ── What this figure shows ────────────────────────────────────────────────────
// Meter as a pattern of strong and weak beats. One bar loops; each beat is
// strong, medium or weak, drawn as a taller or shorter bar and heard as a
// louder or softer click. The presets are the three everyday meters (2/4
// march, 3/4 waltz, 4/4 with its medium third beat) and a bar with no accents
// at all, which the ear still groups by itself (chapter 5). Clicking a beat
// changes its strength, and the beat count can grow, so the reader can make
// any meter. On piano, strong beats play the bass and weak beats a chord:
// the "oom-pah" (2), "oom-pah-pah" (3) of marches and waltzes.

const W = 600, H = 184, X0 = 96, X1 = 560, BASE = 128;
const LEVEL_H = [16, 40, 66], LEVEL_R = [5.5, 7.5, 10];
const COLOR = [C.purple, C.sky, C.amber];
const BASS = [0, 43, 48];                                     // G2 on medium beats, C3 on strong ones
const CHORD = [64, 67, 72];                                   // E4 G4 C5 on weak beats

type Preset = "none" | "2" | "3" | "4";
const PRESETS: Record<Preset, number[]> = { none: [0, 0, 0, 0], 2: [2, 0], 3: [2, 0, 0], 4: [2, 0, 1, 0] };

/** The hits of one beat, as clicks or on the piano. */
function hitsOf(level: number, piano: boolean): Hit[] {
  if (!piano) return [accentClick(level)];
  return level > 0 ? [{ midi: BASS[level], vel: level === 2 ? 0.8 : 0.62 }] : CHORD.map(midi => ({ midi, vel: 0.38 }));
}

export function MusicMeterFigure({ t }: { t?: TrackTranslations }) {
  const [levels, setLevels] = useState<number[]>(PRESETS[3]);
  const [preset, setPreset] = useState<Preset | null>("3");
  const [bpm, setBpm] = useState(120);
  const [piano, setPiano] = useState(false);
  const vis = useVisible<HTMLDivElement>();
  const loop = usePulseLoop(vis.on, { pulses: levels.map(l => hitsOf(l, piano)), spp: 60 / bpm });

  const n = levels.length, w = (X1 - X0) / n, cx = (i: number) => X0 + (i + 0.5) * w;
  const choose = (p: Preset) => { setPreset(p); setLevels(PRESETS[p]); };
  const cycle = (i: number) => { setPreset(null); setLevels(ls => ls.map((l, k) => (k === i ? (l + 1) % 3 : l))); };
  const grow = (d: number) => {
    if (n + d < 1 || n + d > 8) return;
    setPreset(null); setLevels(ls => (d > 0 ? [...ls, 0] : ls.slice(0, -1)));
  };
  const sound = (p: boolean) => { setPiano(p); if (p) loop.preparePiano(); };
  const name = (l: number) => [tx(t, "figMus_meWeak", "weak"), tx(t, "figMus_meMedium", "medium"), tx(t, "figMus_meStrong", "strong")][l];
  const unknown = preset === "none";

  return (
    <Figure title={tx(t, "figMus_meTitle", "Strong and weak beats make the meter")}
      head={<Choice value={piano ? "piano" : "clicks"} onChange={v => sound(v === "piano")}
        options={[["clicks", tx(t, "figMus_meClicks", "clicks")], ["piano", tx(t, "figMus_mePiano", "piano")]]} />}
      controls={<>
        <Row>
          <Btn active={preset === "none"} onClick={() => choose("none")}>{tx(t, "figMus_meNone", "no accents")}</Btn>
          <Btn active={preset === "2"} onClick={() => choose("2")}>2/4 · {tx(t, "figMus_meMarch", "march")}</Btn>
          <Btn active={preset === "3"} onClick={() => choose("3")}>3/4 · {tx(t, "figMus_meWaltz", "waltz")}</Btn>
          <Btn active={preset === "4"} onClick={() => choose("4")}>4/4</Btn>
          <Btn onClick={() => grow(-1)}>− {tx(t, "figMus_meBeat", "beat")}</Btn>
          <Btn onClick={() => grow(1)}>+ {tx(t, "figMus_meBeat", "beat")}</Btn>
        </Row>
        <Slider label={tx(t, "figMus_meBpm", "tempo (BPM)")} value={bpm} min={60} max={200} step={1} onChange={setBpm} fmt={v => `${v} BPM`} width="w-28" />
        <Row>
          <Readout>{tx(t, "figMus_meBar", "one bar")} = {n} × 60/{bpm} = {((n * 60) / bpm).toFixed(2)} s</Readout>
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_meNote", "Play the waltz, then switch to 2/4 and 4/4 without stopping: the clicks keep the same speed, only the pattern of loud and soft changes, and the music changes character. Then pick \"no accents\" and listen: after a few beats most people hear groups anyway. Click any beat to make it stronger or weaker, add beats, and build a meter of your own (try 5 beats as strong-weak-weak-medium-weak).")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
          {/* the time signature: beats per bar over the beat's note value */}
          <text x={48} y={74} textAnchor="middle" fontSize={34} fontWeight={700} fontFamily="Georgia, serif" fill={C.fg}>{unknown ? "?" : n}</text>
          <text x={48} y={112} textAnchor="middle" fontSize={34} fontWeight={700} fontFamily="Georgia, serif" fill={C.fg}>{unknown ? "?" : 4}</text>

          {/* the bar: a bar line at the start, a repeat sign at the end */}
          <line x1={X0} x2={X0} y1={30} y2={BASE + 4} stroke={C.axis} strokeWidth={1.5} />
          <line x1={X1} x2={X1} y1={30} y2={BASE + 4} stroke={C.axis} strokeWidth={1.5} />
          <line x1={X1 + 5} x2={X1 + 5} y1={30} y2={BASE + 4} stroke={C.axis} strokeWidth={4} />
          <circle cx={X1 - 7} cy={68} r={2.6} fill={C.axis} />
          <circle cx={X1 - 7} cy={92} r={2.6} fill={C.axis} />
          <line x1={X0} x2={X1} y1={BASE} y2={BASE} stroke={C.grid} />

          {levels.map((l, i) => {
            const lit = loop.pulse === i, x = cx(i);
            return (
              <g key={i} onClick={() => cycle(i)} style={{ cursor: "pointer" }}>
                <rect x={x - w / 2} y={20} width={w} height={H - 20} fill="transparent" />
                <rect x={x - 7} y={BASE - LEVEL_H[l]} width={14} height={LEVEL_H[l]} rx={3} fill={COLOR[l]} opacity={lit ? 0.95 : 0.45} />
                <circle cx={x} cy={BASE - LEVEL_H[l] - LEVEL_R[l] - 3} r={LEVEL_R[l] + (lit ? 3 : 0)} fill={COLOR[l]} opacity={lit ? 1 : 0.75} />
                <T x={x} y={BASE + 20} anchor="middle" size={13} bold={l === 2} color={lit ? C.fg : C.muted}>{i + 1}</T>
                <T x={x} y={BASE + 36} anchor="middle" size={8.5} color={COLOR[l]}>{name(l)}</T>
              </g>
            );
          })}
        </svg>
        <div className="px-3 pb-3 flex items-center gap-3">
          <SoundButton on={loop.running} onClick={() => loop.toggle(piano)}>
            {loop.running ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_mePlay", "play the bar, over and over")}
          </SoundButton>
          {loop.load === "loading" && <span className="text-[11px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_loading", "loading the piano (1.3 MB)…")}</span>}
        </div>
      </div>
    </Figure>
  );
}
