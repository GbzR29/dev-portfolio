"use client";

// Generic C++ 2: concepts. Starts from the error at the end of Templates (a
// Mesh with no operator< fails deep inside max_of), then a first concept and
// the anatomy of a requires-expression, Shape and Solid (figure: the checklist
// per type, overloads picked by constraint, the error with and without the
// constraint, copied concepts that break subsumption), the four spellings,
// the standard concepts, overloading on constraints, static_assert tests,
// constrained auto, enable_if in old code, and when to write a concept.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { ConceptFigure } from "@/components/lesson/figures/cpp/ConceptFigure";

export function ConceptsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cppCpt_intro",
          "In the last chapter, max_of(m1, m2) with a Mesh failed with an error that pointed inside max_of, at a < b, a line you did not write. The template had a requirement all along, \"T must support <\", but it was never written down: it was hidden in the body, and the compiler only found it while writing the function. A concept writes that requirement into the signature, as a named rule the compiler checks at your call. Templates stop being \"anything, and good luck\" and start saying what they need.")}
      </Lead>

      <Goals t={t} id="cppCpt" items={[
        "Write a concept with a requires-expression and read each kind of requirement.",
        "Constrain a template in each of the four spellings, and pick the clearest one.",
        "Predict which overload wins when several constrained ones match, and why building concepts by name matters.",
        "Use the standard concepts and test your own with static_assert.",
      ]} />

      <H2>{tx(t, "cppCpt_hiddenTitle", "The hidden requirement")}</H2>
      <CodeBlock lang="cpp" filename="before.cpp" t={t}>{`template <typename T>
T max_of(T a, T b) { return a < b ? b : a; }

struct Mesh { int verts; };
max_of(m1, m2);

// error: In instantiation of 'T max_of(T, T) [with T = Mesh]':
//          required from here
// error: no match for 'operator<' (operand types are 'Mesh' and 'Mesh')`}</CodeBlock>
      <p>
        {tx(t, "cppCpt_hiddenAfter",
          "typename T accepts every type. The compiler only discovers that Mesh is wrong after it has substituted it and starts compiling the body. Here the body is one line, so the error is easy to read. In a real library the failing line can be five calls deep, in a header you have never opened.")}
      </p>

      <H2>{tx(t, "cppCpt_firstTitle", "A first concept")}</H2>
      <CodeBlock lang="cpp" filename="after.cpp" t={t}>{`#include <concepts>

template <typename T>
concept LessComparable = requires(const T& a, const T& b) {
    { a < b } -> std::convertible_to<bool>;
};

template <LessComparable T>          // was: template <typename T>
T max_of(T a, T b) { return a < b ? b : a; }

max_of(m1, m2);
// error: no matching function for call to 'max_of(Mesh&, Mesh&)'
//   note: constraints not satisfied
//   note: the required expression '(a < b)' is invalid`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppCpt_hPart", "Part"), tx(t, "cppCpt_hMeans", "What it means")]}
        rows={[
          ["concept LessComparable = …;", tx(t, "cppCpt_a1", "Defines a concept: a named, compile-time yes-or-no question about a type. LessComparable<int> is true, LessComparable<Mesh> is false.")],
          ["requires(const T& a, const T& b)", tx(t, "cppCpt_a2", "A requires-expression. a and b are imaginary: no objects are ever made. They exist only so you can write the expressions T must support.")],
          ["{ a < b } -> std::convertible_to<bool>;", tx(t, "cppCpt_a3", "A requirement: a < b must compile, and its result must convert to bool.")],
          ["template <LessComparable T>", tx(t, "cppCpt_a4", "Uses the concept in place of typename: only types that satisfy it may become T.")],
        ]}
      />
      <p>
        {tx(t, "cppCpt_firstAfter",
          "Now the error is at the call in your file, and it says which promise Mesh broke. Nothing changes for the types that worked: the generated code is identical.")}
      </p>
      <H3>{tx(t, "cppCpt_kindsTitle", "The four kinds of requirement")}</H3>
      <CodeBlock lang="cpp" filename="kinds.cpp" t={t}>{`template <typename T>
concept Pooled = requires(T obj) {
    obj.reset();                                   // 1. simple: must compile
    { obj.id() } -> std::same_as<int>;             // 2. compound: must compile, result checked
    typename T::Handle;                            // 3. type: T::Handle must name a type
    requires sizeof(T) <= 64;                      // 4. nested: a bool that must be true
};`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppCpt_hKind", "Kind"), tx(t, "cppCpt_hChecks", "Checks")]}
        rows={[
          [tx(t, "cppCpt_k1k", "simple"), tx(t, "cppCpt_k1", "Only that the expression compiles. Its result is ignored.")],
          [tx(t, "cppCpt_k2k", "compound"), tx(t, "cppCpt_k2", "That it compiles, and that its result type satisfies the concept after ->. The result type is passed as that concept's first argument: -> std::same_as<int> means std::same_as<result, int>. Add noexcept after the braces to require that it cannot throw.")],
          [tx(t, "cppCpt_k3k", "type"), tx(t, "cppCpt_k3", "That a nested name exists and is a type.")],
          [tx(t, "cppCpt_k4k", "nested"), tx(t, "cppCpt_k4", "That a compile-time condition is true. Without the word requires, sizeof(T) <= 64 would be a simple requirement, which only checks that it compiles, and it always does.")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "cppCpt_nestedWarn",
          "That last point is the classic slip: requires(T x) { sizeof(T) <= 64; } is true for every type, because comparing two numbers always compiles. Inside the braces, only a line that starts with requires checks a value.")}
      </Callout>

      <H2>{tx(t, "cppCpt_shapeTitle", "Shapes and solids")}</H2>
      <CodeBlock lang="cpp" filename="shapes.h" t={t}>{`template <typename T>
concept Shape = requires(const T& s) {
    { s.area() } -> std::convertible_to<double>;
    { s.name() } -> std::convertible_to<std::string>;
};

template <typename T>
concept Solid = Shape<T> && requires(const T& s) {     // a Solid is a Shape, plus volume
    { s.volume() } -> std::convertible_to<double>;
};`}</CodeBlock>
      <p>
        {tx(t, "cppCpt_shapeBody",
          "Concepts combine with && and ||, so Solid is built on top of Shape. Notice what Shape does not say: there is no base class and no virtual function. Any type with those two members is a Shape, whoever wrote it. Check each type below, then see which describe() overload each one gets.")}
      </p>
      <ConceptFigure t={t} />

      <H2>{tx(t, "cppCpt_spellTitle", "Four ways to write the same constraint")}</H2>
      <CodeBlock lang="cpp" filename="spellings.cpp" t={t}>{`template <Shape T> void report(const T& s);                    // 1. in place of typename
template <typename T> requires Shape<T> void report(const T& s);    // 2. requires before
template <typename T> void report(const T& s) requires Shape<T>;    // 3. requires after
void report(const Shape auto& s);                                   // 4. constrained auto`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppCpt_hForm", "Form"), tx(t, "cppCpt_hUse", "Use it when")]}
        rows={[
          ["template <Shape T>", tx(t, "cppCpt_s1", "The usual choice: short, and T has a name you can use in the body.")],
          ["requires Shape<T>", tx(t, "cppCpt_s2", "The condition is a combination: requires std::integral<T> || std::floating_point<T>.")],
          ["… ) requires Shape<T>", tx(t, "cppCpt_s3", "Constraining a member function of a class template on the class's T.")],
          ["const Shape auto&", tx(t, "cppCpt_s4", "A short function where the type needs no name. Each auto is its own type.")],
        ]}
      />

      <H2>{tx(t, "cppCpt_stdTitle", "The standard concepts")}</H2>
      <p>
        {tx(t, "cppCpt_stdBody",
          "<concepts>, <iterator> and <ranges> already define the ones you will need most. Prefer them to your own when they say what you mean.")}
      </p>
      <LessonTable
        headers={[tx(t, "cppCpt_hConcept", "Concept"), tx(t, "cppCpt_hReq", "Requires")]}
        rows={[
          ["std::integral<T>, std::floating_point<T>", tx(t, "cppCpt_r1", "An integer type (int, char, long…), or a floating-point one (float, double).")],
          ["std::same_as<T, U>", tx(t, "cppCpt_r2", "Exactly the same type.")],
          ["std::convertible_to<From, To>", tx(t, "cppCpt_r3", "From converts to To implicitly.")],
          ["std::derived_from<D, B>", tx(t, "cppCpt_r4", "D inherits publicly from B.")],
          ["std::totally_ordered<T>", tx(t, "cppCpt_r5", "<, >, <=, >=, == and != all work and agree: a better LessComparable.")],
          ["std::copyable<T>, std::movable<T>", tx(t, "cppCpt_r6", "Can be copied, or at least moved (the Move chapter).")],
          ["std::invocable<F, Args...>", tx(t, "cppCpt_r7", "F can be called with those arguments: the right constraint for a callback or a lambda.")],
          ["std::ranges::range<R>", tx(t, "cppCpt_r8", "Has begin() and end(): anything a range-for can walk. Accept this instead of a std::vector.")],
          ["std::random_access_iterator<It>", tx(t, "cppCpt_r9", "An iterator that can jump: it += n in one step (vector, array). A list iterator is only bidirectional.")],
        ]}
      />

      <H2>{tx(t, "cppCpt_overTitle", "Overloading on constraints")}</H2>
      <CodeBlock lang="cpp" filename="advance.cpp" t={t}>{`template <std::input_iterator It>
void advance_by(It& it, int n) { while (n--) ++it; }    // works for any iterator

template <std::random_access_iterator It>
void advance_by(It& it, int n) { it += n; }             // a jump, when it can jump

std::list<int>::iterator   li = l.begin();  advance_by(li, 5);   // one step at a time
std::vector<int>::iterator vi = v.begin();  advance_by(vi, 5);   // one jump`}</CodeBlock>
      <p>
        {tx(t, "cppCpt_overBody",
          "For a vector iterator both overloads match. The compiler picks the more constrained one: the one whose constraint includes the other's. std::random_access_iterator is defined as std::bidirectional_iterator plus more, which is defined as std::forward_iterator plus more, and so on down to std::input_iterator, so it wins. This relationship between constraints is called subsumption.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "cppCpt_subsumeWarn",
          "The compiler sees that one concept includes another only through names: Solid mentions Shape<T>, so a Solid is known to be a Shape. If you copy Shape's two lines into Solid instead, the meaning is the same but the link is gone, and a call that both overloads accept becomes ambiguous. That is the break-it switch in the figure. Build bigger concepts from smaller ones by name.")}
      </Callout>

      <H2>{tx(t, "cppCpt_testTitle", "Testing concepts with static_assert")}</H2>
      <CodeBlock lang="cpp" filename="shapes_test.cpp" t={t}>{`static_assert(Shape<Circle>);
static_assert(Solid<Sphere>);
static_assert(!Shape<int>);
static_assert(std::totally_ordered<std::string>);`}</CodeBlock>
      <p>
        {tx(t, "cppCpt_testAfter",
          "A concept used as Shape<Circle> is a bool constant, so static_assert can check it. These are tests that run while compiling: if someone renames Circle::area, the build stops at this line, with a clear message, instead of in a template far away.")}
      </p>

      <H2>{tx(t, "cppCpt_autoTitle", "Constraining a variable")}</H2>
      <CodeBlock lang="cpp" filename="auto_var.cpp" t={t}>{`std::integral auto n = count();                // compiles only if count() returns an integer
std::ranges::range auto items = load_items();  // whatever type it is, it can be iterated`}</CodeBlock>
      <p>
        {tx(t, "cppCpt_autoAfter",
          "auto alone accepts any type. A concept before auto keeps the convenience and still documents, and checks, what the code expects.")}
      </p>

      <H2>{tx(t, "cppCpt_oldTitle", "Before concepts: enable_if")}</H2>
      <CodeBlock lang="cpp" filename="old_style.cpp" t={t}>{`// C++11 to C++17
template <typename T, std::enable_if_t<std::is_integral_v<T>, int> = 0>
T twice(T x) { return x * 2; }

// C++20
template <std::integral T>
T twice(T x) { return x * 2; }`}</CodeBlock>
      <p>
        {tx(t, "cppCpt_oldAfter",
          "You will still meet the first form in older code. It relies on a rule called SFINAE (substitution failure is not an error): when putting T into a template's signature produces something invalid, that template quietly drops out of the candidates instead of causing an error. std::enable_if_t<false, int> is made to be invalid on purpose. It works, but it hides the intent in a trick; concepts say the same thing in plain words.")}
      </p>

      <H2>{tx(t, "cppCpt_whenTitle", "When to write a concept")}</H2>
      <ul className="list-disc pl-6 space-y-2">
        <li>{tx(t, "cppCpt_w1", "Constrain every template that other people call. The concept is documentation the compiler enforces.")}</li>
        <li>{tx(t, "cppCpt_w2", "Require what the body uses, nothing more. A max_of that demands std::copyable rejects types it would have handled fine.")}</li>
        <li>{tx(t, "cppCpt_w3", "Name a concept after what types can do (Drawable, Hashable), not after one class that happens to fit.")}</li>
        <li>{tx(t, "cppCpt_w4", "Look for a standard concept first; write your own when it adds a meaning of your program, like Shape.")}</li>
      </ul>

      <H2>{tx(t, "cppCpt_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cppCpt_try1", "Write a concept Numeric that accepts integers and floating-point types, use it on a function average(const std::vector<T>&), and check with static_assert that std::string is not Numeric.")}</li>
        <li>{tx(t, "cppCpt_try2", "Write the concept Pooled with sizeof(T) <= 64 but without the word requires in front. Test it on a type of 100 bytes and explain the result.")}</li>
        <li>{tx(t, "cppCpt_try3", "Give describe() a fourth overload for a concept Named (only name()). Text now gets it, but the call with a Circle becomes ambiguous. Explain why, then fix it by rewriting Shape as Named<T> && requires { area }.")}</li>
        <li>{tx(t, "cppCpt_try4", "Write a function that takes const std::ranges::range auto& and prints every element. Call it with a vector, a std::array and a std::list.")}</li>
      </ol>

      <KeyIdeas t={t} id="cppCpt" items={[
        "A concept is a named compile-time test on a type; it moves a template's hidden requirements into its signature.",
        "A requires-expression lists what must compile: simple, compound (with a checked result), type and nested requirements.",
        "With a constraint, a wrong type fails at your call with the broken requirement named, instead of deep inside the template.",
        "When several constrained overloads match, the more constrained one wins, which the compiler knows only through concept names.",
        "Prefer the standard concepts (std::integral, std::invocable, std::ranges::range…) and test your own with static_assert.",
        "enable_if and SFINAE do the same job in older code, much less readably.",
      ]} />
    </Article>
  );
}
