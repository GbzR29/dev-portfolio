"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Readout, Row, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A uniform block laid out byte by byte, one row per 16 bytes (one vec4 slot).
// Pick the rules: std140 (uniform blocks), std430 (storage blocks), or what a
// plain C++ struct of glm types does (everything 4-byte aligned, no padding).
// Each member starts at the next multiple of its alignment; the grey gaps are
// padding. In C++ mode, members whose offset differs from std140 are red,
// with the offset the shader actually reads. Add members with the buttons,
// remove one by tapping its chip.

type Ty = "float" | "vec2" | "vec3" | "vec4" | "mat3" | "mat4" | "float[3]";
type Rules = "std140" | "std430" | "cpp";
type Member = { ty: Ty; name: string };

// [alignment, size] in bytes per rule set
const RULE: Record<Rules, Record<Ty, [number, number]>> = {
  std140: { float: [4, 4], vec2: [8, 8], vec3: [16, 12], vec4: [16, 16], mat3: [16, 48], mat4: [16, 64], "float[3]": [16, 48] },
  std430: { float: [4, 4], vec2: [8, 8], vec3: [16, 12], vec4: [16, 16], mat3: [16, 48], mat4: [16, 64], "float[3]": [4, 12] },
  cpp:    { float: [4, 4], vec2: [4, 8], vec3: [4, 12], vec4: [4, 16], mat3: [4, 36], mat4: [4, 64], "float[3]": [4, 12] },
};
// Bytes of actual data, without the padding inside mat3 columns or array elements
const DATA: Record<Ty, number> = { float: 4, vec2: 8, vec3: 12, vec4: 16, mat3: 36, mat4: 64, "float[3]": 12 };
const COLOR: Record<Ty, string> = { float: C.amber, vec2: C.green, vec3: C.sky, vec4: C.blue, mat3: C.purple, mat4: C.pink, "float[3]": C.teal };

const PRESETS: Record<string, Member[]> = {
  light: [{ ty: "vec3", name: "position" }, { ty: "float", name: "intensity" }, { ty: "vec3", name: "color" }, { ty: "vec3", name: "direction" }],
  frame: [{ ty: "float", name: "time" }, { ty: "vec3", name: "camPos" }, { ty: "float", name: "exposure" }, { ty: "vec2", name: "jitter" }, { ty: "mat3", name: "normalMat" }, { ty: "float[3]", name: "weights" }],
  safe: [{ ty: "vec4", name: "posIntensity" }, { ty: "vec4", name: "colorRadius" }, { ty: "mat4", name: "lightSpace" }],
};

const up = (x: number, a: number) => Math.ceil(x / a) * a;

function layout(ms: Member[], rules: Rules) {
  let off = 0, maxA = 4;
  const out = ms.map(m => {
    const [a, s] = RULE[rules][m.ty];
    off = up(off, a);
    const o = off;
    off += s;
    maxA = Math.max(maxA, a);
    return { ...m, off: o, size: s };
  });
  const size = up(off, rules === "std140" ? 16 : maxA);
  return { out, size, used: out.reduce((n, m) => n + DATA[m.ty], 0) };
}

const BYTE = 34, RX = 46, ROW = 22;

