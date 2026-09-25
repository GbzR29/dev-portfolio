"use client";

import { useId } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { useStepper, stepAmount, StepperControls } from "./Stepper";
import { Arrow, Label, pts } from "./svg";
import {
  type V3, type Box, add, sub, scale, lerp3, rotY, makeProjector, useOrbit, boxFaces, frontFacing, lightAmount,
  towardEye, visibleRuns,
  lookAtBasis, viewTransform,
} from "./scene3d";
import { TexturedFace, FigureIcon, useProtoTextures } from "./protoTexture";

// ── What this figure shows ────────────────────────────────────────────────────
// One vertex on its way to the screen. Each step animates the whole scene into
// the next space, so the matrices stop being abstract:
//   0 local  →  1 world (M)  →  2 view (V)  →  3 clip + NDC (P, then ÷w)  →  4 screen (viewport)

const VW = 560, VH = 310;

// Scene
const MODEL_POS: V3 = [0.6, 0, -0.6];
const MODEL_YAW = (35 * Math.PI) / 180;
const CAM = lookAtBasis([1.9, 1.2, 1.9], [0.5, 0, -0.5]);
const V_LOCAL: V3 = [0.5, 0.5, 0.5];

// Projection
const FOV = (50 * Math.PI) / 180, ASPECT = 1.6, NEAR = 1, FAR = 5;
const TH = Math.tan(FOV / 2);
const VIEWPORT = { w: 800, h: 500 };

// Where the NDC cube is drawn, in view-space units (so the morph stays on screen)
const K = 1.7, NDC_Z = -4.2;
const ndcDisplay = (n: V3): V3 => [n[0] * K, n[1] * K, NDC_Z - n[2] * K];

const COL_V = "#f59e0b";

const clipOf = (v: V3): [number, number, number, number] => [
  v[0] / (ASPECT * TH),
  v[1] / TH,
  (-(FAR + NEAR) / (FAR - NEAR)) * v[2] - (2 * FAR * NEAR) / (FAR - NEAR),
  -v[2],
];
const ndcOf = (v: V3): V3 => { const c = clipOf(v); return [c[0] / c[3], c[1] / c[3], c[2] / c[3]]; };

/** Model matrix applied partway: rotate first, then translate (T·R). */
const model = (q: V3, a: number): V3 => add(rotY(q, MODEL_YAW * a), scale(MODEL_POS, a));

/** Full pipeline at progress p, for a point that starts in local space. */
function pipeline(q: V3, p: number, isLocal: boolean): V3 {
  const aM = stepAmount(p, 1), aV = stepAmount(p, 2), aP = stepAmount(p, 3), aS = stepAmount(p, 4);
  const world = isLocal ? model(q, aM) : q;
  const view = viewTransform(CAM, aV).point(world);
  if (aP === 0) return view;
  const nd = ndcDisplay(ndcOf(view));
  const morphed = lerp3(view, nd, aP);
  // The viewport flattens z away and stretches x back out by the aspect ratio
  return [morphed[0] * (1 + (ASPECT - 1) * aS), morphed[1], morphed[2] + (NDC_Z - morphed[2]) * aS];
}

// Frustum corners in view space → world, so they ride along with the pipeline
const frustumWorld = (() => {
  const rect = (d: number): V3[] => {
    const h = TH * d, w = h * ASPECT;
    return [[-w, -h, -d], [w, -h, -d], [w, h, -d], [-w, h, -d]];
  };
  const toWorld = (v: V3): V3 => add(CAM.pos, add(scale(CAM.r, v[0]), add(scale(CAM.u, v[1]), scale(CAM.f, -v[2]))));
  return { near: rect(NEAR).map(toWorld), far: rect(FAR).map(toWorld) };
})();

// Ground grid (world space); hidden once the projection starts
const GRID: [V3, V3][] = Array.from({ length: 7 }, (_, i) => i - 3).flatMap(k => [
  [[k, -0.5, -3], [k, -0.5, 3]] as [V3, V3],
  [[-3, -0.5, k], [3, -0.5, k]] as [V3, V3],
]);

