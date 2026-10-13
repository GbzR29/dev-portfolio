"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, Readout, Row, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { playPiano } from "@/components/lesson/kit/audio/piano";
import { usePiano } from "@/components/lesson/kit/audio/usePiano";
import { useSequence } from "@/components/lesson/kit/audio/useSequence";
import { CLEFS, Clef, StaffNote, dName, ledgers, midiOf, type ClefKind } from "./staff";

// ── What this figure shows ────────────────────────────────────────────────────
// The opening of the "Ode to Joy" drawn once, as positions on five lines.
// The clef in front decides which notes those positions are: in treble clef
// it is the tune in C (E E F G…), in bass clef the same picture is G G A B…,
// in alto clef F F G A…. Under each pair of neighbouring notes, the size of
// the step in half steps: 2 or 1. Where the half steps (E–F, B–C) fall moves
// with the clef, so the other clefs do not just play the tune lower; some of
// its steps change size and it sounds subtly wrong.

const W = 600, STEP = 6, PAD = 30, X_CLEF = 40, X0 = 84, X1 = 584;
const SHAPE = [0, 0, 1, 2, 2, 1, 0, -1, -2, -2, -1, 0, 0, -1, -1];   // steps above the bottom line

export function MusicClefMelodyFigure({ t }: { t?: TrackTranslations }) {
  const [clef, setClef] = useState<ClefKind>("treble");
  const { load, ensure } = usePiano();
  const vis = useVisible<HTMLDivElement>();
  const seq = useSequence(vis.on);

  const { lines } = CLEFS[clef], bottom = lines[0], ds = SHAPE.map(s => bottom + s);
  const dHi = bottom + 10, H = (dHi - (bottom - 4)) * STEP + 2 * PAD - 4;
  const yOf = (d: number) => PAD + (dHi - d) * STEP;
  const xOf = (i: number) => X0 + 16 + i * ((X1 - X0 - 30) / (SHAPE.length - 1));
  const semis = ds.slice(1).map((d, i) => Math.abs(midiOf(d) - midiOf(ds[i])));

  const play = async () => {
    startAudio();
    if (seq.playing) return seq.stop();
    try { await ensure(); } catch { return; }
    seq.play(ds.length, i => playPiano(midiOf(ds[i]), { velocity: 0.65 }), { gap: 0.38, hold: 0.36 });
  };
  const lit = seq.step;
  // the steps that differ from the treble version, where the tune is right
  const treble = SHAPE.map(s => CLEFS.treble.lines[0] + s), ref = treble.slice(1).map((d, i) => Math.abs(midiOf(d) - midiOf(treble[i])));
  const changed = semis.filter((s, i) => s !== ref[i] && SHAPE[i] !== SHAPE[i + 1]).length;

  return (
    <Figure title={tx(t, "figMus_cmTitle", "Same picture, different notes: the clef decides")}
      head={<Choice value={clef} onChange={v => { seq.stop(); setClef(v); }} options={[
        ["treble", tx(t, "figMus_stTreble", "treble (G)")], ["bass", tx(t, "figMus_stBass", "bass (F)")], ["alto", tx(t, "figMus_stAlto", "alto (C)")],
      ]} />}
      controls={<>
        <Row>
          <Readout color={C.amber}>{tx(t, "figMus_cmBottom", "bottom line")} = {dName(bottom)}</Readout>
          <Readout>{ds.slice(0, 5).map(dName).join(" ")} …</Readout>
          <Readout color={changed ? C.red : C.green}>{changed ? `${changed} ${tx(t, "figMus_cmChanged", "steps change size")}` : tx(t, "figMus_cmRight", "the tune as written")}</Readout>
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_cmNote", "Play it in treble clef: the Ode to Joy. Switch to bass clef without touching a note: the picture is identical, but the bottom line is now G2, so every note is a different letter, and it plays lower. Listen closely: it is not just lower. The numbers under the notes are the steps in half steps; where a 2 turned into a 1, or a 1 into a 2, the tune bends. The clef only says which line is which letter, and the half steps E–F and B–C stay where the letters are.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
          {lines.map(d => <line key={d} x1={X_CLEF - 22} x2={X1} y1={yOf(d)} y2={yOf(d)} stroke={C.fg} strokeOpacity={0.75} strokeWidth={1.2} />)}
          <Clef kind={clef} x={X_CLEF} y={yOf(CLEFS[clef].anchor)} s={2 * STEP} color={C.fg} />
          {ds.map((d, i) => {
            const x = xOf(i), on = lit === i;
            return (
              <g key={i}>
                <StaffNote x={x} y={yOf(d)} s={2 * STEP} color={on ? C.amber : C.fg} ledgerYs={ledgers(d, lines).map(yOf)} />
                <T x={x} y={H - 22} anchor="middle" size={9.5} bold={on} color={on ? C.amber : C.fg}>{dName(d).slice(0, 1)}</T>
                {i > 0 && SHAPE[i] !== SHAPE[i - 1] && (
                  <T x={(x + xOf(i - 1)) / 2} y={H - 6} anchor="middle" size={9} bold
                    color={semis[i - 1] !== ref[i - 1] ? C.red : semis[i - 1] === 1 ? C.sky : C.muted}>{semis[i - 1]}</T>
                )}
              </g>
            );
          })}
        </svg>
        <div className="px-3 pb-3 flex items-center gap-3">
          <SoundButton on={seq.playing} onClick={play}>{seq.playing ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_cmPlay", "play what is written")}</SoundButton>
          {load === "loading" && <span className="text-[11px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_loading", "loading the piano (1.3 MB)…")}</span>}
        </div>
      </div>
    </Figure>
  );
}
