// ── Practice generators: graphs, Euler, trees, planar graphs ─────────────────
// Every degree list shown comes from a graph that was actually built (a
// random spanning tree plus extra edges, simple and connected), so the
// question always describes something that exists. Answers are whole numbers.
// The words live in `ask` (translated); the TeX holds only symbols.

import { fr } from "./frac";
import { pick, ri, type Gen, type Level, type Problem } from "./problem";

const amber = (s: string | number) => `\\amber{${s}}`;
const num = (x: number) => ({ label: "", answer: { kind: "num" as const, value: fr(x) } });
const one = (key: string, ask: [string, string], tex: string, steps: string[], ans: number): Problem =>
  ({ key, ask, tex, steps, short: `${ans}`, fields: [num(ans)] });
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));

/** Degrees of a random simple connected graph on n vertices with n − 1 + extra edges. */
export function randomDegrees(n: number, extra: number): number[] {
  const has = new Set<string>(), d = new Array(n).fill(0);
  const k = (a: number, b: number) => (a < b ? `${a},${b}` : `${b},${a}`);
  const add = (a: number, b: number) => { has.add(k(a, b)); d[a]++; d[b]++; };
  for (let v = 1; v < n; v++) add(v, ri(0, v - 1));                // a random tree: connected
  const max = (n * (n - 1)) / 2;
  for (let e = 0; e < extra && has.size < max; e++) {
    let a = 0, b = 0;
    do { a = ri(0, n - 1); b = ri(0, n - 1); } while (a === b || has.has(k(a, b)));
    add(a, b);
  }
  return d.sort((x, y) => y - x);
}
const seq = (d: number[]) => `\\deg:\\ ${d.join(",\\ ")}`;

// ── Graphs: the handshake lemma ──
export const graphHandshake: Gen = (lv: Level): Problem => {
  if (lv === 1) {
    const d = randomDegrees(ri(5, 8), ri(1, 5)), s = d.reduce((a, b) => a + b, 0);
    return one(`gh1:${d.join("")}`, ["mpr_grDegE", "These are the degrees of a graph. How many edges does it have?"], seq(d),
      [`\\textstyle\\sum \\deg = ${d.join(" + ")} = ${s} = 2E`, `E = \\tfrac{${s}}{2} = ${amber(s / 2)}`], s / 2);
  }
  if (lv === 2) {
    let n = 0, k = 0;
    do { n = ri(5, 20); k = ri(2, 6); } while ((n * k) % 2 || k >= n);
    if (Math.random() < 0.5) {
      return one(`gh2a:${n}:${k}`, ["mpr_grRegE", "A graph has n vertices, all of degree k. How many edges?"], `n = ${n},\\ k = ${k}`,
        [`n k = 2E`, `E = \\tfrac{${n} \\cdot ${k}}{2} = ${amber((n * k) / 2)}`], (n * k) / 2);
    }
    return one(`gh2b:${n}:${k}`, ["mpr_grRegN", "A graph has E edges and every vertex has degree k. How many vertices?"], `E = ${(n * k) / 2},\\ k = ${k}`,
      [`n k = 2E`, `n = \\tfrac{2 \\cdot ${(n * k) / 2}}{${k}} = ${amber(n)}`], n);
  }
  let V = 0, y = 0;
  do { V = ri(6, 16); y = ri(1, V - 1); } while ((3 * V + y) % 2);
  const E = (3 * V + y) / 2;
  return one(`gh3:${V}:${y}`, ["mpr_grDeg4", "Every vertex has degree 3 or 4. How many have degree 4?"], `V = ${V},\\ E = ${E}`,
    [`3(${V} - y) + 4y = 2 \\cdot ${E}`, `${3 * V} + y = ${2 * E}`, `y = ${amber(y)}`], y);
};

