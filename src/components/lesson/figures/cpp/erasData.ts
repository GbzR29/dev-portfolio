// ── Data for the "five eras of C++" figure ────────────────────────────────────
// The same program in each era. Code stays in English; summaries and change
// notes are tx keys (figCppEra_<id>_sum, figCppEra_<id>_c<n>). `error` is what
// g++ prints for this era's code under an older -std flag: the first feature
// of this era that the older standard lacks.

export type EraId = "cpp98" | "cpp11" | "cpp17" | "cpp20" | "cpp23";

export type Era = {
  id: EraId;
  label: string;
  year: number;
  summary: string;
  code: string[];
  changes: { code: string; en: string }[];
  error: string;
};

export const STDS: Record<EraId, string> = { cpp98: "c++98", cpp11: "c++11", cpp17: "c++17", cpp20: "c++20", cpp23: "c++23" };

export const ERAS: Era[] = [
  {
    id: "cpp98", label: "C++98", year: 1998,
    summary: "The first ISO standard. Strings and containers already exist, but you fill a vector one push_back at a time, count with an index and print with stream operators.",
    code: [
      "#include <iostream>",
      "#include <string>",
      "#include <vector>",
      "",
      "int main() {",
      "    std::vector<std::string> names;",
      "    names.push_back(\"vertex\");",
      "    names.push_back(\"fragment\");",
      "",
      "    for (std::size_t i = 0; i < names.size(); ++i)",
      "        std::cout << i << \": \" << names[i] << std::endl;",
      "}",
    ],
    changes: [],
    error: "",
  },
  {
    id: "cpp11", label: "C++11", year: 2011,
    summary: "The big break, thirteen years later. Brace initialisation, the range-based for and auto remove most of the noise. Stroustrup said it felt like a new language.",
    code: [
      "#include <iostream>",
      "#include <string>",
      "#include <vector>",
      "",
      "int main() {",
      "    std::vector<std::string> names{\"vertex\", \"fragment\"};",
      "",
      "    int i = 0;",
      "    for (const auto& name : names)",
      "        std::cout << i++ << \": \" << name << '\\n';",
      "}",
    ],
    changes: [
      { code: "names{…}", en: "brace initialisation: the vector is filled where it is declared." },
      { code: "for (… : names)", en: "the range-based for visits every element, with no index to get wrong." },
      { code: "const auto&", en: "auto lets the compiler work out the type; & looks at each string without copying it." },
      { code: "'\\n'", en: "replaces std::endl, which also flushes the output on every line, and that is slow." },
    ],
    error: "shaders.cpp:6:30: error: in C++98 'names' must be initialized by constructor, not by '{...}'",
  },
  {
    id: "cpp17", label: "C++17", year: 2017,
    summary: "The compiler works out more on its own. Here it deduces the vector's element type from the values.",
    code: [
      "#include <iostream>",
      "#include <string>",
      "#include <vector>",
      "",
      "int main() {",
      "    using namespace std::literals;",
      "    std::vector names{\"vertex\"s, \"fragment\"s};",
      "",
      "    int i = 0;",
      "    for (const auto& name : names)",
      "        std::cout << i++ << \": \" << name << '\\n';",
      "}",
    ],
    changes: [
      { code: "\"vertex\"s", en: "the s suffix makes a std::string instead of a C string (a C++14 addition, switched on by the using line)." },
      { code: "std::vector names", en: "class template argument deduction: from two std::string values the compiler deduces std::vector<std::string>." },
    ],
    error: "shaders.cpp:7:17: error: missing template arguments before 'names'",
  },
  {
    id: "cpp20", label: "C++20", year: 2020,
    summary: "Text formatting arrives, adopted from the popular {fmt} library, and a loop can now hold its own counter.",
    code: [
      "#include <format>",
      "#include <iostream>",
      "#include <string>",
      "#include <vector>",
      "",
      "int main() {",
      "    using namespace std::literals;",
      "    std::vector names{\"vertex\"s, \"fragment\"s};",
      "",
      "    for (int i = 0; const auto& name : names)",
      "        std::cout << std::format(\"{}: {}\\n\", i++, name);",
      "}",
    ],
    changes: [
      { code: "std::format(\"{}: {}\\n\", …)", en: "each {} is replaced by the next value. The compiler checks the format string against the values." },
      { code: "for (int i = 0; … : names)", en: "the range-based for can declare a variable of its own, so i no longer stays alive after the loop." },
    ],
    error: "shaders.cpp:11:27: error: 'format' is not a member of 'std'",
  },
  {
    id: "cpp23", label: "C++23", year: 2023,
    summary: "Formatting and printing become one call, and a ready-made view supplies the index. C++23 also allows import std; in place of the includes, which compilers are still rolling out.",
    code: [
      "#include <print>",
      "#include <ranges>",
      "#include <string>",
      "#include <vector>",
      "",
      "int main() {",
      "    using namespace std::literals;",
      "    std::vector names{\"vertex\"s, \"fragment\"s};",
      "",
      "    for (auto [i, name] : std::views::enumerate(names))",
      "        std::println(\"{}: {}\", i, name);",
      "}",
    ],
    changes: [
      { code: "std::views::enumerate", en: "pairs each element with its position. auto [i, name] unpacks each pair into two names (a structured binding, from C++17)." },
      { code: "std::println", en: "formats and prints in one call, and adds the newline." },
    ],
    error: "shaders.cpp:10:38: error: 'enumerate' is not a member of 'std::views'",
  },
];
