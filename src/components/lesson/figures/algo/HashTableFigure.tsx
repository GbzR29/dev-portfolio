"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, C, T, f2, mulberry32 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A hash table of whole-number keys with h(k) = k mod m. "chaining": every
// bucket holds a small list of the keys that hash there. "probing" (linear
// probing): one key per slot; a key whose slot is taken goes to the next free
// slot, wrapping around, and a search walks the same path until it finds the
// key or an empty slot. The amber path is the last insert or lookup. Tap a key
// to look it up. Watch the load factor α = n/m: with probing, runs of full
// slots (clusters) grow and the paths get long as α approaches 1; "grow"
// doubles m (to a prime) and re-inserts every key.

type Mode = "chaining" | "probing";
type Table = { m: number; chains: number[][]; slots: (number | null)[] };
const PRIMES = [11, 23, 47];
const nextPrime = (m: number) => PRIMES.find(p => p > m) ?? m;

function build(mode: Mode, m: number, keys: number[]): Table {
  const tb: Table = { m, chains: Array.from({ length: m }, () => []), slots: Array(m).fill(null) };
  for (const k of keys) insert(tb, mode, k);
  return tb;
}

/** Inserts k and returns the slots visited (for probing) or [bucket, position in chain]. */
function insert(tb: Table, mode: Mode, k: number): number[] {
  const h = k % tb.m;
  if (mode === "chaining") { tb.chains[h].push(k); return [h]; }
  const path: number[] = [];
  for (let i = 0; i < tb.m; ++i) {
    const s = (h + i) % tb.m;
    path.push(s);
    if (tb.slots[s] === null) { tb.slots[s] = k; return path; }
  }
  return path;
}

function lookup(tb: Table, mode: Mode, k: number): { path: number[]; found: boolean; cmps: number } {
  const h = k % tb.m;
  if (mode === "chaining") {
    const idx = tb.chains[h].indexOf(k);
    return { path: [h], found: idx >= 0, cmps: idx >= 0 ? idx + 1 : tb.chains[h].length };
  }
  const path: number[] = [];
  for (let i = 0; i < tb.m; ++i) {
    const s = (h + i) % tb.m;
    path.push(s);
    if (tb.slots[s] === null) return { path, found: false, cmps: path.length };
    if (tb.slots[s] === k) return { path, found: true, cmps: path.length };
  }
  return { path, found: false, cmps: path.length };
}

const W = 560, H = 250;

