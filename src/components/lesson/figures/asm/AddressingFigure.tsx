"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, Readout, Row, Slider } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The general x86 memory operand, [base + index*scale + disp], over real bytes:
// rbx holds the address of an int array (nums, 8 × 4 bytes) followed by two
// more variables. Choose the index, the scale, the displacement and how many
// bytes to read; the figure works out the address, lights the bytes the
// instruction reads and assembles them little-endian into the register.
// With lea nothing is read: the register gets the address itself. Scale 3 is
// there to break it: NASM refuses it with the real error message.

const BASE = 0x402000;
const INTS = [10, 20, 30, 40, 50, 60, 70, 80, 0, 8];
const LABELS = ["nums[0]", "nums[1]", "nums[2]", "nums[3]", "nums[4]", "nums[5]", "nums[6]", "nums[7]", "total", "count"];
const BYTES = INTS.flatMap(v => [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]);

type Size = "byte" | "dword" | "qword";
const SIZE_BYTES: Record<Size, number> = { byte: 1, dword: 4, qword: 8 };
const DEST: Record<Size, string> = { byte: "al", dword: "eax", qword: "rax" };
const LABEL = "text-[11px] text-[var(--text-muted)] w-[5.8rem] shrink-0";

export function AddressingFigure({ t }: { t?: TrackTranslations }) {
  const [index, setIndex] = useState(2);
  const [scale, setScale] = useState("4");
  const [disp, setDisp] = useState("0");
  const [size, setSize] = useState<Size>("dword");
  const [op, setOp] = useState<"mov" | "lea">("mov");

  const sc = Number(scale), d = Number(disp);
  const invalid = sc === 3;
  const addr = BASE + index * sc + d;
  const off = addr - BASE;
  const n = op === "lea" ? 0 : SIZE_BYTES[size];
  const inside = off >= 0 && off + n <= BYTES.length;
  const reads = new Set(op === "mov" && !invalid ? Array.from({ length: n }, (_, k) => off + k) : []);

  // Little-endian: byte k of the value is worth 256^k
  let value = BigInt(0);
  if (inside) for (let k = n - 1; k >= 0; k--) value = (value << BigInt(8)) | BigInt(BYTES[off + k]);

  const dest = op === "lea" ? "rax" : DEST[size];
  const dispTxt = d === 0 ? "" : d > 0 ? ` + ${d}` : ` - ${-d}`;
  const operand = `[rbx + rcx*${sc}${dispTxt}]`;
  const instr = op === "lea" ? `lea rax, ${operand}` : `mov ${dest}, ${operand}`;
  const hx = (v: number) => "0x" + v.toString(16);

  return (
    <Figure
      title={tx(t, "figAsmAddr_title", "base + index × scale + displacement")}
      head={<Choice value={op} onChange={setOp} options={[["mov", "mov"], ["lea", "lea"]]} />}
      controls={<>
        <Slider label="rcx" value={index} min={0} max={9} step={1} onChange={v => setIndex(Math.round(v))} fmt={v => String(Math.round(v))} />
        <Row>
          <span className={LABEL}>{tx(t, "figAsmAddr_scale", "scale")}</span>
          <Choice value={scale} onChange={setScale} options={[["1", "1"], ["2", "2"], ["4", "4"], ["8", "8"], ["3", "3"]]} />
        </Row>
        <Row>
          <span className={LABEL}>{tx(t, "figAsmAddr_disp", "displacement")}</span>
          <Choice value={disp} onChange={setDisp} options={[["-4", "-4"], ["0", "0"], ["1", "1"], ["4", "4"], ["8", "8"]]} />
        </Row>
        {op === "mov" && (
          <Row>
            <span className={LABEL}>{tx(t, "figAsmAddr_size", "size")}</span>
            <Choice value={size} onChange={setSize} options={[["byte", "byte"], ["dword", "dword"], ["qword", "qword"]]} />
          </Row>
        )}
        <Row>
          <Readout>rbx = {hx(BASE)}</Readout>
          <Readout>rcx = {index}</Readout>
        </Row>
      </>}
      note={tx(t, "figAsmAddr_note", "The scale can only be 1, 2, 4 or 8, the sizes of the basic types. Try 3, and a displacement of 1 to read an int that straddles two elements.")}
    >
      <div className="p-3 sm:p-5 flex flex-col gap-4">
        <div className="font-mono text-[14px] sm:text-[15px] text-[var(--text-main)]">{instr}</div>

        {invalid ? (
          <div className="font-mono text-[12.5px] rounded-lg border px-3 py-2" style={{ borderColor: C.red, color: C.red }}>
            prog.asm:12: error: invalid 64-bit effective address
            <p className="font-sans text-[12.5px] mt-1.5 text-[var(--text-main)]">
              {tx(t, "figAsmAddr_bad3", "The encoding only has two bits for the scale, so it can be 1, 2, 4 or 8. NASM can fake [rcx*3] alone as [rcx + rcx*2], but here rbx already takes the base, and an address can hold only two registers.")}
            </p>
          </div>
        ) : (
          <div className="font-mono text-[12.5px] text-[var(--text-muted)]">
            {hx(BASE)} + {index} × {sc}{d !== 0 ? (d > 0 ? ` + ${d}` : ` − ${-d}`) : ""} = <span className="text-[var(--text-main)] font-bold">{hx(addr)}</span>
            {off >= 0 && off < BYTES.length && (
              <span>{"  "}({tx(t, "figAsmAddr_offset", "offset")} {off}{off % 4 === 0 ? `: ${LABELS[off / 4]}` : ""})</span>
            )}
          </div>
        )}

        {/* ── Memory: 10 ints, 4 bytes each, lowest address first ── */}
        <div className="grid grid-cols-5 gap-x-1.5 gap-y-3 justify-items-center">
          {INTS.map((v, j) => (
            <div key={j} className="flex flex-col items-center gap-0.5">
              <div className="flex">
                {[0, 1, 2, 3].map(k => {
                  const i = 4 * j + k;
                  const on = reads.has(i);
                  const at = !invalid && i === off;
                  return (
                    <span key={k} className="font-mono text-[10.5px] w-[15px] sm:w-[17px] text-center py-1 border-y border-r first:border-l"
                      style={{
                        background: on ? C.sky + "33" : "var(--code-surface)",
                        borderColor: on ? C.sky : "var(--code-border)",
                        color: on ? "var(--text-main)" : "var(--text-muted)",
                        boxShadow: at ? `inset 0 -3px 0 ${C.amber}` : undefined,
                      }}>
                      {BYTES[i].toString(16).padStart(2, "0")}
                    </span>
                  );
                })}
              </div>
              <span className="font-mono text-[12px] text-[var(--text-main)]">{v}</span>
              <span className="font-mono text-[9.5px] text-[var(--text-muted)]">{LABELS[j]}</span>
            </div>
          ))}
        </div>

        {!invalid && (
          <div className="font-mono text-[13px] text-[var(--text-main)]" aria-live="polite">
            {op === "lea"
              ? <>rax = {hx(addr)} <span className="text-[var(--text-muted)] font-sans text-[12.5px]">— {tx(t, "figAsmAddr_lea", "lea stops after the arithmetic: no byte of memory is read.")}</span></>
              : inside
                ? <>{dest} = 0x{value.toString(16).padStart(n * 2, "0")} = {value.toString()} <span className="text-[var(--text-muted)] font-sans text-[12.5px]">— {n > 1
                    ? tx(t, "figAsmAddr_le", "the bytes read from right to left: the first byte in memory is the lowest one.")
                    : tx(t, "figAsmAddr_one", "a single byte.")}</span></>
                : <span style={{ color: C.orange }}>{tx(t, "figAsmAddr_outside", "That address is outside what is drawn. In a real program it reads whatever lives there, or crashes if nothing is mapped.")}</span>}
          </div>
        )}
      </div>
    </Figure>
  );
}
