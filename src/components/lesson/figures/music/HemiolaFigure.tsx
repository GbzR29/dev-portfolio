"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, Slider, T, useVisible } from "@/components/lesson/kit/figure";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { usePulseLoop, type Hit } from "./usePulseLoop";

// ── What this figure shows ────────────────────────────────────────────────────
// 3/4 against 6/8. Both bars hold the same six eighth notes, but 3/4 groups
// them in three pairs (three beats, each split in two) and 6/8 in two threes
// (two beats, each split in three). The notation shows it with the beams:
// pairs on the top row, threes on the bottom. Each row has its own sound
// (a high click or piano note for 3/4, a low one for 6/8), so they can be
// heard one at a time, alternating bar by bar (the hemiola of Baroque
// cadences, Latin American music and "America" from West Side Story), or
// both at once: three against two, meeting only on the downbeat.

const W = 600, H = 206, X0 = 112, X1 = 560, N = 6;
const ROW_Y = [70, 158];
const COLOR = [C.amber, C.sky];
const GROUP = [2, 3];                                         // eighths per beat: 3/4, 6/8

type Mode = "34" | "68" | "alt" | "both";

const xP = (p: number) => X0 + (p + 0.5) * ((X1 - X0) / N);

/** The hits of one row on eighth `p` (0…5): a beat start, louder on the downbeat. */
function rowHits(row: 0 | 1, p: number, piano: boolean): Hit[] {
  if (p % GROUP[row] !== 0) return [];
  const down = p === 0;
  if (piano) return [{ midi: row === 0 ? 72 : 48, vel: down ? 0.8 : 0.55 }];
  return [{ hz: row === 0 ? 1800 : 900, level: down ? 0.75 : 0.45 }];
}

/** Which row a bar plays: bar 0 and 1 of the loop, by mode. */
const rowsOf = (mode: Mode, bar: number): (0 | 1)[] =>
  mode === "34" ? [0] : mode === "68" ? [1] : mode === "both" ? [0, 1] : [bar === 0 ? 0 : 1];