// ── Graphs: named families ──
export const graphFamilies: Gen = (lv: Level): Problem => {
  const ask: [string, string] = ["mpr_grEdges", "How many edges does the graph have?"];
  if (lv === 1) {
    const n = ri(3, 15), e = (n * (n - 1)) / 2;
    return one(`gf1:${n}`, ask, `K_{${n}}`, [`E(K_n) = \\tfrac{n(n-1)}{2}`, `\\tfrac{${n} \\cdot ${n - 1}}{2} = ${amber(e)}`], e);
  }
  if (lv === 2) {
    const a = ri(2, 9), b = ri(2, 9);
    return one(`gf2:${a}:${b}`, ask, `K_{${a},${b}}`, [`E(K_{a,b}) = a b`, `${a} \\cdot ${b} = ${amber(a * b)}`], a * b);
  }
  const n = ri(5, 14), all = (n * (n - 1)) / 2, e = all - n;
  return one(`gf3:${n}`, ["mpr_grComp", "How many pairs of vertices of Cₙ are not joined (the edges of its complement)?"], `C_{${n}}`,
    [`E(K_{${n}}) = \\tfrac{${n} \\cdot ${n - 1}}{2} = ${all}`, `${all} - E(C_{${n}}) = ${all} - ${n} = ${amber(e)}`], e);
};

// ── Euler: odd vertices and how many edges to add ──
export const eulerOdd: Gen = (lv: Level): Problem => {
  let d: number[] = [], odd = 0;
  do { d = randomDegrees(ri(5, 8), ri(2, 6)); odd = d.filter(x => x % 2).length; } while (lv > 1 && odd < 4);
  const odds = d.filter(x => x % 2);
  const oddLine = `\\deg v \\equiv 1 \\pmod 2:\\ ${odds.length ? odds.join(",\\ ") : "\\varnothing"}`;
  if (lv === 1) {
    return one(`eo1:${d.join("")}`, ["mpr_eulOdd", "These are the degrees of a graph. How many vertices have odd degree?"], seq(d),
      [oddLine, `${amber(odd)}`], odd);
  }
  const circuit = lv === 2, ans = circuit ? odd / 2 : odd / 2 - 1;
  return one(`eo${lv}:${d.join("")}`,
    circuit
      ? ["mpr_eulAddC", "A connected graph has these degrees. At least how many edges must be added (repeated) to get an Euler circuit?"]
      : ["mpr_eulAddT", "A connected graph has these degrees. At least how many edges must be added (repeated) to get an Euler trail?"],
    seq(d),
    [oddLine, circuit ? `\\tfrac{${odd}}{2} = ${amber(ans)}` : `\\tfrac{${odd} - 2}{2} = ${amber(ans)}`], ans);
};

// ── Hamilton: counting cycles ──
export const hamCount: Gen = (lv: Level): Problem => {
  const ask: [string, string] = ["mpr_hamCount", "How many Hamilton cycles does the graph have?"];
  if (lv < 3) {
    const n = lv === 1 ? ri(3, 6) : ri(7, 9), h = fact(n - 1) / 2;
    return one(`hc${lv}:${n}`, ask, `K_{${n}}`,
      [`H(K_n) = \\tfrac{(n-1)!}{2}`, `\\tfrac{${n - 1}!}{2} = \\tfrac{${fact(n - 1)}}{2} = ${amber(h)}`], h);
  }
  const n = ri(2, 5), h = (fact(n) * fact(n - 1)) / 2;
  return one(`hc3:${n}`, ask, `K_{${n},${n}}`,
    [`H(K_{n,n}) = \\tfrac{n!\\,(n-1)!}{2}`, `\\tfrac{${fact(n)} \\cdot ${fact(n - 1)}}{2} = ${amber(h)}`], h);
};

