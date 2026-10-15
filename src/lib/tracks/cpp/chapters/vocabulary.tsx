"use client";

// Standard Library 3: vocabulary types. Starts from three libraries that each
// spell "some text" differently; then the list of standard words, string_view
// (figure: pointer and length over a string's buffer, a slice, and the three
// ways a view dangles), the rules for views and the small string
// optimisation, span, optional in one paragraph, variant with visit and the
// overloaded trick, any, pair/tuple and structured bindings, and std::format /
// std::print with the format mini-language and a formatter for your own type.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { StringViewFigure } from "@/components/lesson/figures/cpp/StringViewFigure";

export function VocabularyContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cppVoc_intro",
          "A game uses three libraries. The logger wants a const char*. The UI toolkit wants a std::string. The physics engine has its own String class. Passing one player name through all three means converting and copying it twice, and every conversion is a chance for a bug. The cure is not a better string class; it is agreement. Vocabulary types are the standard's shared words for ideas every program needs: \"some characters I am looking at\", \"maybe a number\", \"one of these three things\". When two libraries that have never met both use them, they can talk without translators.")}
      </Lead>

      <Goals t={t} id="cppVoc" items={[
        "Pass text and arrays you do not own with string_view and span, and know when they dangle.",
        "Hold one of several types with variant and handle every case with visit.",
        "Unpack pairs, tuples and structs with structured bindings.",
        "Format output with std::format and std::println, including your own types.",
      ]} />

      <H2>{tx(t, "cppVoc_wordsTitle", "The shared words")}</H2>
      <LessonTable
        headers={[tx(t, "cppVoc_hType", "Type"), tx(t, "cppVoc_hSays", "It says"), tx(t, "cppVoc_hSince", "Since")]}
        rows={[
          ["std::string_view", tx(t, "cppVoc_w1", "Some characters I look at but do not own."), "C++17"],
          ["std::span<T>", tx(t, "cppVoc_w2", "Some Ts in a row that I look at but do not own."), "C++20"],
          ["std::optional<T>", tx(t, "cppVoc_w3", "A T, or nothing."), "C++17"],
          ["std::expected<T, E>", tx(t, "cppVoc_w4", "A T, or the reason there is none (the Error Handling chapter)."), "C++23"],
          ["std::variant<A, B, C>", tx(t, "cppVoc_w5", "Exactly one of A, B or C, and I know which."), "C++17"],
          ["std::any", tx(t, "cppVoc_w6", "One value of any type at all."), "C++17"],
          ["std::pair, std::tuple", tx(t, "cppVoc_w7", "Two, or several, values travelling together."), "C++98 / C++11"],
          ["std::function", tx(t, "cppVoc_w8", "Something I can call (the Lambdas chapter)."), "C++11"],
        ]}
      />

      <H2>{tx(t, "cppVoc_svTitle", "string_view: characters you do not own")}</H2>
      <CodeBlock lang="cpp" filename="string_view.cpp" t={t}>{`#include <string_view>

// Before: one overload per kind of text, or a const std::string& that
// forces an allocation when called with a literal
void log(const char* msg);
void log(const std::string& msg);

// After: one function that accepts every kind of text, and copies none
void log(std::string_view msg);

log("level loaded");                 // a literal: no allocation
log(player.name);                    // a std::string: no copy
log(std::string_view{buf, len});     // part of a char buffer`}</CodeBlock>
      <p>
        {tx(t, "cppVoc_svBody",
          "A std::string_view is two things: a pointer to the first character and a length. It owns nothing and never allocates, so making one, copying one and slicing one are all nearly free. Anything that holds characters in a row can be viewed: a literal, a std::string, a C buffer. Because it carries its length, it does not need a '\\0' at the end, and that is both its strength and, as the last program below shows, a trap. Step through the four programs.")}
      </p>
      <StringViewFigure t={t} />
      <p>
        {tx(t, "cppVoc_svAfter",
          "All three bugs have the same shape: the view outlived, or outgrew, the memory it looks at, or was handed to code that ignores its length. The compiler does not catch any of them here; AddressSanitizer (-fsanitize=address) catches the first two the moment the freed memory is read.")}
      </p>
      <LessonTable
        headers={[tx(t, "cppVoc_hUse", "Use string_view for"), tx(t, "cppVoc_hAvoid", "Avoid it for")]}
        rows={[
          [tx(t, "cppVoc_u1", "Function parameters that only read text."), tx(t, "cppVoc_a1", "Class members, unless the owner is guaranteed to outlive the object.")],
          [tx(t, "cppVoc_u2", "Local variables that slice a string you keep alive."), tx(t, "cppVoc_a2", "Return values that point into a local or a temporary.")],
          [tx(t, "cppVoc_u3", "Parsing: walking through a big buffer piece by piece."), tx(t, "cppVoc_a3", "Calling C functions that expect a '\\0': convert to std::string first.")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "cppVoc_ssoNote",
          "The figure uses strings longer than 15 characters on purpose. libstdc++ keeps strings of up to 15 characters inside the std::string object itself, with no heap buffer at all: the small string optimisation. A view of such a string points into the string object, on the stack, and dangles just the same when that object dies or moves.")}
      </Callout>

      <H2>{tx(t, "cppVoc_spanTitle", "span: the same idea for arrays")}</H2>
      <CodeBlock lang="cpp" filename="span.cpp" t={t}>{`#include <span>

float average(std::span<const float> xs) {        // any contiguous floats
    float sum = 0;
    for (float x : xs) sum += x;
    return xs.empty() ? 0 : sum / xs.size();
}

float raw[4] = {1, 2, 3, 4};
std::vector<float> vec{5, 6, 7};
std::array<float, 3> arr{8, 9, 10};

average(raw);  average(vec);  average(arr);        // one function for all three
average(std::span{vec}.subspan(1, 2));             // 6 and 7 only: no copy
average(std::span{raw}.first(2));                  // 1 and 2`}</CodeBlock>
      <p>
        {tx(t, "cppVoc_spanBody",
          "A std::span<T> is a pointer and a count of Ts, the C pair (float* data, size_t n) made into one object that cannot get the two out of sync. span<const float> only reads; span<float> may change the elements, but never add or remove any. subspan(offset, count), first(n) and last(n) slice it without copying. The dangling rules are those of string_view: a span is only valid while the array it looks at is alive and has not moved, so a vector's push_back can invalidate it.")}
      </p>

      <H2>{tx(t, "cppVoc_optTitle", "optional, in one paragraph")}</H2>
      <p>
        {tx(t, "cppVoc_optBody",
          "std::optional<T> holds a T or nothing, inside itself, with a bool next to it to say which. It is the right return type for a search or a setting that may be missing. The Error Handling chapter covers its operations: if (opt), *opt, value_or and transform.")}
      </p>

      <H2>{tx(t, "cppVoc_varTitle", "variant: exactly one of several types")}</H2>
      <CodeBlock lang="cpp" filename="variant.cpp" t={t}>{`#include <variant>

struct Circle { float r; };
struct Rect   { float w, h; };
struct Tri    { float base, height; };

using Shape = std::variant<Circle, Rect, Tri>;

Shape s = Rect{2, 3};                         // s holds a Rect now
s = Circle{1};                                // the Rect is destroyed, s holds a Circle

if (std::holds_alternative<Circle>(s))        // which one is it?
    std::println("radius {}", std::get<Circle>(s).r);

if (auto* r = std::get_if<Rect>(&s))          // a pointer, or nullptr if s is not a Rect
    std::println("{} x {}", r->w, r->h);

std::get<Rect>(s);                            // s is a Circle: throws std::bad_variant_access`}</CodeBlock>
      <p>
        {tx(t, "cppVoc_varBody",
          "A variant is the safe version of the tagged union from the Strings, Structs & Unions chapter. It has room for the largest alternative plus a small tag saying which one is alive, and it keeps the tag right for you: assigning a Circle destroys the Rect first. Asking for the wrong alternative with std::get throws instead of reading garbage. For Shape, sizeof is 12: 8 bytes of room for the largest alternatives (Rect and Tri, two floats each), plus the tag, padded to a multiple of 4.")}
      </p>
      <H3>{tx(t, "cppVoc_visitTitle", "visit: handle every alternative")}</H3>
      <CodeBlock lang="cpp" filename="visit.cpp" t={t}>{`template <class... Fs>
struct overloaded : Fs... { using Fs::operator()...; };

float area(const Shape& s) {
    return std::visit(overloaded{
        [](const Circle& c) { return 3.14159f * c.r * c.r; },
        [](const Rect& r)   { return r.w * r.h; },
        [](const Tri& t)    { return 0.5f * t.base * t.height; },
    }, s);
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppVoc_hLine", "Line"), tx(t, "cppVoc_hMeans", "What it means")]}
        rows={[
          ["template <class... Fs>", tx(t, "cppVoc_v1", "A template over any number of types: here, the types of the lambdas.")],
          [": Fs...", tx(t, "cppVoc_v2", "overloaded inherits from every lambda type at once, so it has all their call operators.")],
          ["using Fs::operator()...;", tx(t, "cppVoc_v3", "Brings all those operator() into one overload set, so the compiler can pick by argument type (the References, Overloading & Namespaces chapter).")],
          ["std::visit(f, s)", tx(t, "cppVoc_v4", "Looks at s's tag and calls f with the alternative that is alive, as its real type.")],
        ]}
      />
      <p>
        {tx(t, "cppVoc_visitBody",
          "The real gain is exhaustiveness. Add a Hexagon to Shape and every visit that has no lambda for it stops compiling, pointing you to each place that needs updating. With a base class and virtual functions (the Inheritance chapter) the trade-off is reversed: adding a new shape is easy, adding a new operation means touching every class. variant suits a closed set of types that many operations work on.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "cppVoc_anyNote",
          "std::any holds one value of any type and remembers the type; std::any_cast<int>(a) gets it back, or throws if the type is wrong. Large values go on the heap. Since you cannot list what it may contain, nothing can check that you handled every case. Prefer variant whenever the set of types is known.")}
      </Callout>

      <H2>{tx(t, "cppVoc_bindTitle", "pair, tuple and structured bindings")}</H2>
      <CodeBlock lang="cpp" filename="bindings.cpp" t={t}>{`std::pair<std::string, int> best{"Ada", 9200};
std::tuple<float, float, float> pos{1.0f, 2.5f, -3.0f};

auto [name, score] = best;                         // name = "Ada", score = 9200
auto [x, y, z] = pos;
auto [w, h] = Rect{2, 3};                          // works for plain structs too

std::map<std::string, int> scores = load_scores();
for (const auto& [player, points] : scores)        // each element is a pair<const string, int>
    std::println("{}: {}", player, points);

if (auto [it, inserted] = scores.try_emplace("Bob", 0); inserted)
    std::println("new player");

auto [value, _] = parse_with_status();             // C++26: _ means "ignored"`}</CodeBlock>
      <p>
        {tx(t, "cppVoc_bindBody",
          "std::pair holds two values, reached as .first and .second; std::tuple holds any number, reached as std::get<0>(t). Both are handy inside the library and poor in your own interfaces, because .first says nothing; a small struct with named members is usually clearer. A structured binding (C++17) gives the parts names in one line. auto [a, b] = x makes a hidden copy of x and names its parts; auto& [a, b] = x names the parts of x itself. try_emplace returns a pair (an iterator to the element, and whether it was inserted), and the if with an initialiser keeps both names inside the if. Since C++26, _ can be used for parts you do not need, as many times as you like.")}
      </p>

      <H2>{tx(t, "cppVoc_fmtTitle", "format and print")}</H2>
      <CodeBlock lang="cpp" filename="format.cpp" t={t}>{`#include <format>
#include <print>

std::string s = std::format("{} scored {}", "Ada", 9200);   // C++20: builds a string
std::println("frame {} took {:.2f} ms", frame, ms);         // C++23: prints, plus a newline
std::print("{:>8}|{:<8}|{:^8}\\n", "right", "left", "mid");`}</CodeBlock>
      <p>
        {tx(t, "cppVoc_fmtBody",
          "Each {} is replaced by the next argument. After a colon comes the format spec, a small language for width, alignment, precision and base. The format string is checked against the arguments while compiling: {:d} with a string argument is a compile error, not the silent garbage printf gives. std::println writes straight to the console without the streams machinery of iostream.")}
      </p>
      <LessonTable
        headers={[tx(t, "cppVoc_hSpec", "Spec"), tx(t, "cppVoc_hValue", "Value"), tx(t, "cppVoc_hOut", "Output"), tx(t, "cppVoc_hMeans", "What it means")]}
        rows={[
          ["{}", "42", "42", tx(t, "cppVoc_f1", "The default form for the type.")],
          ["{:>6}", "42", "····42", tx(t, "cppVoc_f2", "Width 6, aligned right. < aligns left, ^ centres. Dots stand for spaces.")],
          ["{:06}", "42", "000042", tx(t, "cppVoc_f3", "Width 6, padded with zeros.")],
          ["{:.2f}", "3.14159", "3.14", tx(t, "cppVoc_f4", "Fixed notation, 2 digits after the point.")],
          ["{:x} / {:#x}", "255", "ff / 0xff", tx(t, "cppVoc_f5", "Hexadecimal, and with its 0x prefix.")],
          ["{:b}", "5", "101", tx(t, "cppVoc_f6", "Binary.")],
          ["{:+}", "7", "+7", tx(t, "cppVoc_f7", "Always show the sign.")],
          ["{:*^7}", "\"hi\"", "**hi***", tx(t, "cppVoc_f8", "Fill with *, centred, width 7. The extra character goes to the right.")],
          ["{1} {0}", "\"a\", \"b\"", "b a", tx(t, "cppVoc_f9", "Arguments by position. One format string uses either all {} or all numbers: mixing them is a compile error.")],
        ]}
      />
      <H3>{tx(t, "cppVoc_ownTitle", "Formatting your own type")}</H3>
      <CodeBlock lang="cpp" filename="formatter.cpp" t={t}>{`struct Vec3 { float x, y, z; };

template <>
struct std::formatter<Vec3> {
    constexpr auto parse(std::format_parse_context& ctx) { return ctx.begin(); }

    auto format(const Vec3& v, std::format_context& ctx) const {
        return std::format_to(ctx.out(), "({}, {}, {})", v.x, v.y, v.z);
    }
};

std::println("camera at {}", Vec3{1, 2.5f, -3});   // camera at (1, 2.5, -3)`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppVoc_hLine", "Line"), tx(t, "cppVoc_hMeans", "What it means")]}
        rows={[
          ["template <> struct std::formatter<Vec3>", tx(t, "cppVoc_o1", "A specialisation: the library's formatter template, filled in for Vec3 (the Templates chapter). std::format looks for it when it meets a Vec3.")],
          ["parse", tx(t, "cppVoc_o2", "Reads the spec after the colon. This one accepts none and returns where the spec ends, which is its beginning.")],
          ["format", tx(t, "cppVoc_o3", "Writes the text. ctx.out() is where the output goes, and format_to writes there with an ordinary format string.")],
        ]}
      />

      <H2>{tx(t, "cppVoc_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cppVoc_try1", "Write std::string_view first_word(std::string_view s) using find(' ') and substr. Call it with a literal, then with a std::string. Then call it with a temporary std::string, store the result, print it, and run with -fsanitize=address.")}</li>
        <li>{tx(t, "cppVoc_try2", "Add struct Hexagon { float side; }; to Shape without updating area, and read the compiler's error. Then add the missing lambda (area = 3√3/2 · side²).")}</li>
        <li>{tx(t, "cppVoc_try3", "Print a table of the numbers 0 to 15 in decimal, hexadecimal and binary, aligned in three columns, with one println per row.")}</li>
        <li>{tx(t, "cppVoc_try4", "Print sizeof of std::string, std::string_view, std::span<int>, std::optional<int> and std::variant<int, double>, and explain each number.")}</li>
      </ol>

      <KeyIdeas t={t} id="cppVoc" items={[
        "Vocabulary types are shared words, so libraries that never met can pass values to each other without converting.",
        "string_view and span are a pointer and a length; they own nothing, never allocate, and dangle when the owner dies, moves or grows.",
        "A string_view is not null-terminated: never give its data() to a function that expects a C string.",
        "variant holds exactly one of a fixed set of types; visit with one lambda per type fails to compile when a type is not handled.",
        "Structured bindings name the parts of a pair, tuple or struct in one line.",
        "std::format and std::println check the format string while compiling; a std::formatter specialisation makes your own types printable.",
      ]} />
    </Article>
  );
}
