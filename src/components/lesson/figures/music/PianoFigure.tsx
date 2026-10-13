"use client";

import { useCallback, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Choice, Figure, Readout, Row, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { midiToFreq, noteName } from "@/components/lesson/kit/audio/notes";
import { notesReady, playNote, samplerOf, setInstrument, type Instrument } from "@/components/lesson/kit/audio/instrument";
import { loadStatus, SampleCredit, useNotes } from "@/components/lesson/kit/audio/useInstrument";
import { playTone, type Wave } from "@/components/lesson/kit/audio/synth";
import { NoteSurface } from "@/components/lesson/kit/audio/NoteSurface";
import { useVoices } from "@/components/lesson/kit/audio/useVoices";

// ── What this figure shows ────────────────────────────────────────────────────
// A playable keyboard, three octaves from C3 to C6, or a guitar neck with the
// keyboard under it as a map (the reader's instrument). Each note's frequency
// comes from f = 440 · 2^((m − 69)/12). With the recordings, the readout also
// shows which one the note borrows and how much faster or slower it is played;
// with the synth, the same note is a bare waveform.

type Sound = Instrument | "synth";

const LO = 48, HI = 84;                                    // C3 … C6

export function MusicPianoFigure({ t }: { t?: TrackTranslations }) {
  const [synth, setSynth] = useState(false);
  const [wave, setWave] = useState<Wave>("sine");
  const { inst, load, ensure } = useNotes();
  const sound: Sound = synth ? "synth" : inst;
  const [pressed, setPressed] = useState<ReadonlySet<number>>(new Set());
  const [last, setLast] = useState<number | null>(null);
  const vis = useVisible<HTMLDivElement>();
  const voices = useVoices(vis.on);

  const held = useRef(new Set<number>());

  const down = useCallback((m: number) => {
    startAudio();
    held.current.add(m);
    setPressed(s => new Set(s).add(m));
    setLast(m);
    if (!synth) {
      // The first press may come before the recordings arrive: sound it then if the key is still down
      if (notesReady()) voices.start(m, playNote(m));
      else ensure().then(() => { if (held.current.has(m)) voices.start(m, playNote(m)); }, () => {});
    } else {
      voices.start(m, playTone(midiToFreq(m), { wave, level: wave === "sine" ? 0.5 : 0.25 }));
    }
  }, [synth, wave, ensure, voices]);

  const up = useCallback((m: number) => {
    held.current.delete(m);
    setPressed(s => { const n = new Set(s); n.delete(m); return n; });
    voices.release(m);
  }, [voices]);

  const changeSound = (v: Sound) => {
    voices.releaseAll();
    setSynth(v === "synth");
    if (v !== "synth") { setInstrument(v); ensure().catch(() => {}); }
  };
  // Start the download as soon as the reader reaches for the keyboard
  const preload = () => { if (!synth && load === "idle") ensure().catch(() => {}); };

  const src = last !== null ? samplerOf(inst).source(last) : null;
  const status = synth ? null : loadStatus(t, inst, load);

  return (
    <Figure title={inst === "guitar" ? tx(t, "figMus_guitarTitle", "A playable guitar") : tx(t, "figMus_pianoTitle", "A playable piano")}
      head={<>
        <Choice value={sound} onChange={changeSound} options={[
          ["piano", tx(t, "figMus_piano", "piano")],
          ["guitar", tx(t, "figMus_inGuitar", "guitar")],
          ["synth", tx(t, "figMus_synth", "synth")],
        ]} />
        {synth && (
          <Choice value={wave} onChange={v => { voices.releaseAll(); setWave(v); }} options={[
            ["sine", tx(t, "figMus_sine", "sine")],
            ["triangle", tx(t, "figMus_triangle", "triangle")],
            ["square", tx(t, "figMus_square", "square")],
            ["sawtooth", tx(t, "figMus_saw", "sawtooth")],
          ]} />
        )}
      </>}
      controls={<>
        <Row>
          {last === null
            ? <Readout>{tx(t, "figMus_pressKey", "press a key")}</Readout>
            : <Readout color="#f43f5e">{noteName(last)} · f = 440 · 2^(({last} − 69)/12) = {midiToFreq(last).toFixed(2)} Hz</Readout>}
          {!synth && src && last !== null && load === "ready" && (
            <Readout>
              {tx(t, "figMus_recording", "recording")} {noteName(src.sample)} × 2^({last - src.sample}/12) = {src.rate.toFixed(4)}
            </Readout>
          )}
          {status && <Readout>{status}</Readout>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={<>
        <span data-mouse-only>{tx(t, "figMus_noteMouse", "Click or drag across the keys. After a click, the computer keys play too: A S D F G H J K are the white keys from C3, W E T Y U the black ones.")}</span>
        <span data-touch-only>{tx(t, "figMus_noteTouch", "Tap or slide across the keys; several fingers play a chord. On an iPhone, turn silent mode off to hear it.")}</span>
        {inst === "guitar" && <>{" "}{tx(t, "figMus_guitarNote", "On the neck, tap a string between two frets (or left of the nut for the open string). The same note lives in several places: the rings show where else it is.")}</>}
        {" "}<SampleCredit t={t} />
      </>}>
      <div ref={vis.ref} className="p-3 md:p-4" onPointerEnter={preload} onFocus={preload}>
        <NoteSurface t={t} lo={LO} hi={HI} pressed={pressed} onDown={down} onUp={up}
          ariaLabel={tx(t, "figMus_keyboardAria", "piano keyboard, C3 to C6")}
          guitarAriaLabel={tx(t, "figMus_neckAria", "guitar neck, frets 0 to 12")} />
      </div>
    </Figure>
  );
}
