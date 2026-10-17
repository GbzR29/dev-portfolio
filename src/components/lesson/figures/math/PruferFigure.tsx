"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, Sliders, C, T, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { fill } from "@/components/lesson/kit/lab/Lab";
import { encode, randomTree } from "./graph/treeModel";

// ── What this figure shows ────────────────────────────────────────────────────
// The Prüfer code of a labelled tree, step by step. Encode: remove the leaf
// with the smallest label and write down its neighbour; repeat until two
// vertices are left. The n − 2 numbers written are the code. Decode runs the
// same steps the other way: the smallest label that is not used yet and does
// not appear in the rest of the code is joined to the next number of the code.
// Every tree gives one code and every code gives one tree, so there are as
// many labelled trees on n vertices as sequences of n − 2 labels: nⁿ⁻².

type Mode = "encode" | "decode";
const W = 560, H = 256, CX = 150, CY = 128, R = 92;
const sup = (k: number) => String(k).split("").map(d => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+d]).join("");
/** 4782969 → "4 782 969", the same in every language. */
const group = (x: number) => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export function PruferFigure({ t }: { t?: TrackTranslations }) {
  const [n, setN] = useState(7);
  const [edges, setEdges] = useState<[number, number][]>(() => randomTree(7));
  const [mode, setMode] = useState<Mode>("encode");
  const [k, setK] = useState(0);                  // steps done
  const [playing, setPlaying] = useState(false);
  const [acc, setAcc] = useState(0);
  const vis = useVisible<HTMLDivElement>();

  const steps = encode(edges, n), seq = steps.map(s => s.nbr), last = n - 2;
  const fresh = (m: number) => { setN(m); setEdges(randomTree(m)); setK(0); setPlaying(false); };
  useFrame(playing && vis.on, dt => {
    const a = acc + dt;
    if (a < 0.9) { setAcc(a); return; }
    setAcc(0);
    if (k >= last) setPlaying(false); else setK(v => v + 1);
  });

  const pos = (v: number) => {
    const a = -Math.PI / 2 + (2 * Math.PI * (v - 1)) / n;
    return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
  };
  const removed = new Set(steps.slice(0, k).map(s => s.leaf));
  const nowStep = k < last ? steps[k] : null;
  const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  // decode: the edges made so far are the (leaf, nbr) pairs of the first k steps, plus the last one at the end
  const madeKeys = new Set(steps.slice(0, k).map(s => key(s.leaf, s.nbr)));
  if (mode === "decode" && k >= last) {
    const rest = Array.from({ length: n }, (_, i) => i + 1).filter(v => !removed.has(v));
    if (rest.length === 2) madeKeys.add(key(rest[0], rest[1]));
  }
  const used = (v: number) => removed.has(v);

  const view = (
    <div ref={vis.ref}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {edges.map(([a, b], i) => {
          const p = pos(a), q = pos(b), kk = key(a, b);
          const gone = mode === "encode" ? madeKeys.has(kk) : !madeKeys.has(kk);
          const hot = nowStep && kk === key(nowStep.leaf, nowStep.nbr);
          return <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y}
            stroke={hot ? C.amber : mode === "decode" && !gone ? C.green : C.muted}
            strokeWidth={hot ? 3.4 : 2.4} strokeDasharray={gone ? "3 5" : undefined} opacity={gone ? 0.35 : 1} />;
        })}
        {Array.from({ length: n }, (_, i) => i + 1).map(v => {
          const p = pos(v), isLeaf = nowStep?.leaf === v, isNbr = nowStep?.nbr === v;
          return (
            <g key={v} opacity={mode === "encode" && used(v) && !isLeaf ? 0.35 : 1}>
              {(isLeaf || isNbr) && <circle cx={p.x} cy={p.y} r={16} fill="none" stroke={isLeaf ? C.amber : C.purple} strokeWidth={2.4} />}
              <circle cx={p.x} cy={p.y} r={12} fill={mode === "decode" && used(v) ? C.green : C.sky} stroke={C.bg} strokeWidth={2} />
              <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">{v}</text>
            </g>
          );
        })}
        {/* the code */}
        <T x={300} y={40} color={C.muted} bold>{mode === "encode" ? tx(t, "figPruf_code", "Prüfer code") : tx(t, "figPruf_codeD", "code to decode")}</T>
        {seq.map((s, i) => {
          const x = 300 + i * 38, y = 56, shown = mode === "decode" || i < k, hot = i === k && k < last;
          return (
            <g key={i}>
              <rect x={x} y={y} width={32} height={32} rx={6} fill={hot ? C.amber : "none"} fillOpacity={hot ? 0.18 : 0}
                stroke={hot ? C.amber : mode === "decode" && i < k ? C.green : C.muted} strokeWidth={1.6} />
              {shown && <text x={x + 16} y={y + 21} textAnchor="middle" fontSize={14} fontWeight={700} fill={mode === "decode" && i < k ? C.muted : C.purple}>{s}</text>}
            </g>
          );
        })}
        {/* what this step does, in two short lines */}
        {(nowStep
          ? (mode === "encode"
            ? [fill(tx(t, "figPruf_stepE1", "smallest leaf: {l}"), { l: nowStep.leaf }), fill(tx(t, "figPruf_stepE2", "write its neighbour: {p}"), { p: nowStep.nbr })]
            : [fill(tx(t, "figPruf_stepD1", "smallest free label not in the rest: {l}"), { l: nowStep.leaf }), fill(tx(t, "figPruf_stepD2", "join {l} to {p}"), { l: nowStep.leaf, p: nowStep.nbr })])
          : (mode === "encode"
            ? [tx(t, "figPruf_doneE1", "two vertices left: done"), fill(tx(t, "figPruf_doneE2", "the code is ({s})"), { s: seq.join(", ") })]
            : [tx(t, "figPruf_doneD1", "the two labels left are joined:"), tx(t, "figPruf_doneD2", "the tree is rebuilt")])
        ).map((line, i) => <T key={i} x={300} y={116 + i * 16} color={C.amber} size={10.5} bold>{line}</T>)}
        <T x={300} y={160} color={C.muted} size={10}>{tx(t, "figPruf_deg", "deg v = times v is in the code + 1")}</T>
        {Array.from({ length: n }, (_, i) => i + 1).map(v => (
          <g key={v}>
            <T x={318 + (v - 1) * 26} y={178} anchor="middle" size={9.5} color={C.axis}>{v}</T>
            <T x={318 + (v - 1) * 26} y={194} anchor="middle" size={10.5} bold color={seq.includes(v) ? C.purple : C.sky}>{seq.filter(s => s === v).length + 1}</T>
          </g>
        ))}
        <T x={300} y={178} anchor="end" size={9.5} color={C.axis}>v</T>
        <T x={300} y={194} anchor="end" size={9.5} color={C.axis}>deg</T>
        <T x={300} y={224} color={C.green} size={10.5} bold>{fill(tx(t, "figPruf_count", "labelled trees on {n} vertices:"), { n })}</T>
        <T x={300} y={240} color={C.green} size={10.5} bold>{`${n}${sup(n - 2)} = ${group(n ** (n - 2))}`}</T>
      </svg>
      <Transport t={t} playing={playing}
        onPlay={() => { if (k >= last) setK(0); setAcc(0); setPlaying(v => !v); }}
        onStep={() => { setPlaying(false); setK(v => Math.min(last, v + 1)); }}
        onBack={() => { setPlaying(false); setK(v => Math.max(0, v - 1)); }}
        onReset={() => { setPlaying(false); setK(0); }}
        readout={`${k} / ${last}`} />
    </div>
  );

  const controls = <>
    <Row>
      <Btn onClick={() => fresh(n)}>{tx(t, "figPruf_new", "new random tree")}</Btn>
    </Row>
    <Sliders>
      <Slider label="n" value={n} min={3} max={9} step={1} onChange={fresh} fmt={v => String(v)} />
    </Sliders>
    <Row>
      <Readout color={C.purple}>{`(${seq.join(", ")})`}</Readout>
      <Readout>{fill(tx(t, "figPruf_leaves", "leaves = labels missing from the code: {l}"), { l: Array.from({ length: n }, (_, i) => i + 1).filter(v => !seq.includes(v)).join(", ") })}</Readout>
    </Row>
  </>;
  const note = tx(t, "figPruf_note", "Encode: each step removes the leaf with the smallest label (amber) and writes down the label of its neighbour (purple). Decode: start from the code alone and rebuild the same tree, edge by edge, in the same order. Below the code: every vertex's degree, read straight from how often it appears.");

  return (
    <Figure title={tx(t, "figPruf_title", "Prüfer code: a tree as a list of numbers")}
      head={<Choice value={mode} onChange={v => { setMode(v); setK(0); setPlaying(false); }} options={[["encode", tx(t, "figPruf_enc", "encode")], ["decode", tx(t, "figPruf_dec", "decode")]] as const} />}
      controls={controls} note={note}>
      {view}
    </Figure>
  );
}
