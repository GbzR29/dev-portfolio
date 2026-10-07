"use client";

// Probability & Statistics: Markov chains — sequences of random variables
// where the next state depends only on the present one (the Markov property);
// the transition matrix; n-step probabilities as matrix powers, derived as a
// sum over paths (Chapman–Kolmogorov); the distribution row vector π₀Pⁿ and
// joint probabilities; a fully worked exercise (reflecting random walk);
// stationary distributions, detailed balance and periodicity; πP = π solved
// for any chain (weather example) and the classification of states; absorbing
// chains by first-step analysis (absorption chances, expected time, gambler's
// ruin). Every figure has a guided full-screen lab (kit/lab).

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { MarkovChainFigure } from "@/components/lesson/figures/markov/ChainFigure";
import { MatrixPathsFigure } from "@/components/lesson/figures/markov/PathsFigure";
import { MarkovDistributionFigure } from "@/components/lesson/figures/markov/DistributionFigure";
import { StationaryFigure } from "@/components/lesson/figures/markov/StationaryFigure";
import { AbsorbFigure } from "@/components/lesson/figures/markov/AbsorbFigure";

const r = String.raw;

export function MarkovChainsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mMk_intro",
          "Many random processes unfold one step at a time: a board-game token moves square by square, the weather changes day by day, a reader clicks from web page to web page. Often the next step depends on where the process is now, but not on the long road that brought it there. Such a process is a Markov chain, after the Russian mathematician Andrey Markov, who studied them in 1906. This chapter defines the Markov property, stores a chain's rules in a transition matrix, and explains the one fact that makes everything computable: the probabilities of n steps are the entries of the n-th power of that matrix. A full exercise is solved along the way. Then come the long run (the stationary distribution, for walks and for any chain, and when the chain actually reaches it) and absorbing chains: where a walk that can get stuck ends up, and how long that takes. Every figure has an \"explore\" button that opens it full screen as a guided lab.")}
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
          "Yet for most starts πₙ never converges. Because every step flips the parity, a walk that starts at 0 is surely at an even state at even times and at an odd state at odd times, so its probability sloshes between {0, 2} and {1, 3} for ever. The chain is periodic with period 2, and in eigenvalue terms P also has the eigenvalue −1: the vector (1, −1, 1, −1) is flipped in sign by every step, so the part of π₀ that tips the balance between even and odd states keeps alternating. The exercise's uniform start is a lucky exception. It gives the even states 1/2 and the odd states 1/2, which is exactly how π splits them too (1 + 12 = 4 + 9 = 13 out of 26), so there is nothing to swing, and its πₙ does converge to π. That half-and-half split is no coincidence: one step moves all the even probability to the odd states and back, so a distribution that one step leaves unchanged must give both halves the same amount. Two facts hold for every start. First, the share of time spent in each state still tends to π, as the bars of the first figure show. Second, a chain that can reach every state from every state (irreducible) and is not periodic (aperiodic) always forgets its start: πₙ → π, whatever π₀ is. A small chance of staying put, h > 0, breaks the rhythm and makes the walk aperiodic. Try it below.")}
      </p>

      <MarkovDistributionFigure t={t} />

      <H2>{tx(t, "mMk_anyTitle", "Solving πP = π for any chain")}</H2>
      <p>
        {tx(t, "mMk_anyBody",
          "Detailed balance was a shortcut for walks that only move between neighbours. Most chains have arrows in every direction, and the shortcut gives wrong answers for them. The general method is to write πP = π out as equations and solve them. Take a weather model with three states: 0 = sunny, 1 = cloudy, 2 = rainy. Tomorrow's weather depends only on today's, through this matrix:")}
      </p>
      <Equation label={tx(t, "mMk_eqWeather", "A weather chain")}
        where={[
          [r`\text{row } 0`, tx(t, "mMk_wW0", "today sunny: tomorrow sunny 0.7, cloudy 0.2, rainy 0.1")],
          [r`\text{row } 1`, tx(t, "mMk_wW1", "today cloudy: 0.3, 0.4, 0.3")],
          [r`\text{row } 2`, tx(t, "mMk_wW2", "today rainy: 0.2, 0.3, 0.5")],
        ]}
        note={tx(t, "mMk_weatherNote", "Every state can go to every state, including itself, so detailed balance does not apply: the flow from 0 to 1 need not equal the flow from 1 to 0, as long as the total flow into each state equals the total flow out.")}>
        {r`P = \begin{pmatrix} 0.7 & 0.2 & 0.1 \\ 0.3 & 0.4 & 0.3 \\ 0.2 & 0.3 & 0.5 \end{pmatrix}`}
      </Equation>
      <p>
        {tx(t, "mMk_colBody",
          "Read πP = π one column at a time. Entry j of πP is Σᵢ π(i)·p_ij: the probability of being at j tomorrow, added up over every state i it could come from today. Setting it equal to π(j) gives one equation per state. Each one uses a column of P, not a row:")}
      </p>
      <Equation label={tx(t, "mMk_eqSystem", "πP = π, one equation per column")}
        where={[
          [r`\pi(j)`, tx(t, "mMk_wPij2", "the long-run probability of state j, the unknown")],
          [r`0.7\,\pi(0) + 0.3\,\pi(1) + 0.2\,\pi(2)`, tx(t, "mMk_wInflow", "everything that flows into state 0 in one step: column 0 of P, weighted by where the chain is")],
          [r`\pi(0) + \pi(1) + \pi(2) = 1`, tx(t, "mMk_wNorm", "the entries of a distribution add up to 1")],
        ]}
        note={tx(t, "mMk_systemNote", "The three flow equations are not independent. Add them up: the left sides give π(0) + π(1) + π(2), and so do the right sides, because every row of P adds up to 1. So one of them carries no information. Drop one and use the sum = 1 instead; without it, any multiple of π would be a solution too.")}>
        {r`\begin{aligned} \pi(0) &= 0.7\,\pi(0) + 0.3\,\pi(1) + 0.2\,\pi(2) \\ \pi(1) &= 0.2\,\pi(0) + 0.4\,\pi(1) + 0.3\,\pi(2) \\ \pi(2) &= 0.1\,\pi(0) + 0.3\,\pi(1) + 0.5\,\pi(2) \\ 1 &= \pi(0) + \pi(1) + \pi(2) \end{aligned}`}
      </Equation>
      <p>
        {tx(t, "mMk_solve1",
          "Solve it step by step. Move the π(0) terms of the first equation to the left: 0.3·π(0) = 0.3·π(1) + 0.2·π(2). Times 10, that is 3π(0) = 3π(1) + 2π(2), so π(0) = π(1) + (2/3)π(2).")}
      </p>
      <p>
        {tx(t, "mMk_solve2",
          "The second equation, also times 10 after moving 0.4·π(1) to the left, says 6π(1) = 2π(0) + 3π(2). Put π(0) from the first one in: 6π(1) = 2π(1) + (4/3)π(2) + 3π(2), so 4π(1) = (13/3)π(2) and π(1) = (13/12)π(2). Then π(0) = (13/12)π(2) + (8/12)π(2) = (21/12)π(2).")}
      </p>
      <p>
        {tx(t, "mMk_solve3",
          "Everything is now a multiple of π(2), and the sum fixes it: (21 + 13 + 12)/12 · π(2) = 1, so π(2) = 12/46. The answer is π = (21, 13, 12)/46 ≈ (0.457, 0.283, 0.261). Check it with the equation that was dropped: 0.1 · 21/46 + 0.3 · 13/46 + 0.5 · 12/46 = (2.1 + 3.9 + 6)/46 = 12/46. ✓")}
      </p>
      <p>
        {tx(t, "mMk_returnBody",
          "π(j) is the long-run share of time spent in j, so its reciprocal is the mean time between two visits: the mean return time 1/π(j). Rain comes back on average every 46/12 ≈ 3.8 days, sunshine every 46/21 ≈ 2.2 days.")}
      </p>
      <LessonTable
        headers={[tx(t, "mMk_tStep", "Step"), tx(t, "mMk_tDo", "What to do")]}
        rows={[
          ["1", tx(t, "mMk_r1", "For every state j, write π(j) = Σᵢ π(i)·p_ij, reading column j of P.")],
          ["2", tx(t, "mMk_r2", "Drop any one of those equations and add π(0) + π(1) + … = 1.")],
          ["3", tx(t, "mMk_r3", "Solve: express every unknown as a multiple of one of them, then use the sum.")],
          ["4", tx(t, "mMk_r4", "Check with the dropped equation, and check that every entry is between 0 and 1.")],
        ]}
      />

      <StationaryFigure t={t} />

      <H3>{tx(t, "mMk_classTitle", "When π is unique, and when πₙ reaches it")}</H3>
      <p>
        {tx(t, "mMk_classBody",
          "The figure's presets break the weather chain on purpose, and each break changes the answer. The words for what breaks:")}
      </p>
      <LessonTable
        headers={[tx(t, "mMk_tTerm", "Term"), tx(t, "mMk_tMeaning", "Meaning"), tx(t, "mMk_tExample", "Example")]}
        rows={[
          [tx(t, "mMk_c1t", "irreducible"), tx(t, "mMk_c1m", "every state can reach every other state, in some number of steps"), tx(t, "mMk_c1e", "the weather chain; the reflecting walk")],
          [tx(t, "mMk_c2t", "closed class"), tx(t, "mMk_c2m", "a group of states that reach each other and that no arrow leaves"), tx(t, "mMk_c2e", "\"two worlds\": {sunny, cloudy} and {rainy}")],
          [tx(t, "mMk_c3t", "absorbing state"), tx(t, "mMk_c3m", "a closed class with one state: p_ii = 1"), tx(t, "mMk_c3e", "\"trap\"; the walls of an absorbing walk")],
          [tx(t, "mMk_c4t", "transient state"), tx(t, "mMk_c4m", "the chain can leave it and never come back; π gives it 0"), tx(t, "mMk_c4e", "sunny and cloudy in \"trap\"")],
          [tx(t, "mMk_c5t", "period d"), tx(t, "mMk_c5m", "returns to a state can happen only after a multiple of d steps (d = the gcd of the loop lengths)"), tx(t, "mMk_c5e", "\"cycle\": d = 3; the reflecting walk: d = 2")],
          [tx(t, "mMk_c6t", "aperiodic"), tx(t, "mMk_c6m", "period 1; any p_ii > 0 is enough in an irreducible chain"), tx(t, "mMk_c6e", "the weather chain; the walk with h > 0")],
        ]}
      />
      <p>
        {tx(t, "mMk_theoremBody",
          "For a chain with finitely many states these facts hold. If it is irreducible, πP = π has exactly one solution, every π(j) is positive, and 1/π(j) is the mean return time. If it is also aperiodic, πₙ → π from every start. If it is periodic, π still exists and still gives the share of time, but πₙ can keep circling. If it has exactly one closed class, π is still unique and is 0 on the transient states. If it has two or more closed classes, πP = π has infinitely many solutions, and the long run depends on the start.")}
      </p>

      <H2>{tx(t, "mMk_absTitle", "Absorbing chains: where it ends and how long it takes")}</H2>
      <p>
        {tx(t, "mMk_absBody",
          "Make the walls of the walk absorbing: from 0 the walk stays at 0, and from k it stays at k. Now every walk ends at one wall or the other, and the stationary distribution says nothing useful: all the probability ends up on the walls, split in a way that depends on the start. The questions become: from i, what is the chance of ending at k rather than 0, and how many steps does it take on average? The classic story is a gambler. They have i coins, win one coin with probability p and lose one with q = 1 − p, and stop when they are ruined (0 coins) or reach their target (k coins).")}
      </p>
      <p>
        {tx(t, "mMk_firstStep",
          "The tool is first-step analysis: condition on the first step. From an inner state i the walk goes to i + 1 with probability p or to i − 1 with probability q. After that step, by the Markov property, it is a fresh start from the new state. So the chance from i is a weighted average of the chances from its neighbours:")}
      </p>
      <Equation label={tx(t, "mMk_eqHit", "Chance of reaching k first (first-step analysis)")}
        where={[
          [r`h_i`, tx(t, "mMk_wHi", "the probability of reaching k before 0, starting from i")],
          [r`q\,h_{i-1}`, tx(t, "mMk_wHq", "first step to the left (probability q), then the chance from i − 1")],
          [r`p\,h_{i+1}`, tx(t, "mMk_wHp", "first step to the right (probability p), then the chance from i + 1")],
          [r`h_0 = 0,\ h_k = 1`, tx(t, "mMk_wHb", "the boundary conditions: at 0 the walk is already ruined, at k it has already arrived")],
        ]}>
        {r`h_i = q\,h_{i-1} + p\,h_{i+1} \quad (0 < i < k), \qquad h_0 = 0, \quad h_k = 1`}
      </Equation>
      <p>
        {tx(t, "mMk_absEx1",
          "Worked example: the exercise's walk with absorbing walls, k = 3, p = 3/4, q = 1/4. There are two unknowns. From 1: h₁ = 1/4 · h₀ + 3/4 · h₂ = 3/4 · h₂. From 2: h₂ = 1/4 · h₁ + 3/4 · h₃ = 1/4 · h₁ + 3/4. Put the second into the first: h₁ = 3/4 · (1/4 · h₁ + 3/4) = 3/16 · h₁ + 9/16. So 13/16 · h₁ = 9/16 and h₁ = 9/13 ≈ 0.69. Then h₂ = 1/4 · 9/13 + 3/4 = 9/52 + 39/52 = 12/13 ≈ 0.92.")}
      </p>
      <p>
        {tx(t, "mMk_timeBody",
          "The expected number of steps works the same way, with one change: the first step itself counts. Whatever it does, one step has been taken, and then the walk expects tᵢ₋₁ or tᵢ₊₁ more:")}
      </p>
      <Equation label={tx(t, "mMk_eqTime", "Expected time until absorption")}
        where={[
          [r`t_i`, tx(t, "mMk_wTi", "the expected number of steps until the walk reaches 0 or k, starting from i")],
          [r`1`, tx(t, "mMk_wT1", "the first step, which is always taken")],
          [r`t_0 = t_k = 0`, tx(t, "mMk_wTb", "at a wall the walk has already stopped")],
        ]}
        note={tx(t, "mMk_timeNote", "For the example: t₁ = 1 + 3/4 · t₂ and t₂ = 1 + 1/4 · t₁. Substituting, t₁ = 1 + 3/4 + 3/16 · t₁, so 13/16 · t₁ = 7/4 and t₁ = 28/13 ≈ 2.15 steps; then t₂ = 1 + 7/13 = 20/13 ≈ 1.54 steps.")}>
        {r`t_i = 1 + q\,t_{i-1} + p\,t_{i+1} \quad (0 < i < k), \qquad t_0 = t_k = 0`}
      </Equation>
      <p>
        {tx(t, "mMk_ruinBody",
          "For the walk these equations have a closed form, the gambler's ruin formula. Write dᵢ = hᵢ − hᵢ₋₁ for the step between neighbouring bars. Since p + q = 1, the left side hᵢ equals p·hᵢ + q·hᵢ, so the equation hᵢ = q·hᵢ₋₁ + p·hᵢ₊₁ can be rearranged as p·(hᵢ₊₁ − hᵢ) = q·(hᵢ − hᵢ₋₁), that is dᵢ₊₁ = r·dᵢ with r = q/p. So the steps form a geometric sequence d₁, r·d₁, r²·d₁, …, and they must add up to hₖ − h₀ = 1. Adding the first i of them gives:")}
      </p>
      <Equation label={tx(t, "mMk_eqRuin", "Gambler's ruin")}
        where={[
          [r`r = q/p`, tx(t, "mMk_wR", "how much more likely a loss is than a win; r > 1 means the game is against the gambler")],
          [r`\frac{1 - r^i}{1 - r^k}`, tx(t, "mMk_wGeo", "the first i steps of the geometric sequence, divided by all k of them")],
          [r`i/k`, tx(t, "mMk_wFair", "the fair case p = q, where every step d_i is the same and the bars lie on a straight line")],
        ]}
        note={tx(t, "mMk_ruinNote", "Check with the example: r = 1/3, so h₁ = (1 − 1/3)/(1 − 1/27) = (2/3)/(26/27) = 9/13. ✓ A slightly unfair game is much worse than it looks: with p = 0.45, a gambler with 4 coins who wants 8 reaches the target with probability 1/(1 + (11/9)⁴) ≈ 0.31, not 0.5. For a fair game the expected duration is t_i = i·(k − i).")}>
        {r`h_i = \frac{1 - r^i}{1 - r^k} \quad (p \ne q), \qquad h_i = \frac{i}{k} \quad (p = q)`}
      </Equation>

      <AbsorbFigure t={t} />

      <Callout type="tip" t={t}>
        {tx(t, "mMk_uses", "Markov chains are everywhere. Google's original PageRank is the stationary distribution of a reader who clicks random links. Snakes and Ladders is a Markov chain, and powers of its matrix give the chance of finishing within n turns. Text predictors are chains whose state is the last few words. Markov chain Monte Carlo methods even run the idea backwards: they design a chain whose stationary distribution is one they want to sample.")}
      </Callout>

      <H2>{tx(t, "mMk_practiceTitle", "Practice")}</H2>
      <p>{tx(t, "mMk_pr1", "1. For the exercise's walk, P(X₂ = 0 | X₀ = 0) = (P²)₀₀ = 1/4: the only route is 0 → 1 → 0, with probability 1 · 1/4.")}</p>
      <p>{tx(t, "mMk_pr2", "2. P(X₁₀ = 3 | X₇ = 1, X₃ = 0) = (P³)₁₃ = 0: three steps change the parity, so from 1 the walk is at 0 or 2.")}</p>
      <p>{tx(t, "mMk_pr3", "3. If the walk starts at 0 for sure, π₀ = (1, 0, 0, 0) and π₂ is row 0 of P²: (1/4, 0, 3/4, 0).")}</p>
      <p>{tx(t, "mMk_pr4", "4. P(X₀ = 1, X₁ = 2, X₂ = 3) = π₀(1) · p₁₂ · p₂₃ = 1/4 · 3/4 · 3/4 = 9/64.")}</p>
      <p>{tx(t, "mMk_pr5", "5. Weather chain: the chance of rain the day after tomorrow, if today is sunny, is (P²)₀₂ = row 0 times column 2 = 0.7 · 0.1 + 0.2 · 0.3 + 0.1 · 0.5 = 0.18.")}</p>
      <p>{tx(t, "mMk_pr6", "6. Any two-state chain with p₀₁ = a and p₁₀ = b (a + b > 0) has π = (b, a)/(a + b): with only one way across, the flow 0 → 1 must equal the flow 1 → 0, so π(0)·a = π(1)·b. For a = 0.1, b = 0.3: π = (3/4, 1/4).")}</p>
      <p>{tx(t, "mMk_pr7", "7. Absorbing walk of the worked example, starting at 2: the chance of ruin is 1 − h₂ = 1 − 12/13 = 1/13.")}</p>
      <p>{tx(t, "mMk_pr8", "8. A fair game (p = 1/2) with target 10, starting with 3 coins: reaching 10 has probability 3/10, and the game lasts 3 · 7 = 21 rounds on average.")}</p>

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
          [tx(t, "mMk_m7w", "build the equations of πP = π from the rows of P"), tx(t, "mMk_m7r", "from the columns"), tx(t, "mMk_m7", "π(j) collects what flows into j, and the arrows into j are column j")],
          [tx(t, "mMk_m8w", "solve the n flow equations without Σπ = 1"), tx(t, "mMk_m8r", "drop one, add Σπ = 1"), tx(t, "mMk_m8", "the flow equations are dependent; alone they only fix π up to a multiple")],
          [tx(t, "mMk_m9w", "use detailed balance for any chain"), tx(t, "mMk_m9r", "solve πP = π"), tx(t, "mMk_m9", "detailed balance holds for walks between neighbours, not in general: in the weather chain π(0)·p₀₁ ≠ π(1)·p₁₀")],
          [tx(t, "mMk_m10w", "tᵢ = q·tᵢ₋₁ + p·tᵢ₊₁"), "tᵢ = 1 + q·tᵢ₋₁ + p·tᵢ₊₁", tx(t, "mMk_m10", "the first step itself takes one unit of time")],
        ]}
      />

      <KeyIdeas t={t} id="mMk" items={[
        tx(t, "mMk_k1", "Markov property: given the present state, the past does not change the probabilities of the future."),
        tx(t, "mMk_k2", "The transition matrix P holds p_ij in row i (from) and column j (to); every row adds up to 1."),
        tx(t, "mMk_k3", "Two steps: add up over the middle state, Σₖ p_ik p_kj, which is exactly matrix multiplication. So n-step probabilities are the entries of Pⁿ, and only the number of steps matters."),
        tx(t, "mMk_k4", "(Pⁿ)ᵢⱼ is the sum, over every path from i to j of n steps, of the product of the step probabilities."),
        tx(t, "mMk_k5", "The distribution is a row vector: πₙ = π₀Pⁿ. Joint probabilities multiply: P(X_m = i, X_{m+n} = j) = π_m(i)(Pⁿ)ᵢⱼ."),
        tx(t, "mMk_k6", "A stationary π solves πP = π. Irreducible, aperiodic chains converge to it from any start; periodic ones, like the reflecting walk, can keep swinging."),
        tx(t, "mMk_k7", "For any chain, write πP = π as one equation per column of P, replace one of them by Σπ = 1 and solve. 1/π(j) is the mean time between visits to j."),
        tx(t, "mMk_k8", "Irreducible: π is unique. Two or more closed classes: many solutions. Transient states get π = 0."),
        tx(t, "mMk_k9", "Absorbing chains: condition on the first step. hᵢ = Σⱼ pᵢⱼ hⱼ for the chance of an outcome, tᵢ = 1 + Σⱼ pᵢⱼ tⱼ for the expected time. For the walk, hᵢ = (1 − rⁱ)/(1 − rᵏ) with r = q/p (gambler's ruin)."),
      ]} />
    </Article>
  );
}
