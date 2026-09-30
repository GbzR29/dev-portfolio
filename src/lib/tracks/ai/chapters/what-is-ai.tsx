"use client";

// Foundations 1: what AI is — rules written by hand versus behaviour learned
// from data; the map of the field (AiMap figure); the four ingredients of
// machine learning (data, model, loss, optimiser); supervised, unsupervised
// and reinforcement learning; a first model, the delivery line, with its
// loss worked by hand and fitted by the reader (FitByHand figure); the
// whole idea in a short C++ program; generalisation; how the track is built;
// mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { AiMapFigure } from "@/components/lesson/figures/ai/AiMapFigure";
import { FitByHandFigure } from "@/components/lesson/figures/ai/FitByHandFigure";

const r = String.raw;

export function WhatIsAiContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiIntro_intro",
          "Artificial intelligence is the part of computing that builds programs which make decisions we would call intelligent: recognising what is in a picture, predicting how long a delivery will take, choosing the next move in a game, answering a question. This track builds those programs from nothing, in plain C++, without libraries: every matrix, every derivative, every training loop is written by hand, so that nothing is magic. This first chapter sets out what the field is, what \"learning\" means precisely, and the four ingredients every learning program has.")}
      </Lead>

      <H2>{tx(t, "aiIntro_rulesTitle", "Two ways to make a program decide")}</H2>
      <p>
        {tx(t, "aiIntro_rulesBody",
          "Suppose a pizzeria wants its app to show an estimated delivery time. The first way is to write the rule yourself: \"10 minutes to prepare, plus 3 minutes per kilometre\". That is a program like any other; it is exactly as good as the person who chose 10 and 3. The second way is to collect past deliveries (distance and real time) and let an algorithm choose the numbers that fit them best. The program still has the form time = w · distance + b, but w and b are no longer typed in by a person; they are learned from the data. That second way is machine learning.")}
      </p>
      <LessonTable
        headers={[tx(t, "aiIntro_tAspect", "Aspect"), tx(t, "aiIntro_tRules", "Hand-written rules"), tx(t, "aiIntro_tLearned", "Learned from data")]}
        rows={[
          [tx(t, "aiIntro_a1", "who chooses the numbers"), tx(t, "aiIntro_a1r", "a person"), tx(t, "aiIntro_a1l", "an optimisation algorithm, from examples")],
          [tx(t, "aiIntro_a2", "needs"), tx(t, "aiIntro_a2r", "someone who understands the problem well enough to write it down"), tx(t, "aiIntro_a2l", "enough examples of the right behaviour")],
          [tx(t, "aiIntro_a3", "good for"), tx(t, "aiIntro_a3r", "clear logic: game rules, a door that opens with a key"), tx(t, "aiIntro_a3l", "patterns too fuzzy to write down: faces, speech, spam, player behaviour")],
          [tx(t, "aiIntro_a4", "when it is wrong"), tx(t, "aiIntro_a4r", "you can read the rule and fix it"), tx(t, "aiIntro_a4l", "you fix the data, the model or the training, and learn again")],
        ]}
      />
      <p>
        {tx(t, "aiIntro_mapBody",
          "Machine learning is the largest part of AI today, but not all of it. Search algorithms such as A* and minimax make intelligent decisions with no training at all, by exploring possible futures. And inside machine learning, deep learning, the family of neural networks that powers image recognition and language models, is one kind of model among several.")}
      </p>
      <AiMapFigure t={t} />

      <H2>{tx(t, "aiIntro_ingTitle", "The four ingredients of learning")}</H2>
      <p>
        {tx(t, "aiIntro_ingBody",
          "Every machine-learning program in this track, from the two-number delivery line to a language model with billions of numbers, is built from the same four parts:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiIntro_tPart", "Ingredient"), tx(t, "aiIntro_tWhat", "What it is"), tx(t, "aiIntro_tDelivery", "In the delivery example")]}
        rows={[
          [tx(t, "aiIntro_i1", "data"), tx(t, "aiIntro_i1w", "examples of inputs, usually with the desired output"), tx(t, "aiIntro_i1d", "five past deliveries: (1 km, 12 min), (2, 15), (3, 20), (4, 22), (5, 26)")],
          [tx(t, "aiIntro_i2", "model"), tx(t, "aiIntro_i2w", "a function from input to output with adjustable numbers inside, the parameters"), tx(t, "aiIntro_i2d", "ŷ = w · x + b, with parameters w and b")],
          [tx(t, "aiIntro_i3", "loss"), tx(t, "aiIntro_i3w", "one number that says how wrong the model is on the data; smaller is better"), tx(t, "aiIntro_i3d", "the mean of the squared errors (MSE)")],
          [tx(t, "aiIntro_i4", "optimiser"), tx(t, "aiIntro_i4w", "an algorithm that changes the parameters to make the loss smaller"), tx(t, "aiIntro_i4d", "gradient descent (chapter 4), or here, you with the mouse")],
        ]}
      />
      <p>
        {tx(t, "aiIntro_learnDef",
          "With these four words, \"learning\" gets a precise meaning: finding the parameter values that make the loss on the data as small as possible. Nothing more mysterious happens in any model; what changes from chapter to chapter is how rich the model is and how clever the optimiser has to be.")}
      </p>

      <H2>{tx(t, "aiIntro_kindsTitle", "Three kinds of learning")}</H2>
      <LessonTable
        headers={[tx(t, "aiIntro_tKind", "Kind"), tx(t, "aiIntro_tData", "What the data looks like"), tx(t, "aiIntro_tGoal", "Goal"), tx(t, "aiIntro_tEx", "Example")]}
        rows={[
          [tx(t, "aiIntro_k1", "supervised: regression"), tx(t, "aiIntro_k1d", "inputs with a numeric answer"), tx(t, "aiIntro_k1g", "predict a number"), tx(t, "aiIntro_k1e", "distance → minutes; area → price")],
          [tx(t, "aiIntro_k2", "supervised: classification"), tx(t, "aiIntro_k2d", "inputs with a category as answer"), tx(t, "aiIntro_k2g", "predict a category"), tx(t, "aiIntro_k2e", "an email → spam or not; pixels → which digit")],
          [tx(t, "aiIntro_k3", "unsupervised"), tx(t, "aiIntro_k3d", "inputs only, no answers"), tx(t, "aiIntro_k3g", "find structure: groups, directions, a compact code"), tx(t, "aiIntro_k3e", "grouping players by how they play")],
          [tx(t, "aiIntro_k4", "reinforcement"), tx(t, "aiIntro_k4d", "no fixed dataset: the agent acts and receives rewards"), tx(t, "aiIntro_k4g", "a policy (what to do in each situation) that collects the most reward"), tx(t, "aiIntro_k4e", "an agent learning to win a game by playing it")],
        ]}
      />
      <p>
        {tx(t, "aiIntro_kindsBody",
          "Supervised learning is the easiest to understand, because every example says what the right answer was, and the loss is simply how far the model's answers are from those. That is where the track starts.")}
      </p>

      <H2>{tx(t, "aiIntro_firstTitle", "A first model, by hand")}</H2>
      <p>
        {tx(t, "aiIntro_firstBody",
          "The model for the deliveries is a straight line. x is the distance, ŷ (\"y hat\") is the model's prediction, and y is the real time. The loss compares predictions with real times:")}
      </p>
      <Equation label={tx(t, "aiIntro_eqModel", "The delivery model and its loss")}
        where={[
          [r`x_i,\ y_i`, tx(t, "aiIntro_wXy", "distance and real time of delivery i; there are n = 5 of them")],
          [r`w,\ b`, tx(t, "aiIntro_wWb", "the parameters: minutes per km (the slope) and minutes at 0 km (the intercept)")],
          [r`\hat y_i`, tx(t, "aiIntro_wYhat", "the model's prediction for delivery i")],
          [r`\hat y_i - y_i`, tx(t, "aiIntro_wErr", "the error on delivery i: positive when the model says too long, negative when too short")],
          [r`L`, tx(t, "aiIntro_wL", "the loss: the mean of the squared errors, in minutes²")],
        ]}>
        {r`\hat y_i = w\,x_i + b, \qquad L(w, b) = \frac{1}{n}\sum_{i=1}^{n} \left(\hat y_i - y_i\right)^2`}
      </Equation>
      <p>
        {tx(t, "aiIntro_whySquare",
          "Squaring does two jobs: an error of −2 and one of +2 count the same (they would cancel if simply added), and one error of 4 minutes costs as much as sixteen errors of 1 minute, so the loss cares most about the worst predictions. The Linear Regression chapter looks at this choice more closely.")}
      </p>
      <H3>{tx(t, "aiIntro_workedTitle", "Worked example: the loss of a guess")}</H3>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiIntro_w1", "Guess w = 4 and b = 8: \"8 minutes, plus 4 per km\".")}</li>
        <li>{tx(t, "aiIntro_w2", "Predictions for 1 to 5 km: 12, 16, 20, 24, 28 minutes.")}</li>
        <li>{tx(t, "aiIntro_w3", "Errors against the real 12, 15, 20, 22, 26: 0, +1, 0, +2, +2.")}</li>
        <li>{tx(t, "aiIntro_w4", "Squares: 0, 1, 0, 4, 4. Their sum is 9, and the mean over 5 deliveries is L = 1.8.")}</li>
        <li>{tx(t, "aiIntro_w5", "The best possible line, w = 3.5 and b = 8.5, has errors 0, +0.5, −1, +0.5, 0, squares 0, 0.25, 1, 0.25, 0, and L = 1.5 / 5 = 0.3. No line does better, and none reaches 0: the points are not exactly on a line.")}</li>
      </ol>
      <FitByHandFigure t={t} />
      <p>
        {tx(t, "aiIntro_youBody",
          "Moving the handles, you did what an optimiser does: you changed the parameters, watched the loss, and kept the changes that made it smaller. You could do it because there are two parameters and you can see the picture. A neural network has millions and no picture, so the optimiser must work from the numbers alone. Chapter 4 shows how: the derivative of the loss says in which direction to move each parameter.")}
      </p>

      <H2>{tx(t, "aiIntro_codeTitle", "The whole idea in C++")}</H2>
      <p>
        {tx(t, "aiIntro_codeBody",
          "The model and the loss are a few lines. Every later chapter grows this program; nothing is hidden in a library.")}
      </p>
      <CodeBlock lang="cpp" filename="delivery.cpp" t={t}>{`#include <cstdio>
#include <vector>

struct Example { double x, y; };             // one delivery: distance (km), real time (min)

double predict(double w, double b, double x) {
    return w * x + b;                        // the model: a straight line
}

double mse(const std::vector<Example>& data, double w, double b) {
    double sum = 0.0;
    for (const Example& e : data) {
        const double err = predict(w, b, e.x) - e.y;   // prediction − truth
        sum += err * err;                              // squared
    }
    return sum / data.size();                          // mean
}

int main() {
    const std::vector<Example> data = {{1, 12}, {2, 15}, {3, 20}, {4, 22}, {5, 26}};
    std::printf("guess  w=4.0 b=8.0 : L = %.2f\\n", mse(data, 4.0, 8.0));   // 1.80
    std::printf("best   w=3.5 b=8.5 : L = %.2f\\n", mse(data, 3.5, 8.5));   // 0.30
    std::printf("6 km  -> %.1f min\\n", predict(3.5, 8.5, 6.0));            // 29.5
}`}</CodeBlock>

      <H2>{tx(t, "aiIntro_genTitle", "The real goal: new data")}</H2>
      <p>
        {tx(t, "aiIntro_genBody",
          "A small loss on the five past deliveries is not the goal; the goal is good predictions for the next customer, whose delivery is not in the data. A model that does well on examples it has never seen generalises. It is easy to get a loss of zero on the training data: a program that stores the five deliveries in a table and looks them up is perfect on them and useless for a 6 km order. So every serious experiment keeps some examples aside, never used for training, and measures the loss on those. The Data chapter sets up that split; the Classic Machine Learning section studies what happens when a model memorises instead of generalising (overfitting).")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "aiIntro_mathNote", "The track leans on the Math track: vectors and dot products, derivatives and the chain rule, partial derivatives and gradients, matrices, and probability. Each chapter says which part it uses; if a symbol is new to you, the Math track has a chapter on it.")}
      </Callout>

      <H2>{tx(t, "aiIntro_planTitle", "How this track is built")}</H2>
      <LessonTable
        headers={[tx(t, "aiIntro_tSection", "Section"), tx(t, "aiIntro_tCovers", "What it covers")]}
        rows={[
          [tx(t, "aiIntro_p1", "Foundations"), tx(t, "aiIntro_p1c", "what learning is, data and features, linear regression, gradient descent")],
          [tx(t, "aiIntro_p2", "Classic Machine Learning"), tx(t, "aiIntro_p2c", "logistic regression, overfitting and validation, k-nearest neighbours, decision trees, k-means")],
          [tx(t, "aiIntro_p3", "Neural Networks"), tx(t, "aiIntro_p3c", "the perceptron, multi-layer networks, backpropagation, optimisers and training, regularisation")],
          [tx(t, "aiIntro_p4", "Deep Learning"), tx(t, "aiIntro_p4c", "convolutional networks, embeddings, recurrent networks, attention and transformers, how language models work")],
          [tx(t, "aiIntro_p5", "Reinforcement Learning & Game AI"), tx(t, "aiIntro_p5c", "minimax and Monte Carlo tree search, bandits and MDPs, Q-learning, AI in games")],
        ]}
      />

      <H2>{tx(t, "aiIntro_mistakesTitle", "Common misconceptions")}</H2>
      <LessonTable
        headers={[tx(t, "aiIntro_tMyth", "Misconception"), tx(t, "aiIntro_tFact", "What is actually true")]}
        rows={[
          [tx(t, "aiIntro_e1", "AI means neural networks"), tx(t, "aiIntro_e1b", "neural networks are one kind of model; rules, search, trees and linear models are AI too, and often the better choice.")],
          [tx(t, "aiIntro_e2", "A model that fits its training data is good"), tx(t, "aiIntro_e2b", "only performance on data it has not seen counts; a lookup table fits its training data perfectly.")],
          [tx(t, "aiIntro_e3", "Learning is something the computer figures out on its own"), tx(t, "aiIntro_e3b", "a person chooses the data, the model, the loss and the optimiser; the algorithm only tunes numbers inside that frame.")],
          [tx(t, "aiIntro_e4", "More parameters always means a better model"), tx(t, "aiIntro_e4b", "more parameters can fit noise as easily as signal; without enough data they generalise worse.")],
          [tx(t, "aiIntro_e5", "The loss is the goal"), tx(t, "aiIntro_e5b", "the loss is a stand-in for what you care about (happy customers, fewer missed spams); choosing it well is part of the design.")],
        ]}
      />

      <KeyIdeas t={t} id="aiIntro" items={[
        "AI builds programs that make decisions; machine learning builds them by fitting adjustable numbers to examples instead of writing the logic by hand.",
        "Search and hand-written rules are AI without learning; deep learning is one family of machine-learning models.",
        "Every learning program has four ingredients: data, a model with parameters, a loss that measures error, and an optimiser that lowers the loss.",
        "Learning means finding the parameters that minimise the loss on the data.",
        "Supervised learning has answers (regression: numbers, classification: categories); unsupervised has none; reinforcement learns from rewards.",
        "The mean squared error averages squared prediction errors: signs do not cancel and large errors weigh most.",
        "What matters is generalisation: low loss on examples that were not used for training.",
      ]} />
    </Article>
  );
}
