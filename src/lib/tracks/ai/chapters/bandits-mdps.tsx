"use client";

// RL & Game AI 3: bandits & MDPs — the agent–environment loop; the k-armed
// bandit, incremental means, greedy / ε-greedy / UCB1 / optimistic starts
// (Bandit figure; measured 10-armed testbed); regret, linear vs logarithmic
// (measured); MDPs: states, transitions, rewards, discount, returns, value
// functions; the Bellman optimality equation worked on the 4 × 3 world; value
// iteration (GridWorld figure; living-reward policies); policy iteration and
// the need for a model; C++ (BanditAgent, GridWorld, valueIteration); mistakes.

import { CodeBlock, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { BanditFigure } from "@/components/lesson/figures/ai/BanditFigure";
import { GridWorldFigure } from "@/components/lesson/figures/ai/GridWorldFigure";

const r = String.raw;

export function BanditsMdpsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiMdp_intro",
          "Minimax and MCTS were handed the rules of the game and could imagine any future. Reinforcement learning drops that assumption. An agent acts in a world it does not know, receives a number called a reward after each action, and must work out from experience which actions lead to more reward. No one gives it the right answers, as in supervised learning; it has only the rewards, and they may come long after the actions that earned them. This chapter sets up the vocabulary with two problems: the bandit, where there is only one situation and the difficulty is exploring, and the Markov decision process, where actions also change the situation.")}
      </Lead>

      <Goals t={t} id="aiMdp" items={[
        "Name the parts of the agent–environment loop: state, action, reward, policy, return.",
        "Compare greedy, ε-greedy and UCB1 on a bandit, and explain regret with measured numbers.",
        "Write the Bellman optimality equation and evaluate it by hand for one cell.",
        "Run value iteration and explain how the living reward and the discount change the policy.",
      ]} />

      <H2>{tx(t, "aiMdp_loopTitle", "The agent and its environment")}</H2>
      <p>
        {tx(t, "aiMdp_loopBody",
          "Reinforcement learning is a loop. At each time step t the agent observes the state of the environment, chooses an action, and the environment answers with a reward and a new state. Then it repeats. Everything the agent learns, it learns from the stream of states, actions and rewards this loop produces.")}
      </p>
      <LessonTable
        headers={[tx(t, "aiMdp_tTerm", "Term"), tx(t, "aiMdp_tMeans", "Meaning"), tx(t, "aiMdp_tEx", "In a game of Breakout")]}
        rows={[
          [tx(t, "aiMdp_l1", "state s"), tx(t, "aiMdp_l1b", "what the agent knows about the situation now"), tx(t, "aiMdp_l1c", "the screen: ball, paddle, bricks")],
          [tx(t, "aiMdp_l2", "action a"), tx(t, "aiMdp_l2b", "one of the choices available in that state"), tx(t, "aiMdp_l2c", "left, right, stay")],
          [tx(t, "aiMdp_l3", "reward r"), tx(t, "aiMdp_l3b", "a number after each action: how good that step was"), tx(t, "aiMdp_l3c", "points for each brick broken")],
          [tx(t, "aiMdp_l4", "policy π"), tx(t, "aiMdp_l4b", "the agent's rule for choosing: a state in, an action (or a probability for each action) out"), tx(t, "aiMdp_l4c", "\"move toward where the ball will land\"")],
          [tx(t, "aiMdp_l5", "return G"), tx(t, "aiMdp_l5b", "the total reward from now to the end, which the agent tries to maximise"), tx(t, "aiMdp_l5c", "the final score")],
        ]}
      />
      <p>
        {tx(t, "aiMdp_loopGoal",
          "The goal is the return, not the next reward. A good chess move may lose a piece now and win the game later. That is what makes the problem hard: the agent must find out which of its many earlier actions deserve the credit for a reward (the credit assignment problem), and it must keep trying actions it is unsure about, or it will never discover better ones.")}
      </p>

      <H2>{tx(t, "aiMdp_banditTitle", "Bandits: explore or exploit")}</H2>
      <p>
        {tx(t, "aiMdp_banditBody",
          "Start with a world that has only one state. In front of you are k slot machines (one-armed bandits, hence the name). Pulling machine a pays a random reward whose average q*(a) you do not know. You have a fixed number of pulls and want to win as much as possible. Every pull is a choice between exploiting, pulling the machine that has paid best so far, and exploring, pulling another one to learn more about it. Exploiting alone can lock you onto a mediocre machine forever; exploring alone wastes pulls on machines you already know are bad.")}
      </p>
      <p>
        {tx(t, "aiMdp_banditQ",
          "Whatever the strategy, it needs an estimate Q(a) of each machine's average: the mean of the rewards it has paid. Storing every reward is unnecessary. If Q is the mean of the first n − 1 rewards and the n-th reward is R, the new mean moves Q toward R by one n-th of the gap:")}
      </p>
      <Equation label={tx(t, "aiMdp_eqInc", "The incremental mean")}
        where={[
          [r`Q_n`, tx(t, "aiMdp_wQn", "the average of the first n − 1 rewards from this machine (the current estimate)")],
          [r`R_n`, tx(t, "aiMdp_wRn", "the n-th reward it has paid")],
          [r`R_n - Q_n`, tx(t, "aiMdp_wErr", "the error: how far the new reward is from the estimate")],
          [r`\tfrac{1}{n}`, tx(t, "aiMdp_wStep", "the step size: the n-th reward moves the mean by 1/n of the error, so each reward ends up with the same weight")],
        ]}>
        {r`Q_{n+1} = Q_n + \frac{1}{n}\big(R_n - Q_n\big)`}
      </Equation>
      <p>
        {tx(t, "aiMdp_banditQWhy",
          "Check it: with Q₁ = 0 and rewards 1, 0, 1, the estimate goes 0 + 1·(1 − 0) = 1, then 1 + ½·(0 − 1) = 0.5, then 0.5 + ⅓·(1 − 0.5) = 0.667, which is (1 + 0 + 1)/3. This shape, new estimate = old estimate + step size × error, is the update rule of the whole of reinforcement learning; the next chapter's Q-learning is the same line with a different target.")}
      </p>
      <LessonTable
        headers={[tx(t, "aiMdp_tRule", "Strategy"), tx(t, "aiMdp_tChooses", "Chooses")]}
        rows={[
          [tx(t, "aiMdp_r1", "greedy"), tx(t, "aiMdp_r1b", "always the machine with the highest Q (ties at random)")],
          [tx(t, "aiMdp_r2", "ε-greedy"), tx(t, "aiMdp_r2b", "with probability ε a machine at random, otherwise the highest Q")],
          [tx(t, "aiMdp_r3", "UCB1"), tx(t, "aiMdp_r3b", "the highest Q(a) + c·√(ln t / N(a)): optimism in the face of uncertainty, the same score MCTS used")],
          [tx(t, "aiMdp_r4", "optimistic start"), tx(t, "aiMdp_r4b", "greedy, but every Q starts far too high (5 here), so each machine disappoints in turn and gets tried")],
        ]}
      />
      <BanditFigure t={t} />

      <H3>{tx(t, "aiMdp_testbedTitle", "The 10-armed testbed")}</H3>
      <p>
        {tx(t, "aiMdp_testbedBody",
          "Sutton and Barto's standard experiment: 2 000 random bandits, each with 10 machines whose averages q*(a) are drawn from a normal distribution with mean 0 and spread 1; each pull pays the machine's average plus normal noise of spread 1. Every strategy plays each bandit for 1 000 pulls. Measured with the code of the figure (and confirmed by the C++ below):")}
      </p>
      <LessonTable
        headers={[tx(t, "aiMdp_tStrat", "Strategy"), tx(t, "aiMdp_tFirst", "Average reward, pulls 1–100"), tx(t, "aiMdp_tLast", "Average reward, pulls 901–1000"), tx(t, "aiMdp_tBest", "Best machine pulled (901–1000)")]}
        rows={[
          [tx(t, "aiMdp_b1", "greedy"), "0.972", "1.037", "34.6%"],
          ["ε-greedy, ε = 0.01", "0.964", "1.295", "59.4%"],
          ["ε-greedy, ε = 0.1", "1.004", "1.352", "79.4%"],
          ["ε-greedy, ε = 0.5", "0.627", "0.756", "51.4%"],
          ["UCB1, c = 2", "0.988", "1.518", "86.2%"],
          [tx(t, "aiMdp_b6", "optimistic start, Q = 5, step 0.1"), "0.357", "1.492", "84.6%"],
        ]}
      />
      <p>
        {tx(t, "aiMdp_testbedRead",
          "The best possible average is 1.539, the expected value of the largest of 10 normal numbers. Greedy settles on the best machine only a third of the time. ε = 0.1 explores enough to find it but then keeps wasting 10% of its pulls; ε = 0.5 wastes half. UCB1 explores where it is still unsure and comes closest. The optimistic start pays for its exploration up front (0.357 over the first 100 pulls, while every machine is disappointing it) and then does nearly as well. (The optimistic agent uses a constant step of 0.1 instead of 1/n: with 1/n the first reward would replace the optimistic 5 completely, and the optimism would last one pull.)")}
      </p>

      <H3>{tx(t, "aiMdp_regretTitle", "Regret")}</H3>
      <p>
        {tx(t, "aiMdp_regretBody",
          "Regret measures what exploring costs: after T pulls, the reward of always pulling the best machine minus the reward the strategy expects to have collected. Any strategy that keeps exploring at a fixed rate, like ε-greedy, loses about ε times the average gap on every pull, so its regret grows in a straight line with T. Lai and Robbins (1985) proved that no strategy can do better than regret growing like ln T, and UCB1 achieves that growth. Measured on the figure's five machines, averaged over 200 runs:")}
      </p>
      <Equation label={tx(t, "aiMdp_eqRegret", "Regret after T pulls")}
        where={[
          [r`q^{*}(a^{*})`, tx(t, "aiMdp_wBestQ", "the average payout of the best machine (0.70 in the figure)")],
          [r`q^{*}(a_t)`, tx(t, "aiMdp_wAt", "the average payout of the machine pulled at step t")],
          [r`T`, tx(t, "aiMdp_wT", "the number of pulls so far")],
        ]}>
        {r`\operatorname{regret}(T) = \sum_{t=1}^{T} \big(q^{*}(a^{*}) - q^{*}(a_t)\big)`}
      </Equation>
      <LessonTable
        headers={[tx(t, "aiMdp_tStrat", "Strategy"), "T = 2 000", "T = 10 000", "T = 50 000"]}
        rows={[
          [tx(t, "aiMdp_g1", "greedy"), "278", "1 338", "6 688"],
          ["ε-greedy, ε = 0.1", "69", "228", "949"],
          ["UCB1, c = √2", "122", "249", "379"],
          ["UCB1, c = 0.5", "32", "43", "55"],
        ]}
      />
      <p>
        {tx(t, "aiMdp_regretRead",
          "Greedy's regret is linear and large: it is stuck on the wrong machine in most runs. ε-greedy's is linear too: five times more pulls (10 000 → 50 000) give 4.2 times more regret. UCB1's barely grows: 249 → 379 over the same stretch. The textbook c = √2 comes from a worst-case proof and explores more than these machines need, so ε-greedy is ahead of it until somewhere past 10 000 pulls; c = 0.5 is better here from the start. Bandits are not just a toy: websites use them to choose which version of a page to show, and the UCB1 score is exactly what MCTS used to choose which move to explore.")}
      </p>

      <H2>{tx(t, "aiMdp_mdpTitle", "Markov decision processes")}</H2>
      <p>
        {tx(t, "aiMdp_mdpBody",
          "Now let actions change the situation. A Markov decision process (MDP) is the standard model: a set of states, a set of actions, transition probabilities P(s′ | s, a) that say where action a in state s can lead, a reward for each step, and a discount factor γ. \"Markov\" means the next state depends only on the current state and action, not on how the agent got there: the state contains everything that matters. The running example is Russell and Norvig's 4 × 3 world in the figure below: the agent moves up, down, left or right, but the ground is slippery, so the move goes the intended way only 80% of the time and slides to either side 10% of the time. Two cells are exits, worth +1 and −1, and every other step pays a small living reward, −0.04.")}
      </p>
      <H3>{tx(t, "aiMdp_returnTitle", "Returns and discounting")}</H3>
      <Equation label={tx(t, "aiMdp_eqReturn", "The discounted return from time t")}
        where={[
          [r`r_{t+1}, r_{t+2}, \ldots`, tx(t, "aiMdp_wR", "the rewards received after time t, one per step")],
          [r`\gamma`, tx(t, "aiMdp_wG", "the discount factor, between 0 and 1: a reward k steps away counts γᵏ as much as one now")],
          [r`G_t`, tx(t, "aiMdp_wGt", "the return: what the agent tries to make as large as possible")],
        ]}>
        {r`G_t = r_{t+1} + \gamma\, r_{t+2} + \gamma^{2} r_{t+3} + \cdots = \sum_{k=0}^{\infty} \gamma^{k}\, r_{t+k+1}`}
      </Equation>
      <p>
        {tx(t, "aiMdp_returnWhy",
          "Discounting does two jobs. It keeps the return finite when a task never ends: with rewards at most r_max, the sum is at most r_max / (1 − γ), so 10 r_max for γ = 0.9. And it expresses a preference for sooner rewards: with γ = 0.9, a reward 10 steps away is worth 0.9¹⁰ = 0.35 of the same reward now. γ = 1 is allowed only when every episode is sure to end, as in the 4 × 3 world with a cost of living.")}
      </p>
      <H3>{tx(t, "aiMdp_valueTitle", "Value functions")}</H3>
      <p>
        {tx(t, "aiMdp_valueBody",
          "Two functions summarise how good things are. The state value V(s) is the expected return from state s when the agent follows its policy from there on. The action value Q(s, a) is the expected return from taking action a in s first and following the policy afterwards. The best possible versions, V* and Q*, belong to the optimal policy, and once Q* is known, acting well is easy: in each state, take the action with the largest Q*. The question is how to compute them.")}
      </p>

      <H2>{tx(t, "aiMdp_bellmanTitle", "The Bellman optimality equation")}</H2>
      <p>
        {tx(t, "aiMdp_bellmanBody",
          "Richard Bellman's observation (1957) is that values satisfy a one-step equation. The value of a state is the value of its best action, and the value of an action is the reward of the next step plus the discounted value of wherever it lands, averaged over where it might land. The equation links each state only to its neighbours, yet it pins down the whole function.")}
      </p>
      <Equation label={tx(t, "aiMdp_eqBellman", "Bellman optimality equation")}
        where={[
          [r`V^{*}(s)`, tx(t, "aiMdp_wV", "the best expected return from state s")],
          [r`a`, tx(t, "aiMdp_wA", "an action; the max picks the best one")],
          [r`P(s' \mid s, a)`, tx(t, "aiMdp_wP", "the probability that action a in state s leads to state s′ (0.8 ahead, 0.1 to each side here)")],
          [r`r`, tx(t, "aiMdp_wRr", "the reward for the step (the living reward, −0.04)")],
          [r`\gamma`, tx(t, "aiMdp_wGamma", "the discount factor")],
          [r`Q^{*}(s,a)`, tx(t, "aiMdp_wQ", "the inner sum: the value of taking a in s and then acting optimally")],
        ]}>
        {r`V^{*}(s) = \max_{a} \underbrace{\sum_{s'} P(s' \mid s, a)\,\big[\, r + \gamma\, V^{*}(s') \,\big]}_{Q^{*}(s,a)}`}
      </Equation>
      <p>
        {tx(t, "aiMdp_bellmanWorked",
          "Check it on the cell just left of the +1 exit, (2, 0), with γ = 1 and the converged values from the figure: V(2, 0) = 0.918 itself, and the cell below it, (2, 1), has 0.660. Moving right reaches the exit with probability 0.8; slipping up bumps into the top edge and stays at (2, 0) with probability 0.1; slipping down lands on (2, 1) with probability 0.1. So Q(right) = 0.8 · (−0.04 + 1) + 0.1 · (−0.04 + 0.918) + 0.1 · (−0.04 + 0.660) = 0.768 + 0.088 + 0.062 = 0.918. The other actions give 0.881 (up), 0.675 (down) and 0.812 (left), so right is best and V(2, 0) = 0.918: the equation holds.")}
      </p>

      <H2>{tx(t, "aiMdp_viTitle", "Value iteration")}</H2>
      <p>
        {tx(t, "aiMdp_viBody",
          "The Bellman equation can be turned into an algorithm by using it as an update. Start with every value at 0. Then sweep over all the states, replacing each value by the right-hand side computed from the current values. Repeat until the values stop changing. Each sweep is a contraction: when γ < 1 it shrinks the distance to V* by at least a factor γ, so the values must converge, and from any starting point. On the 4 × 3 world (γ = 1, but every path ends at an exit) the largest change drops below one millionth after 30 sweeps.")}
      </p>
      <LessonTable
        headers={[tx(t, "aiMdp_tSweep", "After sweep"), "(0, 0)", "(1, 0)", "(2, 0)", "(2, 1)"]}
        rows={[
          ["1", "−0.040", "−0.040", "−0.040", "−0.040"],
          ["2", "−0.080", "−0.080", "0.752", "−0.080"],
          ["3", "−0.120", "0.546", "0.827", "0.454"],
          ["4", "0.372", "0.731", "0.888", "0.567"],
          [tx(t, "aiMdp_conv", "converged (30)"), "0.812", "0.868", "0.918", "0.660"],
        ]}
      />
      <p>
        {tx(t, "aiMdp_viRead",
          "The good news travels one cell per sweep: after sweep 2 only the cell next to the +1 knows about it, after sweep 3 its neighbours, after sweep 4 the far corner. Once the values have converged, the policy is read off them: in each cell, the action with the largest Q. The figure draws it as arrows.")}
      </p>
      <GridWorldFigure t={t} />
      <H3>{tx(t, "aiMdp_livingTitle", "What the rewards say")}</H3>
      <p>
        {tx(t, "aiMdp_livingBody",
          "The rewards are the only way to tell the agent what you want, and it takes them literally. Changing only the living reward (slip 0.2, γ = 1) gives very different policies:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiMdp_tLiving", "Living reward"), tx(t, "aiMdp_tPolicy", "What the optimal policy does")]}
        rows={[
          ["−2", tx(t, "aiMdp_lv1", "every step hurts more than the pit: the cells beside the pit jump straight into it")],
          ["−0.4", tx(t, "aiMdp_lv2", "hurry: from the middle of the bottom row the agent goes straight up past the pit, the shortest way to +1")],
          ["−0.04", tx(t, "aiMdp_lv3", "careful: the bottom-right cell goes the long way round, left and up, to stay away from the pit")],
          ["0", tx(t, "aiMdp_lv4", "no rush at all: the cell beside the pit walks into the wall, which risks nothing, and waits to slip toward +1")],
          ["+0.1 (γ = 0.9)", tx(t, "aiMdp_lv5", "living pays: the agent avoids both exits forever (every value is 0.1 / (1 − 0.9) = 1)")],
        ]}
      />
      <p>
        {tx(t, "aiMdp_livingRead",
          "This is a small version of a large problem, reward design: an agent optimises the reward it is given, not the intention behind it. A game agent rewarded for points may find a loop that scores forever instead of finishing the level; the language models of the last chapter, tuned to please a reward model, can learn to sound confident rather than be right.")}
      </p>

      <H2>{tx(t, "aiMdp_piTitle", "Policy iteration, and the catch")}</H2>
      <p>
        {tx(t, "aiMdp_piBody",
          "Policy iteration is the other classic algorithm. It alternates two steps: evaluate the current policy (compute its V by sweeping the Bellman equation without the max, using the policy's action), then improve it (in each state, switch to the action that is best for those values). Each improvement gives a policy at least as good, and there are finitely many policies, so it ends at the optimum, usually after very few rounds. Both algorithms share a catch: they need the model, the transition probabilities P(s′ | s, a) and the rewards, written down in advance. A robot does not know how its wheels slip; a game agent does not know the game's code. The next chapter learns the same values from experience alone.")}
      </p>

      <H2>{tx(t, "aiMdp_codeTitle", "In C++")}</H2>
      <p>
        {tx(t, "aiMdp_codeBody",
          "A bandit agent with ε-greedy and UCB1 rules, the 4 × 3 world, and value iteration. On the 10-armed testbed (2 000 bandits, 1 000 pulls, a different random generator from the figure) it measures, over pulls 901–1000, greedy 1.031 with the best machine 35.8% of the time, ε = 0.1 1.352 and 80.0%, UCB1 with c = 2 1.496 and 85.3%; value iteration stops after 30 sweeps with the values 0.812, 0.868, 0.918 on the top row.")}
      </p>
      <CodeBlock lang="cpp" filename="bandit.h" t={t}>{`#include <cmath>
#include <random>
#include <vector>

// An agent for the k-armed bandit: a running average Q per arm and a rule to choose.
struct BanditAgent {
    enum class Rule { EpsGreedy, Ucb } rule;
    double param;                                          // ε for EpsGreedy, c for Ucb
    std::vector<double> Q;                                 // average reward of each arm so far
    std::vector<int> N;                                    // times each arm was pulled
    int t = 0;                                             // pulls so far

    BanditAgent(int k, Rule r, double p) : rule(r), param(p), Q(k, 0.0), N(k, 0) {}

    int choose(std::mt19937& rng) {
        const int k = int(Q.size());
        if (rule == Rule::EpsGreedy && std::uniform_real_distribution<>(0, 1)(rng) < param)
            return std::uniform_int_distribution<>(0, k - 1)(rng);          // explore
        int best = 0;
        double bestScore = -1e300;
        for (int a = 0; a < k; ++a) {
            if (rule == Rule::Ucb && N[a] == 0) return a;                   // try every arm once
            const double score = rule == Rule::Ucb
                ? Q[a] + param * std::sqrt(std::log(double(t)) / N[a])      // optimism for rarely pulled arms
                : Q[a];
            if (score > bestScore) { bestScore = score; best = a; }
        }
        return best;                                                        // exploit
    }

    void learn(int a, double reward) {
        ++t;
        ++N[a];
        Q[a] += (reward - Q[a]) / N[a];                                     // incremental mean
    }
};`}</CodeBlock>
      <CodeBlock lang="cpp" filename="grid.h" t={t}>{`#include <algorithm>
#include <cmath>
#include <vector>

// Russell & Norvig's 4 × 3 world. y = 0 is the top row. A wall at (1, 1); exits +1 at (3, 0), −1 at (3, 1).
struct GridWorld {
    static constexpr int W = 4, H = 3;
    double living = -0.04;                                 // reward for every ordinary step
    double slip = 0.2;                                     // chance of sliding sideways (half each way)
    double gamma = 1.0;                                    // discount

    bool wall(int x, int y) const { return x == 1 && y == 1; }
    bool exit(int x, int y, double& r) const {
        if (x == 3 && y == 0) { r = +1; return true; }
        if (x == 3 && y == 1) { r = -1; return true; }
        return false;
    }
    // Where action d (0 up, 1 right, 2 down, 3 left) takes (x, y) when it does not slip.
    void move(int x, int y, int d, int& nx, int& ny) const {
        static constexpr int DX[4] = {0, 1, 0, -1}, DY[4] = {-1, 0, 1, 0};
        nx = x + DX[d]; ny = y + DY[d];
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || wall(nx, ny)) { nx = x; ny = y; }   // bump: stay
    }
    // Q(s, a) = Σ P(s'|s,a) [r + γ V(s')], over the intended move and the two slides.
    double q(const std::vector<double>& V, int x, int y, int d) const {
        const int dirs[3] = {d, (d + 1) % 4, (d + 3) % 4};
        const double prob[3] = {1 - slip, slip / 2, slip / 2};
        double sum = 0;
        for (int i = 0; i < 3; ++i) {
            int nx, ny;
            move(x, y, dirs[i], nx, ny);
            sum += prob[i] * (living + gamma * V[ny * W + nx]);
        }
        return sum;
    }
};

// Value iteration: sweep V(s) ← max_a Q(s, a) until nothing changes by more than tol.
std::vector<double> valueIteration(const GridWorld& g, double tol, int& sweeps) {
    std::vector<double> V(GridWorld::W * GridWorld::H, 0.0);
    for (sweeps = 1; sweeps <= 10000; ++sweeps) {
        std::vector<double> next(V.size(), 0.0);
        double delta = 0;
        for (int y = 0; y < GridWorld::H; ++y)
            for (int x = 0; x < GridWorld::W; ++x) {
                if (g.wall(x, y)) continue;
                double r;
                double v;
                if (g.exit(x, y, r)) v = r;                // an exit is worth its reward, then it ends
                else {
                    v = -1e300;
                    for (int d = 0; d < 4; ++d) v = std::max(v, g.q(V, x, y, d));
                }
                next[y * GridWorld::W + x] = v;
                delta = std::max(delta, std::abs(v - V[y * GridWorld::W + x]));
            }
        V = next;
        if (delta < tol) break;
    }
    return V;
}`}</CodeBlock>

      <H2>{tx(t, "aiMdp_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiMdp_tMistake", "Mistake"), tx(t, "aiMdp_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiMdp_e1", "Pure greedy on a bandit"), tx(t, "aiMdp_e1b", "it stays with the first machine that pays, the best one only about a quarter of the time in the figure. Explore: ε-greedy, UCB1 or optimistic starts.")],
          [tx(t, "aiMdp_e2", "Optimistic starts with a 1/n step"), tx(t, "aiMdp_e2b", "the first real reward erases the optimism at once. Use a constant step, or put the optimism into UCB-style bonuses instead.")],
          [tx(t, "aiMdp_e3", "γ = 1 in a task that never ends"), tx(t, "aiMdp_e3b", "returns are infinite and value iteration never converges (try a positive living reward in the figure). Use γ < 1, or make sure every episode ends.")],
          [tx(t, "aiMdp_e4", "Updating values in place and expecting the textbook numbers"), tx(t, "aiMdp_e4b", "in-place sweeps (Gauss–Seidel) still converge, often faster, but the values after each sweep differ. Keep two arrays to reproduce the synchronous version.")],
          [tx(t, "aiMdp_e5", "Forgetting bumps"), tx(t, "aiMdp_e5b", "probabilities for moves into walls vanish and the outcomes no longer add up to 1. A blocked move stays in place with its probability.")],
          [tx(t, "aiMdp_e6", "Rewarding what is easy to measure instead of what you want"), tx(t, "aiMdp_e6b", "the agent finds the gap (a positive living reward and it never leaves). Reward the goal, and test what the optimal policy actually does.")],
        ]}
      />

      <KeyIdeas t={t} id="aiMdp" items={[
        "Reinforcement learning is a loop: state, action, reward, new state; the agent maximises the return, the total future reward, not the next reward.",
        "A bandit has one state: the whole problem is exploration. Estimates update by Q ← Q + (R − Q)/n.",
        "Greedy gets stuck, ε-greedy explores at a fixed rate (linear regret), UCB1 explores where it is unsure (logarithmic regret: 249 → 379 from 10 000 to 50 000 pulls).",
        "An MDP adds states, transition probabilities, rewards and a discount γ; the return is Σ γᵏ r.",
        "The Bellman optimality equation: V*(s) = max over a of Σ P(s′|s,a)[r + γV*(s′)]; on the 4 × 3 world, 0.918 = 0.768 + 0.088 + 0.062.",
        "Value iteration applies that equation as an update until nothing changes (30 sweeps here); the policy is the best action for the final values.",
        "The rewards define the task literally: a different living reward gives a completely different policy. Value and policy iteration need the model; Q-learning does not.",
      ]} />
    </Article>
  );
}
