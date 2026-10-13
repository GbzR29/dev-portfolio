"use client";

import { useCallback, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, Readout, Row, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { isBlack, midiToFreq, noteName, octave, pitchClass } from "@/components/lesson/kit/audio/notes";
import { pianoReady, playPiano } from "@/components/lesson/kit/audio/piano";
import { usePiano } from "@/components/lesson/kit/audio/usePiano";
import { BW, keyLayout, PianoKeyboard } from "@/components/lesson/kit/audio/PianoKeyboard";
import { useVoices } from "@/components/lesson/kit/audio/useVoices";
import { bothNames, keyLabel, letterIndex, solfa, type NameStyle } from "./names";

// ── What this figure shows ────────────────────────────────────────────────────
// A piano with its keys named four ways: letters, solfège, letters with the
// octave number, MIDI numbers. Brackets over the keys mark the groups of two
// and three black keys (the landmarks for finding C and F), or, on the full
// 88-key piano, the octaves numbered 0 to 8 with middle C marked. Pressing a
// key plays it and lists all its names at once.

type Range = "three" | "all";
const RANGES: Record<Range, [number, number]> = { three: [48, 83], all: [21, 108] };   // C3–B5, A0–C8

/** Brackets over the black-key groups (three octaves) or over each octave (whole piano). */
function Overlay({ lo, hi, range, t }: { lo: number; hi: number; range: Range; t?: TrackTranslations }) {
  const { xOf, blacks, W } = keyLayout(lo, hi);
  const bx = new Map(blacks);
  const bracket = (x0: number, x1: number, label: string, color: string, y: number, size: number, key: string) => (
    <g key={key}>
      <path d={`M${x0},${y + 8} v-6 H${x1} v6`} fill="none" stroke={color} strokeWidth={range === "all" ? 2.4 : 1.4} />
      <text x={(x0 + x1) / 2} y={y - 3} textAnchor="middle" fontSize={size} fontWeight={700} fill={color} fontFamily="monospace">{label}</text>
    </g>
  );
  const cs = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter(m => pitchClass(m) === 0);
  if (range === "three") {
    return (
      <svg viewBox={`-1 0 ${W + 2} 30`} className="w-full h-auto block">
        {cs.flatMap(c => [
          bx.has(c + 1) && bx.has(c + 3) ? bracket(bx.get(c + 1)!, bx.get(c + 3)! + BW, "2", C.sky, 18, 10, `${c}a`) : null,
          bx.has(c + 6) && bx.has(c + 10) ? bracket(bx.get(c + 6)!, bx.get(c + 10)! + BW, "3", C.purple, 18, 10, `${c}b`) : null,
        ])}
      </svg>
    );
  }
  // whole piano: octave k runs from Ck to Bk; octave 0 is only A0 and B0
  const starts = [lo, ...cs];
  return (
    <svg viewBox={`-1 0 ${W + 2} 64`} className="w-full h-auto block">
      {starts.map((s, i) => {
        const end = (i + 1 < starts.length ? starts[i + 1] : hi + 1);
        const lastWhite = [...Array(end - s).keys()].map(k => s + k).filter(m => !isBlack(m)).pop()!;
        return bracket(xOf.get(s)! + 2, xOf.get(lastWhite)! + 22, String(octave(s)), i % 2 ? C.sky : C.purple, 38, 24, String(s));
      })}
      <text x={xOf.get(60)! + 12} y={14} textAnchor="middle" fontSize={16} fill={C.amber} fontFamily="monospace">{tx(t, "figMus_knMiddle", "middle C")} ↓</text>
    </svg>
  );
}

export function MusicKeyNamesFigure({ t }: { t?: TrackTranslations }) {
  const [style, setStyle] = useState<NameStyle>("letter");
  const [range, setRange] = useState<Range>("three");
  const [pressed, setPressed] = useState<ReadonlySet<number>>(new Set());
  const [last, setLast] = useState<number | null>(null);
  const { load, ensure } = usePiano();
  const vis = useVisible<HTMLDivElement>();
  const voices = useVoices(vis.on);
  const held = useRef(new Set<number>());
  const [lo, hi] = RANGES[range];

  const down = useCallback((m: number) => {
    startAudio();
    held.current.add(m);
    setPressed(s => new Set(s).add(m));
    setLast(m);
    if (pianoReady()) voices.start(m, playPiano(m));
    else ensure().then(() => { if (held.current.has(m)) voices.start(m, playPiano(m)); }, () => {});
  }, [ensure, voices]);
  const up = useCallback((m: number) => {
    held.current.delete(m);
    setPressed(s => { const n = new Set(s); n.delete(m); return n; });
    voices.release(m);
  }, [voices]);

  const labelOf = (m: number) => (range === "all" ? null : keyLabel(m, style, t));
  const syl = solfa(t);

  return (
    <Figure title={tx(t, "figMus_knTitle", "The names on the keys")}
      head={<Choice value={range} onChange={v => { voices.releaseAll(); setRange(v); }}
        options={[["three", tx(t, "figMus_knThree", "3 octaves")], ["all", tx(t, "figMus_knAll", "all 88 keys")]]} />}
      controls={<>
        {range === "three" && (
          <Row>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_knLabels", "label the keys with")}</span>
            <Choice value={style} onChange={setStyle} options={[
              ["letter", tx(t, "figMus_knLetter", "letters")],
              ["solfa", tx(t, "figMus_knSolfa", "do re mi")],
              ["octave", tx(t, "figMus_knOctave", "letter + octave")],
              ["midi", tx(t, "figMus_knMidi", "MIDI number")],
            ]} />
          </Row>
        )}
        <Row>
          {last === null
            ? <Readout>{tx(t, "figMus_pressKey", "press a key")}</Readout>
            : <>
                <Readout color={C.amber}>{noteName(last)}{last === 60 ? ` · ${tx(t, "figMus_knMiddle", "middle C")}` : ""}</Readout>
                <Readout>{isBlack(last) ? `${bothNames(last)} · ${tx(t, "figMus_knBlack", "black key: named after its neighbours")}` : `${syl[letterIndex(last)]} · ${tx(t, "figMus_knOct", "octave")} ${octave(last)}`}</Readout>
                <Readout>MIDI {last} · {midiToFreq(last).toFixed(2)} Hz</Readout>
                <Readout>{tx(t, "figMus_knKey", "key")} {last - 20} {tx(t, "figMus_knOf88", "of 88")}</Readout>
              </>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_knNote", "Find the groups of two and three black keys first: every C sits just left of a group of two, every F just left of a group of three. From those two landmarks you can name any white key. Switch the labels between letters and do re mi: they are the same seven names. Then open the whole piano: 88 keys, octaves numbered from the bottom, a new number at every C, middle C right in the middle.")}>
      <div ref={vis.ref} className="px-3 pt-2 pb-3">
        <Overlay lo={lo} hi={hi} range={range} t={t} />
        <PianoKeyboard lo={lo} hi={hi} pressed={pressed} onDown={down} onUp={up} labelOf={labelOf}
          ariaLabel={tx(t, "figMus_knAria", "piano keyboard with note names")} />
        {load === "loading" && <span className="text-[11px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_loading", "loading the piano (1.3 MB)…")}</span>}
      </div>
    </Figure>
  );
}
