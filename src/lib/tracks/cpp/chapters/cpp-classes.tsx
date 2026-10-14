"use client";

// First steps in C++ 3: from a C struct anyone can break to a class that
// guards its own rule (invariant); member functions and this; public/private
// and struct vs class; constructors (initialiser list, default member
// initialisers, explicit); const member functions; destructors and the exact
// order of construction and destruction (lifetime figure: scopes, members,
// early return); a ScopeTimer that works through its destructor; owning raw
// memory needs copying switched off (taught fully in RAII / Move); splitting
// a class into .h and .cpp.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { LifetimeFigure } from "@/components/lesson/figures/cpp/LifetimeFigure";

export function CppClassesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cppCls_intro",
          "In the C chapters, every struct came with rules written in comments. IntVec's length must never pass its capacity. A FILE must be closed exactly once. A health value must stay between zero and the maximum. Nothing enforced them: any line of the program could set the fields to anything, and any forgotten cleanup call was a leak. A class is a struct that can enforce its own rules. It decides which of its fields the rest of the program may touch, it runs a constructor so that it is valid from its very first moment, and it runs a destructor so that it cleans up after itself. This is the idea the whole of C++ is built on.")}
      </Lead>

      <Goals t={t} id="cppCls" items={[
        "Write a class with private data and public member functions that keep a rule true.",
        "Write a constructor with a member initialiser list, and a destructor.",
        "Predict the exact order in which objects and their members are built and destroyed.",
        "Split a class into a header and a source file.",
      ]} />

      <H2>{tx(t, "cppCls_structTitle", "The problem: a struct anyone can break")}</H2>
      <CodeBlock lang="c" filename="health.c" t={t}>{`struct Health { int hp; int max; };   // rule: 0 <= hp <= max

void damage(struct Health *h, int n) {
    h->hp -= n;
    if (h->hp < 0) h->hp = 0;
}

struct Health h = {100, 100};
damage(&h, 30);     // fine: 70
h.hp = 5000;        // also compiles: the rule is broken, and nothing notices`}</CodeBlock>
      <p>
        {tx(t, "cppCls_structAfter",
          "The function damage keeps the rule, but nothing makes the rest of the program go through it. Such a rule, one that must always be true about an object, is called an invariant. A class makes the compiler protect it.")}
      </p>

      <H2>{tx(t, "cppCls_classTitle", "A class that guards its rule")}</H2>
      <CodeBlock lang="cpp" filename="health.cpp" t={t}>{`#include <algorithm>   // std::clamp, std::max

class Health {
public:                                      // usable by everyone
    explicit Health(int max)
        : max_(std::max(1, max)), hp_(max_) {}  // constructor: starts valid

    void damage(int n) { hp_ = std::clamp(hp_ - n, 0, max_); }
    void heal(int n)   { hp_ = std::clamp(hp_ + n, 0, max_); }

    int  hp() const    { return hp_; }       // const: only reads
    bool alive() const { return hp_ > 0; }

private:                                     // only Health's own functions
    int max_;
    int hp_;
};

int main() {
    Health h(100);
    h.damage(30);          // 70
    h.heal(500);           // 100: clamped to max
    // h.hp_ = 5000;       // error: 'int Health::hp_' is private
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppCls_hPart", "Part"), tx(t, "cppCls_hMeans", "What it means")]}
        rows={[
          ["class Health { … };", tx(t, "cppCls_c1", "Defines a new type, like a struct. Note the semicolon after the closing brace.")],
          ["public: / private:", tx(t, "cppCls_c2", "Access labels. Everything after public: can be used anywhere; everything after private: only by the class's own member functions. The compiler enforces it.")],
          ["void damage(int n) { … }", tx(t, "cppCls_c3", "A member function: a function that belongs to the class and works on one object. Called as h.damage(30).")],
          ["hp_ inside damage", tx(t, "cppCls_c4", "Inside a member function, the object's fields are used by name. They are the fields of the object it was called on.")],
          ["int hp() const", tx(t, "cppCls_c5", "A getter: lets the outside read hp_ without being able to change it. const after the parentheses promises that this function does not change the object.")],
          ["the _ in hp_", tx(t, "cppCls_c6", "Only a naming habit, so that private fields do not clash with function names such as hp(). Some codebases use m_hp instead.")],
        ]}
      />
      <p>
        {tx(t, "cppCls_thisBody",
          "How does damage know which object to work on? Every member function receives a hidden extra parameter, this: a pointer to the object it was called on. h.damage(30) is compiled very much like the C call damage(&h, 30), and hp_ inside it means this->hp_. The machine code is the same as the C version. What changed is who may call it.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "cppCls_structVsClass",
          "struct and class are the same thing in C++, with one difference: members of a struct are public until you say otherwise, members of a class are private. The convention: struct for plain bundles of data with no rule to keep (a Vec2, a Color), class when there is an invariant to protect.")}
      </Callout>

      <H2>{tx(t, "cppCls_ctorTitle", "Constructors: valid from the first moment")}</H2>
      <p>
        {tx(t, "cppCls_ctorBody",
          "A constructor is a member function with the class's name and no return type. It runs automatically whenever an object is created, so there is no moment when a Health exists but has not been set up. In C, a struct declared without a value held garbage until someone remembered to call an init function.")}
      </p>
      <H3>{tx(t, "cppCls_initTitle", "The member initialiser list")}</H3>
      <p>
        {tx(t, "cppCls_initBody",
          "The part after the colon, : max_(…), hp_(max_), is the member initialiser list. It gives each field its first value, before the constructor's body between the braces runs. Prefer it to assigning in the body: assigning means the field was first built empty and then overwritten, and some fields (const ones, references) cannot be assigned at all.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "cppCls_orderWarn",
          "Fields are initialised in the order they are declared in the class, not the order they appear in the list. In Health, max_ is declared before hp_, so hp_(max_) reads an already set max_. Swap the two declarations and hp_ would copy a max_ that does not exist yet. -Wall warns about a list written in a different order (-Wreorder).")}
      </Callout>
      <CodeBlock lang="cpp" filename="ctors.cpp" t={t}>{`class Sprite {
public:
    Sprite() = default;                         // default constructor: uses the values below
    Sprite(float x, float y) : x_(x), y_(y) {}  // a second constructor (an overload)

private:
    float x_ = 0, y_ = 0;                       // default member initialisers
    float scale_ = 1;
};

Sprite a;            // (0, 0), scale 1
Sprite b(3, 4);      // (3, 4), scale 1
Sprite c{3, 4};      // the same, with braces`}</CodeBlock>
      <p>
        {tx(t, "cppCls_explicitBody",
          "A constructor with one parameter also acts as an automatic conversion: without explicit, Health h = 50; and a call damage_all(50) for a function taking a Health would quietly build a Health from the number. Mark one-parameter constructors explicit unless the conversion is genuinely natural (a std::string from a text literal is one).")}
      </p>

      <H2>{tx(t, "cppCls_dtorTitle", "Destructors, and the order of everything")}</H2>
      <p>
        {tx(t, "cppCls_dtorBody",
          "A destructor is written ~ClassName(), with no parameters. It runs automatically when the object's life ends: for a local variable, at the closing brace of its scope. To watch it happen, here is a class whose only job is to announce itself.")}
      </p>
      <CodeBlock lang="cpp" filename="noisy.cpp" t={t}>{`#include <print>
#include <string>

struct Noisy {
    std::string name;
    Noisy(const std::string& n) : name(n) { std::println("+ {}", name); }
    ~Noisy()                              { std::println("- {}", name); }
};`}</CodeBlock>
      <p>
        {tx(t, "cppCls_figBody",
          "Step through the three programs. In the first, see the order in which objects in nested scopes die. In the second, see how an object with members is assembled and taken apart. In the third, a function leaves early, and the destructor still runs. Then tick the box to remove all destructors, which is the world of C.")}
      </p>
      <LifetimeFigure t={t} programs={["scopes", "members", "early"]} />
      <LessonTable
        headers={[tx(t, "cppCls_hWhen", "When"), tx(t, "cppCls_hOrder", "Order")]}
        rows={[
          [tx(t, "cppCls_o1", "Objects in one scope"), tx(t, "cppCls_o1b", "Built top to bottom, destroyed bottom to top: the reverse of construction.")],
          [tx(t, "cppCls_o2", "Building an object"), tx(t, "cppCls_o2b", "Its members first, in declaration order, then the constructor's body.")],
          [tx(t, "cppCls_o3", "Destroying an object"), tx(t, "cppCls_o3b", "The destructor's body first, then its members, in reverse declaration order.")],
          [tx(t, "cppCls_o4", "Leaving a scope early"), tx(t, "cppCls_o4b", "return, break, continue, or an exception: every object built so far in the scope is destroyed, in reverse order. Objects not yet built are skipped.")],
        ]}
      />

      <H3>{tx(t, "cppCls_timerTitle", "A destructor that does useful work")}</H3>
      <p>
        {tx(t, "cppCls_timerBody",
          "Destructors are not only for freeing memory. This class measures how long a scope takes: the constructor notes the time, the destructor prints the difference. Put one at the top of any function and you have a profiler that cannot forget to stop, whichever return the function leaves through. std::chrono is the standard time library; steady_clock is a clock that never jumps backwards.")}
      </p>
      <CodeBlock lang="cpp" filename="scope_timer.cpp" t={t}>{`#include <chrono>
#include <print>

class ScopeTimer {
public:
    explicit ScopeTimer(const char* label)
        : label_(label), start_(std::chrono::steady_clock::now()) {}

    ~ScopeTimer() {
        auto elapsed = std::chrono::steady_clock::now() - start_;
        auto us = std::chrono::duration_cast<std::chrono::microseconds>(elapsed);
        std::println("{}: {} us", label_, us.count());
    }

private:
    const char* label_;
    std::chrono::steady_clock::time_point start_;
};

void load_level() {
    ScopeTimer timer("load_level");
    // … any number of returns …
}                                   // prints e.g. "load_level: 1834 us"`}</CodeBlock>

      <H3>{tx(t, "cppCls_ownTitle", "Owning memory: switch off copying for now")}</H3>
      <p>
        {tx(t, "cppCls_ownBody",
          "A destructor is the natural place to free memory, so here is IntVec from the C chapters as a class. There is one catch. Copying an object copies its fields, and the field data_ is a pointer: two IntVecs would hold the same block, and both destructors would free it, a double free. Until the chapters on RAII and move semantics show how to copy and move such a class properly, mark copying as deleted, and the compiler will refuse any copy.")}
      </p>
      <CodeBlock lang="cpp" filename="intvec.cpp" t={t}>{`class IntVec {
public:
    explicit IntVec(int cap) : data_(new int[cap]), cap_(cap) {}
    ~IntVec() { delete[] data_; }               // the vec_destroy you can no longer forget

    IntVec(const IntVec&) = delete;             // no copies (yet)
    IntVec& operator=(const IntVec&) = delete;

    void push(int x) { if (len_ < cap_) data_[len_++] = x; }
    int  size() const { return len_; }

private:
    int* data_;
    int  len_ = 0;
    int  cap_;
};`}</CodeBlock>
      <p>
        {tx(t, "cppCls_ownAfter",
          "new int[cap] is C++'s malloc for an array, and delete[] is its free. You will rarely write them yourself: the next chapter's std::vector is this class, finished, with copying, growth and bounds checks done properly.")}
      </p>

      <H2>{tx(t, "cppCls_splitTitle", "Header and source file")}</H2>
      <p>
        {tx(t, "cppCls_splitBody",
          "In a real project the class definition goes in a header, so every file that uses Health can see it, and the bodies of the longer member functions go in a .cpp file, compiled once. Outside the class, a member function's name is written with the class in front: Health::damage.")}
      </p>
      <CodeBlock lang="cpp" filename="health.h" t={t}>{`#pragma once

class Health {
public:
    explicit Health(int max);
    void damage(int n);
    int  hp() const { return hp_; }    // tiny bodies may stay in the header
private:
    int max_;
    int hp_;
};`}</CodeBlock>
      <CodeBlock lang="cpp" filename="health.cpp" t={t}>{`#include "health.h"
#include <algorithm>

Health::Health(int max) : max_(std::max(1, max)), hp_(max_) {}

void Health::damage(int n) { hp_ = std::clamp(hp_ - n, 0, max_); }`}</CodeBlock>

      <H2>{tx(t, "cppCls_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cppCls_try1", "Write a class Ammo with a clip size and a count that never goes below 0 or above the clip size: fire() returns false when empty, reload() refills. Try to break the rule from main and read the compiler's error.")}</li>
        <li>{tx(t, "cppCls_try2", "Give Noisy to a class Level as two members, then create a Level inside a block in main. Predict the output order before you run it.")}</li>
        <li>{tx(t, "cppCls_try3", "Put a ScopeTimer in a function with three different return statements. Check that it prints exactly once for each call, whichever return is taken.")}</li>
        <li>{tx(t, "cppCls_try4", "Remove the two = delete lines from IntVec, copy one (IntVec b = a;) and run with -fsanitize=address. Read the report.")}</li>
      </ol>

      <KeyIdeas t={t} id="cppCls" items={[
        "A class keeps its fields private and exposes member functions, so its invariant cannot be broken from outside.",
        "struct and class differ only in default access: struct for plain data, class when there is a rule to keep.",
        "A constructor makes the object valid from its first moment; fill fields in the initialiser list, in declaration order.",
        "A destructor runs automatically at the end of the object's life, on every path out of the scope.",
        "Construction goes members-then-body; destruction is exactly the reverse.",
        "A class that frees a pointer in its destructor must not be copied naively: delete copying until you implement it.",
      ]} />
    </Article>
  );
}
