"use client";

// C++ track — "Initialization & Value Semantics".

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function ValuesContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp02_intro",
          "C++ has more ways to initialize a variable than any other mainstream language, and they do not all mean the same thing. Getting this wrong gives you a variable holding whatever bytes happened to be on the stack — the classic source of 'it works in debug but not in release'."
        )}
      </p>

      <H2>{tx(t, "cpp02_zooTitle", "The initialization zoo")}</H2>

      <CodeBlock lang="cpp" filename="init.cpp" t={t}>{`int a;          // default-init  → indeterminate value for a local int
int b{};        // value-init    → 0, always
int c = 0;      // copy-init     → 0
int d{0};       // direct-list-init → 0
int e(0);       // direct-init   → 0

std::vector<int> v1;        // empty vector — class types are always constructed
std::vector<int> v2{5};     // ONE element with value 5  (initializer_list wins)
std::vector<int> v3(5);     // FIVE elements with value 0

// Braces reject narrowing; parentheses silently truncate
double pi = 3.14159;
int x1(pi);   // ok — silently becomes 3
int x2{pi};   // COMPILE ERROR — narrowing conversion`}</CodeBlock>

      <LessonTable
        headers={[tx(t, "cpp02_h0", "Form"), tx(t, "cpp02_h1", "Use it when")]}
        rows={[
          ["T x{};",       tx(t, "cpp02_r1", "Default. Zero-initializes scalars, rejects narrowing, never a function declaration.")],
          ["T x{a, b};",   tx(t, "cpp02_r2", "You are giving concrete values and want narrowing to be an error.")],
          ["T x(a, b);",   tx(t, "cpp02_r3", "You need a constructor that competes with an initializer_list overload — vector(5) is the classic case.")],
          ["auto x = ...", tx(t, "cpp02_r4", "The type is obvious from the right-hand side, or unspellable (lambdas, iterators, view pipelines).")],
        ]}
      />

      <Callout type="warn" t={t}>
        {tx(t, "cpp02_vexing",
          "The most vexing parse: Widget w(); does not create a Widget. It declares a function named w that takes nothing and returns a Widget. Braces have no such ambiguity — Widget w{}; always creates an object. This alone is a good reason to make braces your default."
        )}
      </Callout>

      <H2>{tx(t, "cpp02_ebTitle", "C++26 changed what uninitialized means")}</H2>
      <p>
        {tx(t, "cpp02_ebBody",
          "Reading an uninitialized variable used to be undefined behaviour, which allowed the optimizer to delete the surrounding code entirely. C++26 introduces erroneous behaviour: the read is still a bug, but it has a defined, diagnosable outcome instead of a licence to miscompile your program. Compilers can fill the memory with a known pattern and sanitizers can flag it reliably."
        )}
      </p>

      <CodeBlock lang="cpp" filename="erroneous.cpp" t={t}>{`int f() {
    int x;         // C++23: reading x is UB — anything may happen
    return x;      // C++26: erroneous behaviour — diagnosable, not UB
}

int g() {
    int x [[indeterminate]];  // C++26: "I meant it" — opts back into the old rules
    return x;
}`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "cpp02_ebTip",
          "This does not make uninitialized reads correct — it makes them findable. Keep initializing everything; the change exists so your sanitizer build catches the ones you miss."
        )}
      </Callout>

      <H2>{tx(t, "cpp02_constTitle", "const, constexpr, constinit")}</H2>

      <CodeBlock lang="cpp" filename="constness.cpp" t={t}>{`const int   runtimeConst = readConfig();   // set once at runtime, never changes
constexpr int frames    = 60;              // known at compile time, usable in array sizes
constinit  int counter  = 0;               // guaranteed static init, no init-order fiasco

float positions[frames];      // ok — frames is constexpr
// float other[runtimeConst]; // error — not a constant expression`}</CodeBlock>

      <p>
        {tx(t, "cpp02_constBody",
          "Reach for constexpr by default on constants. It guarantees the value is computed at compile time and usable everywhere a constant is required, whereas const only promises the variable will not be modified."
        )}
      </p>

      <H2>{tx(t, "cpp02_autoTitle", "auto and CTAD")}</H2>
      <p>
        {tx(t, "cpp02_autoBody",
          "auto deduces by value and strips references and top-level const, which is exactly what you want most of the time and a subtle bug the rest of the time. Class template argument deduction (CTAD) does the same job for class templates."
        )}
      </p>

      <CodeBlock lang="cpp" filename="deduction.cpp" t={t}>{`std::vector<Mesh> meshes = loadScene();

for (auto  m : meshes) { /* COPIES every Mesh — usually a bug */ }
for (auto& m : meshes) { /* reference — can mutate */ }
for (const auto& m : meshes) { /* read-only, no copy — the default */ }

// CTAD: the template arguments come from the constructor
std::vector v{1, 2, 3};              // std::vector<int>
std::pair  p{1, "hello"};            // std::pair<int, const char*>
std::lock_guard lock{someMutex};     // std::lock_guard<std::mutex>`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "cpp02_autoNote",
          "const auto& in a range-for is the safe default: no copy, no accidental mutation. Use auto&& when you are writing generic code that must also work with views that yield temporaries."
        )}
      </Callout>

    </article>
  );
}
