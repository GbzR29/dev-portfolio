// ── Model for the C++ object-lifetime figure ──────────────────────────────────
// A hand-scripted picture of when C++ objects are built and destroyed: nested
// scopes (a function body, a block) holding objects, objects holding member
// objects, and the lines the program prints. A program is a list of steps; each
// step changes the state through `Life`. Steps flagged `dtor` are the calls the
// compiler inserts at the end of a scope: the figure can skip them all ("C
// mode") to show what is left behind without destructors. Objects that own a
// resource (`res`) and vanish without their destructor are reported as leaks.
// Kept generic on purpose: the copy / move chapters add programs here.

export type ObjState = "building" | "alive" | "dying" | "dead";

export type Obj = {
  id: string;                  // unique per program run
  name: string;
  type: string;
  state: ObjState;
  parent?: string;             // member objects: the id of the object they live in
  res?: string;                // the resource it owns, e.g. "level.dat (open)"
};
export type Scope = { uid: number; label: string; objs: Obj[]; closed?: boolean };
export type LifeState = { scopes: Scope[]; out: string[]; leaks: string[]; serial: number };

const fresh = (): LifeState => ({ scopes: [], out: [], leaks: [], serial: 0 });

// ── Step helpers ──────────────────────────────────────────────────────────────

export class Life {
  touched = new Set<string>();           // object ids changed by this step
  constructor(public s: LifeState) {
    // What ended in the previous step disappears now: closed scopes, destroyed objects
    s.scopes = s.scopes.filter(sc => !sc.closed);
    for (const sc of s.scopes) sc.objs = sc.objs.filter(o => o.state !== "dead");
  }

  private top() { return this.s.scopes.at(-1)!; }
  private find(name: string) {
    for (let i = this.s.scopes.length - 1; i >= 0; i--) {
      const o = this.s.scopes[i].objs.find(o => o.name === name);
      if (o) return o;
    }
    throw new Error(`no object ${name}`);
  }

  /** A function body or a { } block starts. */
  enter(label: string) { this.s.scopes.push({ uid: ++this.s.serial, label, objs: [] }); }

  /** The innermost scope ends. Objects still alive in it were never destroyed: their resources leak. */
  exit() {
    const sc = this.top();
    for (const o of sc.objs) if (o.state !== "dead" && o.res) this.s.leaks.push(`${o.name}: ${o.res}`);
    sc.closed = true;
  }

  /** An object is defined in the innermost scope. `building` = its constructor body has not run yet. */
  make(name: string, type: string, o: { building?: boolean; parent?: string; res?: string; print?: string } = {}) {
    const obj: Obj = {
      id: `${++this.s.serial}`, name, type, state: o.building ? "building" : "alive",
      parent: o.parent ? this.find(o.parent).id : undefined, res: o.res,
    };
    this.top().objs.push(obj);
    this.touched.add(obj.id);
    if (o.print) this.print(o.print);
    return obj;
  }
  /** The constructor body of an object that was `building` finishes. */
  built(name: string, print?: string) {
    const o = this.find(name);
    o.state = "alive";
    this.touched.add(o.id);
    if (print) this.print(print);
  }
  /** The destructor body starts (members still alive). */
  dying(name: string, print?: string) {
    const o = this.find(name);
    o.state = "dying";
    this.touched.add(o.id);
    if (print) this.print(print);
  }
  /** The object is gone; its resource, if any, has been released. */
  kill(name: string, print?: string) {
    const o = this.find(name);
    o.state = "dead";
    this.touched.add(o.id);
    if (print) this.print(print);
  }
  print(line: string) { this.s.out.push(line); }
}

// ── Programs and their snapshots ──────────────────────────────────────────────

export type LifeStep = {
  line: number;                // 0-based line of `code` this step executes
  key: string;                 // tx key of the explanation
  en: string;
  run?: (m: Life) => void;
  /** A destructor call the compiler inserted; skipped in "no destructors" mode. */
  dtor?: boolean;
};
export type LifeProgram = { id: string; code: string[]; steps: LifeStep[] };
export type LifeSnap = { state: LifeState; touched: Set<string>; line: number; key: string; en: string };

/** Runs the program; with `noDtors` the compiler-inserted destructor steps are left out. */
export function lifeSnapshots(p: LifeProgram, noDtors: boolean): LifeSnap[] {
  let s = fresh();
  const out: LifeSnap[] = [];
  for (const st of p.steps) {
    if (noDtors && st.dtor) continue;
    s = structuredClone(s);
    const m = new Life(s);
    st.run?.(m);
    out.push({ state: s, touched: m.touched, line: st.line, key: st.key, en: st.en });
  }
  return out;
}
