// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import unitsMeasurement from "./units-measurement";
import kinematics1d from "./kinematics-1d";
import kinematics2d from "./kinematics-2d";
import relativeMotion from "./relative-motion";

const bundle: LessonText = {
  strings: { ...unitsMeasurement, ...kinematics1d, ...kinematics2d, ...relativeMotion },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
