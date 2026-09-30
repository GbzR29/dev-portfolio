"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Slider, Sliders, C, T, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The per-frame cost of three ways to hand the same mesh to OpenGL: immediate
// mode (one call per attribute per vertex), 1.1 vertex arrays (one draw call,
// but every byte read from CPU memory at every draw) and 1.5 VBOs (uploaded
// once). The call cost of ~25 ns is an illustrative round number.

const NS_PER_CALL = 25;
const ATTRS = {
  pos: { n: 1, bytes: 12, en: "position" },
  posCol: { n: 2, bytes: 24, en: "position + colour" },
  full: { n: 4, bytes: 44, en: "position + colour + UV + normal" },
} as const;
type AttrKey = keyof typeof ATTRS;

const W = 600, X0 = 150, X1 = 585;
const fmt = (n: number) => n >= 1e9 ? `${f2(n / 1e9, 1)} G` : n >= 1e6 ? `${f2(n / 1e6, 1)} M` : n >= 1e3 ? `${f2(n / 1e3, 1)} k` : String(Math.round(n));

export function ImmediateCostFigure({ t }: { t?: TrackTranslations }) {
  const [logN, setLogN] = useState(5);                  // 10^5 vertices
  const [attr, setAttr] = useState<AttrKey>("full");
  const N = Math.round(10 ** logN), a = ATTRS[attr];

  const rows = [
    { key: "imm", en: "immediate (1.0)", calls: N * a.n + 2, bytes: N * a.bytes, color: C.red },
    { key: "arr", en: "vertex arrays (1.1)", calls: 2 + a.n, bytes: N * a.bytes, color: C.amber },
    { key: "vbo", en: "VBO (1.5)", calls: 2 + a.n, bytes: 0, color: C.green },
  ];
  const maxCalls = Math.log10(rows[0].calls + 1), maxBytes = Math.log10(Math.max(1, rows[0].bytes * 60) + 1);
  const bar = (v: number, max: number) => X0 + (Math.log10(v + 1) / Math.max(1, max)) * (X1 - X0) * 0.82;
  const cpuMs = (rows[0].calls * NS_PER_CALL) / 1e6;

  return (
    <Figure
      title={tx(t, "figGlCost_title", "What one frame costs, three ways")}
      head={<Choice value={attr} onChange={setAttr} options={(Object.keys(ATTRS) as AttrKey[]).map(k => [k, tx(t, `figGlCost_a_${k}`, ATTRS[k].en)] as const)} />}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figGlCost_vertices", "vertices")} value={logN} min={2} max={6.5} step={0.05} onChange={setLogN} fmt={() => fmt(N)} />
        </Sliders>
        <Row>
          <Readout color={cpuMs > 16.7 ? C.red : C.green}>{tx(t, "figGlCost_cpu", "immediate mode, CPU in calls alone")}: {f2(cpuMs, 1)} ms / frame</Readout>
          <Readout>{tx(t, "figGlCost_bpv", "bytes per vertex")}: {a.bytes}</Readout>
        </Row>
      </>}
      note={tx(t, "figGlCost_note", "Bars use a logarithmic scale: every extra digit in the number adds the same length, so the gaps are far larger than they look. Immediate mode makes one function call per attribute per vertex, every frame; at an illustrative 25 ns per call, a million vertices with four attributes is 100 ms of CPU time before any drawing happens, six times the budget of a 60 fps frame. Vertex arrays cut the calls to a handful but still hand every byte to the driver at every draw. A VBO uploads the bytes once; after that a frame sends only the draw command.")}
    >
      <svg viewBox={`0 0 ${W} 196`} className="w-full h-auto" role="img">
        <T x={X0} y={16} size={9} bold color={C.fg}>{tx(t, "figGlCost_calls", "function calls per frame")}</T>
        <T x={X0} y={110} size={9} bold color={C.fg}>{tx(t, "figGlCost_bytes", "vertex bytes sent per second (60 fps)")}</T>
        {rows.map((r, i) => (
          <g key={r.key}>
            <T x={10} y={36 + i * 22} size={8.5} color={r.color} bold>{tx(t, `figGlCost_${r.key}`, r.en)}</T>
            <rect x={X0} y={26 + i * 22} width={Math.max(2, bar(r.calls, maxCalls) - X0)} height={14} rx={3} fill={r.color} fillOpacity={0.75} />
            <T x={bar(r.calls, maxCalls) + 6} y={37 + i * 22} size={8.5} color={C.fg}>{fmt(r.calls)}</T>
            <T x={10} y={130 + i * 22} size={8.5} color={r.color} bold>{tx(t, `figGlCost_${r.key}`, r.en)}</T>
            <rect x={X0} y={120 + i * 22} width={Math.max(2, r.bytes ? bar(r.bytes * 60, maxBytes) - X0 : 2)} height={14} rx={3} fill={r.color} fillOpacity={0.75} />
            <T x={(r.bytes ? bar(r.bytes * 60, maxBytes) : X0 + 2) + 6} y={131 + i * 22} size={8.5} color={C.fg}>
              {r.bytes ? `${fmt(r.bytes * 60)}B/s` : tx(t, "figGlCost_once", "0 (uploaded once)")}
            </T>
          </g>
        ))}
      </svg>
    </Figure>
  );
}
