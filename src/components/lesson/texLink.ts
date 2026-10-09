// ── Automatic symbol links for formula cards ──────────────────────────────────
// Finds each symbol of a card's "where" list inside its formula and wraps both
// in \sym (Tex.tsx), so every card gets hover links and colours without
// hand-written ids. The TeX is read as a tree of atoms, not as text, so a
// letter is never found inside a command name, an environment name or a
// \text{…}, and S_{xy} is one symbol, not three letters.
//   • A "where" line names one symbol (x_i, \bar{x}, \hat{y}), several split by
//     commas (S_{xx},\ S_{yy}), a short run (r \frac{s_y}{s_x}) or a definition
//     (S_{xy} = \sum …: only the left side counts).
//   • x_i in the list also finds x_i^2 (the power is left outside the link).
//   • Subscripts are not searched: the x of S_{xx} is an index, not the
//     variable x. A symbol that matched is not searched inside either.
//   • Numbers, operators and big operators (\sum, \int, …) are never linked.
//   • Cards that already use \sym are left alone: their links are hand-made.

type Atom = {
  start: number; end: number;
  key: string;                       // canonical text, for comparing atoms
  base: string; sub: string; sup: string;
  baseEnd: number; subEnd: number;   // where the base (and a sub right after it) end, for partial links
  kids: Atom[][];                    // braced contents to search inside (never subscripts)
  kind: "sym" | "space" | "sep" | "op";
};

// Commands whose braced arguments are names or text, not math: never searched
const OPAQUE: Record<string, number> = {
  begin: 1, end: 1, text: 1, textbf: 1, textit: 1, textrm: 1, textsf: 1, texttt: 1, mbox: 1,
  mathrm: 1, operatorname: 1, hspace: 1, vspace: 1, color: 1, htmlClass: 2, htmlData: 2, sym: 2,
  phantom: 1, label: 1,
};
const NAMES = new Set(["text", "textbf", "textit", "textrm", "textsf", "texttt", "mbox", "mathrm", "operatorname"]);
const COLOURS = new Set(["red", "green", "blue", "amber", "purple", "cyan", "muted"]);
// Commands that take math arguments: searched inside
const ARGS: Record<string, number> = {
  frac: 2, dfrac: 2, tfrac: 2, binom: 2, sqrt: 1, hat: 1, bar: 1, vec: 1, tilde: 1, dot: 1, ddot: 1,
  widehat: 1, widetilde: 1, overline: 1, underline: 1, overrightarrow: 1, mathbf: 1, boldsymbol: 1,
  bm: 1, mathcal: 1, mathbb: 1, mathit: 1, mathsf: 1, cancel: 1, boxed: 1,
  red: 1, green: 1, blue: 1, amber: 1, purple: 1, cyan: 1, muted: 1, dotp: 2,
};
const SPACES = new Set([",", ";", ":", "!", " ", "quad", "qquad", "enspace", "thinspace"]);
const BIG = new Set(["sum", "prod", "int", "iint", "iiint", "oint", "lim", "max", "min", "sup", "inf",
  "log", "ln", "exp", "sin", "cos", "tan", "det", "left", "right", "cdot", "times", "div", "pm", "mp",
  "dots", "cdots", "ldots", "vdots", "ddots", "to", "le", "ge", "leq", "geq", "ne", "neq", "approx",
  "in", "mid", "quad", "infty", "partial", "nabla"]);

