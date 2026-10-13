"use client";

import { useCallback, useRef, useState, type PointerEvent } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { notesReady, playNote } from "@/components/lesson/kit/audio/instrument";
import { loadStatus, SampleCredit, useNotes } from "@/components/lesson/kit/audio/useInstrument";
import { NoteSurface } from "@/components/lesson/kit/audio/NoteSurface";
import { homePos, STANDARD_TUNING, type FretPos } from "@/components/lesson/kit/audio/Fretboard";
import { useSequence } from "@/components/lesson/kit/audio/useSequence";
import { useVoices } from "@/components/lesson/kit/audio/useVoices";
import { CLEFS, Clef, StaffNote, dName, diatonic, ledgers, midiOf } from "./staff";
import { AccidentalGlyph, accOffset, spellings, type Spelled } from "./accidentals";

// ── What this figure shows ────────────────────────────────────────────────────
// Guitar music the way method books print it: a treble staff with a small 8
// under the clef (the guitar sounds an octave lower than written) and, under
// it, the tablature, six lines for the six strings with the fret to press on
// each. Every note is in both, lined up. Pressing a place on the neck writes
// it in both (the tab keeps the exact string and fret); clicking the staff
// writes a note and lets the tab pick the usual place, the lowest fret.
// "Ode to Joy" fills both with its first phrase in first position and plays it.
//
// Written d = sounding d + 7: an octave is 7 letters, so the open high E,
// sounding E4 (d = 30), is written E5 (d = 37), the staff's top space.

type Ev = { m: number; p: FretPos };                        // sounding note and where it is played

const W = 600, STEP = 6, X_CLEF = 46, X0 = 92, X1 = 588, SLOTS = 15, PAD = 22;
const TAB_GAP = 11;                                        // between tab lines
const { lines, anchor } = CLEFS.treble;
const dLo = lines[0] - 6, dHi = lines[4] + 4;              // room for three ledger lines below
const STAFF_H = (dHi - dLo) * STEP + PAD;
const TAB_TOP = STAFF_H + 18, H = TAB_TOP + 5 * TAB_GAP + 34;
const yOf = (d: number) => PAD + (dHi - d) * STEP;
const tabY = (s: number) => TAB_TOP + (5 - s) * TAB_GAP;   // string 0 (low E) on the bottom line
const slotX = (i: number) => X0 + 18 + i * ((X1 - X0 - 30) / (SLOTS - 1));

/** "Ode to Joy", first phrase, in first position: E E F G G F E D C C D E E D D (sounding E4…C4). */
const ODE: Ev[] = ([[5, 0], [5, 0], [5, 1], [5, 3], [5, 3], [5, 1], [5, 0], [4, 3], [4, 1], [4, 1], [4, 3], [5, 0], [5, 0], [4, 3], [4, 3]] as const)
  .map(([s, f]) => ({ m: STANDARD_TUNING[s] + f, p: { s, f } }));

/** How a sounding note is written: an octave up, black notes with a sharp. */
function written(m: number): Spelled {
  const d = diatonic(m);
  const sp = d !== null ? { d, a: 0 as const } : spellings(m, 1).find(s => s.a === 1)!;
  return { d: sp.d + 7, a: sp.a };
}

