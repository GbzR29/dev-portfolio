// app/learn/[trackPath]/(lesson)/page.tsx
// /learn/<track>: the track's own URL (shows its first chapter). Old lesson
// links, /learn/<track>?chapter=<id>, are sent to /learn/<track>/<id>.

import type { Metadata } from "next";
import { permanentRedirect, redirect } from "next/navigation";
import { getTrack } from "@/lib/tracks";
import { findChapter, trackMetadata } from "@/lib/tracks/seo";
import { chapterHref, decodeSegment } from "@/lib/tracks/urls";

type Props = {
  params: Promise<{ trackPath: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return trackMetadata(decodeSegment((await params).trackPath));
}

export default async function TrackPage({ params, searchParams }: Props) {
  const trackPath = decodeSegment((await params).trackPath);
  const track = getTrack(trackPath);
  if (!track) redirect("/status?type=development&from=learn");

  const { chapter, step } = await searchParams;
  if (typeof chapter === "string" && findChapter(track, chapter)) {
    const query = typeof step === "string" ? `?step=${encodeURIComponent(step)}` : "";
    permanentRedirect(chapterHref(trackPath, chapter) + query);
  }
  return null;
}
