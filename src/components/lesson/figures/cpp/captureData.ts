// ── Scripts of the lambda-capture figure ──────────────────────────────────────
// Three short programs, each run with the variable captured by value or by
// reference. Every step lists the stack frames, the closure object (the
// lambda's hidden struct) with its members, and the console. Text goes
// through tx() with the keys figCppCap_<program>_<mode><step>.

export type CapProgram = "later" | "outlive" | "counter";
export type CapMode = "value" | "ref";

export type CapVar = { name: string; val: string };
export type CapFrame = { name: string; vars: CapVar[]; dead?: boolean };
export type CapMember = { name: string; val: string; ref?: string; bad?: boolean };
export type CapStep = {
  line: number; en: string;
  frames: CapFrame[];
  closure?: { owner: string; members: CapMember[] };
  out: string[];
  hot?: string[];                     // names to highlight: "main.bonus", "closure.bonus"
};
export type CapScript = { capture: Record<CapMode, string>; code: (cap: string) => string[]; compiled: Record<CapMode, string[]>; steps: Record<CapMode, CapStep[]> };

const main = (vars: CapVar[]): CapFrame => ({ name: "main", vars });

export const CAP_SCRIPTS: Record<CapProgram, CapScript> = {
  later: {
    capture: { value: "[bonus]", ref: "[&bonus]" },
    code: (cap) => [
      "int bonus = 10;",
      `auto add = ${cap}(int x) { return x + bonus; };`,
      "bonus = 50;",
      "std::println(\"{}\", add(1));",
    ],
    compiled: {
      value: ["struct Lambda {", "    int bonus;                      // a copy", "    int operator()(int x) const { return x + bonus; }", "};", "auto add = Lambda{bonus};"],
      ref: ["struct Lambda {", "    int& bonus;                     // a reference", "    int operator()(int x) const { return x + bonus; }", "};", "auto add = Lambda{bonus};"],
    },
    steps: {
      value: [
        { line: 0, frames: [main([{ name: "bonus", val: "10" }])], out: [], hot: ["main.bonus"],
          en: "bonus is an ordinary int in main's stack frame." },
        { line: 1, frames: [main([{ name: "bonus", val: "10" }])], closure: { owner: "add", members: [{ name: "bonus", val: "10" }] }, out: [], hot: ["closure.bonus"],
          en: "The lambda expression creates an object, the closure, and stores it in add. [bonus] copies bonus into the closure right now, while it is 10." },
        { line: 2, frames: [main([{ name: "bonus", val: "50" }])], closure: { owner: "add", members: [{ name: "bonus", val: "10" }] }, out: [], hot: ["main.bonus"],
          en: "main's bonus becomes 50. The closure's copy stays 10: it is a separate int." },
        { line: 3, frames: [main([{ name: "bonus", val: "50" }])], closure: { owner: "add", members: [{ name: "bonus", val: "10" }] }, out: ["11"], hot: ["closure.bonus"],
          en: "add(1) runs the body with x = 1 and the closure's own bonus: 1 + 10 = 11. A value capture is a snapshot taken when the lambda is created." },
      ],
      ref: [
        { line: 0, frames: [main([{ name: "bonus", val: "10" }])], out: [], hot: ["main.bonus"],
          en: "bonus is an ordinary int in main's stack frame." },
        { line: 1, frames: [main([{ name: "bonus", val: "10" }])], closure: { owner: "add", members: [{ name: "bonus", val: "", ref: "main.bonus" }] }, out: [], hot: ["closure.bonus"],
          en: "[&bonus] stores a reference in the closure: it remembers where bonus lives, not what it holds." },
        { line: 2, frames: [main([{ name: "bonus", val: "50" }])], closure: { owner: "add", members: [{ name: "bonus", val: "", ref: "main.bonus" }] }, out: [], hot: ["main.bonus"],
          en: "main's bonus becomes 50, and the closure sees it, because it refers to the same int." },
        { line: 3, frames: [main([{ name: "bonus", val: "50" }])], closure: { owner: "add", members: [{ name: "bonus", val: "", ref: "main.bonus" }] }, out: ["51"], hot: ["main.bonus"],
          en: "add(1) reads bonus through the reference at the moment of the call: 1 + 50 = 51." },
      ],
    },
  },

  outlive: {
    capture: { value: "[bonus]", ref: "[&bonus]" },
    code: (cap) => [
      "std::function<int(int)> make_adder() {",
      "    int bonus = 10;",
      `    return ${cap}(int x) { return x + bonus; };`,
      "}",
      "int main() {",
      "    auto add = make_adder();",
      "    std::println(\"{}\", add(1));",
      "}",
    ],
    compiled: {
      value: ["struct Lambda {", "    int bonus;                      // a copy", "    int operator()(int x) const { return x + bonus; }", "};"],
      ref: ["struct Lambda {", "    int& bonus;                     // refers to make_adder's bonus", "    int operator()(int x) const { return x + bonus; }", "};"],
    },
    steps: {
      value: [
        { line: 5, frames: [main([{ name: "add", val: "…" }])], out: [],
          en: "main calls make_adder." },
        { line: 1, frames: [main([{ name: "add", val: "…" }]), { name: "make_adder", vars: [{ name: "bonus", val: "10" }] }], out: [], hot: ["make_adder.bonus"],
          en: "make_adder's frame is pushed onto the stack, with its local bonus = 10." },
        { line: 2, frames: [main([{ name: "add", val: "…" }]), { name: "make_adder", vars: [{ name: "bonus", val: "10" }] }], closure: { owner: "make_adder", members: [{ name: "bonus", val: "10" }] }, out: [], hot: ["closure.bonus"],
          en: "The closure is created with its own copy of bonus, and returned inside a std::function." },
        { line: 3, frames: [main([{ name: "add", val: "closure" }]), { name: "make_adder", vars: [{ name: "bonus", val: "10" }], dead: true }], closure: { owner: "add", members: [{ name: "bonus", val: "10" }] }, out: [], hot: ["closure.bonus"],
          en: "make_adder returns and its frame is gone, bonus with it. The closure, now in main's add, carries its own copy: nothing it needs was lost." },
        { line: 6, frames: [main([{ name: "add", val: "closure" }]), { name: "make_adder", vars: [{ name: "bonus", val: "10" }], dead: true }], closure: { owner: "add", members: [{ name: "bonus", val: "10" }] }, out: ["11"], hot: ["closure.bonus"],
          en: "add(1) = 1 + 10 = 11. A lambda that outlives its scope must capture by value." },
      ],
      ref: [
        { line: 5, frames: [main([{ name: "add", val: "…" }])], out: [],
          en: "main calls make_adder." },
        { line: 1, frames: [main([{ name: "add", val: "…" }]), { name: "make_adder", vars: [{ name: "bonus", val: "10" }] }], out: [], hot: ["make_adder.bonus"],
          en: "make_adder's frame is pushed onto the stack, with its local bonus = 10." },
        { line: 2, frames: [main([{ name: "add", val: "…" }]), { name: "make_adder", vars: [{ name: "bonus", val: "10" }] }], closure: { owner: "make_adder", members: [{ name: "bonus", val: "", ref: "make_adder.bonus" }] }, out: [], hot: ["closure.bonus"],
          en: "The closure is created holding a reference to make_adder's bonus, and returned inside a std::function. It compiles without a warning." },
        { line: 3, frames: [main([{ name: "add", val: "closure" }]), { name: "make_adder", vars: [{ name: "bonus", val: "10" }], dead: true }], closure: { owner: "add", members: [{ name: "bonus", val: "", ref: "make_adder.bonus", bad: true }] }, out: [], hot: ["closure.bonus"],
          en: "make_adder returns and its frame is gone. The closure survives in main, but the int it refers to does not: the reference dangles." },
        { line: 6, frames: [main([{ name: "add", val: "closure" }]), { name: "make_adder", vars: [{ name: "bonus", val: "10" }], dead: true }], closure: { owner: "add", members: [{ name: "bonus", val: "", ref: "make_adder.bonus", bad: true }] }, out: ["???"], hot: ["closure.bonus"],
          en: "add(1) reads memory that belongs to nobody: undefined behaviour. It may print 11 by luck, print garbage once the next call reuses the stack, or crash. AddressSanitizer reports it as stack-use-after-return." },
      ],
    },
  },

  counter: {
    capture: { value: "[n]() mutable", ref: "[&n]()" },
    code: (cap) => [
      "int n = 0;",
      `auto tick = ${cap} { return ++n; };`,
      "tick();",
      "tick();",
      "int last = tick();",
      "std::println(\"{} {}\", n, last);",
    ],
    compiled: {
      value: ["struct Lambda {", "    int n;                          // a copy", "    int operator()() { return ++n; }   // mutable: not const", "};"],
      ref: ["struct Lambda {", "    int& n;                         // a reference", "    int operator()() const { return ++n; } // changes main's n", "};"],
    },
    steps: {
      value: [
        { line: 0, frames: [main([{ name: "n", val: "0" }])], out: [], hot: ["main.n"],
          en: "n starts at 0." },
        { line: 1, frames: [main([{ name: "n", val: "0" }])], closure: { owner: "tick", members: [{ name: "n", val: "0" }] }, out: [], hot: ["closure.n"],
          en: "The closure gets its own n, a copy: 0. Without mutable, ++n would not compile, because a lambda's call operator is const by default and may not change its own members." },
        { line: 2, frames: [main([{ name: "n", val: "0" }])], closure: { owner: "tick", members: [{ name: "n", val: "1" }] }, out: [], hot: ["closure.n"],
          en: "The first call raises the closure's n to 1. main's n does not move." },
        { line: 3, frames: [main([{ name: "n", val: "0" }])], closure: { owner: "tick", members: [{ name: "n", val: "2" }] }, out: [], hot: ["closure.n"],
          en: "The closure keeps its state between calls: 2." },
        { line: 4, frames: [main([{ name: "n", val: "0" }, { name: "last", val: "3" }])], closure: { owner: "tick", members: [{ name: "n", val: "3" }] }, out: [], hot: ["closure.n", "main.last"],
          en: "The third call returns 3." },
        { line: 5, frames: [main([{ name: "n", val: "0" }, { name: "last", val: "3" }])], closure: { owner: "tick", members: [{ name: "n", val: "3" }] }, out: ["0 3"], hot: ["main.n", "main.last"],
          en: "Prints 0 3: a counter that lives inside the lambda, invisible from outside." },
      ],
      ref: [
        { line: 0, frames: [main([{ name: "n", val: "0" }])], out: [], hot: ["main.n"],
          en: "n starts at 0." },
        { line: 1, frames: [main([{ name: "n", val: "0" }])], closure: { owner: "tick", members: [{ name: "n", val: "", ref: "main.n" }] }, out: [], hot: ["closure.n"],
          en: "The closure holds a reference to main's n. No mutable is needed: the closure does not change its own member (the reference), only the int it refers to." },
        { line: 2, frames: [main([{ name: "n", val: "1" }])], closure: { owner: "tick", members: [{ name: "n", val: "", ref: "main.n" }] }, out: [], hot: ["main.n"],
          en: "The first call raises main's n to 1." },
        { line: 3, frames: [main([{ name: "n", val: "2" }])], closure: { owner: "tick", members: [{ name: "n", val: "", ref: "main.n" }] }, out: [], hot: ["main.n"],
          en: "Then to 2." },
        { line: 4, frames: [main([{ name: "n", val: "3" }, { name: "last", val: "3" }])], closure: { owner: "tick", members: [{ name: "n", val: "", ref: "main.n" }] }, out: [], hot: ["main.n", "main.last"],
          en: "The third call returns 3." },
        { line: 5, frames: [main([{ name: "n", val: "3" }, { name: "last", val: "3" }])], closure: { owner: "tick", members: [{ name: "n", val: "", ref: "main.n" }] }, out: ["3 3"], hot: ["main.n", "main.last"],
          en: "Prints 3 3: every call changed main's own n." },
      ],
    },
  },
};
