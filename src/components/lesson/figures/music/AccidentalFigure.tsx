"use client";

import { useCallback, useRef, useState, type PointerEvent } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { isBlack, midiToFreq } from "@/components/lesson/kit/audio/notes";
import { notesReady, playNote } from "@/components/lesson/kit/audio/instrument";
import { InstrumentChoice, loadStatus, useNotes } from "@/components/lesson/kit/audio/useInstrument";
import { BW, keyLayout, WW } from "@/components/lesson/kit/audio/PianoKeyboard";
import { NoteSurface } from "@/components/lesson/kit/audio/NoteSurface";
import { useSequence } from "@/components/lesson/kit/audio/useSequence";
import { useVoices } from "@/components/lesson/kit/audio/useVoices";
import { CLEFS, Clef, StaffNote, diatonic, ledgers, midiOf } from "./staff";
import { AccidentalGlyph, accOffset, keyOf, letterOf, octaveOf, spelledName, spelledSolfa, spellings, type Acc, type Spelled } from "./accidentals";
import { WHITE_PCS } from "./names";

// ── What this figure shows ────────────────────────────────────────────────────
// A treble staff to write on, with a sign picked first: none, sharp, flat,
// natural, or the double signs. Clicking a line or a space writes the note
// with that sign and plays it; the keyboard below lights the white key of the
// letter (blue) and the key the sign moves it to (amber), with an arrow and
// the number of half steps between them. Pressing a black key writes it with a
// sharp (or with a flat while a flat sign is picked). Two buttons write and
// play the chromatic scale: up with sharps, down with flats.
//
// On the guitar the same two colours land on the neck, where a sharp is one
// fret towards the body and a flat one fret towards the nut; the arrow over
// the keyboard is left out (the mini keyboard is a different width).

type Sign = "none" | "s" | "f" | "n" | "ss" | "ff";
const ACC: Record<Sign, Acc> = { none: 0, n: 0, s: 1, f: -1, ss: 2, ff: -2 };
type Note = Spelled & { shown: boolean };                   // shown: the sign is drawn (a natural for a = 0)

const W = 600, STEP = 6, X_CLEF = 46, X0 = 96, X1 = 584, SLOTS = 13, PAD = 26, LO = 48, HI = 91;
const { lines, anchor } = CLEFS.treble;
const dLo = lines[0] - 6, dHi = lines[4] + 6, H = (dHi - dLo) * STEP + 2 * PAD;
const yOf = (d: number) => PAD + (dHi - d) * STEP;
const slotX = (i: number) => X0 + 34 + i * ((X1 - X0 - 50) / (SLOTS - 1));

/** C4 to C5 by half steps, with sharps going up and flats coming down. */
const chromatic = (up: boolean): Note[] => {
  const keys = Array.from({ length: 13 }, (_, i) => (up ? 60 + i : 72 - i));
  return keys.map(m => {
    const sp = isBlack(m) ? spellings(m, 1).find(s => s.a === (up ? 1 : -1))! : { d: diatonic(m)!, a: 0 as Acc };
    return { ...sp, shown: sp.a !== 0 };
  });
};

/** The arrow over the keyboard from the letter's white key to the key that sounds. */
function MoveArrow({ from, to }: { from: number; to: number }) {
  const { xOf, blacks, W: KW } = keyLayout(LO, HI);
  const bx = new Map(blacks);
  const cx = (m: number) => (bx.has(m) ? bx.get(m)! + BW / 2 : xOf.get(m)! + WW / 2);
  if (!xOf.has(from) || (!xOf.has(to) && !bx.has(to))) return <svg viewBox={`-1 0 ${KW + 2} 26`} className="w-full h-auto block" />;
  const x0 = cx(from), x1 = cx(to), n = to - from, dir = Math.sign(n);
  return (
    <svg viewBox={`-1 0 ${KW + 2} 26`} className="w-full h-auto block" aria-hidden>
      {n !== 0 && <>
        <path d={`M${x0},22 C${x0},8 ${x1},8 ${x1},20`} fill="none" stroke={C.amber} strokeWidth={1.6} />
        <path d={`M${x1 - 3.5},15 L${x1},21 L${x1 + 3.5},15`} fill="none" stroke={C.amber} strokeWidth={1.6} />
        <text x={(x0 + x1) / 2} y={9} textAnchor="middle" fontSize={9} fontWeight={700} fill={C.amber} fontFamily="monospace">
          {dir > 0 ? "+" : "−"}{Math.abs(n)}
        </text>
      </>}
    </svg>
  );
}

