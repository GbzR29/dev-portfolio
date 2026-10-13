"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, Slider, T, useVisible } from "@/components/lesson/kit/figure";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { usePulseLoop, type Hit } from "./usePulseLoop";
import { bar, STEPS, syncopations, weight } from "./syncopation";

// ── What this figure shows ────────────────────────────────────────────────────
// One bar of 4/4 in 16 sixteenths, as a step sequencer. Under each step, its
// metrical weight from the grid (5 on beat 1 … 1 on the "e"s and "a"s). The
// reader clicks steps to place notes; every note whose silence covers a
// heavier position gets an arc to that position, scored by the difference
// (Longuet-Higgins & Lee), and the scores add up to the bar's syncopation S.
// The bar loops with a kick and hi-hat keeping the beat underneath, so the
// syncopated notes are heard against the meter they contradict.

const W = 600, H = 206, X0 = 34, X1 = 590, CY = 82, CH = 30, BASE = 168, UNIT = 9;
const CHORD = [60, 64, 67];                                   // C4 E4 G4

type Preset = "beat" | "offbeat" | "push" | "charleston" | "tresillo" | "clave";
const PRESETS: Record<Preset, number[]> = {
  beat: [0, 4, 8, 12],
  offbeat: [2, 6, 10, 14],
  push: [0, 4, 6, 12],
  charleston: [0, 6],
  tresillo: [0, 6, 12],
  clave: [0, 3, 6, 10, 12],
};

/** The hits of sixteenth `p`: the beat underneath, and the reader's note. */
function hitsOf(p: number, note: boolean, piano: boolean, beat: boolean): Hit[] {
  const under: Hit[] = !beat ? [] : p % 4 === 0 ? [{ drum: "kick", level: p === 0 ? 0.75 : 0.5 }] : p % 2 === 0 ? [{ drum: "hat", level: 0.12 }] : [];
  if (!note) return under;
  return [...under, ...(piano ? CHORD.map(midi => ({ midi, vel: 0.55 })) : [{ drum: "clap" as const, level: 0.6 }])];
}

