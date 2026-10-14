// src/components/reference/diagrams/geometry.tsx
// Vertex-side drawings: the bytes of an interleaved vertex buffer, the three
// triangle modes, winding order, and the viewport mapping.

import { C, DiagramFrame, pick, T, useArrow } from "./frame";
import type { DiagramProps } from "./index";

// ── Vertex buffer layout ──────────────────────────────────────────────────────

const CELL = 56;      // one float = 4 bytes
const X0 = 40;

export function VertexLayoutDiagram({ language }: DiagramProps) {
  const [defs, arrow] = useArrow("var(--text-muted)");
  const fields = ["x", "y", "z", "u", "v"];
  const cells = [0, 1].flatMap((v) => fields.map((f, i) => ({ v, f, i, x: X0 + (v * 5 + i) * CELL })));
  const span = (x1: number, x2: number, y: number, text: string) => (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke="var(--text-muted)" strokeWidth={1.2} markerStart={arrow} markerEnd={arrow} />
      <line x1={x1} y1={y - 6} x2={x1} y2={y + 6} stroke="var(--text-muted)" />
      <line x1={x2} y1={y - 6} x2={x2} y2={y + 6} stroke="var(--text-muted)" />
      <text x={(x1 + x2) / 2} y={y - 7} textAnchor="middle" style={T.strong}>{text}</text>
    </g>
  );
  return (
    <DiagramFrame
      caption={pick(language,
        "Two vertices of an interleaved buffer: position (3 floats) then texture coordinates (2 floats). Every attribute uses the same stride, 20 bytes from one vertex to the next; the offset says where inside a vertex the attribute starts.",
        "Dois vértices de um buffer intercalado: posição (3 floats) e depois coordenadas de textura (2 floats). Todo atributo usa o mesmo stride, 20 bytes de um vértice ao próximo; o offset diz onde, dentro de um vértice, o atributo começa.")}
    >
      <svg viewBox="0 0 640 200" width="100%" role="img" aria-label="vertex buffer layout">
        {defs}
        {[0, 1].map((v) => {
          const x1 = X0 + v * 5 * CELL, x2 = x1 + 5 * CELL;
          return (
            <g key={v}>
              <text x={(x1 + x2) / 2} y={24} textAnchor="middle" style={T.label}>{pick(language, `vertex ${v}`, `vértice ${v}`)}</text>
              <path d={`M${x1 + 2} 40 V33 H${x2 - 2} V40`} fill="none" stroke="var(--border-strong, var(--border))" />
            </g>
          );
        })}
        {cells.map((c) => {
          const col = c.i < 3 ? C.orange : C.blue;
          return (
            <g key={`${c.v}${c.f}`}>
              <rect x={c.x + 1} y={46} width={CELL - 2} height={34} rx={4} fill={col} fillOpacity={0.2} stroke={col} />
              <text x={c.x + CELL / 2} y={68} textAnchor="middle" style={T.strong}>{c.f}</text>
            </g>
          );
        })}
        {Array.from({ length: 11 }, (_, i) => (
          <text key={i} x={X0 + i * CELL} y={96} textAnchor="middle" style={T.small}>{i * 4}</text>
        ))}
        {span(X0, X0 + 5 * CELL, 124, "stride = 20")}
        {span(X0 + 5 * CELL, X0 + 8 * CELL, 124, "offset = 12")}
        {span(X0, X0 + 3 * CELL, 156, "offset = 0")}
        <rect x={40} y={176} width={12} height={12} rx={2} fill={C.orange} fillOpacity={0.35} stroke={C.orange} />
        <text x={58} y={186} style={T.label}>location 0: size 3, GL_FLOAT</text>
        <rect x={340} y={176} width={12} height={12} rx={2} fill={C.blue} fillOpacity={0.35} stroke={C.blue} />
        <text x={358} y={186} style={T.label}>location 1: size 2, GL_FLOAT</text>
      </svg>
    </DiagramFrame>
  );
}

// ── Triangle modes ────────────────────────────────────────────────────────────

type P = [number, number];

function Panel({ ox, title, pts, tris, note }: { ox: number; title: string; pts: P[]; tris: [number, number, number][]; note: string }) {
  return (
    <g transform={`translate(${ox} 0)`}>
      <text x={110} y={22} textAnchor="middle" style={T.strong}>{title}</text>
      {tris.map(([a, b, c], i) => (
        <polygon
          key={i}
          points={[pts[a], pts[b], pts[c]].map((p) => p.join(",")).join(" ")}
          fill={i % 2 ? C.blue : C.orange}
          fillOpacity={0.22}
          stroke={i % 2 ? C.blue : C.orange}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      ))}
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={4} fill="var(--text-main)" />
          <text x={x} y={y > 150 ? y + 17 : y - 9} textAnchor="middle" style={T.small}>{i}</text>
        </g>
      ))}
      <text x={110} y={224} textAnchor="middle" style={T.label}>{note}</text>
    </g>
  );
}

