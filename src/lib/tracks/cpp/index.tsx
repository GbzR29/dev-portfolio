// src/lib/tracks/cpp/index.tsx
"use client";

import { Track, TrackTranslations } from "@/lib/tracks/types";
import {
  CodeBlock, Callout, H2, LessonTable,
} from "@/components/lesson/LessonComponents";

// tx: returns translated string or English fallback. Never shows a key name.
function tx(t: TrackTranslations, key: string, fallback: string): string {
  const val = t?.[key];
  return val && val.length > 0 ? val : fallback;
}

// ── Chapter 01: The Modern C++ Landscape ─────────────────────────────────────

function LandscapeContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp01_intro",
          "C++ ships a new standard every three years. That cadence means the language you learned five years ago is not the language people write today. This track teaches the C++ that a graphics and game programmer actually writes in 2026: value semantics, RAII, compile-time computation, and the standard library that replaced most of the hand-rolled code of the 2000s."
        )}
      </p>

      <H2>{tx(t, "cpp01_trainTitle", "The three-year release train")}</H2>
      <p>
        {tx(t, "cpp01_trainBody",
          "Since C++11 the committee freezes features on a fixed schedule and ships whatever is ready. A standard being published is not the same as your compiler implementing it — the two are usually two to four years apart for the larger features."
        )}
      </p>

      <LessonTable
        headers={["Standard", "Published", "Headline features"]}
        rows={[
          ["C++11", "2011", tx(t, "cpp01_v11", "Move semantics, lambdas, auto, smart pointers, threads. The break with C++98.")],
          ["C++14", "2014", tx(t, "cpp01_v14", "Generic lambdas, return type deduction, variable templates. A bugfix release.")],
          ["C++17", "2017", tx(t, "cpp01_v17", "Structured bindings, if constexpr, optional / variant / string_view, filesystem.")],
          ["C++20", "2020", tx(t, "cpp01_v20", "Concepts, ranges, modules, coroutines, <format>, the spaceship operator, jthread.")],
          ["C++23", "2024", tx(t, "cpp01_v23", "import std, std::expected, std::print, mdspan, deducing this, flat_map, generator.")],
          ["C++26", "~2026", tx(t, "cpp01_v26", "Reflection, contracts, std::execution, std::simd, inplace_vector, pack indexing.")],
        ]}
      />

      <Callout type="info" t={t}>
        {tx(t, "cpp01_publishNote",
          "The published ISO documents are named after the year they were finalized, not the year in the standard's nickname. C++23 was published as ISO/IEC 14882:2024. C++26 was feature-frozen in 2025 and is heading for publication as ISO/IEC 14882:2026, so parts of it are already shipping behind compiler flags."
        )}
      </Callout>

      <H2>{tx(t, "cpp01_meaningTitle", "What 'modern C++' actually means")}</H2>
      <p>
        {tx(t, "cpp01_meaningBody",
          "Modern C++ is less a list of features than a set of defaults. Almost every rule below exists to move a category of bug from runtime to compile time, or to delete it entirely."
        )}
      </p>

      <ul className="space-y-3 ml-1">
        {[
          [tx(t, "cpp01_rule1t", "Own with types, not comments"), tx(t, "cpp01_rule1b", "Every resource has a destructor that releases it. No manual new/delete, no goto cleanup, no 'remember to call Destroy()'.")],
          [tx(t, "cpp01_rule2t", "Prefer values to indirection"), tx(t, "cpp01_rule2b", "Pass and return by value; let move semantics make it cheap. Pointers are for optional and non-owning, not for 'avoiding a copy'.")],
          [tx(t, "cpp01_rule3t", "Push work to compile time"), tx(t, "cpp01_rule3b", "constexpr, concepts and templates turn logic errors into compile errors and lookup tables into constants baked into the binary.")],
          [tx(t, "cpp01_rule4t", "Use the standard library"), tx(t, "cpp01_rule4b", "It is written by people who read the generated assembly. Hand-rolled containers are a performance decision you must justify with a profiler, not a default.")],
        ].map(([title, body], i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-md bg-[var(--primary)]/10 border border-[var(--primary)]/25 flex items-center justify-center font-mono text-[9px] font-bold text-[var(--primary)] mt-0.5">
              {i + 1}
            </span>
            <span>
              <strong className="text-[var(--text-main)] text-sm">{title}. </strong>
              {body}
            </span>
          </li>
        ))}
      </ul>

      <H2>{tx(t, "cpp01_helloTitle", "Hello, modern world")}</H2>
      <p>
        {tx(t, "cpp01_helloBody",
          "Two versions of the same program, twelve years apart. The C++23 one has no headers, no stream operators, and no manual formatting."
        )}
      </p>

      <CodeBlock lang="cpp" filename="hello_old.cpp" t={t}>{`// C++98 style — still compiles, still taught, still everywhere
#include <iostream>
#include <vector>
#include <string>

int main() {
    std::vector<std::string> names;
    names.push_back("vertex");
    names.push_back("fragment");

    for (size_t i = 0; i < names.size(); ++i) {
        std::cout << i << ": " << names[i] << std::endl;
    }
    return 0;
}`}</CodeBlock>

      <CodeBlock lang="cpp" filename="hello_modern.cpp" t={t}>{`// C++23 — import std replaces every #include of the standard library
import std;

int main() {
    std::vector<std::string> names{"vertex", "fragment"};

    for (auto [i, name] : std::views::enumerate(names)) {
        std::println("{}: {}", i, name);
    }
}`}</CodeBlock>

      <H2>{tx(t, "cpp01_flagsTitle", "Turning the standard on")}</H2>
      <p>
        {tx(t, "cpp01_flagsBody",
          "Compilers still default to an older standard. You must ask for the one you want, and you should ask for warnings while you are at it."
        )}
      </p>

      <CodeBlock lang="bash" filename="flags.sh" t={t}>{`# GCC / Clang
g++   -std=c++23 -Wall -Wextra -Wconversion -O2 main.cpp
clang++ -std=c++23 -Wall -Wextra -Wconversion -O2 main.cpp

# MSVC — /std:c++latest opts into in-progress C++26 features too
cl /std:c++23 /W4 /permissive- /EHsc main.cpp`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "cpp01_supportWarn",
          "Compiler support for the newest features is uneven and moves every few months. Before you build a design on reflection, contracts or modules, check the compiler support tables on cppreference for your exact toolchain version — 'C++26 is done' and 'my compiler does this' are very different statements."
        )}
      </Callout>

      <H2>{tx(t, "cpp01_nextTitle", "What comes next")}</H2>
      <p>
        {tx(t, "cpp01_nextBody",
          "The next chapter starts at the bottom: how a variable comes into existence. Initialization sounds trivial, but it is the single largest source of undefined behaviour in real C++ codebases, and C++26 changed the rules to make it diagnosable."
        )}
      </p>

    </article>
  );
}

// ── Chapter 02: Initialization & Value Semantics ─────────────────────────────

