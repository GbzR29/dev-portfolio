// ── Multi-armed bandits for the AI track's figures ──────────────────────────
// k slot machines ("arms"); pulling arm a pays a random reward whose mean q*(a)
// the agent does not know. Agents keep a running average Q(a) of what each arm
// paid and choose with a rule: greedy, ε-greedy, UCB1, or greedy with
// optimistic starting values. Two worlds: Bernoulli arms (pay 1 with
// probability p, the figure) and the 10-armed Gaussian testbed of Sutton & Barto
// (q* ~ N(0, 1), reward ~ N(q*, 1)), whose averages the chapter quotes.

export type Rng = () => number;

export type Rule = { kind: "greedy" } | { kind: "eps"; eps: number } | { kind: "ucb"; c: number } | { kind: "optimistic"; q0: number };

export type Agent = { rule: Rule; Q: number[]; N: number[]; t: number };

export function makeAgent(k: number, rule: Rule): Agent {
  const q0 = rule.kind === "optimistic" ? rule.q0 : 0;
  return { rule, Q: Array(k).fill(q0), N: Array(k).fill(0), t: 0 };
}

const argmax = (v: number[], rng: Rng) => {
  let best = -Infinity, ids: number[] = [];
  v.forEach((x, i) => { if (x > best + 1e-12) { best = x; ids = [i]; } else if (Math.abs(x - best) <= 1e-12) ids.push(i); });
  return ids[Math.floor(rng() * ids.length)];                // ties broken at random
};

/** The arm the agent pulls next. */
export function choose(a: Agent, rng: Rng) {
  const r = a.rule;
  if (r.kind === "eps" && rng() < r.eps) return Math.floor(rng() * a.Q.length);   // explore: any arm
  if (r.kind === "ucb") {
    const untried = a.N.findIndex(n => n === 0);
    if (untried >= 0) return untried;                        // pull every arm once first
    return argmax(a.Q.map((q, i) => q + r.c * Math.sqrt(Math.log(a.t) / a.N[i])), rng);
  }
  return argmax(a.Q, rng);                                   // exploit: the best average so far
}

/** Record a reward: the incremental mean Q ← Q + (R − Q)/N (optimistic agents use a constant step 0.1, so the optimism fades slowly). */
export function learn(a: Agent, arm: number, reward: number) {
  a.t++;
  a.N[arm]++;
  const step = a.rule.kind === "optimistic" ? 0.1 : 1 / a.N[arm];
  a.Q[arm] += step * (reward - a.Q[arm]);
}

export function gauss(rng: Rng) {
  let u = 0;
  while (u === 0) u = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/** Average reward and % optimal arm per step over `runs` fresh 10-armed testbeds. */
export function testbed(rule: Rule, runs: number, steps: number, rng: Rng, k = 10) {
  const reward = new Float64Array(steps), optimal = new Float64Array(steps);
  for (let r = 0; r < runs; r++) {
    const q = Array.from({ length: k }, () => gauss(rng));
    const best = q.indexOf(Math.max(...q));
    const a = makeAgent(k, rule);
    for (let t = 0; t < steps; t++) {
      const arm = choose(a, rng);
      const R = q[arm] + gauss(rng);
      learn(a, arm, R);
      reward[t] += R / runs;
      if (arm === best) optimal[t] += 1 / runs;
    }
  }
  return { reward, optimal };
}

/** Bernoulli arms: the figure's slot machines. */
export const pullBernoulli = (p: number, rng: Rng) => (rng() < p ? 1 : 0);
