// app/pt/learn/[trackPath]/(lesson)/[chapterId]/opengraph-image.tsx — a lesson in Portuguese
// Link-preview image (see src/lib/og/card.tsx).

import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";
import { chapterImage } from "@/lib/og/cards";

export const alt = "Prévia da lição";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ trackPath: string; chapterId: string }> }) {
  return chapterImage(await params, "pt");
}
