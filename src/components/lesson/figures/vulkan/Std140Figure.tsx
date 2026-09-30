"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Readout, Row, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A uniform block laid out twice, as bytes in rows of 16: on the left as the
// shader reads it (std140 or std430), on the right as a C++ compiler lays out
// the "same" struct with GLM types. Padding is hatched. Members whose C++
// offset differs from the shader's are outlined in red: the shader would read
// the wrong bytes there, with no error. The alignas toggle applies the usual
// fix, which repairs vec2/vec3 members but not std140 scalar arrays.

type Ty = "float" | "vec2" | "vec3" | "vec4" | "mat4" | "farr";
type Field = { name: string; ty: Ty; n?: number };
type Rule = "std140" | "std430";
type Preset = "camera" | "light" | "trap" | "array" | "worked";

const PRESETS: Record<Preset, Field[]> = {
  camera: [{ name: "view", ty: "mat4" }, { name: "proj", ty: "mat4" }],
  light: [{ name: "position", ty: "vec3" }, { name: "intensity", ty: "float" }, { name: "color", ty: "vec3" }, { name: "radius", ty: "float" }],
  trap: [{ name: "time", ty: "float" }, { name: "dir", ty: "vec3" }],
  array: [{ name: "weights", ty: "farr", n: 4 }],
  worked: [{ name: "time", ty: "float" }, { name: "dir", ty: "vec3" }, { name: "uv", ty: "vec2" }, { name: "w", ty: "farr", n: 2 }],
};
const COLORS = [C.sky, C.amber, C.green, C.purple, C.pink];
const SIZE: Record<Ty, number> = { float: 4, vec2: 8, vec3: 12, vec4: 16, mat4: 64, farr: 4 };
const GLSL_TY: Record<Ty, string> = { float: "float", vec2: "vec2", vec3: "vec3", vec4: "vec4", mat4: "mat4", farr: "float" };
const CPP_TY: Record<Ty, string> = { float: "float", vec2: "glm::vec2", vec3: "glm::vec3", vec4: "glm::vec4", mat4: "glm::mat4", farr: "float" };

type Placed = { f: Field; off: number; stride: number; count: number; elem: number };
const alignUp = (o: number, a: number) => Math.ceil(o / a) * a;

/** Offsets of every member, the element stride of arrays, and the total size. */
function layout(fields: Field[], mode: Rule | "cpp" | "cppFixed") {
  let o = 0, maxA = 4;
  const placed: Placed[] = fields.map(f => {
    const n = f.n ?? 1;
    let a: number, stride = 0;
    if (mode === "cpp" || mode === "cppFixed") {
      a = mode === "cppFixed" && f.ty !== "farr" && f.ty !== "float" ? (f.ty === "vec2" ? 8 : 16) : 4;
      stride = f.ty === "farr" ? 4 : 0;
    } else if (f.ty === "farr") {
      a = mode === "std140" ? 16 : 4;
      stride = a;
    } else {
      a = f.ty === "float" ? 4 : f.ty === "vec2" ? 8 : 16;
    }
    maxA = Math.max(maxA, a);
    const off = alignUp(o, a);
    o = off + (f.ty === "farr" ? stride * n : SIZE[f.ty]);
    return { f, off, stride, count: f.ty === "farr" ? n : 1, elem: SIZE[f.ty] };
  });
  const structA = mode === "std140" ? alignUp(maxA, 16) : maxA;
  return { placed, size: alignUp(o, structA) };
}

const CELL = 54, CH = 20, GX = [62, 372], Y0 = 34;

