// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import algebra from "./algebra";
import numbers from "./numbers";
import trig from "./trig";
import vectors from "./vectors";

const bundle: LessonText = {
  strings: { ...algebra, ...numbers, ...trig, ...vectors },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
