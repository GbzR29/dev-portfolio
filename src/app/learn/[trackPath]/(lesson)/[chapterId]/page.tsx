// app/learn/[trackPath]/(lesson)/[chapterId]/page.tsx
// /learn/<track>/<chapter id>: one URL per lesson, with its own title,
// description and structured data. The lesson itself is drawn by LessonView
// in the layout. Shared with /pt/learn/… (src/lib/tracks/lessonRoutes.tsx).

import { ChapterRoute, chapterPageMetadata, type ChapterProps } from "@/lib/tracks/lessonRoutes";

export const generateMetadata = (props: ChapterProps) => chapterPageMetadata(props, "en");

export default function ChapterPage(props: ChapterProps) {
  return ChapterRoute(props, "en");
}