function parse(s: string, i = 0, close = ""): [Atom[], number] {
  const out: Atom[] = [];
  const atom = (start: number, end: number, key: string, kind: Atom["kind"], kids: Atom[][] = []): Atom =>
    ({ start, end, key, base: key, sub: "", sup: "", baseEnd: end, subEnd: end, kids, kind });

  // One argument: a braced group or a single token
  const arg = (j: number): [Atom | null, number] => {
    while (s[j] === " ") j++;
    if (j >= s.length) return [null, j];
    if (s[j] === "{") {
      const [inner, k] = parse(s, j + 1, "}");
      return [atom(j, k, `{${inner.map(a => a.key).join("")}}`, "sym", [inner]), k];
    }
    const [one, k] = parse(s.slice(0, j) + s.slice(j).match(/^(\\[a-zA-Z]+|\\.|.)/)![0], j);
    return [one[0] ?? null, k];
  };

  while (i < s.length) {
    const c = s[i];
    if (close && c === close) return [out, i + 1];
    if (c === " " || c === "\n" || c === "\t" || c === "\r") { i++; continue; }
    if (c === "&") { out.push(atom(i, i + 1, "&", "sep")); i++; continue; }
    if (c === "^" || c === "_" || c === "'") {
      const prev = out[out.length - 1];
      if (c === "'") { if (prev) { prev.key += "'"; prev.base += "'"; prev.end = prev.baseEnd = prev.subEnd = i + 1; } i++; continue; }
      const [a, k] = arg(i + 1);
      if (prev && a) {
        if (c === "_") {
          prev.sub = a.key;
          if (prev.end === prev.baseEnd) prev.subEnd = k;
        } else {
          prev.sup = a.key;
          prev.kids.push(...a.kids);        // a power can hold the variable itself: e^{-x}
        }
        prev.end = k;
        prev.key = `${prev.base}${prev.sub ? `_${prev.sub}` : ""}${prev.sup ? `^${prev.sup}` : ""}`;
      }
      i = k; continue;
    }
    if (c === "{") {
      const [inner, k] = parse(s, i + 1, "}");
      out.push(atom(i, k, `{${inner.map(a => a.key).join("")}}`, "sym", [inner]));
      i = k; continue;
    }
    if (c === "\\") {
      const name = s.slice(i + 1).match(/^([a-zA-Z]+|.)/)?.[1] ?? "";
      let k = i + 1 + name.length;
      if (name === "\\") {
        if (s[k] === "[") k = s.indexOf("]", k) + 1;     // row spacing: \\[6pt]
        out.push(atom(i, k, "\\\\", "sep")); i = k; continue;
      }
      if (SPACES.has(name)) { out.push(atom(i, k, " ", "space")); i = k; continue; }
      if (name in OPAQUE) {
        for (let n = 0; n < OPAQUE[name]; n++) { const [, e] = arg(k); k = e; }
        // A word set as text (\text{offset}, \operatorname{lerp}) is still a name that can be linked
        out.push(atom(i, k, s.slice(i, k).replace(/\s+/g, ""), NAMES.has(name) ? "sym" : "op"));
        i = k; continue;
      }
      if (name in ARGS) {
        const kids: Atom[][] = [];
        let key = `\\${name}`;
        if (name === "sqrt" && s[k] === "[") { const e = s.indexOf("]", k); key += s.slice(k, e + 1); k = e + 1; }
        for (let n = 0; n < ARGS[name]; n++) {
          const [a, e] = arg(k);
          if (a) { key += a.key.startsWith("{") ? a.key : `{${a.key}}`; kids.push(...a.kids); }
          k = e;
        }
        // Colour macros are see-through: \red{x} is still the symbol x
        if (COLOURS.has(name)) key = unwrap(key.slice(name.length + 1));
        out.push(atom(i, k, key, "sym", kids));
        i = k; continue;
      }
      out.push(atom(i, k, `\\${name}`, BIG.has(name) || !/^[a-zA-Z]+$/.test(name) ? "op" : "sym"));
      i = k; continue;
    }
    out.push(atom(i, i + 1, c, /[a-zA-Z]/.test(c) ? "sym" : "op"));
    i++;
  }
  return [out, i];
}

/** Removes braces that wrap a whole key, so {x} and x, {\mathbf{u}} and \mathbf{u} compare equal. */
function unwrap(k: string): string {
  if (!k.startsWith("{") || !k.endsWith("}")) return k;
  let depth = 0;
  for (let i = 0; i < k.length - 1; i++) {
    if (k[i] === "{") depth++;
    else if (k[i] === "}" && --depth === 0) return k;   // the first brace closes before the end: {a}{b}
  }
  return k.slice(1, -1);
}
const bare = unwrap;

type Piece = { atoms: Atom[]; start: number; end: number };

