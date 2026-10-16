"use client";

// Deep Learning 1: convolutional networks — why a dense layer is the wrong
// tool for images; convolution as one small filter slid everywhere (Conv
// figure, worked edge example); padding, stride and the output size; channels
// and the parameter count; pooling and the receptive field; softmax for many
// classes; the STROKES shift experiment (Shift figure, dense 4 739 vs CNN 55
// parameters, measured); backprop through a convolution; famous CNNs; C++
// (conv2d, Cnn, backward); mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { ConvFigure } from "@/components/lesson/figures/ai/ConvFigure";
import { ShiftFigure } from "@/components/lesson/figures/ai/ShiftFigure";

const r = String.raw;

export function CnnContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiCnn_intro",
          "The networks so far took a short list of numbers, such as hours of study and hours of sleep. An image is also a list of numbers, one per pixel, so a multi-layer perceptron could read it. It would do badly, and it would need far too many weights. This chapter builds the network that made computer vision work: the convolutional neural network, or CNN. Its one idea is to look at an image through a small window and use the same window everywhere.")}
      </Lead>

      <Goals t={t} id="aiCnn" items={[
        "Compute a convolution by hand and predict the output size from padding and stride.",
        "Count the parameters of a convolutional layer and compare them with a dense layer.",
        "Use softmax and cross-entropy for more than two classes.",
        "Explain, with a measured experiment, why weight sharing and pooling make a CNN robust to shifts.",
      ]} />

      <H2>{tx(t, "aiCnn_gridTitle", "An image is a grid of numbers")}</H2>
      <p>
        {tx(t, "aiCnn_gridBody",
          "A grayscale image of 12 × 12 pixels is 144 numbers between 0 (black) and 1 (white). A colour photo of 224 × 224 pixels, the size most classic vision networks use, has three numbers per pixel (red, green, blue): 224 · 224 · 3 = 150 528 numbers. Flatten them into one vector and you can feed them to an MLP. Two problems appear at once.")}
      </p>
      <LessonTable
        headers={[tx(t, "aiCnn_tProblem", "Problem"), tx(t, "aiCnn_tWhy", "Why it hurts")]}
        rows={[
          [tx(t, "aiCnn_p1", "Too many weights"), tx(t, "aiCnn_p1b", "a first hidden layer of 1 000 neurons on that photo needs 150 528 · 1 000 ≈ 150 million weights, for one layer. Each one must be learned from data.")],
          [tx(t, "aiCnn_p2", "No idea of position"), tx(t, "aiCnn_p2b", "each pixel has its own weight, so a cat in the top-left corner and the same cat in the bottom-right corner reach completely different weights. The network has to learn the cat again at every position.")],
          [tx(t, "aiCnn_p3", "Neighbours ignored"), tx(t, "aiCnn_p3b", "flattening forgets which pixels are next to each other. Shuffle the pixels the same way in every image and an MLP learns exactly as well, a sign that it does not use the picture's structure at all.")],
        ]}
      />
      <p>
        {tx(t, "aiCnn_gridIdea",
          "What matters in an image is local: an edge, a corner, a patch of fur is a small group of neighbouring pixels. And it matters wherever it appears: an edge is an edge in any corner. A CNN builds both facts into its structure.")}
      </p>

      <H2>{tx(t, "aiCnn_convTitle", "Convolution: one small filter, used everywhere")}</H2>
      <p>
        {tx(t, "aiCnn_convBody",
          "Take a small grid of weights, typically 3 × 3, called a kernel or filter. Place it on the top-left corner of the image, multiply each of its 9 weights by the pixel under it, and add the 9 products and a bias. That sum is one number of the output. Move the filter one pixel to the right and do it again, then again, row after row. The grid of sums is called a feature map: it says how strongly the pattern of the filter appears at each place.")}
      </p>
      <Equation label={tx(t, "aiCnn_eqConv", "One output pixel of a convolution")}
        where={[
          [r`y_{r,c}`, tx(t, "aiCnn_wY", "the output (the feature map) at row r, column c")],
          [r`x`, tx(t, "aiCnn_wX", "the input image; x with two indices is one pixel")],
          [r`w_{i,j}`, tx(t, "aiCnn_wW", "the kernel's weight at row i, column j; i and j run over 0, 1, 2 for a 3 × 3 kernel")],
          [r`b`, tx(t, "aiCnn_wB", "the filter's bias, one number added to every output pixel")],
          [r`k`, tx(t, "aiCnn_wK", "the kernel size (3 here)")],
        ]}>
        {r`y_{r,c} = b + \sum_{i=0}^{k-1} \sum_{j=0}^{k-1} w_{i,j}\; x_{r+i,\;c+j}`}
      </Equation>
      <p>
        {tx(t, "aiCnn_convNeuron",
          "Look at it as a neuron: a weighted sum of inputs plus a bias, exactly the z of the perceptron. Two things are different. Each output neuron is connected only to the 9 pixels under the window, not to all of them (local connections). And every output neuron uses the same 9 weights (weight sharing). A whole feature map costs 10 parameters, whatever the size of the image.")}
      </p>
      <ConvFigure t={t} />
      <p>
        {tx(t, "aiCnn_convWorked",
          "Work one by hand. The vertical-edge kernel has the column (−1, −1, −1) on the left, zeros in the middle and (1, 1, 1) on the right, so it computes \"right column minus left column\". Put it over a dark area and both columns are 0: output 0. Put it with its right column on the left side of a bright square and its left column outside: three pixels of 1 minus three of 0 gives 3. On the square's right side it is the opposite: −3. Inside the square, 3 − 3 = 0. One row of the feature map for the 4 × 4 square reads 3, 3, 0, 0, −3, −3: the filter has found the two vertical edges and nothing else.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "aiCnn_xcorr", "In mathematics, a convolution flips the kernel before sliding it: x with index r − i, not r + i. What deep learning calls convolution is really cross-correlation, without the flip. Since the weights are learned, it makes no difference: a network would simply learn the flipped kernel. Every library uses the unflipped form, and so does this chapter.")}
      </Callout>

      <H3>{tx(t, "aiCnn_padTitle", "Padding and stride")}</H3>
      <p>
        {tx(t, "aiCnn_padBody",
          "A 3 × 3 window fits in 6 positions across an 8-pixel row, so the output shrinks to 6 × 6. To keep the size, add a ring of zeros around the image before sliding: padding. To make the output smaller on purpose, move the window more than one pixel at a time: the stride. Both settle the output size.")}
      </p>
      <Equation label={tx(t, "aiCnn_eqSize", "Output size of a convolution")}
        where={[
          [r`n`, tx(t, "aiCnn_wN", "the input's width (and height, for a square image)")],
          [r`k`, tx(t, "aiCnn_wK2", "the kernel size")],
          [r`p`, tx(t, "aiCnn_wP", "the padding: rings of zeros added on each side")],
          [r`s`, tx(t, "aiCnn_wS", "the stride: how many pixels the window moves per step")],
          [r`\lfloor\cdot\rfloor`, tx(t, "aiCnn_wFloor", "rounding down: a window that would hang over the edge is not used")],
        ]}>
        {r`n_{\text{out}} = \left\lfloor \frac{n + 2p - k}{s} \right\rfloor + 1`}
      </Equation>
      <LessonTable
        headers={["n", "k", "p", "s", tx(t, "aiCnn_tOut", "Output"), tx(t, "aiCnn_tNote", "Note")]}
        rows={[
          ["8", "3", "0", "1", "6", tx(t, "aiCnn_s1", "\"valid\": no padding, the map shrinks by k − 1")],
          ["8", "3", "1", "1", "8", tx(t, "aiCnn_s2", "\"same\": p = (k − 1)/2 keeps the size")],
          ["8", "3", "0", "2", "3", tx(t, "aiCnn_s3", "(8 − 3)/2 = 2.5, rounded down to 2, plus 1")],
          ["224", "7", "3", "2", "112", tx(t, "aiCnn_s4", "the first layer of ResNet: halves a photo at once")],
        ]}
      />

      <H2>{tx(t, "aiCnn_chanTitle", "Channels: many filters, many maps")}</H2>
      <p>
        {tx(t, "aiCnn_chanBody",
          "One filter finds one kind of pattern. A convolutional layer has many filters, each with its own weights, and produces one feature map per filter. The stack of maps is the layer's output, and its depth is called the number of channels. A colour image already has 3 channels, so a filter on it is 3 × 3 × 3: it covers the same 3 × 3 window in all three colours at once and adds 27 products. In general a filter has the full depth of its input.")}
      </p>
      <Equation label={tx(t, "aiCnn_eqParams", "Parameters of a convolutional layer")}
        where={[
          [r`k`, tx(t, "aiCnn_wK3", "the kernel size")],
          [r`C_{\text{in}}`, tx(t, "aiCnn_wCin", "the channels of the input (3 for a colour image)")],
          [r`C_{\text{out}}`, tx(t, "aiCnn_wCout", "the number of filters, which is the number of output channels")],
          [r`+1`, tx(t, "aiCnn_wPlus", "each filter's bias")],
        ]}>
        {r`\text{params} = (k \cdot k \cdot C_{\text{in}} + 1)\cdot C_{\text{out}}`}
      </Equation>
      <p>
        {tx(t, "aiCnn_chanCount",
          "A first layer with 64 filters of 3 × 3 on a colour photo has (3 · 3 · 3 + 1) · 64 = 1 792 parameters, and it produces 64 maps of 224 × 224, as many outputs as a dense layer with 3.2 million neurons, which would need about 483 billion weights. Note what the count does not contain: the image size. The same 1 792 weights work on a photo of any size.")}
      </p>

      <H2>{tx(t, "aiCnn_poolTitle", "Pooling and the receptive field")}</H2>
      <p>
        {tx(t, "aiCnn_poolBody",
          "After a convolution and a ReLU, CNNs usually shrink the maps with pooling. A 2 × 2 max pool with stride 2 cuts each map into 2 × 2 blocks and keeps only the largest number of each block: a 224 × 224 map becomes 112 × 112. Pooling has no weights. It keeps the answer to \"was the pattern here, roughly?\" and drops its exact position, so a shift of one pixel barely changes the result. Taken to the limit, a global max pool keeps one number per map: the strongest match anywhere in the image.")}
      </p>
      <p>
        {tx(t, "aiCnn_rf",
          "Stacking layers widens what each output sees. A neuron after one 3 × 3 convolution depends on a 3 × 3 patch of the image, its receptive field. After two such layers it depends on 5 × 5 pixels, after three on 7 × 7: each layer adds k − 1 = 2. Pooling multiplies the growth, since every step on a pooled map is two steps on the map before it. So the first layers find edges, the next combine edges into corners and textures, and deep layers see shapes as large as the image: eyes, wheels, letters.")}
      </p>
      <Equation label={tx(t, "aiCnn_eqRf", "Receptive field of L stacked convolutions (stride 1, no pooling)")}
        where={[
          [r`L`, tx(t, "aiCnn_wL", "the number of convolutional layers")],
          [r`k`, tx(t, "aiCnn_wK4", "the kernel size of each layer")],
        ]}>
        {r`\text{RF} = 1 + L\,(k-1)`}
      </Equation>

      <H2>{tx(t, "aiCnn_softTitle", "Softmax: choosing between many classes")}</H2>
      <p>
        {tx(t, "aiCnn_softBody",
          "Until now the output was one sigmoid neuron: a probability for \"class 1\". An image classifier has many classes, so it has one output neuron per class, and those raw outputs, called logits, must become probabilities that are positive and add up to 1. The softmax function does that.")}
      </p>
      <Equation label={tx(t, "aiCnn_eqSoft", "Softmax, the loss, and the gradient of the loss")}
        where={[
          [r`z_i`, tx(t, "aiCnn_wZ", "the logit of class i: the output neuron's weighted sum, before any activation")],
          [r`e^{z_i}`, tx(t, "aiCnn_wE", "e (≈ 2.718) to the power z_i: always positive, and larger logits grow fast")],
          [r`p_i`, tx(t, "aiCnn_wPi", "the probability the network gives to class i; the denominator makes them add up to 1")],
          [r`y`, tx(t, "aiCnn_wYc", "the index of the correct class")],
          [r`L`, tx(t, "aiCnn_wLoss", "the cross-entropy loss: minus the log of the probability given to the right class")],
          [r`[i = y]`, tx(t, "aiCnn_wInd", "1 if i is the correct class, 0 otherwise")],
        ]}>
        {r`p_i = \frac{e^{z_i}}{\sum_j e^{z_j}}, \qquad L = -\ln p_y, \qquad \frac{\partial L}{\partial z_i} = p_i - [i = y]`}
      </Equation>
      <p>
        {tx(t, "aiCnn_softWorked",
          "With logits (2, 1, 0.1): e² = 7.389, e¹ = 2.718, e^0.1 = 1.105, total 11.212, so p = (0.659, 0.242, 0.099). If class 0 is right, the loss is −ln 0.659 = 0.417 and the gradient of the logits is (0.659 − 1, 0.242, 0.099) = (−0.341, 0.242, 0.099): push the right logit up, the others down, each in proportion to how much probability it took. It is the same p − y as the sigmoid's in the Logistic Regression chapter; with two classes, softmax is the sigmoid. In code, subtract the largest logit before taking e^z: the probabilities do not change (the same factor cancels above and below), and e^1000 can no longer overflow.")}
      </p>

      <H2>{tx(t, "aiCnn_expTitle", "An experiment: shift the stroke")}</H2>
      <p>
        {tx(t, "aiCnn_expBody",
          "Here is the difference measured. The STROKES data set has 12 × 12 images with one short stroke of 5 pixels, in three classes: horizontal (—), vertical (|) and diagonal (/), with a random brightness and a little noise. The 300 training images all have their stroke in the left half. The test images have it in the right half: the same task, in a place the networks have never seen.")}
      </p>
      <LessonTable
        headers={[tx(t, "aiCnn_tNet", "Network"), tx(t, "aiCnn_tParams", "Parameters"), tx(t, "aiCnn_tLeft", "Training strokes (left)"), tx(t, "aiCnn_tRight", "Test strokes (right)")]}
        rows={[
          [tx(t, "aiCnn_n1", "dense: 144 → 32 ReLU → 3 softmax"), "144·32 + 32 + 32·3 + 3 = 4 739", "100 %", "48 %"],
          [tx(t, "aiCnn_n2", "CNN: 4 filters 3×3 → ReLU → global max pool → 3 softmax"), "4·9 + 4 + 3·4 + 3 = 55", "100 %", "100 %"],
        ]}
      />
      <ShiftFigure t={t} />
      <p>
        {tx(t, "aiCnn_expWhy",
          "Both use Adam with η = 0.003 and batches of 10, and both get every training image right after about 10 epochs. On the shifted strokes the dense network falls to 48 % after 40 epochs (chance is 33 %): it calls a vertical stroke in column 7 horizontal, with 89 % confidence. Its weights for the right-hand pixels were never pushed anywhere useful, because no training stroke ever lit them. The CNN scores 100 %, with 86 times fewer parameters. Two properties do it. Weight sharing makes the convolution equivariant: shift the image and the feature map shifts by the same amount, unchanged. The global max pool then makes the whole network invariant: it only asks how strong the best match is, not where it is.")}
      </p>
      <p>
        {tx(t, "aiCnn_expFilters",
          "The four learned filters, drawn under the bars, do not look like the neat edge kernels of the first figure. They do not need to: the dense layer after the pool only needs them to respond differently to the three strokes. Learned filters in the first layer of a large photo network, on the other hand, famously do look like edge and colour detectors, because that is what the first step of seeing anything needs.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "aiCnn_notInvariant", "A CNN is robust to shifts, not to everything. Rotate the strokes or scale them and the filters must learn each version, as a dense network learns each position. Real CNNs are also not perfectly shift-invariant, because pooling with stride 2 depends on where the 2 × 2 blocks fall. Data augmentation (Regularisation chapter) fills those gaps.")}
      </Callout>

      <H2>{tx(t, "aiCnn_bpTitle", "Backpropagation through a convolution")}</H2>
      <p>
        {tx(t, "aiCnn_bpBody",
          "Nothing new is needed, only care with the sharing. Each weight w_ij is used at every output position, so by the chain rule its gradient is the sum, over all positions, of that output's delta times the input pixel the weight was multiplied by there. That sum is itself a sliding product: the input correlated with the map of deltas.")}
      </p>
      <Equation label={tx(t, "aiCnn_eqBp", "Gradients of a convolutional layer")}
        where={[
          [r`\delta_{r,c}`, tx(t, "aiCnn_wDelta", "∂L/∂y at output (r, c): the delta that backprop brings from the layers above")],
          [r`\frac{\partial L}{\partial w_{i,j}}`, tx(t, "aiCnn_wGw", "the gradient of one kernel weight: summed over every place that weight was used")],
          [r`\frac{\partial L}{\partial b}`, tx(t, "aiCnn_wGb", "the bias touches every output, so its gradient is the sum of all deltas")],
        ]}>
        {r`\frac{\partial L}{\partial w_{i,j}} = \sum_{r,c} \delta_{r,c}\; x_{r+i,\;c+j}, \qquad \frac{\partial L}{\partial b} = \sum_{r,c} \delta_{r,c}`}
      </Equation>
      <p>
        {tx(t, "aiCnn_bpPool",
          "Pooling and ReLU route the deltas. A max pool passes its delta only to the position that won the max; the other positions had no effect on the output, so their gradient is 0. ReLU passes the delta only where its input was positive. In the STROKES CNN the global max pool sends each filter's delta to a single position, so the gradient of each filter is just the delta times the 3 × 3 patch under its best match: the filter is pulled towards the patch it already likes, if that helped the right class, or away from it otherwise.")}
      </p>

      <H2>{tx(t, "aiCnn_famTitle", "Famous CNNs")}</H2>
      <LessonTable
        headers={[tx(t, "aiCnn_tName", "Network"), tx(t, "aiCnn_tYear", "Year"), tx(t, "aiCnn_tParams", "Parameters"), tx(t, "aiCnn_tIdea", "What it showed")]}
        rows={[
          ["LeNet-5", "1998", "≈ 60 000", tx(t, "aiCnn_f1", "conv → pool → conv → pool → dense reads handwritten digits on cheques (LeCun and others)")],
          ["AlexNet", "2012", "≈ 60 M", tx(t, "aiCnn_f2", "trained on GPUs with ReLU and dropout, it won ImageNet (1.2 million photos, 1 000 classes) with 15.3 % top-5 error against 26.2 % for the next entry, and started the deep-learning boom")],
          ["VGG-16", "2014", "≈ 138 M", tx(t, "aiCnn_f3", "only 3 × 3 kernels, 16 layers: two 3 × 3 layers see as much as one 5 × 5 with fewer weights (18 against 25 per channel pair)")],
          ["ResNet", "2015", tx(t, "aiCnn_f4p", "25.6 M (50 layers)"), tx(t, "aiCnn_f4", "residual connections y = x + F(x) let 152 layers train; 3.57 % top-5 error, below the ≈ 5 % estimated for a human")],
        ]}
      />
      <p>
        {tx(t, "aiCnn_resnet",
          "The residual connection deserves a second look, because the next chapters use it everywhere. A block computes F(x) and adds its own input back: y = x + F(x). The gradient of y with respect to x is then 1 + ∂F/∂x, so even when ∂F/∂x is tiny, the gradient passes through each block undamaged. That cures the vanishing gradient of the Training chapter's ten-layer experiment and lets networks grow to hundreds of layers. Every transformer block is built the same way.")}
      </p>

      <H2>{tx(t, "aiCnn_codeTitle", "In C++")}</H2>
      <p>
        {tx(t, "aiCnn_codeBody",
          "The STROKES CNN, complete: conv2d (with padding and stride, for the general case), softmax, the network's forward pass, and backpropagation through the dense layer, the max pool, the ReLU and the filters. Trained with a plain Adam on 300 left-half strokes, it scores 100 % on the right-half ones after 5 epochs.")}
      </p>
      <CodeBlock lang="cpp" filename="cnn.h" t={t}>{`#include <algorithm>
#include <cmath>
#include <random>
#include <vector>

// A grayscale image: n×n pixels, row-major, values 0…1.
struct Image {
    std::size_t n = 0;
    std::vector<double> px;
    double at(long r, long c) const {                     // pixels outside the image count as 0 (padding)
        return r < 0 || c < 0 || r >= long(n) || c >= long(n) ? 0.0 : px[std::size_t(r) * n + std::size_t(c)];
    }
};

// One k×k filter slid over the image: out[r][c] = b + Σ w[i][j]·in[r·s + i − p][c·s + j − p].
Image conv2d(const Image& in, const double* w, std::size_t k, double b, std::size_t pad, std::size_t stride) {
    Image out;
    out.n = (in.n + 2 * pad - k) / stride + 1;            // the output size formula
    out.px.assign(out.n * out.n, 0.0);
    for (std::size_t r = 0; r < out.n; ++r)
        for (std::size_t c = 0; c < out.n; ++c) {
            double s = b;
            for (std::size_t i = 0; i < k; ++i)
                for (std::size_t j = 0; j < k; ++j)
                    s += w[i * k + j] * in.at(long(r * stride + i) - long(pad), long(c * stride + j) - long(pad));
            out.px[r * out.n + c] = s;
        }
    return out;
}

// softmax(z)_i = e^(z_i − max z) / Σ_j e^(z_j − max z): probabilities that add up to 1.
std::vector<double> softmax(const std::vector<double>& z) {
    const double mx = *std::max_element(z.begin(), z.end());
    std::vector<double> p(z.size());
    double sum = 0.0;
    for (std::size_t i = 0; i < z.size(); ++i) sum += p[i] = std::exp(z[i] - mx);
    for (double& v : p) v /= sum;
    return p;
}

// K filters 3×3 → ReLU → global max pool → dense layer → softmax over the classes.
struct Cnn {
    std::size_t K, classes;
    std::vector<double> F, fb;                            // K × 9 filter weights, K filter biases
    std::vector<double> W, b;                             // classes × K dense weights, one bias per class

    Cnn(std::size_t k, std::size_t c, std::mt19937& rng) : K(k), classes(c), F(k * 9), fb(k, 0.0), W(c * k), b(c, 0.0) {
        std::normal_distribution<double> he(0.0, std::sqrt(2.0 / 9.0)), xavier(0.0, std::sqrt(2.0 / double(k + c)));
        for (double& w : F) w = he(rng);
        for (double& w : W) w = xavier(rng);
    }

    struct Pass {                                         // what backward needs from forward
        std::vector<double> pooled;                       // the max of each ReLU feature map
        std::vector<std::size_t> argmax;                  // where that max was
        std::size_t mapN = 0;                             // feature map size
        std::vector<double> p;                            // class probabilities
    };

    Pass forward(const Image& img) const {
        Pass f;
        f.pooled.assign(K, 0.0);
        f.argmax.assign(K, 0);
        for (std::size_t k = 0; k < K; ++k) {
            const Image m = conv2d(img, &F[k * 9], 3, fb[k], 0, 1);
            f.mapN = m.n;
            double best = -1.0;
            for (std::size_t i = 0; i < m.px.size(); ++i) {
                const double v = std::max(0.0, m.px[i]);  // ReLU
                if (v > best) { best = v; f.argmax[k] = i; }
            }
            f.pooled[k] = best;                           // global max pool: one number per filter
        }
        std::vector<double> z(classes);
        for (std::size_t c = 0; c < classes; ++c) {
            z[c] = b[c];
            for (std::size_t k = 0; k < K; ++k) z[c] += W[c * K + k] * f.pooled[k];
        }
        f.p = softmax(z);
        return f;
    }
};

// Gradients with the same shapes as the network.
struct CnnGrads {
    std::vector<double> F, fb, W, b;
    explicit CnnGrads(const Cnn& net) : F(net.F.size()), fb(net.K), W(net.W.size()), b(net.classes) {}
};

// Backpropagation for one image of class y: adds to g and returns the loss −log p_y.
double backward(const Cnn& net, const Image& img, std::size_t y, CnnGrads& g) {
    const Cnn::Pass f = net.forward(img);
    std::vector<double> dPool(net.K, 0.0);
    for (std::size_t c = 0; c < net.classes; ++c) {
        const double d = f.p[c] - (c == y ? 1.0 : 0.0);  // softmax + cross-entropy: ∂L/∂z_c = p_c − [c = y]
        g.b[c] += d;
        for (std::size_t k = 0; k < net.K; ++k) {
            g.W[c * net.K + k] += d * f.pooled[k];
            dPool[k] += d * net.W[c * net.K + k];
        }
    }
    for (std::size_t k = 0; k < net.K; ++k) {
        if (f.pooled[k] <= 0.0) continue;                 // ReLU was off everywhere: no gradient
        const long r = long(f.argmax[k] / f.mapN), c = long(f.argmax[k] % f.mapN);   // only the max position
        g.fb[k] += dPool[k];
        for (long i = 0; i < 3; ++i)
            for (long j = 0; j < 3; ++j) g.F[k * 9 + std::size_t(i * 3 + j)] += dPool[k] * img.at(r + i, c + j);
    }
    return -std::log(std::max(f.p[y], 1e-12));
}`}</CodeBlock>
      <p>
        {tx(t, "aiCnn_codeUse",
          "The training loop is the one from the Training chapter: shuffle, take 10 images, add their gradients with backward, divide by 10, take an Adam step. Check backward with the gradient check before trusting it; with max pooling, use a small ε, since a large nudge can change which position wins the max.")}
      </p>

      <H2>{tx(t, "aiCnn_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiCnn_tMistake", "Mistake"), tx(t, "aiCnn_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiCnn_e1", "Getting the output size wrong"), tx(t, "aiCnn_e1b", "the next layer reads past the end of the map. Compute ⌊(n + 2p − k)/s⌋ + 1 for every layer before writing the loops.")],
          [tx(t, "aiCnn_e2", "A filter as deep as one channel only"), tx(t, "aiCnn_e2b", "on a colour image the filter must be k × k × 3 and add over all three channels; otherwise two colours are ignored.")],
          [tx(t, "aiCnn_e3", "Softmax without subtracting the max"), tx(t, "aiCnn_e3b", "e^z overflows to infinity for a logit near 710 and the loss becomes NaN. Subtract max z first; nothing else changes.")],
          [tx(t, "aiCnn_e4", "Softmax followed by another cross-entropy formula"), tx(t, "aiCnn_e4b", "the gradient p − [i = y] holds only for softmax with −ln p_y. Libraries often fuse the two into one function that takes logits; do not apply softmax twice.")],
          [tx(t, "aiCnn_e5", "Forgetting the shared-weight sum in backprop"), tx(t, "aiCnn_e5b", "taking the gradient from one position only. Each weight's gradient adds the contributions of every position it was used at.")],
          [tx(t, "aiCnn_e6", "Expecting invariance to rotation or scale"), tx(t, "aiCnn_e6b", "convolution handles shifts only. Augment the data with rotations and scalings if the task needs them.")],
        ]}
      />

      <KeyIdeas t={t} id="aiCnn" items={[
        "A dense layer on raw pixels needs a weight per pixel per neuron and has to learn every pattern again at every position.",
        "A convolution slides one small filter over the image: each output is a weighted sum of a k × k patch, with the same weights everywhere.",
        "The output size is ⌊(n + 2p − k)/s⌋ + 1; a layer has (k·k·C_in + 1)·C_out parameters, independent of the image size.",
        "Pooling keeps the strongest response of each block and drops its exact position; stacked layers see ever larger receptive fields.",
        "Softmax turns logits into probabilities; with cross-entropy, the gradient of the logits is p − [i = y].",
        "Weight sharing makes a convolution shift-equivariant and global pooling makes the network shift-invariant: 55 parameters beat 4 739 on shifted strokes (100 % vs 48 %).",
        "Residual connections, y = x + F(x), let gradients pass through very deep networks; transformers use them too.",
      ]} />
    </Article>
  );
}
