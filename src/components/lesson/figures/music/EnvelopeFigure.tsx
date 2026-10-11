"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Handle, Readout, Row, T, clamp, nearest, useDrag, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { audio, startAudio } from "@/components/lesson/kit/audio/context";
import { midiToFreq } from "@/components/lesson/kit/audio/notes";
import { playTone, type Envelope, type Harmonics } from "@/components/lesson/kit/audio/synth";
import { PianoKeyboard } from "@/components/lesson/kit/audio/PianoKeyboard";
import { useVoices } from "@/components/lesson/kit/audio/useVoices";
import { useSequence } from "@/components/lesson/kit/audio/useSequence";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";

// ── What this figure shows ────────────────────────────────────────────────────
// An ADSR envelope editor that plays. The curve is the level of a note over
// time, exactly as the synth makes it (kit/audio/synth.ts): a straight rise
// over the attack A, a fall towards the sustain level S that is 95 % done
// after the decay D, a hold at S for as long as the key stays down (drawn as
// a fixed stretch), and a fade over the release R once the key is let go.
// Drag the three handles; the presets copy the shapes of real instruments.
// A dot rides the curve while a note sounds. The fast phrase shows why a slow
// attack cannot play quick notes: each note is over before it has risen.

const W = 600, H = 222, X0 = 36, X1 = 584, Y0 = 26, Y1 = 166;
const PX = 70;                                             // px per second
const HOLD = 0.8;                                          // s drawn for "key held"
const MAX = { attack: 1.5, decay: 2, release: 3 };
const LO = 48, HI = 72;                                    // C3 … C5
const LEVEL = 0.25;
const PHRASE = [60, 64, 67, 72, 67, 64, 60];
/** A bright, sawtooth-like recipe (ch. 3) so the envelope is easy to hear. */
const RECIPE: Harmonics = { amps: [1, 0.5, 0.33, 0.25, 0.2, 0.12, 0.08, 0.05] };

const PRESETS: [string, string, Envelope][] = [
  ["organ", "organ", { attack: 0.005, decay: 0.01, sustain: 1, release: 0.02 }],
  ["piano", "piano", { attack: 0.005, decay: 2, sustain: 0, release: 0.3 }],
  ["pluck", "plucked string", { attack: 0.003, decay: 0.6, sustain: 0, release: 0.15 }],
  ["violin", "bowed violin", { attack: 0.25, decay: 0.1, sustain: 0.85, release: 0.3 }],
  ["pad", "slow pad", { attack: 1.2, decay: 0.5, sustain: 0.7, release: 1.8 }],
  ["drum", "drum hit", { attack: 0.001, decay: 0.15, sustain: 0, release: 0.08 }],
];

/** The level 0…1 of a held note `tt` seconds after it started, as the synth makes it. */
function heldLevel(e: Envelope, tt: number) {
  if (tt < e.attack) return tt / e.attack;
  return e.sustain + (1 - e.sustain) * Math.exp(-(tt - e.attack) / (e.decay / 3));
}

const yOf = (level: number) => Y1 - level * (Y1 - Y0);

/** Where the curve's corners sit. */
function corners(e: Envelope) {
  const xA = X0 + e.attack * PX, xD = xA + e.decay * PX, xH = xD + HOLD * PX, xR = xH + e.release * PX;
  return { xA, xD, xH, xR };
}

function curve(e: Envelope) {
  const { xA, xR } = corners(e), held = e.attack + e.decay + HOLD;
  const pts: string[] = [`M${X0},${Y1}`, `L${xA.toFixed(1)},${Y0}`];
  for (let i = 1; i <= 60; i++) {
    const tt = e.attack + (i / 60) * (e.decay + HOLD);
    pts.push(`L${(X0 + tt * PX).toFixed(1)},${yOf(heldLevel(e, tt)).toFixed(1)}`);
  }
  const top = heldLevel(e, held);
  for (let i = 1; i <= 40; i++) {
    const u = i / 40;
    pts.push(`L${(X0 + (held + u * e.release) * PX).toFixed(1)},${yOf(top * Math.exp(-3 * u)).toFixed(1)}`);
  }
  pts.push(`L${xR.toFixed(1)},${Y1}`);
  return pts.join("");
}

type Note = { t0: number; up: number | null };

