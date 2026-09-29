"use client";

// Probability & Statistics: Markov chains — sequences of random variables
// where the next state depends only on the present one (the Markov property);
// the transition matrix; n-step probabilities as matrix powers, derived as a
// sum over paths (Chapman–Kolmogorov); the distribution row vector π₀Pⁿ and
// joint probabilities; a fully worked exercise (reflecting random walk);
// stationary distributions, detailed balance and periodicity.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { MarkovChainFigure } from "@/components/lesson/figures/math/MarkovChainFigure";
import { MatrixPathsFigure } from "@/components/lesson/figures/math/MatrixPathsFigure";
import { MarkovDistributionFigure } from "@/components/lesson/figures/math/MarkovDistributionFigure";

const r = String.raw;

export function MarkovChainsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mMk_intro",
          "Many random processes unfold one step at a time: a board-game token moves square by square, the weather changes day by day, a reader clicks from web page to web page. Often the next step depends on where the process is now, but not on the long road that brought it there. Such a process is a Markov chain, after the Russian mathematician Andrey Markov, who studied them in 1906. This chapter defines the Markov property, stores a chain's rules in a transition matrix, and explains the one fact that makes everything computable: the probabilities of n steps are the entries of the n-th power of that matrix. A full exercise is solved along the way.")}
      </Lead>

      <H2>{tx(t, "mMk_seqTitle", "A sequence of random variables")}</H2>
      <p>
        {tx(t, "mMk_seqBody",
          "Watch a process at the times 0, 1, 2, … and write Xₙ for where it is at time n. Each Xₙ is a random variable, and the values they can take form the state space; here it is always a finite set of numbered states such as {0, 1, …, k}. The running example of the chapter is a random walk on {0, 1, 2, 3}. From an inner state (1 or 2) it steps right with probability p = 3/4 and left with probability q = 1/4. At the ends it bounces back: from 0 it always goes to 1, and from 3 it always goes to 2. The walls are called reflecting boundaries. Before the first step the walk picks its starting state at random, each state with probability 1/4, which is a uniform initial distribution.")}
      </p>

      <H2>{tx(t, "mMk_propTitle", "The Markov property")}</H2>
      <p>
        {tx(t, "mMk_propBody",
          "Suppose you know the whole history: where the walk started, where it was at every time up to now. To predict the next step, the only thing that matters is where it is now. The walk has no memory of how it arrived. Written as conditional probabilities, conditioning on the entire past gives the same answer as conditioning on the present alone:")}
      </p>
      <Equation label={tx(t, "mMk_eqProp", "The Markov property")}
        where={[
          [r`X_n`, tx(t, "mMk_wXn", "the state at time n, the present")],
          [r`X_0, \dots, X_{n-1}`, tx(t, "mMk_wPast", "the states at all earlier times, the past")],
          [r`i_0, \dots, i_{n-1}, i, j`, tx(t, "mMk_wIdx", "particular states: the past states, the present state i and the next state j")],
          [r`p_{ij}`, tx(t, "mMk_wPij", "the transition probability from i to j: the chance of going to j in one step when the walk is at i")],
        ]}
        note={tx(t, "mMk_propNote", "The chains in this chapter are also time-homogeneous: p_ij is the same at every time n, so the rules of the game never change.")}>
        {r`P(X_{n+1} = j \mid X_n = i,\ X_{n-1} = i_{n-1},\ \dots,\ X_0 = i_0) \;=\; P(X_{n+1} = j \mid X_n = i) \;=\; p_{ij}`}
      </Equation>
      <p>
        {tx(t, "mMk_notIndep",
          "Memoryless is not the same as independent. The walk's next state depends strongly on its present state: from 2 it can only go to 1 or 3. What the property says is that, once the present is known, the past adds nothing more. For a process that is not Markov, think of drawing cards one by one without putting them back, with the state being the colour of the last card. Knowing that the last card was red is not enough to predict the next: you would want to know how many reds have already gone, which is information about the whole past.")}
      </p>

      <H2>{tx(t, "mMk_matTitle", "The transition matrix")}</H2>
      <p>
        {tx(t, "mMk_matBody",
          "All the one-step probabilities fit in a square table, the transition matrix P. Its row i lists the probabilities of going from i to each state, and its column j those of arriving at j. So the entry in row i and column j is p_ij, read \"from i to j\". Every entry is a probability, between 0 and 1, and every row adds up to 1, because from state i the walk must go somewhere. A square matrix with these two properties is called a stochastic matrix. The same information can be drawn as a graph: a circle for each state and an arrow from i to j labelled p_ij whenever p_ij > 0.")}
      </p>
      <Equation label={tx(t, "mMk_eqMat", "The transition matrix of the reflecting walk (exercise part a)")}
        where={[
          [r`\text{row } i`, tx(t, "mMk_wRow", "the state the walk is in now (from)")],
          [r`\text{column } j`, tx(t, "mMk_wCol", "the state it moves to (to)")],
          [r`q = \tfrac14,\ p = \tfrac34`, tx(t, "mMk_wQp", "the chances of stepping left and right from an inner state; the rows of 0 and 3 are the reflecting walls")],
        ]}
        note={tx(t, "mMk_matNote", "Check the rows: 0 + 1 + 0 + 0 = 1, 1/4 + 0 + 3/4 + 0 = 1, and so on. A row that does not add up to 1 always means a mistake.")}>
        {r`P = \begin{pmatrix} 0 & 1 & 0 & 0 \\ \tfrac14 & 0 & \tfrac34 & 0 \\ 0 & \tfrac14 & 0 & \tfrac34 \\ 0 & 0 & 1 & 0 \end{pmatrix} \qquad \begin{matrix} \leftarrow \text{from } 0 \\ \leftarrow \text{from } 1 \\ \leftarrow \text{from } 2 \\ \leftarrow \text{from } 3 \end{matrix}`}
      </Equation>

      <MarkovChainFigure t={t} />

      <H2>{tx(t, "mMk_twoTitle", "Two steps: add up over the middle")}</H2>
      <p>
        {tx(t, "mMk_twoBody",
          "The matrix answers one-step questions. What is the chance of going from i to j in two steps? After the first step the walk is at some intermediate state k, and the possibilities k = 0, 1, …, are mutually exclusive: the walk is at exactly one of them. So the law of total probability splits the question into one case per k and adds the cases up. In each case, the multiplication rule gives the probability of \"first to k\" times the probability of \"then to j, given that\". Finally, the Markov property lets the second factor forget where the walk started, because at time 1 it is at k and only that matters:")}
      </p>
      <Equation label={tx(t, "mMk_eqTwo", "Two-step probability")}
        where={[
          [r`k`, tx(t, "mMk_wK", "the state after the first step; the sum runs over every state")],
          [r`p_{ik}`, tx(t, "mMk_wPik", "the probability of the first step, from i to k")],
          [r`p_{kj}`, tx(t, "mMk_wPkj", "the probability of the second step, from k to j; by the Markov property it does not matter that the walk began at i")],
          [r`(P^2)_{ij}`, tx(t, "mMk_wP2", "the entry in row i, column j of the matrix P² = P·P")],
        ]}>
        {r`P(X_2 = j \mid X_0 = i) = \sum_k P(X_1 = k \mid X_0 = i)\,P(X_2 = j \mid X_1 = k, X_0 = i) = \sum_k p_{ik}\,p_{kj} = (P^2)_{ij}`}
      </Equation>
      <p>
        {tx(t, "mMk_whyPow",
          "The last step is the whole point. The sum Σₖ p_ik·p_kj is exactly how matrix multiplication computes an entry: go along row i of the first matrix and down column j of the second, multiply the matching entries and add. Nobody chose to \"raise the matrix to a power\" as a trick. The rule for combining two steps of a chain simply is the rule for multiplying matrices. For example, from 1 to 3 in two steps: row 1 of P is (1/4, 0, 3/4, 0) and column 3 is (0, 0, 3/4, 0), so (P²)₁₃ = 3/4 · 3/4 = 9/16. The only route is 1 → 2 → 3.")}
      </p>

      <H3>{tx(t, "mMk_nTitle", "n steps: the n-th power")}</H3>
      <p>
        {tx(t, "mMk_nBody",
          "The same argument works for any number of steps. Split an (m + n)-step trip at time m and add up over the state the walk is in at that moment: the (m + n)-step probabilities are the m-step ones times the n-step ones. These are the Chapman–Kolmogorov equations. Starting from P¹ = P and applying them again and again, the n-step probabilities are the entries of Pⁿ. Because the chain is time-homogeneous, the same holds from any starting time m, not just from 0: only the number of steps in between matters.")}
      </p>
      <Equation label={tx(t, "mMk_eqN", "n-step probabilities (Chapman–Kolmogorov)")}
        where={[
          [r`P^n`, tx(t, "mMk_wPn", "the matrix P multiplied by itself n times; P⁰ is the identity matrix (zero steps: you stay where you are)")],
          [r`m`, tx(t, "mMk_wM", "any starting time; the answer depends only on the number of steps n")],
        ]}>
        {r`P^{m+n} = P^m\,P^n \qquad\Longrightarrow\qquad P(X_{m+n} = j \mid X_m = i) = (P^n)_{ij}`}
      </Equation>
      <p>
        {tx(t, "mMk_pathsBody",
          "Unfolding the products gives another way to read Pⁿ. (Pⁿ)ᵢⱼ is a sum over every path i → k₁ → k₂ → … → j of n steps, and each term is the product of the step probabilities along that path. Multiply along a path, add over paths: exactly the two rules of a probability tree. With 4 states, the sequences from a given i to a given j in 3 steps number 4² = 16 (one choice for each of the 2 states in between); in 20 steps they number 4¹⁹ ≈ 2.7 × 10¹¹. Yet P²⁰ takes only 19 matrix products, or 5 by repeated squaring (P², P⁴, P⁸, P¹⁶, then P¹⁶·P⁴). That is why the matrix power is so useful.")}
      </p>

      <MatrixPathsFigure t={t} />

      <H2>{tx(t, "mMk_distTitle", "Where the walk is: the distribution vector")}</H2>
      <p>
        {tx(t, "mMk_distBody",
          "Often we care not about one start but about the chance of being in each state at time n. Collect these chances into a row vector πₙ, with πₙ(j) = P(Xₙ = j). The law of total probability, splitting on the state at time n, gives the next one: πₙ₊₁(j) = Σᵢ πₙ(i)·p_ij. That is a row vector times a matrix, so one step of the chain is one multiplication by P, and n steps are n of them:")}
      </p>
      <Equation label={tx(t, "mMk_eqDist", "The distribution after n steps")}
        where={[
          [r`\pi_0`, tx(t, "mMk_wPi0", "the initial distribution, as a row vector; uniform on 4 states is (1/4, 1/4, 1/4, 1/4)")],
          [r`\pi_n(j)`, tx(t, "mMk_wPin", "the probability that the walk is at j at time n, averaged over all starting states")],
        ]}
        note={tx(t, "mMk_distNote", "The vector goes on the left, as a row. Each entry of πₙP mixes a column of P: the chances of arriving at j from every state, weighted by how likely each state was.")}>
        {r`\pi_{n+1} = \pi_n\,P \qquad\Longrightarrow\qquad \pi_n = \pi_0\,P^n`}
      </Equation>
      <p>
        {tx(t, "mMk_jointBody",
          "The multiplication rule, with the Markov property at every stage, also gives the probability of a whole history: start at i₀, then take each step. And a question about two times, \"at i at time m and at j at time m + n\", is a probability of arriving at i times a probability of going on from i to j:")}
      </p>
      <Equation label={tx(t, "mMk_eqJoint", "Joint probabilities")}
        where={[
          [r`\pi_0(i_0)`, tx(t, "mMk_wStart", "the probability of the starting state")],
          [r`p_{i_0 i_1} \cdots p_{i_{n-1} i_n}`, tx(t, "mMk_wSteps", "one factor per step of the history")],
          [r`\pi_m(i)`, tx(t, "mMk_wPim", "the probability of being at i at time m, the i-th entry of π₀Pᵐ")],
        ]}>
        {r`P(X_0 = i_0, X_1 = i_1, \dots, X_n = i_n) = \pi_0(i_0)\,p_{i_0 i_1} \cdots p_{i_{n-1} i_n} \qquad P(X_m = i,\ X_{m+n} = j) = \pi_m(i)\,(P^n)_{ij}`}
      </Equation>

      <H2>{tx(t, "mMk_exTitle", "Worked example")}</H2>
      <p>
        {tx(t, "mMk_exState",
          "The exercise: a random walk on {0, 1, 2, 3} with reflecting boundaries, q = 1/4, p = 3/4, and a uniform initial distribution. (a) Exhibit the transition matrix. (b) Find P(X₇ = 1 | X₀ = 3, X₂ = 2, X₄ = 2). (c) Find P(X₃ = 1, X₅ = 3).")}
      </p>
      <p>
        {tx(t, "mMk_exA",
          "(a) This is the matrix P above: rows are \"from\", columns \"to\". The inner rows have 1/4 to the left and 3/4 to the right; row 0 sends everything to 1 and row 3 everything to 2.")}
      </p>
      <p>
        {tx(t, "mMk_exB1",
          "(b) Of the three conditions, only the latest matters. By the Markov property, once X₄ = 2 is known, knowing X₀ = 3 and X₂ = 2 changes nothing about the future. So the question is: from 2, where is the walk 7 − 4 = 3 steps later? That is the entry (P³)₂₁. First square P, row by row, remembering that row i of P² is row i of P times P:")}
      </p>
      <Equation label={tx(t, "mMk_eqP2P3", "The powers needed")}
        where={[
          [r`P^2`, tx(t, "mMk_wSq", "P times P. For example row 1: 1/4 · (row 0 of P) + 3/4 · (row 2 of P) = (0, 1/4, 0, 0) + (0, 3/16, 0, 9/16) = (0, 7/16, 0, 9/16)")],
          [r`P^3`, tx(t, "mMk_wCube", "P times P². Row 2: 1/4 · (row 1 of P²) + 3/4 · (row 3 of P²) = (0, 7/64, 0, 9/64) + (0, 3/16, 0, 9/16) = (0, 19/64, 0, 45/64)")],
        ]}>
        {r`P^2 = \begin{pmatrix} \tfrac14 & 0 & \tfrac34 & 0 \\ 0 & \tfrac7{16} & 0 & \tfrac9{16} \\ \tfrac1{16} & 0 & \tfrac{15}{16} & 0 \\ 0 & \tfrac14 & 0 & \tfrac34 \end{pmatrix} \qquad P^3 = \begin{pmatrix} 0 & \tfrac7{16} & 0 & \tfrac9{16} \\ \tfrac7{64} & 0 & \tfrac{57}{64} & 0 \\ 0 & \tfrac{19}{64} & 0 & \tfrac{45}{64} \\ \tfrac1{16} & 0 & \tfrac{15}{16} & 0 \end{pmatrix}`}
      </Equation>
      <p>
        {tx(t, "mMk_exB2",
          "So the answer is (P³)₂₁ = 19/64 ≈ 0.297. As a check, list the paths from 2 to 1 in three steps and multiply along each one:")}
      </p>
      <LessonTable
        headers={[tx(t, "mMk_tPath", "Path"), tx(t, "mMk_tProd", "Product of the steps"), tx(t, "mMk_tProb", "Probability")]}
        rows={[
          ["2 → 1 → 0 → 1", "1/4 · 1/4 · 1", "4/64"],
          ["2 → 1 → 2 → 1", "1/4 · 3/4 · 1/4", "3/64"],
          ["2 → 3 → 2 → 1", "3/4 · 1 · 1/4", "12/64"],
          [tx(t, "mMk_tTotal", "total"), "", "19/64"],
        ]}
      />
      <p>
        {tx(t, "mMk_exC1",
          "(c) Now there is no condition; this is a joint probability at two times, so use P(X₃ = 1, X₅ = 3) = P(X₃ = 1) · (P²)₁₃. For the first factor, the distribution at time 3 is π₀P³, and with the uniform π₀ = (1/4, 1/4, 1/4, 1/4) each entry is the average of a column of P³. Column 1 of P³ is (7/16, 0, 19/64, 0), so P(X₃ = 1) = 1/4 · (28/64 + 19/64) = 47/256. The whole distribution is π₃ = (11, 47, 117, 81)/256. For the second factor, (P²)₁₃ = 9/16, the single path 1 → 2 → 3.")}
      </p>
      <Equation label={tx(t, "mMk_eqC", "Part (c)")}>
        {r`P(X_3 = 1,\ X_5 = 3) = \pi_3(1)\,(P^2)_{13} = \frac{47}{256}\cdot\frac{9}{16} = \frac{423}{4096} \approx 0.103`}
      </Equation>
      <p>
        {tx(t, "mMk_exParity",
          "A pattern shows in every power: half the entries are 0. Each step changes the state by ±1, so it always switches between even and odd states. After an odd number of steps an even state has turned odd, and after an even number it is even again. That is why (P³)₁₁ = 0: from 1, the walk cannot be back at 1 after 3 steps.")}
      </p>

      <H2>{tx(t, "mMk_longTitle", "The long run")}</H2>
      <p>
        {tx(t, "mMk_statBody",
          "Keep multiplying by P and ask whether πₙ settles down. If it settles on some π, then π must stay the same after one more step: π = πP. Such a distribution is called stationary: a walk that starts with it keeps it for ever. Read as linear algebra, πP = π says that π is a left eigenvector of P with eigenvalue 1, and a stochastic matrix always has one, since its rows add up to 1.")}
      </p>
      <Equation label={tx(t, "mMk_eqStat", "Stationary distribution")}
        where={[
          [r`\pi`, tx(t, "mMk_wPi", "a row vector of probabilities: every entry ≥ 0 and all of them add up to 1")],
          [r`\pi P = \pi`, tx(t, "mMk_wFix", "one step changes nothing: the probability flowing into each state equals the probability it holds")],
        ]}>
        {r`\pi P = \pi, \qquad \sum_i \pi(i) = 1`}
      </Equation>
      <p>
        {tx(t, "mMk_balanceBody",
          "For a walk that only moves between neighbours there is a shortcut, detailed balance: in the long run, the flow of probability across each edge must be the same in both directions, π(i)·p_{i,i+1} = π(i+1)·p_{i+1,i}. For the exercise: π(0)·1 = π(1)·1/4 gives π(1) = 4π(0); π(1)·3/4 = π(2)·1/4 gives π(2) = 3π(1) = 12π(0); π(2)·3/4 = π(3)·1 gives π(3) = 9π(0). The entries must add up to 1, so 26π(0) = 1 and π = (1, 4, 12, 9)/26 ≈ (0.04, 0.15, 0.46, 0.35). The walk leans right, so it spends most of its time near the right wall.")}
      </p>
      <p>
        {tx(t, "mMk_periodBody",
          "Yet for most starts πₙ never converges. Because every step flips the parity, a walk that starts at 0 is surely at an even state at even times and at an odd state at odd times, so its probability sloshes between {0, 2} and {1, 3} for ever. The chain is periodic with period 2, and in eigenvalue terms P also has the eigenvalue −1: the vector (1, −1, 1, −1) is flipped in sign by every step, so the part of π₀ that tips the balance between even and odd states keeps alternating. The exercise's uniform start is a lucky exception. It gives the even states 1/2 and the odd states 1/2, which is exactly how π splits them too (1 + 12 = 4 + 9 = 13 out of 26), so there is nothing to swing, and its πₙ does converge to π. Two facts hold for every start. First, the share of time spent in each state still tends to π, as the bars of the first figure show. Second, a chain that can reach every state from every state (irreducible) and is not periodic (aperiodic) always forgets its start: πₙ → π, whatever π₀ is. A small chance of staying put, h > 0, breaks the rhythm and makes the walk aperiodic. Try it below.")}
      </p>

      <MarkovDistributionFigure t={t} />

      <Callout type="tip" t={t}>
        {tx(t, "mMk_uses", "Markov chains are everywhere. Google's original PageRank is the stationary distribution of a reader who clicks random links. Snakes and Ladders is a Markov chain, and powers of its matrix give the chance of finishing within n turns. Text predictors are chains whose state is the last few words. Markov chain Monte Carlo methods even run the idea backwards: they design a chain whose stationary distribution is one they want to sample.")}
      </Callout>

      <H2>{tx(t, "mMk_practiceTitle", "Practice")}</H2>
      <p>{tx(t, "mMk_pr1", "1. For the exercise's walk, P(X₂ = 0 | X₀ = 0) = (P²)₀₀ = 1/4: the only route is 0 → 1 → 0, with probability 1 · 1/4.")}</p>
      <p>{tx(t, "mMk_pr2", "2. P(X₁₀ = 3 | X₇ = 1, X₃ = 0) = (P³)₁₃ = 0: three steps change the parity, so from 1 the walk is at 0 or 2.")}</p>
      <p>{tx(t, "mMk_pr3", "3. If the walk starts at 0 for sure, π₀ = (1, 0, 0, 0) and π₂ is row 0 of P²: (1/4, 0, 3/4, 0).")}</p>
      <p>{tx(t, "mMk_pr4", "4. P(X₀ = 1, X₁ = 2, X₂ = 3) = π₀(1) · p₁₂ · p₂₃ = 1/4 · 3/4 · 3/4 = 9/64.")}</p>

      <H2>{tx(t, "mMk_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mMk_tWrong", "Wrong"), tx(t, "mMk_tRight", "Right"), tx(t, "mMk_tWhy", "Why")]}
        rows={[
          [tx(t, "mMk_m1w", "use every condition in P(X₇ | X₀, X₂, X₄)"), tx(t, "mMk_m1r", "use only the latest, X₄"), tx(t, "mMk_m1", "the Markov property: the present already contains everything the past could tell")],
          [tx(t, "mMk_m2w", "P(X₇ = 1 | X₄ = 2) = p₂₁"), "(P³)₂₁", tx(t, "mMk_m2", "three steps pass between the two times, so it is the third power")],
          [tx(t, "mMk_m3w", "(P³)ᵢⱼ = (pᵢⱼ)³"), tx(t, "mMk_m3r", "multiply the whole matrices"), tx(t, "mMk_m3", "(p₂₁)³ = 1/64, but (P³)₂₁ = 19/64: the power adds up every path, not one step repeated")],
          [tx(t, "mMk_m4w", "π₀ written as a column, Pπ₀"), "π₀P", tx(t, "mMk_m4", "rows are \"from\": the distribution must go on the left")],
          [tx(t, "mMk_m5w", "P(X₃ = 1) = (P³)ᵢ₁ for one chosen start i"), "π₀P³", tx(t, "mMk_m5", "an unconditional question averages over the initial distribution, here uniform")],
          [tx(t, "mMk_m6w", "every chain converges to π"), tx(t, "mMk_m6r", "only irreducible, aperiodic ones"), tx(t, "mMk_m6", "the reflecting walk with h = 0, started at 0, swings between even and odd states for ever")],
        ]}
      />

      <KeyIdeas t={t} id="mMk" items={[
        tx(t, "mMk_k1", "Markov property: given the present state, the past does not change the probabilities of the future."),
        tx(t, "mMk_k2", "The transition matrix P holds p_ij in row i (from) and column j (to); every row adds up to 1."),
        tx(t, "mMk_k3", "Two steps: add up over the middle state, Σₖ p_ik p_kj, which is exactly matrix multiplication. So n-step probabilities are the entries of Pⁿ, and only the number of steps matters."),
        tx(t, "mMk_k4", "(Pⁿ)ᵢⱼ is the sum, over every path from i to j of n steps, of the product of the step probabilities."),
        tx(t, "mMk_k5", "The distribution is a row vector: πₙ = π₀Pⁿ. Joint probabilities multiply: P(X_m = i, X_{m+n} = j) = π_m(i)(Pⁿ)ᵢⱼ."),
        tx(t, "mMk_k6", "A stationary π solves πP = π. Irreducible, aperiodic chains converge to it from any start; periodic ones, like the reflecting walk, can keep swinging."),
      ]} />
    </Article>
  );
}
