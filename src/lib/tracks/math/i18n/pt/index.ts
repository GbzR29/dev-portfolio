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
import unitCircle from "./unit-circle";
import triangleLaws from "./triangle-laws";
import identities from "./identities";
import polar from "./polar";
import waves from "./waves";
import vectors from "./vectors";

const bundle: LessonText = {
  strings: { ...functions, ...linearSystems, ...quadratics, ...exponents, ...sequences, ...numbers, ...trig, ...unitCircle, ...triangleLaws, ...identities, ...polar, ...waves, ...vectors },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
