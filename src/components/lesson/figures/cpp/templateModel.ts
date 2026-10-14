// ── Model of the template-instantiation figure ───────────────────────────────
// One function template, max_of, and a few calls to it. Each call either
// deduces T, is given T, or fails; every distinct T that is used produces one
// generated function. The compiler and linker messages are the ones g++ 14
// prints for these exact lines (paths shortened).

export type CallId = "i37" | "d25" | "i1020" | "str" | "explicit" | "mixed" | "mesh";
export type TypeName = "int" | "double" | "std::string" | "Mesh";

export type Call = {
  id: CallId;
  code: string;
  /** The T this call ends up with; null when deduction fails. */
  T: TypeName | null;
  /** What each argument says T is: [argument, its type]. */
  args: [string, string][];
  result?: string;
  explicit?: boolean;
  /** A "break it" call, off by default. */
  breaks?: boolean;
};

export const CALLS: Call[] = [
  { id: "i37", code: "max_of(3, 7)", T: "int", args: [["3", "int"], ["7", "int"]], result: "7" },
  { id: "d25", code: "max_of(2.5, 1.0)", T: "double", args: [["2.5", "double"], ["1.0", "double"]], result: "2.5" },
  { id: "i1020", code: "max_of(10, 20)", T: "int", args: [["10", "int"], ["20", "int"]], result: "20" },
  { id: "str", code: "max_of(std::string(\"ab\"), std::string(\"b\"))", T: "std::string", args: [["std::string(\"ab\")", "std::string"], ["std::string(\"b\")", "std::string"]], result: "\"b\"" },
  { id: "explicit", code: "max_of<double>(1, 2.5)", T: "double", explicit: true, args: [["1", "int → double"], ["2.5", "double"]], result: "2.5" },
  { id: "mixed", code: "max_of(1, 2.5)", T: null, args: [["1", "int"], ["2.5", "double"]], breaks: true },
  { id: "mesh", code: "max_of(m1, m2)", T: "Mesh", args: [["m1", "Mesh"], ["m2", "Mesh"]], breaks: true },
];

export const DEFAULT_ON: CallId[] = ["i37", "d25", "i1020", "str"];

/** The name the linker sees (Itanium C++ ABI, as printed by nm). */
export const MANGLED: Record<TypeName, string> = {
  int: "_Z6max_ofIiET_S0_S0_",
  double: "_Z6max_ofIdET_S0_S0_",
  "std::string": "_Z6max_ofINSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEEEET_S6_S6_",
  Mesh: "_Z6max_ofI4MeshET_S1_S1_",
};

export const TYPE_ORDER: TypeName[] = ["int", "double", "std::string", "Mesh"];

/** The source as written, in one header or split into header + .cpp. */
export function sourceLines(split: boolean, mesh: boolean): string[] {
  const head = mesh ? ["struct Mesh { int verts; };           // no operator<", ""] : [];
  return split
    ? [...head, "// max.h", "template <typename T>", "T max_of(T a, T b);                   // only declared", "", "// max.cpp", "template <typename T>", "T max_of(T a, T b) { return a < b ? b : a; }"]
    : [...head, "// max.h", "template <typename T>", "T max_of(T a, T b) { return a < b ? b : a; }"];
}

export type Build = {
  /** Distinct types that get a generated function, in a fixed order. */
  types: TypeName[];
  /** Calls per generated type. */
  uses: Partial<Record<TypeName, CallId[]>>;
  errors: string[];
  stage: "ok" | "compile" | "link";
};

const MIXED_ERR = [
  "main.cpp: error: no matching function for call to 'max_of(int, double)'",
  "max.h: note: candidate: 'template<class T> T max_of(T, T)'",
  "max.h: note:   template argument deduction/substitution failed:",
  "main.cpp: note:   deduced conflicting types for parameter 'T' ('int' and 'double')",
].join("\n");

const MESH_ERR = [
  "max.h: In instantiation of 'T max_of(T, T) [with T = Mesh]':",
  "main.cpp:   required from here",
  "max.h: error: no match for 'operator<' (operand types are 'Mesh' and 'Mesh')",
  "    | T max_of(T a, T b) { return a < b ? b : a; }",
  "    |                             ~~^~~",
].join("\n");

const DEMANGLED: Record<TypeName, string> = {
  int: "int max_of<int>(int, int)",
  double: "double max_of<double>(double, double)",
  "std::string": "std::string max_of<std::string>(std::string, std::string)",
  Mesh: "Mesh max_of<Mesh>(Mesh, Mesh)",
};

export function demangled(T: TypeName) { return DEMANGLED[T]; }

export function build(on: Set<CallId>, split: boolean): Build {
  const uses: Partial<Record<TypeName, CallId[]>> = {};
  for (const c of CALLS) if (on.has(c.id) && c.T) (uses[c.T] ??= []).push(c.id);
  const types = TYPE_ORDER.filter(T => uses[T]);

  // Deduction happens with or without the body: it only needs the declaration.
  const compile: string[] = [];
  if (on.has("mixed")) compile.push(MIXED_ERR);
  // With the body hidden in max.cpp, main.cpp never instantiates it, so the
  // Mesh mistake is not seen by the compiler at all: it moves to the linker.
  if (on.has("mesh") && !split) compile.push(MESH_ERR);
  if (compile.length) return { types, uses, errors: compile, stage: "compile" };

  if (split && types.length) {
    const link = types.map(T => `ld: main.o: in function 'main':\nmain.cpp:(.text+0x${(0x13 + 0x18 * TYPE_ORDER.indexOf(T)).toString(16)}): undefined reference to '${DEMANGLED[T]}'`);
    link.push("collect2: error: ld returned 1 exit status");
    return { types, uses, errors: link, stage: "link" };
  }
  return { types, uses, errors: [], stage: "ok" };
}
