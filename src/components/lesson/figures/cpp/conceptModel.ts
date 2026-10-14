// ── Model of the concept-checking figure ─────────────────────────────────────
// Five types checked against two concepts, Shape (area + name) and Solid
// (Shape + volume); three describe() overloads picked by how constrained they
// are; and the error g++ 14 gives when report_all() gets a type that is not a
// Shape, with and without the constraint (paths shortened, source lines cut).

export type TypeId = "Circle" | "Sphere" | "Text" | "Blob" | "int";
export type ReqId = "area" | "name" | "volume";
/** ok, the expression does not compile, or it compiles but its result has the wrong type. */
export type ReqState = "ok" | "invalid" | "rtype";

export const TYPES: TypeId[] = ["Circle", "Sphere", "Text", "Blob", "int"];

export const DEFS: Record<TypeId, string[]> = {
  Circle: ["struct Circle {", "    double r;", "    double area() const { return 3.14159 * r * r; }", "    std::string name() const { return \"circle\"; }", "};"],
  Sphere: ["struct Sphere {", "    double r;", "    double area() const { return 4 * 3.14159 * r * r; }", "    std::string name() const { return \"sphere\"; }", "    double volume() const { return 4.18879 * r * r * r; }", "};"],
  Text: ["struct Text {", "    std::string name() const { return \"text\"; }", "};"],
  Blob: ["struct Blob {", "    void area() const {}                 // returns nothing", "    std::string name() const { return \"blob\"; }", "};"],
  int: ["// int: a built-in type, it has no members at all"],
};

const STATE: Record<TypeId, Record<ReqId, ReqState>> = {
  Circle: { area: "ok", name: "ok", volume: "invalid" },
  Sphere: { area: "ok", name: "ok", volume: "ok" },
  Text: { area: "invalid", name: "ok", volume: "invalid" },
  Blob: { area: "rtype", name: "ok", volume: "invalid" },
  int: { area: "invalid", name: "invalid", volume: "invalid" },
};

export const REQS: { id: ReqId; code: string }[] = [
  { id: "area", code: "{ s.area() } -> std::convertible_to<double>;" },
  { id: "name", code: "{ s.name() } -> std::convertible_to<std::string>;" },
  { id: "volume", code: "{ s.volume() } -> std::convertible_to<double>;" },
];

export const req = (T: TypeId, r: ReqId) => STATE[T][r];
export const isShape = (T: TypeId) => req(T, "area") === "ok" && req(T, "name") === "ok";
export const isSolid = (T: TypeId) => isShape(T) && req(T, "volume") === "ok";

export type Pick = { viable: [boolean, boolean, boolean]; winner: 0 | 1 | 2 | null; out?: string };

/** Which describe() runs. With `copied`, Solid repeats Shape's requirements instead of naming Shape. */
export function pick(T: TypeId, copied: boolean): Pick {
  const viable: [boolean, boolean, boolean] = [true, isShape(T), isSolid(T)];
  if (viable[2]) return copied ? { viable, winner: null } : { viable, winner: 2, out: "a solid, volume 4.18879" };
  if (viable[1]) return { viable, winner: 1, out: "a shape, area 3.14159" };
  return { viable, winner: 0, out: "something" };
}

export const OVERLOADS = [
  "void describe(const auto& x);          // 1: anything",
  "void describe(const Shape auto& s);    // 2: shapes",
  "void describe(const Solid auto& s);    // 3: solids",
];

export const AMBIGUOUS = [
  "main.cpp: error: call of overloaded 'describe(Sphere)' is ambiguous",
  "main.cpp: note: candidate: 'void describe(const auto:1&) [with auto:1 = Sphere]'",
  "main.cpp: note: candidate: 'void describe(const auto:2&) [with auto:2 = Sphere]'",
  "main.cpp: note: candidate: 'void describe(const auto:3&) [with auto:3 = Sphere]'",
].join("\n");

/** The error for report_all(std::vector<T>{…}); null when T is a Shape. */
export function reportError(T: TypeId, constrained: boolean): string | null {
  if (isShape(T)) return null;
  if (constrained) {
    const why = T === "Blob"
      ? ["shapes.h: note: 's.area()' does not satisfy return-type-requirement"]
      : T === "int"
        ? ["shapes.h: note: the required expression 's.area()' is invalid", "shapes.h: note: the required expression 's.name()' is invalid"]
        : ["shapes.h: note: the required expression 's.area()' is invalid"];
    return [
      `main.cpp:12: error: no matching function for call to 'report_all(std::vector<${T}>&)'`,
      "report.h: note: candidate: 'template<class T>  requires  Shape<T> void report_all(const std::vector<T>&)'",
      "report.h: note: constraints not satisfied",
      "main.cpp:12:   required from here",
      `shapes.h:   required for the satisfaction of 'Shape<T>' [with T = ${T}]`,
      ...why,
    ].join("\n");
  }
  const head = T === "int"
    ? [`report.h: In instantiation of 'void report(const T&) [with T = int]':`]
    : [`report.h: In instantiation of 'double area_of(const T&) [with T = ${T}]':`, `report.h:11:   required from 'void report(const T&) [with T = ${T}]'`];
  const err = T === "int"
    ? "report.h:11: error: request for member 'name' in 's', which is of non-class type 'const int'"
    : T === "Blob"
      ? "report.h:8: error: void value not ignored as it ought to be"
      : "report.h:8: error: 'const struct Text' has no member named 'area'";
  return [...head, `report.h:14:   required from 'void report_all(const std::vector<T>&) [with T = ${T}]'`, "main.cpp:12:   required from here", err].join("\n");
}

export const REPORT_SRC = (constrained: boolean) => {
  const tp = constrained ? "template <Shape T>   " : "template <typename T>";
  return [
    `${tp} double area_of(const T& s) { return s.area(); }`,
    `${tp} void report(const T& s) { std::println("{}: {}", s.name(), area_of(s)); }`,
    `${tp} void report_all(const std::vector<T>& v) { for (const auto& s : v) report(s); }`,
  ];
};
