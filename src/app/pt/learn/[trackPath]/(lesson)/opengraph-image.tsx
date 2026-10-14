// app/pt/learn/[trackPath]/(lesson)/opengraph-image.tsx — a track in Portuguese
// Link-preview image (see src/lib/og/card.tsx).

import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";
import { trackImage } from "@/lib/og/cards";

export const alt = "Prévia do curso";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ trackPath: string }> }) {
  return trackImage(await params, "pt");
}
