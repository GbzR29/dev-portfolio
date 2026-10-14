"use client";

// Objects & functions 1: inheritance and virtual functions. Starts from the C
// way of handling "many kinds of enemy" (a type tag and a switch), builds a
// base class and derived classes, shows that a call through a base pointer
// reaches only base functions until the function is virtual, then opens the
// machine underneath (vptr + vtable, figure). override and final, abstract
// classes as interfaces, the virtual destructor, slicing, storing objects of
// many types (vector<unique_ptr<Base>>), what a virtual call costs, and when
// composition or std::variant fits better.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { VtableFigure } from "@/components/lesson/figures/cpp/VtableFigure";

export function CppInheritanceContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cppInh_intro",
          "A game has slimes that hop, bats that fly and turrets that never move. They are different, yet the main loop wants to treat them all the same way: once per frame, tell every enemy to update itself, without caring which kind it is. C programmers solved this with a type field and a switch, and every new enemy meant editing every switch in the program. C++ lets each kind carry its own behaviour, so the loop can say enemy->update() and the right code runs. This chapter shows how to write that, and then opens the machine underneath, which turns out to be a small table of function addresses.")}
      </Lead>

      <Goals t={t} id="cppInh" items={[
        "Write a base class and derived classes, and know what a derived class inherits.",
        "Explain why a call through a base pointer needs virtual to reach the derived function.",
        "Describe what a vptr and a vtable are, and what a virtual call costs.",
        "Use override, abstract classes and a virtual destructor, and avoid slicing.",
      ]} />

      <H2>{tx(t, "cppInh_cTitle", "The C way: a tag and a switch")}</H2>
      <CodeBlock lang="c" filename="enemies.c" t={t}>{`enum Kind { SLIME, BAT, TURRET };

struct Enemy { enum Kind kind; int hp; float x, y; };

void enemy_update(struct Enemy *e, float dt) {
    switch (e->kind) {
    case SLIME:  /* hop */      break;
    case BAT:    /* fly */      break;
    case TURRET: /* aim */      break;
    }
}`}</CodeBlock>
      <p>
        {tx(t, "cppInh_cAfter",
          "It works, and for a small fixed set of kinds it is still a fine design. Its weakness shows as the game grows: each new kind of enemy means finding every switch (update, draw, hit, save…) and adding a case, and a forgotten case compiles without a word. The behaviour of a bat is scattered over the whole program instead of living in one place.")}
      </p>

      <H2>{tx(t, "cppInh_baseTitle", "Base class and derived classes")}</H2>
      <p>
        {tx(t, "cppInh_baseBody",
          "Inheritance lets a class start as a copy of another one and add to it. The class you start from is the base class; the new one is the derived class. Every derived object contains a complete base object inside it, called its base subobject, plus whatever the derived class adds.")}
      </p>
      <CodeBlock lang="cpp" filename="enemy.cpp" t={t}>{`#include <print>

class Enemy {
public:
    explicit Enemy(int hp) : hp_(hp) {}
    void hit(int n) { hp_ -= n; }
    bool alive() const { return hp_ > 0; }
    void update(float dt) { std::println("Enemy stands still"); }

protected:                // visible to derived classes, hidden from everyone else
    int hp_;
};

class Slime : public Enemy {           // a Slime is an Enemy, plus a size
public:
    Slime() : Enemy(20) {}             // the base part is built first
    void update(float dt) { std::println("Slime hops"); }
private:
    float size_ = 1.0f;
};

int main() {
    Slime s;
    s.hit(5);          // inherited from Enemy
    s.update(0.016f);  // Slime's own: "Slime hops"
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppInh_hPart", "Part"), tx(t, "cppInh_hMeans", "What it means")]}
        rows={[
          ["class Slime : public Enemy", tx(t, "cppInh_b1", "Slime derives from Enemy. public means Enemy's public members stay public in Slime, so anyone can call s.hit(5). (private inheritance exists, but is rarely what you want.)")],
          ["protected:", tx(t, "cppInh_b2", "A third access level: like private for the outside world, but derived classes may use it. Slime's functions can read hp_; main cannot.")],
          ["Slime() : Enemy(20)", tx(t, "cppInh_b3", "A derived constructor names the base constructor first in its initialiser list. The base part is built before the derived members, and destroyed after them.")],
          ["s.hit(5)", tx(t, "cppInh_b4", "Slime did not write hit; it inherited it. Inside, hp_ is the hp_ of the Enemy part of s.")],
          ["update in both classes", tx(t, "cppInh_b5", "Slime's update hides Enemy's: through a Slime, the call reaches Slime::update.")],
        ]}
      />
      <p>
        {tx(t, "cppInh_isA",
          "Use public inheritance only when the sentence \"a Slime is an Enemy\" is true: everywhere the program expects an Enemy, a Slime must be able to stand in. That is the whole point of the next section.")}
      </p>

      <H2>{tx(t, "cppInh_ptrTitle", "Through a base pointer, the derived function is lost")}</H2>
      <p>
        {tx(t, "cppInh_ptrBody",
          "Since every Slime contains an Enemy, a pointer or reference to Enemy can point at a Slime. The conversion is automatic. That is what lets one loop hold all kinds of enemies. But try it:")}
      </p>
      <CodeBlock lang="cpp" filename="lost.cpp" t={t}>{`Slime s;
Enemy* e = &s;        // fine: a Slime is an Enemy
e->update(0.016f);    // prints "Enemy stands still"  (!)`}</CodeBlock>
      <p>
        {tx(t, "cppInh_ptrAfter",
          "When the compiler translates e->update, all it knows is the type it was declared with, Enemy*. Which object e will point at is only known while the program runs. So by default it calls Enemy::update, decided once at compile time. This is called static binding. For a function the derived classes are meant to replace, we need the decision made at run time instead, from the real type of the object.")}
      </p>

      <H2>{tx(t, "cppInh_virtTitle", "virtual: decide at run time")}</H2>
      <CodeBlock lang="cpp" filename="virtual.cpp" t={t}>{`class Enemy {
public:
    virtual ~Enemy() = default;                  // see "the virtual destructor"
    virtual void update(float dt) { std::println("Enemy stands still"); }
    // …
};

class Slime : public Enemy {
public:
    void update(float dt) override { std::println("Slime hops"); }
};

class Bat : public Enemy {
public:
    void update(float dt) override { std::println("Bat flies"); }
};

Slime s; Bat b;
Enemy* list[] = { &s, &b };
for (Enemy* e : list)
    e->update(0.016f);       // "Slime hops", then "Bat flies"`}</CodeBlock>
      <p>
        {tx(t, "cppInh_virtAfter",
          "virtual in front of a member function means: a call through a pointer or reference picks the body from the object's real type, at the moment of the call. This is dynamic binding, and one call written once behaving differently for each type is called polymorphism (Greek for \"many shapes\"). The redefinition in a derived class is an override. A function that is virtual in the base stays virtual in every derived class, with or without the keyword.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "cppInh_refsToo",
          "It works the same way through a reference: void tick(Enemy& e) { e.update(dt); } calls Slime::update when given a Slime. Only a call on an object itself, s.update(dt), is always static: there the compiler knows the type exactly.")}
      </Callout>

      <H2>{tx(t, "cppInh_vtTitle", "How it works: the vptr and the vtable")}</H2>
      <p>
        {tx(t, "cppInh_vtBody",
          "There is no magic and no searching. For every class with virtual functions, the compiler builds one table in read-only memory, the vtable (virtual table): an array with the address of the right function for each virtual function, in a fixed order. Every object of such a class gets one hidden field at its start, the vptr (virtual pointer), which the constructor sets to its class's table. A virtual call then compiles to three small steps: read the vptr from the object, read the address in the function's slot, jump there.")}
      </p>
      <CodeBlock lang="cpp" filename="what_the_compiler_writes.cpp" t={t}>{`// e->update(dt);   becomes, in spirit:
auto table = *reinterpret_cast<void***>(e);      // 1. read the vptr (first 8 bytes)
auto fn    = reinterpret_cast<void(*)(Enemy*, float)>(table[1]); // 2. slot of update
fn(e, dt);                                       // 3. call it, with this = e`}</CodeBlock>
      <p>
        {tx(t, "cppInh_figBody",
          "Run the calls below. Pick which object e points at and which call the program makes, and follow it through the stack, the heap, the tables and the code. Then use the switches to break it: they produce the three classic bugs of this chapter.")}
      </p>
      <VtableFigure t={t} />
      <LessonTable
        headers={[tx(t, "cppInh_hTerm", "Term"), tx(t, "cppInh_hMeaning", "Meaning")]}
        rows={[
          [tx(t, "cppInh_tVt", "vtable"), tx(t, "cppInh_tVtB", "One per class with virtual functions, built by the compiler, stored in read-only memory. Slot i holds the address of the function to run for virtual function number i.")],
          [tx(t, "cppInh_tVp", "vptr"), tx(t, "cppInh_tVpB", "A hidden pointer in every object of such a class, usually its first 8 bytes. Set by the constructor; it is how an object \"knows\" its own type at run time.")],
          [tx(t, "cppInh_tSlot", "slot"), tx(t, "cppInh_tSlotB", "Fixed by the base class: update is in the same slot in the tables of Enemy, Slime and Bat. That is why the caller does not need to know the real type.")],
          [tx(t, "cppInh_tInh", "an inherited slot"), tx(t, "cppInh_tInhB", "A derived class that does not override a function gets the base's address copied into its table.")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "cppInh_abiNote",
          "The C++ standard does not mention vtables: it only says what virtual calls must do. But every major compiler implements them this way, with small differences in table layout between the Itanium ABI (GCC and Clang on Linux and macOS) and MSVC. An ABI (application binary interface) is the set of rules for how compiled code lays out objects and calls functions.")}
      </Callout>

      <H2>{tx(t, "cppInh_ovTitle", "override and final: let the compiler check you")}</H2>
      <p>
        {tx(t, "cppInh_ovBody",
          "An override must match the base function exactly: same name, same parameter types, same const. If it does not, it is simply a new, different function, and calls through the base keep going to the base. Writing override after the parameter list asks the compiler to confirm that the function really replaces a virtual one, and to stop with an error if it does not. Always write it.")}
      </p>
      <CodeBlock lang="cpp" filename="override.cpp" t={t}>{`class Bat : public Enemy {
public:
    void update(double dt) override;   // error: marked 'override', but does not override
    void updte(float dt) override;     // error: a typo is caught too
    void update(float dt) const override; // error: const is part of the signature
};

class Boss final : public Enemy { … };  // final on a class: nobody may derive from Boss

class Slime : public Enemy {
public:
    void update(float dt) final;        // final on a function: no class below may override it
};`}</CodeBlock>

      <H2>{tx(t, "cppInh_absTitle", "Abstract classes: interfaces")}</H2>
      <p>
        {tx(t, "cppInh_absBody",
          "Sometimes the base class has no sensible behaviour of its own: what should a plain \"Shape\" draw? Write = 0 instead of a body to make a function pure virtual. A class with at least one pure virtual function is abstract: you cannot create objects of it, only of derived classes that override every pure function. An abstract class with nothing but pure virtual functions is what other languages call an interface.")}
      </p>
      <CodeBlock lang="cpp" filename="shape.cpp" t={t}>{`class Shape {
public:
    virtual ~Shape() = default;
    virtual float area() const = 0;            // pure virtual: no body here
    virtual void draw() const = 0;
};

class Circle : public Shape {
public:
    explicit Circle(float r) : r_(r) {}
    float area() const override { return 3.14159f * r_ * r_; }
    void draw() const override { /* … */ }
private:
    float r_;
};

// Shape s;          // error: cannot declare variable 's' to be of abstract type 'Shape'
Circle c(2);         // fine
const Shape& sh = c; // fine: a reference to the Shape part of c`}</CodeBlock>

      <H2>{tx(t, "cppInh_dtorTitle", "The virtual destructor")}</H2>
      <p>
        {tx(t, "cppInh_dtorBody",
          "delete e on an Enemy* is also a call: to the destructor. If ~Enemy is not virtual, it is bound statically like any other function, so only ~Enemy runs. The derived destructor never runs, and neither do the destructors of the derived class's members. Formally, deleting a derived object through a base pointer whose destructor is not virtual is undefined behaviour. In practice, it leaks whatever the derived part owned. In the figure, untick virtual on the destructor and delete a Bat: its path's block is never freed.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "cppInh_dtorRule",
          "Rule: a class meant to be used through a base pointer gets virtual ~Base() = default;. If a class is not meant to be a base at all, mark it final, and the question cannot come up.")}
      </Callout>

      <H2>{tx(t, "cppInh_sliceTitle", "Slicing: polymorphism needs pointers or references")}</H2>
      <CodeBlock lang="cpp" filename="slicing.cpp" t={t}>{`void tick_copy(Enemy e)  { e.update(0.016f); }  // by value
void tick_ref(Enemy& e)  { e.update(0.016f); }  // by reference

Bat b;
tick_copy(b);   // "Enemy stands still": only the Enemy part was copied
tick_ref(b);    // "Bat flies"

std::vector<Enemy> v;  v.push_back(b);   // the same problem: each slot is an Enemy`}</CodeBlock>
      <p>
        {tx(t, "cppInh_sliceAfter",
          "A parameter or vector element of type Enemy has room for exactly an Enemy. Copying a Bat into it copies only the Enemy part and drops the rest; the copy's vptr is Enemy's. This is called slicing. Polymorphism only works through something that refers to the original object: a pointer, a reference, or a smart pointer.")}
      </p>

      <H3>{tx(t, "cppInh_storeTitle", "Keeping many kinds of objects together")}</H3>
      <CodeBlock lang="cpp" filename="world.cpp" t={t}>{`#include <memory>
#include <vector>

std::vector<std::unique_ptr<Enemy>> enemies;
enemies.push_back(std::make_unique<Slime>());
enemies.push_back(std::make_unique<Bat>());

for (auto& e : enemies)
    e->update(dt);          // one loop, each enemy its own behaviour

// erasing an element deletes the enemy, through the virtual destructor`}</CodeBlock>
      <p>
        {tx(t, "cppInh_storeAfter",
          "Each element is a unique_ptr that owns one enemy on the heap, from the RAII chapter. The vector holds pointers, so there is no slicing, and every enemy is deleted when its pointer is erased or the vector dies.")}
      </p>

      <H2>{tx(t, "cppInh_costTitle", "What it costs, and when not to use it")}</H2>
      <LessonTable
        headers={[tx(t, "cppInh_hCost", "Cost"), tx(t, "cppInh_hWhy", "Why")]}
        rows={[
          [tx(t, "cppInh_k1", "8 bytes per object"), tx(t, "cppInh_k1b", "The vptr. For an object of 16 bytes, that is half its size again.")],
          [tx(t, "cppInh_k2", "An indirect call"), tx(t, "cppInh_k2b", "Two memory reads and a jump to an address only known at run time. The CPU predicts it well when the same type repeats, poorly when the types are mixed at random.")],
          [tx(t, "cppInh_k3", "No inlining"), tx(t, "cppInh_k3b", "The compiler cannot paste a function's body into the caller when it does not know which function will run. For tiny functions this is the biggest cost. (Compilers do remove it when they can prove the type, which final helps with.)")],
          [tx(t, "cppInh_k4", "Objects on the heap"), tx(t, "cppInh_k4b", "Many types in one container usually means one allocation per object, scattered in memory, which is slow to walk. The Performance chapter returns to this.")],
        ]}
      />
      <p>
        {tx(t, "cppInh_alts",
          "Inheritance is the right tool when the set of types is open: plugins, or code that others extend without touching yours. Two alternatives are often better. Composition: instead of a Bat being a special Enemy, an Enemy has a Movement component, and swapping components changes behaviour without a class per combination. std::variant<Slime, Bat, Turret>, from the Vocabulary Types chapter: a closed set of types stored by value, side by side, with no heap and no vtable; the compiler then checks that every type is handled, which is exactly what the C switch could not do.")}
      </p>

      <H2>{tx(t, "cppInh_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cppInh_try1", "Write Enemy, Slime and Bat with a virtual update, store them in a std::vector<std::unique_ptr<Enemy>>, and update them all in one loop. Add a Turret without touching the loop.")}</li>
        <li>{tx(t, "cppInh_try2", "Remove virtual from update and run again. Then put it back and remove override from Bat, and change Bat's parameter to double. Explain each output.")}</li>
        <li>{tx(t, "cppInh_try3", "Print sizeof(Enemy) with and without any virtual function. Explain the difference.")}</li>
        <li>{tx(t, "cppInh_try4", "Give Bat a std::vector member, make ~Enemy non-virtual, delete a Bat through an Enemy*, and build with -fsanitize=address. Read the report, then fix it.")}</li>
      </ol>

      <KeyIdeas t={t} id="cppInh" items={[
        "A derived class contains a whole base object and adds to it; use public inheritance only for a true \"is a\".",
        "Through a base pointer or reference, a non-virtual call goes to the base function, chosen at compile time.",
        "A virtual call reads the object's vptr, takes the function's slot from its class's vtable, and jumps there.",
        "Write override on every override: a wrong signature then becomes a compile error instead of a silent bug.",
        "A base class used through pointers needs a virtual destructor; otherwise derived parts are never destroyed.",
        "Copying a derived object into a base value slices it; keep polymorphic objects behind pointers, e.g. unique_ptr.",
        "Virtual calls cost a pointer per object, an indirect call and lost inlining; std::variant or composition often fit better.",
      ]} />
    </Article>
  );
}
