"use client";

import { useMemo, useState, type ReactNode } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row } from "@/components/lesson/kit/figure";
import { ITEMS, MISSING, bucketCount, buckets, fnv1a, rbInsert, rbLayout, rbPath, type RB } from "./containerModel";

// ── What this figure shows ────────────────────────────────────────────────────
// One inventory of item names stored in three containers at once: a
// std::vector (in insertion order, searched front to back), a std::map (a
// red-black tree, searched from the root) and a std::unordered_map (a hash
// picks one bucket, then only that bucket's chain is compared). Clicking an
// item looks it up in all three and counts the comparisons each one needs;
// adding items shows how the counts grow, and the hash table doubling its
// buckets. Each panel also lists the order a range-for would visit. Break it:
// look up a missing key with scores["dragon"] instead of find, and both maps
// quietly gain an entry.

const NODE_W = 46, ROW_H = 40;
const RB_FILL = { R: "#dc2626", B: "#334155" };
// Inline, not the flex-wrap class: on phones figure.css turns .flex-wrap rows of
// buttons into sideways scrollers, and these item chips should wrap instead.
const WRAP = { flexWrap: "wrap" } as const;

export function ContainerFigure({ t }: { t?: TrackTranslations }) {
  const [n, setN] = useState(7);
  const [target, setTarget] = useState<string | null>("ring");
  const [useIndex, setUseIndex] = useState(false);
  const [ghost, setGhost] = useState(false);

  const vecKeys = ITEMS.slice(0, n);
  const mapKeys = ghost ? [...vecKeys, MISSING] : vecKeys;
  const keyStr = mapKeys.join(",");
  const tree = useMemo(() => keyStr.split(",").reduce<RB>((tr, k) => rbInsert(tr, k), null), [keyStr]);
  const layout = useMemo(() => rbLayout(tree), [tree]);
  const table = buckets(mapKeys);
  const B = bucketCount(mapKeys.length);

  // ── The lookup in each container ──
  const vecIdx = target ? vecKeys.indexOf(target) : -1;
  const vecCmp = target ? (vecIdx >= 0 ? vecIdx + 1 : vecKeys.length) : 0;
  const path = target ? rbPath(tree, target) : [];
  const inMap = target ? mapKeys.includes(target) : false;
  const hash = target ? fnv1a(target) : 0;
  const bIdx = target ? hash % B : -1;
  const chain = bIdx >= 0 ? table[bIdx] : [];
  const chainCmp = target ? (chain.includes(target) ? chain.indexOf(target) + 1 : chain.length) : 0;

  const lookup = (k: string) => {
    setTarget(k);
    if (useIndex && k === MISSING) setGhost(true);
  };
  const resize = (m: number) => { setN(Math.max(1, Math.min(ITEMS.length, m))); };
  const reset = () => { setN(7); setGhost(false); setTarget("ring"); };

  const call = target ? (useIndex ? `inv["${target}"]` : `inv.find("${target}")`) : "—";

  const panel = (name: string, big: string, readout: ReactNode, order: string[], children: ReactNode) => (
    <div className="p-3 border-b border-[var(--border)] last:border-b-0 flex flex-col gap-2 min-w-0">
      <div className="flex items-baseline gap-x-3 gap-y-1 flex-wrap">
        <code className="font-mono text-[12.5px] font-bold text-[var(--text-main)]">{name}</code>
        <span className="font-mono text-[11px] text-[var(--text-muted)]">{big}</span>
        <span className="ml-auto">{readout}</span>
      </div>
      {children}
      <div className="font-mono text-[10.5px] text-[var(--text-muted)] leading-relaxed break-words">
        <span className="uppercase tracking-wider text-[9.5px]">{tx(t, "figCppCon_order", "range-for visits")}:</span> {order.join(" · ")}
      </div>
    </div>
  );
  const cmpText = (k: number, found: boolean) => (
    <Readout color={found ? C.green : target ? C.red : undefined}>
      {target ? `${k} ${tx(t, "figCppCon_cmp", "comparisons")} · ${found ? tx(t, "figCppCon_found", "found") : tx(t, "figCppCon_notFound", "not found")}` : "—"}
    </Readout>
  );
  const chip = (k: string, state: "none" | "seen" | "hit" | "ghost", onClick?: () => void) => {
    const col = state === "hit" ? C.green : state === "seen" ? C.amber : state === "ghost" ? C.red : "var(--code-border)";
    return (
      <button key={k} type="button" onClick={onClick} disabled={!onClick}
        className="rounded-md border px-1.5 py-0.5 font-mono text-[11px] bg-[var(--code-surface)] text-[var(--text-main)] enabled:hover:border-[var(--primary)] transition-colors"
        style={{ borderColor: col, borderWidth: state === "none" ? 1 : 2 }}>
        {k}{state === "ghost" && <span style={{ color: C.red }}> = 0</span>}
      </button>
    );
  };

  const W = Math.max(1, layout.nodes.length) * NODE_W + 8;
  const H = (layout.depth + 1) * ROW_H + 6;
  const cx = (x: number) => 4 + x * NODE_W + NODE_W / 2;
  const cy = (y: number) => 4 + y * ROW_H + 12;
  const sorted = [...mapKeys].sort();

  return (
    <Figure
      title={tx(t, "figCppCon_title", "One inventory, three containers: how many comparisons to find an item?")}
      controls={<>
        <Row>
          <Btn onClick={() => resize(n + 1)}>{tx(t, "figCppCon_add1", "insert 1 item")}</Btn>
          <Btn onClick={() => resize(n + 5)}>{tx(t, "figCppCon_add5", "insert 5")}</Btn>
          <Btn onClick={() => resize(n - 1)}>{tx(t, "figCppCon_remove", "remove the last")}</Btn>
          <Btn onClick={reset}>{tx(t, "figCppCon_reset", "reset")}</Btn>
          <Readout>{tx(t, "figCppCon_size", "items")}: {mapKeys.length}</Readout>
        </Row>
        <Row>
          <span className="text-[12px] text-[var(--text-main)] mr-1">{tx(t, "figCppCon_look", "Look up")}</span>
          <Btn active={target === MISSING} onClick={() => lookup(MISSING)}>&quot;{MISSING}&quot; ({tx(t, "figCppCon_absent", "not in the inventory")})</Btn>
          <span className="text-[11px] text-[var(--text-muted)]">{tx(t, "figCppCon_click", "or click any item in the vector")}</span>
        </Row>
        <label className="flex items-center gap-2 text-[12px] text-[var(--text-main)] cursor-pointer select-none">
          <input type="checkbox" checked={useIndex} onChange={e => setUseIndex(e.target.checked)} className="accent-[var(--primary)]" />
          {tx(t, "figCppCon_breakIdx", "Break it: look up with inv[key] instead of inv.find(key)")}
        </label>
        {ghost && <p className="text-[12.5px] leading-relaxed" style={{ color: C.red }}>
          {tx(t, "figCppCon_ghostMsg", "inv[\"dragon\"] did not just look: on a missing key, operator[] inserts it with a default value (0) and returns that. Both maps now hold a dragon that nobody put there. To only ask, use find, contains or at.")}
        </p>}
      </>}
      note={tx(t, "figCppCon_note", "Add items and look up the last one: the vector's count grows with every item, the tree's by one each time the item count doubles, and the hash table's stays near 1 because it jumps straight to one bucket. Red nodes and black nodes are how the red-black tree keeps itself balanced: no path from the root is more than twice as long as any other.")}
    >
      <div className="px-3 pt-3 font-mono text-[12px] text-[var(--text-muted)]">
        <span className="text-[var(--text-main)]">{call}</span>
        {target && <span>  ·  hash(&quot;{target}&quot;) = 0x{hash.toString(16).padStart(8, "0")} → {tx(t, "figCppCon_bucket", "bucket")} {hash} % {B} = {bIdx}</span>}
      </div>

      {panel("std::vector<Item>", tx(t, "figCppCon_bigVec", "find: O(n), checks one by one"), cmpText(vecCmp, vecIdx >= 0), vecKeys,
        <div className="flex gap-1.5" style={WRAP}>
          {vecKeys.map((k, i) => chip(k, i === vecIdx ? "hit" : target && (vecIdx < 0 || i < vecIdx) ? "seen" : "none", () => lookup(k)))}
        </div>)}

      {panel("std::map<std::string, int>", tx(t, "figCppCon_bigMap", "find: O(log n), one path down the tree"), cmpText(path.length, inMap), sorted,
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="block mx-auto" style={{ width: "100%", maxWidth: W, minWidth: Math.min(W, 640) }} role="img" aria-label="red-black tree">
            {layout.nodes.filter(nd => nd.px !== undefined).map(nd => (
              <line key={`e-${nd.key}`} x1={cx(nd.px!)} y1={cy(nd.py!)} x2={cx(nd.x)} y2={cy(nd.y)}
                stroke={path.includes(nd.key) && path.includes(layout.nodes.find(p => p.x === nd.px)!.key) ? C.amber : "var(--code-gutter)"} strokeWidth={1.5} />
            ))}
            {layout.nodes.map(nd => {
              const on = path.includes(nd.key);
              const hit = on && nd.key === target;
              const ghostNode = nd.key === MISSING;
              return (
                <g key={nd.key}>
                  <rect x={cx(nd.x) - 21} y={cy(nd.y) - 10} width={42} height={20} rx={5} fill={RB_FILL[nd.color]}
                    stroke={hit ? C.green : on ? C.amber : ghostNode ? C.red : "none"} strokeWidth={2.5} />
                  <text x={cx(nd.x)} y={cy(nd.y) + 3.5} textAnchor="middle" fontSize={10} fontFamily="ui-monospace, monospace" fill="#fff">{nd.key}</text>
                </g>
              );
            })}
          </svg>
        </div>)}

      {panel("std::unordered_map<std::string, int>", `${tx(t, "figCppCon_bigHash", "find: O(1) on average, one bucket")} · ${tx(t, "figCppCon_load", "load factor")} ${mapKeys.length}/${B} = ${(mapKeys.length / B).toFixed(2)}`,
        target ? <Readout color={chain.includes(target) ? C.green : C.red}>
          1 hash + {chainCmp} {tx(t, "figCppCon_cmp", "comparisons")} · {chain.includes(target) ? tx(t, "figCppCon_found", "found") : tx(t, "figCppCon_notFound", "not found")}
        </Readout> : <Readout>—</Readout>,
        table.flat(),
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1">
          {table.map((ch, i) => (
            <div key={i} className="flex items-center gap-1.5 rounded px-1 py-0.5 min-w-0"
              style={{ ...WRAP, background: i === bIdx ? "var(--primary-low)" : undefined }}>
              <span className="font-mono text-[10.5px] text-[var(--text-muted)] w-6 text-right shrink-0">[{i}]</span>
              {ch.length ? ch.map((k, j) => chip(k,
                k === MISSING && ghost && k !== target ? "ghost" : i === bIdx && k === target ? "hit" : i === bIdx && (j < chainCmp) ? "seen" : "none"))
                : <span className="text-[var(--text-muted)] text-[11px]">—</span>}
            </div>
          ))}
        </div>)}
    </Figure>
  );
}
