// ── Smart-pointer programs for the C++ lifetime figure ────────────────────────
// Used by the RAII chapter: unique_ptr handing its object over, shared_ptr
// counting owners, a shared_ptr cycle that leaks, and the weak_ptr that fixes
// it. Texture prints "+ file" when built and "- file" when destroyed.
// Releases go through Life.release, so the counts stay right when the figure
// switches destructors off.

import type { LifeProgram } from "./lifeModel";

const unique: LifeProgram = {
  id: "unique",
  code: [
    "void keep(std::unique_ptr<Texture> t) {",
    "    // … uses t …",
    "}",
    "int main() {",
    "    auto tex = std::make_unique<Texture>(\"wall.png\");",
    "    keep(std::move(tex));",
    "    if (!tex) std::println(\"tex is empty\");",
    "}",
  ],
  steps: [
    { line: 3, key: "figCppLife_up0", en: "main starts.", run: m => m.enter("main()") },
    { line: 4, key: "figCppLife_up1", en: "make_unique builds a Texture on the heap and returns a unique_ptr that owns it. tex is its only owner.", run: m => { m.alloc("#1", "Texture wall.png"); m.make("tex", "unique_ptr<Texture>", { ptr: "#1", print: "+ wall.png" }); } },
    { line: 5, key: "figCppLife_up2", en: "keep takes a unique_ptr by value. A unique_ptr cannot be copied, only moved, so the call has to say std::move(tex). Ownership passes to t, and tex is left empty.", run: m => { m.enter("keep()"); m.make("t", "unique_ptr<Texture>", { ptr: "#1" }); m.point("tex", undefined, "nullptr"); } },
    { line: 2, key: "figCppLife_up3", en: "keep ends, so t is destroyed, and t's destructor deletes the Texture. Nobody wrote delete.", run: m => { m.kill("t", "- wall.png"); m.free("#1"); }, dtor: true },
    { line: 2, key: "figCppLife_up4", en: "keep returns to main.", run: m => m.exit() },
    { line: 6, key: "figCppLife_up5", en: "tex is empty, and the code can test for it: a unique_ptr converts to false when it owns nothing.", run: m => m.touch("tex", "tex is empty") },
    { line: 7, key: "figCppLife_up6", en: "main ends. tex owns nothing, so its destructor has nothing to delete.", run: m => m.kill("tex"), dtor: true },
    { line: 7, key: "figCppLife_up7", en: "main returns. One new, one delete, and neither was written by hand.", run: m => m.exit() },
  ],
};

const shared: LifeProgram = {
  id: "shared",
  code: [
    "int main() {",
    "    auto a = std::make_shared<Texture>(\"albedo.png\");",
    "    {",
    "        auto b = a;",
    "        auto c = a;",
    "    }",
    "    a.reset();",
    "    std::println(\"done\");",
    "}",
  ],
  steps: [
    { line: 0, key: "figCppLife_sp0", en: "main starts.", run: m => m.enter("main()") },
    { line: 1, key: "figCppLife_sp1", en: "make_shared builds the Texture together with a small counter, the control block. One owner so far: use_count is 1.", run: m => { m.alloc("#1", "Texture albedo.png", { refs: 1 }); m.make("a", "shared_ptr<Texture>", { ptr: "#1", print: "+ albedo.png" }); } },
    { line: 2, key: "figCppLife_sp2", en: "An inner scope opens.", run: m => m.enter("{ }") },
    { line: 3, key: "figCppLife_sp3", en: "Copying a shared_ptr does not copy the Texture. It adds an owner: use_count 2.", run: m => { m.make("b", "shared_ptr<Texture>", { ptr: "#1" }); m.count("#1", 2); } },
    { line: 4, key: "figCppLife_sp4", en: "A third owner: use_count 3. Three pointers, one Texture.", run: m => { m.make("c", "shared_ptr<Texture>", { ptr: "#1" }); m.count("#1", 3); } },
    { line: 5, key: "figCppLife_sp5", en: "The inner scope ends. c's destructor lowers the count to 2…", run: m => { m.kill("c"); m.release("#1", "- albedo.png"); }, dtor: true },
    { line: 5, key: "figCppLife_sp6", en: "…and b's to 1. The Texture survives, because a still owns it.", run: m => { m.kill("b"); m.release("#1", "- albedo.png"); }, dtor: true },
    { line: 5, key: "figCppLife_sp7", en: "The inner scope is gone.", run: m => m.exit() },
    { line: 6, key: "figCppLife_sp8", en: "reset() lets go of a's share. If the count reaches 0, a was the last owner, and the Texture is destroyed right here, before main ends. (With destructors switched off, b and c never let go, and the count stays above 0.)", run: m => { m.point("a", undefined, "nullptr"); m.release("#1", "- albedo.png"); } },
    { line: 7, key: "figCppLife_sp9", en: "done is printed after the Texture has already gone.", run: m => m.print("done") },
    { line: 8, key: "figCppLife_sp10", en: "main ends. a is empty, so its destructor does nothing.", run: m => m.kill("a"), dtor: true },
    { line: 8, key: "figCppLife_sp11", en: "main returns.", run: m => m.exit() },
  ],
};

