"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure } from "@/components/lesson/kit/figure";
import { shortest } from "./sseModel";

// ── What this figure shows ────────────────────────────────────────────────────
// The bits of a double (or a float) as IEEE 754 lays them out: sign, exponent,
// fraction, each in its own colour. Below, the three fields as numbers and
// the formula that turns them into the value, with every term filled in, then
// the exact number those bits hold, digit for digit (computed with BigInt),
// next to the short decimal printf shows. Click any bit to flip it; the
// presets cover 0.1 + 0.2, the end of exact integers, infinity, NaN, the
// smallest subnormal and −0.

type Mode = "double" | "float";
const FMT = { double: { bits: 64, exp: 11, frac: 52, bias: 1023 }, float: { bits: 32, exp: 8, frac: 23, bias: 127 } } as const;
const BIG = (n: number) => BigInt(n);
const mono = "font-mono tabular-nums";
const COL = { s: C.pink, e: C.amber, f: C.sky };

function toBits(v: number, m: Mode): bigint {
  const dv = new DataView(new ArrayBuffer(8));
  if (m === "double") { dv.setFloat64(0, v); return dv.getBigUint64(0); }
  dv.setFloat32(0, v); return BIG(dv.getUint32(0));
}
function fromBits(b: bigint, m: Mode): number {
  const dv = new DataView(new ArrayBuffer(8));
  if (m === "double") { dv.setBigUint64(0, b); return dv.getFloat64(0); }
  dv.setUint32(0, Number(b)); return dv.getFloat32(0);
}

/** The exact decimal value of m × 2^e (m ≥ 0), as a string. */
function exactDecimal(m: bigint, e: number): string {
  if (e >= 0) return (m << BIG(e)).toString();
  const digits = (m * BIG(5) ** BIG(-e)).toString().padStart(-e + 1, "0");
  const int = digits.slice(0, digits.length + e), frac = digits.slice(digits.length + e).replace(/0+$/, "");
  return frac ? `${int}.${frac}` : int;
}

/** At most `n` significant digits of a decimal string, with "…" when cut. */
function clip(s: string, n: number) {
  let seen = 0, i = 0, started = false;
  for (; i < s.length && seen < n; i++) {
    if (/\d/.test(s[i])) { if (s[i] !== "0") started = true; if (started) seen++; }
  }
  return i < s.length ? s.slice(0, i) + "…" : s;
}

type Preset = [label: (m: Mode) => string, value: (m: Mode) => number];
const f = Math.fround;
const PRESETS: Preset[] = [
  [() => "1", () => 1],
  [() => "0.1", () => 0.1],
  [() => "0.1 + 0.2", m => (m === "double" ? 0.1 + 0.2 : f(f(0.1) + f(0.2)))],
  [() => "0.3", () => 0.3],
  [() => "−2.5", () => -2.5],
  [m => (m === "double" ? "2⁵³ + 1" : "2²⁴ + 1"), m => (m === "double" ? 2 ** 53 + 1 : f(2 ** 24 + 1))],
  [m => (m === "double" ? "1e308 × 10" : "3e38 × 10"), m => (m === "double" ? 1e308 * 10 : f(f(3e38) * 10))],
  [() => "0 / 0", () => NaN],
  [() => "min", m => (m === "double" ? Number.MIN_VALUE : 2 ** -149)],
  [() => "−0", () => -0],
];

