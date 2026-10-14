// app/pt/learn/[trackPath]/(lesson)/layout.tsx
// The Portuguese lesson URLs use the same reader as /learn (see there).

import type { ReactNode } from "react";
import LessonView from "@/app/learn/[trackPath]/(lesson)/LessonView";

export default function PtLessonLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <LessonView />
      {children}
    </>
  );
}
