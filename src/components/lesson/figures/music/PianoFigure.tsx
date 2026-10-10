"use client";

import { useCallback, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Choice, Figure, Readout, Row, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { midiToFreq, noteName } from "@/components/lesson/kit/audio/notes";
import { loadPiano, pianoReady, pianoSource, playPiano } from "@/components/lesson/kit/audio/piano";
import { playTone, type Wave } from "@/components/lesson/kit/audio/synth";
import { PianoKeyboard } from "@/components/lesson/kit/audio/PianoKeyboard";
import { useVoices } from "@/components/lesson/kit/audio/useVoices";

// ── What this figure shows ────────────────────────────────────────────────────
// A playable keyboard, three octaves from C3 to C6. Each key's frequency comes
// from f = 440 · 2^((m − 69)/12). With the piano, the readout also shows which
// recording the key borrows and how much faster or slower it is played; with
// the synth, the same key is a bare waveform.

type Instrument = "piano" | "synth";
type Load = "idle" | "loading" | "ready" | "error";

const LO = 48, HI = 84;                                    // C3 … C6

export function MusicPianoFigure({ t }: { t?: TrackTranslations }) {
  const [inst, setInst] = useState<Instrument>("piano");
  const [wave, setWave] = useState<Wave>("sine");
  const [load, setLoad] = useState<Load>(() => (pianoReady() ? "ready" : "idle"));
  const [pressed, setPressed] = useState<ReadonlySet<number>>(new Set());
  const [last, setLast] = useState<number | null>(null);
  const vis = useVisible<HTMLDivElement>();
  const voices = useVoices(vis.on);

  const held = useRef(new Set<number>());

  const ensurePiano = useCallback(() => {
    if (pianoReady()) return Promise.resolve();
    setLoad("loading");
    return loadPiano().then(() => setLoad("ready"), () => { setLoad("error"); throw new Error("piano"); });
  }, []);

  const down = useCallback((m: number) => {
    startAudio();
    held.current.add(m);
    setPressed(s => new Set(s).add(m));
    setLast(m);
    if (inst === "piano") {
      // The first press may come before the recordings arrive: sound it then if the key is still down
      if (pianoReady()) voices.start(m, playPiano(m));
      else ensurePiano().then(() => { if (held.current.has(m)) voices.start(m, playPiano(m)); }, () => {});
    } else {
      voices.start(m, playTone(midiToFreq(m), { wave, level: wave === "sine" ? 0.5 : 0.25 }));
    }
  }, [inst, wave, ensurePiano, voices]);

  const up = useCallback((m: number) => {
    held.current.delete(m);
    setPressed(s => { const n = new Set(s); n.delete(m); return n; });
    voices.release(m);
  }, [voices]);

  const changeInst = (v: Instrument) => {
    voices.releaseAll();
    setInst(v);
    if (v === "piano") ensurePiano().catch(() => {});
  };
  // Start the download as soon as the reader reaches for the keyboard
  const preload = () => { if (inst === "piano" && load === "idle") ensurePiano().catch(() => {}); };

  const src = last !== null ? pianoSource(last) : null;
  const status = inst !== "piano" ? null
    : load === "loading" ? tx(t, "figMus_loading", "loading the piano (1.3 MB)…")
    : load === "error" ? tx(t, "figMus_loadError", "the piano failed to load — click a key to retry")
    : null;

  return (
    <Figure title={tx(t, "figMus_pianoTitle", "A playable piano")}
      head={<>
        <Choice value={inst} onChange={changeInst} options={[
          ["piano", tx(t, "figMus_piano", "🎹 piano")],
          ["synth", tx(t, "figMus_synth", "〰 synth")],
        ]} />
        {inst === "synth" && (
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
          {inst === "piano" && src && last !== null && load === "ready" && (
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
        {" "}{tx(t, "figMus_pianoCredit", "Piano: Salamander Grand Piano by Alexander Holm (CC-BY 3.0).")}
      </>}>
      <div ref={vis.ref} className="p-3 md:p-4" onPointerEnter={preload} onFocus={preload}>
        <PianoKeyboard lo={LO} hi={HI} pressed={pressed} onDown={down} onUp={up}
          ariaLabel={tx(t, "figMus_keyboardAria", "piano keyboard, C3 to C6")} />
      </div>
    </Figure>
  );
}
