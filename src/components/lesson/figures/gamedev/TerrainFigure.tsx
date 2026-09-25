"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Slider, Sliders, C, T, clamp, useDrag } from "@/components/lesson/kit/figure";
import { fbm2, perlin2 } from "@/components/lesson/kit/noise";

// ── What this figure shows ────────────────────────────────────────────────────
// A heightmap built from fractal noise (fBm), coloured by height bands and
// shaded by its slope, with the knobs every terrain generator exposes:
//   scale       — world units per noise cell: the size of the big features
//   octaves     — how many layers of detail are added
//   lacunarity  — frequency multiplier between octaves (usually 2)
//   gain        — amplitude multiplier between octaves (persistence, ~0.5)
//   island      — subtracts a radial falloff so the map is surrounded by sea
//   warp        — offsets the lookup position by another noise (domain warping)
// The strip below is the height profile along the dashed row, with each
// octave's contribution drawn separately.

const GW = 320, GH = 200;
const BANDS: [number, [number, number, number]][] = [
  [0.34, [22, 58, 110]],     // deep water
  [0.42, [40, 96, 160]],     // shallow water
  [0.45, [214, 196, 140]],   // sand
  [0.6, [86, 150, 72]],      // grass
  [0.7, [52, 110, 58]],      // forest
  [0.82, [118, 110, 102]],   // rock
  [2, [240, 242, 245]],      // snow
];

type Params = { scale: number; octaves: number; lacunarity: number; gain: number; island: number; warp: number; seed: number };

function height(x: number, y: number, p: Params) {
  let u = x / p.scale, v = y / p.scale;
  if (p.warp > 0) {
    // Domain warping: look the noise up at a position pushed around by another noise
    const wx = perlin2(u * 0.8 + 5.2, v * 0.8 + 1.3, p.seed + 999);
    const wy = perlin2(u * 0.8 - 3.7, v * 0.8 + 8.1, p.seed + 777);
    u += wx * p.warp * 2; v += wy * p.warp * 2;
  }
  let h = 0.5 + fbm2(u, v, p.seed, p) * 1.25;
  if (p.island > 0) {
    const dx = x / GW * 2 - 1, dy = y / GH * 2 - 1;
    h -= p.island * (dx * dx + dy * dy) * 0.55;        // radial falloff: 0 in the centre
  }
  return h;
}

