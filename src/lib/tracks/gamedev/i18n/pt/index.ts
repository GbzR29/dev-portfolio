// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import collision from "./collision";
import collisionResponse from "./collision-response";
import integration from "./integration";
import loop from "./loop";
import motion from "./motion";
import patterns from "./patterns";
import platformer from "./platformer";
import procedural from "./procedural";
import rigidBody from "./rigid-body";

const bundle: LessonText = {
  strings: { ...collision, ...collisionResponse, ...integration, ...loop, ...motion, ...patterns, ...platformer, ...procedural, ...rigidBody },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
