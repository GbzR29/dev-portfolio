// ── Model of the vtable figure ────────────────────────────────────────────────
// Three classes (Enemy, and Slime / Bat deriving from it), the source code as
// the switches leave it, each class's vtable, and the steps of one call made
// through an Enemy* (update, hit or delete). Addresses are invented but
// consistent; the layout follows the Itanium ABI used by GCC and Clang (vptr
// first), simplified: the real table also holds offset-to-top and typeinfo
// before slot 0, and two destructor entries instead of one.

export type Cls = "Enemy" | "Slime" | "Bat";
export type CallId = "update" | "hit" | "delete";
export type Switches = { vUpdate: boolean; vDtor: boolean; typo: boolean; override: boolean };

export type FnId = "E_dtor" | "E_upd" | "E_hit" | "S_dtor" | "S_upd" | "S_hit" | "B_dtor" | "B_upd";
export const FN: Record<FnId, { addr: string; name: string }> = {
  E_dtor: { addr: "0x1180", name: "Enemy::~Enemy()" },
  E_upd: { addr: "0x1100", name: "Enemy::update(float)" },
  E_hit: { addr: "0x1140", name: "Enemy::hit(int)" },
  S_dtor: { addr: "0x1280", name: "Slime::~Slime()" },
  S_upd: { addr: "0x1200", name: "Slime::update(float)" },
  S_hit: { addr: "0x1240", name: "Slime::hit(int)" },
  B_dtor: { addr: "0x1380", name: "Bat::~Bat()" },
  B_upd: { addr: "0x1300", name: "Bat::update(float)" },
};
export const fnName = (id: FnId, sw: Switches) => id === "B_upd" && sw.typo ? "Bat::update(double)" : FN[id].name;

export const VT_ADDR: Record<Cls, string> = { Enemy: "0x4010", Slime: "0x4040", Bat: "0x4070" };
export const OBJ_ADDR = "0x7a20";
export const PATH_ADDR = "0x9c00";
export const OBJ_SIZE: Record<Cls, number> = { Enemy: 16, Slime: 16, Bat: 40 };

export type Slot = { fn: "dtor" | "update" | "hit"; target: FnId };

/** The vtable of one class: one slot per virtual function, in declaration order. */
export function vtable(cls: Cls, sw: Switches): Slot[] {
  const own = (e: FnId, s: FnId, b: FnId | null): FnId => cls === "Slime" ? s : cls === "Bat" && b ? b : e;
  const slots: Slot[] = [];
  if (sw.vDtor) slots.push({ fn: "dtor", target: own("E_dtor", "S_dtor", "B_dtor") });
  if (sw.vUpdate) slots.push({ fn: "update", target: own("E_upd", "S_upd", sw.typo ? null : "B_upd") });
  slots.push({ fn: "hit", target: own("E_hit", "S_hit", null) });
  return slots;
}

/** Does the program still compile? `override` on a function that overrides nothing is an error. */
export function compileError(sw: Switches): string | null {
  if (!sw.override) return null;
  if (!sw.vUpdate) return "error: 'virtual void Slime::update(float)' marked 'override', but does not override";
  if (sw.typo) return "error: 'virtual void Bat::update(double)' marked 'override', but does not override";
  return null;
}

// ── Source code ───────────────────────────────────────────────────────────────

export type Line = { text: string; tag?: "new" | "call" };

export function sourceLines(cls: Cls, call: CallId, sw: Switches): Line[] {
  const v = (on: boolean) => (on ? "virtual " : "");
  const ov = sw.override ? " override" : "";
  const callLine = call === "update" ? "e->update(0.016f);" : call === "hit" ? "e->hit(4);" : "delete e;";
  return [
    { text: "struct Enemy {" },
    { text: `    ${v(sw.vDtor)}~Enemy() { println("~Enemy"); }` },
    { text: `    ${v(sw.vUpdate)}void update(float dt) { println("Enemy stands still"); }` },
    { text: "    virtual void hit(int n) { hp -= n; }" },
    { text: "    int hp = 10;" },
    { text: "};" },
    { text: "struct Slime : Enemy {" },
    { text: "    ~Slime() { println(\"~Slime\"); }" },
    { text: `    void update(float dt)${ov} { println("Slime hops"); }` },
    { text: `    void hit(int n)${ov} { hp -= n / 2; }` },
    { text: "    float size = 1;" },
    { text: "};" },
    { text: "struct Bat : Enemy {" },
    { text: "    ~Bat() { println(\"~Bat\"); }" },
    { text: `    void update(${sw.typo ? "double" : "float"} dt)${ov} { println("Bat flies"); }` },
    { text: "    std::vector<Vec2> path{{0,0}, {4,2}, {8,0}};" },
    { text: "};" },
    { text: "" },
    { text: `Enemy* e = new ${cls};`, tag: "new" },
    { text: callLine, tag: "call" },
  ];
}

