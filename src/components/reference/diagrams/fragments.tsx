// src/components/reference/diagrams/fragments.tsx
// Per-fragment drawings: the blend equation with real numbers, and the path a
// fragment takes through the stencil and depth tests.

import { C, DiagramFrame, pick, T, useArrow } from "./frame";
import type { DiagramProps } from "./index";

// ── Blending ──────────────────────────────────────────────────────────────────

const SRC = [220, 60, 60];
const DST = [50, 90, 200];
const ALPHA = 0.3;
const mix = SRC.map((s, i) => Math.round(s * ALPHA + DST[i] * (1 - ALPHA)));
const rgb = (c: number[]) => `rgb(${c.join(",")})`;

export function BlendDiagram({ language }: DiagramProps) {
  const sq = (x: number, fill: string, top: string, bottom: string) => (
    <g>
      <rect x={x} y={34} width={76} height={76} rx={8} fill={fill} />
      <text x={x + 38} y={130} textAnchor="middle" style={T.strong}>{top}</text>
      <text x={x + 38} y={146} textAnchor="middle" style={T.small}>{bottom}</text>
    </g>
  );
  const op = (x: number, s: string) => <text x={x} y={78} textAnchor="middle" style={{ ...T.strong, fontSize: 18 }}>{s}</text>;
  return (
    <DiagramFrame
      caption={pick(language,
        `Classic transparency, glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA): a fragment with alpha ${ALPHA} keeps ${ALPHA * 100}% of its own colour and ${(1 - ALPHA) * 100}% of what was already drawn. Channel by channel: ${SRC[0]} × ${ALPHA} + ${DST[0]} × ${1 - ALPHA} = ${mix[0]} for red.`,
        `Transparência clássica, glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA): um fragmento com alfa ${ALPHA} mantém ${ALPHA * 100}% da própria cor e ${(1 - ALPHA) * 100}% do que já estava desenhado. Canal por canal: ${SRC[0]} × ${ALPHA} + ${DST[0]} × ${1 - ALPHA} = ${mix[0]} no vermelho.`)}
    >
      <svg viewBox="0 0 620 170" width="100%" role="img" aria-label="blend equation">
        {sq(20, rgb(SRC), pick(language, "source", "origem"), pick(language, "shader output", "saída do shader"))}
        <text x={145} y={70} textAnchor="middle" style={T.strong}>× {ALPHA}</text>
        <text x={145} y={88} textAnchor="middle" style={T.small}>SRC_ALPHA</text>
        {op(205, "+")}
        {sq(228, rgb(DST), pick(language, "destination", "destino"), pick(language, "already drawn", "já desenhado"))}
        <text x={390} y={70} textAnchor="middle" style={T.strong}>× {1 - ALPHA}</text>
        <text x={390} y={88} textAnchor="middle" style={T.small}>ONE_MINUS_SRC_ALPHA</text>
        {op(482, "=")}
        {sq(515, rgb(mix), pick(language, "result", "resultado"), `(${mix.join(", ")})`)}
      </svg>
    </DiagramFrame>
  );
}

// ── Stencil and depth tests ───────────────────────────────────────────────────

function Box({ x, y, w, h, title, sub, tone }: { x: number; y: number; w: number; h: number; title: string; sub?: string; tone?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={tone ?? "var(--bg)"} fillOpacity={tone ? 0.12 : 1}
        stroke={tone ?? "var(--text-muted)"} />
      <text x={x + w / 2} y={sub ? y + h / 2 - 3 : y + h / 2 + 4} textAnchor="middle" style={T.strong}>{title}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 14} textAnchor="middle" style={T.small}>{sub}</text>}
    </g>
  );
}

export function StencilDiagram({ language }: DiagramProps) {
  const [defsP, arrowP] = useArrow(C.green);
  const [defsF, arrowF] = useArrow(C.red);
  const pass = pick(language, "pass", "passa");
  const fail = pick(language, "fail", "falha");
  const discarded = pick(language, "discarded", "descartado");
  return (
    <DiagramFrame
      caption={pick(language,
        "Every fragment meets the stencil test first, then the depth test. glStencilFunc sets the first test; glStencilOp chooses what is written into the stencil buffer at each of the three exits: sfail, dpfail and dppass. A discarded fragment draws nothing, but its stencil action still runs.",
        "Todo fragmento passa primeiro pelo stencil test e depois pelo depth test. glStencilFunc define o primeiro teste; glStencilOp escolhe o que é escrito no stencil buffer em cada uma das três saídas: sfail, dpfail e dppass. Um fragmento descartado não desenha nada, mas a ação de stencil dele roda mesmo assim.")}
      minWidth={580}
    >
      <svg viewBox="0 0 660 250" width="100%" role="img" aria-label="stencil and depth tests">
        {defsP}{defsF}
        <Box x={10} y={70} w={100} h={46} title={pick(language, "fragment", "fragmento")} />
        <Box x={150} y={58} w={200} h={70} title="stencil test" sub="(ref & mask) func (stored & mask)" />
        <Box x={400} y={70} w={110} h={46} title="depth test" />
        <Box x={550} y={64} w={100} h={58} title={pick(language, "drawn", "desenhado")} sub="dppass" tone={C.green} />
        <Box x={175} y={178} w={150} h={52} title={discarded} sub="sfail" tone={C.red} />
        <Box x={380} y={178} w={150} h={52} title={discarded} sub="dpfail" tone={C.red} />

        <line x1={112} y1={93} x2={146} y2={93} stroke="var(--text-muted)" strokeWidth={1.4} markerEnd={arrowP} />
        <line x1={352} y1={93} x2={396} y2={93} stroke={C.green} strokeWidth={1.6} markerEnd={arrowP} />
        <text x={374} y={84} textAnchor="middle" style={T.small}>{pass}</text>
        <line x1={512} y1={93} x2={546} y2={93} stroke={C.green} strokeWidth={1.6} markerEnd={arrowP} />
        <text x={529} y={84} textAnchor="middle" style={T.small}>{pass}</text>
        <line x1={250} y1={130} x2={250} y2={174} stroke={C.red} strokeWidth={1.6} markerEnd={arrowF} />
        <text x={258} y={156} style={T.small}>{fail}</text>
        <line x1={455} y1={118} x2={455} y2={174} stroke={C.red} strokeWidth={1.6} markerEnd={arrowF} />
        <text x={463} y={150} style={T.small}>{fail}</text>
        <text x={250} y={36} textAnchor="middle" style={T.label}>glStencilFunc</text>
        <text x={455} y={50} textAnchor="middle" style={T.label}>glDepthFunc</text>
        <text x={420} y={22} textAnchor="middle" style={T.label}>glStencilOp(sfail, dpfail, dppass)</text>
      </svg>
    </DiagramFrame>
  );
}
