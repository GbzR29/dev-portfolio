"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Btn, C, f2 } from "@/components/lesson/kit/figure";
import { makeProjector, useOrbit, boxFaces, frontFacing, type V3, type Projector } from "@/components/lesson/kit/scene3d";

// ── What this figure shows ────────────────────────────────────────────────────
// The volume under a surface z = f(x, y) over the square 0 ≤ x, y ≤ 2.
// Boxes: the square is cut into n × n small squares and each carries a box as
// tall as f at its centre; the total volume of the boxes approaches the double
// integral as n grows. Slices: the same volume cut into thin sheets at fixed x;
// each sheet's area A(x) = ∫ f(x, y) dy is an ordinary integral, and adding the
// sheets, ∫ A(x) dx, gives the volume again: an iterated integral.

type Mode = "boxes" | "slices";
type Key = "plane" | "dome" | "bump";
const FNS: Record<Key, { label: string; f: (x: number, y: number) => number; exact: string }> = {
  plane: { label: "1 + xy/2", f: (x, y) => 1 + (x * y) / 2, exact: "6" },
  dome: { label: "4 − (x² + y²)/2", f: (x, y) => 4 - (x * x + y * y) / 2, exact: "32/3" },
  bump: { label: "3e^(−(x−1)²−(y−1)²)", f: (x, y) => 3 * Math.exp(-((x - 1) ** 2) - (y - 1) ** 2), exact: "" },
};
const W = 560, H = 320, K = 0.45;                 // K: height scale in the drawing
const toV = (x: number, y: number, z: number): V3 => [x - 1, z * K - 0.7, y - 1];
const pts = (p: Projector, q: V3[]) => q.map(v => p(v));
const d = (sp: { x: number; y: number }[]) => "M" + sp.map(s => `${s.x.toFixed(1)},${s.y.toFixed(1)}`).join("L") + "Z";

/** Midpoint sum with n × n boxes on [0, 2]². */
const midSum = (f: (x: number, y: number) => number, n: number) => {
  const h = 2 / n; let s = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += f((i + 0.5) * h, (j + 0.5) * h);
  return s * h * h;
};
const sliceArea = (f: (x: number, y: number) => number, x: number) => {
  const n = 200, h = 2 / n; let s = 0;
  for (let j = 0; j < n; j++) s += f(x, (j + 0.5) * h);
  return s * h;
};

