// app/pt/learn/[trackPath]/(lesson)/[chapterId]/page.tsx
// /pt/learn/<track>/<chapter id> (see app/learn/[trackPath]/(lesson)/[chapterId]/page.tsx).

import { ChapterRoute, chapterPageMetadata, type ChapterProps } from "@/lib/tracks/lessonRoutes";

export const generateMetadata = (props: ChapterProps) => chapterPageMetadata(props, "pt");

export default function PtChapterPage(props: ChapterProps) {
  return ChapterRoute(props, "pt");
}
