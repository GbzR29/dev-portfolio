// ── The programs the C memory-box figure can step through ─────────────────────
// Each one is a short C program and, line by line, what it does to memory.
// The code stays in English; the explanations are tx keys (figCMem_…).
// Sizes are those of a 64-bit Linux or Windows machine: char 1, int 4,
// double 8, any pointer 8.

import type { Program } from "./memModel";

const vars: Program = {
  id: "vars",
  code: [
    "int main(void) {",
    "    int count = 3;",
    "    double price = 2.5;",
    "    char grade = 'A';",
    "    int total;",
    "    total = count * 4;",
    "    double half = count / 2;",
    "    printf(\"%d %.1f\\n\", total, half);",
    "}",
  ],
  steps: [
    { line: 0, key: "figCMem_vars0", en: "main starts. It gets a stack frame: a stretch of memory for its own variables, made when the function starts and given back when it returns.", run: m => m.call("main") },
    { line: 1, key: "figCMem_vars1", en: "int count = 3; reserves 4 bytes in the frame and writes 3 into them. The name count now means \"the int stored at this address\".", run: m => m.local("count", "int", 4, ["3"]) },
    { line: 2, key: "figCMem_vars2", en: "A double takes 8 bytes. Each new variable sits at a lower address: on x86 and ARM the stack grows downwards.", run: m => m.local("price", "double", 8, ["2.5"]) },
    { line: 3, key: "figCMem_vars3", en: "A char is 1 byte holding a small number. 'A' is just the number 65, the character's code in ASCII.", run: m => m.local("grade", "char", 1, ["'A' 65"]) },
    { line: 4, key: "figCMem_vars4", en: "int total; with no value: C does not clear the box. It holds whatever bits were left there, shown as ?. Reading it now would be a bug.", run: m => m.local("total", "int", 4, [null]) },
    { line: 5, key: "figCMem_vars5", en: "Assignment overwrites the 4 bytes of total with 12. The address does not change, only the content.", run: m => m.set("total", 0, "12") },
    { line: 6, key: "figCMem_vars6", en: "count / 2 divides two ints, so the result is an int: 3 / 2 = 1, the fraction is dropped. Only then is 1 converted to the double 1.0. Write count / 2.0 to get 1.5.", run: m => m.local("half", "double", 8, ["1.0"]) },
    { line: 7, key: "figCMem_vars7", en: "printf reads the values and prints them: %d formats an int, %.1f a double with one decimal.", run: m => m.print("12 1.0\n") },
  ],
};

const pointer: Program = {
  id: "pointer",
  code: [
    "int main(void) {",
    "    int x = 5;",
    "    int *p = &x;",
    "    *p = 9;",
    "    int a[3] = {10, 20, 30};",
    "    int *q = a;",
    "    q = q + 1;",
    "    *q = 99;",
    "    printf(\"%d %d\\n\", x, a[1]);",
    "}",
  ],
  steps: [
    { line: 0, key: "figCMem_ptr0", en: "main starts with an empty frame.", run: m => m.call("main") },
    { line: 1, key: "figCMem_ptr1", en: "x is an int box holding 5. Look at its address: that number is what a pointer stores.", run: m => m.local("x", "int", 4, ["5"]) },
    { line: 2, key: "figCMem_ptr2", en: "&x is the address of x. p is a pointer: an 8-byte box whose value is that address. The arrow is how we draw \"p holds the address of x\".", run: m => m.pointer("p", "int *", 4, ["x"]) },
    { line: 3, key: "figCMem_ptr3", en: "*p means \"the int at the address in p\". Writing to *p changes x, not p. x is now 9 although the line never names x.", run: m => m.set("x", 0, "9") },
    { line: 4, key: "figCMem_ptr4", en: "An array is one block of boxes side by side: 3 ints, 12 bytes, with no gaps.", run: m => m.local("a", "int[3]", 4, ["10", "20", "30"]) },
    { line: 5, key: "figCMem_ptr5", en: "An array's name turns into the address of its first element, so q = a means q = &a[0].", run: m => m.pointer("q", "int *", 4, ["a", 0]) },
    { line: 6, key: "figCMem_ptr6", en: "q + 1 moves by one int, not one byte: the address grows by sizeof(int) = 4. q now points at a[1].", run: m => m.move("q", 1) },
    { line: 7, key: "figCMem_ptr7", en: "*q = 99 writes into a[1]. In fact a[i] is defined as *(a + i): indexing is pointer arithmetic.", run: m => m.set("a", 1, "99") },
    { line: 8, key: "figCMem_ptr8", en: "Both changes were made through pointers, and both show up.", run: m => m.print("9 99\n") },
  ],
};