export function TerrainFigure({ t }: { t?: TrackTranslations }) {
  const [p, setP] = useState<Params>({ scale: 80, octaves: 5, lacunarity: 2, gain: 0.5, island: 0, warp: 0, seed: 4 });
  const [view, setView] = useState<"color" | "gray">("color");
  const [row, setRow] = useState(0.5);
  const canvas = useRef<HTMLCanvasElement>(null);
  const set = (k: keyof Params) => (v: number) => setP(o => ({ ...o, [k]: v }));

  const hmap = useMemo(() => {
    const a = new Float32Array(GW * GH);
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) a[j * GW + i] = height(i, j, p);
    return a;
  }, [p]);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    cv.width = GW; cv.height = GH;
    const ctx = cv.getContext("2d")!, img = ctx.createImageData(GW, GH);
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const h = hmap[j * GW + i], k = (j * GW + i) * 4;
      if (view === "gray") {
        const g = clamp(h, 0, 1) * 255;
        img.data[k] = img.data[k + 1] = img.data[k + 2] = g;
      } else {
        // Hill shading: light from the upper left, using the height differences to the neighbours
        const hx = hmap[j * GW + Math.min(GW - 1, i + 1)] - hmap[j * GW + Math.max(0, i - 1)];
        const hy = hmap[Math.min(GH - 1, j + 1) * GW + i] - hmap[Math.max(0, j - 1) * GW + i];
        const water = h < 0.42;
        const shade = water ? 1 : clamp(1 - (hx + hy) * 9, 0.55, 1.35);
        const col = BANDS.find(([lim]) => h < lim)![1];
        img.data[k] = clamp(col[0] * shade, 0, 255);
        img.data[k + 1] = clamp(col[1] * shade, 0, 255);
        img.data[k + 2] = clamp(col[2] * shade, 0, 255);
      }
      img.data[k + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [hmap, view]);

  // Profile along the chosen row, total and per octave
  const W = 560, MH = W * GH / GW, PH = 120;
  const j = Math.round(row * (GH - 1));
  const prof = Array.from({ length: GW }, (_, i) => hmap[j * GW + i]);
  const PX = (i: number) => (i / (GW - 1)) * W, PY = (h: number) => PH - 10 - clamp(h, -0.1, 1.2) * (PH - 24);
  const octPaths = Array.from({ length: p.octaves }, (_, o) => {
    let d = "";
    const amp = p.gain ** o, fr = p.lacunarity ** o;
    let norm = 0; for (let k = 0; k < p.octaves; k++) norm += p.gain ** k;
    for (let i = 0; i < GW; i += 1) {
      const v = perlin2((i / p.scale) * fr + o * 17.13, (j / p.scale) * fr - o * 9.71, p.seed + o * 101) * amp / norm * 1.25;
      d += `${i ? "L" : "M"}${PX(i).toFixed(1)},${(PH / 2 - v * (PH - 24)).toFixed(1)}`;
    }
    return d;
  });
  const drag = useDrag<"row">(q => (q.y < MH ? "row" : null), (_, q) => setRow(clamp(q.y / MH, 0, 1)));
  const [octView, setOctView] = useState(false);

  return (
    <Figure
      title={tx(t, "figTerrain_title", "Terrain from fractal noise")}
      head={<>
        <Choice value={view} onChange={setView} options={[["color", tx(t, "figTerrain_col", "biomes")], ["gray", tx(t, "figTerrain_gray", "height")]] as const} />
        <Btn onClick={() => setP(o => ({ ...o, seed: o.seed + 1 }))}>{tx(t, "figTerrain_seed", "new seed")}</Btn>
      </>}
      controls={<Sliders>
        <Slider label={tx(t, "figTerrain_scale", "scale")} value={p.scale} min={20} max={180} step={1} onChange={set("scale")} fmt={v => `${v} px`} />
        <Slider label={tx(t, "figTerrain_oct", "octaves")} value={p.octaves} min={1} max={8} step={1} onChange={set("octaves")} fmt={v => `${v}`} />
        <Slider label={tx(t, "figTerrain_lac", "lacunarity")} value={p.lacunarity} min={1.2} max={3.5} step={0.05} onChange={set("lacunarity")} />
        <Slider label={tx(t, "figTerrain_gain", "gain")} value={p.gain} min={0.2} max={0.85} step={0.01} onChange={set("gain")} />
        <Slider label={tx(t, "figTerrain_island", "island")} value={p.island} min={0} max={1.5} step={0.05} onChange={set("island")} />
        <Slider label={tx(t, "figTerrain_warp", "domain warp")} value={p.warp} min={0} max={1.5} step={0.05} onChange={set("warp")} />
      </Sliders>}
      note={tx(t, "figTerrain_note", "Start with 1 octave: smooth blobs, one noise layer. Each extra octave adds a copy at twice the frequency (lacunarity 2) and half the amplitude (gain 0.5): coastlines get ragged and mountains get ridges, while the large shapes stay put because the first octave still dominates. Gain near 0.8 makes the fine layers almost as strong as the coarse one: rough, noisy land. Island subtracts a bowl so the edges sink into the sea. Domain warp bends the whole map by feeding noise into the noise lookup, turning round blobs into swirling, eroded-looking shapes. Drag on the map to move the profile row.")}
    >
      <div className="relative">
        <canvas ref={canvas} className="absolute left-0 top-0 w-full" style={{ height: `${(MH / (MH + PH)) * 100}%`, imageRendering: "auto" }} />
        <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${MH + PH}`} className="relative w-full h-auto cursor-ns-resize">
          <line x1={0} x2={W} y1={row * MH} y2={row * MH} stroke="#fff" strokeDasharray="6 4" strokeWidth={1.4} />
          <rect x={0} y={MH} width={W} height={PH} fill="var(--code-bg)" />
          <g transform={`translate(0,${MH})`}>
            {octView
              ? octPaths.map((d, o) => <path key={o} d={d} fill="none" stroke={[C.red, C.orange, C.amber, C.green, C.teal, C.sky, C.blue, C.purple][o]} strokeWidth={1.3} />)
              : <>
                <line x1={0} x2={W} y1={PY(0.42)} y2={PY(0.42)} stroke={C.blue} strokeDasharray="3 3" />
                <path d={`M0,${PH} ` + prof.map((h, i) => `L${PX(i).toFixed(1)},${PY(h).toFixed(1)}`).join(" ") + ` L${W},${PH} Z`} fill="#6b8f5a" opacity={0.55} />
                <path d={prof.map((h, i) => `${i ? "L" : "M"}${PX(i).toFixed(1)},${PY(h).toFixed(1)}`).join(" ")} fill="none" stroke={C.green} strokeWidth={1.6} />
              </>}
            <T x={6} y={13} size={8.5}>{octView ? tx(t, "figTerrain_octLbl", "each octave's contribution along the row") : tx(t, "figTerrain_prof", "height profile along the dashed row · blue: sea level")}</T>
          </g>
        </svg>
        <div className="absolute right-2 bottom-2"><Btn active={octView} onClick={() => setOctView(v => !v)}>{tx(t, "figTerrain_octBtn", "octaves")}</Btn></div>
      </div>
    </Figure>
  );
}
