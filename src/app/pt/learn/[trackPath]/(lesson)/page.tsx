// app/pt/learn/[trackPath]/(lesson)/page.tsx
// /pt/learn/<track> (see app/learn/[trackPath]/(lesson)/page.tsx).

import { TrackRoute, trackPageMetadata, type TrackProps } from "@/lib/tracks/lessonRoutes";

export const generateMetadata = (props: TrackProps) => trackPageMetadata(props, "pt");

export default function PtTrackPage(props: TrackProps) {
  return TrackRoute(props, "pt");
}
