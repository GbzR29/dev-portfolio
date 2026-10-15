// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import firstProgram from "./first-program";
import movAddressing from "./mov-addressing";
import registers from "./registers";
import whatIsAssembly from "./what-is-assembly";

const bundle: LessonText = {
  strings: { ...whatIsAssembly, ...registers, ...firstProgram, ...movAddressing },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
