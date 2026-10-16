"use client";

// Neural Networks 4: training — the loop, and the XOR loss curve with its
// plateau; initialisation: zero weights and symmetry, the variance argument
// behind Xavier and He (Depth figure); vanishing and exploding gradients,
// ReLU and dead units, clipping; optimisers: momentum, RMSProp and Adam with
// every term explained (Optimiser figure, real-network epochs); learning-rate
// schedules and warm-up; batch size; reading loss curves; the live
// playground (Playground figure); C++ (initWeights, Adam, trainEpoch); mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { DepthFigure } from "@/components/lesson/figures/ai/DepthFigure";
import { OptimiserFigure } from "@/components/lesson/figures/ai/OptimiserFigure";
import { PlaygroundFigure } from "@/components/lesson/figures/ai/PlaygroundFigure";

const r = String.raw;

export function TrainingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiTrain_intro",
          "You can now compute a network's output and every derivative of its loss. Training is just gradient descent with those derivatives, but a network is much harder to train than a line. Its loss surface has plateaus, ravines and many minima; its gradients can shrink to nothing or blow up on their way through the layers; and where it starts matters. This chapter covers the three choices that decide whether training works: the starting weights, the optimiser, and the learning rate. Every claim comes with a measurement you can repeat in the figures.")}
      </Lead>

      <Goals t={t} id="aiTrain" items={[
        "Explain why weights cannot start at zero, and choose Xavier or He initialisation.",
        "Recognise vanishing and exploding gradients, and name the fixes.",
        "Write the momentum, RMSProp and Adam updates and say what each term does.",
        "Read a loss curve and diagnose what went wrong.",
      ]} />

      <H2>{tx(t, "aiTrain_loopTitle", "The training loop")}</H2>
      <p>
        {tx(t, "aiTrain_loopBody",
          "Training a network repeats four steps for every mini-batch: run the forward pass, measure the loss, run backpropagation, update every parameter. One pass over the whole training set is an epoch. This is the same loop as in the Gradient Descent chapter; only the model and its gradient changed.")}
      </p>
      <p>
        {tx(t, "aiTrain_plateauBody",
          "Run it on XOR, from the starting weights of the Backpropagation chapter, with plain gradient descent (η = 1, all four examples per step). The loss starts at 0.701 and sinks to 0.693 = ln 2 by epoch 150, the loss of a network that answers 0.5 to everything. It stays there, almost flat, until about epoch 450. Then it drops: 0.682 at epoch 500, 0.142 at 800, 0.040 at 1000. A long plateau followed by a sudden drop is typical. On the plateau the gradient is tiny but not zero, and the hidden neurons are slowly turning towards useful directions; once they get there, the output can use them and the loss falls fast. The lesson: a flat loss curve does not always mean training is stuck.")}
      </p>

      <H2>{tx(t, "aiTrain_initTitle", "Where to start: initialisation")}</H2>
      <H3>{tx(t, "aiTrain_zeroTitle", "Why not start at zero?")}</H3>
      <p>
        {tx(t, "aiTrain_zeroBody",
          "Linear and logistic regression started at w = 0 without trouble. A network cannot. If all the weights of a layer are equal, every neuron of that layer computes the same output. Then backprop gives them the same delta, so they get the same update, so they stay equal after the step, and after every later step. The layer behaves like a single neuron, however wide it is. This is the symmetry problem; random starting weights break the symmetry.")}
      </p>
      <p>
        {tx(t, "aiTrain_zeroNumbers",
          "Measured on the circle data of the playground below (200 points, one third inside the circle), with a 2-8-1 network trained for 500 epochs. With tanh and zero weights nothing moves at all: every hidden neuron outputs tanh(0) = 0, so the output weights get no gradient, and the hidden weights get none either (their delta is the output weight, 0, times the output's delta). Only the output bias learns, and the network calls every point \"outside\": 33 % wrong. With sigmoid and zero weights the eight hidden neurons learn, but in lockstep: all eight end with the same weights (0.092, −2.655). Still 33 % wrong. With random Xavier weights the same network gets 2.5 % wrong.")}
      </p>
      <H3>{tx(t, "aiTrain_sizeTitle", "How large should the random weights be?")}</H3>
      <p>
        {tx(t, "aiTrain_sizeBody",
          "Look at one neuron: z = w₁a₁ + … + wₙaₙ, a sum of n terms. If the weights and the inputs are independent, with mean 0, the variance of a sum of independent terms is the sum of their variances, and the variance of a product of two independent mean-zero numbers is the product of their variances. So:")}
      </p>
      <Equation label={tx(t, "aiTrain_eqVar", "How the spread of a layer's output grows")}
        where={[
          [r`n`, tx(t, "aiTrain_wN", "the number of inputs of the neuron (the fan-in)")],
          [r`\operatorname{Var}(w)`, tx(t, "aiTrain_wVw", "the variance of the random starting weights: the square of their standard deviation σ")],
          [r`\operatorname{Var}(a)`, tx(t, "aiTrain_wVa", "the variance of the neuron's inputs, the previous layer's outputs")],
        ]}>
        {r`\operatorname{Var}(z) = n \cdot \operatorname{Var}(w) \cdot \operatorname{Var}(a)`}
      </Equation>
      <p>
        {tx(t, "aiTrain_sizeMore",
          "Each layer multiplies the spread of the signal by n · Var(w). If that factor is 0.01 per layer, ten layers shrink the signal by 10⁻²⁰ in variance; if it is 2, they blow it up by 1000. To keep it near 1, choose Var(w) = 1/n. The same argument run backwards, for the deltas, asks for 1/nₒᵤₜ, so Xavier Glorot and Yoshua Bengio (2010) suggested the compromise 2/(nᵢₙ + nₒᵤₜ). ReLU sets half of its inputs to 0, which halves the variance at every layer; Kaiming He and colleagues (2015) doubled the weights' variance to make up for it.")}
      </p>
      <LessonTable
        headers={[tx(t, "aiTrain_tInit", "Initialisation"), tx(t, "aiTrain_tVar", "Variance of each weight"), tx(t, "aiTrain_tFor", "Use with")]}
        rows={[
          [tx(t, "aiTrain_i1", "Xavier (Glorot)"), "2 / (nᵢₙ + nₒᵤₜ)", tx(t, "aiTrain_i1u", "tanh, sigmoid")],
          [tx(t, "aiTrain_i2", "He (Kaiming)"), "2 / nᵢₙ", "ReLU"],
          [tx(t, "aiTrain_i3", "biases"), "0", tx(t, "aiTrain_i3u", "everything: the random weights already break the symmetry")],
        ]}
      />
      <DepthFigure t={t} />
      <p>
        {tx(t, "aiTrain_depthNumbers",
          "The figure measures a 10-layer, 100-wide network. With tiny weights (σ = 0.01) each tanh layer multiplies the signal by n · σ² = 100 × 0.0001 = 0.01 in variance, 0.1 in size, so layer 10 outputs about 10⁻¹⁰. With σ = 1 the factor is 100: every tanh neuron is pushed to ±1, where its slope is almost 0. Xavier keeps tanh's outputs between 0.63 and 0.22 across all ten layers. He keeps ReLU's between 1.0 and 0.54.")}
      </p>

      <H2>{tx(t, "aiTrain_vanishTitle", "Vanishing and exploding gradients")}</H2>
      <p>
        {tx(t, "aiTrain_vanishBody",
          "The Backpropagation chapter warned that every layer multiplies the delta by f'(z). The figure's right panel measures it. With sigmoids and Xavier weights the outputs look healthy, but the gradient shrinks about 4× per layer on its way back: layer 10's weights get a gradient of 0.95 and layer 1's get 4.9 · 10⁻⁶, 200 000 times less. The first layers barely learn. This vanishing gradient is why networks deeper than a few layers were considered untrainable before about 2010.")}
      </p>
      <p>
        {tx(t, "aiTrain_vanishFix",
          "The two fixes are the ones you just saw. First, ReLU: its slope is exactly 1 wherever the neuron is active, so the delta is not shrunk by the activation at all. With He weights the gradient stays between 2.6 and 3.8 across the ten layers. Second, initialisation, which keeps each layer's signal at a usable size. Later architectures add more help: normalisation layers that rescale each layer's outputs during training, and skip connections that let the gradient jump over layers (both appear in the Deep Learning section).")}
      </p>
      <p>
        {tx(t, "aiTrain_explodeBody",
          "The opposite failure is the exploding gradient: when the per-layer factor is above 1, the gradient grows on its way down (with σ = 1 and tanh it grows about 2.3× per layer), a single update throws the weights far away and the loss becomes NaN. Besides fixing the initialisation, a common guard is gradient clipping: if the gradient's length exceeds a limit, scale it down to that limit before the update.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "aiTrain_deadRelu", "ReLU has its own failure: a dead neuron. If a neuron's z is negative for every training example (for example after one huge update pushed its bias far down), it outputs 0 everywhere, its slope is 0 everywhere, and it never gets a gradient again. A too-large learning rate can kill a large fraction of a network this way. Leaky ReLU, max(0.01z, z), keeps a small slope on the negative side so a dead neuron can come back.")}
      </Callout>

      <H2>{tx(t, "aiTrain_optTitle", "Better optimisers")}</H2>
      <p>
        {tx(t, "aiTrain_optIntro",
          "The Gradient Descent chapter showed the core weakness of plain gradient descent (SGD, \"stochastic\" when it uses mini-batches): in a long, narrow valley, the learning rate must stay below 2 divided by the steepest curvature, or the steps across the valley grow until they explode. With that small rate, progress along the flat floor of the valley is slow. Network losses are full of such valleys, with curvatures that differ by factors of thousands. Three ideas fix this.")}
      </p>
      <H3>{tx(t, "aiTrain_momTitle", "Momentum: remember the direction")}</H3>
      <Equation label={tx(t, "aiTrain_eqMom", "SGD with momentum")}
        where={[
          [r`\mathbf{g}`, tx(t, "aiTrain_wG", "the gradient of the loss on the current mini-batch")],
          [r`\mathbf{v}`, tx(t, "aiTrain_wV", "the velocity: a running sum of past gradients, starting at 0")],
          [r`\beta`, tx(t, "aiTrain_wBeta", "beta, how much of the old velocity survives each step; usually 0.9")],
          [r`\eta`, tx(t, "aiTrain_wEta", "the learning rate")],
        ]}>
        {r`\mathbf{v} \leftarrow \beta\,\mathbf{v} + \mathbf{g}, \qquad \boldsymbol\theta \leftarrow \boldsymbol\theta - \eta\,\mathbf{v}`}
      </Equation>
      <p>
        {tx(t, "aiTrain_momBody",
          "Unroll it: v = g_now + 0.9 g_previous + 0.81 g_before + …, a sum of past gradients whose weights fade by 0.9 per step. Across a ravine the gradient flips sign every step, so those terms cancel and the zigzag dies down. Along the ravine the gradient keeps the same sign, so the terms add up: in a steady direction v approaches g/(1 − β) = 10 g. Momentum acts like a ball rolling downhill that gathers speed on a long slope and does not rattle from wall to wall.")}
      </p>
      <H3>{tx(t, "aiTrain_rmsTitle", "RMSProp: a step size for every parameter")}</H3>
      <Equation label={tx(t, "aiTrain_eqRms", "RMSProp")}
        where={[
          [r`\mathbf{s}`, tx(t, "aiTrain_wS", "a running average of the squared gradient, entry by entry, starting at 0: how large each parameter's gradient has been lately")],
          [r`\rho`, tx(t, "aiTrain_wRho", "rho, how slowly that average forgets; usually 0.9")],
          [r`\mathbf{g}^2,\ \sqrt{\mathbf{s}}`, tx(t, "aiTrain_wSq", "squares and square roots taken entry by entry, one per parameter")],
          [r`\varepsilon`, tx(t, "aiTrain_wEpsR", "a tiny number (10⁻⁸) that prevents division by zero")],
        ]}>
        {r`\mathbf{s} \leftarrow \rho\,\mathbf{s} + (1-\rho)\,\mathbf{g}^2, \qquad \boldsymbol\theta \leftarrow \boldsymbol\theta - \eta\,\frac{\mathbf{g}}{\sqrt{\mathbf{s}} + \varepsilon}`}
      </Equation>
      <p>
        {tx(t, "aiTrain_rmsBody",
          "Each parameter's step is divided by the typical size of its own gradient. A parameter on a steep wall, with large gradients, takes small steps; a parameter on a flat floor, with tiny gradients, takes steps as big as the steep one's. Every step is now about η long, in every direction, which removes the ravine's imbalance. The catch: near the minimum the steps are still about η long, so without a decaying learning rate RMSProp keeps bouncing around the bottom.")}
      </p>
      <H3>{tx(t, "aiTrain_adamTitle", "Adam: both at once")}</H3>
      <Equation label={tx(t, "aiTrain_eqAdam", "Adam (Kingma & Ba, 2014)")}
        where={[
          [r`\mathbf{m}`, tx(t, "aiTrain_wM", "the first moment: a running average of the gradient (momentum, scaled so it is an average, not a sum)")],
          [r`\mathbf{v}`, tx(t, "aiTrain_wVa2", "the second moment: a running average of the squared gradient, as in RMSProp")],
          [r`\beta_1,\ \beta_2`, tx(t, "aiTrain_wB12", "how slowly each average forgets: 0.9 and 0.999 by default")],
          [r`t`, tx(t, "aiTrain_wT", "the number of steps taken so far, starting at 1")],
          [r`\hat{\mathbf{m}},\ \hat{\mathbf{v}}`, tx(t, "aiTrain_wHat", "the bias-corrected averages (see below)")],
        ]}>
        {r`\begin{aligned} \mathbf{m} &\leftarrow \beta_1\mathbf{m} + (1-\beta_1)\,\mathbf{g}, & \hat{\mathbf{m}} &= \mathbf{m}/(1-\beta_1^{\,t}) \\ \mathbf{v} &\leftarrow \beta_2\mathbf{v} + (1-\beta_2)\,\mathbf{g}^2, & \hat{\mathbf{v}} &= \mathbf{v}/(1-\beta_2^{\,t}) \\ \boldsymbol\theta &\leftarrow \boldsymbol\theta - \eta\,\hat{\mathbf{m}} / \big(\sqrt{\hat{\mathbf{v}}} + \varepsilon\big) \end{aligned}`}
      </Equation>
      <p>
        {tx(t, "aiTrain_adamBias",
          "Why the correction? Both averages start at 0, so in the first steps they are far too small. After the first step m = 0.1 g, a tenth of the real gradient. Dividing by 1 − β₁ᵗ = 1 − 0.9 = 0.1 gives back exactly g. As t grows, βᵗ goes to 0 and the correction fades away. Without it, the second moment (with β₂ = 0.999) would start a thousand times too small, and the first steps would be huge. Adam with η = 0.001 is the default first choice for most networks.")}
      </p>
      <OptimiserFigure t={t} />
      <LessonTable
        headers={[tx(t, "aiTrain_tOpt", "Optimiser"), tx(t, "aiTrain_tRavine", "Ravine: steps to loss < 0.001"), tx(t, "aiTrain_tReal", "Circle network: epochs to loss < 0.1")]}
        rows={[
          ["SGD", "241 (η = 0.019)", tx(t, "aiTrain_r1", "474 (η = 0.1), 106 (η = 0.5)")],
          [tx(t, "aiTrain_rMom", "momentum, β = 0.9"), "91 (η = 0.01)", "100 (η = 0.05)"],
          ["RMSProp", "924 (η = 0.005)", "209 (η = 0.01)"],
          ["Adam", "87 (η = 0.2)", tx(t, "aiTrain_r4", "185 (η = 0.01), 75 (η = 0.03)")],
        ]}
      />
      <p>
        {tx(t, "aiTrain_realBody",
          "The right column is the 2-8-1 tanh network of the playground on the circle, mini-batches of 20, the median over 10 random starts. Two things stand out. Momentum with η = 0.05 behaves like SGD with η = 0.5: in a steady direction momentum multiplies the step by 1/(1 − β) = 10, so comparing optimisers at the same η is meaningless; each needs its own. And no optimiser wins everywhere. What Adam buys is robustness: it works reasonably well over a wide range of η and of problems, which is why it is the usual default.")}
      </p>

      <H2>{tx(t, "aiTrain_schedTitle", "Changing the learning rate over time")}</H2>
      <p>
        {tx(t, "aiTrain_schedBody",
          "A large learning rate makes fast progress at first but cannot settle into a narrow minimum; a small one settles but crawls. So the rate is usually changed during training, by a schedule:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiTrain_tSched", "Schedule"), tx(t, "aiTrain_tRule", "Rule"), tx(t, "aiTrain_tWhy", "Why")]}
        rows={[
          [tx(t, "aiTrain_s1", "step decay"), tx(t, "aiTrain_s1r", "multiply η by 0.1 every so many epochs"), tx(t, "aiTrain_s1w", "simple; the loss often drops visibly after each cut")],
          [tx(t, "aiTrain_s2", "cosine decay"), "η(t) = η₀ · ½ (1 + cos(π t / T))", tx(t, "aiTrain_s2w", "glides smoothly from η₀ to 0 over T steps; no epochs to pick")],
          [tx(t, "aiTrain_s3", "warm-up"), tx(t, "aiTrain_s3r", "raise η linearly from 0 to η₀ over the first few hundred steps"), tx(t, "aiTrain_s3w", "the random starting weights give large, unreliable gradients, and Adam's averages are still unreliable; small first steps avoid an early blow-up")],
        ]}
      />

      <H2>{tx(t, "aiTrain_batchTitle", "Batch size")}</H2>
      <p>
        {tx(t, "aiTrain_batchBody",
          "The mini-batch gradient is an average over B examples, an estimate of the full gradient. Its noise shrinks like 1/√B: four times the batch, half the noise. Larger batches therefore give smoother steps and use parallel hardware well, but each epoch has fewer steps. Smaller batches give more, noisier steps, and the noise can even help, by shaking the weights off flat plateaus and out of sharp minima that generalise badly. Typical sizes are 32 to 512. A rule of thumb when you change it: multiply the batch by k and the learning rate by about k (for SGD) to keep the same progress per epoch.")}
      </p>

      <H2>{tx(t, "aiTrain_curveTitle", "Reading the loss curve")}</H2>
      <p>
        {tx(t, "aiTrain_curveIntro", "Plot the training loss after every epoch (and, from the next chapter on, the validation loss). Its shape tells you what to change:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiTrain_tShapeC", "What you see"), tx(t, "aiTrain_tMeans", "Likely cause"), tx(t, "aiTrain_tDo", "What to try")]}
        rows={[
          [tx(t, "aiTrain_c1", "loss grows, or becomes NaN"), tx(t, "aiTrain_c1m", "learning rate too large, or exploding gradients"), tx(t, "aiTrain_c1d", "divide η by 3; check the initialisation; clip gradients")],
          [tx(t, "aiTrain_c2", "flat from the very start"), tx(t, "aiTrain_c2m", "η far too small, saturated or dead neurons, symmetric weights, or a gradient bug"), tx(t, "aiTrain_c2d", "run a gradient check; use Xavier or He; raise η")],
          [tx(t, "aiTrain_c3", "long plateau, then a drop"), tx(t, "aiTrain_c3m", "normal: the hidden layer is slowly finding useful directions"), tx(t, "aiTrain_c3d", "be patient, or use momentum or Adam to cross it faster")],
          [tx(t, "aiTrain_c4", "very noisy"), tx(t, "aiTrain_c4m", "small batches, or η a bit too large"), tx(t, "aiTrain_c4d", "larger batch, smaller η, or a decaying schedule")],
          [tx(t, "aiTrain_c5", "stops falling at a high value"), tx(t, "aiTrain_c5m", "the network is too small, or stuck in a poor region"), tx(t, "aiTrain_c5d", "more neurons or layers; a new random start")],
          [tx(t, "aiTrain_c6", "training loss falls, validation loss rises"), tx(t, "aiTrain_c6m", "overfitting"), tx(t, "aiTrain_c6d", "the Regularisation chapter")],
        ]}
      />

      <H2>{tx(t, "aiTrain_playTitle", "Try it")}</H2>
      <p>
        {tx(t, "aiTrain_playBody",
          "Everything in this chapter runs live below: the network, backprop, Xavier or He starting weights (He for ReLU), SGD or Adam. Use it to answer a few questions. How many hidden neurons does the circle need? (A closed curve needs at least three straight edges, so: at least 3. With 2, about a quarter of the points stay wrong.) What does too large a learning rate look like? Does a different random start change the result?")}
      </p>
      <PlaygroundFigure t={t} />

      <H2>{tx(t, "aiTrain_codeTitle", "In C++")}</H2>
      <p>
        {tx(t, "aiTrain_codeBody",
          "This builds on backprop.h. initWeights draws Xavier or He weights from a normal distribution; Adam keeps m and v as two more Grads with the network's shape; trainEpoch is the mini-batch loop of the Gradient Descent chapter with backward() in place of the hand-written gradient. The l2 field is unused until the next chapter.")}
      </p>
      <CodeBlock lang="cpp" filename="train.h" t={t}>{`#include <numeric>
#include <random>
#include "backprop.h"

enum class Init { Xavier, He };

// Random starting weights: normal, variance 2/(nIn + nOut) (Xavier) or 2/nIn (He). Biases start at 0.
void initWeights(Mlp& net, Init init, std::mt19937& rng) {
    for (Layer& L : net.layers) {
        const double var = init == Init::He ? 2.0 / double(L.nIn) : 2.0 / double(L.nIn + L.nOut);
        std::normal_distribution<double> N(0.0, std::sqrt(var));
        for (double& w : L.W) w = N(rng);
        std::fill(L.b.begin(), L.b.end(), 0.0);
    }
}

// Adam: a running mean of the gradient (m, momentum) divided by the root of a running
// mean of its square (v), so every parameter gets its own step size.
struct Adam {
    double lr, beta1 = 0.9, beta2 = 0.999, eps = 1e-8;
    double l2 = 0.0;                                      // λ of the L2 penalty (Regularisation chapter)
    long t = 0;                                           // steps taken, for the bias correction
    Grads m, v;
    Adam(const Mlp& net, double rate) : lr(rate), m(net), v(net) {}

    void step(Mlp& net, const Grads& g) {
        ++t;
        const double c1 = 1.0 - std::pow(beta1, double(t)), c2 = 1.0 - std::pow(beta2, double(t));
        auto update = [&](std::vector<double>& p, const std::vector<double>& gr,
                          std::vector<double>& mm, std::vector<double>& vv, bool penalised) {
            for (std::size_t j = 0; j < p.size(); ++j) {
                const double gj = gr[j] + (penalised ? 2.0 * l2 * p[j] : 0.0);   // + the gradient of λw²
                mm[j] = beta1 * mm[j] + (1.0 - beta1) * gj;
                vv[j] = beta2 * vv[j] + (1.0 - beta2) * gj * gj;
                p[j] -= lr * (mm[j] / c1) / (std::sqrt(vv[j] / c2) + eps);
            }
        };
        for (std::size_t l = 0; l < net.layers.size(); ++l) {
            update(net.layers[l].W, g.W[l], m.W[l], v.W[l], true);    // weights get the penalty
            update(net.layers[l].b, g.b[l], m.b[l], v.b[l], false);   // biases do not
        }
    }
};

// One epoch of mini-batch training in a fresh random order.
void trainEpoch(Mlp& net, Adam& opt, const Dataset& ds, std::size_t batch, std::mt19937& rng) {
    std::vector<std::size_t> order(ds.n);
    std::iota(order.begin(), order.end(), 0);
    std::shuffle(order.begin(), order.end(), rng);
    Grads g(net);
    Cache c;
    for (std::size_t start = 0; start < ds.n; start += batch) {
        const std::size_t end = std::min(start + batch, ds.n);
        g.zero();
        for (std::size_t k = start; k < end; ++k) {
            net.forward(ds.row(order[k]), c);
            backward(net, c, ds.y[order[k]], g);
        }
        g.scale(1.0 / double(end - start));               // mean over the batch
        opt.step(net, g);
    }
}`}</CodeBlock>
      <CodeBlock lang="cpp" filename="xor_train.cpp" t={t}>{`#include <cstdio>
#include "train.h"

int main() {
    Dataset xs; xs.n = 4; xs.d = 2;
    xs.X = {0, 0, 0, 1, 1, 0, 1, 1};
    xs.y = {0, 1, 1, 0};

    std::mt19937 rng(1);
    Mlp net({2, 4, 1}, Act::Tanh, Act::Sigmoid);
    initWeights(net, Init::Xavier, rng);
    Adam opt(net, 0.05);
    for (int epoch = 0; epoch <= 300; ++epoch) {
        if (epoch % 100 == 0) std::printf("epoch %3d   loss %.4f\\n", epoch, meanLoss(net, xs));
        trainEpoch(net, opt, xs, 4, rng);
    }
}
// epoch   0   loss 0.7945
// epoch 100   loss 0.0213
// epoch 200   loss 0.0076
// epoch 300   loss 0.0042       (outputs 0.000, 0.995, 0.996, 0.007; g++ 14, libstdc++'s mt19937)`}</CodeBlock>

      <H2>{tx(t, "aiTrain_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiTrain_tMistake", "Mistake"), tx(t, "aiTrain_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiTrain_e1", "Starting every weight at 0 (or at one constant)"), tx(t, "aiTrain_e1b", "the neurons of a layer stay identical forever. Draw random weights; biases may start at 0.")],
          [tx(t, "aiTrain_e2", "Random weights of a fixed size, such as σ = 1 or 0.01"), tx(t, "aiTrain_e2b", "the signal grows or shrinks by the same factor at every layer. Scale by the fan-in: Xavier for tanh and sigmoid, He for ReLU.")],
          [tx(t, "aiTrain_e3", "Sigmoid in every hidden layer of a deep network"), tx(t, "aiTrain_e3b", "the gradient shrinks about 4× per layer. Use ReLU (or tanh for small networks) in hidden layers; keep the sigmoid for the output.")],
          [tx(t, "aiTrain_e4", "Comparing optimisers at the same learning rate"), tx(t, "aiTrain_e4b", "momentum with η behaves like SGD with 10η, and Adam's η is a step length. Tune η for each optimiser.")],
          [tx(t, "aiTrain_e5", "Giving up during a plateau"), tx(t, "aiTrain_e5b", "the XOR network looks stuck at ln 2 for 300 epochs and then learns. Train longer, or check the gradient's size, before concluding anything.")],
          [tx(t, "aiTrain_e6", "Forgetting Adam's bias correction"), tx(t, "aiTrain_e6b", "the first steps are wildly off, because m and v start at 0. Divide by 1 − β₁ᵗ and 1 − β₂ᵗ.")],
          [tx(t, "aiTrain_e7", "Reusing one random seed and trusting one run"), tx(t, "aiTrain_e7b", "the spiral network takes 200 epochs from one start and 900 from another. Compare settings over several starts.")],
        ]}
      />

      <KeyIdeas t={t} id="aiTrain" items={[
        "Training repeats forward pass, loss, backpropagation and update for every mini-batch; plateaus followed by sudden drops are normal.",
        "Equal starting weights keep a layer's neurons identical forever; random weights break the symmetry.",
        "Each layer multiplies the signal's variance by n · Var(w): Xavier (2/(nᵢₙ + nₒᵤₜ)) and He (2/nᵢₙ, for ReLU) keep it near 1.",
        "Sigmoid slopes shrink the gradient about 4× per layer (vanishing); large weights make it grow (exploding). ReLU, good initialisation and clipping help.",
        "Momentum averages past gradients so zigzags cancel; RMSProp gives each parameter its own step size; Adam does both, with a bias correction for the first steps.",
        "Each optimiser needs its own learning rate; schedules lower it over time, and warm-up raises it gently at the start.",
        "The shape of the loss curve tells you whether to change the learning rate, the initialisation, the network size or the regularisation.",
      ]} />
    </Article>
  );
}
