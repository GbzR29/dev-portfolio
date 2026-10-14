// ── The programs the C++ lifetime figure can step through ─────────────────────
// Code stays in English; explanations are tx keys (figCppLife_…). Noisy is the
// little class from the classes chapter: its constructor prints "+ name" and
// its destructor prints "- name".

import type { LifeProgram } from "./lifeModel";
import { COPY_MOVE_PROGRAMS } from "./copyMovePrograms";
import { OWN_PROGRAMS } from "./ownPrograms";

const scopes: LifeProgram = {
  id: "scopes",
  code: [
    "int main() {",
    "    Noisy a{\"a\"};",
    "    {",
    "        Noisy b{\"b\"};",
    "        Noisy c{\"c\"};",
    "    }",
    "    Noisy d{\"d\"};",
    "}",
  ],
  steps: [
    { line: 0, key: "figCppLife_sc0", en: "main starts. Its body is a scope: the region between a pair of braces. Objects defined in it belong to it.", run: m => m.enter("main()") },
    { line: 1, key: "figCppLife_sc1", en: "The constructor runs the moment a is defined. Noisy's constructor prints + a.", run: m => m.make("a", "Noisy", { print: "+ a" }) },
    { line: 2, key: "figCppLife_sc2", en: "A bare pair of braces opens a new, inner scope.", run: m => m.enter("{ }") },
    { line: 3, key: "figCppLife_sc3", en: "b is built inside the inner scope.", run: m => m.make("b", "Noisy", { print: "+ b" }) },
    { line: 4, key: "figCppLife_sc4", en: "Then c.", run: m => m.make("c", "Noisy", { print: "+ c" }) },
    { line: 5, key: "figCppLife_sc5", en: "The closing brace ends the inner scope, so its objects are destroyed, in reverse order of construction: c first. Nobody wrote this call. The compiler put it there.", run: m => m.kill("c", "- c"), dtor: true },
    { line: 5, key: "figCppLife_sc6", en: "Then b. Last built, first destroyed, like a stack of plates: an object built later may use the ones built before it, so it must go first.", run: m => m.kill("b", "- b"), dtor: true },
    { line: 5, key: "figCppLife_sc7", en: "The inner scope is gone. Nothing in it can be used any more.", run: m => m.exit() },
    { line: 6, key: "figCppLife_sc8", en: "d is built in main's scope, after the inner one has closed.", run: m => m.make("d", "Noisy", { print: "+ d" }) },
    { line: 7, key: "figCppLife_sc9", en: "main's closing brace: the newest object, d, is destroyed first…", run: m => m.kill("d", "- d"), dtor: true },
    { line: 7, key: "figCppLife_sc10", en: "…and a, the first one built, is destroyed last. Read the output: it is a mirror image.", run: m => m.kill("a", "- a"), dtor: true },
    { line: 7, key: "figCppLife_sc11", en: "main returns and the program ends.", run: m => m.exit() },
  ],
};

const members: LifeProgram = {
  id: "members",
  code: [
    "struct Player {",
    "    Noisy name{\"name\"};",
    "    Noisy sword{\"sword\"};",
    "    Player()  { std::println(\"+ player\"); }",
    "    ~Player() { std::println(\"- player\"); }",
    "};",
    "int main() {",
    "    Player p;",
    "}",
  ],
  steps: [
    { line: 6, key: "figCppLife_mb0", en: "main starts.", run: m => m.enter("main()") },
    { line: 7, key: "figCppLife_mb1", en: "Defining p starts building a Player (drawn in amber: under construction). Before its constructor's body may run, every member must already exist.", run: m => m.make("p", "Player", { building: true }) },
    { line: 1, key: "figCppLife_mb2", en: "So the members are built first, in the order they are declared in the class: name…", run: m => m.make("name", "Noisy", { parent: "p", print: "+ name" }) },
    { line: 2, key: "figCppLife_mb3", en: "…then sword.", run: m => m.make("sword", "Noisy", { parent: "p", print: "+ sword" }) },
    { line: 3, key: "figCppLife_mb4", en: "Only now does Player's constructor body run. Inside it, every member is ready to use. p is complete.", run: m => m.built("p", "+ player") },
    { line: 8, key: "figCppLife_mb5", en: "main ends, so p is destroyed. The destructor's body runs first, while the members still exist, so it can still use them.", run: m => m.dying("p", "- player"), dtor: true },
    { line: 4, key: "figCppLife_mb6", en: "Then the members are destroyed, in reverse order: sword…", run: m => m.kill("sword", "- sword"), dtor: true },
    { line: 4, key: "figCppLife_mb7", en: "…then name, and p is gone. Destruction is construction played backwards: body first, then members from last to first.", run: m => { m.kill("name", "- name"); m.kill("p"); }, dtor: true },
    { line: 8, key: "figCppLife_mb8", en: "main returns.", run: m => m.exit() },
  ],
};

const early: LifeProgram = {
  id: "early",
  code: [
    "bool load(bool broken) {",
    "    File file{\"level.dat\"};",
    "    if (broken) return false;",
    "    Buffer buf{1024};",
    "    return true;",
    "}",
    "int main() {",
    "    load(true);",
    "}",
  ],
  steps: [
    { line: 6, key: "figCppLife_er0", en: "main starts.", run: m => m.enter("main()") },
    { line: 7, key: "figCppLife_er1", en: "main calls load(true). The function body is a new scope, and broken is true.", run: m => m.enter("load()") },
    { line: 1, key: "figCppLife_er2", en: "File's constructor opens level.dat. From now on, file owns an open file: something that must be given back.", run: m => m.make("file", "File", { res: "level.dat (open)", print: "open level.dat" }) },
    { line: 2, key: "figCppLife_er3", en: "broken is true, so load returns early. The rest of the body never runs: buf is never built, so it will never be destroyed either." },
    { line: 2, key: "figCppLife_er4", en: "Leaving the function ends file's scope, so its destructor runs and closes the file. Every way out of a scope runs the destructors: the closing brace, return, break, and an exception passing through.", run: m => m.kill("file", "close level.dat"), dtor: true },
    { line: 7, key: "figCppLife_er5", en: "load returns false to main. Check the summary under the drawing: is any resource still held?", run: m => m.exit() },
    { line: 8, key: "figCppLife_er6", en: "main ends.", run: m => m.exit() },
  ],
};

export const LIFE_PROGRAMS = { scopes, members, early, ...COPY_MOVE_PROGRAMS, ...OWN_PROGRAMS } as const;
export type LifeProgramId = keyof typeof LIFE_PROGRAMS;
