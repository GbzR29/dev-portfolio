// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import functions from "./functions";
import linearSystems from "./linear-systems";
import quadratics from "./quadratics";
import exponents from "./exponents";
import sequences from "./sequences";
import numbers from "./numbers";
import trig from "./trig";
import vectors from "./vectors";

const bundle: LessonText = {
  strings: { ...functions, ...linearSystems, ...quadratics, ...exponents, ...sequences, ...numbers, ...trig, ...vectors },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
