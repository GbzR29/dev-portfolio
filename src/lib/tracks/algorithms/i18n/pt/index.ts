// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.
// Only titles and sections so far; lesson text falls back to English.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";

const bundle: LessonText = {
  strings: {},
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
