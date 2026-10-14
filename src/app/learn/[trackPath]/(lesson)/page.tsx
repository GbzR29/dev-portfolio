// app/learn/[trackPath]/(lesson)/page.tsx
// /learn/<track>: the track's own URL (shows its first chapter). Old lesson
// links, /learn/<track>?chapter=<id>, are sent to /learn/<track>/<id>.
// Shared with /pt/learn/<track> (src/lib/tracks/lessonRoutes.tsx).

import { TrackRoute, trackPageMetadata, type TrackProps } from "@/lib/tracks/lessonRoutes";

export const generateMetadata = (props: TrackProps) => trackPageMetadata(props, "en");

export default function TrackPage(props: TrackProps) {
  return TrackRoute(props, "en");
}
