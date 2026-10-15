"use client";

// Standard Library 2: error handling. Starts from a game loading its save
// file, where four different things can go wrong; then the C way (return
// codes, errno, [[nodiscard]]), exceptions (throw, try, catch, stack
// unwinding; figure: one missing file with an exception and with
// std::expected, plus the break-it cases), the standard exception family,
// noexcept, the exception-safety guarantees, the cost, std::optional,
// std::expected and its chaining, bugs against errors (assert, C++26
// contracts), and a closing decision table.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { UnwindFigure } from "@/components/lesson/figures/cpp/UnwindFigure";

export function ErrorsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cppErr_intro",
          "A game starts and loads its save file. On the very first launch the file does not exist yet, and that is perfectly normal. Sometimes it exists but is corrupted, and the player deserves to know why. Very rarely the machine runs out of memory halfway through, far away from any code that could do something about it. And sometimes the loader is simply wrong, because we passed it slot 7 of a 3-slot list. These are four different kinds of failure, and C++ has a different tool for each. Most of error handling is choosing the right one.")}
      </Lead>

      <Goals t={t} id="cppErr" items={[
        "Tell apart an absent value, an expected failure, an exceptional one and a bug.",
        "Throw and catch exceptions, and explain what stack unwinding does to each frame.",
        "Return errors as values with std::optional and std::expected, and chain them.",
        "Say what noexcept promises and why exceptions are slow only when thrown.",
      ]} />

      <H2>{tx(t, "cppErr_kindsTitle", "Four kinds of failure")}</H2>
      <LessonTable
        headers={[tx(t, "cppErr_hKind", "Kind"), tx(t, "cppErr_hEx", "In the save loader"), tx(t, "cppErr_hTool", "Tool")]}
        rows={[
          [tx(t, "cppErr_k1", "Absence: no answer, and that is normal"), tx(t, "cppErr_k1e", "No save file yet"), "std::optional"],
          [tx(t, "cppErr_k2", "Expected failure, with a reason the caller can act on"), tx(t, "cppErr_k2e", "The file is corrupted, or its version is too new"), "std::expected"],
          [tx(t, "cppErr_k3", "Exceptional failure, handled far from where it happens"), tx(t, "cppErr_k3e", "Out of memory, the disk vanished"), tx(t, "cppErr_k3t", "an exception")],
          [tx(t, "cppErr_k4", "A bug: the calling code is wrong"), tx(t, "cppErr_k4e", "Slot 7 of a 3-slot list"), tx(t, "cppErr_k4t", "assert, contracts")],
        ]}
      />

      <H2>{tx(t, "cppErr_cTitle", "The C way: return codes")}</H2>
      <CodeBlock lang="cpp" filename="load.c" t={t}>{`int load_save(const char* path, Save* out) {   // 0 = success, -1 = failure
    FILE* f = fopen(path, "rb");
    if (!f) return -1;                          // errno says why: ENOENT, EACCES…
    /* ... */
    fclose(f);
    return 0;
}

Save s;
load_save("slot1.sav", &s);                     // the result is ignored: nothing stops you`}</CodeBlock>
      <p>
        {tx(t, "cppErr_cBody",
          "C reports failure through the return value, so the real result has to travel through an out parameter, here Save* out. The reason sits in errno, a global variable that the next library call may overwrite (the Input, Output & Files chapter covers it). And nothing forces the caller to look: forgetting the check compiles silently. C++17's [[nodiscard]] attribute fixes that last part: on a function, it makes the compiler warn when the result is thrown away.")}
      </p>
      <CodeBlock lang="cpp" filename="nodiscard.cpp" t={t}>{`[[nodiscard]] int load_save(const char* path, Save* out);

load_save("slot1.sav", &s);
// warning: ignoring return value of 'int load_save(const char*, Save*)', declared with attribute 'nodiscard'`}</CodeBlock>

      <H2>{tx(t, "cppErr_excTitle", "Exceptions: throw, try, catch")}</H2>
      <CodeBlock lang="cpp" filename="exceptions.cpp" t={t}>{`#include <stdexcept>

Save load_save(const std::string& path) {
    std::ifstream f{path, std::ios::binary};
    if (!f) throw std::runtime_error("cannot open " + path);
    return parse(f);                       // never reached after a throw
}

int main() {
    try {
        Save s = load_save("slot1.sav");
        play(s);
    } catch (const std::exception& e) {
        std::println("error: {}", e.what());
    }
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppErr_hPart", "Part"), tx(t, "cppErr_hMeans", "What it means")]}
        rows={[
          ["throw expr", tx(t, "cppErr_e1", "Creates an exception object from expr and leaves the function at once. Any value can be thrown; by convention it is a class derived from std::exception.")],
          ["try { … }", tx(t, "cppErr_e2", "Marks code whose exceptions this function is ready to handle.")],
          ["catch (const T& e)", tx(t, "cppErr_e3", "A handler for exceptions of type T or any class derived from T. Catching by const reference avoids a copy and keeps the real derived type.")],
          ["e.what()", tx(t, "cppErr_e4", "The message, a const char*, from the virtual function every std::exception has.")],
        ]}
      />
      <p>
        {tx(t, "cppErr_unwindBody",
          "The interesting part is what happens between the throw and the catch. The runtime walks up the call stack looking for a try with a matching catch. Every function it passes is left immediately, and before its frame disappears, the destructors of its local objects run, in reverse order of construction. This is stack unwinding, and it is the reason RAII (the RAII & Smart Pointers chapter) matters so much: cleanup that lives in a destructor happens on every exit, including this one. Step through it, then break it.")}
      </p>
      <UnwindFigure t={t} />
      <p>
        {tx(t, "cppErr_unwindAfter",
          "The raw new is the classic bug: the delete is an ordinary line, and an exception jumps over ordinary lines. Only destructors are guaranteed to run. The other two break cases end in std::terminate, which kills the program. The standard lets the compiler decide whether destructors run first in that case, and g++ does not run any, so do not count on cleanup when nobody catches.")}
      </p>

      <H3>{tx(t, "cppErr_familyTitle", "The standard exception family")}</H3>
      <LessonTable
        headers={[tx(t, "cppErr_hClass", "Class"), tx(t, "cppErr_hFor", "Thrown for"), tx(t, "cppErr_hBy", "Thrown by, for example")]}
        rows={[
          ["std::exception", tx(t, "cppErr_f1", "The base of them all: catch it to catch everything standard."), "—"],
          ["std::logic_error", tx(t, "cppErr_f2", "Mistakes in the calling code, detectable before running."), "—"],
          ["  std::out_of_range", tx(t, "cppErr_f3", "An index or key that is not there."), "v.at(10), m.at(key)"],
          ["  std::invalid_argument", tx(t, "cppErr_f4", "An argument with no sensible meaning."), "std::stoi(\"abc\")"],
          ["std::runtime_error", tx(t, "cppErr_f5", "Problems only visible while running."), tx(t, "cppErr_f5b", "your own code")],
          ["  std::system_error", tx(t, "cppErr_f6", "A failure reported by the operating system, with an error code."), "std::thread, std::filesystem"],
          ["std::bad_alloc", tx(t, "cppErr_f7", "new could not get memory."), "new, push_back"],
        ]}
      />
      <CodeBlock lang="cpp" filename="catch_order.cpp" t={t}>{`try {
    int slot = std::stoi(input);
    load(saves.at(slot));
} catch (const std::out_of_range& e) {      // most specific first
    std::println("no such slot");
} catch (const std::exception& e) {         // then the general case
    std::println("error: {}", e.what());
} catch (...) {                             // anything at all, even a thrown int
    std::println("unknown error");
}`}</CodeBlock>
      <p>
        {tx(t, "cppErr_orderBody",
          "Handlers are tried from top to bottom and the first one that matches wins. Put std::exception first and it would swallow out_of_range too; g++ even warns about it. catch (...) catches anything, but gives you no object to inspect.")}
      </p>

      <H3>{tx(t, "cppErr_noexTitle", "noexcept: the promise not to throw")}</H3>
      <CodeBlock lang="cpp" filename="noexcept.cpp" t={t}>{`void swap(Buffer& a, Buffer& b) noexcept;   // promises: no exception leaves this function

Buffer(Buffer&& other) noexcept;             // a move constructor that cannot fail
~Buffer();                                   // destructors are noexcept without saying so`}</CodeBlock>
      <p>
        {tx(t, "cppErr_noexBody",
          "noexcept is part of a function's interface. The compiler does not check it: if an exception tries to leave a noexcept function anyway, std::terminate is called, as the figure showed. Callers use the promise. std::vector, when it grows, moves its elements to the new memory only if the move constructor is noexcept; otherwise it copies them, because a move that fails halfway would leave both buffers broken (the Move Semantics chapter). Destructors are noexcept by default, which is why a destructor must never throw.")}
      </p>

      <H3>{tx(t, "cppErr_safeTitle", "Exception safety: what is left after a throw")}</H3>
      <LessonTable
        headers={[tx(t, "cppErr_hGuar", "Guarantee"), tx(t, "cppErr_hProm", "After an exception, the object…"), tx(t, "cppErr_hEg", "Example")]}
        rows={[
          [tx(t, "cppErr_g1k", "no-throw"), tx(t, "cppErr_g1", "…is fine, because nothing can throw."), "swap, destructors, noexcept moves"],
          [tx(t, "cppErr_g2k", "strong"), tx(t, "cppErr_g2", "…is exactly as it was before the call: all or nothing."), "vector::push_back"],
          [tx(t, "cppErr_g3k", "basic"), tx(t, "cppErr_g3", "…is valid, with nothing leaked, but its contents may have changed."), tx(t, "cppErr_g3e", "most operations")],
        ]}
      />
      <p>
        {tx(t, "cppErr_safeBody",
          "A simple way to get the strong guarantee is to do the risky work on a copy, and only swap it in once everything has succeeded. If the work throws, the original is untouched; the swap itself cannot throw.")}
      </p>

      <H3>{tx(t, "cppErr_costTitle", "What exceptions cost")}</H3>
      <p>
        {tx(t, "cppErr_costBody",
          "g++ and Clang use table-based exceptions, often called zero-cost: while nothing is thrown, the try costs no instructions. The price is paid elsewhere. Unwinding tables make the program larger, and a throw is slow: the runtime has to search those tables frame by frame, which takes microseconds where a return takes nanoseconds. So exceptions suit failures that are truly rare, and are a poor way to report something that happens every frame.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "cppErr_noexcWarn",
          "Many game engines build with -fno-exceptions, which removes the tables and makes throw a compile error. The standard library still throws, though: at(), std::stoi, and every allocation that fails. With exceptions off, those calls abort the program instead. Either accept that, or stay away from the throwing parts.")}
      </Callout>

      <H2>{tx(t, "cppErr_optTitle", "std::optional: maybe a value")}</H2>
      <CodeBlock lang="cpp" filename="optional.cpp" t={t}>{`#include <optional>

std::optional<Save> find_save(int slot) {
    if (!exists(slot)) return std::nullopt;      // no value, and that is normal
    return read_save(slot);                      // a Save, wrapped automatically
}

if (auto s = find_save(1)) {                     // true if it holds a value
    play(*s);                                    // * reaches the Save inside
}
int level = find_save(1).transform(&Save::level).value_or(1);   // C++23`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppErr_hOp", "Operation"), tx(t, "cppErr_hMeans", "What it means")]}
        rows={[
          ["std::nullopt", tx(t, "cppErr_o1", "The empty state: \"no value\".")],
          ["if (s) / s.has_value()", tx(t, "cppErr_o2", "Is there a value?")],
          ["*s, s->level", tx(t, "cppErr_o3", "The value inside. On an empty optional this is undefined behaviour, like a null pointer.")],
          ["s.value()", tx(t, "cppErr_o4", "The value, or a std::bad_optional_access exception when empty.")],
          ["s.value_or(x)", tx(t, "cppErr_o5", "The value, or x when empty.")],
          ["s.transform(f)", tx(t, "cppErr_o6", "C++23: an optional of f(value), or empty when s is empty. No if needed.")],
        ]}
      />
      <p>
        {tx(t, "cppErr_optBody",
          "An optional stores the value inside itself, next to a bool that says whether it is there. No heap allocation is involved. Use it when \"nothing\" is a normal answer: a search that found nothing, a setting the player never chose. It says nothing about why the value is missing, and when the caller needs to know why, that is the job of the next type.")}
      </p>

      <H2>{tx(t, "cppErr_expTitle", "std::expected: a value or the reason")}</H2>
      <CodeBlock lang="cpp" filename="expected.cpp" t={t}>{`#include <expected>

enum class SaveError { Missing, Corrupted, TooNew };

std::expected<Save, SaveError> load_save(int slot) {
    if (!exists(slot))           return std::unexpected(SaveError::Missing);
    auto bytes = read_bytes(slot);
    if (!checksum_ok(bytes))     return std::unexpected(SaveError::Corrupted);
    if (version(bytes) > kVersion) return std::unexpected(SaveError::TooNew);
    return parse(bytes);         // a Save: becomes the value
}

auto r = load_save(1);
if (r) {
    play(*r);
} else if (r.error() == SaveError::Corrupted) {
    std::println("The save is damaged. Start a new game?");
}`}</CodeBlock>
      <p>
        {tx(t, "cppErr_expBody",
          "std::expected<T, E>, from C++23, holds either a T (the expected result) or an E (the error). Returning a T fills in the value; std::unexpected(e) marks the error. It works like optional, with *r, r.value() and if (r), plus r.error() to read the reason. The failure is now in the function's signature, where every reader sees it, and the cost is the same as a normal return.")}
      </p>
      <CodeBlock lang="cpp" filename="chain.cpp" t={t}>{`auto level = load_save(1)                     // expected<Save, SaveError>
    .and_then(validate)                       // Save → expected<Save, SaveError>
    .transform(&Save::level)                  // Save → int
    .or_else([](SaveError e) -> std::expected<int, SaveError> {
        if (e == SaveError::Missing) return 1;    // no save yet: start at level 1
        return std::unexpected(e);                // other errors go on
    });`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppErr_hOp", "Operation"), tx(t, "cppErr_hValue", "When it holds a value"), tx(t, "cppErr_hError", "When it holds an error")]}
        rows={[
          ["and_then(f)", tx(t, "cppErr_c1", "Calls f(value); f returns a new expected, which may fail."), tx(t, "cppErr_skip", "Skips f and passes the error on.")],
          ["transform(f)", tx(t, "cppErr_c2", "Calls f(value), which cannot fail, and wraps its result."), tx(t, "cppErr_skip", "Skips f and passes the error on.")],
          ["or_else(f)", tx(t, "cppErr_c3", "Passes the value on."), tx(t, "cppErr_c3e", "Calls f(error), which may recover with a value or return an error.")],
          ["transform_error(f)", tx(t, "cppErr_c4", "Passes the value on."), tx(t, "cppErr_c4e", "Turns the error into another error, e.g. an enum into a message.")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "cppErr_nodiscardNote",
          "In libstdc++ 14, std::expected is not marked [[nodiscard]], so a call whose result is ignored compiles without a word, as the figure's last break case showed. Put [[nodiscard]] on your own functions that return expected.")}
      </Callout>

      <H2>{tx(t, "cppErr_bugTitle", "Bugs are not errors: assert and contracts")}</H2>
      <CodeBlock lang="cpp" filename="assert.cpp" t={t}>{`#include <cassert>

Save& slot_at(std::vector<Save>& saves, int i) {
    assert(i >= 0 && i < std::ssize(saves));   // checked in debug, removed with -DNDEBUG
    return saves[i];
}`}</CodeBlock>
      <p>
        {tx(t, "cppErr_bugBody",
          "Slot 7 of a 3-slot list is not something the program can recover from, because the code that asked for it is wrong. Returning an error would only spread the bug. assert checks the condition and, when it is false, prints the file, the line and the condition and aborts, right where the mistake shows. Release builds define NDEBUG, which removes the check completely. std::ssize returns the size as a signed number, so the comparison with the int i is not between signed and unsigned.")}
      </p>
      <CodeBlock lang="cpp" filename="contracts.cpp" t={t}>{`// C++26
Save& slot_at(std::vector<Save>& saves, int i)
    pre(i >= 0 && i < std::ssize(saves))     // the caller must make this true
    post(r: r.version <= kVersion)           // the function promises this; r names the result
{
    contract_assert(!saves.empty());         // a check inside the body
    return saves[i];
}`}</CodeBlock>
      <p>
        {tx(t, "cppErr_contractBody",
          "C++26 contracts move these checks into the declaration. pre is a precondition, a duty of the caller; post is a postcondition, a promise of the function; contract_assert replaces assert inside the body. Because they are part of the declaration, tools and readers see them without opening the function. How violations are handled (ignore, observe and continue, or stop) is chosen when building, not in the code.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "cppErr_contractNote",
          "Contracts are among the newest C++26 features. Compilers are adding them during 2026, at first behind a flag such as -fcontracts. Check your compiler's release notes before using them; assert works everywhere today.")}
      </Callout>

      <H2>{tx(t, "cppErr_chooseTitle", "Choosing")}</H2>
      <LessonTable
        headers={[tx(t, "cppErr_hSit", "Situation"), tx(t, "cppErr_hUse", "Use")]}
        rows={[
          [tx(t, "cppErr_s1", "The answer may legitimately be missing"), "std::optional<T>"],
          [tx(t, "cppErr_s2", "The operation can fail and the caller should react"), "std::expected<T, E>"],
          [tx(t, "cppErr_s3", "A constructor fails: there is no return value to use"), tx(t, "cppErr_u3", "throw, or a static create() that returns expected")],
          [tx(t, "cppErr_s4", "Rare failure, handled many calls away"), tx(t, "cppErr_u4", "throw")],
          [tx(t, "cppErr_s5", "The calling code is wrong"), tx(t, "cppErr_u5", "assert, contracts")],
          [tx(t, "cppErr_s6", "Exceptions are switched off"), tx(t, "cppErr_u6", "expected everywhere, abort for the unrecoverable")],
        ]}
      />

      <H2>{tx(t, "cppErr_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cppErr_try1", "Give a class a destructor that prints its name. Create three of them in three nested functions, throw from the innermost, and catch in main. Check the order of the lines against the figure. Then remove the catch and run again.")}</li>
        <li>{tx(t, "cppErr_try2", "Write std::expected<int, std::string> parse_int(std::string_view s) using std::from_chars, and chain it with transform to double the number. Try \"42\", \"x\" and \"\".")}</li>
        <li>{tx(t, "cppErr_try3", "Add a move constructor without noexcept to a class that prints \"copy\" and \"move\". push_back five of them into a vector and count the copies when it grows. Add noexcept and count again.")}</li>
        <li>{tx(t, "cppErr_try4", "Put catch (const std::exception&) above catch (const std::out_of_range&) and read g++'s warning.")}</li>
      </ol>

      <KeyIdeas t={t} id="cppErr" items={[
        "Absence, an expected failure, a rare failure and a bug are different things: optional, expected, exceptions, assert.",
        "A throw leaves every function up to the matching catch, and each frame's destructors run on the way: stack unwinding.",
        "Only destructors run during unwinding, so cleanup belongs in RAII objects, never in a line after the risky call.",
        "An exception that nobody catches, or that leaves a noexcept function, calls std::terminate.",
        "Exceptions cost nothing until thrown, and a throw is slow; use them for what is truly exceptional.",
        "std::expected puts the failure in the signature; and_then, transform and or_else chain steps without nested ifs.",
      ]} />
    </Article>
  );
}