export function PrimitiveModesDiagram({ language }: DiagramProps) {
  const six = pick(language, "6 vertices", "6 vértices");
  const tri = (n: number) => pick(language, `${six} → ${n} triangles`, `${six} → ${n} triângulos`);
  return (
    <DiagramFrame
      caption={pick(language,
        "The same six vertices (0 to 5) in the three triangle modes. GL_TRIANGLES takes them three at a time; GL_TRIANGLE_STRIP makes a triangle from each new vertex and the two before it; GL_TRIANGLE_FAN joins every pair to vertex 0.",
        "Os mesmos seis vértices (0 a 5) nos três modos de triângulo. GL_TRIANGLES os pega de três em três; GL_TRIANGLE_STRIP forma um triângulo com cada vértice novo e os dois anteriores; GL_TRIANGLE_FAN liga cada par ao vértice 0.")}
      minWidth={560}
    >
      <svg viewBox="0 0 660 236" width="100%" role="img" aria-label="triangle modes">
        <Panel ox={0} title="GL_TRIANGLES" note={tri(2)}
          pts={[[25, 180], [95, 180], [60, 80], [125, 180], [195, 180], [160, 80]]}
          tris={[[0, 1, 2], [3, 4, 5]]} />
        <Panel ox={220} title="GL_TRIANGLE_STRIP" note={tri(4)}
          pts={[[20, 180], [50, 80], [85, 180], [115, 80], [150, 180], [180, 80]]}
          tris={[[0, 1, 2], [1, 2, 3], [2, 3, 4], [3, 4, 5]]} />
        <Panel ox={440} title="GL_TRIANGLE_FAN" note={tri(4)}
          pts={[[110, 185], [30, 150], [55, 80], [110, 55], [165, 80], [190, 150]]}
          tris={[[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 5]]} />
      </svg>
    </DiagramFrame>
  );
}

// ── Winding order ─────────────────────────────────────────────────────────────

function WoundTriangle({ pts, color, arrow, dashed }: { pts: P[]; color: string; arrow: string; dashed?: boolean }) {
  return (
    <g>
      <polygon points={pts.map((p) => p.join(",")).join(" ")} fill={color} fillOpacity={dashed ? 0.06 : 0.2}
        stroke={color} strokeWidth={1.2} strokeDasharray={dashed ? "5 4" : undefined} />
      {pts.map((p, i) => {
        const q = pts[(i + 1) % 3];
        const a: P = [p[0] + (q[0] - p[0]) * 0.18, p[1] + (q[1] - p[1]) * 0.18];
        const b: P = [p[0] + (q[0] - p[0]) * 0.78, p[1] + (q[1] - p[1]) * 0.78];
        return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth={2} markerEnd={arrow} />;
      })}
      {pts.map(([x, y], i) => (
        <g key={`v${i}`}>
          <circle cx={x} cy={y} r={4} fill="var(--text-main)" />
          <text x={x} y={y > 120 ? y + 18 : y - 10} textAnchor="middle" style={T.strong}>{i}</text>
        </g>
      ))}
    </g>
  );
}

export function WindingDiagram({ language }: DiagramProps) {
  const [defsG, arrowG] = useArrow(C.green);
  const [defsR, arrowR] = useArrow(C.red);
  return (
    <DiagramFrame
      caption={pick(language,
        "Winding is the order the vertices appear in on screen. With the default glFrontFace(GL_CCW), the counter-clockwise triangle faces the camera; the clockwise one shows its back, and glCullFace(GL_BACK) skips it. Turning a triangle around flips its winding, which is how culling knows.",
        "O winding é a ordem em que os vértices aparecem na tela. Com o padrão glFrontFace(GL_CCW), o triângulo anti-horário está de frente para a câmera; o horário mostra as costas, e glCullFace(GL_BACK) o pula. Virar um triângulo inverte o seu winding, e é assim que o culling sabe.")}
    >
      <svg viewBox="0 0 560 236" width="100%" role="img" aria-label="winding order">
        {defsG}{defsR}
        <WoundTriangle pts={[[70, 175], [210, 175], [140, 55]]} color={C.green} arrow={arrowG} />
        <WoundTriangle pts={[[350, 175], [420, 55], [490, 175]]} color={C.red} arrow={arrowR} dashed />
        <text x={140} y={218} textAnchor="middle" style={T.strong}>{pick(language, "counter-clockwise: front", "anti-horário: frente")}</text>
        <text x={420} y={218} textAnchor="middle" style={T.strong}>{pick(language, "clockwise: back, culled", "horário: costas, descartado")}</text>
      </svg>
    </DiagramFrame>
  );
}