export function MusicSyncopationFigure({ t }: { t?: TrackTranslations }) {
  const [on, setOn] = useState(() => bar(PRESETS.tresillo));
  const [preset, setPreset] = useState<Preset | null>("tresillo");
  const [bpm, setBpm] = useState(96);
  const [beat, setBeat] = useState(true);
  const [piano, setPiano] = useState(false);
  const vis = useVisible<HTMLDivElement>();
  const loop = usePulseLoop(vis.on, { pulses: on.map((x, p) => hitsOf(p, x, piano, beat)), spp: 15 / bpm });

  const w = (X1 - X0) / STEPS, cx = (p: number) => X0 + (p + 0.5) * w;
  const syn = syncopations(on), S = syn.reduce((s, x) => s + x.s, 0);
  const choose = (p: Preset) => { setPreset(p); setOn(bar(PRESETS[p])); };
  const toggle = (p: number) => { setPreset(null); setOn(xs => xs.map((x, q) => (q === p ? !x : x))); };
  const sound = (p: boolean) => { setPiano(p); if (p) loop.preparePiano(); };
  const name: Record<Preset, string> = {
    beat: tx(t, "figMus_syBeat", "on the beat"),
    offbeat: tx(t, "figMus_syOffbeat", "offbeats"),
    push: tx(t, "figMus_syPush", "anticipation"),
    charleston: "charleston",
    tresillo: "tresillo",
    clave: tx(t, "figMus_syClave", "son clave"),
  };
  const syll = [tx(t, "figMus_sdE", "e"), tx(t, "figMus_sdAnd", "&"), tx(t, "figMus_sdA", "a")];

  return (
    <Figure title={tx(t, "figMus_syTitle", "Measure the syncopation of a bar")}
      head={<Choice value={piano ? "piano" : "clap"} onChange={v => sound(v === "piano")}
        options={[["clap", tx(t, "figMus_syClap", "clap")], ["piano", tx(t, "figMus_mePiano", "piano")]]} />}
      controls={<>
        <Row>
          {(Object.keys(PRESETS) as Preset[]).map(p => <Btn key={p} active={preset === p} onClick={() => choose(p)}>{name[p]}</Btn>)}
          <Btn onClick={() => { setPreset(null); setOn(bar([])); }}>{tx(t, "figMus_syClear", "clear")}</Btn>
        </Row>
        <Row>
          <Slider label={tx(t, "figMus_meBpm", "tempo (BPM)")} value={bpm} min={60} max={140} step={1} onChange={setBpm} fmt={v => `${v} BPM`} width="w-28" />
          <Btn active={beat} onClick={() => setBeat(b => !b)}>{tx(t, "figMus_syUnder", "kick + hi-hat on the beat")}</Btn>
        </Row>
        <Row>
          <Readout color={C.amber}>S = {syn.length > 1 ? `${syn.map(x => x.s).join(" + ")} = ${S}` : S}</Readout>
          <Readout>{on.filter(Boolean).length} {tx(t, "figMus_syNotes", "notes")}, {syn.length} {tx(t, "figMus_sySyncopated", "syncopated")}</Readout>
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_syNote", "Start with \"on the beat\": four notes on the four beats, S = 0, steady and a bit stiff. Then the tresillo: its second note comes on the \"&\" of 2 and the silence after it covers beat 3 (weight 4), so it scores 4 − 2 = 2. Click steps to add or remove notes and watch the arcs: each one goes from a note to the heavier position its silence swallows. Remove the note on beat 1 and the last note of the bar suddenly scores a lot, because now its silence covers the next downbeat.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
          {/* beat boundaries */}
          {[0, 4, 8, 12, 16].map(p => (
            <line key={p} x1={X0 + p * w} x2={X0 + p * w} y1={CY - 8} y2={BASE + 4} stroke={p % 16 === 0 ? C.axis : C.grid} strokeWidth={p % 16 === 0 ? 1.5 : 1} />
          ))}
          <line x1={X0} x2={X1} y1={BASE} y2={BASE} stroke={C.grid} />

          {/* syncopation arcs: from the note to the heavier silent position */}
          {syn.map(({ from, to, s }) => {
            const x0 = cx(from), x1 = to > from ? cx(to) : X1, mid = (x0 + x1) / 2, top = CY - 20 - Math.min(44, (x1 - x0) * 0.22);
            return (
              <g key={from}>
                <path d={`M${x0},${CY - 4} Q${mid},${top - 12} ${x1},${CY - 4}`} fill="none" stroke={C.amber} strokeWidth={1.8} />
                <circle cx={x1} cy={CY - 4} r={2.6} fill={C.amber} />
                <T x={mid} y={top - 2} anchor="middle" size={11} bold color={C.amber}>+{s}</T>
                {to < from && <T x={X1 - 3} y={CY - 10} anchor="end" size={8} color={C.amber}>→ 1</T>}
              </g>
            );
          })}

          {on.map((x, p) => {
            const lit = loop.pulse === p, sy = syn.some(s => s.from === p), target = syn.some(s => s.to === p), wt = weight(p), X = cx(p);
            const fill = x ? (sy ? C.amber : C.sky) : "transparent";
            return (
              <g key={p} onClick={() => toggle(p)} style={{ cursor: "pointer" }}>
                <rect x={X - w / 2} y={CY - 10} width={w} height={BASE - CY + 30} fill="transparent" />
                <rect x={X - w / 2 + 3} y={CY} width={w - 6} height={CH} rx={5} fill={fill} opacity={x ? (lit ? 1 : 0.8) : 1}
                  stroke={target && !x ? C.amber : lit ? C.fg : C.axis} strokeWidth={target && !x ? 1.8 : lit ? 2 : 1} strokeDasharray={target && !x ? "4 3" : undefined} />
                {/* the metrical weight of the position */}
                <rect x={X - 5} y={BASE - wt * UNIT} width={10} height={wt * UNIT} rx={2} fill={wt >= 3 ? C.purple : C.axis} opacity={lit ? 0.95 : 0.55} />
                <T x={X} y={BASE - wt * UNIT - 4} anchor="middle" size={8.5} color={C.muted}>{wt}</T>
                <T x={X} y={BASE + 16} anchor="middle" size={p % 4 === 0 ? 12 : 9.5} bold={p % 4 === 0} color={lit ? C.fg : p % 4 === 0 ? C.fg : C.muted}>
                  {p % 4 === 0 ? p / 4 + 1 : syll[(p % 4) - 1]}
                </T>
              </g>
            );
          })}
          <T x={X0 + 2} y={BASE + 30} size={8.5}>{tx(t, "figMus_syWeights", "bars: the weight of each position (metrical grid)")}</T>
        </svg>
        <div className="px-3 pb-3 flex items-center gap-3">
          <SoundButton on={loop.running} onClick={() => loop.toggle(piano)}>
            {loop.running ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_hmPlay", "play the loop")}
          </SoundButton>
          {loop.load === "loading" && <span className="text-[11px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_loading", "loading the piano (1.3 MB)…")}</span>}
        </div>
      </div>
    </Figure>
  );
}
