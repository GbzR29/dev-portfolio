// ── Scaled dot-product attention for the AI track's Attention chapter ────────
// softmax(Q·Kᵀ/√d)·V with an optional causal mask, on plain row-major arrays.
// No side effects on import: the numbers quoted in the chapter come from
// running this file under Node.

import { softmax } from "./cnn";

/** A matrix of `rows` × `cols` numbers, row-major. */
export type Mat = { rows: number; cols: number; a: Float64Array };

export const mat = (rows: number, cols: number, a?: ArrayLike<number>): Mat =>
  ({ rows, cols, a: a ? Float64Array.from(a) : new Float64Array(rows * cols) });

export const row = (m: Mat, i: number) => m.a.subarray(i * m.cols, (i + 1) * m.cols);

/** A·B */
export function matmul(A: Mat, B: Mat): Mat {
  const C = mat(A.rows, B.cols);
  for (let i = 0; i < A.rows; i++) for (let k = 0; k < A.cols; k++) {
    const aik = A.a[i * A.cols + k];
    for (let j = 0; j < B.cols; j++) C.a[i * B.cols + j] += aik * B.a[k * B.cols + j];
  }
  return C;
}

export type AttnOpts = { causal?: boolean; scale?: boolean };

/**
 * Attention of n queries over m keys. Returns the weights (n × m, each row a
 * softmax) and the output (n × value size). With `causal`, query i may only
 * look at keys 0…i (the others get weight 0); `scale: false` skips the ÷√d.
 */
export function attention(Q: Mat, K: Mat, V: Mat, { causal = false, scale = true }: AttnOpts = {}) {
  const d = Q.cols, s = scale ? 1 / Math.sqrt(d) : 1;
  const Wt = mat(Q.rows, K.rows);
  for (let i = 0; i < Q.rows; i++) {
    const z = new Float64Array(K.rows);
    for (let j = 0; j < K.rows; j++) {
      if (causal && j > i) { z[j] = -Infinity; continue; }           // a future position: masked out
      let dot = 0;
      for (let k = 0; k < d; k++) dot += Q.a[i * d + k] * K.a[j * d + k];
      z[j] = dot * s;
    }
    Wt.a.set(softmax(z), i * K.rows);
  }
  return { weights: Wt, out: matmul(Wt, V) };
}
