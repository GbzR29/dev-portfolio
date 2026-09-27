"use client";

// Linear Structures 3: stacks — LIFO and the four operations; a stack on the
// dynamic array and on a linked list; the call stack as the stack you already
// know; checking brackets; evaluating postfix; infix to postfix with the
// shunting-yard algorithm; an explicit stack replacing recursion (iterative
// quicksort); undo/redo; the monotonic stack for "next greater element" and
// its amortised O(n); worked examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { StackFigure } from "@/components/lesson/figures/algo/StackFigure";

export function StacksContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alStack_intro",
          "The two previous chapters built structures that can do many things. A stack deliberately does very little: you may only add at the top, look at the top and remove from the top. That restriction is what makes it powerful. Whenever a problem has nesting, something opened that must be closed in the reverse order, or work that must be put aside and resumed later, a stack is the natural tool. You have already been using one: the call stack of the Recursion chapter.")}
      </Lead>

      <H2>{tx(t, "alStack_defTitle", "Last in, first out")}</H2>
      <p>
        {tx(t, "alStack_defBody",
          "A stack is a collection with one open end, the top. Think of a pile of plates: you put a plate on top and take the top plate off; the plate you took is always the one put there most recently. This rule is called LIFO, last in, first out. A stack is an abstract data type: it is defined by its operations and what they do, not by how it is stored. Any implementation must provide these, all in O(1):")}
      </p>
      <LessonTable
        headers={[tx(t, "alStack_tOp", "Operation"), tx(t, "alStack_tDoes", "What it does")]}
        rows={[
          ["push(x)", tx(t, "alStack_op1", "puts x on top")],
          ["pop()", tx(t, "alStack_op2", "removes the top element (the stack must not be empty)")],
          ["top()", tx(t, "alStack_op3", "returns the top element without removing it (the stack must not be empty)")],
          ["empty()", tx(t, "alStack_op4", "tells whether there are no elements")],
        ]}
      />

      <H2>{tx(t, "alStack_implTitle", "Two ways to build one")}</H2>
      <p>
        {tx(t, "alStack_implBody",
          "The end of a dynamic array is a perfect top: push_back, pop_back and reading the last element are all O(1) (push amortised). So a stack can simply wrap the IntVector of the Dynamic Array chapter. The front of a linked list works just as well, with push_front and pop_front: each push allocates one node, which costs more than writing into spare capacity but never needs a big copy. The array version is the usual choice; std::stack in C++ is a thin wrapper that by default sits on a std::deque (Queues chapter).")}
      </p>
      <CodeBlock lang="cpp" filename="int_stack.cpp" t={t}>{`struct IntStack {
    IntVector v;                                   // from the Dynamic Array chapter

    void push(int x)   { v.push_back(x); }         // O(1) amortised
    void pop()         { v.pop_back(); }           // O(1); caller checks !empty()
    int  top()         { return v[v.size - 1]; }   // O(1); caller checks !empty()
    bool empty() const { return v.empty(); }
    int  size() const  { return v.size; }
};`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "alStack_emptyWarn", "pop() and top() on an empty stack are errors. In this code they read or write outside the array (undefined behaviour); std::stack behaves the same way. Always check empty() first when the stack might be empty, as the algorithms below do.")}
      </Callout>

      <H2>{tx(t, "alStack_callTitle", "The stack you already know")}</H2>
      <p>
        {tx(t, "alStack_callBody",
          "Every function call pushes a frame (parameters, locals, return address) onto the call stack, and every return pops it. The function that returns is always the one called most recently: LIFO. This is why recursion and stacks are so closely related: any recursive algorithm can be turned into a loop with an explicit stack that holds what the frames held, and a stack-based loop can often be written recursively. The explicit version lives on the heap, so it cannot overflow the small call stack.")}
      </p>

      <H2>{tx(t, "alStack_bracketsTitle", "Checking brackets")}</H2>
      <p>
        {tx(t, "alStack_bracketsBody",
          "Is { a[i] * (b + c) } correctly bracketed? The rule is that each closing bracket must match the most recent opening bracket that is still open, which is exactly the top of a stack. Read the text left to right: push every opening bracket; at a closing bracket, the top must be the matching opener, and we pop it. If the stack is empty at that moment, or the top is a different kind, the text is not balanced. At the end, anything still on the stack was never closed. Compilers and editors do exactly this.")}
      </p>
      <CodeBlock lang="cpp" filename="balanced.cpp" t={t}>{`bool balanced(const char* s) {                     // a C string, ends with '\\0'
    IntStack st;
    for (int i = 0; s[i] != '\\0'; ++i) {
        char c = s[i];
        if (c == '(' || c == '[' || c == '{') {
            st.push(c);                                // remember what is open
        } else if (c == ')' || c == ']' || c == '}') {
            char open = c == ')' ? '(' : c == ']' ? '[' : '{';
            if (st.empty() || st.top() != open) return false;   // nothing open, or wrong kind
            st.pop();
        }                                              // other characters are ignored
    }
    return st.empty();                                 // everything opened was closed
}`}</CodeBlock>

      <StackFigure t={t} />

      <p>
        {tx(t, "alStack_bracketsWhy",
          "A counter is not enough. Counting +1 for ( and −1 for ) accepts ( [ ) ], where every kind balances but the nesting is crossed. The stack remembers not only how many brackets are open but which ones and in what order. The work is one push or pop per bracket: Θ(n) time, and up to Θ(n) memory for deeply nested text.")}
      </p>

      <H2>{tx(t, "alStack_postfixTitle", "Evaluating postfix expressions")}</H2>
      <p>
        {tx(t, "alStack_postfixBody",
          "In the usual infix notation, 3 + 4 · 2, the operator sits between its operands, and we need precedence rules and brackets to know what is computed first (Math track, Order of Operations). In postfix notation (also called reverse Polish notation) the operator comes after its two operands: 3 4 2 · +. There are no brackets and no precedence, because the order of the tokens fixes the order of the work. Evaluation is a stack loop: push each number; for each operator, pop two numbers, apply it, push the result. Careful with the order: the first number popped is the right operand, so for 7 2 − we pop 2, then 7, and compute 7 − 2.")}
      </p>
      <CodeBlock lang="cpp" filename="eval_postfix.cpp" t={t}>{`// Evaluates e.g. "5 1 2 + 4 * + 3 -". Whole numbers, + - * /, tokens separated by spaces.
int evalPostfix(const char* s) {
    IntStack st;
    for (int i = 0; s[i] != '\\0'; ++i) {
        char c = s[i];
        if (c == ' ') continue;
        if (c >= '0' && c <= '9') {                    // read a whole number
            int num = 0;
            while (s[i] >= '0' && s[i] <= '9') { num = num * 10 + (s[i] - '0'); ++i; }
            --i;                                       // the for loop's ++i moves past it
            st.push(num);
        } else {                                       // an operator
            int b = st.top(); st.pop();                // right operand: popped first
            int a = st.top(); st.pop();
            st.push(c == '+' ? a + b : c == '-' ? a - b : c == '*' ? a * b : a / b);
        }
    }
    return st.top();                                   // exactly one value is left
}`}</CodeBlock>
      <p>
        {tx(t, "alStack_digitBody",
          "s[i] − '0' converts a digit character to its value: the characters '0' to '9' have consecutive codes, so '7' − '0' = 7. Reading 123 digit by digit: 0 · 10 + 1 = 1, 1 · 10 + 2 = 12, 12 · 10 + 3 = 123, which is Horner's rule from the Math track's Expressions chapter.")}
      </p>

      <H2>{tx(t, "alStack_shuntTitle", "From infix to postfix: the shunting-yard algorithm")}</H2>
      <p>
        {tx(t, "alStack_shuntBody",
          "Dijkstra's shunting-yard algorithm converts ordinary infix into postfix with one stack for operators, named after a railway yard where carriages are sorted with a siding. Read the tokens left to right. An operand goes straight to the output. An operator first pops to the output every operator on the stack that binds at least as tightly (higher or equal precedence, for left-associative operators like − and /, so that 8 − 3 − 2 means (8 − 3) − 2), and is then pushed. An opening bracket is pushed; a closing bracket pops operators to the output until its opening bracket, which is discarded. At the end, pop everything left. The operators that wait on the stack are those whose right operand has not been completely read yet.")}
      </p>
      <CodeBlock lang="cpp" filename="shunting_yard.cpp" t={t}>{`int prec(char op) { return (op == '*' || op == '/') ? 2 : 1; }   // + and - bind less

// "3+4*(2-1)" -> "3421-*+". Operands are single characters; out must be large enough.
void toPostfix(const char* in, char* out) {
    IntStack ops;
    int k = 0;
    for (int i = 0; in[i] != '\\0'; ++i) {
        char c = in[i];
        if (c == ' ') continue;
        if (c == '(') {
            ops.push(c);
        } else if (c == ')') {
            while (ops.top() != '(') { out[k++] = (char)ops.top(); ops.pop(); }
            ops.pop();                                         // drop the '('
        } else if (c == '+' || c == '-' || c == '*' || c == '/') {
            while (!ops.empty() && ops.top() != '(' && prec((char)ops.top()) >= prec(c)) {
                out[k++] = (char)ops.top();                    // it binds at least as tightly
                ops.pop();
            }
            ops.push(c);
        } else {
            out[k++] = c;                                      // an operand
        }
    }
    while (!ops.empty()) { out[k++] = (char)ops.top(); ops.pop(); }
    out[k] = '\\0';
}`}</CodeBlock>
      <p>
        {tx(t, "alStack_shuntTrace",
          "Trace 3 + 4 * 2 − 1. 3: output \"3\". +: stack empty, push. 4: output \"34\". *: the top is +, which binds less, so just push; stack [+, *]. 2: output \"342\". −: the top * binds more, pop it (\"342*\"); the new top + binds equally, pop it (\"342*+\"); push −. 1: output \"342*+1\". End: pop −. Result 3 4 2 * + 1 −, which evaluates to 3 + 8 − 1 = 10, as the precedence rules require.")}
      </p>

      <H2>{tx(t, "alStack_explicitTitle", "Replacing recursion with a stack")}</H2>
      <p>
        {tx(t, "alStack_explicitBody",
          "Quicksort's recursion only remembers which ranges still have to be sorted. An explicit stack of (lo, hi) pairs can hold them instead, which removes every risk of overflowing the call stack. Each pair is pushed as two ints and popped in the reverse order. The order in which ranges are processed changes, but every range is still partitioned exactly once, so the result and the cost are the same.")}
      </p>
      <CodeBlock lang="cpp" filename="quicksort_iterative.cpp" t={t}>{`void quickSortIterative(int* a, int n) {
    IntStack st;
    st.push(0); st.push(n - 1);                  // the whole array still to do
    while (!st.empty()) {
        int hi = st.top(); st.pop();             // popped in reverse order of pushing
        int lo = st.top(); st.pop();
        if (lo >= hi) continue;                  // 0 or 1 elements
        int q = partitionLomuto(a, lo, hi);      // from the Quicksort chapter
        st.push(lo);    st.push(q - 1);
        st.push(q + 1); st.push(hi);
    }
}`}</CodeBlock>
      <p>
        {tx(t, "alStack_undoBody",
          "Stacks also appear in everyday software. An editor's undo keeps a stack of changes: each edit is pushed, undo pops the most recent one and reverts it. Redo is a second stack: undo pushes the change it reverted onto it, redo pops from it, and any new edit clears it. A browser's back and forward buttons work the same way with visited pages.")}
      </p>

      <H2>{tx(t, "alStack_monoTitle", "The monotonic stack")}</H2>
      <p>
        {tx(t, "alStack_monoBody",
          "A sharper use: for each element of an array, find the next element to its right that is bigger (for example, for each day's temperature, the next warmer day). Checking every later element costs Θ(n²). With a stack it is Θ(n). Keep on the stack the indices that are still waiting for their answer. Their values decrease from bottom to top (a monotonic stack): if a later value were bigger than an earlier one, the earlier one would already have its answer. When a new element arrives, it is the answer for every waiting element smaller than it, and those are all at the top: pop them and record it. Then push the new index to wait.")}
      </p>
      <CodeBlock lang="cpp" filename="next_greater.cpp" t={t}>{`// res[i] = the first element to the right of a[i] that is bigger, or -1.
void nextGreater(const int* a, int* res, int n) {
    IntStack st;                                   // indices waiting for an answer
    for (int i = 0; i < n; ++i) {
        while (!st.empty() && a[st.top()] < a[i]) {
            res[st.top()] = a[i];                  // a[i] is their answer
            st.pop();
        }
        st.push(i);
    }
    while (!st.empty()) { res[st.top()] = -1; st.pop(); }   // nothing bigger came
}`}</CodeBlock>
      <H3>{tx(t, "alStack_monoCostTitle", "Why a loop inside a loop is still linear")}</H3>
      <p>
        {tx(t, "alStack_monoCost",
          "The inner while loop can pop many elements at once, so it looks like Θ(n²). Count differently: every index is pushed exactly once and popped at most once, so over the whole run there are at most n pushes and n pops, whatever the input. The total is Θ(n); a single step may be expensive, but the steps together are cheap. This is the same amortised reasoning as the dynamic array's push_back.")}
      </p>

      <H2>{tx(t, "alStack_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alStack_w1",
          "1. Evaluate 5 1 2 + 4 * + 3 −. Push 5, 1, 2: [5, 1, 2]. +: pop 2 and 1, push 3: [5, 3]. Push 4: [5, 3, 4]. *: pop 4 and 3, push 12: [5, 12]. +: pop 12 and 5, push 17: [17]. Push 3: [17, 3]. −: pop 3 and 17, push 17 − 3 = 14. The value is 14, the infix 5 + (1 + 2) · 4 − 3.")}
      </p>
      <p>
        {tx(t, "alStack_w2",
          "2. Next greater elements of [2, 7, 3, 5, 4, 6, 8]. i = 0: push 0. i = 1 (7): 2 < 7, so res[0] = 7; push 1. i = 2 (3): push. i = 3 (5): 3 < 5, res[2] = 5; 7 is not < 5; push. i = 4 (4): push; stack holds the values 7, 5, 4. i = 5 (6): res[4] = 6, res[3] = 6; push. i = 6 (8): res[5] = 8, res[1] = 8; push. End: res[6] = −1. Result [7, 8, 5, 6, 6, 8, −1], with 7 pushes and 7 pops in total.")}
      </p>
      <p>
        {tx(t, "alStack_w3",
          "3. Check f(g(x). Push ( after f, push ( after g, pop at the first ), end of text with one ( still on the stack: not balanced. The error is \"unclosed bracket\", and the stack even says which one.")}
      </p>

      <H2>{tx(t, "alStack_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alStack_tMistake", "Mistake"), tx(t, "alStack_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alStack_e1", "pop or top on an empty stack"), tx(t, "alStack_e1b", "undefined behaviour. Check empty() whenever the input can be malformed, e.g. a ) with nothing open")],
          [tx(t, "alStack_e2", "Swapping the operands"), tx(t, "alStack_e2b", "the first pop is the right operand: 7 2 − is 7 − 2, not 2 − 7")],
          [tx(t, "alStack_e3", "Forgetting the final empty check"), tx(t, "alStack_e3b", "\"((\" passes every closing test because there are none. Balanced also requires an empty stack at the end")],
          [tx(t, "alStack_e4", "Popping equal precedence for right-associative operators"), tx(t, "alStack_e4b", "2 ^ 3 ^ 2 means 2^(3^2); for such operators pop only strictly higher precedence")],
          [tx(t, "alStack_e5", "Judging nested loops by their shape"), tx(t, "alStack_e5b", "count how often each element can be pushed and popped; the monotonic stack is Θ(n)")],
        ]}
      />

      <KeyIdeas t={t} id="alStack" items={[
        "A stack is LIFO: push, pop and top all work at one end, in O(1).",
        "The end of a dynamic array (or the front of a linked list) makes a natural top.",
        "The call stack is a stack; any recursion can use an explicit stack instead.",
        "Bracket checking: push openers, match and pop at closers, finish empty.",
        "Postfix needs no brackets or precedence: numbers push, operators pop two and push one. Shunting-yard converts infix to postfix.",
        "A monotonic stack answers \"next greater element\" in Θ(n): each element is pushed once and popped at most once.",
      ]} />
    </Article>
  );
}
