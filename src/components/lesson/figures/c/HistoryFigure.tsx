"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, T } from "@/components/lesson/kit/figure";
import { EVENTS, type Lane } from "./historyData";

// ── What this figure shows ────────────────────────────────────────────────────
// Sixty years of C and C++ on one scale: two lanes, one dot per milestone, the
// distance between dots proportional to the years between them (so the long
// wait from C++98 to C++11 is visible). Choosing a dot, or walking with the
// previous / next buttons, opens its card: who, when, what changed, and for
// many of them a short program written the way people wrote it that year.

const Y0 = 1965, Y1 = 2028, W = 640, X0 = 64, X1 = W - 16;
const LANE_Y: Record<Lane, number> = { c: 44, cpp: 92 };
const LANE_COL: Record<Lane, string> = { c: C.sky, cpp: C.purple };
const xOf = (year: number) => X0 + ((year - Y0) / (Y1 - Y0)) * (X1 - X0);

// Chronological order across both lanes, C first when a year has both
const ORDER = [...EVENTS].sort((a, b) => a.year - b.year || (a.lane === "c" ? -1 : 1));

export function HistoryFigure({ t }: { t?: TrackTranslations }) {
  const [i, setI] = useState(0);
  const e = ORDER[i];

  return (
    <Figure
      title={tx(t, "figCHist_title", "Sixty years of C and C++")}
      controls={
        <div className="flex items-center gap-2">
          <Btn onClick={() => setI(Math.max(0, i - 1))}>{tx(t, "figCHist_prev", "← earlier")}</Btn>
          <Btn onClick={() => setI(Math.min(ORDER.length - 1, i + 1))}>{tx(t, "figCHist_next", "later →")}</Btn>
          <span className="ml-auto text-[11px] font-mono text-[var(--text-muted)]">{i + 1} / {ORDER.length}</span>
        </div>
      }
      note={tx(t, "figCHist_note", "Choose a dot, or walk with the buttons. The dots are spaced by real time, so the gaps mean something: C went eleven years without a standard, and C++ waited thirteen years between C++98 and C++11.")}
    >
      <svg viewBox={`0 0 ${W} 128`} className="w-full h-auto">
        {/* Decades */}
        {[1970, 1980, 1990, 2000, 2010, 2020].map(y => (
          <g key={y}>
            <line x1={xOf(y)} x2={xOf(y)} y1={24} y2={108} stroke={C.grid} />
            <T x={xOf(y)} y={122} size={9} anchor="middle">{String(y)}</T>
          </g>
        ))}
        {(["c", "cpp"] as const).map(l => (
          <g key={l}>
            <line x1={X0} x2={X1} y1={LANE_Y[l]} y2={LANE_Y[l]} stroke={LANE_COL[l]} strokeOpacity={0.35} strokeWidth={2} />
            <T x={10} y={LANE_Y[l] + 4} size={11} color={LANE_COL[l]} bold>{l === "c" ? "C" : "C++"}</T>
          </g>
        ))}
        {/* C++ grew out of C: a branch from 1979 */}
        <path d={`M${xOf(1977)},${LANE_Y.c} C${xOf(1978.5)},${LANE_Y.c} ${xOf(1977.5)},${LANE_Y.cpp} ${xOf(1979)},${LANE_Y.cpp}`}
          fill="none" stroke={C.purple} strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="3 3" />
        {ORDER.map((ev, k) => {
          const on = k === i;
          return (
            <g key={ev.id} onClick={() => setI(k)} style={{ cursor: "pointer" }}>
              <circle cx={xOf(ev.year)} cy={LANE_Y[ev.lane]} r={10} fill="transparent" />
              <circle cx={xOf(ev.year)} cy={LANE_Y[ev.lane]} r={on ? 6.5 : 4.5}
                fill={on ? LANE_COL[ev.lane] : "var(--code-bg)"} stroke={LANE_COL[ev.lane]} strokeWidth={2} />
            </g>
          );
        })}
        <T x={Math.min(X1 - 4, Math.max(X0 + 4, xOf(e.year)))} y={LANE_Y[e.lane] - 12} size={10} color={C.fg} bold
          anchor={xOf(e.year) > W - 90 ? "end" : xOf(e.year) < X0 + 40 ? "start" : "middle"}>
          {String(e.year)}
        </T>
      </svg>

      {/* The card of the chosen milestone */}
      <div className="border-t border-[var(--border)] px-4 py-4 flex flex-col gap-2" aria-live="polite">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="font-mono text-[22px] font-bold" style={{ color: LANE_COL[e.lane] }}>{e.year}</span>
          <span className="text-[16px] font-semibold text-[var(--text-main)]">{tx(t, `figCHist_${e.id}_title`, e.title)}</span>
        </div>
        <span className="text-[12px] font-mono text-[var(--text-muted)]">{tx(t, `figCHist_${e.id}_who`, e.who)}</span>
        <p className="text-[14px] leading-relaxed text-[var(--text-main)] max-w-[70ch]">{tx(t, `figCHist_${e.id}_body`, e.body)}</p>
        {e.code && (
          <pre className="mt-1 rounded-lg border border-[var(--code-border)] bg-[var(--code-surface)] px-3 py-2.5 font-mono text-[12px] leading-[1.55] text-[var(--text-main)] overflow-x-auto">
            {e.code}
          </pre>
        )}
      </div>
    </Figure>
  );
}
