"use client";

// RL & Game AI 4: Q-learning — learning without a model; the TD target and
// the Q-learning update, worked on a corridor (QCorridor figure); temporal
// difference vs Monte Carlo; on-policy SARSA vs off-policy Q-learning on cliff
// walking (Cliff figure; measured returns and routes); exploration schedules
// and convergence conditions; DQN (replay, target network); policy gradients
// (REINFORCE, actor-critic, PPO); RLHF (reward model, KL penalty), closing the
// loop with the Transformers chapter; C++ (Cliff, TabularAgent); mistakes.

import { CodeBlock, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { QCorridorFigure } from "@/components/lesson/figures/ai/QCorridorFigure";
import { CliffFigure } from "@/components/lesson/figures/ai/CliffFigure";

const r = String.raw;

export function QLearningContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiQl_intro",
          "Value iteration solved the grid world, but only because it was handed the transition probabilities and the rewards. Q-learning needs neither. The agent just acts, sees what happens, and nudges one number in a table after every step. Given enough experience, the table converges to the optimal action values Q*, and acting well becomes picking the largest number in each row. This chapter builds it by hand, compares it with its cautious twin SARSA, and then follows the same idea up to the deep reinforcement learning that plays Atari games and fine-tunes chatbots.")}
      </Lead>

      <Goals t={t} id="aiQl" items={[
        "Write the Q-learning update and compute a few updates by hand.",
        "Explain bootstrapping: why the target uses the agent's own estimate of the next state.",
        "Tell on-policy SARSA from off-policy Q-learning, and predict their routes on the cliff, with measured numbers.",
        "Describe what DQN, policy gradients and RLHF change when the table is replaced by a neural network.",
      ]} />

      <H2>{tx(t, "aiQl_tdTitle", "Learning from one step")}</H2>
      <p>
        {tx(t, "aiQl_tdBody",
          "Recall the Bellman equation for action values: Q*(s, a) is the reward of the step plus the discounted value of the best action in the next state. Value iteration computed the right-hand side by averaging over every possible next state, which needs P(s′ | s, a). Q-learning (Watkins, 1989) uses a single sample instead: the one next state the world actually produced. That sample is noisy, so the agent does not jump to it; it moves its estimate a fraction α of the way, exactly like the incremental mean of the bandit chapter.")}
      </p>
      <Equation label={tx(t, "aiQl_eqQ", "The Q-learning update")}
        where={[
          [r`Q(s,a)`, tx(t, "aiQl_wQ", "the table's current estimate for taking action a in state s")],
          [r`r`, tx(t, "aiQl_wR", "the reward received for this step")],
          [r`s'`, tx(t, "aiQl_wS2", "the state the step led to")],
          [r`\max_{a'} Q(s',a')`, tx(t, "aiQl_wMax", "the best value the table currently gives the next state (0 if the episode ended)")],
          [r`r + \gamma \max_{a'} Q(s',a')`, tx(t, "aiQl_wTarget", "the TD target: a one-step sample of what Q(s, a) should be")],
          [r`\alpha`, tx(t, "aiQl_wAlpha", "the learning rate, between 0 and 1: how far to move toward the target")],
          [r`\gamma`, tx(t, "aiQl_wGamma", "the discount factor")],
        ]}>
        {r`Q(s,a) \leftarrow Q(s,a) + \alpha\,\Big[\underbrace{r + \gamma \max_{a'} Q(s',a')}_{\text{target}} - Q(s,a)\Big]`}
      </Equation>
      <p>
        {tx(t, "aiQl_tdBoot",
          "The bracket is the temporal-difference error: the gap between what the table predicted and what one step of experience suggests. The target itself uses the table, Q(s′, ·), which is still being learned. Updating a guess from another guess is called bootstrapping. It sounds circular, but the reward r is real, and every update injects a little real information; over many episodes the real rewards seep through the whole table.")}
      </p>
      <H3>{tx(t, "aiQl_workedTitle", "Worked by hand: a corridor")}</H3>
      <p>
        {tx(t, "aiQl_workedBody",
          "Five cells in a row, two actions (left, right), the goal at the right end paying +1, every other step 0, α = 0.5 and γ = 0.9. All Q values start at 0, and the agent takes the larger Q, with a coin for ties. In episode 1 it wanders, and every update is 0 + 0.5 · (0 + 0.9 · 0 − 0) = 0, until the step into the goal: Q(3, →) ← 0 + 0.5 · (1 − 0) = 0.5. In episode 2, the step from cell 2 into cell 3 sees max Q(3, ·) = 0.5, so Q(2, →) ← 0 + 0.5 · (0 + 0.9 · 0.5 − 0) = 0.225, and then Q(3, →) ← 0.5 + 0.5 · (1 − 0.5) = 0.75.")}
      </p>
      <LessonTable
        headers={[tx(t, "aiQl_tAfter", "After episode"), "Q(0, →)", "Q(1, →)", "Q(2, →)", "Q(3, →)"]}
        rows={[
          ["1", "0", "0", "0", "0.500"],
          ["2", "0", "0", "0.225", "0.750"],
          ["3", "0", "0.101", "0.450", "0.875"],
          ["4", "0.046", "0.253", "0.619", "0.938"],
          ["5", "0.137", "0.405", "0.731", "0.969"],
          ["8", "0.464", "0.693", "0.868", "0.996"],
          [tx(t, "aiQl_limit", "limit (Q*)"), "0.729", "0.810", "0.900", "1"],
        ]}
      />
      <p>
        {tx(t, "aiQl_workedRead",
          "The reward travels backwards one cell per episode, and the values settle at γ to the power of the steps still needed: 0.9³ = 0.729 from cell 0. Step through it below.")}
      </p>
      <QCorridorFigure t={t} />
      <H3>{tx(t, "aiQl_mcTitle", "Why not wait for the end?")}</H3>
      <p>
        {tx(t, "aiQl_mcBody",
          "The alternative, Monte Carlo learning, waits until the episode ends and moves each Q(s, a) toward the actual return that followed it. Its targets are unbiased, the real total reward, but they are noisy, because they add up every random event of the rest of the episode, and nothing is learned until the episode finishes (a problem when episodes are long or never end). Temporal-difference learning, which Q-learning is an instance of, updates after every step from a target with less noise but some bias, since it trusts the table. In practice TD methods usually learn faster; n-step methods and TD(λ) blend the two.")}
      </p>

      <H2>{tx(t, "aiQl_sarsaTitle", "SARSA: learning what you actually do")}</H2>
      <p>
        {tx(t, "aiQl_sarsaBody",
          "The agent has to explore, so it acts ε-greedily: a random action with probability ε. Q-learning's target ignores this. It uses the best next action, max Q(s′, ·), whatever the agent will really do next, so it learns the values of the greedy policy while behaving with exploration. That makes it off-policy: the policy it learns about differs from the one it follows. SARSA (Rummery and Niranjan, 1994; the name lists the five things one update needs: s, a, r, s′, a′) is the on-policy version: it first picks the next action a′ the ε-greedy way, then uses Q(s′, a′) in the target, and later actually takes a′.")}
      </p>
      <Equation label={tx(t, "aiQl_eqSarsa", "The SARSA update")}
        where={[
          [r`a'`, tx(t, "aiQl_wA2", "the next action as actually chosen, exploration included (and then really taken)")],
          [r`Q(s',a')`, tx(t, "aiQl_wQ2", "replaces Q-learning's max: the value of what the agent will really do next")],
        ]}>
        {r`Q(s,a) \leftarrow Q(s,a) + \alpha\,\big[\, r + \gamma\, Q(s',a') - Q(s,a) \,\big]`}
      </Equation>
      <p>
        {tx(t, "aiQl_cliffBody",
          "The difference matters most next to danger. Cliff walking (Sutton and Barto) is a 12 × 4 grid: start at the bottom left, goal at the bottom right, and the cells between them are a cliff that costs −100 and sends the agent back to the start; every other step costs −1. Measured over 100 runs of 500 episodes each, with α = 0.5, γ = 1 and ε = 0.1:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiQl_tAlgo", "Learner"), tx(t, "aiQl_tRoute", "Greedy route learned"), tx(t, "aiQl_tReturn", "Average reward per episode, episodes 101–500"), tx(t, "aiQl_tFalls", "Falls per 100 late episodes")]}
        rows={[
          ["Q-learning", tx(t, "aiQl_route13", "along the edge, 13 steps, in 100 of 100 runs"), "−49.0", "33"],
          ["SARSA", tx(t, "aiQl_route17", "along the top, 17 steps, in 84 of 100 runs"), "−27.1", "4.6"],
        ]}
      />
      <p>
        {tx(t, "aiQl_cliffRead",
          "Q-learning learns the truly optimal route, right beside the cliff, because its targets assume perfect play from the next step on. But it does not play perfectly: one random step in ten, and along the edge one of the four directions is a fall. SARSA's targets include those random steps, so cells next to the cliff get low values and it learns a route that is safer for an agent that explores. Which one is better depends on the question. If the agent will stop exploring once trained, Q-learning has found the better policy; if it will keep making random moves (a robot with noisy motors), SARSA's is the one to use. The C++ below reproduces it with a different random generator: −50.1 and −28.3, the edge route in 100 runs for Q-learning and in none for SARSA.")}
      </p>
      <CliffFigure t={t} />
      <H3>{tx(t, "aiQl_epsTitle", "How much to explore")}</H3>
      <LessonTable
        headers={["ε", tx(t, "aiQl_tQ", "Q-learning: average reward, episodes 101–500"), tx(t, "aiQl_tS", "SARSA")]}
        rows={[
          ["0", "−13.0", "−13.0"],
          ["0.01", "−16.0", "−16.7"],
          ["0.1", "−49.0", "−27.1"],
          ["0.2", "−104.3", "−42.8"],
        ]}
      />
      <p>
        {tx(t, "aiQl_epsRead",
          "With ε = 0 both find the 13-step route here, because every Q starts at 0, above any real return of this task (all rewards are negative). Untried actions therefore look better than tried ones, and the agent explores them on its own: this is the optimistic start of the bandit chapter, for free. In general, a fixed ε keeps paying for exploration forever, so practical agents decay it, from 1 at the start to 0.01 or so. The convergence proof (Watkins and Dayan, 1992) needs every state–action pair to be tried infinitely often, and a learning rate that shrinks, but not too fast: the sum of the α's must be infinite and the sum of their squares finite (α = 1/n works).")}
      </p>

      <H2>{tx(t, "aiQl_dqnTitle", "When the table is too big: deep Q-networks")}</H2>
      <p>
        {tx(t, "aiQl_dqnBody",
          "A table needs one row per state. Backgammon has about 10²⁰ positions; an Atari screen of 210 × 160 pixels has more states than could ever be listed. The fix is the one the earlier sections of this track built: replace the table with a neural network Q(s, a; θ) that takes the state and outputs a value for each action, and train it by gradient descent to make its output match the TD target, using the squared TD error as the loss. Gerald Tesauro's TD-Gammon (1992) did this for backgammon and came close to the best human players. DeepMind's DQN (Mnih and others, 2015) did it for Atari: one network, the same settings for 49 games, reading only the screen pixels and the score, and scoring at least 75% of a professional human tester's score in 29 of them.")}
      </p>
      <Equation label={tx(t, "aiQl_eqDqn", "The DQN loss")}
        where={[
          [r`\theta`, tx(t, "aiQl_wTheta", "the network's weights, trained by gradient descent")],
          [r`\theta^{-}`, tx(t, "aiQl_wThetaMinus", "a frozen copy of the weights (the target network), refreshed every few thousand steps")],
          [r`(s,a,r,s')`, tx(t, "aiQl_wTuple", "one past step, drawn at random from a replay memory of recent experience")],
        ]}>
        {r`L(\theta) = \Big(\, r + \gamma \max_{a'} Q(s',a';\,\theta^{-}) - Q(s,a;\,\theta) \Big)^{2}`}
      </Equation>
      <p>
        {tx(t, "aiQl_dqnTricks",
          "Two tricks made it stable. Experience replay stores the last million steps and trains on random batches from it, so consecutive, strongly correlated frames do not all push the network the same way, and each step is reused many times. The target network computes the targets with old weights θ⁻, so the target does not move every time the network does. Without them, mixing function approximation, bootstrapping and off-policy learning (Sutton and Barto call the three together the deadly triad) can make the values spiral off to infinity.")}
      </p>

      <H2>{tx(t, "aiQl_pgTitle", "Learning the policy directly")}</H2>
      <p>
        {tx(t, "aiQl_pgBody",
          "Q-learning learns values and derives the policy from them, which is awkward when there are infinitely many actions (a steering angle, a joint torque) or when the best behaviour is random (rock, paper, scissors). Policy-gradient methods learn the policy itself: a network π(a | s; θ) that outputs a probability for each action, adjusted so that actions followed by high returns become more likely. Williams's REINFORCE (1992) is the simplest:")}
      </p>
      <Equation label={tx(t, "aiQl_eqPg", "The policy gradient (REINFORCE)")}
        where={[
          [r`J(\theta)`, tx(t, "aiQl_wJ", "the expected return of the policy with weights θ: what we want to increase")],
          [r`\pi(a_t \mid s_t;\theta)`, tx(t, "aiQl_wPi", "the probability the policy gave to the action it took at step t")],
          [r`\nabla_\theta \ln \pi`, tx(t, "aiQl_wGrad", "the direction in weight space that makes that action more likely")],
          [r`G_t - b`, tx(t, "aiQl_wAdv", "the return that followed, minus a baseline b (often a learned V(s_t)); positive pushes the action up, negative pushes it down")],
        ]}>
        {r`\nabla_\theta J(\theta) = \mathbb{E}\Big[\, \sum_t \big(G_t - b\big)\, \nabla_\theta \ln \pi(a_t \mid s_t;\,\theta) \Big]`}
      </Equation>
      <p>
        {tx(t, "aiQl_pgRead",
          "In words: replay the episode, and for every action taken, raise its probability in proportion to how much better than usual things went afterwards. The baseline does not change the average gradient but cuts its noise a great deal. When the baseline is a learned value function, the method is called actor-critic: the actor is the policy, the critic is V. Proximal Policy Optimisation (PPO, Schulman and others, 2017), the most widely used variant, also limits how far one update can move the probabilities, which keeps training from collapsing after one unlucky batch.")}
      </p>

      <H2>{tx(t, "aiQl_rlhfTitle", "Reinforcement learning from human feedback")}</H2>
      <p>
        {tx(t, "aiQl_rlhfBody",
          "The Transformers chapter ended with a pretrained language model tuned to follow instructions, and promised that the last step was reinforcement learning. Here is that step, in the vocabulary of this section. The state is the prompt plus the words written so far, an action is the next token, the policy is the language model itself, and an episode is one answer. The missing piece is the reward: no formula says how good an answer is. So it is learned. People are shown two answers to the same prompt and pick the better one; a reward model, usually a copy of the language model with a single number as output, is trained to agree with their choices.")}
      </p>
      <Equation label={tx(t, "aiQl_eqRm", "Training the reward model on a comparison")}
        where={[
          [r`y_w, y_l`, tx(t, "aiQl_wYw", "the answer people preferred (w, the winner) and the one they rejected (l)")],
          [r`r(x, y)`, tx(t, "aiQl_wRxy", "the reward model's score for answer y to prompt x")],
          [r`\sigma`, tx(t, "aiQl_wSig", "the sigmoid: σ(r_w − r_l) is the model's probability that people prefer y_w")],
        ]}>
        {r`L = -\ln \sigma\big(r(x, y_w) - r(x, y_l)\big)`}
      </Equation>
      <p>
        {tx(t, "aiQl_rlhfPpo",
          "Then the language model is trained with PPO to write answers the reward model scores highly, with a penalty for drifting too far from the model it started as (measured by the KL divergence between their word probabilities). Without that penalty, the policy finds answers the reward model overrates, the reward design problem of the last chapter in a new form, and the text degrades into whatever fools the scorer. InstructGPT (Ouyang and others, 2022) showed the effect: people preferred the answers of a 1.3-billion-parameter model tuned this way to those of the 175-billion-parameter GPT-3. Newer methods such as DPO (2023) fold the reward model and the RL step into one supervised loss on the comparisons, but the goal, steering a policy with a learned reward, is the same.")}
      </p>

      <H2>{tx(t, "aiQl_codeTitle", "In C++")}</H2>
      <p>
        {tx(t, "aiQl_codeBody",
          "Cliff walking and one tabular agent that can learn either way: the only difference between Q-learning and SARSA is the line that computes the value of what comes next. The main program runs 100 agents of each kind for 500 episodes and prints the averages quoted above.")}
      </p>
      <CodeBlock lang="cpp" filename="qlearning.h" t={t}>{`#include <algorithm>
#include <array>
#include <random>
#include <vector>

// Sutton & Barto's cliff walking: a 12 × 4 grid, start at the bottom left, goal at the bottom right,
// the cells between them are the cliff. Every step costs −1; the cliff costs −100 and sends you back.
struct Cliff {
    static constexpr int W = 12, H = 4, A = 4;             // actions: 0 up, 1 right, 2 down, 3 left
    static constexpr int START = 3 * W + 0, GOAL = 3 * W + 11;

    struct Result { int next; double reward; bool done; };
    static Result step(int s, int a) {
        static constexpr int DX[A] = {0, 1, 0, -1}, DY[A] = {-1, 0, 1, 0};
        const int x = std::clamp(s % W + DX[a], 0, W - 1), y = std::clamp(s / W + DY[a], 0, H - 1);
        if (y == 3 && x > 0 && x < 11) return {START, -100.0, false};   // fell off the cliff
        const int n = y * W + x;
        return {n, -1.0, n == GOAL};
    }
};

enum class Learner { QLearning, Sarsa };

struct TabularAgent {
    std::vector<std::array<double, Cliff::A>> Q;           // one row of action values per cell
    double alpha, gamma, eps;
    std::mt19937 rng;

    TabularAgent(double a, double g, double e, unsigned seed) : Q(Cliff::W * Cliff::H), alpha(a), gamma(g), eps(e), rng(seed) {
        for (auto& row : Q) row.fill(0.0);
    }

    int greedy(int s) {                                    // the best action, ties broken at random
        const double m = *std::max_element(Q[s].begin(), Q[s].end());
        std::array<int, Cliff::A> best{};
        int n = 0;
        for (int a = 0; a < Cliff::A; ++a) if (Q[s][a] == m) best[n++] = a;
        return best[std::uniform_int_distribution<>(0, n - 1)(rng)];
    }
    int act(int s) {                                       // ε-greedy
        if (std::uniform_real_distribution<>(0, 1)(rng) < eps) return std::uniform_int_distribution<>(0, Cliff::A - 1)(rng);
        return greedy(s);
    }

    // Play one episode, learning after every step; returns the total reward.
    double episode(Learner kind) {
        int s = Cliff::START, a = act(s);
        double total = 0;
        for (int t = 0; t < 1000; ++t) {
            const auto [s2, r, done] = Cliff::step(s, a);
            total += r;
            const int a2 = act(s2);                        // the action we will really take next
            double next = 0;                               // value of what comes after (0 at the goal)
            if (!done) next = kind == Learner::QLearning
                ? *std::max_element(Q[s2].begin(), Q[s2].end())   // Q-learning: the best next action
                : Q[s2][a2];                                       // SARSA: the next action actually chosen
            Q[s][a] += alpha * (r + gamma * next - Q[s][a]);       // move toward the TD target
            if (done) break;
            s = s2; a = a2;
        }
        return total;
    }
};`}</CodeBlock>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`#include <print>
#include "qlearning.h"

int main() {
    for (Learner kind : {Learner::QLearning, Learner::Sarsa}) {
        double late = 0;
        int edge = 0;
        for (unsigned run = 1; run <= 100; ++run) {
            TabularAgent agent(0.5, 1.0, 0.1, run);
            for (int e = 0; e < 500; ++e) {
                const double g = agent.episode(kind);
                if (e >= 100) late += g;
            }
            // Does the greedy route run along the cliff edge? (13 steps to the goal)
            agent.eps = 0;
            int s = Cliff::START, steps = 0;
            while (s != Cliff::GOAL && steps < 60) { s = Cliff::step(s, agent.greedy(s)).next; ++steps; }
            if (steps == 13) ++edge;
        }
        std::println("{:10}: average return, episodes 101-500: {:.1f}; greedy route along the edge (13 steps) in {} of 100 runs",
                     kind == Learner::QLearning ? "Q-learning" : "SARSA", late / 100 / 400, edge);
    }
}`}</CodeBlock>

      <H2>{tx(t, "aiQl_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiQl_tMistake", "Mistake"), tx(t, "aiQl_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiQl_e1", "Bootstrapping from a terminal state"), tx(t, "aiQl_e1b", "the goal's (never-updated) Q values leak into the target. At the end of an episode the target is just r.")],
          [tx(t, "aiQl_e2", "Choosing a′ after the update in SARSA"), tx(t, "aiQl_e2b", "the target uses one action and the agent takes another, which is neither SARSA nor Q-learning. Pick a′ first, use it in the target, then take it.")],
          [tx(t, "aiQl_e3", "No exploration with pessimistic starting values"), tx(t, "aiQl_e3b", "the agent repeats the first thing that worked. Explore with ε (decayed over time), or start Q above any real return.")],
          [tx(t, "aiQl_e4", "Judging a learner by its greedy route only"), tx(t, "aiQl_e4b", "Q-learning's edge route is optimal, yet it scores −49 while exploring. Measure the reward actually collected too.")],
          [tx(t, "aiQl_e5", "α = 1 in a random world"), tx(t, "aiQl_e5b", "each update throws away everything learned before and copies one noisy sample. Use a small α (or 1/n) when outcomes are random.")],
          [tx(t, "aiQl_e6", "A neural Q-function without replay or a target network"), tx(t, "aiQl_e6b", "correlated updates and a moving target can make the values diverge (the deadly triad). Use both, as DQN does.")],
        ]}
      />

      <KeyIdeas t={t} id="aiQl" items={[
        "Q-learning needs no model: after each step, Q(s,a) moves a fraction α toward the target r + γ·max Q(s′,·).",
        "The target uses the table's own estimate (bootstrapping); the real rewards spread backwards, one cell per episode in the corridor, to Q* = 0.9³ = 0.729.",
        "TD learning updates every step from a low-noise, slightly biased target; Monte Carlo waits for the true, noisy return.",
        "Q-learning is off-policy: it learns the greedy policy while exploring. SARSA is on-policy: Q(s′,a′) for the action really taken.",
        "On the cliff, Q-learning learns the edge route but averages −49 while exploring; SARSA learns the safer top route and averages −27.",
        "DQN replaces the table with a network, trained on the squared TD error with experience replay and a target network.",
        "Policy gradients raise the probability of actions in proportion to the return that followed; RLHF uses them with a reward model learned from human comparisons.",
      ]} />
    </Article>
  );
}
