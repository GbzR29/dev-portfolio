"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, Readout, Row, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { useSequence } from "@/components/lesson/kit/audio/useSequence";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import {
  PC_NAMES, PURE_FIFTH, PURE_THIRD, TUNINGS, TUNING_CENTS, beatRate, intervalCents, richTone, tunedFreq, type TuningId,
} from "./tuning";

// ── What this figure shows ────────────────────────────────────────────────────
// One major chord (root, major third, fifth) in five tunings. Top: where each
// of the 12 keys sits in the chosen tuning, in cents away from the piano's
// equal-tempered key. Below: for the major chord on every root (ordered by
// fifths, C G D A…), how far its third and its fifth are from pure, coloured
// green (pure) to red (out of tune). Clicking a cell plays that chord; the
// tour plays all twelve, so the bad keys of the old tunings are heard: the
// wolf fifth and the wide thirds of Pythagorean and meantone tuning, the
// mild unevenness of Werckmeister, the equal compromise of the piano.

const W = 600, H = 262;
const LX = 92, CW = (W - LX - 10) / 12;                   // label column, cell width
const ZERO = 68, PX = 1.3;                                 // deviation chart: zero line, px per cent
const THIRD_Y = 162, FIFTH_Y = 216, CH = 34;               // the two strips
const ROOTS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];      // roots ordered by fifths
const STRIPS = [
  { y: THIRD_Y, k: 4, pure: PURE_THIRD, key: "figMus_tuThirdRow", en: "third" },
  { y: FIFTH_Y, k: 7, pure: PURE_FIFTH, key: "figMus_tuFifthRow", en: "fifth" },
];

const NAMES: Record<TuningId, [string, string]> = {
  pyth: ["figMus_tuPyth", "Pythagorean"],
  meantone: ["figMus_tuMean", "meantone"],
  just: ["figMus_tuJust", "just (in C)"],
  well: ["figMus_tuWell", "Werckmeister III"],
  equal: ["figMus_tuEqual", "equal"],
};

/** Green when pure, through amber, to red for a wolf. */
function errColor(e: number) {
  const a = Math.abs(e);
  return a < 1 ? C.green : a < 6 ? "#84cc16" : a < 12 ? C.amber : a < 20 ? C.orange : C.red;
}

/** +3.9, −5.4, and a plain 0.0 for values that round to zero. */
const signed = (x: number, d = 1) => (Math.abs(x) < 0.5 * 10 ** -d ? (0).toFixed(d) : `${x > 0 ? "+" : "−"}${Math.abs(x).toFixed(d)}`);