// ── Steps of the call ─────────────────────────────────────────────────────────

/** Things a step can highlight in the drawing. */
export type Hi = "ptr" | "vptr" | "vt" | "slot" | "fn" | "path" | "obj";

export type Step = {
  tag: "new" | "call";
  key: string; en: string;         // text, through tx(); {cls} {fn} {addr} {slot} are filled in
  hi: Hi[];
  fn?: FnId;                       // the function running (or being looked up)
  slot?: number;
  out: string[];                   // the console so far
  obj: "alive" | "dying" | "freed";
  block: "live" | "freed" | "leaked";
  hp: number;
};

export function callSteps(cls: Cls, call: CallId, sw: Switches): Step[] {
  const table = vtable(cls, sw);
  const base = { obj: "alive" as const, block: "live" as const, hp: 10 };
  const steps: Step[] = [{
    tag: "new", key: "figCppVt_sNew", hi: ["obj", "vptr", "vt"], out: [], ...base,
    en: "new builds a {cls} on the heap and e gets its address. The constructor also fills a field you never declared: the vptr, the address of {cls}'s vtable. Every {cls} points at the same table.",
  }];
  const out: string[] = [];
  const push = (s: Omit<Step, "tag" | "obj" | "block" | "hp"> & Partial<Step>) => steps.push({ tag: "call", ...base, ...s });

  const virt = call === "hit" || (call === "update" && sw.vUpdate) || (call === "delete" && sw.vDtor);
  const slotName = call === "delete" ? "dtor" : call;
  const k = table.findIndex(s => s.fn === slotName);

  if (virt) {
    const target = table[k].target;
    push({ key: "figCppVt_sLoad", hi: ["ptr", "vptr"], out: [...out],
      en: "The compiler only knows that e is an Enemy*. Since this function is virtual, it does not pick a body now: the machine code reads the object's first 8 bytes, its vptr." });
    push({ key: "figCppVt_sSlot", hi: ["vptr", "vt", "slot"], slot: k, out: [...out],
      en: "The vptr leads to {cls}'s vtable. The function's position in the table was fixed when Enemy was compiled: here it is slot [{slot}], the same in every derived class's table." });
    if (call === "delete") return deleteSteps(cls, steps, out, push, k, target);
    const result = runBody(target, out);
    push({ key: "figCppVt_sJump", hi: ["slot", "fn"], slot: k, fn: target, out: [...out], hp: result.hp,
      en: "The slot holds {addr}, the address of {fn}. The program jumps there with this = e. Two memory reads and an indirect call: that is the whole price of virtual." });
    if (cls === "Bat" && call === "hit")
      push({ key: "figCppVt_sInherit", hi: ["vt", "slot"], slot: k, fn: target, out: [...out], hp: result.hp,
        en: "Bat never wrote its own hit, so the compiler copied Enemy's entry into Bat's table. Not overriding a function means inheriting its slot." });
    if (cls === "Bat" && call === "update" && sw.typo)
      push({ key: "figCppVt_sTypo", hi: ["vt", "slot", "fn"], slot: k, fn: target, out: [...out],
        en: "Bat::update takes a double, so it is a different function, not an override. Bat's slot still holds Enemy::update and the bat stands still. With override written, the compiler would have refused this program." });
    return steps;
  }

  // Not virtual: the call was bound when the code was compiled
  if (call === "update") {
    const result = runBody("E_upd", out);
    push({ key: "figCppVt_sStatic", hi: ["ptr", "fn"], fn: "E_upd", out: [...out], hp: result.hp,
      en: "update is not virtual, so the compiler chose the body from e's declared type, Enemy*, when it compiled this line: a direct call to {fn} at {addr}. The vtable is never read." });
    if (cls !== "Enemy")
      push({ key: "figCppVt_sStaticMiss", hi: ["obj", "fn"], fn: "E_upd", out: [...out],
        en: "The object really is a {cls}, but {cls}'s own update never runs. Without virtual, a base pointer only ever reaches base functions." });
    return steps;
  }
  // delete without a virtual destructor
  out.push("~Enemy");
  push({ key: "figCppVt_sDelStatic", hi: ["ptr", "fn"], fn: "E_dtor", out: [...out], obj: "dying",
    en: "~Enemy is not virtual, so delete calls Enemy::~Enemy directly, chosen from the type Enemy*." });
  if (cls === "Enemy") {
    push({ key: "figCppVt_sFree", hi: ["obj"], out: [...out], obj: "freed", block: "freed",
      en: "The object's {size} bytes go back to the heap. For a real Enemy, this is correct." });
    return steps;
  }
  push({ key: cls === "Bat" ? "figCppVt_sLeakBat" : "figCppVt_sLeakSlime", hi: cls === "Bat" ? ["obj", "path"] : ["obj"],
    out: [...out], obj: "freed", block: cls === "Bat" ? "leaked" : "freed",
    en: cls === "Bat"
      ? "~Bat never ran, so neither did the destructor of its member path: the vector's block is never freed. The C++ standard calls deleting a derived object through a base pointer without a virtual destructor undefined behaviour; a leak is the mild version."
      : "~Slime never ran. Slime owns nothing on the heap, so nothing visible goes wrong here, but the standard still calls it undefined behaviour. Any base class meant to be deleted through a pointer needs a virtual destructor." });
  return steps;
}

