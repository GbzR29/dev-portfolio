// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import advanced from "./advanced";
import clustered from "./clustered";
import color from "./color";
import csm from "./csm";
import decals from "./decals";
import dsa from "./dsa";
import ebo from "./ebo";
import gi from "./gi";
import legacy from "./legacy";
import lightingAdvanced from "./lighting-advanced";
import lightingBasics from "./lighting-basics";
import linearAlgebra from "./linear-algebra";
import models from "./models";
import oit from "./oit";
import particles from "./particles";
import pbr from "./pbr";
import performance from "./performance";
import picking from "./picking";
import pipeline from "./pipeline";
import post from "./post";
import reflections from "./reflections";
import setup from "./setup";
import shaderStages from "./shader-stages";
import shaders from "./shaders";
import skeletal from "./skeletal";
import stencil from "./stencil";
import temporal from "./temporal";
import terrain from "./terrain";
import text from "./text";
import texturecompression from "./texturecompression";
import textures from "./textures";
import tooling from "./tooling";
import transformations from "./transformations";
import transforms from "./transforms";
import triangle from "./triangle";
import vao from "./vao";
import vbo from "./vbo";
import volumetrics from "./volumetrics";
import winding from "./winding";

const bundle: LessonText = {
  strings: { ...advanced, ...clustered, ...color, ...csm, ...decals, ...dsa, ...ebo, ...gi, ...legacy, ...lightingAdvanced, ...lightingBasics, ...linearAlgebra, ...models, ...oit, ...particles, ...pbr, ...performance, ...picking, ...pipeline, ...post, ...reflections, ...setup, ...shaderStages, ...shaders, ...skeletal, ...stencil, ...temporal, ...terrain, ...text, ...texturecompression, ...textures, ...tooling, ...transformations, ...transforms, ...triangle, ...vao, ...vbo, ...volumetrics, ...winding },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
