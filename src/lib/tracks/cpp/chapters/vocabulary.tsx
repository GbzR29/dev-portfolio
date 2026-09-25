"use client";

// C++ track — "Vocabulary Types".

import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function VocabularyContent({ t }: { t: TrackTranslations }) {
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