/** The symbols one "where" line names, with their place in its TeX. */
function piecesOf(tex: string): Piece[] {
  const [atoms] = parse(tex);
  const eq = atoms.findIndex(a => a.key === "=" || a.key === "\\approx");
  const lhs = (eq >= 0 ? atoms.slice(0, eq) : atoms).filter(a => a.kind !== "space");
  const groups: Atom[][] = [[]];
  for (const a of lhs) {
    if (a.key === ",") groups.push([]);
    else groups[groups.length - 1].push(a);
  }
  // Comma-separated symbols (x_i, \Delta u_i) are separate pieces, without the brackets around a list: (x, y) gives x and y
  const trim = (g: Atom[]) => {
    let a = 0, b = g.length;
    if (groups.length > 1) {
      while (a < b && g[a].kind === "op") a++;
      while (b > a && g[b - 1].kind === "op") b--;
    }
    return g.slice(a, b);
  };
  return groups.map(trim)
    .filter(g => g.length > 0 && g.length <= 8 && g.some(a => a.kind === "sym") && g.every(a => a.kind !== "sep"))
    .map(g => ({ atoms: g, start: g[0].start, end: g[g.length - 1].end }));
}

type Wrap = { start: number; end: number; id: string };

function sameSymbol(want: Atom, have: Atom): "all" | "base" | null {
  if (want.kind !== "sym" || have.kind !== "sym") return null;
  // A bare {…} group may be a macro's argument (\dotp{a}{b}): wrapping it would break the macro, so look inside instead
  if (have.base.startsWith("{")) return null;
  if (bare(want.base) !== bare(have.base) || want.sub !== have.sub) return null;
  if (want.sup === have.sup) return "all";
  return !want.sup && have.sup ? "base" : null;   // x_i in the list, x_i^2 in the formula
}

/** Finds the pieces in one atom sequence (and inside it), collecting wraps. */
function search(seq: Atom[], pieces: { id: string; p: Piece }[], wraps: Wrap[], hit: Set<string>) {
  const solid = seq.filter(a => a.kind !== "space");
  for (let i = 0; i < solid.length; i++) {
    let matched = false;
    for (const { id, p } of pieces) {
      const n = p.atoms.length;
      if (i + n > solid.length) continue;
      if (n === 1) {
        const how = sameSymbol(p.atoms[0], solid[i]);
        if (!how) continue;
        const a = solid[i];
        wraps.push({ start: a.start, end: how === "all" ? a.end : a.sub ? a.subEnd : a.baseEnd, id });
      } else {
        if (!p.atoms.every((w, k) => bare(w.key) === bare(solid[i + k].key))) continue;
        wraps.push({ start: solid[i].start, end: solid[i + n - 1].end, id });
        i += n - 1;
      }
      hit.add(id); matched = true; break;
    }
    if (!matched) for (const kid of solid[i].kids) search(kid, pieces, wraps, hit);
  }
}

function applyWraps(tex: string, wraps: Wrap[]): string {
  // Outermost first; drop any wrap that overlaps an earlier one without nesting cleanly
  const kept: Wrap[] = [];
  for (const w of [...wraps].sort((a, b) => a.start - b.start || b.end - a.end)) {
    if (kept.some(k => w.start < k.end && w.end > k.start)) continue;
    kept.push(w);
  }
  let out = tex;
  for (const w of kept.sort((a, b) => b.start - a.start)) {
    out = `${out.slice(0, w.start)}\\sym{${w.id}}{${out.slice(w.start, w.end)}}${out.slice(w.end)}`;
  }
  return out;
}

/**
 * Links a card's formulas to its "where" list. Returns the formulas and the
 * list with \sym added; lines whose symbol was not found stay as they were.
 */
export function autoLink<T>(texs: string[], where: [string, T][] | undefined): { texs: string[]; where: [string, T][] | undefined } {
  if (!where?.length || texs.some(t => t.includes("\\sym{")) || where.some(([w]) => w.includes("\\sym{"))) return { texs, where };
  const pieces = where.flatMap(([w], li) => piecesOf(w).map(p => ({ id: `w${li}`, p, li })));
  if (!pieces.length) return { texs, where };
  // Longer runs first, so r\frac{s_y}{s_x} wins over r alone
  pieces.sort((a, b) => b.p.atoms.length - a.p.atoms.length);
  const hit = new Set<string>();
  const out = texs.map(tex => {
    const wraps: Wrap[] = [];
    search(parse(tex)[0], pieces, wraps, hit);
    return applyWraps(tex, wraps);
  });
  if (!hit.size) return { texs, where };
  const linked = where.map(([w, meaning], li): [string, T] => {
    const id = `w${li}`;
    if (!hit.has(id)) return [w, meaning];
    const wraps = pieces.filter(p => p.li === li).map(({ p }) => ({ start: p.start, end: p.end, id }));
    return [applyWraps(w, wraps), meaning];
  });
  return { texs: out, where: linked };
}
