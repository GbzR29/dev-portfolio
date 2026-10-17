"use client";

// RL & Game AI 1: game search — games as trees (tic-tac-toe counted: 255 168
// games, 549 946 nodes, 5 478 positions); minimax with a worked tree
// (GameTree figure); tic-tac-toe solved and played (TicTacToe figure);
// alpha-beta pruning, its window and move ordering (measured node counts);
// depth limits, evaluation functions, the horizon effect, iterative deepening
// and transposition tables; Deep Blue to Stockfish; C++ (alphaBeta, bestMove);
// mistakes.

import { CodeBlock, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { GameTreeFigure } from "@/components/lesson/figures/ai/GameTreeFigure";
import { TicTacToeFigure } from "@/components/lesson/figures/ai/TicTacToeFigure";

const r = String.raw;

export function GameSearchContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiGs_intro",
          "Everything in this track so far learned from data. This section is about agents that act: they choose a move, the world answers, and they choose again. The oldest and simplest kind needs no data at all. It plays a game by imagining every possible future, assuming the opponent plays as well as possible, and choosing the move whose worst case is best. That is minimax, and with one trick, alpha-beta pruning, it powered the chess programs that beat the world champion.")}
      </Lead>

      <Goals t={t} id="aiGs" items={[
        "Describe a two-player game as a tree of positions and count how big it is.",
        "Compute minimax values by hand on a small tree.",
        "Run alpha-beta pruning with its α and β, and explain why it never changes the answer.",
        "Explain depth limits, evaluation functions and the horizon effect, and why move ordering matters.",
      ]} />

      <H2>{tx(t, "aiGs_treeTitle", "A game is a tree")}</H2>
      <p>
        {tx(t, "aiGs_treeBody",
          "Take a game with two players who move in turn, where both see everything (perfect information: no hidden cards, no dice) and one player's win is the other's loss (zero-sum). Chess, checkers, Go and tic-tac-toe are all like this. Such a game is a tree. The root is the starting position; each move is an edge to a new position; the leaves are finished games, each with a score. We call the two players MAX and MIN: the score is written from MAX's point of view, so MAX wants it high and MIN wants it low.")}
      </p>
      <LessonTable
        headers={[tx(t, "aiGs_tPart", "Part of the game"), tx(t, "aiGs_tTtt", "In tic-tac-toe")]}
        rows={[
          [tx(t, "aiGs_p1", "state (a position)"), tx(t, "aiGs_p1b", "the 9 squares, each empty, X or O; who moves next follows from the count of marks")],
          [tx(t, "aiGs_p2", "moves"), tx(t, "aiGs_p2b", "the empty squares")],
          [tx(t, "aiGs_p3", "terminal test"), tx(t, "aiGs_p3b", "three in a row, or a full board")],
          [tx(t, "aiGs_p4", "utility (the score at a leaf)"), tx(t, "aiGs_p4b", "+ for an X win, − for an O win, 0 for a draw")],
        ]}
      />
      <p>
        {tx(t, "aiGs_treeCount",
          "Even tic-tac-toe has a large tree. Walking all of it by program: there are 255 168 different games (131 184 won by X, 77 904 by O, 46 080 drawn), and the tree has 549 946 nodes counting the root. But many of those nodes are the same position reached in a different order: there are only 5 478 different legal positions. Keep that gap in mind; it comes back at the end of the chapter.")}
      </p>

      <H2>{tx(t, "aiGs_mmTitle", "Minimax")}</H2>
      <p>
        {tx(t, "aiGs_mmBody",
          "Suppose both players are perfect. Then the value of a position is easy to define from the bottom up. A finished game is worth its score. If MAX is to move, the position is worth the largest of its children's values, because MAX will pick that child. If MIN is to move, it is worth the smallest. Applied all the way up, this gives the minimax value of the root: the score MAX can guarantee, whatever MIN does, and that MIN can hold MAX to, whatever MAX does.")}
      </p>
      <Equation label={tx(t, "aiGs_eqMm", "The minimax value of a position s")}
        where={[
          [r`s`, tx(t, "aiGs_wS", "a position (a state of the game)")],
          [r`\operatorname{utility}(s)`, tx(t, "aiGs_wU", "the score of a finished game, from MAX's point of view")],
          [r`\operatorname{children}(s)`, tx(t, "aiGs_wC", "the positions one legal move away")],
          [r`\max, \min`, tx(t, "aiGs_wMax", "MAX picks the child with the largest value, MIN the one with the smallest")],
        ]}>
        {r`\operatorname{minimax}(s) = \begin{cases} \operatorname{utility}(s) & \text{if the game is over} \\ \max_{c \,\in\, \operatorname{children}(s)} \operatorname{minimax}(c) & \text{if MAX is to move} \\ \min_{c \,\in\, \operatorname{children}(s)} \operatorname{minimax}(c) & \text{if MIN is to move} \end{cases}`}
      </Equation>
      <p>
        {tx(t, "aiGs_mmWorked",
          "Work it on the tree in the figure. Its leaves, left to right, are 3, 5, 6, 9, 1, 2, 0, −1, 8, 7, 4, 2. The six MAX nodes on the third row take the larger of their two leaves: 5, 9, 2, 0, 8, 4. The three MIN nodes take the smaller of their two children: min(5, 9) = 5, min(2, 0) = 0, min(8, 4) = 4. The root, MAX, takes the largest: max(5, 0, 4) = 5. So MAX's best first move is the left branch, and with best play on both sides the game ends with a score of 5.")}
      </p>
      <GameTreeFigure t={t} />
      <p>
        {tx(t, "aiGs_mmCode",
          "In code, minimax is a recursive function that walks the tree depth first: try a move, ask for the value of the position it makes, take the move back, and keep the best. Nothing is stored except the current path, so the memory needed is tiny (one board per level), while the time grows with the size of the whole tree.")}
      </p>

      <H2>{tx(t, "aiGs_solvedTitle", "Tic-tac-toe, solved")}</H2>
      <p>
        {tx(t, "aiGs_solvedBody",
          "Run minimax from the empty board and the root's value is 0: with perfect play tic-tac-toe is a draw, which everyone who played it as a child suspected. To make the program win quickly instead of eventually, the score of a win is 10 minus the number of marks on the board: a win with 5 marks scores 5, a win with 9 marks scores 1. Every first move has value 0 too, so no first move loses. The values only start to differ later: after X takes a corner, O's only move that does not lose is the centre; any other reply lets X force a win.")}
      </p>
      <TicTacToeFigure t={t} />
      <p>
        {tx(t, "aiGs_solvedOpp",
          "Minimax assumes the opponent is perfect, and that has a cost. Measured over 1 000 games each as O against an X that moves at random: the full-search player wins 77.0% and draws the rest, while a player that only looks 3 moves ahead wins 91.1% (and loses 1.0%). Full search sees that every reasonable move is a draw against perfect play, so it picks among them at random, including moves that give a weak opponent no chance to go wrong. Exploiting a weak opponent needs a model of that opponent, which minimax does not have.")}
      </p>

      <H2>{tx(t, "aiGs_abTitle", "Alpha-beta pruning")}</H2>
      <p>
        {tx(t, "aiGs_abBody",
          "Look again at the tree. After the left branch, MAX knows it can get 5. In the middle branch, MIN's first child is worth 2. MIN will pick 2 or something even smaller there, so the middle branch is worth at most 2 to MAX, and MAX already has 5. Whatever the rest of the middle branch holds, MAX will never go there. There is no need to look. Alpha-beta pruning makes this reasoning systematic with two numbers passed down the tree.")}
      </p>
      <LessonTable
        headers={[tx(t, "aiGs_tSym", "Symbol"), tx(t, "aiGs_tMeans", "Meaning"), tx(t, "aiGs_tStart", "Starts at"), tx(t, "aiGs_tChanged", "Changed by")]}
        rows={[
          ["α", tx(t, "aiGs_alpha", "the best score MAX is already sure of on the path from the root"), "−∞", tx(t, "aiGs_alphaBy", "MAX nodes, when a child gives more")],
          ["β", tx(t, "aiGs_beta", "the best score MIN is already sure of on the path from the root (best for MIN = lowest)"), "+∞", tx(t, "aiGs_betaBy", "MIN nodes, when a child gives less")],
        ]}
      />
      <p>
        {tx(t, "aiGs_abRule",
          "A node only matters if its value can fall strictly between α and β. As soon as α ≥ β at a node, one of the players already has something better elsewhere and will never let the game reach this node, so its remaining children are skipped. That is a cut-off. Run the figure with alpha-beta on. At A2, the first leaf is 6, so A2 is worth at least 6, but MIN at A already holds MAX to 5 (β = 5): A2's other leaf is skipped. At B, the first child is worth 2, but MAX already has 5 at the root (α = 5): all of B2 is skipped. The root still gets 5, after reading 9 leaves instead of 12.")}
      </p>
      <Equation label={tx(t, "aiGs_eqCut", "The cut-off condition")}
        where={[
          [r`\alpha`, tx(t, "aiGs_wA", "the score MAX can already guarantee higher up the path")],
          [r`\beta`, tx(t, "aiGs_wB", "the score MIN can already guarantee higher up the path")],
        ]}>
        {r`\alpha \ge \beta \;\Longrightarrow\; \text{stop searching this node's remaining children}`}
      </Equation>
      <p>
        {tx(t, "aiGs_abSame",
          "Pruning never changes the answer at the root: it only skips positions that could not change it. What it changes is the work. On tic-tac-toe from the empty board, measured with the C++ below:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiGs_tSearch", "Search"), tx(t, "aiGs_tNodes", "Positions visited"), tx(t, "aiGs_tShare", "Share of the full tree")]}
        rows={[
          [tx(t, "aiGs_s1", "minimax"), "549 946", "100%"],
          [tx(t, "aiGs_s2", "alpha-beta, squares in order 0 to 8"), "20 866", "3.8%"],
          [tx(t, "aiGs_s3", "alpha-beta, centre first, then corners, then edges"), "7 865", "1.4%"],
        ]}
      />
      <H3>{tx(t, "aiGs_orderTitle", "Move ordering")}</H3>
      <p>
        {tx(t, "aiGs_orderBody",
          "The ordering line shows the main lesson: alpha-beta prunes most when it tries the best move first, because a good α or β found early cuts more later. With perfect ordering, Knuth and Moore (1975) proved it visits about b^(d/2) positions instead of b^d, where b is the branching factor (the number of moves per position) and d the depth. That is the same as the square root of the work, or equivalently searching twice as deep in the same time. Real programs order moves with cheap rules: captures first in chess, the move that was best at the previous depth, and \"killer moves\" that caused cut-offs in sibling positions.")}
      </p>
      <Equation label={tx(t, "aiGs_eqCost", "Positions visited")}
        where={[
          [r`b`, tx(t, "aiGs_wBf", "the branching factor: about 35 legal moves per position in chess")],
          [r`d`, tx(t, "aiGs_wD", "the search depth in plies (one ply = one player's move)")],
        ]}>
        {r`\text{minimax: } O(b^{d}) \qquad \text{alpha-beta, best ordering: } O(b^{d/2})`}
      </Equation>

      <H2>{tx(t, "aiGs_depthTitle", "When the tree is too big: depth limits")}</H2>
      <p>
        {tx(t, "aiGs_depthBody",
          "Chess has about 35 moves per position and games of about 80 plies. Claude Shannon (1950) estimated its game tree at around 10¹²⁰ nodes; no computer will ever walk it. So real programs stop at a fixed depth and replace the true value of the position there with a guess: an evaluation function. A simple chess evaluation adds up the material (pawn 1, knight and bishop 3, rook 5, queen 9) for each side and subtracts, then adds smaller terms for mobility, king safety and pawn structure. The search is only as good as this guess where it stops.")}
      </p>
      <p>
        {tx(t, "aiGs_depthTtt",
          "The tic-tac-toe figure uses the simplest evaluation that makes sense: the number of lines still open for X minus those still open for O (weighted by how many marks they already hold), scaled to stay well below any real win. Here is what the look-ahead buys, measured over 1 000 games of the limited player as O against a perfect X:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiGs_tLook", "Look-ahead (plies, its own move included)"), tx(t, "aiGs_tLost", "Games lost to a perfect X"), tx(t, "aiGs_tDrawn", "Drawn")]}
        rows={[
          ["1", "35.4%", "64.6%"],
          ["2", "12.7%", "87.3%"],
          ["3", "16.4%", "83.6%"],
          ["4", "0%", "100%"],
          [tx(t, "aiGs_full", "full (9)"), "0%", "100%"],
        ]}
      />
      <p>
        {tx(t, "aiGs_depthRead",
          "Deeper is not always better at small depths (3 plies loses more than 2 here): what decides is whether the cut-off falls just before or just after a threat becomes visible. That is the horizon effect. A program that stops one ply too early does not see the fork coming; in chess, it may play a move that delays a lost piece past its horizon and think the problem has gone. Programs fight it with quiescence search: at the depth limit, keep searching only the forcing moves (captures, checks) until the position is calm, and only then evaluate.")}
      </p>
      <H3>{tx(t, "aiGs_tricksTitle", "Two more tricks every engine uses")}</H3>
      <LessonTable
        headers={[tx(t, "aiGs_tTrick", "Technique"), tx(t, "aiGs_tWhat", "What it does"), tx(t, "aiGs_tWhy", "Why it pays")]}
        rows={[
          [tx(t, "aiGs_k1", "iterative deepening"), tx(t, "aiGs_k1b", "search to depth 1, then 2, then 3, until the time runs out; play the best move of the last finished depth"), tx(t, "aiGs_k1c", "each depth costs about b times the one before, so the shallow ones are almost free, and their best moves give the deeper search a good ordering")],
          [tx(t, "aiGs_k2", "transposition table"), tx(t, "aiGs_k2b", "a hash table from position to its value (and best move), filled during the search"), tx(t, "aiGs_k2c", "the same position is reached by different move orders: tic-tac-toe's 549 946 tree nodes are only 5 478 positions, so with the table each one is searched once")],
        ]}
      />

      <H2>{tx(t, "aiGs_histTitle", "From Deep Blue to today")}</H2>
      <p>
        {tx(t, "aiGs_histBody",
          "IBM's Deep Blue beat the world champion Garry Kasparov in a six-game match in May 1997. It was alpha-beta search on custom chips, about 200 million positions per second, with a hand-tuned evaluation function. In 2007 the checkers program Chinook finished proving that checkers, like tic-tac-toe, is a draw with perfect play. Modern chess engines such as Stockfish still run alpha-beta with all the tricks above, but since 2020 their evaluation function is a small neural network (NNUE) trained on millions of positions: search and learning combined. Go was different: about 250 moves per position defeated alpha-beta and its evaluation functions, and the breakthrough came from the method of the next chapter, Monte Carlo tree search.")}
      </p>

      <H2>{tx(t, "aiGs_codeTitle", "In C++")}</H2>
      <p>
        {tx(t, "aiGs_codeBody",
          "One function does both minimax and alpha-beta: with prune set to false it never cuts. The board is changed in place and restored after each try, so no positions are copied. The order array gives the order in which squares are tried. Run from the empty board it prints the three counts of the table above (549 946, 20 866 and 7 865, value 0 each time), and for the position O · · / X X · / · · · it answers 5: O must block.")}
      </p>
      <CodeBlock lang="cpp" filename="minimax.h" t={t}>{`#include <algorithm>
#include <array>
#include <limits>

// A tic-tac-toe position: 9 cells, row-major. 0 = empty, 1 = X, 2 = O. X moves first.
using Board = std::array<int, 9>;

constexpr int LINES[8][3] = {{0,1,2},{3,4,5},{6,7,8},{0,3,6},{1,4,7},{2,5,8},{0,4,8},{2,4,6}};

int marks(const Board& b) { return int(std::count_if(b.begin(), b.end(), [](int c) { return c != 0; })); }
int toMove(const Board& b) { return marks(b) % 2 == 0 ? 1 : 2; }

// 0 = still playing, 1 = X won, 2 = O won, 3 = draw.
int winner(const Board& b) {
    for (auto& l : LINES)
        if (b[l[0]] != 0 && b[l[0]] == b[l[1]] && b[l[0]] == b[l[2]]) return b[l[0]];
    return marks(b) == 9 ? 3 : 0;
}

long long nodes = 0;                                       // positions visited, for measuring

// The value of b for X: +(10 − marks) if X wins (sooner is better), −(10 − marks) if O wins, 0 for a draw.
// X maximises, O minimises. alpha = the best X is already sure of, beta = the best O is already sure of.
int alphaBeta(Board& b, int alpha, int beta, bool prune, const int* order) {
    ++nodes;
    const int w = winner(b);
    if (w == 3) return 0;
    if (w != 0) return (w == 1 ? 1 : -1) * (10 - marks(b));

    const int me = toMove(b);
    int best = me == 1 ? std::numeric_limits<int>::min() : std::numeric_limits<int>::max();
    for (int k = 0; k < 9; ++k) {
        const int m = order[k];
        if (b[m] != 0) continue;
        b[m] = me;                                         // try the move…
        const int v = alphaBeta(b, alpha, beta, prune, order);
        b[m] = 0;                                          // …and take it back
        if (me == 1) { best = std::max(best, v); alpha = std::max(alpha, v); }
        else         { best = std::min(best, v); beta  = std::min(beta, v); }
        if (prune && alpha >= beta) break;                 // the other player will never let the game get here
    }
    return best;
}

// The best move for the player to move: the one with the best value for them.
int bestMove(Board b, const int* order) {
    const int me = toMove(b);
    int best = -1, bestV = 0;
    for (int k = 0; k < 9; ++k) {
        const int m = order[k];
        if (b[m] != 0) continue;
        b[m] = me;
        const int v = alphaBeta(b, std::numeric_limits<int>::min(), std::numeric_limits<int>::max(), true, order);
        b[m] = 0;
        if (best < 0 || (me == 1 ? v > bestV : v < bestV)) { best = m; bestV = v; }
    }
    return best;
}`}</CodeBlock>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`#include <climits>
#include <print>
#include "minimax.h"

int main() {
    const int natural[9] = {0,1,2,3,4,5,6,7,8};
    const int good[9]    = {4,0,2,6,8,1,3,5,7};          // centre, corners, edges
    Board b{};
    nodes = 0; int v = alphaBeta(b, INT_MIN, INT_MAX, false, natural); std::println("minimax:            value {}, {} nodes", v, nodes);
    nodes = 0; v = alphaBeta(b, INT_MIN, INT_MAX, true, natural);      std::println("alpha-beta:         value {}, {} nodes", v, nodes);
    nodes = 0; v = alphaBeta(b, INT_MIN, INT_MAX, true, good);         std::println("alpha-beta, good order: value {}, {} nodes", v, nodes);
    Board p{2,0,0, 1,1,0, 0,0,0};
    std::println("O to move in O../XX./...: best move {}", bestMove(p, good));
}`}</CodeBlock>

      <H2>{tx(t, "aiGs_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiGs_tMistake", "Mistake"), tx(t, "aiGs_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiGs_e1", "Scoring from the wrong player's point of view"), tx(t, "aiGs_e1b", "the program plays to lose. Keep one convention: scores are for MAX, MAX maximises, MIN minimises (or use negamax, where each level negates the child's value).")],
          [tx(t, "aiGs_e2", "Forgetting to undo the move"), tx(t, "aiGs_e2b", "the board fills with stray marks from earlier branches. Undo right after the recursive call, or search on copies.")],
          [tx(t, "aiGs_e3", "Every win scored the same"), tx(t, "aiGs_e3b", "the program may delay a sure win forever, since all wins look equal. Make sooner wins worth more (and later losses less bad).")],
          [tx(t, "aiGs_e4", "Cutting with α > β instead of α ≥ β"), tx(t, "aiGs_e4b", "still correct, but fewer cut-offs. When α = β the node cannot give a strictly better result: cut.")],
          [tx(t, "aiGs_e5", "Expecting pruning to change the move"), tx(t, "aiGs_e5b", "alpha-beta returns exactly the minimax value; if the answers differ, there is a bug (often α and β passed in the wrong order).")],
          [tx(t, "aiGs_e6", "An evaluation that can outscore a real win"), tx(t, "aiGs_e6b", "the search prefers a good-looking unfinished position to an actual win. Keep guesses strictly between the loss and win scores.")],
        ]}
      />

      <KeyIdeas t={t} id="aiGs" items={[
        "A two-player, perfect-information, zero-sum game is a tree of positions; tic-tac-toe's has 549 946 nodes but only 5 478 different positions.",
        "Minimax: a finished game is worth its score, MAX takes the largest child value, MIN the smallest; the root's value is what both sides can guarantee.",
        "Tic-tac-toe's minimax value is 0: a draw with perfect play. Minimax assumes a perfect opponent, so it does not exploit mistakes.",
        "Alpha-beta passes down α (MAX's guarantee) and β (MIN's guarantee) and stops at a node as soon as α ≥ β; the answer never changes.",
        "Good move ordering makes pruning far stronger: 549 946 → 20 866 → 7 865 positions, and b^(d/2) instead of b^d at best.",
        "Large games stop at a depth and use an evaluation function; the horizon effect is fought with quiescence search.",
        "Iterative deepening and transposition tables make depth-limited alpha-beta practical; Deep Blue and Stockfish are built on it.",
      ]} />
    </Article>
  );
}
