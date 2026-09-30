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

export const meanStd = (v: number[]) => {
  const m = v.reduce((s, x) => s + x, 0) / v.length;
  const sd = Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length);   // population σ, as in the lesson
  return { m, sd };
};
