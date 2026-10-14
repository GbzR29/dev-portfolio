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
import { FLAT_D, MAJOR, MINOR, SHARP_D, majorScale, minorScale, minorSignature, signatureSign, stepsOf, tonicOf, type MinorForm } from "./scales";
import { abbr, measure } from "./intervals";

// ── What this figure shows ────────────────────────────────────────────────────
// The minor scale on a chosen tonic, in its three forms, written the way music
// writes it: the key signature of the minor key (shared with its relative
// major) after the clef, and a sign beside a note only where the form departs
// from the signature (the raised 7th of the harmonic minor, the raised 6th and
// 7th of the melodic minor going up). Arcs give the steps (whole, half, and
// the harmonic minor's step and a half). Under each note: degree, function,
// interval from the tonic; degrees lower than in the major scale on the same
// tonic are purple, raised ones amber. Played down, the melodic minor turns
// back into the natural form, as in classical practice.

const W = 600, STEP = 5.5, X_CLEF = 38, PAD = 22;
const LO = 55, HI = 84;
const { lines, anchor } = CLEFS.treble;
const dHi = 44, dLo = 25, STAFF_H = (dHi - dLo) * STEP + 2 * PAD, H = STAFF_H + 74;
const yOf = (d: number) => PAD + (dHi - d) * STEP;

/** Tonic buttons: A, the sharp side, the flat side (line-of-fifths positions of minor tonics). */
const TONICS = [3, 4, 5, 6, 7, 8, 9, 10, 2, 1, 0, -1, -2, -3, -4];
/** A pressed key as a minor tonic, spelled as the usual minor key on it. */
const FROM_KEY: Record<number, number> = { 0: 0, 1: 7, 2: 2, 3: -3, 4: 4, 5: -1, 6: 6, 7: 1, 8: 8, 9: 3, 10: -2, 11: 5 };

const FUNCS: [string, string][] = [
  ["figMus_sbD1", "tonic"], ["figMus_sbD2", "supertonic"], ["figMus_sbD3", "mediant"], ["figMus_sbD4", "subdominant"],
  ["figMus_sbD5", "dominant"], ["figMus_sbD6", "submediant"], ["figMus_mnSubtonic", "subtonic"], ["figMus_sbD1", "tonic"],
];

