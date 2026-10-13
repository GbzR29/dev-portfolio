"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Row, Slider, T, useVisible } from "@/components/lesson/kit/figure";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { usePulseLoop, type Hit } from "./usePulseLoop";

// ── What this figure shows ────────────────────────────────────────────────────
// A small drum machine: one 4/4 bar in 16 sixteenths, four rows (a piano
// chord, hi-hat, snare, kick) that the reader can edit. The presets are
// grooves built on accents off the strong beats: the rock backbeat (snare on
// 2 and 4), four on the floor, the reggae one drop (nothing on beat 1) and
// the reggaeton dembow (snare on the tresillo). An "audience" row claps on
// 1 and 3 or on 2 and 4, so the reader hears which one fits the groove.

const W = 600, X0 = 78, X1 = 590, Y0 = 16, ROW = 28, STEPS = 16;
const CHORD = [57, 60, 64];                                   // A3 C4 E4: A minor

type Inst = "chord" | "hat" | "snare" | "kick";
const INSTS: Inst[] = ["chord", "hat", "snare", "kick"];
const COLOR: Record<Inst | "clap", string> = { chord: C.teal, hat: C.sky, snare: C.amber, kick: C.purple, clap: C.pink };
type Groove = Record<Inst, number[]>;

const EIGHTHS = [0, 2, 4, 6, 8, 10, 12, 14], OFF = [2, 6, 10, 14];
type Preset = "rock" | "floor" | "onedrop" | "dembow";
const PRESETS: Record<Preset, Groove> = {
  rock: { chord: [0, 8], hat: EIGHTHS, snare: [4, 12], kick: [0, 8, 10] },
  floor: { chord: [], hat: OFF, snare: [4, 12], kick: [0, 4, 8, 12] },
  onedrop: { chord: OFF, hat: EIGHTHS, snare: [8], kick: [8] },
  dembow: { chord: [0], hat: [], snare: [3, 6, 11, 14], kick: [0, 4, 8, 12] },
};
type Clap = "none" | "13" | "24";
const CLAPS: Record<Clap, number[]> = { none: [], 13: [0, 8], 24: [4, 12] };

/** The hits of sixteenth `p` in groove `g` with the audience clapping on `claps`. */
function hitsOf(g: Groove, claps: number[], p: number): Hit[] {
  const hits: Hit[] = [];
  if (g.kick.includes(p)) hits.push({ drum: "kick", level: 0.8 });
  if (g.snare.includes(p)) hits.push({ drum: "snare", level: 0.5 });
  if (g.hat.includes(p)) hits.push({ drum: "hat", level: p % 4 === 0 ? 0.2 : 0.14 });
  if (claps.includes(p)) hits.push({ drum: "clap", level: 0.45 });
  if (g.chord.includes(p)) CHORD.forEach(midi => hits.push({ midi, vel: 0.42 }));
  return hits;
}

