// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import audio from "./audio";
import gpu from "./gpu";
import input from "./input";
import mainLoop from "./main-loop";
import platform from "./platform";
import renderer from "./renderer";
import setup from "./setup";
import text from "./text";
import textures from "./textures";
import whatsNew from "./whats-new";

const bundle: LessonText = {
  strings: { ...audio, ...gpu, ...input, ...mainLoop, ...platform, ...renderer, ...setup, ...text, ...textures, ...whatsNew },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
