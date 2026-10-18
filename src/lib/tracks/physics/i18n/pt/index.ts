// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import unitsMeasurement from "./units-measurement";
import kinematics1d from "./kinematics-1d";
import kinematics2d from "./kinematics-2d";
import relativeMotion from "./relative-motion";
import newtonsLaws from "./newtons-laws";
import forces from "./forces";
import circularMotion from "./circular-motion";
import workEnergy from "./work-energy";
import momentumCollisions from "./momentum-collisions";
import rotation from "./rotation";
import angularMomentum from "./angular-momentum";
import gravityOrbits from "./gravity-orbits";
import simpleHarmonic from "./simple-harmonic";
import dampingResonance from "./damping-resonance";
import waves from "./waves";
import sound from "./sound";

const bundle: LessonText = {
  strings: { ...unitsMeasurement, ...kinematics1d, ...kinematics2d, ...relativeMotion, ...newtonsLaws, ...forces, ...circularMotion, ...workEnergy, ...momentumCollisions, ...rotation, ...angularMomentum, ...gravityOrbits, ...simpleHarmonic, ...dampingResonance, ...waves, ...sound },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