// ── Trees: edges and components ──
export const treeEdges: Gen = (lv: Level): Problem => {
  if (lv === 1) {
    const n = ri(4, 60);
    return one(`te1:${n}`, ["mpr_treeE", "A tree has n vertices. How many edges?"], `n = ${n}`,
      [`E = n - 1`, `${n} - 1 = ${amber(n - 1)}`], n - 1);
  }
  if (lv === 2) {
    const n = ri(8, 60), c = ri(2, 7);
    if (Math.random() < 0.5) return one(`te2a:${n}:${c}`, ["mpr_forestE", "A forest has n vertices and c trees. How many edges?"],
      `n = ${n},\\ c = ${c}`, [`E = n - c`, `${n} - ${c} = ${amber(n - c)}`], n - c);
    return one(`te2b:${n}:${c}`, ["mpr_forestC", "A forest has n vertices and E edges. How many trees?"],
      `n = ${n},\\ E = ${n - c}`, [`c = n - E`, `${n} - ${n - c} = ${amber(c)}`], c);
  }
  const V = ri(6, 30), E = V - 1 + ri(1, 12);
  return one(`te3:${V}:${E}`, ["mpr_treeRemove", "A connected graph has V vertices and E edges. How many edges must be removed to leave a spanning tree?"],
    `V = ${V},\\ E = ${E}`, [`E(T) = V - 1 = ${V - 1}`, `${E} - ${V - 1} = ${amber(E - V + 1)}`], E - V + 1);
};

// ── Trees: leaves from the degrees ──
export const treeLeaves: Gen = (lv: Level): Problem => {
  let n2 = 0, n3 = 0, n4 = 0, n5 = 0;
  do { n3 = ri(0, 5); n4 = ri(lv === 1 ? 0 : 1, 3); n5 = lv === 3 ? ri(1, 2) : 0; n2 = ri(0, 4); } while (n3 + n4 + n5 === 0);
  const L = 2 + n3 + 2 * n4 + 3 * n5;
  const given = [[2, n2], [3, n3], [4, n4], [5, n5]].filter(([, c]) => c).map(([d, c]) => `n_${d} = ${c}`).join(",\\ ");
  return one(`tl${lv}:${n2}:${n3}:${n4}:${n5}`, ["mpr_treeLeaves", "A tree has n_d vertices of degree d as given; all the others are leaves. How many leaves?"], given,
    [`n_1 = 2 + n_3 + 2n_4 + 3n_5`, `= 2 + ${n3} + 2 \\cdot ${n4} + 3 \\cdot ${n5} = ${amber(L)}`], L);
};

// ── Trees: Cayley and Prüfer ──
export const treePrufer: Gen = (lv: Level): Problem => {
  if (lv === 1) {
    const n = ri(3, 8), c = n ** (n - 2);
    return one(`tp1:${n}`, ["mpr_cayley", "How many different trees are there on the labelled vertices 1, …, n?"], `n = ${n}`,
      [`n^{n-2}`, `${n}^{${n - 2}} = ${amber(c)}`], c);
  }
  const n = ri(5, 9), code = Array.from({ length: n - 2 }, () => ri(1, n));
  const codeTex = `(${code.join(",\\ ")}),\\quad n = ${n}`;
  if (lv === 2) {
    const v = pick(code), k = code.filter(x => x === v).length;
    return one(`tp2:${code.join("")}:${v}`, ["mpr_pruDeg", "A tree on 1, …, n has this Prüfer code. What is the degree of the vertex asked for?"],
      `${codeTex},\\quad \\deg(${v}) = \\,?`,
      [`\\deg v = \\#\\{i : c_i = v\\} + 1`, `\\#\\{i : c_i = ${v}\\} = ${k}`, `\\deg(${v}) = ${k} + 1 = ${amber(k + 1)}`], k + 1);
  }
  const distinct = new Set(code).size, L = n - distinct;
  return one(`tp3:${code.join("")}`, ["mpr_pruLeaves", "A tree on 1, …, n has this Prüfer code. How many leaves does it have?"], codeTex,
    [`\\deg v = 1 \\iff v \\notin \\{c_i\\}`, `L = n - |\\{c_i\\}| = ${n} - ${distinct} = ${amber(L)}`], L);
};

