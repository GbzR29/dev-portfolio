"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// bits      — the 32 bits of an IEEE 754 single-precision float. Click a bit to
//             flip it, or type a number. The value is
//             (−1)^sign × 2^(exponent − 127) × 1.mantissa (normal numbers).
// precision — how far apart neighbouring floats are at a given magnitude (the
//             ULP), and what happens when a small step is added to a large
//             position: x + step rounds to the nearest float.

const buf = new DataView(new ArrayBuffer(4));
const toBits = (f: number) => { buf.setFloat32(0, f); return buf.getUint32(0); };
const fromBits = (b: number) => { buf.setUint32(0, b >>> 0); return buf.getFloat32(0); };
/** Distance to the next float up from |x|. */
const ulp = (x: number) => { const f = Math.abs(Math.fround(x)); return fromBits(toBits(f) + 1) - f; };

function fmt(v: number) {
  if (!Number.isFinite(v)) return Number.isNaN(v) ? "NaN" : v > 0 ? "+∞" : "−∞";
  if (v === 0) return Object.is(v, -0) ? "−0" : "0";
  const a = Math.abs(v);
  return a >= 1e7 || a < 1e-4 ? v.toExponential(8) : v.toPrecision(10).replace(/\.?0+$/, "");
}

export function FloatFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<"bits" | "precision">("bits");
  const [bits, setBits] = useState(toBits(0.1));
  const [text, setText] = useState("0.1");
  const [mag, setMag] = useState(5);              // log10 of the position
  const [stepMm, setStepMm] = useState(1);        // step in millimetres

  const v = fromBits(bits);
  const sign = bits >>> 31, exp = (bits >>> 23) & 0xff, man = bits & 0x7fffff;
  const flip = (i: number) => { const nb = (bits ^ (1 << i)) >>> 0; setBits(nb); setText(fmt(fromBits(nb))); };
  const kind = exp === 255 ? (man ? "NaN" : tx(t, "figFloat_inf", "infinity")) : exp === 0 ? (man ? tx(t, "figFloat_sub", "subnormal") : tx(t, "figFloat_zero", "zero")) : tx(t, "figFloat_normal", "normal");

  const W = 560, bw = (W - 40) / 32;
  const cellCol = (i: number) => (i === 31 ? C.red : i >= 23 ? C.amber : C.sky);

  // precision mode
  const x = 10 ** mag, u = ulp(x), step = stepMm / 1000;
  const moved = Math.fround(Math.fround(x) + step) - Math.fround(x);

  return (
    <Figure
      title={tx(t, "figFloat_title", "Inside a 32-bit float")}
      head={<Choice value={mode} onChange={setMode} options={[["bits", tx(t, "figFloat_bits", "bits")], ["precision", tx(t, "figFloat_prec", "precision far away")]] as const} />}
      controls={mode === "bits" ? <>
        <Row>
          <input value={text} onChange={e => { setText(e.target.value); const n = Number(e.target.value); if (e.target.value.trim() !== "" && !Number.isNaN(n)) setBits(toBits(n)); }}
            className="w-40 px-2 py-1 text-[12px] font-mono rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-main)]" />
          {["0.1", "1", "-2.5", "0.75", "16777217", "1e-40", "3.4e38"].map(s => (
            <Btn key={s} onClick={() => { setText(s); setBits(toBits(Number(s))); }}>{s}</Btn>
          ))}
        </Row>
        <Row>
          <Readout color={C.red}>sign = {sign}</Readout>
          <Readout color={C.amber}>{tx(t, "figFloat_exp", "exponent")} = {exp} → 2^{exp === 0 ? -126 : exp - 127}</Readout>
          <Readout color={C.sky}>{tx(t, "figFloat_man", "mantissa")} = 1 + {man}/2²³ = {exp === 0 ? (man / 2 ** 23).toFixed(8) : (1 + man / 2 ** 23).toFixed(8)}</Readout>
          <Readout>{kind}</Readout>
        </Row>
      </> : <>
        <Slider label={tx(t, "figFloat_pos", "position x")} value={mag} min={0} max={8} step={0.25} onChange={setMag} fmt={v => `10^${v}`} width="w-28" />
        <Slider label={tx(t, "figFloat_step", "step per frame")} value={stepMm} min={0.1} max={100} step={0.1} onChange={setStepMm} fmt={v => `${v} mm`} width="w-28" />
        <Row>
          <Readout>x = {x.toExponential(2)} m</Readout>
          <Readout color={C.amber}>{tx(t, "figFloat_gap", "gap to next float")} = {u < 1e-3 ? `${(u * 1e6).toPrecision(3)} µm` : u < 1 ? `${(u * 1000).toPrecision(3)} mm` : `${u} m`}</Readout>
          <Readout color={moved === 0 ? C.red : Math.abs(moved - step) / step > 0.05 ? C.amber : C.green}>
            {tx(t, "figFloat_moved", "actually moved")} = {(moved * 1000).toPrecision(4)} mm
          </Readout>
        </Row>
      </>}
      note={mode === "bits"
        ? tx(t, "figFloat_noteBits", "Click any bit. The sign bit (red) flips the sign. The 8 exponent bits (amber) store a power of two plus 127, so 127 means 2⁰ = 1. The 23 mantissa bits (blue) are the fraction after an implicit leading 1: the stored number is 1.xxxx in binary, times the power of two. 0.1 has no exact binary form (like 1/3 in decimal), so the stored value is slightly off. 16777217 = 2²⁴ + 1 is the first integer a float cannot hold: it needs 25 significant bits. Setting the exponent to 0 gives subnormals (tiny numbers without the implicit 1); all ones gives infinity or NaN.")
        : tx(t, "figFloat_notePrec", "A float has 24 significant bits wherever the number is, so the gap between neighbouring floats grows with the magnitude: about 0.00000012 near 1, but about 8 mm at 100 km and 1 m at 10 000 km. Move the position up and keep the step at 1 mm per frame: from about 16 km the gap is ~2 mm and every step rounds up to 2 mm (twice too fast); past about 33 km (2¹⁵ m) the step is less than half a gap, x + step rounds back to x, and the character cannot move at all. This is why large open-world games move the world's origin with the player, or use doubles for positions.")}
    >
      {mode === "bits" ? (
        <svg viewBox={`0 0 ${W} 120`} className="w-full h-auto">
          {Array.from({ length: 32 }, (_, k) => {
            const i = 31 - k, on = (bits >>> i) & 1;
            return (
              <g key={i} onClick={() => flip(i)} style={{ cursor: "pointer" }}>
                <rect x={20 + k * bw + 1} y={30} width={bw - 2} height={34} rx={3} fill={cellCol(i)} fillOpacity={on ? 0.85 : 0.12} stroke={cellCol(i)} strokeOpacity={0.6} />
                <text x={20 + k * bw + bw / 2} y={52} fontSize={12} textAnchor="middle" fontFamily="monospace" fill={on ? "#0b1220" : "var(--text-muted)"} fontWeight={700} pointerEvents="none">{on}</text>
                <text x={20 + k * bw + bw / 2} y={76} fontSize={7} textAnchor="middle" fontFamily="monospace" fill="var(--code-gutter)" pointerEvents="none">{i}</text>
              </g>
            );
          })}
          <T x={20 + bw / 2} y={22} size={9} anchor="middle" color={C.red}>s</T>
          <T x={20 + bw * 5} y={22} size={9} anchor="middle" color={C.amber}>{tx(t, "figFloat_expLbl", "exponent (8)")}</T>
          <T x={20 + bw * 20.5} y={22} size={9} anchor="middle" color={C.sky}>{tx(t, "figFloat_manLbl", "mantissa / fraction (23)")}</T>
          <T x={20} y={104} size={11} color={C.fg} bold>{`= ${fmt(v)}`}</T>
          <T x={W - 20} y={104} size={9} anchor="end">{`0x${bits.toString(16).padStart(8, "0").toUpperCase()}`}</T>
        </svg>
      ) : (
        <svg viewBox={`0 0 ${W} 120`} className="w-full h-auto">
          {/* a 10 cm window starting at x, with every representable float drawn as a tick */}
          <T x={20} y={20} size={9}>{tx(t, "figFloat_window", "every float between x and x + 10 cm")}</T>
          <line x1={20} x2={W - 20} y1={70} y2={70} stroke={C.axis} />
          {(() => {
            const span = 0.1, n = span / u;
            if (n > 400) return <rect x={20} y={56} width={W - 40} height={28} fill={C.sky} opacity={0.35} />;
            return Array.from({ length: Math.floor(n) + 1 }, (_, k) => <line key={k} x1={20 + (k / n) * (W - 40)} x2={20 + (k / n) * (W - 40)} y1={58} y2={82} stroke={C.sky} strokeWidth={1.3} />);
          })()}
          {/* intended position after 10 steps vs actual */}
          {(() => {
            let pos = Math.fround(x);
            for (let i = 0; i < 10; i++) pos = Math.fround(pos + step);
            const want = Math.min(0.1, step * 10), got = Math.min(0.1, pos - Math.fround(x));
            const X = (d: number) => 20 + (d / 0.1) * (W - 40);
            return <>
              <circle cx={X(want)} cy={70} r={6} fill="none" stroke={C.green} strokeWidth={2} />
              <circle cx={X(got)} cy={70} r={4} fill={C.red} />
              <T x={X(want)} y={100} size={8.5} anchor="middle" color={C.green}>{tx(t, "figFloat_want", "intended after 10 steps")}</T>
              <T x={X(got)} y={45} size={8.5} anchor="middle" color={C.red}>{tx(t, "figFloat_got", "actual")}</T>
            </>;
          })()}
        </svg>
      )}
    </Figure>
  );
}
