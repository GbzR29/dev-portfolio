// app/pt/opengraph-image.tsx — the Home in Portuguese
// Link-preview image (see src/lib/og/card.tsx).

import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";
import { homeImage } from "@/lib/og/cards";

export const alt = "Gabriel Carvalho, programador C++ e computação gráfica";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return homeImage("pt");
}
