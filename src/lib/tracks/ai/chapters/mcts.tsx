"use client";

// RL & Game AI 2: Monte Carlo tree search — why Go defeated alpha-beta; random
// playouts and flat Monte Carlo (the block puzzle where it fails, measured);
// the four phases (MctsSteps figure); UCB1 and the exploration constant
// (Mcts figure, measured c × budget table); choosing the move, anytime search;
// strength against a perfect player (measured); AlphaGo, AlphaZero and PUCT;
// C++ (Node, iterate, mctsMove); mistakes.

import { CodeBlock, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { MctsStepsFigure } from "@/components/lesson/figures/ai/MctsStepsFigure";
import { MctsFigure } from "@/components/lesson/figures/ai/MctsFigure";

const r = String.raw;

export function MctsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiMcts_intro",
          "Alpha-beta needs two things: a branching factor small enough to search a few moves deep, and an evaluation function that can score a position where the search stops. Go has neither. A position offers about 250 moves, and nobody could write down a formula that says who is winning a half-finished Go game. Monte Carlo tree search drops the evaluation function altogether. To judge a position it plays the game out to the end, many times, with random moves, and counts the wins. Then it grows a tree toward the moves that keep winning.")}
      </Lead>

      <Goals t={t} id="aiMcts" items={[
        "Explain how random playouts estimate the value of a position, and when that estimate misleads.",
        "Run the four phases of MCTS: selection, expansion, simulation and backpropagation.",
        "Explain each term of UCB1 and what the exploration constant c does, with measured numbers.",
        "Describe how AlphaGo and AlphaZero replace the random playouts with neural networks.",
      ]} />

      <H2>{tx(t, "aiMcts_mcTitle", "Judging a position by playing at random")}</H2>
      <p>
        {tx(t, "aiMcts_mcBody",
          "A Monte Carlo method estimates a number by averaging many random samples. Applied to a game: from a position, let both players make random legal moves until the game ends, note who won, and repeat. The fraction of wins is an estimate of how good the position is. It needs no knowledge of the game beyond its rules, and it works in any position, however complicated. The simplest player built on it, flat Monte Carlo, tries every legal move, runs the same number of random playouts after each, and plays the move with the highest win rate.")}
      </p>
      <p>
        {tx(t, "aiMcts_mcFail",
          "Flat Monte Carlo has a blind spot, and tic-tac-toe shows it. Take the position O · · / X X · / · · · with O to move. X threatens to complete the middle row, so O must block at square 5 (squares are numbered 0 to 8, row by row); every other move loses against a sensible X. But in a random playout X is not sensible: it often fails to play 5 itself. Measured over 20 000 playouts per move, O's win rate is 37.2% after square 2 and only 31.5% after the block at 5. Flat Monte Carlo plays 2 and loses. Random playouts measure how good a position is against a random opponent, not against a good one.")}
      </p>
      <LessonTable
        headers={[tx(t, "aiMcts_tMove", "O plays"), tx(t, "aiMcts_tRate", "O's win rate in random playouts"), tx(t, "aiMcts_tTrue", "True value (minimax)")]}
        rows={[
          ["2", "37.2%", tx(t, "aiMcts_loses", "X wins")],
          ["5", "31.5%", tx(t, "aiMcts_draw", "draw")],
          ["1", "29.5%", tx(t, "aiMcts_loses", "X wins")],
          ["6", "16.6%", tx(t, "aiMcts_loses", "X wins")],
          ["7", "16.5%", tx(t, "aiMcts_loses", "X wins")],
          ["8", "13.0%", tx(t, "aiMcts_loses", "X wins")],
        ]}
      />

      <H2>{tx(t, "aiMcts_treeTitle", "Growing a tree: the four phases")}</H2>
      <p>
        {tx(t, "aiMcts_treeBody",
          "The fix is to make the opponent less random where it matters. MCTS keeps a tree of the positions it has explored, starting with just the root. Each node stores two numbers: N, how many playouts went through it, and W, how many of them were won by the player who made the move into it. Inside the tree, moves are chosen by these statistics, so as the tree grows both sides play better and better moves; outside it, playouts stay random. One iteration has four phases:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiMcts_tPhase", "Phase"), tx(t, "aiMcts_tDoes", "What it does")]}
        rows={[
          [tx(t, "aiMcts_ph1", "1. Selection"), tx(t, "aiMcts_ph1b", "start at the root; while the current node has tried all its moves, go to the child with the highest UCB1 score (below)")],
          [tx(t, "aiMcts_ph2", "2. Expansion"), tx(t, "aiMcts_ph2b", "if the node has an untried move, add the position it leads to as a new child")],
          [tx(t, "aiMcts_ph3", "3. Simulation"), tx(t, "aiMcts_ph3b", "from the new node, play random moves to the end of the game (a playout, or rollout)")],
          [tx(t, "aiMcts_ph4", "4. Backpropagation"), tx(t, "aiMcts_ph4b", "walk back up to the root: every node on the path adds 1 to N, and 1 to W if the winner is the player who moved into it (½ for a draw)")],
        ]}
      />
      <MctsStepsFigure t={t} />
      <p>
        {tx(t, "aiMcts_treeWhy",
          "Notice what this does to the puzzle. Once the node for O's move 2 exists, its children are X's replies, and selection inside the tree soon finds the reply 5 that wins for X. Playouts through \"O plays 2\" then mostly go through \"X plays 5\" and end in X wins, so W/N for O's move 2 falls toward its true value. The tree turns the random opponent into a searching one, one level at a time. (Backpropagation here has nothing to do with the backpropagation of neural networks: it only means sending the result back up the path.)")}
      </p>

      <H2>{tx(t, "aiMcts_ucbTitle", "UCB1: which child to follow")}</H2>
      <p>
        {tx(t, "aiMcts_ucbBody",
          "Selection faces a dilemma at every node. Following the child with the best win rate so far exploits what is known, but that rate may be luck after a few playouts, and a rarely tried child may be better. Trying the rarely tried children explores, but wastes playouts on bad moves. UCB1 (Upper Confidence Bound) balances the two with one score per child: its win rate plus a bonus that grows when the child has been visited little compared to its parent.")}
      </p>
      <Equation label={tx(t, "aiMcts_eqUcb", "UCB1 score of child i")}
        where={[
          [r`W_i`, tx(t, "aiMcts_wW", "the wins recorded at child i, for the player choosing at the parent")],
          [r`N_i`, tx(t, "aiMcts_wNi", "how many times child i has been visited")],
          [r`N`, tx(t, "aiMcts_wN", "how many times the parent has been visited (the sum of its children's visits, plus one)")],
          [r`\ln`, tx(t, "aiMcts_wLn", "the natural logarithm: it grows ever more slowly, so exploration never stops but becomes rare")],
          [r`c`, tx(t, "aiMcts_wC", "the exploration constant: 0 means pure exploitation, large means mostly exploration; √2 ≈ 1.41 is the textbook value")],
        ]}>
        {r`\operatorname{UCB1}_i = \underbrace{\frac{W_i}{N_i}}_{\text{exploit}} + \underbrace{c\sqrt{\frac{\ln N}{N_i}}}_{\text{explore}}`}
      </Equation>
      <p>
        {tx(t, "aiMcts_ucbWorked",
          "Work one. A parent visited N = 20 times has two children: A with 6 wins in 10 visits, B with 2 wins in 3. With c = √2, A scores 0.6 + 1.414 · √(ln 20 / 10) = 0.6 + 1.414 · √0.300 = 0.6 + 0.774 = 1.374. B scores 0.667 + 1.414 · √(ln 20 / 3) = 0.667 + 1.414 · √0.999 = 0.667 + 1.413 = 2.080. B is followed: its win rate is similar, and it has barely been tried. A child never visited has N_i = 0 and an infinite score, so every move is tried once before any is tried twice. The bonus comes from the bandit problem of the next chapter, where UCB1 was first proved to waste only a logarithmic number of tries on bad options (Auer, Cesa-Bianchi and Fischer, 2002); Kocsis and Szepesvári (2006) applied it to trees and called the result UCT.")}
      </p>
      <MctsFigure t={t} />
      <p>
        {tx(t, "aiMcts_cTable",
          "How often the search finds the block at 5 in the puzzle, measured over 200 runs per cell with the TypeScript search the figure uses:")}
      </p>
      <LessonTable
        headers={["c", tx(t, "aiMcts_t100", "100 iterations"), tx(t, "aiMcts_t200", "200"), tx(t, "aiMcts_t400", "400"), "1 000"]}
        rows={[
          [tx(t, "aiMcts_c0", "0 (exploit only)"), "45%", "45%", "45%", "45%"],
          ["0.5", "82%", "99%", "100%", "100%"],
          ["1", "69%", "96%", "100%", "100%"],
          ["√2 ≈ 1.41", "49%", "75%", "99%", "100%"],
          ["4", "27%", "32%", "42%", "92%"],
        ]}
      />
      <p>
        {tx(t, "aiMcts_cRead",
          "With c = 0 the search exploits only: it keeps following whichever move looked best after its first playout and never collects the evidence to change its mind, so more iterations do not help. With c = 4 it explores so much that the visits stay spread over all six moves for a long time. Between the two, any reasonable c finds the block within a few hundred iterations; √2 is safe rather than best, and real programs tune c for their game. The C++ version below, with a different random number generator, gives the same picture (c = 0: about 50% at every budget; √2: 98.5% at 400; 4: 86.5% at 1 000).")}
      </p>

      <H2>{tx(t, "aiMcts_moveTitle", "Choosing the move, and when to stop")}</H2>
      <p>
        {tx(t, "aiMcts_moveBody",
          "When the budget is spent, MCTS plays the root's most visited child, not the one with the highest win rate. Visits are the safer signal: a child with a high rate after very few visits may just be lucky, while UCB1 only keeps sending playouts to a child that keeps deserving them. The budget can be anything: a number of iterations, or simply the time left on the clock. Stopping at any moment gives a usable answer, which makes MCTS an anytime algorithm. And after the move is played, the subtree under it can be kept as the start of the next search.")}
      </p>
      <H3>{tx(t, "aiMcts_strengthTitle", "How strong is it?")}</H3>
      <p>
        {tx(t, "aiMcts_strengthBody",
          "Measured over 200 games of MCTS (c = √2) against a perfect minimax player, which can never lose at tic-tac-toe, so the best possible result is a draw:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiMcts_tIters", "Iterations per move"), tx(t, "aiMcts_tAsO", "MCTS as O: games lost"), tx(t, "aiMcts_tAsX", "MCTS as X: games lost")]}
        rows={[
          ["10", "94.5%", "52.5%"],
          ["30", "75.5%", "18.5%"],
          ["100", "59.0%", "0.5%"],
          ["300", "29.5%", "0%"],
          ["1 000", "7.5%", "0%"],
          ["3 000", "0%", "0%"],
        ]}
      />
      <p>
        {tx(t, "aiMcts_strengthRead",
          "Playing second is harder: O faces more positions where exactly one move survives, and the puzzle above is one of them. From the empty board, after 10 000 iterations, the root's visits are 5 381 for the centre, about 780 for each corner and about 260 for each edge. Every first move is a draw with perfect play, but the centre is the move that wins most often when the rest of the game is played by the tree and by chance, and MCTS discovers that by itself.")}
      </p>

      <H2>{tx(t, "aiMcts_alphaTitle", "AlphaGo and AlphaZero")}</H2>
      <p>
        {tx(t, "aiMcts_alphaBody",
          "Rémi Coulom's program Crazy Stone named Monte Carlo tree search in 2006, and MCTS programs soon reached strong amateur level at Go, far beyond what alpha-beta had managed. The jump to world class came from adding neural networks, the subject of the previous section. DeepMind's AlphaGo beat Lee Sedol 4 games to 1 in March 2016. It used two networks: a policy network that gives a probability to each move (trained first on human games, then on games against itself), and a value network that looks at a position and predicts who will win. AlphaZero (2017) dropped the human games altogether and learned chess, shogi and Go from self-play alone. Its search has no random playouts at all: the value network scores each new node, and the policy network steers selection through a variant of UCB1 called PUCT.")}
      </p>
      <Equation label={tx(t, "aiMcts_eqPuct", "PUCT, the selection score of AlphaZero")}
        where={[
          [r`Q(s,a)`, tx(t, "aiMcts_wQ", "the average value of the playouts through move a (the win rate, from the value network instead of random games)")],
          [r`P(s,a)`, tx(t, "aiMcts_wP", "the policy network's probability for move a: a learned guess at which moves are worth trying")],
          [r`N(s), N(s,a)`, tx(t, "aiMcts_wNs", "visits of the position and of the move")],
          [r`c_{\text{puct}}`, tx(t, "aiMcts_wCp", "the exploration constant")],
        ]}>
        {r`a^{*} = \arg\max_a \left[\, Q(s,a) + c_{\text{puct}}\, P(s,a)\,\frac{\sqrt{N(s)}}{1 + N(s,a)} \right]`}
      </Equation>
      <p>
        {tx(t, "aiMcts_alphaLoop",
          "The two parts train each other. The search, guided by the networks, picks better moves than the networks alone; the policy network is then trained to predict the search's visit counts, and the value network to predict the games' results. Better networks make a better search, which makes better training targets. This loop of acting, getting a result and improving is reinforcement learning, which the rest of this section builds from the ground up.")}
      </p>

      <H2>{tx(t, "aiMcts_codeTitle", "In C++")}</H2>
      <p>
        {tx(t, "aiMcts_codeBody",
          "The search on top of the tic-tac-toe board of the previous chapter (minimax.h gives Board, winner and toMove). Each node owns its children through unique_ptr, so deleting the root frees the whole tree. The main program measures how often the search blocks at 5 in the puzzle, over 200 seeds per setting; it prints the numbers quoted above.")}
      </p>
      <CodeBlock lang="cpp" filename="mcts.h" t={t}>{`#include <cmath>
#include <limits>
#include <memory>
#include <random>
#include <vector>
#include "minimax.h"                                      // Board, winner, toMove

// One node of the search tree: a position, and statistics about the move that led to it.
struct Node {
    Board board{};
    int move = -1;                                         // the move that led here (−1 at the root)
    int player = 0;                                        // who made that move (0 at the root)
    Node* parent = nullptr;
    std::vector<std::unique_ptr<Node>> children;
    std::vector<int> untried;                              // legal moves not expanded yet
    int N = 0;                                             // visits
    double W = 0;                                          // wins for player (a draw counts 0.5)
};

std::vector<int> legalMoves(const Board& b) {
    std::vector<int> m;
    if (winner(b) == 0) for (int i = 0; i < 9; ++i) if (b[i] == 0) m.push_back(i);
    return m;
}

// UCB1: the child's win rate plus an exploration bonus that shrinks as the child is visited.
double ucb(const Node& c, int parentN, double k) {
    if (c.N == 0) return std::numeric_limits<double>::infinity();
    return c.W / c.N + k * std::sqrt(std::log(double(parentN)) / c.N);
}

void iterate(Node& root, double k, std::mt19937& rng) {
    // 1. Selection: walk down through fully expanded nodes, always to the best UCB1 child.
    Node* n = &root;
    while (n->untried.empty() && !n->children.empty()) {
        Node* best = nullptr;
        double bestScore = -1.0;
        for (auto& c : n->children) {
            const double s = ucb(*c, n->N, k);
            if (s > bestScore) { bestScore = s; best = c.get(); }
        }
        n = best;
    }
    // 2. Expansion: add one untried move as a new child.
    if (!n->untried.empty()) {
        std::uniform_int_distribution<std::size_t> pick(0, n->untried.size() - 1);
        const std::size_t i = pick(rng);
        const int m = n->untried[i];
        n->untried.erase(n->untried.begin() + long(i));
        auto child = std::make_unique<Node>();
        child->board = n->board;
        child->player = toMove(n->board);
        child->board[m] = child->player;
        child->move = m;
        child->parent = n;
        child->untried = legalMoves(child->board);
        n->children.push_back(std::move(child));
        n = n->children.back().get();
    }
    // 3. Simulation: random moves until the game ends.
    Board b = n->board;
    while (winner(b) == 0) {
        const std::vector<int> ms = legalMoves(b);
        std::uniform_int_distribution<std::size_t> pick(0, ms.size() - 1);
        b[ms[pick(rng)]] = toMove(b);
    }
    const int result = winner(b);                          // 1, 2, or 3 for a draw
    // 4. Backpropagation: every node on the path counts the visit and the result for its mover.
    for (Node* p = n; p != nullptr; p = p->parent) {
        p->N += 1;
        if (result == 3) p->W += 0.5;
        else if (result == p->player) p->W += 1.0;
    }
}

// Run the given number of iterations from board and play the most visited move.
int mctsMove(const Board& board, int iterations, double k, std::mt19937& rng) {
    Node root;
    root.board = board;
    root.untried = legalMoves(board);
    for (int i = 0; i < iterations; ++i) iterate(root, k, rng);
    const Node* best = root.children.front().get();
    for (auto& c : root.children) if (c->N > best->N) best = c.get();
    return best->move;
}`}</CodeBlock>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`#include <print>
#include "mcts.h"

int main() {
    const Board puzzle{2,0,0, 1,1,0, 0,0,0};             // O to move: only 5 saves the game
    for (double k : {0.0, 1.0, std::sqrt(2.0), 4.0})
        for (int iters : {100, 400, 1000}) {
            int right = 0;
            for (unsigned seed = 1; seed <= 200; ++seed) {
                std::mt19937 rng(seed);
                if (mctsMove(puzzle, iters, k, rng) == 5) ++right;
            }
            std::println("c = {:.2f}, {:4} iterations: blocks at 5 in {:5.1f}% of 200 runs", k, iters, right / 2.0);
        }
}`}</CodeBlock>

      <H2>{tx(t, "aiMcts_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiMcts_tMistake", "Mistake"), tx(t, "aiMcts_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiMcts_e1", "Counting wins for the wrong player"), tx(t, "aiMcts_e1b", "each player picks the moves that are best for the opponent. Store W for the player who moved into the node, so the parent, whose player chose that move, maximises it.")],
          [tx(t, "aiMcts_e2", "Playing the child with the best win rate"), tx(t, "aiMcts_e2b", "a child with 1 win in 1 visit beats one with 600 in 1 000. Play the most visited child.")],
          [tx(t, "aiMcts_e3", "c = 0, or no exploration term"), tx(t, "aiMcts_e3b", "the search locks onto an early lucky move: 45% right in the puzzle at any budget. Keep the bonus; tune c for the game.")],
          [tx(t, "aiMcts_e4", "Skipping the terminal check in expansion"), tx(t, "aiMcts_e4b", "the search adds moves after the game is over. A finished position has no untried moves; its playout is just its result.")],
          [tx(t, "aiMcts_e5", "Trusting random playouts too much"), tx(t, "aiMcts_e5b", "they measure play against a random opponent (flat Monte Carlo picks 2 in the puzzle). Let the tree grow, or replace the playouts with a learned value, as AlphaZero does.")],
        ]}
      />

      <KeyIdeas t={t} id="aiMcts" items={[
        "MCTS needs no evaluation function: it judges a position by the results of random games played from it.",
        "Flat Monte Carlo measures play against a random opponent and can be fooled: it prefers square 2 (37.2%) to the only saving move 5 (31.5%).",
        "Each iteration selects down the tree with UCB1, expands one node, simulates a random playout and backpropagates the result along the path.",
        "UCB1 = W/N + c·√(ln N_parent / N): win rate plus a bonus for rarely tried moves; c = 0 gets stuck (45%), a huge c wastes playouts.",
        "The final move is the most visited child; MCTS can stop at any time and still answer.",
        "AlphaGo and AlphaZero replace random playouts with a value network and guide selection with a policy network (PUCT), and train both from self-play.",
      ]} />
    </Article>
  );
}
