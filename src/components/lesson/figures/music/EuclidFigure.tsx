"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, Slider, T, useVisible } from "@/components/lesson/kit/figure";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { usePulseLoop, type Hit } from "./usePulseLoop";

// ── What this figure shows ────────────────────────────────────────────────────
// Euclidean rhythms (Toussaint 2005): k notes spread as evenly as possible
// over a loop of n pulses. The loop is drawn as a necklace, pulse 0 at the
// top, the notes joined into a polygon, each gap labelled; beside it the same
// loop as a strip, with n = k·q + r and the gaps (r of them q + 1 long, the
// rest q). Rotating starts the same necklace elsewhere. Presets are the
// rhythms the chapter names: tresillo E(3,8), cinquillo, Take Five's 3+2,
// the kalamatianos, the bossa nova clave, the West African bell E(7,12).

const W = 600, H = 236, CX = 122, CY = 118, R = 88, SX0 = 262, SX1 = 590;

/** The pulses of E(k, n) started `rot` pulses later: pulse p is a note when (p + rot)·k mod n < k. */
export const euclid = (n: number, k: number, rot = 0) =>
  Array.from({ length: n }, (_, p) => (((p + rot) * k) % n + n) % n < k);

/** The gaps between consecutive notes, from the first note round the loop. */
export function gapsOf(on: boolean[]) {
  const ps = on.flatMap((x, p) => (x ? [p] : []));
  return ps.map((p, i) => (i + 1 < ps.length ? ps[i + 1] : ps[0] + on.length) - p);
}

type Preset = [key: string, en: string, n: number, k: number, rot: number];
const PRESETS: Preset[] = [
  ["figMus_euTresillo", "tresillo", 8, 3, 0],
  ["figMus_euCinquillo", "cinquillo", 8, 5, 2],
  ["figMus_euTake5", "Take Five 3+2", 5, 2, 0],
  ["figMus_euKalam", "kalamatianos 3+2+2", 7, 3, 0],
  ["figMus_euBossa", "bossa nova", 16, 5, 10],
  ["figMus_euBell", "West African bell", 12, 7, 7],
  ["figMus_euFloor", "four on the floor", 16, 4, 0],
];

