// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import whatIsSound from "./what-is-sound";
import pitch from "./pitch";

const bundle: LessonText = {
  strings: { ...whatIsSound, ...pitch },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
