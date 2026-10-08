"use client";

import { useEffect, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, plot, useVisible } from "@/components/lesson/kit/figure";
import { makeProjector, boxFaces, frontFacing, shade } from "@/components/lesson/kit/scene3d";
import { scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill as fillIn, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// layers    — a box built from unit cubes, one layer at a time: every layer
//             holds (base area) cubes, so the volume is base area × height.
//             The Transport fills the layers one by one.
// cavalieri — two stacks of the same thin slices, one straight and one
//             leaning. Equal slices at every height, so equal volumes.
// cone      — a cone poured into a cylinder with the same base and height:
//             it takes three conefuls to fill it. The Transport pours them.
// sphere    — a hemisphere next to a cylinder with a cone scooped out. At any
//             height h the two slices have the same area (Pythagoras), so the
//             two solids have the same volume: ⅔ πr³.
// The lab: count layers, build a box of a given volume, lean a stack, pour
// three cones and slice the hemisphere.

type Mode = "layers" | "cavalieri" | "cone" | "sphere";
const W = 560, H = 300;
const n2 = (v: number) => (+v.toFixed(2)).toString();
const SR = 2.2;                                      // the sphere mode's radius

/** A flattened ellipse standing for a horizontal circle seen from slightly above. */
const ell = (cx: number, cy: number, rx: number, k = 0.28) => ({ cx, cy, rx: Math.max(rx, 0.01), ry: Math.max(rx * k, 0.01) });

// ── The drawings ──────────────────────────────────────────────────────────────

function LayersDrawing({ l, w, h, fill }: { l: number; w: number; h: number; fill: number }) {
  const proj = makeProjector({ yaw: -0.6, pitch: 0.5, zoom: 1 }, W / 2, H / 2 + 10, 46, 22);
  const cx = l / 2, cz = w / 2, cy = h / 2;
  const faces: { d: string; depth: number; fill: string }[] = [];
  for (let y = 0; y < Math.min(fill, h); y++)
    for (let x = 0; x < l; x++)
      for (let z = 0; z < w; z++)
        for (const f of boxFaces([x + 0.5 - cx, y + 0.5 - cy, z + 0.5 - cz], [0.5, 0.5, 0.5])) {
          const sp = f.pts.map(proj);
          if (!frontFacing(sp)) continue;
          faces.push({
            d: "M" + sp.map(q => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join("L") + "Z",
            depth: sp.reduce((s, q) => s + q.depth, 0) / sp.length,
            fill: y === fill - 1 && f.normal[1] > 0.5 ? "#0ea5e9" : shade(f.normal, 0.8),
          });
        }
  faces.sort((a, b) => b.depth - a.depth);
  const outline = boxFaces([0, 0, 0], [l / 2, h / 2, w / 2]).map(f => f.pts.map(proj));
  return <>
    {outline.map((sp, i) => <path key={i} d={"M" + sp.map(q => `${q.x},${q.y}`).join("L") + "Z"} fill="none" stroke={C.muted} strokeWidth={0.8} strokeDasharray="3 3" />)}
    {faces.map((f, i) => <path key={i} d={f.d} fill={f.fill} fillOpacity={0.9} stroke="var(--code-bg)" strokeWidth={1} strokeLinejoin="round" />)}
  </>;
}

function CavalieriDrawing({ lean, t }: { lean: number; t?: TrackTranslations }) {
  const p = plot({ W, H, x0: -6, x1: 6, y0: -0.6, y1: 5.829 });
  const N = 12, hh = 5 / N;
  const stack = (x0: number, sk: number, col: string) => Array.from({ length: N }, (_, i) => {
    const y = i * hh, wv = 1.4 + 0.6 * Math.sin(i * 0.9);
    return <rect key={i} x={p.X(x0 + sk * i * hh - wv / 2)} y={p.Y(y + hh)} width={wv * p.sx} height={hh * p.sy - 1}
      fill={col} fillOpacity={0.35} stroke={col} strokeWidth={1} />;
  });
  return <>
    <line x1={0} y1={p.Y(0)} x2={W} y2={p.Y(0)} stroke={C.axis} strokeWidth={1.2} />
    {stack(-3, 0, C.sky)}
    {stack(2.2, lean, C.amber)}
    <line x1={0} y1={p.Y(5)} x2={W} y2={p.Y(5)} stroke={C.muted} strokeWidth={0.8} strokeDasharray="4 3" />
    <T x={p.X(-5.8)} y={p.Y(5) - 5} size={9.5} color={C.muted}>{tx(t, "figVol_sameH", "same height")}</T>
  </>;
}

function ConeDrawing({ pour, t }: { pour: number; t?: TrackTranslations }) {
  const p = plot({ W, H, x0: -6, x1: 6, y0: -1.1, y1: 5.329 });
  const R = 1.6, Hh = 4.2, level = (Hh * pour) / 3;
  return <>
    {/* The cone standing on the left, point up; the water it has poured sits in the cylinder */}
    <path d={`M${p.X(-3.2 - R)},${p.Y(0)} L${p.X(-3.2)},${p.Y(Hh)} L${p.X(-3.2 + R)},${p.Y(0)}`} fill={C.amber} fillOpacity={0.3} stroke={C.amber} strokeWidth={1.6} strokeLinejoin="round" />
    <ellipse {...ell(p.X(-3.2), p.Y(0), R * p.sx)} fill={C.amber} fillOpacity={0.3} stroke={C.amber} strokeWidth={1.6} />
    {level > 0 && <>
      <rect x={p.X(2.6 - R)} y={p.Y(level)} width={2 * R * p.sx} height={level * p.sy} fill={C.sky} fillOpacity={0.35} style={{ transition: "all 0.6s ease" }} />
      <ellipse {...ell(p.X(2.6), p.Y(level), R * p.sx)} fill={C.sky} fillOpacity={0.5} stroke={C.sky} strokeWidth={1.2} style={{ transition: "all 0.6s ease" }} />
    </>}
    <path d={`M${p.X(2.6 - R)},${p.Y(0)} L${p.X(2.6 - R)},${p.Y(Hh)} M${p.X(2.6 + R)},${p.Y(0)} L${p.X(2.6 + R)},${p.Y(Hh)}`} stroke={C.fg} strokeWidth={1.6} />
    <ellipse {...ell(p.X(2.6), p.Y(Hh), R * p.sx)} fill="none" stroke={C.fg} strokeWidth={1.6} />
    <ellipse {...ell(p.X(2.6), p.Y(0), R * p.sx)} fill="none" stroke={C.fg} strokeWidth={1.6} />
    {[1, 2].map(i => <line key={i} x1={p.X(2.6 + R)} y1={p.Y((Hh * i) / 3)} x2={p.X(2.6 + R + 0.3)} y2={p.Y((Hh * i) / 3)} stroke={C.muted} strokeWidth={1} />)}
    <T x={p.X(-3.2)} y={p.Y(0) + 34} size={10} anchor="middle" color={C.amber} bold>{tx(t, "figVol_cone", "cone")}</T>
    <T x={p.X(2.6)} y={p.Y(0) + 34} size={10} anchor="middle" color={C.fg} bold>{tx(t, "figVol_cyl", "cylinder")}</T>
    <T x={p.X(0)} y={p.Y(Hh) - 12} size={10} anchor="middle" color={C.muted}>{tx(t, "figVol_sameBH", "same base, same height")}</T>
  </>;
}

function SphereDrawing({ sh, t }: { sh: number; t?: TrackTranslations }) {
  const p = plot({ W, H, x0: -6, x1: 6, y0: -1.1, y1: 5.329 });
  const R = SR, hh = sh * R, rs = Math.sqrt(R * R - hh * hh);
  const L = -3, Rt = 2.8;
  return <>
    {/* hemisphere */}
    <path d={`M${p.X(L - R)},${p.Y(0)} A${R * p.sx},${R * p.sy} 0 0 1 ${p.X(L + R)},${p.Y(0)}`} fill={C.sky} fillOpacity={0.15} stroke={C.sky} strokeWidth={1.6} />
    <ellipse {...ell(p.X(L), p.Y(0), R * p.sx)} fill="none" stroke={C.sky} strokeWidth={1.2} />
    <ellipse {...ell(p.X(L), p.Y(hh), rs * p.sx)} fill={C.amber} fillOpacity={0.55} stroke={C.amber} strokeWidth={1.4} />
    <line x1={p.X(L)} y1={p.Y(0)} x2={p.X(L + rs)} y2={p.Y(hh)} stroke={C.green} strokeWidth={1.4} />
    <line x1={p.X(L)} y1={p.Y(0)} x2={p.X(L)} y2={p.Y(hh)} stroke={C.pink} strokeWidth={1.4} />
    <T x={p.X(L) - 4} y={p.Y(hh / 2) + 3} size={9.5} anchor="end" color={C.pink} bold>h</T>
    <T x={p.X(L + rs / 2) + 6} y={p.Y(hh / 2) + 10} size={9.5} color={C.green} bold>r</T>
    {/* cylinder with a cone (point down) removed */}
    <path d={`M${p.X(Rt - R)},${p.Y(0)} L${p.X(Rt - R)},${p.Y(R)} M${p.X(Rt + R)},${p.Y(0)} L${p.X(Rt + R)},${p.Y(R)}`} stroke={C.purple} strokeWidth={1.6} />
    <ellipse {...ell(p.X(Rt), p.Y(R), R * p.sx)} fill="none" stroke={C.purple} strokeWidth={1.6} />
    <ellipse {...ell(p.X(Rt), p.Y(0), R * p.sx)} fill="none" stroke={C.purple} strokeWidth={1.2} strokeDasharray="4 3" />
    <path d={`M${p.X(Rt - R)},${p.Y(R)} L${p.X(Rt)},${p.Y(0)} L${p.X(Rt + R)},${p.Y(R)}`} fill="none" stroke={C.purple} strokeWidth={1.2} strokeDasharray="4 3" />
    <ellipse {...ell(p.X(Rt), p.Y(hh), R * p.sx)} fill={C.amber} fillOpacity={0.55} stroke={C.amber} strokeWidth={1.4} />
    <ellipse {...ell(p.X(Rt), p.Y(hh), hh * p.sx)} fill="var(--code-bg)" stroke={C.amber} strokeWidth={1.2} />
    <line x1={0} y1={p.Y(hh)} x2={W} y2={p.Y(hh)} stroke={C.muted} strokeWidth={0.7} strokeDasharray="2 4" />
    <T x={p.X(L)} y={p.Y(0) + 34} size={10} anchor="middle" color={C.sky} bold>{tx(t, "figVol_hemi", "hemisphere")}</T>
    <T x={p.X(Rt)} y={p.Y(0) + 34} size={10} anchor="middle" color={C.purple} bold>{tx(t, "figVol_cylCone", "cylinder − cone")}</T>
  </>;
}

export function VolumeFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("layers");
  const [l, setL] = useState(4), [w, setW] = useState(3), [h, setH] = useState(3), [fill, setFill] = useState(2);
  const [lean, setLean] = useState(0.6);
  const [pour, setPour] = useState(1);
  const [sh, setSh] = useState(0.5);
  const [playing, setPlaying] = useState(false);
  const [speed] = useFigureSpeed();
  const lab = useLab("math-volume");
  const vis = useVisible<HTMLDivElement>();

  // Layers fill, or conefuls pour, one at a time
  const count = mode === "layers" ? fill : pour, last = mode === "layers" ? h : 3;
  const setCount = mode === "layers" ? setFill : setPour;
  useEffect(() => {
    if (!playing || !(vis.on || lab.open)) return;
    if (count >= last) { setPlaying(false); return; }
    const id = setTimeout(() => setCount(count + 1), scaledMs(700, speed));
    return () => clearTimeout(id);
  }, [playing, count, last, setCount, speed, vis.on, lab.open]);

  const pick = (m: Mode) => { setMode(m); setPlaying(false); };
  const box = (nl: number, nw: number, nh: number, nf: number) => { pick("layers"); setL(nl); setW(nw); setH(nh); setFill(nf); };
  const R = SR, hh = sh * R;

  const animated = mode === "layers" || mode === "cone";
  const view = (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {mode === "layers" ? <LayersDrawing l={l} w={w} h={h} fill={fill} />
          : mode === "cavalieri" ? <CavalieriDrawing lean={lean} t={t} />
            : mode === "cone" ? <ConeDrawing pour={pour} t={t} />
              : <SphereDrawing sh={sh} t={t} />}
      </svg>
      {animated && (
        <Transport t={t} speed playing={playing}
          onPlay={() => { if (playing) { setPlaying(false); return; } if (count >= last) setCount(0); setPlaying(true); }}
          playLabel={mode === "layers" ? tx(t, "figVol_playL", "fill the layers") : tx(t, "figVol_playC", "pour the cones")}
          onStep={count < last ? () => { setPlaying(false); setCount(count + 1); } : undefined}
          onBack={count > 0 ? () => { setPlaying(false); setCount(count - 1); } : undefined}
          onReset={() => { setPlaying(false); setCount(0); }}
          readout={mode === "layers" ? `${fill} / ${h} ${tx(t, "figVol_layers", "layers")}` : `${pour} / 3`} />
      )}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["layers", tx(t, "figVol_mLayers", "layers")],
    ["cavalieri", tx(t, "figVol_mCav", "Cavalieri")],
    ["cone", tx(t, "figVol_mCone", "cone")],
    ["sphere", tx(t, "figVol_mSphere", "sphere")],
  ] as const} />;

  const controls = mode === "layers" ? <>
    <Sliders>
      <Slider label={tx(t, "figVol_l", "length")} value={l} min={1} max={6} step={1} onChange={setL} fmt={String} />
      <Slider label={tx(t, "figVol_w", "width")} value={w} min={1} max={4} step={1} onChange={setW} fmt={String} />
      <Slider label={tx(t, "figVol_h", "height")} value={h} min={1} max={4} step={1} onChange={v => { setH(v); setFill(f => Math.min(f, v)); }} fmt={String} />
    </Sliders>
    <Row>
      <Readout color={C.sky}>{`${tx(t, "figVol_base", "one layer")} = ${l} · ${w} = ${l * w}`}</Readout>
      <Readout>{`${fill} ${tx(t, "figVol_layers", "layers")} = ${fill * l * w}`}</Readout>
      <Readout color={C.green}>{`V = ${l} · ${w} · ${h} = ${l * w * h}`}</Readout>
    </Row>
  </> : mode === "cavalieri" ? <>
    <Slider label={tx(t, "figVol_lean", "lean")} value={lean} min={-0.8} max={0.8} step={0.05} onChange={setLean} fmt={n2} width="w-20" />
    <Row><Readout>{tx(t, "figVol_same", "same slices at every height → same volume")}</Readout></Row>
  </> : mode === "cone" ? <Row>
    <Readout color={C.sky}>{`${pour} · πr²h/3 = ${n2(pour / 3)} πr²h`}</Readout>
    {pour === 3 && <Readout color={C.green}>{tx(t, "figVol_full", "full: 3 cones = 1 cylinder")}</Readout>}
  </Row> : <>
    <Slider label={tx(t, "figVol_slice", "slice height h / r")} value={sh} min={0} max={0.98} step={0.02} onChange={setSh} fmt={n2} width="w-32" />
    <Row>
      <Readout color={C.amber}>{`π(r² − h²) = π(${n2(R * R)} − ${n2(hh * hh)}) = ${n2(Math.PI * (R * R - hh * hh))}`}</Readout>
      <Readout color={C.amber}>{`πr² − πh² = ${n2(Math.PI * R * R)} − ${n2(Math.PI * hh * hh)} = ${n2(Math.PI * (R * R - hh * hh))}`}</Readout>
    </Row>
  </>;
  const note = mode === "layers"
    ? tx(t, "figVol_noteL2", "Volume counts unit cubes, the way area counts unit squares. The bottom layer of a box l long and w wide holds l · w cubes, exactly its base area. Every layer above holds the same number, and there are h layers. So the volume is (base area) × height = l · w · h. Press play to fill the layers one by one and watch the count grow in equal steps.")
    : mode === "cavalieri"
      ? tx(t, "figVol_noteC", "Think of each solid as a stack of very thin slices, like a pile of coins or a deck of cards. Push the stack sideways: every slice keeps its own size, so the total volume cannot change. Cavalieri's principle says it in general: if two solids have the same height and, at every height, slices of equal area, their volumes are equal. A leaning prism or cylinder therefore has the same volume as a straight one: base area × perpendicular height.")
      : mode === "cone"
        ? tx(t, "figVol_noteK2", "Press play to fill the cone with water and pour it into a cylinder that has the same base and the same height. One coneful reaches exactly a third of the way up; it takes three to fill the cylinder. So a cone's volume is ⅓ of the cylinder's, ⅓ πr²h. The same factor ⅓ holds for every pyramid against the prism with its base and height.")
        : tx(t, "figVol_noteS", "Slice both solids at the same height h. The hemisphere's slice is a disc; its radius, the height h and the sphere's radius r form a right triangle, so its area is π(r² − h²). The other slice is a ring: the cylinder's disc πr² minus the cone's disc, whose radius equals h (the cone widens as fast as it rises), πh². Same area at every height, so by Cavalieri the same volume: πr² · r − ⅓πr² · r = ⅔πr³. A whole sphere is twice that, 4/3 πr³.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figVolL1_t", "Layer by layer"),
      body: <>
        <p>{tx(t, "figVolL1_b1", "A 4 × 3 floor holds 12 unit cubes. Every layer above it holds the same 12.")}</p>
        <p>{tx(t, "figVolL1_b2", "Press play and fill the box.")}</p>
      </>,
      goal: { text: tx(t, "figVolL1_g", "Fill all 3 layers."), done: mode === "layers" && fill === h && h === 3 && l === 4 && w === 3 },
      focus: "play",
      setup: () => box(4, 3, 3, 0),
    },
    {
      title: tx(t, "figVolL2_t", "Quick check"),
      body: <p>{tx(t, "figVolL2_b", "Volume = base area × height.")}</p>,
      quiz: {
        q: tx(t, "figVolL2_q", "How many unit cubes fill a 5 × 4 × 3 box?"),
        options: ["60", "12", "47", "94"],
        answer: 0,
        why: tx(t, "figVolL2_w", "One layer is 5 · 4 = 20 cubes, and there are 3 layers: 60. 94 is the surface area, 2(20 + 15 + 12)."),
      },
    },
    {
      title: tx(t, "figVolL3_t", "Build to order"),
      body: <p>{tx(t, "figVolL3_b", "Build a box that is only 2 layers tall but still holds 24 cubes.")}</p>,
      goal: { text: tx(t, "figVolL3_g", "V = 24, height 2."), done: mode === "layers" && h === 2 && l * w * h === 24 },
      hint: tx(t, "figVolL3_h", "Each layer must hold 24 ÷ 2 = 12 cubes: 4 × 3 or 6 × 2."),
      setup: () => box(2, 2, 2, 2),
    },
    {
      title: tx(t, "figVolL4_t", "Lean the stack"),
      body: <p>{tx(t, "figVolL4_b", "Both stacks are made of the same slices. Push the amber one as far as it will lean, either way.")}</p>,
      goal: { text: tx(t, "figVolL4_g", "Lean it all the way."), done: mode === "cavalieri" && Math.abs(lean) >= 0.8 - 1e-9 },
      setup: () => { pick("cavalieri"); setLean(0); },
    },
    {
      title: tx(t, "figVolL5_t", "Three conefuls"),
      body: <p>{tx(t, "figVolL5_b", "The cone and the cylinder share a base and a height. Pour one coneful at a time and watch the level.")}</p>,
      goal: { text: tx(t, "figVolL5_g", "Fill the cylinder."), done: mode === "cone" && pour === 3 },
      focus: "step",
      setup: () => { pick("cone"); setPour(0); },
    },
    {
      title: tx(t, "figVolL6_t", "Quick check"),
      body: <p>{tx(t, "figVolL6_b", "A cone has radius 3 and height 4.")}</p>,
      quiz: {
        q: tx(t, "figVolL6_q", "What is its volume?"),
        options: ["12π", "36π", "4π", "9π"],
        answer: 0,
        why: tx(t, "figVolL6_w", "⅓ · π · 3² · 4 = ⅓ · 36π = 12π. 36π is the cylinder around it."),
      },
    },
    {
      title: tx(t, "figVolL7_t", "Slice the hemisphere"),
      body: <>
        <p>{tx(t, "figVolL7_b1", "At every height, the amber disc in the hemisphere and the amber ring in the cylinder have the same area.")}</p>
        <p>{tx(t, "figVolL7_b2", "Move the slice up near the top and compare: the disc shrinks, and the ring thins out at the same rate.")}</p>
      </>,
      goal: { text: tx(t, "figVolL7_g", "h / r ≥ 0.9."), done: mode === "sphere" && sh >= 0.9 - 1e-9 },
      setup: () => { pick("sphere"); setSh(0.2); },
    },
    {
      title: tx(t, "figVolL8_t", "Quick check"),
      body: <p>{tx(t, "figVolL8_b", "A whole sphere is twice the hemisphere: 4/3 πr³.")}</p>,
      quiz: {
        q: tx(t, "figVolL8_q", "What is the volume of a ball of radius 3?"),
        options: ["36π", "12π", "27π", "108π"],
        answer: 0,
        why: tx(t, "figVolL8_w", "4/3 · π · 27 = 36π ≈ 113. Doubling the radius would multiply it by 2³ = 8."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "layer", tone: "info", when: mode === "layers" && fill > 0 && fill < h,
      title: tx(t, "figVolI1_t", "Equal steps"),
      body: fillIn(tx(t, "figVolI1_b", "Each layer adds the same {b} cubes (the base area). {f} layers hold {f} · {b} = {n}."), { b: l * w, f: fill, n: fill * l * w }),
    },
    {
      id: "lean", tone: "ok", when: mode === "cavalieri" && Math.abs(lean) > 0.3,
      title: tx(t, "figVolI2_t", "Same volume"),
      body: tx(t, "figVolI2_b", "The amber stack leans, but each slice is exactly the blue slice at the same height. Same slices, same height: same volume."),
    },
    {
      id: "pour", tone: "info", when: mode === "cone" && pour > 0 && pour < 3,
      title: tx(t, "figVolI3_t", "A third at a time"),
      body: fillIn(tx(t, "figVolI3_b", "{p} conefuls fill {p}/3 of the cylinder. The cone holds ⅓ πr²h."), { p: pour }),
    },
    {
      id: "slice", tone: "info", when: mode === "sphere",
      title: tx(t, "figVolI4_t", "Equal slices"),
      body: fillIn(tx(t, "figVolI4_b", "At h = {h}: disc π(r² − h²) = {a}; ring πr² − πh² = {a}. Equal at every height, so the two solids have equal volumes."), { h: n2(hh), a: n2(Math.PI * (R * R - hh * hh)) }),
    },
  ];

  const title = tx(t, "figVol_title", "Where volume formulas come from");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        <div ref={vis.ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figVolR1", "Volume counts unit cubes: base area × height."),
          tx(t, "figVolR2", "Cavalieri: equal slices at every height give equal volumes, so leaning changes nothing."),
          tx(t, "figVolR3", "A cone is ⅓ of its cylinder; a sphere is 4/3 πr³."),
        ]}
      />
    </>
  );
}
