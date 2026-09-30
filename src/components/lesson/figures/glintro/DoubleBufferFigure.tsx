"use client";

import { useId, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Readout, Row, Slider, Sliders, C, T, f2, useRaf, useRerender } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A program drawing a little scene (clear, ground, sun, a moving box) frame
// after frame, and a 60 Hz display scanning a buffer out top to bottom, slowed
// down 25×. With one buffer the display reads the picture while it is being
// drawn: half-drawn frames and flashes of the clear colour. With two buffers
// the program draws into the back one and swaps; without vsync the swap
// happens mid-scan and the picture tears; with vsync (glfwSwapInterval(1)) it
// waits for the vertical blank and every scanned picture is whole.

type Mode = "single" | "double" | "vsync";
type Content = { f: number; steps: number };        // frame number, draw calls done (0..4)

const P = 1000 / 60, SLOW = 25, BANDS = 28;
const PW = 250, PH = 150, GAP = 40, W = PW * 2 + GAP + 20, H = PH + 46;

/** The scene as it stands after `steps` of frame f's four draw calls. */
function Scene({ c, x0 }: { c: Content; x0: number }) {
  const f = c.steps === 0 ? c.f - 1 : c.f, steps = c.steps === 0 ? 4 : c.steps;
  if (f < 0) return <rect x={x0} y={0} width={PW} height={PH} fill="#000" />;
  const bx = 20 + ((f * 13) % (PW - 60));
  return (
    <g>
      <rect x={x0} y={0} width={PW} height={PH} fill="#16324a" />
      {steps >= 2 && <rect x={x0} y={PH * 0.68} width={PW} height={PH * 0.32} fill="#2f6b3a" />}
      {steps >= 3 && <circle cx={x0 + PW * 0.8} cy={PH * 0.25} r={16} fill="#f5c542" />}
      {steps >= 4 && <rect x={x0 + bx} y={PH * 0.68 - 34} width={34} height={34} rx={4} fill="#ef4444" />}
      {steps >= 4 && <text x={x0 + bx + 17} y={PH * 0.68 - 12} fontSize={11} textAnchor="middle" fill="#fff" fontFamily="monospace">{f % 100}</text>}
    </g>
  );
}

type Sim = { t: number; drawing: Content; drawT: number; waiting: boolean; front: Content; bands: Content[]; lastBand: number; swaps: number; tears: number };
const init = (): Sim => ({ t: 0, drawing: { f: 0, steps: 0 }, drawT: 0, waiting: false, front: { f: 0, steps: 0 }, bands: Array.from({ length: BANDS }, () => ({ f: 0, steps: 0 })), lastBand: -1, swaps: 0, tears: 0 });

function advance(s: Sim, dtMs: number, mode: Mode, drawMs: number) {
  const step = 0.25;                                   // integrate in small sub-steps
  for (let left = dtMs; left > 0; left -= step) {
    const h = Math.min(step, left);
    const before = s.t;
    s.t += h;
    // The program draws.
    if (!s.waiting) {
      s.drawT += h;
      s.drawing = { f: s.drawing.f, steps: Math.min(4, Math.floor((s.drawT / drawMs) * 4 + 1e-9)) };
      if (mode === "single") s.front = s.drawing;
      if (s.drawT >= drawMs) {
        if (mode === "vsync") s.waiting = true;
        else {
          if (mode === "double") { s.front = { ...s.drawing }; s.swaps++; }
          s.drawing = { f: s.drawing.f + 1, steps: 0 }; s.drawT = 0;
        }
      }
    }
    // Vertical blank: a waiting vsync swap happens now.
    if (Math.floor(s.t / P) !== Math.floor(before / P)) {
      if (mode === "vsync" && s.waiting) {
        s.front = { ...s.drawing }; s.swaps++;
        s.drawing = { f: s.drawing.f + 1, steps: 0 }; s.drawT = 0; s.waiting = false;
      }
    }
    // Scan-out: the display copies the band under the beam from the front buffer.
    const band = Math.floor(((s.t % P) / P) * BANDS);
    while (s.lastBand !== band) {
      s.lastBand = (s.lastBand + 1) % BANDS;
      s.bands[s.lastBand] = { ...(mode === "single" ? s.drawing : s.front) };
      const prev = s.bands[s.lastBand - 1];
      if (s.lastBand > 0 && prev && (prev.f !== s.bands[s.lastBand].f || prev.steps !== s.bands[s.lastBand].steps)) s.tears++;
    }
  }
}

