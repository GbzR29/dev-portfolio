// src/components/reference/diagrams/index.tsx
// Static drawings shown under "How it works" on a reference page. An entry
// names one with `diagram: "<id>"` (lib/reference/types.ts). Chrome uses theme
// tokens; data (attributes, colours, triangles) uses fixed colours that read
// in both themes. Labels come in EN + PT.

import type { ReactNode } from "react";
import type { Language } from "@/lib/i18n";
import { PrimitiveModesDiagram, VertexLayoutDiagram, ViewportDiagram, WindingDiagram } from "./geometry";
import { BlendDiagram, StencilDiagram } from "./fragments";
import { WrapModesDiagram } from "./wrap";

export type DiagramProps = { language: Language };

const DIAGRAMS: Record<string, (p: DiagramProps) => ReactNode> = {
  vertexLayout: VertexLayoutDiagram,
  primitiveModes: PrimitiveModesDiagram,
  winding: WindingDiagram,
  viewport: ViewportDiagram,
  blend: BlendDiagram,
  stencil: StencilDiagram,
  wrapModes: WrapModesDiagram,
};

export function ReferenceDiagram({ id, language }: { id: string; language: Language }) {
  const Draw = DIAGRAMS[id];
  return Draw ? <Draw language={language} /> : null;
}
