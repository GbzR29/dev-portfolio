"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure } from "@/components/lesson/kit/figure";
import { byteOwners, elemAsm, fieldAsm, layout, type Field } from "./structModel";

// ── What this figure shows ────────────────────────────────────────────────────
// A C struct, its bytes in memory (8 per row, like the 8-byte words the CPU
// reads), and the instructions gcc 14 -O2 writes to read the chosen field,
// once through a pointer (p->f) and once inside an array (a[i].f). Moving a
// field up or down changes the offsets, the padding, sizeof, and with them
// the numbers inside the brackets. Every struct these presets can make has a
// size whose access pattern was checked against real gcc output.

type Preset = "rec" | "particle" | "entity";
const PRESETS: Record<Preset, Field[]> = {
  rec: [{ type: "char", name: "tag" }, { type: "double", name: "value" }, { type: "int", name: "count" }],
  particle: [{ type: "char", name: "alive" }, { type: "float", name: "x" }, { type: "char", name: "team" }, { type: "float", name: "y" }, { type: "short", name: "id" }],
  entity: [{ type: "char", name: "alive" }, { type: "char *", name: "name" }, { type: "short", name: "id" }, { type: "double", name: "hp" }, { type: "int", name: "score" }],
};
const COLORS = [C.sky, C.amber, C.green, C.pink, C.purple];
const mono = "font-mono tabular-nums";