const swapVal: Program = {
  id: "swapVal",
  code: [
    "void swap(int a, int b) {",
    "    int tmp = a;",
    "    a = b;",
    "    b = tmp;",
    "}",
    "int main(void) {",
    "    int x = 1, y = 2;",
    "    swap(x, y);",
    "    printf(\"%d %d\\n\", x, y);",
    "}",
  ],
  steps: [
    { line: 5, key: "figCMem_sv0", en: "main starts.", run: m => m.call("main") },
    { line: 6, key: "figCMem_sv1", en: "x = 1 and y = 2 live in main's frame.", run: m => { m.local("x", "int", 4, ["1"]); m.local("y", "int", 4, ["2"]); } },
    { line: 0, key: "figCMem_sv2", en: "Calling swap makes a new frame below main's. The parameters a and b are new boxes that receive COPIES of x and y. C always passes arguments by value.", run: m => { m.call("swap"); m.local("a", "int", 4, ["1"]); m.local("b", "int", 4, ["2"]); } },
    { line: 1, key: "figCMem_sv3", en: "tmp keeps a copy of a.", run: m => m.local("tmp", "int", 4, ["1"]) },
    { line: 2, key: "figCMem_sv4", en: "a = b changes swap's own box a. x, up in main, is untouched.", run: m => m.set("a", 0, "2") },
    { line: 3, key: "figCMem_sv5", en: "b = tmp. The copies are swapped. The originals are not.", run: m => m.set("b", 0, "1") },
    { line: 4, key: "figCMem_sv6", en: "swap returns and its frame is gone, with the swapped copies inside.", run: m => m.ret() },
    { line: 8, key: "figCMem_sv7", en: "x and y were never changed: this prints 1 2. To change a caller's variable, a function needs its address.", run: m => m.print("1 2\n") },
  ],
};

const swapPtr: Program = {
  id: "swapPtr",
  code: [
    "void swap(int *a, int *b) {",
    "    int tmp = *a;",
    "    *a = *b;",
    "    *b = tmp;",
    "}",
    "int main(void) {",
    "    int x = 1, y = 2;",
    "    swap(&x, &y);",
    "    printf(\"%d %d\\n\", x, y);",
    "}",
  ],
  steps: [
    { line: 5, key: "figCMem_sv0", en: "main starts.", run: m => m.call("main") },
    { line: 6, key: "figCMem_sv1", en: "x = 1 and y = 2 live in main's frame.", run: m => { m.local("x", "int", 4, ["1"]); m.local("y", "int", 4, ["2"]); } },
    { line: 0, key: "figCMem_sp2", en: "This time main passes &x and &y. The parameters are still copies, but copies of ADDRESSES: a points at x and b points at y.", run: m => { m.call("swap"); m.pointer("a", "int *", 4, ["x"]); m.pointer("b", "int *", 4, ["y"]); } },
    { line: 1, key: "figCMem_sp3", en: "tmp = *a reads the int that a points at: x's 1.", run: m => m.local("tmp", "int", 4, ["1"]) },
    { line: 2, key: "figCMem_sp4", en: "*a = *b reads y through b and writes it into x through a. main's x changes.", run: m => m.set("x", 0, "2") },
    { line: 3, key: "figCMem_sp5", en: "*b = tmp writes 1 into y.", run: m => m.set("y", 0, "1") },
    { line: 4, key: "figCMem_sv6", en: "swap returns and its frame is gone, with the swapped copies inside.", run: m => m.ret() },
    { line: 8, key: "figCMem_sp7", en: "Prints 2 1. The pointers let swap reach into main's frame. This is how scanf(\"%d\", &n) stores what it reads.", run: m => m.print("2 1\n") },
  ],
};