export function MusicMinorScaleFigure({ t }: { t?: TrackTranslations }) {
  const [r, setR] = useState(3);
  const [form, setForm] = useState<MinorForm>("natural");
  const [falling, setFalling] = useState(false);
  const [pressed, setPressed] = useState<ReadonlySet<number>>(new Set());
  const { inst, load, ensure } = useNotes();
  const vis = useVisible<HTMLDivElement>();
  const seq = useSequence(vis.on);

  const tonic = tonicOf(r), sig = minorSignature(r);
  // played down, the melodic minor is the natural one
  const shown: MinorForm = form === "melodic" && falling ? "natural" : form;
  const scale = minorScale(tonic, shown), sizes = MINOR[shown], steps = stepsOf(sizes);
  const run = useCallback((f: () => void) => { startAudio(); if (notesReady()) f(); else ensure().then(f, () => {}); }, [ensure]);
  const playRun = (notes: Spelled[], up: boolean) => run(() => seq.play(8, i => playNote(keyOf(notes[up ? i : 7 - i])), { gap: 0.36, hold: 0.5 }));
  const play = (up: boolean, rr = r, f = form) => {
    setFalling(!up);
    const fm: MinorForm = f === "melodic" && !up ? "natural" : f;
    playRun(minorScale(tonicOf(rr), fm), up);
  };
  const playMajor = () => { setFalling(false); playRun(majorScale(tonic), true); };
  const choose = (q: number) => { setR(q); play(true, q); };
  const pickForm = (f: MinorForm) => { setForm(f); play(true, r, f); };
  const keyDown = (m: number) => { setPressed(s => new Set(s).add(m)); choose(FROM_KEY[((m % 12) + 12) % 12]); };
  const keyUp = (m: number) => setPressed(s => { const n = new Set(s); n.delete(m); return n; });

  const lit = seq.step === null ? null : falling ? 7 - seq.step : seq.step;
  const keys = new Set(scale.map(keyOf));
  const keyColor = (m: number) => (m === keyOf(tonic) || m === keyOf(tonic) + 12 ? C.sky : keys.has(m) ? C.purple : null);

  // the signature, then the notes
  const sigD = sig > 0 ? SHARP_D.slice(0, sig) : FLAT_D.slice(0, -sig);
  const x0 = X_CLEF + 40 + Math.max(sigD.length, 1) * 11 + 18, dx = (W - 34 - x0) / 7;
  const xOf = (k: number) => x0 + k * dx;
  const lower = (k: number) => k < 7 && sizes[k] < MAJOR[k];                         // below the major scale's degree
  const isRaised = (k: number) => k < 7 && sizes[k] > MINOR.natural[k];              // raised above the natural minor
  const lowered = [2, 5, 6].filter(lower).map(k => k + 1);
  const relMajor = spelledName(tonicOf(r - 3), false), name = spelledName(tonic, false);
  const funcOf = (k: number) => (k === 6 && sizes[6] === 11 ? ["figMus_sbD7", "leading tone"] : FUNCS[k]);
  const signWord = (n: number) => n === 0 ? tx(t, "figMus_sbNoSigns", "no sharps or flats")
    : `${Math.abs(n)} ${n > 0 ? (n === 1 ? tx(t, "figMus_ksSharp", "sharp") : tx(t, "figMus_ksSharps", "sharps")) : (n === -1 ? tx(t, "figMus_ksFlat", "flat") : tx(t, "figMus_ksFlats", "flats"))}`;

  return (
    <Figure title={tx(t, "figMus_mnTitle", "The minor scale in three forms")}
      head={<InstrumentChoice t={t} />}
      controls={<>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_sbTonic", "tonic")}</span>
          {TONICS.map(q => <Btn key={q} active={q === r} onClick={() => choose(q)}>{spelledName(tonicOf(q), false)}</Btn>)}
        </Row>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_mnForm", "form")}</span>
          <Choice value={form} onChange={pickForm} options={[
            ["natural", tx(t, "figMus_mnNatural", "natural")], ["harmonic", tx(t, "figMus_mnHarmonic", "harmonic")], ["melodic", tx(t, "figMus_mnMelodic", "melodic")],
          ]} />
        </Row>
        <Row>
          <Readout color={C.sky}>{name} {tx(t, "figMus_mnMinor", "minor")} · {signWord(sig)}</Readout>
          <Readout color={C.fg}>{tx(t, "figMus_mnRelative", "relative major")}: {relMajor}</Readout>
          <Readout color={C.purple}>{tx(t, "figMus_mnVsMajor", "lower than in")} {name} {tx(t, "figMus_sbMajor", "major")}: {lowered.join(", ")}</Readout>
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_mnNote", "Start on A: the white keys from A to A are the natural minor, whole, half, whole, whole, half, whole, whole. Compared with the major scale on the same tonic, degrees 3, 6 and 7 are a half step lower (purple). Its 7th is a whole step below the tonic and does not lean into it, so the harmonic form raises it (amber): a leading tone again, but now degrees 6 and 7 are a step and a half apart, a gap you can hear. The melodic form also raises the 6th on the way up to smooth that gap out, and on the way down, where no leading tone is needed, it is the natural form again: play it down and watch the signs disappear. The key signature is the natural minor's, shared with the relative major, so every raised note is written beside the note itself.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
          {lines.map(d => <line key={d} x1={X_CLEF - 22} x2={W - 10} y1={yOf(d)} y2={yOf(d)} stroke={C.fg} strokeOpacity={0.75} strokeWidth={1.2} />)}
          <Clef kind="treble" x={X_CLEF} y={yOf(anchor)} s={2 * STEP} color={C.fg} />
          {sigD.map((d, i) => <AccidentalGlyph key={i} a={(sig > 0 ? 1 : -1) as Acc} x={X_CLEF + 30 + i * 11} y={yOf(d)} s={2 * STEP} color={C.fg} />)}
          {scale.map((n, k) => {
            const x = xOf(k), on = lit === k;
            const color = on ? C.green : k === 0 || k === 7 ? C.sky : isRaised(k) ? C.amber : C.fg;
            const written = n.a !== signatureSign(sig, letterOf(n.d));                // a sign only where the signature is wrong
            return (
              <g key={k}>
                {written && <AccidentalGlyph a={n.a} x={x - accOffset(n.a) * 2 * STEP} y={yOf(n.d)} s={2 * STEP} color={color} />}
                <StaffNote x={x} y={yOf(n.d)} s={2 * STEP} color={color} ledgerYs={ledgers(n.d, lines).map(yOf)} filled={on} />
              </g>
            );
          })}
          {/* the steps between neighbouring notes */}
          {steps.map((st, k) => {
            const xa = xOf(k) + 8, xb = xOf(k + 1) - 8, y = 12, color = st === 1 ? C.red : st === 3 ? C.amber : C.muted;
            const label = st === 1 ? tx(t, "figMus_sbHalf", "half") : st === 3 ? tx(t, "figMus_mnAug", "1½") : tx(t, "figMus_sbWhole", "whole");
            return (
              <g key={k}>
                <path d={`M${xa},${y + 8} Q${(xa + xb) / 2},${y - 4} ${xb},${y + 8}`} fill="none" stroke={color} strokeWidth={st === 3 ? 2.2 : 1.4} />
                <T x={(xa + xb) / 2} y={y + 2} anchor="middle" size={8.5} bold color={color}>{label}</T>
              </g>
            );
          })}
          {/* under each note: degree, name, function, interval from the tonic */}
          {scale.map((n, k) => {
            const x = xOf(k), on = lit === k, iv = measure(tonic, n), [fk, fe] = funcOf(k);
            const nameColor = k === 0 || k === 7 ? C.sky : isRaised(k) ? C.amber : lower(k) ? C.purple : C.fg;
            return (
              <g key={k}>
                <T x={x} y={STAFF_H + 6} anchor="middle" size={13} bold color={on ? C.green : C.fg}>{k === 7 ? "8" : k + 1}</T>
                <T x={x} y={STAFF_H + 24} anchor="middle" size={11} bold color={nameColor}>{spelledName(n, false)}</T>
                <T x={x} y={STAFF_H + 40} anchor="middle" size={8} color={C.muted}>{tx(t, fk, fe)}</T>
                <T x={x} y={STAFF_H + 56} anchor="middle" size={8.5} color={lower(k) ? C.purple : C.green}>{iv.q ? abbr(iv.q, iv.n, t) : ""}</T>
              </g>
            );
          })}
          <T x={W - 12} y={STAFF_H + 70} anchor="end" size={8.5} color={C.muted}>
            {form === "melodic" && falling ? tx(t, "figMus_mnDownNat", "coming down, the melodic minor is the natural form")
              : form === "natural" ? tx(t, "figMus_mnSigOnly", "the signature alone: no extra signs")
              : tx(t, "figMus_mnSigns", "the raised notes are written beside the note: they are not in the signature")}
          </T>
        </svg>
        <div className="px-3 pb-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            <SoundButton on={false} onClick={() => play(true)}>{tx(t, "figMus_sbUp", "play up")}</SoundButton>
            <SoundButton on={false} onClick={() => play(false)}>{tx(t, "figMus_sbDown", "play down")}</SoundButton>
            <SoundButton on={false} onClick={playMajor}>{tx(t, "figMus_mnPlayMajor", "play the major on the same tonic")}</SoundButton>
          </div>
          <NoteSurface t={t} lo={LO} hi={HI} pressed={pressed} onDown={keyDown} onUp={keyUp} labels="c" keyColor={keyColor}
            ariaLabel={tx(t, "figMus_mnAria", "piano keyboard: press a key to build its minor scale")}
            guitarAriaLabel={tx(t, "figMus_mnNeckAria", "guitar neck: press a note to build its minor scale")} />
          {load === "loading" && <span className="text-[11px] font-mono text-[var(--text-muted)]">{loadStatus(t, inst, load)}</span>}
        </div>
      </div>
    </Figure>
  );
}
