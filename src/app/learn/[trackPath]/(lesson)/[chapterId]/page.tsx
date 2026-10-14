// app/learn/[trackPath]/(lesson)/[chapterId]/page.tsx
// /learn/<track>/<chapter id>: one URL per lesson, with its own title and
// description. The lesson itself is drawn by LessonView in the layout.

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTrack } from "@/lib/tracks";
import { chapterMetadata, findChapter } from "@/lib/tracks/seo";
import { decodeSegment } from "@/lib/tracks/urls";

type Props = { params: Promise<{ trackPath: string; chapterId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { trackPath, chapterId } = await params;
  return chapterMetadata(decodeSegment(trackPath), decodeSegment(chapterId));
}

export default async function ChapterPage({ params }: Props) {
  const { trackPath, chapterId } = await params;
  const track = getTrack(decodeSegment(trackPath));
  if (!track) redirect("/status?type=development&from=learn");
  if (!findChapter(track, decodeSegment(chapterId))) notFound();
  return null;
}
