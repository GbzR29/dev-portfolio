"use client";

import { useCallback, useRef, useState, type PointerEvent } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { midiToFreq } from "@/components/lesson/kit/audio/notes";
import { pianoReady, playPiano } from "@/components/lesson/kit/audio/piano";
import { usePiano } from "@/components/lesson/kit/audio/usePiano";
import { PianoKeyboard } from "@/components/lesson/kit/audio/PianoKeyboard";
import { useVoices } from "@/components/lesson/kit/audio/useVoices";
import { CLEFS, Clef, StaffNote, dName, diatonic, ledgers, midiOf, type ClefKind } from "./staff";
import { solfa } from "./names";

// ── What this figure shows ────────────────────────────────────────────────────
// A staff to write on. Clicking a line or a space (or a white key of the
// keyboard below) writes a whole note there, plays it and names it, with the
// diatonic number d = 7·octave + letter that the chapter uses to find it.
// The clef can be treble, bass or alto, or the grand staff (treble over bass)
// whose hidden middle line, middle C, can be shown: the two staves are one
// eleven-line staff with its middle line left out.

type Mode = ClefKind | "grand";
const W = 600, STEP = 6, X_CLEF = 46, X0 = 96, X1 = 584, SLOTS = 8, PAD = 26;

const linesOf = (mode: Mode) => (mode === "grand" ? [...CLEFS.bass.lines, ...CLEFS.treble.lines] : CLEFS[mode].lines);
const clefsOf = (mode: Mode): ClefKind[] => (mode === "grand" ? ["treble", "bass"] : [mode]);

