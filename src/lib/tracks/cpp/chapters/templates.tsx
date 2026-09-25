"use client";

// C++ track — "Templates & Generic Code".

import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function TemplatesContent({ t }: { t: TrackTranslations }) {
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
