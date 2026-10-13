"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, Readout, Row, Slider, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { useSequence } from "@/components/lesson/kit/audio/useSequence";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { PC_NAMES, PURE_FIFTH, PYTH_COMMA, richTone } from "./tuning";

// ── What this figure shows ────────────────────────────────────────────────────
// The octave as a clock face: once round = 1200 cents, C at the top, the 12
// piano keys as ticks. Stacking n fifths from C (each folded back into the
// octave) puts a dot per fifth; with pure fifths (701.96 ¢) every dot lands
// 1.96 ¢ further past its key, so after 12 fifths B♯ misses C by the
// Pythagorean comma, 23.46 ¢. "With its piano key" plays the last note against
// the equal-tempered key it is nearest to, so the drift is heard as beats.
// The dots spiral inwards so the chain stays readable. Right: the drift of each note from its key, in cents. Tempered
// fifths (700 ¢) land every dot on its tick and close the circle.

const W = 600, H = 284, CX = 146, CY = 146, R = 112, STEP = 5.2;
const BX0 = 312, BX1 = 590, BASE_Y = 236, PER_CENT = 6.4;            // drift bars
const CHAIN = ["C", "G", "D", "A", "E", "B", "F♯", "C♯", "G♯", "D♯", "A♯", "E♯", "B♯"];
const C4 = 261.6256;

type Mode = "pure" | "tempered";

/** Position of fifth k in the octave, in cents from C (0…1200). */
const posOf = (k: number, fifth: number) => ((k * fifth) % 1200 + 1200) % 1200;
const angle = (c: number) => -Math.PI / 2 + (2 * Math.PI * c) / 1200;
const at = (c: number, rad: number) => [CX + rad * Math.cos(angle(c)), CY + rad * Math.sin(angle(c))] as const;

