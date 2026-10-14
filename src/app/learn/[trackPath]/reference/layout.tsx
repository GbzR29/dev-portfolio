// app/learn/[trackPath]/reference/layout.tsx
// Metadata for the reference index (the pages are client components); each
// function page overrides it in [fn]/layout.tsx.

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { referenceMetadata } from "@/lib/reference/seo";
import { decodeSegment } from "@/lib/tracks/urls";

type Props = { params: Promise<{ trackPath: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return referenceMetadata(decodeSegment((await params).trackPath));
}

export default function ReferenceLayout({ children }: { children: ReactNode }) {
  return children;
}
