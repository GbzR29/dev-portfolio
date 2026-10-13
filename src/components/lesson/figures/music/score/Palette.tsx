"use client";

// ── Score editor palette ──────────────────────────────────────────────────────
// The buttons that say what the next note is (or change the selected one):
// its value, drawn as the note itself, the dot, rest or note, the sign and
// the tie. Pure view: the editor owns the state.

import type { ReactNode } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C } from "@/components/lesson/kit/figure";
import { NoteGlyph, RestGlyph, VALUES, valueName, type NoteValue } from "../notation";
import type { Acc } from "../accidentals";

export type Tool = { v: NoteValue; dot: boolean; rest: boolean; acc: Acc | null; tie: boolean };

/** The keyboard shortcut of each value (the numbers MuseScore uses: 3 sixteenth … 7 whole). */
export const VALUE_KEYS: Record<string, NoteValue> = { "3": 16, "4": 8, "5": 4, "6": 2, "7": 1 };

function Tile({ on, onClick, title, disabled, children }: { on: boolean; onClick: () => void; title: string; disabled?: boolean; children: ReactNode }) {
  return (
    // a mouse click leaves the focus on the score, so space still plays and the letters still write
    <button type="button" title={title} aria-label={title} aria-pressed={on} disabled={disabled} onClick={onClick}
      onMouseDown={e => e.preventDefault()}
      className={`h-10 min-w-10 px-1.5 rounded-lg border flex items-center justify-center text-[15px] transition-all disabled:opacity-30 ${on
        ? "border-[var(--primary)] bg-[var(--primary-low)] text-[var(--primary)]"
        : "border-[var(--border)] bg-[var(--card)] text-[var(--text-main)] hover:border-[var(--primary)]/50"}`}>
      {children}
    </button>
  );
}

export function Palette({ t, tool, onValue, onDot, onRest, onAcc, onTie }: {
  t?: TrackTranslations;
  tool: Tool;
  onValue: (v: NoteValue) => void;
  onDot: () => void;
  onRest: () => void;
  onAcc: (a: Acc | null) => void;
  onTie: () => void;
}) {
  const color = (on: boolean) => (on ? "var(--primary)" : C.fg);
  const accs: [Acc | null, string, string][] = [
    [null, "–", tx(t, "figMus_seNoSign", "no sign")],
    [1, "♯", tx(t, "figMus_acWs", "sharp")],
    [-1, "♭", tx(t, "figMus_acWf", "flat")],
    [0, "♮", tx(t, "figMus_acWn", "natural")],
  ];
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {VALUES.map(v => {
        const on = tool.v === v;
        return (
          <Tile key={v} on={on} onClick={() => onValue(v)} title={valueName(t, v)}>
            <svg viewBox="-9 -30 22 38" width={20} height={34} aria-hidden>
              {tool.rest
                ? <RestGlyph x={0} y={v === 1 ? -6 : -10} value={v} color={color(on)} scale={0.95} />
                : <NoteGlyph x={0} y={0} value={v} color={color(on)} scale={0.95} />}
            </svg>
          </Tile>
        );
      })}
      <span className="w-px h-7 bg-[var(--border)] mx-0.5" />
      <Tile on={tool.dot} onClick={onDot} disabled={tool.v === 16} title={tx(t, "figMus_seDot", "dot (+ half the value)")}>
        <svg viewBox="-6 -6 12 12" width={12} height={12} aria-hidden><circle r={3} fill={color(tool.dot)} /></svg>
      </Tile>
      <Tile on={tool.rest} onClick={onRest} title={tx(t, "figMus_seRest", "rest instead of a note")}>
        <svg viewBox="-9 -16 18 30" width={16} height={26} aria-hidden><RestGlyph x={0} y={0} value={4} color={color(tool.rest)} /></svg>
      </Tile>
      <Tile on={tool.tie} onClick={onTie} disabled={tool.rest} title={tx(t, "figMus_seTie", "tie to the next note")}>
        <svg viewBox="0 0 28 14" width={26} height={13} aria-hidden>
          <path d="M3,4 Q14,13 25,4" fill="none" stroke={color(tool.tie)} strokeWidth={1.8} strokeLinecap="round" />
        </svg>
      </Tile>
      <span className="w-px h-7 bg-[var(--border)] mx-0.5" />
      {accs.map(([a, sym, name]) => (
        <Tile key={String(a)} on={tool.acc === a} disabled={tool.rest} onClick={() => onAcc(a)} title={name}>
          <span className="font-semibold">{sym}</span>
        </Tile>
      ))}
    </div>
  );
}
