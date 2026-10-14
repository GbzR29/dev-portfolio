"use client";

import { useCallback, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { notesReady, playNote } from "@/components/lesson/kit/audio/instrument";
import { InstrumentChoice, loadStatus, useNotes } from "@/components/lesson/kit/audio/useInstrument";
import { NoteSurface } from "@/components/lesson/kit/audio/NoteSurface";
import { useSequence } from "@/components/lesson/kit/audio/useSequence";
import { CLEFS, Clef, StaffNote, ledgers } from "./staff";
import { AccidentalGlyph, accOffset, keyOf, letterOf, spelledName, type Acc, type Spelled } from "./accidentals";
import { LETTERS } from "./names";
import { MAJOR_STEPS, majorScale, sharpScale, tonicOf } from "./scales";
import { abbr } from "./intervals";

// ── What this figure shows ────────────────────────────────────────────────────
// The major scale on a chosen tonic: eight notes on a treble staff, each with
// the sign it needs, the step between neighbours (whole 2 / half 1) drawn as
// an arc, and under each note its degree number, its name in the scale and its
// interval from the tonic (all major or perfect). "Sharps only" spells the
// same keys with sharps whatever the letter, to show what goes wrong: a
// letter twice, another missing. Keys or frets set the tonic; the scale plays
// up or down with the playing note lit on the staff and the keyboard.

type Spell = "letters" | "sharps";
const W = 600, STEP = 5.5, X_CLEF = 38, X0 = 96, DX = 62, PAD = 22;
const LO = 55, HI = 84;
const { lines, anchor } = CLEFS.treble;
const dHi = 44, dLo = 25, STAFF_H = (dHi - dLo) * STEP + 2 * PAD, H = STAFF_H + 74;
const yOf = (d: number) => PAD + (dHi - d) * STEP;
const xOf = (k: number) => X0 + k * DX;

/** Tonic buttons: C, the sharp keys, the flat keys (line-of-fifths positions). */
const TONICS = [0, 1, 2, 3, 4, 5, 6, 7, -1, -2, -3, -4, -5, -6, -7];
/** A pressed key as a tonic: white keys plain, black keys as their usual key name (F♯, the rest flats). */
const FROM_KEY: Record<number, number> = { 0: 0, 1: -5, 2: 2, 3: -3, 4: 4, 5: -1, 6: 6, 7: 1, 8: -4, 9: 3, 10: -2, 11: 5 };

const DEGREE_NAMES: [string, string][] = [
  ["figMus_sbD1", "tonic"], ["figMus_sbD2", "supertonic"], ["figMus_sbD3", "mediant"], ["figMus_sbD4", "subdominant"],
  ["figMus_sbD5", "dominant"], ["figMus_sbD6", "submediant"], ["figMus_sbD7", "leading tone"], ["figMus_sbD1", "tonic"],
];
const QUALS = [["P", 1], ["M", 2], ["M", 3], ["P", 4], ["P", 5], ["M", 6], ["M", 7], ["P", 8]] as const;

export function MusicScaleBuilderFigure({ t }: { t?: TrackTranslations }) {
  const [p, setP] = useState(1);
  const [spell, setSpell] = useState<Spell>("letters");
  const [pressed, setPressed] = useState<ReadonlySet<number>>(new Set());
  const { inst, load, ensure } = useNotes();
  const vis = useVisible<HTMLDivElement>();
  const seq = useSequence(vis.on);

  const tonic = tonicOf(p), scale = majorScale(tonic), naive = sharpScale(tonic);
  const run = useCallback((f: () => void) => { startAudio(); if (notesReady()) f(); else ensure().then(f, () => {}); }, [ensure]);
  const [falling, setFalling] = useState(false);
  const play = (up: boolean, sc = scale) => { setFalling(!up); run(() => seq.play(8, i => playNote(keyOf(sc[up ? i : 7 - i])), { gap: 0.36, hold: 0.5 })); };
  const choose = (q: number) => { setP(q); play(true, majorScale(tonicOf(q))); };
  const keyDown = (m: number) => { setPressed(s => new Set(s).add(m)); choose(FROM_KEY[((m % 12) + 12) % 12]); };
  const keyUp = (m: number) => setPressed(s => { const n = new Set(s); n.delete(m); return n; });

  const lit = seq.step === null ? null : falling ? 7 - seq.step : seq.step;    // the degree index sounding
  const keys = new Set(scale.map(keyOf));
  const keyColor = (m: number) => (m === keyOf(tonic) || m === keyOf(tonic) + 12 ? C.sky : keys.has(m) ? C.amber : null);
  const letters = spell === "letters" ? scale.map(s => LETTERS[letterOf(s.d)]) : naive.map(n => n.name[0]);
  const dup = new Set(letters.slice(0, 7).filter((l, i, xs) => xs.indexOf(l) !== i));
  const missing = LETTERS.filter(l => !letters.slice(0, 7).includes(l));
  const signs = scale.slice(0, 7).filter(s => s.a !== 0).map(s => spelledName(s, false));
  const keyName = spelledName(tonic, false);

  /** The naive spelling as a staff note: the letter of its sharp name. */
  const naiveNote = (k: number): Spelled => {
    const m = naive[k].m, sharp = naive[k].name.length > 1, letter = LETTERS.indexOf(naive[k].name[0]);
    const oct = Math.floor((m - (sharp ? 1 : 0)) / 12) - 1;
    return { d: 7 * oct + letter, a: (sharp ? 1 : 0) as Acc };
  };
  const notes = spell === "letters" ? scale : scale.map((_, k) => naiveNote(k));

  return (
    <Figure title={tx(t, "figMus_sbTitle", "Build a major scale on any note")}
      head={<InstrumentChoice t={t} />}
      controls={<>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_sbTonic", "tonic")}</span>
          {TONICS.map(q => <Btn key={q} active={q === p} onClick={() => choose(q)}>{spelledName(tonicOf(q), false)}</Btn>)}
        </Row>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_sbSpell", "spelling")}</span>
          <Choice value={spell} onChange={setSpell} options={[["letters", tx(t, "figMus_sbLetters", "each letter once")], ["sharps", tx(t, "figMus_sbSharps", "sharps only")]]} />
        </Row>
        <Row>
          <Readout color={C.sky}>{keyName} {tx(t, "figMus_sbMajor", "major")}</Readout>
          {spell === "letters"
            ? <Readout color={C.amber}>{signs.length ? signs.join(" ") : tx(t, "figMus_sbNoSigns", "no sharps or flats")}</Readout>
            : <Readout color={dup.size ? C.red : C.green}>{dup.size
              ? `${tx(t, "figMus_sbTwice", "twice")}: ${[...dup].join(", ")} · ${tx(t, "figMus_sbMissing", "missing")}: ${missing.join(", ")}`
              : tx(t, "figMus_sbFine", "this key happens to work with sharps")}</Readout>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_sbNote", "Pick a tonic, or press any key. Every major scale has the same steps, whole, whole, half, whole, whole, whole, half, so it sounds the same from any note, only higher or lower. Under each note: its degree, its name, and its interval above the tonic, which is always major or perfect. That is where the name of the scale comes from. Now switch to sharps only and pick F or E♭: some letter appears twice and another one is missing, so two notes share a line of the staff and one degree has a natural and its neighbour a sharp of the same letter. Spelled with every letter once, the scale climbs one line or space at a time and each key needs only one kind of sign.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
          {lines.map(d => <line key={d} x1={X_CLEF - 22} x2={W - 10} y1={yOf(d)} y2={yOf(d)} stroke={C.fg} strokeOpacity={0.75} strokeWidth={1.2} />)}
          <Clef kind="treble" x={X_CLEF} y={yOf(anchor)} s={2 * STEP} color={C.fg} />
          {notes.map((n, k) => {
            const x = xOf(k), on = lit !== null && lit === k, color = on ? C.green : k === 0 || k === 7 ? C.sky : spell === "sharps" && dup.has(letters[k]) ? C.red : C.fg;
            return (
              <g key={k}>
                {n.a !== 0 && <AccidentalGlyph a={n.a} x={x - accOffset(n.a) * 2 * STEP} y={yOf(n.d)} s={2 * STEP} color={color} />}
                <StaffNote x={x} y={yOf(n.d)} s={2 * STEP} color={color} ledgerYs={ledgers(n.d, lines).map(yOf)} filled={on} />
              </g>
            );
          })}
          {/* the steps between neighbouring notes */}
          {MAJOR_STEPS.map((st, k) => {
            const x0 = xOf(k) + 8, x1 = xOf(k + 1) - 8, y = 12;
            return (
              <g key={k}>
                <path d={`M${x0},${y + 8} Q${(x0 + x1) / 2},${y - 4} ${x1},${y + 8}`} fill="none" stroke={st === 1 ? C.red : C.muted} strokeWidth={1.4} />
                <T x={(x0 + x1) / 2} y={y + 2} anchor="middle" size={8.5} bold color={st === 1 ? C.red : C.muted}>{st === 1 ? tx(t, "figMus_sbHalf", "half") : tx(t, "figMus_sbWhole", "whole")}</T>
              </g>
            );
          })}
          {/* under each note: degree, name, interval from the tonic */}
          {notes.map((n, k) => {
            const x = xOf(k), on = lit === k, bad = spell === "sharps" && dup.has(letters[k]);
            const name = spell === "letters" ? spelledName(n, false) : naive[k].name;
            return (
              <g key={k}>
                <T x={x} y={STAFF_H + 6} anchor="middle" size={13} bold color={on ? C.green : C.fg}>{k === 7 ? "8" : k + 1}</T>
                <T x={x} y={STAFF_H + 24} anchor="middle" size={11} bold color={bad ? C.red : k === 0 || k === 7 ? C.sky : C.amber}>{name}</T>
                <T x={x} y={STAFF_H + 40} anchor="middle" size={8} color={C.muted}>{tx(t, DEGREE_NAMES[k][0], DEGREE_NAMES[k][1])}</T>
                <T x={x} y={STAFF_H + 56} anchor="middle" size={8.5} color={C.green}>{abbr(QUALS[k][0], QUALS[k][1], t)}</T>
              </g>
            );
          })}
          {spell === "sharps" && dup.size > 0 && (
            <T x={W - 12} y={STAFF_H + 70} anchor="end" size={8.5} color={C.red}>
              {tx(t, "figMus_sbSameLine", "two notes on one line or space, none on the next: the scale no longer climbs step by step")}
            </T>
          )}
          {spell === "letters" && <T x={W - 12} y={STAFF_H + 70} anchor="end" size={8.5} color={C.muted}>{tx(t, "figMus_sbAllMP", "every interval from the tonic is major or perfect")}</T>}
        </svg>
        <div className="px-3 pb-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            <SoundButton on={false} onClick={() => play(true)}>{tx(t, "figMus_sbUp", "play up")}</SoundButton>
            <SoundButton on={false} onClick={() => play(false)}>{tx(t, "figMus_sbDown", "play down")}</SoundButton>
          </div>
          <NoteSurface t={t} lo={LO} hi={HI} pressed={pressed} onDown={keyDown} onUp={keyUp} labels="c" keyColor={keyColor}
            ariaLabel={tx(t, "figMus_sbAria", "piano keyboard: press a key to build its major scale")}
            guitarAriaLabel={tx(t, "figMus_sbNeckAria", "guitar neck: press a note to build its major scale")} />
          {load === "loading" && <span className="text-[11px] font-mono text-[var(--text-muted)]">{loadStatus(t, inst, load)}</span>}
        </div>
      </div>
    </Figure>
  );
}
