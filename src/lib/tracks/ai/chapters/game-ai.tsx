"use client";

// RL & Game AI 5: AI in games — what game AI is for; finite state machines
// (the guard; state explosion, hierarchical FSMs); behaviour trees (selector,
// sequence, conditions, actions, statuses; Guard figure in both forms);
// steering behaviours (seek, flee, arrive, wander; measured overshoot) and
// boids (measured spacing and alignment; Steering figure); A* and navigation
// meshes; utility AI and GOAP; where machine learning fits in games; C++
// (nextState, BtNode/Selector/Sequence/Leaf, seek/arrive/integrate); mistakes.

import { CodeBlock, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { GuardFigure } from "@/components/lesson/figures/ai/GuardFigure";
import { SteeringFigure } from "@/components/lesson/figures/ai/SteeringFigure";

const r = String.raw;

export function GameAiContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiGame_intro",
          "The enemies in most games you have played were not trained. They run small, hand-written programs: a state machine that switches between patrolling and chasing, a behaviour tree that tries one plan after another, a few lines of vector arithmetic that make them turn smoothly and keep their distance from each other. This chapter builds those tools, the ones game studios actually ship, and ends by asking where the learning methods of this track fit in.")}
      </Lead>

      <Goals t={t} id="aiGame" items={[
        "Build a guard's behaviour as a finite state machine and as a behaviour tree, and compare the two.",
        "Explain the statuses and node types of a behaviour tree and trace one tick by hand.",
        "Compute seek, flee and arrive steering forces and explain why arrive does not overshoot.",
        "Combine separation, alignment and cohesion into a flock, and choose between FSMs, trees, utility AI and planners.",
      ]} />

      <H2>{tx(t, "aiGame_forTitle", "What game AI is for")}</H2>
      <p>
        {tx(t, "aiGame_forBody",
          "The rest of this track asked how to make an agent as good as possible. A game asks something else: how to make an opponent fun to play against. An enemy that aims perfectly and always knows where you are is easy to write and miserable to fight. Game AI is judged by different rules:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiGame_tNeed", "A game needs"), tx(t, "aiGame_tWhy", "Why")]}
        rows={[
          [tx(t, "aiGame_n1", "believable, readable behaviour"), tx(t, "aiGame_n1b", "the player must understand what the enemy is doing (\"it heard me\", \"it is looking for me\") to outwit it")],
          [tx(t, "aiGame_n2", "designer control"), tx(t, "aiGame_n2b", "a level designer must be able to say \"this guard never leaves the room\" and see exactly that")],
          [tx(t, "aiGame_n3", "a tiny budget"), tx(t, "aiGame_n3b", "at 60 frames per second a frame lasts 16.7 ms, shared with physics, rendering and audio; dozens of characters may get a fraction of a millisecond each")],
          [tx(t, "aiGame_n4", "predictability and debugging"), tx(t, "aiGame_n4b", "when a character does something odd, someone must find out why and fix it before release")],
        ]}
      />

      <H2>{tx(t, "aiGame_fsmTitle", "Finite state machines")}</H2>
      <p>
        {tx(t, "aiGame_fsmBody",
          "A finite state machine (FSM) gives a character a small set of states, each with its own behaviour, and transitions between them that fire on conditions. The character is in exactly one state at a time. Each frame, the current state runs its behaviour and checks its outgoing transitions. The guard in the figure has three states:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiGame_tState", "State"), tx(t, "aiGame_tDoes", "Behaviour"), tx(t, "aiGame_tLeaves", "Leaves when")]}
        rows={[
          [tx(t, "aiGame_s1", "Patrol"), tx(t, "aiGame_s1b", "walk the loop of waypoints"), tx(t, "aiGame_s1c", "it sees the player → Chase")],
          [tx(t, "aiGame_s2", "Chase"), tx(t, "aiGame_s2b", "run at the player, remembering where they are"), tx(t, "aiGame_s2c", "it loses sight → Search")],
          [tx(t, "aiGame_s3", "Search"), tx(t, "aiGame_s3b", "walk to the last known position and look around for 3 s"), tx(t, "aiGame_s3c", "it sees the player → Chase; 3 s and nothing → Patrol")],
        ]}
      />
      <p>
        {tx(t, "aiGame_fsmSee",
          "Seeing is itself a small piece of geometry: the player must be within 170 units, within 50° of the guard's heading (a 100° cone), and no crate may cross the line between them. The \"Search\" state is what makes the guard feel intelligent: it acts on a memory, the last place it saw you. Pac-Man's ghosts (1980) ran on the same idea, with modes for chasing, scattering to their corners and fleeing when frightened.")}
      </p>
      <GuardFigure t={t} />
      <p>
        {tx(t, "aiGame_fsmLimits",
          "State machines are simple, fast and easy to debug: print the state and you know what the character is doing. Their weakness is growth. Each new state may need transitions to and from many others: with n states there can be up to n(n − 1) arrows. Add \"take cover\", \"reload\", \"call for help\" and \"flee when hurt\" to the guard and every one of them needs its own wiring, \"flee when hurt\" from every state. Hierarchical state machines help by nesting states (a \"Combat\" state containing \"Chase\", \"Take cover\" and \"Reload\", with one shared transition out of all of them), but large FSMs remain hard to change.")}
      </p>

      <H2>{tx(t, "aiGame_btTitle", "Behaviour trees")}</H2>
      <p>
        {tx(t, "aiGame_btBody",
          "Behaviour trees became the industry standard after Damián Isla described the AI of Halo 2 in 2005. Instead of states and arrows, the behaviour is a tree that is evaluated from the root on every tick (every frame, or a few times a second). Each node, when ticked, answers with one of three statuses: success, failure, or running (\"not finished yet, tick me again\"). A handful of node types is enough:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiGame_tNode", "Node"), tx(t, "aiGame_tSym", "Drawn as"), tx(t, "aiGame_tRule", "When ticked")]}
        rows={[
          [tx(t, "aiGame_b1", "selector (fallback)"), "?", tx(t, "aiGame_b1b", "ticks its children left to right and returns the first status that is not failure; fails only if all of them fail. \"Try plan A, else B, else C.\"")],
          [tx(t, "aiGame_b2", "sequence"), "→", tx(t, "aiGame_b2b", "ticks its children left to right and returns the first status that is not success; succeeds only if all of them succeed. \"Do this, then that.\"")],
          [tx(t, "aiGame_b3", "condition"), tx(t, "aiGame_b3s", "rounded box"), tx(t, "aiGame_b3b", "checks something about the world: success if true, failure if false; never running")],
          [tx(t, "aiGame_b4", "action"), tx(t, "aiGame_b4s", "box"), tx(t, "aiGame_b4b", "does something in the game: running while it is under way, then success or failure")],
          [tx(t, "aiGame_b5", "decorator"), tx(t, "aiGame_b5s", "one child"), tx(t, "aiGame_b5b", "changes its child's result: invert it, repeat it, give it a time limit or a cooldown")],
        ]}
      />
      <p>
        {tx(t, "aiGame_btGuard",
          "The guard as a tree: a selector over three branches, in order of priority. Branch 1 is a sequence [can I see the player? → chase]. Branch 2 is a sequence [do I know where the player was? → search there]. Branch 3 is the action patrol. Trace a tick in which the player has just ducked behind a crate. The selector ticks branch 1: its condition fails, so the sequence fails. It ticks branch 2: the guard remembers a position, so the condition succeeds, and search returns running; the sequence returns running, and so does the selector, without ever reaching patrol. Three seconds of looking later, search returns success, the guard forgets the position, and on the next tick branch 2 fails and patrol runs. Switch the figure to the behaviour tree view to watch these statuses change.")}
      </p>
      <p>
        {tx(t, "aiGame_btWhy",
          "Where did the transitions go? They are implicit in the order of the branches: because the tree is re-evaluated from the root every tick, a higher-priority branch interrupts a lower one as soon as its condition becomes true, with no arrow to draw. Adding \"flee when hurt\" means adding one branch at the left of the root, not wiring it to every state. Subtrees can be reused (the same \"search\" subtree for every enemy type), and designers edit trees in visual tools; Unreal Engine ships with one. The price is that a tree re-checks its conditions every tick, and that \"which state am I in?\" has no single answer; the figure has to light up a whole path to show it.")}
      </p>

      <H2>{tx(t, "aiGame_steerTitle", "Steering: moving like a living thing")}</H2>
      <p>
        {tx(t, "aiGame_steerBody",
          "State machines and trees decide what to do; something still has to turn \"chase the player\" into motion that looks natural. Craig Reynolds's steering behaviours (1999) do it with one idea. Each behaviour computes a desired velocity, where the character would like to be going right now, and the steering force is the difference between that and the current velocity. The force is capped, so the character can only turn and brake so fast, and it moves in smooth curves instead of snapping to new directions.")}
      </p>
      <Equation label={tx(t, "aiGame_eqSteer", "Seek, and the steering force")}
        where={[
          [r`\mathbf{p}, \mathbf{v}`, tx(t, "aiGame_wPv", "the character's position and current velocity")],
          [r`\mathbf{t}`, tx(t, "aiGame_wT", "the target's position")],
          [r`v_{\max}`, tx(t, "aiGame_wVmax", "the top speed (150 units per second in the figure)")],
          [r`\mathbf{v}_{\text{desired}}`, tx(t, "aiGame_wDes", "full speed straight at the target")],
          [r`\mathbf{f}`, tx(t, "aiGame_wF", "the steering force; truncate caps its length at the maximum force")],
        ]}>
        {r`\mathbf{v}_{\text{desired}} = v_{\max}\,\frac{\mathbf{t}-\mathbf{p}}{\lVert \mathbf{t}-\mathbf{p} \rVert}, \qquad \mathbf{f} = \operatorname{truncate}\big(\mathbf{v}_{\text{desired}} - \mathbf{v},\; f_{\max}\big)`}
      </Equation>
      <p>
        {tx(t, "aiGame_steerKinds",
          "Flee uses the opposite direction. Seek has a flaw: it wants full speed even when it is on top of the target, so it shoots past, turns, and shoots past again. Arrive fixes it by lowering the desired speed inside a slowing radius R, in proportion to the distance d:")}
      </p>
      <Equation label={tx(t, "aiGame_eqArrive", "Arrive: the desired speed")}
        where={[
          [r`d`, tx(t, "aiGame_wD", "the distance to the target")],
          [r`R`, tx(t, "aiGame_wR", "the slowing radius: outside it, full speed; inside, slower and slower")],
        ]}>
        {r`\text{speed}_{\text{desired}} = \begin{cases} v_{\max} & d \ge R \\ v_{\max}\, d / R & d < R \end{cases}`}
      </Equation>
      <p>
        {tx(t, "aiGame_steerMeasured",
          "Measured with the figure's settings (top speed 150, maximum force 400, a reaction time of 0.15 s, the target 400 units away, 60 steps per second): seek passes the target by 28.5 units, crosses it 12 times in 10 seconds and is still moving at 66 units per second at the end. Arrive with R = 100 never passes it and comes to rest within 1 unit after 4.82 s. Wander makes idle characters look alive: it seeks a point on a small circle projected ahead of the character, and nudges that point a little at random each frame, so the path meanders smoothly instead of jittering.")}
      </p>
      <H3>{tx(t, "aiGame_flockTitle", "Flocking")}</H3>
      <p>
        {tx(t, "aiGame_flockBody",
          "Reynolds's earlier and most famous result, boids (1987), showed that a convincing flock needs no leader and no plan: each bird steers by three local rules over the neighbours within a small radius. Separation: move away from neighbours that are too close. Alignment: steer toward their average heading. Cohesion: steer toward their average position. The three forces are weighted and added. Boids animated the bat swarms and penguin armies of Batman Returns (1992), and the same rules move crowds, fish and herds in games today. Measured on the figure's 40 boids after 20 seconds, averaged over 10 starts:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiGame_tWeights", "Weights (separation, alignment, cohesion)"), tx(t, "aiGame_tGap", "Average gap to the nearest boid"), tx(t, "aiGame_tPol", "Heading agreement (1 = all the same)")]}
        rows={[
          ["1.5, 1, 1", "24.1", "0.83"],
          ["0, 1, 1", "0.4", "0.69"],
          ["1.5, 0, 1", "25.2", "0.14"],
          ["1.5, 1, 0", "29.5", "0.93"],
          [tx(t, "aiGame_none", "0, 0, 0 (no rules)"), "34.5", "0.16"],
        ]}
      />
      <p>
        {tx(t, "aiGame_flockRead",
          "Without separation the boids pile onto the same spot (0.4 units apart): cohesion pulls them together and nothing pushes back. Without alignment they stay spaced but face every way (agreement 0.14, close to the 0.16 of boids flying at random), so they swarm instead of travelling together. Heading agreement is the length of the average of their unit heading vectors: 1 if all point the same way, near 0 if they cancel out.")}
      </p>
      <SteeringFigure t={t} />

      <H2>{tx(t, "aiGame_pathTitle", "Finding the way: A* and navigation meshes")}</H2>
      <p>
        {tx(t, "aiGame_pathBody",
          "Steering only looks one step ahead; with a wall between the guard and the player, seek walks into the wall. Pathfinding plans the whole route, and in games that means A*, the search built in the Shortest Paths chapter of the Algorithms track: Dijkstra's algorithm aimed at the goal by a heuristic, the straight-line distance, that never overestimates the remaining cost. The graph is rarely a grid of tiles in modern 3D games. It is a navigation mesh: the walkable floor cut into convex polygons, where any two points inside one polygon can be joined by a straight line. A* finds a chain of polygons, a smoothing pass straightens it into a few waypoints, and steering follows them, with separation keeping characters from bumping into each other. Decision, path, steering: most game characters are those three layers.")}
      </p>

      <H2>{tx(t, "aiGame_decideTitle", "Other ways to decide")}</H2>
      <p>
        {tx(t, "aiGame_decideBody",
          "Two more families are common. Utility AI scores every possible action with a formula over the situation (hunger, distance, danger, each passed through a response curve) and takes the highest score; The Sims chooses what a Sim does next this way, which makes behaviour smoothly context-dependent rather than switched. Goal-oriented action planning (GOAP), used in F.E.A.R. (2005), gives each action preconditions and effects (\"shoot\" needs \"weapon loaded\" and makes \"target dead\"), and runs A* over the space of world states to find a sequence of actions that reaches a goal, so soldiers improvise plans the designers never wrote out.")}
      </p>
      <LessonTable
        headers={[tx(t, "aiGame_tTech", "Technique"), tx(t, "aiGame_tGood", "Good at"), tx(t, "aiGame_tBad", "Struggles with")]}
        rows={[
          [tx(t, "aiGame_k1", "finite state machine"), tx(t, "aiGame_k1b", "few, clearly separate modes; trivially fast and debuggable"), tx(t, "aiGame_k1c", "growth: transitions multiply with every new state")],
          [tx(t, "aiGame_k2", "behaviour tree"), tx(t, "aiGame_k2b", "many prioritised behaviours, reusable subtrees, designer tools"), tx(t, "aiGame_k2c", "smooth trade-offs between options; re-checks everything each tick")],
          [tx(t, "aiGame_k3", "utility AI"), tx(t, "aiGame_k3b", "weighing many needs at once; graceful, varied choices"), tx(t, "aiGame_k3c", "tuning dozens of curves; harder to predict exactly")],
          [tx(t, "aiGame_k4", "GOAP / planning"), tx(t, "aiGame_k4b", "multi-step plans that adapt to the situation"), tx(t, "aiGame_k4c", "CPU cost of the search; plans can look odd without care")],
          [tx(t, "aiGame_k5", "reinforcement learning"), tx(t, "aiGame_k5b", "superhuman play in a fixed, well-defined game"), tx(t, "aiGame_k5c", "designer control, training cost, behaviour that is hard to explain or adjust")],
        ]}
      />

      <H2>{tx(t, "aiGame_mlTitle", "Where learning fits")}</H2>
      <p>
        {tx(t, "aiGame_mlBody",
          "Reinforcement learning has reached the top of real video games: DeepMind's AlphaStar reached Grandmaster level in StarCraft II in 2019, and OpenAI Five beat the world champion team at Dota 2 the same year, each after thousands of years of simulated play. Yet the enemies in shipped games are still almost all hand-written. A trained policy is expensive to train, hard to steer (\"be a bit easier on the second level\" is not a reward function), and impossible to read when it does something strange, which is everything the table at the start of this chapter asked for, the other way round. Learning appears around the edges instead: bots that play-test levels thousands of times, animation systems that pick motion clips with learned models, opponents in racing and fighting games that imitate recorded human players, and tools such as Unity ML-Agents for experiments. The techniques of this section meet in the middle: game trees and MCTS for board and strategy games, steering and trees for characters, and reinforcement learning wherever the goal is simply to play as well as possible.")}
      </p>

      <H2>{tx(t, "aiGame_codeTitle", "In C++")}</H2>
      <p>
        {tx(t, "aiGame_codeBody",
          "The guard's state machine as one switch, a behaviour tree with selector, sequence and leaf nodes, and the steering of the figure. The main program feeds the machine a scripted run of senses (it prints Patrol Chase Chase Search Search Patrol), ticks the same logic as a tree (patrol chase chase search search search patrol), and compares seek and arrive: seek overshoots by 28.5 and never settles, arrive settles at 4.82 s.")}
      </p>
      <CodeBlock lang="cpp" filename="gameai.h" t={t}>{`#include <algorithm>
#include <cmath>
#include <functional>
#include <memory>
#include <vector>

// ── A finite state machine ───────────────────────────────────────────────────
enum class GuardState { Patrol, Chase, Search };

struct Senses { bool seesPlayer; bool doneLooking; };

// One tick: the state decides what to check, and a condition moves it to another state.
GuardState nextState(GuardState s, const Senses& in) {
    switch (s) {
        case GuardState::Patrol: return in.seesPlayer ? GuardState::Chase : GuardState::Patrol;
        case GuardState::Chase:  return in.seesPlayer ? GuardState::Chase : GuardState::Search;
        case GuardState::Search:
            if (in.seesPlayer) return GuardState::Chase;
            return in.doneLooking ? GuardState::Patrol : GuardState::Search;
    }
    return s;
}

// ── A behaviour tree ─────────────────────────────────────────────────────────
enum class Status { Success, Failure, Running };

struct BtNode {
    virtual ~BtNode() = default;
    virtual Status tick() = 0;
};

// Leaves wrap a function: a condition answers Success or Failure, an action may also say Running.
struct Leaf : BtNode {
    std::function<Status()> fn;
    explicit Leaf(std::function<Status()> f) : fn(std::move(f)) {}
    Status tick() override { return fn(); }
};

// Selector ("?"): try children left to right; stop at the first one that does not fail.
struct Selector : BtNode {
    std::vector<std::unique_ptr<BtNode>> kids;
    Status tick() override {
        for (auto& k : kids) if (Status s = k->tick(); s != Status::Failure) return s;
        return Status::Failure;
    }
};

// Sequence ("→"): run children left to right; stop at the first one that does not succeed.
struct Sequence : BtNode {
    std::vector<std::unique_ptr<BtNode>> kids;
    Status tick() override {
        for (auto& k : kids) if (Status s = k->tick(); s != Status::Success) return s;
        return Status::Success;
    }
};

// ── Steering ─────────────────────────────────────────────────────────────────
struct Vec2 {
    double x = 0, y = 0;
    Vec2 operator+(Vec2 o) const { return {x + o.x, y + o.y}; }
    Vec2 operator-(Vec2 o) const { return {x - o.x, y - o.y}; }
    Vec2 operator*(double k) const { return {x * k, y * k}; }
    double length() const { return std::hypot(x, y); }
    Vec2 normalized() const { const double l = length(); return l > 1e-9 ? Vec2{x / l, y / l} : Vec2{}; }
    Vec2 truncated(double max) const { const double l = length(); return l > max ? *this * (max / l) : *this; }
};

struct Mover { Vec2 pos, vel; double maxSpeed = 150, maxForce = 400; };

// Each behaviour returns a steering force: desired velocity minus current velocity.
Vec2 seek(const Mover& m, Vec2 target) {
    return (target - m.pos).normalized() * m.maxSpeed - m.vel;
}
Vec2 arrive(const Mover& m, Vec2 target, double slowRadius) {
    const Vec2 off = target - m.pos;
    const double d = off.length();
    const double speed = d < slowRadius ? m.maxSpeed * d / slowRadius : m.maxSpeed;   // slow down near the target
    return off.normalized() * speed - m.vel;
}

// Euler step: the force (scaled by 1 / reaction time, capped) changes the velocity, the velocity the position.
void integrate(Mover& m, Vec2 force, double dt, double reaction = 0.15) {
    m.vel = (m.vel + (force * (1.0 / reaction)).truncated(m.maxForce) * dt).truncated(m.maxSpeed);
    m.pos = m.pos + m.vel * dt;
}`}</CodeBlock>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`#include <format>
#include <print>
#include <string>
#include "gameai.h"

int main() {
    // The FSM: a scripted run of senses
    GuardState s = GuardState::Patrol;
    const Senses script[] = {{false, false}, {true, false}, {true, false}, {false, false}, {false, false}, {false, true}};
    const char* names[] = {"Patrol", "Chase", "Search"};
    for (auto in : script) { s = nextState(s, in); std::print("{} ", names[int(s)]); }
    std::println("");

    // The behaviour tree with the same logic
    bool sees = false, knows = false; int looked = 0; std::string did;
    Selector root;
    auto chase = std::make_unique<Sequence>();
    chase->kids.push_back(std::make_unique<Leaf>([&] { return sees ? Status::Success : Status::Failure; }));
    chase->kids.push_back(std::make_unique<Leaf>([&] { did = "chase"; knows = true; looked = 0; return Status::Running; }));
    auto search = std::make_unique<Sequence>();
    search->kids.push_back(std::make_unique<Leaf>([&] { return knows ? Status::Success : Status::Failure; }));
    search->kids.push_back(std::make_unique<Leaf>([&] { did = "search"; if (++looked < 3) return Status::Running; knows = false; return Status::Success; }));
    root.kids.push_back(std::move(chase));
    root.kids.push_back(std::move(search));
    root.kids.push_back(std::make_unique<Leaf>([&] { did = "patrol"; return Status::Running; }));
    for (bool see : {false, true, true, false, false, false, false}) { sees = see; root.tick(); std::print("{} ", did); }
    std::println("");

    // Seek against arrive: 400 units to the target, 60 steps per second, 10 seconds
    for (int mode = 0; mode < 2; ++mode) {
        Mover m;
        const Vec2 target{400, 0};
        double overshoot = 0, settled = -1;
        for (int k = 1; k <= 600; ++k) {
            integrate(m, mode == 0 ? seek(m, target) : arrive(m, target, 100), 1.0 / 60);
            overshoot = std::max(overshoot, m.pos.x - target.x);
            if (settled < 0 && (target - m.pos).length() < 1 && m.vel.length() < 1) settled = k / 60.0;
        }
        std::println("{}: overshoot {:.1f} px, speed after 10 s {:.1f}, settled: {}", mode == 0 ? "seek  " : "arrive",
                     overshoot, m.vel.length(), settled < 0 ? std::string("never") : std::format("at {:.2f} s", settled));
    }
}`}</CodeBlock>

      <H2>{tx(t, "aiGame_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiGame_tMistake", "Mistake"), tx(t, "aiGame_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiGame_e1", "An enemy that knows everything"), tx(t, "aiGame_e1b", "it aims through walls and finds the player at once, and players call it cheating. Give it senses (cones, line of sight, hearing) and act only on what it perceived.")],
          [tx(t, "aiGame_e2", "Wiring every state to every other"), tx(t, "aiGame_e2b", "the machine becomes unchangeable. Nest states hierarchically, or move to a behaviour tree when the arrows multiply.")],
          [tx(t, "aiGame_e3", "Forgetting \"running\" in a behaviour tree"), tx(t, "aiGame_e3b", "a long action is restarted from scratch, or skipped, every tick. Actions that take time return running and keep their progress.")],
          [tx(t, "aiGame_e4", "Seek to stop at a point"), tx(t, "aiGame_e4b", "the character overshoots and circles for ever (28.5 units past, 12 crossings in 10 s). Use arrive with a slowing radius.")],
          [tx(t, "aiGame_e5", "Steering forces with no cap"), tx(t, "aiGame_e5b", "characters snap instantly to any direction and look robotic. Truncate the force, and the speed.")],
          [tx(t, "aiGame_e6", "Flocking without separation"), tx(t, "aiGame_e6b", "cohesion pulls every boid to the same point (0.4 units apart). Always include separation, with a smaller radius than the other rules.")],
        ]}
      />

      <KeyIdeas t={t} id="aiGame" items={[
        "Game AI aims at fun, readability and designer control within a tiny CPU budget, not at winning.",
        "A finite state machine has one active state and transitions on conditions; it is simple and debuggable but its wiring grows fast.",
        "A behaviour tree is re-ticked from the root; selectors try options in priority order, sequences run steps in order, and every node answers success, failure or running.",
        "Steering = desired velocity − current velocity, capped: seek overshoots (28.5 units here), arrive slows inside a radius and settles (4.82 s).",
        "Boids flock from three local rules: separation, alignment and cohesion; drop separation and they collapse onto one point.",
        "Characters stack three layers: decide (FSM, tree, utility, GOAP), plan a path (A* on a navigation mesh), and steer along it.",
        "Reinforcement learning beats champions in StarCraft II and Dota 2, but shipped enemies stay hand-written because designers need control.",
      ]} />
    </Article>
  );
}
