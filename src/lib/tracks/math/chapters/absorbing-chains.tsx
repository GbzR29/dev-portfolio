"use client";

// Probability & Statistics: absorbing chains and hitting times, for any chain
// (the Markov chapter solved them only for the walk). First-step analysis in
// general (tᵢ = 1 + Σ pᵢⱼ tⱼ, hᵢ = Σ pᵢⱼ hⱼ) on a 2 × 2 maze; the canonical
// form P = [Q R; 0 I]; the fundamental matrix N = (I − Q)⁻¹ derived as the
// expected number of visits, with t = N·1 and B = N·R; returns to a state
// (N_jj = 1/(1 − f)); and choosing states that remember just enough of the
// history (waiting for HH, the race HH against TH). The maze figure has a lab.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { MazeFigure } from "@/components/lesson/figures/markov/MazeFigure";

const r = String.raw;

export function AbsorbingChainsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mAbs_intro",
          "The Markov chains chapter ended with the gambler's ruin: a walk that stops at 0 or at k, solved by conditioning on the first step. Many more questions have that shape. How many moves does a mouse in a maze need to find the cheese? How many times does it pass through the room where it started? How many coin flips until two heads in a row? Who wins a game that ends when a pattern appears? This chapter answers all of them with one method, first-step analysis for any chain, and then packs the method into one matrix, the fundamental matrix N = (I − Q)⁻¹. Its entries are expected numbers of visits, and the expected times and the chances of each ending follow from it. The last part is the skill that most exercises really test: choosing the states so that the chain remembers just enough of its history.")}
      </Lead>

      <Goals t={t} id="mAbs" items={[
        "Find the expected time until absorption in any chain by conditioning on the first step.",
        "Split a transition matrix into the blocks Q and R.",
        "Compute N = (I − Q)⁻¹ and read each entry as an expected number of visits.",
        "Get expected times (N·1) and the chance of each ending (N·R) from N.",
        "Choose states that remember just enough of the history, for example to wait for a pattern of coin flips.",
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

      <H2>{tx(t, "mAbs_practiceTitle", "Practice")}</H2>
      <p>{tx(t, "mAbs_pr1", "1. In the 2 × 2 maze, a mouse starting in B needs t_B = 3 moves on average. Row B of N is (1, 3/2, 1/2): it is in A once, in B 1.5 times (the start included), and in C half a time. 1 + 3/2 + 1/2 = 3. ✓")}</p>
      <p>{tx(t, "mAbs_pr2", "2. In the 3 × 3 maze with every door open and the cheese in I, room H has doors to G, E and I. With t(G) = t(E) = 15: t(H) = 1 + (15 + 15 + 0)/3 = 11.")}</p>
      <p>{tx(t, "mAbs_pr3", "3. A die is rolled until a 6 appears. One transient state, with Q = (5/6): N = 1/(1 − 5/6) = 6, the mean of a geometric variable with success chance 1/6.")}</p>
      <p>{tx(t, "mAbs_pr4", "4. A fair coin until HT: 4 flips on average; until HH: 6. Until HH with a coin that shows heads with chance 1/3: (1 + 1/3)/(1/3)² = 12.")}</p>
      <p>{tx(t, "mAbs_pr5", "5. In the race HH against TH, if the first flip was a head, the chances are 1/2 each (row H of B): the second flip decides, HH or a tail that leads to TH for sure.")}</p>
      <p>{tx(t, "mAbs_pr6", "6. A state with f = 3/4, the chance of a return before absorption, is visited 1/(1 − 3/4) = 4 times on average, the first visit included.")}</p>

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
        ]}
      />

      <KeyIdeas t={t} id="mAbs" items={[
        "First-step analysis works for any chain: tᵢ = 1 + Σⱼ pᵢⱼ tⱼ for expected times, hᵢ = Σⱼ pᵢⱼ hⱼ for the chance of an ending.",
        "Canonical form: with the transient states first, P = [Q R; 0 I]. First-step analysis becomes (I − Q)·t = 1.",
        "N = (I − Q)⁻¹ = I + Q + Q² + …: N_ij is the expected number of visits to j starting from i, the start included.",
        "t = N·1 (row sums) gives the expected times; B = N·R gives the chance of each ending.",
        "The diagonal: N_jj = 1/(1 − f), where f is the chance of returning to j before absorption.",
        "Choose the state as what you must remember to continue: the progress towards a pattern, whose turn it is, the last outcome.",
      ]} />
    </Article>
  );
}