function ValuesContent({ t }: { t: TrackTranslations }) {
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

// ── Chapter 03: Move Semantics ───────────────────────────────────────────────

function MoveContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp03_intro",
          "Move semantics is the feature that made 'return by value' the right default. Before C++11, returning a large container copied every element; now the compiler transfers ownership of the internal buffer and leaves the source empty. Understanding when a move happens — and when it silently does not — is what separates fast C++ from C++ that looks fast."
        )}
      </p>

      <H2>{tx(t, "cpp03_valueTitle", "Value categories in one table")}</H2>
      <LessonTable
        headers={[tx(t, "cpp03_h0", "Category"), tx(t, "cpp03_h1", "Informally"), tx(t, "cpp03_h2", "Example")]}
        rows={[
          ["lvalue", tx(t, "cpp03_lv", "Has a name and an address. You can take &x."), "int x; x, obj.field, *ptr"],
          ["prvalue", tx(t, "cpp03_pr", "A pure temporary that has not materialized yet."), "42, f(), Mesh{}"],
          ["xvalue", tx(t, "cpp03_xv", "A named object you have marked as expiring."), "std::move(x)"],
        ]}
      />

      <H2>{tx(t, "cpp03_moveTitle", "std::move does not move anything")}</H2>
      <p>
        {tx(t, "cpp03_moveBody",
          "std::move is a cast, nothing more. It converts an lvalue into an rvalue reference so that overload resolution picks the move constructor instead of the copy constructor. The actual work happens inside that constructor."
        )}
      </p>

      <CodeBlock lang="cpp" filename="move.cpp" t={t}>{`class Mesh {
    std::vector<float> vertices;
public:
    // Move constructor: steal the buffer, leave the source valid but empty
    Mesh(Mesh&& other) noexcept
        : vertices(std::move(other.vertices)) {}

    Mesh& operator=(Mesh&& other) noexcept {
        vertices = std::move(other.vertices);
        return *this;
    }

    Mesh(const Mesh&)            = default;  // copy still available
    Mesh& operator=(const Mesh&) = default;
    ~Mesh()                      = default;
};

Mesh a = loadMesh("bunny.obj");
Mesh b = std::move(a);   // b steals a's buffer — a is now empty but destructible`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "cpp03_noexceptWarn",
          "Mark move operations noexcept. std::vector will only move its elements when reallocating if the move constructor is noexcept — otherwise it must copy them to keep the strong exception guarantee. A missing noexcept silently turns every vector growth into a deep copy."
        )}
      </Callout>

      <H2>{tx(t, "cpp03_rulesTitle", "The rule of zero, three and five")}</H2>
      <p>
        {tx(t, "cpp03_rulesBody",
          "If your class holds only members that manage themselves (vector, string, unique_ptr), write none of the special member functions — that is the rule of zero, and it is the goal. If you must write a destructor because you own a raw resource, you almost certainly need the other four too."
        )}
      </p>

      <CodeBlock lang="cpp" filename="rule_of_zero.cpp" t={t}>{`// Rule of zero — the compiler generates correct copy AND move for you
struct Model {
    std::string            name;
    std::vector<float>     vertices;
    std::unique_ptr<Texture> texture;   // makes Model move-only, correctly
};

// Rule of five — only when you own a raw resource directly
class GLBuffer {
    unsigned int id = 0;
public:
    GLBuffer()  { glGenBuffers(1, &id); }
    ~GLBuffer() { glDeleteBuffers(1, &id); }

    GLBuffer(const GLBuffer&)            = delete;   // a GPU buffer is not copyable
    GLBuffer& operator=(const GLBuffer&) = delete;

    GLBuffer(GLBuffer&& o) noexcept : id(std::exchange(o.id, 0)) {}
    GLBuffer& operator=(GLBuffer&& o) noexcept {
        if (this != &o) { glDeleteBuffers(1, &id); id = std::exchange(o.id, 0); }
        return *this;
    }
};`}</CodeBlock>

      <H2>{tx(t, "cpp03_fwdTitle", "Forwarding references")}</H2>
      <p>
        {tx(t, "cpp03_fwdBody",
          "In a deduced context, T&& is not an rvalue reference — it is a forwarding reference that binds to anything and remembers whether the caller passed an lvalue or an rvalue. std::forward restores that category when passing it on."
        )}
      </p>

      <CodeBlock lang="cpp" filename="forward.cpp" t={t}>{`template <typename... Args>
Entity& spawn(Args&&... args) {
    // std::forward preserves lvalue-ness / rvalue-ness of each argument
    return entities.emplace_back(std::forward<Args>(args)...);
}

std::string name = "player";
spawn(name);              // name forwarded as an lvalue → copied
spawn(std::move(name));   // forwarded as an rvalue      → moved`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "cpp03_pitfalls",
          "Two pitfalls worth memorizing. First: std::move on a const object silently produces a const rvalue, which binds to the copy constructor — you get a copy with no diagnostic. Second: never use a moved-from object except to assign to it or destroy it; the standard only guarantees it is in a valid but unspecified state."
        )}
      </Callout>

      <H2>{tx(t, "cpp03_rvoTitle", "You usually should not move on return")}</H2>
      <CodeBlock lang="cpp" filename="rvo.cpp" t={t}>{`Mesh build() {
    Mesh m;
    // ... fill m ...
    return m;             // GOOD — NRVO constructs m directly in the caller
    // return std::move(m);  BAD — blocks the elision, forces an actual move
}`}</CodeBlock>

      <p>
        {tx(t, "cpp03_rvoBody",
          "Copy elision means the object is built in the caller's storage to begin with, so there is no copy and no move at all. Writing std::move on a returned local disables that optimization and makes the code slower."
        )}
      </p>

    </article>
  );
}

// ── Chapter 04: RAII & Smart Pointers ────────────────────────────────────────

function RaiiContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp04_intro",
          "RAII — Resource Acquisition Is Initialization — is the single idea that C++ has and most other languages do not. A resource is acquired in a constructor and released in a destructor, so the compiler emits the cleanup for you on every exit path: normal return, early return, break, and thrown exception. There is no finally block because there is nothing to remember."
        )}
      </p>

      <H2>{tx(t, "cpp04_whyTitle", "Why manual cleanup fails")}</H2>

      <CodeBlock lang="cpp" filename="manual.cpp" t={t}>{`void loadLevel(const char* path) {
    FILE*    f    = std::fopen(path, "rb");
    Texture* tex  = new Texture();

    if (!f) return;                 // leaks tex
    if (!parse(f)) { delete tex; return; }   // leaks f
    tex->upload();                  // if this throws, both leak

    std::fclose(f);
    delete tex;
}`}</CodeBlock>

      <CodeBlock lang="cpp" filename="raii.cpp" t={t}>{`void loadLevel(const std::filesystem::path& path) {
    std::ifstream f{path, std::ios::binary};   // closed by ~ifstream
    auto tex = std::make_unique<Texture>();    // deleted by ~unique_ptr

    if (!f)         return;   // both released
    if (!parse(f))  return;   // both released
    tex->upload();            // throws? both still released
}`}</CodeBlock>

      <H2>{tx(t, "cpp04_ownershipTitle", "Choosing the ownership type")}</H2>
      <LessonTable
        headers={[tx(t, "cpp04_h0", "Type"), tx(t, "cpp04_h1", "Meaning"), tx(t, "cpp04_h2", "Cost")]}
        rows={[
          ["T value",           tx(t, "cpp04_r1", "This object owns the data outright. The default."), tx(t, "cpp04_c1", "None")],
          ["std::unique_ptr<T>",tx(t, "cpp04_r2", "Exclusive ownership of a heap object. Move-only."), tx(t, "cpp04_c2", "One pointer, zero overhead")],
          ["std::shared_ptr<T>",tx(t, "cpp04_r3", "Shared ownership, freed when the last owner dies."), tx(t, "cpp04_c3", "Atomic refcount + control block")],
          ["std::weak_ptr<T>",  tx(t, "cpp04_r4", "Observes a shared_ptr without keeping it alive. Breaks cycles."), tx(t, "cpp04_c4", "Must lock() before use")],
          ["T* / T&",           tx(t, "cpp04_r5", "Non-owning observer. Never call delete on it."), tx(t, "cpp04_c5", "None — but no lifetime guarantee")],
        ]}
      />

      <Callout type="info" t={t}>
        {tx(t, "cpp04_rawNote",
          "Raw pointers are not banned in modern C++ — raw OWNING pointers are. A T* parameter that says 'look at this, do not free it' is perfectly idiomatic and costs nothing. The rule is that exactly one type in your program should know how to destroy a given object."
        )}
      </Callout>

      <H2>{tx(t, "cpp04_uniqueTitle", "unique_ptr in practice")}</H2>

      <CodeBlock lang="cpp" filename="unique.cpp" t={t}>{`auto tex = std::make_unique<Texture>("wall.png");   // prefer make_unique over new

// Polymorphism without leaks
std::vector<std::unique_ptr<Renderer>> passes;
passes.push_back(std::make_unique<ShadowPass>());
passes.push_back(std::make_unique<GBufferPass>());
for (auto& pass : passes) pass->execute();

// Transferring ownership is explicit — it cannot happen by accident
void takeOwnership(std::unique_ptr<Texture> t);
takeOwnership(std::move(tex));   // tex is now null

// Observing does not need the smart pointer at all
void draw(const Texture& t);
draw(*tex);`}</CodeBlock>

      <H2>{tx(t, "cpp04_deleterTitle", "Custom deleters wrap C APIs")}</H2>
      <p>
        {tx(t, "cpp04_deleterBody",
          "Graphics and platform libraries are C APIs with Create/Destroy pairs. A unique_ptr with a custom deleter turns any of them into an RAII type in three lines — you will use this constantly with SDL, GLFW, Vulkan and FreeType."
        )}
      </p>

      <CodeBlock lang="cpp" filename="deleter.cpp" t={t}>{`// A stateless deleter costs zero bytes — the unique_ptr is still pointer-sized
struct WindowDeleter {
    void operator()(SDL_Window* w) const noexcept { SDL_DestroyWindow(w); }
};
using WindowPtr = std::unique_ptr<SDL_Window, WindowDeleter>;

WindowPtr window{SDL_CreateWindow("Engine", 1280, 720, 0)};
if (!window) return fail(SDL_GetError());
// SDL_DestroyWindow runs automatically, in the right order, on every path`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "cpp04_lambdaWarn",
          "Do not use a capturing lambda as a unique_ptr deleter unless you have to — the lambda's state is stored inside the unique_ptr and doubles its size. A stateless struct with operator() is empty-base-optimized away to nothing."
        )}
      </Callout>

      <H2>{tx(t, "cpp04_sharedTitle", "shared_ptr and its real cost")}</H2>
      <p>
        {tx(t, "cpp04_sharedBody",
          "shared_ptr is not the safe default — it is the answer to a specific question: who destroys this, when several unrelated systems hold it and none of them outlives the others predictably? Every copy is an atomic increment, and atomics on a hot path are not free."
        )}
      </p>

      <CodeBlock lang="cpp" filename="shared.cpp" t={t}>{`// One texture, referenced by many materials, freed when the last one goes
auto albedo = std::make_shared<Texture>("albedo.png");

struct Material { std::shared_ptr<Texture> albedo; };
Material a{albedo}, b{albedo};   // refcount = 3

// Cycles leak — a weak_ptr breaks them
struct Node {
    std::vector<std::shared_ptr<Node>> children;
    std::weak_ptr<Node> parent;      // NOT shared_ptr, or nothing is ever freed
};

if (auto p = node.parent.lock()) {   // lock() returns shared_ptr or null
    p->markDirty();
}`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "cpp04_gameTip",
          "In game code the common alternative to shared_ptr is a handle: an index plus a generation counter into a central array. It is 8 bytes, trivially copyable, cache-friendly, survives the array reallocating, and lets you detect stale references. Reach for it when you find yourself putting shared_ptr in a hot loop."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 05: Templates ────────────────────────────────────────────────────

function TemplatesContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp05_intro",
          "A template is a recipe the compiler follows to generate code, once per set of types you use it with. That is why templates are fast — there is no indirection at runtime — and why they blow up compile times and error messages. This chapter covers the mechanics; the next one fixes the error messages."
        )}
      </p>

      <H2>{tx(t, "cpp05_basicsTitle", "Function and class templates")}</H2>

      <CodeBlock lang="cpp" filename="templates.cpp" t={t}>{`template <typename T>
T lerp(T a, T b, float k) { return a + (b - a) * k; }

lerp(0.0f, 1.0f, 0.5f);      // T deduced as float
lerp<double>(0, 1, 0.5f);    // T given explicitly

// C++20 abbreviated form — auto in a parameter list creates a template
auto lerp2(auto a, auto b, float k) { return a + (b - a) * k; }

template <typename T, std::size_t N>
class StaticArray {
    T data[N];
public:
    constexpr std::size_t size() const { return N; }
    T&       operator[](std::size_t i)       { return data[i]; }
    const T& operator[](std::size_t i) const { return data[i]; }
};

StaticArray<float, 16> matrix;   // N is a compile-time value`}</CodeBlock>

      <H2>{tx(t, "cpp05_ifTitle", "if constexpr replaces tag dispatch")}</H2>
      <p>
        {tx(t, "cpp05_ifBody",
          "if constexpr discards the branch that is not taken at compile time — the discarded branch is not even required to compile for that type. Before C++17 this needed overloads and helper types."
        )}
      </p>

      <CodeBlock lang="cpp" filename="if_constexpr.cpp" t={t}>{`template <typename T>
void serialize(const T& value, std::vector<std::byte>& out) {
    if constexpr (std::is_trivially_copyable_v<T>) {
        auto bytes = std::bit_cast<std::array<std::byte, sizeof(T)>>(value);
        out.insert(out.end(), bytes.begin(), bytes.end());
    } else if constexpr (requires { value.serialize(out); }) {
        value.serialize(out);
    } else {
        static_assert(false, "type is not serializable");
    }
}`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "cpp05_staticAssertNote",
          "static_assert(false, ...) inside a discarded if constexpr branch only became well-formed in C++23. In older code you will see the workaround static_assert(sizeof(T) == 0) or a dependent_false<T> helper, which exists purely to delay the evaluation until the template is instantiated."
        )}
      </Callout>

      <H2>{tx(t, "cpp05_packsTitle", "Parameter packs and fold expressions")}</H2>

      <CodeBlock lang="cpp" filename="packs.cpp" t={t}>{`// Variadic template — any number of arguments of any types
template <typename... Ts>
void logAll(const Ts&... values) {
    (std::println("{}", values), ...);       // C++17 fold over the comma operator
}

template <typename... Ts>
auto sum(Ts... vs) { return (vs + ...); }    // fold over +

logAll("frame", 42, 1.5f);
sum(1, 2, 3);                                // 6

// C++26 pack indexing — reach into a pack directly, no recursion, no tuple
template <typename... Ts>
using FirstOf = Ts...[0];

template <typename... Ts>
auto firstArg(Ts... vs) { return vs...[0]; }`}</CodeBlock>

      <H2>{tx(t, "cpp05_gotchasTitle", "Two gotchas that cost everyone a day")}</H2>

      <CodeBlock lang="cpp" filename="gotchas.cpp" t={t}>{`template <typename Container>
void process(const Container& c) {
    // 'typename' is required: value_type depends on Container, so the compiler
    // cannot know it is a type until instantiation
    typename Container::value_type first = *c.begin();

    // Same problem for member templates — 'template' disambiguates
    // c.template get<0>();
}

// Templates are defined in headers (or modules). A template definition in a .cpp
// is only instantiated for the types used inside that .cpp — everything else
// fails at link time with "undefined reference".`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "cpp05_compileTip",
          "Template-heavy headers are the number one cause of slow C++ builds, because every translation unit that includes them re-parses and re-instantiates everything. Explicit instantiation in a single .cpp, or C++20 modules, are the two real fixes — precompiled headers only hide the cost."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 06: Concepts ─────────────────────────────────────────────────────

function ConceptsContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp06_intro",
          "Before C++20, a template said nothing about what its type argument had to support. You found out by passing the wrong type and reading four hundred lines of instantiation backtrace. Concepts let you state the requirement up front, so the error points at the call site and says what is missing."
        )}
      </p>

      <H2>{tx(t, "cpp06_beforeTitle", "Before and after")}</H2>

      <CodeBlock lang="cpp" filename="before_after.cpp" t={t}>{`// C++17: the requirement is implicit, the error is a backtrace
template <typename T>
T maxOf(T a, T b) { return a < b ? b : a; }

// C++20: the requirement is part of the signature
template <std::totally_ordered T>
T maxOf(T a, T b) { return a < b ? b : a; }

// error: constraints not satisfied
//   note: 'Mesh' does not satisfy 'totally_ordered'
//   note: the required expression 'a < b' is invalid`}</CodeBlock>

      <H2>{tx(t, "cpp06_writingTitle", "Writing a concept")}</H2>

      <CodeBlock lang="cpp" filename="concepts.cpp" t={t}>{`template <typename T>
concept Drawable = requires(const T& obj, Renderer& r) {
    { obj.bounds() } -> std::convertible_to<AABB>;   // must exist, must convert
    { obj.draw(r) }  -> std::same_as<void>;
    typename T::VertexType;                          // must have this nested type
    requires std::is_move_constructible_v<T>;        // nested boolean requirement
};

template <typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

// Four equivalent ways to apply it
template <Drawable T> void render(const T&);
template <typename T> requires Drawable<T> void render2(const T&);
template <typename T> void render3(const T&) requires Drawable<T>;
void render4(const Drawable auto&);              // terse — usually the nicest`}</CodeBlock>

      <H2>{tx(t, "cpp06_stdTitle", "The standard concepts you will actually use")}</H2>
      <LessonTable
        headers={[tx(t, "cpp06_h0", "Concept"), tx(t, "cpp06_h1", "Requires")]}
        rows={[
          ["std::integral / std::floating_point", tx(t, "cpp06_r1", "An integer or floating-point type. Replaces most enable_if on arithmetic.")],
          ["std::same_as<T, U>",                  tx(t, "cpp06_r2", "Exactly the same type, both directions.")],
          ["std::convertible_to<From, To>",       tx(t, "cpp06_r3", "Implicit conversion is valid.")],
          ["std::derived_from<D, B>",             tx(t, "cpp06_r4", "Public, unambiguous inheritance.")],
          ["std::invocable<F, Args...>",          tx(t, "cpp06_r5", "Callable with those arguments. The right constraint for callbacks.")],
          ["std::ranges::range",                  tx(t, "cpp06_r6", "Has begin() and end(). Use this instead of taking a vector.")],
        ]}
      />

      <H2>{tx(t, "cpp06_overloadTitle", "Overloading on constraints")}</H2>
      <p>
        {tx(t, "cpp06_overloadBody",
          "When two overloads both match, the more constrained one wins — this is called subsumption, and it replaces the tag-dispatch and enable_if tricks used to pick a specialized implementation."
        )}
      </p>

      <CodeBlock lang="cpp" filename="subsumption.cpp" t={t}>{`template <std::input_iterator It>
void advanceBy(It& it, int n) { while (n--) ++it; }          // generic

template <std::random_access_iterator It>
void advanceBy(It& it, int n) { it += n; }                   // more constrained → wins

std::list<int>::iterator   li;  advanceBy(li, 5);   // picks the loop
std::vector<int>::iterator vi;  advanceBy(vi, 5);   // picks +=`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "cpp06_apiTip",
          "Concepts are documentation the compiler enforces. Even if you never overload on them, constraining a public template with a concept turns 'read the header comment and hope' into a checked contract — and shrinks the error message from pages to three lines."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 07: Compile-Time C++ ─────────────────────────────────────────────

function ConstexprContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp07_intro",
          "Every cycle you spend at compile time is a cycle you do not spend at 16.6 milliseconds per frame. Modern constexpr is close to a full interpreter for C++ running inside the compiler: loops, allocations, containers, and in C++26 even exceptions."
        )}
      </p>

      <H2>{tx(t, "cpp07_keywordsTitle", "constexpr, consteval, constinit")}</H2>
      <LessonTable
        headers={[tx(t, "cpp07_h0", "Keyword"), tx(t, "cpp07_h1", "Guarantees")]}
        rows={[
          ["constexpr", tx(t, "cpp07_r1", "MAY run at compile time. Falls back to runtime if the arguments are not constant.")],
          ["consteval", tx(t, "cpp07_r2", "MUST run at compile time. Calling it with a runtime value is a compile error.")],
          ["constinit", tx(t, "cpp07_r3", "Initialized at compile time, but mutable afterwards. Kills the static init order fiasco.")],
          ["if consteval", tx(t, "cpp07_r4", "Branch on whether this call is currently being evaluated at compile time (C++23).")],
        ]}
      />

      <CodeBlock lang="cpp" filename="constexpr.cpp" t={t}>{`constexpr int factorial(int n) {
    int r = 1;
    for (int i = 2; i <= n; ++i) r *= i;   // loops are fine
    return r;
}

constexpr int a = factorial(10);   // computed by the compiler, baked into the binary
int n = readInput();
int b = factorial(n);              // same function, runs at runtime

consteval int mustBeCompileTime(int x) { return x * 2; }
constexpr int c = mustBeCompileTime(21);   // ok
// int d = mustBeCompileTime(n);            // ERROR — n is not a constant`}</CodeBlock>

      <H2>{tx(t, "cpp07_tablesTitle", "Baking lookup tables into the binary")}</H2>
      <p>
        {tx(t, "cpp07_tablesBody",
          "This is the pattern that pays off in graphics code: generate the table with real C++ instead of a Python script that writes a header, and the result is a plain array of constants in the read-only data section."
        )}
      </p>

      <CodeBlock lang="cpp" filename="lut.cpp" t={t}>{`consteval std::array<float, 256> makeSinTable() {
    std::array<float, 256> table{};
    for (std::size_t i = 0; i < table.size(); ++i) {
        // std::sin is not constexpr — a Taylor series or CORDIC is
        table[i] = approxSin(2.0f * std::numbers::pi_v<float> * float(i) / 256.0f);
    }
    return table;
}

constexpr auto SIN_LUT = makeSinTable();   // zero runtime cost, zero build script

// C++20 lets you allocate during constant evaluation, as long as nothing escapes
constexpr std::size_t countPrimes(int limit) {
    std::vector<bool> sieve(limit + 1, true);     // heap alloc at compile time
    std::size_t count = 0;
    for (int i = 2; i <= limit; ++i)
        if (sieve[i]) { ++count; for (int j = i * i; j <= limit; j += i) sieve[j] = false; }
    return count;
}
static_assert(countPrimes(100) == 25);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "cpp07_allocWarn",
          "Memory allocated during constant evaluation must be freed during constant evaluation — you cannot return a constexpr std::vector into runtime. That is why the sieve above returns a count and the LUT returns a std::array, which has no allocation."
        )}
      </Callout>

      <H2>{tx(t, "cpp07_26Title", "What C++26 adds")}</H2>
      <p>
        {tx(t, "cpp07_26Body",
          "Two changes make constexpr code look much more like ordinary code: exceptions can now be thrown and caught during constant evaluation, and static_assert can build its message at compile time instead of requiring a string literal."
        )}
      </p>

      <CodeBlock lang="cpp" filename="cpp26_constexpr.cpp" t={t}>{`// C++26: throwing inside constant evaluation is allowed
constexpr int checkedDiv(int a, int b) {
    if (b == 0) throw std::logic_error("division by zero");
    return a / b;
}
constexpr int ok = checkedDiv(10, 2);
// constexpr int bad = checkedDiv(10, 0);  // compile error, with your message

// C++26: static_assert messages can be computed
template <typename T>
struct Check {
    static_assert(sizeof(T) <= 64,
        std::format("{} is {} bytes — too large for the component pool",
                    typeName<T>(), sizeof(T)));
};`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "cpp07_costTip",
          "Compile-time work is not free — it is paid by every build instead of every frame. A constexpr sieve to a million will make your build noticeably slower. Use it for tables measured in kilobytes, not megabytes, and check the impact with -ftime-trace on Clang."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 08: Ranges & Views ───────────────────────────────────────────────

function RangesContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp08_intro",
          "The C++98 algorithms took two iterators, which meant every call started with begin() and end() and no two calls could be chained. Ranges take the container itself and compose with the pipe operator, so a five-line loop becomes one readable expression that still compiles down to a loop."
        )}
      </p>

      <H2>{tx(t, "cpp08_algosTitle", "Range algorithms")}</H2>

      <CodeBlock lang="cpp" filename="ranges_algos.cpp" t={t}>{`std::vector<Entity> entities = loadScene();

std::ranges::sort(entities, {}, &Entity::depth);   // sort by a member — no lambda
auto it = std::ranges::find(entities, 42, &Entity::id);
bool any = std::ranges::any_of(entities, &Entity::visible);

// The third parameter is a "projection": what to look at for each element.
// It replaces the comparator lambda you used to write by hand.`}</CodeBlock>

      <H2>{tx(t, "cpp08_viewsTitle", "Views are lazy pipelines")}</H2>
      <p>
        {tx(t, "cpp08_viewsBody",
          "A view does not own or copy anything and does no work until you iterate it. Chaining ten views still walks the source exactly once."
        )}
      </p>

      <CodeBlock lang="cpp" filename="views.cpp" t={t}>{`namespace rv = std::views;

// The imperative version
std::vector<std::string> names;
for (const auto& e : entities) {
    if (!e.visible) continue;
    if (e.distance > 100.0f) continue;
    names.push_back(e.name);
    if (names.size() == 10) break;
}

// The same thing as a pipeline
auto visible = entities
    | rv::filter([](const Entity& e) { return e.visible; })
    | rv::filter([](const Entity& e) { return e.distance <= 100.0f; })
    | rv::transform(&Entity::name)
    | rv::take(10);

for (const auto& name : visible) { /* nothing has been evaluated until here */ }

// C++23: materialize a view back into a container
auto names2 = visible | std::ranges::to<std::vector>();`}</CodeBlock>

      <H2>{tx(t, "cpp08_catalogTitle", "The views worth memorizing")}</H2>
      <LessonTable
        headers={[tx(t, "cpp08_h0", "View"), tx(t, "cpp08_h1", "Does"), tx(t, "cpp08_h2", "Since")]}
        rows={[
          ["filter / transform", tx(t, "cpp08_r1", "Keep matching elements / map each element."), "C++20"],
          ["take / drop",        tx(t, "cpp08_r2", "First N / everything after the first N."), "C++20"],
          ["reverse",            tx(t, "cpp08_r3", "Iterate backwards without a reverse iterator."), "C++20"],
          ["iota",               tx(t, "cpp08_r4", "A lazy sequence of numbers — replaces the index for-loop."), "C++20"],
          ["enumerate",          tx(t, "cpp08_r5", "Yields (index, element) pairs. What everyone wanted from day one."), "C++23"],
          ["zip",                tx(t, "cpp08_r6", "Walks several ranges in lockstep as tuples."), "C++23"],
          ["chunk / slide",      tx(t, "cpp08_r7", "Fixed-size blocks / sliding window. Great for mesh triangles."), "C++23"],
          ["join_with",          tx(t, "cpp08_r8", "Flattens a range of ranges with a separator."), "C++23"],
        ]}
      />

      <CodeBlock lang="cpp" filename="views23.cpp" t={t}>{`// enumerate — index and value together
for (auto [i, v] : std::views::enumerate(vertices))
    std::println("v{} = {}", i, v);

// zip — parallel arrays, walked safely to the shorter length
for (auto [pos, vel] : std::views::zip(positions, velocities))
    pos += vel * dt;

// chunk — treat a flat float buffer as triangles
for (auto tri : mesh.indices | std::views::chunk(3))
    drawTriangle(tri[0], tri[1], tri[2]);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "cpp08_dangleWarn",
          "A view refers to its source. If the source is a temporary, the view dangles — auto v = getVector() | views::filter(f); is a use-after-free waiting to happen. The library catches many of these cases at compile time through borrowed_range, but not all of them. Keep the owning container alive for as long as the view."
        )}
      </Callout>

      <Callout type="tip" t={t}>
        {tx(t, "cpp08_perfTip",
          "Views optimize well at -O2 but are dramatically slower in unoptimized debug builds, because every stage is a separate iterator adaptor that the inliner has not collapsed yet. If your debug frame rate matters, keep the innermost per-frame loops plain and use views for setup and tooling code."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 09: Error Handling ───────────────────────────────────────────────

function ErrorsContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp09_intro",
          "C++ has three error-handling mechanisms and a long-running argument about which to use. Game engines commonly build with exceptions disabled; the standard library assumes they are on. C++23 added std::expected, which finally gives the 'errors are values' camp a vocabulary type instead of everyone inventing their own Result."
        )}
      </p>

      <H2>{tx(t, "cpp09_optionalTitle", "optional — absence is not an error")}</H2>

      <CodeBlock lang="cpp" filename="optional.cpp" t={t}>{`std::optional<Entity> findByName(std::string_view name);

if (auto e = findByName("player")) {
    e->update(dt);              // operator-> on the optional
}

// Monadic chaining (C++23) — no nested ifs
auto hp = findByName("player")
    .transform(&Entity::health)          // optional<Entity> → optional<int>
    .value_or(0);`}</CodeBlock>

      <H2>{tx(t, "cpp09_expectedTitle", "expected — an error with a reason")}</H2>
      <p>
        {tx(t, "cpp09_expectedBody",
          "std::expected<T, E> holds either a value or an error. It is the return type for operations that fail for knowable reasons: file missing, shader failed to compile, socket refused. The caller cannot ignore the failure, because getting to the value requires acknowledging it."
        )}
      </p>

      <CodeBlock lang="cpp" filename="expected.cpp" t={t}>{`enum class ShaderError { FileNotFound, CompileFailed, LinkFailed };

std::expected<Shader, ShaderError> loadShader(const std::filesystem::path& p) {
    auto src = readFile(p);
    if (!src) return std::unexpected(ShaderError::FileNotFound);

    Shader s;
    if (!s.compile(*src)) return std::unexpected(ShaderError::CompileFailed);
    return s;                       // implicit conversion into the expected
}

// Explicit handling
if (auto shader = loadShader("pbr.glsl")) {
    useShader(*shader);
} else {
    std::println("shader failed: {}", std::to_underlying(shader.error()));
}

// Or chain — and_then short-circuits on the first error
auto pipeline = loadShader("pbr.glsl")
    .and_then(linkProgram)
    .transform(buildPipeline)
    .or_else(useFallbackPipeline);`}</CodeBlock>

      <H2>{tx(t, "cpp09_excTitle", "Exceptions and their cost model")}</H2>
      <p>
        {tx(t, "cpp09_excBody",
          "Modern implementations use table-driven unwinding: an untaken throw costs literally nothing at runtime, but the tables inflate binary size and a thrown exception is very slow — microseconds, not nanoseconds. That is the whole argument. Exceptions are correct for genuinely exceptional failures and wrong for control flow."
        )}
      </p>

      <LessonTable
        headers={[tx(t, "cpp09_h0", "Situation"), tx(t, "cpp09_h1", "Use")]}
        rows={[
          [tx(t, "cpp09_s1", "The value may legitimately be absent"),            "std::optional<T>"],
          [tx(t, "cpp09_s2", "The operation failed and the caller must react"),  "std::expected<T, E>"],
          [tx(t, "cpp09_s3", "Constructor failure — there is no return value"),  tx(t, "cpp09_u3", "throw, or a static factory returning expected")],
          [tx(t, "cpp09_s4", "A programming bug, not a runtime condition"),      tx(t, "cpp09_u4", "assert / contracts — crash loudly in debug")],
          [tx(t, "cpp09_s5", "Out of memory, unrecoverable state"),              tx(t, "cpp09_u5", "throw, or terminate")],
        ]}
      />

      <Callout type="warn" t={t}>
        {tx(t, "cpp09_noexcWarn",
          "If you build with -fno-exceptions, remember that the standard library still throws — vector::at, std::stoi, and every allocation on failure. With exceptions disabled those calls abort the process instead. Either accept that, or avoid the throwing subset entirely."
        )}
      </Callout>

      <H2>{tx(t, "cpp09_contractsTitle", "Contracts (C++26)")}</H2>
      <p>
        {tx(t, "cpp09_contractsBody",
          "Contracts move preconditions from a comment into the signature, where the compiler can check them and tooling can read them. They target bugs, not runtime failures — a violated precondition means the calling code is wrong."
        )}
      </p>

      <CodeBlock lang="cpp" filename="contracts.cpp" t={t}>{`// C++26 — checked according to the build's contract evaluation mode
float lerp(float a, float b, float k)
    pre(k >= 0.0f && k <= 1.0f)          // precondition on the caller
    post(r: r >= std::min(a, b))         // postcondition, r names the result
{
    contract_assert(std::isfinite(a));   // assertion inside the body
    return a + (b - a) * k;
}`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "cpp09_contractsNote",
          "Contracts are one of the newest C++26 features and the one most likely to still be behind an experimental flag in your compiler. Treat the syntax above as the shape of the feature and check your toolchain's release notes before relying on it in production code."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 10: Vocabulary Types ─────────────────────────────────────────────

function VocabularyContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp10_intro",
          "Vocabulary types exist so that two libraries which have never heard of each other can still agree on what 'a string I do not own' or 'maybe a value' looks like. Using them at your API boundaries is what makes code composable."
        )}
      </p>

      <H2>{tx(t, "cpp10_svTitle", "string_view and span — borrowed data")}</H2>
      <p>
        {tx(t, "cpp10_svBody",
          "Both are a pointer and a length. Neither owns anything. They exist so a function can accept any contiguous sequence without templating on the container or forcing a copy."
        )}
      </p>

      <CodeBlock lang="cpp" filename="views_types.cpp" t={t}>{`// Before: three overloads, or a const std::string& that forces allocations
void setName(const char*);
void setName(const std::string&);

// After: one function, no copies, works with all of them
void setName(std::string_view name);

setName("literal");                   // no allocation
setName(someStdString);               // no copy
setName(std::string_view{buf, len});  // a slice of a buffer

// span does the same for arrays of anything
void uploadVertices(std::span<const float> data);

float raw[300];
std::vector<float> vec;
std::array<float, 16> arr;
uploadVertices(raw);   uploadVertices(vec);   uploadVertices(arr);

// A subrange without copying
uploadVertices(std::span{vec}.subspan(100, 50));`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "cpp10_dangleWarn",
          "Never store a string_view or span in a member and outlive the source. The classic bug: std::string_view sv = getString(); — the temporary string dies at the end of the statement and sv points at freed memory. Use them as parameter types and local variables; use std::string or std::vector when you need to own."
        )}
      </Callout>

      <H2>{tx(t, "cpp10_variantTitle", "variant — a type-safe union")}</H2>

      <CodeBlock lang="cpp" filename="variant.cpp" t={t}>{`using UniformValue = std::variant<float, int, glm::vec3, glm::mat4>;

void setUniform(int loc, const UniformValue& v) {
    std::visit([loc](const auto& value) {
        using T = std::decay_t<decltype(value)>;
        if      constexpr (std::is_same_v<T, float>)     glUniform1f(loc, value);
        else if constexpr (std::is_same_v<T, int>)       glUniform1i(loc, value);
        else if constexpr (std::is_same_v<T, glm::vec3>) glUniform3fv(loc, 1, &value[0]);
        else                                             glUniformMatrix4fv(loc, 1, false, &value[0][0]);
    }, v);
}

// The compiler enforces that every alternative is handled — add a type to the
// variant and this fails to compile until you handle it.`}</CodeBlock>

      <H2>{tx(t, "cpp10_bindingsTitle", "Structured bindings")}</H2>

      <CodeBlock lang="cpp" filename="bindings.cpp" t={t}>{`auto [x, y, z] = getPosition();                    // decompose a struct or tuple

for (const auto& [name, mesh] : meshesByName)      // map iteration, finally readable
    std::println("{}: {} tris", name, mesh.triangleCount());

if (auto [it, inserted] = cache.try_emplace(key, value); inserted)
    std::println("cached {}", key);                // C++17 if-with-initializer

// C++26 — _ is a real placeholder, reusable and never "unused variable"
auto [value, _] = compute();
auto [_, error] = other();`}</CodeBlock>

      <H2>{tx(t, "cpp10_printTitle", "print and format")}</H2>

      <CodeBlock lang="cpp" filename="format.cpp" t={t}>{`std::println("frame {} took {:.2f} ms", frame, ms);    // C++23, no iostream
std::string s = std::format("{:>8}|{:<8}", "right", "left");  // C++20

// Make your own type formattable
template <>
struct std::formatter<glm::vec3> : std::formatter<std::string> {
    auto format(const glm::vec3& v, auto& ctx) const {
        return std::formatter<std::string>::format(
            std::format("({:.2f}, {:.2f}, {:.2f})", v.x, v.y, v.z), ctx);
    }
};

std::println("camera at {}", cameraPos);   // now works`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "cpp10_formatTip",
          "std::format checks the format string against the argument types at compile time, so a mismatched {} is a compile error rather than the silent corruption printf gives you. It is also considerably faster than iostreams because there is no locale-heavy stream state to touch."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 11: Modules ──────────────────────────────────────────────────────

function ModulesContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp11_intro",
          "The #include model is textual: the preprocessor pastes the entire header into every file that includes it, and the compiler parses it again every single time. A project including <vector> in a hundred files parses <vector> a hundred times. Modules replace that with a compiled artifact that is parsed once."
        )}
      </p>

      <H2>{tx(t, "cpp11_problemTitle", "What headers actually cost")}</H2>
      <ul className="space-y-3 ml-1">
        {[
          [tx(t, "cpp11_p1t", "Quadratic parsing"), tx(t, "cpp11_p1b", "N source files including M headers parse N×M times. This is the bulk of a typical C++ build.")],
          [tx(t, "cpp11_p2t", "Macro leakage"), tx(t, "cpp11_p2b", "A header that defines min/max or includes <windows.h> changes the meaning of code included after it.")],
          [tx(t, "cpp11_p3t", "Order dependence"), tx(t, "cpp11_p3b", "Include order matters, which is why you see include-what-you-use tooling and unity build hacks.")],
          [tx(t, "cpp11_p4t", "No encapsulation"), tx(t, "cpp11_p4b", "Everything in a header is public. Private helpers leak into every consumer's namespace.")],
        ].map(([title, body], i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-md bg-red-500/10 border border-red-500/25 flex items-center justify-center font-mono text-[9px] font-bold text-red-400 mt-0.5">
              {i + 1}
            </span>
            <span>
              <strong className="text-[var(--text-main)] text-sm">{title}. </strong>
              {body}
            </span>
          </li>
        ))}
      </ul>

      <H2>{tx(t, "cpp11_writingTitle", "Writing a module")}</H2>

      <CodeBlock lang="cpp" filename="renderer.cppm" t={t}>{`export module engine.renderer;

import std;
import engine.math;          // your own modules

// Not exported — invisible to importers, but usable inside this module
namespace {
    void validatePipeline(const Pipeline& p);
}

export class Renderer {
public:
    void draw(std::span<const Mesh> meshes);
private:
    Pipeline pipeline;      // private members stay private, as always
};

export void initRenderer();   // export individual entities...

export {                      // ...or a whole block
    struct DrawCall { std::uint32_t mesh, material; };
    void submit(DrawCall);
}`}</CodeBlock>

      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`import std;                // the entire standard library as one module (C++23)
import engine.renderer;

int main() {
    initRenderer();
    Renderer r;
    // validatePipeline(...);  // ERROR — not exported, does not exist here
    std::println("ready");
}`}</CodeBlock>

      <H2>{tx(t, "cpp11_partitionsTitle", "Partitions keep large modules readable")}</H2>

      <CodeBlock lang="cpp" filename="partitions.cppm" t={t}>{`// engine.renderer:passes  — an implementation detail of the module
module engine.renderer:passes;
struct ShadowPass { /* ... */ };

// The primary module interface stitches partitions together
export module engine.renderer;
export import :passes;      // re-export this partition to importers
import :internal;           // use it, but do not expose it`}</CodeBlock>

      <H2>{tx(t, "cpp11_realityTitle", "The reality check")}</H2>
      <p>
        {tx(t, "cpp11_realityBody",
          "The language feature is finished; the ecosystem is the bottleneck. Modules require the build system to discover which module each file provides and depends on before compiling anything, which is a genuinely new kind of dependency scanning. CMake supports it with recent Ninja and MSVC generators, but many third-party libraries still ship headers only."
        )}
      </p>

      <LessonTable
        headers={[tx(t, "cpp11_h0", "Situation"), tx(t, "cpp11_h1", "Practical advice")]}
        rows={[
          [tx(t, "cpp11_s1", "New project, one recent toolchain"),   tx(t, "cpp11_a1", "Use modules. The build-time win is real and you have no legacy to migrate.")],
          [tx(t, "cpp11_s2", "Existing codebase with many headers"), tx(t, "cpp11_a2", "Do not rewrite. Add modules at the leaves, or start with import std; alone.")],
          [tx(t, "cpp11_s3", "You must support several compilers"),  tx(t, "cpp11_a3", "Stay on headers. Reduce cost with forward declarations, PIMPL and precompiled headers.")],
          [tx(t, "cpp11_s4", "Header-only library you publish"),     tx(t, "cpp11_a4", "Keep the headers; optionally ship a module wrapper alongside them.")],
        ]}
      />

      <Callout type="tip" t={t}>
        {tx(t, "cpp11_stdTip",
          "import std; is the cheapest possible entry point. It touches no design decisions, works even in a header-based project, and on a large translation unit it can cut compile time substantially compared with a dozen standard includes. Try it first before migrating anything of your own."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 12: Concurrency ──────────────────────────────────────────────────

function ConcurrencyContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp12_intro",
          "A modern game runs on eight to sixteen cores and a rendering thread that must not stall. C++ gives you portable threads, but the interesting part is not starting a thread — it is the memory model that says when one thread is allowed to see another thread's writes."
        )}
      </p>

      <H2>{tx(t, "cpp12_jthreadTitle", "jthread — the one you should use")}</H2>

      <CodeBlock lang="cpp" filename="jthread.cpp" t={t}>{`// std::thread: you MUST join or detach before the destructor, or terminate() fires
std::thread t{work};
t.join();

// std::jthread (C++20): joins in its destructor and supports cooperative cancellation
std::jthread worker{[](std::stop_token stop) {
    while (!stop.stop_requested()) {
        processJob();
    }
}};
// destructor calls request_stop() then join() — no leak, no terminate`}</CodeBlock>

      <H2>{tx(t, "cpp12_syncTitle", "Synchronization primitives")}</H2>
      <LessonTable
        headers={[tx(t, "cpp12_h0", "Tool"), tx(t, "cpp12_h1", "Use for")]}
        rows={[
          ["std::scoped_lock",       tx(t, "cpp12_r1", "Locking one or more mutexes at once, deadlock-free. The default.")],
          ["std::shared_mutex",      tx(t, "cpp12_r2", "Many readers, one writer. Worth it only when reads dominate heavily.")],
          ["std::atomic<T>",         tx(t, "cpp12_r3", "A single value shared without a mutex — counters, flags, indices.")],
          ["std::latch / barrier",   tx(t, "cpp12_r4", "Wait for N tasks to finish. barrier is reusable per frame, latch is one-shot.")],
          ["std::counting_semaphore",tx(t, "cpp12_r5", "Bounding concurrent access to a limited resource.")],
          ["std::condition_variable",tx(t, "cpp12_r6", "A worker sleeping until there is a job. Always wait with a predicate.")],
        ]}
      />

      <CodeBlock lang="cpp" filename="jobsystem.cpp" t={t}>{`class JobSystem {
    std::vector<std::jthread>         workers;
    std::queue<std::function<void()>> jobs;
    std::mutex                        m;
    std::condition_variable_any       cv;

public:
    explicit JobSystem(unsigned n = std::thread::hardware_concurrency()) {
        for (unsigned i = 0; i < n; ++i)
            workers.emplace_back([this](std::stop_token stop) { run(stop); });
    }

    void submit(std::function<void()> job) {
        { std::scoped_lock lock{m}; jobs.push(std::move(job)); }
        cv.notify_one();
    }

private:
    void run(std::stop_token stop) {
        while (!stop.stop_requested()) {
            std::unique_lock lock{m};
            cv.wait(lock, stop, [this] { return !jobs.empty(); });
            if (jobs.empty()) return;
            auto job = std::move(jobs.front());
            jobs.pop();
            lock.unlock();
            job();
        }
    }
};`}</CodeBlock>

      <H2>{tx(t, "cpp12_atomicTitle", "Atomics and memory order")}</H2>
      <p>
        {tx(t, "cpp12_atomicBody",
          "An atomic operation is indivisible, but it also constrains how the compiler and CPU may reorder the operations around it. The default, seq_cst, is the strongest and slowest; relaxed gives you atomicity with no ordering guarantee at all."
        )}
      </p>

      <CodeBlock lang="cpp" filename="atomics.cpp" t={t}>{`std::atomic<int>  frameCounter{0};
std::atomic<bool> ready{false};

frameCounter.fetch_add(1, std::memory_order_relaxed);   // just a counter, no ordering

// Release/acquire: everything written before the release is visible after the acquire
data = buildFrame();                                    // plain write
ready.store(true, std::memory_order_release);           // publish

if (ready.load(std::memory_order_acquire))              // consume
    use(data);                                          // guaranteed to see buildFrame()`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "cpp12_relaxedWarn",
          "Use the default memory_order_seq_cst until a profiler proves it is your bottleneck. Relaxed and acquire/release code that looks obviously correct is regularly wrong in ways that only appear on a different CPU architecture, months later, in a customer's crash log. Verify with ThreadSanitizer, not by reading."
        )}
      </Callout>

      <H2>{tx(t, "cpp12_sharingTitle", "False sharing")}</H2>

      <CodeBlock lang="cpp" filename="false_sharing.cpp" t={t}>{`// Two counters on the same cache line: every write by thread A invalidates
// thread B's cache line. Correct, and catastrophically slow.
struct Bad  { std::atomic<int> a; std::atomic<int> b; };

struct Good {
    alignas(std::hardware_destructive_interference_size) std::atomic<int> a;
    alignas(std::hardware_destructive_interference_size) std::atomic<int> b;
};`}</CodeBlock>

      <H2>{tx(t, "cpp12_execTitle", "std::execution (C++26)")}</H2>
      <p>
        {tx(t, "cpp12_execBody",
          "C++26 standardizes senders and receivers: a composable model for asynchronous work where you describe a graph of operations and then run it on a chosen scheduler — a thread pool, a GPU stream, an event loop. It is the foundation the standard needed before it could offer real async algorithms."
        )}
      </p>

      <CodeBlock lang="cpp" filename="senders.cpp" t={t}>{`namespace ex = std::execution;

ex::scheduler auto sched = pool.get_scheduler();

// Describe the work — nothing runs yet
ex::sender auto work =
      ex::schedule(sched)
    | ex::then([]      { return loadMesh("bunny.obj"); })
    | ex::then([](Mesh m) { return buildBVH(std::move(m)); });

// Then run it
auto [bvh] = std::this_thread::sync_wait(std::move(work)).value();`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "cpp12_execNote",
          "std::execution is large and brand new. Reference implementations exist (stdexec is the one most people use today) but standard library support is still landing. Learn the model now — sender, scheduler, receiver — because the async story in C++ is going to be built on it for the next decade."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 13: Performance & Data-Oriented Design ───────────────────────────

function PerformanceContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp13_intro",
          "At 60 frames per second you have 16.6 milliseconds for everything. On modern hardware the limiting factor is almost never arithmetic — it is waiting for memory. A cache miss costs a few hundred cycles, enough time to have done a hundred multiplications. Data-oriented design is the practice of laying out data so those misses do not happen."
        )}
      </p>

      <H2>{tx(t, "cpp13_cacheTitle", "The numbers that drive every decision")}</H2>
      <LessonTable
        headers={[tx(t, "cpp13_h0", "Access"), tx(t, "cpp13_h1", "Approximate cost"), tx(t, "cpp13_h2", "In perspective")]}
        rows={[
          ["L1 cache",   "~4 cycles",    tx(t, "cpp13_r1", "Effectively free")],
          ["L2 cache",   "~14 cycles",   tx(t, "cpp13_r2", "Noticeable in a tight loop")],
          ["L3 cache",   "~50 cycles",   tx(t, "cpp13_r3", "You are now memory-bound")],
          ["Main RAM",   "~200+ cycles", tx(t, "cpp13_r4", "A hundred wasted multiplies")],
          [tx(t, "cpp13_r5k", "Cache line"), "64 bytes", tx(t, "cpp13_r5", "You always pay for 64 bytes, even reading one")],
        ]}
      />

      <H2>{tx(t, "cpp13_soaTitle", "Array of structs vs struct of arrays")}</H2>
      <p>
        {tx(t, "cpp13_soaBody",
          "This is the single highest-leverage change in most particle, physics and ECS code. If a loop touches two fields out of a fat struct, an AoS layout drags the other sixty bytes through cache for nothing."
        )}
      </p>

      <CodeBlock lang="cpp" filename="aos_soa.cpp" t={t}>{`// AoS — 64 bytes per particle, but the update loop only reads 24 of them
struct Particle {
    glm::vec3 position;   // 12
    glm::vec3 velocity;   // 12
    glm::vec4 color;      // 16
    float     lifetime;   //  4
    Texture*  texture;    //  8  ← pointer chasing in the middle of your hot data
};
std::vector<Particle> particles;

for (auto& p : particles)
    p.position += p.velocity * dt;      // ~62% of every cache line wasted

// SoA — the update loop reads two arrays back to back, fully sequential
struct ParticleSystem {
    std::vector<glm::vec3> positions;
    std::vector<glm::vec3> velocities;
    std::vector<glm::vec4> colors;
    std::vector<float>     lifetimes;
};

for (auto [pos, vel] : std::views::zip(ps.positions, ps.velocities))
    pos += vel * dt;                    // every byte loaded is used, and it vectorizes`}</CodeBlock>

      <H2>{tx(t, "cpp13_allocTitle", "Allocation is the other half")}</H2>

      <CodeBlock lang="cpp" filename="alloc.cpp" t={t}>{`// Bad — reallocates and copies log2(N) times while filling
std::vector<Vertex> v;
for (const auto& x : source) v.push_back(transform(x));

// Good — one allocation
std::vector<Vertex> v;
v.reserve(source.size());
for (const auto& x : source) v.emplace_back(transform(x));

// Better — reuse the buffer across frames; clear() keeps the capacity
struct FrameData { std::vector<DrawCall> calls; };
void beginFrame(FrameData& f) { f.calls.clear(); }   // no free, no realloc

// C++17 polymorphic allocators: a bump arena reset once per frame
std::array<std::byte, 1 << 20> buffer;
std::pmr::monotonic_buffer_resource arena{buffer.data(), buffer.size()};
std::pmr::vector<DrawCall> calls{&arena};            // allocation is a pointer bump`}</CodeBlock>

      <H2>{tx(t, "cpp13_containersTitle", "Newer containers worth knowing")}</H2>
      <LessonTable
        headers={[tx(t, "cpp13_ch0", "Container"), tx(t, "cpp13_ch1", "What it gives you"), tx(t, "cpp13_ch2", "Since")]}
        rows={[
          ["std::flat_map / flat_set", tx(t, "cpp13_c1", "Map semantics over two sorted vectors. Far better cache behaviour than a red-black tree for lookups; slow inserts."), "C++23"],
          ["std::inplace_vector",      tx(t, "cpp13_c2", "A vector with a fixed capacity stored inline. No heap allocation at all — ideal for per-frame buffers."), "C++26"],
          ["std::hive",                tx(t, "cpp13_c3", "Bucketed storage with stable references and O(1) erase. Built for entities that are created and destroyed constantly."), "C++26"],
          ["std::mdspan",              tx(t, "cpp13_c4", "A multidimensional non-owning view over a flat buffer. Textures and voxel grids without index arithmetic."), "C++23"],
          ["std::simd",                tx(t, "cpp13_c5", "Portable explicit vectorization. Write it once, get SSE / AVX / NEON."), "C++26"],
        ]}
      />

      <CodeBlock lang="cpp" filename="new_containers.cpp" t={t}>{`// inplace_vector — a bounded stack buffer with vector's interface
std::inplace_vector<Light, 8> visibleLights;      // capacity 8, zero allocations
if (visibleLights.try_push_back(light)) { /* fits */ }

// mdspan — treat a flat float buffer as a 2D image
std::vector<float> pixels(width * height);
std::mdspan image{pixels.data(), height, width};
image[y, x] = 1.0f;                                // C++23 multidim subscript`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "cpp13_measureWarn",
          "Every claim on this page is a hypothesis until you measure it on your data. Compilers vectorize, prefetch and elide aggressively at -O2, and modern branch predictors are extremely good. Profile first, change one thing, profile again — and never benchmark a debug build, where the standard library is full of iterator checks that do not exist in release."
        )}
      </Callout>

      <Callout type="tip" t={t}>
        {tx(t, "cpp13_toolsTip",
          "The tools that pay for themselves: perf or VTune for where the time goes, Compiler Explorer for what the compiler actually emitted, cachegrind for miss rates, and Tracy for a frame-by-frame timeline of a running game."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 14: What's New in C++26 ──────────────────────────────────────────

function Cpp26Content({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp14_intro",
          "C++26 is the largest release since C++11, and its headline feature — compile-time reflection — changes what is possible in the language rather than just adding convenience. This chapter is a tour of what is coming and what it means for engine code."
        )}
      </p>

      <H2>{tx(t, "cpp14_reflTitle", "Static reflection")}</H2>
      <p>
        {tx(t, "cpp14_reflBody",
          "Reflection lets code inspect types at compile time: enumerate members, read names, iterate enumerators. Every engine currently solves this with macros, code generators or a separate IDL — serialization, editor property panels, script bindings and network replication are all the same problem. Reflection deletes that entire category of build tooling."
        )}
      </p>

      <CodeBlock lang="cpp" filename="reflection.cpp" t={t}>{`#include <meta>

// ^^ lifts an entity into a value of type std::meta::info
// [: :] splices a reflection back into code

template <typename E>
constexpr std::string_view enumName(E value) {
    template for (constexpr auto e : std::meta::enumerators_of(^^E))
        if (value == [:e:]) return std::meta::identifier_of(e);
    return "<unknown>";
}

enum class Pass { Shadow, GBuffer, Lighting, Post };
static_assert(enumName(Pass::GBuffer) == "GBuffer");   // no macro, no codegen

// The same mechanism gives you automatic serialization
template <typename T>
void serialize(const T& obj, Writer& w) {
    template for (constexpr auto member : std::meta::nonstatic_data_members_of(^^T))
        w.write(std::meta::identifier_of(member), obj.[:member:]);
}`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "cpp14_reflWarn",
          "Reflection's syntax went through several revisions before settling, and compiler previews may differ from what you see here — the tokens ^^ and [: :] and the exact std::meta function names are the ones adopted for C++26, but treat any example you find online as version-specific until your compiler agrees. Check your toolchain's status page before building anything on it."
        )}
      </Callout>

      <H2>{tx(t, "cpp14_restTitle", "The rest of the release")}</H2>
      <LessonTable
        headers={[tx(t, "cpp14_h0", "Feature"), tx(t, "cpp14_h1", "Why it matters")]}
        rows={[
          [tx(t, "cpp14_f1", "Contracts"),            tx(t, "cpp14_w1", "pre / post / contract_assert as language constructs the compiler and tools understand.")],
          [tx(t, "cpp14_f2", "std::execution"),       tx(t, "cpp14_w2", "Senders and receivers — the standard async model everything else will build on.")],
          [tx(t, "cpp14_f3", "std::simd"),            tx(t, "cpp14_w3", "Portable SIMD without intrinsics. One source, SSE / AVX / NEON output.")],
          [tx(t, "cpp14_f4", "Erroneous behaviour"),  tx(t, "cpp14_w4", "Reading an uninitialized value is diagnosable instead of undefined.")],
          [tx(t, "cpp14_f5", "Pack indexing"),        tx(t, "cpp14_w5", "Ts...[N] — no more recursive template unpacking.")],
          [tx(t, "cpp14_f6", "inplace_vector / hive"),tx(t, "cpp14_w6", "Allocation-free bounded storage, and stable-reference bucketed storage.")],
          [tx(t, "cpp14_f7", "#embed"),               tx(t, "cpp14_w7", "Embed a binary file — a shader, a font, an icon — directly into the program.")],
          [tx(t, "cpp14_f8", "optional<T&>"),         tx(t, "cpp14_w8", "An optional reference, finally, instead of a raw pointer with a comment.")],
          [tx(t, "cpp14_f9", "= delete(\"reason\")"), tx(t, "cpp14_w9", "Explain why an overload is deleted, in the error message.")],
          [tx(t, "cpp14_f10", "Saturating arithmetic"), tx(t, "cpp14_w10", "add_sat / mul_sat — clamps instead of wrapping. Colour and audio code wants this.")],
        ]}
      />

      <CodeBlock lang="cpp" filename="cpp26_misc.cpp" t={t}>{`// #embed — no more xxd -i in your build script
constexpr unsigned char fontData[] = {
#embed "assets/inter.ttf"
};

// = delete with a reason
struct Handle {
    Handle(const Handle&) = delete("Handle is move-only — use std::move");
};

// Saturating arithmetic — clamps at the type's limits instead of wrapping
std::uint8_t bright = std::add_sat(pixel, std::uint8_t{40});   // 250 + 40 → 255

// optional over a reference
std::optional<Entity&> tryFind(EntityId id);`}</CodeBlock>

      <H2>{tx(t, "cpp14_planTitle", "How to actually adopt this")}</H2>
      <p>
        {tx(t, "cpp14_planBody",
          "Adopt in the order of risk. The small language fixes — pack indexing, the _ placeholder, deleted-with-reason, saturating arithmetic — are safe to use the day your compiler supports them. Contracts and reflection change how you structure code, so prototype them in a side project first and keep an escape hatch until support is broad across the compilers you ship on."
        )}
      </p>

      <Callout type="tip" t={t}>
        {tx(t, "cpp14_verifyTip",
          "Two links belong in your bookmarks: the cppreference compiler support tables, which track feature-by-feature status per compiler version, and your standard library's release notes. Anything you read about C++26 — including this page — is a snapshot; the ground truth is what your toolchain compiles today."
        )}
      </Callout>

    </article>
  );
}

