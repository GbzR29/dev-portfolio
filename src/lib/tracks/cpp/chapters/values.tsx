"use client";

// Language core 1: value semantics (a copy is a new, independent object, like
// an int); the initialisation forms and their traps (zoo figure: int, vector,
// aggregate; braces as the default; most vexing parse; C++26 erroneous
// behaviour); the four places a copy happens (lifetime figure with Noisy);
// the copy constructor and copy assignment; the pointer member that makes the
// compiler's copy shallow (double free) and the deep copy that fixes it;
// copy-and-swap; the rule of three and the rule of zero; auto and the copies
// it makes; const and constexpr in one paragraph each.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { InitFigure } from "@/components/lesson/figures/cpp/InitFigure";
import { LifetimeFigure } from "@/components/lesson/figures/cpp/LifetimeFigure";

export function ValuesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cppVal_intro",
          "Write int b = a; and then change b. Nobody expects a to change: b is a copy, a second number that only started out equal. That small, obvious behaviour has a name, value semantics, and C++ is built on the wish that every type behave like that, including your own classes. A std::string copies like an int. So does a std::vector of a million elements. This chapter is about the two moments that decide whether a type keeps that promise: the moment an object gets its first value, and the moment it is copied. Get them right and your classes behave like ints. Get them wrong and you meet the two oldest bugs in C++: garbage in a variable, and the same memory freed twice.")}
      </Lead>

      <Goals t={t} id="cppVal" items={[
        "Predict what each way of writing a definition gives, and use braces by default.",
        "Point to every place in a program where an object is copied.",
        "Explain why the copy the compiler writes breaks a class that owns a pointer, and write a deep copy.",
        "Decide between the rule of three and the rule of zero for a class.",
        "Use auto and const auto& without making copies you did not intend.",
      ]} />

      <H2>{tx(t, "cppVal_semTitle", "Value semantics: behave like an int")}</H2>
      <CodeBlock lang="cpp" filename="values.cpp" t={t}>{`#include <print>
#include <string>

int main() {
    int a = 1;
    int b = a;          // b is a new int that starts equal to a
    b = 2;
    std::println("{} {}", a, b);     // 1 2

    std::string s = "hello";
    std::string u = s;  // a new string, with its own copy of the characters
    u[0] = 'j';
    std::println("{} {}", s, u);     // hello jello
}`}</CodeBlock>
      <p>
        {tx(t, "cppVal_semBody",
          "Both pairs end up independent. Not every language works like this. In Python or Java, u = s for a list makes u a second name for the same list, and a change through one shows through the other: that is called reference semantics. C++ gives you references when you ask for them (the & from the references chapter), but plain = always means a new object. The cost of that clarity: a copy can be expensive, and it can be hard to see where copies happen. Both problems are this chapter's subject; the next chapter, on move semantics, removes most of the expense.")}
      </p>

      <H2>{tx(t, "cppVal_initTitle", "Giving a variable its first value")}</H2>
      <p>
        {tx(t, "cppVal_initBody",
          "Initialisation means giving an object its first value, in the same statement that creates it. C has one way to write it: int x = 5;. C++ has collected several more over forty years, and they do not all mean the same thing. The figure puts eight spellings side by side for three kinds of type: a built-in int, a class with constructors (std::vector<int>), and a plain struct with no constructor at all (Point), which C++ calls an aggregate.")}
      </p>
      <InitFigure t={t} />
      <LessonTable
        headers={[tx(t, "cppVal_hForm", "Form"), tx(t, "cppVal_hName", "Called"), tx(t, "cppVal_hUse", "Use it when")]}
        rows={[
          ["T x{};", tx(t, "cppVal_f1n", "value-initialisation"), tx(t, "cppVal_f1", "You want the zero/empty value. The default: never garbage, for any type.")],
          ["T x{a, b};", tx(t, "cppVal_f2n", "list-initialisation"), tx(t, "cppVal_f2", "You are giving the values. A conversion that would lose information is a compile error.")],
          ["T x(a, b);", tx(t, "cppVal_f3n", "direct-initialisation"), tx(t, "cppVal_f3", "You need a constructor that braces would skip: std::vector<int> v(5) for five zeros.")],
          ["T x = a;", tx(t, "cppVal_f4n", "copy-initialisation"), tx(t, "cppVal_f4", "Simple values, where it reads naturally: int n = 0; std::string s = \"hi\";. It cannot call an explicit constructor.")],
          ["auto x = …;", tx(t, "cppVal_f5n", "deduction"), tx(t, "cppVal_f5", "The type is obvious from the right-hand side, or too long to write. See the section on auto below.")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "cppVal_vexing",
          "T x(); with empty parentheses never makes an object. C++ inherited from C the rule that anything that can be read as a function declaration is one, so this declares a function named x. Scott Meyers named it the \"most vexing parse\". Write T x; or T x{}; instead.")}
      </Callout>

      <H3>{tx(t, "cppVal_ebTitle", "Forgetting to initialise, and what C++26 changed")}</H3>
      <p>
        {tx(t, "cppVal_ebBody",
          "A local int, double or pointer defined with no initialiser holds whatever bits were left in that memory. Until C++23, reading it was undefined behaviour: the optimiser could assume it never happens and remove the surrounding code, as the C chapter on undefined behaviour showed. C++26 makes it erroneous behaviour: still a bug, but with a defined result (some value), so the program does not fall apart, and compilers and sanitizers are expected to report it. The rule for you does not change: initialise everything. Braces make that a habit.")}
      </p>
      <CodeBlock lang="cpp" filename="erroneous.cpp" t={t}>{`int f() {
    int x;                    // C++26: erroneous behaviour if read
    return x;                 // a bug either way; now a diagnosable one
}

int g() {
    int x [[indeterminate]];  // C++26: "I really mean uninitialised"
    return x;                 // back to undefined behaviour: you asked for it
}`}</CodeBlock>
      <p>
        {tx(t, "cppVal_ebAfter",
          "[[indeterminate]] is an attribute, a note to the compiler written in double square brackets. It exists for the rare buffer that is about to be filled anyway, where setting it to zero first would be wasted work.")}
      </p>

      <H2>{tx(t, "cppVal_whenTitle", "Where copies happen")}</H2>
      <p>
        {tx(t, "cppVal_whenBody",
          "A copy is made by a special member function, the copy constructor. It is called automatically, which is exactly why copies are easy to miss. To see them, here is Noisy from the classes chapter with two more member functions that announce themselves.")}
      </p>
      <CodeBlock lang="cpp" filename="noisy.cpp" t={t}>{`struct Noisy {
    std::string name;
    Noisy(const std::string& n) : name(n) { std::println("+ {}", name); }

    Noisy(const Noisy& o) : name(o.name + "'") {           // copy constructor
        std::println("copy {}", o.name);
    }
    Noisy& operator=(const Noisy& o) {                     // copy assignment
        name = o.name + "'";
        std::println("assign {}", o.name);
        return *this;
    }
    ~Noisy() { std::println("- {}", name); }
};`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppVal_hPart", "Part"), tx(t, "cppVal_hMeans", "What it means")]}
        rows={[
          ["Noisy(const Noisy& o)", tx(t, "cppVal_n1", "The copy constructor: builds a new Noisy from an existing one, o. Its parameter must be a reference: if it took a Noisy by value, calling it would need a copy, which would call it again, forever.")],
          ["o.name + \"'\"", tx(t, "cppVal_n2", "Only for this demo: the copy of a is named a', so the output shows which object is which.")],
          ["operator=(const Noisy& o)", tx(t, "cppVal_n3", "Copy assignment: called by b = a when b already exists. It overwrites b instead of building it.")],
          ["return *this;", tx(t, "cppVal_n4", "this points at the object being assigned to; *this is that object. Returning it by reference lets a = b = c work, as it does for ints.")],
        ]}
      />
      <p>
        {tx(t, "cppVal_figBody",
          "Now step through a program that copies a Noisy in four different ways, and count the copy lines in the output.")}
      </p>
      <LifetimeFigure t={t} programs={["copies"]} title={tx(t, "cppVal_figCopiesTitle", "Where copies happen")} />
      <LessonTable
        headers={[tx(t, "cppVal_hWhere", "Where"), tx(t, "cppVal_hWhich", "Which function"), tx(t, "cppVal_hAvoid", "To avoid the copy")]}
        rows={[
          ["Noisy b = a;  Noisy b{a};", tx(t, "cppVal_w1", "copy constructor"), tx(t, "cppVal_w1b", "Use a reference if you only need to look: const Noisy& b = a;")],
          ["show(a)  // void show(Noisy n)", tx(t, "cppVal_w2", "copy constructor, for the parameter"), tx(t, "cppVal_w2b", "Take const Noisy& when the function only reads.")],
          ["return n;", tx(t, "cppVal_w3", "usually none (the next chapter shows why)"), tx(t, "cppVal_w3b", "Nothing to do: return by value.")],
          ["b = a;  // b already exists", tx(t, "cppVal_w4", "copy assignment"), tx(t, "cppVal_w4b", "Only when you really want b to become equal to a.")],
        ]}
      />

      <H2>{tx(t, "cppVal_shallowTitle", "The copy that breaks: a pointer member")}</H2>
      <p>
        {tx(t, "cppVal_shallowBody",
          "If a class does not declare a copy constructor, the compiler writes one: it copies every member, one by one, with that member's own copy. For an int that is right. For a std::string it is right too, because std::string's copy makes new characters. For a raw pointer it is wrong: copying a pointer copies the address, not the memory it points at. Here is Buf, a tiny class that owns a heap array, first with the compiler's copy and then with a copy written by hand. Watch the heap panel.")}
      </p>
      <LifetimeFigure t={t} programs={["shallow", "deep"]} title={tx(t, "cppVal_figShallowTitle", "Shallow copy, deep copy")} />
      <LessonTable
        headers={[tx(t, "cppVal_hCopy", "Copy"), tx(t, "cppVal_hWhat", "What it copies"), tx(t, "cppVal_hResult", "Result")]}
        rows={[
          [tx(t, "cppVal_c1", "shallow (the compiler's)"), tx(t, "cppVal_c1b", "The pointer: both objects hold the same address."), tx(t, "cppVal_c1c", "Two owners of one block. A change through one shows in the other, and the second destructor frees freed memory: a double free.")],
          [tx(t, "cppVal_c2", "deep (written by hand)"), tx(t, "cppVal_c2b", "What the pointer points at: a new block, then the values."), tx(t, "cppVal_c2c", "Two independent objects, each freeing its own block once. Value semantics restored.")],
        ]}
      />

      <H3>{tx(t, "cppVal_assignTitle", "Copy assignment, and copy-and-swap")}</H3>
      <p>
        {tx(t, "cppVal_assignBody",
          "Copy assignment is harder than the copy constructor, because the target already owns a block. It must free that block, make a new one, and still be correct for a = a, where the source is the target. The neatest way to get all of that right is called copy-and-swap: make a copy of the source with the copy constructor, then exchange your members with the copy's. The copy, now holding your old block, is destroyed at the end of the function and frees it.")}
      </p>
      <CodeBlock lang="cpp" filename="buf.cpp" t={t}>{`#include <algorithm>   // std::copy
#include <utility>     // std::swap

class Buf {
public:
    explicit Buf(int n) : n_(n), data_(new int[n]{}) {}
    Buf(const Buf& o) : n_(o.n_), data_(new int[o.n_]) {      // deep copy
        std::copy(o.data_, o.data_ + n_, data_);
    }
    Buf& operator=(const Buf& o) {
        Buf tmp(o);                      // 1. copy the source (may fail: we are untouched)
        std::swap(n_, tmp.n_);           // 2. take the copy's members…
        std::swap(data_, tmp.data_);     //    …and give it our old block
        return *this;
    }                                    // 3. ~Buf() of tmp frees our old block
    ~Buf() { delete[] data_; }

    int& operator[](int i) { return data_[i]; }

private:
    int  n_;
    int* data_;
};`}</CodeBlock>
      <p>
        {tx(t, "cppVal_assignAfter",
          "std::swap exchanges two values. operator[] is a member function that lets you write b[0] = 7 on a Buf, as on an array. Notice the order: the copy is made before anything is changed, so if allocating fails, the object is left exactly as it was. a = a also works: tmp is a full copy, so swapping with it changes nothing visible.")}
      </p>

      <H2>{tx(t, "cppVal_rulesTitle", "The rule of three, and the rule of zero")}</H2>
      <p>
        {tx(t, "cppVal_rulesBody",
          "Buf needed three hand-written functions: a destructor, a copy constructor and a copy assignment. That is no accident. If a class needs a destructor to release something, the compiler's copies are wrong for it, so it needs all three. This is the rule of three. It has a better half, the rule of zero: build your classes from members that already copy and clean up correctly, and write none of the three.")}
      </p>
      <CodeBlock lang="cpp" filename="rule_of_zero.cpp" t={t}>{`#include <string>
#include <vector>

class Buf {                        // the same Buf, rule of zero
public:
    explicit Buf(int n) : data_(n) {}
    int& operator[](int i) { return data_[i]; }
private:
    std::vector<int> data_;        // copies deeply, frees itself
};                                 // no destructor, no copy functions: all correct

struct Level {
    std::string      name;
    std::vector<int> tiles;
    int              width = 0;
};                                 // copying a Level copies everything it holds`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppVal_hRule", "Rule"), tx(t, "cppVal_hWhen", "When"), tx(t, "cppVal_hWrite", "You write")]}
        rows={[
          [tx(t, "cppVal_r0", "zero"), tx(t, "cppVal_r0w", "Every member manages itself: values, std::string, std::vector, smart pointers."), tx(t, "cppVal_r0b", "Nothing. The goal for almost every class.")],
          [tx(t, "cppVal_r3", "three"), tx(t, "cppVal_r3w", "The class itself owns something raw: a new'd pointer, a FILE*, a GPU handle."), tx(t, "cppVal_r3b", "Destructor, copy constructor, copy assignment, or = delete on the copies.")],
          [tx(t, "cppVal_r5", "five"), tx(t, "cppVal_r5w", "The same, plus moves (next chapter)."), tx(t, "cppVal_r5b", "The three, plus move constructor and move assignment.")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "cppVal_rulesTip",
          "Some things must not be copied at all: an open file, a window, a lock. For those, write = delete on the two copy functions, as IntVec did in the classes chapter, and the compiler turns every accidental copy into an error.")}
      </Callout>

      <H2>{tx(t, "cppVal_autoTitle", "auto, and the copies it makes")}</H2>
      <p>
        {tx(t, "cppVal_autoBody",
          "auto asks the compiler to work out a variable's type from its initialiser. It follows one rule that surprises people: plain auto always makes a new value. It drops the & and the const from what it is given. To get a reference, say so: auto& or const auto&.")}
      </p>
      <CodeBlock lang="cpp" filename="auto.cpp" t={t}>{`std::vector<std::string> names = load_names();
const std::string& first = names[0];

auto  a = first;     // std::string: a COPY (the & and const are dropped)
auto& b = first;     // const std::string&: no copy
auto  n = names.size();   // std::size_t, the type size() returns

for (auto s : names)        { /* copies every string: usually a mistake */ }
for (auto& s : names)       { /* a reference: may change the strings */ }
for (const auto& s : names) { /* a reference, read-only: the usual choice */ }

std::vector v{1, 2, 3};     // the compiler deduces std::vector<int>`}</CodeBlock>
      <p>
        {tx(t, "cppVal_autoAfter",
          "The last line is class template argument deduction (CTAD): the compiler fills in the <int> of std::vector<int> from the values. It works for most standard types, such as std::pair p{1, 2.5}.")}
      </p>

      <H2>{tx(t, "cppVal_constTitle", "const and constexpr")}</H2>
      <p>
        {tx(t, "cppVal_constBody",
          "const means \"this object will not change after it is initialised\": the compiler rejects any later assignment. constexpr is stronger: the value must be known while compiling, so it can be used where only a constant will do, such as the size of an array. Use constexpr for true constants, const for values computed while the program runs that should not change after. The chapter on compile-time C++ goes much further with constexpr.")}
      </p>
      <CodeBlock lang="cpp" filename="const.cpp" t={t}>{`constexpr int kMaxPlayers = 8;           // known when compiling
int scores[kMaxPlayers]{};               // fine: a constant size

const int seed = read_seed_from_file();  // known only when the program runs
// seed = 4;                             // error: assignment of read-only variable 'seed'`}</CodeBlock>

      <H2>{tx(t, "cppVal_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cppVal_try1", "Write Noisy as in this chapter, then add a function Noisy make() { Noisy n{\"m\"}; return n; } and call it. Count the copy lines. (The answer is in the next chapter.)")}</li>
        <li>{tx(t, "cppVal_try2", "Write Buf with only the destructor, copy one, and build with -fsanitize=address -g. Read the double-free report, then add the deep copy and run again.")}</li>
        <li>{tx(t, "cppVal_try3", "Rewrite Buf with a std::vector<int> member and delete the destructor and the copy functions. Check that copying still gives independent objects.")}</li>
        <li>{tx(t, "cppVal_try4", "Loop over a std::vector<Noisy> with for (auto n : v) and then with for (const auto& n : v). Compare the output.")}</li>
      </ol>

      <KeyIdeas t={t} id="cppVal" items={[
        "Value semantics: a copy is a new, independent object. C++ wants every type to copy like an int.",
        "Prefer braces: T x{} is never garbage, and T x{v} refuses narrowing. Beware std::vector<int>{5} (one element) and T x() (a function).",
        "Copies happen on initialisation from another object, on passing by value, and on assignment; const& avoids them.",
        "The compiler's copy copies members one by one, so a raw owning pointer gets shared: a double free waiting to happen.",
        "Rule of three: a class that needs a destructor needs both copies too (or = delete). Rule of zero: build from members that manage themselves and write none.",
        "auto drops & and const and makes a copy; write const auto& to look without copying.",
      ]} />
    </Article>
  );
}
