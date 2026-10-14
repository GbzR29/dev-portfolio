// app/learn/[trackPath]/(lesson)/layout.tsx
// The lesson reader stays mounted here while the URL moves between a track's
// chapters; the pages below only give each URL its metadata.

import type { ReactNode } from "react";
import LessonView from "./LessonView";

export default function LessonLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <LessonView />
      {children}
    </>
  );
}
