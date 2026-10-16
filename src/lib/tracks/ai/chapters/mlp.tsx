"use client";

// Neural Networks 2: the multi-layer perceptron — layers as matrices and the
// forward pass; smooth activations (sigmoid, tanh, ReLU) and their slopes;
// XOR with sigmoids worked by hand, the hidden plane (MlpXor figure, with the
// "no activation" break-it); why two linear layers collapse into one;
// counting parameters; universal approximation built from sigmoid steps
// (Approx figure); output layers and their losses; C++ (Layer, Cache, Mlp);
// mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { MlpXorFigure } from "@/components/lesson/figures/ai/MlpXorFigure";
import { ApproxFigure } from "@/components/lesson/figures/ai/ApproxFigure";

const r = String.raw;

export function MlpContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiMlp_intro",
          "The perceptron chapter ended with XOR: one neuron cannot compute it, but three neurons in two layers can. This chapter turns that trick into the most common shape of neural network, the multi-layer perceptron (MLP). Neurons are stacked in layers, each layer feeds the next, and the hard step is replaced by a smooth curve. You will compute a network's output by hand, see what a hidden layer does to the data, prove why the smooth curve is essential, and meet the theorem that says such a network can draw almost any function.")}
      </Lead>

      <Goals t={t} id="aiMlp" items={[
        "Compute the forward pass of a small network by hand.",
        "Write a layer as a matrix product plus an activation.",
        "Explain why a network without activations is just one linear model.",
        "Count the parameters of a network.",
        "Pick the output activation and loss for a task.",
      ]} />

      <H2>{tx(t, "aiMlp_layersTitle", "From one neuron to layers")}</H2>
      <p>
        {tx(t, "aiMlp_layersBody",
          "A layer is a row of neurons that all read the same inputs. Each neuron has its own weights and its own bias, so each one computes a different weighted sum of the same numbers. The outputs of a layer become the inputs of the next layer. The first layer reads the features; the last layer gives the answer; every layer in between is a hidden layer, because nobody tells it what to output.")}
      </p>
      <p>
        {tx(t, "aiMlp_matrixBody",
          "Writing every neuron separately quickly gets long, so put a layer's weights in a matrix. Row o holds the weights of neuron o, one column per input. Multiplying that matrix by the input vector computes all the weighted sums at once: entry o of the product is exactly row o dotted with the input. This is the matrix-times-vector product from the Math track, and it is why neural networks run so well on graphics cards.")}
      </p>
      <Equation label={tx(t, "aiMlp_eqLayer", "One layer of an MLP (the forward pass, layer by layer)")}
        where={[
          [r`l`, tx(t, "aiMlp_wL", "the layer number: 1 for the first hidden layer, up to L for the output layer")],
          [r`\mathbf{a}^{(0)} = \mathbf{x}`, tx(t, "aiMlp_wA0", "the input: the example's features. Layer 1 reads it")],
          [r`W^{(l)}`, tx(t, "aiMlp_wW", "the weight matrix of layer l: one row per neuron of the layer, one column per input it reads")],
          [r`\mathbf{b}^{(l)}`, tx(t, "aiMlp_wB", "the biases of layer l, one per neuron")],
          [r`\mathbf{z}^{(l)}`, tx(t, "aiMlp_wZ", "the pre-activations: every neuron's weighted sum plus bias, as a vector")],
          [r`f`, tx(t, "aiMlp_wF", "the activation function, applied to each entry of z separately")],
          [r`\mathbf{a}^{(l)}`, tx(t, "aiMlp_wA", "the activations: the layer's output, which is the next layer's input. The last one, a⁽ᴸ⁾, is the network's answer ŷ")],
        ]}>
        {r`\mathbf{z}^{(l)} = W^{(l)}\,\mathbf{a}^{(l-1)} + \mathbf{b}^{(l)}, \qquad \mathbf{a}^{(l)} = f\big(\mathbf{z}^{(l)}\big)`}
      </Equation>
      <LessonTable
        headers={[tx(t, "aiMlp_tThing", "Quantity"), tx(t, "aiMlp_tShape", "Shape"), tx(t, "aiMlp_tXor", "In the XOR network below")]}
        rows={[
          ["x", tx(t, "aiMlp_s1", "n₀ numbers (the features)"), "2"],
          ["W⁽ˡ⁾", tx(t, "aiMlp_s2", "nₗ rows × nₗ₋₁ columns"), tx(t, "aiMlp_s2x", "W⁽¹⁾ is 2 × 2, W⁽²⁾ is 1 × 2")],
          ["b⁽ˡ⁾, z⁽ˡ⁾, a⁽ˡ⁾", tx(t, "aiMlp_s3", "nₗ numbers (one per neuron)"), tx(t, "aiMlp_s3x", "2 in the hidden layer, 1 at the output")],
        ]}
      />
      <p>
        {tx(t, "aiMlp_shapeRule",
          "The shapes check themselves: a matrix with nₗ₋₁ columns can only multiply a vector of nₗ₋₁ numbers. If the dimensions do not match, the network is wired wrong. Running the layers in order, from the input to the output, is called the forward pass.")}
      </p>

      <H2>{tx(t, "aiMlp_actTitle", "Swapping the step for a smooth curve")}</H2>
      <p>
        {tx(t, "aiMlp_actBody",
          "The perceptron's step jumps from 0 to 1 and is flat everywhere else, so its slope is 0. The next chapter trains a network with derivatives, and a zero slope gives no signal at all. So an MLP uses activations that bend smoothly. Three are common:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiMlp_tAct", "Activation"), tx(t, "aiMlp_tFormula", "Formula"), tx(t, "aiMlp_tRange", "Output"), tx(t, "aiMlp_tSlope", "Slope"), tx(t, "aiMlp_tUse", "Used for")]}
        rows={[
          [tx(t, "aiMlp_sig", "sigmoid σ"), "1 / (1 + e⁻ᶻ)", tx(t, "aiMlp_sigR", "between 0 and 1"), "σ(z) (1 − σ(z)), " + tx(t, "aiMlp_atMost", "at most") + " 0.25", tx(t, "aiMlp_sigU", "output of a yes/no classifier; hidden layers in older networks")],
          ["tanh", "(eᶻ − e⁻ᶻ) / (eᶻ + e⁻ᶻ)", tx(t, "aiMlp_tanhR", "between −1 and 1"), "1 − tanh²(z), " + tx(t, "aiMlp_atMost", "at most") + " 1", tx(t, "aiMlp_tanhU", "hidden layers of small networks; centred on 0")],
          ["ReLU", "max(0, z)", tx(t, "aiMlp_reluR", "0 or more"), tx(t, "aiMlp_reluS", "1 when z > 0, else 0"), tx(t, "aiMlp_reluU", "hidden layers of almost every modern network")],
        ]}
      />
      <p>
        {tx(t, "aiMlp_actWhy",
          "tanh is a sigmoid stretched to run from −1 to 1: tanh(z) = 2σ(2z) − 1. ReLU, the rectified linear unit, simply cuts off the negative part. It is the cheapest to compute and, as the Training chapter shows, it keeps gradients alive in deep networks. Its slope jumps at 0, but only at that one point, which training never lands on exactly in practice. All three are monotonic: a larger z never gives a smaller output.")}
      </p>

      <H2>{tx(t, "aiMlp_xorTitle", "XOR with sigmoids, by hand")}</H2>
      <p>
        {tx(t, "aiMlp_xorBody",
          "Take the two-layer XOR circuit from the last chapter, h₁ = OR, h₂ = NAND, ŷ = AND, and replace each step by a sigmoid. A sigmoid only behaves like a step when its input is large, so multiply every weight and bias by a steepness k. With k = 10:")}
      </p>
      <Equation label={tx(t, "aiMlp_eqXor", "The XOR network with k = 10")}
        where={[
          [r`h_1`, tx(t, "aiMlp_wH1", "a soft OR: close to 1 as soon as one input is 1")],
          [r`h_2`, tx(t, "aiMlp_wH2", "a soft NAND: close to 0 only when both inputs are 1")],
          [r`\hat y`, tx(t, "aiMlp_wYhat", "a soft AND of h₁ and h₂: the network's answer, read as the probability that XOR is 1")],
        ]}>
        {r`\begin{gathered} W^{(1)} = \begin{bmatrix} 10 & 10 \\ -10 & -10 \end{bmatrix},\quad \mathbf{b}^{(1)} = \begin{bmatrix} -5 \\ 15 \end{bmatrix} \\[4pt] W^{(2)} = \begin{bmatrix} 10 & 10 \end{bmatrix},\quad b^{(2)} = -15 \end{gathered}`}
      </Equation>
      <p>
        {tx(t, "aiMlp_xorWalk", "Run the forward pass for x = (1, 0), the inputs whose XOR is 1:")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiMlp_w1", "Hidden pre-activations: z⁽¹⁾ = W⁽¹⁾x + b⁽¹⁾. Row 1: 10·1 + 10·0 − 5 = 5. Row 2: −10·1 − 10·0 + 15 = 5.")}</li>
        <li>{tx(t, "aiMlp_w2", "Hidden activations: h = (σ(5), σ(5)) = (0.9933, 0.9933). σ(5) = 1/(1 + e⁻⁵) = 1/(1 + 0.00674).")}</li>
        <li>{tx(t, "aiMlp_w3", "Output pre-activation: z⁽²⁾ = 10·0.9933 + 10·0.9933 − 15 = 4.866.")}</li>
        <li>{tx(t, "aiMlp_w4", "Output: ŷ = σ(4.866) = 0.9924. The network is 99.2 % sure that XOR(1, 0) = 1.")}</li>
      </ol>
      <LessonTable
        headers={["x", "z⁽¹⁾", "h = σ(z⁽¹⁾)", "z⁽²⁾", "ŷ", tx(t, "aiMlp_tTruth", "XOR")]}
        rows={[
          ["(0, 0)", "(−5, 15)", "(0.0067, 1.0000)", "−4.93", "0.0072", "0"],
          ["(0, 1)", "(5, 5)", "(0.9933, 0.9933)", "4.87", "0.9924", "1"],
          ["(1, 0)", "(5, 5)", "(0.9933, 0.9933)", "4.87", "0.9924", "1"],
          ["(1, 1)", "(15, −5)", "(1.0000, 0.0067)", "−4.93", "0.0072", "0"],
        ]}
      />
      <p>
        {tx(t, "aiMlp_kBody",
          "The steepness matters. At k = 2 the sigmoids are so soft that the network outputs 0.481 for (0, 1): just under one half, so the answer is wrong. The network gets all four corners right from about k = 2.2 upwards, and the larger k is, the more confident it becomes. Training, in the next chapters, will find such weights by itself, and it will not find these exact ones: any weights that put the four corners on the right sides will do.")}
      </p>
      <H3>{tx(t, "aiMlp_hiddenTitle", "What the hidden layer does to the data")}</H3>
      <p>
        {tx(t, "aiMlp_hiddenBody",
          "Look at the hidden activations as points in a new plane, with h₁ across and h₂ up. The corners (0, 1) and (1, 0) both land near (1, 1). The corner (0, 0) lands near (0, 1) and (1, 1) lands near (1, 0). In that plane the output neuron is one ordinary straight line, h₁ + h₂ = 1.5, and the two XOR-true points sit alone on its far side. The hidden layer has bent the input square so that a line is enough. In the figure, the faint grid shows how the whole square is folded, not only the four corners.")}
      </p>
      <MlpXorFigure t={t} />

      <H3>{tx(t, "aiMlp_linearTitle", "Why the activation is essential")}</H3>
      <p>
        {tx(t, "aiMlp_linearBody",
          "Remove the activations, so each layer just computes Wa + b. Then two layers collapse into one. Substitute the first layer into the second:")}
      </p>
      <Equation label={tx(t, "aiMlp_eqCollapse", "Two linear layers are one linear layer")}
        where={[
          [r`W^{(2)}W^{(1)}`, tx(t, "aiMlp_wWW", "the product of two matrices is just another matrix: call it W")],
          [r`W^{(2)}\mathbf{b}^{(1)} + \mathbf{b}^{(2)}`, tx(t, "aiMlp_wBB", "a fixed vector, the same for every input: call it b")],
        ]}>
        {r`W^{(2)}\big(W^{(1)}\mathbf{x} + \mathbf{b}^{(1)}\big) + \mathbf{b}^{(2)} = \underbrace{W^{(2)}W^{(1)}}_{W}\,\mathbf{x} + \underbrace{W^{(2)}\mathbf{b}^{(1)} + \mathbf{b}^{(2)}}_{\mathbf{b}}`}
      </Equation>
      <p>
        {tx(t, "aiMlp_linearMore",
          "The right side is a single layer, Wx + b. By the same argument, a hundred linear layers are still one linear layer, and a single linear layer followed by a sigmoid output is plain logistic regression: one straight boundary. All the extra depth buys nothing. Choose \"no activation\" in the figure: every point of the square lands on one straight line in the hidden plane, the two green corners land between the red ones, and no line can cut out the middle of a line. The non-linear activation is what lets a network bend space.")}
      </p>

      <H2>{tx(t, "aiMlp_countTitle", "Counting parameters")}</H2>
      <p>
        {tx(t, "aiMlp_countBody",
          "Every weight and every bias is a parameter that training must set. A layer with nᵢₙ inputs and nₒᵤₜ neurons has nᵢₙ × nₒᵤₜ weights (one per connection) and nₒᵤₜ biases. Add up the layers:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiMlp_tNet", "Network"), tx(t, "aiMlp_tCount", "Parameters"), tx(t, "aiMlp_tHow", "Sum")]}
        rows={[
          ["2 → 2 → 1 (XOR)", "9", "(2·2 + 2) + (2·1 + 1)"],
          ["2 → 32 → 32 → 1", "1 185", "(2·32 + 32) + (32·32 + 32) + (32·1 + 1)"],
          [tx(t, "aiMlp_mnist", "784 → 128 → 10 (28 × 28-pixel digits, 10 classes)"), "101 770", "(784·128 + 128) + (128·10 + 10)"],
        ]}
      />
      <p>
        {tx(t, "aiMlp_countMore",
          "The counts grow with the product of neighbouring layer widths, so the first layer of an image network is usually the expensive one. The 2 → 32 → 32 → 1 network will appear again in the Regularisation chapter: 1 185 parameters trained on just 100 points, which is exactly how a network learns noise.")}
      </p>

      <H2>{tx(t, "aiMlp_uatTitle", "What a network can draw: universal approximation")}</H2>
      <p>
        {tx(t, "aiMlp_uatBody",
          "How flexible is a single hidden layer? Here is a construction you can follow by hand. Take a target curve f on the interval from 0 to 1. A very steep sigmoid, σ(s(x − m)), is a step that jumps from 0 to 1 at x = m. Split the interval into N small pieces and put one hidden neuron at each boundary. The output neuron is linear: it starts at f(0) and adds each step, multiplied by how much f rises over that piece, f(xᵢ) − f(xᵢ₋₁). A falling piece gets a negative weight. The sum is a staircase that follows f, and with more neurons the stairs get smaller.")}
      </p>
      <ApproxFigure t={t} />
      <p>
        {tx(t, "aiMlp_uatTheorem",
          "This is the idea behind the universal approximation theorem (George Cybenko, 1989, for sigmoids; Kurt Hornik, 1991, for any non-polynomial activation). It says: for any continuous function on a bounded region and any tolerance, a network with one hidden layer and enough neurons comes within that tolerance everywhere. In two or more dimensions the same idea works with bumps instead of steps.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "aiMlp_uatWarn", "Read the theorem carefully. It promises that good weights exist; it does not say that training will find them, how many neurons you will need (it can be astronomically many), or that the network will do well on data it has not seen. In practice, several narrower layers usually need far fewer neurons than one very wide layer, because each layer can reuse the shapes the previous one built. That is why networks got deep.")}
      </Callout>

      <H2>{tx(t, "aiMlp_outTitle", "The output layer and its loss")}</H2>
      <p>
        {tx(t, "aiMlp_outBody",
          "Hidden layers can use any of the activations above, but the last layer must produce the kind of answer the task needs. Each choice comes paired with the loss from the earlier chapters:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiMlp_tTask", "Task"), tx(t, "aiMlp_tOutAct", "Output layer"), tx(t, "aiMlp_tLoss", "Loss"), tx(t, "aiMlp_tSeen", "Seen in")]}
        rows={[
          [tx(t, "aiMlp_o1", "regression: a number (a price, a time)"), tx(t, "aiMlp_o1a", "one neuron, no activation (linear)"), tx(t, "aiMlp_o1l", "mean squared error"), tx(t, "aiMlp_o1s", "Linear Regression")],
          [tx(t, "aiMlp_o2", "two classes (pass / fail)"), tx(t, "aiMlp_o2a", "one sigmoid neuron: the probability of class 1"), tx(t, "aiMlp_o2l", "cross-entropy"), tx(t, "aiMlp_o2s", "Logistic Regression")],
          [tx(t, "aiMlp_o3", "K classes (which digit)"), tx(t, "aiMlp_o3a", "K neurons and a softmax: K probabilities that add up to 1"), tx(t, "aiMlp_o3l", "cross-entropy"), tx(t, "aiMlp_o3s", "Logistic Regression (softmax)")],
        ]}
      />
      <p>
        {tx(t, "aiMlp_outMore",
          "Seen this way, logistic regression is an MLP with no hidden layer, and an MLP is logistic regression on top of features that the hidden layers learn by themselves. In the earlier chapters you chose the features; here the network builds them. The rest of this section uses one sigmoid output with cross-entropy, so the examples stay two-class.")}
      </p>

      <H2>{tx(t, "aiMlp_codeTitle", "In C++")}</H2>
      <p>
        {tx(t, "aiMlp_codeBody",
          "A layer stores its weight matrix row by row in one vector, the same layout as the Dataset. The forward pass keeps every z and every activation in a Cache, because backpropagation (next chapter) needs them. The output is a vector even when it has one entry, so the same code serves every network.")}
      </p>
      <CodeBlock lang="cpp" filename="mlp.h" t={t}>{`#include <cmath>
#include <utility>
#include <vector>
#include "dataset.h"                                      // Dataset from the Data chapter

enum class Act { Sigmoid, Tanh, ReLU, Linear };

double activate(Act a, double z) {
    switch (a) {
        case Act::Sigmoid: return 1.0 / (1.0 + std::exp(-z));
        case Act::Tanh:    return std::tanh(z);
        case Act::ReLU:    return z > 0.0 ? z : 0.0;
        default:           return z;                      // Linear: no activation
    }
}

struct Layer {
    std::size_t nIn, nOut;
    std::vector<double> W;                                // nOut rows of nIn: W[o * nIn + i] links input i to neuron o
    std::vector<double> b;                                // one bias per neuron
    Act act;
    Layer(std::size_t in, std::size_t out, Act a) : nIn(in), nOut(out), W(in * out, 0.0), b(out, 0.0), act(a) {}
};

// What the forward pass keeps for the backward pass (next chapter).
struct Cache {
    std::vector<std::vector<double>> a;                   // a[0] = x, a[l + 1] = output of layer l
    std::vector<std::vector<double>> z;                   // z[l] = pre-activations of layer l
};

struct Mlp {
    std::vector<Layer> layers;

    // sizes = {inputs, hidden..., outputs}. Hidden layers use \`hidden\`, the last layer uses \`out\`.
    Mlp(const std::vector<std::size_t>& sizes, Act hidden, Act out) {
        for (std::size_t l = 1; l < sizes.size(); ++l)
            layers.emplace_back(sizes[l - 1], sizes[l], l + 1 == sizes.size() ? out : hidden);
    }

    void forward(const double* x, Cache& c) const {
        c.a.assign(1, std::vector<double>(x, x + layers.front().nIn));
        c.z.clear();
        for (const Layer& L : layers) {
            const std::vector<double>& in = c.a.back();
            std::vector<double> z(L.nOut), out(L.nOut);
            for (std::size_t o = 0; o < L.nOut; ++o) {    // one neuron: z = w · in + b, then the activation
                double s = L.b[o];
                for (std::size_t i = 0; i < L.nIn; ++i) s += L.W[o * L.nIn + i] * in[i];
                z[o] = s;
                out[o] = activate(L.act, s);
            }
            c.z.push_back(std::move(z));
            c.a.push_back(std::move(out));                // this layer's output is the next layer's input
        }
    }

    double predict(const double* x) const { Cache c; forward(x, c); return c.a.back()[0]; }

    std::size_t paramCount() const {
        std::size_t n = 0;
        for (const Layer& L : layers) n += L.W.size() + L.b.size();
        return n;
    }
};`}</CodeBlock>
      <CodeBlock lang="cpp" filename="xor.cpp" t={t}>{`#include <cstdio>
#include "mlp.h"

int main() {
    Mlp net({2, 2, 1}, Act::Sigmoid, Act::Sigmoid);
    net.layers[0].W = {10, 10, -10, -10};  net.layers[0].b = {-5, 15};   // h1 = soft OR, h2 = soft NAND
    net.layers[1].W = {10, 10};            net.layers[1].b = {-15};      // y = soft AND
    const double corners[4][2] = {{0, 0}, {0, 1}, {1, 0}, {1, 1}};
    for (const auto& x : corners) std::printf("XOR(%g, %g) = %.4f\\n", x[0], x[1], net.predict(x));
    std::printf("%zu parameters\\n", net.paramCount());
}
// XOR(0, 0) = 0.0072
// XOR(0, 1) = 0.9924
// XOR(1, 0) = 0.9924
// XOR(1, 1) = 0.0072
// 9 parameters`}</CodeBlock>

      <H2>{tx(t, "aiMlp_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiMlp_tMistake", "Mistake"), tx(t, "aiMlp_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiMlp_e1", "No activation between layers"), tx(t, "aiMlp_e1b", "the layers collapse into one linear model, so the network can only draw a straight boundary. Put a non-linear activation after every hidden layer.")],
          [tx(t, "aiMlp_e2", "Weight matrix stored transposed"), tx(t, "aiMlp_e2b", "with square layers it even runs, but every neuron reads the wrong weights. Fix one convention (here: row = neuron, column = input) and check the shapes.")],
          [tx(t, "aiMlp_e3", "Sigmoid on the output of a regression"), tx(t, "aiMlp_e3b", "the prediction can never leave (0, 1), so a price of 300 is unreachable. A regression output has no activation.")],
          [tx(t, "aiMlp_e4", "Reading ŷ = 0.5 as \"half right\""), tx(t, "aiMlp_e4b", "a sigmoid output is a probability, and 0.5 means the network has no idea. Decide with a threshold, as in the Generalisation chapter.")],
          [tx(t, "aiMlp_e5", "Believing the universal approximation theorem guarantees success"), tx(t, "aiMlp_e5b", "it only says suitable weights exist. Training can still fail to find them, and a network that fits the training data can still fail on new data.")],
          [tx(t, "aiMlp_e6", "Forgetting the biases when counting parameters"), tx(t, "aiMlp_e6b", "each layer has one bias per neuron as well as nᵢₙ × nₒᵤₜ weights. Count both; the code's paramCount does.")],
        ]}
      />

      <KeyIdeas t={t} id="aiMlp" items={[
        "An MLP is layers of neurons; each layer computes a = f(W a_prev + b), and its output feeds the next layer.",
        "Row o of W holds the weights of neuron o; the matrix product computes every neuron's weighted sum at once.",
        "Smooth activations (sigmoid, tanh, ReLU) replace the step, so the network has useful slopes to learn from.",
        "A hidden layer moves the data into a new space where the next layer's straight line is enough: XOR becomes separable.",
        "Without non-linear activations, any number of layers collapses into one linear layer.",
        "One hidden layer with enough neurons can approximate any continuous function, but the theorem does not say training will find the weights.",
        "The output layer matches the task: linear + MSE for numbers, sigmoid + cross-entropy for two classes, softmax + cross-entropy for many.",
      ]} />
    </Article>
  );
}
