// PT text for this track, loaded on demand by src/lib/i18n/lessons.ts.

import type { LessonText } from "@/lib/i18n/lessons";
import track from "./_track";
import attention from "./attention";
import banditsMdps from "./bandits-mdps";
import backpropagation from "./backpropagation";
import cnn from "./cnn";
import data from "./data";
import decisionTrees from "./decision-trees";
import embeddings from "./embeddings";
import gameAi from "./game-ai";
import gameSearch from "./game-search";
import generalisation from "./generalisation";
import gradientDescent from "./gradient-descent";
import kMeans from "./k-means";
import kNearestNeighbours from "./k-nearest-neighbours";
import linearRegression from "./linear-regression";
import logisticRegression from "./logistic-regression";
import mcts from "./mcts";
import mlp from "./mlp";
import perceptron from "./perceptron";
import qLearning from "./q-learning";
import regularisation from "./regularisation";
import rnn from "./rnn";
import training from "./training";
import transformers from "./transformers";
import whatIsAi from "./what-is-ai";

const bundle: LessonText = {
  strings: {
    ...attention, ...backpropagation, ...cnn, ...data, ...decisionTrees, ...embeddings, ...generalisation, ...gradientDescent, ...kMeans,
    ...kNearestNeighbours, ...linearRegression, ...logisticRegression, ...mlp, ...perceptron,
    ...regularisation, ...rnn, ...training, ...transformers, ...whatIsAi,
    ...gameSearch, ...mcts, ...banditsMdps, ...qLearning, ...gameAi,
  },
  titles: track.titles,
  sections: track.sections,
};

export default bundle;
