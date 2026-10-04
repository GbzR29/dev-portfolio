// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import data from "./data";
import decisionTrees from "./decision-trees";
import generalisation from "./generalisation";
import gradientDescent from "./gradient-descent";
import kMeans from "./k-means";
import kNearestNeighbours from "./k-nearest-neighbours";
import linearRegression from "./linear-regression";
import logisticRegression from "./logistic-regression";
import perceptron from "./perceptron";
import whatIsAi from "./what-is-ai";

const bundle: LessonText = {
  strings: {
    ...data, ...decisionTrees, ...generalisation, ...gradientDescent, ...kMeans,
    ...kNearestNeighbours, ...linearRegression, ...logisticRegression, ...perceptron, ...whatIsAi,
  },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
