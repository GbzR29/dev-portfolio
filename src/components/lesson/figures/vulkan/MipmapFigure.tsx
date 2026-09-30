"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Readout, Row, Slider, Sliders, C, f2, useRaf } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A checkerboard floor seen by a camera, rendered pixel by pixel on the CPU
// at a deliberately low resolution so every pixel is visible. For each pixel
// the floor point, its uv and the uv of the neighbouring pixels are computed
// exactly; the uv difference gives ρ (texels per pixel) and λ = log2 ρ, the
// level a GPU would pick. The texture is sampled with the chosen filter
// from a real mip chain built by 2 × 2 averaging. Moving the floor shows the
// shimmer that aliasing causes; "colour the levels" tints each level.

type Mode = "nearest" | "linear" | "trilinear" | "levels";

const TEX = 64, LEVELS = 7;                    // 64 × 64 → 7 levels: 64, 32, 16, 8, 4, 2, 1
const CW = 200, CH = 112, FOV = Math.tan((55 * Math.PI) / 360), TILE = 2;
const LEVEL_TINT = [[1, 0.25, 0.25], [1, 0.6, 0.1], [0.95, 0.9, 0.2], [0.3, 0.9, 0.3], [0.2, 0.8, 0.9], [0.35, 0.45, 1], [0.8, 0.35, 1]];
const SKY = [0.05, 0.06, 0.1];

// ── The texture and its mip chain ─────────────────────────────────────────────
function buildChain(): Float32Array[] {
  const base = new Float32Array(TEX * TEX * 3);
  for (let y = 0; y < TEX; y++) for (let x = 0; x < TEX; x++) {
    const on = ((x >> 3) + (y >> 3)) & 1;                          // 8 × 8 texel checks
    const line = x % 32 === 0 || y % 32 === 0;                     // a red line every 32 texels
    const k = (y * TEX + x) * 3;
    const v = on ? 0.9 : 0.12;
    base[k] = line ? 0.95 : v; base[k + 1] = line ? 0.2 : v; base[k + 2] = line ? 0.2 : v;
  }
  const chain = [base];
  for (let l = 1; l < LEVELS; l++) {
    const s = TEX >> l, src = chain[l - 1], ss = s * 2, dst = new Float32Array(s * s * 3);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) for (let c = 0; c < 3; c++) {
      const at = (xx: number, yy: number) => src[(yy * ss + xx) * 3 + c];
      dst[(y * s + x) * 3 + c] = (at(2 * x, 2 * y) + at(2 * x + 1, 2 * y) + at(2 * x, 2 * y + 1) + at(2 * x + 1, 2 * y + 1)) / 4;
    }
    chain.push(dst);
  }
  return chain;
}

const wrap = (i: number, s: number) => ((i % s) + s) % s;
function fetch(chain: Float32Array[], l: number, x: number, y: number, out: number[], w = 1) {
  const s = TEX >> l, k = (wrap(y, s) * s + wrap(x, s)) * 3, d = chain[l];
  out[0] += d[k] * w; out[1] += d[k + 1] * w; out[2] += d[k + 2] * w;
}
function nearest(chain: Float32Array[], l: number, u: number, v: number, out: number[], w = 1) {
  const s = TEX >> l;
  fetch(chain, l, Math.floor(u * s), Math.floor(v * s), out, w);
}
function bilinear(chain: Float32Array[], l: number, u: number, v: number, out: number[], w = 1) {
  const s = TEX >> l, x = u * s - 0.5, y = v * s - 0.5, x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  fetch(chain, l, x0, y0, out, w * (1 - fx) * (1 - fy)); fetch(chain, l, x0 + 1, y0, out, w * fx * (1 - fy));
  fetch(chain, l, x0, y0 + 1, out, w * (1 - fx) * fy);   fetch(chain, l, x0 + 1, y0 + 1, out, w * fx * fy);
}

// ── The camera: floor point and uv of a pixel ─────────────────────────────────
function uvAt(px: number, py: number, h: number, pitch: number, scroll: number): [number, number] | null {
  const nx = ((px / CW) * 2 - 1) * FOV * (CW / CH), ny = (1 - (py / CH) * 2) * FOV;
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const dy = ny * cp - sp, dz = ny * sp + cp;                      // rotate (nx, ny, 1) down by pitch
  if (dy > -1e-4) return null;                                     // above the horizon
  const t = h / -dy;
  return [(t * nx) / TILE, (t * dz + scroll) / TILE];
}

function lodAt(px: number, py: number, h: number, pitch: number, scroll: number) {
  const a = uvAt(px, py, h, pitch, scroll), b = uvAt(px + 1, py, h, pitch, scroll), c = uvAt(px, py + 1, h, pitch, scroll);
  if (!a) return null;
  const dx = b ? Math.hypot(b[0] - a[0], b[1] - a[1]) : 1, dy = c ? Math.hypot(c[0] - a[0], c[1] - a[1]) : 1;
  const rho = Math.max(dx, dy) * TEX;                              // texels of level 0 per pixel
  return { uv: a, rho, lambda: Math.log2(Math.max(rho, 1e-6)) };
}

