// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import functions from "./functions";
import linearSystems from "./linear-systems";
import quadratics from "./quadratics";
import exponents from "./exponents";
import sequences from "./sequences";
import trig from "./trig";
import unitCircle from "./unit-circle";
import triangleLaws from "./triangle-laws";
import identities from "./identities";
import polar from "./polar";
import waves from "./waves";
import vectors from "./vectors";
import markovChains from "./markov-chains";
import numberLine from "./number-line";
import orderOfOperations from "./order-of-operations";
import fractions from "./fractions";
import ratios from "./ratios";
import divisibility from "./divisibility";
import powers from "./powers";
import bases from "./bases";

const bundle: LessonText = {
  strings: { ...numberLine, ...orderOfOperations, ...fractions, ...ratios, ...divisibility, ...powers, ...bases, ...functions, ...linearSystems, ...quadratics, ...exponents, ...sequences, ...trig, ...unitCircle, ...triangleLaws, ...identities, ...polar, ...waves, ...vectors, ...markovChains },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