// ── Planar: Euler's formula ──
export const planarEuler: Gen = (lv: Level): Problem => {
  if (lv === 1) {
    const V = ri(4, 20), F = ri(2, 2 * V - 4), E = V + F - 2;
    return one(`pe1:${V}:${E}`, ["mpr_plFaces", "A connected plane graph has V vertices and E edges. How many faces (outer face included)?"],
      `V = ${V},\\ E = ${E}`, [`V - E + F = 2`, `F = 2 - ${V} + ${E} = ${amber(F)}`], F);
  }
  if (lv === 2) {
    // real solids only: n-gonal prisms and antiprisms, and a few Archimedean solids
    const n = ri(3, 10), m = ri(4, 10);
    const [a, p, b, q] = pick([
      [2, n, n, 4], [2 * m, 3, 2, m],
      [4, 3, 4, 6], [8, 3, 6, 4], [6, 4, 8, 6], [12, 5, 20, 6], [8, 3, 6, 8], [8, 3, 18, 4], [20, 3, 12, 5],
    ].filter(s => s[1] !== s[3]));
    const E = (a * p + b * q) / 2, F = a + b, V = 2 + E - F;
    return one(`pe2:${a}:${p}:${b}:${q}`, ["mpr_plCorners", "A polyhedron has F_k faces with k sides, as given. How many corners does it have?"],
      `F_{${p}} = ${a},\\ F_{${q}} = ${b}`,
      [`E = \\tfrac{${a} \\cdot ${p} + ${b} \\cdot ${q}}{2} = ${E},\\quad F = ${a} + ${b} = ${F}`, `V = 2 + E - F = 2 + ${E} - ${F} = ${amber(V)}`], V);
  }
  // sizes where a k-regular planar graph exists: k = 3 even V ≥ 4; k = 4 V = 6 or V ≥ 8; k = 5 V = 12 or even V ≥ 16
  const k = pick([3, 4, 5]);
  const V = k === 3 ? 2 * ri(2, 15) : k === 4 ? pick([6, ri(8, 30)]) : pick([12, 2 * ri(8, 15)]);
  const E = (V * k) / 2, F = 2 - V + E;
  return one(`pe3:${V}:${k}`, ["mpr_plReg", "A connected plane graph has V vertices, all of degree k. How many faces?"], `V = ${V},\\ k = ${k}`,
    [`E = \\tfrac{${V} \\cdot ${k}}{2} = ${E}`, `F = 2 - ${V} + ${E} = ${amber(F)}`], F);
};

// ── Planar: the edge bound ──
export const planarBound: Gen = (lv: Level): Problem => {
  if (lv === 1) {
    const V = ri(3, 40);
    return one(`pb1:${V}`, ["mpr_plMax", "At most how many edges can a simple planar graph on V vertices have?"], `V = ${V}`,
      [`E \\le 3V - 6`, `3 \\cdot ${V} - 6 = ${amber(3 * V - 6)}`], 3 * V - 6);
  }
  if (lv === 2) {
    const V = ri(3, 40);
    return one(`pb2:${V}`, ["mpr_plMaxTri", "At most how many edges can a simple planar graph on V vertices with no triangles have?"], `V = ${V}`,
      [`4F \\le 2E \\;\\Rightarrow\\; E \\le 2V - 4`, `2 \\cdot ${V} - 4 = ${amber(2 * V - 4)}`], 2 * V - 4);
  }
  const E = ri(10, 90), V = Math.ceil((E + 6) / 3);
  return one(`pb3:${E}`, ["mpr_plMinV", "At least how many vertices must a simple planar graph with E edges have?"], `E = ${E}`,
    [`E \\le 3V - 6 \\;\\Rightarrow\\; V \\ge \\tfrac{E + 6}{3} = \\tfrac{${E + 6}}{3}`, `V = ${amber(V)}`], V);
};
