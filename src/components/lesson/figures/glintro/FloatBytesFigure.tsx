"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// float vertices[9] as the bytes glBufferData copies: 9 floats × 4 bytes = 36
// bytes, each float stored as its IEEE-754 bit pattern, least significant byte
// first (little-endian). Clicking a float shows its four bytes. The "pointer"
// mode reproduces the classic bug: the array was passed into a function as a
// float*, so sizeof gives the pointer's 8 bytes and only two floats are
// uploaded; the draw then reads past the end of an 8-byte buffer.

const DATA = [-0.5, -0.5, 0.0, 0.5, -0.5, 0.0, 0.0, 0.5, 0.0];
const NAMES = ["v0.x", "v0.y", "v0.z", "v1.x", "v1.y", "v1.z", "v2.x", "v2.y", "v2.z"];
const VCOL = [C.red, C.green, C.blue];

/** The four bytes of a 32-bit float, in memory order (little-endian). */
function bytesOf(f: number) {
  const dv = new DataView(new ArrayBuffer(4));
  dv.setFloat32(0, f, true);
  return [0, 1, 2, 3].map(i => dv.getUint8(i));
}
const hex = (b: number) => b.toString(16).toUpperCase().padStart(2, "0");

const W = 620, BW = 16, BX = 20;

export function FloatBytesFigure({ t }: { t?: TrackTranslations }) {
  const [sel, setSel] = useState(3);
  const [bug, setBug] = useState(false);
  const size = bug ? 8 : 36;
  const bytes = DATA.flatMap(bytesOf);
  const b = bytesOf(DATA[sel]);
  const bits = new Uint32Array(new Float32Array([DATA[sel]]).buffer)[0];

  return (
    <Figure
      title={tx(t, "figGlBytes_title", "A vertex array is just bytes")}
      head={<>
        <Btn active={!bug} onClick={() => setBug(false)}>sizeof(vertices) = 36</Btn>
        <Btn active={bug} onClick={() => setBug(true)}>{tx(t, "figGlBytes_bug", "sizeof(pointer) = 8 (bug)")}</Btn>
      </>}
      controls={<>
        <Row>
          <Readout color={VCOL[Math.floor(sel / 3)]}>{NAMES[sel]} = {DATA[sel].toFixed(1)}f</Readout>
          <Readout>{tx(t, "figGlBytes_bits", "bits")} 0x{bits.toString(16).toUpperCase().padStart(8, "0")}</Readout>
          <Readout>{tx(t, "figGlBytes_mem", "in memory")}: {b.map(hex).join(" ")}</Readout>
          <Readout>{tx(t, "figGlBytes_offset", "byte offset")} {sel * 4}…{sel * 4 + 3}</Readout>
        </Row>
        <p className="text-[12.5px] leading-relaxed" style={{ color: bug ? C.red : "var(--text-main)" }}>
          {bug
            ? tx(t, "figGlBytes_bugText", "Inside a function that received the array as float* vertices, sizeof(vertices) is the size of the pointer, 8 bytes, not the array. glBufferData creates an 8-byte buffer holding only v0.x and v0.y. glDrawArrays(GL_TRIANGLES, 0, 3) still reads 36 bytes: 28 of them lie past the end of the buffer, which is undefined behaviour. Usually the triangle vanishes or collapses to a sliver. Pass the byte count explicitly: count * sizeof(float).")
            : tx(t, "figGlBytes_okText", "glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW) copies exactly these 36 bytes. The buffer does not know they are floats, or that every three form a vertex: that description comes from glVertexAttribPointer, in the next chapter.")}
        </p>
      </>}
      note={tx(t, "figGlBytes_note", "Click a float to see its bytes. A float is stored as a 32-bit IEEE-754 pattern (sign, exponent, fraction; the Math track's floating-point chapter takes it apart), written here in hexadecimal, and on every desktop and phone CPU its least significant byte comes first in memory (little-endian). That is why 0.5, whose bits are 0x3F000000, appears as 00 00 00 3F. Every value in a VBO is like this: a run of bytes at an offset that the shader only understands because you told OpenGL the layout.")}
    >
      <svg viewBox={`0 0 ${W} 190`} className="w-full h-auto" role="img">
        <T x={BX} y={16} size={9} bold color={C.fg}>float vertices[9]  ({tx(t, "figGlBytes_cpu", "C++ array in RAM")})</T>
        {DATA.map((v, i) => {
          const x = BX + i * 64, on = i === sel;
          return (
            <g key={i} onClick={() => setSel(i)} style={{ cursor: "pointer" }}>
              <rect x={x} y={24} width={60} height={34} rx={4} fill={VCOL[Math.floor(i / 3)]} fillOpacity={on ? 0.45 : 0.15}
                stroke={on ? C.amber : VCOL[Math.floor(i / 3)]} strokeWidth={on ? 2 : 1} />
              <T x={x + 30} y={39} size={10} anchor="middle" bold color={C.fg}>{v.toFixed(1)}</T>
              <T x={x + 30} y={52} size={7.5} anchor="middle">{NAMES[i]}</T>
            </g>
          );
        })}
        <T x={BX} y={92} size={9} bold color={C.fg}>
          {tx(t, "figGlBytes_gpu", "the buffer object")}: {size} bytes {bug && <tspan fill={C.red}>({tx(t, "figGlBytes_short", "too short")})</tspan>}
        </T>
        {bytes.map((v, i) => {
          const x = BX + i * BW + Math.floor(i / 4) * 0, inBuf = i < size, mine = Math.floor(i / 4) === sel;
          return (
            <g key={i}>
              <rect x={x} y={100} width={BW - 1.5} height={26} rx={2}
                fill={inBuf ? VCOL[Math.floor(i / 12)] : C.axis} fillOpacity={inBuf ? (mine ? 0.55 : 0.2) : 0.12}
                stroke={mine ? C.amber : "none"} strokeWidth={1.5} strokeDasharray={inBuf ? undefined : "3 2"} />
              <T x={x + (BW - 1.5) / 2} y={117} size={7.4} anchor="middle" color={inBuf ? C.fg : C.muted}>{inBuf ? hex(v) : "??"}</T>
              {i % 4 === 0 && <T x={x} y={140} size={7}>{i}</T>}
            </g>
          );
        })}
        {/* float → its bytes */}
        <path d={`M${BX + sel * 64 + 30} 58 L${BX + sel * 64 + 30} 70 L${BX + sel * 4 * BW + 2 * BW} 88 L${BX + sel * 4 * BW + 2 * BW} 98`}
          fill="none" stroke={C.amber} strokeWidth={1.4} />
        {bug && <T x={BX + 8 * BW + 4} y={160} size={8.5} color={C.red}>{tx(t, "figGlBytes_past", "← the draw call reads these 28 bytes past the end of the buffer")}</T>}
        {!bug && <T x={BX} y={160} size={8.5}>3 {tx(t, "figGlBytes_verts", "vertices")} × 3 floats × 4 bytes = 36 bytes</T>}
      </svg>
    </Figure>
  );
}
