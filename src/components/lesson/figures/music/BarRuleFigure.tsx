"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { notesReady, playNote } from "@/components/lesson/kit/audio/instrument";
import { loadStatus, useNotes } from "@/components/lesson/kit/audio/useInstrument";
import { useSequence } from "@/components/lesson/kit/audio/useSequence";
import { CLEFS, Clef, ledgers } from "./staff";
import { NoteGlyph, RestGlyph } from "./notation";
import { AccidentalGlyph, accOffset, keyOf, spelledName, type Acc } from "./accidentals";

// ── What this figure shows ────────────────────────────────────────────────────
// The opening of Beethoven's "Für Elise" (right hand), which needs both rules
// of accidentals. A sign lasts to the end of its bar: the D♯ of the pickup
// bar must be written again after the bar line, and in bar 1 the plain D after
// a D♯ needs a natural sign. Two buttons erase one sign each; every note shows
// the name the rules give it (blue: sign written here, purple: carried from
// earlier in the bar, red: not what Beethoven meant) and the tune plays as
// read, so a reading mistake can be heard.

type Ev = { bar: number; d?: number; sign?: Acc; value: 8 | 16; rest?: boolean; erase?: "sharp" | "natural" };
const MELODY: Ev[] = [
  { bar: 0, d: 37, value: 16 }, { bar: 0, d: 36, sign: 1, value: 16 },
  { bar: 1, d: 37, value: 16 }, { bar: 1, d: 36, sign: 1, value: 16, erase: "sharp" }, { bar: 1, d: 37, value: 16 },
  { bar: 1, d: 34, value: 16 }, { bar: 1, d: 36, sign: 0, value: 16, erase: "natural" }, { bar: 1, d: 35, value: 16 },
  { bar: 2, d: 33, value: 8 }, { bar: 2, value: 16, rest: true }, { bar: 2, d: 28, value: 16 }, { bar: 2, d: 30, value: 16 }, { bar: 2, d: 33, value: 16 },
];
const BEAMS = [[0, 1], [2, 3, 4, 5, 6, 7], [10, 11, 12]];   // groups of sixteenths joined by two beams
const RIGHT: Acc[] = [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0];   // what Beethoven meant

type Tag = "written" | "carried" | "plain";

/** Read the melody with the rules: a sign holds for its line or space until the bar line. */
function readAll(erased: Set<string>) {
  let bar = -1, held = new Map<number, Acc>();
  return MELODY.map(e => {
    if (e.bar !== bar) { bar = e.bar; held = new Map(); }
    if (e.rest || e.d === undefined) return null;
    const shown = e.sign !== undefined && !(e.erase && erased.has(e.erase));
    if (shown) { held.set(e.d, e.sign!); return { a: e.sign!, tag: "written" as Tag, shown }; }
    const a = held.get(e.d);
    return a !== undefined ? { a, tag: (a !== 0 ? "carried" : "plain") as Tag, shown } : { a: 0 as Acc, tag: "plain" as Tag, shown };
  });
}

const W = 600, STEP = 5, PAD = 30, X_CLEF = 34;
const { lines, anchor } = CLEFS.treble;
const dLo = 26, dHi = 42, H = (dHi - dLo) * STEP + 2 * PAD + 14;
const yOf = (d: number) => PAD + (dHi - d) * STEP;
const STEM = 28;

/** x of every event and of the bar lines: sixteenths 30 wide, eighths 42, room for a sign, a gap at each bar line. */
function layout(shown: boolean[]) {
  let x = 92;
  const xs: number[] = [], bars: number[] = [];
  MELODY.forEach((e, i) => {
    if (i > 0 && e.bar !== MELODY[i - 1].bar) { bars.push(x - 6); x += 18; }
    if (shown[i]) x += 12;
    xs.push(x);
    x += e.value === 8 ? 42 : 30;
  });
  bars.push(x - 6);
  return { xs, bars };
}

