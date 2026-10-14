"use client";

import { useCallback, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, Readout, Row, Slider, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { notesReady, playNote } from "@/components/lesson/kit/audio/instrument";
import { InstrumentChoice, useNotes } from "@/components/lesson/kit/audio/useInstrument";
import { useSequence } from "@/components/lesson/kit/audio/useSequence";
import { CLEFS, Clef, StaffNote, ledgers } from "./staff";
import { ACC_TEXT, AccidentalGlyph, keyOf, spelledName, type Acc, type Spelled } from "./accidentals";
import { LETTERS } from "./names";
import { FLAT_D, SHARP_D, atFifth, majorScale, minorScale, tonicOf } from "./scales";

// ── What this figure shows ────────────────────────────────────────────────────
// A major key and a minor key on the line of fifths (as in KeysFigure), each
// as a window of seven neighbours. Relative: the minor key on the major's
// 6th degree, three fifths to the right of its tonic; the windows coincide,
// so the two keys have the same notes and the same signature, and only the
// home note differs. Parallel: the minor key on the same tonic; its window
// sits three places to the left, so it has three more flats (or three fewer
// sharps). Two staves write both scales with their signatures; either plays.

type Rel = "relative" | "parallel";
const W = 600, CELL = 27.6, X0 = 10, LINE_LO = -8, LINE_HI = 12;
const STEP = 5, X_CLEF = 36, PAD = 12, TOP = 92;
const { lines, anchor } = CLEFS.treble;
const dHi = 41, dLo = 26, STAFF = (dHi - dLo) * STEP + 2 * PAD, LABEL = 16;
const H = TOP + 2 * (STAFF + LABEL) + 4;
const cx = (q: number) => X0 + (q - LINE_LO + 0.5) * CELL;

const nameAt = (q: number) => { const { l, a } = atFifth(q); return LETTERS[l] + ACC_TEXT[Math.max(-2, Math.min(2, a)) as Acc]; };

export function MusicRelativeFigure({ t }: { t?: TrackTranslations }) {
  const [p, setP] = useState(0);
  const [rel, setRel] = useState<Rel>("relative");
  const [playing, setPlaying] = useState<"major" | "minor" | null>(null);
  const { ensure } = useNotes();
  const vis = useVisible<HTMLDivElement>();
  const seq = useSequence(vis.on);

  const pMin = rel === "parallel" ? -4 : -7;                 // a parallel minor below A♭ would need double flats
  const r = rel === "relative" ? p + 3 : p;                   // the minor tonic's position
  const major = majorScale(tonicOf(p)), minor = minorScale(tonicOf(r));
  const sigMaj = p, sigMin = r - 3;
  const run = useCallback((f: () => void) => { startAudio(); if (notesReady()) f(); else ensure().then(f, () => {}); }, [ensure]);
  const play = (which: "major" | "minor") => {
    const sc = which === "major" ? major : minor;
    setPlaying(which);
    run(() => seq.play(8, i => playNote(keyOf(sc[i])), { gap: 0.34, hold: 0.48 }));
  };

  const name = (q: number) => spelledName(tonicOf(q), false);
  const signWord = (n: number) => n === 0 ? tx(t, "figMus_sbNoSigns", "no sharps or flats")
    : `${Math.abs(n)} ${n > 0 ? (n === 1 ? tx(t, "figMus_ksSharp", "sharp") : tx(t, "figMus_ksSharps", "sharps")) : (n === -1 ? tx(t, "figMus_ksFlat", "flat") : tx(t, "figMus_ksFlats", "flats"))}`;
  const majName = `${name(p)} ${tx(t, "figMus_sbMajor", "major")}`, minName = `${name(r)} ${tx(t, "figMus_mnMinor", "minor")}`;

  /** One staff: clef, signature, the scale, names under it. */
  const staff = (y0: number, sc: Spelled[], sig: number, color: string, label: string, which: "major" | "minor") => {
    const yOf = (d: number) => y0 + LABEL + PAD + (dHi - d) * STEP;
    const sigD = sig > 0 ? SHARP_D.slice(0, sig) : FLAT_D.slice(0, -sig);
    const nx0 = X_CLEF + 40 + Math.max(sigD.length, 1) * 10 + 16, ndx = (W - 30 - nx0) / 7;
    return (
      <g>
        <T x={X0} y={y0 + 11} size={10} bold color={color}>{label}</T>
        {lines.map(d => <line key={d} x1={X_CLEF - 22} x2={W - 10} y1={yOf(d)} y2={yOf(d)} stroke={C.fg} strokeOpacity={0.75} strokeWidth={1.1} />)}
        <Clef kind="treble" x={X_CLEF} y={yOf(anchor)} s={2 * STEP} color={C.fg} />
        {sigD.map((d, i) => <AccidentalGlyph key={i} a={(sig > 0 ? 1 : -1) as Acc} x={X_CLEF + 28 + i * 10} y={yOf(d)} s={2 * STEP} color={sig > 0 ? C.amber : C.purple} />)}
        {sc.map((n, k) => {
          const x = nx0 + k * ndx, on = playing === which && seq.step === k, home = k === 0 || k === 7;
          const c = on ? C.green : home ? color : C.fg;
          return (
            <g key={k}>
              <StaffNote x={x} y={yOf(n.d)} s={2 * STEP} color={c} ledgerYs={ledgers(n.d, lines).map(yOf)} filled={on || home} />
              <T x={x + 9} y={y0 + 11} anchor="middle" size={9} bold={home} color={c}>{spelledName(n, false)}</T>
            </g>
          );
        })}
      </g>
    );
  };

  const inMaj = (q: number) => q >= p - 1 && q <= p + 5;
  const inMin = (q: number) => q >= r - 4 && q <= r + 2;

  return (
    <Figure title={tx(t, "figMus_rlTitle", "Relative and parallel minor")}
      head={<InstrumentChoice t={t} />}
      controls={<>
        <Slider label={tx(t, "figMus_rlMajorKey", "major key")} value={p} min={pMin} max={7} step={1} onChange={v => { setP(v); setPlaying(null); }}
          fmt={v => name(v)} width="w-16" />
        <Row>
          <Choice value={rel} onChange={v => { setRel(v); setPlaying(null); if (v === "parallel") setP(q => Math.max(-4, q)); }} options={[
            ["relative", tx(t, "figMus_rlRelative", "relative minor")], ["parallel", tx(t, "figMus_rlParallel", "parallel minor")],
          ]} />
        </Row>
        <Row>
          <Readout color={C.sky}>{majName}: {signWord(sigMaj)}</Readout>
          <Readout color={C.purple}>{minName}: {signWord(sigMin)}</Readout>
          <Readout color={rel === "relative" ? C.green : C.amber}>
            {rel === "relative" ? tx(t, "figMus_rlSame", "same notes, same signature, another home")
              : `${tx(t, "figMus_rlSameTonic", "same tonic")}: 3 ${tx(t, "figMus_rlMoreFlats", "more flats (or fewer sharps)")}`}
          </Readout>
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_rlNote", "The blue frame is the major key, seven neighbours on the line of fifths with the tonic second from the left. The purple frame is a natural minor key, seven neighbours with the tonic fifth from the left. Relative: put the minor tonic on the major's 6th degree, three fifths to the right of the major tonic (C → A, a minor third down on the keyboard). The frames coincide: same seven notes, same signature, only the home note moves. Parallel: put the minor tonic on the same note as the major. Its frame slides three places to the left, so three notes drop out on the right and come back flattened on the left: the 3rd, 6th and 7th degrees, three more flats. Play both scales and listen for where each one comes to rest.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
          {/* the line of fifths with both windows */}
          <rect x={cx(p - 1) - CELL / 2} y={10} width={7 * CELL} height={36} rx={7} fill={C.sky} fillOpacity={0.1} stroke={C.sky} strokeWidth={1.5} />
          <rect x={cx(r - 4) - CELL / 2 + 1.5} y={14} width={7 * CELL - 3} height={46} rx={7} fill="none" stroke={C.purple} strokeWidth={1.5} strokeDasharray="5 3" />
          {Array.from({ length: LINE_HI - LINE_LO + 1 }, (_, i) => {
            const q = LINE_LO + i, inside = inMaj(q) || inMin(q), a = atFifth(q).a;
            return (
              <g key={q} onClick={() => { if (q >= pMin && q <= 7) { setP(q); setPlaying(null); } }} style={{ cursor: q >= pMin && q <= 7 ? "pointer" : "default" }}>
                {q === p && <rect x={cx(q) - CELL / 2 + 2} y={14} width={CELL - 4} height={26} rx={5} fill="none" stroke={C.sky} strokeWidth={2} />}
                {q === r && <rect x={cx(q) - CELL / 2 + 3} y={16} width={CELL - 6} height={22} rx={4} fill={C.purple} fillOpacity={0.22} />}
                <T x={cx(q)} y={31} anchor="middle" size={10} bold={inside} color={inside ? (a > 0 ? C.amber : a < 0 ? C.purple : C.fg) : C.muted}>{nameAt(q)}</T>
                {inMin(q) && !inMaj(q) && <T x={cx(q)} y={55} anchor="middle" size={7.5} bold color={C.purple}>{tx(t, "figMus_rlMinOnly", "minor")}</T>}
                {inMaj(q) && !inMin(q) && <T x={cx(q)} y={55} anchor="middle" size={7.5} bold color={C.sky}>{tx(t, "figMus_rlMajOnly", "major")}</T>}
              </g>
            );
          })}
          <T x={X0} y={76} size={8} color={C.muted}>{tx(t, "figMus_rlLegend", "blue: the major key, tonic boxed · purple dashes: the minor key, tonic filled")}</T>

          {staff(TOP - 10, major, sigMaj, C.sky, majName, "major")}
          {staff(TOP - 10 + STAFF + LABEL, minor, sigMin, C.purple, minName, "minor")}
        </svg>
        <div className="px-3 pb-3 flex flex-wrap gap-2">
          <SoundButton on={false} onClick={() => play("major")}>{tx(t, "figMus_rlPlayMajor", "play the major")}</SoundButton>
          <SoundButton on={false} onClick={() => play("minor")}>{tx(t, "figMus_rlPlayMinor", "play the minor")}</SoundButton>
        </div>
      </div>
    </Figure>
  );
}
