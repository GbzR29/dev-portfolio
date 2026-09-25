// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import collision from "./collision";
import loop from "./loop";
import motion from "./motion";
import patterns from "./patterns";
import procedural from "./procedural";

const bundle: LessonText = {
  strings: { ...collision, ...loop, ...motion, ...patterns, ...procedural },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
