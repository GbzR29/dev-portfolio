"use client";

import { useMemo, useState, type ReactNode } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, C, T } from "@/components/lesson/kit/figure";
import { useStepper, StepperControls } from "@/components/lesson/kit/Stepper";

// ── What this figure shows ────────────────────────────────────────────────────
// A singly linked list: each node holds a value and the address of the next
// node; head holds the address of the first; the last points to nullptr. The
// small hex numbers are made-up heap addresses, to show that the nodes are
// scattered in memory and only the pointers give the order.
// "edit": push at the front or back, tap a node to select it, then insert
// after it or erase it; the readout counts how many nodes had to be walked.
// "reverse": the in-place reversal, three pointer moves per node (save next,
// flip the arrow, advance prev and cur).

type Node = { v: number; addr: number };
const NW = 44, PW = 20, GAP = 22, X0 = 50, Y = 70;
const nodeX = (i: number) => X0 + i * (NW + PW + GAP);
let addrSeed = 0x3a0;
const newAddr = () => { addrSeed = (addrSeed * 7 + 0x1d0) % 0xf00 + 0x100; return addrSeed & ~0xf; };
const hex = (a: number) => "0x" + a.toString(16);

const title = (t?: TrackTranslations) => tx(t, "figList_title", "A singly linked list");
const note = (t?: TrackTranslations) => tx(t, "figList_note", "Nodes live wherever the allocator put them (the hex numbers); the arrows, stored pointers, are the only thing that makes them a sequence. Inserting or erasing next to a node you already hold is a couple of pointer writes, O(1), whatever the length. Reaching a node by position, or finding the node before the one you want to erase, means walking from head: O(n). Reversal walks once, flipping each arrow.");

export function LinkedListFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<"edit" | "reverse">("edit");
  const head = <Choice value={mode} onChange={setMode} options={[["edit", tx(t, "figList_edit", "insert & erase")], ["reverse", tx(t, "figList_reverse", "reverse")]] as const} />;
  return mode === "edit" ? <EditView t={t} head={head} /> : <ReverseView t={t} head={head} />;
}

function Arrow({ x1, x2, y, color = C.fg, back = false }: { x1: number; x2: number; y: number; color?: string; back?: boolean }) {
  if (!back) return <g stroke={color} fill={color}>
    <line x1={x1} y1={y} x2={x2 - 6} y2={y} strokeWidth={1.5} />
    <path d={`M${x2} ${y} l-7 -4 v8 z`} stroke="none" />
  </g>;
  // A flipped pointer: curves under the boxes back to the left
  const d = `M${x1} ${y + 12} C ${x1} ${y + 40}, ${x2} ${y + 40}, ${x2} ${y + 20}`;
  return <g stroke={color} fill="none">
    <path d={d} strokeWidth={1.5} />
    <path d={`M${x2} ${y + 19} l-4 7 h8 z`} fill={color} stroke="none" />
  </g>;
}

function NodeBox({ i, n, color = C.sky, sel = false, onClick }: { i: number; n: Node; color?: string; sel?: boolean; onClick?: () => void }) {
  const x = nodeX(i);
  return (
    <g onClick={onClick} style={{ cursor: onClick ? "pointer" : undefined }}>
      <T x={x + (NW + PW) / 2} y={Y - 8} size={7.5} anchor="middle">{hex(n.addr)}</T>
      <rect x={x} y={Y} width={NW} height={30} rx={4} fill={color} fillOpacity={sel ? 0.55 : 0.22} stroke={sel ? C.amber : color} strokeWidth={sel ? 2 : 1} />
      <rect x={x + NW} y={Y} width={PW} height={30} rx={4} fill={C.bg} stroke={sel ? C.amber : color} strokeWidth={sel ? 2 : 1} />
      <T x={x + NW / 2} y={Y + 19} size={12} anchor="middle" color={C.fg} bold>{n.v}</T>
      <circle cx={x + NW + PW / 2} cy={Y + 15} r={2.5} fill={C.fg} />
    </g>
  );
}