export function MusicEuclidFigure({ t }: { t?: TrackTranslations }) {
  const [n, setN] = useState(8);
  const [k, setK] = useState(3);
  const [rot, setRot] = useState(0);
  const [bpm, setBpm] = useState(100);
  const [beat, setBeat] = useState(true);
  const vis = useVisible<HTMLDivElement>();

  const on = euclid(n, k, rot), gaps = gapsOf(on), q = Math.floor(n / k), r = n - k * q;
  const perBeat = n % 4 === 0 ? n / 4 : n % 3 === 0 ? 3 : 2;      // how many pulses make a beat
  const hits = (p: number): Hit[] => [
    ...(beat && p % perBeat === 0 ? [{ drum: "kick" as const, level: p === 0 ? 0.7 : 0.45 }] : []),
    on[p] ? { hz: 2500, level: 0.75 } : { hz: 1200, level: 0.08 },
  ];
  const loop = usePulseLoop(vis.on, { pulses: Array.from({ length: n }, (_, p) => hits(p)), spp: 60 / bpm / perBeat });

  const ang = (p: number) => -Math.PI / 2 + (2 * Math.PI * p) / n;
  const pt = (p: number, rad = R) => [CX + rad * Math.cos(ang(p)), CY + rad * Math.sin(ang(p))] as const;
  const notes = on.flatMap((x, p) => (x ? [p] : []));
  const sw = (SX1 - SX0) / n, sx = (p: number) => SX0 + (p + 0.5) * sw;
  const resize = (m: number) => { setN(m); setK(c => Math.min(c, m)); setRot(0); };
  const pick = ([, , pn, pk, pr]: Preset) => { setN(pn); setK(pk); setRot(pr); };
  const named = PRESETS.find(([, , pn, pk, pr]) => pn === n && pk === k && pr === rot);

  return (
    <Figure title={tx(t, "figMus_euTitle", "Euclidean rhythms: k notes spread over n pulses")}
      controls={<>
        <Row>
          {PRESETS.map(p => <Btn key={p[0]} active={named === p} onClick={() => pick(p)}>{tx(t, p[0], p[1])}</Btn>)}
        </Row>
        <Slider label={tx(t, "figMus_euN", "pulses in the loop (n)")} value={n} min={4} max={16} step={1} onChange={resize} fmt={v => String(v)} width="w-36" />
        <Slider label={tx(t, "figMus_euK", "notes (k)")} value={k} min={1} max={n} step={1} onChange={setK} fmt={v => String(v)} width="w-36" />
        <Row>
          <Btn onClick={() => setRot(x => (x + n - 1) % n)}>⟲ {tx(t, "figMus_euRotL", "rotate")}</Btn>
          <Btn onClick={() => setRot(x => (x + 1) % n)}>{tx(t, "figMus_euRotR", "rotate")} ⟳</Btn>
          <Btn active={beat} onClick={() => setBeat(b => !b)}>{tx(t, "figMus_euBeat", "kick on the beat")}</Btn>
        </Row>
        <Slider label={tx(t, "figMus_meBpm", "tempo (BPM)")} value={bpm} min={60} max={140} step={1} onChange={setBpm} fmt={v => `${v} BPM`} width="w-28" />
        <Row>
          <Readout color={C.amber}>{n} = {k} × {q} + {r}</Readout>
          <Readout>{tx(t, "figMus_euGaps", "gaps")}: {gaps.join(" + ")}</Readout>
          {named && <Readout color={C.green}>★ {tx(t, named[0], named[1])}</Readout>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_euNote", "Start with the tresillo: 3 notes in 8 pulses can't be 8/3 apart, so the gaps are the nearest whole numbers, 3, 3 and 2. Raise k to 5 for the cinquillo of Cuban music, then try 7 in 12, the bell of West African drumming. Rotating starts the same necklace on another pulse: the gaps stay, but the rhythm sounds different against the kick, which keeps the beat. Most values of n and k give a rhythm that some tradition already plays.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
          {/* the necklace */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke={C.grid} strokeWidth={1.5} />
          {notes.length > 1 && <polygon points={notes.map(p => pt(p).join(",")).join(" ")} fill={C.amber} fillOpacity={0.12} stroke={C.amber} strokeWidth={1.6} />}
          {notes.map((p, i) => {
            const mid = p + gaps[i] / 2, [x, y] = pt(mid, R + 16);
            return <T key={p} x={x} y={y + 4} anchor="middle" size={11} bold color={C.amber}>{gaps[i]}</T>;
          })}
          {loop.pulse !== null && (() => { const [x, y] = pt(loop.pulse, R - 14); return <line x1={CX} y1={CY} x2={x} y2={y} stroke={C.fg} strokeWidth={1.5} opacity={0.5} />; })()}
          {on.map((x, p) => {
            const [px, py] = pt(p), lit = loop.pulse === p;
            return <circle key={p} cx={px} cy={py} r={(x ? 7.5 : 3.5) + (lit ? 2.5 : 0)} fill={x ? C.amber : beat && p % perBeat === 0 ? C.purple : C.axis} stroke={lit ? C.fg : "none"} strokeWidth={1.5} />;
          })}
          <T x={CX} y={CY + 4} anchor="middle" size={12} bold color={C.fg}>E({k},{n})</T>

          {/* the same loop as a strip, with the gaps bracketed */}
          {on.map((x, p) => {
            const lit = loop.pulse === p;
            return (
              <g key={p}>
                <rect x={sx(p) - sw / 2 + 2} y={96} width={sw - 4} height={26} rx={4} fill={x ? C.amber : "transparent"} opacity={x ? (lit ? 1 : 0.75) : 1}
                  stroke={lit ? C.fg : beat && p % perBeat === 0 ? C.purple : C.grid} strokeWidth={lit ? 2 : 1} />
                <T x={sx(p)} y={138} anchor="middle" size={9} color={beat && p % perBeat === 0 ? C.purple : C.muted}>{p}</T>
              </g>
            );
          })}
          {notes.map((p, i) => {
            const x0 = sx(p) - sw / 2 + 3, end = p + gaps[i], x1 = Math.min(SX1, SX0 + end * sw) - 3, long = gaps[i] > q;
            return (
              <g key={p}>
                <path d={`M${x0},${88} v-6 H${x1} v6`} fill="none" stroke={long ? C.amber : C.sky} strokeWidth={1.5} />
                <T x={(x0 + x1) / 2} y={76} anchor="middle" size={10} bold color={long ? C.amber : C.sky}>{gaps[i]}</T>
              </g>
            );
          })}
          <T x={SX0} y={170} size={10} color={C.fg}>{tx(t, "figMus_euEven", "even spacing would be n/k =")} {(n / k).toFixed(2)}</T>
          {r > 0 && <T x={SX0} y={188} size={10} color={C.amber}>{r} × {tx(t, "figMus_euGap", "gap")} {q + 1}</T>}
          <T x={r > 0 ? SX0 + 120 : SX0} y={188} size={10} color={C.sky}>{k - r} × {tx(t, "figMus_euGap", "gap")} {q}</T>
          <T x={SX0} y={206} size={9} color={C.muted}>{tx(t, "figMus_euPurple", "purple: the beat (where the kick plays)")}</T>
        </svg>
        <div className="px-3 pb-3 flex items-center gap-3">
          <SoundButton on={loop.running} onClick={() => loop.toggle(false)}>
            {loop.running ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_hmPlay", "play the loop")}
          </SoundButton>
        </div>
      </div>
    </Figure>
  );
}