// ── Chapter 15: Tooling ──────────────────────────────────────────────────────

function ToolingContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp15_intro",
          "C++ has no official build system, package manager or formatter, which means the ecosystem chose several of each. This chapter is the setup that a new project in 2026 should start from — modern CMake, a package manager, sanitizers on by default in debug, and a linter in CI."
        )}
      </p>

      <H2>{tx(t, "cpp15_cmakeTitle", "Target-based CMake")}</H2>
      <p>
        {tx(t, "cpp15_cmakeBody",
          "The rule that separates modern CMake from the old style: never set a global variable. Attach everything to a target, and mark each property PUBLIC if consumers need it or PRIVATE if it stops at this target."
        )}
      </p>

      <CodeBlock lang="cmake" filename="CMakeLists.txt" t={t}>{`cmake_minimum_required(VERSION 3.28)
project(Engine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)          # -std=c++23, not -std=gnu++23
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)  # clangd / clang-tidy need this

add_library(engine_core)
target_sources(engine_core PRIVATE src/renderer.cpp src/scene.cpp)
target_include_directories(engine_core PUBLIC include)
target_compile_features(engine_core PUBLIC cxx_std_23)

target_compile_options(engine_core PRIVATE
    $<$<CXX_COMPILER_ID:GNU,Clang>:-Wall -Wextra -Wconversion -Wshadow>
    $<$<CXX_COMPILER_ID:MSVC>:/W4 /permissive->)

find_package(SDL3 REQUIRED)
target_link_libraries(engine_core PUBLIC SDL3::SDL3)

add_executable(game src/main.cpp)
target_link_libraries(game PRIVATE engine_core)`}</CodeBlock>

      <H2>{tx(t, "cpp15_presetsTitle", "Presets kill the wall of flags")}</H2>

      <CodeBlock lang="cpp" filename="CMakePresets.json" t={t}>{`{
  "version": 6,
  "configurePresets": [
    {
      "name": "debug",
      "generator": "Ninja",
      "binaryDir": "build/debug",
      "cacheVariables": {
        "CMAKE_BUILD_TYPE": "Debug",
        "CMAKE_CXX_FLAGS": "-fsanitize=address,undefined -fno-omit-frame-pointer"
      }
    },
    {
      "name": "release",
      "generator": "Ninja",
      "binaryDir": "build/release",
      "cacheVariables": { "CMAKE_BUILD_TYPE": "RelWithDebInfo" }
    }
  ]
}

// cmake --preset debug && cmake --build build/debug`}</CodeBlock>

      <H2>{tx(t, "cpp15_sanitizersTitle", "Sanitizers find what code review does not")}</H2>
      <LessonTable
        headers={[tx(t, "cpp15_h0", "Sanitizer"), tx(t, "cpp15_h1", "Catches"), tx(t, "cpp15_h2", "Slowdown")]}
        rows={[
          ["-fsanitize=address",   tx(t, "cpp15_r1", "Use-after-free, buffer overflow, leaks, double free."), "~2x"],
          ["-fsanitize=undefined", tx(t, "cpp15_r2", "Signed overflow, bad shifts, misaligned access, null deref."), "~1.2x"],
          ["-fsanitize=thread",    tx(t, "cpp15_r3", "Data races. The only practical way to find them."), "~5-15x"],
          ["_GLIBCXX_ASSERTIONS",  tx(t, "cpp15_r4", "Bounds checks inside libstdc++ containers and iterators."), tx(t, "cpp15_r4b", "Small")],
        ]}
      />

      <Callout type="warn" t={t}>
        {tx(t, "cpp15_tsanWarn",
          "ASan and TSan cannot be combined in one build — run them as separate CI jobs. And run your test suite under sanitizers, not just the game: a data race that only fires once every ten thousand frames will never reproduce under a debugger, but TSan flags it the first time the code path executes."
        )}
      </Callout>

      <H2>{tx(t, "cpp15_pkgTitle", "Dependencies")}</H2>
      <LessonTable
        headers={[tx(t, "cpp15_p0", "Tool"), tx(t, "cpp15_p1", "Best for")]}
        rows={[
          ["vcpkg",     tx(t, "cpp15_t1", "Large catalogue, manifest mode pins versions per project. Strong on Windows and MSVC.")],
          ["Conan",     tx(t, "cpp15_t2", "Binary caching and custom ABI configurations. Common in larger studios and CI-heavy setups.")],
          ["CPM.cmake", tx(t, "cpp15_t3", "A thin wrapper over FetchContent. No installation step — good for small projects and samples.")],
          ["Submodules",tx(t, "cpp15_t4", "Total control, zero tooling, manual updates forever. Still the most common choice in gamedev.")],
        ]}
      />

      <H2>{tx(t, "cpp15_lintTitle", "Formatting and static analysis")}</H2>

      <CodeBlock lang="bash" filename="lint.sh" t={t}>{`# Format — settle the style argument once, in a file
clang-format -i $(git diff --name-only --diff-filter=ACM '*.cpp' '*.hpp')

# Static analysis — needs compile_commands.json from CMake
clang-tidy -p build/debug src/renderer.cpp

# .clang-tidy
# Checks: 'bugprone-*,performance-*,modernize-*,readability-*,-modernize-use-trailing-return-type'

# Ask the compiler where the build time went (Clang)
clang++ -std=c++23 -ftime-trace -c src/renderer.cpp
# then open renderer.json in chrome://tracing or Perfetto`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "cpp15_ciTip",
          "The highest-value CI pipeline for a C++ project is four jobs: build with GCC, build with Clang, build with MSVC, and run the tests under ASan+UBSan. Three compilers disagree about far more than you expect, and each disagreement is usually a real bug or a portability issue you would otherwise ship."
        )}
      </Callout>

      <H2>{tx(t, "cpp15_nextTitle", "Where to go from here")}</H2>
      <p>
        {tx(t, "cpp15_nextBody",
          "You now have the language. The natural next steps in this track set are SDL3 for windowing, input and audio, and OpenGL or GLSL for the rendering side — both assume exactly the C++ taught here: RAII wrappers around C handles, spans at the API boundary, and value semantics everywhere else."
        )}
      </p>

    </article>
  );
}