export function MusicHemiolaFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("34");
  const [rate, setRate] = useState(270);                      // eighth notes per minute
  const [ticks, setTicks] = useState(true);
  const [piano, setPiano] = useState(false);
  const vis = useVisible<HTMLDivElement>();
  const pulses = Array.from({ length: 2 * N }, (_, i) => {
    const bar = Math.floor(i / N), p = i % N;
    const hits = rowsOf(mode, bar).flatMap(row => rowHits(row, p, piano));
    return ticks ? [...hits, { hz: 2600, level: 0.12 }] : hits;
  });
  const loop = usePulseLoop(vis.on, { pulses, spp: 60 / rate });

  const bar = loop.pulse === null ? null : Math.floor(loop.pulse / N), heard = loop.pulse === null ? null : loop.pulse % N;
  const active = (row: 0 | 1) => bar === null ? rowsOf(mode, 0).includes(row) || rowsOf(mode, 1).includes(row) : rowsOf(mode, bar).includes(row);
  const sound = (p: boolean) => { setPiano(p); if (p) loop.preparePiano(); };
  const ms = (row: 0 | 1) => Math.round((GROUP[row] * 60000) / rate);
  const and = tx(t, "figMus_sdAnd", "&"), trip = tx(t, "figMus_sdTrip", "trip"), let_ = tx(t, "figMus_sdLet", "let");
  const count = [["1", and, "2", and, "3", and], ["1", trip, let_, "2", trip, let_]];
  const label = [tx(t, "figMus_hmRow34", "3 beats of 2 eighths"), tx(t, "figMus_hmRow68", "2 beats of 3 eighths")];

  return (
    <Figure title={tx(t, "figMus_hmTitle", "Six eighth notes, two meters: 3/4 and 6/8")}
      head={<Choice value={piano ? "piano" : "clicks"} onChange={v => sound(v === "piano")}
        options={[["clicks", tx(t, "figMus_meClicks", "clicks")], ["piano", tx(t, "figMus_mePiano", "piano")]]} />}
      controls={<>
        <Row>
          <Choice value={mode} onChange={setMode} options={[
            ["34", "3/4"], ["68", "6/8"],
            ["alt", tx(t, "figMus_hmAlt", "alternate bar by bar")],
            ["both", tx(t, "figMus_hmBoth", "both at once")],
          ]} />
          <Btn active={ticks} onClick={() => setTicks(x => !x)}>{tx(t, "figMus_hmTicks", "tick every eighth")}</Btn>
        </Row>
        <Slider label={tx(t, "figMus_hmRate", "eighths per minute")} value={rate} min={150} max={480} step={1} onChange={setRate} fmt={v => `${v}`} width="w-32" />
        <Row>
          <Readout color={COLOR[0]}>3/4: {tx(t, "figMus_hmBeat", "beat")} = 2 × 60/{rate} s = {ms(0)} ms ({Math.round(rate / 2)} BPM)</Readout>
          <Readout color={COLOR[1]}>6/8: {tx(t, "figMus_hmBeat", "beat")} = 3 × 60/{rate} s = {ms(1)} ms ({Math.round(rate / 3)} BPM)</Readout>
          <Readout>{tx(t, "figMus_meBar", "one bar")} = 6 × 60/{rate} = {((6 * 60) / rate).toFixed(2)} s</Readout>
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_hmNote", "Play 3/4, then 6/8: the tick under them is the same six eighths, and both bars last the same time, but the beats fall in different places and the feel flips from a waltz to a lilting two. \"Alternate\" swaps the grouping every bar, the hemiola. \"Both at once\" plays three beats against two in the same bar: they agree on the downbeat and nowhere else.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
          {/* the shared eighths */}
          {Array.from({ length: N }, (_, p) => (
            <line key={p} x1={xP(p)} x2={xP(p)} y1={22} y2={H - 10} stroke={heard === p ? C.fg : C.grid} strokeDasharray="2 4" opacity={heard === p ? 0.5 : 1} />
          ))}
          {mode === "alt" && <T x={X1} y={14} anchor="end" size={8.5}>{tx(t, "figMus_hmAltLabel", "bar 1: 3/4 → bar 2: 6/8 → again")}</T>}

          {([0, 1] as const).map(row => {
            const y = ROW_Y[row], g = GROUP[row], on = active(row), col = COLOR[row];
            return (
              <g key={row} opacity={on ? 1 : 0.3}>
                <text x={36} y={y - 12} textAnchor="middle" fontSize={24} fontWeight={700} fontFamily="Georgia, serif" fill={C.fg}>{row === 0 ? 3 : 6}</text>
                <text x={36} y={y + 14} textAnchor="middle" fontSize={24} fontWeight={700} fontFamily="Georgia, serif" fill={C.fg}>{row === 0 ? 4 : 8}</text>
                <T x={64} y={y + 34} size={8.5} color={col}>{label[row]}</T>
                <line x1={X0} x2={X0} y1={y - 34} y2={y + 10} stroke={C.axis} strokeWidth={1.5} />
                <line x1={X1} x2={X1} y1={y - 34} y2={y + 10} stroke={C.axis} strokeWidth={1.5} />
                {/* one beam per beat: that is how notation shows the grouping */}
                {Array.from({ length: N / g }, (_, b) => (
                  <rect key={b} x={xP(b * g) + 4} y={y - 32} width={xP(b * g + g - 1) - xP(b * g) + 1.5} height={4.5} fill={on ? col : C.muted} />
                ))}
                {Array.from({ length: N }, (_, p) => {
                  const beat = p % g === 0, lit = on && heard === p;
                  return (
                    <g key={p}>
                      {beat && <circle cx={xP(p)} cy={y} r={lit ? 15 : 12} fill={col} opacity={lit ? 0.45 : 0.2} />}
                      <ellipse cx={xP(p)} cy={y} rx={5.4} ry={3.9} transform={`rotate(-20 ${xP(p)} ${y})`} fill={lit ? col : C.fg} />
                      <line x1={xP(p) + 4.8} x2={xP(p) + 4.8} y1={y - 1} y2={y - 30} stroke={lit ? col : C.fg} strokeWidth={1.4} />
                      <T x={xP(p)} y={y + 22} anchor="middle" size={9.5} bold={beat} color={lit ? C.fg : beat ? col : C.muted}>{count[row][p]}</T>
                    </g>
                  );
                })}
              </g>
            );
          })}
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
