"use client";

// C Foundations 4: strings, structs, unions and enums — a string as a char
// array ending in '\0'; arrays vs string literals; <string.h> (strlen,
// strcmp, strcpy/strcat and why snprintf is safer, memcpy/memset); a missing
// terminator; struct definition, designated initialisers, . and ->, typedef,
// passing structs by pointer, padding; enum constants and switch; union and
// the tagged-union pattern.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { MemoryBoxFigure } from "@/components/lesson/figures/c/MemoryBoxFigure";

export function CStringsStructsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cStr_intro",
          "C has no string type and no classes. Text is an array of chars with a zero byte at the end, and every function that handles text trusts that zero byte to say where the text stops. Grouped data is a struct: named fields placed one after another in memory. With enum for named constants and union for \"one of several kinds\", these four tools are enough to describe nearly any data, from a file header to a game entity.")}
      </Lead>

      <Goals t={t} id="cStr" items={[
        "Explain how a C string ends, and why a missing '\\0' is a bug.",
        "Compare, copy and build strings with <string.h> and snprintf without overflowing.",
        "Define a struct, initialise it, and reach its fields through . and ->.",
        "Use an enum for named states and a tagged union for values of several kinds.",
      ]} />

      <H2>{tx(t, "cStr_strTitle", "A string is an array that ends in zero")}</H2>
      <p>
        {tx(t, "cStr_strBody",
          "A C string is a run of chars followed by the null character '\\0', a byte whose value is 0. Nothing else records the length. The literal \"hello\" is 6 bytes: five letters and the terminator. To find the length, code walks from the first char until it meets the zero. Step through it below and watch the pointer move.")}
      </p>
      <MemoryBoxFigure t={t} programs={["string"]} />
      <CodeBlock lang="c" filename="literals.c" t={t}>{`char a[] = "hello";        // an array of 6 chars: your own copy, writable
a[0] = 'j';                // fine: a is now "jello"

const char *p = "hello";   // a pointer to the literal, stored in read-only memory
// p[0] = 'j';             // undefined behaviour: usually a crash

char b[16] = "hi";         // 16 bytes: 'h', 'i', '\\0' and 13 more zeros`}</CodeBlock>

      <H2>{tx(t, "cStr_libTitle", "The <string.h> functions")}</H2>
      <LessonTable
        headers={[tx(t, "cStr_hFn", "Function"), tx(t, "cStr_hDoes", "What it does"), tx(t, "cStr_hCare", "Watch out")]}
        rows={[
          ["strlen(s)", tx(t, "cStr_f1", "number of chars before the '\\0'"), tx(t, "cStr_f1c", "walks the whole string every call")],
          ["strcmp(a, b)", tx(t, "cStr_f2", "0 if equal; negative or positive for alphabetical order"), tx(t, "cStr_f2c", "a == b compares addresses, not text")],
          ["strcpy(dst, src)", tx(t, "cStr_f3", "copies src, '\\0' included, into dst"), tx(t, "cStr_f3c", "no size check: overflows a small dst")],
          ["strcat(dst, src)", tx(t, "cStr_f4", "appends src to the end of dst"), tx(t, "cStr_f4c", "no size check either")],
          ["snprintf(dst, size, fmt, …)", tx(t, "cStr_f5", "printf into an array; writes at most size bytes, always ends with '\\0'"), tx(t, "cStr_f5c", "returns the length it wanted: if ≥ size, the text was cut")],
          ["memcpy(dst, src, n)", tx(t, "cStr_f6", "copies n bytes of anything"), tx(t, "cStr_f6c", "areas must not overlap (use memmove if they do)")],
          ["memset(dst, byte, n)", tx(t, "cStr_f7", "sets n bytes to one value, usually 0"), tx(t, "cStr_f7c", "sets bytes, not ints: memset(a, 1, …) does not make 1s")],
        ]}
      />
      <CodeBlock lang="c" filename="strings.c" t={t}>{`#include <stdio.h>
#include <string.h>

char name[16] = "Ada";
if (strcmp(name, "Ada") == 0) puts("same text");     // not name == "Ada"

char line[32];
int n = snprintf(line, sizeof line, "%s scored %d points", name, 9001);
if (n >= (int)sizeof line) puts("cut short");        // n = 22 here, fits

char copy[16];
snprintf(copy, sizeof copy, "%s", name);             // a safe strcpy`}</CodeBlock>

      <H3>{tx(t, "cStr_noTermTitle", "When the zero is missing")}</H3>
      <p>
        {tx(t, "cStr_noTermBody",
          "An array of chars without a terminator looks like a string but is not one. Any string function given it keeps reading past the end, through whatever lies next in memory, until it happens to meet a zero byte. Step through the same loop on such an array.")}
      </p>
      <MemoryBoxFigure t={t} programs={["noTerm"]} />
      <Callout type="warn" t={t}>
        {tx(t, "cStr_overflowWarn",
          "Writing past the end of a char array is the classic buffer overflow. With strcpy, strcat, gets or a bare %s in scanf, the input decides how many bytes get written, so an attacker who controls the input controls what gets overwritten. Size every write: snprintf, scanf(\"%31s\"), fgets(buf, sizeof buf, stdin).")}
      </Callout>

      <H2>{tx(t, "cStr_structTitle", "struct: fields side by side")}</H2>
      <p>
        {tx(t, "cStr_structBody",
          "A struct groups named fields of any types into one value. In memory the fields are placed in the order you declare them. A dot reaches a field of a struct value (pt.x). Through a pointer you write p->x, which is short for (*p).x. Structs can be assigned and passed by value, which copies every byte, so functions usually take a pointer to a large struct instead; const on that pointer says the function only reads it.")}
      </p>
      <MemoryBoxFigure t={t} programs={["struct"]} />
      <CodeBlock lang="c" filename="structs.c" t={t}>{`typedef struct {                 // typedef: name the type Player instead of struct Player
    char  name[16];
    int   hp;
    float x, y;
} Player;

Player p = { .name = "Ada", .hp = 100, .x = 2.0f };   // designated: unnamed fields become 0

void heal(Player *pl, int amount) {   // pointer: change the caller's player, no copy
    pl->hp += amount;
}

void print(const Player *pl) {        // const: read only
    printf("%s at (%.1f, %.1f) with %d hp\\n", pl->name, pl->x, pl->y, pl->hp);
}

heal(&p, 25);
print(&p);                            // Ada at (2.0, 0.0) with 125 hp`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "cStr_padNote",
          "A struct can be larger than the sum of its fields. Each field starts at a multiple of its own size, so the compiler inserts unused padding bytes: struct { char a; int b; char c; } takes 12 bytes, not 6. Ordering fields from largest to smallest wastes the least. The Memory chapter of the Algorithms track draws this byte by byte.")}
      </Callout>

      <H2>{tx(t, "cStr_enumTitle", "enum: named constants")}</H2>
      <p>
        {tx(t, "cStr_enumBody",
          "An enum gives names to a set of whole numbers. Unless you say otherwise they count up from 0. Use one wherever a value is \"one of a few states\": the code reads as words, and with -Wall a switch that forgets one of the names gets a warning.")}
      </p>
      <CodeBlock lang="c" filename="enum.c" t={t}>{`typedef enum { STATE_IDLE, STATE_RUN, STATE_JUMP } State;   // 0, 1, 2

const char *state_name(State s) {
    switch (s) {
        case STATE_IDLE: return "idle";
        case STATE_RUN:  return "run";
        case STATE_JUMP: return "jump";
    }
    return "?";
}`}</CodeBlock>

      <H2>{tx(t, "cStr_unionTitle", "union: several types in the same bytes")}</H2>
      <p>
        {tx(t, "cStr_unionBody",
          "A union looks like a struct, but all its fields start at the same address and share the same bytes. Its size is that of its largest field, and only one field holds a meaningful value at a time. Alone, nothing says which one. So unions are almost always paired with an enum tag that records which field is in use: a tagged union. JSON values, script variables and event queues are built this way.")}
      </p>
      <CodeBlock lang="c" filename="shape.c" t={t}>{`typedef enum { SHAPE_CIRCLE, SHAPE_RECT } ShapeKind;

typedef struct {
    ShapeKind kind;                       // the tag: which member of u is valid
    union {
        struct { float r; }    circle;
        struct { float w, h; } rect;
    } u;                                  // 8 bytes: the size of rect, the larger one
} Shape;

float area(const Shape *s) {
    switch (s->kind) {
        case SHAPE_CIRCLE: return 3.14159f * s->u.circle.r * s->u.circle.r;
        case SHAPE_RECT:   return s->u.rect.w * s->u.rect.h;
    }
    return 0;
}

Shape c = { .kind = SHAPE_CIRCLE, .u.circle = { 2.0f } };
printf("%.2f\\n", area(&c));             // 12.57`}</CodeBlock>
      <p>
        {tx(t, "cStr_variantBody",
          "Reading a member other than the one last written is a bug unless you mean to look at the raw bytes. C++ replaces the hand-written tag with std::variant, which keeps the tag itself and refuses the wrong access; the Vocabulary Types chapter covers it.")}
      </p>

      <H2>{tx(t, "cStr_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cStr_try1", "Write your own size_t my_strlen(const char *s) with a moving pointer, and check it against strlen.")}</li>
        <li>{tx(t, "cStr_try2", "Print sizeof for struct { char a; int b; char c; } and for the same fields ordered int, char, char. Explain the difference.")}</li>
        <li>{tx(t, "cStr_try3", "Add SHAPE_TRIANGLE (base and height) to the tagged union and to area. Compile with -Wall first, before updating the switch, and read the warning.")}</li>
      </ol>

      <KeyIdeas t={t} id="cStr" items={[
        "A C string is chars followed by '\\0'. Nothing else stores its length.",
        "Compare strings with strcmp, never with ==, and build them with snprintf, which cannot overflow.",
        "A string literal is read-only; a char array initialised from it is your own writable copy.",
        "A struct lays its fields out in order, with padding. Use . on a value and -> through a pointer.",
        "Pass large structs by pointer, with const when the function only reads.",
        "enum names states; a union shares bytes between fields and needs a tag to say which one is valid.",
      ]} />
    </Article>
  );
}
