"use client";

// C++ track — "RAII & Smart Pointers".

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function RaiiContent({ t }: { t: TrackTranslations }) {
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