const cycle: LifeProgram = {
  id: "cycle",
  code: [
    "struct Node {",
    "    std::shared_ptr<Node> other;",
    "};",
    "int main() {",
    "    auto x = std::make_shared<Node>();",
    "    auto y = std::make_shared<Node>();",
    "    x->other = y;",
    "    y->other = x;",
    "}",
  ],
  steps: [
    { line: 3, key: "figCppLife_cy0", en: "main starts.", run: m => m.enter("main()") },
    { line: 4, key: "figCppLife_cy1", en: "x owns a Node, block #1: use_count 1.", run: m => { m.alloc("#1", "Node", { refs: 1 }); m.make("x", "shared_ptr<Node>", { ptr: "#1" }); } },
    { line: 5, key: "figCppLife_cy2", en: "y owns another Node, block #2.", run: m => { m.alloc("#2", "Node", { refs: 1 }); m.make("y", "shared_ptr<Node>", { ptr: "#2" }); } },
    { line: 6, key: "figCppLife_cy3", en: "x's Node now holds a shared_ptr to y's Node, so #2 has two owners: y and x->other.", run: m => { m.link("#1", "#2"); m.count("#2", 2); } },
    { line: 7, key: "figCppLife_cy4", en: "And y's Node holds one to x's: #1 has two owners as well. Each Node keeps the other alive. This is a cycle.", run: m => { m.link("#2", "#1"); m.count("#1", 2); } },
    { line: 8, key: "figCppLife_cy5", en: "main ends. y is destroyed: #2 drops to 1, because x's Node still owns it.", run: m => { m.kill("y"); m.release("#2"); }, dtor: true },
    { line: 8, key: "figCppLife_cy6", en: "x is destroyed: #1 drops to 1, because y's Node still owns it. Neither count reaches 0.", run: m => { m.kill("x"); m.release("#1"); }, dtor: true },
    { line: 8, key: "figCppLife_cy7", en: "main is over. Both Nodes are still on the heap, owning each other, and nothing can reach them any more: a leak, although every destructor ran.", run: m => m.exit() },
  ],
};

const weak: LifeProgram = {
  id: "weak",
  code: [
    "struct Node {",
    "    std::shared_ptr<Node> next;",
    "    std::weak_ptr<Node>   prev;",
    "};",
    "int main() {",
    "    auto x = std::make_shared<Node>();",
    "    auto y = std::make_shared<Node>();",
    "    x->next = y;",
    "    y->prev = x;",
    "}",
  ],
  steps: [
    { line: 4, key: "figCppLife_wk0", en: "The same two Nodes, but the link back is a weak_ptr.", run: m => m.enter("main()") },
    { line: 5, key: "figCppLife_wk1", en: "x owns block #1.", run: m => { m.alloc("#1", "Node", { refs: 1 }); m.make("x", "shared_ptr<Node>", { ptr: "#1" }); } },
    { line: 6, key: "figCppLife_wk2", en: "y owns block #2.", run: m => { m.alloc("#2", "Node", { refs: 1 }); m.make("y", "shared_ptr<Node>", { ptr: "#2" }); } },
    { line: 7, key: "figCppLife_wk3", en: "x->next owns y's Node: #2 has two owners.", run: m => { m.link("#1", "#2"); m.count("#2", 2); } },
    { line: 8, key: "figCppLife_wk4", en: "y->prev is a weak_ptr: it remembers x's Node but does not own it. use_count of #1 stays 1; only the weak count goes up.", run: m => { m.link("#2", "#1", true); m.count("#1", 1, 1); } },
    { line: 9, key: "figCppLife_wk5", en: "main ends. y is destroyed: #2 drops to 1, still owned by x->next.", run: m => { m.kill("y"); m.release("#2"); }, dtor: true },
    { line: 9, key: "figCppLife_wk6", en: "x is destroyed: #1 drops to 0, and the Node is freed. Freeing it destroys its member next, the last owner of #2, so that Node is freed too. Everything is released, in a chain.", run: m => { m.kill("x"); m.release("#1"); }, dtor: true },
    { line: 9, key: "figCppLife_wk7", en: "main returns with an empty heap.", run: m => m.exit() },
  ],
};

export const OWN_PROGRAMS = { unique, shared, cycle, weak } as const;