export function StructLayoutFigure({ t }: { t?: TrackTranslations }) {
  const [preset, setPreset] = useState<Preset>("rec");
  const [order, setOrder] = useState<number[]>([0, 1, 2]);
  const [sel, setSel] = useState(2);
  const base = PRESETS[preset];
  const fields = order.map(i => base[i]);
  const L = layout(fields);
  const owners = byteOwners(L);
  const color = (i: number) => COLORS[order[i] % COLORS.length];
  const cur = L.fields[Math.min(sel, L.fields.length - 1)];
  const curIdx = L.fields.indexOf(cur);

  const choose = (p: Preset) => { setPreset(p); setOrder(PRESETS[p].map((_, i) => i)); setSel(0); };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const o = [...order];
    [o[i], o[j]] = [o[j], o[i]];
    setOrder(o);
    setSel(j);
  };
  const largestFirst = () => {
    const keep = base[order[curIdx]];
    const o = [...order].sort((a, b) => layout([base[b]]).size - layout([base[a]]).size || a - b);
    setOrder(o);
    setSel(o.findIndex(i => base[i] === keep));
  };

  const arrow = (label: string, on: boolean, act: () => void) => (
    <button type="button" disabled={!on} onClick={e => { e.stopPropagation(); act(); }} aria-label={label}
      className="w-6 h-6 shrink-0 rounded border border-[var(--border)] text-[11px] leading-none text-[var(--text-muted)] hover:text-[var(--primary)] disabled:opacity-30">
      {label === "up" ? "▲" : "▼"}
    </button>
  );

  const rows = Math.ceil(L.size / 8);

  return (
    <Figure
      title={tx(t, "figAsmStruct_title", "A struct in memory, and the loads that read it")}
      head={<Choice value={preset} onChange={choose} options={(Object.keys(PRESETS) as Preset[]).map(p => [p, `struct ${p}`] as [Preset, string])} />}
      note={tx(t, "figAsmStruct_how", "Move the fields with the arrows and watch the padding, sizeof and the offsets in the instructions change. Click a field to see how gcc reads it.")}
    >
      <div className="grid gap-4 p-3 sm:p-4">
        {/* ── The C declaration ── */}
        <div className="min-w-0 flex flex-col gap-2">
          <div className={`${mono} text-[12px] rounded-lg border border-[var(--code-border)] bg-[var(--code-surface)] py-2`}>
            <div className="px-3 text-[var(--text-main)]">struct {preset} {"{"}</div>
            {L.fields.map((f, i) => (
              <div key={f.name} onClick={() => setSel(i)}
                className={`flex items-center gap-2 pl-6 pr-2 py-0.5 cursor-pointer ${i === curIdx ? "bg-[var(--primary-low)]" : ""}`}>
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color(i) }} />
                <span className="text-[var(--text-main)] whitespace-pre flex-1 min-w-0 truncate">{f.type} {f.name};</span>
                <span className="text-[var(--text-muted)] text-[11px] whitespace-pre">{`// ${f.offset}`}</span>
                {arrow("up", i > 0, () => move(i, -1))}
                {arrow("down", i < L.fields.length - 1, () => move(i, 1))}
              </div>
            ))}
            <div className="px-3 text-[var(--text-main)]">{"};"}</div>
          </div>
          <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
            <Btn onClick={largestFirst}>{tx(t, "figAsmStruct_sort", "largest first")}</Btn>
            <span className={`${mono} text-[12px] text-[var(--text-main)]`}>sizeof = {L.size}</span>
            <span className={`${mono} text-[12px] text-[var(--text-muted)]`}>{tx(t, "figAsmStruct_align", "alignment")} {L.align}</span>
            <span className={`${mono} text-[12px]`} style={{ color: L.padding ? C.red : C.green }}>
              {tx(t, "figAsmStruct_pad", "padding {n} bytes").replace("{n}", String(L.padding))}
            </span>
          </div>
        </div>

        {/* ── The bytes ── */}
        <div className="min-w-0 flex flex-col gap-1">
          {Array.from({ length: rows }, (_, r) => {
            // An aligned field of at most 8 bytes never crosses a row, so each one is a single block
            const cells: { b: number; o: number; span: number }[] = [];
            for (let b = r * 8; b < Math.min(L.size, r * 8 + 8);) {
              const o = owners[b];
              const span = o >= 0 ? L.fields[o].size : 1;
              cells.push({ b, o, span });
              b += span;
            }
            return (
              <div key={r} className="grid grid-cols-[2rem_repeat(8,minmax(0,1fr))] gap-[3px] items-stretch">
                <span className={`${mono} text-[10.5px] text-[var(--text-muted)] self-center text-right pr-1`}>+{r * 8}</span>
                {cells.map(({ b, o, span }) => (
                  <span key={b} onClick={() => o >= 0 && setSel(o)}
                    className={`${mono} h-9 rounded flex flex-col items-center justify-center text-[10px] leading-tight overflow-hidden ${o >= 0 ? "cursor-pointer" : ""}`}
                    style={{
                      gridColumn: `span ${span}`,
                      ...(o >= 0 ? {
                        background: color(o), color: "#0b1220", opacity: o === curIdx ? 1 : 0.55,
                        outline: o === curIdx ? "2px solid var(--text-main)" : undefined, outlineOffset: -2,
                      } : { border: "1px dashed var(--text-muted)", color: "var(--text-muted)" }),
                    }}>
                    <span className="font-semibold truncate max-w-full px-0.5">{o >= 0 ? L.fields[o].name : "pad"}</span>
                    <span className="opacity-80">{span > 1 ? `${b}–${b + span - 1}` : b}</span>
                  </span>
                ))}
              </div>
            );
          })}
          <p className={`${mono} text-[11px] text-[var(--text-muted)] mt-1`}>
            {tx(t, "figAsmStruct_array", "an array of 1,000: {n} bytes").replace("{n}", String(L.size * 1000))}
          </p>
        </div>
      </div>

      {/* ── The instructions ── */}
      <div className="px-3 sm:px-4 pb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {([["p->" + cur.name, fieldAsm(cur)], [`a[i].${cur.name}`, elemAsm(cur, L.size)]] as const).map(([what, lines]) => (
          <div key={what} className={`${mono} text-[12px] rounded-lg border border-[var(--code-border)] bg-[var(--code-surface)] px-3 py-2 min-w-0 overflow-x-auto`}>
            <div className="text-[var(--text-muted)] whitespace-pre">{`// return ${what};`}</div>
            {lines.map((l, i) => <div key={i} className="text-[var(--text-main)] whitespace-pre">{l}</div>)}
          </div>
        ))}
        <p className="md:col-span-2 text-[13px] leading-relaxed text-[var(--text-main)]">
          {tx(t, "figAsmStruct_explain", "{f} starts {o} bytes into the struct, so p->{f} reads at p + {o}. In an array, element i starts i × {s} bytes after a, because sizeof is {s}: a[i].{f} is at a + i × {s} + {o}.")
            .replace(/\{f\}/g, cur.name).replace(/\{o\}/g, String(cur.offset)).replace(/\{s\}/g, String(L.size))}
          {" "}
          {[1, 2, 4, 8].includes(L.size)
            ? tx(t, "figAsmStruct_scale", "{s} is a scale the address can hold directly, so one instruction does it all.").replace("{s}", String(L.size))
            : tx(t, "figAsmStruct_noScale", "An address can only scale by 1, 2, 4 or 8, so gcc first works out i × {s} with lea or a shift, which are cheaper than imul.").replace("{s}", String(L.size))}
        </p>
      </div>
    </Figure>
  );
}
