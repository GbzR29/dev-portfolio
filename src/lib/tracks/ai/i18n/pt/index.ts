// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import data from "./data";
import gradientDescent from "./gradient-descent";
import linearRegression from "./linear-regression";
import whatIsAi from "./what-is-ai";

const bundle: LessonText = {
  strings: { ...data, ...gradientDescent, ...linearRegression, ...whatIsAi },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
