// app/learn/layout.tsx
// Metadata for /learn (the page itself is a client component). Every page
// below sets its own title, description and canonical URL.

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { learnMetadata } from "@/lib/tracks/seo";

export const metadata: Metadata = learnMetadata("en");

export default function LearnLayout({ children }: { children: ReactNode }) {
  return children;
}
