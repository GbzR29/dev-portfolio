// ── string_view model ─────────────────────────────────────────────────────────
// Scripts for StringViewFigure. Each step shows the stack (a std::string is a
// pointer, a size and a capacity; a std::string_view is a pointer and a
// length), the heap buffers with their characters, which characters the view
// covers, and the console. The strings are longer than 15 characters on
// purpose: shorter ones would sit inside the string object itself (the small
// string optimisation of libstdc++). Growth follows libstdc++ (new capacity =
// max(2 × old, needed)), checked with g++ 14.

export type ViewProgram = "slice" | "grow" | "temp" | "cstr";

export type Buf = { addr: number; text: string; cap: number; owner: string; freed?: boolean };
export type StrVar = { name: string; kind: "string"; ptr: number; size: number; cap: number; temp?: boolean; dead?: boolean };
export type ViewVar = { name: string; kind: "view"; ptr: number; len: number };
export type Var = StrVar | ViewVar;

export type ViewStep = {
  id: string;
  line: number;
  en: string;
  vars: Var[];
  bufs: Buf[];
  /** Characters printf walks over looking for '\0'. */
  scan?: { ptr: number; len: number };
  out: { text: string; bad?: boolean; warn?: boolean }[];
};

export const VIEW_PROGRAMS: ViewProgram[] = ["slice", "grow", "temp", "cstr"];

const FOX = "the quick brown fox";
const A = 0x5000, B = 0x6000, T = 0x7000;

const s0: StrVar = { name: "s", kind: "string", ptr: A, size: 19, cap: 19 };
const fox: Buf = { addr: A, text: FOX, cap: 19, owner: "s" };

export const VIEW_CODE: Record<ViewProgram, string[]> = {
  slice: [
    `std::string s = "${FOX}";`,
    "std::string_view sv = s;",
    "sv.remove_prefix(4);",
    "sv = sv.substr(0, 5);",
    "std::println(\"{}\", sv);",
  ],
  grow: [
    `std::string s = "${FOX}";`,
    "std::string_view sv = s;",
    "s += \" jumps\";",
    "std::println(\"{}\", sv);",
  ],
  temp: [
    "std::string full_name() { return \"Ada King, Countess\"; }",
    "",
    "std::string_view sv = full_name();",
    "std::println(\"{}\", sv);",
  ],
  cstr: [
    `std::string s = "${FOX}";`,
    "std::string_view sv = std::string_view(s).substr(4, 5);",
    "std::printf(\"%s\\n\", sv.data());",
    "std::println(\"{}\", sv);",
  ],
};

