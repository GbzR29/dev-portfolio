"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, Slider, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { startClickTrain, type ClickTrain } from "@/components/lesson/kit/audio/click";
import { freqToMidi, noteName } from "@/components/lesson/kit/audio/notes";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";

// ── What this figure shows ────────────────────────────────────────────────────
// One click repeated r times a second. Slowly (under ~5 a second) the clicks
// are separate beats you can tap: a pulse. From ~5 to ~20 a second they are
// too fast to count and blur into a flutter or a drum roll. Past ~20 a second
// they fuse into one buzzing tone whose pitch is r hertz. Rhythm and pitch are
// the same thing, repetition, heard at different speeds. The top strip shows
// one second of clicks; the ruler below shows the three zones on a scale where
// every ×10 is the same width.

const W = 600, H = 196, X0 = 30, X1 = 584;
const STRIP_Y = 40, STRIP_H = 34;                          // one second of clicks
const RULER_Y = 136;
const E_MIN = Math.log10(0.5), E_MAX = Math.log10(200);    // rate slider, as powers of ten
const ZONES: [string, string, number, number, string][] = [
  ["beat", "separate beats: a pulse", 0.5, 5, C.sky],
  ["roll", "a flutter, a drum roll", 5, 20, C.amber],
  ["tone", "a buzz with a pitch", 20, 200, "#f43f5e"],
];
const PRESETS: [string, number][] = [["60 BPM", 1], ["120 BPM", 2], ["8/s", 8], ["16/s", 16], ["A1 · 55/s", 55], ["A2 · 110/s", 110]];

const xRate = (r: number) => X0 + ((Math.log10(r) - E_MIN) / (E_MAX - E_MIN)) * (X1 - X0);
const fmtRate = (r: number) => (r < 10 ? r.toFixed(2) : r.toFixed(r < 100 ? 1 : 0));

export function MusicRhythmToPitchFigure({ t }: { t?: TrackTranslations }) {
  const [e, setE] = useState(0);                           // rate = 10^e clicks per second
  const [on, setOn] = useState(false);
  const train = useRef<ClickTrain | null>(null);
  const vis = useVisible<HTMLDivElement>();
  const rate = 10 ** e;

  const stop = () => { train.current?.stop(); train.current = null; setOn(false); };
  const toggle = () => {
    if (train.current) return stop();
    startAudio();
    train.current = startClickTrain(rate);
    setOn(true);
  };
  useEffect(() => { train.current?.setRate(rate); }, [rate]);
  useEffect(() => { if (!vis.on && train.current) { train.current.stop(); train.current = null; setOn(false); } }, [vis.on]);
  useEffect(() => () => train.current?.stop(), []);

  const zone = ZONES.find(([, , lo, hi]) => rate >= lo && rate < hi) ?? ZONES[2];
  const ticks = Array.from({ length: Math.min(200, Math.floor(rate)) + 1 }, (_, i) => i / rate).filter(s => s <= 1);

  return (
    <Figure title={tx(t, "figMus_rpTitle", "Speed up a rhythm until it becomes a note")}
      controls={<>
        <Slider label={tx(t, "figMus_rpRate", "clicks per second")} value={e} min={E_MIN} max={E_MAX} step={0.005}
          onChange={setE} fmt={v => `${fmtRate(10 ** v)} /s`} width="w-48" />
        <Row>
          {PRESETS.map(([label, r]) => <Btn key={label} active={Math.abs(rate - r) < r * 0.01} onClick={() => setE(Math.log10(r))}>{label}</Btn>)}
        </Row>
        <Row>
          <Readout>{fmtRate(rate)} /s = {Math.round(rate * 60)} BPM · {tx(t, "figMus_rpGap", "gap")} {rate < 1 ? `${(1 / rate).toFixed(2)} s` : `${(1000 / rate).toFixed(rate > 100 ? 1 : 0)} ms`}</Readout>
          <Readout color={zone[4]}>{tx(t, "figMus_rpHear", "you hear")}: {tx(t, `figMus_rpZ_${zone[0]}`, zone[1])}{rate >= 20 ? ` · ≈ ${noteName(Math.round(freqToMidi(rate)))}` : ""}</Readout>
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_rpNote", "Start at 60 BPM and drag the slider slowly to the right, listening. Somewhere around 5 a second you can no longer tap along; somewhere around 20 a second the clicks stop being clicks and a low note appears. At 55 a second it is the note A1, the same A as a bass guitar's open A string. Nothing changed but the speed.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
          <T x={X0} y={STRIP_Y - 10} size={9.5} bold color={C.fg}>{tx(t, "figMus_rpStrip", "one second of clicks")}</T>
          <rect x={X0} y={STRIP_Y} width={X1 - X0} height={STRIP_H} fill={C.bg} stroke={C.grid} rx={3} />
          {ticks.map(s => (
            <line key={s} x1={X0 + s * (X1 - X0)} x2={X0 + s * (X1 - X0)} y1={STRIP_Y + 3} y2={STRIP_Y + STRIP_H - 3}
              stroke={zone[4]} strokeWidth={rate > 80 ? 1 : 2} />
          ))}
          <T x={X0} y={STRIP_Y + STRIP_H + 12} size={7.5}>0 s</T>
          <T x={X1} y={STRIP_Y + STRIP_H + 12} anchor="end" size={7.5}>1 s</T>

          <T x={X0} y={RULER_Y - 26} size={9.5} bold color={C.fg}>{tx(t, "figMus_rpRuler", "what you hear, by speed (every ×10 the same width)")}</T>
          {ZONES.map(([id, label, lo, hi, col]) => (
            <g key={id}>
              <rect x={xRate(lo)} y={RULER_Y - 12} width={xRate(hi) - xRate(lo)} height={12} fill={col} opacity={zone[0] === id ? 0.85 : 0.25} />
              <T x={(xRate(lo) + xRate(hi)) / 2} y={RULER_Y + 26} anchor="middle" size={8} bold color={zone[0] === id ? col : C.muted}>{tx(t, `figMus_rpZ_${id}`, label)}</T>
            </g>
          ))}
          {[0.5, 1, 2, 5, 10, 20, 50, 100, 200].map(r => (
            <g key={r}>
              <line x1={xRate(r)} x2={xRate(r)} y1={RULER_Y} y2={RULER_Y + 4} stroke={C.axis} />
              <T x={xRate(r)} y={RULER_Y + 13} anchor="middle" size={7.5}>{r}</T>
            </g>
          ))}
          <T x={X1} y={RULER_Y + 40} anchor="end" size={7.5}>{tx(t, "figMus_rpUnit", "clicks per second (= Hz)")}</T>
          <path d={`M${xRate(rate)},${RULER_Y - 13} l-6,-10 h12 z`} fill={C.fg} />
        </svg>
        <div className="px-3 pb-3">
          <SoundButton on={on} onClick={toggle}>
            {on ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_listen", "listen")}
          </SoundButton>
        </div>
      </div>
    </Figure>
  );
}