export function MusicTuningFigure({ t }: { t?: TrackTranslations }) {
  const [tuning, setTuning] = useState<TuningId>("meantone");
  const [root, setRoot] = useState(0);
  const [what, setWhat] = useState<"chord" | "tour" | null>(null);
  const vis = useVisible<HTMLDivElement>();
  const seq = useSequence(vis.on);

  const chordOf = (r: number) => [60 + r, 64 + r, 67 + r].map(m => tunedFreq(tuning, m));
  const playChord = (r: number) => chordOf(r).map(f => richTone(f, 0.12));
  const pick = (r: number) => { startAudio(); setRoot(r); setWhat("chord"); seq.play(1, () => playChord(r), { hold: 2.2 }); };
  const tour = () => {
    if (seq.playing && what === "tour") return seq.stop();
    startAudio();
    setWhat("tour");
    seq.play(12, i => playChord(ROOTS[i]), { gap: 1.25, hold: 1.15 });
  };

  const shownRoot = what === "tour" && seq.step !== null ? ROOTS[seq.step] : root;
  const third = intervalCents(tuning, shownRoot, 4), fifth = intervalCents(tuning, shownRoot, 7);
  const [f1, f3, f5] = chordOf(shownRoot);
  const devs = TUNING_CENTS[tuning].map((c, i) => c - 100 * i);

  return (
    <Figure title={tx(t, "figMus_tuTitle", "The same chord in five tunings")}
      head={<Choice value={tuning} onChange={setTuning} options={TUNINGS.map(k => [k, tx(t, NAMES[k][0], NAMES[k][1])] as const)} />}
      controls={<>
        <Row>
          <Readout color={C.fg}>{PC_NAMES[shownRoot]} {tx(t, "figMus_tuMajor", "major")}</Readout>
          <Readout color={errColor(third - PURE_THIRD)}>
            {tx(t, "figMus_tuThird", "third")} {third.toFixed(1)} ¢ ({signed(third - PURE_THIRD)}) · {beatRate(f1, f3, 4, 5).toFixed(1)} {tx(t, "figMus_tuBps", "beats/s")}
          </Readout>
          <Readout color={errColor(fifth - PURE_FIFTH)}>
            {tx(t, "figMus_tuFifth", "fifth")} {fifth.toFixed(1)} ¢ ({signed(fifth - PURE_FIFTH)}) · {beatRate(f1, f5, 2, 3).toFixed(1)} {tx(t, "figMus_tuBps", "beats/s")}
          </Readout>
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_tuNote", "Click any cell to hear that major chord, or take the tour round all twelve. Meantone makes the chords near C sweeter than the piano's (pure thirds), but four of them are unusable, and the fifth G♯–E♭ howls: the wolf. Pythagorean tuning has pure fifths and harsh thirds everywhere. Just intonation is perfect in C and falls apart away from it. Werckmeister gives every key a usable chord, each a little different. Equal temperament makes every chord exactly the same: never pure, never bad.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
          {/* where each key sits, against the piano's key */}
          <T x={4} y={14} size={8.5} bold color={C.fg}>{tx(t, "figMus_tuKeys", "each key vs the piano's, in cents")}</T>
          {[-20, 0, 20].map(c => (
            <g key={c}>
              <line x1={LX} x2={W - 10} y1={ZERO - c * PX} y2={ZERO - c * PX} stroke={c ? C.grid : C.axis} strokeDasharray={c ? "3 3" : undefined} />
              <T x={LX - 6} y={ZERO - c * PX + 3} anchor="end" size={7.5}>{c > 0 ? "+" : ""}{c} ¢</T>
            </g>
          ))}
          {devs.map((d, i) => {
            const x = LX + i * CW, h = d * PX;
            return (
              <g key={i}>
                <rect x={x + 5} y={h > 0 ? ZERO - h : ZERO} width={CW - 10} height={Math.max(Math.abs(h), 1)} rx={2} fill={C.sky} fillOpacity={0.7} />
                <T x={x + CW / 2} y={h > 0 ? ZERO - h - 4 : ZERO - h + 10} anchor="middle" size={6.5} color={C.muted}>{Math.abs(d) < 0.05 ? "0" : signed(d)}</T>
                <T x={x + CW / 2} y={ZERO + 58} anchor="middle" size={8} color={C.fg}>{PC_NAMES[i]}</T>
              </g>
            );
          })}

          {/* every major chord's third and fifth */}
          <T x={4} y={THIRD_Y - 10} size={8.5} bold color={C.fg}>{tx(t, "figMus_tuChords", "the major chord on each root, distance from pure")}</T>
          {STRIPS.map(({ y, k, pure, key, en }) => (
            <g key={k}>
              <T x={4} y={y + CH / 2 + 3} size={9} bold color={C.muted}>{tx(t, key, en)}</T>
              {ROOTS.map((r, i) => {
                const e = intervalCents(tuning, r, k) - pure, on = r === shownRoot;
                return (
                  <g key={r} onClick={() => pick(r)} style={{ cursor: "pointer" }}>
                    <rect x={LX + i * CW + 1.5} y={y} width={CW - 3} height={CH} rx={4}
                      fill={errColor(e)} fillOpacity={on ? 0.9 : 0.55} stroke={on ? C.fg : "none"} strokeWidth={2} />
                    <T x={LX + i * CW + CW / 2} y={y + 13} anchor="middle" size={8} bold color={C.fg}>{PC_NAMES[r]}</T>
                    <T x={LX + i * CW + CW / 2} y={y + 26} anchor="middle" size={7.5} color={C.fg}>{signed(e, Math.abs(e) < 10 ? 1 : 0)}</T>
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
        <div className="px-3 pb-3 flex flex-wrap gap-2">
          <SoundButton on={seq.playing && what === "tour"} onClick={tour}>
            {seq.playing && what === "tour" ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_tuTour", "play all twelve chords")}
          </SoundButton>
        </div>
      </div>
    </Figure>
  );
}
