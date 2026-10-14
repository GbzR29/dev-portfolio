"use client";

// Language core 2: why copying is the wrong tool for handing an object over;
// the move constructor that steals a block and empties its source (lifetime
// figure: move, forgotten nullptr); move assignment with std::exchange; value
// categories (lvalue / xvalue / prvalue figure with the two take overloads,
// const trap, named rvalue reference); std::move as a cast and the
// moved-from state; returning by value (copy elision, NRVO, the pessimising
// std::move); noexcept and std::vector growth; rule of five with a move-only
// GPU handle, back to the rule of zero; a short look at forwarding references.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { LifetimeFigure } from "@/components/lesson/figures/cpp/LifetimeFigure";
import { ValueCategoryFigure } from "@/components/lesson/figures/cpp/ValueCategoryFigure";

export function MoveContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cppMv_intro",
          "Imagine moving a book to the next room by photocopying every page, carrying the copy over, and shredding the original. That is what C++ did for its first twenty years whenever an object changed hands: a function that built a vector of a million elements and returned it copied all million, then destroyed the original. Programmers worked around it with output parameters and pointers, and the code got uglier. C++11 added the obvious alternative: carry the book. A move hands over what an object owns, its heap block, its file, its buffer, and leaves the old object empty. This chapter shows how a move works inside, how the compiler decides when it may move, and the one function call, std::move, that is named after something it does not do.")}
      </Lead>

      <Goals t={t} id="cppMv" items={[
        "Describe what a move does to the object moved from and the object moved to.",
        "Write a move constructor and a move assignment, and mark them noexcept.",
        "Tell lvalues from rvalues and predict whether a call copies or moves.",
        "Explain why std::move moves nothing by itself, and where writing it makes code slower.",
        "Choose between the rule of five and the rule of zero.",
      ]} />

      <H2>{tx(t, "cppMv_whyTitle", "Copying when you meant to hand over")}</H2>
      <CodeBlock lang="cpp" filename="handover.cpp" t={t}>{`std::vector<std::string> load_lines(const std::string& path);

std::vector<std::vector<std::string>> files;
std::vector<std::string> lines = load_lines("level1.txt");
files.push_back(lines);     // copies every string: lines is still in use here
// … lines is never used again …`}</CodeBlock>
      <p>
        {tx(t, "cppMv_whyBody",
          "push_back(lines) has to copy: as far as the compiler knows, lines is still needed afterwards. But it is not. What we want is to give push_back the strings themselves: let the new element take lines' heap block, and leave lines empty. One pointer changes owner, and not one character is copied. That is a move, and C++ needs two things to do it: a way for a class to say how it is moved, and a way for the caller to say \"I am done with this object\".")}
      </p>

      <H2>{tx(t, "cppMv_ctorTitle", "Stealing the block: the move constructor")}</H2>
      <p>
        {tx(t, "cppMv_ctorBody",
          "Here is the move constructor for Buf, the class from the previous chapter that owns a heap array. Then step through it, and through the version with one line forgotten.")}
      </p>
      <CodeBlock lang="cpp" filename="buf_move.cpp" t={t}>{`class Buf {
public:
    explicit Buf(int n) : n_(n), data_(new int[n]{}) {}

    Buf(Buf&& o) noexcept                 // move constructor
        : n_(o.n_), data_(o.data_) {      // take the size and the block
        o.n_ = 0;                         // leave the source empty,
        o.data_ = nullptr;                // so its destructor frees nothing
    }

    ~Buf() { delete[] data_; }            // delete[] nullptr does nothing
    // … the copy constructor and copy assignment from the previous chapter …

private:
    int  n_;
    int* data_;
};

Buf a{3};
Buf b = std::move(a);    // b owns the block; a is empty`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppMv_hPart", "Part"), tx(t, "cppMv_hMeans", "What it means")]}
        rows={[
          ["Buf&& o", tx(t, "cppMv_p1", "An rvalue reference: a reference that only binds to objects that are about to disappear, or that the caller has given up. Being handed one is permission to take its contents.")],
          [": n_(o.n_), data_(o.data_)", tx(t, "cppMv_p2", "Copies the size and the pointer: the new object now owns the source's block. This is the whole cost of a move: two small copies, whatever the size of the array.")],
          ["o.data_ = nullptr;", tx(t, "cppMv_p3", "Empties the source. It will still be destroyed later; without this line its destructor would free the block we just took.")],
          ["noexcept", tx(t, "cppMv_p4", "A promise that this function never throws an exception. A move that only copies pointers cannot fail, so say so. std::vector depends on it, as a section below shows.")],
          ["std::move(a)", tx(t, "cppMv_p5", "The caller's \"I am done with a\". It makes the compiler pick Buf(Buf&&) instead of Buf(const Buf&).")],
        ]}
      />
      <LifetimeFigure t={t} programs={["move", "forgot"]} title={tx(t, "cppMv_figMoveTitle", "A move hands the block over")} />

      <H3>{tx(t, "cppMv_assignTitle", "Move assignment")}</H3>
      <p>
        {tx(t, "cppMv_assignBody",
          "b = std::move(a) when b already exists calls the move assignment operator. Like copy assignment, it must first deal with the block b already owns. std::exchange(x, v), from <utility>, sets x to v and returns x's old value: one call that takes the source's pointer and leaves nullptr behind.")}
      </p>
      <CodeBlock lang="cpp" filename="buf_move_assign.cpp" t={t}>{`Buf& operator=(Buf&& o) noexcept {
    if (this != &o) {                          // a = std::move(a) must not free a's block
        delete[] data_;                        // let go of what we own
        n_    = std::exchange(o.n_, 0);        // take, and leave 0 behind
        data_ = std::exchange(o.data_, nullptr);
    }
    return *this;
}`}</CodeBlock>

      <H2>{tx(t, "cppMv_catTitle", "lvalues and rvalues: who may be robbed")}</H2>
      <p>
        {tx(t, "cppMv_catBody",
          "How does the compiler know when moving is safe? Every expression in C++ has, besides its type, a value category: it answers whether the object it names will still be used afterwards. The standard has three, with old and odd names. An lvalue (historically, what may stand on the left of =) has a name and is still in use. A prvalue (\"pure rvalue\") is a temporary with no name, such as the result of a function returning by value. An xvalue (\"expiring value\") has a name but has been marked as finished, which is exactly what std::move does. The last two together are the rvalues: the things it is safe to move from.")}
      </p>
      <ValueCategoryFigure t={t} />
      <LessonTable
        headers={[tx(t, "cppMv_hCat", "Category"), tx(t, "cppMv_hTest", "Quick test"), tx(t, "cppMv_hEx", "Examples")]}
        rows={[
          ["lvalue", tx(t, "cppMv_l1", "It has a name, or you can take its address with &."), tx(t, "cppMv_l1ex", "a, v[0], *p, b (a Buf&& parameter)")],
          ["prvalue", tx(t, "cppMv_l2", "A temporary made by the expression itself."), "42, make_buf(), Buf{5}, x + y"],
          ["xvalue", tx(t, "cppMv_l3", "A named object cast to \"expiring\"."), "std::move(a), static_cast<Buf&&>(a)"],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "cppMv_namedWarn",
          "A parameter declared Buf&& b is itself an lvalue inside the function: it has a name, so the compiler assumes you might use it again. To pass it on as a move, write std::move(b). This is the most common reason a \"moving\" function quietly copies.")}
      </Callout>

      <H2>{tx(t, "cppMv_stdmoveTitle", "std::move moves nothing")}</H2>
      <p>
        {tx(t, "cppMv_stdmoveBody",
          "Despite its name, std::move does no work at run time. It is a cast: it turns its argument into an xvalue, and that is all. The move happens afterwards, in the move constructor or move assignment that overload resolution then picks. If the class has none, the copy runs instead, as the figure showed with take(Buf&&) unticked.")}
      </p>
      <CodeBlock lang="cpp" filename="std_move.cpp" t={t}>{`// What std::move amounts to (the real one is a template working for any type):
Buf&& move(Buf& x) noexcept { return static_cast<Buf&&>(x); }

std::move(a);              // alone on a line: does nothing at all
Buf b = std::move(a);      // the move happens HERE, in Buf(Buf&&)

std::string s = "level one";
std::string t = std::move(s);
// s is now "valid but unspecified": in practice usually empty.
s = "level two";           // fine: give it a new value
std::println("{}", s);     // fine again`}</CodeBlock>
      <p>
        {tx(t, "cppMv_fromBody",
          "After a move, the source is in a moved-from state. For standard types the rule is \"valid but unspecified\": the object still works and can be destroyed or given a new value, but you should not count on what it holds. For your own classes, make the moved-from state the empty one, as Buf does, and only ever assign to or destroy a moved-from object.")}
      </p>

      <H2>{tx(t, "cppMv_retTitle", "Returning by value: no copy, no move")}</H2>
      <p>
        {tx(t, "cppMv_retBody",
          "Returning a local object is the place where moves matter most, and where you should write the least. The compiler can build the local object directly in the place where the caller wants the result, so there is nothing left to copy or move. This is called copy elision. For a returned temporary (return Buf{1000};) it is guaranteed since C++17; for a named local (return r;) it is the named return value optimisation, NRVO, which every major compiler does. When it cannot be done, the return moves automatically. Compare the two programs, and count the lines in each output.")}
      </p>
      <LifetimeFigure t={t} programs={["ret", "retMove"]} title={tx(t, "cppMv_figRetTitle", "return r versus return std::move(r)")} />
      <LessonTable
        headers={[tx(t, "cppMv_hWrite", "You write"), tx(t, "cppMv_hHappens", "What happens")]}
        rows={[
          ["return Buf{1000};", tx(t, "cppMv_r1", "Built in the caller's place. Guaranteed: no copy or move constructor is even needed.")],
          ["return r;", tx(t, "cppMv_r2", "Usually built in the caller's place (NRVO); otherwise moved, automatically.")],
          ["return std::move(r);", tx(t, "cppMv_r3", "Forbids the elision: always one move and one more destructor. Never write it for a local; -Wpessimizing-move warns.")],
          ["return member_;", tx(t, "cppMv_r4", "A member is not a local, so it is copied. If the object is finished with it, return std::move(member_) is right here.")],
        ]}
      />

      <H2>{tx(t, "cppMv_noexceptTitle", "noexcept, and why std::vector cares")}</H2>
      <p>
        {tx(t, "cppMv_noexceptBody",
          "When a std::vector runs out of capacity, it allocates a bigger block and carries its elements over, as the figure in the std::vector chapter showed. Moving them would be cheap. But std::vector promises that if anything throws during push_back, the vector is left as it was. If moving element 500 threw, elements 0 to 499 would already be emptied, and the promise broken. So std::vector only moves elements whose move constructor is noexcept; otherwise it copies them all, to be safe.")}
      </p>
      <CodeBlock lang="cpp" filename="grow.cpp" t={t}>{`struct A { std::string s; A(A&&) noexcept = default; /* … */ };
struct B { std::string s; B(B&&)          { /* … */ } };

std::vector<A> va;  // growing: elements are moved, cheap
std::vector<B> vb;  // growing: elements are COPIED, because B's move might throw`}</CodeBlock>
      <p>
        {tx(t, "cppMv_noexceptAfter",
          "= default asks the compiler to write the function the usual way, member by member; the moves it writes are noexcept whenever the members' moves are. The rule to remember: every move constructor and move assignment you write by hand gets noexcept.")}
      </p>

      <H2>{tx(t, "cppMv_fiveTitle", "The rule of five, and back to zero")}</H2>
      <p>
        {tx(t, "cppMv_fiveBody",
          "The rule of three from the previous chapter grows into the rule of five: a class that owns something raw writes the destructor, the two copies and the two moves (or deletes some of them). A classic case is a handle to something on the GPU. OpenGL hands out buffers as plain numbers: glGenBuffers creates one and writes its number into id, glDeleteBuffers destroys it. A GPU buffer cannot sensibly be copied, but it can change owner: the class below is move-only.")}
      </p>
      <CodeBlock lang="cpp" filename="gl_buffer.cpp" t={t}>{`class GLBuffer {
public:
    GLBuffer()  { glGenBuffers(1, &id_); }
    ~GLBuffer() { if (id_) glDeleteBuffers(1, &id_); }

    GLBuffer(const GLBuffer&)            = delete;   // no copies
    GLBuffer& operator=(const GLBuffer&) = delete;

    GLBuffer(GLBuffer&& o) noexcept : id_(std::exchange(o.id_, 0)) {}
    GLBuffer& operator=(GLBuffer&& o) noexcept {
        if (this != &o) {
            if (id_) glDeleteBuffers(1, &id_);
            id_ = std::exchange(o.id_, 0);
        }
        return *this;
    }

    unsigned id() const { return id_; }

private:
    unsigned id_ = 0;          // 0 = "no buffer", OpenGL never hands out 0
};

std::vector<GLBuffer> buffers;
buffers.push_back(GLBuffer{});   // a temporary: moved in
GLBuffer vbo;
buffers.push_back(std::move(vbo));  // vbo given up: moved in, vbo.id() is 0
// buffers.push_back(vbo);       // error: use of deleted function (the copy)`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppMv_hMember", "Special member"), tx(t, "cppMv_hCalledBy", "Called by")]}
        rows={[
          ["~T()", tx(t, "cppMv_s1", "the end of the object's life")],
          ["T(const T&)", tx(t, "cppMv_s2", "T b = a; passing a by value")],
          ["T& operator=(const T&)", tx(t, "cppMv_s3", "b = a;")],
          ["T(T&&) noexcept", tx(t, "cppMv_s4", "T b = std::move(a); T b = make();  passing a temporary by value")],
          ["T& operator=(T&&) noexcept", tx(t, "cppMv_s5", "b = std::move(a);  b = make();")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "cppMv_zeroNote",
          "Write any one of the five yourself, even just a destructor, and the compiler stops writing the moves for you: copies are used instead, silently. One more reason for the rule of zero. With the smart pointers of the next chapter, even GLBuffer's job can be done by a member, and most classes write none of the five.")}
      </Callout>

      <H2>{tx(t, "cppMv_fwdTitle", "A look ahead: forwarding references")}</H2>
      <p>
        {tx(t, "cppMv_fwdBody",
          "In a template, where the type is a parameter T worked out from the call, T&& means something else: a forwarding reference, which binds to anything and remembers whether the caller passed an lvalue or an rvalue. std::forward<T>(x) passes x on the same way it came in: copied if it came as an lvalue, moved if it came as an rvalue. This is how emplace_back builds an element in place from whatever arguments you give it. Templates get their own chapter; for now, recognise the pattern.")}
      </p>
      <CodeBlock lang="cpp" filename="forward.cpp" t={t}>{`template <typename T>
void store(T&& x) {                       // forwarding reference
    items.push_back(std::forward<T>(x));  // copy or move, as the caller passed it
}

std::string name = "player";
store(name);              // an lvalue: copied, name keeps its text
store(std::move(name));   // an rvalue: moved
store(std::string{"x"});  // a prvalue: moved`}</CodeBlock>

      <H2>{tx(t, "cppMv_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cppMv_try1", "Add a move constructor to Noisy that prints move and names the result with a * (\"a*\"). Push three Noisy into a std::vector without reserve and read the output; then remove noexcept and run again.")}</li>
        <li>{tx(t, "cppMv_try2", "Write Buf make() with return r; and then with return std::move(r);. Compile both with -Wall -Wextra and read the warning.")}</li>
        <li>{tx(t, "cppMv_try3", "Write a function void take(Buf&& b) { Buf mine = b; } and check, with prints, that it copies. Fix it with std::move.")}</li>
        <li>{tx(t, "cppMv_try4", "Delete o.data_ = nullptr; from Buf's move constructor and run under -fsanitize=address. Find the double free in the report.")}</li>
      </ol>

      <KeyIdeas t={t} id="cppMv" items={[
        "A move hands over what an object owns and leaves the source empty but destructible; its cost does not depend on the size of the data.",
        "A move constructor takes T&&, copies the pointers, and resets the source. Mark it, and move assignment, noexcept.",
        "lvalues have a name and stay in use; rvalues (prvalues and xvalues) may be moved from. A T&& parameter is an lvalue inside the function.",
        "std::move is only a cast to an rvalue; the move happens in the constructor or assignment it selects, and std::move on a const object copies.",
        "Return locals with return r;: the compiler elides or moves. return std::move(r); only adds work.",
        "Rule of five for classes that own something raw; the rule of zero for everything else.",
      ]} />
    </Article>
  );
}
