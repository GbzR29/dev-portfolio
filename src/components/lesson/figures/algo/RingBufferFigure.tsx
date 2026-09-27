"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A queue stored in a circular buffer of 8 slots. push writes at tail and
// moves tail on; pop reads at head and moves head on; both indices wrap from
// 7 back to 0 with (i + 1) % 8, so nothing is ever shifted. The same 8 slots
// are drawn twice: as the array they really are (left) and bent into a ring
// (right), which is how the wrap-around feels from the queue's point of view.

const CAP = 8;
type Q = { buf: (number | null)[]; head: number; size: number; next: number; msg: string };
const START: Q = { buf: Array(CAP).fill(null), head: 0, size: 0, next: 1, msg: "" };

const W = 560, H = 224, CW = 34, AX = 20, AY = 90, RX = 440, RY = 118, RR = 68;

export function RingBufferFigure({ t }: { t?: TrackTranslations }) {
  const [q, setQ] = useState<Q>(START);
  const tail = (q.head + q.size) % CAP;

  const push = () => setQ(p => {
    if (p.size === CAP) return { ...p, msg: tx(t, "figRing_full", "full: size == capacity") };
    const tl = (p.head + p.size) % CAP, buf = [...p.buf];
    buf[tl] = p.next;
    return { buf, head: p.head, size: p.size + 1, next: p.next + 1, msg: `push ${p.next}: buf[${tl}] = ${p.next}, tail = (${tl} + 1) % 8 = ${(tl + 1) % CAP}` };
  });
  const pop = () => setQ(p => {
    if (p.size === 0) return { ...p, msg: tx(t, "figRing_empty", "empty: nothing to pop") };
    const buf = [...p.buf], v = buf[p.head];
    buf[p.head] = null;
    return { ...p, buf, head: (p.head + 1) % CAP, size: p.size - 1, msg: `pop → ${v}: head = (${p.head} + 1) % 8 = ${(p.head + 1) % CAP}` };
  });

  const slotColor = (i: number) => (q.buf[i] === null ? C.bg : i === q.head ? C.green : C.sky);

  return (
    <Figure
      title={tx(t, "figRing_title", "A queue in a circular buffer")}
      controls={<>
        <Row>
          <Btn onClick={push}>push</Btn>
          <Btn onClick={pop}>pop</Btn>
          <Btn onClick={() => { for (let i = 0; i < 3; ++i) push(); }}>push ×3</Btn>
          <Btn onClick={() => setQ(START)}>↻</Btn>
        </Row>
        <Row>
          <Readout color={C.green}>head = {q.head}</Readout>
          <Readout color={C.amber}>tail = (head + size) % 8 = {tail}</Readout>
          <Readout>size = {q.size} / {CAP}</Readout>
        </Row>
      </>}
      note={tx(t, "figRing_note", "First in, first out: values leave in the order they arrived. Removing from the front of a plain array would shift every element left, O(n). The circular buffer never moves anything: head and tail just advance and wrap around with % capacity, so push and pop are both O(1). Push a few, pop a few, and keep going until tail wraps past slot 7 back to slot 0. When all 8 slots are full, a growable queue would allocate a bigger buffer and copy the elements across, oldest first.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <T x={AX} y={20} size={10} color={q.msg.includes("full") || q.msg.includes("empty") ? C.red : C.fg} bold>{q.msg || tx(t, "figRing_start", "empty queue: head = tail = 0")}</T>
        {q.buf.map((v, i) => (
          <g key={i}>
            <rect x={AX + i * CW + 1} y={AY} width={CW - 2} height={30} rx={4} fill={slotColor(i)} fillOpacity={v === null ? 1 : 0.35} stroke={C.axis} />
            {v !== null && <T x={AX + i * CW + CW / 2} y={AY + 20} size={12} anchor="middle" color={C.fg} bold>{v}</T>}
            <T x={AX + i * CW + CW / 2} y={AY + 44} size={8} anchor="middle">{i}</T>
          </g>
        ))}
        <T x={AX + q.head * CW + CW / 2} y={AY - 8} size={9} anchor="middle" color={C.green} bold>head</T>
        <T x={AX + tail * CW + CW / 2} y={AY + 60} size={9} anchor="middle" color={C.amber} bold>tail</T>
        {q.buf.map((v, i) => {
          const a = -Math.PI / 2 + (i * 2 * Math.PI) / CAP, x = RX + RR * Math.cos(a), y = RY + RR * Math.sin(a);
          return (
            <g key={`r${i}`}>
              <circle cx={x} cy={y} r={17} fill={slotColor(i)} fillOpacity={v === null ? 1 : 0.35} stroke={i === tail ? C.amber : C.axis} strokeWidth={i === tail ? 2 : 1} />
              {v !== null && <T x={x} y={y + 4} size={11} anchor="middle" color={C.fg} bold>{v}</T>}
              <T x={RX + (RR + 28) * Math.cos(a)} y={RY + (RR + 28) * Math.sin(a) + 3} size={8} anchor="middle">{i}</T>
            </g>
          );
        })}
        <T x={RX} y={RY + 4} size={9} anchor="middle">{q.size} / {CAP}</T>
      </svg>
    </Figure>
  );
}
