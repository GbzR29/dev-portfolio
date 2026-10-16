"use client";

// Deep Learning 3: recurrent networks — why sequences need a different shape;
// the recurrence h_t = tanh(W_h h_{t−1} + W_x x_t + b) with a worked 1-unit
// example; unrolling and the MEMORY task (RnnStep figure, break it: cut the
// loop); backpropagation through time; vanishing and exploding gradients
// (Vanish figure) and clipping; the LSTM cell, why its gradient survives, the
// GRU; the measured RNN vs LSTM race; uses and limits (the bottleneck that
// attention removes); C++ (Rnn, BPTT, lstmStep); mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { RnnStepFigure } from "@/components/lesson/figures/ai/RnnStepFigure";
import { VanishFigure } from "@/components/lesson/figures/ai/VanishFigure";

const r = String.raw;

export function RnnContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiRnn_intro",
          "Text, speech, music, sensor readings and stock prices arrive one piece after another, and the order carries meaning: \"dog bites man\" is not \"man bites dog\". The networks so far take one fixed-size input and forget it once they have answered. A recurrent neural network (RNN) reads a sequence one step at a time and keeps a small memory, its hidden state, that it updates at every step. This chapter builds one, trains it by backpropagation through time, measures where it breaks, and fixes it with the LSTM.")}
      </Lead>

      <Goals t={t} id="aiRnn" items={[
        "Compute the hidden states of an RNN by hand and count its parameters.",
        "Unroll an RNN and backpropagate through time, adding the gradients of the shared weights.",
        "Explain vanishing and exploding gradients as a product of per-step factors, and clip gradients.",
        "Write the LSTM equations and explain why its cell state keeps gradients alive.",
      ]} />

      <H2>{tx(t, "aiRnn_seqTitle", "Sequences need a different shape")}</H2>
      <p>
        {tx(t, "aiRnn_seqBody",
          "An MLP has a fixed number of inputs. A sentence does not: it may have 3 words or 300. You could pad every sentence to the longest one, but then each position has its own weights, and what the network learns about \"not\" in position 2 does not help with \"not\" in position 9: the dense network's problem with shifted strokes, now in time. What we want is the CNN's trick along the time axis: the same weights at every position. An RNN applies one small network at every step, and adds a loop: at each step it also receives what it computed at the step before.")}
      </p>

      <H2>{tx(t, "aiRnn_loopTitle", "A loop in the network")}</H2>
      <Equation label={tx(t, "aiRnn_eqRnn", "One step of a recurrent network")}
        where={[
          [r`x_t`, tx(t, "aiRnn_wX", "the input at step t: a word's embedding, a sample of sound, or here a single number")],
          [r`h_t`, tx(t, "aiRnn_wH", "the hidden state after step t: H numbers that summarise everything read so far; h_0 = 0")],
          [r`W_h`, tx(t, "aiRnn_wWh", "the recurrent weights, H × H: how the old state feeds the new one")],
          [r`W_x`, tx(t, "aiRnn_wWx", "the input weights, H × (input size)")],
          [r`b`, tx(t, "aiRnn_wB", "a bias per hidden unit")],
          [r`\tanh`, tx(t, "aiRnn_wTanh", "the activation, applied to each unit; it keeps every state between −1 and 1")],
        ]}>
        {r`h_t = \tanh\!\left(W_h\, h_{t-1} + W_x\, x_t + b\right)`}
      </Equation>
      <p>
        {tx(t, "aiRnn_loopWorked",
          "Take a single unit with W_h = 0.5, W_x = 1, b = 0, and the input 1, 0, 0. Step 1: h₁ = tanh(0.5 · 0 + 1) = tanh(1) = 0.762. Step 2: h₂ = tanh(0.5 · 0.762 + 0) = tanh(0.381) = 0.364. Step 3: h₃ = tanh(0.182) = 0.180. The 1 seen at step 1 is still there at step 3, but it halves at each step: this unit remembers, though not for long. A trained network chooses its weights so that what matters lasts. The weights do not depend on the step, so the parameter count, H² + H·(input size) + H plus the output layer, is the same for a sequence of 5 steps or 5 000.")}
      </p>

      <H2>{tx(t, "aiRnn_unrollTitle", "Unrolling, and a task that needs memory")}</H2>
      <p>
        {tx(t, "aiRnn_unrollBody",
          "To see what an RNN computes, draw one copy of the cell per step, each passing its state to the next: the network unrolled in time. Unrolled, it is just a deep feed-forward network in which every layer has the same weights and receives one extra input. To test memory, this chapter uses the MEMORY task: a sequence of T values, each +1 or −1 at random; after the last one the network must say whether the first was +1. Every value after the first is a distraction, so the network has to carry one bit across T − 1 steps.")}
      </p>
      <RnnStepFigure t={t} />
      <p>
        {tx(t, "aiRnn_unrollRead",
          "The 4-unit network in the figure learns MEMORY with T = 8 in 75 Adam steps of 32 sequences and then answers all 400 test sequences correctly. Cutting the loop (W_h = 0) leaves each step alone with its input, and the score falls to 51 %: without the recurrence there is no memory at all.")}
      </p>

      <H2>{tx(t, "aiRnn_bpttTitle", "Backpropagation through time")}</H2>
      <p>
        {tx(t, "aiRnn_bpttBody",
          "Training an unrolled RNN is ordinary backpropagation through the unrolled network, called backpropagation through time (BPTT). Start at the loss, go back to h_T, then to h_{T−1}, and so on to the first step. At each step the delta goes through tanh (times 1 − h_t²) and through W_h, transposed, exactly as through a layer of the MLP. Since every copy shares W_h, W_x and b, each weight's gradient is the sum of its gradients at all steps, as with the CNN's shared filters.")}
      </p>
      <Equation label={tx(t, "aiRnn_eqBptt", "How the gradient travels from the last step back to step k")}
        where={[
          [r`\frac{\partial L}{\partial h_k}`, tx(t, "aiRnn_wDk", "the gradient of the loss with respect to the hidden state at step k")],
          [r`\frac{\partial h_t}{\partial h_{t-1}}`, tx(t, "aiRnn_wJac", "how a small change in h_{t−1} changes h_t: the slope of tanh at step t times W_h")],
          [r`\operatorname{diag}(1 - h_t^2)`, tx(t, "aiRnn_wDiag", "a diagonal matrix with tanh's slope for each unit on its diagonal")],
          [r`\prod`, tx(t, "aiRnn_wProd", "a product of T − k such matrices, one per step between k and T")],
        ]}>
        {r`\frac{\partial L}{\partial h_k} = \frac{\partial L}{\partial h_T}\prod_{t=k+1}^{T}\frac{\partial h_t}{\partial h_{t-1}}, \qquad \frac{\partial h_t}{\partial h_{t-1}} = \operatorname{diag}\!\left(1 - h_t^2\right) W_h`}
      </Equation>
      <Callout type="info" t={t}>
        {tx(t, "aiRnn_truncated", "For very long sequences (a whole book), storing every state for BPTT costs too much memory. Truncated BPTT cuts the sequence into chunks of, say, 100 steps: the hidden state still flows forward from chunk to chunk, but gradients only travel back within a chunk.")}
      </Callout>

      <H2>{tx(t, "aiRnn_vanishTitle", "Vanishing and exploding gradients")}</H2>
      <p>
        {tx(t, "aiRnn_vanishBody",
          "Look at the product. With one unit, each factor is the number w · (1 − h_t²). The slope of tanh is at most 1, and only near 0; so unless w is large, each factor is below 1, and a product of many numbers below 1 shrinks exponentially. With factors of 0.5, ten steps leave 0.5¹⁰ ≈ 0.001 of the gradient. The weights then get almost no signal from the early steps, and the network cannot learn to keep anything from them: the vanishing gradient. If the factors are above 1, the product grows exponentially instead: the exploding gradient, which throws the weights far away in one step. With H units the same holds for the matrices, with W_h's largest singular value playing the role of w.")}
      </p>
      <VanishFigure t={t} />
      <p>
        {tx(t, "aiRnn_clip",
          "Explosions have a simple, crude cure: gradient clipping. Before each update, measure the length of the whole gradient vector and, if it exceeds a threshold c, scale it down to length c. The direction is kept and only the step is limited. Every training run in this chapter clips at c = 1. Vanishing has no such patch: a gradient that is 10⁻⁶ carries no direction worth keeping. It needs a different cell.")}
      </p>
      <Equation label={tx(t, "aiRnn_eqClip", "Gradient clipping by norm")}
        where={[
          [r`g`, tx(t, "aiRnn_wG", "the gradient of all parameters, as one long vector")],
          [r`\lVert g\rVert`, tx(t, "aiRnn_wGn", "its length: the square root of the sum of all squared entries")],
          [r`c`, tx(t, "aiRnn_wC", "the threshold, often 1 or 5")],
        ]}>
        {r`g \leftarrow g \cdot \min\!\left(1,\; \frac{c}{\lVert g\rVert}\right)`}
      </Equation>

      <H2>{tx(t, "aiRnn_lstmTitle", "The LSTM: a memory cell with gates")}</H2>
      <p>
        {tx(t, "aiRnn_lstmBody",
          "The long short-term memory network (Hochreiter and Schmidhuber, 1997) adds a second state, the cell c_t, and three gates. A gate is a layer of sigmoids, numbers between 0 (closed) and 1 (open), multiplied element by element into a signal: a valve the network learns to set from the current input and the previous state.")}
      </p>
      <Equation label={tx(t, "aiRnn_eqLstm", "One LSTM step")}
        where={[
          [r`[h_{t-1}, x_t]`, tx(t, "aiRnn_wCat", "the previous hidden state and the new input, joined into one vector")],
          [r`f_t`, tx(t, "aiRnn_wF", "the forget gate: how much of each cell to keep (1 = keep everything)")],
          [r`i_t`, tx(t, "aiRnn_wI", "the input gate: how much of the candidate to write")],
          [r`g_t`, tx(t, "aiRnn_wGc", "the candidate: new content, between −1 and 1")],
          [r`o_t`, tx(t, "aiRnn_wO", "the output gate: how much of the cell to show as h_t")],
          [r`\odot`, tx(t, "aiRnn_wOdot", "multiplication entry by entry")],
          [r`W_f, W_i, W_g, W_o`, tx(t, "aiRnn_wWs", "four weight matrices with their biases; four times the parameters of a plain RNN of the same size")],
        ]}>
        {r`\begin{aligned} f_t &= \sigma(W_f[h_{t-1},x_t] + b_f) & i_t &= \sigma(W_i[h_{t-1},x_t] + b_i) \\ g_t &= \tanh(W_g[h_{t-1},x_t] + b_g) & o_t &= \sigma(W_o[h_{t-1},x_t] + b_o) \\ c_t &= f_t \odot c_{t-1} + i_t \odot g_t & h_t &= o_t \odot \tanh(c_t) \end{aligned}`}
      </Equation>
      <p>
        {tx(t, "aiRnn_lstmWhy",
          "The key line is c_t = f_t ⊙ c_{t−1} + i_t ⊙ g_t. The cell is not squeezed through a weight matrix and a tanh at each step; it is multiplied by f and something is added. So along the cell, ∂c_t/∂c_{t−1} is just f_t. When the network needs to remember, it can hold f near 1 and i near 0: the cell keeps its value and the gradient flows back through it almost untouched, f per step instead of w · (1 − h²). Trained networks are rarely that tidy. The LSTM that solves MEMORY with T = 20 keeps its forget gates around 0.7 and spreads the bit over all 8 cells, which hold it together; what mattered was that during training the additive path let the gradient reach the first step at all. The forget-gate biases start at 1, so σ(1) = 0.73 and the cell remembers by default from the first update; with biases at 0 it starts at 0.5 and forgets half of everything at every step.")}
      </p>
      <H3>{tx(t, "aiRnn_gruTitle", "The GRU")}</H3>
      <p>
        {tx(t, "aiRnn_gruBody",
          "The gated recurrent unit (Cho and others, 2014) merges the cell into the hidden state and uses two gates: an update gate z_t that blends the old state with a candidate, h_t = (1 − z_t) ⊙ h_{t−1} + z_t ⊙ h̃_t, and a reset gate that decides how much of the old state the candidate may read. It has three weight matrices instead of four and usually performs about as well as the LSTM.")}
      </p>

      <H2>{tx(t, "aiRnn_raceTitle", "Measured: how far can each one remember?")}</H2>
      <p>
        {tx(t, "aiRnn_raceBody",
          "Both networks with 8 hidden units, Adam with η = 0.01, batches of 32 fresh MEMORY sequences, gradients clipped at 1, up to 3 000 steps. A run counts as solved when it gets 99 % of 400 test sequences right. Each cell shows how many of 6 starting points solved it, then the median number of steps of those that did.")}
      </p>
      <LessonTable
        headers={["T", tx(t, "aiRnn_tRnn", "Plain RNN (89 parameters)"), tx(t, "aiRnn_tLstm", "LSTM (329 parameters)")]}
        rows={[
          ["10", "6 / 6 · 50", "6 / 6 · 50"],
          ["15", "5 / 6 · 950", "6 / 6 · 75"],
          ["20", "2 / 6 · 500", "6 / 6 · 100"],
          ["30", "4 / 6 · 675", "5 / 6 · 450"],
          ["40", "1 / 6 · 950", tx(t, "aiRnn_r40", "0 / 6; with η = 0.003: 4 / 6 · 2 400")],
        ]}
      />
      <p>
        {tx(t, "aiRnn_raceRead",
          "Up to T = 10 both always learn. Beyond that the plain RNN becomes a lottery: some starting weights happen to hold the bit and learn, most of the others never leave 50 %, and those that succeed often need thousands of steps (and the counts jump around, 2 of 6 at T = 20 but 4 of 6 at T = 30, because 6 tries are few). The LSTM learns from every start up to T = 20 in about 100 steps, ten times faster than the RNN at T = 15. At T = 40 it too needs care: with η = 0.01 every run stalls, with η = 0.003 four of six get there. Gates do not abolish the difficulty of long memory; they move it much further out and make learning dependable.")}
      </p>

      <H2>{tx(t, "aiRnn_usesTitle", "What RNNs did, and what stopped them")}</H2>
      <p>
        {tx(t, "aiRnn_usesBody",
          "From about 2014 to 2017, LSTMs were the standard for sequences: speech recognition on phones, handwriting, and machine translation. A translation model (Sutskever and others, 2014) had two LSTMs: an encoder that read the whole source sentence and a decoder that wrote the translation word by word, starting from the encoder's final state. Character-level LSTMs trained on Shakespeare or on source code generated plausible text one letter at a time, sampling each next letter from a softmax.")}
      </p>
      <LessonTable
        headers={[tx(t, "aiRnn_tLimit", "Limit"), tx(t, "aiRnn_tWhat", "What it means")]}
        rows={[
          [tx(t, "aiRnn_lim1", "One vector for the whole sentence"), tx(t, "aiRnn_lim1b", "the encoder must squeeze a 50-word sentence into H numbers before the decoder sees anything. Translations got worse as sentences got longer.")],
          [tx(t, "aiRnn_lim2", "Memory still fades"), tx(t, "aiRnn_lim2b", "the LSTM pushes the limit from tens to hundreds of steps, not to a whole book.")],
          [tx(t, "aiRnn_lim3", "Strictly one step at a time"), tx(t, "aiRnn_lim3b", "h_t needs h_{t−1}, so the steps of one sequence cannot run in parallel; a GPU with thousands of cores waits for one step after another.")],
        ]}
      />
      <p>
        {tx(t, "aiRnn_bridge",
          "The first limit was removed in 2014 by attention: let the decoder look back at every encoder state, not only the last one, and decide at each step which ones matter. The other two fell in 2017, when the transformer kept attention and dropped the recurrence altogether. Both are the subject of the next two chapters.")}
      </p>

      <H2>{tx(t, "aiRnn_codeTitle", "In C++")}</H2>
      <p>
        {tx(t, "aiRnn_codeBody",
          "A plain RNN with one input per step and one sigmoid output after the last, its backpropagation through time, and one LSTM step. Trained with Adam and clipping on MEMORY, 8 units solve T = 10 from all 6 starting points tried, T = 20 from none, and T = 30 from 2 of 6: a lucky start can get through, but most cannot.")}
      </p>
      <CodeBlock lang="cpp" filename="rnn.h" t={t}>{`#include <algorithm>
#include <cmath>
#include <random>
#include <vector>

// A plain RNN with one input per step and one sigmoid output after the last step:
//   h_t = tanh(Wh·h_{t−1} + wx·x_t + b),   p = σ(wy·h_T + by)
struct Rnn {
    std::size_t H;
    std::vector<double> Wh, wx, b, wy;                    // H×H, H, H, H
    double by = 0.0;

    Rnn(std::size_t hidden, std::mt19937& rng) : H(hidden), Wh(hidden * hidden), wx(hidden), b(hidden, 0.0), wy(hidden) {
        std::normal_distribution<double> n1(0.0, 1.0 / std::sqrt(double(hidden))), n2(0.0, 1.0);
        for (double& w : Wh) w = n1(rng);
        for (double& w : wx) w = n2(rng);
        for (double& w : wy) w = n1(rng);
    }

    // Runs the sequence; h[t] is the hidden state after step t (h[0] is the zero start state).
    double forward(const std::vector<double>& x, std::vector<std::vector<double>>& h) const {
        h.assign(1, std::vector<double>(H, 0.0));
        for (double xt : x) {
            std::vector<double> next(H);
            for (std::size_t i = 0; i < H; ++i) {
                double s = b[i] + wx[i] * xt;
                for (std::size_t j = 0; j < H; ++j) s += Wh[i * H + j] * h.back()[j];   // the loop: last step's state
                next[i] = std::tanh(s);
            }
            h.push_back(std::move(next));
        }
        double z = by;
        for (std::size_t i = 0; i < H; ++i) z += wy[i] * h.back()[i];
        return 1.0 / (1.0 + std::exp(-z));
    }
};

struct RnnGrads {
    std::vector<double> Wh, wx, b, wy;
    double by = 0.0;
    explicit RnnGrads(const Rnn& n) : Wh(n.Wh.size(), 0.0), wx(n.H, 0.0), b(n.H, 0.0), wy(n.H, 0.0) {}
};

// Backpropagation through time for one sequence with label y (0 or 1). Adds to g, returns the loss.
double backward(const Rnn& net, const std::vector<double>& x, double y, RnnGrads& g) {
    const std::size_t H = net.H, T = x.size();
    std::vector<std::vector<double>> h;
    const double p = net.forward(x, h);
    const double dz = p - y;                              // sigmoid + cross-entropy, as always
    g.by += dz;
    std::vector<double> dh(H);
    for (std::size_t i = 0; i < H; ++i) { g.wy[i] += dz * h[T][i]; dh[i] = dz * net.wy[i]; }
    for (std::size_t t = T; t >= 1; --t) {                // walk back through the unrolled copies
        std::vector<double> da(H), dPrev(H, 0.0);
        for (std::size_t i = 0; i < H; ++i) da[i] = dh[i] * (1.0 - h[t][i] * h[t][i]);   // through tanh
        for (std::size_t i = 0; i < H; ++i) {
            g.b[i] += da[i];
            g.wx[i] += da[i] * x[t - 1];
            for (std::size_t j = 0; j < H; ++j) {
                g.Wh[i * H + j] += da[i] * h[t - 1][j];   // the same Wh at every step: gradients add up
                dPrev[j] += net.Wh[i * H + j] * da[i];    // Whᵀ·da: the gradient for h_{t−1}
            }
        }
        dh = dPrev;
    }
    return -std::log(std::max(y == 1.0 ? p : 1.0 - p, 1e-12));
}

// One LSTM step for H cells and one input x. W has 4H rows (forget, input, candidate, output)
// of H + 1 columns: the previous h, then x. h and c are updated in place.
void lstmStep(const std::vector<double>& W, const std::vector<double>& b, std::size_t H,
              double x, std::vector<double>& h, std::vector<double>& c) {
    auto sigma = [](double z) { return 1.0 / (1.0 + std::exp(-z)); };
    std::vector<double> a(4 * H);
    for (std::size_t r = 0; r < 4 * H; ++r) {
        double s = b[r] + W[r * (H + 1) + H] * x;
        for (std::size_t j = 0; j < H; ++j) s += W[r * (H + 1) + j] * h[j];
        a[r] = r / H == 2 ? std::tanh(s) : sigma(s);      // the candidate uses tanh, the three gates σ
    }
    for (std::size_t i = 0; i < H; ++i) {
        const double f = a[i], in = a[H + i], g = a[2 * H + i], o = a[3 * H + i];
        c[i] = f * c[i] + in * g;                         // keep part of the old memory, write part of the new
        h[i] = o * std::tanh(c[i]);                       // show part of the memory
    }
}`}</CodeBlock>
      <p>
        {tx(t, "aiRnn_codeUse",
          "The training loop adds the gradients of 32 sequences, divides by 32, clips the whole gradient to length 1, and takes an Adam step. The LSTM's backward pass follows the same pattern with more terms: through h = o ⊙ tanh(c) to the output gate and the cell, then from the cell to f, i and g, and to c_{t−1} times f. Check it with the gradient check before trusting it; the figures' version passes with a relative error below 10⁻⁶.")}
      </p>

      <H2>{tx(t, "aiRnn_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiRnn_tMistake", "Mistake"), tx(t, "aiRnn_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiRnn_e1", "Taking the gradient of W_h from the last step only"), tx(t, "aiRnn_e1b", "the network learns nothing about the earlier steps. Add the contributions of every step.")],
          [tx(t, "aiRnn_e2", "No gradient clipping"), tx(t, "aiRnn_e2b", "one exploding batch sends the weights to huge values and the loss to NaN. Clip by norm before every update.")],
          [tx(t, "aiRnn_e3", "Forget-gate biases at 0"), tx(t, "aiRnn_e3b", "the LSTM starts by halving its memory at every step and learns long dependencies slowly. Start them at 1.")],
          [tx(t, "aiRnn_e4", "Carrying the hidden state across unrelated sequences"), tx(t, "aiRnn_e4b", "one sentence leaks into the next. Reset h (and c) to 0 at the start of each independent sequence.")],
          [tx(t, "aiRnn_e5", "Expecting a plain RNN to remember far back"), tx(t, "aiRnn_e5b", "past about 10 steps its gradients vanish and training becomes a matter of luck. Use an LSTM or GRU, or attention.")],
          [tx(t, "aiRnn_e6", "Updating the weights inside the backward loop"), tx(t, "aiRnn_e6b", "later steps of BPTT then use changed weights. Collect the whole gradient first, then update once.")],
        ]}
      />

      <KeyIdeas t={t} id="aiRnn" items={[
        "An RNN applies the same cell at every step: h_t = tanh(W_h h_{t−1} + W_x x_t + b); its size does not depend on the sequence length.",
        "Unrolled in time, an RNN is a deep network with shared weights; backpropagation through time adds each weight's gradient over all steps.",
        "The gradient that reaches step k is a product of one factor per later step; factors below 1 make it vanish, above 1 make it explode.",
        "Clipping the gradient's norm stops explosions; vanishing needs a different cell.",
        "The LSTM's cell is updated as c_t = f ⊙ c_{t−1} + i ⊙ g, so its gradient is multiplied only by the forget gate, which the network can hold near 1.",
        "On MEMORY, a plain RNN becomes unreliable past T = 10 (most starts never learn T = 20); an LSTM learns from every start up to T = 20 in about 100 steps.",
        "RNNs compress a whole sequence into one state and must run step by step; attention and transformers remove both limits.",
      ]} />
    </Article>
  );
}
