"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, Sliders, C, T, useRaf, useRerender } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A ship fires bullets that live for a moment. With "new / delete" every shot
// allocates and every expired bullet frees memory. With a pool, all bullets
// are allocated once up front in a fixed array; a free list (each free slot
// stores the index of the next free slot) hands one out in O(1) and takes it
// back in O(1). The row at the bottom is the pool's array: filled slots are
// live bullets, the arcs link the free slots from the head of the list.
// When the pool runs out, the policy decides: refuse the shot, grow the array
// (one big allocation), or recycle the oldest live bullet.

type Mode = "alloc" | "pool";
type Policy = "refuse" | "grow" | "recycle";
type Bullet = { x: number; y: number; born: number };

const W = 560, SCENE_H = 128, ROW_Y = 176, H = 222;

export function PoolFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("pool");
  const [policy, setPolicy] = useState<Policy>("refuse");
  const [rate, setRate] = useState(9);
  const [size, setSize] = useState(12);
  const [life, setLife] = useState(1.4);
  const rerender = useRerender();

  const sim = useRef({
    time: 0, fireAcc: 0, shipY: 64,
    // pool state
    slots: [] as (Bullet | null)[], next: [] as number[], head: -1,
    // alloc-mode state
    heap: [] as Bullet[],
    allocs: 0, frees: 0, refused: 0, allocLog: [] as number[], cap: 0,
  });

  const reset = (n = size) => {
    const s = sim.current;
    s.slots = Array(n).fill(null);
    s.next = Array.from({ length: n }, (_, i) => (i + 1 < n ? i + 1 : -1));
    s.head = n ? 0 : -1;
    s.heap = [];
    s.allocs = 0;
    s.frees = 0; s.refused = 0; s.allocLog = []; s.cap = n;
  };
  if (sim.current.cap === 0 && sim.current.slots.length === 0) reset();

  const acquire = (): number => {
    const s = sim.current;
    if (s.head >= 0) { const i = s.head; s.head = s.next[i]; return i; }
    if (policy === "grow") {
      // Double the array: a single (large) allocation, then thread the new slots onto the free list
      const old = s.slots.length, n = Math.max(1, old * 2);
      for (let i = old; i < n; i++) { s.slots.push(null); s.next.push(i + 1 < n ? i + 1 : -1); }
      s.head = old; s.allocs++; s.allocLog.push(s.time); s.cap = n;
      const i = s.head; s.head = s.next[i]; return i;
    }
    if (policy === "recycle") {
      let oldest = -1;
      s.slots.forEach((b, i) => { if (b && (oldest < 0 || b.born < s.slots[oldest]!.born)) oldest = i; });
      return oldest;                            // still live: reused without going through the list
    }
    return -1;
  };
  const release = (i: number) => {
    const s = sim.current;
    s.slots[i] = null;
    s.next[i] = s.head;                         // push onto the front of the free list
    s.head = i;
  };

  const ref = useRaf(true, dt => {
    const s = sim.current;
    s.time += dt;
    s.shipY = 64 + Math.sin(s.time * 1.7) * 34;
    const speed = (W - 60) / life;
    // fire
    s.fireAcc += dt * rate;
    while (s.fireAcc >= 1) {
      s.fireAcc -= 1;
      const b = { x: 44, y: s.shipY, born: s.time };
      if (mode === "alloc") { s.heap.push(b); s.allocs++; s.allocLog.push(s.time); }
      else {
        const i = acquire();
        if (i < 0) s.refused++; else s.slots[i] = b;
      }
    }
    // move and expire
    if (mode === "alloc") {
      s.heap.forEach(b => { b.x += speed * dt; });
      const alive = s.heap.filter(b => s.time - b.born < life);
      s.frees += s.heap.length - alive.length;
      s.heap = alive;
    } else {
      s.slots.forEach((b, i) => { if (!b) return; b.x += speed * dt; if (s.time - b.born >= life) release(i); });
    }
    while (s.allocLog.length && s.allocLog[0] < s.time - 1) s.allocLog.shift();
    rerender();
  });

  const s = sim.current;
  const bullets = mode === "alloc" ? s.heap : (s.slots.filter(Boolean) as Bullet[]);
  const n = s.slots.length;
  const cw = Math.min(40, (W - 40) / Math.max(1, n));
  const cellX = (i: number) => 20 + i * cw;
  // Walk the free list from the head to draw its links
  const links: [number, number][] = [];
  if (mode === "pool") {
    let i = s.head, guard = 0;
    while (i >= 0 && s.next[i] >= 0 && guard++ < 256) { links.push([i, s.next[i]]); i = s.next[i]; }
  }
  const change = (fn: () => void) => { fn(); setTimeout(() => reset(), 0); };

  return (
    <Figure
      title={tx(t, "figPool_title", "Object pool with a free list")}
      head={<Choice value={mode} onChange={m => change(() => setMode(m))} options={[["alloc", "new / delete"], ["pool", tx(t, "figPool_pool", "pool")]] as const} />}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figPool_rate", "fire rate")} value={rate} min={1} max={30} step={1} onChange={setRate} fmt={v => `${v}/s`} />
          <Slider label={tx(t, "figPool_life", "bullet life")} value={life} min={0.4} max={3} step={0.1} onChange={setLife} fmt={v => `${v.toFixed(1)} s`} />
          <Slider label={tx(t, "figPool_size", "pool size")} value={size} min={2} max={32} step={1} onChange={v => { setSize(v); reset(v); }} fmt={v => `${v}`} />
        </Sliders>
        {mode === "pool" && <Row>
          <span className="text-[10px] text-[var(--text-muted)]">{tx(t, "figPool_full", "when full")}:</span>
          <Choice value={policy} onChange={p => change(() => setPolicy(p))} options={[["refuse", tx(t, "figPool_refuse", "refuse")], ["grow", tx(t, "figPool_grow", "grow ×2")], ["recycle", tx(t, "figPool_recycle", "recycle oldest")]] as const} />
          <Btn onClick={() => reset()}>↻</Btn>
        </Row>}
        <Row>
          <Readout>{tx(t, "figPool_live", "live")}: {bullets.length}</Readout>
          <Readout color={s.allocLog.length ? C.red : C.green}>{tx(t, "figPool_allocs", "allocations in the last second")}: {s.allocLog.length}</Readout>
          <Readout>{tx(t, "figPool_total", "total allocations")}: {s.allocs + (mode === "pool" ? 1 : 0)}</Readout>
          {mode === "alloc" && <Readout>{tx(t, "figPool_frees", "frees")}: {s.frees}</Readout>}
          {mode === "pool" && policy === "refuse" && <Readout color={s.refused ? C.amber : C.muted}>{tx(t, "figPool_refused", "shots refused")}: {s.refused}</Readout>}
          {mode === "pool" && <Readout>{tx(t, "figPool_head", "free head")}: {s.head < 0 ? "−1 (empty)" : s.head}</Readout>}
        </Row>
      </>}
      note={mode === "alloc"
        ? tx(t, "figPool_noteAlloc", "Every shot is an allocation and every expired bullet is a free: at 9 shots per second that is 9 trips to the general-purpose allocator per second for a single ship, and with garbage collection each dead bullet is also work for the collector later. The objects also end up scattered around the heap, so updating them all walks memory in random order.")
        : tx(t, "figPool_notePool", "The whole array is allocated once. Acquiring a bullet pops the head of the free list; releasing one pushes it back on the front. Both are two assignments, no search. Raise the fire rate or the life until the pool runs dry and compare the policies: refuse drops shots (fine for sparks, bad for gameplay bullets), grow doubles the array (one allocation, and the pool never shrinks back), recycle steals the oldest live bullet (good for effects nobody will miss). The right size is the peak number alive at once: rate × life.")}
    >
      <div ref={ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <rect x={10} y={8} width={W - 20} height={SCENE_H} rx={6} fill="#0b1220" />
          {bullets.map((b, i) => <rect key={i} x={b.x - 6} y={b.y - 1.5} width={12} height={3} rx={1.5} fill={C.amber} />)}
          <polygon points={`${22},${s.shipY - 10} ${44},${s.shipY} ${22},${s.shipY + 10} ${27},${s.shipY}`} fill={C.sky} />
          {mode === "alloc" && s.allocLog.map((tm, i) => (
            <T key={i} x={50 + ((s.time - tm) * 60)} y={24 + (i % 5) * 9} size={7.5} color={C.red}>{"new"}</T>
          ))}
          {mode === "pool" ? <>
            <T x={20} y={ROW_Y - 30} size={8.5}>{tx(t, "figPool_arr", `pool array (${n} slots) · arcs: free list from head`)}</T>
            {links.map(([a, b], k) => {
              const x1 = cellX(a) + cw / 2, x2 = cellX(b) + cw / 2, hgt = Math.min(22, 6 + Math.abs(x2 - x1) * 0.12);
              return <path key={k} d={`M${x1},${ROW_Y - 2} Q${(x1 + x2) / 2},${ROW_Y - 2 - hgt} ${x2},${ROW_Y - 2}`} fill="none" stroke={C.green} strokeWidth={1.1} opacity={0.7} />;
            })}
            {s.slots.map((b, i) => (
              <g key={i}>
                <rect x={cellX(i) + 1} y={ROW_Y} width={cw - 2} height={20} rx={3}
                  fill={b ? C.amber : "var(--code-surface)"} fillOpacity={b ? 0.8 : 1} stroke={i === s.head ? C.green : "var(--code-border)"} strokeWidth={i === s.head ? 2 : 1} />
                {cw > 14 && <T x={cellX(i) + cw / 2} y={ROW_Y + 33} size={7.5} anchor="middle">{i}</T>}
              </g>
            ))}
          </> : <>
            <T x={20} y={ROW_Y - 30} size={8.5}>{tx(t, "figPool_heap", "heap: each live bullet is its own allocation, wherever the allocator found room")}</T>
            {bullets.map((b, i) => {
              // Deterministic but scattered "addresses" from the birth time
              const addr = Math.abs(Math.sin(b.born * 91.7)) * (W - 60);
              return <rect key={i} x={20 + addr} y={ROW_Y + (i % 2) * 10} width={12} height={9} rx={2} fill={C.red} opacity={0.75} />;
            })}
            <line x1={20} x2={W - 20} y1={ROW_Y + 24} y2={ROW_Y + 24} stroke={C.axis} />
          </>}
        </svg>
      </div>
    </Figure>
  );
}
