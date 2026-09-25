"use client";

// C++ track — "What's New in C++26".

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function Cpp26Content({ t }: { t: TrackTranslations }) {
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