export function MusicBackbeatFigure({ t }: { t?: TrackTranslations }) {
  const [g, setG] = useState<Groove>(PRESETS.rock);
  const [preset, setPreset] = useState<Preset | null>("rock");
  const [clap, setClap] = useState<Clap>("24");
  const [bpm, setBpm] = useState(100);
  const vis = useVisible<HTMLDivElement>();
  const loop = usePulseLoop(vis.on, { pulses: Array.from({ length: STEPS }, (_, p) => hitsOf(g, CLAPS[clap], p)), spp: 15 / bpm });

  const w = (X1 - X0) / STEPS, cx = (p: number) => X0 + (p + 0.5) * w, rows = [...INSTS, "clap" as const];
  const yRow = (i: number) => Y0 + i * ROW, H = yRow(rows.length) + 30;
  const choose = (p: Preset) => { setPreset(p); setG(PRESETS[p]); if (PRESETS[p].chord.length) loop.preparePiano(); };
  const toggle = (inst: Inst, p: number) => {
    setPreset(null);
    setG(x => ({ ...x, [inst]: x[inst].includes(p) ? x[inst].filter(q => q !== p) : [...x[inst], p] }));
    if (inst === "chord") loop.preparePiano();
  };
  const label: Record<Inst | "clap", string> = {
    chord: tx(t, "figMus_bbChord", "chord"), hat: tx(t, "figMus_bbHat", "hi-hat"), snare: tx(t, "figMus_bbSnare", "snare"),
    kick: tx(t, "figMus_bbKick", "kick"), clap: tx(t, "figMus_bbClap", "audience"),
  };
  const syll = [tx(t, "figMus_sdE", "e"), tx(t, "figMus_sdAnd", "&"), tx(t, "figMus_sdA", "a")];

  return (
    <Figure title={tx(t, "figMus_bbTitle", "The backbeat: a drum machine")}
      controls={<>
        <Row>
          <Btn active={preset === "rock"} onClick={() => choose("rock")}>{tx(t, "figMus_bbRock", "rock backbeat")}</Btn>
          <Btn active={preset === "floor"} onClick={() => choose("floor")}>{tx(t, "figMus_bbFloor", "four on the floor")}</Btn>
          <Btn active={preset === "onedrop"} onClick={() => choose("onedrop")}>{tx(t, "figMus_bbOneDrop", "reggae one drop")}</Btn>
          <Btn active={preset === "dembow"} onClick={() => choose("dembow")}>{tx(t, "figMus_bbDembow", "reggaeton dembow")}</Btn>
        </Row>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_bbClapOn", "audience claps on")}</span>
          <Choice value={clap} onChange={setClap}
            options={[["none", tx(t, "figMus_bbNoClap", "no clap")], ["13", tx(t, "figMus_bb13", "1 and 3")], ["24", tx(t, "figMus_bb24", "2 and 4")]]} />
        </Row>
        <Slider label={tx(t, "figMus_meBpm", "tempo (BPM)")} value={bpm} min={60} max={140} step={1} onChange={setBpm} fmt={v => `${v} BPM`} width="w-28" />
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_bbNote", "Play the rock backbeat with the audience clapping on 2 and 4, then switch the clap to 1 and 3 while it plays: the same claps, two beats earlier, and the groove turns stiff, like a march. Try the one drop, where beat 1 is left empty and the drop comes on 3, and the dembow, whose snare plays the tresillo against a steady kick. Click any cell to edit a groove.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
          {[0, 4, 8, 12, 16].map(p => (
            <line key={p} x1={X0 + p * w} x2={X0 + p * w} y1={Y0 - 4} y2={yRow(rows.length)} stroke={p % 16 === 0 ? C.axis : C.grid} strokeWidth={p % 16 === 0 ? 1.5 : 1} />
          ))}
          {loop.pulse !== null && <rect x={X0 + loop.pulse * w} y={Y0 - 4} width={w} height={yRow(rows.length) - Y0 + 4} fill={C.fg} opacity={0.07} />}
          {rows.map((inst, i) => {
            const y = yRow(i), on = inst === "clap" ? CLAPS[clap] : g[inst];
            return (
              <g key={inst}>
                <T x={X0 - 8} y={y + ROW / 2 + 3} anchor="end" size={10} bold={inst === "clap"} color={COLOR[inst]}>{label[inst]}</T>
                {Array.from({ length: STEPS }, (_, p) => {
                  const x = on.includes(p), lit = loop.pulse === p && x;
                  return (
                    <rect key={p} x={cx(p) - w / 2 + 2.5} y={y + 3} width={w - 5} height={ROW - 6} rx={4}
                      fill={x ? COLOR[inst] : "transparent"} opacity={x ? (lit ? 1 : 0.7) : 1} stroke={x ? "none" : C.grid}
                      style={{ cursor: inst === "clap" ? "default" : "pointer" }}
                      onClick={inst === "clap" ? undefined : () => toggle(inst, p)} />
                  );
                })}
              </g>
            );
          })}
          {Array.from({ length: STEPS }, (_, p) => (
            <T key={p} x={cx(p)} y={yRow(rows.length) + 16} anchor="middle" size={p % 4 === 0 ? 12 : 9.5} bold={p % 4 === 0} color={p % 4 === 0 ? C.fg : C.muted}>
              {p % 4 === 0 ? p / 4 + 1 : syll[(p % 4) - 1]}
            </T>
          ))}
        </svg>
        <div className="px-3 pb-3 flex items-center gap-3">
          <SoundButton on={loop.running} onClick={() => loop.toggle(g.chord.length > 0)}>
            {loop.running ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_bbPlay", "play the groove")}
          </SoundButton>
          {loop.load === "loading" && <span className="text-[11px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_loading", "loading the piano (1.3 MB)…")}</span>}
        </div>
      </div>
    </Figure>
  );
}
