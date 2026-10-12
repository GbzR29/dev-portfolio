"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, Slider, T, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { NoteGlyph, VALUES, valueName, type NoteValue } from "./notation";
import { useRhythmPlayer, type RhythmEvent } from "./useRhythmPlayer";

// ── What this figure shows ────────────────────────────────────────────────────
// The halving tree of note values over one bar of four beats: one whole note,
// two halves, four quarters, eight eighths, sixteen sixteenths. Every row
// fills the same four beats; each row down splits every note of the row above
// into two. Pick a row and play it on the piano against a click on every
// beat, or play all five rows at once (each on its own note of a C chord) to
// hear the faster rows fit inside the slower ones.

const W = 600, H = 276, X0 = 128, X1 = 584, BEATS = 4;
const ROW0 = 52, ROW_H = 44;
const COLOR: Record<NoteValue, string> = { 1: C.sky, 2: C.teal, 4: C.green, 8: C.amber, 16: C.pink };
const MIDI: Record<NoteValue, number> = { 1: 48, 2: 55, 4: 60, 8: 64, 16: 67 };   // C3 G3 C4 E4 G4: a C chord, low to high

type Pick = NoteValue | "all";


const xB = (b: number) => X0 + (b / BEATS) * (X1 - X0);
const yRow = (i: number) => ROW0 + i * ROW_H;
const rowEvents = (v: NoteValue): RhythmEvent[] =>
  Array.from({ length: v }, (_, k) => ({ at: (k * BEATS) / v, len: BEATS / v, midi: MIDI[v] }));

export function MusicDurationTreeFigure({ t }: { t?: TrackTranslations }) {
  const [pick, setPick] = useState<Pick>(4);
  const [bpm, setBpm] = useState(72);
  const vis = useVisible<HTMLDivElement>();
  const player = useRhythmPlayer(vis.on);
  const head = useRef<SVGLineElement>(null);

  useFrame(vis.on && player.playing, () => {
    const x = String(xB(Math.max(0, Math.min(BEATS, player.now()))));
    head.current?.setAttribute("x1", x);
    head.current?.setAttribute("x2", x);
  });

  const play = () => {
    if (player.playing) return player.stop();
    const rows = pick === "all" ? VALUES : [pick];
    player.play(rows.flatMap(rowEvents), bpm, { beats: BEATS });
  };
  const choose = (p: Pick) => { player.stop(); setPick(p); };
  const on = (v: NoteValue) => pick === "all" || pick === v;
  const ms = (v: NoteValue) => Math.round(((BEATS / v) * 60000) / bpm);

  return (
    <Figure title={tx(t, "figMus_dtTitle", "Halve and halve again: the note values")}
      head={<>
        {VALUES.map(v => <Btn key={v} active={pick === v} onClick={() => choose(v)}>{v === 1 ? "1" : `1/${v}`}</Btn>)}
        <Btn active={pick === "all"} onClick={() => choose("all")}>{tx(t, "figMus_dtAll", "all at once")}</Btn>
      </>}
      controls={<>
        <Slider label={tx(t, "figMus_dtBpm", "tempo (BPM)")} value={bpm} min={40} max={140} step={1}
          onChange={v => { player.stop(); setBpm(v); }} fmt={v => `${v} BPM`} width="w-28" />
        <Row>
          {pick === "all"
            ? <Readout>{tx(t, "figMus_dtEvery", "every row lasts the same")} {BEATS} {tx(t, "figMus_dtBeats", "beats")} = {((BEATS * 60) / bpm).toFixed(2)} s</Readout>
            : <Readout color={COLOR[pick]}>{valueName(t, pick)}: 4/{pick} = {BEATS / pick} {tx(t, "figMus_dtBeat", "beat(s)")} = {ms(pick)} ms · {pick} {tx(t, "figMus_dtPerBar", "fill the bar")}</Readout>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_dtNote", "Each row fills the same four beats, with twice as many notes as the row above, each half as long. Play the quarters first: they land on the clicks, so with the beat as a quarter note, a quarter lasts one beat. Then the eighths (two per click) and the halves (one every other click). \"All at once\" stacks the five rows on the notes of a C chord.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
          {/* beat grid */}
          {Array.from({ length: BEATS + 1 }, (_, b) => (
            <g key={b}>
              <line x1={xB(b)} x2={xB(b)} y1={ROW0 - 30} y2={yRow(VALUES.length - 1) + 22} stroke={b === 0 || b === BEATS ? C.axis : C.grid}
                strokeWidth={b === 0 || b === BEATS ? 1.5 : 1} strokeDasharray={b === 0 || b === BEATS ? undefined : "3 4"} />
              {b < BEATS && <T x={xB(b) + 4} y={ROW0 - 34} size={9} bold color={C.fg}>{b + 1}</T>}
            </g>
          ))}
          <T x={X0 - 8} y={ROW0 - 34} anchor="end" size={8.5}>{tx(t, "figMus_dtBeatAx", "beat")}</T>

          {VALUES.map((v, i) => {
            const y = yRow(i), lit = (k: number) => player.pos !== null && on(v) && player.pos >= (k * BEATS) / v && player.pos < ((k + 1) * BEATS) / v;
            return (
              <g key={v} opacity={on(v) ? 1 : 0.35} onClick={() => choose(v)} style={{ cursor: "pointer" }}>
                <rect x={0} y={y - 22} width={W} height={ROW_H - 2} fill="transparent" />
                <T x={8} y={y - 3} size={9.5} bold color={on(v) ? COLOR[v] : C.muted}>{valueName(t, v)}</T>
                <T x={8} y={y + 10} size={8}>{v === 1 ? "4" : `4/${v} = ${BEATS / v}`} {tx(t, "figMus_dtBeatsShort", "beats")}</T>
                {Array.from({ length: v }, (_, k) => {
                  const a = xB((k * BEATS) / v), b = xB(((k + 1) * BEATS) / v);
                  return (
                    <g key={k}>
                      <rect x={a + 1} y={y + 6} width={Math.max(2, b - a - 3)} height={7} rx={3.5}
                        fill={COLOR[v]} opacity={lit(k) ? 1 : 0.45} />
                      <NoteGlyph x={a + 8} y={y} value={v} color={lit(k) ? COLOR[v] : C.fg} scale={0.82} />
                    </g>
                  );
                })}
              </g>
            );
          })}
          <line ref={head} x1={X0} x2={X0} y1={ROW0 - 28} y2={yRow(VALUES.length - 1) + 20} stroke={C.fg} strokeWidth={1.2} opacity={player.playing ? 0.6 : 0} />
        </svg>
        <div className="px-3 pb-3 flex items-center gap-3">
          <SoundButton on={player.playing} onClick={play}>
            {player.playing ? tx(t, "figMus_stop", "stop") : pick === "all" ? tx(t, "figMus_dtPlayAll", "play all five rows") : tx(t, "figMus_dtPlay", "play this row")}
          </SoundButton>
          {player.load === "loading" && <span className="text-[11px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_loading", "loading the piano (1.3 MB)…")}</span>}
        </div>
      </div>
    </Figure>
  );
}
