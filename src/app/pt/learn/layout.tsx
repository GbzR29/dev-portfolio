// app/pt/learn/layout.tsx
// Metadata for /pt/learn. Track and lesson pages set their own.

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { learnMetadata } from "@/lib/tracks/seo";

export const metadata: Metadata = learnMetadata("pt");

export default function PtLearnLayout({ children }: { children: ReactNode }) {
  return children;
}
