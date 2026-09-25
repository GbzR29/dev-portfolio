// ES text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import ebo from "./ebo";
import pipeline from "./pipeline";
import shaders from "./shaders";
import textures from "./textures";
import transformations from "./transformations";
import triangle from "./triangle";
import vao from "./vao";
import vbo from "./vbo";

const bundle: LessonText = {
  strings: { ...ebo, ...pipeline, ...shaders, ...textures, ...transformations, ...triangle, ...vao, ...vbo },
  titles: {},
  sections: {},
};

export default bundle;