export function MusicTabFigure({ t }: { t?: TrackTranslations }) {
  const [notes, setNotes] = useState<Ev[]>(ODE.slice(0, 7));
  const [pressed, setPressed] = useState<ReadonlySet<number>>(new Set());
  const { inst, load, ensure } = useNotes();
  const vis = useVisible<HTMLDivElement>();
  const voices = useVoices(vis.on);
  const seq = useSequence(vis.on);
  const svg = useRef<SVGSVGElement>(null);

  const sound = useCallback((m: number) => {
    startAudio();
    const go = () => { voices.start(m, playNote(m)); setTimeout(() => voices.release(m), 900); };
    if (notesReady()) go(); else ensure().then(go, () => {});
  }, [ensure, voices]);
  const write = useCallback((e: Ev) => {
    seq.stop();
    setNotes(ns => [...ns, e].slice(-SLOTS));
    sound(e.m);
  }, [seq, sound]);

  // The staff only says which note: the tab then takes its usual place
  const click = (e: PointerEvent<SVGSVGElement>) => {
    const r = svg.current!.getBoundingClientRect(), y = ((e.clientY - r.top) / r.height) * H;
    if (y > STAFF_H + 6) return;
    const d = Math.round(dHi - (y - PAD) / STEP), m = midiOf(d - 7), p = homePos(m);
    if (p) write({ m, p });
  };
  const down = useCallback((m: number, p?: FretPos) => {
    setPressed(s => new Set(s).add(m));
    const at = p ?? homePos(m);
    if (at) write({ m, p: at }); else sound(m);
  }, [write, sound]);
  const up = useCallback((m: number) => setPressed(s => { const n = new Set(s); n.delete(m); return n; }), []);

  const play = () => {
    startAudio();
    if (seq.playing) { seq.stop(); return; }
    setNotes(ODE);
    const go = () => seq.play(ODE.length, i => playNote(ODE[i].m, { velocity: 0.7 }), { gap: 0.42, hold: 0.5 });
    if (notesReady()) go(); else ensure().then(go, () => {});
  };

  const focus = seq.step !== null ? notes[seq.step] : notes[notes.length - 1] ?? null;
  const wr = focus ? written(focus.m) : null;
  const status = load === "loading" ? loadStatus(t, inst, load) : null;

  return (
    <Figure title={tx(t, "figMus_tbTitle", "Staff and tablature")}
      head={<SoundButton on={seq.playing} onClick={play}>
        {seq.playing ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_tbOde", "play \"Ode to Joy\"")}
      </SoundButton>}
      controls={<>
        <Row>
          <Btn onClick={() => { seq.stop(); setNotes([]); }}>{tx(t, "figMus_stClear", "clear")}</Btn>
          {!focus ? <Readout>{tx(t, "figMus_tbClick", "press a place on the neck, or click the staff")}</Readout> : <>
            <Readout color={C.amber}>{tx(t, "figMus_tbWritten", "written")} {dName(wr!.d)}{wr!.a ? "♯" : ""} · {tx(t, "figMus_tbSounds", "sounds")} {dName(wr!.d - 7)}{wr!.a ? "♯" : ""}</Readout>
            <Readout>{tx(t, "figMus_tbString", "string")} {6 - focus.p.s} · {focus.p.f === 0 ? tx(t, "figMus_tbOpen", "open (0)") : `${tx(t, "figMus_tbFret", "fret")} ${focus.p.f}`}</Readout>
            <Readout>d = {wr!.d - 7} + 7 = {wr!.d}</Readout>
          </>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={<>
        {tx(t, "figMus_tbNote", "Play the melody and follow both lines at once. The staff tells you which note and (with stems) how long; the tab tells you where: the line is the string, the number the fret. Now press the same note in another place, say fret 5 of the B string instead of the open high E: the staff does not change, the tab does. Click the staff itself and the tab picks the lowest fret, the place a beginner would use. The little 8 under the clef is a reminder that everything sounds an octave lower than written.")}
        {" "}<SampleCredit t={t} />
      </>}>
      <div ref={vis.ref}>
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none" style={{ cursor: "pointer", touchAction: "manipulation" }} onPointerDown={click}>
          {/* The staff, with the octave-down treble clef */}
          {lines.map(d => <line key={d} x1={X_CLEF - 22} x2={X1} y1={yOf(d)} y2={yOf(d)} stroke={C.fg} strokeOpacity={0.75} strokeWidth={1.2} />)}
          <Clef kind="treble" x={X_CLEF} y={yOf(anchor)} s={2 * STEP} color={C.fg} />
          <T x={X_CLEF - 3} y={yOf(lines[0]) + 36} anchor="middle" size={10} bold color={C.fg}>8</T>

          {/* The tab: six lines, high E on top, "TAB" down the left */}
          {[0, 1, 2, 3, 4, 5].map(s => <line key={s} x1={X_CLEF - 22} x2={X1} y1={tabY(s)} y2={tabY(s)} stroke={C.fg} strokeOpacity={0.55} strokeWidth={1} />)}
          {["T", "A", "B"].map((c, i) => <T key={c} x={X_CLEF - 6} y={TAB_TOP + 14 + i * 16} anchor="middle" size={13} bold color={C.fg}>{c}</T>)}
          <line x1={X_CLEF - 22} x2={X_CLEF - 22} y1={yOf(lines[4])} y2={tabY(0)} stroke={C.fg} strokeOpacity={0.6} strokeWidth={1.2} />

          {notes.map((e, i) => {
            const x = slotX(i), on = seq.step !== null ? i === seq.step : i === notes.length - 1, color = on ? C.amber : C.fg;
            const w = written(e.m);
            return (
              <g key={i} pointerEvents="none">
                {w.a !== 0 && <AccidentalGlyph a={w.a} x={x - accOffset(w.a) * 2 * STEP} y={yOf(w.d)} s={2 * STEP} color={color} />}
                <StaffNote x={x} y={yOf(w.d)} s={2 * STEP} color={color} ledgerYs={ledgers(w.d, lines).map(yOf)} filled />
                <line x1={x} x2={x} y1={yOf(w.d) + 6} y2={tabY(5) - 8} stroke={color} strokeOpacity={on ? 0.35 : 0.1} strokeDasharray="2 3" />
                <rect x={x - 7} y={tabY(e.p.s) - 7} width={14} height={14} fill="var(--code-bg)" />
                <T x={x} y={tabY(e.p.s) + 4} anchor="middle" size={12} bold color={color}>{e.p.f}</T>
              </g>
            );
          })}
          <T x={X1} y={H - 8} anchor="end" size={9} color={C.muted}>{tx(t, "figMus_tbLegend", "staff: which note · tab: which string and fret")}</T>
        </svg>
        <div className="px-3 pb-3">
          <NoteSurface t={t} lo={40} hi={76} pressed={new Set([...pressed, ...(seq.step !== null ? [ODE[seq.step].m] : [])])}
            onDown={down} onUp={up} labels="c"
            ariaLabel={tx(t, "figMus_tbKeysAria", "keyboard that writes on the staff and the tab")}
            guitarAriaLabel={tx(t, "figMus_tbAria", "guitar neck that writes on the staff and the tab")} />
          {status && <span className="text-[11px] font-mono text-[var(--text-muted)]">{status}</span>}
        </div>
      </div>
    </Figure>
  );
}
