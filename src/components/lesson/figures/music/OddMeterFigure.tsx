"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, Slider, T, useVisible } from "@/components/lesson/kit/figure";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { accentClick, usePulseLoop, type Hit } from "./usePulseLoop";

// ── What this figure shows ────────────────────────────────────────────────────
// A bar of n eighth notes cut into groups of 2 and 3, each group one beat.
// The widget lists every way to do it (their number follows c(n) = c(n−2) +
// c(n−3), derived in the chapter) and loops the chosen one: a strong click or
// bass note on the first group, medium ones on the other group starts, soft
// ticks in between. Groupings with a famous use are named: the tresillo
// 3+3+2, Take Five's 3+2, the Bulgarian 2+2+3, Blue Rondo's 2+2+2+3.

const W = 600, H = 150, X0 = 92, X1 = 576, Y = 88;
const GROUP_COLOR = [C.amber, C.sky, C.teal, C.purple, C.pink, C.green];

/** Every ordered way to write n as a sum of 2s and 3s. */
export function groupings(n: number): number[][] {
  if (n === 0) return [[]];
  if (n < 2) return [];
  return [2, 3].flatMap(g => (n - g < 0 ? [] : groupings(n - g).map(rest => [g, ...rest])));
}

/** Groupings with a name, by their "3+3+2" key. */
const FAMOUS: Record<string, [string, string]> = {
  "3+2": ["figMus_omTake5", "Take Five (Brubeck, in 5/4)"],
  "2+2+2": ["figMus_om34", "3/4 counted in eighths"],
  "3+3": ["figMus_om68", "6/8"],
  "2+2+3": ["figMus_omRachenitsa", "Bulgarian rachenitsa (7/8)"],
  "3+2+2": ["figMus_omKalamatianos", "Greek kalamatianos (7/8)"],
  "2+2+2+2": ["figMus_om44", "4/4 counted in eighths"],
  "3+3+2": ["figMus_omTresillo", "tresillo: Latin, pop, reggaeton"],
  "2+2+2+3": ["figMus_omBlueRondo", "Blue Rondo à la Turk (Brubeck, 9/8)"],
  "3+3+3": ["figMus_om98", "9/8"],
  "2+2+3+2+2": ["figMus_omKopanitsa", "Bulgarian kopanitsa (11/16)"],
  "3+3+3+3": ["figMus_om128", "12/8"],
};
/** The grouping shown first for each n: a famous one if there is one. */
const START: Record<number, string> = { 5: "3+2", 6: "3+3", 7: "2+2+3", 8: "3+3+2", 9: "2+2+2+3", 11: "2+2+3+2+2", 12: "3+3+3+3" };

const key = (g: number[]) => g.join("+");

/** The hits of eighth `p` in a bar grouped as `g`. */
function hitsOf(g: number[], p: number, piano: boolean): Hit[] {
  const starts = g.map((_, i) => g.slice(0, i).reduce((s, x) => s + x, 0));
  const level = p === 0 ? 2 : starts.includes(p) ? 1 : 0;
  if (!piano) return [accentClick(level)];
  return level > 0 ? [{ midi: level === 2 ? 48 : 43, vel: level === 2 ? 0.8 : 0.62 }] : [{ midi: 67, vel: 0.3 }, { midi: 72, vel: 0.3 }];
}

