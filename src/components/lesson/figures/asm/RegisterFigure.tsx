"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row } from "@/components/lesson/kit/figure";
import { B0, B1, mask, regRef, signed, type RegRef, type Width } from "./cpuModel";

// ── What this figure shows ────────────────────────────────────────────────────
// One 64-bit register as its 8 bytes, most significant on the left, with the
// names of its parts drawn as bars under the bytes they cover (rax, eax, ax,
// ah, al). Pick a part, then run an instruction on it: the bytes it changes
// light up. The point to discover: writing the 32-bit part clears the top 32
// bits, while writing an 8- or 16-bit part leaves the rest alone. The readouts
// show the chosen part's bits read as unsigned and as signed (two's complement).

type Family = "rax" | "rsi" | "r8";
const PARTS: Record<Family, string[]> = {
  rax: ["rax", "eax", "ax", "ah", "al"],
  rsi: ["rsi", "esi", "si", "sil"],
  r8: ["r8", "r8d", "r8w", "r8b"],
};
const START = BigInt("0x1122334455667788");
const M64 = mask(64);

type Op = "mov-1" | "mov0" | "mov5" | "add1" | "sub1" | "neg";
const OPS: [Op, string][] = [["mov-1", "mov {r}, -1"], ["mov0", "mov {r}, 0"], ["mov5", "mov {r}, 5"], ["add1", "add {r}, 1"], ["sub1", "sub {r}, 1"], ["neg", "neg {r}"]];

/** Writes `v` into part `r` of the register value `reg`, the way the CPU does. */
function write(reg: bigint, r: RegRef, v: bigint): bigint {
  v &= mask(r.width);
  if (r.width === 64 || r.width === 32) return v;                 // 32-bit writes zero-extend
  const sh = BigInt(r.shift);
  return (reg & ~(mask(r.width) << sh) & M64) | (v << sh);
}

const read = (reg: bigint, r: RegRef) => (reg >> BigInt(r.shift)) & mask(r.width);

function apply(op: Op, reg: bigint, r: RegRef): bigint {
  const x = read(reg, r);
  const v = op === "mov-1" ? -B1 : op === "mov0" ? B0 : op === "mov5" ? BigInt(5)
    : op === "add1" ? x + B1 : op === "sub1" ? x - B1 : -x;
  return write(reg, r, v & mask(r.width));
}

/** Bytes (0 = lowest) covered by a part. */
const bytesOf = (r: RegRef) => Array.from({ length: r.width / 8 }, (_, i) => i + r.shift / 8);

const bits = (v: bigint, w: Width) => v.toString(2).padStart(w, "0").replace(/(.{4})(?=.)/g, "$1 ");

