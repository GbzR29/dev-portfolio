"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Sliders, Btn, C } from "@/components/lesson/kit/figure";
import { makeProjector, useOrbit, lerp3, type V3 } from "@/components/lesson/kit/scene3d";

// ── What this figure shows ────────────────────────────────────────────────────
// A box a × b × c unfolds into its net: six rectangles lying flat. The
// surface area is the area of the net, three pairs of equal rectangles:
// 2(ab + bc + ca). The four walls are hinged on the floor's edges and the lid
// on the back wall's top edge, so one slider opens the box like a carton.

const W = 560, H = 320;
const n2 = (v: number) => (+v.toFixed(2)).toString();

type Face = { pts: V3[]; col: string; label: string };

function netFaces(a: number, b: number, c: number, f: number): Face[] {
  const phi = (f * Math.PI) / 2;                       // 0 closed, 90° flat
  const cs = Math.cos(phi), sn = Math.sin(phi);
  const up = (v: number) => v * cs, out = (v: number) => v * sn;
  // The lid continues from the back wall's top edge at 2φ − 90° from vertical
  const psi = 2 * phi - Math.PI / 2, lc = Math.cos(psi), ls = Math.sin(psi);
  const backTop = (x: number): V3 => [x, up(c), b + out(c)];
  return [
    { pts: [[0, 0, 0], [a, 0, 0], [a, 0, b], [0, 0, b]], col: C.sky, label: "ab" },
    { pts: [[0, 0, 0], [a, 0, 0], [a, up(c), -out(c)], [0, up(c), -out(c)]], col: C.amber, label: "ac" },
    { pts: [[0, 0, b], [a, 0, b], backTop(a), backTop(0)], col: C.amber, label: "ac" },
    { pts: [[0, 0, 0], [0, 0, b], [-out(c), up(c), b], [-out(c), up(c), 0]], col: C.pink, label: "bc" },
    { pts: [[a, 0, 0], [a, 0, b], [a + out(c), up(c), b], [a + out(c), up(c), 0]], col: C.pink, label: "bc" },
    {
      pts: [backTop(0), backTop(a),
        [a, up(c) + b * lc, b + out(c) + b * ls], [0, up(c) + b * lc, b + out(c) + b * ls]],
      col: C.sky, label: "ab",
    },
  ];
}

export function NetFigure({ t }: { t?: TrackTranslations }) {
  const [a, setA] = useState(3), [b, setB] = useState(2), [c, setC] = useState(1.5);
  const [f, setF] = useState(0.4);
  const orb = useOrbit({ yaw: -0.5, pitch: 0.75, zoom: 1 });

  const proj = makeProjector(orb.orbit, W / 2, H / 2, 48, 26);
  const centre = lerp3([a / 2, c / 2, b / 2], [a / 2, 0, b], f);
  const faces = netFaces(a, b, c, f).map(fc => {
    const sp = fc.pts.map(q => proj([q[0] - centre[0], q[1] - centre[1], q[2] - centre[2]]));
    return { ...fc, sp, depth: sp.reduce((s, q) => s + q.depth, 0) / sp.length };
  }).sort((x, y) => y.depth - x.depth);
  const S = 2 * (a * b + b * c + c * a);
  const area = (l: string) => (l === "ab" ? a * b : l === "ac" ? a * c : b * c);

  return (
    <Figure
      title={tx(t, "figNet_title", "Unfolding a box")}
      head={<Btn onClick={orb.reset}>{tx(t, "figNet_view", "reset view")}</Btn>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figNet_open", "unfold")} value={f} min={0} max={1} step={0.01} onChange={setF} fmt={v => `${Math.round(v * 90)}°`} />
          <Slider label="a" value={a} min={1} max={3.5} step={0.5} onChange={setA} fmt={n2} />
          <Slider label="b" value={b} min={1} max={2.5} step={0.5} onChange={setB} fmt={n2} />
          <Slider label="c" value={c} min={0.5} max={2} step={0.5} onChange={setC} fmt={n2} />
        </Sliders>
        <Row>
          <Readout color={C.sky}>{`2 · ab = ${n2(2 * a * b)}`}</Readout>
          <Readout color={C.amber}>{`2 · ac = ${n2(2 * a * c)}`}</Readout>
          <Readout color={C.pink}>{`2 · bc = ${n2(2 * b * c)}`}</Readout>
          <Readout color={C.green}>{`S = ${n2(S)}`}</Readout>
          <Readout>{`V = abc = ${n2(a * b * c)}`}</Readout>
        </Row>
      </>}
      note={<>
        {tx(t, "figNet_note", "Slide \"unfold\" to open the box flat. The surface is made of six rectangles in three matching pairs: floor and lid (a × b, blue), front and back (a × c, amber), left and right (b × c, pink). Their total is the surface area, the amount of cardboard, paint or texture the box needs; the volume is what fits inside.")}{" "}
        <span data-mouse-only>{tx(t, "figNet_drag", "Drag to turn the view.")}</span>
        <span data-touch-only>{tx(t, "figNet_dragTouch", "Swipe to turn the view.")}</span>
      </>}
    >
      <svg ref={orb.ref} {...orb.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-grab" style={{ touchAction: "none" }}>
        {faces.map((fc, i) => {
          const cx = fc.sp.reduce((s, q) => s + q.x, 0) / 4, cy = fc.sp.reduce((s, q) => s + q.y, 0) / 4;
          return <g key={i}>
            <path d={"M" + fc.sp.map(q => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join("L") + "Z"} fill={fc.col} fillOpacity={0.35} stroke={fc.col} strokeWidth={1.6} strokeLinejoin="round" />
            {f > 0.85 && <text x={cx} y={cy + 4} fontSize={10} textAnchor="middle" fontFamily="monospace" fontWeight={700} fill={fc.col} pointerEvents="none">{n2(area(fc.label))}</text>}
          </g>;
        })}
      </svg>
    </Figure>
  );
}
