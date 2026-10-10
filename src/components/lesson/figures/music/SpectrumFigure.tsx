"use client";

import { useCallback, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, Readout, Row, T, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { analyser, startAudio } from "@/components/lesson/kit/audio/context";
import { midiToFreq, noteName } from "@/components/lesson/kit/audio/notes";
import { playPiano, pianoReady } from "@/components/lesson/kit/audio/piano";
import { playTone, type Wave } from "@/components/lesson/kit/audio/synth";
import { PianoKeyboard } from "@/components/lesson/kit/audio/PianoKeyboard";
import { usePiano } from "@/components/lesson/kit/audio/usePiano";
import { useVoices } from "@/components/lesson/kit/audio/useVoices";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";

// ── What this figure shows ────────────────────────────────────────────────────
// A live spectrum of whatever the page is playing: the browser's analyser
// splits the sound into frequencies (a Fourier transform, ≈ 6 Hz per bin) and
// the curve shows how strong each one is, in decibels below the strongest.
// The dashed lines mark n·f for the last key pressed: every peak of a pitched
// sound sits on one of them. The real piano shows all harmonics fading
// upward; the square wave only the odd ones; the sine just one.

const W = 600, H = 220, X0 = 34, X1 = 590, Y0 = 16, Y1 = 186;
const F_MAX = 4000, DB_RANGE = 70;
const LO = 48, HI = 72;                                    // C3 … C5

type Instrument = "piano" | Wave;

const xOf = (f: number) => X0 + (f / F_MAX) * (X1 - X0);

export function MusicSpectrumFigure({ t }: { t?: TrackTranslations }) {
  const [inst, setInst] = useState<Instrument>("piano");
  const [pressed, setPressed] = useState<ReadonlySet<number>>(new Set());
  const [last, setLast] = useState<number | null>(null);
  const vis = useVisible<HTMLDivElement>();
  const voices = useVoices(vis.on);
  const piano = usePiano();
  const held = useRef(new Set<number>());
  const path = useRef<SVGPathElement>(null);
  const bins = useRef<Float32Array<ArrayBuffer> | null>(null);
  const live = useRef(false);                              // set once the reader has played something

  // Redraw the curve straight into the path every frame (no React render)
  useFrame(vis.on, () => {
    if (!live.current || !path.current) return;
    const a = analyser();
    bins.current ??= new Float32Array(a.frequencyBinCount);
    a.getFloatFrequencyData(bins.current);
    const b = bins.current, hz = a.context.sampleRate / a.fftSize;
    const n = Math.min(b.length, Math.ceil(F_MAX / hz));
    const top = Math.max(-100, ...b.subarray(0, n));          // the strongest frequency sits at 0 dB
    let d = "";
    for (let i = 1; i < n; i++) {
      const rel = Math.max(-DB_RANGE, b[i] - top);
      d += `${d ? "L" : "M"}${xOf(i * hz).toFixed(1)},${(Y0 - (rel / DB_RANGE) * (Y1 - Y0)).toFixed(1)}`;
    }
    path.current.setAttribute("d", d);
  });

  const down = useCallback((m: number) => {
    startAudio();
    analyser();
    live.current = true;
    held.current.add(m);
    setPressed(s => new Set(s).add(m));
    setLast(m);
    if (inst === "piano") {
      if (pianoReady()) voices.start(m, playPiano(m));
      else piano.ensure().then(() => { if (held.current.has(m)) voices.start(m, playPiano(m)); }, () => {});
    } else {
      voices.start(m, playTone(midiToFreq(m), { wave: inst, level: inst === "sine" ? 0.45 : 0.22 }));
    }
  }, [inst, piano, voices]);

  const up = useCallback((m: number) => {
    held.current.delete(m);
    setPressed(s => { const n = new Set(s); n.delete(m); return n; });
    voices.release(m);
  }, [voices]);

  const f = last !== null ? midiToFreq(last) : null;
  const marks = f ? Array.from({ length: Math.floor(F_MAX / f) }, (_, i) => i + 1) : [];

  return (
    <Figure title={tx(t, "figMus_spTitle", "Live spectrum: the harmonics inside a note")}
      head={<Choice value={inst} onChange={v => { voices.releaseAll(); setInst(v); if (v === "piano") piano.ensure().catch(() => {}); }} options={[
        ["piano", tx(t, "figMus_piano", "🎹 piano")],
        ["sine", tx(t, "figMus_sine", "sine")],
        ["square", tx(t, "figMus_square", "square")],
        ["sawtooth", tx(t, "figMus_saw", "sawtooth")],
      ]} />}
      controls={<>
        <Row>
          {last === null
            ? <Readout>{tx(t, "figMus_spPress", "hold a key and watch the peaks")}</Readout>
            : <Readout color="#f43f5e">{noteName(last)} · f = {f!.toFixed(1)} Hz · {tx(t, "figMus_spLines", "dashed lines at")} f, 2f, 3f…</Readout>}
          {inst === "piano" && piano.load === "loading" && <Readout>{tx(t, "figMus_loading", "loading the piano (1.3 MB)…")}</Readout>}
          {inst === "piano" && piano.load === "error" && <Readout>{tx(t, "figMus_loadError", "the piano failed to load — click a key to retry")}</Readout>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={<>
        <span data-mouse-only>{tx(t, "figMus_spNoteMouse", "Hold a key down (click, or the A S D F… keys after a click).")}</span>
        <span data-touch-only>{tx(t, "figMus_spNoteTouch", "Hold a key down.")}</span>
        {" "}{tx(t, "figMus_spNote", "Every peak lands on a dashed line: the sound is made of whole-number multiples of f. Compare the piano with the square wave (only the odd lines) and the sine (a single peak). Play a higher key and the lines spread apart, because they are spaced f apart.")}
      </>}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
          {[0, 1000, 2000, 3000, 4000].map(hz => (
            <g key={hz}>
              <line x1={xOf(hz)} x2={xOf(hz)} y1={Y0} y2={Y1} stroke={C.grid} />
              <T x={xOf(hz)} y={Y1 + 13} anchor={hz === F_MAX ? "end" : "middle"} size={8}>{hz === F_MAX ? "4000 Hz" : hz}</T>
            </g>
          ))}
          {[0, -20, -40, -60].map(db => {
            const y = Y0 - (db / DB_RANGE) * (Y1 - Y0);
            return <T key={db} x={X0 - 4} y={y + 3} anchor="end" size={7.5}>{db}</T>;
          })}
          <T x={X0 + 4} y={Y1 + 28} size={8}>{tx(t, "figMus_spAxis", "dB below the strongest frequency")}</T>
          {marks.map(n => (
            <g key={n}>
              <line x1={xOf(n * f!)} x2={xOf(n * f!)} y1={Y0} y2={Y1} stroke={C.amber} strokeDasharray="2 4" opacity={0.7} />
              {(f! / F_MAX) * (X1 - X0) > 13 && <T x={xOf(n * f!)} y={Y0 - 4} anchor="middle" size={7.5} color={C.amber}>{n}</T>}
            </g>
          ))}
          <line x1={X0} x2={X1} y1={Y1} y2={Y1} stroke={C.axis} />
          <path ref={path} fill="none" stroke="#f43f5e" strokeWidth={1.4} strokeLinejoin="round" />
        </svg>
        <div className="px-3 pb-3" onPointerEnter={() => { if (inst === "piano" && piano.load === "idle") piano.ensure().catch(() => {}); }}>
          <PianoKeyboard lo={LO} hi={HI} pressed={pressed} onDown={down} onUp={up}
            ariaLabel={tx(t, "figMus_spAria", "piano keyboard, C3 to C5")} />
        </div>
      </div>
    </Figure>
  );
}
