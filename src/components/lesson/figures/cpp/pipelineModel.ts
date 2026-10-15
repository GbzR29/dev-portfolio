// ── Pipeline model ────────────────────────────────────────────────────────────
// Runs a small range pipeline over a vector of ints and records every step as
// a snapshot, for PipelineFigure. Lazy mode follows the real iterator protocol
// of std::views (filter scans in begin() and in ++, transform works when an
// element is read, take counts in ++, and the range-for checks it != end
// after each ++), so it reproduces what libstdc++ really does, including the
// filter's extra scan after the last element take lets through. Eager mode is
// the C++98 way: one full std::vector per stage.

export const SOURCE = [3, 8, 1, 6, 4, 9, 2, 10, 5, 7];

export type Order = "ftt" | "tft";
export type Mode = "lazy" | "eager";
export type Stage = "filter" | "transform" | "take" | "loop";
export type Mark = "pass" | "fail" | "read";

export type Counters = { reads: number; preds: number; squares: number; vectors: number };

export type Snap = {
  /** Event kind, used as the translation key; `a`/`b`/`c` fill its blanks. */
  kind: string;
  a?: number; b?: number; c?: number;
  en: string;
  stage: Stage | null;
  /** v[i] that this step looks at. */
  at: number | null;
  marks: Record<number, Mark>;
  out: number[];
  count: Counters;
  /** Eager mode: the temporary vectors built so far. */
  temps: { name: string; items: number[] }[];
  /** Lazy mode: how many elements take still lets through. */
  left: number | null;
  /** The value each stage handed on last. */
  last: Partial<Record<Stage, number>>;
  done: boolean;
};

const even = (x: number) => x % 2 === 0;

// ── Recorder ──
function recorder(eager: boolean, n: number) {
  const snaps: Snap[] = [];
  const st = {
    marks: {} as Record<number, Mark>, out: [] as number[], count: { reads: 0, preds: 0, squares: 0, vectors: 0 },
    temps: [] as { name: string; items: number[] }[], left: eager ? null : n as number | null, last: {} as Partial<Record<Stage, number>>,
  };
  const push = (kind: string, en: string, stage: Stage | null, at: number | null, vals: { a?: number; b?: number; c?: number } = {}, done = false) =>
    snaps.push({
      kind, en, stage, at, done, ...vals,
      marks: { ...st.marks }, out: [...st.out], count: { ...st.count },
      temps: st.temps.map(x => ({ name: x.name, items: [...x.items] })), left: st.left, last: { ...st.last },
    });
  return { snaps, st, push };
}

// ── Lazy: iterator objects ──
type It = { done: () => boolean; deref: () => number; next: () => void };

export function runLazy(order: Order, n: number): Snap[] {
  const { snaps, st, push } = recorder(false, n);

  const source = (limit: number): It => {
    let i = 0;
    return {
      done: () => i >= limit,
      deref: () => {
        if (!(i in st.marks)) { st.marks[i] = "read"; st.count.reads++; }
        return SOURCE[i];
      },
      next: () => { i++; },
      // the index, for the filter's events
      get index() { return i; },
    } as It & { index: number };
  };

  const filter = (base: It & { index?: number }): It => {
    let started = false;
    const satisfy = () => {
      while (!base.done()) {
        const i = base.index ?? 0, x = base.deref();
        st.count.preds++;
        if (even(x)) {
          st.marks[i] = "pass"; st.last.filter = x;
          push("predPass", "filter calls is_even({a}) on v[{b}]: true. It stops here and waits.", "filter", i, { a: x, b: i });
          return;
        }
        st.marks[i] = "fail";
        push("predFail", "filter calls is_even({a}) on v[{b}]: false. It moves on to the next element.", "filter", i, { a: x, b: i });
        base.next();
      }
    };
    return {
      done: () => { if (!started) { started = true; satisfy(); } return base.done(); },
      deref: () => base.deref(),
      next: () => { base.next(); satisfy(); },
    };
  };

  const transform = (base: It): It => ({
    done: () => base.done(),
    deref: () => {
      const x = base.deref(), y = x * x;
      st.count.squares++; st.last.transform = y;
      push("square", "transform calls square({a}) = {b}, only now that the loop reads the element.", "transform", null, { a: x, b: y });
      return y;
    },
    next: () => base.next(),
  });

  const take = (base: It, count: number): It => {
    let left = count;
    return {
      done: () => left === 0 || base.done(),
      deref: () => base.deref(),
      next: () => { base.next(); left--; st.left = left; },
    };
  };

  // order "ftt": v | filter | transform | take(n)
  // order "tft": v | take(n) | filter | transform; take over a vector is just its first n elements
  const top: It = order === "ftt"
    ? take(transform(filter(source(SOURCE.length))), n)
    : transform(filter(source(Math.min(n, SOURCE.length))));

  push("begin", "for (int x : p) calls p.begin(). Nothing has been read yet: the view only knows how to get elements.", "loop", null);
  while (!top.done()) {
    const x = top.deref();
    st.out.push(x); st.last.loop = x;
    push("print", "The loop body prints {a}.", "loop", null, { a: x });
    if (order === "ftt") {
      st.left = (st.left ?? 0) - 1;
      push("advance", "The loop calls ++it. take will let {a} more through, and filter looks for the next even number right away.", "take", null, { a: st.left });
    } else push("advanceT", "The loop calls ++it. filter looks for the next even number among the first elements.", "filter", null);
    top.next();
  }
  const unread = SOURCE.length - Object.keys(st.marks).length;
  push("end", "it == end: the loop stops. {a} of the 10 elements were never read.", null, null, { a: unread }, true);
  return snaps;
}