const heap: Program = {
  id: "heap",
  code: [
    "int main(void) {",
    "    int n = 3;",
    "    int *nums = malloc(n * sizeof(int));",
    "    if (nums == NULL) return 1;",
    "    for (int i = 0; i < n; i++)",
    "        nums[i] = i * i;",
    "    free(nums);",
    "    nums = NULL;",
    "    return 0;",
    "}",
  ],
  steps: [
    { line: 0, key: "figCMem_hp0", en: "main starts.", run: m => m.call("main") },
    { line: 1, key: "figCMem_hp1", en: "n = 3 is a normal stack variable.", run: m => m.local("n", "int", 4, ["3"]) },
    { line: 2, key: "figCMem_hp2", en: "malloc asks for 3 × 4 = 12 bytes on the heap and returns their address. The block is not cleared: it starts as garbage. nums, on the stack, holds its address.", run: m => { const b = m.malloc("int", 4, 3); m.pointer("nums", "int *", 4, [b]); } },
    { line: 3, key: "figCMem_hp3", en: "malloc returns NULL when it cannot get the memory, so always check before using the pointer." },
    { line: 4, key: "figCMem_hp4", en: "The loop counter i is a stack variable that exists only inside the loop.", run: m => m.local("i", "int", 4, ["0"]) },
    { line: 5, key: "figCMem_hp5", en: "nums[0] = 0 · 0 writes into the heap block through the pointer.", run: m => m.set("#1", 0, "0") },
    { line: 4, key: "figCMem_hp6", en: "i++ makes i = 1, and 1 < 3 so the loop goes on.", run: m => m.set("i", 0, "1") },
    { line: 5, key: "figCMem_hp7", en: "nums[1] = 1.", run: m => m.set("#1", 1, "1") },
    { line: 4, key: "figCMem_hp8", en: "i = 2, still below 3.", run: m => m.set("i", 0, "2") },
    { line: 5, key: "figCMem_hp9", en: "nums[2] = 4. The block is full.", run: m => m.set("#1", 2, "4") },
    { line: 4, key: "figCMem_hp10", en: "i = 3 fails the test i < 3: the loop ends and i goes out of scope.", run: m => m.drop("i") },
    { line: 6, key: "figCMem_hp11", en: "free(nums) gives the block back to the allocator. nums still holds the old address, but that memory is no longer yours: nums is now a dangling pointer.", run: m => m.freeVia("nums"), cut: true },
    { line: 7, key: "figCMem_hp12", en: "Setting the pointer to NULL removes the dangling address. A later mistake then fails loudly (a crash on NULL) instead of silently reading freed memory.", run: m => m.point("nums", null), cut: true },
    { line: 8, key: "figCMem_hp13", en: "The end of main. Check the summary under the drawing: no block still allocated, no pointer to freed memory.", run: () => {} },
  ],
};

const leak: Program = {
  id: "leak",
  code: [
    "int main(void) {",
    "    char *buf = malloc(16);",
    "    buf = malloc(32);",
    "    free(buf);",
    "    return 0;",
    "}",
  ],
  steps: [
    { line: 0, key: "figCMem_lk0", en: "main starts.", run: m => m.call("main") },
    { line: 1, key: "figCMem_lk1", en: "A 16-byte block on the heap; buf holds its address.", run: m => { const b = m.malloc("char", 1, 16); m.pointer("buf", "char *", 1, [b]); } },
    { line: 2, key: "figCMem_lk2", en: "buf now gets the address of a NEW block. Nothing holds the first block's address any more, so nothing can ever free it: a memory leak.", run: m => { const b = m.malloc("char", 1, 32); m.point("buf", [b]); } },
    { line: 3, key: "figCMem_lk3", en: "free(buf) frees the second block only. The first one stays allocated until the program exits. In a loop that runs every frame, a leak like this grows without limit.", run: m => m.freeVia("buf") },
  ],
};

