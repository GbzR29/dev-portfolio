// ── Unwind model ──────────────────────────────────────────────────────────────
// The scripts of UnwindFigure: a level loader four calls deep fails to open a
// file. "throw" reports it with an exception, "expected" returns it as a
// value. The variants are the break-it cases: a raw new instead of a
// unique_ptr (a leak), noexcept on load_level or no catch in main (with g++,
// std::terminate before any destructor runs, checked with g++ 14), and a
// caller that ignores a returned error. Each step names a code line by id.

export type ErrMode = "throw" | "expected";
export type Variant = "none" | "raw" | "noexcept" | "nocatch" | "ignore";

export type Local = { name: string; type: string; val: string; state?: "ok" | "freed" | "bad" };
export type Frame = { fn: string; locals: Local[] };

export type ErrStep = {
  line: string;
  en: string;
  frames: Frame[];
  /** The exception object, or the expected value being returned. */
  flight?: { kind: "exception" | "error" | "ok"; text: string; caught?: boolean };
  heap: "none" | "held" | "freed" | "leaked";
  mutex: "unlocked" | "locked";
  out: string[];
  dead?: boolean;
};

export const VARIANTS: Record<ErrMode, Variant[]> = {
  throw: ["none", "raw", "noexcept", "nocatch"],
  expected: ["none", "raw", "ignore"],
};

// ── Code ──
type L = [id: string, text: string];

export function code(mode: ErrMode, v: Variant): L[] {
  const raw = v === "raw";
  const ret = mode === "expected" ? "std::expected<void, std::string>" : "void";
  const pix: L = raw
    ? ["pix", "    Pixels* pixels = new Pixels;                // 4 KiB, freed by delete below"]
    : ["pix", "    auto pixels = std::make_unique<Pixels>();   // 4 KiB, freed in ~unique_ptr"];
  if (mode === "throw") return [
    ["rf", `void read_file(const std::string& path) {`],
    ["file", "    File f{path};                               // ~File closes it"],
    ["fail", "    if (!f.is_open()) throw std::runtime_error(\"cannot open \" + path);"],
    ["read", "    // ... read the bytes ..."],
    ["rfEnd", "}"],
    ["lt", "void load_texture(const std::string& name) {"],
    pix,
    ["callRf", "    read_file(name + \".png\");"],
    ...(raw ? [["del", "    delete pixels;"] as L] : []),
    ["ltEnd", "}"],
    ["ll", v === "noexcept" ? "void load_level(int n) noexcept {" : "void load_level(int n) {"],
    ["lock", "    std::lock_guard lock{g_assets};             // ~lock_guard unlocks it"],
    ["callLt", "    load_texture(\"stone\");"],
    ["llEnd", "}"],
    ["main", "int main() {"],
    ...(v === "nocatch" ? [
      ["callLl", "    load_level(1);"],
      ["loaded", "    std::println(\"level loaded\");"],
    ] as L[] : [
      ["try", "    try {"],
      ["callLl", "        load_level(1);"],
      ["loaded", "        std::println(\"level loaded\");"],
      ["catch", "    } catch (const std::exception& e) {"],
      ["print", "        std::println(\"error: {}\", e.what());"],
      ["tryEnd", "    }"],
    ] as L[]),
    ["mainEnd", "}"],
  ];
  return [
    ["rf", `${ret} read_file(const std::string& path) {`],
    ["file", "    File f{path};"],
    ["fail", "    if (!f.is_open()) return std::unexpected(\"cannot open \" + path);"],
    ["read", "    // ... read the bytes ..."],
    ["rfOk", "    return {};"],
    ["rfEnd", "}"],
    ["lt", `${ret} load_texture(const std::string& name) {`],
    pix,
    ["callRf", "    auto r = read_file(name + \".png\");"],
    ["passRf", raw
      ? "    if (!r) return std::unexpected(r.error());  // leaves before delete"
      : "    if (!r) return std::unexpected(r.error());"],
    ...(raw ? [["del", "    delete pixels;"] as L] : []),
    ["ltOk", "    return {};"],
    ["ltEnd", "}"],
    ["ll", `${ret} load_level(int n) {`],
    ["lock", "    std::lock_guard lock{g_assets};"],
    ...(v === "ignore" ? [
      ["callLt", "    load_texture(\"stone\");                     // result ignored"],
    ] as L[] : [
      ["callLt", "    auto r = load_texture(\"stone\");"],
      ["passLt", "    if (!r) return std::unexpected(r.error());"],
    ] as L[]),
    ["llOk", "    return {};"],
    ["llEnd", "}"],
    ["main", "int main() {"],
    ["callLl", "    if (auto r = load_level(1); !r) std::println(\"error: {}\", r.error());"],
    ["loaded", "    else                            std::println(\"level loaded\");"],
    ["mainEnd", "}"],
  ];
}

