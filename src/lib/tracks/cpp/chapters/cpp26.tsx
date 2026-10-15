"use client";

// What's Next 1: C++26. Starts from the save-file struct whose printer and
// serialiser nobody updated; then static reflection piece by piece (the
// reflection operator, std::meta queries, splices, template for; figure:
// printing every field by hand or by reflection, with the break-it of a new
// member), enum to string, contracts with GCC 16's real violation message,
// erroneous behaviour for uninitialised reads, a table of the smaller
// features, what GCC 16.2 supports (feature-test macros), and how to adopt.
// Everything was compiled and run with g++ 16.2 on Compiler Explorer.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { ReflectFigure } from "@/components/lesson/figures/cpp/ReflectFigure";

export function Cpp26Content({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cpp26_intro",
          "A programmer adds a field to the player struct: bool alive. The game compiles, runs, and saves. Weeks later someone notices that loading a save always brings dead players back to life: the save function was written when the struct had three fields, and nobody remembered to update it. The same thing happens to every enum-to-string switch, every debug printer, every JSON writer. For forty years C++ code could not ask the simplest question about itself: what are the members of this struct? C++26 finally lets it ask, at compile time. Reflection is the headline of the new standard, and this chapter tours it together with the rest of what arrives, tested on GCC 16.2.")}
      </Lead>

      <Goals t={t} id="cpp26" items={[
        "Read and write simple reflection code: ^^, std::meta queries, splices and template for.",
        "Generate per-member and per-enumerator code instead of maintaining it by hand.",
        "Use contracts and say what erroneous behaviour changes for uninitialised variables.",
        "Check which C++26 features your compiler supports before relying on them.",
      ]} />

      <H2>{tx(t, "cpp26_reflTitle", "Static reflection")}</H2>
      <CodeBlock lang="cpp" filename="print_fields.cpp" t={t}>{`#include <meta>

struct Player { std::string name; int hp; float speed; };

template <typename T>
void print_fields(const T& obj) {
    constexpr auto ctx = std::meta::access_context::unchecked();
    template for (constexpr auto m :
            std::define_static_array(std::meta::nonstatic_data_members_of(^^T, ctx)))
        std::println("{} = {}", std::meta::identifier_of(m), obj.[:m:]);
}

print_fields(Player{"Ada", 90, 4.5f});
// name = Ada
// hp = 90
// speed = 4.5`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cpp26_hPiece", "Piece"), tx(t, "cpp26_hMeans", "What it means")]}
        rows={[
          ["^^T", tx(t, "cpp26_p1", "The reflection operator (nicknamed cat ears). It turns a type, a variable, a function or a namespace into a value of type std::meta::info that describes it, usable only at compile time.")],
          ["nonstatic_data_members_of(^^T, ctx)", tx(t, "cpp26_p2", "A query: a std::vector<std::meta::info> with one entry per data member of T, in declaration order. ctx says which members you may see; unchecked() means all of them, private ones included.")],
          ["define_static_array(…)", tx(t, "cpp26_p3", "Copies that compile-time vector into a static array, because a vector built during constant evaluation cannot survive into the program (the Compile-Time C++ chapter).")],
          ["template for (constexpr auto m : …)", tx(t, "cpp26_p4", "An expansion statement: not a loop that runs, but an instruction to the compiler to write the body once per element, with m a different constant each time.")],
          ["identifier_of(m)", tx(t, "cpp26_p5", "The member's name as a std::string_view: \"name\", \"hp\", \"speed\".")],
          ["obj.[:m:]", tx(t, "cpp26_p6", "A splice: [: :] turns a reflection back into code. Here it means obj.name, then obj.hp, then obj.speed.")],
        ]}
      />
      <p>
        {tx(t, "cpp26_reflBody",
          "Everything happens while compiling. The compiler reads Player's definition, which it knows anyway, and the template for writes three ordinary println calls, as if you had typed them; the program contains no list of names to search at run time. Compare the two versions below and break the hand-written one.")}
      </p>
      <ReflectFigure t={t} />

      <H3>{tx(t, "cpp26_enumTitle", "Enum to string, without the switch")}</H3>
      <CodeBlock lang="cpp" filename="enum_name.cpp" t={t}>{`enum class Weapon { Sword, Bow, Staff };

template <typename E>
constexpr std::string_view enum_name(E value) {
    template for (constexpr auto e : std::define_static_array(std::meta::enumerators_of(^^E)))
        if (value == [:e:]) return std::meta::identifier_of(e);
    return "?";
}

std::println("{}", enum_name(Weapon::Bow));    // Bow`}</CodeBlock>
      <p>
        {tx(t, "cpp26_enumBody",
          "enumerators_of lists Sword, Bow and Staff, and the template for writes one if per enumerator: if (value == Weapon::Sword) return \"Sword\"; and so on. Add Axe to the enum and the function knows it at the next build. Libraries such as magic_enum faked this for years with compiler tricks and limits on the enum's range; reflection makes it ordinary code. The same pattern builds serialisers, command-line parsers, editors for game objects and bindings to scripting languages, which is why it was the most awaited feature of the release.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "cpp26_reflNote",
          "In GCC 16 reflection must be switched on with -freflection, and the header is <meta>. The library is large (hundreds of functions in std::meta) and the details may still change slightly as compilers catch up with the final standard text; the shape shown here compiled and ran as printed with g++ 16.2.")}
      </Callout>

      <H2>{tx(t, "cpp26_contractsTitle", "Contracts")}</H2>
      <CodeBlock lang="cpp" filename="contracts.cpp" t={t}>{`int checked_div(int a, int b) pre(b != 0) { return a / b; }

checked_div(6, 3);   // 2
checked_div(1, 0);   // g++ 16.2 -std=c++26 -fcontracts:
// contract violation in function int checked_div(int, int) at example.cpp:6: b != 0
// [assertion_kind: pre, semantic: enforce, mode: predicate_false, terminating: yes]
// terminate called without an active exception`}</CodeBlock>
      <p>
        {tx(t, "cpp26_contractsBody",
          "Contracts (the Error Handling chapter introduced pre, post and contract_assert) are the other big language feature of C++26. The message tells you which kind of check failed (a precondition), the condition, and the semantic in force: enforce, which reports and terminates. Other semantics are observe (report and continue) and ignore, chosen when building, so the same code can check everything in testing and nothing in a shipping build.")}
      </p>

      <H2>{tx(t, "cpp26_ebTitle", "Uninitialised variables: from undefined to erroneous")}</H2>
      <CodeBlock lang="cpp" filename="uninit.cpp" t={t}>{`int lives;                 // no initialiser
if (argc > 1) lives = 3;
std::println("{}", lives); // C++23: undefined behaviour. C++26: erroneous behaviour`}</CodeBlock>
      <p>
        {tx(t, "cpp26_ebBody",
          "Reading an uninitialised variable used to be undefined behaviour, and the Tooling chapter shows what that means in practice: g++ -O2 printed 3 for this program run with no arguments, having decided that the branch that sets it must happen. C++26 calls it erroneous behaviour instead: still a bug, and compilers are encouraged to warn about it, but the read gives some fixed value rather than licence for the optimiser to assume anything. When a variable really should start uninitialised, for a large buffer about to be filled, you say so explicitly with the [[indeterminate]] attribute.")}
      </p>

      <H2>{tx(t, "cpp26_restTitle", "The rest of the release")}</H2>
      <LessonTable
        headers={[tx(t, "cpp26_hFeature", "Feature"), tx(t, "cpp26_hExample", "Example"), tx(t, "cpp26_hGives", "What it gives")]}
        rows={[
          [tx(t, "cpp26_f1k", "pack indexing"), "Ts...[0]", tx(t, "cpp26_f1", "The first type of a parameter pack, directly, without recursive templates (the Templates chapter).")],
          [tx(t, "cpp26_f2k", "deleted with a reason"), "= delete(\"use new_api\")", tx(t, "cpp26_f2", "The message appears in the error: use of deleted function 'void old_api(int)': use new_api(int, Options) instead.")],
          [tx(t, "cpp26_f3k", "the _ placeholder"), "auto [x, _] = f();", tx(t, "cpp26_f3", "A name for things you ignore, usable many times (the Vocabulary Types chapter). Already in GCC 14.")],
          ["#embed", "#embed \"icon.png\"", tx(t, "cpp26_f4", "Puts a file's bytes into an array initialiser while compiling, replacing scripts that turn files into giant hex arrays. Taken from C23.")],
          ["std::inplace_vector<T, N>", "inplace_vector<int, 4>", tx(t, "cpp26_f5", "A vector with a fixed maximum capacity stored inside the object: no heap, ideal for small lists in games.")],
          ["std::execution", "senders, schedulers", tx(t, "cpp26_f6", "A standard model for asynchronous work (the Concurrency chapter). Not in GCC 16.2's library yet.")],
          ["std::simd", "simd<float>", tx(t, "cpp26_f7", "Portable vector types: one operation on several floats at once. Not in GCC 16.2's library yet.")],
          [tx(t, "cpp26_f8k", "more constexpr"), "std::sin in constexpr", tx(t, "cpp26_f8", "Most of <cmath>, exceptions and more containers usable at compile time.")],
          [tx(t, "cpp26_f9k", "hardened standard library"), "v[10] on a 3-element vector", tx(t, "cpp26_f9", "An optional mode in which operator[], front() and similar check their preconditions and stop the program instead of reading out of bounds.")],
        ]}
      />

      <H2>{tx(t, "cpp26_supportTitle", "What does my compiler have?")}</H2>
      <CodeBlock lang="cpp" filename="feature_test.cpp" t={t}>{`#include <version>

#if defined(__cpp_impl_reflection)
    // reflection available: g++ 16.2 -freflection reports 202603
#endif
#if defined(__cpp_lib_senders)
    // std::execution available: not defined in g++ 16.2
#endif`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cpp26_hMacro", "Feature-test macro"), tx(t, "cpp26_hValue", "g++ 16.2 (-std=c++26 -freflection -fcontracts)")]}
        rows={[
          ["__cpp_impl_reflection", "202603"],
          ["__cpp_expansion_statements", "202506"],
          ["__cpp_contracts", "202502"],
          ["__cpp_pack_indexing", "202311"],
          ["__cpp_deleted_function", "202403"],
          ["__cpp_lib_inplace_vector", "202603"],
          ["__cpp_lib_senders", tx(t, "cpp26_notDef", "not defined")],
          ["__cpp_lib_simd", tx(t, "cpp26_notDef", "not defined")],
        ]}
      />
      <p>
        {tx(t, "cpp26_supportBody",
          "Every feature has a feature-test macro whose value is the year and month of the version of the proposal that was implemented. Testing the macro, rather than the compiler's version number, lets one source file use a feature where it exists and fall back where it does not. cppreference.com keeps a table of which compiler supports what.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "cpp26_adoptTip",
          "A reasonable order: the small conveniences first (_, delete with a reason, pack indexing), since they cost nothing; then contracts in debug builds; then reflection for code you currently maintain by hand, such as serialisers and enum names, in one place, behind a feature-test macro. Wait for library support before planning around std::execution or std::simd.")}
      </Callout>

      <H2>{tx(t, "cpp26_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cpp26_try1", "On Compiler Explorer, choose x86-64 gcc 16 and the flags -std=c++26 -freflection, and run print_fields on a struct of your own with five members.")}</li>
        <li>{tx(t, "cpp26_try2", "Write the reverse of enum_name: std::optional<Weapon> enum_from_name(std::string_view s), returning std::nullopt for an unknown name.")}</li>
        <li>{tx(t, "cpp26_try3", "Change print_fields to write one JSON object, {\"name\": \"Ada\", \"hp\": 90}, putting quotes only around strings. if constexpr on the member's type helps; std::meta::type_of(m) gives it as a reflection.")}</li>
        <li>{tx(t, "cpp26_try4", "Give checked_div a postcondition that the result times b is at most a, and build once with -fcontracts and once without. Compare the behaviour of checked_div(1, 0).")}</li>
      </ol>

      <KeyIdeas t={t} id="cpp26" items={[
        "Static reflection lets code ask, while compiling, for the members of a struct or the enumerators of an enum.",
        "^^ makes a reflection, std::meta functions query it, [: :] splices it back into code, and template for writes code once per element.",
        "Code generated from the struct's definition cannot fall behind it, unlike hand-written printers and serialisers.",
        "Contracts check pre- and postconditions with a semantic chosen at build time: enforce, observe or ignore.",
        "Reading an uninitialised variable becomes erroneous behaviour: still a bug, but no longer licence for the optimiser to assume anything.",
        "Check feature-test macros: GCC 16.2 has reflection and contracts, but not yet std::execution or std::simd.",
      ]} />
    </Article>
  );
}