// ── Insert & erase ────────────────────────────────────────────────────────────
function EditView({ t, head }: { t?: TrackTranslations; head: ReactNode }) {
  const [list, setList] = useState<Node[]>(() => [7, 2, 9].map(v => ({ v, addr: newAddr() })));
  const [sel, setSel] = useState<number | null>(null);
  const [last, setLast] = useState<{ op: string; walked: number } | null>(null);
  const [next, setNext] = useState(4);
  const val = () => { setNext(v => (v * 5 + 3) % 20 + 1); return next; };
  const full = list.length >= 5;

  const pushFront = () => { if (full) return; setList([{ v: val(), addr: newAddr() }, ...list]); setSel(s => (s === null ? s : s + 1)); setLast({ op: "push_front", walked: 0 }); };
  const pushBack = () => { if (full) return; setList([...list, { v: val(), addr: newAddr() }]); setLast({ op: "push_back", walked: list.length }); };
  const insertAfter = () => { if (full || sel === null) return; const l = [...list]; l.splice(sel + 1, 0, { v: val(), addr: newAddr() }); setList(l); setLast({ op: "insert_after", walked: 0 }); };
  const erase = () => {
    if (sel === null) return;
    setList(list.filter((_, i) => i !== sel));
    setLast({ op: "erase", walked: sel });      // walk from head to the node before sel
    setSel(null);
  };

  const opText = (op: string) => ({
    push_front: tx(t, "figList_opFront", "new node points to the old first; head points to the new node"),
    push_back: tx(t, "figList_opBack", "walk to the last node, point it at the new one (no tail pointer)"),
    insert_after: tx(t, "figList_opAfter", "new->next = sel->next; sel->next = new"),
    erase: tx(t, "figList_opErase", "find the node before it, then prev->next = sel->next; delete sel"),
  }[op]);

  return (
    <Figure title={title(t)} head={head} note={note(t)} controls={<>
      <Row>
        <Btn onClick={pushFront}>push_front</Btn>
        <Btn onClick={pushBack}>push_back</Btn>
        <Btn onClick={insertAfter}>{tx(t, "figList_insAfter", "insert after selected")}</Btn>
        <Btn onClick={erase}>{tx(t, "figList_erase", "erase selected")}</Btn>
      </Row>
      <Row>
        <Readout>{tx(t, "figList_len", "length")}: {list.length}{full ? ` (${tx(t, "figList_max", "max")})` : ""}</Readout>
        {last && <Readout color={last.walked ? C.red : C.green}>{last.op}: {tx(t, "figList_walked", "nodes walked")} = {last.walked}</Readout>}
      </Row>
    </>}>
    <svg viewBox="0 0 560 130" className="w-full h-auto" role="img">
      <T x={8} y={16} size={9.5} color={C.fg} bold>{last ? opText(last.op) : tx(t, "figList_tap", "tap a node to select it")}</T>
      <T x={6} y={Y + 19} size={9} color={C.purple} bold>head</T>
      <Arrow x1={34} x2={list.length ? nodeX(0) : 60} y={Y + 15} color={C.purple} />
      {list.length === 0 && <T x={64} y={Y + 19} size={9}>nullptr</T>}
      {list.map((n, i) => <g key={n.addr + "-" + i}>
        <NodeBox i={i} n={n} sel={sel === i} onClick={() => setSel(sel === i ? null : i)} />
        {i + 1 < list.length
          ? <Arrow x1={nodeX(i) + NW + PW / 2} x2={nodeX(i + 1)} y={Y + 15} />
          : <T x={nodeX(i) + NW + PW + 6} y={Y + 19} size={8.5}>nullptr</T>}
      </g>)}
    </svg>
    </Figure>
  );
}

// ── Reverse ───────────────────────────────────────────────────────────────────
const RVALS = [3, 8, 1, 6, 4];
type RFrame = { flipped: number; prev: number; cur: number; next: number | null; msg: string };

