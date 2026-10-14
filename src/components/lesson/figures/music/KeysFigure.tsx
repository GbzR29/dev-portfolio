"use client";

import { useCallback, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, Slider, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { notesReady, playNote } from "@/components/lesson/kit/audio/instrument";
import { InstrumentChoice, useNotes } from "@/components/lesson/kit/audio/useInstrument";
import { useSequence } from "@/components/lesson/kit/audio/useSequence";
import { CLEFS, Clef, StaffNote, ledgers } from "./staff";
import { ACC_TEXT, AccidentalGlyph, keyOf, spelledName, type Acc } from "./accidentals";
import { LETTERS } from "./names";
import { FLAT_D, SHARP_D, atFifth, majorScale, tonicOf } from "./scales";

// ── What this figure shows ────────────────────────────────────────────────────
// Every note name on one line, a fifth apart: … B♭ F C G D A E B F♯ C♯ …
// Any 7 neighbours on that line are a major scale (its tonic is the second of
// the seven), so a key is a window sliding along the line. Moving one fifth
// up slides the window one place right: one note drops out on the left and
// its sharpened version comes in on the right, the new seventh degree. The
// staff shows the key signature that results (sharps in the order F C G D A
// E B, flats B E A D G C F) and the scale written with it, without any sign
// beside the notes.

const W = 600, CELL = 27.6, X0 = 10, LINE_LO = -8, LINE_HI = 12;
const STEP = 5.5, X_CLEF = 36, PAD = 14, TOP = 78;
const { lines, anchor } = CLEFS.treble;
const dHi = 42, dLo = 26, H = TOP + (dHi - dLo) * STEP + 2 * PAD + 6;
const yOf = (d: number) => TOP + PAD + (dHi - d) * STEP;
const cx = (q: number) => X0 + (q - LINE_LO + 0.5) * CELL;

const nameAt = (q: number) => { const { l, a } = atFifth(q); return LETTERS[l] + ACC_TEXT[Math.max(-2, Math.min(2, a)) as Acc]; };
const signColor = (q: number) => { const a = atFifth(q).a; return a > 0 ? C.amber : a < 0 ? C.purple : C.fg; };

export function MusicKeysFigure({ t }: { t?: TrackTranslations }) {
  const [p, setP] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const { ensure } = useNotes();
  const vis = useVisible<HTMLDivElement>();
  const seq = useSequence(vis.on);

  const tonic = tonicOf(p), scale = majorScale(tonic);
  const go = (q: number) => { setPrev(p); setP(Math.max(-7, Math.min(7, q))); };
  const run = useCallback((f: () => void) => { startAudio(); if (notesReady()) f(); else ensure().then(f, () => {}); }, [ensure]);
  const play = () => run(() => seq.play(8, i => playNote(keyOf(scale[i])), { gap: 0.34, hold: 0.48 }));

  const inWin = (q: number) => q >= p - 1 && q <= p + 5;
  const came = prev === null || prev === p ? null : p > prev ? p + 5 : p - 1;       // the note that just entered
  const went = prev === null || prev === p ? null : p > prev ? prev - 1 : prev + 5; // the note that just left
  const sigD = p > 0 ? SHARP_D.slice(0, p) : FLAT_D.slice(0, -p);
  const sigNames = (p > 0 ? [6, 7, 8, 9, 10, 11, 12].slice(0, p) : [-2, -3, -4, -5, -6, -7, -8].slice(0, -p)).map(nameAt);
  const sigX = (i: number) => X_CLEF + 30 + i * 11;
  const noteX0 = X_CLEF + 40 + Math.max(sigD.length, 1) * 11 + 18, noteDX = (W - 30 - noteX0) / 7;

  return (
    <Figure title={tx(t, "figMus_ksTitle", "Keys on the line of fifths")}
      head={<InstrumentChoice t={t} />}
      controls={<>
        <Slider label={tx(t, "figMus_ksKey", "key")} value={p} min={-7} max={7} step={1} onChange={go}
          fmt={v => `${spelledName(tonicOf(v), false)}`} width="w-16" />
        <Row>
          <Btn onClick={() => go(p - 1)}>← {tx(t, "figMus_ksDown", "a fifth down")}</Btn>
          <Btn onClick={() => go(p + 1)}>{tx(t, "figMus_ksUp", "a fifth up")} →</Btn>
        </Row>
        <Row>
          <Readout color={C.sky}>{spelledName(tonic, false)} {tx(t, "figMus_sbMajor", "major")}</Readout>
          <Readout color={p > 0 ? C.amber : p < 0 ? C.purple : C.fg}>
            {p === 0 ? tx(t, "figMus_sbNoSigns", "no sharps or flats")
              : `${Math.abs(p)} ${p > 0 ? (p === 1 ? tx(t, "figMus_ksSharp", "sharp") : tx(t, "figMus_ksSharps", "sharps")) : (p === -1 ? tx(t, "figMus_ksFlat", "flat") : tx(t, "figMus_ksFlats", "flats"))}: ${sigNames.join(" ")}`}
          </Readout>
          {came !== null && <Readout color={C.green}>+ {nameAt(came)}</Readout>}
          {went !== null && <Readout color={C.red}>− {nameAt(went)}</Readout>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_ksNote", "Any seven neighbours on the line of fifths make a major scale, with the tonic second from the left. Start on C: F C G D A E B, no signs. Go a fifth up to G: the window slides one place, F drops out and F♯ comes in, the new seventh degree. Every step up adds one sharp, always the next on the line: F♯ C♯ G♯ D♯ A♯ E♯ B♯. Every step down adds a flat, the new fourth degree: B♭ E♭ A♭ D♭ G♭ C♭ F♭. That is the whole secret of key signatures: the signs come in a fixed order, so the signature lists them once, at the start of every staff.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
          {/* the line of fifths */}
          <rect x={cx(p - 1) - CELL / 2} y={12} width={7 * CELL} height={34} rx={7} fill={C.sky} fillOpacity={0.12} stroke={C.sky} strokeWidth={1.5} />
          {Array.from({ length: LINE_HI - LINE_LO + 1 }, (_, i) => {
            const q = LINE_LO + i, inside = inWin(q), tonicCell = q === p;
            return (
              <g key={q} onClick={() => go(q)} style={{ cursor: q >= -7 && q <= 7 ? "pointer" : "default" }}>
                {tonicCell && <rect x={cx(q) - CELL / 2 + 2} y={15} width={CELL - 4} height={28} rx={5} fill="none" stroke={C.fg} strokeWidth={1.5} />}
                {q === came && <rect x={cx(q) - CELL / 2 + 2} y={15} width={CELL - 4} height={28} rx={5} fill={C.green} fillOpacity={0.25} />}
                <T x={cx(q)} y={33} anchor="middle" size={10} bold={inside} color={q === went ? C.red : inside ? signColor(q) : C.muted}>{nameAt(q)}</T>
                {inside && <T x={cx(q)} y={58} anchor="middle" size={7.5} color={C.muted}>{[4, 1, 5, 2, 6, 3, 7][q - p + 1]}</T>}
              </g>
            );
          })}
          <T x={X0} y={70} size={8} color={C.muted}>{tx(t, "figMus_ksDeg", "the numbers: each note's degree in the scale")}</T>

          {/* the key signature and the scale written with it */}
          {lines.map(d => <line key={d} x1={X_CLEF - 22} x2={W - 10} y1={yOf(d)} y2={yOf(d)} stroke={C.fg} strokeOpacity={0.75} strokeWidth={1.2} />)}
          <Clef kind="treble" x={X_CLEF} y={yOf(anchor)} s={2 * STEP} color={C.fg} />
          {sigD.map((d, i) => <AccidentalGlyph key={i} a={(p > 0 ? 1 : -1) as Acc} x={sigX(i)} y={yOf(d)} s={2 * STEP} color={p > 0 ? C.amber : C.purple} />)}
          {scale.map((n, k) => {
            const x = noteX0 + k * noteDX, on = seq.step === k, signed = n.a !== 0;
            const color = on ? C.green : signed ? (n.a > 0 ? C.amber : C.purple) : C.fg;
            return (
              <g key={k}>
                <StaffNote x={x} y={yOf(n.d)} s={2 * STEP} color={color} ledgerYs={ledgers(n.d, lines).map(yOf)} filled={on} />
                <T x={x} y={H - 4} anchor="middle" size={9} bold={on} color={color}>{spelledName(n, false)}</T>
              </g>
            );
          })}
        </svg>
        <div className="px-3 pb-3">
          <SoundButton on={false} onClick={play}>{tx(t, "figMus_ksPlay", "play the scale")}</SoundButton>
        </div>
      </div>
    </Figure>
  );
}
