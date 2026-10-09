// ── Matrices in TeX, with linked entries ──────────────────────────────────────
// Builders for the bracketed matrices of formula cards (Equation, Derivation,
// LiveFormula). linkedProduct ties the three matrices of A·B = C together with
// \sym ids (Tex.tsx), so pointing at an entry shows what it is made of:
//   • an entry of C lights itself, the row of A and the column of B it comes from;
//   • an entry of A lights its row, in A and in C;
//   • an entry of B lights its column, in B and in C.
// Ids (1-based, with an optional prefix p for two products in one card):
//   p+"r"+i  row i      p+"c"+j  column j      p+"e"+i+j  entry (i, j) of C
// Name one in a "where" line (\sym{e21}{…}) to explain it and give it a colour.

type Wrap = (cell: string, i: number, j: number) => string;

/** \begin{bmatrix} … \end{bmatrix} from rows of TeX cells; `wrap` decorates each cell (1-based i, j). */
export function bmatrix(rows: (string | number)[][], wrap?: Wrap): string {
  const body = rows
    .map((row, i) => row.map((c, j) => (wrap ? wrap(String(c), i + 1, j + 1) : String(c))).join(" & "))
    .join(" \\\\ ");
  return `\\begin{bmatrix} ${body} \\end{bmatrix}`;
}

const range = (n: number) => Array.from({ length: n }, (_, k) => k + 1);

/**
 * The TeX of A, B and C = AB with every entry linked as described above.
 * A is m × n, B is n × p and C is m × p (C is given, not computed, so it can be
 * symbolic: "ae + bg").
 */
export function linkedProduct(A: (string | number)[][], B: (string | number)[][], C: (string | number)[][], p = "") {
  const m = A.length, q = C[0].length;
  return {
    a: bmatrix(A, (c, i) => `\\sym{${[`${p}r${i}`, ...range(q).map(j => `${p}e${i}${j}`)].join(" ")}}{${c}}`),
    b: bmatrix(B, (c, _, j) => `\\sym{${[`${p}c${j}`, ...range(m).map(i => `${p}e${i}${j}`)].join(" ")}}{${c}}`),
    c: bmatrix(C, (c, i, j) => `\\sym{${p}e${i}${j} ${p}r${i} ${p}c${j}}{${c}}`),
  };
}
