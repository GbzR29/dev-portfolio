"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, Slider, Sliders, T, useRaf, useRerender } from "@/components/lesson/kit/figure";
import { DEFAULT_TUNING, HALF_H, HALF_W, makeLevel, newPlayer, stepPlayer, type Input, type Player, type Tuning } from "./platformer";

// ── What this figure shows ────────────────────────────────────────────────────
// A small level to play with the controller of platformer.ts, stepped at a
// fixed 120 Hz. Every assist can be switched off to feel what it does: coyote
// time (jump just after running off a ledge), jump buffering (a press shortly
// before landing still counts), variable height (let go early for a small hop)
// and the heavier fall. The trail colours each jump by how it was triggered.

const LEVEL = makeLevel([
  "............................",
  "............................",
  "............................",
  "....................###.....",
  "............................",
  "..............##............",
  "........###.................",
  "...##..............#........",
  "...................#...##...",
  "...................#........",
  "######..######..#####..#####",
  "######..######..#####..#####",
]);
const TILE = 24, W = LEVEL.w * TILE, H = LEVEL.h * TILE, STEP = 1 / 120;
const START = { x: 1.5, y: 2.5 };
type Dot = { x: number; y: number; kind: Player["lastJump"] };
const KIND_COL: Record<Player["lastJump"], string> = { none: C.muted, normal: C.sky, coyote: C.amber, buffered: C.green };