export function MusicEnvelopeFigure({ t }: { t?: TrackTranslations }) {
  const [env, setEnv] = useState<Envelope>(PRESETS[1][2]);
  const [pressed, setPressed] = useState<ReadonlySet<number>>(new Set());
  const vis = useVisible<HTMLDivElement>();
  const voices = useVoices(vis.on);
  const seq = useSequence(vis.on);
  const note = useRef<Note | null>(null);
  const dot = useRef<SVGCircleElement>(null);
  const envRef = useRef(env);                              // read by the frame loop and new notes
  useEffect(() => { envRef.current = env; }, [env]);

  const { xA, xD, xH, xR } = corners(env);
  const drag = useDrag<"a" | "d" | "r">(
    p => nearest(p, [["a", { x: xA, y: Y0 }], ["d", { x: xD, y: yOf(env.sustain) }], ["r", { x: xR, y: Y1 }]], 18),
    (k, p) => setEnv(e => {
      const c = corners(e), s = (x: number) => Math.round(x * 1000) / 1000;
      if (k === "a") return { ...e, attack: s(clamp((p.x - X0) / PX, 0.001, MAX.attack)) };
      if (k === "d") return { ...e, decay: s(clamp((p.x - c.xA) / PX, 0.01, MAX.decay)), sustain: Math.round(clamp((Y1 - p.y) / (Y1 - Y0), 0, 1) * 100) / 100 };
      return { ...e, release: s(clamp((p.x - c.xH) / PX, 0.01, MAX.release)) };
    }),
  );

  // The dot follows the newest note along the curve
  useFrame(vis.on, () => {
    const d = dot.current, n = note.current;
    if (!d) return;
    if (!n) { d.setAttribute("opacity", "0"); return; }
    const e = envRef.current, now = audio().ctx.currentTime, c = corners(e);
    let x: number, level: number;
    const released = n.up !== null && now >= Math.max(n.up, n.t0 + e.attack);
    if (!released) {
      const tt = now - n.t0;
      level = heldLevel(e, tt);
      x = tt < e.attack + e.decay ? X0 + tt * PX : Math.min(c.xD + (tt - e.attack - e.decay) * PX, c.xH);
    } else {
      const tr = Math.max(n.up!, n.t0 + e.attack), since = now - tr;
      level = heldLevel(e, tr - n.t0) * Math.exp(-since / (e.release / 3));
      x = c.xH + Math.min(since, e.release) * PX;
      if (since > e.release * 1.2) { note.current = null; d.setAttribute("opacity", "0"); return; }
    }
    d.setAttribute("cx", x.toFixed(1));
    d.setAttribute("cy", yOf(level).toFixed(1));
    d.setAttribute("opacity", "1");
  });

  const sound = useCallback((m: number) => {
    note.current = { t0: audio().ctx.currentTime, up: null };
    return playTone(midiToFreq(m), { wave: RECIPE, level: LEVEL, env: envRef.current });
  }, []);
  const down = useCallback((m: number) => {
    startAudio();
    seq.stop();
    setPressed(s => new Set(s).add(m));
    voices.start(m, sound(m));
  }, [seq, sound, voices]);
  const up = useCallback((m: number) => {
    setPressed(s => { const n = new Set(s); n.delete(m); return n; });
    if (note.current && note.current.up === null) note.current.up = audio().ctx.currentTime;
    voices.release(m);
  }, [voices]);

  const phrase = () => {
    if (seq.playing) return seq.stop();
    startAudio();
    seq.play(PHRASE.length, i => {
      const v = sound(PHRASE[i]), at = audio().ctx.currentTime + 0.18, n = note.current;
      if (n) setTimeout(() => { if (note.current === n) n.up = at; }, 180);
      return v;
    }, { gap: 0.22, hold: 0.18 });
  };

  const sec = (s: number) => (s < 0.1 ? `${Math.round(s * 1000)} ms` : `${s.toFixed(2)} s`);
  const isPreset = (p: Envelope) => (Object.keys(p) as (keyof Envelope)[]).every(k => Math.abs(p[k] - env[k]) < 1e-6);
  const lit = seq.step !== null ? new Set([PHRASE[seq.step]]) : pressed;

  return (
    <Figure title={tx(t, "figMus_enTitle", "Shape a note: the ADSR envelope")}
      controls={<>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_enShapes", "shapes:")}</span>
          {PRESETS.map(([id, label, p]) => (
            <Btn key={id} active={isPreset(p)} onClick={() => setEnv(p)}>{tx(t, `figMus_en_${id}`, label)}</Btn>
          ))}
        </Row>
        <Row>
          <Readout color={C.sky}>A {sec(env.attack)}</Readout>
          <Readout color={C.amber}>D {sec(env.decay)}</Readout>
          <Readout color={C.green}>S {Math.round(env.sustain * 100)} %</Readout>
          <Readout color={C.purple}>R {sec(env.release)}</Readout>
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={<>
        <span data-mouse-only>{tx(t, "figMus_enNoteMouse", "Drag the three handles, then hold a key (click, or the A S D F… keys after a click) and let go.")}</span>
        <span data-touch-only>{tx(t, "figMus_enNoteTouch", "Drag the three handles, then hold a key and let go.")}</span>
        {" "}{tx(t, "figMus_enNote", "Same harmonics every time, yet \"organ\", \"piano\" and \"bowed violin\" sound like different instruments. Now pick \"slow pad\" and play the fast phrase: every note ends before it has risen, and the tune turns to mush.")}
      </>}>
      <div ref={vis.ref}>
        <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
          <T x={X0} y={13} size={9} bold color={C.fg}>{tx(t, "figMus_enAxis", "level of the note over time (drag the handles)")}</T>
          <line x1={X0} x2={X0} y1={Y0 - 6} y2={Y1} stroke={C.axis} />
          <line x1={X0} x2={X1} y1={Y1} y2={Y1} stroke={C.axis} />
          <T x={X0 - 4} y={Y0 + 3} anchor="end" size={8}>1</T>
          <T x={X0 - 4} y={Y1 + 3} anchor="end" size={8}>0</T>
          {[1, 2, 3, 4, 5, 6, 7].map(s => (
            <g key={s}>
              <line x1={X0 + s * PX} x2={X0 + s * PX} y1={Y1} y2={Y1 + 4} stroke={C.axis} />
              <T x={X0 + s * PX} y={Y1 + 14} anchor="middle" size={7.5}>{s} s</T>
            </g>
          ))}
          {/* the four stages, shaded */}
          <rect x={X0} y={Y0} width={xA - X0} height={Y1 - Y0} fill={C.sky} opacity={0.08} />
          <rect x={xA} y={Y0} width={xD - xA} height={Y1 - Y0} fill={C.amber} opacity={0.08} />
          <rect x={xD} y={Y0} width={xH - xD} height={Y1 - Y0} fill={C.green} opacity={0.08} />
          <rect x={xH} y={Y0} width={xR - xH} height={Y1 - Y0} fill={C.purple} opacity={0.08} />
          <line x1={xH} x2={xH} y1={Y0 - 6} y2={Y1} stroke={C.muted} strokeDasharray="3 3" />
          <T x={xH + 4} y={Y0 - 1} size={8}>{tx(t, "figMus_enUp", "key let go")}</T>
          <T x={(xD + xH) / 2} y={Y1 + 30} anchor="middle" size={8.5} bold color={C.green}>{tx(t, "figMus_enS", "S: held")}</T>
          <T x={xH + Math.max(14, (xR - xH) / 2)} y={Y1 + 30} anchor="middle" size={8.5} bold color={C.purple}>R</T>
          <T x={xA + Math.max(10, (xD - xA) / 2)} y={Y1 + 30} anchor="middle" size={8.5} bold color={C.amber}>D</T>
          <T x={X0 + 3} y={Y1 + 30} size={8.5} bold color={C.sky}>A</T>
          <path d={curve(env)} fill="none" stroke="#f43f5e" strokeWidth={2} strokeLinejoin="round" />
          <Handle x={xA} y={Y0} color={C.sky} active={drag.dragging === "a"} />
          <Handle x={xD} y={yOf(env.sustain)} color={C.amber} active={drag.dragging === "d"} />
          <Handle x={xR} y={Y1} color={C.purple} active={drag.dragging === "r"} />
          <circle ref={dot} r={5} fill="var(--text-main)" opacity={0} pointerEvents="none" />
        </svg>
        <div className="px-3 pb-2 flex flex-wrap gap-2 items-center">
          <SoundButton on={seq.playing} onClick={phrase}>
            {seq.playing ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_enPhrase", "play a fast phrase")}
          </SoundButton>
        </div>
        <div className="px-3 pb-3">
          <PianoKeyboard lo={LO} hi={HI} pressed={lit} onDown={down} onUp={up}
            ariaLabel={tx(t, "figMus_spAria", "piano keyboard, C3 to C5")} />
        </div>
      </div>
    </Figure>
  );
}
