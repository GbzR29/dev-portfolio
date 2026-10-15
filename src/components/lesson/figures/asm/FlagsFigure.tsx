"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Slider, Sliders } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Two bytes a and b, an add or a sub, and the four flags the CPU sets. Each
// row shows the 8 bits and both readings, unsigned (0 to 255) and signed
// (−128 to 127). The result row also shows the ninth bit, the carry or borrow
// that did not fit, and the true answer when the 8-bit result is wrong: wrong
// as unsigned is CF, wrong as signed is OF. With `jcc` the operation is cmp,
// and a table lists every conditional jump with the flags it tests and whether
// it would jump: the same flags answer "a < b" both ways, signed and unsigned.

type Op = "add" | "sub";
const s8 = (v: number) => (v >= 128 ? v - 256 : v);

type Preset = [a: number, b: number, op: Op];
const ADD_PRESETS: Preset[] = [[200, 100, "add"], [100, 50, "add"], [128, 128, "add"], [5, 5, "sub"], [0, 1, "sub"], [128, 1, "sub"]];
const CMP_PRESETS: Preset[] = [[5, 5, "sub"], [3, 7, "sub"], [255, 1, "sub"], [1, 255, "sub"], [128, 127, "sub"]];

// [mnemonic, meaning key, English meaning, flags tested, test]
type F = { zf: boolean; sf: boolean; cf: boolean; of: boolean };
const JCC: [string, string, string, string, (f: F) => boolean][] = [
  ["je", "eq", "a = b", "ZF = 1", f => f.zf],
  ["jne", "ne", "a ≠ b", "ZF = 0", f => !f.zf],
  ["jb", "bu", "a < b, unsigned", "CF = 1", f => f.cf],
  ["jae", "aeu", "a ≥ b, unsigned", "CF = 0", f => !f.cf],
  ["ja", "au", "a > b, unsigned", "CF = 0, ZF = 0", f => !f.cf && !f.zf],
  ["jbe", "beu", "a ≤ b, unsigned", "CF = 1 or ZF = 1", f => f.cf || f.zf],
  ["jl", "ls", "a < b, signed", "SF ≠ OF", f => f.sf !== f.of],
  ["jge", "ges", "a ≥ b, signed", "SF = OF", f => f.sf === f.of],
  ["jg", "gs", "a > b, signed", "ZF = 0, SF = OF", f => !f.zf && f.sf === f.of],
  ["jle", "les", "a ≤ b, signed", "ZF = 1 or SF ≠ OF", f => f.zf || f.sf !== f.of],
];

const mono = "font-mono tabular-nums";

function Bits({ v, hot }: { v: number; hot?: boolean }) {
  return (
    <span className="grid grid-cols-8 gap-[2px]">
      {[7, 6, 5, 4, 3, 2, 1, 0].map(i => {
        const on = (v >> i) & 1;
        return (
          <span key={i} className={`${mono} text-center text-[12px] sm:text-[13px] rounded-sm py-0.5 border`}
            style={{
              borderColor: i === 7 ? "var(--primary)" : "var(--code-border)",
              background: on ? (hot ? "var(--primary-low)" : "var(--code-surface)") : "transparent",
              color: on ? "var(--text-main)" : "var(--text-muted)",
            }}>{on}</span>
        );
      })}
    </span>
  );
}

