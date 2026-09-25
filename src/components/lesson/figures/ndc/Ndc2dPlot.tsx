// src/components/lesson/figures/ndc/Ndc2dPlot.tsx
// The SVG contents of the NDC 2D widget: grid, ±1 box, labels, polygon, winding, vertices, gizmo.
// Pure presentation — the parent <svg> owns the pointer and keyboard handling.
"use client";

import {
  SZ, HALF, GIZMO_IN, GIZMO_OUT, AXIS_COLOR, AXIS_NAME, AXIS_SCREEN, PALETTES,
  n2s, s2n, colorFor, type Pt, type Axis,
} from "./ndc2dScene";

export function Ndc2dPlot({ verts, zoom, pan, selected, hover, dragAxis, theme }: {
  verts: Pt[];
  zoom: number;
  pan: Pt;
  selected: number | null;
  hover: { vertex: number | null; axis: Axis | null };
  dragAxis: Axis | null;
  theme: keyof typeof PALETTES;
}) {
  const C = PALETTES[theme];

  const h    = HALF * zoom;
  const boxX = n2s(-1, "x", zoom, pan);
  const boxY = n2s( 1, "y", zoom, pan);
  const axisY = n2s(0, "y", zoom, pan);   // screen Y where the X axis lies
  const axisX = n2s(0, "x", zoom, pan);   // screen X where the Y axis lies

  const polygonPts = verts
    .map(v => `${n2s(v.x, "x", zoom, pan)},${n2s(v.y, "y", zoom, pan)}`)
    .join(" ");

  // Shoelace signed area — works for any vertex count, not just triangles.
  const signedArea = verts.reduce((sum, v, i) => {
    const w = verts[(i + 1) % verts.length];
    return sum + (v.x * w.y - w.x * v.y);
  }, 0) / 2;
  const isCCW = signedArea > 0;

  const centroid = {
    x: verts.reduce((s, v) => s + n2s(v.x, "x", zoom, pan), 0) / verts.length,
    y: verts.reduce((s, v) => s + n2s(v.y, "y", zoom, pan), 0) / verts.length,
  };

  // Grid lines, adapted to zoom and covering the panned viewport
  const step  = zoom < 0.6 ? 1 : zoom > 3 ? 0.1 : 0.5;
  const xFrom = s2n(0, "x", zoom, pan),  xTo = s2n(SZ, "x", zoom, pan);
  const yFrom = s2n(SZ, "y", zoom, pan), yTo = s2n(0, "y", zoom, pan);
  const gridX: number[] = [];
  const gridY: number[] = [];
  for (let v = Math.floor(xFrom / step) * step; v <= xTo + 1e-9; v += step)
    gridX.push(parseFloat(v.toFixed(4)));
  for (let v = Math.floor(yFrom / step) * step; v <= yTo + 1e-9; v += step)
    gridY.push(parseFloat(v.toFixed(4)));

  // Gizmo anchor (screen position of the selected vertex)
  const gizmoO = selected !== null && selected < verts.length
    ? { x: n2s(verts[selected].x, "x", zoom, pan), y: n2s(verts[selected].y, "y", zoom, pan) }
    : null;

  const gridStroke = (v: number) =>
    Math.abs(v) < 1e-6 ? C.gridZero : Math.abs(Math.abs(v) - 1) < 1e-6 ? C.gridOne : C.gridSub;

  return (
    <>
      {/* Grid */}
      {gridX.map(v => {
        const sx = n2s(v, "x", zoom, pan);
        if (sx < 0 || sx > SZ) return null;
        return <line key={`x${v}`} x1={sx} y1={0} x2={sx} y2={SZ}
          stroke={gridStroke(v)} strokeWidth={Math.abs(v) < 1e-6 ? 1 : 0.75} />;
      })}
      {gridY.map(v => {
        const sy = n2s(v, "y", zoom, pan);
        if (sy < 0 || sy > SZ) return null;
        return <line key={`y${v}`} x1={0} y1={sy} x2={SZ} y2={sy}
          stroke={gridStroke(v)} strokeWidth={Math.abs(v) < 1e-6 ? 1 : 0.75} />;
      })}

      {/* NDC ±1 boundary */}
      <rect x={boxX} y={boxY} width={h * 2} height={h * 2}
        fill="none" stroke={C.bounds} strokeWidth="1.2" strokeDasharray="5 3" />

      {/* Axis tick labels */}
      {[1, -1, 0.5, -0.5].map(v => {
        const sx = n2s(v, "x", zoom, pan);
        const sy = n2s(v, "y", zoom, pan);
        return (
          <g key={`lbl-${v}`}>
            {sx > 8 && sx < SZ - 8 && axisY > 12 && axisY < SZ && (
              <text x={sx} y={axisY - 5} fill={C.tick} fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                {v % 1 === 0 ? v : v.toFixed(1)}
              </text>
            )}
            {sy > 10 && sy < SZ - 2 && axisX > 0 && axisX < SZ - 16 && (
              <text x={axisX + 5} y={sy + 3} fill={C.tick} fontSize="7.5" fontFamily="monospace">
                {v % 1 === 0 ? v : v.toFixed(1)}
              </text>
            )}
          </g>
        );
      })}

      {/* Axis letters, pinned inside the viewport */}
      <text x={SZ - 8} y={Math.max(14, Math.min(SZ - 4, axisY - 6))}
        fill={C.axis} fontSize="9" fontFamily="monospace" textAnchor="end">X</text>
      <text x={Math.max(6, Math.min(SZ - 14, axisX + 5))} y={11}
        fill={C.axis} fontSize="9" fontFamily="monospace">Y</text>

      {/* Filled polygon */}
      {verts.length >= 3 && (
        <polygon points={polygonPts} fill={C.fill} stroke={C.stroke} strokeWidth="1.5" />
      )}

      {/* Winding indicator */}
      <text x={centroid.x} y={centroid.y + 4}
        fill={isCCW ? "rgba(34,197,94,0.85)" : "rgba(239,68,68,0.85)"}
        fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
        {isCCW ? "CCW ✓" : "CW ✗"}
      </text>

      {/* Vertices */}
      {verts.map((v, i) => {
        const sx = n2s(v.x, "x", zoom, pan);
        const sy = n2s(v.y, "y", zoom, pan);
        const color    = colorFor(i);
        const inBounds = Math.abs(v.x) <= 1.0001 && Math.abs(v.y) <= 1.0001;
        const isActive = selected === i || hover.vertex === i;
        return (
          <g key={i}>
            {isActive && (
              <circle cx={sx} cy={sy} r={12} fill="none" stroke={C.halo}
                strokeWidth="1" strokeDasharray="2 2" opacity={0.7} />
            )}
            <circle cx={sx} cy={sy} r={10} fill={color} fillOpacity={isActive ? 0.22 : 0.12} />
            <circle cx={sx} cy={sy} r={isActive ? 6.5 : 5.5}
              fill={inBounds ? color : "#ef4444"}
              fillOpacity={0.92}
              stroke={C.ring}
              strokeWidth="1.5"
              strokeDasharray={inBounds ? "none" : "3 2"} />
            <text x={sx + 10} y={sy - 7} fill={inBounds ? color : "#ef4444"}
              fontSize="9" fontFamily="monospace" fontWeight="bold">
              v{i}
            </text>
          </g>
        );
      })}

      {/* Gizmo on the selected vertex: drag an arm to move along one axis */}
      {gizmoO && (
        <g>
          {/* Guide line along the axis being dragged */}
          {dragAxis === 0 && (
            <line x1={0} y1={gizmoO.y} x2={SZ} y2={gizmoO.y}
              stroke={AXIS_COLOR[0]} strokeOpacity={0.35} strokeWidth="1" strokeDasharray="4 3" />
          )}
          {dragAxis === 1 && (
            <line x1={gizmoO.x} y1={0} x2={gizmoO.x} y2={SZ}
              stroke={AXIS_COLOR[1]} strokeOpacity={0.35} strokeWidth="1" strokeDasharray="4 3" />
          )}
          {([0, 1] as Axis[]).map(a => {
            const d = AXIS_SCREEN[a];
            const active = hover.axis === a || dragAxis === a;
            const x1 = gizmoO.x + d.x * GIZMO_IN,  y1 = gizmoO.y + d.y * GIZMO_IN;
            const x2 = gizmoO.x + d.x * GIZMO_OUT, y2 = gizmoO.y + d.y * GIZMO_OUT;
            const size = active ? 7 : 5.5;
            // Arrow head: tip, then the two base corners
            const head = [
              `${x2 + d.x * size},${y2 + d.y * size}`,
              `${x2 - d.y * size * 0.55},${y2 + d.x * size * 0.55}`,
              `${x2 + d.y * size * 0.55},${y2 - d.x * size * 0.55}`,
            ].join(" ");
            return (
              <g key={a}>
                <line x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={AXIS_COLOR[a]} strokeWidth={active ? 3.2 : 2} strokeLinecap="round" />
                <polygon points={head} fill={AXIS_COLOR[a]} />
                <text
                  x={a === 0 ? x2 + size + 3 : x2 + 5}
                  y={a === 0 ? y2 + 3 : y2 - size + 2}
                  fill={AXIS_COLOR[a]} fontSize="8" fontFamily="monospace" fontWeight="bold">
                  {AXIS_NAME[a]}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </>
  );
}
