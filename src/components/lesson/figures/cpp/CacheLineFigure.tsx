"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// What the cache actually loads when a loop touches a few fields of a
// particle. A Particle has 16 floats, exactly 64 bytes: one cache line. Array
// of structs (AoS): every particle brings its whole line, used fields or not.
// Struct of arrays (SoA): each field is its own array, so a line holds the
// same field of 16 particles and only the arrays the loop needs are loaded.
// The totals are for 4,000,000 particles; the timing for "move y" was measured
// on a Ryzen 5 5600X with g++ 14 -O2 (AoS 33 ms, SoA 3.7 ms).

const FIELDS = ["x", "y", "z", "vx", "vy", "vz", "r", "g", "b", "a", "life", "size", "mass", "drag", "spin", "age"] as const;
type Field = (typeof FIELDS)[number];
type Loop = "movey" | "move" | "fade" | "draw";

const LOOPS: Record<Loop, { fields: Field[]; code: string }> = {
  movey: { fields: ["y", "vy"], code: "p.y += p.vy * dt;" },
  move: { fields: ["x", "y", "z", "vx", "vy", "vz"], code: "p.x += p.vx * dt;  p.y += p.vy * dt;  p.z += p.vz * dt;" },
  fade: { fields: ["a", "life"], code: "p.a = p.life / max_life;" },
  draw: { fields: ["x", "y", "z", "r", "g", "b", "a", "size"], code: "emit_quad(p.x, p.y, p.z, p.size, p.r, p.g, p.b, p.a);" },
};

const N = 4_000_000;
const LINES_SHOWN = 6;
const fmtMB = (bytes: number) => `${(bytes / 1_000_000).toFixed(0)} MB`;
const fmtInt = (n: number) => n.toLocaleString("en-US");