export function MusicFifthsSpiralFigure({ t }: { t?: TrackTranslations }) {
  const [n, setN] = useState(12);
  const [mode, setMode] = useState<Mode>("pure");
  const [what, setWhat] = useState<"climb" | "clash" | null>(null);
  const vis = useVisible<HTMLDivElement>();
  const seq = useSequence(vis.on);

  const fifth = mode === "pure" ? PURE_FIFTH : 700;
  const drift = (k: number) => k * (fifth - 700);                    // cents past the key, before folding
  const freq = (k: number) => C4 * 2 ** (posOf(k, fifth) / 1200 + (k > 0 && posOf(k, fifth) < 50 ? 1 : 0));
  const ks = Array.from({ length: n + 1 }, (_, k) => k);
  const lit = what === "climb" ? seq.step : null;
  const shown = lit ?? n;

  const climb = () => {
    if (seq.playing && what === "climb") return seq.stop();
    startAudio();
    setWhat("climb");
    seq.play(n + 1, k => richTone(freq(k)), { gap: 0.42, hold: 0.4 });
  };
  const clash = () => {
    if (seq.playing && what === "clash") return seq.stop();
    startAudio();
    setWhat("clash");
    const c = posOf(n, fifth), near = 100 * Math.round(c / 100);
    seq.play(1, () => [richTone(C4 * 2 ** (near / 1200)), richTone(C4 * 2 ** (c / 1200))], { hold: 3.2 });
  };

  const raw = shown * fifth, m = Math.floor(raw / 1200 + 1e-9), folded = raw - 1200 * m;
  const key = Math.round(folded / 100) % 12, off = folded - 100 * Math.round(folded / 100);
  const closes = n === 12;

  return (
    <Figure title={tx(t, "figMus_spTitle", "Twelve fifths almost close the circle")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["pure", tx(t, "figMus_spPure", "pure fifths 3:2")],
        ["tempered", tx(t, "figMus_spTempered", "piano fifths 700 ¢")],
      ]} />}
      controls={<>
        <Slider label={tx(t, "figMus_spN", "fifths stacked (n)")} value={n} min={0} max={12} step={1} onChange={setN} fmt={v => String(v)} width="w-36" />
        <Row>
          <Readout color={C.amber}>
            {CHAIN[shown]}: {shown} × {fifth.toFixed(2)} ¢ − {m} × 1200 ¢ = {folded.toFixed(2)} ¢
          </Readout>
          <Readout color={Math.abs(off) < 0.01 ? C.green : C.red}>
            {tx(t, "figMus_spKey", "key")} {PC_NAMES[key]} {Math.abs(off) < 0.005 ? "0.00" : `${off > 0 ? "+" : ""}${off.toFixed(2)}`} ¢
          </Readout>
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_spNote", "Each pure fifth climbs 701.96 cents; folding back by whole octaves keeps every note in one octave, the circle. The keys are 100 cents apart, so each fifth lands 1.96 cents further past its key than the last. After 12 fifths the chain reaches B♯, which should be C again, but misses by 23.46 cents: play it with its piano key and hear the beating. Switch to piano fifths: each fifth gives up 1.96 cents and the circle closes exactly.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
          {/* the octave as a clock: 12 keys */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke={C.grid} strokeWidth={1.5} />
          {PC_NAMES.map((name, i) => {
            const [x0, y0] = at(100 * i, R - 5), [x1, y1] = at(100 * i, R + 5), [lx, ly] = at(100 * i, R + 17);
            return (
              <g key={name}>
                <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={C.axis} strokeWidth={2} />
                <T x={lx} y={ly + 3.5} anchor="middle" size={9} color={C.muted}>{name}</T>
              </g>
            );
          })}

          {/* the chain of fifths, spiralling inwards */}
          <polyline points={ks.map(k => at(posOf(k, fifth), R - 8 - k * STEP).join(",")).join(" ")}
            fill="none" stroke={C.amber} strokeWidth={1} opacity={0.35} />
          {ks.map(k => {
            const [x, y] = at(posOf(k, fifth), R - 8 - k * STEP), on = k === lit || (lit === null && k === n);
            return (
              <g key={k}>
                <circle cx={x} cy={y} r={on ? 6 : 4} fill={k === 12 ? C.red : C.amber} stroke={on ? C.fg : "none"} strokeWidth={1.5} />
                {k > 0 && <T x={x + (x < CX ? -8 : 8)} y={y + 3} anchor={x < CX ? "end" : "start"} size={7.5} color={on ? C.fg : C.muted} bold={on}>{CHAIN[k]}</T>}
              </g>
            );
          })}
          {closes && mode === "pure" && (() => {
            const [x0, y0] = at(0, R + 30), [x1, y1] = at(PYTH_COMMA, R + 30);
            return (
              <g>
                <path d={`M${x0},${y0} A${R + 30},${R + 30} 0 0 1 ${x1},${y1}`} fill="none" stroke={C.red} strokeWidth={2.5} />
                <T x={x1 + 6} y={y1 + 2} size={8.5} bold color={C.red}>{PYTH_COMMA.toFixed(2)} ¢</T>
              </g>
            );
          })()}

          {/* how far each note has drifted from its key */}
          <T x={BX0} y={18} size={9} bold color={C.fg}>{tx(t, "figMus_spDrift", "how far each note lands past its key")}</T>
          {[0, 10, 20].map(c => (
            <g key={c}>
              <line x1={BX0 + 18} x2={BX1} y1={BASE_Y - c * PER_CENT} y2={BASE_Y - c * PER_CENT} stroke={C.grid} strokeDasharray={c ? "3 3" : undefined} />
              <T x={BX0 + 14} y={BASE_Y - c * PER_CENT + 3} anchor="end" size={7.5}>{c} ¢</T>
            </g>
          ))}
          {Array.from({ length: 12 }, (_, i) => {
            const k = i + 1, d = drift(k), w = (BX1 - BX0 - 24) / 12, x = BX0 + 24 + i * w;
            const shownBar = k <= n, on = k === lit || (lit === null && k === n);
            return (
              <g key={k} opacity={shownBar ? 1 : 0.25}>
                <rect x={x + 2} y={BASE_Y - d * PER_CENT} width={w - 4} height={Math.max(d * PER_CENT, 1)} rx={2}
                  fill={k === 12 ? C.red : C.amber} fillOpacity={on ? 0.95 : 0.6} />
                {shownBar && <T x={x + w / 2} y={BASE_Y - d * PER_CENT - 4} anchor="middle" size={6.5} color={C.muted}>{d.toFixed(1)}</T>}
                <T x={x + w / 2} y={BASE_Y + 12} anchor="middle" size={7.5} color={on ? C.fg : C.muted} bold={on}>{CHAIN[k]}</T>
              </g>
            );
          })}
          <T x={BX0 + 24} y={BASE_Y + 30} size={8.5} color={closes && mode === "pure" ? C.red : C.muted}>
            {mode === "pure"
              ? closes
                ? tx(t, "figMus_spComma", "B♯ misses C by the Pythagorean comma")
                : tx(t, "figMus_spEach", "every pure fifth adds 1.96 ¢")
              : tx(t, "figMus_spZero", "every note on its key: the circle closes")}
          </T>
        </svg>
        <div className="px-3 pb-3 flex flex-wrap gap-2">
          <SoundButton on={seq.playing && what === "climb"} onClick={climb}>
            {seq.playing && what === "climb" ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_spClimb", "climb the fifths")}
          </SoundButton>
          <SoundButton on={seq.playing && what === "clash"} onClick={clash}>
            {seq.playing && what === "clash" ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_spClash", "last note with its piano key")}
          </SoundButton>
        </div>
      </div>
    </Figure>
  );
}
