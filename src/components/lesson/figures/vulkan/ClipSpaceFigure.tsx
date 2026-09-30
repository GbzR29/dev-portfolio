"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, C, T, useDrag, nearest, Handle, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The same three NDC vertices through two viewport transforms. On the left the
// normalized device coordinates, drawn with +y up like a maths plot. On the
// right the 800 × 600 framebuffer each API produces: OpenGL counts window rows
// from the bottom, so the picture keeps the plot's orientation; Vulkan counts
// rows from the top, so the same numbers land upside down, and the winding
// seen on screen flips from counter-clockwise to clockwise. A negative viewport
// height (y = 600, height = −600) turns Vulkan's picture back.

const W = 620, H = 262;
const NX = 24, NY = 36, NS = 196;                    // NDC square: position and size
const PW = 160, PH = 120, PY = 92;                   // framebuffer panels
const P_GL = 262, P_VK = 444;
const FB_W = 800, FB_H = 600;
const COLS = [C.red, C.green, C.blue];

const toSvg = (v: Pt): Pt => ({ x: NX + ((v.x + 1) / 2) * NS, y: NY + ((1 - v.y) / 2) * NS });
const toNdc = (p: Pt): Pt => ({
  x: Math.max(-1, Math.min(1, ((p.x - NX) / NS) * 2 - 1)),
  y: Math.max(-1, Math.min(1, 1 - ((p.y - NY) / NS) * 2)),
});
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Window-space position in pixels, with rows counted as the API counts them. */
function fb(v: Pt, api: "gl" | "vk", flip: boolean) {
  const x = ((v.x + 1) / 2) * FB_W;
  if (api === "gl") return { x, y: ((v.y + 1) / 2) * FB_H };                // row 0 = bottom
  return { x, y: flip ? ((1 - v.y) / 2) * FB_H : ((v.y + 1) / 2) * FB_H };  // row 0 = top
}

