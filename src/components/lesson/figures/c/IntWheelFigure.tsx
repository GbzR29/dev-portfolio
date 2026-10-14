"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, T } from "@/components/lesson/kit/figure";
import { PHONE, useMediaQuery } from "@/components/lesson/kit/media";

// ── What this figure shows ────────────────────────────────────────────────────
// An 8-bit model of int and unsigned int. The same 8 bits are read two ways:
// unsigned (0…255) or signed in two's complement (−128…127, the top bit
// weighs −128). The wheel puts all 256 patterns on a circle, so adding 1 is a
// step clockwise and the end of the range is a seam. Unsigned arithmetic
// crosses its seam (255 → 0) by definition: it is arithmetic modulo 256.
// Signed arithmetic crossing its seam (127 → −128) is undefined behaviour in
// C. A real int has 32 bits and its seam at 2 147 483 647, but the rules are
// the same.

type Mode = "unsigned" | "signed";
const CX = 130, CY = 128, R = 92;
const signedOf = (raw: number) => (raw >= 128 ? raw - 256 : raw);
const angle = (raw: number) => (raw / 256) * 2 * Math.PI;          // 0 at the top, clockwise
const at = (raw: number, r: number) => ({ x: CX + r * Math.sin(angle(raw)), y: CY - r * Math.cos(angle(raw)) });

