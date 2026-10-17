"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Btn, C, T, Handle, useDrag, useFrame, useRerender, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { CATCH, CRATES, ROOM, SIGHT, WAYPOINTS, blocked, btTick, fsmTick, makeGuard, sees, type BtNode, type P, type Status } from "./guard";

// ── What this figure shows ────────────────────────────────────────────────────
// A guard patrols a room; drag the player (green) around the crates. The guard
// sees in a cone that crates block. The same behaviour runs either as a finite
// state machine (three states, transitions on conditions) or as a behaviour
// tree (a selector over three branches, re-evaluated every tick); the diagram
// under the room lights up the active state, or the status of every node.
// "Search when lost" is the break-it switch: without it the guard forgets the
// player the moment they slip out of sight.

const W = ROOM.w, RH = ROOM.h, DY = RH + 14, DH = 136, H = DY + DH;
type Mode = "fsm" | "bt";

const STATUS_COLOR: Record<Status, string> = { success: C.green, failure: C.red, running: C.amber, idle: "var(--text-muted)" };

export function GuardFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("fsm");
  const [canSearch, setCanSearch] = useState(true);
  const [playing, setPlaying] = useState(false);
  const guard = useRef(makeGuard());
  const player = useRef<P>({ x: 120, y: 190 });
  const bt = useRef<Record<BtNode, Status> | null>(null);
  const lastEdge = useRef<{ edge: string; age: number } | null>(null);
  const caught = useRef(0);
  const vis = useVisible<HTMLDivElement>();
  const rerender = useRerender();
  const L = (k: string, en: string) => tx(t, `figAiGuard_${k}`, en);

  const drag = useDrag<"player">(
    p => (Math.hypot(p.x - player.current.x, p.y - player.current.y) < 24 ? "player" : null),
    (_, p) => {
      const q = { x: Math.max(10, Math.min(W - 10, p.x)), y: Math.max(10, Math.min(RH - 10, p.y)) };
      if (!blocked(q, 6)) player.current = q;
      rerender();
    },
  );

  useFrame(playing && vis.on, dt => {
    const g = guard.current, wasCaught = g.caught > 0;
    if (mode === "fsm") {
      const e = fsmTick(g, player.current, dt, canSearch);
      if (e) lastEdge.current = { edge: e, age: 0 };
    } else bt.current = btTick(g, player.current, dt, canSearch);
    if (lastEdge.current) lastEdge.current.age += dt;
    if (!wasCaught && g.caught > 0) caught.current++;
    rerender();
  });

  const reset = (m = mode) => { guard.current = makeGuard(); player.current = { x: 120, y: 190 }; bt.current = null; lastEdge.current = null; caught.current = 0; setPlaying(false); setMode(m); };
  const g = guard.current;
  const see = sees(g, player.current);
  const stateNow = mode === "fsm" ? g.state : see ? "chase" : g.last ? "search" : "patrol";

  // ── the view cone ──
  const cone = (() => {
    const n = 18, pts = [`${g.p.x},${g.p.y}`];
    for (let i = 0; i <= n; i++) {
      const a = g.heading - SIGHT.half + (2 * SIGHT.half * i) / n;
      pts.push(`${g.p.x + Math.cos(a) * SIGHT.range},${g.p.y + Math.sin(a) * SIGHT.range}`);
    }
    return pts.join(" ");
  })();

  // ── the state machine diagram ──
  // a triangle: Chase on top, Patrol and Search below; each arrow is a straight line shifted sideways
  // by `off` (so a pair of opposite arrows does not overlap), with its label at a fixed place
  const ST = {
    patrol: { x: 110, y: DY + 88, label: L("patrol", "Patrol") },
    chase: { x: 300, y: DY + 34, label: L("chase", "Chase") },
    search: { x: 490, y: DY + 88, label: L("search", "Search") },
  } as const;
  const edgeHot = (e: string) => lastEdge.current && lastEdge.current.edge === e && lastEdge.current.age < 1.2;
  type Edge = { from: keyof typeof ST; to: keyof typeof ST; label: string; off: number; lx: number; ly: number; anchor: "start" | "middle" | "end"; show: boolean };
  const fsmEdges: Edge[] = [
    { from: "patrol", to: "chase", label: L("eSee", "sees player"), off: 6, lx: 212, ly: DY + 84, anchor: "start", show: true },
    { from: "chase", to: "search", label: L("eLost", "loses sight"), off: 6, lx: 388, ly: DY + 84, anchor: "end", show: canSearch },
    { from: "search", to: "chase", label: L("eSee", "sees player"), off: 6, lx: 408, ly: DY + 44, anchor: "start", show: canSearch },
    { from: "search", to: "patrol", label: L("eGiveUp", "looked 3 s, nothing"), off: 0, lx: 300, ly: DY + 106, anchor: "middle", show: canSearch },
    { from: "chase", to: "patrol", label: L("eLost", "loses sight"), off: 6, lx: 192, ly: DY + 44, anchor: "end", show: !canSearch },
  ];

  // ── the behaviour tree diagram ──
  const BTN: Record<BtNode, { x: number; y: number; label: string; kind: "sel" | "seq" | "cond" | "act" }> = {
    root: { x: 300, y: DY + 20, label: "?", kind: "sel" },
    seqChase: { x: 112, y: DY + 62, label: "→", kind: "seq" },
    seqSearch: { x: 345, y: DY + 62, label: "→", kind: "seq" },
    patrol: { x: 530, y: DY + 62, label: L("btPatrol", "patrol"), kind: "act" },
    see: { x: 56, y: DY + 108, label: L("btSee", "sees player?"), kind: "cond" },
    chase: { x: 168, y: DY + 108, label: L("btChase", "chase"), kind: "act" },
    known: { x: 288, y: DY + 108, label: L("btKnown", "knows where?"), kind: "cond" },
    search: { x: 402, y: DY + 108, label: L("btSearch", "search there"), kind: "act" },
  };
  const BT_EDGES: [BtNode, BtNode][] = [["root", "seqChase"], ["root", "seqSearch"], ["root", "patrol"], ["seqChase", "see"], ["seqChase", "chase"], ["seqSearch", "known"], ["seqSearch", "search"]];
  const st = (n: BtNode): Status => (bt.current ? bt.current[n] : "idle");

  return (
    <Figure
      title={L("title", "A guard: state machine or behaviour tree")}
      head={<Choice value={mode} onChange={m => reset(m)} options={[["fsm", L("fsm", "state machine")], ["bt", L("bt", "behaviour tree")]] as const} />}
      controls={<Row>
        <Btn active={canSearch} onClick={() => setCanSearch(v => !v)}>{L("canSearch", "search when lost")}</Btn>
        <Readout color={stateNow === "chase" ? C.red : stateNow === "search" ? C.amber : C.fg}>{ST[stateNow].label}</Readout>
        <Readout>{L("caught", "caught")} {caught.current}</Readout>
      </Row>}
      note={L("note", "Press play and drag the green player around the room. The guard walks its patrol route; when the player is inside its view cone (and no crate is in the way) it chases, faster than it patrols. Duck behind a crate: it walks to the last place it saw you (the question mark), looks left and right for three seconds, and goes back to its route. In the state machine view, the guard is always in exactly one state, and arrows fire on conditions. The behaviour tree does the same job differently: every tick it asks the root, a selector (?), to try its children left to right until one does not fail; each sequence (→) runs its children until one fails. Green = success, red = failure, amber = still running. Now break it: switch off \"search when lost\". In the state machine that means rewiring the arrows; in the tree it is one branch removed. Either way the guard becomes easy to lose: one step behind a crate and it forgets you.")}
    >
      <div ref={vis.ref} className="flex flex-col">
        <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
          <rect x={1} y={1} width={W - 2} height={RH - 2} rx={6} fill="none" stroke={C.axis} strokeWidth={2} />
          <polyline points={[...WAYPOINTS, WAYPOINTS[0]].map(w => `${w.x},${w.y}`).join(" ")} fill="none" stroke={C.muted} strokeOpacity={0.35} strokeDasharray="3 5" />
          <polygon points={cone} fill={see ? C.red : C.amber} fillOpacity={see ? 0.2 : 0.12} />
          {CRATES.map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={4} fill={C.muted} fillOpacity={0.45} stroke={C.muted} />)}
          {g.last && <g><circle cx={g.last.x} cy={g.last.y} r={9} fill="none" stroke={C.amber} strokeDasharray="3 2" /><T x={g.last.x} y={g.last.y + 4} size={11} anchor="middle" bold color={C.amber}>?</T></g>}
          <circle cx={g.p.x} cy={g.p.y} r={11} fill={g.caught > 0 ? C.red : C.purple} />
          <line x1={g.p.x} y1={g.p.y} x2={g.p.x + Math.cos(g.heading) * 16} y2={g.p.y + Math.sin(g.heading) * 16} stroke="var(--card)" strokeWidth={3} strokeLinecap="round" />
          <Handle x={player.current.x} y={player.current.y} r={8} color={C.green} active={drag.dragging === "player"} />
          {g.caught > 0 && <T x={g.p.x} y={g.p.y - CATCH - 4} size={11} anchor="middle" bold color={C.red}>{L("gotYou", "caught!")}</T>}

          {/* the diagram of the logic */}
          <line x1={0} y1={DY - 6} x2={W} y2={DY - 6} stroke={C.axis} />
          {mode === "fsm" ? <g>
            {fsmEdges.filter(e => e.show).map((e, i) => {
              const a = ST[e.from], b = ST[e.to], hot = edgeHot(`${e.from}>${e.to}`);
              const len = Math.hypot(b.x - a.x, b.y - a.y), dx = (b.x - a.x) / len, dy = (b.y - a.y) / len;
              const nx = -dy * e.off, ny = dx * e.off, trim = 50;
              return (
                <g key={i}>
                  <line x1={a.x + dx * trim + nx} y1={a.y + dy * trim + ny} x2={b.x - dx * trim + nx} y2={b.y - dy * trim + ny}
                    stroke={hot ? C.amber : C.muted} strokeWidth={hot ? 2.6 : 1.3} markerEnd="url(#gArrow)" />
                  <T x={e.lx} y={e.ly} size={9} anchor={e.anchor} color={hot ? C.amber : C.muted}>{e.label}</T>
                </g>
              );
            })}
            {(Object.keys(ST) as (keyof typeof ST)[]).map(k => {
              const on = stateNow === k, off = k === "search" && !canSearch;
              return (
                <g key={k} opacity={off ? 0.3 : 1}>
                  <ellipse cx={ST[k].x} cy={ST[k].y} rx={44} ry={20} fill={on ? (k === "chase" ? C.red : k === "search" ? C.amber : C.purple) : "var(--card)"} fillOpacity={on ? 0.85 : 1}
                    stroke={k === "chase" ? C.red : k === "search" ? C.amber : C.purple} strokeWidth={1.6} />
                  <T x={ST[k].x} y={ST[k].y + 4} size={11} anchor="middle" bold color={on ? "#fff" : C.fg}>{ST[k].label}</T>
                </g>
              );
            })}
          </g> : <g>
            {BT_EDGES.map(([a, b]) => <line key={b} x1={BTN[a].x} y1={BTN[a].y + 12} x2={BTN[b].x} y2={BTN[b].y - 12}
              stroke={st(b) === "idle" ? C.axis : STATUS_COLOR[st(b)]} strokeWidth={st(b) === "idle" ? 1 : 2} opacity={(b === "seqSearch" || a === "seqSearch") && !canSearch ? 0.25 : 1} />)}
            {(Object.keys(BTN) as BtNode[]).map(k => {
              const n = BTN[k], s = st(k), wide = n.kind === "cond" || n.kind === "act";
              const w = wide ? 100 : 30, gone = (k === "seqSearch" || k === "known" || k === "search") && !canSearch;
              return (
                <g key={k} opacity={gone ? 0.25 : 1}>
                  <rect x={n.x - w / 2} y={n.y - 12} width={w} height={24} rx={n.kind === "cond" ? 12 : 5}
                    fill="var(--card)" stroke={STATUS_COLOR[s]} strokeWidth={s === "idle" ? 1 : 2.4} />
                  <T x={n.x} y={n.y + 4} size={n.kind === "sel" || n.kind === "seq" ? 13 : 9.5} anchor="middle" bold color={s === "idle" ? C.muted : C.fg}>{n.label}</T>
                </g>
              );
            })}
          </g>}
          <defs>
            <marker id="gArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={C.muted} />
            </marker>
          </defs>
        </svg>
        <Transport t={t} playing={playing} onPlay={() => setPlaying(v => !v)} onReset={() => reset()} />
      </div>
    </Figure>
  );
}