// The diagram stays centred on whatever the current space is about
const CENTERS: V3[] = [[0, 0, 0], [1.1, 0.5, 0.5], [0, 0, -2.2], [0, 0, NDC_Z], [0, 0, NDC_Z]];
const centerAt = (p: number): V3 => {
  const i = Math.max(0, Math.min(3, Math.floor(p)));
  return lerp3(CENTERS[i], CENTERS[i + 1], p - i);
};

const f2 = (n: number) => (Math.abs(n) < 0.005 ? 0 : n).toFixed(2);
const fv = (v: number[]) => `(${v.map(f2).join(", ")})`;

export function VertexJourneyFigure({ t }: { t?: TrackTranslations }) {
  const st = useStepper(4, 1500);
  const { orbit, handlers, ref, reset } = useOrbit({ yaw: -0.55, pitch: 0.38, zoom: 1 });
  const textures = useProtoTextures();
  const uid = useId().replace(/:/g, "");
  const p = st.p;
  const aM = stepAmount(p, 1), aV = stepAmount(p, 2), aP = stepAmount(p, 3), aS = stepAmount(p, 4);

  const c = centerAt(p);
  const P0 = makeProjector(orbit, VW / 2, VH / 2 + 10, 50, 14);
  const P = (q: V3) => P0(sub(q, c));
  const L = (q: V3) => P(pipeline(q, p, true));      // a local-space point
  const Wd = (q: V3) => P(pipeline(q, p, false));    // a world-space point

  // Object faces, shaded by their (rotating) normals
  // Faces are sorted by their depth before the viewport flattens them, so the
  // painter's order still makes sense once everything lies in one plane.
  // Up to NDC, back faces are the ones turned away from the diagram's eye.
  // The screen step flattens everything into the scene camera's image, so from
  // there on the camera decides — like glCullFace: a face is kept when its NDC
  // corners wind counter-clockwise (y up; frontFacing expects y down).
  const faces = boxFaces([0, 0, 0], [0.5, 0.5, 0.5]).map(fc => {
    const sp = fc.pts.map(L);
    const pre = fc.pts.map(q => P(pipeline(q, Math.min(p, 3), true)));
    const n = viewTransform(CAM, aV).dir(rotY(fc.normal, MODEL_YAW * aM));
    const depth = pre.reduce((a, b) => a + b.depth, 0) / 4;
    const ndc = fc.pts.map(q => ndcOf(viewTransform(CAM, 1).point(model(q, 1))));
    const front = aS > 0 ? frontFacing(ndc.map(v => ({ x: v[0], y: -v[1] }))) : frontFacing(pre);
    return { sp, quad: fc.pts, light: lightAmount(n), depth, front };
  }).filter(f => f.front).sort((a, b) => b.depth - a.depth);

  const vtx = L(V_LOCAL);

  // Values for the table
  const vWorld = model(V_LOCAL, 1);
  const vView = viewTransform(CAM, 1).point(vWorld);
  const vClip = clipOf(vView);
  const vNdc = ndcOf(vView);
  const px = [(vNdc[0] + 1) / 2 * VIEWPORT.w, (vNdc[1] + 1) / 2 * VIEWPORT.h, (vNdc[2] + 1) / 2];

  const rows: { key: string; name: string; formula: string; value: string; color: string }[] = [
    { key: "figJ_local",  name: "Local",  formula: "v",               value: fv([...V_LOCAL, 1]), color: "#60a5fa" },
    { key: "figJ_world",  name: "World",  formula: "M · v",           value: fv([...vWorld, 1]), color: "#34d399" },
    { key: "figJ_view",   name: "View",   formula: "V · M · v",       value: fv([...vView, 1]), color: "#a78bfa" },
    { key: "figJ_clip",   name: "Clip → NDC", formula: "P · V · M · v, then ÷ w",
      value: `${fv(vClip)} ÷ ${f2(vClip[3])} = ${fv(vNdc)}`, color: "#f472b6" },
    { key: "figJ_screen", name: "Screen", formula: "viewport",        value: `(${px[0].toFixed(0)}, ${px[1].toFixed(0)}) px · depth ${px[2].toFixed(3)}`, color: COL_V },
  ];
  const current = Math.round(st.raw);

  const captions: [string, string][] = [
    ["figJ_c0", "Local space: the model as the artist made it, centred on its own origin. The orange dot is the vertex we will follow."],
    ["figJ_c1", "The model matrix rotates it and moves it into its place in the world, next to the camera."],
    ["figJ_c2", "The view matrix moves the whole world so the camera sits at the origin looking down −Z."],
    ["figJ_c3", "The projection matrix plus the divide by w squeezes the frustum into the NDC cube: far things get smaller, the pyramid becomes a box. (NDC is left-handed: +z now points away.)"],
    ["figJ_c4", "The viewport flattens the cube onto the window: x and y become pixels, z goes to the depth buffer."],
  ];

  // Frustum and NDC cube edges
  const fr = frustumWorld;
  const frustumEdges: [V3, V3][] = [
    ...fr.near.map((q, i) => [q, fr.near[(i + 1) % 4]] as [V3, V3]),
    ...fr.far.map((q, i) => [q, fr.far[(i + 1) % 4]] as [V3, V3]),
    ...fr.near.map((q, i) => [q, fr.far[i]] as [V3, V3]),
  ];
  const showFrustum = aM > 0;
  const camPt = Wd(CAM.pos);

  // Viewport rectangle (appears in the last step)
  const vpRect: V3[] = [[-K * ASPECT, -K, NDC_Z], [K * ASPECT, -K, NDC_Z], [K * ASPECT, K, NDC_Z], [-K * ASPECT, K, NDC_Z]];

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figJ_title", "A Vertex's Journey — Local to Screen")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono text-right">
          {tx(t, "figCam_hint", "drag the figure to look around · scroll to zoom")}
        </span>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] relative">
        <svg ref={ref} viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto select-none cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }} role="img" aria-label="A vertex travelling through the MVP spaces" {...handlers}>

          {/* Ground grid — only up to view space: parts of it are behind the
              camera, where dividing by w would fling them across the canvas */}
          {aM > 0 && aP === 0 && GRID.map(([a, b], i) => {
            const A = Wd(a), B = Wd(b);
            return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="var(--code-line)"
              strokeWidth="0.8" opacity={Math.min(1, aM * 2)} />;
          })}

          {/* Local axes in step 0, world axes afterwards */}
          {([[1.2, 0, 0], [0, 1.2, 0], [0, 0, 1.2]] as V3[]).map((d, i) => {
            const o = aM > 0 ? Wd([0, 0, 0]) : L([0, 0, 0]);
            const e = aM > 0 ? Wd(d) : L(d);
            return (
              <g key={i} opacity={1 - aP}>
                <Arrow a={o} b={e} color="var(--code-muted)" w={1.1} head={5} />
                <text x={e.x + 4} y={e.y + 3} fill="var(--code-muted)" fontSize="9" fontFamily="monospace">{"xyz"[i]}</text>
              </g>
            );
          })}

          {/* Frustum (world → view → NDC cube → flat) */}
          {showFrustum && frustumEdges.map(([a, b], i) => {
            const A = Wd(a), B = Wd(b);
            return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="rgba(59,130,246,0.7)"
              strokeWidth="1" opacity={Math.min(1, aM * 2)} />;
          })}

          {/* Viewport rectangle */}
          {aS > 0 && (() => {
            const r = vpRect.map(P);
            return (
              <g opacity={aS}>
                <polygon points={pts(r)} fill="rgba(245,158,11,0.08)" stroke={COL_V} strokeWidth="1.4" />
                <Label x={r[0].x - 4} y={r[0].y + 14} anchor="end" color={COL_V}>(0, 0)</Label>
                <Label x={r[2].x + 4} y={r[2].y - 4} color={COL_V}>{`(${VIEWPORT.w}, ${VIEWPORT.h})`}</Label>
              </g>
            );
          })()}

          {/* Camera: a dot with a short forward arrow, until the projection absorbs it */}
          {showFrustum && aP === 0 && (
            <g opacity={Math.min(1, aM * 2)}>
              <FigureIcon name="camera" x={camPt.x} y={camPt.y} size={22}>
                <circle cx={camPt.x} cy={camPt.y} r={4} fill="var(--text-main)" />
              </FigureIcon>
              <Arrow a={camPt} b={Wd(add(CAM.pos, scale(CAM.f, 0.9)))} color="#3b82f6" w={2} head={6} />
              <Label x={camPt.x + 8} y={camPt.y - 8} color="var(--text-main)">{aV >= 1 ? "camera (0,0,0)" : "camera"}</Label>
            </g>
          )}

          {/* The object */}
          {faces.map((f, i) => (
            <TexturedFace key={i} id={`${uid}-f${i}`} quad={f.quad} project={L} name="purple" tex={textures?.purple} light={f.light} />
          ))}

          {/* Axes again, only the parts in front of the cube (rigid spaces only) */}
          {aP === 0 && (() => {
            const vt = viewTransform(CAM, aV);
            const cube: Box = {
              c: pipeline([0, 0, 0], p, true), half: [0.5, 0.5, 0.5],
              ax: [vt.dir(rotY([1, 0, 0], MODEL_YAW * aM)), vt.dir(rotY([0, 1, 0], MODEL_YAW * aM)), vt.dir(rotY([0, 0, 1], MODEL_YAW * aM))],
            };
            const toward = towardEye(orbit);
            return ([[1.2, 0, 0], [0, 1.2, 0], [0, 0, 1.2]] as V3[]).map((d, i) => {
              const o3 = pipeline([0, 0, 0], p, aM === 0), e3 = pipeline(d, p, aM === 0);
              return visibleRuns(o3, e3, [cube], toward).map(([ra, rb], k) => {
                const A = P(ra), B = P(rb);
                const atTip = Math.hypot(rb[0] - e3[0], rb[1] - e3[1], rb[2] - e3[2]) < 1e-6;
                return atTip ? (
                  <g key={`${i}-${k}`}>
                    <Arrow a={A} b={B} color="var(--code-muted)" w={1.1} head={5} />
                    <text x={B.x + 4} y={B.y + 3} fill="var(--code-muted)" fontSize="9" fontFamily="monospace">{"xyz"[i]}</text>
                  </g>
                ) : <line key={`${i}-${k}`} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="var(--code-muted)" strokeWidth="1.1" />;
              });
            });
          })()}

          {/* The tracked vertex */}
          <circle cx={vtx.x} cy={vtx.y} r={4.5} fill={COL_V} stroke="white" strokeWidth="1.2" />
          <Label x={vtx.x + 8} y={vtx.y - 6} color={COL_V} bold>v</Label>

          {/* Name of the space we are in */}
          <Label x={10} y={20} color={rows[current].color} bold size={10}>
            {`${tx(t, rows[current].key, rows[current].name)} space`}
          </Label>
        </svg>
        <button onClick={reset}
          className="absolute top-3 right-3 text-[9px] font-mono px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--primary)]">
          {tx(t, "figCam_resetView", "reset view")}
        </button>
      </div>

      <div className="p-4 md:p-5 space-y-4">
        <p className="text-[12.5px] text-[var(--text-main)] leading-relaxed min-h-[40px]">
          {tx(t, ...captions[current])}
        </p>

        {/* The vertex in every space */}
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-[10.5px] border-collapse">
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.key} onClick={() => st.scrub(i)}
                  className={`cursor-pointer transition-colors ${i === current ? "bg-[var(--primary-low)]" : "hover:bg-[var(--primary-low)]/50"}`}
                  style={{ opacity: i > current ? 0.4 : 1 }}>
                  <td className="py-1 px-2 whitespace-nowrap font-bold" style={{ color: r.color }}>
                    {tx(t, r.key, r.name)}
                  </td>
                  <td className="py-1 px-2 whitespace-nowrap text-[var(--text-muted)]">{r.formula}</td>
                  <td className="py-1 px-2 whitespace-nowrap text-[var(--text-main)]">{i <= current ? r.value : "…"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <StepperControls s={st} />
      </div>
    </figure>
  );
}