export const VIEW_STEPS: Record<ViewProgram, ViewStep[]> = {
  slice: [
    { id: "make", line: 0, en: "s owns a heap buffer with the 19 characters and a closing '\\0'. On the stack, s itself is only a pointer, a size and a capacity: 32 bytes.", vars: [s0], bufs: [fox], out: [] },
    { id: "view", line: 1, en: "sv copies s's pointer and size, nothing else: 16 bytes, no allocation, no characters copied. It looks at memory that s owns.", vars: [s0, { name: "sv", kind: "view", ptr: A, len: 19 }], bufs: [fox], out: [] },
    { id: "prefix", line: 2, en: "remove_prefix(4) moves sv's pointer 4 characters forward and shortens it by 4. The string is not touched.", vars: [s0, { name: "sv", kind: "view", ptr: A + 4, len: 15 }], bufs: [fox], out: [] },
    { id: "substr", line: 3, en: "substr(0, 5) on a string_view returns another view: the same pointer, length 5. On a std::string, substr would allocate a new string.", vars: [s0, { name: "sv", kind: "view", ptr: A + 4, len: 5 }], bufs: [fox], out: [] },
    { id: "print", line: 4, en: "println reads exactly sv's 5 characters, using the length. A slice of a string, and not one byte was copied.", vars: [s0, { name: "sv", kind: "view", ptr: A + 4, len: 5 }], bufs: [fox], out: [{ text: "quick" }] },
  ],
  grow: [
    { id: "make", line: 0, en: "s owns a heap buffer with the 19 characters and a closing '\\0'. On the stack, s itself is only a pointer, a size and a capacity: 32 bytes.", vars: [s0], bufs: [fox], out: [] },
    { id: "view", line: 1, en: "sv copies s's pointer and size, nothing else: 16 bytes, no allocation, no characters copied. It looks at memory that s owns.", vars: [s0, { name: "sv", kind: "view", ptr: A, len: 19 }], bufs: [fox], out: [] },
    { id: "grow", line: 2, en: "s needs 25 characters but has room for 19. It allocates a new buffer with capacity 38 (twice the old one), copies the text, adds \" jumps\" and frees the old buffer. sv was not told: it still points at 0x5000.", vars: [{ name: "s", kind: "string", ptr: B, size: 25, cap: 38 }, { name: "sv", kind: "view", ptr: A, len: 19 }], bufs: [{ ...fox, freed: true }, { addr: B, text: FOX + " jumps", cap: 38, owner: "s" }], out: [] },
    { id: "growPrint", line: 3, en: "println reads 19 characters at 0x5000, memory that was freed and may already hold something else. Undefined behaviour: it may print the old text, garbage, or crash. AddressSanitizer reports heap-use-after-free.", vars: [{ name: "s", kind: "string", ptr: B, size: 25, cap: 38 }, { name: "sv", kind: "view", ptr: A, len: 19 }], bufs: [{ ...fox, freed: true }, { addr: B, text: FOX + " jumps", cap: 38, owner: "s" }], out: [{ text: "???", bad: true }] },
  ],
  temp: [
    { id: "tmp", line: 2, en: "full_name() returns a temporary std::string, with its own heap buffer. sv is made from it: pointer and length.", vars: [{ name: "(temporary)", kind: "string", ptr: T, size: 18, cap: 18, temp: true }, { name: "sv", kind: "view", ptr: T, len: 18 }], bufs: [{ addr: T, text: "Ada King, Countess", cap: 18, owner: "(temporary)" }], out: [] },
    { id: "tmpDie", line: 2, en: "At the semicolon the temporary is destroyed and its buffer freed. sv keeps the old address. g++ compiles this without a warning, even with -Wall -Wextra.", vars: [{ name: "(temporary)", kind: "string", ptr: T, size: 18, cap: 18, temp: true, dead: true }, { name: "sv", kind: "view", ptr: T, len: 18 }], bufs: [{ addr: T, text: "Ada King, Countess", cap: 18, owner: "(temporary)", freed: true }], out: [] },
    { id: "tmpPrint", line: 3, en: "println reads freed memory. It often prints the right text, because nothing has reused the memory yet, which makes this bug easy to miss in testing. Keep the string: std::string name = full_name();", vars: [{ name: "sv", kind: "view", ptr: T, len: 18 }], bufs: [{ addr: T, text: "Ada King, Countess", cap: 18, owner: "(temporary)", freed: true }], out: [{ text: "???", bad: true }] },
  ],
  cstr: [
    { id: "make", line: 0, en: "s owns a heap buffer with the 19 characters and a closing '\\0'. On the stack, s itself is only a pointer, a size and a capacity: 32 bytes.", vars: [s0], bufs: [fox], out: [] },
    { id: "cview", line: 1, en: "sv covers \"quick\": 5 characters starting at 0x5004. The character after them is a space, not a '\\0'.", vars: [s0, { name: "sv", kind: "view", ptr: A + 4, len: 5 }], bufs: [fox], out: [] },
    { id: "printf", line: 2, en: "printf gets only a pointer. It knows nothing of sv's length and reads until it meets a '\\0', which is at the end of the whole string. A string_view is not a C string: data() is not null-terminated in general.", vars: [s0, { name: "sv", kind: "view", ptr: A + 4, len: 5 }], bufs: [fox], scan: { ptr: A + 4, len: 15 }, out: [{ text: "quick brown fox", warn: true }] },
    { id: "cprint", line: 3, en: "println takes the whole view, pointer and length, and stops after 5 characters. To give a view to a C function, make a std::string from it first: std::string(sv).c_str().", vars: [s0, { name: "sv", kind: "view", ptr: A + 4, len: 5 }], bufs: [fox], out: [{ text: "quick brown fox", warn: true }, { text: "quick" }] },
  ],
};

export const hex = (n: number) => "0x" + n.toString(16);
