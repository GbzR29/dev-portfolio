"use client";

import { useEffect, useRef, useState } from "react";
import { FigureIcon } from "../kit/protoTexture";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Arrow, Label, pts, type P2 } from "../kit/svg";
import { type V3, add, sub, scale, cross, norm, rotY, makeProjector } from "../kit/scene3d";
import { useFigureSpeed, SpeedControl, scaledMs } from "../kit/Stepper";
import { useVisible } from "../kit/figure";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// One triangle, defined once with its vertices in counter-clockwise order.
// Spin it: seen from behind, the very same vertices run clockwise on screen.
// OpenGL decides front/back from that on-screen order alone, and culling
// throws the back faces away before any fragment is shaded.

const W = 420, H = 260;
const TRI: V3[] = [[0, 0.95, 0], [-0.95, -0.6, 0], [0.95, -0.6, 0]];   // CCW seen from +Z
const COL_FRONT = "#22c55e", COL_BACK = "#ef4444", COL_N = "#f59e0b";

type Face = "BACK" | "FRONT";
type Order = "CCW" | "CW";

export function WindingFigure({ t }: { t?: TrackTranslations }) {
  const [angle, setAngle] = useState(25);
  const [spin, setSpin] = useState(false);
  const [cull, setCull] = useState(true);
  const [cullFace, setCullFace] = useState<Face>("BACK");
  const [frontFace, setFrontFace] = useState<Order>("CCW");
  const last = useRef<number | null>(null);
  const [speed, setSpeed] = useFigureSpeed();
  const speedRef = useRef(speed); speedRef.current = speed;
  const vis = useVisible<HTMLElement>();

  // Continuous spin, paused while the figure is off screen
  useEffect(() => {
    if (!spin || !vis.on) { last.current = null; return; }
    let raf = 0;
    const tick = (now: number) => {
      // One full turn takes ~8 s at 1×
      if (last.current !== null) setAngle(a => (a + ((now - last.current!) * 360) / scaledMs(5000, speedRef.current)) % 360);
      last.current = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spin, vis.on]);

  // The camera looks straight down -Z from +Z; yaw/pitch 0 in the diagram projector.
  const P = makeProjector({ yaw: 0, pitch: 0, zoom: 1 }, W / 2 - 50, H / 2 + 6, 78, 4.2);
  const r = (angle * Math.PI) / 180;
  const verts = TRI.map(v => rotY(v, r));
  const sp = verts.map(P);

  // Signed area on screen (y flipped back to math orientation): > 0 means CCW
  const area = ((sp[1].x - sp[0].x) * -(sp[2].y - sp[0].y) - -(sp[1].y - sp[0].y) * (sp[2].x - sp[0].x)) / 2;
  const screenOrder: Order = area > 0 ? "CCW" : "CW";
  const isFront = screenOrder === frontFace;
  const culled = cull && (cullFace === "BACK" ? !isFront : isFront);
  const edgeOn = Math.abs(area) < 60;                 // almost edge-on: order is ambiguous

  // Face normal from the winding: cross(v1 - v0, v2 - v0)
  const c3 = scale(add(add(verts[0], verts[1]), verts[2]), 1 / 3);
  const n = norm(cross(sub(verts[1], verts[0]), sub(verts[2], verts[0])));
  const cS = P(c3), nS = P(add(c3, scale(n, 0.8)));
  const towardCam = n[2] > 0;

  const col = isFront ? COL_FRONT : COL_BACK;

  // Circular arrow around the centroid, turning the way the vertices run on screen
  const ring = (() => {
    const R = 18, dir = area > 0 ? -1 : 1;            // screen y is down: CCW is negative sweep
    const a0 = -Math.PI / 2 + 0.5, a1 = a0 + dir * (Math.PI * 1.55);
    const p0 = { x: cS.x + Math.cos(a0) * R, y: cS.y + Math.sin(a0) * R };
    const p1 = { x: cS.x + Math.cos(a1) * R, y: cS.y + Math.sin(a1) * R };
    const tangent = { x: -Math.sin(a1) * dir, y: Math.cos(a1) * dir };
    const head = [
      `${p1.x + tangent.x * 6},${p1.y + tangent.y * 6}`,
      `${p1.x - tangent.y * 4},${p1.y + tangent.x * 4}`,
      `${p1.x + tangent.y * 4},${p1.y - tangent.x * 4}`,
    ].join(" ");
    return { d: `M ${p0.x} ${p0.y} A ${R} ${R} 0 1 ${dir > 0 ? 1 : 0} ${p1.x} ${p1.y}`, head };
  })();

  // Top-down minimap: x to the right, z down toward the camera
  const MM = { x: W - 90, y: 26, s: 30 };
  const mm = (v: V3): P2 => ({ x: MM.x + v[0] * MM.s, y: MM.y + 44 + v[2] * MM.s });
  const mmA = mm(verts[1]), mmB = mm(verts[2]);
  const mmC = mm([c3[0], 0, c3[2]]), mmN = mm(add([c3[0], 0, c3[2]], scale([n[0], 0, n[2]], 1.1)));
  const camMM = mm([0, 0, 1.75]);

  const btn = (active: boolean) =>
    `px-2 py-0.5 text-[10px] font-mono rounded border transition-all ${
      active ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
        : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <FigureShell ref={vis.ref}>
      <style>{`@keyframes wind-flow { to { stroke-dashoffset: -20; } }`}</style>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figWind_title", "Winding Order — Same Triangle, Both Sides")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figWind_hint", "spin it and watch the order flip")}</span>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label="Triangle winding seen from the camera">
          {/* The triangle — or its ghost if culled */}
          <polygon points={pts(sp)} fill={culled ? "none" : col} fillOpacity={culled ? 0 : 0.2}
            stroke={col} strokeWidth={culled ? 1 : 1.5} strokeDasharray={culled ? "4 4" : "none"} opacity={culled ? 0.5 : 1} />

          {/* Edges, flowing v0 → v1 → v2 → v0 */}
          {!culled && !edgeOn && sp.map((a, i) => {
            const b = sp[(i + 1) % 3];
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={col} strokeWidth="3"
              strokeDasharray="6 4" style={{ animation: "wind-flow 0.7s linear infinite" }} />;
          })}

          {/* On-screen order */}
          {!edgeOn && (
            <g opacity={culled ? 0.5 : 1}>
              <path d={ring.d} fill="none" stroke={col} strokeWidth="1.8" />
              <polygon points={ring.head} fill={col} />
            </g>
          )}

          {/* Vertices */}
          {sp.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={5} fill={col} stroke="var(--code-bg)" strokeWidth="1.5" />
              <Label x={p.x + (i === 0 ? 8 : i === 1 ? -26 : 8)} y={p.y + (i === 0 ? -4 : 16)} color={col} bold>{`v${i}`}</Label>
            </g>
          ))}

          {/* Normal from the cross product */}
          <Arrow a={cS} b={nS} color={COL_N} w={2} head={7} dash={towardCam ? undefined : "3 3"} />
          <Label x={nS.x + 6} y={nS.y - 4} color={COL_N}>
            {towardCam ? "normal → toward you" : "normal → away"}
          </Label>

          {/* Verdict */}
          <Label x={12} y={22} color={col} bold size={10}>
            {edgeOn ? tx(t, "figWind_edge", "edge-on: zero area, nothing to draw")
              : `${screenOrder} ${tx(t, "figWind_onScreen", "on screen")} → ${isFront ? "FRONT" : "BACK"} face${culled ? " · CULLED" : ""}`}
          </Label>

          {/* Minimap, seen from above */}
          <g>
            <rect x={MM.x - 58} y={MM.y - 14} width={116} height={126} rx={6} fill="var(--card)" opacity={0.85} stroke="var(--border)" />
            <text x={MM.x} y={MM.y} fill="var(--code-muted)" fontSize="8" fontFamily="monospace" textAnchor="middle">
              {tx(t, "figWind_top", "top view")}
            </text>
            <line x1={mmA.x} y1={mmA.y} x2={mmB.x} y2={mmB.y} stroke={col} strokeWidth="3" strokeLinecap="round" />
            <Arrow a={mmC} b={mmN} color={COL_N} w={1.6} head={5} />
            <FigureIcon name="camera" x={camMM.x} y={camMM.y} size={18}>
              <circle cx={camMM.x} cy={camMM.y} r={4} fill="var(--text-main)" />
            </FigureIcon>
            <line x1={camMM.x} y1={camMM.y - 6} x2={camMM.x} y2={camMM.y - 16} stroke="var(--text-main)" strokeWidth="1.2" />
            <text x={camMM.x} y={camMM.y + 13} fill="var(--code-muted)" fontSize="8" fontFamily="monospace" textAnchor="middle">camera</text>
          </g>
        </svg>
      </div>

      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-2.5">
          <label className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-[var(--text-muted)] w-14">{tx(t, "figWind_rotate", "rotate Y")}</span>
            <input type="range" min={0} max={359} step={1} value={Math.round(angle)}
              onChange={e => { setSpin(false); setAngle(Number(e.target.value)); }} className="flex-1 accent-[var(--primary)]" />
            <span className="text-[10px] font-mono text-[var(--primary)] w-9 text-right">{Math.round(angle)}°</span>
            <button className={`${btn(spin)} whitespace-nowrap`} onClick={() => setSpin(s => !s)}>{spin ? "❚❚ stop" : "▶ spin"}</button>
          </label>
          <SpeedControl speed={speed} setSpeed={setSpeed} />
          <div className="flex items-center gap-1.5 flex-wrap">
            <button className={btn(cull)} onClick={() => setCull(c => !c)}>{cull ? "✓ " : ""}GL_CULL_FACE</button>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] font-mono text-[var(--text-muted)] w-20">glCullFace</span>
            {(["BACK", "FRONT"] as Face[]).map(f => (
              <button key={f} className={btn(cullFace === f)} onClick={() => setCullFace(f)}>GL_{f}</button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] font-mono text-[var(--text-muted)] w-20">glFrontFace</span>
            {(["CCW", "CW"] as Order[]).map(o => (
              <button key={o} className={btn(frontFace === o)} onClick={() => setFrontFace(o)}>GL_{o}</button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <pre className="text-[10px] font-mono rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 overflow-x-auto leading-relaxed text-[var(--code-text)]">
{`${cull ? "glEnable(GL_CULL_FACE);" : "glDisable(GL_CULL_FACE);"}
glCullFace(GL_${cullFace});
glFrontFace(GL_${frontFace});`}
          </pre>
          <p className="text-[11.5px] text-[var(--text-muted)] leading-relaxed">
            {tx(t, "figWind_note",
              "The vertices never change — only where you look from. Past 90° the triangle shows its back, the on-screen order becomes clockwise, and with back-face culling it disappears. On a closed mesh those back faces are hidden anyway, so culling roughly halves the work.")}
          </p>
        </div>
      </div>
    </FigureShell>
  );
}
