// ES text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import builtins from "./builtins";
import fragcoord from "./fragcoord";
import noise from "./noise";
import sdf from "./sdf";
import shaderClass from "./shader-class";
import types from "./types";

const bundle: LessonText = {
  strings: { ...builtins, ...fragcoord, ...noise, ...sdf, ...shaderClass, ...types },
  titles: {},
  sections: {},
};

export default bundle;