export function ClipSpaceFigure({ t }: { t?: TrackTranslations }) {
  const [verts, setVerts] = useState<Pt[]>([{ x: 0, y: -0.5 }, { x: 0.5, y: 0.5 }, { x: -0.5, y: 0.5 }]);
  const [sel, setSel] = useState(0);
  const [flip, setFlip] = useState(false);

  const drag = useDrag<number>(
    p => nearest(p, verts.map((v, i) => [i, toSvg(v)] as [number, Pt]), 16),
    (i, p) => { setSel(i); setVerts(vs => vs.map((v, k) => (k === i ? { x: r2(toNdc(p).x), y: r2(toNdc(p).y) } : v))); },
  );

  // Signed area with y up (the NDC plot): > 0 means counter-clockwise
  const area = (a: Pt, b: Pt, c: Pt) => (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
  const ndcCcw = area(verts[0], verts[1], verts[2]) > 0;

  const panel = (px: number, api: "gl" | "vk") => {
    // Where each vertex appears on the monitor, in panel units (top-left origin)
    const pts = verts.map(v => {
      const f = fb(v, api, flip);
      const rowFromTop = api === "gl" ? FB_H - f.y : f.y;
      return { x: px + (f.x / FB_W) * PW, y: PY + (rowFromTop / FB_H) * PH };
    });
    // On screen y goes down, so the sign flips relative to the y-up formula
    const screenCcw = area(pts[0], pts[1], pts[2]) < 0;
    const upside = api === "vk" && !flip;
    return (
      <g>
        <T x={px} y={PY - 30} size={9.5} bold color={C.fg}>{api === "gl" ? "OpenGL" : "Vulkan"}</T>
        <T x={px} y={PY - 16} size={8}>{api === "gl" ? tx(t, "figVkClip_glRows", "row 0 = bottom") : tx(t, "figVkClip_vkRows", "row 0 = top")}</T>
        <rect x={px} y={PY} width={PW} height={PH} fill="#0b1020" stroke={C.axis} />
        <polygon points={pts.map(p => `${p.x},${p.y}`).join(" ")} fill={C.amber} fillOpacity={0.35} stroke={C.amber} strokeWidth={1.2} />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={i === sel ? 4.5 : 3.2} fill={COLS[i]} />)}
        <circle cx={px + 4} cy={api === "gl" ? PY + PH - 4 : PY + 4} r={2.5} fill={C.fg} />
        <T x={px + 9} y={api === "gl" ? PY + PH - 7 : PY + 12} size={7.5} color="#cbd5e1">(0,0)</T>
        <T x={px} y={PY + PH + 16} size={8.5} color={screenCcw ? C.green : C.amber}>
          {tx(t, "figVkClip_onScreen", "on screen:")} {screenCcw ? "CCW" : "CW"}{upside ? ` · ${tx(t, "figVkClip_upside", "upside down")}` : ""}
        </T>
      </g>
    );
  };

  const v = verts[sel];
  const g = fb(v, "gl", flip), k = fb(v, "vk", flip);

  return (
    <Figure
      title={tx(t, "figVkClip_title", "The same NDC, two viewports")}
      head={<Btn active={flip} onClick={() => setFlip(f => !f)}>{tx(t, "figVkClip_flip", "Vulkan: negative viewport height")}</Btn>}
      controls={<>
        <Row>
          <Readout color={COLS[sel]}>v{sel} = ({v.x.toFixed(2)}, {v.y.toFixed(2)})</Readout>
          <Readout>OpenGL → ({g.x.toFixed(0)}, {g.y.toFixed(0)}) {tx(t, "figVkClip_fromBottom", "from bottom")}</Readout>
          <Readout>Vulkan → ({k.x.toFixed(0)}, {k.y.toFixed(0)}) {tx(t, "figVkClip_fromTop", "from top")}</Readout>
        </Row>
      </>}
      note={tx(t, "figVkClip_note", "Drag the three vertices. The numbers are the same for both APIs; only the viewport transform differs. OpenGL counts window rows from the bottom, Vulkan from the top, so a vertex with y = −0.5 is in the lower half of an OpenGL window and the upper half of a Vulkan one. The starting triangle is the classic Vulkan first triangle: it points up in Vulkan and down in OpenGL. Watch the winding too: flipping the picture turns counter-clockwise into clockwise, which matters as soon as back-face culling is on. The negative viewport height (y = 600, height = −600) makes Vulkan count like OpenGL again.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <T x={NX} y={NY - 14} size={9.5} bold color={C.fg}>NDC</T>
        <rect x={NX} y={NY} width={NS} height={NS} fill="none" stroke={C.axis} />
        <line x1={NX + NS / 2} y1={NY} x2={NX + NS / 2} y2={NY + NS} stroke={C.grid} />
        <line x1={NX} y1={NY + NS / 2} x2={NX + NS} y2={NY + NS / 2} stroke={C.grid} />
        <T x={NX + NS / 2 + 4} y={NY + 10} size={8}>+y</T>
        <T x={NX + NS - 16} y={NY + NS / 2 - 4} size={8}>+x</T>
        <T x={NX - 2} y={NY + NS + 12} size={8}>−1</T>
        <T x={NX + NS - 6} y={NY + NS + 12} size={8}>1</T>
        <polygon points={verts.map(v => { const p = toSvg(v); return `${p.x},${p.y}`; }).join(" ")}
          fill={C.amber} fillOpacity={0.25} stroke={C.amber} strokeWidth={1.2} />
        {verts.map((v, i) => { const p = toSvg(v); return <Handle key={i} x={p.x} y={p.y} color={COLS[i]} active={drag.dragging === i} />; })}
        <T x={NX} y={NY + NS + 24} size={8.5} color={ndcCcw ? C.green : C.amber}>{tx(t, "figVkClip_inNdc", "in this plot:")} {ndcCcw ? "CCW" : "CW"}</T>
        {panel(P_GL, "gl")}
        {panel(P_VK, "vk")}
      </svg>
    </Figure>
  );
}
