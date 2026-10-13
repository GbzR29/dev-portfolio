"use client";

import { useCallback, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { pitchClass } from "@/components/lesson/kit/audio/notes";
import { notesReady, playNote } from "@/components/lesson/kit/audio/instrument";
import { InstrumentChoice, loadStatus, useNotes } from "@/components/lesson/kit/audio/useInstrument";
import { NoteSurface } from "@/components/lesson/kit/audio/NoteSurface";
import { useVoices } from "@/components/lesson/kit/audio/useVoices";
import { PHONE, useMediaQuery } from "@/components/lesson/kit/media";
import { CLEFS, Clef, StaffNote, ledgers } from "./staff";
import { AccidentalGlyph, accOffset, keyOf, spelledName, spelledSolfa, spellings, type Acc } from "./accidentals";

// ── What this figure shows ────────────────────────────────────────────────────
// One key, every name it can have. Pressing a key of the octave C4–B4 writes
// all its spellings side by side on a treble staff (two or three notes on
// different lines that sound the same) and plays it. Below, a table of the 12
// keys of the octave lists every spelling of each, coloured by its sign: with
// sharps and flats only that is 21 names, with the double signs 35, and only
// G♯/A♭ (the middle key of the group of three) has two instead of three.
// On the guitar any place on the neck can be pressed; it sounds where it is
// and is named in the octave of the staff (C4–B4).

const W = 600, STEP = 6, X_CLEF = 46, PAD = 20, LO = 60, HI = 71;
const { lines, anchor } = CLEFS.treble;
const dLo = 24, dHi = 40, SH = (dHi - dLo) * STEP + 2 * PAD;
const yOf = (d: number) => PAD + (dHi - d) * STEP;
const COL = W / 12, CELL = 22, GH = 24 + 3 * CELL + 8;      // the table: 12 columns, or 2 rows of 6 on a phone

const signColor = (a: Acc) => (a === 0 ? C.fg : a > 0 ? (a === 2 ? C.purple : C.sky) : a === -2 ? C.pink : C.orange);

export function MusicEnharmonicFigure({ t }: { t?: TrackTranslations }) {
  const [m, setM] = useState(68);                           // G♯4 / A♭4
  const [doubles, setDoubles] = useState(true);
  const [pressed, setPressed] = useState<ReadonlySet<number>>(new Set());
  const { inst, load, ensure } = useNotes();
  const vis = useVisible<HTMLDivElement>();
  const voices = useVoices(vis.on);
  const perRow = useMediaQuery(PHONE) ? 6 : 12;

  const sound = useCallback((k: number) => {
    startAudio();
    const go = () => { voices.start(k, playNote(k)); setTimeout(() => voices.release(k), 900); };
    if (notesReady()) go(); else ensure().then(go, () => {});
  }, [ensure, voices]);
  const pick = (k: number) => { setM(LO + pitchClass(k)); sound(k); };

  const max = doubles ? 2 : 1;
  const names = spellings(m, max);
  const xs = names.map((_, i) => 200 + (i - (names.length - 1) / 2) * 130);
  const table = Array.from({ length: 12 }, (_, pc) => spellings(LO + pc, max));
  const total = table.reduce((s, c) => s + c.length, 0);

  return (
    <Figure title={tx(t, "figMus_ehTitle", "One key, many names")}
      head={<>
        <InstrumentChoice t={t} onChange={() => voices.releaseAll()} />
        <Btn active={doubles} onClick={() => setDoubles(v => !v)}>{tx(t, "figMus_ehDoubles", "with double sharps and flats")}</Btn>
      </>}
      controls={<>
        <Row>
          <Readout color={C.amber}>{names.map(s => spelledName(s)).join(" = ")}</Readout>
          <Readout>{names.map(s => spelledSolfa(t, s)).join(" = ")}</Readout>
          <Readout>MIDI {m}</Readout>
        </Row>
        <Row>
          <Readout>{doubles
            ? tx(t, "figMus_ehCount2", "7 letters × 5 signs = {n} names for 12 keys").replace("{n}", String(total))
            : tx(t, "figMus_ehCount1", "7 letters × 3 (♭, none, ♯) = {n} names for 12 keys").replace("{n}", String(total))}</Readout>
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_ehNote", "Press the black key between G and A: G♯ and A♭, two notes on different lines of the staff, one key. Then press a white key, say C: it is also B♯ (one letter down, raised) and D♭♭ (one letter up, lowered twice). With the double signs on, every key has three names except one. Look at the table for the column with only two and work out why: which letters lie within two half steps of that key?")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${SH}`} className="w-full h-auto block select-none" style={{ maxHeight: 200 }}>
          {lines.map(d => <line key={d} x1={X_CLEF - 22} x2={380} y1={yOf(d)} y2={yOf(d)} stroke={C.fg} strokeOpacity={0.75} strokeWidth={1.2} />)}
          <Clef kind="treble" x={X_CLEF} y={yOf(anchor)} s={2 * STEP} color={C.fg} />
          {names.map((s, i) => (
            <g key={s.d} onPointerDown={() => sound(keyOf(s))} style={{ cursor: "pointer" }}>
              <rect x={xs[i] - 40} y={0} width={70} height={SH} fill="transparent" />
              {s.a !== 0 && <AccidentalGlyph a={s.a} x={xs[i] - accOffset(s.a) * 2 * STEP} y={yOf(s.d)} s={2 * STEP} color={signColor(s.a)} />}
              <StaffNote x={xs[i]} y={yOf(s.d)} s={2 * STEP} color={signColor(s.a)} ledgerYs={ledgers(s.d, lines).map(yOf)} />
              <T x={xs[i] + 14} y={yOf(s.d) + 4} size={11} bold color={signColor(s.a)}>{spelledName(s)}</T>
            </g>
          ))}
          <T x={420} y={yOf(36)} size={10} color={C.muted}>{tx(t, "figMus_ehSameKey", "different lines,")}</T>
          <T x={420} y={yOf(36) + 14} size={10} color={C.muted}>{tx(t, "figMus_ehSameKey2", "the same key")}</T>
        </svg>
        <svg viewBox={`0 0 ${perRow * COL} ${GH * (12 / perRow)}`} className="w-full h-auto block select-none">
          {table.map((col, pc) => {
            const x = (pc % perRow) * COL, on = pitchClass(m) === pc;
            return (
              <g key={pc} onPointerDown={() => pick(LO + pc)} style={{ cursor: "pointer" }} transform={`translate(0 ${Math.floor(pc / perRow) * GH})`}>
                <rect x={x + 1.5} y={2} width={COL - 3} height={GH - 4} rx={5}
                  fill={on ? C.amber : "transparent"} fillOpacity={on ? 0.12 : 0} stroke={on ? C.amber : C.fg} strokeOpacity={on ? 0.9 : 0.15} />
                <T x={x + COL / 2} y={16} anchor="middle" size={9} color={C.muted}>{LO + pc}</T>
                {col.map((s, j) => <T key={s.d} x={x + COL / 2} y={24 + (j + 0.7) * CELL} anchor="middle" size={12} bold color={signColor(s.a)}>{spelledName(s, false)}</T>)}
                {doubles && col.length === 2 && <T x={x + COL / 2} y={GH - 8} anchor="middle" size={8.5} bold color={C.amber}>{tx(t, "figMus_ehOnly2", "only 2")}</T>}
              </g>
            );
          })}
        </svg>
        <div className="px-3 pb-3 pt-2">
          <NoteSurface t={t} lo={LO} hi={HI} pressed={new Set([m, ...pressed])} color={C.amber}
            onDown={k => { setPressed(s => new Set(s).add(k)); pick(k); }}
            onUp={k => setPressed(s => { const n = new Set(s); n.delete(k); return n; })} labels="none"
            ariaLabel={tx(t, "figMus_ehAria", "one octave of piano keys: press one to see all its names")}
            guitarAriaLabel={tx(t, "figMus_ehNeckAria", "guitar neck: press a note to see all its names")} />
          {load === "loading" && <span className="text-[11px] font-mono text-[var(--text-muted)]">{loadStatus(t, inst, load)}</span>}
        </div>
      </div>
    </Figure>
  );
}