const dangling: Program = {
  id: "dangling",
  code: [
    "int *make(void) {",
    "    int value = 42;",
    "    return &value;",
    "}",
    "void other(void) {",
    "    int junk = 1234;",
    "}",
    "int main(void) {",
    "    int *p = make();",
    "    other();",
    "    printf(\"%d\\n\", *p);",
    "}",
  ],
  steps: [
    { line: 7, key: "figCMem_dg0", en: "main starts.", run: m => m.call("main") },
    { line: 8, key: "figCMem_dg1", en: "main calls make. p has no value yet.", run: m => { m.pointer("p", "int *", 4); m.call("make"); } },
    { line: 1, key: "figCMem_dg2", en: "value = 42 lives in make's frame.", run: m => m.local("value", "int", 4, ["42"]) },
    { line: 2, key: "figCMem_dg3", en: "make returns the address of its own local variable, and then its frame is gone. p holds an address inside a dead frame: a dangling pointer (red). The compiler warns about this line.", run: m => { m.ret(); const v = m.s.frames.at(-1)!.cells[0]; const p = m.cell("p"); p.ptr = { addr: v.addr, owner: v.key }; m.touched.add(`${p.key}:0`); } },
    { line: 9, key: "figCMem_dg4", en: "The next call, other, gets the same stretch of stack. Its variable junk lands exactly where value was.", run: m => { m.call("other"); m.local("junk", "int", 4, ["1234"]); } },
    { line: 6, key: "figCMem_dg5", en: "other returns.", run: m => m.ret() },
    { line: 10, key: "figCMem_dg6", en: "*p reads whatever is at that address now: 1234 here, something else on another compiler or with other settings. Reading through a dangling pointer is undefined behaviour.", run: m => m.print("1234\n") },
  ],
};

const string: Program = {
  id: "string",
  code: [
    "int main(void) {",
    "    char name[6] = \"hello\";",
    "    char *c = name;",
    "    while (*c != '\\0')",
    "        c++;",
    "    size_t len = c - name;",
    "    name[0] = 'j';",
    "    return 0;",
    "}",
  ],
  steps: [
    { line: 0, key: "figCMem_st0", en: "main starts.", run: m => m.call("main") },
    { line: 1, key: "figCMem_st1", en: "A string in C is an array of chars ending with the zero byte '\\0'. \"hello\" has 5 letters, so it needs 6 bytes.", run: m => m.local("name", "char[6]", 1, ["h", "e", "l", "l", "o", "\\0"]) },
    { line: 2, key: "figCMem_st2", en: "c points at the first char.", run: m => m.pointer("c", "char *", 1, ["name", 0]) },
    { line: 3, key: "figCMem_st3", en: "*c is 'h', not '\\0', so the loop steps on: c++ moves one char (1 byte).", run: m => m.move("c", 1) },
    { line: 3, key: "figCMem_st4", en: "'e', keep going.", run: m => m.move("c", 1) },
    { line: 3, key: "figCMem_st5", en: "'l'.", run: m => m.move("c", 1) },
    { line: 3, key: "figCMem_st6", en: "'l'.", run: m => m.move("c", 1) },
    { line: 3, key: "figCMem_st7", en: "'o', and now c reaches the '\\0': the loop stops. Nothing else marks the end of a C string. This loop is what strlen does.", run: m => m.move("c", 1) },
    { line: 5, key: "figCMem_st8", en: "Subtracting two pointers into the same array counts the elements between them: len = 5.", run: m => m.local("len", "size_t", 8, ["5"]) },
    { line: 6, key: "figCMem_st9", en: "The array is writable: name now reads \"jello\".", run: m => m.set("name", 0, "j") },
  ],
};

const noTerm: Program = {
  id: "noTerm",
  code: [
    "int main(void) {",
    "    char tag[3] = \"ok\";",
    "    char name[5] = {'h','e','l','l','o'};",
    "    char *c = name;",
    "    while (*c != '\\0')",
    "        c++;",
    "    size_t len = c - name;",
    "    return 0;",
    "}",
  ],
  steps: [
    { line: 0, key: "figCMem_st0", en: "main starts.", run: m => m.call("main") },
    { line: 1, key: "figCMem_nt1", en: "tag is a proper string: 'o', 'k', '\\0'.", run: m => m.local("tag", "char[3]", 1, ["o", "k", "\\0"]) },
    { line: 2, key: "figCMem_nt2", en: "name has 5 chars and NO '\\0'. It is an array of chars, but not a string. Look where it sits: right below tag.", run: m => m.local("name", "char[5]", 1, ["h", "e", "l", "l", "o"]) },
    { line: 3, key: "figCMem_st2", en: "c points at the first char.", run: m => m.pointer("c", "char *", 1, ["name", 0]) },
    { line: 4, key: "figCMem_nt4", en: "The same loop walks through name…", run: m => m.move("c", 4) },
    { line: 4, key: "figCMem_nt5", en: "…passes 'o' and finds no '\\0'. c is now one past the end of name (orange). Holding that address is allowed; reading *c is not, but the loop does.", run: m => m.move("c", 1) },
    { line: 4, key: "figCMem_nt6", en: "It walks on into tag, memory that has nothing to do with name.", run: m => m.move("c", 1) },
    { line: 4, key: "figCMem_nt7", en: "It stops only at tag's '\\0', by luck.", run: m => m.move("c", 1) },
    { line: 6, key: "figCMem_nt8", en: "len = 7 for a 5-letter word. With other neighbours it could be anything, or the program could crash. Every C string function (strlen, strcpy, printf %s) trusts the '\\0'.", run: m => m.local("len", "size_t", 8, ["7"]) },
  ],
};