function draw(ctx: CanvasRenderingContext2D, img: ImageData, chain: Float32Array[], mode: Mode, h: number, pitch: number, scroll: number) {
  const px = img.data, out = [0, 0, 0];
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    const k = (y * CW + x) * 4;
    const s = lodAt(x + 0.5, y + 0.5, h, pitch, scroll);
    out[0] = out[1] = out[2] = 0;
    if (!s) { out[0] = SKY[0]; out[1] = SKY[1]; out[2] = SKY[2]; }
    else {
      const [u, v] = s.uv;
      if (mode === "nearest") nearest(chain, 0, u, v, out);
      else if (mode === "linear") bilinear(chain, 0, u, v, out);
      else {
        const lam = Math.min(Math.max(s.lambda, 0), LEVELS - 1), l0 = Math.floor(lam), f = lam - l0, l1 = Math.min(l0 + 1, LEVELS - 1);
        bilinear(chain, l0, u, v, out, 1 - f);
        if (f > 0) bilinear(chain, l1, u, v, out, f);
        if (mode === "levels") {
          const t0 = LEVEL_TINT[l0], t1 = LEVEL_TINT[l1];
          for (let c = 0; c < 3; c++) out[c] = out[c] * 0.45 + ((1 - f) * t0[c] + f * t1[c]) * 0.55;
        }
      }
    }
    px[k] = out[0] * 255; px[k + 1] = out[1] * 255; px[k + 2] = out[2] * 255; px[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

export function MipmapFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("nearest");
  const [h, setH] = useState(1);
  const [pitch, setPitch] = useState(0.22);
  const [playing, setPlaying] = useState(true);
  const [probe, setProbe] = useState<{ x: number; y: number } | null>({ x: 100, y: 40 });
  const L = (k: string, en: string) => tx(t, `figVkMip_${k}`, en);

  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef<{ chain: Float32Array[]; img: ImageData | null; scroll: number }>({ chain: [], img: null, scroll: 0 });
  const opts = useRef({ mode, h, pitch });
  opts.current = { mode, h, pitch };

  const redraw = () => {
    const ctx = canvas.current?.getContext("2d");
    const s = state.current;
    if (!ctx) return;
    if (!s.chain.length) s.chain = buildChain();
    if (!s.img) s.img = ctx.createImageData(CW, CH);
    draw(ctx, s.img, s.chain, opts.current.mode, opts.current.h, opts.current.pitch, s.scroll);
  };
  useEffect(redraw);
  const ref = useRaf(playing, dt => { state.current.scroll += dt * 0.6; redraw(); });

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setProbe({ x: Math.floor(((e.clientX - r.left) / r.width) * CW), y: Math.floor(((e.clientY - r.top) / r.height) * CH) });
  };
  const p = probe ? lodAt(probe.x + 0.5, probe.y + 0.5, h, pitch, 0) : null;
  const level = p ? Math.min(Math.max(p.lambda, 0), LEVELS - 1) : 0;

  return (
    <Figure
      title={L("title", "Minification: one sample per pixel, many texels per pixel")}
      head={<Choice value={mode} onChange={setMode} options={[["nearest", L("nearest", "NEAREST, no mips")], ["linear", L("linear", "LINEAR, no mips")], ["trilinear", L("trilinear", "trilinear (mips)")], ["levels", L("levels", "colour the levels")]] as const} />}
      controls={<>
        <Sliders>
          <Slider label={L("height", "camera height")} value={h} min={0.3} max={3} onChange={setH} />
          <Slider label={L("pitch", "look down")} value={pitch} min={0.05} max={0.9} onChange={setPitch} fmt={v => `${f2((v * 180) / Math.PI, 0)}°`} />
        </Sliders>
        <Row>
          <Btn active={playing} onClick={() => setPlaying(v => !v)}>{playing ? "❚❚" : "▶"} {L("move", "move the floor")}</Btn>
          {p && <Readout>ρ = {f2(p.rho, 1)} {L("tpp", "texels / pixel")}</Readout>}
          {p && <Readout>λ = log₂ ρ = {f2(p.lambda, 2)}</Readout>}
          {p && <Readout color={C.sky}>{L("level", "level")} {f2(level, 2)} → {TEX >> Math.floor(level)} × {TEX >> Math.floor(level)}</Readout>}
          {!p && probe && <Readout>{L("sky", "sky: no texture")}</Readout>}
        </Row>
      </>}
      note={L("note", "The floor repeats a 64 × 64 texture of 8-texel checks every 2 units. Near the bottom one pixel covers less than a texel (ρ < 1: magnified, level 0). Towards the horizon one pixel covers dozens of texels, but NEAREST still reads one of them and LINEAR only four neighbours, so which colour a pixel gets depends on tiny shifts of the floor: moiré patterns and shimmer. With mips the sampler reads from the level where one texel is about one pixel (λ = log₂ ρ) and blends the two nearest levels (trilinear), so distant checks fade to the grey they average to. Colour the levels to see the bands; move the pointer over the picture to read ρ and λ at one pixel.")}
    >
      <div ref={ref} className="p-2">
        <canvas ref={canvas} width={CW} height={CH} onPointerMove={onMove} onPointerDown={onMove}
          className="w-full h-auto block rounded-md touch-none" style={{ imageRendering: "pixelated", aspectRatio: `${CW} / ${CH}` }} />
      </div>
    </Figure>
  );
}
