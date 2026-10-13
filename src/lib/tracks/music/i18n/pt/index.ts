// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import whatIsSound from "./what-is-sound";
import pitch from "./pitch";
import timbre from "./timbre";
import loudness from "./loudness";
import pulse from "./pulse";
import durations from "./durations";
import meter from "./meter";

const bundle: LessonText = {
  strings: { ...whatIsSound, ...pitch, ...timbre, ...loudness, ...pulse, ...durations, ...meter },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