export function FlagsFigure({ t, jcc = false }: { t?: TrackTranslations; jcc?: boolean }) {
  const [a, setA] = useState(jcc ? 255 : 200);
  const [b, setB] = useState(jcc ? 1 : 100);
  const [op, setOp] = useState<Op>(jcc ? "sub" : "add");
  const opNow: Op = jcc ? "sub" : op;

  const raw = opNow === "add" ? a + b : a - b;
  const r = raw & 255;
  const sa = s8(a), sb = s8(b), sr = s8(r);
  const sTrue = opNow === "add" ? sa + sb : sa - sb;
  const f: F = { zf: r === 0, sf: r >= 128, cf: opNow === "add" ? raw > 255 : a < b, of: sTrue < -128 || sTrue > 127 };
  const sym = opNow === "add" ? "+" : "−";

  const reason = {
    zf: f.zf ? tx(t, "figAsmFlags_zf1", "the result is 0") : tx(t, "figAsmFlags_zf0", "the result is not 0"),
    sf: f.sf ? tx(t, "figAsmFlags_sf1", "the top bit of the result is 1") : tx(t, "figAsmFlags_sf0", "the top bit of the result is 0"),
    cf: f.cf
      ? (opNow === "add" ? tx(t, "figAsmFlags_cf1add", "unsigned, {x} does not fit in 0 to 255: a carry") : tx(t, "figAsmFlags_cf1sub", "unsigned, {x} is below 0: a borrow")).replace("{x}", String(raw))
      : tx(t, "figAsmFlags_cf0", "the unsigned answer fits"),
    of: f.of
      ? tx(t, "figAsmFlags_of1", "signed, {x} does not fit in −128 to 127").replace("{x}", String(sTrue))
      : tx(t, "figAsmFlags_of0", "the signed answer fits"),
  };

  const row = (label: string, v: number, carry: string, u: number, s: number, trueU?: number, trueS?: number) => (
    <div className="grid grid-cols-[2.4rem_0.9rem_minmax(0,1fr)_2.9rem_2.9rem] sm:grid-cols-[4rem_1.4rem_minmax(0,16rem)_5rem_5rem] gap-x-2 items-center">
      <span className={`${mono} text-[12px] text-[var(--text-main)] font-bold`}>{label}</span>
      <span className={`${mono} text-center text-[12px]`} style={{ color: carry === "1" ? C.amber : "var(--text-muted)" }}>{carry}</span>
      <Bits v={v} hot={trueU !== undefined} />
      <span className={`${mono} text-[12px] text-right`}>
        <span className="text-[var(--text-main)]">{u}</span>
        {trueU !== undefined && trueU !== u && <span className="block text-[10.5px]" style={{ color: C.red }}>≠ {trueU}</span>}
      </span>
      <span className={`${mono} text-[12px] text-right`}>
        <span className="text-[var(--text-main)]">{s}</span>
        {trueS !== undefined && trueS !== s && <span className="block text-[10.5px]" style={{ color: C.red }}>≠ {trueS}</span>}
      </span>
    </div>
  );

  const presets = jcc ? CMP_PRESETS : ADD_PRESETS;
  const flag = (name: string, on: boolean, why: string) => (
    <div key={name} className="flex items-baseline gap-2 min-w-0">
      <span className={`${mono} text-[12px] px-1.5 py-0.5 rounded border shrink-0`}
        style={{ borderColor: on ? C.amber : "var(--border)", color: on ? "var(--text-main)" : "var(--text-muted)", fontWeight: on ? 700 : 400 }}>
        {name}={on ? 1 : 0}
      </span>
      <span className="text-[12px] text-[var(--text-muted)]">{why}</span>
    </div>
  );

  return (
    <Figure
      title={jcc ? tx(t, "figAsmFlags_titleJcc", "cmp a, b and the conditional jumps") : tx(t, "figAsmFlags_title", "What the flags record")}
      head={jcc ? undefined : <Choice value={op} onChange={setOp} options={[["add", "add"], ["sub", "sub"]]} />}
      controls={<>
        <Sliders>
          <Slider label="a" value={a} min={0} max={255} step={1} onChange={setA} width="w-6" fmt={v => String(v)} />
          <Slider label="b" value={b} min={0} max={255} step={1} onChange={setB} width="w-6" fmt={v => String(v)} />
        </Sliders>
        {/* inline wrap: on phones figure.css would turn a .flex-wrap row into a sideways slider */}
        <div className="flex gap-1.5 items-center" style={{ flexWrap: "wrap" }}>
          {presets.map(([pa, pb, po]) => (
            <Btn key={`${pa}${po}${pb}`} active={a === pa && b === pb && opNow === po} onClick={() => { setA(pa); setB(pb); setOp(po); }}>
              <span className="font-mono normal-case">{jcc ? `${s8(pa)}, ${s8(pb)}` : `${pa} ${po === "add" ? "+" : "−"} ${pb}`}</span>
            </Btn>
          ))}
        </div>
      </>}
      note={jcc
        ? tx(t, "figAsmFlags_noteJcc", "The presets show the numbers as signed. Try −1 and 1: the bits of −1 are 255, so jl and jb disagree. One cmp, two possible answers; the jump you pick decides which one counts.")
        : tx(t, "figAsmFlags_note", "The CPU does not know whether the bits are signed or unsigned. It computes once and records both verdicts: CF for the unsigned reading, OF for the signed one. A red line marks the reading whose answer came out wrong.")}
    >
      <div className="p-3 sm:p-5 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5 overflow-x-auto">
          <div className="grid grid-cols-[2.4rem_0.9rem_minmax(0,1fr)_2.9rem_2.9rem] sm:grid-cols-[4rem_1.4rem_minmax(0,16rem)_5rem_5rem] gap-x-2 text-[10px] text-[var(--text-muted)]">
            <span /><span className="text-center">{opNow === "add" ? "c" : "b"}</span>
            <span className={`${mono} grid grid-cols-8 gap-[2px] text-center`}>
              {[7, 6, 5, 4, 3, 2, 1, 0].map(i => <span key={i}>{i}</span>)}
            </span>
            <span className="text-right">{tx(t, "figAsmFlags_unsigned", "unsigned")}</span>
            <span className="text-right">{tx(t, "figAsmFlags_signed", "signed")}</span>
          </div>
          {row("a", a, "", a, sa)}
          {row(`${sym} b`, b, "", b, sb)}
          <div className="h-px bg-[var(--border)]" />
          {row(jcc ? "a − b" : "al", r, f.cf ? "1" : "0", r, sr, raw, sTrue)}
          <span className="text-[10.5px] text-[var(--text-muted)]">
            {jcc
              ? tx(t, "figAsmFlags_cmpNote", "cmp throws the result away; only the flags are kept.")
              : tx(t, "figAsmFlags_carryNote", "The bit left of the result is the ninth bit: the carry out of an add, or the borrow of a sub.")}
          </span>
        </div>

        <div className="grid gap-1.5 sm:grid-cols-2">
          {flag("ZF", f.zf, reason.zf)}{flag("SF", f.sf, reason.sf)}
          {flag("CF", f.cf, reason.cf)}{flag("OF", f.of, reason.of)}
        </div>

        {jcc && (
          <div className="grid grid-cols-[2.6rem_minmax(0,1fr)_minmax(0,auto)_3.4rem] gap-x-3 gap-y-0.5 text-[12px] items-baseline">
            {JCC.map(([m, key, meaning, flags, test]) => {
              const on = test(f);
              return (
                <div key={m} className="contents">
                  <span className={`${mono} font-bold`} style={{ color: on ? "var(--primary)" : "var(--text-muted)" }}>{m}</span>
                  <span className={on ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}>{tx(t, `figAsmFlags_j_${key}`, meaning)}</span>
                  <span className={`${mono} text-[11px] text-[var(--text-muted)]`}>{tx(t, `figAsmFlags_f_${key}`, flags)}</span>
                  <span className={`${mono} text-[11px] text-right`} style={{ color: on ? "var(--primary)" : "var(--text-muted)" }}>
                    {on ? tx(t, "figAsmFlags_jumps", "jumps") : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Figure>
  );
}
