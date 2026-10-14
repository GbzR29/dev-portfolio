// app/learn/[trackPath]/reference/[fn]/opengraph-image.tsx — one function
// Link-preview image (see src/lib/og/card.tsx).

import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";
import { referenceImage } from "@/lib/og/cards";

export const alt = "Function reference preview";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ trackPath: string; fn: string }> }) {
  return referenceImage(await params);
}
