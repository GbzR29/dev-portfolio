"use client";

// C++ track — "Move Semantics".

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function MoveContent({ t }: { t: TrackTranslations }) {
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
