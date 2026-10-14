// app/learn/opengraph-image.tsx — /learn
// Link-preview image (see src/lib/og/card.tsx).

import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";
import { learnImage } from "@/lib/og/cards";

export const alt = "Free interactive courses on gabrielfrc.dev";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return learnImage("en");
}