const structs: Program = {
  id: "struct",
  code: [
    "struct Point { int x; int y; };",
    "int main(void) {",
    "    struct Point pt = {3, 4};",
    "    struct Point *pp = &pt;",
    "    pp->x = 7;",
    "    (*pp).y = 8;",
    "    return 0;",
    "}",
  ],
  steps: [
    { line: 1, key: "figCMem_sc0", en: "The struct line only describes a type: no memory yet. main starts.", run: m => m.call("main") },
    { line: 2, key: "figCMem_sc1", en: "pt is one block of 8 bytes: the field x at offset 0, y at offset 4. A struct groups named fields side by side, like an array whose elements have names.", run: m => m.local("pt", "struct Point", 4, ["3", "4"], { labels: [".x", ".y"] }) },
    { line: 3, key: "figCMem_sc2", en: "pp points at the whole struct. Its address is also the address of the first field.", run: m => m.pointer("pp", "struct Point *", 8, ["pt"]) },
    { line: 4, key: "figCMem_sc3", en: "pp->x means \"field x of the struct pp points at\".", run: m => m.set("pt", 0, "7") },
    { line: 5, key: "figCMem_sc4", en: "(*pp).y is the same thing spelled out: dereference, then pick the field. -> is the short form.", run: m => m.set("pt", 1, "8") },
  ],
};

const overflow: Program = {
  id: "overflow",
  code: [
    "int main(void) {",
    "    int secret = 42;",
    "    int a[3] = {1, 2, 3};",
    "    for (int i = 0; i <= 3; i++)",
    "        a[i] = 0;",
    "    printf(\"%d\\n\", secret);",
    "}",
  ],
  steps: [
    { line: 0, key: "figCMem_ov0", en: "main starts.", run: m => m.call("main") },
    { line: 1, key: "figCMem_ov1", en: "secret = 42 is declared first, so it sits at the higher address.", run: m => m.local("secret", "int", 4, ["42"]) },
    { line: 2, key: "figCMem_ov2", en: "a takes the 12 bytes just below secret. a[0], a[1] and a[2] are the only valid elements.", run: m => m.local("a", "int[3]", 4, ["1", "2", "3"]) },
    { line: 4, key: "figCMem_ov3", en: "For i = 0, 1 and 2 the loop clears the array, as intended.", run: m => { m.local("i", "int", 4, ["2"]); m.set("a", 0, "0"); m.set("a", 1, "0"); m.set("a", 2, "0"); } },
    { line: 3, key: "figCMem_ov4", en: "i = 3. The test is i <= 3 instead of i < 3, so the loop runs once more: the classic off-by-one.", run: m => m.set("i", 0, "3") },
    { line: 4, key: "figCMem_ov5", en: "a[3] is the address of a plus 3 × 4 bytes: exactly where secret lives. The write lands there. No error, no warning, no crash.", run: m => m.set("secret", 0, "0") },
    { line: 5, key: "figCMem_ov6", en: "secret prints 0 although no line ever assigned it. Here the stack layout made it secret; with another compiler or with -O2 it may be the return address, or the loop may never end. That is undefined behaviour.", run: m => { m.drop("i"); m.print("0\n"); } },
  ],
};

