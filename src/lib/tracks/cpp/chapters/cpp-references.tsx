"use client";

// First steps in C++ 2: references (alias, binding rules, swap by reference in
// the memory figure, const& for reading big objects, the four ways to pass an
// argument, references vs pointers, dangling references); function overloading
// and how the compiler picks an overload (figure, with the "hi" → bool trap);
// default arguments; namespaces (::, nesting, using, the anonymous namespace)
// and why overloading needs name mangling.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { MemoryBoxFigure } from "@/components/lesson/figures/c/MemoryBoxFigure";
import { OverloadFigure } from "@/components/lesson/figures/cpp/OverloadFigure";

export function CppReferencesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cppRef_intro",
          "In C, a function that wanted to change your variable had to receive its address, and then write *p at every use. C had one name per function, so the standard library needed abs, labs and fabs for the same idea on three types. And every name in every library shared one big space, so each library glued a prefix onto its names (SDL_, gl, vk) to avoid clashes. C++ answers all three with small, everyday features: references, overloading and namespaces. None of them changes what the machine does. They change how your code reads.")}
      </Lead>

      <Goals t={t} id="cppRef" items={[
        "Use a reference to let a function change the caller's variable.",
        "Choose between passing by value, by reference, by const reference and by pointer.",
        "Predict which overload a call picks, and fix an ambiguous call.",
        "Put code in a namespace and call it with ::.",
      ]} />

      <H2>{tx(t, "cppRef_aliasTitle", "A reference is a second name")}</H2>
      <p>
        {tx(t, "cppRef_aliasBody",
          "A reference is declared with & after the type. It does not create a new box in memory for a value: it gives an existing variable another name. Everything you do to the reference happens to that variable.")}
      </p>
      <CodeBlock lang="cpp" filename="alias.cpp" t={t}>{`int score = 10;
int& s = score;     // s is another name for score
s = 25;             // score is now 25
s += 5;             // score is now 30
int* p = &s;        // the address of s IS the address of score`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppRef_hRule", "Rule"), tx(t, "cppRef_hMeans", "What it means")]}
        rows={[
          [tx(t, "cppRef_r1", "Bound at birth"), tx(t, "cppRef_r1b", "A reference must be given its variable when it is declared. int& r; on its own does not compile.")],
          [tx(t, "cppRef_r2", "Never re-bound"), tx(t, "cppRef_r2b", "Once bound, it refers to the same variable for its whole life. r = other; copies other's value into the original variable; it does not make r refer to other.")],
          [tx(t, "cppRef_r3", "Never null"), tx(t, "cppRef_r3b", "There is no null reference, so a function that takes one does not need to check for it.")],
          [tx(t, "cppRef_r4", "No arithmetic"), tx(t, "cppRef_r4b", "r + 1 is the value plus one, not the next element. To walk through memory you still use pointers or, better, the containers of later chapters.")],
        ]}
      />

      <H2>{tx(t, "cppRef_swapTitle", "Passing by reference")}</H2>
      <p>
        {tx(t, "cppRef_swapBody",
          "The swap from the pointers chapter, rewritten with references. The call looks like a call by value, swap(x, y), yet the function reaches x and y themselves. Step through it, then switch to the second program to see the one way a reference can go wrong.")}
      </p>
      <MemoryBoxFigure t={t} programs={["swapRef", "refDangle"]} />
      <p>
        {tx(t, "cppRef_swapAfter",
          "The figure draws a reference as an arrow, because that is how the compiler usually implements one when it is passed to a function: it passes an address. Inside a single function a reference often costs nothing at all; the compiler just uses the original variable. Either way, you never write * or &x yourself.")}
      </p>

      <H3>{tx(t, "cppRef_constTitle", "const references: read without copying")}</H3>
      <p>
        {tx(t, "cppRef_constBody",
          "Passing by value copies the argument. For an int that is 4 bytes, nothing. For a std::string holding a whole level file, or a vector of 10 000 vertices, the copy means a heap allocation and a long memcpy on every call. A const reference passes the object without copying it, and const promises that the function only reads it: the compiler rejects any attempt to change it.")}
      </p>
      <CodeBlock lang="cpp" filename="pass.cpp" t={t}>{`int    square(int n);                          // small: by value
double average(const std::vector<double>& xs);  // big, only read: const&
void   normalize(std::vector<double>& xs);      // changed for the caller: &
void   attach(Node* parent);                    // may be "nothing": pointer, nullptr allowed`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppRef_hPass", "Parameter"), tx(t, "cppRef_hWhen", "Use it when"), tx(t, "cppRef_hCost", "Cost")]}
        rows={[
          ["T", tx(t, "cppRef_p1", "T is small (int, double, char, a 2D vector of two floats) or the function needs its own copy anyway."), tx(t, "cppRef_p1c", "a copy of T")],
          ["const T&", tx(t, "cppRef_p2", "T is large (strings, containers, big structs) and the function only reads it. The usual choice."), tx(t, "cppRef_p2c", "an address")],
          ["T&", tx(t, "cppRef_p3", "the function must change the caller's object. Name it so the call site is not a surprise."), tx(t, "cppRef_p3c", "an address")],
          ["T*", tx(t, "cppRef_p4", "\"no object\" is a valid answer: the caller may pass nullptr, and the function checks."), tx(t, "cppRef_p4c", "an address")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "cppRef_smallNote",
          "Why not pass everything by const&? Because reading through an address costs an extra memory access each time, and for a value of 8 bytes or less, copying it into a register is cheaper than handing over its address. Rule of thumb: built-in types and tiny structs by value, the rest by const&.")}
      </Callout>

      <H3>{tx(t, "cppRef_vsTitle", "References and pointers side by side")}</H3>
      <LessonTable
        headers={["", tx(t, "cppRef_hRef", "Reference T&"), tx(t, "cppRef_hPtr", "Pointer T*")]}
        rows={[
          [tx(t, "cppRef_v1", "Can be null"), tx(t, "cppRef_no", "no"), tx(t, "cppRef_v1p", "yes (nullptr)")],
          [tx(t, "cppRef_v2", "Can point elsewhere later"), tx(t, "cppRef_no", "no"), tx(t, "cppRef_yes", "yes")],
          [tx(t, "cppRef_v3", "Must be initialised"), tx(t, "cppRef_yes", "yes"), tx(t, "cppRef_v3p", "no (but it should be)")],
          [tx(t, "cppRef_v4", "Syntax at use"), "r", "*p, p->x"],
          [tx(t, "cppRef_v5", "Arithmetic"), tx(t, "cppRef_no", "no"), "p + 1"],
          [tx(t, "cppRef_v6", "Typical use"), tx(t, "cppRef_v6r", "parameters, range-for loops"), tx(t, "cppRef_v6p", "optional links, C APIs, walking raw memory")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "cppRef_dangleWarn",
          "A reference does not keep its variable alive. Returning a reference to a local variable or to a by-value parameter leaves the caller holding a reference to a dead stack frame, as the second program in the figure shows. Return such results by value.")}
      </Callout>

      <H2>{tx(t, "cppRef_overTitle", "Overloading: one name, several functions")}</H2>
      <p>
        {tx(t, "cppRef_overBody",
          "In C++ several functions may share a name as long as their parameter lists differ. This is called overloading. At each call, the compiler looks at the types of the arguments and picks the matching version. C's abs, labs and fabs become one std::abs.")}
      </p>
      <CodeBlock lang="cpp" filename="overload.cpp" t={t}>{`int    area(int w, int h)       { return w * h; }
double area(double w, double h) { return w * h; }
double area(double r)           { return 3.14159265 * r * r; }   // a circle

area(3, 4);       // int version: 12
area(1.5, 2.0);   // double version: 3.0
area(2.0);        // the one-parameter version

// long area(int w, int h);  // error: differs only in the return type`}</CodeBlock>
      <p>
        {tx(t, "cppRef_rankBody",
          "When no version matches exactly, the compiler grades how much converting each candidate would need and picks the cheapest. There are four grades, from best to worst. An exact match: the types already agree. A promotion: a small type widened to its natural big brother, char, short or bool to int, and float to double; nothing can be lost. A conversion: any other change between built-in types, such as int to double, double to int, or a pointer to bool. A user-defined conversion: building an object through one of its constructors, such as std::string from \"text\". If exactly one candidate has the best grade, it wins. If two share it, the call is ambiguous and does not compile.")}
      </p>
      <OverloadFigure t={t} />
      <p>
        {tx(t, "cppRef_rankAfter",
          "The \"hi\" case is the classic trap. A string literal is an array of chars, which turns into a pointer, and any pointer can convert to bool (null or not). That is a built-in conversion, so it beats building a std::string, which needs a constructor. Keep overloads few, with clearly different parameter types, and when in doubt make the argument's type explicit.")}
      </p>

      <H3>{tx(t, "cppRef_defaultTitle", "Default arguments")}</H3>
      <p>
        {tx(t, "cppRef_defaultBody",
          "A parameter can have a default value, used when the call leaves that argument out. Defaults must come last in the list, and are written once, in the declaration (usually the header).")}
      </p>
      <CodeBlock lang="cpp" filename="defaults.cpp" t={t}>{`void draw(const Sprite& s, float scale = 1.0f, bool flipped = false);

draw(hero);              // scale 1, not flipped
draw(hero, 2.0f);        // scale 2, not flipped
draw(hero, 2.0f, true);  // both given
// draw(hero, true);     // compiles, but true becomes the scale 1.0f: a reason to keep defaults simple`}</CodeBlock>

      <H2>{tx(t, "cppRef_nsTitle", "Namespaces: surnames for names")}</H2>
      <p>
        {tx(t, "cppRef_nsBody",
          "A namespace is a named region that groups declarations. Two libraries can both have a function called init if one lives in namespace audio and the other in namespace render. Outside the namespace, you reach a name with the scope operator ::, as in audio::init(). The standard library lives in namespace std, which is why you write std::string.")}
      </p>
      <CodeBlock lang="cpp" filename="physics.h" t={t}>{`namespace game::physics {          // nested: game, then physics inside it
    constexpr float gravity = 9.81f;
    void step(float dt);
}

namespace game::render {
    void step(float dt);           // no clash: a different namespace
}

int main() {
    game::physics::step(1.0f / 60);
    using game::render::step;      // bring one name in, for this scope only
    step(1.0f / 60);               // render's step
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppRef_hForm", "Form"), tx(t, "cppRef_hEffect", "Effect")]}
        rows={[
          ["ns::name", tx(t, "cppRef_n1", "Names one thing from ns. Always clear, never ambiguous.")],
          ["using ns::name;", tx(t, "cppRef_n2", "Lets you write name alone, for that one name, in the current scope.")],
          ["using namespace ns;", tx(t, "cppRef_n3", "Brings in every name of ns. Handy in a small .cpp file, harmful in a header: every file that includes it gets all those names and their clashes.")],
          ["namespace { … }", tx(t, "cppRef_n4", "An unnamed namespace: its contents are private to this .cpp file, the C++ way of writing C's static at file level.")],
          ["::name", tx(t, "cppRef_n5", "The name from the global namespace, outside every namespace.")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "cppRef_mangleNote",
          "Overloads and namespaces are why C++ mangles names, as the chapter From C to C++ showed. The linker only matches plain symbol names, so the compiler folds the namespace and the parameter types into each one: game::physics::step(float) and game::render::step(float) become two different symbols.")}
      </Callout>

      <H2>{tx(t, "cppRef_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cppRef_try1", "Write void clamp_to(int& value, int lo, int hi) that changes value in place, and call it in a loop over a std::vector<int> with for (int& v : values). What happens if you write int v instead of int& v?")}</li>
        <li>{tx(t, "cppRef_try2", "Write print(int) and print(double) and call print(42L). Read the error, then fix the call two ways: with a cast, and with a third overload.")}</li>
        <li>{tx(t, "cppRef_try3", "Put two functions called update in namespaces ai and ui, call both from main, then add using namespace ai; and using namespace ui; and call update() alone. What does the compiler say?")}</li>
      </ol>

      <KeyIdeas t={t} id="cppRef" items={[
        "A reference (T&) is another name for an existing variable: bound once, never null, never re-bound.",
        "Pass small types by value, large ones you only read by const&, ones you change by &, optional ones by pointer.",
        "Never return a reference to a local variable or a by-value parameter.",
        "Overloads share a name; the compiler grades each one (exact, promotion, conversion, user-defined) and needs a single best.",
        "Namespaces group names; reach them with ::, and keep using namespace out of headers.",
      ]} />
    </Article>
  );
}