export function DoubleBufferFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("single");
  const [drawMs, setDrawMs] = useState(9);
  const [playing, setPlaying] = useState(true);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const sim = useRef<Sim>(init());
  const rerender = useRerender();
  const ref = useRaf(playing, dt => { advance(sim.current, (dt * 1000) / SLOW, mode, drawMs); rerender(); });

  const s = sim.current;
  const scanY = ((s.t % P) / P) * PH;
  const bandH = PH / BANDS;
  const reset = (m: Mode) => { setMode(m); sim.current = init(); };
  const sx = PW + GAP + 10;
  const broken = s.bands.some((b, i) => i > 0 && (b.f !== s.bands[i - 1].f || b.steps !== s.bands[i - 1].steps)) || s.bands.some(b => b.steps > 0 && b.steps < 4);

  return (
    <Figure
      title={tx(t, "figGlBuf_title", "Single buffer, double buffer, vsync")}
      head={<Choice value={mode} onChange={reset} options={[["single", tx(t, "figGlBuf_single", "one buffer")], ["double", tx(t, "figGlBuf_double", "two buffers")], ["vsync", tx(t, "figGlBuf_vsync", "two buffers + vsync")]] as const} />}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figGlBuf_draw", "draw time")} value={drawMs} min={3} max={14} step={0.5} onChange={setDrawMs} fmt={v => `${f2(v, 1)} ms`} />
        </Sliders>
        <Row>
          <Btn onClick={() => setPlaying(p => !p)}>{playing ? "❚❚" : "▶"}</Btn>
          <Readout color={broken ? C.red : C.green}>{broken ? tx(t, "figGlBuf_broken", "the screen shows a mixed or half-drawn picture") : tx(t, "figGlBuf_whole", "the screen shows one whole frame")}</Readout>
        </Row>
      </>}
      note={tx(t, "figGlBuf_note", "Slowed down 25 times. The white line is the display's beam, reading the picture from top to bottom once per refresh. With one buffer it reads whatever is there at that instant, so you catch frames being cleared and half drawn. With two buffers the program draws out of sight and glfwSwapBuffers exchanges them; if the swap comes mid-scan, the top of the screen shows one frame and the bottom the next: a tear, visible where the red box is cut. With vsync the swap waits for the beam to return to the top, so every picture is whole, and the program is paced to the refresh rate.")}
    >
      <div ref={ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
          <T x={10} y={14} size={9} bold color={C.fg}>{mode === "single" ? tx(t, "figGlBuf_only", "the only buffer (being drawn)") : tx(t, "figGlBuf_back", "back buffer (being drawn)")}</T>
          <T x={sx} y={14} size={9} bold color={C.fg}>{tx(t, "figGlBuf_screen", "what the screen shows")}</T>
          <g transform="translate(10,22)">
            <Scene c={s.drawing} x0={0} />
            <rect x={0} y={0} width={PW} height={PH} fill="none" stroke={C.axis} />
            <T x={4} y={PH + 14} size={8.5}>{s.waiting ? tx(t, "figGlBuf_waiting", "done, waiting for vblank") : `${tx(t, "figGlBuf_frame", "frame")} ${s.drawing.f % 100}: ${["—", "glClear", "+ ground", "+ sun", "+ box"][s.drawing.steps]}`}</T>
          </g>
          <g transform={`translate(${sx},22)`}>
            <defs>
              {s.bands.map((_, i) => <clipPath key={i} id={`${uid}b${i}`}><rect x={0} y={i * bandH} width={PW} height={bandH + 0.6} /></clipPath>)}
            </defs>
            {s.bands.map((b, i) => <g key={i} clipPath={`url(#${uid}b${i})`}><Scene c={b} x0={0} /></g>)}
            {s.bands.map((b, i) => i > 0 && b.f !== s.bands[i - 1].f
              ? <line key={`t${i}`} x1={0} y1={i * bandH} x2={PW} y2={i * bandH} stroke={C.red} strokeWidth={1.5} strokeDasharray="5 3" /> : null)}
            <line x1={-6} y1={scanY} x2={PW + 6} y2={scanY} stroke="#fff" strokeWidth={2} />
            <rect x={0} y={0} width={PW} height={PH} fill="none" stroke={C.axis} />
          </g>
        </svg>
      </div>
    </Figure>
  );
}
