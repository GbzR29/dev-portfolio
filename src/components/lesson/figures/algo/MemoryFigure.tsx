"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, C, T } from "@/components/lesson/kit/figure";
import { useStepper, StepperControls } from "@/components/lesson/kit/Stepper";

// ── What this figure shows ────────────────────────────────────────────────────
// Memory as a row of numbered bytes. "array": an array of char, int or double
// starting at 0x1000; element i lives at base + i · size, so any element is
// one multiplication and one addition away. "struct": the fields of a struct
// in declaration order, each moved up to a multiple of its own size, with the
// padding bytes that alignment adds. "cache": an 8 × 8 int array stored row
// after row, read through a tiny cache of 4 lines of 16 bytes; walking it row
// by row reuses every line it loads, walking it column by column does not.

type Mode = "array" | "struct" | "cache";
type Elem = "char" | "int" | "double";
const SIZE: Record<Elem, number> = { char: 1, int: 4, double: 8 };
const COL: Record<Elem, string> = { char: C.teal, int: C.sky, double: C.purple };

const W = 560, BYTES_PER_ROW = 16, ROWS = 3, CELL = 30, X0 = 62;
const hex = (n: number) => "0x" + n.toString(16).toUpperCase();

// ── Struct layout ─────────────────────────────────────────────────────────────
type Field = { name: string; type: Elem };
const LAYOUTS: Record<string, Field[]> = {
  a: [{ name: "a", type: "char" }, { name: "b", type: "int" }, { name: "c", type: "char" }],
  b: [{ name: "b", type: "int" }, { name: "a", type: "char" }, { name: "c", type: "char" }],
  c: [{ name: "a", type: "char" }, { name: "d", type: "double" }, { name: "b", type: "int" }],
  d: [{ name: "d", type: "double" }, { name: "b", type: "int" }, { name: "a", type: "char" }],
};
function layout(fields: Field[]) {
  let off = 0, align = 1;
  const placed = fields.map(f => {
    const s = SIZE[f.type];
    off = Math.ceil(off / s) * s;              // move up to a multiple of the field's size
    const at = off; off += s; align = Math.max(align, s);
    return { ...f, at };
  });
  const size = Math.ceil(off / align) * align; // the whole struct is a multiple of its largest alignment
  return { placed, size, align };
}

// ── Cache simulation ──────────────────────────────────────────────────────────
const N = 8, LINE_INTS = 4, SLOTS = 4;
type Access = { r: number; c: number; line: number; hit: boolean; cache: number[] };
function simulate(order: "rows" | "cols"): Access[] {
  const out: Access[] = [];
  let cache: number[] = [];                    // most recently used last
  for (let k = 0; k < N * N; k++) {
    const r = order === "rows" ? Math.floor(k / N) : k % N;
    const c = order === "rows" ? k % N : Math.floor(k / N);
    const line = Math.floor((r * N + c) / LINE_INTS);
    const hit = cache.includes(line);
    cache = cache.filter(l => l !== line);
    cache.push(line);
    if (cache.length > SLOTS) cache.shift();   // evict the least recently used line
    out.push({ r, c, line, hit, cache: [...cache] });
  }
  return out;
}

