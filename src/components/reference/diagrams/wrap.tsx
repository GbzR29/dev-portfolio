// src/components/reference/diagrams/wrap.tsx
// The four texture wrap modes side by side: one small texture (a gradient
// with an arrow, so flips are visible) sampled from u = −1 to u = 2.

import { useId, type ReactNode } from "react";
import { C, DiagramFrame, pick, T } from "./frame";
import type { DiagramProps } from "./index";

const TILE = 130;
const X0 = 200;
const ROW = 64;
const H = 50;

export function WrapModesDiagram({ language }: DiagramProps) {
  const id = useId().replace(/:/g, "");
  const tile = (x: number, y: number, flip: boolean, key: string) => (
    <g key={key}>
      <rect x={x} y={y} width={TILE} height={H} fill={`url(#${id}${flip ? "r" : "f"})`} />
      <polygon
        points={flip
          ? `${x + 86},${y + 13} ${x + 86},${y + 37} ${x + 44},${y + 25}`
          : `${x + 44},${y + 13} ${x + 44},${y + 37} ${x + 86},${y + 25}`}
        fill="#fff" fillOpacity={0.9}
      />
    </g>
  );
  const solid = (x: number, y: number, fill: string, key: string) => <rect key={key} x={x} y={y} width={TILE} height={H} fill={fill} />;

  const rows: { name: string; parts: (y: number) => ReactNode[] }[] = [
    { name: "GL_REPEAT", parts: (y) => [tile(X0, y, false, "a"), tile(X0 + TILE, y, false, "b"), tile(X0 + 2 * TILE, y, false, "c")] },
    { name: "GL_MIRRORED_REPEAT", parts: (y) => [tile(X0, y, true, "a"), tile(X0 + TILE, y, false, "b"), tile(X0 + 2 * TILE, y, true, "c")] },
    { name: "GL_CLAMP_TO_EDGE", parts: (y) => [solid(X0, y, C.orange, "a"), tile(X0 + TILE, y, false, "b"), solid(X0 + 2 * TILE, y, C.blue, "c")] },
    { name: "GL_CLAMP_TO_BORDER", parts: (y) => [solid(X0, y, C.gray, "a"), tile(X0 + TILE, y, false, "b"), solid(X0 + 2 * TILE, y, C.gray, "c")] },
  ];

  return (
    <DiagramFrame
      caption={pick(language,
        "One texture sampled from u = −1 to u = 2; the middle tile (0 to 1) is the texture itself. REPEAT tiles it, MIRRORED_REPEAT flips every other copy, CLAMP_TO_EDGE stretches the edge pixels outward, CLAMP_TO_BORDER uses a fixed border colour (GL_TEXTURE_BORDER_COLOR).",
        "Uma textura lida de u = −1 a u = 2; o bloco do meio (0 a 1) é a própria textura. REPEAT a repete, MIRRORED_REPEAT espelha uma cópia sim, outra não, CLAMP_TO_EDGE estica os pixels da borda para fora, CLAMP_TO_BORDER usa uma cor de borda fixa (GL_TEXTURE_BORDER_COLOR).")}
      minWidth={560}
    >
      <svg viewBox="0 0 625 296" width="100%" role="img" aria-label="texture wrap modes">
        <defs>
          <linearGradient id={`${id}f`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={C.orange} /><stop offset="1" stopColor={C.blue} />
          </linearGradient>
          <linearGradient id={`${id}r`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={C.blue} /><stop offset="1" stopColor={C.orange} />
          </linearGradient>
        </defs>
        {[-1, 0, 1, 2].map((u, i) => (
          <text key={u} x={X0 + i * TILE} y={18} textAnchor="middle" style={T.small}>{`u = ${u}`}</text>
        ))}
        {rows.map((r, i) => {
          const y = 30 + i * ROW;
          return (
            <g key={r.name}>
              <text x={X0 - 14} y={y + H / 2 + 4} textAnchor="end" style={T.strong}>{r.name}</text>
              {r.parts(y)}
              <rect x={X0 + TILE} y={y} width={TILE} height={H} fill="none" stroke="var(--text-main)" strokeWidth={1.5} />
            </g>
          );
        })}
      </svg>
    </DiagramFrame>
  );
}
