"use client";

// Neural Networks 1: the perceptron — the artificial neuron (weighted sum,
// bias, step); a neuron as a logic gate and its decision line, with the
// weight vector perpendicular to it (Neuron figure); Rosenblatt's learning
// rule and why each update helps; OR learned by hand; the students, centred
// vs raw (Perceptron figure); the convergence theorem (R/γ)² with a proof
// sketch; non-separable data and the pocket; the rule as gradient descent
// next to logistic regression; XOR, Minsky & Papert, and the two-layer fix
// that leads to the MLP; C++; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { NeuronFigure } from "@/components/lesson/figures/ai/NeuronFigure";
import { PerceptronFigure } from "@/components/lesson/figures/ai/PerceptronFigure";

const r = String.raw;

export function PerceptronContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiPerc_intro",
          "Every neural network, from a digit reader to a large language model, is built from one small unit: the artificial neuron. It takes a few numbers, weighs them, adds them up and decides. The perceptron, invented by Frank Rosenblatt in 1958, is that neuron plus a rule for learning its weights from examples. It was the first machine that learned. This chapter builds it, trains it by hand, proves when its rule works, and finds the one simple problem it cannot solve. That failure is exactly why networks have layers.")}
      </Lead>

      <Goals t={t} id="aiPerc" items={[
        "Compute a neuron's output from its weights and bias.",
        "Build AND, OR and NAND gates out of a single neuron.",
        "Train a perceptron with its learning rule.",
        "Explain why one neuron cannot learn XOR.",
      ]} />

      <H2>{tx(t, "aiPerc_neuronTitle", "From a brain cell to a formula")}</H2>
      <p>
        {tx(t, "aiPerc_bioBody",
          "A nerve cell receives signals from other cells through its branches (dendrites). Some connections excite it, others inhibit it, and some are stronger than others. If the total excitation crosses a threshold, the cell fires a pulse down its axon to the next cells. In 1943 Warren McCulloch and Walter Pitts turned this into arithmetic.")}
      </p>
      <p>
        {tx(t, "aiPerc_bioCaveat",
          "Keep the analogy loose. Real neurons are far more complicated, and modern networks owe more to calculus than to biology. What survives is the shape: weigh the inputs, add them up, compare with a threshold.")}
      </p>
      <Equation label={tx(t, "aiPerc_eqNeuron", "The artificial neuron (perceptron)")}
        where={[
          [r`x_1 \dots x_d`, tx(t, "aiPerc_wX", "the inputs: the d features of one example, as in every earlier chapter")],
          [r`w_1 \dots w_d`, tx(t, "aiPerc_wW", "the weights: how much each input counts. Positive excites, negative inhibits")],
          [r`b`, tx(t, "aiPerc_wB", "the bias: shifts the threshold. −b is the total the inputs must reach for the neuron to fire")],
          [r`z`, tx(t, "aiPerc_wZ", "the weighted sum, or pre-activation: the same score as in linear and logistic regression")],
          [r`\text{step}`, tx(t, "aiPerc_wStep", "the activation: 1 when z ≥ 0, otherwise 0. The neuron \"fires\" or not")],
          [r`\hat y`, tx(t, "aiPerc_wYhat", "the output: the neuron's answer, 0 or 1")],
        ]}>
        {r`z = w_1x_1 + w_2x_2 + \dots + w_dx_d + b = \mathbf{w}\cdot\mathbf{x} + b, \qquad \hat y = \text{step}(z) = \begin{cases} 1 & z \ge 0 \\ 0 & z < 0 \end{cases}`}
      </Equation>
      <p>
        {tx(t, "aiPerc_vsLog",
          "Compare this with logistic regression. The score z is identical. The only difference is the last function: logistic regression passes z through the smooth sigmoid and reports a probability; the perceptron passes it through a hard step and reports a decision. Both draw the same kind of boundary, the set where z = 0.")}
      </p>

      <H2>{tx(t, "aiPerc_gateTitle", "A neuron as a logic gate")}</H2>
      <p>
        {tx(t, "aiPerc_gateBody",
          "Before any learning, set the weights by hand. Take two inputs that are each 0 or 1. The logic gate AND should output 1 only when both are 1. Choose w₁ = w₂ = 1 and b = −1.5: the inputs must add up to at least 1.5, and only (1, 1) does.")}
      </p>
      <LessonTable
        headers={["x₁", "x₂", tx(t, "aiPerc_tAnd", "AND: z = x₁ + x₂ − 1.5"), tx(t, "aiPerc_tOr", "OR: z = x₁ + x₂ − 0.5"), tx(t, "aiPerc_tNand", "NAND: z = −x₁ − x₂ + 1.5")]}
        rows={[
          ["0", "0", "−1.5 → 0", "−0.5 → 0", "1.5 → 1"],
          ["0", "1", "−0.5 → 0", "0.5 → 1", "0.5 → 1"],
          ["1", "0", "−0.5 → 0", "0.5 → 1", "0.5 → 1"],
          ["1", "1", "0.5 → 1", "1.5 → 1", "−0.5 → 0"],
        ]}
      />
      <p>
        {tx(t, "aiPerc_gateMore",
          "Only the bias changes between AND and OR: a lower threshold (0.5 instead of 1.5) lets a single active input fire the neuron. Flipping every sign turns AND into NAND, \"not and\". NAND matters because any logic circuit, a whole processor even, can be built from NAND gates alone. So a network of these neurons can compute anything a computer can.")}
      </p>
      <H3>{tx(t, "aiPerc_geoTitle", "The picture: a line and an arrow")}</H3>
      <p>
        {tx(t, "aiPerc_geoBody",
          "Draw the four possible inputs as the corners of a square. The neuron outputs 1 where w₁x₁ + w₂x₂ + b ≥ 0. The edge of that region, w₁x₁ + w₂x₂ + b = 0, is a straight line: the decision boundary. For AND it is x₁ + x₂ = 1.5, which cuts off the corner (1, 1) alone.")}
      </p>
      <p>
        {tx(t, "aiPerc_perpBody",
          "The weight vector w = (w₁, w₂) is perpendicular to that line. Take any two points p and q on the line. Both have w · p + b = 0 and w · q + b = 0. Subtract: w · (p − q) = 0. A zero dot product means a right angle, and p − q runs along the line. So w sticks out of the line at 90°. It points to the side where z grows, the side that outputs 1. The bias does not turn the line; it slides it along w.")}
      </p>
      <NeuronFigure t={t} />

      <H2>{tx(t, "aiPerc_ruleTitle", "Learning the weights: the perceptron rule")}</H2>
      <p>
        {tx(t, "aiPerc_ruleIntro",
          "Choosing weights by hand works for four corners. For data with hundreds of features it does not. Rosenblatt's rule finds them from examples. Start with all weights at 0. Visit the examples one by one. When the neuron answers correctly, do nothing. When it is wrong, nudge the weights towards the right answer:")}
      </p>
      <Equation label={tx(t, "aiPerc_eqRule", "The perceptron learning rule (one example)")}
        where={[
          [r`y`, tx(t, "aiPerc_wY", "the true label of the example, 0 or 1")],
          [r`\hat y`, tx(t, "aiPerc_wYhat2", "what the neuron answered for it, 0 or 1")],
          [r`e = y - \hat y`, tx(t, "aiPerc_wE", "the error: +1 if the neuron missed a 1, −1 if it missed a 0, 0 if it was right")],
          [r`\eta`, tx(t, "aiPerc_wEta", "eta, the learning rate. Starting from zero weights it has no effect at all (see below), so take η = 1")],
          [r`\leftarrow`, tx(t, "aiPerc_wArrow", "\"becomes\": the new value replaces the old one")],
        ]}>
        {r`\mathbf{w} \leftarrow \mathbf{w} + \eta\,(y - \hat y)\,\mathbf{x}, \qquad b \leftarrow b + \eta\,(y - \hat y)`}
      </Equation>
      <LessonTable
        headers={[tx(t, "aiPerc_tCase", "Case"), "e", tx(t, "aiPerc_tDoes", "What the update does")]}
        rows={[
          [tx(t, "aiPerc_r1", "right answer"), "0", tx(t, "aiPerc_r1b", "nothing changes. The perceptron only learns from mistakes.")],
          [tx(t, "aiPerc_r2", "said 0, truth is 1"), "+1", tx(t, "aiPerc_r2b", "adds x to w and 1 to b: the score of this example goes up.")],
          [tx(t, "aiPerc_r3", "said 1, truth is 0"), "−1", tx(t, "aiPerc_r3b", "subtracts x from w and 1 from b: the score of this example goes down.")],
        ]}
      />
      <p>
        {tx(t, "aiPerc_whyWorks",
          "Why does adding x raise the score of x? After a missed 1, the new score of the same example is (w + x) · x + (b + 1) = (w · x + b) + (x · x + 1) = z + ‖x‖² + 1. The extra part, the squared length of x plus 1, is always positive. So the score moves towards the correct side. It may not get there in one step, and the update may break another example; the rule just keeps going. A missed 0 lowers the score by the same amount.")}
      </p>
      <p>
        {tx(t, "aiPerc_tieBody",
          "One detail: the step outputs 1 when z is exactly 0. A fresh neuron has z = 0 for every input, so it answers 1 to everything, and its first mistake is on a 0. The opposite convention (z = 0 gives 0) works just as well but produces a different sequence of updates. Pick one and use the same step for training and for predicting.")}
      </p>
      <H3>{tx(t, "aiPerc_etaTitle", "Why the learning rate does not matter here")}</H3>
      <p>
        {tx(t, "aiPerc_etaBody",
          "Every update adds ±η times an example. Starting from zero, the weights and the bias are always η times a sum of whole examples. Doubling η doubles every weight and the bias, which doubles z but never changes its sign. The neuron makes exactly the same decisions, the same mistakes and the same updates. So for the perceptron η is just a scale; take η = 1. This is not true for logistic regression, where the size of z matters.")}
      </p>
      <H3>{tx(t, "aiPerc_biasTitle", "The bias is a weight on a constant 1")}</H3>
      <p>
        {tx(t, "aiPerc_biasBody",
          "Glue a constant 1 to the end of every input: x̃ = (x₁, …, x_d, 1). Glue the bias to the end of the weights: w̃ = (w₁, …, w_d, b). Then w̃ · x̃ = w · x + b, and the bias update b ← b + e is just the weight update for that extra input, which is always 1. Proofs and code often use this trick to treat the bias like any other weight.")}
      </p>

      <H3>{tx(t, "aiPerc_workedTitle", "Worked example: learning OR")}</H3>
      <p>
        {tx(t, "aiPerc_workedIntro",
          "Train a neuron on the OR table. The examples are visited in the order (0,0), (0,1), (1,0), (1,1), again and again. One full visit of all four is one epoch. Start at w = (0, 0), b = 0. Only the mistakes are listed; every other visit was answered correctly and changed nothing.")}
      </p>
      <LessonTable
        headers={[tx(t, "aiPerc_tEpoch", "Epoch"), "x", "y", "z", "ŷ", "e", tx(t, "aiPerc_tAfter", "w, b after the update")]}
        rows={[
          ["1", "(0, 0)", "0", "0", "1", "−1", "(0, 0), −1"],
          ["1", "(0, 1)", "1", "−1", "0", "+1", "(0, 1), 0"],
          ["2", "(0, 0)", "0", "0", "1", "−1", "(0, 1), −1"],
          ["2", "(1, 0)", "1", "−1", "0", "+1", "(1, 1), 0"],
          ["3", "(0, 0)", "0", "0", "1", "−1", "(1, 1), −1"],
        ]}
      />
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiPerc_o1", "Epoch 1, (0, 0): z = 0, so the neuron says 1, but OR(0, 0) = 0. e = −1. The input is (0, 0), so the weights do not move; only b drops to −1.")}</li>
        <li>{tx(t, "aiPerc_o2", "Epoch 1, (0, 1): z = 0·0 + 0·1 − 1 = −1, the neuron says 0, the truth is 1. e = +1: w gains (0, 1), b goes back to 0. Check the rule: the score of (0, 1) went from −1 to 1, up by ‖x‖² + 1 = 2.")}</li>
        <li>{tx(t, "aiPerc_o3", "Epoch 1 ends with (1, 0) at z = 0 and (1, 1) at z = 1, both correct. Two mistakes this epoch, so go on.")}</li>
        <li>{tx(t, "aiPerc_o4", "Epochs 2 and 3 make three more corrections, listed in the table.")}</li>
        <li>{tx(t, "aiPerc_o5", "Epoch 4 with w = (1, 1), b = −1: the scores are −1, 0, 0, 1, so the answers are 0, 1, 1, 1. All four are right. An epoch with no mistakes means nothing will ever change again, so training stops: 4 epochs, 5 updates.")}</li>
      </ol>
      <Callout type="info" t={t}>
        {tx(t, "aiPerc_marginNote", "The learned neuron, step(x₁ + x₂ − 1), is correct, but look at its line: x₁ + x₂ = 1 passes exactly through (0, 1) and (1, 0). Those two corners are right only because of the tie rule. The perceptron stops at the first line that makes no mistakes, not at a good one. The line x₁ + x₂ = 0.5, halfway between the classes, would be much safer. Logistic regression keeps pushing points away from the boundary; the perceptron does not care once they are on the right side.")}
      </Callout>

      <H2>{tx(t, "aiPerc_studentsTitle", "Training on the students")}</H2>
      <p>
        {tx(t, "aiPerc_studentsBody",
          "Back to the students from the logistic regression chapter: hours studied h, hours slept s, passed or failed. Two of the fourteen were noisy: one studied 5 h and slept 7 h but failed, one studied only 2 h and passed. Remove those two and a straight line separates the remaining twelve. Each feature is centred first: its mean (3.625 h of study, 6.083 h of sleep) is subtracted, so the origin sits in the middle of the data.")}
      </p>
      <p>
        {tx(t, "aiPerc_studentsResult",
          "On centred features the perceptron makes 3 updates in the first epoch, and the second epoch has no mistakes. Back in hours, its rule is \"pass when 3.13h + 2.58s − 28.04 ≥ 0\". On the raw hours, the same rule on the same data needs 804 epochs and 1807 updates, and ends at 28.5h + 12.5s − 199 ≥ 0. The two lines differ but both separate the twelve. The perceptron returns whichever separating line it meets first.")}
      </p>
      <p>
        {tx(t, "aiPerc_whyRawSlow",
          "Why is raw so slow? With raw hours the origin is at (0 h, 0 h), far from the data. The boundary must pass far from the origin, so the bias has to be large compared with the weights. But each update moves the bias by only 1, while it moves the weights by a whole example, around (4, 6). The line keeps swinging around the origin, and the bias creeps towards its value over hundreds of epochs. Centring removes the problem. It is the same lesson as feature scaling for gradient descent.")}
      </p>
      <PerceptronFigure t={t} />

      <H2>{tx(t, "aiPerc_convTitle", "Will it always stop?")}</H2>
      <p>
        {tx(t, "aiPerc_convIntro",
          "If some line separates the classes perfectly, the data is called linearly separable. For such data the perceptron rule is guaranteed to stop, and we can even bound how many mistakes it makes. This is the perceptron convergence theorem (Novikoff, 1962). It uses the augmented vectors x̃ from above and two numbers that describe the data:")}
      </p>
      <Equation label={tx(t, "aiPerc_eqConv", "Perceptron convergence theorem")}
        where={[
          [r`R`, tx(t, "aiPerc_wR", "the length of the longest augmented example: R = max ‖x̃ᵢ‖. How far the data reaches from the origin")],
          [r`\mathbf{u}`, tx(t, "aiPerc_wU", "any perfect separator, with its weights and bias scaled to total length ‖u‖ = 1")],
          [r`\gamma`, tx(t, "aiPerc_wGamma", "gamma, the margin of u: the smallest value of sᵢ (u · x̃ᵢ) over all examples. How much room the best line leaves")],
          [r`s_i`, tx(t, "aiPerc_wS", "the label as a sign: sᵢ = 2yᵢ − 1, so +1 for class 1 and −1 for class 0")],
          [r`k`, tx(t, "aiPerc_wK", "the total number of updates (mistakes) the rule makes, over all epochs")],
        ]}>
        {r`k \;\le\; \left(\frac{R}{\gamma}\right)^{2}`}
      </Equation>
      <p>
        {tx(t, "aiPerc_proofIntro",
          "The proof fits in three steps. Start at w̃ = 0 with η = 1. A mistake on example i adds sᵢ x̃ᵢ to w̃: that is the rule, written with the sign s instead of e.")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiPerc_pf1", "w̃ keeps lining up with u. Each update changes u · w̃ by sᵢ (u · x̃ᵢ), which is at least γ. After k updates, u · w̃ ≥ kγ.")}</li>
        <li>{tx(t, "aiPerc_pf2", "w̃ grows slowly. Each update changes ‖w̃‖² by 2sᵢ (w̃ · x̃ᵢ) + ‖x̃ᵢ‖². The first term is ≤ 0, because a mistake means the score had the wrong sign. The second is at most R². After k updates, ‖w̃‖² ≤ kR², so ‖w̃‖ ≤ √k · R.")}</li>
        <li>{tx(t, "aiPerc_pf3", "A dot product with a unit vector can never exceed the length (Cauchy–Schwarz): u · w̃ ≤ ‖w̃‖. Put the two together: kγ ≤ √k · R. Divide by √k · γ and square: k ≤ (R/γ)².")}</li>
      </ol>
      <p>
        {tx(t, "aiPerc_convNumbers",
          "Step 1 grows like k, step 2 like √k, and a line cannot outrun a square root forever. For OR, the farthest corner is x̃ = (1, 1, 1), so R = √3 = 1.73. The best separator, x₁ + x₂ = 0.5, has margin γ = 1/3. The bound is (1.73 × 3)² = 27 updates; the real run made 5. For the centred students R = 3.03 and γ = 0.44, a bound of 48; the real run made 3. For raw hours R = 9.91 but γ is only about 0.07, because the best line lies far from the origin. The bound jumps to about 20 000, and the real run made 1807. The theorem explains why centring helped: it raises γ.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "aiPerc_convWarn", "The bound only promises that the rule stops. It says nothing about how good the final line is (as the OR example showed), and you usually do not know γ in advance, so it cannot tell you how many epochs to wait.")}
      </Callout>

      <H2>{tx(t, "aiPerc_nonsepTitle", "When no line exists")}</H2>
      <p>
        {tx(t, "aiPerc_nonsepBody",
          "Put the two noisy students back. Now no line separates all fourteen, and every epoch contains at least one mistake. The rule never stops. Worse, it does not settle near a good line: each mistake yanks the line towards one student, which breaks another. On centred features the neuron gets only 1 student wrong at the end of epochs 2, 3 and 4. Then it drifts into a loop: 4 updates and 4 wrong students in every epoch, forever.")}
      </p>
      <p>
        {tx(t, "aiPerc_pocketBody",
          "Two simple repairs exist. The pocket algorithm (Gallant, 1990) keeps a copy of the best weights seen so far, measured by training errors, \"in its pocket\", and returns those instead of the last ones. Here the pocket ends with 1 wrong student. The averaged perceptron returns the average of all the weight vectors visited, which smooths out the jumps. In practice both are beaten by switching to a smooth loss, as the next section explains.")}
      </p>

      <H2>{tx(t, "aiPerc_gdTitle", "The perceptron as gradient descent")}</H2>
      <p>
        {tx(t, "aiPerc_gdBody",
          "The rule looks like a trick, but it is stochastic gradient descent on a loss, one example at a time. Write the label as a sign s = ±1. A correct example has s · z > 0. Define the loss of one example as max(0, −s · z), the perceptron criterion. It is 0 when the example is on the right side, and grows the farther the example is on the wrong side. On the wrong side its gradient is −s · x for the weights and −s for the bias. A gradient step w ← w − η(−s x) is w + η s x, and on a mistake s equals y − ŷ. That is the perceptron rule.")}
      </p>
      <LessonTable
        headers={["", tx(t, "aiPerc_tPerc", "Perceptron"), tx(t, "aiPerc_tLog", "Logistic regression")]}
        rows={[
          [tx(t, "aiPerc_cOut", "Output"), tx(t, "aiPerc_cOutP", "a hard decision: step(z) ∈ {0, 1}"), tx(t, "aiPerc_cOutL", "a probability: σ(z) ∈ (0, 1)")],
          [tx(t, "aiPerc_cLoss", "Loss of one example"), "max(0, −s z)", "ln(1 + e^(−s z))"],
          [tx(t, "aiPerc_cUpd", "Update"), "w ← w + η (y − ŷ) x", "w ← w + η (y − p) x"],
          [tx(t, "aiPerc_cWhen", "Learns from"), tx(t, "aiPerc_cWhenP", "mistakes only"), tx(t, "aiPerc_cWhenL", "every example, a little, even correct ones near the line")],
          [tx(t, "aiPerc_cStop", "Separable data"), tx(t, "aiPerc_cStopP", "stops at the first separating line"), tx(t, "aiPerc_cStopL", "keeps pushing the line to the middle; weights grow without regularisation")],
          [tx(t, "aiPerc_cNon", "Non-separable data"), tx(t, "aiPerc_cNonP", "never settles"), tx(t, "aiPerc_cNonL", "converges to one best line")],
        ]}
      />
      <p>
        {tx(t, "aiPerc_gdSame",
          "The two updates are the same formula. Logistic regression uses the probability p where the perceptron uses the hard answer ŷ. Shift the perceptron loss to max(0, 1 − s z) and it also punishes correct points that are too close to the line; that is the hinge loss of support vector machines, which look for the widest margin.")}
      </p>

      <H2>{tx(t, "aiPerc_xorTitle", "XOR: what one neuron cannot do")}</H2>
      <p>
        {tx(t, "aiPerc_xorBody",
          "XOR, \"exclusive or\", outputs 1 when exactly one input is 1: (0,0) → 0, (0,1) → 1, (1,0) → 1, (1,1) → 0. On the square, the two 1s sit on one diagonal and the two 0s on the other. Try it in the figure above: no line works. Here is the proof. A neuron for XOR would need all four of these:")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiPerc_x1", "(0, 0) → 0: b < 0.")}</li>
        <li>{tx(t, "aiPerc_x2", "(0, 1) → 1: w₂ + b ≥ 0.")}</li>
        <li>{tx(t, "aiPerc_x3", "(1, 0) → 1: w₁ + b ≥ 0.")}</li>
        <li>{tx(t, "aiPerc_x4", "(1, 1) → 0: w₁ + w₂ + b < 0.")}</li>
      </ol>
      <p>
        {tx(t, "aiPerc_xorProof",
          "Add lines 2 and 3: w₁ + w₂ + 2b ≥ 0, so w₁ + w₂ + b ≥ −b. Line 1 says b < 0, so −b > 0, and therefore w₁ + w₂ + b > 0. That contradicts line 4. No weights exist. XOR is not linearly separable, and neither is anything that needs a curved or broken boundary.")}
      </p>
      <p>
        {tx(t, "aiPerc_history",
          "In 1969 Marvin Minsky and Seymour Papert published Perceptrons, a careful book on what single-layer perceptrons can and cannot compute, XOR included. Research money for neural networks largely dried up during the 1970s. The way out was already known: use more than one layer. What was missing was a way to train the hidden layers.")}
      </p>
      <H3>{tx(t, "aiPerc_twoTitle", "Two layers solve it")}</H3>
      <p>
        {tx(t, "aiPerc_twoBody",
          "XOR is \"OR, but not both\", which is AND(OR(x₁, x₂), NAND(x₁, x₂)). Each of those three gates is one neuron from the table above. Wire two neurons, h₁ = OR and h₂ = NAND, to the inputs, and feed their outputs to a third neuron, AND:")}
      </p>
      <LessonTable
        headers={["x₁", "x₂", "h₁ = step(x₁ + x₂ − 0.5)", "h₂ = step(−x₁ − x₂ + 1.5)", "ŷ = step(h₁ + h₂ − 1.5)"]}
        rows={[
          ["0", "0", "0", "1", "0"],
          ["0", "1", "1", "1", "1"],
          ["1", "0", "1", "1", "1"],
          ["1", "1", "1", "0", "0"],
        ]}
      />
      <p>
        {tx(t, "aiPerc_twoWhy",
          "The middle neurons are a hidden layer: their outputs are neither input nor answer. Look at what they do to the points. In the (h₁, h₂) plane the four inputs land on (0, 1), (1, 1), (1, 1) and (1, 0). The two XOR-true inputs now share one point, (1, 1), and the last neuron separates it with a single line. The hidden layer moved the data into a space where a line is enough. That is the whole idea of deep learning.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "aiPerc_whyNotTrain", "We set these weights by hand. Can the perceptron rule learn them? No. The rule needs to know the right answer for each neuron, and nobody says what h₁ and h₂ should output. Calculus could tell each hidden weight how it affects the final error, but the step function's slope is 0 everywhere (and undefined at 0), so that signal is always zero. The fix is to replace the step with a smooth function like the sigmoid. That gives the multi-layer perceptron (next chapter) and backpropagation, the algorithm that trains it.")}
      </Callout>

      <H2>{tx(t, "aiPerc_codeTitle", "In C++")}</H2>
      <p>
        {tx(t, "aiPerc_codeBody",
          "The code reuses the Dataset from the Data chapter, with labels 0 and 1. There is no learning rate, for the reason above. The pocket copy costs one pass over the data per update, which is fine for small data sets.")}
      </p>
      <CodeBlock lang="cpp" filename="perceptron.h" t={t}>{`#include <algorithm>
#include <numeric>
#include <random>
#include "dataset.h"                                      // Dataset from the Data chapter; labels are 0 or 1

struct Perceptron {
    std::vector<double> w;
    double b = 0.0;
    explicit Perceptron(std::size_t d) : w(d, 0.0) {}

    double score(const double* x) const {                 // z = w · x + b
        double z = b;
        for (std::size_t j = 0; j < w.size(); ++j) z += w[j] * x[j];
        return z;
    }
    int predict(const double* x) const { return score(x) >= 0.0 ? 1 : 0; }   // the step; z = 0 counts as 1
};

std::size_t countErrors(const Perceptron& p, const Dataset& ds) {
    std::size_t errors = 0;
    for (std::size_t i = 0; i < ds.n; ++i) errors += (p.predict(ds.row(i)) != int(ds.y[i]));
    return errors;
}

struct PerceptronResult { std::size_t epochs = 0, updates = 0; bool converged = false; };

// The perceptron rule. Stops after an epoch with no mistakes, or after maxEpochs.
// pocket receives the weights with the fewest training errors seen (useful when no line exists).
PerceptronResult trainPerceptron(Perceptron& p, Perceptron& pocket, const Dataset& ds,
                                 std::size_t maxEpochs, bool shuffle = false, unsigned seed = 1) {
    std::vector<std::size_t> order(ds.n);
    std::iota(order.begin(), order.end(), 0);             // 0, 1, 2, … : the file order
    std::mt19937 rng(seed);
    pocket = p;
    std::size_t bestErrors = countErrors(p, ds);
    PerceptronResult res;
    while (res.epochs < maxEpochs) {
        if (shuffle) std::shuffle(order.begin(), order.end(), rng);
        ++res.epochs;
        std::size_t mistakes = 0;
        for (std::size_t i : order) {
            const double e = ds.y[i] - p.predict(ds.row(i));   // +1, −1 or 0
            if (e == 0.0) continue;                        // right answer: nothing to learn
            for (std::size_t j = 0; j < p.w.size(); ++j) p.w[j] += e * ds.at(i, j);
            p.b += e;
            ++mistakes; ++res.updates;
            if (const std::size_t errors = countErrors(p, ds); errors < bestErrors) { bestErrors = errors; pocket = p; }
        }
        if (mistakes == 0) { res.converged = true; break; }
    }
    return res;
}
// OR table:                         converged, 4 epochs, 5 updates, w = (1, 1), b = −1
// 12 students, centred, file order: converged, 2 epochs, 3 updates
// 12 students, raw hours:           converged, 804 epochs, 1807 updates
// all 14 students, centred:         never converges; the pocket has 1 error`}</CodeBlock>

      <H2>{tx(t, "aiPerc_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiPerc_tMistake", "Mistake"), tx(t, "aiPerc_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiPerc_e1", "Different tie rules in training and prediction"), tx(t, "aiPerc_e1b", "points lying exactly on the line get a different answer than in training, so a neuron that reached zero mistakes suddenly gets some wrong (the OR neuron above has two corners on its line). Use the same step everywhere; here z ≥ 0 → 1.")],
          [tx(t, "aiPerc_e2", "Forgetting the bias"), tx(t, "aiPerc_e2b", "the line is forced through the origin. OR and AND both become impossible. Keep b, or add the constant input 1.")],
          [tx(t, "aiPerc_e3", "Raw, uncentred features"), tx(t, "aiPerc_e3b", "the rule still converges on separable data, but can take hundreds of times longer (804 epochs instead of 2 here). Centre or standardise, with means from the training set.")],
          [tx(t, "aiPerc_e4", "Waiting for convergence on noisy data"), tx(t, "aiPerc_e4b", "real data is rarely separable, so the loop never ends. Always cap the epochs, and keep the pocket or the average.")],
          [tx(t, "aiPerc_e5", "Using the last weights of a non-separable run"), tx(t, "aiPerc_e5b", "they depend on whichever example came last and can be much worse than earlier ones. Return the pocket weights.")],
          [tx(t, "aiPerc_e6", "Reading the step output as a confidence"), tx(t, "aiPerc_e6b", "the perceptron says 0 or 1, nothing more. If you need a probability, use logistic regression.")],
          [tx(t, "aiPerc_e7", "Trying to train hidden layers with this rule"), tx(t, "aiPerc_e7b", "there is no target for a hidden neuron and the step has no slope. Use smooth activations and backpropagation.")],
        ]}
      />

      <KeyIdeas t={t} id="aiPerc" items={[
        "An artificial neuron computes z = w · x + b and passes it through an activation; the perceptron uses a step: 1 when z ≥ 0, else 0.",
        "Its decision boundary w · x + b = 0 is a line (hyperplane); w is perpendicular to it and points to the side that outputs 1.",
        "One neuron can be AND, OR or NAND, and NAND gates can build any logic circuit.",
        "The perceptron rule w ← w + (y − ŷ) x, b ← b + (y − ŷ) learns only from mistakes; each update raises or lowers that example's score by ‖x‖² + 1.",
        "On linearly separable data the rule stops after at most (R/γ)² updates; centring the features raises the margin γ and speeds it up enormously.",
        "On non-separable data it never settles; keep the best weights (pocket) or average them.",
        "XOR is not linearly separable, so no single neuron can compute it; a hidden layer remaps the inputs so that one line is enough, which leads to multi-layer networks.",
      ]} />
    </Article>
  );
}
