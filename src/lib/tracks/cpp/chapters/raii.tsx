"use client";

// Language core 3: what a resource is; manual cleanup versus every path out
// of a function; RAII as tying a resource to an object's lifetime; writing a
// File class (move-only, rule of five); std::unique_ptr (make_unique, ->, get,
// reset, moving ownership; lifetime figure); custom deleters for C APIs;
// std::shared_ptr and its control block (figure: counts), the cost of atomic
// counts; cycles and std::weak_ptr (figures: cycle, weak); choosing an
// ownership type (value, unique, shared, weak, raw observer, handles); the
// rule of zero as the end point.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { LifetimeFigure } from "@/components/lesson/figures/cpp/LifetimeFigure";

export function RaiiContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cppRaii_intro",
          "A resource is anything a program borrows and must give back: memory from the heap, an open file, a network connection, a lock, a window, a texture on the GPU. C gives you a pair of functions for each, malloc and free, fopen and fclose, and leaves the rest to your memory. In the 1980s, while making C++ exceptions work, Bjarne Stroustrup settled on a different arrangement: let an object own the resource, take it in its constructor, give it back in its destructor. Then the resource lives exactly as long as the object, and the compiler, which already knows when every object dies, does the giving back. He gave it a famously clumsy name, Resource Acquisition Is Initialisation, RAII. The idea behind the name is the most important one in C++, and the reason a C++ program can go a whole day without a single delete.")}
      </Lead>

      <Goals t={t} id="cppRaii" items={[
        "Wrap an acquire/release pair in a class so the release cannot be forgotten.",
        "Own heap objects with std::unique_ptr, and pass ownership with std::move.",
        "Explain how std::shared_ptr counts owners, and break a cycle with std::weak_ptr.",
        "Turn a C library's create/destroy functions into an RAII type with a custom deleter.",
        "Choose between a value, unique_ptr, shared_ptr, weak_ptr and a plain pointer or reference.",
      ]} />

      <H2>{tx(t, "cppRaii_pathsTitle", "Every path out")}</H2>
      <p>
        {tx(t, "cppRaii_pathsBody",
          "Here is a function that loads a level the C way. It borrows two resources, and has four ways out. Each way out must release exactly what has been acquired so far.")}
      </p>
      <CodeBlock lang="cpp" filename="manual.cpp" t={t}>{`bool load_level(const char* path) {
    FILE* f = std::fopen(path, "rb");
    if (!f) return false;                       // 1. nothing to release yet
    Texture* tex = new Texture();
    if (!read_header(f)) {                      // 2. must release both
        delete tex; std::fclose(f); return false;
    }
    tex->upload();                              // 3. if this throws: both leak
    delete tex;                                 // 4. the normal way out
    std::fclose(f);
    return true;
}`}</CodeBlock>
      <p>
        {tx(t, "cppRaii_pathsAfter",
          "Path 3 is the one nobody sees. upload might throw an exception: an error that leaves the function immediately, through every caller, until something catches it (the error-handling chapter covers them). No line after it runs. Now the same function with each resource owned by an object:")}
      </p>
      <CodeBlock lang="cpp" filename="raii.cpp" t={t}>{`#include <fstream>
#include <memory>

bool load_level(const std::string& path) {
    std::ifstream f{path, std::ios::binary};    // ~ifstream closes the file
    if (!f) return false;
    auto tex = std::make_unique<Texture>();     // ~unique_ptr deletes the texture
    if (!read_header(f)) return false;          // both released
    tex->upload();                              // throws? both still released
    return true;                                // both released
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppRaii_hWay", "Way out of the scope"), tx(t, "cppRaii_hDtors", "Destructors run?")]}
        rows={[
          [tx(t, "cppRaii_w1", "Reaching the closing brace"), tx(t, "cppRaii_yes", "Yes, newest object first")],
          ["return, break, continue", tx(t, "cppRaii_yes", "Yes, newest object first")],
          [tx(t, "cppRaii_w3", "An exception passing through"), tx(t, "cppRaii_w3b", "Yes: this is called stack unwinding")],
          ["std::exit, std::abort, a crash", tx(t, "cppRaii_w4b", "No: the program ends without unwinding (the operating system takes back memory and files anyway)")],
        ]}
      />

      <H2>{tx(t, "cppRaii_classTitle", "Writing a resource class")}</H2>
      <p>
        {tx(t, "cppRaii_classBody",
          "Any acquire/release pair becomes RAII the same way. Here is a C FILE* wrapped in a class. It owns something raw, so it follows the rule of five from the previous chapter: an open file cannot be copied, but its ownership can be moved.")}
      </p>
      <CodeBlock lang="cpp" filename="file.cpp" t={t}>{`#include <cstdio>
#include <utility>

class File {
public:
    File(const char* path, const char* mode) : f_(std::fopen(path, mode)) {}
    ~File() { if (f_) std::fclose(f_); }

    File(const File&) = delete;                      // one owner only
    File& operator=(const File&) = delete;
    File(File&& o) noexcept : f_(std::exchange(o.f_, nullptr)) {}
    File& operator=(File&& o) noexcept {
        if (this != &o) { if (f_) std::fclose(f_); f_ = std::exchange(o.f_, nullptr); }
        return *this;
    }

    explicit operator bool() const { return f_ != nullptr; }   // if (file) …
    std::FILE* get() const { return f_; }                       // for C functions

private:
    std::FILE* f_;
};`}</CodeBlock>
      <p>
        {tx(t, "cppRaii_classAfter",
          "explicit operator bool lets you write if (file) to test whether the file opened, while still refusing nonsense like int n = file;. get() hands the raw FILE* to C functions such as std::fprintf without giving up ownership. Writing this once is instructive. Writing it for every resource is tedious, and the standard library has a ready-made owner that covers most cases.")}
      </p>

      <H2>{tx(t, "cppRaii_uniqueTitle", "std::unique_ptr: exactly one owner")}</H2>
      <p>
        {tx(t, "cppRaii_uniqueBody",
          "std::unique_ptr<T>, from <memory>, is a pointer that owns the object it points at: when the unique_ptr dies, it deletes the object. It is the size of a plain pointer and costs nothing extra at run time. It cannot be copied, because two owners would delete twice; it can be moved, which hands ownership on and leaves the source empty, like Buf's move. Step through it.")}
      </p>
      <LifetimeFigure t={t} programs={["unique"]} title={tx(t, "cppRaii_figUniqueTitle", "unique_ptr: one owner, passed on")} />
      <CodeBlock lang="cpp" filename="unique.cpp" t={t}>{`#include <memory>

auto tex = std::make_unique<Texture>("wall.png");   // new Texture("wall.png"), owned

tex->width();                  // -> and * work as on a raw pointer
draw(*tex);                    // void draw(const Texture&): look, do not own
Texture* raw = tex.get();      // the raw pointer, still owned by tex

auto other = std::move(tex);   // ownership moves; tex is now empty
if (!tex) { /* tex owns nothing */ }
other.reset();                 // delete the Texture now; other is empty

auto many = std::make_unique<int[]>(1000);   // an owned array: many[0] … many[999]`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppRaii_hOp", "Operation"), tx(t, "cppRaii_hDoes", "What it does")]}
        rows={[
          ["std::make_unique<T>(args)", tx(t, "cppRaii_u1", "Creates a T on the heap with those constructor arguments and returns its owner. Prefer it to writing new.")],
          ["p->f(), *p", tx(t, "cppRaii_u2", "Use the object, exactly as with a raw pointer.")],
          ["p.get()", tx(t, "cppRaii_u3", "The raw pointer, for code that only looks. Never delete it.")],
          ["std::move(p)", tx(t, "cppRaii_u4", "Hands ownership to whoever receives it; p becomes empty (nullptr).")],
          ["p.reset()", tx(t, "cppRaii_u5", "Deletes the object now and empties p.")],
          ["if (p)", tx(t, "cppRaii_u6", "True while p owns something.")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "cppRaii_paramTip",
          "Function parameters say what the function does with ownership. A function that only uses the object takes const Texture& (or Texture* if it may be absent). A function that takes ownership takes std::unique_ptr<Texture> by value, and the caller must write std::move. A function returning a new object returns std::unique_ptr<Texture>. Reading the signature tells you who will delete what.")}
      </Callout>

      <H3>{tx(t, "cppRaii_deleterTitle", "Custom deleters: C libraries made safe")}</H3>
      <p>
        {tx(t, "cppRaii_deleterBody",
          "unique_ptr calls delete by default, but you can tell it what to call instead. That turns any C library's create/destroy pair into an RAII type in a few lines: SDL, GLFW, FreeType, SQLite, and the C FILE* itself. The deleter below is a struct with an operator(), which makes its objects callable like functions; the chapter on lambdas explains these. Because it holds no data, it adds nothing to the unique_ptr's size.")}
      </p>
      <CodeBlock lang="cpp" filename="deleter.cpp" t={t}>{`#include <cstdio>
#include <memory>

struct CloseFile {
    void operator()(std::FILE* f) const noexcept { std::fclose(f); }
};
using FilePtr = std::unique_ptr<std::FILE, CloseFile>;

struct DestroyWindow {
    void operator()(SDL_Window* w) const noexcept { SDL_DestroyWindow(w); }
};
using WindowPtr = std::unique_ptr<SDL_Window, DestroyWindow>;

FilePtr   log{std::fopen("log.txt", "w")};          // replaces the whole File class
WindowPtr window{SDL_CreateWindow("Game", 1280, 720, 0)};
if (!window) return 1;
std::fprintf(log.get(), "window open\\n");
// fclose and SDL_DestroyWindow run by themselves, newest first`}</CodeBlock>

      <H2>{tx(t, "cppRaii_sharedTitle", "std::shared_ptr: the last one out turns off the light")}</H2>
      <p>
        {tx(t, "cppRaii_sharedBody",
          "Sometimes no single part of the program can be the owner. A texture used by many materials should live as long as any of them uses it, and no longer. std::shared_ptr<T> handles that by counting. Next to the object it keeps a small control block holding the use count, the number of shared_ptrs that own it. Copying a shared_ptr adds one; destroying or resetting one subtracts one; at zero, the object is deleted.")}
      </p>
      <LifetimeFigure t={t} programs={["shared"]} title={tx(t, "cppRaii_figSharedTitle", "shared_ptr: counting the owners")} />
      <p>
        {tx(t, "cppRaii_costBody",
          "Sharing has a price. Each copy and each destruction changes the count with an atomic operation, one that is safe when several threads touch the same count at once, and atomic operations are slower than ordinary ones. make_shared puts the object and its control block in one allocation, so prefer it to std::shared_ptr<T>(new T). And pass a shared_ptr by const& (or pass the object itself by reference) when the function does not need to keep a share.")}
      </p>

      <H3>{tx(t, "cppRaii_cycleTitle", "Cycles, and std::weak_ptr")}</H3>
      <p>
        {tx(t, "cppRaii_cycleBody",
          "Counting has one blind spot. If two objects own each other, each keeps the other's count above zero, and neither is ever deleted, even when nothing else can reach them. A std::weak_ptr is the way out: it points at an object owned by shared_ptrs without owning it, so it does not raise the use count. Step through the cycle, then the same structure with the link back made weak.")}
      </p>
      <LifetimeFigure t={t} programs={["cycle", "weak"]} title={tx(t, "cppRaii_figCycleTitle", "A shared_ptr cycle, and the weak_ptr that breaks it")} />
      <CodeBlock lang="cpp" filename="weak.cpp" t={t}>{`struct Node {
    std::shared_ptr<Node> next;   // owns the following node
    std::weak_ptr<Node>   prev;   // only remembers the previous one
};

void touch_prev(const Node& n) {
    if (auto p = n.prev.lock()) {   // a shared_ptr if the node still exists, else empty
        p->visited = true;          // p keeps it alive until the end of this block
    }
}`}</CodeBlock>
      <p>
        {tx(t, "cppRaii_lockBody",
          "A weak_ptr cannot be used directly, because its object might be gone. lock() asks: if the object still exists, you get a shared_ptr that keeps it alive while you use it; if not, you get an empty one. The rule for structures: owners point down (a parent owns its children), observers point back up (a child has a weak_ptr or a plain pointer to its parent).")}
      </p>

      <H2>{tx(t, "cppRaii_chooseTitle", "Which one to use")}</H2>
      <LessonTable
        headers={[tx(t, "cppRaii_hType", "Type"), tx(t, "cppRaii_hMeaning", "Meaning"), tx(t, "cppRaii_hCost", "Cost")]}
        rows={[
          ["T", tx(t, "cppRaii_k1", "The object is part of its owner: a member, a local, an element. The first choice."), tx(t, "cppRaii_k1c", "None")],
          ["std::unique_ptr<T>", tx(t, "cppRaii_k2", "One owner, object on the heap: it is large, its size is only known at run time, or it must outlive the scope that made it."), tx(t, "cppRaii_k2c", "One allocation; same size as a pointer")],
          ["std::shared_ptr<T>", tx(t, "cppRaii_k3", "Several owners, and no way to say which will finish last."), tx(t, "cppRaii_k3c", "Control block; atomic count on every copy")],
          ["std::weak_ptr<T>", tx(t, "cppRaii_k4", "Look at a shared object without keeping it alive; breaks cycles."), tx(t, "cppRaii_k4c", "lock() before each use")],
          ["T& / T*", tx(t, "cppRaii_k5", "Use an object someone else owns. T* when it may be absent (nullptr). Never delete through it."), tx(t, "cppRaii_k5c", "None, but nothing guarantees the object is still alive")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "cppRaii_rawNote",
          "Modern C++ does not ban raw pointers; it bans raw pointers that own. A Texture* parameter that means \"look at this, it may be null\" is fine. What is gone is the new and delete written by hand: each object should have exactly one thing that knows how to destroy it, and that thing should be an object.")}
      </Callout>
      <Callout type="tip" t={t}>
        {tx(t, "cppRaii_handleTip",
          "Games often replace shared_ptr with handles: a small struct holding an index into a central array plus a generation number that changes every time a slot is reused. A handle is 8 bytes, copies for free, survives the array growing, and can tell when the object it refers to is gone (the generation no longer matches). Consider it when shared_ptr copies show up in a hot loop.")}
      </Callout>

      <H2>{tx(t, "cppRaii_zeroTitle", "The rule of zero, finally")}</H2>
      <p>
        {tx(t, "cppRaii_zeroBody",
          "Put the three chapters of this section together. A class whose members are values, standard containers and smart pointers copies, moves and cleans up correctly with no special member functions at all, because each member already does its own part. That is the rule of zero, and it is how nearly every class in modern C++ is written.")}
      </p>
      <CodeBlock lang="cpp" filename="model.cpp" t={t}>{`struct Model {
    std::string                         name;       // copies, moves, frees itself
    std::vector<Vertex>                 vertices;   // the same
    std::unique_ptr<Texture>            texture;    // moves, deletes; no copy
    std::shared_ptr<const Material>     material;   // shared with other models
};
// No destructor, no copy or move functions. Model is move-only (because of
// unique_ptr), and every resource it holds is released exactly once.`}</CodeBlock>

      <H2>{tx(t, "cppRaii_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cppRaii_try1", "Rewrite load_level from the start of the chapter with the File class, and add a throw in the middle. Put a print in File's destructor and check that it still runs.")}</li>
        <li>{tx(t, "cppRaii_try2", "Make a std::vector<std::unique_ptr<Texture>>, add three with push_back(std::make_unique<Texture>(…)), then try to copy the vector. Read the error, and fix it with std::move.")}</li>
        <li>{tx(t, "cppRaii_try3", "Build the two-Node cycle with shared_ptr, give Node a destructor that prints, and confirm it never prints. Change one link to weak_ptr and run again. Then print p.use_count() at each step.")}</li>
        <li>{tx(t, "cppRaii_try4", "Wrap a FILE* with std::unique_ptr<std::FILE, CloseFile> and replace every fclose in one of your C exercises.")}</li>
      </ol>

      <KeyIdeas t={t} id="cppRaii" items={[
        "RAII: an object acquires a resource in its constructor and releases it in its destructor, so every way out of a scope, exceptions included, releases it.",
        "A class that owns something raw follows the rule of five; usually a resource is not copyable but its ownership is movable.",
        "std::unique_ptr is a single owner at no extra cost: make_unique to create, std::move to hand on, a custom deleter for C libraries.",
        "std::shared_ptr counts owners in a control block and deletes at zero; the count is atomic, so sharing is not free.",
        "Owners that point at each other never reach zero: make the link back a std::weak_ptr, and lock() it before use.",
        "Prefer plain values, then unique_ptr, then shared_ptr; use references and raw pointers only to look. Then most classes need no special members at all.",
      ]} />
    </Article>
  );
}