// ── Eager: one vector per stage ──
export function runEager(order: Order, n: number): Snap[] {
  const { snaps, st, push } = recorder(true, n);
  let cur = SOURCE.map((x, i) => ({ x, i }));

  const filterAll = () => {
    const tmp = { name: "evens", items: [] as number[] };
    st.temps.push(tmp); st.count.vectors++;
    const kept: typeof cur = [];
    for (const e of cur) {
      if (!(e.i in st.marks)) st.count.reads++;
      st.count.preds++;
      if (even(e.x)) {
        st.marks[e.i] = "pass"; tmp.items.push(e.x); kept.push(e);
        push("eFilterPass", "copy_if: is_even({a}) is true, so {a} is copied into evens.", "filter", e.i, { a: e.x });
      } else {
        st.marks[e.i] = "fail";
        push("eFilterFail", "copy_if: is_even({a}) is false.", "filter", e.i, { a: e.x });
      }
    }
    cur = kept;
  };
  const takeAll = () => {
    const tmp = { name: "first", items: [] as number[] };
    st.temps.push(tmp); st.count.vectors++;
    cur = cur.slice(0, n);
    for (const e of cur) {
      if (!(e.i in st.marks)) { st.count.reads++; st.marks[e.i] = "read"; }
      tmp.items.push(e.x);
      push("eTake", "Copy {a} into first: {b} of {c}.", "take", e.i, { a: e.x, b: tmp.items.length, c: n });
    }
  };
  const squareAll = () => {
    const tmp = { name: "squares", items: [] as number[] };
    st.temps.push(tmp); st.count.vectors++;
    cur = cur.map(e => {
      const y = e.x * e.x;
      st.count.squares++; tmp.items.push(y);
      push("eSquare", "transform: square({a}) = {b}, stored in squares.", "transform", null, { a: e.x, b: y });
      return { x: y, i: e.i };
    });
  };

  push("eBegin", "Each stage runs to the end and stores its whole result in a new std::vector before the next stage starts.", null, null);
  if (order === "ftt") { filterAll(); squareAll(); }
  else { takeAll(); filterAll(); squareAll(); }
  const shown = order === "ftt" ? cur.slice(0, n) : cur;
  for (const e of shown) { st.out.push(e.x); push("ePrint", "Print {a}.", "loop", null, { a: e.x }); }
  push("eEnd", "Done. Each stage built its own vector: {a} allocations, and every element of every vector was computed before anything was printed.", null, null, { a: st.count.vectors }, true);
  return snaps;
}

/** Fills the {a} {b} {c} blanks of a step's text. */
export function fill(text: string, s: Pick<Snap, "a" | "b" | "c">) {
  return text.replace("{a}", String(s.a ?? "")).replace("{a}", String(s.a ?? "")).replace("{b}", String(s.b ?? "")).replace("{c}", String(s.c ?? ""));
}