export function Std140Figure({ t }: { t?: TrackTranslations }) {
  const [preset, setPreset] = useState<Preset>("worked");
  const [rule, setRule] = useState<Rule>("std140");
  const [fixed, setFixed] = useState(false);
  const L = (k: string, en: string) => tx(t, `figVkStd_${k}`, en);

  const fields = PRESETS[preset];
  const gl = layout(fields, rule), cpp = layout(fields, fixed ? "cppFixed" : "cpp");
  const bad = fields.map((_, i) => gl.placed[i].off !== cpp.placed[i].off || gl.placed[i].stride !== cpp.placed[i].stride);
  const rows = Math.ceil(Math.max(gl.size, cpp.size) / 16);
  const H = Y0 + rows * CH + 12;

  const column = (lay: ReturnType<typeof layout>, x0: number, isCpp: boolean) => {
    const owner: (number | null)[] = Array(rows * 4).fill(null);
    const label: (string | null)[] = Array(rows * 4).fill(null);
    lay.placed.forEach((p, i) => {
      for (let k = 0; k < p.count; k++) {
        const start = p.off + k * p.stride;
        for (let b = start; b < start + p.elem; b += 4) owner[b / 4] = i;
        label[start / 4] = p.f.ty === "farr" ? `${p.f.name}[${k}]` : p.f.name;
      }
    });
    return owner.map((o, c) => {
      const x = x0 + (c % 4) * CELL, y = Y0 + Math.floor(c / 4) * CH, inside = c * 4 < lay.size;
      const wrong = o !== null && isCpp && bad[o];
      return (
        <g key={c}>
          <rect x={x} y={y} width={CELL} height={CH}
            fill={o !== null ? COLORS[o % COLORS.length] : inside ? "url(#vkstd-pad)" : "transparent"}
            fillOpacity={o !== null ? 0.35 : 1} stroke={wrong ? C.red : inside || o !== null ? C.axis : C.grid}
            strokeWidth={wrong ? 1.6 : 0.6} strokeDasharray={inside || o !== null ? undefined : "2 3"} />
          {label[c] && <T x={x + 4} y={y + 13.5} size={8} color={C.fg} bold>{label[c]}</T>}
        </g>
      );
    });
  };

  return (
    <Figure
      title={L("title", "The same block, as the shader and as C++ see it")}
      head={<Choice value={preset} onChange={setPreset} options={[
        ["camera", "Camera"], ["light", "Light"], ["trap", "float + vec3"], ["array", "float[4]"], ["worked", L("worked", "worked example")],
      ] as const} />}
      controls={<>
        <Row>
          <Choice value={rule} onChange={setRule} options={[["std140", L("std140", "std140 (uniform)")], ["std430", L("std430", "std430 (storage, push constants)")]] as const} />
          <Btn active={fixed} onClick={() => setFixed(v => !v)}>alignas(16/8)</Btn>
        </Row>
        <Row>
          <Readout>{L("glslSize", "shader size")} {gl.size} B</Readout>
          <Readout color={gl.size !== cpp.size ? C.red : undefined}>sizeof {cpp.size} B</Readout>
          {fields.map((f, i) => (
            <Readout key={f.name} color={bad[i] ? C.red : C.green}>
              {f.name}: {gl.placed[i].off} / {cpp.placed[i].off}{f.ty === "farr" ? ` (stride ${gl.placed[i].stride} / ${cpp.placed[i].stride})` : ""} {bad[i] ? "✗" : "✓"}
            </Readout>
          ))}
        </Row>
        <pre className="text-[11px] leading-snug font-mono text-[var(--text-muted)] whitespace-pre-wrap">
          {fields.map(f => `${GLSL_TY[f.ty]} ${f.name}${f.n ? `[${f.n}]` : ""};`).join("  ")}{"\n"}
          {fields.map(f => `${fixed && f.ty !== "float" && f.ty !== "farr" ? `alignas(${f.ty === "vec2" ? 8 : 16}) ` : ""}${CPP_TY[f.ty]} ${f.name}${f.n ? `[${f.n}]` : ""};`).join("  ")}
        </pre>
      </>}
      note={L("note", "Each row is 16 bytes and each cell 4 bytes; hatching is padding. \"Light\" shows the good case: a float placed right after a vec3 fills the vec3's last 4 bytes in both layouts. \"float + vec3\" shows the classic bug: the shader starts dir at 16, C++ at 4. alignas fixes vec2 and vec3 members. \"float[4]\" cannot be fixed that way: in std140 every array element takes 16 bytes. Switch to std430, the layout of storage buffers and push constants, and the array packs to 4-byte steps like C++ does. The readouts give each member's offset as shader / C++.")}
    >
      <svg viewBox={`0 0 640 ${H}`} className="w-full h-auto" role="img">
        <defs>
          <pattern id="vkstd-pad" width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={5} stroke={C.axis} strokeWidth={1.4} />
          </pattern>
        </defs>
        <T x={GX[0]} y={16} size={9} bold color={C.fg}>{L("shader", "shader")} ({rule})</T>
        <T x={GX[1]} y={16} size={9} bold color={C.fg}>C++ (GLM{fixed ? " + alignas" : ""})</T>
        {[0, 1, 2, 3].map(k => (
          <g key={k}>
            <T x={GX[0] + k * CELL + 2} y={Y0 - 4} size={7}>+{k * 4}</T>
            <T x={GX[1] + k * CELL + 2} y={Y0 - 4} size={7}>+{k * 4}</T>
          </g>
        ))}
        {Array.from({ length: rows }, (_, r) => (
          <g key={r}>
            <T x={GX[0] - 6} y={Y0 + r * CH + 13.5} size={8} anchor="end">{r * 16}</T>
            <T x={GX[1] - 6} y={Y0 + r * CH + 13.5} size={8} anchor="end">{r * 16}</T>
          </g>
        ))}
        {column(gl, GX[0], false)}
        {column(cpp, GX[1], true)}
      </svg>
    </Figure>
  );
}