export function PlatformerFigure({ t }: { t?: TrackTranslations }) {
  const [k, setK] = useState<Tuning>(DEFAULT_TUNING);
  const [active, setActive] = useState(false);
  const player = useRef<Player>(newPlayer(START.x, START.y));
  const input = useRef<Input>({ left: false, right: false, jump: false });
  const pressedFlag = useRef(false);
  const acc = useRef(0);
  const trail = useRef<Dot[]>([]);
  const counts = useRef({ normal: 0, coyote: 0, buffered: 0 });
  const box = useRef<HTMLDivElement>(null);
  const rerender = useRerender();
  const set = <K extends keyof Tuning>(key: K, v: Tuning[K]) => setK(o => ({ ...o, [key]: v }));

  const rafRef = useRaf(true, dt => {
    acc.current += Math.min(dt, 0.05);
    let n = 0;
    while (acc.current >= STEP) {
      acc.current -= STEP;
      const p = player.current, before = p.lastJumpAge;
      stepPlayer(p, input.current, pressedFlag.current, LEVEL, k, STEP);
      pressedFlag.current = false;
      if (p.lastJumpAge < before && p.lastJump !== "none") counts.current[p.lastJump]++;
      if (p.y < -2) { player.current = newPlayer(START.x, START.y); trail.current = []; }
      if (++n % 3 === 0) {
        trail.current.push({ x: p.x, y: p.y, kind: p.grounded ? "none" : p.lastJump });
        if (trail.current.length > 160) trail.current.shift();
      }
    }
    rerender();
  });

  // Keys, only while the figure has focus, so the page still scrolls normally
  const keyMap = (code: string): keyof Input | null =>
    code === "ArrowLeft" || code === "KeyA" ? "left" : code === "ArrowRight" || code === "KeyD" ? "right"
      : code === "Space" || code === "ArrowUp" || code === "KeyW" || code === "KeyZ" ? "jump" : null;
  const press = (key: keyof Input, down: boolean) => {
    if (key === "jump" && down && !input.current.jump) pressedFlag.current = true;
    input.current = { ...input.current, [key]: down };
  };
  const onKey = (down: boolean) => (e: React.KeyboardEvent) => {
    const key = keyMap(e.code);
    if (!key) return;
    e.preventDefault();
    if (!e.repeat) press(key, down);
  };
  useEffect(() => {
    // Losing focus must not leave a key held down
    const el = box.current;
    const blur = () => { input.current = { left: false, right: false, jump: false }; setActive(false); };
    el?.addEventListener("blur", blur);
    return () => el?.removeEventListener("blur", blur);
  }, []);

  const p = player.current;
  const X = (x: number) => x * TILE, Y = (y: number) => H - y * TILE;
  const since = p.grounded ? 0 : p.sinceGround;
  const pad = (key: keyof Input, label: string) => (
    <button type="button" className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-main)] bg-[var(--card)] select-none active:bg-[var(--primary-low)]"
      style={{ touchAction: "none" }}
      // mousedown's default would move focus to the button and blur the level
      onMouseDown={e => e.preventDefault()}
      onPointerDown={e => { e.preventDefault(); setActive(true); press(key, true); }} onPointerUp={() => press(key, false)}
      onPointerCancel={() => press(key, false)} onPointerLeave={() => press(key, false)}>{label}</button>
  );

  return (
    <Figure
      title={tx(t, "figPlat_title", "Platformer controller: play it")}
      head={<Btn onClick={() => { player.current = newPlayer(START.x, START.y); trail.current = []; counts.current = { normal: 0, coyote: 0, buffered: 0 }; }}>{tx(t, "figPlat_restart", "restart")}</Btn>}
      controls={<>
        <Row>
          <Btn active={k.useCoyote} onClick={() => set("useCoyote", !k.useCoyote)}>{k.useCoyote ? "✓ " : ""}{tx(t, "figPlat_coyote", "coyote time")}</Btn>
          <Btn active={k.useBuffer} onClick={() => set("useBuffer", !k.useBuffer)}>{k.useBuffer ? "✓ " : ""}{tx(t, "figPlat_buffer", "jump buffer")}</Btn>
          <Btn active={k.useCut} onClick={() => set("useCut", !k.useCut)}>{k.useCut ? "✓ " : ""}{tx(t, "figPlat_cut", "variable height")}</Btn>
          <Btn active={k.useFall} onClick={() => set("useFall", !k.useFall)}>{k.useFall ? "✓ " : ""}{tx(t, "figPlat_fall", "faster fall")}</Btn>
        </Row>
        <Sliders>
          <Slider label={tx(t, "figPlat_H", "jump height")} value={k.jumpHeight} min={1.5} max={5} step={0.1} onChange={v => set("jumpHeight", v)} fmt={v => `${v.toFixed(1)} tiles`} width="w-28" />
          <Slider label={tx(t, "figPlat_T", "time to apex")} value={k.timeToApex} min={0.2} max={0.7} step={0.01} onChange={v => set("timeToApex", v)} fmt={v => `${v.toFixed(2)} s`} width="w-28" />
          <Slider label={tx(t, "figPlat_coyoteMs", "coyote window")} value={k.coyote} min={0} max={0.25} step={0.01} onChange={v => set("coyote", v)} fmt={v => `${Math.round(v * 1000)} ms`} width="w-28" />
          <Slider label={tx(t, "figPlat_bufferMs", "buffer window")} value={k.buffer} min={0} max={0.25} step={0.01} onChange={v => set("buffer", v)} fmt={v => `${Math.round(v * 1000)} ms`} width="w-28" />
          <Slider label={tx(t, "figPlat_air", "air control")} value={k.airControl} min={0} max={1} step={0.05} onChange={v => set("airControl", v)} width="w-28" />
          <Slider label={tx(t, "figPlat_fallK", "fall gravity ×")} value={k.fallMultiplier} min={1} max={3} step={0.1} onChange={v => set("fallMultiplier", v)} width="w-28" />
        </Sliders>
        <Row>
          <Readout color={C.sky}>{tx(t, "figPlat_normal", "normal jumps")}: {counts.current.normal}</Readout>
          <Readout color={C.amber}>{tx(t, "figPlat_coyoteN", "coyote jumps")}: {counts.current.coyote}</Readout>
          <Readout color={C.green}>{tx(t, "figPlat_bufferedN", "buffered jumps")}: {counts.current.buffered}</Readout>
        </Row>
      </>}
      note={tx(t, "figPlat_note", "Click the level (or tab to it), then move with ←/→ or A/D and jump with Space, ↑ or W; on a phone use the buttons. The amber and green dots in the trail mark jumps that only happened thanks to an assist: amber jumped up to 100 ms after running off a ledge, green was pressed up to 120 ms before landing. Switch the assists off and run off the long ledges pressing jump a moment late: the same timing now drops you in the pit. Tap jump briefly for a small hop and hold it for a full jump.")}
    >
      <div ref={rafRef}>
        <div ref={box} tabIndex={0} className="outline-none relative" onKeyDown={onKey(true)} onKeyUp={onKey(false)}
          onFocus={() => setActive(true)} onPointerDown={() => box.current?.focus()}>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full block">
            {LEVEL.rows.map((row, ry) => [...row].map((ch, cx) => ch === "#" && (
              <rect key={`${cx}-${ry}`} x={cx * TILE} y={ry * TILE} width={TILE} height={TILE} fill={C.muted} opacity={0.45} stroke="var(--code-bg)" />
            )))}
            {trail.current.map((d, i) => <circle key={i} cx={X(d.x)} cy={Y(d.y)} r={2} fill={KIND_COL[d.kind]} opacity={0.35 + (0.6 * i) / trail.current.length} />)}
            <rect x={X(p.x - HALF_W)} y={Y(p.y + HALF_H)} width={2 * HALF_W * TILE} height={2 * HALF_H * TILE} rx={4}
              fill={p.lastJumpAge < 0.3 ? KIND_COL[p.lastJump] : C.orange} />
            {/* The coyote clock, as a shrinking bar over the player after leaving the ground */}
            {!p.grounded && !p.jumping && k.useCoyote && since < k.coyote && (
              <rect x={X(p.x - HALF_W)} y={Y(p.y + HALF_H) - 7} width={2 * HALF_W * TILE * (1 - since / k.coyote)} height={3} fill={C.amber} />
            )}
            {!active && (
              <g>
                <rect x={0} y={0} width={W} height={H} fill="var(--code-bg)" opacity={0.55} />
                <T x={W / 2} y={H / 2} anchor="middle" size={14} color={C.fg}>{tx(t, "figPlat_click", "click to play")}</T>
              </g>
            )}
          </svg>
        </div>
        <div className="flex justify-between gap-2 p-2 md:hidden">
          <div className="flex gap-2">{pad("left", "◀")}{pad("right", "▶")}</div>
          {pad("jump", tx(t, "figPlat_jump", "jump"))}
        </div>
      </div>
    </Figure>
  );
}
