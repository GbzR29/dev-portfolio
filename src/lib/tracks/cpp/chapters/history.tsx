"use client";

// Origins: the story of C and C++ — Bell Labs and the end of Multics; Unix on
// a PDP-7; BCPL → B → C and why the PDP-11 needed types; Unix rewritten in C
// and portability; how Unix spread (the AT&T consent decree); K&R and
// "hello, world"; the C standards; Stroustrup, Simula and C with Classes;
// the name C++, Cfront, the STL and C++98; the long wait and C++11; the
// three-year train; the two philosophies; where both run today; how the
// track is organised.

import type { ReactNode } from "react";
import { H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { HistoryFigure } from "@/components/lesson/figures/c/HistoryFigure";

/** A quotation with its source, set apart from the prose. */
function Quote({ children, by }: { children: ReactNode; by: string }) {
  return (
    <figure className="my-6 border-l-2 border-[var(--primary)] pl-5">
      <blockquote className="text-lg italic leading-relaxed text-[var(--text-main)]">{children}</blockquote>
      <figcaption className="mt-2 font-mono text-[12px] text-[var(--text-muted)]">{by}</figcaption>
    </figure>
  );
}

export function HistoryContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cHist_intro",
          "In 1969, in a research lab in New Jersey, two programmers were left without a project. Within four years they had written an operating system and invented the language to write it in. Ten years later, in the same building, a young Danish researcher began adding classes to that language. The operating system was Unix. The languages were C and C++. Half a century on, they still run underneath almost everything: the kernel of your phone, the browser showing this page, the engine of the game you played last. This chapter tells how they came to be, and why they look the way they do.")}
      </Lead>

      <Goals t={t} id="cHist" items={[
        "Tell where C came from, and why it was designed around the machine.",
        "Explain what Stroustrup wanted from C++, and how it grew out of C.",
        "Place the main C and C++ standards on a timeline.",
        "Say why both languages still matter in 2026, and where each one is used.",
      ]} />

      <H2>{tx(t, "cHist_labsTitle", "Bell Labs, 1969")}</H2>
      <p>
        {tx(t, "cHist_labsBody",
          "Bell Telephone Laboratories, in Murray Hill, was the research arm of AT&T, the American phone monopoly. It had already given the world the transistor and information theory. In the 1960s it was building Multics, an ambitious time-sharing operating system, together with MIT and General Electric. Multics was late, large and slow, and in 1969 Bell Labs pulled out.")}
      </p>
      <p>
        {tx(t, "cHist_unixBody",
          "Ken Thompson and Dennis Ritchie had worked on Multics and missed what it promised: a comfortable system shared by many people. Thompson found a little-used PDP-7 minicomputer and, in the summer of 1969, wrote a small operating system for it in assembly language, along with a shell, an editor and an assembler. A colleague, Brian Kernighan, nicknamed it Unics, a pun on Multics. The spelling soon became Unix.")}
      </p>

      <H2>{tx(t, "cHist_bTitle", "From BCPL to B to C")}</H2>
      <p>
        {tx(t, "cHist_bBody",
          "Assembly language is tied to one processor: every program must be rewritten for the next machine. Thompson wanted something higher level, so he cut down BCPL, a language from Cambridge, until it fitted the PDP-7's tiny memory. He called it B. B had no types at all. Every value was a machine word, and the program decided whether a word meant a number or an address.")}
      </p>
      <p>
        {tx(t, "cHist_cBody",
          "That stopped working on the PDP-11, the machine Bell Labs bought next. It could address single bytes, so a character and a whole number were now different sizes, and a typeless language could not tell them apart. Between 1971 and 1973 Ritchie added types to B: char, int, arrays and pointers to them, then structs. The language had changed enough to need a new name, and it took the next letter: C.")}
      </p>
      <LessonTable
        headers={[tx(t, "cHist_hLang", "Language"), tx(t, "cHist_hYear", "Year"), tx(t, "cHist_hBy", "By"), tx(t, "cHist_hIdea", "What it added")]}
        rows={[
          ["BCPL", "1967", "Martin Richards", tx(t, "cHist_l1", "a small, portable language for writing compilers; one type, the word")],
          ["B", "1969", "Ken Thompson", tx(t, "cHist_l2", "BCPL cut down to fit the PDP-7; still typeless")],
          ["C", "1972", "Dennis Ritchie", tx(t, "cHist_l3", "types for bytes, ints and pointers, then structs; close to the machine but portable")],
        ]}
      />

      <H2>{tx(t, "cHist_portTitle", "An operating system in a high-level language")}</H2>
      <p>
        {tx(t, "cHist_portBody",
          "In 1973 Thompson and Ritchie rewrote the Unix kernel in C. Operating systems were written in assembly then, because only assembly was thought fast enough. The rewrite proved otherwise, and it gave Unix its greatest strength: to move it to a new computer, you wrote a C compiler for that computer and recompiled the rest. Unix and C spread together from then on, each carrying the other.")}
      </p>
      <p>
        {tx(t, "cHist_spreadBody",
          "They spread for a legal reason too. Under a 1956 agreement with the US government, AT&T was not allowed to sell computer products. It licensed Unix to universities for almost nothing, source code included. A generation of students learned operating systems by reading it, and the University of California at Berkeley grew its own version, BSD. When those students graduated, they took C with them.")}
      </p>

      <H2>{tx(t, "cHist_krTitle", "The book, and \"hello, world\"")}</H2>
      <p>
        {tx(t, "cHist_krBody",
          "In 1978 Kernighan and Ritchie published The C Programming Language. Programmers call it K&R. It is thin, exact and full of small complete programs, and for eleven years it was the only definition of C there was. Its first example prints the words hello, world. Kernighan had used them in a B tutorial years earlier; after this book, nearly every language has been introduced with them.")}
      </p>
      <Quote by={tx(t, "cHist_q1by", "Dennis Ritchie, The Development of the C Language, 1993")}>
        {tx(t, "cHist_q1", "C is quirky, flawed, and an enormous success.")}
      </Quote>
      <p>
        {tx(t, "cHist_stdBody",
          "As C compilers multiplied, they disagreed on the details. In 1989 the American standards body ANSI published the first official C, adopted by ISO a year later: C89, also called C90. Since then C has changed slowly and on purpose. C99 added // comments, fixed-width integers and declarations anywhere in a block. C11 added threads. C23 made bool and nullptr keywords and added #embed. Slowness is a feature here: C code from 1990 still compiles today.")}
      </p>

      <H2>{tx(t, "cHist_bjarneTitle", "1979: classes, without the cost")}</H2>
      <p>
        {tx(t, "cHist_bjarneBody",
          "Bjarne Stroustrup grew up in Aarhus, Denmark, and did his PhD at Cambridge, simulating distributed computer systems. He wrote the simulator first in Simula, a Norwegian language that had invented classes: a way to bundle data with the code that works on it. The design came out beautifully, but the program ran too slowly to be useful. He rewrote it in BCPL, where it was fast, and the experience was miserable. He left Cambridge convinced that a language could, and should, have both.")}
      </p>
      <p>
        {tx(t, "cHist_withBody",
          "In 1979 he joined Bell Labs, down the corridor from the Unix team, and began C with Classes: C, plus classes with constructors and destructors, public and private parts, and derived classes. He kept C underneath on purpose. C was fast, it ran everywhere, and every Bell Labs programmer already knew it. In 1983 a colleague, Rick Mascitti, suggested a new name. In C, ++ adds one to a variable, so C++ is \"one more than C\".")}
      </p>
      <p>
        {tx(t, "cHist_cfrontBody",
          "In 1985 came the first commercial release and Stroustrup's book, The C++ Programming Language. The compiler, Cfront, translated C++ into C, so C++ could run on any machine that had a C compiler, which was every machine. Virtual functions, operator overloading, references and const were in; templates and exceptions followed around 1990.")}
      </p>
      <Quote by={tx(t, "cHist_q2by", "Bjarne Stroustrup, on the zero-overhead principle")}>
        {tx(t, "cHist_q2", "What you don't use, you don't pay for. And further: what you do use, you couldn't hand code any better.")}
      </Quote>

      <H2>{tx(t, "cHist_stlTitle", "The standard library, the standard, and a long wait")}</H2>
      <p>
        {tx(t, "cHist_stlBody",
          "In 1994 Alexander Stepanov showed the standards committee his Standard Template Library: containers such as vector and map, algorithms such as sort and find, and iterators that let any algorithm work on any container. It was accepted almost whole, and it turned C++ toward generic programming. In 1998 the first ISO standard, C++98, was published.")}
      </p>
      <p>
        {tx(t, "cHist_waitBody",
          "Then came thirteen quiet years. C++03 fixed defects only, while the next revision, known as C++0x, kept growing and slipping. Meanwhile Java and C# offered garbage collection and big standard libraries, and many people wrote C++ off as a legacy language. C++11 finally arrived in September 2011. It brought move semantics, auto, lambdas, smart pointers and threads, and it changed day-to-day C++ so much that Stroustrup said it felt like a new language. Since then a new standard has shipped every three years, like a train that leaves on time with whatever is ready: C++14, 17, 20, 23, and now 26.")}
      </p>
      <p>
        {tx(t, "cHist_ritchieBody",
          "One month after C++11 was published, Dennis Ritchie died, in October 2011. He and Thompson had received the Turing Award, the highest honour in computing, in 1983. Thompson went on to co-design the UTF-8 text encoding and, at Google, the Go language. Stroustrup still takes part in the committee that evolves C++.")}
      </p>

      <H2>{tx(t, "cHist_timelineTitle", "The whole story on one line")}</H2>
      <HistoryFigure t={t} />

      <H2>{tx(t, "cHist_familyTitle", "Two languages, one family")}</H2>
      <p>
        {tx(t, "cHist_familyBody",
          "C++ began as a superset of C, and almost every C program is still valid C++. Almost: the two have grown apart in small ways. In C, malloc's result converts to any pointer type by itself; C++ demands a cast. C has variable-length arrays; C++ does not. More important is the difference in spirit. C gives you a few simple tools and trusts you completely. C++ gives you tools for building your own safe abstractions, such as types that free their memory by themselves, and promises that they cost nothing extra at run time.")}
      </p>
      <LessonTable
        headers={["", "C", "C++"]}
        rows={[
          [tx(t, "cHist_r1", "Size"), tx(t, "cHist_r1c", "small: the whole language fits in your head"), tx(t, "cHist_r1p", "very large: nobody uses all of it")],
          [tx(t, "cHist_r2", "Abstractions"), tx(t, "cHist_r2c", "functions and structs"), tx(t, "cHist_r2p", "classes, templates, lambdas, a large standard library")],
          [tx(t, "cHist_r3", "Memory"), tx(t, "cHist_r3c", "malloc and free, by hand"), tx(t, "cHist_r3p", "objects that clean up after themselves (RAII)")],
          [tx(t, "cHist_r4", "Changes"), tx(t, "cHist_r4c", "slowly; old code keeps working"), tx(t, "cHist_r4p", "a new standard every three years")],
          [tx(t, "cHist_r5", "Typical home"), tx(t, "cHist_r5c", "kernels, drivers, embedded devices, libraries meant to be called from any language"), tx(t, "cHist_r5p", "game engines, browsers, graphics, finance, compilers")],
        ]}
      />

      <H2>{tx(t, "cHist_todayTitle", "Where they run today")}</H2>
      <p>
        {tx(t, "cHist_todayBody",
          "The Linux kernel, started in 1991, is written in C, and so are much of Windows and macOS underneath, the SQLite database inside every phone, Git, and the Python interpreter. C is also the common language that other languages use to talk to each other: OpenGL, Vulkan and SDL are C APIs for exactly that reason. C++ runs Unreal Engine and most other game engines, Chrome and Firefox, Photoshop, the LLVM compiler family, and the fast inner loops of machine-learning libraries such as PyTorch. Their syntax lives on in Java, C#, JavaScript and Go. Their weak spot, memory safety, is why newer languages such as Rust exist, and why the Linux kernel now accepts Rust alongside C.")}
      </p>

      <H2>{tx(t, "cHist_trackTitle", "How this track is organised")}</H2>
      <p>
        {tx(t, "cHist_trackBody",
          "This track follows the history. It starts with C, because C shows the machine plainly: variables are boxes at addresses, memory is yours to request and to give back, and nothing happens that you did not write. Then it moves to C++, and each C++ tool appears as the answer to a problem you will by then have met in C.")}
      </p>

      <KeyIdeas t={t} id="cHist" items={[
        "C was created at Bell Labs between 1969 and 1973, by Ritchie and Thompson, to write Unix.",
        "B had no types; the byte-addressed PDP-11 forced C to have them. C stays close to the machine but runs on any of them.",
        "Rewriting Unix in C made it portable, and cheap university licences spread both around the world.",
        "Stroustrup began C++ in 1979 to get Simula's classes at C's speed. Zero overhead is still its rule.",
        "Key standards: C89, C99, C11, C23; C++98, C++11 (the big break), then one every three years up to C++26.",
        "C remains the common language of systems and APIs; C++ powers engines, browsers and graphics.",
      ]} />
    </Article>
  );
}