export function Std140Figure({ t }: { t?: TrackTranslations }) {
  const L = (k: string, en: string) => tx(t, `figStd140_${k}`, en);
  const [rules, setRules] = useState<Rules>("std140");
  const [ms, setMs] = useState<Member[]>(PRESETS.light);
  const lay = layout(ms, rules);
  const ref = layout(ms, "std140").out;
  const rows = Math.max(1, Math.ceil(lay.size / 16));
  const H = rows * ROW + 26;
  const bad = rules === "cpp" ? lay.out.filter((m, i) => m.off !== ref[i].off).length : 0;

  const add = (ty: Ty) => setMs(v => v.length >= 9 ? v : [...v, { ty, name: `m${v.length}` }]);

  return (
    <Figure
      title={L("title", "Where every member lands: std140, std430, C++")}
      head={<Choice value={rules} onChange={setRules} options={[["std140", "std140"], ["std430", "std430"], ["cpp", L("cpp", "C++ glm struct")]] as const} />}
      controls={<>
        <Row>
          <span className="text-[11px] text-[var(--text-muted)]">{L("presets", "presets")}</span>
          <Btn onClick={() => setMs(PRESETS.light)}>Light</Btn>
          <Btn onClick={() => setMs(PRESETS.frame)}>Frame</Btn>
          <Btn onClick={() => setMs(PRESETS.safe)}>{L("safe", "vec4 only")}</Btn>
          <Btn onClick={() => setMs([])}>{L("clear", "clear")}</Btn>
        </Row>
        <Row>
          <span className="text-[11px] text-[var(--text-muted)]">{L("add", "add")}</span>
          {(Object.keys(COLOR) as Ty[]).map(ty => <Btn key={ty} onClick={() => add(ty)}>+ {ty}</Btn>)}
        </Row>
        <Row>
          {lay.out.map((m, i) => (
            <button key={i} type="button" onClick={() => setMs(v => v.filter((_, k) => k !== i))}
              className="text-[11px] font-mono px-2 py-0.5 rounded-md border border-[var(--border)]"
              style={{ color: COLOR[m.ty] }} title={L("remove", "remove")}>
              {m.ty} {m.name} @{m.off} ✕
            </button>
          ))}
        </Row>
        <Row>
          <Readout>{L("size", "block size")} {lay.size} B</Readout>
          <Readout>{L("data", "data")} {lay.used} B</Readout>
          <Readout color={lay.size - lay.used ? C.amber : C.green}>{L("padding", "padding")} {lay.size - lay.used} B</Readout>
          {rules === "cpp" && <Readout color={bad ? C.red : C.green}>{bad ? `${bad} ${L("mismatch", "members misread by the shader")}` : L("match", "matches std140")}</Readout>}
        </Row>
      </>}
      note={L("note", "The Light preset is the chapter's example: in std140, position takes bytes 0–11, intensity fits in the 4 bytes left in that row, color must start on the next multiple of 16 (16) and direction on 32, not 28. Switch to C++: glm types only need 4-byte alignment, so direction lands at 28 and the shader reads garbage from 32 on. In Frame, mat3 costs 48 bytes in both GLSL layouts because each column is padded like a vec4, and float[3] costs 48 in std140 (each element rounded up to 16) but 12 in std430, the one place where std430 saves memory here. The vec4-only preset has no padding and the same offsets in all three: that is why packing scalars into the w of a vec4 is the safe habit.")}
    >
      <svg viewBox={`0 0 ${RX + 16 * BYTE + 8} ${H}`} className="w-full h-auto" role="img">
        {Array.from({ length: 16 }, (_, b) => b % 4 === 0 &&
          <T key={b} x={RX + b * BYTE + 2} y={10} size={8}>{`+${b}`}</T>)}
        {Array.from({ length: rows }, (_, r) => <g key={r}>
          <T x={RX - 6} y={16 + r * ROW + 14} size={8.5} anchor="end">{r * 16}</T>
          {Array.from({ length: 16 }, (_, b) => (
            <rect key={b} x={RX + b * BYTE + 1} y={16 + r * ROW + 1} width={BYTE - 2} height={ROW - 4} rx={2}
              fill="var(--code-line)" opacity={0.6} />
          ))}
        </g>)}
        {lay.out.map((m, i) => {
          const wrong = rules === "cpp" && m.off !== ref[i].off;
          const segs: { r: number; a: number; b: number }[] = [];
          for (let s = m.off; s < m.off + m.size;) {
            const r = Math.floor(s / 16), e = Math.min(m.off + m.size, (r + 1) * 16);
            segs.push({ r, a: s % 16, b: e - r * 16 });
            s = e;
          }
          return <g key={i}>
            {segs.map((sg, k) => (
              <rect key={k} x={RX + sg.a * BYTE + 1} y={16 + sg.r * ROW + 1} width={(sg.b - sg.a) * BYTE - 2} height={ROW - 4} rx={3}
                fill={wrong ? C.red : COLOR[m.ty]} fillOpacity={0.75} />
            ))}
            <T x={RX + segs[0].a * BYTE + 5} y={16 + segs[0].r * ROW + 13} size={9} color="#fff" bold>
              {wrong ? `${m.name} @${m.off} ≠ ${ref[i].off}` : `${m.name}`}
            </T>
          </g>;
        })}
      </svg>
    </Figure>
  );
}
