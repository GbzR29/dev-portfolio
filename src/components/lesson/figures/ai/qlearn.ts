// ── Tabular Q-learning and SARSA for the AI track's figures ─────────────────
// A deterministic grid world: the agent starts at S, the episode ends at G,
// every step costs −1, and stepping on a cliff cell costs −100 and sends the
// agent back to S (Sutton & Barto's cliff walking, 12 × 4). The table Q holds
// one number per (cell, action); both learners update it after every step:
//   Q-learning: Q(s,a) ← Q(s,a) + α [r + γ max_a' Q(s',a') − Q(s,a)]
//   SARSA:      Q(s,a) ← Q(s,a) + α [r + γ Q(s',a') − Q(s,a)], a' the action it will actually take.
// `Runner` advances one step at a time, so the figures can animate an episode;
// `episode` runs a whole one. The chapter's numbers come from this file.

export type Rng = () => number;

export type World = {
  w: number; h: number;
  moves: readonly [number, number][];     // the actions, as (dx, dy)
  start: [number, number];
  goal: [number, number];
  cliff: (x: number, y: number) => boolean;
  stepReward: number;
  cliffReward: number;
  goalReward: number;
};

/** Sutton & Barto's cliff: 12 × 4, start bottom left, goal bottom right, the cells between them are the cliff. Actions up, right, down, left. */
export const CLIFF: World = {
  w: 12, h: 4, moves: [[0, -1], [1, 0], [0, 1], [-1, 0]], start: [0, 3], goal: [11, 3],
  cliff: (x, y) => y === 3 && x > 0 && x < 11,
  stepReward: -1, cliffReward: -100, goalReward: -1,
};

/** A corridor of n cells with two actions (left, right): start at the left, the goal at the right pays +1, other steps pay 0. */
export const corridor = (n: number): World => ({
  w: n, h: 1, moves: [[-1, 0], [1, 0]], start: [0, 0], goal: [n - 1, 0], cliff: () => false, stepReward: 0, cliffReward: 0, goalReward: 1,
});

export type Learner = "q" | "sarsa";
export type Agent = { world: World; nA: number; Q: Float64Array; alpha: number; gamma: number; eps: number };

export const makeAgent = (world: World, alpha = 0.5, gamma = 1, eps = 0.1): Agent =>
  ({ world, nA: world.moves.length, Q: new Float64Array(world.w * world.h * world.moves.length), alpha, gamma, eps });

export const cell = (wd: World, x: number, y: number) => y * wd.w + x;
export const startCell = (wd: World) => cell(wd, wd.start[0], wd.start[1]);
export const qAt = (a: Agent, s: number) => Array.from({ length: a.nA }, (_, d) => a.Q[s * a.nA + d]);

/** The environment: from cell s, action d → [next cell, reward, done, fell off the cliff]. */
export function envStep(wd: World, s: number, d: number): [number, number, boolean, boolean] {
  const x = s % wd.w, y = Math.floor(s / wd.w);
  const nx = Math.max(0, Math.min(wd.w - 1, x + wd.moves[d][0])), ny = Math.max(0, Math.min(wd.h - 1, y + wd.moves[d][1]));
  if (wd.cliff(nx, ny)) return [startCell(wd), wd.cliffReward, false, true];
  if (nx === wd.goal[0] && ny === wd.goal[1]) return [cell(wd, nx, ny), wd.goalReward, true, false];
  return [cell(wd, nx, ny), wd.stepReward, false, false];
}

export function greedy(a: Agent, s: number, rng: Rng) {
  const q = qAt(a, s), m = Math.max(...q);
  const best = q.flatMap((v, i) => (v === m ? [i] : []));
  return best[Math.floor(rng() * best.length)];
}

/** ε-greedy: a random action with probability ε, otherwise the best one (ties at random). */
export const act = (a: Agent, s: number, rng: Rng) => (rng() < a.eps ? Math.floor(rng() * a.nA) : greedy(a, s, rng));

export type StepLog = {
  s: number; a: number; r: number; s2: number; a2: number;
  nextQ: number; target: number; old: number; next: number; done: boolean; fell: boolean;
};

/** Steps through episodes one action at a time. */
export class Runner {
  s: number;
  a: number;
  total = 0;
  steps = 0;
  episodes = 0;
  returns: number[] = [];
  ag: Agent;
  kind: Learner;
  rng: Rng;
  maxSteps: number;
  constructor(ag: Agent, kind: Learner, rng: Rng, maxSteps = 1000) {
    this.ag = ag; this.kind = kind; this.rng = rng; this.maxSteps = maxSteps;
    this.s = startCell(ag.world);
    this.a = act(ag, this.s, rng);
  }
  /** One action, one update. */
  step(): StepLog {
    const ag = this.ag, wd = ag.world, nA = ag.nA;
    const { s, a } = this;
    const [s2, r, done, fell] = envStep(wd, s, a);
    this.total += r;
    this.steps++;
    const a2 = act(ag, s2, this.rng);
    const nextQ = done ? 0 : this.kind === "q" ? Math.max(...qAt(ag, s2)) : ag.Q[s2 * nA + a2];
    const target = r + ag.gamma * nextQ;                  // the TD target
    const old = ag.Q[s * nA + a];
    ag.Q[s * nA + a] = old + ag.alpha * (target - old);
    const log = { s, a, r, s2, a2, nextQ, target, old, next: ag.Q[s * nA + a], done, fell };
    if (done || this.steps >= this.maxSteps) {
      this.returns.push(this.total);
      this.episodes++;
      this.total = 0;
      this.steps = 0;
      this.s = startCell(wd);
      this.a = act(ag, this.s, this.rng);
    } else {
      this.s = s2;
      this.a = a2;
    }
    return log;
  }
  /** Finish the current episode; returns its total reward. */
  finish(onStep?: (l: StepLog) => void) {
    const n = this.episodes;
    while (this.episodes === n) {
      const l = this.step();
      onStep?.(l);
    }
    return this.returns[this.returns.length - 1];
  }
}

/** One whole episode from the start. */
export function episode(ag: Agent, kind: Learner, rng: Rng, maxSteps = 1000, onStep?: (l: StepLog) => void) {
  const run = new Runner(ag, kind, rng, maxSteps);
  const path = [run.s];
  const total = run.finish(l => { path.push(l.fell ? startCell(ag.world) : l.s2); onStep?.(l); });
  return { total, path };
}

/** The route the greedy policy (no exploration) takes from the start; stops at the goal, the cliff, a loop, or `limit` steps. */
export function greedyPath(ag: Agent, limit = 60) {
  const wd = ag.world, rng = () => 0;
  let s = startCell(wd);
  const path = [s], seen = new Set([s]);
  for (let t = 0; t < limit; t++) {
    const [s2, , done, fell] = envStep(wd, s, greedy(ag, s, rng));
    if (fell) break;
    path.push(s2);
    if (done || seen.has(s2)) break;
    seen.add(s2);
    s = s2;
  }
  return path;
}
