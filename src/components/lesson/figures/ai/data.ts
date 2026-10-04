// ── Datasets and small maths shared by the AI track's figures ─────────────────
// The same tiny datasets appear in the lesson text, worked by hand, so every
// number a figure shows can be checked against the chapter.

/** Pizza deliveries: distance in km → delivery time in minutes. */
export const DELIVERY: [number, number][] = [[1, 12], [2, 15], [3, 20], [4, 22], [5, 26]];

/** Least-squares line for DELIVERY: time = 3.5 · km + 8.5, MSE 0.3. */
export const BEST = { w: 3.5, b: 8.5 };

/** Mean squared error of the line y = w·x + b on (x, y) pairs. */
export function mse(data: [number, number][], w: number, b: number) {
  let s = 0;
  for (const [x, y] of data) s += (w * x + b - y) ** 2;
  return s / data.length;
}

/** Gradient of the MSE with respect to (w, b). */
export function mseGrad(data: [number, number][], w: number, b: number): [number, number] {
  let gw = 0, gb = 0;
  for (const [x, y] of data) {
    const e = w * x + b - y;                  // error of one prediction
    gw += e * x; gb += e;
  }
  const n = data.length;
  return [(2 / n) * gw, (2 / n) * gb];
}

/** Apartments: area (m²), rooms, price (thousands). */
export const APARTMENTS = [
  { id: "A", area: 35, rooms: 1, price: 180 },
  { id: "B", area: 48, rooms: 2, price: 230 },
  { id: "C", area: 52, rooms: 1, price: 240 },
  { id: "D", area: 60, rooms: 2, price: 275 },
  { id: "E", area: 68, rooms: 3, price: 300 },
  { id: "F", area: 75, rooms: 2, price: 320 },
  { id: "G", area: 82, rooms: 3, price: 350 },
  { id: "H", area: 95, rooms: 3, price: 390 },
  { id: "I", area: 105, rooms: 4, price: 430 },
  { id: "J", area: 120, rooms: 4, price: 480 },
] as const;

/** Exam: hours studied → passed (1) or failed (0). Best logistic fit w ≈ 1.214, b ≈ −4.249, boundary 3.5 h. */
export const EXAM: [number, number][] = [[1, 0], [2, 0], [3, 1], [4, 0], [5, 1], [6, 1]];

/** Students: hours studied, hours slept the night before, passed (1) or failed (0). Two are "noise":
 *  (5, 7) failed despite both, (2, 8.5) passed with little study. */
export const STUDENTS: [number, number, 0 | 1][] = [
  [1, 5, 0], [1.5, 8, 0], [2, 6, 0], [2.5, 4, 0], [3, 7, 0], [4, 3.5, 0], [5, 4, 0], [5, 7, 0],
  [3.5, 8, 1], [4.5, 6.5, 1], [5, 8.5, 1], [5.5, 5.5, 1], [6, 7, 1], [2, 8.5, 1],
];

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** Mean cross-entropy of p = σ(w·x + b) on (x, label) pairs; p is clamped so a certain mistake stays finite. */
export function crossEntropy(data: [number, number][], w: number, b: number) {
  let s = 0;
  for (const [x, y] of data) {
    const p = Math.min(Math.max(sigmoid(w * x + b), 1e-12), 1 - 1e-12);
    s -= y ? Math.log(p) : Math.log(1 - p);
  }
  return s / data.length;
}

export const meanStd = (v: number[]) => {
  const m = v.reduce((s, x) => s + x, 0) / v.length;
  const sd = Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length);   // population σ, as in the lesson
  return { m, sd };
};

/** STUDENTS without the two noisy ones: a straight line separates passes from fails (Perceptron chapter). */
export const STUDENTS_CLEAN = STUDENTS.filter(([h, s]) => !(h === 5 && s === 7) && !(h === 2 && s === 8.5));