export function MusicOddMeterFigure({ t }: { t?: TrackTranslations }) {
  const [n, setN] = useState(7);
  const [pick, setPick] = useState(START[7]);
  const [rate, setRate] = useState(330);                      // eighth notes per minute
  const [piano, setPiano] = useState(false);
  const vis = useVisible<HTMLDivElement>();

  const all = groupings(n);
  const g = all.find(x => key(x) === pick) ?? all[0];
  const loop = usePulseLoop(vis.on, { pulses: Array.from({ length: n }, (_, p) => hitsOf(g, p, piano)), spp: 60 / rate });

  const resize = (m: number) => { setN(m); setPick(START[m] ?? key(groupings(m)[0])); };
  const sound = (p: boolean) => { setPiano(p); if (p) loop.preparePiano(); };
  const w = (X1 - X0) / n, xP = (p: number) => X0 + (p + 0.5) * w;
  const famous = FAMOUS[key(g)];
  const groups = g.map((size, i) => ({ a: g.slice(0, i).reduce((s, x) => s + x, 0), size, i }));

  return (
    <Figure title={tx(t, "figMus_omTitle", "Build a bar from groups of 2 and 3")}
      head={<Choice value={piano ? "piano" : "clicks"} onChange={v => sound(v === "piano")}
        options={[["clicks", tx(t, "figMus_meClicks", "clicks")], ["piano", tx(t, "figMus_mePiano", "piano")]]} />}
      controls={<>
        <Slider label={tx(t, "figMus_omN", "eighths in the bar (n)")} value={n} min={4} max={12} step={1} onChange={resize} fmt={v => `${v}/8`} width="w-40" />
        <Row>
          {all.map(x => (
            <Btn key={key(x)} active={key(x) === key(g)} onClick={() => setPick(key(x))}
              title={FAMOUS[key(x)] ? tx(t, FAMOUS[key(x)][0], FAMOUS[key(x)][1]) : undefined}>
              {key(x)}{FAMOUS[key(x)] ? " ★" : ""}
            </Btn>
          ))}
        </Row>
        <Slider label={tx(t, "figMus_hmRate", "eighths per minute")} value={rate} min={180} max={540} step={1} onChange={setRate} fmt={v => `${v}`} width="w-32" />
        <Row>
          <Readout color={C.amber}>c({n}) = {all.length} {all.length === 1 ? tx(t, "figMus_omWay", "way") : tx(t, "figMus_omWays", "ways")}</Readout>
          <Readout>{g.length} {tx(t, "figMus_omBeats", "beats, unequal")}: {g.map(s => Math.round((s * 60000) / rate)).join(" + ")} ms</Readout>
          {famous && <Readout color={C.green}>★ {tx(t, famous[0], famous[1])}</Readout>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_omNote", "Start with 7 as 2+2+3 and count \"1 2, 1 2, 1 2 3\": three beats, the last one longer, a limp that becomes natural after a few bars. Then try 3+2+2, the same seven eighths starting with the long beat. At 8, 3+3+2 is the tresillo, heard under countless pop and Latin songs. Stars mark the groupings with a famous use. Every bar is made only of 2s and 3s, because a group of 4 is heard as two 2s, and a group of 1 merges with its neighbour.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
          <text x={40} y={Y - 12} textAnchor="middle" fontSize={28} fontWeight={700} fontFamily="Georgia, serif" fill={C.fg}>{n}</text>
          <text x={40} y={Y + 18} textAnchor="middle" fontSize={28} fontWeight={700} fontFamily="Georgia, serif" fill={C.fg}>8</text>
          <line x1={X0} x2={X0} y1={Y - 52} y2={Y + 14} stroke={C.axis} strokeWidth={1.5} />
          <line x1={X1} x2={X1} y1={Y - 52} y2={Y + 14} stroke={C.axis} strokeWidth={1.5} />

          {groups.map(({ a, size, i }) => {
            const col = GROUP_COLOR[i % GROUP_COLOR.length], x0 = xP(a) - w / 2 + 4, x1 = xP(a + size - 1) + w / 2 - 4;
            return (
              <g key={i}>
                {/* the group: a bracket with its size, and a beam over its eighths */}
                <path d={`M${x0},${Y - 38} v-6 H${x1} v6`} fill="none" stroke={col} strokeWidth={1.5} />
                <T x={(x0 + x1) / 2} y={Y - 50} anchor="middle" size={10} bold color={col}>{size}</T>
                <rect x={xP(a) + 4} y={Y - 30} width={xP(a + size - 1) - xP(a) + 1.5} height={4.5} fill={col} />
                {Array.from({ length: size }, (_, k) => {
                  const p = a + k, lit = loop.pulse === p, x = xP(p);
                  return (
                    <g key={k}>
                      {k === 0 && <circle cx={x} cy={Y} r={(i === 0 ? 14 : 11) + (lit ? 3 : 0)} fill={col} opacity={lit ? 0.5 : 0.22} />}
                      <ellipse cx={x} cy={Y} rx={5.4} ry={3.9} transform={`rotate(-20 ${x} ${Y})`} fill={lit ? col : C.fg} />
                      <line x1={x + 4.8} x2={x + 4.8} y1={Y - 1} y2={Y - 28} stroke={lit ? col : C.fg} strokeWidth={1.4} />
                      <T x={x} y={Y + 24} anchor="middle" size={10} bold={k === 0} color={lit ? C.fg : k === 0 ? col : C.muted}>{k + 1}</T>
                    </g>
                  );
                })}
              </g>
            );
          })}
          <T x={X0} y={Y + 48} size={8.5}>{tx(t, "figMus_omCount", "count each group from 1: the 1s are the beats")}</T>
        </svg>
        <div className="px-3 pb-3 flex items-center gap-3">
          <SoundButton on={loop.running} onClick={() => loop.toggle(piano)}>
            {loop.running ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_hmPlay", "play the loop")}
          </SoundButton>
          {loop.load === "loading" && <span className="text-[11px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_loading", "loading the piano (1.3 MB)…")}</span>}
        </div>
      </div>
    </Figure>
  );
}