export function CacheLineFigure({ t }: { t?: TrackTranslations }) {
  const [layout, setLayout] = useState<"aos" | "soa">("aos");
  const [loop, setLoop] = useState<Loop>("movey");
  const used = new Set<Field>(LOOPS[loop].fields);
  const k = LOOPS[loop].fields.length;

  const lines = layout === "aos" ? N : k * (N / 16);
  const bytes = lines * 64;
  const usefulPct = layout === "aos" ? Math.round((k * 4 * 100) / 64) : 100;

  const label = (txt: string) => <div className="uppercase tracking-wider text-[10px] text-[var(--text-muted)] mb-1">{txt}</div>;
  const box = "rounded-lg bg-[var(--code-surface)] border border-[var(--code-border)] px-3 py-2";

  const cell = (text: string, on: boolean, key: number, dim = false) => (
    <span key={key} className="flex items-center justify-center rounded-sm font-mono text-[9.5px] overflow-hidden"
      style={{
        height: 22, minWidth: 0,
        border: `1px solid ${on ? C.green : "var(--code-border)"}`,
        background: on ? `color-mix(in srgb, ${C.green} 22%, transparent)` : dim ? "transparent" : `color-mix(in srgb, ${C.red} 9%, transparent)`,
        color: on ? "var(--text-main)" : "var(--text-muted)",
        opacity: dim ? 0.35 : 1,
      }}>{text}</span>
  );

  // Rows to draw: AoS = particles 0..5 (one line each); SoA = the first line of each array
  const rows: { name: string; cells: { text: string; on: boolean; dim?: boolean }[]; dim?: boolean }[] = layout === "aos"
    ? Array.from({ length: LINES_SHOWN }, (_, i) => ({
      name: `particles[${i}]`,
      cells: FIELDS.map(f => ({ text: f, on: used.has(f) })),
    }))
    : FIELDS.map(f => ({
      name: `${f}[0..15]`,
      dim: !used.has(f),
      cells: Array.from({ length: 16 }, (_, i) => ({ text: i % 4 === 0 ? `${i}` : "", on: used.has(f), dim: !used.has(f) })),
    }));

  return (
    <Figure
      title={tx(t, "figCppCache_title", "What the cache loads: array of structs against struct of arrays")}
      head={<Choice value={layout} onChange={setLayout} options={[
        ["aos", tx(t, "figCppCache_aos", "array of structs")],
        ["soa", tx(t, "figCppCache_soa", "struct of arrays")],
      ]} />}
      controls={
        <div className="flex gap-1.5 items-center" style={{ flexWrap: "wrap" }}>
          <span className="text-[12px] text-[var(--text-main)] mr-1">{tx(t, "figCppCache_loop", "The loop")}</span>
          <Choice value={loop} onChange={setLoop} options={[
            ["movey", tx(t, "figCppCache_movey", "move y")],
            ["move", tx(t, "figCppCache_move", "move in 3D")],
            ["fade", tx(t, "figCppCache_fade", "fade")],
            ["draw", tx(t, "figCppCache_draw", "draw")],
          ]} />
        </div>
      }
      note={tx(t, "figCppCache_note", "Each row is one 64-byte cache line, the unit the processor moves between memory and cache. Green bytes are used by the loop; red bytes were loaded for nothing. Pick a loop, then switch the layout and compare the totals.")}
    >
      <div className="p-3 flex flex-col gap-3">
        <pre className={box + " font-mono text-[11.5px] leading-[1.55] overflow-x-auto text-[var(--text-main)]"}>
          {layout === "aos"
            ? `struct Particle { float ${FIELDS.join(", ")}; };   // 64 bytes\nstd::vector<Particle> particles(4'000'000);\nfor (Particle& p : particles) ${LOOPS[loop].code}`
            : `struct Particles { std::vector<float> ${FIELDS.join(", ")}; };\nfor (std::size_t i = 0; i < n; ++i) ${LOOPS[loop].code.replace(/p\.(\w+)/g, "ps.$1[i]")}`}
        </pre>

        <div>
          {label(layout === "aos" ? tx(t, "figCppCache_linesAos", "cache lines loaded: one per particle") : tx(t, "figCppCache_linesSoa", "the first cache line of each array"))}
          <div className="flex flex-col gap-1">
            {rows.map((r, ri) => (
              <div key={ri} className="grid items-center gap-2" style={{ gridTemplateColumns: "5.5rem minmax(0,1fr)", opacity: r.dim ? 0.55 : 1 }}>
                <span className="font-mono text-[10.5px] text-[var(--text-muted)] truncate">{r.name}</span>
                <div className="grid gap-[2px]" style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}>
                  {r.cells.map((c, ci) => cell(c.text, c.on, ci, c.dim))}
                </div>
              </div>
            ))}
            {layout === "aos" && <span className="font-mono text-[10.5px] text-[var(--text-muted)] pl-1">… {tx(t, "figCppCache_more", "and so on, 4,000,000 lines")}</span>}
            {layout === "soa" && <span className="text-[11px] text-[var(--text-muted)]">{tx(t, "figCppCache_soaHint", "Faded arrays are never touched by this loop, so they never enter the cache.")}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className={box}>
            <div className="text-[10px] text-[var(--text-muted)] leading-tight">{tx(t, "figCppCache_cLines", "cache lines for 4M particles")}</div>
            <div className="font-mono text-[15px] font-bold text-[var(--text-main)]">{fmtInt(lines)}</div>
          </div>
          <div className={box}>
            <div className="text-[10px] text-[var(--text-muted)] leading-tight">{tx(t, "figCppCache_cBytes", "bytes read from memory")}</div>
            <div className="font-mono text-[15px] font-bold" style={{ color: layout === "aos" ? C.red : C.green }}>{fmtMB(bytes)}</div>
          </div>
          <div className={box}>
            <div className="text-[10px] text-[var(--text-muted)] leading-tight">{tx(t, "figCppCache_cUseful", "of it used by the loop")}</div>
            <div className="font-mono text-[15px] font-bold" style={{ color: usefulPct === 100 ? C.green : C.amber }}>{usefulPct}%</div>
          </div>
          <div className={box}>
            <div className="text-[10px] text-[var(--text-muted)] leading-tight">{tx(t, "figCppCache_cTime", "measured, g++ -O2, Ryzen 5 5600X")}</div>
            <div className="font-mono text-[15px] font-bold text-[var(--text-main)]">
              {loop === "movey" ? (layout === "aos" ? "33 ms" : "3.7 ms") : <span className="text-[11px] font-normal text-[var(--text-muted)]">{tx(t, "figCppCache_onlyMovey", "measured for \"move y\" only")}</span>}
            </div>
          </div>
        </div>
      </div>
    </Figure>
  );
}
