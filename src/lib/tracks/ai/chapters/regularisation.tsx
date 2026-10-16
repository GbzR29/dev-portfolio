"use client";

// Neural Networks 5: regularisation — a 1 185-parameter network memorising
// 100 noisy points (Regularise figure, measured train/validation curves);
// L2 / weight decay with its update derived, choosing λ, L1 and sparsity,
// AdamW; early stopping and why it regularises; dropout, inverted scaling and
// its expectation, the ensemble view (Dropout figure); more data and
// augmentation; a summary of the measurements; C++ (forwardDropout, the
// backward change, early stopping); mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { RegulariseFigure } from "@/components/lesson/figures/ai/RegulariseFigure";
import { DropoutFigure } from "@/components/lesson/figures/ai/DropoutFigure";

const r = String.raw;

export function RegularisationContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiReg_intro",
          "A network with enough neurons can fit almost anything, as the universal approximation theorem promised. That includes the noise in its training data. The Generalisation chapter named the problem (overfitting) and the way to see it (a validation set). This chapter measures it on a real network and cures it three ways: a penalty on large weights, stopping at the right moment, and switching neurons off at random. Together these tools are called regularisation: anything that makes a model generalise better without making it fit the training data better.")}
      </Lead>

      <Goals t={t} id="aiReg" items={[
        "Recognise overfitting in training and validation loss curves.",
        "Add an L2 penalty to the loss and its gradient, and choose λ by validation.",
        "Implement early stopping with a saved best network.",
        "Implement inverted dropout and explain why it scales by 1/(1 − p).",
      ]} />

      <H2>{tx(t, "aiReg_memTitle", "A network that memorises")}</H2>
      <p>
        {tx(t, "aiReg_memBody",
          "Take the circle problem from the playground, but make it realistic: only 100 training points, and 10 % of all the labels flipped at random, as if someone had made mistakes while labelling. Of the 100 training points, 9 have a wrong label. A separate set of 1000 points, never used for training, measures generalisation; 8.2 % of its labels are wrong, so even the true circle would get 8.2 % of them \"wrong\". That is the floor no model can beat.")}
      </p>
      <p>
        {tx(t, "aiReg_memRun",
          "Train a 2-32-32-1 tanh network on it: 1 185 parameters for 100 points. Use Adam with η = 0.01 on the full batch, for 2000 epochs. The training loss falls steadily, from 0.73 to 0.31 at epoch 74 and to 0.00 at epoch 2000: every training point right, including the 9 wrong ones. The validation loss falls too at first, to its lowest value, 0.396, at epoch 74. Then it turns and climbs, to 1.56 at epoch 2000. The final network gets 19.4 % of the validation points wrong, although its training error is 0. It has bent its boundary into little pockets around each mislabelled point, and those pockets are wrong for the new points that fall into them.")}
      </p>
      <RegulariseFigure t={t} />
      <p>
        {tx(t, "aiReg_bigWeights",
          "Look at the weights. After 2000 epochs their sum of squares is 2 379 and the largest one is 6.81. Large weights make each tanh neuron switch from −1 to +1 over a tiny distance, and many sharp switches combine into a boundary with sharp turns. A smooth boundary needs small weights. That is the idea behind the first cure.")}
      </p>

      <H2>{tx(t, "aiReg_l2Title", "L2 regularisation: a price on large weights")}</H2>
      <p>
        {tx(t, "aiReg_l2Body",
          "Add to the loss a penalty that grows with the weights. Training then has to balance two goals: fit the data, and keep the weights small. A weight only grows large if the data really pays for it.")}
      </p>
      <Equation label={tx(t, "aiReg_eqL2", "Loss with an L2 penalty, and its gradient")}
        where={[
          [r`L_{\text{data}}`, tx(t, "aiReg_wLdata", "the usual loss, here the mean cross-entropy on the training data")],
          [r`\lambda`, tx(t, "aiReg_wLambda", "lambda, the strength of the penalty: 0 turns it off. Chosen with the validation set")],
          [r`\sum_j w_j^2`, tx(t, "aiReg_wSum", "the sum of the squares of every weight in the network. Biases are usually left out: they shift boundaries without making them sharper")],
          [r`2\lambda w_j`, tx(t, "aiReg_wGrad", "the derivative of λw² with respect to w: the penalty's contribution to each weight's gradient")],
        ]}>
        {r`L = L_{\text{data}} + \lambda \sum_j w_j^2, \qquad \frac{\partial L}{\partial w_j} = \frac{\partial L_{\text{data}}}{\partial w_j} + 2\lambda\,w_j`}
      </Equation>
      <p>
        {tx(t, "aiReg_decay",
          "Put that gradient into the plain gradient-descent step: w ← w − η(∂L_data/∂w + 2λw) = (1 − 2ηλ)·w − η·∂L_data/∂w. Before each ordinary step, every weight is multiplied by a number slightly below 1, so it shrinks a little towards 0. That is why L2 regularisation is also called weight decay. Backprop does not change at all: only the update adds one term, which is exactly the l2 field in the Adam code of the Training chapter.")}
      </p>
      <LessonTable
        headers={["λ", tx(t, "aiReg_tTrainErr", "Training error"), tx(t, "aiReg_tValErr", "Validation error"), "Σw²", tx(t, "aiReg_tLargest", "Largest weight")]}
        rows={[
          ["0", "0 %", "19.4 %", "2 379", "6.81"],
          ["0.0003", "1 %", "21.4 %", "", ""],
          ["0.001", "7 %", "12.9 %", "61.5", "2.37"],
          ["0.003", "9 %", "13.4 %", "37.3", "1.99"],
          ["0.01", "37 %", "32.7 %", "5.0", "1.31"],
        ]}
      />
      <p>
        {tx(t, "aiReg_lambdaRead",
          "All after 2000 epochs. With λ = 0.001 the network gives up on 7 of its training points (5 of them mislabelled) and in exchange gets 12.9 % of the new points wrong instead of 19.4 %. Too little penalty (0.0003) barely changes anything; too much (0.01) wins the tug of war against the data: the weights collapse, the network calls every point \"outside\", and both errors are high. That is underfitting, the other side of the bias–variance trade-off. λ is a hyperparameter like the learning rate, so you choose it as in the Generalisation chapter: try a few values a factor of about 3 apart and keep the one with the lowest validation error.")}
      </p>
      <H3>{tx(t, "aiReg_l1Title", "L1: penalising the absolute value")}</H3>
      <p>
        {tx(t, "aiReg_l1Body",
          "Use λ Σ|wⱼ| instead and the gradient of the penalty is λ times the sign of w: a constant push towards 0, whatever the weight's size. L2's push, 2λw, fades as the weight gets small, so L2 makes weights small but rarely exactly 0. L1 keeps pushing small weights all the way to 0, which switches off inputs or connections: a sparse model. L1 is popular when you want to know which features matter; for hidden layers L2 is the usual choice.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "aiReg_adamw", "With Adam, adding 2λw to the gradient is not quite the same as weight decay: Adam divides each parameter's gradient by its own √v, so weights with large gradients end up decaying less. AdamW (Loshchilov & Hutter, 2017) applies the decay directly, w ← w − ηλw, outside the Adam step. Most modern training uses AdamW. The figure and the code here use the simpler L2-in-the-gradient form.")}
      </Callout>

      <H2>{tx(t, "aiReg_earlyTitle", "Early stopping")}</H2>
      <p>
        {tx(t, "aiReg_earlyBody",
          "The cheapest cure needs no new formula. The validation loss was lowest at epoch 74. So keep a copy of the network whenever the validation loss reaches a new low, and when training ends, return that copy instead of the last network. With no other regularisation, the network from epoch 74 gets 12.4 % of the validation points wrong, the best result in this chapter. In the figure, choose \"best epoch\" to see it: a round boundary that ignores the noisy points.")}
      </p>
      <p>
        {tx(t, "aiReg_earlyWhy",
          "Why does stopping early regularise? The weights start small (Xavier) and grow as training goes on, and the network learns the broad shape first, because that lowers the loss the most; the small pockets around single noisy points come later. Stopping early stops it before the weights get large and before the pockets form, much like an L2 penalty would. Two practical details: there is no need to know the stopping epoch in advance, since you keep training and keep the best copy; and since the validation loss is noisy, real code stops only after it has failed to improve for a number of epochs called the patience, such as 50.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "aiReg_valLeak", "Early stopping and choosing λ both look at the validation set, so its error is now a slightly optimistic estimate: you picked the epoch and the λ that happened to suit those 1000 points. To report an honest final number, keep a third set, the test set, that is used exactly once, at the very end (Generalisation chapter).")}
      </Callout>

      <H2>{tx(t, "aiReg_dropTitle", "Dropout")}</H2>
      <p>
        {tx(t, "aiReg_dropBody",
          "Dropout (Srivastava, Hinton and others, 2014) attacks the problem from another side. During training, at every step, each hidden neuron is switched off with probability p: its output is set to 0 for that step, as if it were not there. A new random set is switched off at the next step. A neuron can never count on a particular partner being present, so it cannot form one of the fragile, overly specific combinations that memorise noise; it has to be useful on its own.")}
      </p>
      <Equation label={tx(t, "aiReg_eqDrop", "Inverted dropout on one hidden layer (training only)")}
        where={[
          [r`p`, tx(t, "aiReg_wP", "the probability of dropping a neuron, typically 0.1 to 0.5")],
          [r`m_i`, tx(t, "aiReg_wM", "the mask of neuron i for this step: 0 with probability p, 1 with probability 1 − p, drawn anew at every step")],
          [r`a_i`, tx(t, "aiReg_wA", "the neuron's normal output f(zᵢ)")],
          [r`\tilde a_i`, tx(t, "aiReg_wAt", "what the next layer receives instead")],
        ]}>
        {r`\tilde a_i = \frac{m_i}{1-p}\,a_i, \qquad \mathbb{E}\Big[\frac{m_i}{1-p}\Big] = \frac{(1-p)\cdot 1 + p\cdot 0}{1-p} = 1`}
      </Equation>
      <p>
        {tx(t, "aiReg_dropScale",
          "Why divide by 1 − p? With p = 0.5 only half of the neurons are on, so the next layer would receive about half its usual total input during training, and the full total at test time, a mismatch. Multiplying the survivors by 1/(1 − p) = 2 makes the expected value of every input exactly what it is with all neurons on, as the right side of the equation shows. So at test time you simply use the network as it is: no masks, no scaling. Backprop needs one change: a dropped neuron gets no delta, and a surviving one has its delta multiplied by the same 1/(1 − p).")}
      </p>
      <DropoutFigure t={t} />
      <p>
        {tx(t, "aiReg_dropView",
          "Another way to see it: with n hidden neurons there are 2ⁿ thinned networks, all sharing one set of weights, and each training step trains one of them. The full network at test time behaves roughly like the average of that huge ensemble, and averaging many models cancels their individual quirks, the same reason a random forest beats a single tree. On the noisy circle, dropout 0.2 gives 14.9 % validation error (5 % training error) and dropout 0.5 gives 16.8 %: better than nothing, worse than L2 here. Dropout shines in large networks with many redundant neurons; in a 1 185-parameter network on 2 inputs, L2 or early stopping is the better tool.")}
      </p>

      <H2>{tx(t, "aiReg_dataTitle", "The best regulariser: more data")}</H2>
      <p>
        {tx(t, "aiReg_dataBody",
          "Overfitting happens because the model has more freedom than the data constrains. Every technique above reduces the freedom. The other way is to add data: with 10 000 noisy points instead of 100, the 9 % of wrong labels are scattered everywhere and no pocket around one of them lowers the loss. When real data is expensive, data augmentation creates more from what you have, using transformations that should not change the label: for images, small shifts, flips, rotations, crops and colour changes; for sound, a little noise or a change in speed. A picture of a cat moved by three pixels is still a cat, and the network learns that position does not matter. Choose the transformations with care: flipping a 6 upside down makes a 9.")}
      </p>

      <H2>{tx(t, "aiReg_sumTitle", "Everything measured, side by side")}</H2>
      <LessonTable
        headers={[tx(t, "aiReg_tMethod", "Method (2-32-32-1, 100 noisy points)"), tx(t, "aiReg_tTrainErr", "Training error"), tx(t, "aiReg_tValErr", "Validation error"), tx(t, "aiReg_tCost", "Cost")]}
        rows={[
          [tx(t, "aiReg_m0", "nothing, 2000 epochs"), "0 %", "19.4 %", "—"],
          [tx(t, "aiReg_m1", "early stopping (epoch 74)"), "11 %", "12.4 %", tx(t, "aiReg_m1c", "a validation pass per epoch and one saved copy")],
          [tx(t, "aiReg_m2", "L2, λ = 0.001"), "7 %", "12.9 %", tx(t, "aiReg_m2c", "one extra term in the update; λ to tune")],
          [tx(t, "aiReg_m3", "dropout, p = 0.2"), "5 %", "14.9 %", tx(t, "aiReg_m3c", "a random mask per step; slower training; p to tune")],
          [tx(t, "aiReg_m4", "the true circle (best possible)"), "9 %", "8.2 %", "—"],
        ]}
      />
      <p>
        {tx(t, "aiReg_sumBody",
          "Two things to notice. Every cure raises the training error: the network stops agreeing with the wrong labels, which is exactly the point. And none of them reaches the 8.2 % floor with only 100 points; the rest of the gap needs more data. In practice the methods are combined: a moderate L2 penalty (or AdamW's weight decay), dropout in large layers, and early stopping on top of both, all tuned on a validation set.")}
      </p>

      <H2>{tx(t, "aiReg_codeTitle", "In C++")}</H2>
      <p>
        {tx(t, "aiReg_codeBody",
          "L2 is already in the Adam struct: set opt.l2 = 0.001. Dropout needs a training-time forward pass that draws the masks and stores them in the Cache, and a one-line change in backward so the deltas go through the same masks. Early stopping is a loop that keeps the best network.")}
      </p>
      <CodeBlock lang="cpp" filename="regularise.h" t={t}>{`#include "train.h"
// Two changes to earlier files:
//   mlp.h, struct Cache:  add   std::vector<std::vector<double>> mask;   // dropout masks; empty without dropout
//   backprop.h, backward: replace the line  prev[i] = s * slope(...);  with
//       const double keep = c.mask.empty() ? 1.0 : c.mask[l - 1][i];   // 0 = dropped
//       prev[i] = keep == 0.0 ? 0.0 : s * keep * slope(net.layers[l - 1].act, c.z[l - 1][i], in[i] / keep);
//   (in[i] / keep undoes the scaling, so the slope sees the neuron's real output)

// Error rate: the fraction of examples on the wrong side of p = 0.5.
double errorRate(const Mlp& net, const Dataset& ds) {
    std::size_t wrong = 0;
    for (std::size_t i = 0; i < ds.n; ++i) wrong += (net.predict(ds.row(i)) >= 0.5) != (ds.y[i] == 1.0);
    return double(wrong) / double(ds.n);
}

// Training-time forward pass with inverted dropout on the hidden layers: each hidden
// output is zeroed with probability p, the survivors are multiplied by 1/(1 − p).
void forwardDropout(const Mlp& net, const double* x, Cache& c, double p, std::mt19937& rng) {
    std::bernoulli_distribution dropped(p);
    c.a.assign(1, std::vector<double>(x, x + net.layers.front().nIn));
    c.z.clear();
    c.mask.clear();
    for (std::size_t l = 0; l < net.layers.size(); ++l) {
        const Layer& L = net.layers[l];
        const bool hidden = l + 1 < net.layers.size();   // never drop the output
        std::vector<double> z(L.nOut), out(L.nOut), m(L.nOut, 1.0);
        for (std::size_t o = 0; o < L.nOut; ++o) {
            double s = L.b[o];
            for (std::size_t i = 0; i < L.nIn; ++i) s += L.W[o * L.nIn + i] * c.a[l][i];
            z[o] = s;
            out[o] = activate(L.act, s);
            if (hidden) { m[o] = dropped(rng) ? 0.0 : 1.0 / (1.0 - p); out[o] *= m[o]; }
        }
        c.z.push_back(std::move(z));
        c.a.push_back(std::move(out));
        c.mask.push_back(std::move(m));
    }
}

// Early stopping: keep the network with the lowest validation loss, and stop
// once it has not improved for \`patience\` epochs.
Mlp trainEarlyStopping(Mlp net, Adam& opt, const Dataset& train, const Dataset& val,
                       std::size_t maxEpochs, std::size_t patience, std::mt19937& rng) {
    Mlp best = net;
    double bestLoss = meanLoss(net, val);
    std::size_t bestEpoch = 0;
    for (std::size_t epoch = 1; epoch <= maxEpochs; ++epoch) {
        trainEpoch(net, opt, train, train.n, rng);       // full batch, as in the figure
        const double v = meanLoss(net, val);
        if (v < bestLoss) { bestLoss = v; best = net; bestEpoch = epoch; }
        else if (epoch - bestEpoch >= patience) break;   // no progress for a while: stop
    }
    return best;
}`}</CodeBlock>
      <p>
        {tx(t, "aiReg_codeUse",
          "To train with dropout, call forwardDropout instead of net.forward inside trainEpoch; predict() and meanLoss() keep using the plain forward pass, which is the test-time network. Run the gradient check with dropout off: with random masks, the loss is a different function at every call.")}
      </p>

      <H2>{tx(t, "aiReg_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiReg_tMistake", "Mistake"), tx(t, "aiReg_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiReg_e1", "Judging the model by its training error"), tx(t, "aiReg_e1b", "the memorising network has 0 % training error and the worst validation error. Always watch a validation set.")],
          [tx(t, "aiReg_e2", "Applying dropout at test time"), tx(t, "aiReg_e2b", "predictions become random and, without the scaling, too small. Dropout is for training only; with inverted dropout the test network needs no change.")],
          [tx(t, "aiReg_e3", "Dropping without scaling by 1/(1 − p)"), tx(t, "aiReg_e3b", "the next layer sees smaller inputs in training than at test time. Scale the survivors (or, in the old style, scale everything by 1 − p at test time).")],
          [tx(t, "aiReg_e4", "Penalising the biases"), tx(t, "aiReg_e4b", "pulls every boundary towards the origin for no benefit. Apply λ to the weights only.")],
          [tx(t, "aiReg_e5", "Choosing λ or the stopping epoch on the test set"), tx(t, "aiReg_e5b", "the reported error becomes optimistic. Tune on the validation set; touch the test set once.")],
          [tx(t, "aiReg_e6", "λ far too large"), tx(t, "aiReg_e6b", "the penalty beats the data and the network underfits (λ = 0.01: 37 % training error). Try values a factor of 3 apart.")],
          [tx(t, "aiReg_e7", "Returning the last network after early stopping"), tx(t, "aiReg_e7b", "by the time patience runs out the network has overfitted for many epochs. Return the saved best copy.")],
        ]}
      />

      <KeyIdeas t={t} id="aiReg" items={[
        "A network with many parameters can memorise noisy training data: training loss falls to 0 while validation loss rises.",
        "Regularisation is anything that improves generalisation without improving the fit to the training data.",
        "L2 adds λΣw² to the loss and 2λw to each weight's gradient, shrinking every weight a little at each step (weight decay); choose λ by validation.",
        "L1 (λΣ|w|) pushes small weights to exactly 0 and gives sparse models.",
        "Early stopping keeps the network from the epoch with the lowest validation loss; it limits how large the weights grow.",
        "Inverted dropout zeroes each hidden output with probability p during training and scales the survivors by 1/(1 − p), so the test network needs no change.",
        "More data, real or augmented, is the most reliable regulariser; in practice several methods are combined and tuned on a validation set.",
      ]} />
    </Article>
  );
}
