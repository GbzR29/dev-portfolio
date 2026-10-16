// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import backpropagation from "./backpropagation";
import data from "./data";
import decisionTrees from "./decision-trees";
import generalisation from "./generalisation";
import gradientDescent from "./gradient-descent";
import kMeans from "./k-means";
import kNearestNeighbours from "./k-nearest-neighbours";
import linearRegression from "./linear-regression";
import logisticRegression from "./logistic-regression";
import mlp from "./mlp";
import perceptron from "./perceptron";
import regularisation from "./regularisation";
import training from "./training";
import whatIsAi from "./what-is-ai";

const bundle: LessonText = {
  strings: {
    ...backpropagation, ...data, ...decisionTrees, ...generalisation, ...gradientDescent, ...kMeans,
    ...kNearestNeighbours, ...linearRegression, ...logisticRegression, ...mlp, ...perceptron,
    ...regularisation, ...training, ...whatIsAi,
  },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
