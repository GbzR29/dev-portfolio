// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import blackhole from "./blackhole";
import builtinVars from "./builtin-vars";
import builtins from "./builtins";
import effects from "./effects";
import fragcoord from "./fragcoord";
import noise from "./noise";
import ocean from "./ocean";
import playground from "./playground";
import pool from "./pool";
import raymarching from "./raymarching";
import river from "./river";
import raytracing from "./raytracing";
import sdf from "./sdf";
import shaderClass from "./shader-class";
import shapes from "./shapes";
import types from "./types";
import underwater from "./underwater";

const bundle: LessonText = {
  strings: { ...blackhole, ...builtinVars, ...builtins, ...effects, ...fragcoord, ...noise, ...ocean, ...playground, ...pool, ...raymarching, ...river, ...raytracing, ...sdf, ...shaderClass, ...shapes, ...types, ...underwater },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