export function IntWheelFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("unsigned");
  const [raw, setRaw] = useState(250);
  const [event, setEvent] = useState<"none" | "wrap" | "ub">("none");
  const phone = useMediaQuery(PHONE);

  const value = mode === "unsigned" ? raw : signedOf(raw);
  const add = (d: number) => {
    const next = (((raw + d) % 256) + 256) % 256;
    const crossed = mode === "unsigned" ? raw + d > 255 || raw + d < 0 : signedOf(raw) + d > 127 || signedOf(raw) + d < -128;
    setEvent(crossed ? (mode === "unsigned" ? "wrap" : "ub") : "none");
    setRaw(next);
  };
  const choose = (m: Mode) => { setMode(m); setEvent("none"); };

  const seam = mode === "unsigned" ? 0 : 128;                      // where the range ends and starts again
  const seamCol = mode === "unsigned" ? C.amber : C.red;
  const tip = at(raw, R - 14);
  const bits = Array.from({ length: 8 }, (_, i) => (raw >> (7 - i)) & 1);
  const weight = (i: number) => (i === 0 && mode === "signed" ? -128 : 1 << (7 - i));

  const message = event === "wrap"
    ? tx(t, "figCInt_wrap", "Wrapped around the seam. For unsigned types this is defined: the result is taken modulo 2⁸ = 256, so 255 + 1 = 0. Hashes, checksums and random-number generators rely on it.")
    : event === "ub"
      ? tx(t, "figCInt_ub", "Signed overflow: the result does not fit. The processor would quietly give the wrapped value, but in C this is undefined behaviour, so the compiler may assume it never happens and optimise on that assumption. Your program no longer has a defined meaning.")
      : tx(t, "figCInt_idle", "Add or subtract until you cross the seam (the coloured mark), first in unsigned mode, then in signed mode.");

  return (
    <Figure
      title={tx(t, "figCInt_title", "Eight bits, two readings: where integers overflow")}
      head={<Choice value={mode} onChange={choose} options={[["unsigned", tx(t, "figCInt_unsigned", "unsigned")], ["signed", tx(t, "figCInt_signed", "signed")]] as const} />}
      controls={<>
        <Row>
          <Btn onClick={() => add(-16)}>− 16</Btn>
          <Btn onClick={() => add(-1)}>− 1</Btn>
          <Btn onClick={() => add(1)}>+ 1</Btn>
          <Btn onClick={() => add(16)}>+ 16</Btn>
        </Row>
        <Row>
          <Readout>{tx(t, "figCInt_range", "range")}: {mode === "unsigned" ? "0 … 255" : "−128 … 127"}</Readout>
          <Readout>hex: 0x{raw.toString(16).padStart(2, "0")}</Readout>
          <Readout color={event === "ub" ? C.red : event === "wrap" ? C.amber : undefined}>
            {event === "ub" ? tx(t, "figCInt_ubShort", "undefined behaviour") : event === "wrap" ? tx(t, "figCInt_wrapShort", "wrapped (defined)") : tx(t, "figCInt_ok", "in range")}
          </Readout>
        </Row>
        <p className="text-[13px] leading-relaxed text-[var(--text-main)]" aria-live="polite">{message}</p>
      </>}
      note={tx(t, "figCInt_note", "This is an 8-bit model so the wheel stays readable. A real int has 32 bits: the signed seam is at 2 147 483 647 → −2 147 483 648 and the unsigned one at 4 294 967 295 → 0. The rules are the same.")}
    >
      <svg viewBox={phone ? "0 0 340 455" : "0 0 600 256"} className="w-full h-auto">
        <g transform={phone ? "translate(40, 0)" : undefined}>
        {/* The wheel: 256 patterns, a tick every 16 */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--code-border)" strokeWidth={10} />
        {Array.from({ length: 16 }, (_, k) => {
          const a = at(k * 16, R - 8), b = at(k * 16, R + 8);
          return <line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.axis} />;
        })}
        {[0, 64, 128, 192].map(k => {
          const p = at(k, R + 24);
          const label = mode === "unsigned" ? String(k) : String(signedOf(k));
          return <T key={k} x={p.x} y={p.y + 4} size={10} anchor="middle">{label}</T>;
        })}
        {/* The seam between the largest and the smallest value */}
        {(() => {
          const a = at(seam, R - 13), b = at(seam, R + 13), l = at(seam, R + 40);
          return <g>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={seamCol} strokeWidth={3} />
            <T x={l.x} y={l.y + (seam === 0 ? -2 : 8)} size={9} anchor="middle" color={seamCol} bold>
              {mode === "unsigned" ? "255 | 0" : "127 | −128"}
            </T>
          </g>;
        })()}
        {/* Needle */}
        <line x1={CX} y1={CY} x2={tip.x} y2={tip.y} stroke={C.sky} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={tip.x} cy={tip.y} r={6} fill={event === "ub" ? C.red : C.sky} />
        <circle cx={CX} cy={CY} r={4} fill={C.sky} />
        <T x={CX} y={CY + 30} size={22} anchor="middle" color={C.fg} bold>{String(value)}</T>
        </g>

        {/* The same pattern as bits: beside the wheel, or under it on a phone */}
        <g transform={phone ? "translate(-260, 240)" : undefined}>
        <T x={290} y={52} size={10}>{tx(t, "figCInt_bits", "the 8 bits in memory")}</T>
        {bits.map((b, i) => (
          <g key={i}>
            <rect x={290 + i * 36} y={62} width={32} height={34} rx={4} fill={b ? "var(--primary-low)" : "var(--code-surface)"}
              stroke={b ? C.sky : "var(--code-border)"} />
            <T x={306 + i * 36} y={85} size={15} anchor="middle" color={C.fg} bold>{String(b)}</T>
            <T x={306 + i * 36} y={112} size={8.5} anchor="middle" color={i === 0 && mode === "signed" ? C.red : C.muted}>{String(weight(i))}</T>
          </g>
        ))}
        <T x={290} y={140} size={10}>{tx(t, "figCInt_sum", "value = sum of the weights of the 1 bits")}</T>
        <T x={290} y={160} size={11} color={C.fg}>
          {bits.map((b, i) => (b ? weight(i) : null)).filter(v => v !== null).join(" + ").replace(/\+ -/g, "− ") || "0"}
          {` = ${value}`}
        </T>
        {mode === "signed" && <>
          <T x={290} y={190} size={9.5} color={C.red}>{tx(t, "figCInt_twos1", "in signed mode the top bit weighs −128")}</T>
          <T x={290} y={205} size={9.5} color={C.red}>{tx(t, "figCInt_twos2", "(two's complement)")}</T>
        </>}
        </g>
      </svg>
    </Figure>
  );
}