export function HashTableFigure({ t, initial = "chaining" }: { t?: TrackTranslations; initial?: Mode }) {
  const [mode, setMode] = useState<Mode>(initial);
  const [m, setM] = useState(11);
  const [keys, setKeys] = useState<number[]>([22, 15, 37, 4, 58]);
  const [seed, setSeed] = useState(1);
  const [last, setLast] = useState<{ k: number; path: number[]; kind: "insert" | "hit" | "miss"; cmps: number } | null>(null);
  const tb = build(mode, m, keys);
  const n = keys.length, alpha = n / m;
  const maxN = mode === "chaining" ? 30 : m - 1;

  const add = (count: number) => {
    const rnd = mulberry32(seed);
    const ks = [...keys];
    const t2 = build(mode, m, keys);
    let lastIns: number[] = [], lastK = -1;
    for (let c = 0; c < count && ks.length < maxN; ) {
      const k = Math.floor(rnd() * 100);
      if (ks.includes(k)) continue;
      ks.push(k); lastK = k; lastIns = insert(t2, mode, k); c++;
    }
    setSeed(seed + 1); setKeys(ks);
    if (lastK >= 0) setLast({ k: lastK, path: lastIns, kind: "insert", cmps: mode === "chaining" ? 1 : lastIns.length });
  };
  const find = (k: number) => { const r = lookup(tb, mode, k); setLast({ k, path: r.path, kind: r.found ? "hit" : "miss", cmps: r.cmps }); };
  const missing = () => { let k = 0; const rnd = mulberry32(seed * 13); do k = Math.floor(rnd() * 100); while (keys.includes(k)); setSeed(seed + 1); find(k); };

  // Average comparisons of a successful search, over all stored keys
  const avgHit = n ? keys.reduce((s, k) => s + lookup(tb, mode, k).cmps, 0) / n : 0;
  const onPath = new Set(last?.path ?? []);

  const cw = (W - 24) / m, x0 = 12;
  const lastMsg = last && (last.kind === "insert"
    ? `insert ${last.k}: h = ${last.k} mod ${m} = ${last.k % m}${mode === "probing" && last.path.length > 1 ? `, ${tx(t, "figHash_taken", "taken, moved on")} ${last.path.length - 1}×` : ""}`
    : `${tx(t, "figHash_find", "look up")} ${last.k}: h = ${last.k % m}, ${last.cmps} ${tx(t, "figHash_cmps", "comparisons")}, ${last.kind === "hit" ? tx(t, "figHash_hit", "found") : tx(t, "figHash_miss", "not there")}`);

  return (
    <Figure
      title={tx(t, "figHash_title", "Inside a hash table")}
      head={<Choice value={mode} onChange={v => { setMode(v); setLast(null); if (v === "probing" && keys.length >= m) setKeys(keys.slice(0, m - 1)); }} options={[["chaining", tx(t, "figHash_chaining", "chaining")], ["probing", tx(t, "figHash_probing", "linear probing")]] as const} />}
      controls={<>
        <Row>
          <Btn onClick={() => add(1)}>{tx(t, "figHash_insert", "insert a key")}</Btn>
          <Btn onClick={() => add(5)}>{tx(t, "figHash_insert5", "insert 5")}</Btn>
          <Btn onClick={missing}>{tx(t, "figHash_findMissing", "look up a missing key")}</Btn>
          <Btn onClick={() => { setM(nextPrime(m)); setLast(null); }}>{tx(t, "figHash_grow", "grow & rehash")}</Btn>
          <Btn onClick={() => { setM(11); setKeys([22, 15, 37, 4, 58]); setLast(null); }}>↻</Btn>
        </Row>
        <Row>
          <Readout>n = {n}</Readout>
          <Readout>m = {m}</Readout>
          <Readout color={alpha > 0.75 ? C.red : C.green}>α = n/m = {f2(alpha)}</Readout>
          <Readout color={C.amber}>{tx(t, "figHash_avg", "average comparisons, successful search")}: {f2(avgHit)}</Readout>
        </Row>
      </>}
      note={tx(t, "figHash_note", "The hash function turns a key into a bucket number in one step, so a lookup only has to look at one bucket instead of the whole table. Keys that land in the same bucket collide. With chaining, a bucket holds a list and the average list length is α. With linear probing, colliding keys spill into the following slots and form clusters, and the cost rises sharply as α approaches 1, which is why such tables grow at about α = 0.5 to 0.75. Growing changes m, so every key gets a new bucket and must be re-inserted.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <T x={x0} y={18} size={10} color={last?.kind === "miss" ? C.red : last?.kind === "hit" ? C.green : C.fg} bold>
          {lastMsg ?? tx(t, "figHash_start", "h(k) = k mod m; tap a key to look it up")}
        </T>
        {Array.from({ length: m }, (_, b) => {
          const x = x0 + b * cw, hl = onPath.has(b);
          const slot = tb.slots[b];
          return (
            <g key={b}>
              <T x={x + cw / 2} y={42} size={m > 23 ? 6 : 8} anchor="middle">{b}</T>
              <rect x={x + 1} y={48} width={cw - 2} height={24} rx={3} fill={hl ? C.amber : mode === "probing" && slot !== null ? C.sky : C.bg}
                fillOpacity={hl ? 0.45 : 0.3} stroke={hl ? C.amber : C.axis} strokeWidth={hl ? 1.8 : 1} />
              {mode === "probing" && slot !== null && (
                <g onClick={() => find(slot)} style={{ cursor: "pointer" }}>
                  <rect x={x + 1} y={48} width={cw - 2} height={24} fill="transparent" />
                  <T x={x + cw / 2} y={64} size={m > 23 ? 7 : 10} anchor="middle" color={slot % m === b ? C.fg : C.pink} bold>{slot}</T>
                </g>
              )}
              {mode === "chaining" && tb.chains[b].map((k, j) => (
                <g key={k} onClick={() => find(k)} style={{ cursor: "pointer" }}>
                  <line x1={x + cw / 2} y1={72 + j * 22} x2={x + cw / 2} y2={78 + j * 22} stroke={C.axis} />
                  <rect x={x + 2} y={78 + j * 22} width={cw - 4} height={18} rx={3} fill={last?.k === k ? C.amber : C.sky} fillOpacity={0.35} stroke={C.sky} strokeWidth={0.8} />
                  <T x={x + cw / 2} y={91 + j * 22} size={m > 23 ? 6.5 : 9} anchor="middle" color={C.fg}>{k}</T>
                </g>
              ))}
            </g>
          );
        })}
        {mode === "probing" && <T x={x0} y={96} size={8.5}>{tx(t, "figHash_pinkNote", "pink keys sit away from their home slot h(k): they were pushed along by collisions")}</T>}
      </svg>
    </Figure>
  );
}
