"use client";

// Objects & functions 2: lambdas. Starts from qsort's comparator in C (a
// function pointer, void* and no way to pass extra data but a global), then
// the lambda's anatomy, lambdas with the standard algorithms, captures by
// value and by reference (figure: the closure object, dangling references),
// mutable, init captures and [this], what a lambda really is (a struct with
// operator()), generic lambdas, how to store and pass them (auto, templates,
// std::function, function pointers) with their costs, and a small event
// system as a worked example.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { CaptureFigure } from "@/components/lesson/figures/cpp/CaptureFigure";

export function CppLambdasContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cppLam_intro",
          "Sort the enemies by their distance to the player. In C, qsort needs a comparison function written somewhere else in the file, it receives its arguments as void pointers you must cast back, and it has no way to know where the player is, unless you put the player in a global variable. C++ lets you write the comparison right where you call sort, as an expression, and hand it any data it needs. That small unnamed function is a lambda. Lambdas are everywhere in modern C++: in algorithms, callbacks, threads and events.")}
      </Lead>

      <Goals t={t} id="cppLam" items={[
        "Read and write a lambda: captures, parameters, return type and body.",
        "Choose between capturing by value and by reference, and spot a dangling capture.",
        "Explain what the compiler turns a lambda into.",
        "Store and pass lambdas with auto, templates, std::function or a function pointer, knowing what each costs.",
      ]} />

      <H2>{tx(t, "cppLam_cTitle", "The C way: a function pointer and a global")}</H2>
      <CodeBlock lang="c" filename="sort.c" t={t}>{`static Vec2 g_player;                     // the comparator cannot be told where the player is

static int by_distance(const void *a, const void *b) {
    const Enemy *ea = a, *eb = b;
    float da = dist2(ea->pos, g_player), db = dist2(eb->pos, g_player);
    return (da > db) - (da < db);
}

g_player = player.pos;
qsort(enemies, count, sizeof(Enemy), by_distance);`}</CodeBlock>
      <p>
        {tx(t, "cppLam_cAfter",
          "Three problems: the comparison lives far from the call, the void pointers give up all type checking, and the extra data travels through a global, which breaks as soon as two threads sort at the same time.")}
      </p>

      <H2>{tx(t, "cppLam_anatTitle", "Anatomy of a lambda")}</H2>
      <CodeBlock lang="cpp" filename="sort.cpp" t={t}>{`#include <algorithm>
#include <vector>

Vec2 p = player.pos;
std::ranges::sort(enemies, [p](const Enemy& a, const Enemy& b) {
    return dist2(a.pos, p) < dist2(b.pos, p);
});`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppLam_hPart", "Part"), tx(t, "cppLam_hMeans", "What it means")]}
        rows={[
          ["[p]", tx(t, "cppLam_a1", "The capture list: which variables from the surrounding code the lambda may use, and how. [p] takes a copy of p. An empty [] uses none.")],
          ["(const Enemy& a, const Enemy& b)", tx(t, "cppLam_a2", "The parameters, exactly as in a normal function. sort calls the lambda with two enemies at a time.")],
          ["{ return …; }", tx(t, "cppLam_a3", "The body. Here it answers \"must a come before b?\", which is what sort asks.")],
          ["-> bool (optional)", tx(t, "cppLam_a4", "The return type, written after the parameters. Usually left out: the compiler deduces it from the return statements.")],
          [tx(t, "cppLam_a5k", "the whole expression"), tx(t, "cppLam_a5", "A value, like 42 or \"hi\". It can be passed to a function, stored in a variable with auto, or called on the spot.")],
        ]}
      />
      <p>
        {tx(t, "cppLam_algBody",
          "The standard algorithms take lambdas to say what \"matches\" or \"comes first\" means. The ones you will use most:")}
      </p>
      <CodeBlock lang="cpp" filename="algorithms.cpp" t={t}>{`auto is_dead = [](const Enemy& e) { return e.hp <= 0; };

auto it  = std::ranges::find_if(enemies, is_dead);          // first dead enemy, or end()
auto n   = std::ranges::count_if(enemies, is_dead);         // how many
bool any = std::ranges::any_of(enemies, is_dead);           // is there at least one?
std::erase_if(enemies, is_dead);                            // remove them all (C++20)

std::ranges::for_each(enemies, [dt](Enemy& e) { e.update(dt); });`}</CodeBlock>

      <H2>{tx(t, "cppLam_capTitle", "Captures: a copy or a reference")}</H2>
      <p>
        {tx(t, "cppLam_capBody",
          "A lambda can use its own parameters freely, but a local variable of the surrounding function only if it is captured. Captured by value, the lambda keeps its own copy, made when the lambda is created. Captured by reference, it keeps only a way to reach the original, and reads it whenever it is called. Step through the three programs with both kinds of capture.")}
      </p>
      <CaptureFigure t={t} />
      <LessonTable
        headers={[tx(t, "cppLam_hCap", "Capture"), tx(t, "cppLam_hCapM", "Meaning")]}
        rows={[
          ["[]", tx(t, "cppLam_c1", "Nothing. The lambda may only use its parameters and global names.")],
          ["[x]", tx(t, "cppLam_c2", "A copy of x, taken when the lambda is created.")],
          ["[&x]", tx(t, "cppLam_c3", "A reference to x: sees later changes, and may change x. x must outlive the lambda.")],
          ["[=]", tx(t, "cppLam_c4", "A copy of every local the body uses. Handy, but it hides what is captured.")],
          ["[&]", tx(t, "cppLam_c5", "A reference to every local the body uses. Safe for a lambda used at once, as in an algorithm call.")],
          ["[x, &y]", tx(t, "cppLam_c6", "Mixed: x by value, y by reference. [=, &y] and [&, x] work too.")],
          ["[this]", tx(t, "cppLam_c7", "Inside a member function: the object's pointer, so the body can use its members. A pointer: the object must outlive the lambda.")],
          ["[n = expr]", tx(t, "cppLam_c8", "An init capture: a new member n, initialised with any expression. [v = std::move(v)] moves a big object into the lambda.")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "cppLam_rule",
          "The rule: a lambda used immediately (passed to sort, find_if, for_each) may capture by reference. A lambda that is stored or returned (a callback, a task for another thread, anything that runs later) should capture by value, because the variables it would refer to may be gone by then. Capturing this in a stored callback has the same danger: the object may be destroyed first.")}
      </Callout>
      <H3>{tx(t, "cppLam_mutTitle", "mutable")}</H3>
      <p>
        {tx(t, "cppLam_mutBody",
          "A lambda's copies are read-only inside the body, so [n] { return ++n; } does not compile. Writing mutable after the parameter list lets the body change its own copies, which then persist from one call to the next, as the \"counter\" program shows. The original variable is never touched.")}
      </p>

      <H2>{tx(t, "cppLam_whatTitle", "What a lambda really is")}</H2>
      <p>
        {tx(t, "cppLam_whatBody",
          "There is nothing new underneath. For each lambda expression, the compiler writes a class with a name you never see (the closure type): every captured variable becomes a member, and the body becomes its operator(), the member function that runs when an object is called like a function. The lambda expression itself creates one object of that class, the closure. You could write it yourself, and before C++11 people did, under the name function object or functor.")}
      </p>
      <CodeBlock lang="cpp" filename="by_hand.cpp" t={t}>{`// [p](const Enemy& a, const Enemy& b) { return dist2(a.pos, p) < dist2(b.pos, p); }
// is, in effect:
struct CloserTo {
    Vec2 p;                                                   // the capture
    bool operator()(const Enemy& a, const Enemy& b) const {   // the body; const unless mutable
        return dist2(a.pos, p) < dist2(b.pos, p);
    }
};
std::ranges::sort(enemies, CloserTo{player.pos});`}</CodeBlock>
      <p>
        {tx(t, "cppLam_whatAfter",
          "Two consequences. A lambda costs exactly what its captures cost: [p] makes the closure 8 bytes, the size of a Vec2, and an empty [] makes it an empty object. And because each lambda has its own type, sort is compiled specifically for it, so the comparison is usually inlined into the sorting loop. That is why std::sort with a lambda beats C's qsort, which must call through a function pointer every time.")}
      </p>

      <H2>{tx(t, "cppLam_genTitle", "Generic lambdas")}</H2>
      <CodeBlock lang="cpp" filename="generic.cpp" t={t}>{`auto twice = [](auto x) { return x + x; };
twice(21);                       // 42
twice(1.5);                      // 3.0
twice(std::string("ab"));        // "abab"`}</CodeBlock>
      <p>
        {tx(t, "cppLam_genAfter",
          "A parameter declared auto makes the lambda's operator() a template: one version is compiled for each type it is called with. The Templates chapter explains what that means in full.")}
      </p>

      <H2>{tx(t, "cppLam_storeTitle", "Storing and passing lambdas")}</H2>
      <p>
        {tx(t, "cppLam_storeBody",
          "Since every lambda has its own unnamed type, you cannot write that type down. There are four ways to hold one, and they differ in cost.")}
      </p>
      <CodeBlock lang="cpp" filename="store.cpp" t={t}>{`#include <functional>

auto f = [](int x) { return x * 2; };           // 1. auto: the exact type, free

template <class F> void repeat(int n, F fn) {    // 2. a template parameter: free, inlined
    for (int i = 0; i < n; ++i) fn(i);
}

std::function<int(int)> g = f;                   // 3. std::function: any callable, a small cost
std::vector<std::function<void()>> callbacks;    //    the usual choice for storing many

int (*p)(int) = f;                               // 4. a function pointer: only for []`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppLam_hHow", "How"), tx(t, "cppLam_hUse", "Use it for"), tx(t, "cppLam_hCostL", "Cost")]}
        rows={[
          ["auto", tx(t, "cppLam_s1u", "a local variable"), tx(t, "cppLam_s1c", "None: the closure itself.")],
          ["template <class F>", tx(t, "cppLam_s2u", "a function that takes a callable, like the algorithms"), tx(t, "cppLam_s2c", "None at run time; one compiled copy per lambda type.")],
          ["std::function<R(Args…)>", tx(t, "cppLam_s3u", "storing callables of different types together, or in a class member"), tx(t, "cppLam_s3c", "An indirect call (like virtual) and, for big captures, a heap allocation. Cannot hold a move-only lambda; C++23's std::move_only_function can.")],
          ["R (*)(Args…)", tx(t, "cppLam_s4u", "C APIs that take a callback"), tx(t, "cppLam_s4c", "An indirect call. Only a lambda with no captures converts to one.")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "cppLam_typeErasure",
          "std::function can hold a lambda, a function pointer or a function object of any type, as long as it can be called with the right arguments. Hiding the real type behind one common type like this is called type erasure. Inside, it works much like the vtable of the previous chapter.")}
      </Callout>

      <H2>{tx(t, "cppLam_evTitle", "Worked example: a tiny event system")}</H2>
      <CodeBlock lang="cpp" filename="events.cpp" t={t}>{`#include <functional>
#include <print>
#include <string>
#include <vector>

class Signal {
public:
    void connect(std::function<void(const std::string&)> fn) { slots_.push_back(std::move(fn)); }
    void emit(const std::string& msg) const { for (const auto& fn : slots_) fn(msg); }
private:
    std::vector<std::function<void(const std::string&)>> slots_;
};

int main() {
    Signal on_pickup;
    int coins = 0;

    on_pickup.connect([](const std::string& item) { std::println("picked up {}", item); });
    on_pickup.connect([&coins](const std::string& item) { if (item == "coin") ++coins; });

    on_pickup.emit("coin");
    on_pickup.emit("key");
    on_pickup.emit("coin");
    std::println("coins: {}", coins);      // coins: 2
}`}</CodeBlock>
      <p>
        {tx(t, "cppLam_evAfter",
          "Each connect stores a lambda in a std::function, so lambdas of different types share one vector. The second one captures coins by reference, which is safe here only because coins and on_pickup die together at the end of main. If the signal lived longer than coins, that reference would dangle: exactly the \"outlives its scope\" program in the figure.")}
      </p>

      <H3>{tx(t, "cppLam_iifeTitle", "A lambda called on the spot")}</H3>
      <CodeBlock lang="cpp" filename="iife.cpp" t={t}>{`const auto spawn_rate = [&] {
    if (difficulty == Hard) return 0.5f;
    if (difficulty == Easy) return 2.0f;
    return 1.0f;
}();                                       // the () at the end calls it at once`}</CodeBlock>
      <p>
        {tx(t, "cppLam_iifeAfter",
          "Some values need several lines of logic to compute but should never change afterwards. Wrapping the logic in a lambda and calling it at once lets the variable be const.")}
      </p>

      <H2>{tx(t, "cppLam_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cppLam_try1", "Sort a std::vector<std::string> by length, then alphabetically for equal lengths, with one lambda.")}</li>
        <li>{tx(t, "cppLam_try2", "Write make_counter() that returns a lambda counting its own calls (1, 2, 3…). Make two counters and check that they count separately.")}</li>
        <li>{tx(t, "cppLam_try3", "Write make_adder with a [&bonus] capture, call the result, and build with -fsanitize=address. Read the report, then fix it.")}</li>
        <li>{tx(t, "cppLam_try4", "Print sizeof of a lambda with [], with [int], with [std::string] and with [&a, &b]. Explain each size.")}</li>
      </ol>

      <KeyIdeas t={t} id="cppLam" items={[
        "A lambda is an unnamed function written where it is used: [captures](params) { body }.",
        "Captured by value, the lambda keeps a copy made at creation; by reference, it reads the original at each call.",
        "Capture by reference only when the lambda runs before the variable dies; stored callbacks capture by value.",
        "A lambda is an object of a hidden class whose members are the captures and whose operator() is the body.",
        "Algorithms with lambdas are usually inlined, which is why std::sort beats qsort.",
        "Hold a lambda with auto or a template parameter for free; std::function stores any callable at the price of an indirect call.",
      ]} />
    </Article>
  );
}