// ── Viewport ──────────────────────────────────────────────────────────────────

export function ViewportDiagram({ language }: DiagramProps) {
  const [defs, arrow] = useArrow("var(--text-muted)");
  const ndc = (nx: number, ny: number): P => [40 + ((nx + 1) / 2) * 160, 50 + ((1 - ny) / 2) * 160];
  // window 280×190 with its origin at the bottom-left (330, 225); viewport x=40, y=20, w=180, h=120
  const vp = { x: 370, y: 205, w: 180, h: 120 };
  const win = (nx: number, ny: number): P => [vp.x + ((nx + 1) / 2) * vp.w, vp.y - ((ny + 1) / 2) * vp.h];
  const tri: [number, number][] = [[-0.5, -0.5], [0.5, -0.5], [0, 0.6]];
  return (
    <DiagramFrame
      caption={pick(language,
        "Left: after the vertex shader, everything visible lies in the square from −1 to 1 (normalized device coordinates). Right: glViewport(x, y, width, height) stretches that square onto a rectangle of the window, counted in pixels from the bottom-left corner: x_window = x + (x_ndc + 1) / 2 · width.",
        "Esquerda: depois do vertex shader, tudo o que é visível fica no quadrado de −1 a 1 (coordenadas normalizadas). Direita: glViewport(x, y, width, height) estica esse quadrado sobre um retângulo da janela, contado em pixels a partir do canto inferior esquerdo: x_janela = x + (x_ndc + 1) / 2 · width.")}
    >
      <svg viewBox="0 0 640 260" width="100%" role="img" aria-label="viewport mapping">
        {defs}
        <text x={120} y={30} textAnchor="middle" style={T.strong}>NDC</text>
        <rect x={40} y={50} width={160} height={160} fill="none" stroke="var(--text-muted)" />
        <line x1={120} y1={50} x2={120} y2={210} stroke="var(--border)" />
        <line x1={40} y1={130} x2={200} y2={130} stroke="var(--border)" />
        <text x={40} y={228} textAnchor="middle" style={T.small}>−1</text>
        <text x={200} y={228} textAnchor="middle" style={T.small}>1</text>
        <text x={30} y={214} textAnchor="end" style={T.small}>−1</text>
        <text x={30} y={54} textAnchor="end" style={T.small}>1</text>
        <polygon points={tri.map(([a, b]) => ndc(a, b).join(",")).join(" ")} fill={C.orange} fillOpacity={0.3} stroke={C.orange} strokeWidth={1.4} />

        <line x1={215} y1={130} x2={345} y2={140} stroke="var(--text-muted)" strokeWidth={1.2} markerEnd={arrow} />
        <text x={280} y={124} textAnchor="middle" style={T.label}>glViewport</text>

        <text x={470} y={22} textAnchor="middle" style={T.strong}>{pick(language, "window", "janela")}</text>
        <rect x={330} y={35} width={280} height={190} rx={4} fill="none" stroke="var(--text-muted)" />
        <rect x={vp.x} y={vp.y - vp.h} width={vp.w} height={vp.h} fill={C.blue} fillOpacity={0.08} stroke={C.blue} strokeDasharray="5 4" />
        <polygon points={tri.map(([a, b]) => win(a, b).join(",")).join(" ")} fill={C.orange} fillOpacity={0.3} stroke={C.orange} strokeWidth={1.4} />
        <circle cx={330} cy={225} r={3.5} fill="var(--text-main)" />
        <text x={330} y={244} textAnchor="middle" style={T.small}>(0, 0)</text>
        <circle cx={vp.x} cy={vp.y} r={3.5} fill={C.blue} />
        <text x={vp.x - 6} y={vp.y + 14} textAnchor="end" style={T.small}>(x, y)</text>
        <text x={vp.x + vp.w / 2} y={vp.y + 15} textAnchor="middle" style={T.small}>width</text>
        <text x={vp.x + vp.w + 6} y={vp.y - vp.h / 2 + 4} style={T.small}>height</text>
      </svg>
    </DiagramFrame>
  );
}
