"use client";

// Neural Networks 3: backpropagation — why finite differences are too slow;
// the chain rule along one path and over several paths; deltas and the three
// backprop equations, each derived (p − y for sigmoid + cross-entropy, δ × input,
// Wᵀδ ⊙ f'); the 2-2-1 example worked by hand and one update (Backprop
// figure); the algorithm in matrix form and its cost (reverse mode); gradient
// checking with four classic bugs (GradCheck figure, break-it); vanishing
// gradients previewed; C++ (slope, Grads, backward, gradCheck); mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { BackpropFigure } from "@/components/lesson/figures/ai/BackpropFigure";
import { GradCheckFigure } from "@/components/lesson/figures/ai/GradCheckFigure";

const r = String.raw;

export function BackpropagationContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiBp_intro",
          "Gradient descent needs the derivative of the loss with respect to every weight. For linear and logistic regression you wrote those derivatives by hand. A network has a weight on every connection, often millions of them, buried under layers of activations. Backpropagation computes all of those derivatives in one backward sweep through the network, for about the cost of one more forward pass. It is nothing more than the chain rule, applied in a clever order. This chapter derives it, works it through by hand on a tiny network, and shows how to prove that your code gets it right.")}
      </Lead>

      <Goals t={t} id="aiBp" items={[
        "Apply the chain rule along a path through a network.",
        "Compute every delta and gradient of a small network by hand.",
        "State the three backpropagation equations and say where each comes from.",
        "Explain why backprop costs about as much as a forward pass.",
        "Check a backward pass against numerical derivatives.",
      ]} />

      <H2>{tx(t, "aiBp_problemTitle", "The problem: one derivative per weight")}</H2>
      <p>
        {tx(t, "aiBp_problemBody",
          "The Gradient Descent chapter estimated a derivative numerically: nudge one parameter up by a tiny h, nudge it down, and compare the two losses. That needs two forward passes per parameter. The 101 770-parameter digit network from the last chapter would need 203 540 forward passes over the training data for a single step of gradient descent. Training takes thousands of steps. That is hopeless.")}
      </p>
      <p>
        {tx(t, "aiBp_problemIdea",
          "The way out: most of the work in those derivatives is shared. Every weight in the first layer influences the loss through the same hidden neurons, the same output neuron and the same loss. Backpropagation computes those shared parts once, starting at the loss and walking backwards, and hands them down layer by layer.")}
      </p>

      <H2>{tx(t, "aiBp_chainTitle", "The chain rule, again")}</H2>
      <p>
        {tx(t, "aiBp_chainBody",
          "A network is a chain of simple functions. Follow one weight of the network below, w⁽¹⁾₁₁, the edge from x₁ into hidden neuron 1. It changes z₁, which changes h₁ = σ(z₁), which changes z⁽²⁾, which changes the output p = σ(z⁽²⁾), which changes the loss L. The Math track's chain rule says: the derivative of a chain is the product of the derivatives of its links.")}
      </p>
      <Equation label={tx(t, "aiBp_eqChain", "The chain rule along one path")}
        where={[
          [r`\frac{\partial L}{\partial p}`, tx(t, "aiBp_wLp", "how the loss reacts to the output")],
          [r`\frac{\partial p}{\partial z^{(2)}}`, tx(t, "aiBp_wPz", "the slope of the output sigmoid, p(1 − p)")],
          [r`\frac{\partial z^{(2)}}{\partial h_1}`, tx(t, "aiBp_wZh", "the weight on the edge from h₁ to the output, w⁽²⁾₁: z⁽²⁾ contains the term w⁽²⁾₁h₁")],
          [r`\frac{\partial h_1}{\partial z_1}`, tx(t, "aiBp_wHz", "the slope of the hidden sigmoid, h₁(1 − h₁)")],
          [r`\frac{\partial z_1}{\partial w^{(1)}_{11}}`, tx(t, "aiBp_wZw", "the input on that edge, x₁: z₁ contains the term w⁽¹⁾₁₁x₁")],
        ]}>
        {r`\frac{\partial L}{\partial w^{(1)}_{11}} = \frac{\partial L}{\partial p}\cdot\frac{\partial p}{\partial z^{(2)}}\cdot\frac{\partial z^{(2)}}{\partial h_1}\cdot\frac{\partial h_1}{\partial z_1}\cdot\frac{\partial z_1}{\partial w^{(1)}_{11}}`}
      </Equation>
      <p>
        {tx(t, "aiBp_chainShared",
          "Now take the neighbouring weight w⁽¹⁾₁₂, from x₂ into the same hidden neuron. Its chain is identical except for the last link, which is x₂ instead of x₁. The first four factors are shared. That shared product, the derivative of the loss with respect to z₁, gets a name.")}
      </p>
      <p>
        {tx(t, "aiBp_multiPath",
          "One more rule. When a value feeds several neurons, it influences the loss along several paths, and the multivariable chain rule says the effects add up: the derivative is the sum over all the paths. A hidden neuron in a wide layer feeds every neuron of the next layer, so its derivative is a sum with one term per outgoing edge.")}
      </p>

      <H2>{tx(t, "aiBp_deltaTitle", "Deltas: the error signal of each neuron")}</H2>
      <p>
        {tx(t, "aiBp_deltaBody",
          "For every neuron, define its delta: the derivative of the loss with respect to that neuron's pre-activation z. It answers: if this neuron's weighted sum grew by a tiny amount, how much would the loss change? A positive delta means the loss would rise, so the neuron's z should go down. Everything backprop computes follows from three equations about deltas.")}
      </p>
      <Equation label={tx(t, "aiBp_eqThree", "The three backpropagation equations")}
        where={[
          [r`\delta^{(l)}`, tx(t, "aiBp_wDelta", "the deltas of layer l, one per neuron: δ⁽ˡ⁾ = ∂L/∂z⁽ˡ⁾")],
          [r`p,\; y`, tx(t, "aiBp_wPy", "the network's output (a sigmoid) and the true label, 0 or 1")],
          [r`\mathbf{a}^{(l-1)}`, tx(t, "aiBp_wAprev", "the input layer l received in the forward pass (for layer 1, the features x)")],
          [r`\big(W^{(l+1)}\big)^{\!\top}`, tx(t, "aiBp_wWT", "the transposed weights of the layer above: row i now lists the weights leaving neuron i, so the product sums over its outgoing edges")],
          [r`f'\big(\mathbf{z}^{(l)}\big)`, tx(t, "aiBp_wFp", "the slope of this layer's activation at its own z, one per neuron")],
          [r`\odot`, tx(t, "aiBp_wOdot", "multiply entry by entry (not a matrix product)")],
        ]}>
        {r`\begin{aligned} &\text{(1)} & \delta^{(L)} &= p - y \\ &\text{(2)} & \frac{\partial L}{\partial W^{(l)}} &= \delta^{(l)}\,\big(\mathbf{a}^{(l-1)}\big)^{\!\top}, \qquad \frac{\partial L}{\partial \mathbf{b}^{(l)}} = \delta^{(l)} \\ &\text{(3)} & \delta^{(l)} &= \Big(\big(W^{(l+1)}\big)^{\!\top}\delta^{(l+1)}\Big) \odot f'\big(\mathbf{z}^{(l)}\big) \end{aligned}`}
      </Equation>
      <H3>{tx(t, "aiBp_eq1Title", "1. The output delta is p − y")}</H3>
      <p>
        {tx(t, "aiBp_eq1Body",
          "The loss of one example is the cross-entropy L = −[y ln p + (1 − y) ln(1 − p)], and p = σ(z). Differentiate in two links:")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiBp_d1", "∂L/∂p = −y/p + (1 − y)/(1 − p). Over a common denominator this is (p − y) / (p(1 − p)).")}</li>
        <li>{tx(t, "aiBp_d2", "∂p/∂z = σ'(z) = p(1 − p), the sigmoid's slope from the Logistic Regression chapter.")}</li>
        <li>{tx(t, "aiBp_d3", "Multiply: the p(1 − p) cancels and δ = p − y. The answer minus the truth, nothing else.")}</li>
      </ol>
      <p>
        {tx(t, "aiBp_eq1More",
          "This cancellation is why sigmoid outputs are paired with cross-entropy (and softmax outputs too: the same p − y appears per class). With squared error instead, the slope p(1 − p) would stay in the delta, and a confidently wrong neuron, where that slope is almost 0, would barely learn.")}
      </p>
      <H3>{tx(t, "aiBp_eq2Title", "2. A weight's gradient is delta × input")}</H3>
      <p>
        {tx(t, "aiBp_eq2Body",
          "Neuron o computes zₒ = Σᵢ wₒᵢaᵢ + bₒ. A weight wₒᵢ appears in exactly one term, so ∂zₒ/∂wₒᵢ = aᵢ, the input on that edge, and ∂zₒ/∂bₒ = 1. By the chain rule ∂L/∂wₒᵢ = δₒ · aᵢ and ∂L/∂bₒ = δₒ. Written for the whole layer, that is the outer product δ aᵀ: a matrix with one entry per weight, exactly the shape of W. Note what it implies: an input of 0 gives its weights a gradient of 0. They had no effect on this example, so this example cannot tell them how to change.")}
      </p>
      <H3>{tx(t, "aiBp_eq3Title", "3. A hidden delta collects the deltas above it")}</H3>
      <p>
        {tx(t, "aiBp_eq3Body",
          "Hidden neuron i outputs aᵢ = f(zᵢ), and aᵢ enters every neuron o of the layer above with weight wₒᵢ. Following each path, a small change in zᵢ changes aᵢ by f'(zᵢ) times as much, and each zₒ by wₒᵢ times that. Each zₒ then moves the loss by δₒ. Summing over the paths: δᵢ = (Σₒ wₒᵢ δₒ) · f'(zᵢ). The sum is the i-th entry of Wᵀδ: the deltas flow back along the same edges the values flowed forward, scaled by the same weights.")}
      </p>

      <H2>{tx(t, "aiBp_workedTitle", "Worked example, by hand")}</H2>
      <p>
        {tx(t, "aiBp_workedIntro",
          "A 2-2-1 network with sigmoids everywhere and small starting weights, before any training: W⁽¹⁾ = [[0.5, −0.5], [0.3, 0.8]], b⁽¹⁾ = (0.1, −0.2), W⁽²⁾ = [0.7, −0.6], b⁽²⁾ = 0.2. Train it on one XOR example, x = (1, 0) with label y = 1. Numbers are rounded to 4 digits; the computation keeps them all.")}
      </p>
      <LessonTable
        headers={[tx(t, "aiBp_tStep", "Step"), tx(t, "aiBp_tCalc", "Computation"), tx(t, "aiBp_tVal", "Value")]}
        rows={[
          [tx(t, "aiBp_f1", "hidden sums"), "z₁ = 0.5·1 − 0.5·0 + 0.1;  z₂ = 0.3·1 + 0.8·0 − 0.2", "(0.6, 0.1)"],
          [tx(t, "aiBp_f2", "hidden outputs"), "h = (σ(0.6), σ(0.1))", "(0.6457, 0.5250)"],
          [tx(t, "aiBp_f3", "output sum"), "z⁽²⁾ = 0.7·0.6457 − 0.6·0.5250 + 0.2", "0.3370"],
          [tx(t, "aiBp_f4", "output"), "p = σ(0.3370)", "0.5835"],
          [tx(t, "aiBp_f5", "loss"), "L = −ln 0.5835", "0.5388"],
          [tx(t, "aiBp_b1", "output delta"), "δ⁽²⁾ = p − y = 0.5835 − 1", "−0.4165"],
          [tx(t, "aiBp_b2", "output gradients"), "∂L/∂W⁽²⁾ = δ⁽²⁾·h;  ∂L/∂b⁽²⁾ = δ⁽²⁾", "(−0.2689, −0.2187);  −0.4165"],
          [tx(t, "aiBp_b3", "sent back"), "W⁽²⁾ᵀδ⁽²⁾ = (0.7, −0.6)·(−0.4165)", "(−0.2916, 0.2499)"],
          [tx(t, "aiBp_b4", "hidden slopes"), "h(1 − h) = (0.6457·0.3543, 0.5250·0.4750)", "(0.2288, 0.2494)"],
          [tx(t, "aiBp_b5", "hidden deltas"), "δ⁽¹⁾ = (−0.2916·0.2288, 0.2499·0.2494)", "(−0.0667, 0.0623)"],
          [tx(t, "aiBp_b6", "hidden gradients"), "∂L/∂W⁽¹⁾ = δ⁽¹⁾xᵀ;  ∂L/∂b⁽¹⁾ = δ⁽¹⁾", "[[−0.0667, 0], [0.0623, 0]];  (−0.0667, 0.0623)"],
        ]}
      />
      <p>
        {tx(t, "aiBp_readSigns",
          "Read the signs. The output delta is negative: the network said 0.58 but the answer is 1, so z⁽²⁾ should grow. Both output weight gradients are negative, so gradient descent raises both weights: w⁽²⁾₁ from 0.7 towards more h₁, and w⁽²⁾₂ from −0.6 towards less negative. Hidden neuron 1 gets a negative delta (it feeds the output through a positive weight, so it should fire more), hidden neuron 2 a positive one (it feeds through a negative weight, so it should fire less). The weights from x₂ get no gradient at all, because x₂ = 0 in this example.")}
      </p>
      <p>
        {tx(t, "aiBp_update",
          "Now take one gradient-descent step with η = 1: every parameter minus its gradient. W⁽²⁾ becomes (0.9689, −0.3813), b⁽²⁾ becomes 0.6165, and the hidden weights move by the small hidden gradients. Run the same example forward again: p rises from 0.5835 to 0.7470 and the loss falls from 0.5388 to 0.2917. One step, on one example, in the right direction. Step through it in the figure, and try the other corners.")}
      </p>
      <BackpropFigure t={t} />
      <Callout type="info" t={t}>
        {tx(t, "aiBp_smallHidden", "The hidden gradients (about 0.06) are much smaller than the output gradients (about 0.27). Each time a delta crosses a sigmoid it is multiplied by a slope of at most 0.25, here about 0.23. Two layers is no problem; twenty is. The last section of this chapter comes back to this.")}
      </Callout>

      <H2>{tx(t, "aiBp_algoTitle", "The algorithm")}</H2>
      <p>
        {tx(t, "aiBp_algoIntro", "For one example (x, y), in a network with L layers:")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiBp_a1", "Forward: run the layers in order and store every z⁽ˡ⁾ and every a⁽ˡ⁾. Backprop needs them all.")}</li>
        <li>{tx(t, "aiBp_a2", "Output delta: δ⁽ᴸ⁾ = p − y.")}</li>
        <li>{tx(t, "aiBp_a3", "For l = L down to 1: add δ⁽ˡ⁾(a⁽ˡ⁻¹⁾)ᵀ to the gradient of W⁽ˡ⁾ and δ⁽ˡ⁾ to the gradient of b⁽ˡ⁾; then, unless l = 1, compute δ⁽ˡ⁻¹⁾ = (W⁽ˡ⁾ᵀδ⁽ˡ⁾) ⊙ f'(z⁽ˡ⁻¹⁾) using the weights from before any update.")}</li>
        <li>{tx(t, "aiBp_a4", "For a mini-batch, repeat for each example, adding up the gradients, then divide by the batch size. Only then update the weights.")}</li>
      </ol>
      <H3>{tx(t, "aiBp_costTitle", "Why it is fast")}</H3>
      <p>
        {tx(t, "aiBp_costBody",
          "In the forward pass every weight is used once: one multiply and one add. In the backward pass it is used twice: once to compute its own gradient (δ × input) and once to send a delta back (Wᵀδ). So a backward pass costs about twice a forward pass, whatever the number of weights. For the digit network that is about 3 forward passes' worth of work per step instead of 203 540. This idea, computing the derivatives of one output with respect to every input in a single backward sweep, is called reverse-mode automatic differentiation. Libraries such as PyTorch and JAX record the forward operations and run exactly this backward sweep for you.")}
      </p>
      <p>
        {tx(t, "aiBp_historyBody",
          "The method was found several times: Seppo Linnainmaa described reverse-mode differentiation in 1970, Paul Werbos proposed it for neural networks in 1974, and David Rumelhart, Geoffrey Hinton and Ronald Williams made it famous in 1986 by showing that hidden layers trained this way learn useful features. That paper ended the long winter that followed Minsky and Papert's book.")}
      </p>

      <H2>{tx(t, "aiBp_checkTitle", "Checking the gradient")}</H2>
      <p>
        {tx(t, "aiBp_checkBody",
          "Backprop code fails silently. A wrong gradient still produces numbers of the right size, and the program runs; training just goes nowhere, or somewhere strange. The Gradient Descent chapter promised the fix: compare every derivative with the central difference (L(θ + h) − L(θ − h)) / 2h. It is far too slow for training, but perfect for testing on a tiny network.")}
      </p>
      <Equation label={tx(t, "aiBp_eqRel", "Relative error between the two derivatives")}
        where={[
          [r`g_{\text{bp}}`, tx(t, "aiBp_wGbp", "the derivative from backprop")],
          [r`g_{\text{num}}`, tx(t, "aiBp_wGnum", "the central-difference estimate, with h = 10⁻⁵")],
          [r`\varepsilon`, tx(t, "aiBp_wEps", "a tiny floor (10⁻⁸) so that two zeros do not divide by zero")],
        ]}>
        {r`\text{rel} = \frac{|g_{\text{bp}} - g_{\text{num}}|}{\max\big(|g_{\text{bp}}|,\; |g_{\text{num}}|,\; \varepsilon\big)}`}
      </Equation>
      <p>
        {tx(t, "aiBp_checkRead",
          "For the network above on all four XOR examples, the worst relative error over its 9 parameters is about 5·10⁻⁸: backprop and the estimate agree to 7 or 8 digits. As a rule of thumb, around 10⁻⁷ or smaller is correct, and 10⁻³ or larger is a bug. The figure plants four classic bugs, one at a time.")}
      </p>
      <GradCheckFigure t={t} />
      <LessonTable
        headers={[tx(t, "aiBp_tBug", "Bug"), tx(t, "aiBp_tCheck", "Gradient check"), tx(t, "aiBp_tTrain", "Training from the same start (η = 1, 2000 epochs)")]}
        rows={[
          [tx(t, "aiBp_g0", "none"), "5·10⁻⁸", tx(t, "aiBp_g0t", "plateau near 0.69, then solves XOR: loss 0.0078")],
          [tx(t, "aiBp_g1", "hidden delta without the slope f'"), tx(t, "aiBp_g1c", "hidden parameters off by up to 98 %"), tx(t, "aiBp_g1t", "stuck at 0.693: every output 0.50")],
          [tx(t, "aiBp_g2", "slope computed as z(1 − z) instead of a(1 − a)"), tx(t, "aiBp_g2c", "hidden parameters wrong, some with the wrong sign"), tx(t, "aiBp_g2t", "blows up to NaN")],
          [tx(t, "aiBp_g3", "output delta y − p (sign flipped)"), tx(t, "aiBp_g3c", "every parameter: same size, opposite sign"), tx(t, "aiBp_g3t", "gradient ascent: the loss climbs to 13.8, where the code's clamp of p stops it")],
          [tx(t, "aiBp_g4", "weight gradient δ instead of δ × input"), tx(t, "aiBp_g4c", "biases right, every weight wrong"), tx(t, "aiBp_g4t", "wanders near 0.69, never learns")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "aiBp_checkTips", "Check on a tiny network (a few neurons, a few examples), in double precision, before training, and again after any change to the backward code. Turn off anything random, such as dropout, during the check. With ReLU, a z that lands within h of 0 can give a false alarm, because the slope jumps there; move the point slightly and check again.")}
      </Callout>

      <H2>{tx(t, "aiBp_vanishTitle", "A first look at vanishing gradients")}</H2>
      <p>
        {tx(t, "aiBp_vanishBody",
          "Equation 3 multiplies the delta by f'(z) at every layer it crosses. The sigmoid's slope is at most 0.25 (at z = 0) and much smaller when the neuron is saturated near 0 or 1. Across 10 sigmoid layers the delta is multiplied by ten such slopes, at most 0.25¹⁰ ≈ 10⁻⁶ (the weights also multiply in, and can partly make up for it). The first layers then receive almost no gradient and barely learn. The Training chapter measures this in a 10-layer network and shows the two standard fixes: activations whose slope is 1 (ReLU) and starting weights of the right size.")}
      </p>

      <H2>{tx(t, "aiBp_codeTitle", "In C++")}</H2>
      <p>
        {tx(t, "aiBp_codeBody",
          "This builds on mlp.h. The backward function follows the algorithm line by line: it reads the Cache from the forward pass, adds this example's gradients into a Grads that has the same shape as the network, and walks the layers from the last to the first. slope() takes both z and the stored activation, because the sigmoid's and tanh's slopes are cheapest from the output, and ReLU's from the input.")}
      </p>
      <CodeBlock lang="cpp" filename="backprop.h" t={t}>{`#include <algorithm>
#include "mlp.h"

// Slope of the activation, from its input z and its output y.
double slope(Act a, double z, double y) {
    switch (a) {
        case Act::Sigmoid: return y * (1.0 - y);          // σ'(z) = σ(z)(1 − σ(z))
        case Act::Tanh:    return 1.0 - y * y;            // tanh'(z) = 1 − tanh²(z)
        case Act::ReLU:    return z > 0.0 ? 1.0 : 0.0;
        default:           return 1.0;
    }
}

// One gradient per weight and per bias, shaped like the network.
struct Grads {
    std::vector<std::vector<double>> W, b;
    explicit Grads(const Mlp& net) {
        for (const Layer& L : net.layers) { W.emplace_back(L.W.size(), 0.0); b.emplace_back(L.nOut, 0.0); }
    }
    void zero() {
        for (auto& v : W) std::fill(v.begin(), v.end(), 0.0);
        for (auto& v : b) std::fill(v.begin(), v.end(), 0.0);
    }
    void scale(double k) {
        for (auto& v : W) for (double& x : v) x *= k;
        for (auto& v : b) for (double& x : v) x *= k;
    }
};

// Backpropagation for one example. ADDS dLoss/dW and dLoss/db to g.
// The output is one sigmoid neuron with cross-entropy loss, so its delta is p − y.
void backward(const Mlp& net, const Cache& c, double y, Grads& g) {
    std::vector<double> delta{ c.a.back()[0] - y };      // δ of the last layer
    for (std::size_t l = net.layers.size(); l-- > 0;) {
        const Layer& L = net.layers[l];
        const std::vector<double>& in = c.a[l];          // what this layer received
        for (std::size_t o = 0; o < L.nOut; ++o) {
            g.b[l][o] += delta[o];                        // dL/db = δ
            for (std::size_t i = 0; i < L.nIn; ++i)
                g.W[l][o * L.nIn + i] += delta[o] * in[i];   // dL/dw = δ × the input on that edge
        }
        if (l == 0) break;
        std::vector<double> prev(L.nIn);                  // δ of the layer below: (Wᵀδ) ⊙ act'(z)
        for (std::size_t i = 0; i < L.nIn; ++i) {
            double s = 0.0;
            for (std::size_t o = 0; o < L.nOut; ++o) s += L.W[o * L.nIn + i] * delta[o];
            prev[i] = s * slope(net.layers[l - 1].act, c.z[l - 1][i], in[i]);
        }
        delta = std::move(prev);
    }
}

// Mean cross-entropy over a data set (labels 0 or 1).
double meanLoss(const Mlp& net, const Dataset& ds) {
    double s = 0.0;
    for (std::size_t i = 0; i < ds.n; ++i) {
        const double p = std::clamp(net.predict(ds.row(i)), 1e-12, 1.0 - 1e-12);
        s -= ds.y[i] == 1.0 ? std::log(p) : std::log(1.0 - p);
    }
    return s / double(ds.n);
}

// Mean gradient over the whole data set.
Grads fullGradient(const Mlp& net, const Dataset& ds) {
    Grads g(net);
    Cache c;
    for (std::size_t i = 0; i < ds.n; ++i) { net.forward(ds.row(i), c); backward(net, c, ds.y[i], g); }
    g.scale(1.0 / double(ds.n));
    return g;
}`}</CodeBlock>
      <CodeBlock lang="cpp" filename="gradcheck.h" t={t}>{`#include "backprop.h"

// Compares every backprop derivative with a central difference. Returns the worst relative error.
double gradCheck(Mlp net, const Dataset& ds, double h = 1e-5) {    // net by value: we poke it
    const Grads g = fullGradient(net, ds);
    double worst = 0.0;
    auto check = [&](double& param, double analytic) {
        const double keep = param;
        param = keep + h; const double up   = meanLoss(net, ds);
        param = keep - h; const double down = meanLoss(net, ds);
        param = keep;
        const double numeric = (up - down) / (2.0 * h);
        const double rel = std::abs(analytic - numeric) / std::max({std::abs(analytic), std::abs(numeric), 1e-8});
        worst = std::max(worst, rel);
    };
    for (std::size_t l = 0; l < net.layers.size(); ++l) {
        for (std::size_t j = 0; j < net.layers[l].W.size(); ++j) check(net.layers[l].W[j], g.W[l][j]);
        for (std::size_t j = 0; j < net.layers[l].b.size(); ++j) check(net.layers[l].b[j], g.b[l][j]);
    }
    return worst;
}
// The worked network on the four XOR examples:   worst relative error 5.15e-08
// The worked example alone, x = (1, 0), y = 1:    p 0.5835, dW2 (-0.2689, -0.2187), db2 -0.4165,
//                                                 dW1 [[-0.0667, 0], [0.0623, 0]]`}</CodeBlock>

      <H2>{tx(t, "aiBp_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiBp_tMistake", "Mistake"), tx(t, "aiBp_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiBp_e1", "Updating a layer's weights before sending its delta back"), tx(t, "aiBp_e1b", "the layer below receives deltas computed with the new weights, a mix of two steps. Compute every gradient first, then update.")],
          [tx(t, "aiBp_e2", "Using W instead of Wᵀ"), tx(t, "aiBp_e2b", "with square layers it runs and gives wrong numbers; with other shapes it reads out of bounds. The delta of neuron i sums over the weights leaving i: column i of W.")],
          [tx(t, "aiBp_e3", "Forgetting the activation's slope, or taking it at the wrong value"), tx(t, "aiBp_e3b", "σ' is a(1 − a) with a the neuron's output, not z(1 − z). The gradient check catches it at once.")],
          [tx(t, "aiBp_e4", "Not storing the forward values"), tx(t, "aiBp_e4b", "backprop needs every z and a; recomputing them per weight throws away the whole speed-up. Keep the Cache.")],
          [tx(t, "aiBp_e5", "Forgetting to reset or average the gradients"), tx(t, "aiBp_e5b", "backward ADDS into g. Zero it before each batch and divide by the batch size, or the step size silently depends on the batch.")],
          [tx(t, "aiBp_e6", "Pairing a sigmoid output with squared error"), tx(t, "aiBp_e6b", "the output delta keeps a factor p(1 − p), so a confidently wrong neuron learns slowly. Use cross-entropy, whose delta is p − y.")],
          [tx(t, "aiBp_e7", "Trusting a training run instead of a gradient check"), tx(t, "aiBp_e7b", "a buggy gradient can still lower the loss for a while. Check against central differences first.")],
        ]}
      />

      <KeyIdeas t={t} id="aiBp" items={[
        "Backpropagation is the chain rule, evaluated from the loss backwards so that shared factors are computed once.",
        "A neuron's delta is ∂L/∂z: how the loss reacts to its weighted sum.",
        "With a sigmoid output and cross-entropy, the output delta is simply p − y.",
        "A weight's gradient is the delta of the neuron it enters times the input on its edge; a bias's gradient is the delta.",
        "Hidden deltas are (Wᵀδ) ⊙ f'(z): deltas flow back along the same weights, times the activation's slope.",
        "One backward pass costs about two forward passes, regardless of the number of weights: reverse-mode automatic differentiation.",
        "Always verify backprop against central differences on a tiny network; relative errors around 10⁻⁷ mean it is right.",
      ]} />
    </Article>
  );
}
