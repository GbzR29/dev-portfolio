"use client";

// C++ track — "Error Handling".

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function ErrorsContent({ t }: { t: TrackTranslations }) {
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
