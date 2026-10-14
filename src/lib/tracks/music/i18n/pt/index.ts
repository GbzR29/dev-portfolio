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
import syncopation from "./syncopation";
import noteNames from "./note-names";
import staff from "./staff";
import accidentals from "./accidentals";
import temperament from "./temperament";
import intervals from "./intervals";
import majorScale from "./major-scale";

const bundle: LessonText = {
  strings: { ...whatIsSound, ...pitch, ...timbre, ...loudness, ...pulse, ...durations, ...meter, ...syncopation, ...noteNames, ...staff, ...accidentals, ...temperament, ...intervals, ...majorScale },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
