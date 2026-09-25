"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, C, T, Vec, Handle, useDrag, clamp } from "@/components/lesson/kit/figure";
import { perlinParts, perlin2, gradient, fade } from "@/components/lesson/kit/noise";

// ── What this figure shows ────────────────────────────────────────────────────
// Perlin noise evaluated at one draggable point P, one step at a time:
//   1  the integer lattice, with a random unit gradient at every corner
//   2  the four offset vectors from the corners of P's cell to P
//   3  the four dot products gradient · offset (each corner's "vote")
//   4  the fade weights u = fade(fx), v = fade(fy) and the two-stage blend
//   5  the result, over the whole plane
// The background image is the finished noise, so you can compare the number
// computed for P with the brightness under it.

const CELLS_X = 5, CELLS_Y = 3, W = 560, CS = W / CELLS_X, H = CS * CELLS_Y;
const COR = [C.red, C.amber, C.sky, C.purple];   // corners 00, 10, 01, 11

export function PerlinStepsFigure({ t }: { t?: TrackTranslations }) {
  const [step, setStep] = useState(1);
  const [seed, setSeed] = useState(11);
  const [bg, setBg] = useState(true);
  const [P, setP] = useState({ x: 2.35, y: 1.3 });
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const w = 280, h = Math.round(280 * CELLS_Y / CELLS_X);
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d")!, img = ctx.createImageData(w, h);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const x = ((i + 0.5) / w) * CELLS_X, y = CELLS_Y - ((j + 0.5) / h) * CELLS_Y;
      const v = perlin2(x, y, seed);                       // about −0.7 … 0.7
      const g = clamp(128 + v * 180, 0, 255);
      const k = (j * w + i) * 4;
      img.data[k] = g * 0.55; img.data[k + 1] = g * 0.7; img.data[k + 2] = g; img.data[k + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [seed]);

  // world (y up) ↔ viewBox
  const X = (x: number) => x * CS, Y = (y: number) => H - y * CS;
  const drag = useDrag<"p">(q => (Math.hypot(q.x - X(P.x), q.y - Y(P.y)) < 22 ? "p" : null),
    (_, q) => setP({ x: clamp(q.x / CS, 0.02, CELLS_X - 0.02), y: clamp((H - q.y) / CS, 0.02, CELLS_Y - 0.02) }));

  const r = perlinParts(P.x, P.y, seed);
  const corners = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => ({ x: r.ix + a, y: r.iy + b }));
  const G = 0.36;          // drawn gradient length, in cells
  const stepNames = [
    tx(t, "figPerlin_s1", "1 · gradients"),
    tx(t, "figPerlin_s2", "2 · offsets"),
    tx(t, "figPerlin_s3", "3 · dot products"),
    tx(t, "figPerlin_s4", "4 · fade & blend"),
    tx(t, "figPerlin_s5", "5 · result"),
  ];
  const notes = [
    tx(t, "figPerlin_n1", "Every integer point of the grid gets a unit vector pointing in a random direction. \"Random\" here means a hash of the corner's coordinates and the seed, so the same corner always gets the same gradient: the noise is a pure function of position, it needs no stored table and it never changes when you come back to a place."),
    tx(t, "figPerlin_n2", "P lies in one cell. From each of that cell's four corners, draw the vector to P. These offsets are just P's fractional coordinates (fx, fy) minus the corner: (fx, fy), (fx − 1, fy), (fx, fy − 1), (fx − 1, fy − 1)."),
    tx(t, "figPerlin_n3", "Each corner votes with the dot product of its gradient and its offset. The vote is positive when P lies in the direction the gradient points, negative behind it, zero on the line through the corner perpendicular to the gradient. At the corner itself the offset is zero, so the noise is exactly 0 on every lattice point: that is what makes gradient noise look less blocky than value noise."),
    tx(t, "figPerlin_n4", "The votes are blended like bilinear filtering, but the weights go through fade(t) = 6t⁵ − 15t⁴ + 10t³ first. Blend the bottom pair by u, the top pair by u, then those two results by v. The fade has zero slope and zero curvature at 0 and 1, so neighbouring cells meet without a visible crease."),
    tx(t, "figPerlin_n5", "Done: one number per point, smooth everywhere, with features about one cell apart. Drag P around and compare the value with the brightness under it. Scaling the input (sampling perlin(x·f, y·f)) changes the feature size; adding several scaled copies gives fBm, in the next figure."),
  ];

  return (
    <Figure
      title={tx(t, "figPerlin_title", "Perlin noise, one point at a time")}
      head={<>
        <Btn active={bg} onClick={() => setBg(b => !b)}>{tx(t, "figPerlin_bg", "noise image")}</Btn>
        <Btn onClick={() => setSeed(s => s + 1)}>{tx(t, "figPerlin_seed", "new seed")}</Btn>
      </>}
      controls={<>
        <Row><Choice value={String(step)} onChange={v => setStep(Number(v))} options={stepNames.map((n, i) => [String(i + 1), n] as const)} /></Row>
        <Row>
          <Readout>P = ({P.x.toFixed(2)}, {P.y.toFixed(2)})</Readout>
          <Readout>{tx(t, "figPerlin_cell", "cell")} ({r.ix}, {r.iy}) · f = ({r.fx.toFixed(2)}, {r.fy.toFixed(2)})</Readout>
          {step >= 3 && r.dots.map((d, i) => <Readout key={i} color={COR[i]}>d{["00", "10", "01", "11"][i]} = {d.toFixed(3)}</Readout>)}
          {step >= 4 && <>
            <Readout>u = fade({r.fx.toFixed(2)}) = {r.u.toFixed(3)}</Readout>
            <Readout>v = fade({r.fy.toFixed(2)}) = {r.v.toFixed(3)}</Readout>
          </>}
          {step >= 4 && <Readout color={C.green}>{tx(t, "figPerlin_noise", "noise")} = {r.value.toFixed(3)}</Readout>}
        </Row>
      </>}
      note={notes[step - 1]}
    >
      <div className="relative">
        <canvas ref={canvas} className="absolute inset-0 w-full h-full" style={{ imageRendering: "auto", opacity: bg && step >= 1 ? (step === 5 ? 1 : 0.45) : 0, transition: "opacity .3s" }} />
        <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="relative w-full h-auto cursor-grab">
          {Array.from({ length: CELLS_X + 1 }, (_, i) => <line key={`v${i}`} x1={X(i)} x2={X(i)} y1={0} y2={H} stroke={C.axis} strokeOpacity={0.6} />)}
          {Array.from({ length: CELLS_Y + 1 }, (_, j) => <line key={`h${j}`} y1={Y(j)} y2={Y(j)} x1={0} x2={W} stroke={C.axis} strokeOpacity={0.6} />)}
          {step < 5 && <rect x={X(r.ix)} y={Y(r.iy + 1)} width={CS} height={CS} fill={C.fg} opacity={0.06} />}
          {/* all gradients */}
          {Array.from({ length: (CELLS_X + 1) * (CELLS_Y + 1) }, (_, k) => {
            const i = k % (CELLS_X + 1), j = Math.floor(k / (CELLS_X + 1));
            const g = gradient(i, j, seed);
            const mine = corners.findIndex(c => c.x === i && c.y === j);
            const col = mine >= 0 && step >= 2 ? COR[mine] : C.fg;
            return (
              <g key={k} opacity={step === 5 ? 0.35 : mine >= 0 || step === 1 ? 1 : 0.35}>
                <circle cx={X(i)} cy={Y(j)} r={3} fill={col} />
                <Vec a={{ x: X(i), y: Y(j) }} b={{ x: X(i + g[0] * G), y: Y(j + g[1] * G) }} color={col} w={2} />
              </g>
            );
          })}
          {/* offsets */}
          {step >= 2 && step < 5 && corners.map((c, i) => (
            <line key={i} x1={X(c.x)} y1={Y(c.y)} x2={X(P.x)} y2={Y(P.y)} stroke={COR[i]} strokeWidth={1.5} strokeDasharray="5 3" />
          ))}
          {/* dot product labels at the corners */}
          {step >= 3 && step < 5 && corners.map((c, i) => {
            const dx = i % 2 ? 8 : -8, dy = i < 2 ? 14 : -8;
            return <T key={i} x={X(c.x) + dx} y={Y(c.y) + dy} size={10} bold color={COR[i]} anchor={i % 2 ? "start" : "end"}>{r.dots[i].toFixed(2)}</T>;
          })}
          {/* fade & blend: points on the bottom and top edges, then between them */}
          {step === 4 && (() => {
            const bx = X(r.ix + r.u);
            return (
              <g>
                <line x1={bx} x2={bx} y1={Y(r.iy)} y2={Y(r.iy + 1)} stroke={C.green} strokeWidth={1.4} />
                <circle cx={bx} cy={Y(r.iy)} r={4} fill={C.green} />
                <circle cx={bx} cy={Y(r.iy + 1)} r={4} fill={C.green} />
                <T x={bx + 6} y={Y(r.iy) - 5} size={9} color={C.green}>{`bottom ${r.bottom.toFixed(2)}`}</T>
                <T x={bx + 6} y={Y(r.iy + 1) + 13} size={9} color={C.green}>{`top ${r.top.toFixed(2)}`}</T>
                <circle cx={bx} cy={Y(r.iy + r.v)} r={5} fill="none" stroke={C.green} strokeWidth={2} />
                {/* fade curve inset */}
                <g transform={`translate(${X(r.ix) + 6},${Y(r.iy + 1) + 6})`}>
                  <rect width={46} height={46} fill="var(--code-bg)" opacity={0.85} rx={3} />
                  <polyline fill="none" stroke={C.pink} strokeWidth={1.4}
                    points={Array.from({ length: 21 }, (_, k) => `${3 + (k / 20) * 40},${43 - fade(k / 20) * 40}`).join(" ")} />
                  <polyline fill="none" stroke={C.axis} strokeDasharray="2 2" points="3,43 43,3" />
                  <circle cx={3 + r.fx * 40} cy={43 - r.u * 40} r={2.5} fill={C.pink} />
                </g>
              </g>
            );
          })()}
          <Handle x={X(P.x)} y={Y(P.y)} color={C.green} active />
          <T x={X(P.x) + 10} y={Y(P.y) - 9} size={10} bold color={C.fg}>P</T>
          {step === 1 && <T x={6} y={14} size={9} color={C.fg}>{tx(t, "figPerlin_drag", "drag P")}</T>}
        </svg>
      </div>
    </Figure>
  );
}