export function MusicStaffFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("treble");
  const [notes, setNotes] = useState<number[]>([28, 30, 32, 34]);   // C4 E4 G4 B4
  const [hidden, setHidden] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pressed, setPressed] = useState<ReadonlySet<number>>(new Set());
  const { load, ensure } = usePiano();
  const vis = useVisible<HTMLDivElement>();
  const voices = useVoices(vis.on);
  const svg = useRef<SVGSVGElement>(null);

  const lines = linesOf(mode), dLo = Math.min(...lines) - 6, dHi = Math.max(...lines) + 6;
  const H = (dHi - dLo) * STEP + 2 * PAD;
  const yOf = (d: number) => PAD + (dHi - d) * STEP;
  const slotX = (i: number) => X0 + 30 + i * ((X1 - X0 - 50) / (SLOTS - 1));
  const syl = solfa(t);

  const sound = useCallback((m: number) => {
    startAudio();
    const go = () => { voices.start(m, playPiano(m)); setTimeout(() => voices.release(m), 900); };
    if (pianoReady()) go(); else ensure().then(go, () => {});
  }, [ensure, voices]);
  const write = (d: number) => {
    setNotes(ns => [...ns, d].slice(-SLOTS));
    setMsg(null);
    sound(midiOf(d));
  };

  const click = (e: PointerEvent<SVGSVGElement>) => {
    const r = svg.current!.getBoundingClientRect(), y = ((e.clientY - r.top) / r.height) * H;
    const d = Math.round(dHi - (y - PAD) / STEP);
    if (d >= dLo && d <= dHi) write(d);
  };
  const keyDown = useCallback((m: number) => {
    setPressed(s => new Set(s).add(m));
    const d = diatonic(m);
    if (d === null) { sound(m); setMsg(tx(t, "figMus_stBlack", "black keys need a sharp or a flat on the staff: next chapter")); return; }
    if (d < dLo || d > dHi) { sound(m); setMsg(tx(t, "figMus_stOut", "too far from this staff: change the clef")); return; }
    write(d);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dLo, dHi, sound, t]);
  const keyUp = useCallback((m: number) => setPressed(s => { const n = new Set(s); n.delete(m); return n; }), []);

  /** "line 1 of the treble staff", "space 3", "ledger line below"… for note d. */
  const where = (d: number) => {
    if (mode === "grand" && d === 28) return tx(t, "figMus_stMiddleLedger", "the ledger line between the staves (the hidden 11th line)");
    const staff = mode === "grand" ? (d > 28 ? CLEFS.treble.lines : CLEFS.bass.lines) : lines, s = d - staff[0];
    if (s >= 0 && s <= 8) return s % 2 === 0 ? `${tx(t, "figMus_stLine", "line")} ${s / 2 + 1}` : `${tx(t, "figMus_stSpace", "space")} ${(s + 1) / 2}`;
    const n = ledgers(d, staff).length;
    return n === 0 ? (s < 0 ? tx(t, "figMus_stJustBelow", "just below the staff") : tx(t, "figMus_stJustAbove", "just above the staff"))
      : `${n} ${n === 1 ? tx(t, "figMus_stLedger", "ledger line") : tx(t, "figMus_stLedgers", "ledger lines")} ${s < 0 ? tx(t, "figMus_stBelow", "below") : tx(t, "figMus_stAbove", "above")}`;
  };

  const last = notes.length ? notes[notes.length - 1] : null;

  return (
    <Figure title={tx(t, "figMus_stTitle", "Write notes on the staff")}
      head={<Choice value={mode} onChange={v => { setMode(v); setNotes([]); setMsg(null); }} options={[
        ["treble", tx(t, "figMus_stTreble", "treble (G)")], ["bass", tx(t, "figMus_stBass", "bass (F)")],
        ["alto", tx(t, "figMus_stAlto", "alto (C)")], ["grand", tx(t, "figMus_stGrand", "grand staff")],
      ]} />}
      controls={<>
        <Row>
          <Btn onClick={() => { setNotes([]); setMsg(null); }}>{tx(t, "figMus_stClear", "clear")}</Btn>
          {mode === "grand" && <Btn active={hidden} onClick={() => setHidden(h => !h)}>{tx(t, "figMus_stHidden", "show the hidden middle line")}</Btn>}
        </Row>
        <Row>
          {msg ? <Readout color={C.muted}>{msg}</Readout> : last === null
            ? <Readout>{tx(t, "figMus_stClick", "click a line or a space, or a white key")}</Readout>
            : <>
                <Readout color={C.amber}>{dName(last)} · {syl[((last % 7) + 7) % 7]}{Math.floor(last / 7)}</Readout>
                <Readout>d = 7 × {Math.floor(last / 7)} + {((last % 7) + 7) % 7} = {last}</Readout>
                <Readout>{where(last)}</Readout>
                <Readout>{midiToFreq(midiOf(last)).toFixed(1)} Hz</Readout>
              </>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_stNote", "Click the bottom line of the treble staff: E4. One step up, the space above it, is F4, and every line and space after that is the next letter. Switch to the bass clef: the same five lines now mean G2 to A3. Then pick the grand staff and play from the bottom up: middle C sits on a short ledger line between the two staves. Show the hidden line and the two staves become one staff of eleven lines with its middle line left out.")}>
      <div ref={vis.ref}>
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none" style={{ cursor: "pointer", touchAction: "manipulation" }} onPointerDown={click}>
          {lines.map(d => <line key={d} x1={X_CLEF - 22} x2={X1} y1={yOf(d)} y2={yOf(d)} stroke={C.fg} strokeOpacity={0.75} strokeWidth={1.2} />)}
          {mode === "grand" && <>
            <line x1={X_CLEF - 22} x2={X_CLEF - 22} y1={yOf(38)} y2={yOf(18)} stroke={C.fg} strokeOpacity={0.75} strokeWidth={1.5} />
            {hidden && <>
              <line x1={X_CLEF - 22} x2={X1} y1={yOf(28)} y2={yOf(28)} stroke={C.amber} strokeWidth={1.2} strokeDasharray="5 4" />
              <T x={X1} y={yOf(28) - 4} anchor="end" size={9} color={C.amber}>C4 · {tx(t, "figMus_stMiddleC", "middle C")}</T>
            </>}
          </>}
          {clefsOf(mode).map(k => <Clef key={k} kind={k} x={X_CLEF} y={yOf(CLEFS[k].anchor)} s={2 * STEP} color={C.fg} />)}
          {notes.map((d, i) => {
            const x = slotX(i), on = i === notes.length - 1;
            return (
              <g key={i} pointerEvents="none">
                <StaffNote x={x} y={yOf(d)} s={2 * STEP} color={on ? C.amber : C.fg} ledgerYs={ledgers(d, lines).map(yOf)} />
                <T x={x} y={H - 6} anchor="middle" size={10} bold={on} color={on ? C.amber : C.muted}>{dName(d)}</T>
              </g>
            );
          })}
        </svg>
        <div className="px-3 pb-3">
          <PianoKeyboard lo={36} hi={84} pressed={pressed} onDown={keyDown} onUp={keyUp} labels="c"
            ariaLabel={tx(t, "figMus_stAria", "piano keyboard that writes on the staff")} />
          {load === "loading" && <span className="text-[11px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_loading", "loading the piano (1.3 MB)…")}</span>}
        </div>
      </div>
    </Figure>
  );
}