export function MusicBarRuleFigure({ t }: { t?: TrackTranslations }) {
  const [erased, setErased] = useState<Set<string>>(new Set());
  const { inst, load, ensure } = useNotes();
  const vis = useVisible<HTMLDivElement>();
  const seq = useSequence(vis.on);

  const read = readAll(erased);
  const { xs, bars } = layout(read.map(r => !!r?.shown));
  const wrong = read.some((r, i) => r && r.a !== RIGHT[i]);
  const toggle = (k: string) => { seq.stop(); setErased(s => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; }); };

  // one step per sixteenth; the eighth note takes two
  const slots = MELODY.flatMap((e, i) => (e.value === 8 ? [i, -1] : [i]));
  const play = () => {
    startAudio();
    const go = () => seq.play(slots.length, s => {
      const i = slots[s], r = i >= 0 ? read[i] : null;
      return r ? playNote(keyOf({ d: MELODY[i].d!, a: r.a })) : null;
    }, { gap: 0.17, hold: 0.32 });
    if (notesReady()) go(); else ensure().then(go, () => {});
  };
  const now = seq.step !== null ? slots[seq.step] : -1;

  const colorOf = (i: number) => {
    const r = read[i];
    if (!r) return C.fg;
    if (r.a !== RIGHT[i]) return C.red;
    return i === now ? C.amber : r.tag === "written" ? C.sky : r.tag === "carried" ? C.purple : C.fg;
  };

  const beam = (g: number[]) => {
    const ds = g.map(i => MELODY[i].d!), ys = ds.map(yOf);
    // stems down when the notes reach further above the middle line (B4, d = 34) than below it
    const down = Math.max(...ds) - 34 >= 34 - Math.min(...ds);
    const end = down ? Math.max(...ys) + STEM : Math.min(...ys) - STEM, sx = (i: number) => xs[i] + (down ? -4.7 : 4.7);
    return (
      <g key={g[0]}>
        {g.map(i => <line key={i} x1={sx(i)} x2={sx(i)} y1={yOf(MELODY[i].d!)} y2={end} stroke={colorOf(i)} strokeWidth={1.4} />)}
        {[0, 1].map(k => {
          const y = end + (down ? -k * 5 : k * 5) - (down ? 2 : 0);
          return <rect key={k} x={sx(g[0]) - 0.7} y={y} width={sx(g[g.length - 1]) - sx(g[0]) + 1.4} height={3} fill={C.fg} />;
        })}
      </g>
    );
  };

  return (
    <Figure title={tx(t, "figMus_brTitle", "How long a sign lasts: Für Elise")}
      head={<SoundButton on={seq.playing} onClick={() => (seq.playing ? seq.stop() : play())}>
        {seq.playing ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_brPlay", "play as read")}
      </SoundButton>}
      controls={<>
        <Row>
          <Btn active={erased.has("sharp")} onClick={() => toggle("sharp")}>{tx(t, "figMus_brEraseSharp", "erase the sharp in bar 1")}</Btn>
          <Btn active={erased.has("natural")} onClick={() => toggle("natural")}>{tx(t, "figMus_brEraseNatural", "erase the natural")}</Btn>
        </Row>
        <Row>
          <Readout color={C.sky}>{tx(t, "figMus_brWritten", "blue: sign written on this note")}</Readout>
          <Readout color={C.purple}>{tx(t, "figMus_brCarried", "purple: sign carried from earlier in the bar")}</Readout>
          {wrong && <Readout color={C.red}>{tx(t, "figMus_brWrong", "red: not the note Beethoven wrote; listen")}</Readout>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_brNote", "Play it as written first. Then erase the sharp in bar 1: the pickup bar's D♯ does not reach past the bar line, so that D is now a plain D and the famous wobble goes flat. Put it back and erase the natural instead: the D♯ earlier in the same bar still holds, so the D reads as D♯. Both signs that look redundant are there because of one rule: a sign lasts for its line or space until the next bar line, and no further.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none" style={{ maxHeight: 240 }}>
          {lines.map(d => <line key={d} x1={X_CLEF - 22} x2={bars[bars.length - 1]} y1={yOf(d)} y2={yOf(d)} stroke={C.fg} strokeOpacity={0.75} strokeWidth={1.1} />)}
          <Clef kind="treble" x={X_CLEF} y={yOf(anchor)} s={2 * STEP} color={C.fg} />
          <T x={66} y={yOf(36) + 5} anchor="middle" size={15} bold color={C.fg}>3</T>
          <T x={66} y={yOf(32) + 5} anchor="middle" size={15} bold color={C.fg}>8</T>
          {bars.map((x, i) => (
            <g key={i}>
              <line x1={x} x2={x} y1={yOf(38)} y2={yOf(30)} stroke={C.fg} strokeOpacity={0.8} strokeWidth={i === bars.length - 1 ? 1 : 1.2} />
              {i === 0 && <T x={x} y={14} anchor="middle" size={9} color={C.muted}>{tx(t, "figMus_brReset", "bar line: signs end")}</T>}
            </g>
          ))}
          {MELODY.map((e, i) => {
            const r = read[i], x = xs[i];
            if (e.rest) return <RestGlyph key={i} x={x} y={yOf(34)} value={16} color={C.fg} />;
            const color = colorOf(i), d = e.d!;
            return (
              <g key={i}>
                {ledgers(d, lines).map(ly => <line key={ly} x1={x - 9} x2={x + 9} y1={yOf(ly)} y2={yOf(ly)} stroke={C.fg} strokeWidth={1.1} />)}
                {r?.shown && <AccidentalGlyph a={e.sign!} x={x - accOffset(e.sign!) * 2 * STEP - 2} y={yOf(d)} s={2 * STEP} color={color} />}
                {e.value === 8
                  ? <NoteGlyph x={x} y={yOf(d)} value={8} color={color} />
                  : <ellipse cx={x} cy={yOf(d)} rx={5.2} ry={3.8} transform={`rotate(-20 ${x} ${yOf(d)})`} fill={color} />}
                {e.erase && erased.has(e.erase) && <circle cx={x - accOffset(e.sign!) * 2 * STEP - 2} cy={yOf(d)} r={7} fill="none" stroke={C.muted} strokeDasharray="2 2" />}
                <T x={x} y={H - 8} anchor="middle" size={10} bold={i === now} color={color}>{spelledName({ d, a: r!.a }, false)}</T>
              </g>
            );
          })}
          {BEAMS.map(beam)}
        </svg>
        {load === "loading" && <span className="px-3 text-[11px] font-mono text-[var(--text-muted)]">{loadStatus(t, inst, load)}</span>}
      </div>
    </Figure>
  );
}
