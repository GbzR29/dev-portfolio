// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import builtins from "./builtins";
import effects from "./effects";
import fragcoord from "./fragcoord";
import noise from "./noise";
import playground from "./playground";
import raymarching from "./raymarching";
import raytracing from "./raytracing";
import sdf from "./sdf";
import shaderClass from "./shader-class";
import shapes from "./shapes";
import types from "./types";

const bundle: LessonText = {
  strings: { ...builtins, ...effects, ...fragcoord, ...noise, ...playground, ...raymarching, ...raytracing, ...sdf, ...shaderClass, ...shapes, ...types },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