const file: Program = {
  id: "file",
  code: [
    "int main(void) {",
    "    FILE *f = fopen(\"scores.txt\", \"r\");",
    "    if (f == NULL) return 1;",
    "    char line[6];",
    "    fgets(line, sizeof line, f);",
    "    fclose(f);",
    "    f = NULL;",
    "    return 0;",
    "}",
  ],
  steps: [
    { line: 0, key: "figCMem_fl0", en: "main starts.", run: m => m.call("main") },
    { line: 1, key: "figCMem_fl1", en: "fopen asks the operating system to open the file and allocates a FILE structure to track it: the file's handle, the read position and a buffer. f points at it.", run: m => { const b = m.malloc("FILE", 216, 1, "FILE  scores.txt", ["open"]); m.pointer("f", "FILE *", 216, [b]); } },
    { line: 2, key: "figCMem_fl2", en: "fopen returns NULL if the file is missing or cannot be read. Always check, and errno says why." },
    { line: 3, key: "figCMem_fl3", en: "A small array for one line of text, not yet filled.", run: m => m.local("line", "char[6]", 1, [null, null, null, null, null, null]) },
    { line: 4, key: "figCMem_fl4", en: "fgets reads one line, at most sizeof line − 1 = 5 characters, keeps the '\\n' and always adds the '\\0'. The file held \"42\".", run: m => { m.set("line", 0, "4"); m.set("line", 1, "2"); m.set("line", 2, "\\n"); m.set("line", 3, "\\0"); } },
    { line: 5, key: "figCMem_fl5", en: "fclose writes out anything still buffered, closes the operating-system handle and frees the FILE. Forgetting it leaks the handle, and a process may only hold a limited number of them open.", run: m => m.freeVia("f"), cut: true },
    { line: 6, key: "figCMem_fl6", en: "As after free: clear the pointer so it cannot be used by mistake.", run: m => m.point("f", null), cut: true },
    { line: 7, key: "figCMem_fl7", en: "The end. Check the summary: no leaked FILE, no pointer to a closed one.", run: () => {} },
  ],
};

const vector: Program = {
  id: "vector",
  code: [
    "int main() {",
    "    std::vector<int> v = {1, 2, 3};",
    "    v.push_back(4);",
    "    int sum = 0;",
    "    for (int x : v) sum += x;",
    "}   // no free, no delete",
  ],
  steps: [
    { line: 0, key: "figCMem_vc0", en: "This one is C++. main starts.", run: m => m.call("main") },
    { line: 1, key: "figCMem_vc1", en: "A std::vector is three small values on the stack: a pointer to a heap block, the size (elements used) and the capacity (elements allocated). Its constructor allocated the block and copied 1, 2, 3 in. The same IntVec you wrote by hand in C.", run: m => { const b = m.malloc("int", 4, 3, "operator new(12)", ["1", "2", "3"]); m.pointer("v.data", "int *", 4, [b]); m.local("v.size", "size_t", 8, ["3"]); m.local("v.cap", "size_t", 8, ["3"]); } },
    { line: 2, key: "figCMem_vc2", en: "push_back finds the block full (size = capacity). It allocates a block twice as large and copies the elements across.", run: m => { const b = m.malloc("int", 4, 6, "operator new(24)", ["1", "2", "3"]); m.set(b, 3, "4"); } },
    { line: 2, key: "figCMem_vc3", en: "Then it frees the old block, points data at the new one and updates size and capacity. All the realloc bookkeeping from the C chapter, done inside push_back.", run: m => { m.freeVia("v.data"); m.point("v.data", ["#2"]); m.set("v.size", 0, "4"); m.set("v.cap", 0, "6"); } },
    { line: 4, key: "figCMem_vc4", en: "The loop reads the elements through data, exactly like a C array: sum = 10.", run: m => m.local("sum", "int", 4, ["10"]) },
    { line: 5, key: "figCMem_vc5", en: "At the closing brace v goes out of scope, and C++ calls its destructor, ~vector(), which frees the block. You wrote no free, so there is no free to forget, and this happens on every way out of the block, even an early return.", run: m => { m.freeVia("v.data"); m.drop("v.data"); m.drop("v.size"); m.drop("v.cap"); } },
  ],
};

export const PROGRAMS = { vars, pointer, swapVal, swapPtr, heap, leak, dangling, string, noTerm, struct: structs, overflow, file, vector } as const;
export type ProgramId = keyof typeof PROGRAMS;