function runBody(fn: FnId, out: string[]): { hp: number } {
  if (fn === "E_upd") out.push("Enemy stands still");
  if (fn === "S_upd") out.push("Slime hops");
  if (fn === "B_upd") out.push("Bat flies");
  if (fn === "E_hit") { out.push("(hp 10 → 6)"); return { hp: 6 }; }
  if (fn === "S_hit") { out.push("(hp 10 → 8)"); return { hp: 8 }; }
  return { hp: 10 };
}

function deleteSteps(cls: Cls, steps: Step[], out: string[], push: (s: Omit<Step, "tag" | "obj" | "block" | "hp"> & Partial<Step>) => void, k: number, target: FnId): Step[] {
  if (cls !== "Enemy") {
    out.push(cls === "Bat" ? "~Bat" : "~Slime");
    push({ key: "figCppVt_sDtor", hi: ["slot", "fn"], slot: k, fn: target, out: [...out], obj: "dying",
      en: "The slot holds {fn}: the real type's destructor runs first, its body printing its name." });
    if (cls === "Bat")
      push({ key: "figCppVt_sMembers", hi: ["path"], fn: target, out: [...out], obj: "dying", block: "freed",
        en: "After the body, Bat's members are destroyed: path's destructor frees its block of points." });
  }
  out.push("~Enemy");
  push({ key: cls === "Enemy" ? "figCppVt_sBaseOnly" : "figCppVt_sBase", hi: ["fn"], fn: "E_dtor", out: [...out], obj: "dying", block: cls === "Bat" ? "freed" : "live",
    en: cls === "Enemy" ? "The slot holds Enemy::~Enemy, which runs." : "Last, the base part is destroyed: Enemy::~Enemy runs. Destruction goes from the most derived class down to the base, the reverse of construction." });
  push({ key: cls === "Enemy" ? "figCppVt_sFree" : "figCppVt_sFreeAll", hi: ["obj"], out: [...out], obj: "freed", block: "freed",
    en: cls === "Enemy" ? "The object's {size} bytes go back to the heap. For a real Enemy, this is correct."
      : "The object's {size} bytes go back to the heap. Every part of the {cls} was cleaned up, because the vtable led delete to the right destructor." });
  return steps;
}