function reverseFrames(): RFrame[] {
  const n = RVALS.length, out: RFrame[] = [{ flipped: 0, prev: -1, cur: 0, next: null, msg: "start" }];
  for (let c = 0; c < n; ++c) {
    const nx = c + 1 < n ? c + 1 : n;           // n stands for nullptr
    out.push({ flipped: c, prev: c - 1, cur: c, next: nx, msg: "save" });
    out.push({ flipped: c + 1, prev: c - 1, cur: c, next: nx, msg: "flip" });
    out.push({ flipped: c + 1, prev: c, cur: nx, next: null, msg: "advance" });
  }
  out.push({ flipped: n, prev: n - 1, cur: n, next: null, msg: "done" });
  return out;
}

function ReverseView({ t, head }: { t?: TrackTranslations; head: ReactNode }) {
  const frames = useMemo(reverseFrames, []);
  const s = useStepper(frames.length - 1, 900, 250);
  const f = frames[Math.min(frames.length - 1, Math.floor(s.raw + 1e-9))];
  const n = RVALS.length;
  const nodes: Node[] = useMemo(() => RVALS.map((v, i) => ({ v, addr: 0x200 + ((i * 0x1b0 + 0x90) % 0xa00) })), []);
  const msg = {
    start: tx(t, "figList_rStart", "prev = nullptr, cur = head"),
    save: tx(t, "figList_rSave", "next = cur->next  (remember the rest of the list)"),
    flip: tx(t, "figList_rFlip", "cur->next = prev  (turn this arrow around)"),
    advance: tx(t, "figList_rAdv", "prev = cur; cur = next  (move one node on)"),
    done: tx(t, "figList_rDone", "cur is nullptr: head = prev, the list is reversed"),
  }[f.msg];
  const px = (i: number) => (i < 0 ? 20 : i >= n ? nodeX(n) + 14 : nodeX(i) + NW / 2);
  const label = (i: number | null, text: string, color: string, dy: number) =>
    i === null ? null : <T x={px(i)} y={Y + 58 + dy} size={9} anchor="middle" color={color} bold>{i < 0 || i >= n ? `${text}=null` : text}</T>;

  return (
    <Figure title={title(t)} head={head} note={note(t)} controls={<>
      <StepperControls s={s} />
      <Row><Readout>{tx(t, "figList_rCost", "one pass, 3 pointer moves per node, O(1) extra memory")}</Readout></Row>
    </>}>
    <svg viewBox="0 0 560 170" className="w-full h-auto" role="img">
      <T x={8} y={16} size={9.5} color={f.msg === "done" ? C.green : C.fg} bold>{msg}</T>
      <T x={6} y={Y + 19} size={9} color={C.purple} bold>{f.msg === "done" ? "" : "head"}</T>
      {nodes.map((nd, i) => {
        const flipped = i < f.flipped;
        return <g key={i}>
          <NodeBox i={i} n={nd} color={flipped ? C.green : C.sky} sel={i === f.cur} />
          {flipped
            ? (i === 0 ? <T x={nodeX(0) + NW + PW / 2 - 16} y={Y + 46} size={8}>→ nullptr</T>
              : <Arrow x1={nodeX(i) + NW + PW / 2} x2={nodeX(i - 1) + NW / 2} y={Y + 15} color={C.green} back />)
            : i + 1 < n ? <Arrow x1={nodeX(i) + NW + PW / 2} x2={nodeX(i + 1)} y={Y + 15} />
            : <T x={nodeX(i) + NW + PW + 6} y={Y + 19} size={8.5}>nullptr</T>}
        </g>;
      })}
      {f.msg === "done" && <T x={nodeX(n - 1) + NW / 2} y={Y - 20} size={9} anchor="middle" color={C.purple} bold>head</T>}
      {label(f.prev, "prev", C.green, 0)}
      {f.msg !== "done" && label(f.cur, "cur", C.amber, 12)}
      {label(f.next, "next", C.pink, 24)}
    </svg>
    </Figure>
  );
}