export function DoubleIntegralFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("boxes");
  const [key, setKey] = useState<Key>("dome");
  const [n, setN] = useState(4);
  const [xs, setXs] = useState(0.7);
  const orb = useOrbit({ yaw: -0.6, pitch: 0.55, zoom: 1 });

  const fn = FNS[key];
  const exact = useMemo(() => midSum(fn.f, 300), [fn]);
  const proj = makeProjector(orb.orbit, W / 2, H / 2 - 10, 80, 9);

  const boxes = mode === "boxes" ? (() => {
    const h = 2 / n, out: { sp: { x: number; y: number }[]; depth: number; fill: string }[] = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const z = fn.f((i + 0.5) * h, (j + 0.5) * h);
      const lo = toV(i * h, j * h, 0), hi = toV((i + 1) * h, (j + 1) * h, z);
      const c: V3 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
      const half: V3 = [(hi[0] - lo[0]) / 2, Math.max(1e-3, (hi[1] - lo[1]) / 2), (hi[2] - lo[2]) / 2];
      for (const fc of boxFaces(c, half)) {
        const sp = pts(proj, fc.pts);
        if (!frontFacing(sp)) continue;
        const light = fc.normal[1] > 0.5 ? 58 : fc.normal[0] !== 0 ? 42 : 32;
        out.push({ sp, depth: sp.reduce((s, q) => s + q.depth, 0) / sp.length, fill: `hsl(200, 70%, ${light}%)` });
      }
    }
    return out.sort((a, b) => b.depth - a.depth);
  })() : [];

  // Surface wireframe: lines of constant x and constant y
  const M = 12, mesh: string[] = [];
  for (let k = 0; k <= M; k++) {
    const u = (2 * k) / M;
    const row = Array.from({ length: 25 }, (_, s) => proj(toV(u, (2 * s) / 24, fn.f(u, (2 * s) / 24))));
    const col = Array.from({ length: 25 }, (_, s) => proj(toV((2 * s) / 24, u, fn.f((2 * s) / 24, u))));
    mesh.push("M" + row.map(q => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join("L"), "M" + col.map(q => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join("L"));
  }
  const base = pts(proj, [toV(0, 0, 0), toV(2, 0, 0), toV(2, 2, 0), toV(0, 2, 0)]);
  const sheet = mode === "slices"
    ? pts(proj, [toV(xs, 0, 0), ...Array.from({ length: 41 }, (_, s) => toV(xs, (2 * s) / 40, fn.f(xs, (2 * s) / 40))), toV(xs, 2, 0)])
    : [];
  const sum = midSum(fn.f, n), A = sliceArea(fn.f, xs);
  const ax = (a: V3, b: V3, label: string) => { const p = proj(a), q = proj(b); return <g key={label}><line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={C.axis} strokeWidth={1.2} /><text x={q.x + 4} y={q.y + 4} fontSize={10} fill={C.muted} fontFamily="monospace">{label}</text></g>; };

  return (
    <Figure
      title={tx(t, "figDbl_title", "Volume under a surface")}
      head={<>
        <Choice value={mode} onChange={setMode} options={[["boxes", tx(t, "figDbl_boxes", "boxes")], ["slices", tx(t, "figDbl_slices", "slices")]] as const} />
        <Btn onClick={orb.reset}>{tx(t, "figDbl_view", "reset view")}</Btn>
      </>}
      controls={<>
        <Row>{(Object.keys(FNS) as Key[]).map(k => <Btn key={k} active={key === k} onClick={() => setKey(k)}>{FNS[k].label}</Btn>)}</Row>
        {mode === "boxes"
          ? <Slider label={tx(t, "figDbl_n", "n × n boxes")} value={n} min={1} max={16} step={1} onChange={setN} fmt={v => `${v}×${v}`} />
          : <Slider label={tx(t, "figDbl_x", "slice at x")} value={xs} min={0} max={2} step={0.01} onChange={setXs} />}
        <Row>
          {mode === "boxes"
            ? <Readout color={C.sky}>{`${tx(t, "figDbl_sum", "boxes")} = ${f2(sum, 4)}`}</Readout>
            : <Readout color={C.amber}>{`A(x) = ∫₀² f(x, y) dy = ${f2(A, 4)}`}</Readout>}
          <Readout color={C.green}>{`${tx(t, "figDbl_exact", "volume")} = ${fn.exact ? fn.exact + " = " : "≈ "}${f2(exact, 4)}`}</Readout>
        </Row>
      </>}
      note={<>
        {mode === "boxes"
          ? tx(t, "figDbl_noteBoxes", "Each small square of the floor has area ΔA = Δx · Δy and carries a box as tall as the surface above its centre, so its volume is f · ΔA. Add all the boxes: a double Riemann sum. As n grows the boxes fit the surface ever more closely, and the sum approaches the volume, the double integral.")
          : tx(t, "figDbl_noteSlices", "Freeze x and the surface above the line x = constant is an ordinary curve in y; the area under it, A(x), is a one-variable integral. Slide x: the sheet's area changes. The volume is made of these sheets, each of thickness dx, so it is ∫ A(x) dx: two ordinary integrals, one inside the other.")}{" "}
        <span data-mouse-only>{tx(t, "figDbl_drag", "Drag to turn the view.")}</span>
        <span data-touch-only>{tx(t, "figDbl_dragTouch", "Swipe to turn the view.")}</span>
      </>}
    >
      <svg ref={orb.ref} {...orb.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-grab" style={{ touchAction: "none" }}>
        <path d={d(base)} fill={C.muted} fillOpacity={0.08} stroke={C.axis} strokeWidth={1} />
        {ax(toV(0, 0, 0), toV(2.5, 0, 0), "x")}
        {ax(toV(0, 0, 0), toV(0, 2.5, 0), "y")}
        {ax(toV(0, 0, 0), toV(0, 0, 4.6), "z")}
        {boxes.map((b, i) => <path key={i} d={d(b.sp)} fill={b.fill} stroke="hsl(200, 70%, 24%)" strokeWidth={0.6} strokeLinejoin="round" />)}
        {mesh.map((m, i) => <path key={i} d={m} fill="none" stroke={C.fg} strokeWidth={0.7} opacity={mode === "boxes" ? 0.35 : 0.5} />)}
        {mode === "slices" && <path d={d(sheet)} fill={C.amber} fillOpacity={0.45} stroke={C.amber} strokeWidth={1.6} strokeLinejoin="round" />}
      </svg>
    </Figure>
  );
}
