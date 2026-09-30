"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// GLSL swizzling on v = vec4(0.9, 0.4, 0.1, 1.0). Type any swizzle (or pick
// one) and the figure evaluates it the way the compiler does: each letter
// picks a component, the result's type is float/vec2/vec3/vec4 by length,
// letters must all come from one set (xyzw, rgba or stpq), at most four,
// only components the vector has, and when the swizzle is written TO
// (v.xy = …) no component may repeat.

const V = [0.9, 0.4, 0.1, 1.0];
const SETS = ["xyzw", "rgba", "stpq"];
const EXAMPLES = ["x", "xy", "zyx", "rgb", "bgr", "xxxx", "st", "wzyx", "xg", "xyzwx", "xyzv"];
const TYPE = ["", "float", "vec2", "vec3", "vec4"];
const COMP_COL = [C.red, C.green, C.blue, C.amber];

function evaluate(sw: string, write: boolean): { ok: true; idx: number[] } | { ok: false; key: string; en: string } {
  if (!sw) return { ok: false, key: "empty", en: "type a swizzle, such as xy or bgr" };
  if (sw.length > 4) return { ok: false, key: "long", en: "more than 4 letters: the longest vector is vec4" };
  const set = SETS.find(s => s.includes(sw[0]));
  if (!set) return { ok: false, key: "unknown", en: `"${sw[0]}" is not a component name (xyzw, rgba or stpq)` };
  for (const ch of sw) {
    if (!SETS.some(s => s.includes(ch))) return { ok: false, key: "unknown", en: `"${ch}" is not a component name (xyzw, rgba or stpq)` };
    if (!set.includes(ch)) return { ok: false, key: "mixed", en: `letters from different sets ("${sw[0]}" is from ${set}, "${ch}" is not): pick one set per swizzle` };
  }
  const idx = [...sw].map(ch => set.indexOf(ch));
  if (write && new Set(idx).size !== idx.length) return { ok: false, key: "repeat", en: "a component repeats: writing v.xx = … would store two values into the same place, so it is not allowed on the left side" };
  return { ok: true, idx };
}

export function SwizzleFigure({ t }: { t?: TrackTranslations }) {
  const [sw, setSw] = useState("bgr");
  const [write, setWrite] = useState(false);
  const r = evaluate(sw.trim(), write);
  const errText = !r.ok ? tx(t, `figGlSwz_e_${r.key}`, r.en) : "";

  return (
    <Figure
      title={tx(t, "figGlSwz_title", "Swizzling: picking components by name")}
      head={<Btn active={write} onClick={() => setWrite(w => !w)}>{tx(t, "figGlSwz_write", "as an assignment target")}</Btn>}
      controls={<>
        <Row>
          <span className="font-mono text-[12px] text-[var(--text-main)]">{write ? "v." : `${r.ok ? TYPE[r.idx.length] : "?"} w = v.`}</span>
          <input value={sw} onChange={e => setSw(e.target.value.replace(/[^a-z]/gi, "").toLowerCase().slice(0, 6))}
            className="w-24 font-mono text-[13px] px-2 py-1 rounded-md bg-[var(--code-bg)] border border-[var(--border)] text-[var(--text-main)]" aria-label="swizzle" />
          {write && <span className="font-mono text-[12px] text-[var(--text-main)]">= …;</span>}
        </Row>
        <Row>{EXAMPLES.map(e => <Btn key={e} active={e === sw} onClick={() => setSw(e)}>.{e}</Btn>)}</Row>
        <Row>
          {r.ok
            ? <Readout color={C.green}>{TYPE[r.idx.length]}({r.idx.map(i => V[i].toFixed(1)).join(", ")})</Readout>
            : <Readout color={C.red}>{tx(t, "figGlSwz_error", "compile error")}</Readout>}
        </Row>
        {!r.ok && <p className="text-[12.5px]" style={{ color: C.red }}>{errText}</p>}
      </>}
      note={tx(t, "figGlSwz_note", "Swizzling reads (or writes) several components at once, in any order: v.bgr is a vec3 of blue, green, red. There are three sets of names for the same four slots, xyzw for positions, rgba for colours and stpq for texture coordinates, and a swizzle must use one set. Reading may repeat a component (v.xxxx is four copies of x); writing may not. A vec3 has no fourth component, so .w or .a on it is also an error.")}
    >
      <svg viewBox="0 0 600 120" className="w-full h-auto" role="img">
        <T x={20} y={20} size={9.5} color={C.fg} bold>vec4 v = vec4(0.9, 0.4, 0.1, 1.0);</T>
        {V.map((val, i) => (
          <g key={i}>
            <rect x={20 + i * 70} y={32} width={62} height={40} rx={6} fill={COMP_COL[i]} fillOpacity={r.ok && r.idx.includes(i) ? 0.45 : 0.12} stroke={COMP_COL[i]} />
            <T x={51 + i * 70} y={50} size={12} anchor="middle" bold color={C.fg}>{val.toFixed(1)}</T>
            <T x={51 + i * 70} y={66} size={8} anchor="middle">{SETS.map(s => s[i]).join(" · ")}</T>
          </g>
        ))}
        {r.ok && r.idx.map((ci, k) => (
          <g key={k}>
            <path d={`M${51 + ci * 70} 72 C ${51 + ci * 70} 88, ${350 + k * 60} 78, ${350 + k * 60} 90`} fill="none" stroke={COMP_COL[ci]} strokeWidth={1.5} />
            <rect x={328 + k * 60} y={90} width={44} height={24} rx={5} fill={COMP_COL[ci]} fillOpacity={0.35} stroke={COMP_COL[ci]} />
            <T x={350 + k * 60} y={106} size={10} anchor="middle" bold color={C.fg}>{V[ci].toFixed(1)}</T>
          </g>
        ))}
      </svg>
    </Figure>
  );
}