export function RegisterFigure({ t }: { t?: TrackTranslations }) {
  const [fam, setFam] = useState<Family>("rax");
  const [part, setPart] = useState("eax");
  const [reg, setReg] = useState(START);
  const [prev, setPrev] = useState(START);
  const [last, setLast] = useState<string | null>(null);
  const r = regRef(part)!;
  const parts = PARTS[fam].map(n => regRef(n)!);

  const run = (op: Op, label: string) => {
    setPrev(reg);
    setReg(apply(op, reg, r));
    setLast(label.replace("{r}", part));
  };
  const reset = () => { setPrev(START); setReg(START); setLast(null); };
  const pickFam = (f: Family) => { setFam(f); setPart(PARTS[f][1]); reset(); };

  const byte = (v: bigint, i: number) => Number((v >> BigInt(8 * i)) & BigInt(255));
  const value = read(reg, r);
  const sv = signed(value, r.width);

  // Bars: one row per part, placed under the bytes it covers (byte 7 is the leftmost column)
  const rows = parts.reduce<RegRef[][]>((acc, p) => {
    const row = acc.find(rw => rw.every(q => bytesOf(q).every(b => !bytesOf(p).includes(b))));
    if (row && p.width === 8) row.push(p); else acc.push([p]);
    return acc;
  }, []);

  return (
    <Figure
      title={tx(t, "figAsmReg_title", "One register, many names")}
      head={<Choice value={fam} onChange={pickFam} options={[["rax", "rax"], ["rsi", "rsi"], ["r8", "r8"]]} />}
      controls={<>
        {/* inline wrap: on phones figure.css would turn a .flex-wrap row into a sideways slider */}
        <div className="flex gap-1.5 items-center" style={{ flexWrap: "wrap" }}>
          {OPS.map(([op, label]) => (
            <Btn key={op} onClick={() => run(op, label)}><span className="font-mono normal-case">{label.replace("{r}", part)}</span></Btn>
          ))}
          <Btn onClick={reset}>{tx(t, "figAsmReg_reset", "reset")}</Btn>
        </div>
        <Row>
          <Readout>{part} = 0x{value.toString(16).padStart(r.width / 4, "0")}</Readout>
          <Readout>{tx(t, "figAsmReg_unsigned", "unsigned")}: {value.toString()}</Readout>
          <Readout color={sv < B0 ? C.orange : undefined}>{tx(t, "figAsmReg_signed", "signed")}: {sv.toString()}</Readout>
        </Row>
      </>}
      note={tx(t, "figAsmReg_note", "Choose a part by clicking its bar, then run an instruction on it. Watch which bytes change: an 8- or 16-bit write keeps the other bytes, a 32-bit write clears the top four.")}
    >
      <div className="p-3 sm:p-5 flex flex-col gap-3">
        {/* ── The 8 bytes ── */}
        <div className="grid grid-cols-8 gap-1">
          {[7, 6, 5, 4, 3, 2, 1, 0].map(i => {
            const changed = byte(reg, i) !== byte(prev, i);
            const inPart = bytesOf(r).includes(i);
            return (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span className="font-mono text-[9.5px] text-[var(--text-muted)]">{tx(t, "figAsmReg_byte", "byte")} {i}</span>
                <span className="w-full text-center font-mono text-[15px] sm:text-[18px] py-1.5 rounded-md border"
                  style={{
                    borderColor: changed ? C.amber : inPart ? "var(--primary)" : "var(--code-border)",
                    borderWidth: changed ? 2 : 1,
                    background: inPart ? "var(--primary-low)" : "var(--code-surface)",
                    color: changed ? C.amber : "var(--text-main)", fontWeight: changed ? 700 : 400,
                  }}>
                  {byte(reg, i).toString(16).padStart(2, "0")}
                </span>
                <span className="font-mono text-[9px] text-[var(--text-muted)] hidden sm:block">{(i * 8 + 7)}–{i * 8}</span>
              </div>
            );
          })}
        </div>

        {/* ── Names of the parts ── */}
        <div className="flex flex-col gap-1">
          {rows.map((row, k) => (
            <div key={k} className="grid grid-cols-8 gap-1">
              {row.map(p => {
                const bs = bytesOf(p);
                const from = 8 - Math.max(...bs), span = bs.length;
                const on = p.name === part;
                return (
                  <button key={p.name} type="button" onClick={() => setPart(p.name)}
                    style={{ gridColumn: `${from} / span ${span}` }}
                    className={`font-mono text-[11.5px] rounded-md border py-1 transition-colors ${on
                      ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-low)] font-bold"
                      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`}>
                    {p.name}{p.width > 8 && <span className="opacity-60"> · {p.width}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="font-mono text-[11px] text-[var(--text-muted)] break-all leading-relaxed">
          {part} = {bits(value, r.width)}
        </div>
        <p className="text-[13px] min-h-[2.6rem] text-[var(--text-main)]" aria-live="polite">
          {last
            ? <><span className="font-mono">{last}</span>{" — "}{r.width === 32
                ? tx(t, "figAsmReg_wrote32", "a 32-bit write: the top 4 bytes of the register were set to zero.")
                : r.width === 64 ? tx(t, "figAsmReg_wrote64", "a 64-bit write: all 8 bytes are replaced.")
                : tx(t, "figAsmReg_wroteSmall", "an 8- or 16-bit write: every byte outside the part kept its value.")}</>
            : tx(t, "figAsmReg_start", "The register starts as 0x1122334455667788, so each byte is easy to tell apart.")}
        </p>
      </div>
    </Figure>
  );
}