// ── Exported track ────────────────────────────────────────────────────────────

export const cppTrack: Track = {
  id: "cpp",
  title: "Modern C++",
  chapters: [
    { id: "landscape",   title: "The Modern C++ Landscape",     minRead: 9,  content: (t) => <LandscapeContent   t={t} /> },
    { id: "values",      title: "Initialization & Values",      minRead: 10, content: (t) => <ValuesContent      t={t} /> },
    { id: "move",        title: "Move Semantics",               minRead: 12, content: (t) => <MoveContent        t={t} /> },
    { id: "raii",        title: "RAII & Smart Pointers",        minRead: 12, content: (t) => <RaiiContent        t={t} /> },
    { id: "templates",   title: "Templates & Generic Code",     minRead: 11, content: (t) => <TemplatesContent   t={t} /> },
    { id: "concepts",    title: "Concepts & Constraints",       minRead: 9,  content: (t) => <ConceptsContent    t={t} /> },
    { id: "constexpr",   title: "Compile-Time C++",             minRead: 10, content: (t) => <ConstexprContent   t={t} /> },
    { id: "ranges",      title: "Ranges & Views",               minRead: 11, content: (t) => <RangesContent      t={t} /> },
    { id: "errors",      title: "Error Handling",               minRead: 11, content: (t) => <ErrorsContent      t={t} /> },
    { id: "vocabulary",  title: "Vocabulary Types",             minRead: 10, content: (t) => <VocabularyContent  t={t} /> },
    { id: "modules",     title: "Modules & Build Hygiene",      minRead: 11, content: (t) => <ModulesContent     t={t} /> },
    { id: "concurrency", title: "Concurrency & Threads",        minRead: 13, content: (t) => <ConcurrencyContent t={t} /> },
    { id: "performance", title: "Performance & Data Layout",    minRead: 13, content: (t) => <PerformanceContent t={t} /> },
    { id: "cpp26",       title: "What's New in C++26",          minRead: 10, content: (t) => <Cpp26Content       t={t} /> },
    { id: "tooling",     title: "Tooling, Build & Sanitizers",  minRead: 11, content: (t) => <ToolingContent     t={t} /> },
  ],
};
