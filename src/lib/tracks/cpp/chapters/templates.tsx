"use client";

// Generic C++ 1: templates. Starts from the same max() written three times and
// C's two escapes (a macro that evaluates twice, void* that drops types), then
// function templates and instantiation (figure: one template, many functions,
// the symbols the linker sees, the header/.cpp link error), deduction rules,
// class templates and non-type parameters, CTAD, why templates live in
// headers, specialisation, if constexpr, parameter packs and folds, auto
// parameters, dependent names, and what templates cost.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { TemplateFigure } from "@/components/lesson/figures/cpp/TemplateFigure";

export function TemplatesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cppTpl_intro",
          "You write a function that returns the larger of two ints. A week later you need it for floats, then for strings. The body is the same three words every time, a < b ? b : a, and only the type changes. C gives you two ways out, and both hurt: a macro that is not really a function, or void pointers that throw the types away. C++ lets you write the function once, with the type left as a blank to fill in. That is a template, and most of the standard library, std::vector included, is built from them.")}
      </Lead>

      <Goals t={t} id="cppTpl" items={[
        "Write a function template and a class template, and say what the compiler generates from them.",
        "Predict how T is deduced from the arguments, and fix a call where deduction fails.",
        "Explain why templates live in headers, and read the linker error you get when they do not.",
        "Use if constexpr and parameter packs to write one template that adapts to its types.",
      ]} />

      <H2>{tx(t, "cppTpl_copiesTitle", "The same function, three times")}</H2>
      <CodeBlock lang="cpp" filename="copies.cpp" t={t}>{`int         max_int(int a, int b)                         { return a < b ? b : a; }
double      max_double(double a, double b)                { return a < b ? b : a; }
std::string max_string(std::string a, std::string b)      { return a < b ? b : a; }`}</CodeBlock>
      <p>
        {tx(t, "cppTpl_copiesAfter",
          "Overloading (from the References chapter) lets all three share the name max_of, but you still write and fix three copies. In C the usual escape is a macro:")}
      </p>
      <CodeBlock lang="c" filename="macro.c" t={t}>{`#define MAX(a, b) ((a) > (b) ? (a) : (b))

int i = 3, j = 2;
int m = MAX(i++, j);       // m = 4, i = 5: i++ ran twice`}</CodeBlock>
      <p>
        {tx(t, "cppTpl_macroAfter",
          "The preprocessor pastes the text before the compiler sees it, so MAX(i++, j) becomes ((i++) > (j) ? (i++) : (j)), and i is incremented twice. A macro has no types, no scope, and evaluates its arguments as many times as it mentions them. The other C escape, a function taking void pointers like qsort, works on any type by giving up on knowing which one.")}
      </p>

      <H2>{tx(t, "cppTpl_fnTitle", "A function template")}</H2>
      <CodeBlock lang="cpp" filename="max.h" t={t}>{`template <typename T>
T max_of(T a, T b) {
    return a < b ? b : a;
}

max_of(3, 7);                                  // 7
max_of(2.5, 1.0);                              // 2.5
max_of(std::string("ab"), std::string("b"));   // "b": strings compare alphabetically`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppTpl_hPart", "Part"), tx(t, "cppTpl_hMeans", "What it means")]}
        rows={[
          ["template <…>", tx(t, "cppTpl_p1", "What follows is a template: a pattern for functions, not a function yet.")],
          ["typename T", tx(t, "cppTpl_p2", "A template parameter: T stands for a type that will be chosen later. class T means exactly the same; typename is the clearer word.")],
          ["T max_of(T a, T b)", tx(t, "cppTpl_p3", "The function, written with T wherever the type goes: both parameters and the result.")],
          ["max_of(3, 7)", tx(t, "cppTpl_p4", "Using it. The compiler works out T from the arguments (here int) and writes the function for that T.")],
        ]}
      />
      <p>
        {tx(t, "cppTpl_instBody",
          "The template itself produces no machine code. The first time you call max_of with ints, the compiler takes the pattern, replaces T with int, and compiles the result as an ordinary function, exactly as if you had typed max_int yourself. This is instantiation, and the result is an instance (or specialisation) of the template. A second call with ints reuses that function; a call with doubles makes another. Tick the calls and watch the functions appear.")}
      </p>
      <TemplateFigure t={t} />
      <p>
        {tx(t, "cppTpl_symBody",
          "Each instance is a separate function with its own name for the linker. The name encodes the template arguments: max_of<int> becomes the symbol _Z6max_ofIiET_S0_S0_ (the I…E part holds the template arguments, i for int), and the tool c++filt turns it back into int max_of<int>(int, int). This encoding is called name mangling, and it is how overloads and instances of the same name can coexist in one program.")}
      </p>

      <H3>{tx(t, "cppTpl_dedTitle", "How T is deduced")}</H3>
      <LessonTable
        headers={[tx(t, "cppTpl_hCall", "Call"), tx(t, "cppTpl_hT", "T"), tx(t, "cppTpl_hWhy", "Why")]}
        rows={[
          ["max_of(3, 7)", "int", tx(t, "cppTpl_d1", "Both arguments are int.")],
          ["max_of(1, 2.5)", tx(t, "cppTpl_d2t", "error"), tx(t, "cppTpl_d2", "One says int, the other double. Deduction never converts, so it has two answers and fails.")],
          ["max_of<double>(1, 2.5)", "double", tx(t, "cppTpl_d3", "T is given in angle brackets, so nothing is deduced; 1 is converted to 1.0 like a normal argument.")],
          ["max_of(cx, 5)  // const int cx", "int", tx(t, "cppTpl_d4", "Parameters taken by value drop const (and references): the function gets its own copy, so const would mean nothing.")],
          ["max_of(\"ab\", \"b\")", "const char*", tx(t, "cppTpl_d5", "A string literal is an array of char, which decays to a pointer. The result compares addresses, not text: wrap them in std::string.")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "cppTpl_literalWarn",
          "The last row is a real trap: max_of(\"ab\", \"b\") compiles, runs, and returns whichever literal happens to sit at the higher address. Templates do exactly what the code says for the type they get, even when that type is not the one you had in mind.")}
      </Callout>

      <H2>{tx(t, "cppTpl_classTitle", "Class templates")}</H2>
      <p>
        {tx(t, "cppTpl_classBody",
          "A class can take type parameters too. You have been using one since the std::vector chapter: std::vector<int> is the class template std::vector with T = int. Here is a small one of our own:")}
      </p>
      <CodeBlock lang="cpp" filename="stack.h" t={t}>{`#include <stdexcept>
#include <utility>
#include <vector>

template <typename T>
class Stack {
public:
    void push(T value) { items_.push_back(std::move(value)); }
    void pop() {
        if (items_.empty()) throw std::out_of_range("pop on an empty Stack");
        items_.pop_back();
    }
    const T& top() const { return items_.back(); }
    bool empty() const { return items_.empty(); }
    std::size_t size() const { return items_.size(); }
private:
    std::vector<T> items_;
};

Stack<int> scores;            // a class Stack<int>, with an std::vector<int> inside
Stack<std::string> names;     // a different class, with its own functions
scores.push(10);`}</CodeBlock>
      <p>
        {tx(t, "cppTpl_classAfter",
          "Stack<int> and Stack<std::string> are two unrelated classes; you cannot assign one to the other. Member functions are only instantiated when they are used, so a Stack<Mesh> compiles as long as you never call a member that needs something Mesh does not have.")}
      </p>
      <H3>{tx(t, "cppTpl_nttpTitle", "Values as template parameters")}</H3>
      <CodeBlock lang="cpp" filename="static_array.h" t={t}>{`template <typename T, std::size_t N>
struct StaticArray {
    T data[N];                                      // N is known while compiling
    constexpr std::size_t size() const { return N; }
    T& operator[](std::size_t i) { return data[i]; }
};

StaticArray<float, 16> matrix{};    // 16 floats inline, no heap: what std::array does`}</CodeBlock>
      <p>
        {tx(t, "cppTpl_nttpAfter",
          "A template parameter can also be a value: an integer, an enum, a pointer, and since C++20 a simple struct. N must be a constant the compiler knows, and StaticArray<float, 16> and StaticArray<float, 9> are, again, different types. std::array<T, N> is exactly this.")}
      </p>
      <H3>{tx(t, "cppTpl_ctadTitle", "Letting the compiler fill in the brackets")}</H3>
      <CodeBlock lang="cpp" filename="ctad.cpp" t={t}>{`std::vector v{1, 2, 3};      // std::vector<int>
std::pair   p{1, 2.5};       // std::pair<int, double>`}</CodeBlock>
      <p>
        {tx(t, "cppTpl_ctadAfter",
          "Since C++17 a class template's arguments can be deduced from the constructor's arguments, like a function's. This is class template argument deduction (CTAD). Write the brackets anyway when the deduced type would surprise a reader.")}
      </p>

      <H2>{tx(t, "cppTpl_headerTitle", "Why templates live in headers")}</H2>
      <p>
        {tx(t, "cppTpl_headerBody",
          "Each .cpp file is compiled on its own, as the Build chapter showed. To write max_of<int>, the compiler must see the body of max_of in the same file as the call. So a template's whole definition goes in the header, and every .cpp that includes it can instantiate what it needs. Put the body in max.cpp instead and you get the linker error from the figure: main.cpp only saw the declaration, and max.cpp never wrote max_of<int> because nothing there asked for it.")}
      </p>
      <p>
        {tx(t, "cppTpl_headerDup",
          "If three .cpp files all use max_of<int>, all three compile a copy. That is allowed: instances are marked so that the linker keeps one and throws the rest away. The cost is compile time, paid in every file.")}
      </p>
      <CodeBlock lang="cpp" filename="max.cpp" t={t}>{`// The other way: keep the body here and list the instances you want.
template <typename T>
T max_of(T a, T b) { return a < b ? b : a; }

template int    max_of<int>(int, int);           // explicit instantiation
template double max_of<double>(double, double);  // only these two will link`}</CodeBlock>

      <H2>{tx(t, "cppTpl_specTitle", "Specialisation: a different body for one type")}</H2>
      <CodeBlock lang="cpp" filename="type_name.h" t={t}>{`template <typename T>
struct TypeName { static constexpr const char* get() { return "something"; } };

template <>                       // a full specialisation: T = int, written by hand
struct TypeName<int> { static constexpr const char* get() { return "int"; } };

TypeName<int>::get();     // "int"
TypeName<double>::get();  // "something": the general pattern`}</CodeBlock>
      <p>
        {tx(t, "cppTpl_specAfter",
          "template <> introduces a replacement for one exact set of arguments. It is how the standard gives std::hash a body for each type. For function templates, prefer a plain overload: it does the same job with fewer surprises.")}
      </p>

      <H2>{tx(t, "cppTpl_ifTitle", "if constexpr: one template, different code per type")}</H2>
      <CodeBlock lang="cpp" filename="to_text.h" t={t}>{`#include <string>
#include <type_traits>

template <typename T>
std::string to_text(const T& value) {
    if constexpr (std::is_same_v<T, std::string>) {
        return value;
    } else if constexpr (std::is_arithmetic_v<T>) {
        return std::to_string(value);
    } else if constexpr (requires { value.to_text(); }) {
        return value.to_text();
    } else {
        static_assert(false, "to_text: this type cannot be turned into text");
    }
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppTpl_hPiece", "Piece"), tx(t, "cppTpl_hMeans", "What it means")]}
        rows={[
          ["if constexpr (…)", tx(t, "cppTpl_i1", "The condition is decided while compiling, separately for each T. The branches not taken are thrown away for that T, so they may contain code that would not compile for it: std::to_string(value) is never compiled for a std::string.")],
          ["std::is_same_v<T, U>", tx(t, "cppTpl_i2", "A type trait from <type_traits>: a bool constant, true when T and U are the same type.")],
          ["std::is_arithmetic_v<T>", tx(t, "cppTpl_i3", "True for the built-in numbers: int, float, double, char, bool…")],
          ["requires { value.to_text(); }", tx(t, "cppTpl_i4", "True when that expression would compile for this T. The next chapter is about this.")],
          ["static_assert(false, …)", tx(t, "cppTpl_i5", "Stops compilation with the message, but only if this branch is the one kept. Allowed since C++23; older code writes static_assert(sizeof(T) == 0, …) to get the same effect.")],
        ]}
      />
      <p>
        {tx(t, "cppTpl_ifAfter",
          "A plain if would not work here: both branches of a normal if must compile, and std::to_string(a std::string) does not.")}
      </p>

      <H2>{tx(t, "cppTpl_packTitle", "Any number of arguments: packs and folds")}</H2>
      <CodeBlock lang="cpp" filename="packs.cpp" t={t}>{`template <typename... Ts>
void log_all(const Ts&... values) {
    (std::print("{} ", values), ...);                // once per value
    std::println("({} values)", sizeof...(Ts));
}

template <typename... Ts>
auto sum(Ts... values) { return (values + ...); }

log_all("frame", 42, 1.5f);    // frame 42 1.5 (3 values)
sum(1, 2, 3);                  // 6
sum(1, 2.5);                   // 3.5`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppTpl_hWritten", "Written"), tx(t, "cppTpl_hMeans", "What it means")]}
        rows={[
          ["typename... Ts", tx(t, "cppTpl_k1", "A template parameter pack: zero or more types. For log_all(\"frame\", 42, 1.5f), Ts is const char*, int, float.")],
          ["const Ts&... values", tx(t, "cppTpl_k2", "A function parameter pack: one parameter per type in Ts.")],
          ["sizeof...(Ts)", tx(t, "cppTpl_k3", "How many there are (here 3), as a constant.")],
          ["(expr, ...)", tx(t, "cppTpl_k4", "A fold expression: expr repeated once per element, joined with the operator. With the comma it means \"do this for each\".")],
          ["(values + ...)", tx(t, "cppTpl_k5", "A fold over +: values₁ + (values₂ + (values₃)). With zero values it does not compile, because + has no empty answer.")],
        ]}
      />
      <p>
        {tx(t, "cppTpl_packAfter",
          "This is how std::println itself takes any number of arguments of any types, and how std::make_unique passes its arguments on to a constructor. C++26 adds pack indexing, values...[0], to reach one element directly.")}
      </p>

      <H2>{tx(t, "cppTpl_autoTitle", "The short form: auto parameters")}</H2>
      <CodeBlock lang="cpp" filename="twice.cpp" t={t}>{`auto twice(auto x) { return x + x; }    // C++20: a template, written without template<>

twice(21);                  // 42
twice(std::string("ab"));   // "abab"`}</CodeBlock>
      <p>
        {tx(t, "cppTpl_autoAfter",
          "A parameter declared auto makes the function a template with one invented type parameter per auto: the same thing as the generic lambdas of the Lambdas chapter. Use the long form when two parameters must share a type, as in max_of.")}
      </p>

      <H2>{tx(t, "cppTpl_depTitle", "A trap: names that depend on T")}</H2>
      <CodeBlock lang="cpp" filename="dependent.cpp" t={t}>{`template <typename Container>
void print_first(const Container& c) {
    typename Container::value_type first = *c.begin();   // typename is required
    std::println("first: {}", first);
}`}</CodeBlock>
      <p>
        {tx(t, "cppTpl_depAfter",
          "Container::value_type depends on the template parameter, so the compiler cannot know, while reading the template, whether it names a type or a static variable. It assumes a variable unless you write typename in front. Names like this are called dependent names, and the error you get without typename (\"need 'typename' before …\") is one every C++ programmer meets once. Writing auto first = *c.begin(); avoids the question.")}
      </p>

      <H2>{tx(t, "cppTpl_costTitle", "What templates cost")}</H2>
      <LessonTable
        headers={[tx(t, "cppTpl_hWhere", "Where"), tx(t, "cppTpl_hCost", "Cost")]}
        rows={[
          [tx(t, "cppTpl_c1k", "run time"), tx(t, "cppTpl_c1", "None. Each instance is an ordinary function compiled for its exact types, so it can be inlined and optimised like hand-written code. This is why std::sort beats qsort.")],
          [tx(t, "cppTpl_c2k", "program size"), tx(t, "cppTpl_c2", "One copy per set of arguments. Many instances of a big template make the program larger (code bloat).")],
          [tx(t, "cppTpl_c3k", "build time"), tx(t, "cppTpl_c3", "Every .cpp that includes the header parses it and compiles its own instances. Template-heavy headers are the main cause of slow C++ builds; modules (a later chapter) and explicit instantiation help.")],
          [tx(t, "cppTpl_c4k", "error messages"), tx(t, "cppTpl_c4", "A template accepts any type and only fails deep inside its body, with a chain of \"required from\" lines. The next chapter, Concepts, fixes that.")],
        ]}
      />

      <H2>{tx(t, "cppTpl_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cppTpl_try1", "Write template <typename T> T clamp_to(T v, T lo, T hi). Call it with ints and doubles, then with (5, 0, 2.5) and fix that call two different ways.")}</li>
        <li>{tx(t, "cppTpl_try2", "Compile a file that calls max_of with int, double and std::string, then run nm on the .o file and c++filt on the names. Count the instances.")}</li>
        <li>{tx(t, "cppTpl_try3", "Give Stack a member T sum() const that adds the items. Check that Stack<Mesh> still compiles as long as you never call sum.")}</li>
        <li>{tx(t, "cppTpl_try4", "Write print_all(args...) that prints its arguments separated by \", \" with no trailing comma. Hint: print the first one, then fold over the rest.")}</li>
      </ol>

      <KeyIdeas t={t} id="cppTpl" items={[
        "A template is a pattern with the type left blank; the compiler writes a real function or class for each set of arguments you use.",
        "T is deduced from the arguments without conversions; when they disagree, give T explicitly.",
        "A template's body must be visible where it is used, so it lives in a header; a body hidden in a .cpp gives an undefined reference.",
        "Class templates like Stack<T> and std::vector<T> make a separate type per argument; values like N can be parameters too.",
        "if constexpr keeps only the branch that fits each type; packs and folds handle any number of arguments.",
        "Templates cost nothing at run time, but they cost build time, program size and long error messages.",
      ]} />
    </Article>
  );
}