export function FloatBitsFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("double");
  const [bits, setBits] = useState<bigint>(toBits(0.1, "double"));
  const F = FMT[mode];
  const v = fromBits(bits, mode);

  const sBit = Number((bits >> BIG(F.bits - 1)) & BIG(1));
  const eField = Number((bits >> BIG(F.frac)) & BIG((1 << F.exp) - 1));
  const fField = bits & ((BIG(1) << BIG(F.frac)) - BIG(1));
  const eMax = (1 << F.exp) - 1;
  const kind = eField === eMax ? (fField === BIG(0) ? "inf" : "nan") : eField === 0 ? (fField === BIG(0) ? "zero" : "sub") : "normal";

  const switchMode = (m: Mode) => { setMode(m); setBits(toBits(m === "float" ? f(v) : v, m)); };
  const flip = (i: number) => setBits(bits ^ (BIG(1) << BIG(F.bits - 1 - i)));
  const nudge = (d: 1 | -1) => {
    const n = bits + BIG(d);
    if (n >= BIG(0) && n < BIG(1) << BIG(F.bits)) setBits(n);
  };

  // The value the fields describe
  const mant = kind === "sub" || kind === "zero" ? fField : fField + (BIG(1) << BIG(F.frac));
  const e2 = (kind === "sub" || kind === "zero" ? 1 - F.bias : eField - F.bias);
  const exact = kind === "nan" ? "NaN" : kind === "inf" ? "∞" : (sBit ? "−" : "") + exactDecimal(mant, e2 - F.frac);
  const lead = kind === "sub" || kind === "zero" ? "0" : "1";
  const oneF = lead + exactDecimal(fField, -F.frac).replace(/^0/, "");

  const fieldOf = (i: number) => (i === 0 ? "s" : i <= F.exp ? "e" : "f") as "s" | "e" | "f";
  const perRow = 32;
  const rows = F.bits / perRow;

  const formula = kind === "normal"
    ? `(−1)^${sBit} × ${clip(oneF, 20)} × 2^(${eField} − ${F.bias}) = ${sBit ? "−" : "+"}${clip(oneF, 20)} × 2^${e2}`
    : kind === "sub" ? `(−1)^${sBit} × ${clip(oneF, 20)} × 2^${1 - F.bias}`
    : "";

  const kindText = {
    normal: tx(t, "figAsmBits_normal", "A normal number: the leading 1 of 1.f is not stored, it is implied, which gives one extra bit of precision for free."),
    zero: tx(t, "figAsmBits_zero", "Exponent and fraction all zero: the value is zero. The sign bit still exists, so there is a +0 and a −0; they compare equal."),
    sub: tx(t, "figAsmBits_sub", "Exponent field 0 with a non-zero fraction: a subnormal number. The implied leading digit becomes 0 and the exponent stays at its minimum, so values can fade gradually towards zero."),
    inf: tx(t, "figAsmBits_inf", "Exponent all ones, fraction zero: infinity. It is what a result too big for the format becomes."),
    nan: tx(t, "figAsmBits_nan", "Exponent all ones, fraction not zero: NaN, not a number, the result of 0 / 0 or √−1. A NaN compares unequal to everything, itself included."),
  }[kind];

  return (
    <Figure
      title={tx(t, "figAsmBits_title", "The bits of a floating-point number")}
      head={<Choice value={mode} onChange={switchMode} options={[["double", "double"], ["float", "float"]] as const} />}
      note={tx(t, "figAsmBits_how", "Click a bit to flip it, or pick a number. The ±1 buttons add or subtract 1 from the bit pattern read as an integer, which moves to the very next representable number.")}
    >
      <div className="p-3 sm:p-4 flex flex-col gap-3">
        <div className="flex items-center gap-1.5" style={{ flexWrap: "wrap" }}>
          {PRESETS.map(([label, val]) => {
            const b = toBits(val(mode), mode);
            return <Btn key={label("double")} active={b === bits} onClick={() => setBits(b)}>{label(mode)}</Btn>;
          })}
          <span className="mx-1" />
          <Btn onClick={() => nudge(-1)}>−1</Btn>
          <Btn onClick={() => nudge(1)}>+1</Btn>
        </div>

        {/* ── The bits ── */}
        <div className="flex flex-col gap-1">
          {Array.from({ length: rows }, (_, r) => (
            <div key={r} className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }}>
              {Array.from({ length: perRow }, (_, c) => {
                const i = r * perRow + c;
                const on = Number((bits >> BIG(F.bits - 1 - i)) & BIG(1));
                const fld = fieldOf(i);
                return (
                  <button key={i} type="button" onClick={() => flip(i)} aria-label={`bit ${F.bits - 1 - i}`}
                    className={`${mono} h-7 rounded-sm text-[11px] sm:text-[12px] border`}
                    style={{ borderColor: COL[fld], background: on ? COL[fld] : "transparent", color: on ? "#0b1220" : "var(--text-muted)" }}>
                    {on}
                  </button>
                );
              })}
            </div>
          ))}
          <div className={`${mono} text-[11px] text-[var(--text-muted)] flex gap-3`} style={{ flexWrap: "wrap" }}>
            <span style={{ color: COL.s }}>{tx(t, "figAsmBits_sign", "sign")} 1</span>
            <span style={{ color: COL.e }}>{tx(t, "figAsmBits_exp", "exponent")} {F.exp}</span>
            <span style={{ color: COL.f }}>{tx(t, "figAsmBits_frac", "fraction")} {F.frac}</span>
            <span className="ml-auto">0x{bits.toString(16).padStart(F.bits / 4, "0")}</span>
          </div>
        </div>

        {/* ── The fields as numbers ── */}
        <div className="grid gap-2 sm:grid-cols-3">
          {([
            ["s", tx(t, "figAsmBits_sign", "sign"), `s = ${sBit}`, sBit ? tx(t, "figAsmBits_neg", "negative") : tx(t, "figAsmBits_pos", "positive")],
            ["e", tx(t, "figAsmBits_exp", "exponent"), `e = ${eField}`, kind === "normal" ? `e − ${F.bias} = ${e2}` : kind === "sub" || kind === "zero" ? tx(t, "figAsmBits_eMin", "all zeros: special") : tx(t, "figAsmBits_eMax", "all ones: special")],
            ["f", tx(t, "figAsmBits_frac", "fraction"), `f = 0x${fField.toString(16)}`, `${lead}.f = ${clip(oneF, 18)}`],
          ] as const).map(([k, name, a, b]) => (
            <div key={k} className={`${mono} rounded-lg border px-3 py-2 flex flex-col gap-0.5 min-w-0`} style={{ borderColor: COL[k], background: "var(--code-surface)" }}>
              <span className="text-[10px] uppercase tracking-widest" style={{ color: COL[k] }}>{name}</span>
              <span className="text-[12.5px] text-[var(--text-main)] truncate">{a}</span>
              <span className="text-[11px] text-[var(--text-muted)] truncate">{b}</span>
            </div>
          ))}
        </div>

        {/* ── The value ── */}
        <div className={`${mono} rounded-lg border border-[var(--code-border)] bg-[var(--code-surface)] px-3 py-2 flex flex-col gap-1 text-[12px] min-w-0`}>
          {formula && <div className="text-[var(--text-main)] break-all">{formula}</div>}
          <div className="break-all"><span className="text-[var(--text-muted)]">{tx(t, "figAsmBits_exact", "exactly")} </span><span className="text-[var(--text-main)]">{clip(exact, 60)}</span></div>
          <div><span className="text-[var(--text-muted)]">{tx(t, "figAsmBits_short", "shortest decimal that reads back the same")} </span><span style={{ color: C.green }}>{shortest(v, mode === "float")}</span></div>
        </div>
        <p className="text-[13px] leading-relaxed text-[var(--text-main)]">{kindText}</p>
      </div>
    </Figure>
  );
}
