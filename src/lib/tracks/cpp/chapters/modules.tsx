"use client";

// C++ track — "Modules & Build Hygiene".

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function ModulesContent({ t }: { t: TrackTranslations }) {
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
