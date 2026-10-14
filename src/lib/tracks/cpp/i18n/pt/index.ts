// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import cBasics from "./c-basics";
import cMemory from "./c-memory";
import cPointers from "./c-pointers";
import cStringsStructs from "./c-strings-structs";
import concepts from "./concepts";
import concurrency from "./concurrency";
import constexpr from "./constexpr";
import cpp26 from "./cpp26";
import history from "./history";
import errors from "./errors";
import landscape from "./landscape";
import modules from "./modules";
import move from "./move";
import performance from "./performance";
import raii from "./raii";
import ranges from "./ranges";
import templates from "./templates";
import tooling from "./tooling";
import values from "./values";
import vocabulary from "./vocabulary";

const bundle: LessonText = {
  strings: { ...history, ...cBasics, ...cMemory, ...cPointers, ...cStringsStructs, ...concepts, ...concurrency, ...constexpr, ...cpp26, ...errors, ...landscape, ...modules, ...move, ...performance, ...raii, ...ranges, ...templates, ...tooling, ...values, ...vocabulary },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
