"use client";

// Probability & Statistics: absorbing chains and hitting times, for any chain
// (the Markov chapter solved them only for the walk). First-step analysis in
// general (tᵢ = 1 + Σ pᵢⱼ tⱼ, hᵢ = Σ pᵢⱼ hⱼ) on a 2 × 2 maze; the canonical
// form P = [Q R; 0 I]; the fundamental matrix N = (I − Q)⁻¹ derived as the
// expected number of visits, with t = N·1 and B = N·R; returns to a state
// (N_jj = 1/(1 − f)); and choosing states that remember just enough of the
// history (waiting for HH, the race HH against TH); longer patterns: the
// progress chain and the overlap formula E[T] = Σ 1/P(first k letters), shown
// with a fair-casino argument; a closing applied example, the ARL of the
// 2-of-2 control chart (normal tails, a 3-state chain, k by bisection). The
// maze figure has a lab; the pattern figure has a Transport only.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { MazeFigure } from "@/components/lesson/figures/markov/MazeFigure";
import { PatternFigure } from "@/components/lesson/figures/markov/PatternFigure";
import { Phi } from "@/components/lesson/figures/math/distMath";

const r = String.raw;

export function AbsorbingChainsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mAbs_intro",
          "The Markov chains chapter ended with the gambler's ruin: a walk that stops at 0 or at k, solved by conditioning on the first step. Many more questions have that shape. How many moves does a mouse in a maze need to find the cheese? How many times does it pass through the room where it started? How many coin flips until two heads in a row? Who wins a game that ends when a pattern appears? This chapter answers all of them with one method, first-step analysis for any chain, and then packs the method into one matrix, the fundamental matrix N = (I − Q)⁻¹. Its entries are expected numbers of visits, and the expected times and the chances of each ending follow from it. The last part is the skill that most exercises really test: choosing the states so that the chain remembers just enough of its history. A closing example puts it all to work: how long a quality-control chart takes to raise an alarm.")}
      </Lead>

      <Goals t={t} id="mAbs" items={[
        "Find the expected time until absorption in any chain by conditioning on the first step.",
        "Split a transition matrix into the blocks Q and R.",
        "Compute N = (I − Q)⁻¹ and read each entry as an expected number of visits.",
        "Get expected times (N·1) and the chance of each ending (N·R) from N.",
        "Choose states that remember just enough of the history, for example to wait for a pattern of coin flips.",
        "Find the expected wait for any pattern by adding up its overlaps with itself.",
        "Compute the average run length of a control chart with a chain, and choose its limits by bisection.",
      ]} />

      <H2>{tx(t, "mAbs_anyTitle", "First-step analysis for any chain")}</H2>
      <p>
        {tx(t, "mAbs_anyBody",
          "Recall the words from the Markov chains chapter. An absorbing state is one the chain never leaves (p_jj = 1). A transient state is one the chain can leave and never come back to. Here every chain has at least one absorbing state, and from every transient state some absorbing state can be reached. Then the chain is absorbed sooner or later with probability 1, and two questions make sense: how long does it take, and where does it end?")}
      </p>
      <p>
        {tx(t, "mAbs_anyBody2",
          "The gambler's walk could only step to its two neighbours. In general, from state i the chain can go to any state j, with probability p_ij. The argument does not change: one step is taken, and then, by the Markov property, the chain starts afresh from wherever it landed. So the expected time from i is 1 for that step plus the expected time from the new state, averaged with the weights p_ij. The chance of ending in a chosen absorbing state works the same way, without the 1.")}
      </p>
      <Equation label={tx(t, "mAbs_eqFirst", "First-step analysis, any chain")}
        where={[
          [r`\sym{ti}{\purple{t_i}}`, tx(t, "mAbs_wTi", "the expected number of steps until absorption, starting from the transient state i")],
          [r`\sym{one}{\amber{1}}`, tx(t, "mAbs_wOne", "the first step, which is always taken")],
          [r`\sym{pij}{\blue{p_{ij}}}`, tx(t, "mAbs_wPij", "the chance that the first step goes from i to j; the sum runs over every state j")],
          [r`\sym{tj}{t_j}`, tx(t, "mAbs_wTj", "the expected time still to go from j; it is 0 when j is absorbing")],
          [r`\sym{hi}{\green{h_i}}`, tx(t, "mAbs_wHi", "the chance of ending in one chosen absorbing state a, starting from i; h_a = 1 and h = 0 on the other absorbing states")],
        ]}
        words={tx(t, "mAbs_firstWords", "The expected time from a state is one step plus the average of the expected times from where that step can lead, weighted by how likely each place is. The chance of an ending is the same average, without the extra step.")}>
        {r`\sym{ti}{\purple{t_i}} = \sym{one}{\amber{1}} + \sum_j \sym{pij}{\blue{p_{ij}}}\,\sym{tj}{t_j}, \qquad \sym{hi}{\green{h_i}} = \sum_j \sym{pij}{\blue{p_{ij}}}\,h_j`}
      </Equation>
      <p>
        {tx(t, "mAbs_mazeIntro",
          "A first example. Four rooms form a square: A top left, B top right, C bottom left, D bottom right. Doors join A–B, A–C, B–D and C–D, and the cheese is in D. A mouse starts in A, and from each room it walks through one of the two doors, each with chance 1/2. Once in D it stays there eating, so D is absorbing. How many moves does it need on average?")}
      </p>
      <Derivation t={t} label={tx(t, "mAbs_dMaze", "Expected moves in the 2 × 2 maze")}
        steps={[
          { full: true, tex: r`t_A = 1 + \tfrac12\,t_B + \tfrac12\,t_C, \qquad t_B = 1 + \tfrac12\,t_A + \tfrac12\,\underbrace{t_D}_{0}`,
            why: tx(t, "mAbs_dm1", "one equation per transient room: from A the mouse goes to B or C; from B it goes back to A or into D, where the time left is 0") },
          { full: true, tex: r`t_C = t_B`,
            why: tx(t, "mAbs_dm2", "B and C are mirror images: each has a door to A and a door to D") },
          { full: true, tex: r`t_A = 1 + t_B = 1 + 1 + \tfrac12\,t_A`,
            why: tx(t, "mAbs_dm3", "t_C replaced by t_B, then the equation of B put in") },
          { full: true, tex: r`\tfrac12\,t_A = 2 \;\Rightarrow\; t_A = 4, \qquad t_B = t_C = 3`,
            why: tx(t, "mAbs_dm4", "the t_A terms collected on the left, then back into t_B = 1 + ½·t_A") },
        ]} />
      <p>
        {tx(t, "mAbs_mazeAfter",
          "The same method answers the question for the 3 × 3 maze in the figure below. There are 8 transient rooms, so there are 8 equations. Writing them out by hand is slow but no harder. Before the figure, it is worth packing the method into matrices, because the matrices also answer a question first-step analysis did not ask: how many times is each room visited?")}
      </p>

      <H2>{tx(t, "mAbs_canonTitle", "The canonical form: Q and R")}</H2>
      <p>
        {tx(t, "mAbs_canonBody",
          "Number the states so that the transient ones come first and the absorbing ones last. The transition matrix then falls into four blocks. Q holds the steps from a transient state to a transient state. R holds the steps from a transient state into an absorbing one. The absorbing rows are rows of the identity matrix, because an absorbing state goes only to itself, so the bottom blocks are 0 and I.")}
      </p>
      <Equation label={tx(t, "mAbs_eqCanon", "Canonical form of an absorbing chain")}
        where={[
          [r`\sym{Q}{\purple{Q}}`, tx(t, "mAbs_wQ", "transient → transient: a square matrix, one row and one column per transient state")],
          [r`\sym{R}{\amber{R}}`, tx(t, "mAbs_wR", "transient → absorbing: one row per transient state, one column per absorbing state")],
          [r`\sym{zero}{0}`, tx(t, "mAbs_wZero", "absorbing → transient: impossible, so all zeros")],
          [r`\sym{I}{I}`, tx(t, "mAbs_wI", "absorbing → absorbing: each one stays where it is, the identity")],
        ]}
        note={tx(t, "mAbs_canonNote", "For the 2 × 2 maze, with the order A, B, C, D: the rows of A, B and C split into Q (first three columns) and R (last column). Every row of P still adds up to 1, so each row of Q plus the same row of R adds up to 1.")}>
        {r`P = \begin{pmatrix} \sym{Q}{\purple{Q}} & \sym{R}{\amber{R}} \\ \sym{zero}{0} & \sym{I}{I} \end{pmatrix} \qquad\qquad P_{\text{maze}} = \left(\begin{array}{ccc|c} 0 & \tfrac12 & \tfrac12 & 0 \\[4pt] \tfrac12 & 0 & 0 & \tfrac12 \\[4pt] \tfrac12 & 0 & 0 & \tfrac12 \\[2pt] \hline 0 & 0 & 0 & 1 \end{array}\right)`}
      </Equation>
      <p>
        {tx(t, "mAbs_canonMat",
          "First-step analysis in this language: the times of the transient states form a column vector t, and the equations tᵢ = 1 + Σⱼ pᵢⱼ tⱼ only involve the transient j, since the absorbing ones have t = 0. So they say t = 1 + Q·t, where 1 is a column of ones. Moving Q·t to the left gives (I − Q)·t = 1, a linear system like those in the chapter on inverses.")}
      </p>

      <H2>{tx(t, "mAbs_nTitle", "The fundamental matrix N = (I − Q)⁻¹")}</H2>
      <p>
        {tx(t, "mAbs_nBody",
          "A new question: starting from i, how many times, on average, is the chain in the transient state j before it is absorbed? Count the start as a visit when j = i. Call the answer N_ij. The number of visits is a sum of indicators, one for each time n: 1 if the chain is at j at time n and 0 otherwise. The expectation of an indicator is its probability, and expectations add up (the indicator trick of the expectation chapter). So N_ij is the sum, over all times n, of the chance of being at j at time n.")}
      </p>
      <Derivation t={t} label={tx(t, "mAbs_dN", "Expected visits: deriving N = (I − Q)⁻¹")}
        steps={[
          { full: true, tex: r`N_{ij} = E\Big[\sum_{n \ge 0} \mathbf{1}\{X_n = j\} \;\Big|\; X_0 = i\Big] = \sum_{n \ge 0} P(X_n = j \mid X_0 = i)`,
            why: tx(t, "mAbs_dn1", "the visits are a sum of indicators; by linearity, the expected sum is the sum of the probabilities") },
          { full: true, tex: r`P(X_n = j \mid X_0 = i) = (Q^n)_{ij}`,
            why: tx(t, "mAbs_dn2", "to be at the transient j at time n, the chain has stayed among transient states the whole time (absorbed chains never come back), so every path uses only entries of Q") },
          { full: true, tex: r`N = I + Q + Q^2 + Q^3 + \cdots`,
            why: tx(t, "mAbs_dn3", "all the entries at once; Q⁰ = I counts the start") },
          { full: true, tex: r`(I - Q)\,N = (I + Q + Q^2 + \cdots) - (Q + Q^2 + Q^3 + \cdots) = I`,
            why: tx(t, "mAbs_dn4", "every power except I cancels, just as (1 − x)(1 + x + x² + …) = 1 for a number x with |x| < 1; here Qⁿ → 0 because the chain is absorbed sooner or later") },
          { full: true, tex: r`N = (I - Q)^{-1}`,
            why: tx(t, "mAbs_dn5", "so I − Q is invertible, and N is its inverse: the matrix version of the geometric series 1/(1 − x)") },
        ]} />
      <Equation label={tx(t, "mAbs_eqN", "The fundamental matrix and what it gives")}
        where={[
          [r`\sym{N}{\green{N}}`, tx(t, "mAbs_wN", "N_ij = the expected number of visits to the transient state j, starting from i, the start included")],
          [r`\sym{t}{\purple{t} = N\mathbf{1}}`, tx(t, "mAbs_wT", "row sums of N: all the visits before absorption, which is the number of steps")],
          [r`\sym{B}{\amber{B} = NR}`, tx(t, "mAbs_wB", "B_ia = the chance of ending in the absorbing state a, starting from i")],
        ]}
        words={tx(t, "mAbs_nWords", "Invert I − Q and you know how often the chain visits each state before it stops. Add up a row and you get the expected time from that start. Multiply by R and you get the chance of each ending.")}
        note={tx(t, "mAbs_nNote", "Why t = N·1: every visit to a transient state is followed by exactly one step, so the number of steps equals the total number of visits. Why B = N·R: the chain steps into a at most once, so the chance of ending in a equals the expected number of steps into a. Each visit to j gives one chance p_ja of that step, so this is the visits to each j times p_ja, added up over j.")}>
        {r`\sym{N}{\green{N}} = (I - Q)^{-1}, \qquad \sym{t}{\purple{t} = N\mathbf{1}}, \qquad \sym{B}{\amber{B} = NR}`}
      </Equation>
      <p>
        {tx(t, "mAbs_nEx",
          "Back to the 2 × 2 maze. I − Q has 1 on the diagonal and −1/2 wherever a door joins two transient rooms. Its inverse can be found by elimination or with the adjugate, as in the inverses chapter:")}
      </p>
      <Equation label={tx(t, "mAbs_eqNmaze", "N for the 2 × 2 maze (rows and columns A, B, C)")}
        where={[
          [r`N_{AA} = 2`, tx(t, "mAbs_wNaa", "a mouse that starts in A is in A twice on average: the start, plus the returns")],
          [r`N_{AB} = N_{AC} = 1`, tx(t, "mAbs_wNab", "it passes through B once on average, and through C once")],
          [r`2 + 1 + 1 = 4`, tx(t, "mAbs_wNsum", "row A adds up to t_A = 4, the answer of first-step analysis")],
        ]}
        note={tx(t, "mAbs_nMazeNote", "Here R is the column (0, 1/2, 1/2), so B = N·R = (1, 1, 1): with one cheese, every mouse ends there. With several absorbing states, B splits the probability between them.")}>
        {r`I - Q = \begin{pmatrix} 1 & -\tfrac12 & -\tfrac12 \\[4pt] -\tfrac12 & 1 & 0 \\[4pt] -\tfrac12 & 0 & 1 \end{pmatrix} \qquad N = (I - Q)^{-1} = \begin{pmatrix} 2 & 1 & 1 \\[4pt] 1 & \tfrac32 & \tfrac12 \\[4pt] 1 & \tfrac12 & \tfrac32 \end{pmatrix}`}
      </Equation>

      <H3>{tx(t, "mAbs_retTitle", "Coming back: N_jj = 1/(1 − f)")}</H3>
      <p>
        {tx(t, "mAbs_retBody",
          "The diagonal of N has a meaning of its own. Let f be the chance that the chain, once at j, comes back to j before it is absorbed. Each time the chain is at j, it starts afresh, so it comes back with chance f again, independently of before. The number of visits is then a geometric count: one visit for sure, a second with chance f, a third with chance f², and so on. Adding these up, the expected number is 1 + f + f² + … = 1/(1 − f). In the 2 × 2 maze, a mouse in A walks to B or C and from there back to A with chance 1/2, so f = 1/2 and N_AA = 2, as the matrix said.")}
      </p>
      <LiveFormula label={tx(t, "mAbs_liveRet", "Try it: visits to a state you may come back to")}
        tex={r`N_{jj} = 1 + f + f^2 + \cdots = \frac{1}{1 - f}, \qquad f = 1 - \frac{1}{N_{jj}}`}
        vars={[
          { id: "f", label: tx(t, "mAbs_lvF", "chance to come back, f"), min: 0, max: 0.95, step: 0.05, value: 0.5 },
        ]}
        compute={v => {
          const f = v.f, n = 1 / (1 - f);
          return { tex: r`N_{jj} = \frac{1}{1 - ${f.toFixed(2)}} = \mathbf{${+n.toFixed(3)}}`, meter: f };
        }}
        note={tx(t, "mAbs_liveRetNote", "The bar is f. Near f = 1 the visits blow up: at f = 0.95 the chain is at j 20 times on average. Read backwards, f = 1 − 1/N_jj gives the chance of a return from the diagonal of N.")} />

      <MazeFigure t={t} />

      <H2>{tx(t, "mAbs_statesTitle", "Choosing the states: remember just enough")}</H2>
      <p>
        {tx(t, "mAbs_statesBody",
          "In the maze the states were given: the rooms. Many exercises hide the chain. A coin is flipped until two heads in a row appear: the flips themselves are independent, so where is the chain? The answer is to make the state what you need to remember to continue. To finish HH, you only need to know whether the last flip was a head. So two states suffice: 0 (no progress: just started, or the last flip was a tail) and H (the last flip was a head), plus the absorbing state HH.")}
      </p>
      <LessonTable
        headers={[tx(t, "mAbs_tState", "State"), tx(t, "mAbs_tMeans", "What it remembers"), tx(t, "mAbs_tHeads", "Heads (1/2) →"), tx(t, "mAbs_tTails", "Tails (1/2) →")]}
        rows={[
          ["0", tx(t, "mAbs_s0", "no progress towards HH"), "H", "0"],
          ["H", tx(t, "mAbs_sH", "the last flip was a head"), "HH", "0"],
          ["HH", tx(t, "mAbs_sHH", "done (absorbing)"), "HH", "HH"],
        ]}
      />
      <Derivation t={t} label={tx(t, "mAbs_dHH", "Expected flips until HH")}
        steps={[
          { full: true, tex: r`t_H = 1 + \tfrac12 \cdot 0 + \tfrac12\,t_0`,
            why: tx(t, "mAbs_dh1", "from H: a head finishes; a tail throws all the progress away, back to 0") },
          { full: true, tex: r`t_0 = 1 + \tfrac12\,t_H + \tfrac12\,t_0 \;\Rightarrow\; t_0 = 2 + t_H`,
            why: tx(t, "mAbs_dh2", "from 0: a head moves to H, a tail leaves you at 0; then ½·t₀ is moved to the left and both sides doubled") },
          { full: true, tex: r`t_0 = 2 + 1 + \tfrac12\,t_0 \;\Rightarrow\; \tfrac12\,t_0 = 3 \;\Rightarrow\; t_0 = 6, \quad t_H = 4`,
            why: tx(t, "mAbs_dh3", "the equation of H put in") },
        ]} />
      <p>
        {tx(t, "mAbs_htBody",
          "Compare HT. The states are the same, but from H a tail finishes, and a head keeps you at H: the last flip is still a head, so no progress is lost. Then t_H = 1 + ½·t_H gives t_H = 2, and t₀ = 2 + t_H = 4. Both patterns have chance 1/4 on any two given flips, yet HT comes after 4 flips on average and HH only after 6. The difference is what a wrong flip costs: a failed HH starts from scratch, a failed HT does not.")}
      </p>
      <LiveFormula label={tx(t, "mAbs_liveHH", "Try it: waiting for HH with a biased coin")}
        tex={r`t_H = 1 + q\,t_0, \quad t_0 = 1 + p\,t_H + q\,t_0 \;\Longrightarrow\; t_0 = \frac{1 + p}{p^2}`}
        vars={[
          { id: "p", label: tx(t, "mAbs_lvP", "chance of heads, p"), min: 0.05, max: 0.95, step: 0.05, value: 0.5 },
        ]}
        compute={v => {
          const p = v.p, t0 = (1 + p) / (p * p);
          return { tex: r`t_0 = \frac{1 + ${p.toFixed(2)}}{${p.toFixed(2)}^2} = \mathbf{${+t0.toFixed(2)}} \text{ ${tx(t, "mAbs_lvFlips", "flips")}}` };
        }}
        note={tx(t, "mAbs_liveHHNote", "With q = 1 − p. The formula comes from the same two equations: from the second, p·t₀ = 1 + p·t_H; put in t_H = 1 + q·t₀ and use 1 − q = p. At p = 1/2 it gives 6. A coin with p = 1/3 needs (4/3)/(1/9) = 12 flips on average.")} />

      <H3>{tx(t, "mAbs_raceTitle", "Two endings: which pattern comes first?")}</H3>
      <p>
        {tx(t, "mAbs_raceBody",
          "Now flip a fair coin until HH or TH appears, whichever comes first. Both patterns end in H, so the state must remember the last flip: S (start, nothing yet), H, T, and the absorbing HH and TH. From S, one flip moves to H or T. From H, a head gives HH and a tail moves to T. From T, a head gives TH and a tail stays at T. With the order S, H, T for the transient states and HH, TH for the absorbing ones:")}
      </p>
      <Equation label={tx(t, "mAbs_eqRace", "The race HH against TH")}
        where={[
          [r`Q`, tx(t, "mAbs_wRq", "transient to transient (rows and columns S, H, T)")],
          [r`R`, tx(t, "mAbs_wRr", "transient to absorbing (columns HH, TH)")],
          [r`B = NR`, tx(t, "mAbs_wRb", "row S: the chance that HH wins is 1/4 and that TH wins is 3/4")],
        ]}
        words={tx(t, "mAbs_raceWords", "HH can only win if the first two flips are heads. As soon as a tail appears, the next head completes TH, before HH has a chance.")}
        note={tx(t, "mAbs_raceNote", "I − Q is upper triangular here, so N comes out by back substitution. The row sums of N give t = (3, 2, 2): the race lasts 3 flips on average from the start.")}>
        {r`\begin{gathered} Q = \begin{pmatrix} 0 & \tfrac12 & \tfrac12 \\[4pt] 0 & 0 & \tfrac12 \\[4pt] 0 & 0 & \tfrac12 \end{pmatrix} \qquad R = \begin{pmatrix} 0 & 0 \\[4pt] \tfrac12 & 0 \\[4pt] 0 & \tfrac12 \end{pmatrix} \\[10pt] N = (I - Q)^{-1} = \begin{pmatrix} 1 & \tfrac12 & \tfrac32 \\[4pt] 0 & 1 & 1 \\[4pt] 0 & 0 & 2 \end{pmatrix} \qquad B = NR = \begin{pmatrix} \tfrac14 & \tfrac34 \\[4pt] \tfrac12 & \tfrac12 \\[4pt] 0 & 1 \end{pmatrix} \end{gathered}`}
      </Equation>
      <LessonTable
        headers={[tx(t, "mAbs_tStep", "Step"), tx(t, "mAbs_tDo", "What to do")]}
        rows={[
          ["1", tx(t, "mAbs_r1", "Ask what you must remember to continue: the last flip, the progress towards a pattern, whose turn it is, how much money is left. That is the state.")],
          ["2", tx(t, "mAbs_r2", "Make the endings absorbing states, and check that the next state depends only on the current one and the next random outcome.")],
          ["3", tx(t, "mAbs_r3", "Write first-step equations (a few states), or Q and R and then N = (I − Q)⁻¹ (many states, or when visits are asked).")],
          ["4", tx(t, "mAbs_r4", "Read the answer: t = N·1 for times, B = N·R for the chance of each ending, N_ij for visits.")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "mAbs_pairTip", "When the rule depends on two things at once, the state is a pair. In a game where two players take turns, the state is (whose turn, what the current player has achieved so far). In a quality-control chart that signals after two points in a row beyond a limit, the state is where the last point fell. The chain can be large, but each of its rows is easy to write.")}
      </Callout>

      <H2>{tx(t, "mAbs_patTitle", "Waiting for a longer pattern")}</H2>
      <p>
        {tx(t, "mAbs_patBody",
          "For a pattern of any length, the state is the progress: the longest beginning of the pattern that the last flips spell out. For HTH the states are ∅ (no progress), H, HT, and the absorbing HTH. The right flip moves one place forward. A wrong flip does not always send you back to ∅. After HT, a tail gives HTT, and no ending of HTT starts an HTH, so the progress is lost. But after H, a head gives HH, and its last letter H is a fresh start, so you stay at H. The rule for a wrong flip: write the progress followed by the new flip, and keep the longest ending that is also a beginning of the pattern.")}
      </p>
      <LessonTable
        headers={[tx(t, "mAbs_tState", "State"), tx(t, "mAbs_tMeans", "What it remembers"), tx(t, "mAbs_tHeads", "Heads (1/2) →"), tx(t, "mAbs_tTails", "Tails (1/2) →")]}
        rows={[
          ["∅", tx(t, "mAbs_p0", "nothing useful: start again"), "H", "∅"],
          ["H", tx(t, "mAbs_pH", "the last flip was a head"), tx(t, "mAbs_pHH", "H (HH ends in H)"), "HT"],
          ["HT", tx(t, "mAbs_pHT", "the last two flips were HT"), "HTH ✓", tx(t, "mAbs_pHTT", "∅ (HTT starts nothing)")],
        ]}
      />
      <Derivation t={t} label={tx(t, "mAbs_dHTH", "Expected flips until HTH, fair coin")}
        steps={[
          { full: true, tex: r`t_{HT} = 1 + \tfrac12 \cdot 0 + \tfrac12\,t_{\varnothing}`,
            why: tx(t, "mAbs_dp1", "from HT: a head finishes, a tail loses all the progress") },
          { full: true, tex: r`t_H = 1 + \tfrac12\,t_H + \tfrac12\,t_{HT} \;\Rightarrow\; t_H = 2 + t_{HT}`,
            why: tx(t, "mAbs_dp2", "from H: a head keeps you at H, a tail moves to HT; then ½·t_H is moved to the left and both sides doubled") },
          { full: true, tex: r`t_{\varnothing} = 1 + \tfrac12\,t_H + \tfrac12\,t_{\varnothing} \;\Rightarrow\; t_{\varnothing} = 2 + t_H`,
            why: tx(t, "mAbs_dp3", "from ∅: a head moves to H, a tail leaves you at ∅") },
          { full: true, tex: r`t_{\varnothing} = 2 + 2 + 1 + \tfrac12\,t_{\varnothing} \;\Rightarrow\; \tfrac12\,t_{\varnothing} = 5 \;\Rightarrow\; t_{\varnothing} = 10`,
            why: tx(t, "mAbs_dp4", "the three equations put into each other: t_∅ = 2 + t_H = 4 + t_HT = 5 + ½·t_∅") },
        ]} />
      <p>
        {tx(t, "mAbs_hhtBody",
          "The same work for HHT gives 8 flips. HTH and HHT have the same length and the same chance, 1/8, on any three given flips, yet HTH takes 2 flips longer on average. It is the HH-against-HT story again. A finished HTH could be the start of the next one, because its last letter H is also its first: the pattern overlaps itself. A pattern that overlaps itself tends to come in clusters, so between the clusters the waits are longer.")}
      </p>

      <H3>{tx(t, "mAbs_ovTitle", "A shortcut: add up the overlaps")}</H3>
      <p>
        {tx(t, "mAbs_ovBody",
          "Look at the answers so far: HT 4, HHT 8, HH 6 = 2 + 4, HTH 10 = 2 + 8. Each one is a sum of 1/P(a word), where the words are the beginnings of the pattern that are also endings of it, the whole pattern included. HH begins and ends with H, so it gets 1/P(H) + 1/P(HH) = 2 + 4. HT has no such overlap except itself, so it gets 1/P(HT) = 4. This holds for every pattern, and for a biased coin too.")}
      </p>
      <Equation label={tx(t, "mAbs_eqOverlap", "Expected wait for a pattern: the overlap formula")}
        where={[
          [r`\sym{T}{\purple{T}}`, tx(t, "mAbs_wOT", "the number of flips until the pattern A₁A₂…A_m first appears")],
          [r`\sym{k}{k}`, tx(t, "mAbs_wOk", "an overlap length, from 1 to m: the first k letters are the same word as the last k letters. k = m always counts")],
          [r`\sym{P}{\amber{P(A_1 \cdots A_k)}}`, tx(t, "mAbs_wOP", "the chance that k given flips spell the first k letters: p for each H and q = 1 − p for each T, multiplied")],
        ]}
        words={tx(t, "mAbs_ovWords", "Slide the pattern along itself. Every position where the overlapping parts agree adds 1 over the chance of the overlapping part. The total is the expected wait.")}
        note={tx(t, "mAbs_ovNote", "Example: HTTHH with a fair coin. k = 1: H against H, a match. k = 2, 3, 4: HT against HH, HTT against THH, HTTH against TTHH, no match. k = 5: the whole pattern. So E[T] = 2 + 32 = 34.")}>
        {r`E[\sym{T}{\purple{T}}] = \sum_{\sym{k}{k}\,:\; A_1 \cdots A_k \,=\, A_{m-k+1} \cdots A_m} \frac{1}{\sym{P}{\amber{P(A_1 \cdots A_k)}}}`}
      </Equation>
      <Derivation t={t} label={tx(t, "mAbs_dCasino", "Why the overlaps: a fair casino")}
        steps={[
          { full: true, tex: r`\text{${tx(t, "mAbs_dc1t", "bet c on a letter of chance P")}} \;\to\; \tfrac{c}{P} \text{ ${tx(t, "mAbs_dc1w", "with chance")} } P, \;\; 0 \text{ ${tx(t, "mAbs_dc1o", "otherwise")}}`,
            why: tx(t, "mAbs_dc1", "before every flip, a new gambler arrives with 1 coin and bets it on the first letter of the pattern; after a win, the whole amount goes on the second letter, and so on, until a bet is lost or the pattern is complete. Each bet is fair: on average it returns c/P · P = c, what was bet") },
          { full: true, tex: r`\text{${tx(t, "mAbs_dc2t", "paid in by time T")}} = T`,
            why: tx(t, "mAbs_dc2", "the pattern first appears at flip T; by then T gamblers have arrived, one coin each") },
          { full: true, tex: r`\text{${tx(t, "mAbs_dc3t", "paid out at time T")}} = \sum_{k\ \text{${tx(t, "mAbs_dcOv", "overlap")}}} \frac{1}{P(A_1 \cdots A_k)}`,
            why: tx(t, "mAbs_dc3", "a gambler who arrived k flips before the end is still playing only if the last k flips are the first k letters. The last k flips are the last k letters of the pattern, so this gambler survives exactly when k is an overlap, holding 1/P(first k letters). This total is the same number in every run") },
          { full: true, tex: r`E[T] = \sum_{k\ \text{${tx(t, "mAbs_dcOv", "overlap")}}} \frac{1}{P(A_1 \cdots A_k)}`,
            why: tx(t, "mAbs_dc4", "every bet is fair, and each gambler decides using only the flips already seen, so on average the casino neither wins nor loses, even when it stops at the random time T: average paid in = average paid out. (This step is the optional stopping theorem of more advanced courses. It needs E[T] to be finite, which holds: each block of m flips spells the pattern with the same positive chance, so T is at most m times a geometric count.)") },
        ]} />
      <LiveFormula label={tx(t, "mAbs_liveHTH", "Try it: waiting for HTH with a biased coin")}
        tex={r`E[T_{HTH}] = \underbrace{\frac{1}{p}}_{k = 1} + \underbrace{\frac{1}{p \cdot q \cdot p}}_{k = 3}`}
        vars={[
          { id: "p", label: tx(t, "mAbs_lvP", "chance of heads, p"), min: 0.05, max: 0.95, step: 0.05, value: 0.5 },
        ]}
        compute={v => {
          const p = v.p, q = 1 - p, a = 1 / p, b = 1 / (p * q * p);
          return { tex: r`E[T] = \frac{1}{${p.toFixed(2)}} + \frac{1}{${p.toFixed(2)}^2 \cdot ${q.toFixed(2)}} = ${+a.toFixed(2)} + ${+b.toFixed(2)} = \mathbf{${+(a + b).toFixed(2)}} \text{ ${tx(t, "mAbs_lvFlips", "flips")}}` };
        }}
        note={tx(t, "mAbs_liveHTHNote", "HTH overlaps itself at k = 1 (H) and at k = 3 (the whole). At p = 1/2: 2 + 8 = 10, the answer of the chain. The wait is shortest near p = 0.7: heads are needed twice and tails once, so a coin that leans towards heads helps, but not too much, or the tail in the middle becomes rare.")} />
      <PatternFigure t={t} />

      <H2>{tx(t, "mAbs_ctrlTitle", "Closing example: how long until an alarm?")}</H2>
      <p>
        {tx(t, "mAbs_ctrlBody",
          "Everything in this chapter meets in one applied question. A machine fills bottles, and every few minutes one bottle is weighed. While the machine is well adjusted, each weight X is normal with the target mean μ₀ and standard deviation σ, independent of the others. The values are plotted one after another, and a rule decides when to raise an alarm and stop the machine. A good rule rarely raises a false alarm while the machine is fine, and raises a true one soon after the mean drifts away. Both are measured by the same number, the ARL (average run length): the expected number of points until the first alarm.")}
      </p>
      <p>
        {tx(t, "mAbs_ctrlBody2",
          "The classic rule draws two limits, μ₀ ± 3σ, and raises the alarm as soon as one point falls outside. Each point falls outside with chance 2·(1 − Φ(3)) = 0.0027, using Φ, the standard normal CDF of the distributions chapter. The wait for the first such point is geometric, so the ARL is 1/0.0027 ≈ 370 points. A stricter rule uses closer limits, μ₀ ± kσ with k below 3, and raises the alarm only when two points in a row fall beyond the same limit, both above or both below. One point outside is not enough, because closer limits are crossed more often by chance. The wait is no longer geometric: the rule depends on the previous point. That is the signal to build a chain whose state is what must be remembered, here where the last point fell.")}
      </p>
      <LessonTable
        headers={[tx(t, "mAbs_tState", "State"), tx(t, "mAbs_cMeans", "Where the last point fell"), tx(t, "mAbs_cAbove", "Next above (p_U) →"), tx(t, "mAbs_cInside", "Next inside (1 − p_U − p_L) →"), tx(t, "mAbs_cBelow", "Next below (p_L) →")]}
        rows={[
          ["0", tx(t, "mAbs_c0", "inside the limits (or no point yet)"), "U", "0", "L"],
          ["U", tx(t, "mAbs_cU", "above μ₀ + kσ"), tx(t, "mAbs_cAlarm", "alarm ✓"), "0", "L"],
          ["L", tx(t, "mAbs_cL", "below μ₀ − kσ"), "U", "0", tx(t, "mAbs_cAlarm", "alarm ✓")],
        ]}
      />
      <p>
        {tx(t, "mAbs_ctrlBody3",
          "Here p_U = P(X > μ₀ + kσ) and p_L = P(X < μ₀ − kσ), the two normal tails. A point above after a point below does not finish anything: the rule wants two in a row beyond the same limit, so the chain moves to U and waits for one more. While the machine is well adjusted the two tails are equal, p_U = p_L = p = 1 − Φ(k), and by symmetry the states U and L have the same expected time. Then first-step analysis takes three lines.")}
      </p>
      <Derivation t={t} label={tx(t, "mAbs_dArl", "ARL of the 2-of-2 rule, machine well adjusted")}
        steps={[
          { full: true, tex: r`s = 1 + (1 - 2p)\,t_0 + p\,s \;\Rightarrow\; (1 - p)\,s = 1 + (1 - 2p)\,t_0`,
            why: tx(t, "mAbs_da1", "from U (and the same from L), with s = t_U = t_L: a point beyond the same limit raises the alarm (time still to go 0), a point beyond the other limit moves to L, whose time is also s, and a point inside moves to 0") },
          { full: true, tex: r`t_0 = 1 + (1 - 2p)\,t_0 + 2p\,s \;\Rightarrow\; 2p\,t_0 = 1 + 2p\,s`,
            why: tx(t, "mAbs_da2", "from 0: a point inside keeps you at 0; above or below, chance p each, moves to U or L, both with time s. Then (1 − 2p)·t₀ is moved to the left") },
          { full: true, tex: r`2p(1 - p)\,t_0 = (1 - p) + 2p\bigl(1 + (1 - 2p)\,t_0\bigr) \;\Rightarrow\; 2p^2\,t_0 = 1 + p`,
            why: tx(t, "mAbs_da3", "the second line multiplied by (1 − p), with (1 − p)·s replaced by the first line. On the right, (1 − p) + 2p = 1 + p; the t₀ terms go to the left: 2p(1 − p) − 2p(1 − 2p) = 2p²") },
          { full: true, tex: r`t_0 = \frac{1 + p}{2p^2}`,
            why: tx(t, "mAbs_da4", "divide by 2p². The chart starts in state 0, so t₀ is the ARL") },
        ]} />
      <p>
        {tx(t, "mAbs_ctrlBody4",
          "Compare the wait for two heads in a row, (1 + p)/p². With only an upper limit, the alarm is exactly HH, where a head is a point above. Two limits give the chain two ways to finish, which roughly halves the wait, and the 2 in the denominator says so.")}
      </p>

      <H3>{tx(t, "mAbs_kTitle", "Choosing k: a quadratic, then bisection")}</H3>
      <p>
        {tx(t, "mAbs_kBody",
          "To compare the two rules fairly, give them the same false-alarm rate: choose k so that the ARL of the well-adjusted machine is 370, as for the 3σ rule. The condition (1 + p)/(2p²) = 370 becomes 740p² − p − 1 = 0, a quadratic in p. Its positive root is p = (1 + √(1 + 4·740))/1480 = (1 + √2961)/1480 ≈ 0.03744. Now k must satisfy 1 − Φ(k) = 0.03744, and here a formula runs out: Φ is the area under the bell, which has no formula made of ordinary functions, and neither does its inverse. A table gives k between 1.7 and 1.8. Bisection does the rest. The tail 1 − Φ(k) shrinks as k grows, so take an interval whose left end has a tail that is too large and whose right end has one that is too small, test the midpoint, and keep the half where the change of sign still happens. Each test halves the interval.")}
      </p>
      <LessonTable
        headers={[tx(t, "mAbs_kStep", "Step"), tx(t, "mAbs_kInt", "Interval for k"), tx(t, "mAbs_kMid", "Midpoint"), tx(t, "mAbs_kTail", "1 − Φ(mid)"), tx(t, "mAbs_kKeep", "Keep")]}
        rows={[
          ["1", "[1.5, 2]", "1.75", "0.0401", tx(t, "mAbs_kRight", "too large: k is to the right")],
          ["2", "[1.75, 2]", "1.875", "0.0304", tx(t, "mAbs_kLeft", "too small: k is to the left")],
          ["3", "[1.75, 1.875]", "1.8125", "0.0350", tx(t, "mAbs_kLeft", "too small: k is to the left")],
          ["4", "[1.75, 1.8125]", "1.78125", "0.03744", tx(t, "mAbs_kHit", "equal to 4 digits: stop")],
        ]}
      />
      <p>
        {tx(t, "mAbs_kBody2",
          "So k ≈ 1.78. The 2-of-2 rule with limits at μ₀ ± 1.78σ raises false alarms exactly as rarely as the classic rule with 3σ. Now suppose the mean drifts to μ₀ + δσ. The tails stop being equal: p_U = 1 − Φ(k − δ) grows and p_L = Φ(−k − δ) shrinks. Solving the same three equations without the symmetry gives the general formula.")}
      </p>
      <Equation label={tx(t, "mAbs_eqArl", "ARL of the 2-of-2 rule")}
        where={[
          [r`\sym{arl}{\purple{\text{ARL}}}`, tx(t, "mAbs_wArl", "the expected number of points until the first alarm, starting with no point plotted")],
          [r`\sym{pu}{\amber{p_U}}`, tx(t, "mAbs_wPu", "the chance that one point falls above the upper limit: 1 − Φ(k − δ) when the mean is μ₀ + δσ")],
          [r`\sym{pl}{\blue{p_L}}`, tx(t, "mAbs_wPl", "the chance that one point falls below the lower limit: Φ(−k − δ)")],
        ]}
        words={tx(t, "mAbs_arlWords", "Both ways to finish, two above or two below, sit in the denominator, each with its square; the mixed term counts the runs that switch from one side to the other.")}
        note={tx(t, "mAbs_arlNote", "Checks: with p_U = p_L = p it gives (1 + p)²/(2p² + 2p³) = (1 + p)/(2p²), the derivation above. With p_L = 0 it gives (1 + p_U)/p_U², the wait for HH.")}>
        {r`\sym{arl}{\purple{\text{ARL}}} = \frac{(1 + \sym{pu}{\amber{p_U}})(1 + \sym{pl}{\blue{p_L}})}{\sym{pu}{\amber{p_U}}^2 + \sym{pl}{\blue{p_L}}^2 + \sym{pu}{\amber{p_U}}\,\sym{pl}{\blue{p_L}}\,(\sym{pu}{\amber{p_U}} + \sym{pl}{\blue{p_L}})}`}
      </Equation>
      <LiveFormula label={tx(t, "mAbs_liveArl", "Try it: the 2-of-2 rule against the 3σ rule")}
        tex={r`\begin{aligned} &p_U = 1 - \Phi(k - \delta), \quad p_L = \Phi(-k - \delta) \\[4pt] &\text{ARL}_{3\sigma} = \frac{1}{1 - \Phi(3 - \delta) + \Phi(-3 - \delta)} \end{aligned}`}
        vars={[
          { id: "k", label: tx(t, "mAbs_lvK", "limits at ±kσ, k"), min: 1, max: 3, step: 0.01, value: 1.78 },
          { id: "d", label: tx(t, "mAbs_lvD", "drift of the mean, δ (in σ)"), min: 0, max: 3, step: 0.25, value: 0 },
        ]}
        compute={v => {
          const { k, d } = v, u = 1 - Phi(k - d), l = Phi(-k - d);
          const arl = ((1 + u) * (1 + l)) / (u * u + l * l + u * l * (u + l));
          const she = 1 / (1 - Phi(3 - d) + Phi(-3 - d));
          return { tex: r`\begin{aligned} &p_U = ${u.toFixed(5)} \qquad p_L = ${l.toFixed(5)} \\[4pt] &\text{ARL}_{2\text{-}2} = \mathbf{${arl.toFixed(1)}} \qquad \text{ARL}_{3\sigma} = ${she.toFixed(1)} \end{aligned}` };
        }}
        note={tx(t, "mAbs_liveArlNote", "At δ = 0 both are about 370: the same false-alarm rate. At δ = 1 the 2-of-2 rule raises the alarm after about 26 points against 44: a small drift is caught much sooner. At δ = 3 the classic rule wins, 2.0 against 2.4, because the 2-of-2 rule always needs at least two points. Move k to see the price: lower limits catch drifts sooner but raise false alarms more often.")} />

      <H2>{tx(t, "mAbs_practiceTitle", "Practice")}</H2>
      <p>{tx(t, "mAbs_pr1", "1. In the 2 × 2 maze, a mouse starting in B needs t_B = 3 moves on average. Row B of N is (1, 3/2, 1/2): it is in A once, in B 1.5 times (the start included), and in C half a time. 1 + 3/2 + 1/2 = 3. ✓")}</p>
      <p>{tx(t, "mAbs_pr2", "2. In the 3 × 3 maze with every door open and the cheese in I, room H has doors to G, E and I. With t(G) = t(E) = 15: t(H) = 1 + (15 + 15 + 0)/3 = 11.")}</p>
      <p>{tx(t, "mAbs_pr3", "3. A die is rolled until a 6 appears. One transient state, with Q = (5/6): N = 1/(1 − 5/6) = 6, the mean of a geometric variable with success chance 1/6.")}</p>
      <p>{tx(t, "mAbs_pr4", "4. A fair coin until HT: 4 flips on average; until HH: 6. Until HH with a coin that shows heads with chance 1/3: (1 + 1/3)/(1/3)² = 12.")}</p>
      <p>{tx(t, "mAbs_pr5", "5. In the race HH against TH, if the first flip was a head, the chances are 1/2 each (row H of B): the second flip decides, HH or a tail that leads to TH for sure.")}</p>
      <p>{tx(t, "mAbs_pr6", "6. A state with f = 3/4, the chance of a return before absorption, is visited 1/(1 − 3/4) = 4 times on average, the first visit included.")}</p>
      <p>{tx(t, "mAbs_pr7", "7. HHTHH with a fair coin: the first k letters equal the last k for k = 1 (H), k = 2 (HH) and k = 5, so E[T] = 2 + 4 + 32 = 38. TTTT: every k matches, 2 + 4 + 8 + 16 = 30.")}</p>
      <p>{tx(t, "mAbs_pr8", "8. HHT has no overlap except itself, so E[T] = 1/P(HHT) = 8 with a fair coin. With p = 3/4: 1/((3/4)² · 1/4) = 64/9 ≈ 7.1.")}</p>
      <p>{tx(t, "mAbs_pr9", "9. The 2-of-2 rule with limits at ±2σ: p = 1 − Φ(2) ≈ 0.0228, so ARL = (1 + 0.0228)/(2 · 0.0228²) ≈ 988 points. With only the upper limit, the wait for HH: (1 + 0.0228)/0.0228² ≈ 1976, twice as long.")}</p>
      <p>{tx(t, "mAbs_pr10", "10. Limits at ±1.5σ: p = 1 − Φ(1.5) ≈ 0.0668 and ARL = 1.0668/(2 · 0.0668²) ≈ 120. A false alarm about three times as often as the 3σ rule: these limits are too close.")}</p>

      <H2>{tx(t, "mAbs_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mAbs_tWrong", "Wrong"), tx(t, "mAbs_tRight", "Right"), tx(t, "mAbs_tWhy", "Why")]}
        rows={[
          ["t = Q·t", "t = 1 + Q·t", tx(t, "mAbs_m1", "the first step takes one unit of time; without the 1 the only solution is t = 0")],
          [tx(t, "mAbs_m2w", "put the absorbing states in Q"), tx(t, "mAbs_m2r", "Q: transient to transient only"), tx(t, "mAbs_m2", "with an absorbing row inside, I − Q has a row of zeros and no inverse")],
          [tx(t, "mAbs_m3w", "read N_ij as a probability"), tx(t, "mAbs_m3r", "an expected number of visits"), tx(t, "mAbs_m3", "it can be larger than 1: N_AA = 2 in the 2 × 2 maze")],
          [tx(t, "mAbs_m4w", "N = Q + Q² + …"), "N = I + Q + Q² + …", tx(t, "mAbs_m4", "the I counts the start as a visit; t = N·1 needs it")],
          [tx(t, "mAbs_m5w", "t = column sums of N"), tx(t, "mAbs_m5r", "row sums, t = N·1"), tx(t, "mAbs_m5", "row i holds the visits of a chain that starts at i")],
          ["B = R·N", "B = N·R", tx(t, "mAbs_m6", "first the visits to each transient j (N), then the step from j into an ending (R)")],
          [tx(t, "mAbs_m7w", "state = the last flip, for any pattern"), tx(t, "mAbs_m7r", "state = the progress towards the pattern"), tx(t, "mAbs_m7", "a longer pattern needs to remember how much of it has already appeared, not only the last flip")],
          [tx(t, "mAbs_m8w", "a wrong flip always sends you back to ∅"), tx(t, "mAbs_m8r", "keep the longest ending that starts the pattern"), tx(t, "mAbs_m8", "for HTH, a head after H gives HH, which still ends in H: the progress stays at H")],
          ["E[T] = 1/P(A)", tx(t, "mAbs_m9r", "add 1/P over every overlap"), tx(t, "mAbs_m9", "1/P(A) alone is right only for patterns that do not overlap themselves, such as HT or HHT")],
          [tx(t, "mAbs_m10w", "ARL = 1/P(two points in a row outside) = 1/(2p²)"), "ARL = (1 + p)/(2p²)", tx(t, "mAbs_m10", "consecutive pairs share a point, like the flips in HH, so the wait is not geometric; the chain counts the overlap")],
        ]}
      />

      <KeyIdeas t={t} id="mAbs" items={[
        "First-step analysis works for any chain: tᵢ = 1 + Σⱼ pᵢⱼ tⱼ for expected times, hᵢ = Σⱼ pᵢⱼ hⱼ for the chance of an ending.",
        "Canonical form: with the transient states first, P = [Q R; 0 I]. First-step analysis becomes (I − Q)·t = 1.",
        "N = (I − Q)⁻¹ = I + Q + Q² + …: N_ij is the expected number of visits to j starting from i, the start included.",
        "t = N·1 (row sums) gives the expected times; B = N·R gives the chance of each ending.",
        "The diagonal: N_jj = 1/(1 − f), where f is the chance of returning to j before absorption.",
        "Choose the state as what you must remember to continue: the progress towards a pattern, whose turn it is, the last outcome.",
        "Waiting for a pattern: E[T] = Σ 1/P(first k letters), over every k where the first k letters equal the last k. Patterns that overlap themselves take longer.",
        "A control chart is an absorbing chain whose state is where the last points fell. The 2-of-2 rule has ARL = (1 + p)/(2p²) on target; matching the 3σ rule's 370 puts its limits at ±1.78σ, and it catches small drifts much sooner.",
      ]} />
    </Article>
  );
}
