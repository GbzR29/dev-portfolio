"use client";

import { useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Readout, Row, Slider, Sliders, C, T, f2, useRaf, useRerender } from "@/components/lesson/kit/figure";
import { simulate, REFRESH_MS, type Mode, type ImgState } from "./presentSim";

// ── What this figure shows ────────────────────────────────────────────────────
// A scrolling timeline, slowed down 5×: the GPU rendering frames into
// swapchain images, the state of each image (being rendered, waiting in the
// present queue, on screen) and what the 60 Hz display actually shows between
// vblanks (the dashed lines). The present mode, the image count and the GPU's
// frame time decide whether the GPU has to wait, whether frames are thrown
// away, whether the picture tears, and how old the picture on screen is.

const IMG_COLORS = [C.sky, C.amber, C.green, C.purple];
const W = 620, X0 = 86, X1 = 606, LANE = 24, VIEW_MS = 110, TOTAL = 1500, WARM = 300, SLOW = 5;

export function PresentModeFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("fifo");
  const [images, setImages] = useState(3);
  const [gpuMs, setGpuMs] = useState(9);
  const [playing, setPlaying] = useState(true);
  const clock = useRef(0);
  const rerender = useRerender();
  const ref = useRaf(playing, dt => { clock.current += (dt * 1000) / SLOW; rerender(); });

  const sim = useMemo(() => simulate(mode, images, gpuMs, TOTAL, WARM), [mode, images, gpuMs]);
  const v0 = WARM + (clock.current % (TOTAL - WARM - VIEW_MS));
  const v1 = v0 + VIEW_MS;
  const x = (ms: number) => X0 + ((ms - v0) / VIEW_MS) * (X1 - X0);
  const clipS = (s: number) => Math.max(x(s), X0), clipE = (e: number) => Math.min(x(e), X1);
  const vis = <S extends { s: number; e: number }>(a: S[]) => a.filter(p => p.e > v0 && p.s < v1);

  const yGpu = 22, yImg = (i: number) => yGpu + LANE + 10 + i * LANE, yScr = yImg(images) + 10;
  const H = yScr + LANE + 22;
  const st = sim.stats;
  const fill: Record<ImgState, number> = { render: 0.85, queued: 0.35, shown: 0.14 };

  const vblanks = vblanksIn(v0, v1);

  const block = (s: number, e: number, y: number, color: string, opacity: number, label?: string, key?: string, stroke?: boolean) => {
    const a = clipS(s), b = clipE(e);
    if (b - a < 0.5) return null;
    return (
      <g key={key}>
        <rect x={a} y={y + 2} width={b - a} height={LANE - 5} rx={3} fill={color} fillOpacity={opacity} stroke={stroke ? color : "none"} strokeWidth={1.2} />
        {label && b - a > 16 && <T x={(a + b) / 2} y={y + 15} size={8.5} anchor="middle" color={C.fg} bold>{label}</T>}
      </g>
    );
  };

  return (
    <Figure
      title={tx(t, "figVkPresent_title", "Present modes on a 60 Hz display")}
      head={<Choice value={mode} onChange={setMode} options={[["fifo", "FIFO"], ["mailbox", "MAILBOX"], ["immediate", "IMMEDIATE"]] as const} />}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figVkPresent_images", "images")} value={images} min={2} max={4} step={1} onChange={setImages} fmt={v => String(v)} />
          <Slider label={tx(t, "figVkPresent_gpu", "GPU ms / frame")} value={gpuMs} min={4} max={30} step={0.5} onChange={setGpuMs} fmt={v => `${f2(v, 1)} ms`} />
        </Sliders>
        <Row>
          <Btn onClick={() => setPlaying(p => !p)}>{playing ? "❚❚" : "▶"}</Btn>
          <Readout>{tx(t, "figVkPresent_rendered", "rendered")} {f2(st.renderedFps, 0)} fps</Readout>
          <Readout>{tx(t, "figVkPresent_shown", "reach the screen")} {f2(st.shownFps, 0)} / s</Readout>
          <Readout color={st.dropped ? C.amber : undefined}>{tx(t, "figVkPresent_dropped", "discarded")} {st.dropped}</Readout>
          <Readout color={st.tears ? C.red : undefined}>{tx(t, "figVkPresent_tears", "tears")} {st.tears}</Readout>
          <Readout>{tx(t, "figVkPresent_latency", "render start → screen")} {f2(st.latency, 1)} ms</Readout>
        </Row>
      </>}
      note={tx(t, "figVkPresent_note", "Counts are over 1.2 simulated seconds. Solid blocks are rendering, pale blocks are finished frames waiting in the present queue, outlined blocks are on screen. FIFO is vsync: every finished frame is shown, in order, at a vblank. When all images are busy the GPU waits (grey), so it can never outrun the display, and with more images, frames wait longer in the queue. MAILBOX never makes the GPU wait (with 3 images): a newer frame replaces the one waiting, which is thrown away, so the screen shows the freshest frame, without tearing. IMMEDIATE shows each frame the moment it is done, even halfway through a scan-out: lowest latency, but the red lines are tears. Make the GPU slower than 16.7 ms with 2 images and FIFO falls to 30 fps: a frame that misses a vblank waits for the next one, and the GPU cannot start another meanwhile. A third image lets it keep working, and the rate settles near 50 fps instead.")}
    >
      <div ref={ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
          <T x={8} y={yGpu + 15} size={8.5} bold color={C.fg}>GPU</T>
          {Array.from({ length: images }, (_, i) => (
            <T key={i} x={8} y={yImg(i) + 15} size={8.5} color={IMG_COLORS[i]} bold>{tx(t, "figVkPresent_image", "image")} {i}</T>
          ))}
          <T x={8} y={yScr + 15} size={8.5} bold color={C.fg}>{tx(t, "figVkPresent_screen", "screen")}</T>
          {vis(sim.waits).map((w, k) => block(w.s, w.e, yGpu, C.muted, 0.25, tx(t, "figVkPresent_wait", "wait"), `w${k}`))}
          {vis(sim.gpu).map(g => block(g.s, g.e, yGpu, IMG_COLORS[g.img], 0.85, `#${g.frame}`, `g${g.frame}`))}
          {vis(sim.states).map((s, k) => block(s.s, s.e, yImg(s.img), IMG_COLORS[s.img], fill[s.state], s.state === "render" ? undefined : `#${s.frame}`, `s${k}`, s.state === "shown"))}
          {vis(sim.screen).map((s, k) => block(s.s, s.e, yScr, IMG_COLORS[s.img], 0.6, `#${s.frame}`, `c${k}`))}
          {vis(sim.screen).filter(s => s.tear && s.s >= v0).map((s, k) => (
            <line key={`t${k}`} x1={x(s.s)} y1={yScr - 2} x2={x(s.s)} y2={yScr + LANE + 2} stroke={C.red} strokeWidth={2.4} />
          ))}
          {vblanks.map(vb => (
            <g key={vb}>
              <line x1={x(vb)} y1={yGpu} x2={x(vb)} y2={yScr + LANE} stroke={C.axis} strokeDasharray="3 3" />
              <T x={x(vb)} y={H - 8} size={7.5} anchor="middle">vblank</T>
            </g>
          ))}
        </svg>
      </div>
    </Figure>
  );
}

/** The vblank times inside [a, b). */
function vblanksIn(a: number, b: number) {
  const out: number[] = [];
  for (let k = Math.ceil(a / REFRESH_MS); k * REFRESH_MS < b; ++k) out.push(k * REFRESH_MS);
  return out;
}