// ── Steps ──
// Translation ids of the steps of each script, in order: texts shared by two
// scripts share an id.
export const STEP_IDS: Record<ErrMode, Partial<Record<Variant, string[]>>> = {
  throw: {
    none: ["callTry", "lock", "pix", "file", "throw", "rfEnd", "ltEnd", "llEnd", "catch", "print"],
    raw: ["callTry", "lock", "pixRaw", "file", "throw", "rfEnd", "ltEndRaw", "llEnd", "catch", "printRaw"],
    noexcept: ["callTry", "lock", "pix", "file", "throw", "noexcept"],
    nocatch: ["call", "lock", "pix", "file", "throw", "nocatch"],
  },
  expected: {
    none: ["call", "lock", "pix", "file", "unexpected", "passRf", "passLt", "mainErr"],
    raw: ["call", "lock", "pixRaw", "file", "unexpected", "passRfRaw", "passLt", "mainErr"],
    ignore: ["call", "lock", "pix", "file", "unexpected", "passRf", "ignore", "llOk", "loaded"],
  },
};

const MSG = "cannot open stone.png";

export function steps(mode: ErrMode, v: Variant): ErrStep[] {
  const raw = v === "raw";
  const main: Frame = { fn: "main", locals: [] };
  const ll = (locked: boolean): Frame => ({ fn: "load_level", locals: [{ name: "lock", type: "std::lock_guard", val: locked ? "g_assets locked" : "unlocked" }] });
  const lt = (h: "held" | "freed" | "leaked"): Frame => ({ fn: "load_texture", locals: [{
    name: "pixels", type: raw ? "Pixels*" : "std::unique_ptr<Pixels>",
    val: h === "held" ? "→ 4 KiB" : h === "freed" ? "freed" : "→ 4 KiB (lost)", state: h === "leaked" ? "bad" : undefined,
  }] });
  const rf: Frame = { fn: "read_file", locals: [{ name: "f", type: "File", val: "stone.png, not open" }] };

  const start: ErrStep[] = [
    { line: "callLl", en: mode === "throw" && v !== "nocatch" ? "main calls load_level(1) inside a try block." : "main calls load_level(1).", frames: [main], heap: "none", mutex: "unlocked", out: [] },
    { line: "lock", en: "load_level locks the asset mutex. The lock_guard will unlock it in its destructor, whatever happens.", frames: [main, ll(true)], heap: "none", mutex: "locked", out: [] },
    { line: "pix", en: raw ? "load_texture allocates 4 KiB with new. pixels is a plain pointer: only the delete on a later line will free them." : "load_texture allocates 4 KiB. The unique_ptr owns them and frees them in its destructor.", frames: [main, ll(true), lt("held")], heap: "held", mutex: "locked", out: [] },
    { line: "file", en: "read_file tries to open stone.png. The file is missing, so f is not open.", frames: [main, ll(true), lt("held"), rf], heap: "held", mutex: "locked", out: [] },
  ];

  if (mode === "throw") {
    const thrown = { kind: "exception" as const, text: `std::runtime_error("${MSG}")` };
    const s4: ErrStep = { line: "fail", en: "throw creates a std::runtime_error object and the runtime starts looking up the call stack for a catch that accepts it. read_file has none.", frames: [main, ll(true), lt("held"), rf], flight: thrown, heap: "held", mutex: "locked", out: [] };
    if (v === "noexcept" || v === "nocatch") {
      return [...start, s4, {
        line: v === "noexcept" ? "ll" : "main",
        en: v === "noexcept"
          ? "The search reaches load_level, which is noexcept: no exception may leave it. std::terminate is called at once. With g++ not a single destructor runs: the file is not closed by ~File, the 4 KiB are not freed, the mutex stays locked. The process is killed."
          : "The search finds no matching catch anywhere, not even in main. std::terminate is called. With g++ the stack is not unwound first, so no destructor runs: the file, the 4 KiB and the lock are all abandoned as they are. The process is killed.",
        frames: [main, ll(true), lt("held"), rf], flight: thrown, heap: "held", mutex: "locked", dead: true,
        out: ["terminate called after throwing an instance of 'std::runtime_error'", `  what():  ${MSG}`, "Aborted"],
      }];
    }
    const h = raw ? "leaked" : "freed";
    return [...start, s4,
      { line: "rfEnd", en: "read_file is left at once: the line after the throw never runs. On the way out, ~File runs and the frame is gone.", frames: [main, ll(true), lt("held")], flight: thrown, heap: "held", mutex: "locked", out: [] },
      { line: "ltEnd", en: raw
        ? "load_texture has no catch either. The delete line is skipped. pixels is just a pointer, it has no destructor, so the 4 KiB stay allocated and their address is lost with the frame: a leak."
        : "load_texture has no catch either. On the way out, ~unique_ptr frees the 4 KiB.",
        frames: [main, ll(true), lt(h)], flight: thrown, heap: h, mutex: "locked", out: [] },
      { line: "llEnd", en: "load_level has no catch. ~lock_guard runs and unlocks the mutex.", frames: [main, ll(false)], flight: thrown, heap: h, mutex: "unlocked", out: [] },
      { line: "catch", en: "main's try has a catch for const std::exception&. runtime_error derives from std::exception, so it matches. The println after load_level(1) is skipped.", frames: [main], flight: { ...thrown, caught: true }, heap: h, mutex: "unlocked", out: [] },
      { line: "print", en: raw
        ? "The handler prints the message and the exception object is destroyed. The program carries on, but 4 KiB are lost for good. Unwinding only runs destructors: a raw pointer has none."
        : "The handler prints the message and the exception object is destroyed. The program carries on with the file closed, the memory freed and the mutex unlocked: RAII cleaned up every frame on the way.",
        frames: [main], heap: h, mutex: "unlocked", out: [`error: ${MSG}`] },
    ];
  }

  // ── expected ──
  const err = { kind: "error" as const, text: `std::unexpected("${MSG}")` };
  const h = raw ? "leaked" : "freed";
  const out: ErrStep[] = [...start,
    { line: "fail", en: "read_file returns an expected that holds the error string instead of a value. It is an ordinary return: ~File runs and the frame is gone.", frames: [main, ll(true), lt("held")], flight: err, heap: "held", mutex: "locked", out: [] },
    { line: "passRf", en: raw
      ? "r holds an error, so !r is true and load_texture returns it to its caller. The delete line is never reached: the 4 KiB leak exactly as with the exception."
      : "r holds an error, so !r is true. load_texture passes the error on with its own return; ~unique_ptr frees the 4 KiB.",
      frames: [main, ll(true)], flight: err, heap: h, mutex: "locked", out: [] },
  ];
  if (v === "ignore") return [...out,
    { line: "callLt", en: "load_level calls load_texture and drops what it returns. The error is destroyed unread.", frames: [main, ll(true)], heap: h, mutex: "locked", out: [] },
    { line: "llOk", en: "load_level returns {}, an expected holding success. ~lock_guard unlocks the mutex.", frames: [main], flight: { kind: "ok", text: "expected: success" }, heap: h, mutex: "unlocked", out: [] },
    { line: "loaded", en: "main sees success and prints \"level loaded\", but the stone texture was never read. Nothing warned. Declaring the functions [[nodiscard]] makes g++ warn: ignoring return value, declared with attribute 'nodiscard'.", frames: [main], heap: h, mutex: "unlocked", out: ["level loaded"], dead: true },
  ];
  return [...out,
    { line: "passLt", en: "Same in load_level: it returns the error, and ~lock_guard unlocks the mutex.", frames: [main], flight: err, heap: h, mutex: "unlocked", out: [] },
    { line: "callLl", en: "main checks r, finds the error and prints it. Every function on the way had to pass the error on by hand, and you can see each place it travelled through.", frames: [main], heap: h, mutex: "unlocked", out: [`error: ${MSG}`] },
  ];
}