export function MemoryFigure({ t, initial = "array" }: { t?: TrackTranslations; initial?: Mode }) {
  const [mode, setMode] = useState<Mode>(initial);
  const [elem, setElem] = useState<Elem>("int");
  const [idx, setIdx] = useState(3);
  const [lay, setLay] = useState<keyof typeof LAYOUTS>("a");
  const [order, setOrder] = useState<"rows" | "cols">("rows");
  const trace = useMemo(() => simulate(order), [order]);
  const s = useStepper(N * N, 170, 0);

  const count = (ROWS * BYTES_PER_ROW) / SIZE[elem];
  const i = Math.min(idx, count - 1);
  const byteX = (b: number) => X0 + (b % BYTES_PER_ROW) * CELL;
  const byteY = (b: number) => 36 + Math.floor(b / BYTES_PER_ROW) * 40;

  const byteRows = (
    <>
      {Array.from({ length: ROWS }, (_, r) => (
        <T key={r} x={X0 - 6} y={byteY(r * BYTES_PER_ROW) + 16} size={8.5} anchor="end">{hex(0x1000 + r * BYTES_PER_ROW)}</T>
      ))}
      {Array.from({ length: ROWS * BYTES_PER_ROW }, (_, b) => (
        <rect key={b} x={byteX(b) + 0.5} y={byteY(b)} width={CELL - 1} height={24} rx={2} fill="var(--code-surface)" stroke="var(--code-border)" />
      ))}
      {Array.from({ length: BYTES_PER_ROW }, (_, b) => (
        <T key={b} x={byteX(b) + CELL / 2} y={28} size={7.5} anchor="middle">{"+" + b.toString(16).toUpperCase()}</T>
      ))}
    </>
  );

  // A run of bytes [from, from + len) drawn as one block per memory row it touches
  const block = (from: number, len: number, color: string, opacity: number, key: string, label?: string) => {
    const parts = [];
    for (let b = from; b < from + len;) {
      const end = Math.min(from + len, (Math.floor(b / BYTES_PER_ROW) + 1) * BYTES_PER_ROW);
      parts.push(<rect key={`${key}-${b}`} x={byteX(b) + 2} y={byteY(b) + 2} width={(end - b) * CELL - 4} height={20} rx={3} fill={color} fillOpacity={opacity} />);
      if (label && b === from) parts.push(<T key={`${key}-l`} x={byteX(b) + 5} y={byteY(b) + 15.5} size={8.5} color="#fff" bold>{label}</T>);
      b = end;
    }
    return parts;
  };

  let drawing: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "array") {
    const size = SIZE[elem], addr = 0x1000 + i * size;
    drawing = (
      <svg viewBox={`0 0 ${W} 170`} className="w-full h-auto">
        {byteRows}
        {Array.from({ length: count }, (_, k) => block(k * size, size, COL[elem], k === i ? 0.95 : 0.3, `e${k}`, size >= 4 || k === i ? `${size >= 4 ? "a[" : ""}${k}${size >= 4 ? "]" : ""}` : undefined))}
        <T x={X0} y={160} size={10} color={C.fg}>{`&a[${i}] = ${hex(0x1000)} + ${i} × ${size} = ${hex(0x1000)} + ${i * size} = ${hex(addr)}`}</T>
      </svg>
    );
    controls = <>
      <Row>
        <Choice value={elem} onChange={setElem} options={[["char", "char (1 B)"], ["int", "int (4 B)"], ["double", "double (8 B)"]] as const} />
      </Row>
      <Slider label={tx(t, "figMem_index", "index i")} value={i} min={0} max={count - 1} step={1} onChange={setIdx} fmt={v => `${v}`} />
      <Row>
        <Readout>{tx(t, "figMem_count", "elements")}: {count}</Readout>
        <Readout color={COL[elem]}>sizeof(a[0]) = {size}</Readout>
        <Readout>sizeof(a) = {count * size}</Readout>
      </Row>
    </>;
    note = tx(t, "figMem_noteArray", "The elements sit side by side with no gaps, so the address of element i is the start address plus i times the element size. The machine computes it with one multiplication and one addition, whatever i is: that is why reading a[0] and a[10 000] costs the same. It is also why indices start at 0: the first element is 0 elements past the start.");
  } else if (mode === "struct") {
    const L = layout(LAYOUTS[lay]);
    const used = L.placed.reduce((n, f) => n + SIZE[f.type], 0);
    drawing = (
      <svg viewBox={`0 0 ${W} 170`} className="w-full h-auto">
        {byteRows}
        {block(0, L.size, C.axis, 0.18, "all")}
        {L.placed.map(f => block(f.at, SIZE[f.type], COL[f.type], 0.9, f.name, f.name))}
        {Array.from({ length: L.size }, (_, b) => L.placed.some(f => b >= f.at && b < f.at + SIZE[f.type]) ? null
          : <T key={`p${b}`} x={byteX(b) + CELL / 2} y={byteY(b) + 16} size={8} anchor="middle" color={C.red}>pad</T>)}
        <T x={X0} y={160} size={10} color={C.fg}>{`struct S { ${LAYOUTS[lay].map(f => `${f.type} ${f.name};`).join(" ")} }`}</T>
      </svg>
    );
    controls = <>
      <Row>
        <Choice value={lay} onChange={setLay} options={[["a", "char, int, char"], ["b", "int, char, char"], ["c", "char, double, int"], ["d", "double, int, char"]] as const} />
      </Row>
      <Row>
        <Readout>{tx(t, "figMem_fields", "field bytes")}: {used}</Readout>
        <Readout color={L.size > used ? C.red : C.green}>{tx(t, "figMem_padding", "padding")}: {L.size - used}</Readout>
        <Readout>sizeof(S) = {L.size}</Readout>
        <Readout>alignof(S) = {L.align}</Readout>
      </Row>
    </>;
    note = tx(t, "figMem_noteStruct", "Each field starts at an offset that is a multiple of its own size (its alignment), because the processor reads aligned values in one go. The compiler inserts unused padding bytes to get there, and rounds the whole struct up to a multiple of its largest alignment so that the next element of an array of S is aligned too. The same three fields can take 12 bytes or 8 depending only on their order: largest first wastes the least.");
  } else {
    const done = Math.floor(s.raw + 1e-9);
    const now = done > 0 ? trace[done - 1] : null;
    const cache = now ? now.cache : [];
    const hits = trace.slice(0, done).filter(a => a.hit).length;
    const G = 20, gx = 20, gy = 24;
    const sx = 20, sy = 216, sw = 7.8;             // the linear memory strip
    drawing = (
      <svg viewBox={`0 0 ${W} 250`} className="w-full h-auto">
        <T x={gx} y={16} size={8.5}>{tx(t, "figMem_grid", "int a[8][8] (as rows and columns)")}</T>
        {Array.from({ length: N * N }, (_, k) => {
          const r = Math.floor(k / N), c = k % N, line = Math.floor(k / LINE_INTS);
          const visited = trace.slice(0, done).some(a => a.r === r && a.c === c);
          const cur = now && now.r === r && now.c === c;
          return <rect key={k} x={gx + c * G} y={gy + r * G} width={G - 2} height={G - 2} rx={2}
            fill={cur ? (now!.hit ? C.green : C.red) : cache.includes(line) ? C.sky : visited ? C.axis : "var(--code-surface)"}
            fillOpacity={cur ? 1 : cache.includes(line) ? 0.45 : visited ? 0.35 : 1} stroke="var(--code-border)" />;
        })}
        <T x={200} y={16} size={8.5}>{tx(t, "figMem_cache", "cache: 4 lines of 16 bytes (4 ints each)")}</T>
        {Array.from({ length: SLOTS }, (_, k) => {
          const line = cache[k];
          return <g key={k}>
            <rect x={200} y={gy + k * 28} width={170} height={22} rx={3} fill="var(--code-surface)" stroke={C.sky} strokeOpacity={line === undefined ? 0.3 : 1} />
            {line !== undefined && <T x={208} y={gy + k * 28 + 15} size={9} color={C.fg}>{`a[${Math.floor(line / 2)}][${(line % 2) * 4}..${(line % 2) * 4 + 3}]`}</T>}
          </g>;
        })}
        {now && <T x={390} y={gy + 15} size={10} color={now.hit ? C.green : C.red} bold>{`a[${now.r}][${now.c}]: ${now.hit ? "hit" : "miss"}`}</T>}
        <T x={390} y={gy + 43} size={9}>{`${tx(t, "figMem_hits", "hits")}: ${hits}`}</T>
        <T x={390} y={gy + 61} size={9}>{`${tx(t, "figMem_misses", "misses")}: ${done - hits}`}</T>
        <T x={390} y={gy + 79} size={9}>{`${tx(t, "figMem_cost", "time")} ≈ ${hits} × 1 + ${done - hits} × 100 ns`}</T>
        <T x={sx} y={sy - 8} size={8.5}>{tx(t, "figMem_strip", "the same 64 ints as they really lie in memory, row after row; ticks mark cache lines")}</T>
        {Array.from({ length: N * N }, (_, k) => {
          const line = Math.floor(k / LINE_INTS), cur = now && now.r * N + now.c === k;
          return <rect key={k} x={sx + k * sw} y={sy} width={sw - 1} height={14} fill={cur ? (now!.hit ? C.green : C.red) : cache.includes(line) ? C.sky : "var(--code-surface)"} fillOpacity={cur ? 1 : cache.includes(line) ? 0.5 : 1} />;
        })}
        {Array.from({ length: N * N / LINE_INTS + 1 }, (_, k) => <line key={k} x1={sx + k * sw * LINE_INTS - 0.5} x2={sx + k * sw * LINE_INTS - 0.5} y1={sy - 3} y2={sy + 17} stroke={C.axis} />)}
      </svg>
    );
    controls = <>
      <Row>
        <Choice value={order} onChange={o => { setOrder(o); s.restart(); }} options={[["rows", tx(t, "figMem_rows", "row by row: a[r][c], c inner")], ["cols", tx(t, "figMem_cols", "column by column: a[r][c], r inner")]] as const} />
      </Row>
      <StepperControls s={s} />
    </>;
    note = tx(t, "figMem_noteCache", "Memory is not read one int at a time: a miss brings a whole cache line (here 16 bytes, on real processors 64) into the cache. Row by row, one miss loads 4 ints and the next 3 reads are hits, so 16 misses in 64 reads. Column by column, consecutive reads are 32 bytes apart, every read lands in a different line, and by the time the walk comes back to a line it has been evicted: 64 misses. Same array, same sum, about 4 times the memory traffic, and on real hardware the gap is often 10× or more.");
  }

  return (
    <Figure
      title={tx(t, "figMem_title", "Memory: addresses, layout and the cache")}
      head={<Choice value={mode} onChange={setMode} options={[["array", tx(t, "figMem_array", "array")], ["struct", "struct"], ["cache", "cache"]] as const} />}
      controls={controls}
      note={note}
    >
      {drawing}
    </Figure>
  );
}
