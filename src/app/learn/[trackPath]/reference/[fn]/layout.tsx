// app/learn/[trackPath]/reference/[fn]/layout.tsx
// Metadata for one function's page ("glDrawArrays — OpenGL reference").

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { functionMetadata } from "@/lib/reference/seo";
import { decodeSegment } from "@/lib/tracks/urls";

type Props = { params: Promise<{ trackPath: string; fn: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { trackPath, fn } = await params;
  return functionMetadata(decodeSegment(trackPath), decodeSegment(fn));
}

export default function FunctionLayout({ children }: { children: ReactNode }) {
  return children;
}