export function MusicAccidentalFigure({ t }: { t?: TrackTranslations }) {
  const [sign, setSign] = useState<Sign>("s");
  const [notes, setNotes] = useState<Note[]>([{ d: 31, a: 0, shown: false }, { d: 31, a: 1, shown: true }, { d: 34, a: -1, shown: true }, { d: 34, a: 0, shown: true }]);
  const [pressed, setPressed] = useState<ReadonlySet<number>>(new Set());
  const { inst, load, ensure } = useNotes();
  const vis = useVisible<HTMLDivElement>();
  const voices = useVoices(vis.on);
  const seq = useSequence(vis.on);
  const svg = useRef<SVGSVGElement>(null);
  const guitar = inst === "guitar";

  const sound = useCallback((m: number) => {
    startAudio();
    const go = () => { voices.start(m, playNote(m)); setTimeout(() => voices.release(m), 900); };
    if (notesReady()) go(); else ensure().then(go, () => {});
  }, [ensure, voices]);
  const write = (n: Note) => {
    seq.stop();
    setNotes(ns => [...ns, n].slice(-SLOTS));
    sound(keyOf(n));
  };

  const click = (e: PointerEvent<SVGSVGElement>) => {
    const r = svg.current!.getBoundingClientRect(), y = ((e.clientY - r.top) / r.height) * H;
    const d = Math.round(dHi - (y - PAD) / STEP);
    if (d >= dLo && d <= dHi) write({ d, a: ACC[sign], shown: sign !== "none" });
  };
  const keyDown = useCallback((m: number) => {
    setPressed(s => new Set(s).add(m));
    const d = diatonic(m);
    if (d !== null) { write({ d, a: 0, shown: false }); return; }
    const sp = spellings(m, 1).find(s => s.a === (sign === "f" || sign === "ff" ? -1 : 1))!;
    write({ ...sp, shown: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sign, sound]);
  const keyUp = useCallback((m: number) => setPressed(s => { const n = new Set(s); n.delete(m); return n; }), []);

  const runChromatic = (up: boolean) => {
    startAudio();
    const run = chromatic(up);
    setNotes(run);
    const go = () => seq.play(run.length, i => playNote(keyOf(run[i])), { gap: 0.32, hold: 0.5 });
    if (notesReady()) go(); else ensure().then(go, () => {});
  };

  const focus = seq.step !== null ? notes[seq.step] : notes[notes.length - 1] ?? null;
  const base = focus ? midiOf(focus.d) : null, sounding = focus ? keyOf(focus) : null;
  const keyColor = (m: number) => (m === sounding ? C.amber : m === base ? C.sky : null);
  const P = focus ? WHITE_PCS[letterOf(focus.d)] : 0;
  const others = focus ? spellings(keyOf(focus)).filter(s => s.d !== focus.d) : [];

  return (
    <Figure title={tx(t, "figMus_acTitle", "Sharp, flat, natural")}
      head={<Row>
        <InstrumentChoice t={t} onChange={() => voices.releaseAll()} />
        <Btn onClick={() => runChromatic(true)}>{tx(t, "figMus_acUp", "chromatic up (sharps)")}</Btn>
        <Btn onClick={() => runChromatic(false)}>{tx(t, "figMus_acDown", "down (flats)")}</Btn>
      </Row>}
      controls={<>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_acSign", "sign to write")}</span>
          <Choice value={sign} onChange={setSign} options={[
            ["none", tx(t, "figMus_acNone", "none")], ["s", "♯"], ["f", "♭"], ["n", "♮"], ["ss", "♯♯"], ["ff", "♭♭"],
          ]} />
          <Btn onClick={() => { seq.stop(); setNotes([]); }}>{tx(t, "figMus_stClear", "clear")}</Btn>
        </Row>
        <Row>
          {!focus ? <Readout>{tx(t, "figMus_acClick", "pick a sign, then click a line or a space")}</Readout> : <>
            <Readout color={C.amber}>{spelledName(focus)} · {spelledSolfa(t, focus)}</Readout>
            <Readout>m = 12 × {octaveOf(focus.d) + 1} + {P} {focus.a < 0 ? "−" : "+"} {Math.abs(focus.a)} = {sounding}</Readout>
            <Readout>{midiToFreq(sounding!).toFixed(1)} Hz</Readout>
            {guitar && focus.a !== 0 && (
              <Readout color={C.amber}>{Math.abs(focus.a)} {Math.abs(focus.a) === 1 ? tx(t, "figMus_acFret", "fret") : tx(t, "figMus_acFrets", "frets")} {focus.a > 0
                ? tx(t, "figMus_acToBody", "towards the body")
                : tx(t, "figMus_acToNut", "towards the nut")}</Readout>
            )}
            {others.length > 0 && <Readout color={C.muted}>{tx(t, "figMus_acSame", "same key as")} {others.map(s => spelledName(s)).join(", ")}</Readout>}
          </>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={guitar ? tx(t, "figMus_acNoteGuitar", "Write F, then F with a sharp: the same line on the staff, one fret higher on the neck (towards the body). Pick the flat and write B: one fret towards the nut. On a string there is nothing special about the \"black\" notes: every fret is one half step, so a sharp is always the next fret and a flat the one before. Try a sharp on E or B: one fret up from E is F, so E♯ is played exactly where F is. The blue dots are the letter, the amber ones the note the sign asks for, everywhere on the neck. Play the two chromatic scales: up the frets with sharps, down with flats.") : tx(t, "figMus_acNote","Write F, then F with a sharp: the same line, but the key moves one half step up, to the black key. Pick the flat and write B: one half step down. Now try a sharp on E or B: there is no black key above them, so E♯ lands on a white key, F. The blue key is always the letter, the amber one the key the sign asks for. Play the two chromatic scales: going up, the black keys are written as sharps; coming down, the same keys are written as flats.")}>
      <div ref={vis.ref}>
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none" style={{ cursor: "pointer", touchAction: "manipulation" }} onPointerDown={click}>
          {lines.map(d => <line key={d} x1={X_CLEF - 22} x2={X1} y1={yOf(d)} y2={yOf(d)} stroke={C.fg} strokeOpacity={0.75} strokeWidth={1.2} />)}
          <Clef kind="treble" x={X_CLEF} y={yOf(anchor)} s={2 * STEP} color={C.fg} />
          {notes.map((n, i) => {
            const x = slotX(i), on = seq.step !== null ? i === seq.step : i === notes.length - 1, color = on ? C.amber : C.fg;
            return (
              <g key={i} pointerEvents="none">
                {n.shown && <AccidentalGlyph a={n.a} x={x - accOffset(n.a) * 2 * STEP} y={yOf(n.d)} s={2 * STEP} color={color} />}
                <StaffNote x={x} y={yOf(n.d)} s={2 * STEP} color={color} ledgerYs={ledgers(n.d, lines).map(yOf)} />
                <T x={x} y={H - 6} anchor="middle" size={9.5} bold={on} color={on ? C.amber : C.muted}>{spelledName(n, false)}</T>
              </g>
            );
          })}
        </svg>
        <div className="px-3 pb-3">
          {!guitar && (base !== null && sounding !== null ? <MoveArrow from={base} to={sounding} /> : <MoveArrow from={0} to={0} />)}
          <NoteSurface t={t} lo={LO} hi={HI} pressed={pressed} onDown={keyDown} onUp={keyUp} labels="c" keyColor={keyColor}
            ariaLabel={tx(t, "figMus_acAria", "piano keyboard that writes sharps and flats on the staff")}
            guitarAriaLabel={tx(t, "figMus_acNeckAria", "guitar neck that writes sharps and flats on the staff")} />
          {load === "loading" && <span className="text-[11px] font-mono text-[var(--text-muted)]">{loadStatus(t, inst, load)}</span>}
        </div>
      </div>
    </Figure>
  );
}
