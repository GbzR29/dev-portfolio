"use client";

// Foundations 3: a first program with no C library — hello.asm line by line;
// sections (.text .data .rodata .bss) and data directives (db dd resb equ $);
// labels, global and _start; system calls on Linux x86-64 (rax = number,
// rdi rsi rdx r10 r8 r9, rcx/r11 clobbered), write and exit, file
// descriptors; nasm -f elf64 + ld + echo $?; what happens without exit (00 00
// = add [rax], al → SIGSEGV, status 139); error results (−9 EBADF → 247);
// stepping with gdb; how Windows and macOS differ.

import { CodeBlock, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { CpuFigure } from "@/components/lesson/figures/asm/CpuFigure";

export function FirstProgramContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "asmFirst_intro",
          "Time to write a whole program: one that prints a line and exits. It uses no C library at all, not even printf. It asks the Linux kernel directly, through two system calls. That way you can see every instruction the program runs, from the first to the last.")}
      </Lead>

      <Goals t={t} id="asmFirst" items={[
        "Write a NASM program with a .data and a .text section, labels and _start.",
        "Make the write and exit system calls, and say which registers carry what.",
        "Assemble, link and run it, and check its exit status from the shell.",
        "Explain what happens when a program forgets to exit.",
      ]} />

      <H2>{tx(t, "asmFirst_helloTitle", "hello.asm")}</H2>
      <CodeBlock lang="nasm" filename="hello.asm" t={t}>{`; hello.asm: print a line, then exit with status 0
        section .data
msg:    db      "Hello, assembly!", 10    ; the text, then a newline (10)
len     equ     $ - msg                   ; its length, worked out by NASM

        section .text
        global  _start                    ; let the linker see _start
_start:
        mov     rax, 1          ; system call 1: write
        mov     rdi, 1          ; argument 1: file descriptor 1 = stdout
        mov     rsi, msg        ; argument 2: address of the bytes
        mov     rdx, len        ; argument 3: how many bytes
        syscall                 ; ask the kernel

        mov     rax, 60         ; system call 60: exit
        xor     edi, edi        ; argument 1: status 0
        syscall`}</CodeBlock>
      <p>
        {tx(t, "asmFirst_layoutBody",
          "A NASM line has up to four parts: a label, an instruction or directive, its operands, and a comment after a semicolon. Every part is optional. Indenting the instructions is only a habit that keeps the labels easy to spot.")}
      </p>

      <H2>{tx(t, "asmFirst_secTitle", "Sections: code and data apart")}</H2>
      <p>
        {tx(t, "asmFirst_secBody",
          "A program is divided into sections. Each one ends up in memory with its own permissions: code can be run but not written, data can be written but not run. That separation blocks a whole family of attacks that write instructions into a buffer and then jump to them.")}
      </p>
      <LessonTable
        headers={[tx(t, "asmFirst_hSec", "Section"), tx(t, "asmFirst_hHolds", "Holds"), tx(t, "asmFirst_hPerm", "In memory")]}
        rows={[
          [".text", tx(t, "asmFirst_sec1", "the instructions"), tx(t, "asmFirst_perm1", "read and run")],
          [".data", tx(t, "asmFirst_sec2", "variables with a starting value"), tx(t, "asmFirst_perm2", "read and write")],
          [".rodata", tx(t, "asmFirst_sec3", "constants, such as fixed strings"), tx(t, "asmFirst_perm3", "read only")],
          [".bss", tx(t, "asmFirst_sec4", "variables that start at zero; they take no space in the file"), tx(t, "asmFirst_perm4", "read and write")],
        ]}
      />
      <p>{tx(t, "asmFirst_dirBody", "Inside a data section, directives lay out bytes:")}</p>
      <LessonTable
        headers={[tx(t, "asmFirst_hLine", "Line"), tx(t, "asmFirst_hMeans", "What it means")]}
        rows={[
          ["msg: db \"Hello, assembly!\", 10", tx(t, "asmFirst_d1", "db = define bytes: the 16 characters of the string, then one byte with the value 10, the newline character. msg is a label, a name for the address of the first byte.")],
          ["len equ $ - msg", tx(t, "asmFirst_d2", "equ gives a name to a number and takes no memory. $ is the address NASM has reached, just past the newline, so $ − msg is the length of the message: 17.")],
          ["count: dd 0", tx(t, "asmFirst_d3", "dd = define a double word: 4 bytes holding 0. dw and dq lay out 2 and 8 bytes.")],
          ["buf: resb 64", tx(t, "asmFirst_d4", "In .bss: reserve 64 bytes without giving them a value. They start at zero.")],
        ]}
      />

      <H2>{tx(t, "asmFirst_labelTitle", "Labels and _start")}</H2>
      <p>
        {tx(t, "asmFirst_labelBody",
          "A label is a name for an address. NASM replaces every use of msg with the address where the string ends up. A label in .text, like _start, names the address of an instruction. global _start writes that name into the object file so the linker can see it. The linker makes _start the entry point: the address the CPU jumps to when the program starts. A C program starts at _start too, but there the C library provides it, prepares a few things and then calls your main. Here nothing runs before your first line.")}
      </p>

      <H2>{tx(t, "asmFirst_sysTitle", "System calls: asking the kernel")}</H2>
      <p>
        {tx(t, "asmFirst_sysBody",
          "Your program cannot reach the screen, the disk or the network by itself. Those belong to the kernel, the core of the operating system, which runs with more privileges than your program. The syscall instruction is the door: it switches the CPU into kernel mode and jumps to the kernel's entry code. The kernel reads the request from the registers, does the work, and returns to the instruction after syscall. Linux on x86-64 fixes which register carries what:")}
      </p>
      <LessonTable
        headers={[tx(t, "asmFirst_hReg", "Register"), tx(t, "asmFirst_hCarries", "Carries")]}
        rows={[
          ["rax", tx(t, "asmFirst_r1", "the system call number on the way in; the result on the way out")],
          ["rdi, rsi, rdx", tx(t, "asmFirst_r2", "arguments 1, 2 and 3")],
          ["r10, r8, r9", tx(t, "asmFirst_r3", "arguments 4, 5 and 6")],
          ["rcx, r11", tx(t, "asmFirst_r4", "overwritten by syscall itself: the CPU saves the return address and the flags there")],
        ]}
      />
      <p>{tx(t, "asmFirst_callsBody", "Every other register keeps its value. The two calls this program needs:")}</p>
      <LessonTable
        headers={[tx(t, "asmFirst_hNum", "Number"), tx(t, "asmFirst_hCall", "Call"), tx(t, "asmFirst_hDoes", "Does"), tx(t, "asmFirst_hRet", "Returns")]}
        rows={[
          ["1", "write(fd, buf, count)", tx(t, "asmFirst_c1", "sends count bytes, starting at address buf, to file descriptor fd"), tx(t, "asmFirst_c1r", "the number of bytes written, or a negative error code")],
          ["60", "exit(status)", tx(t, "asmFirst_c2", "ends the process; status 0 means success"), tx(t, "asmFirst_c2r", "nothing: it never comes back")],
        ]}
      />
      <p>
        {tx(t, "asmFirst_fdBody",
          "A file descriptor is a small number that stands for an open file. Every process starts with three: 0 is standard input, 1 standard output and 2 standard error, normally all connected to the terminal. The numbers 1 and 60 come from the kernel's table of system calls (/usr/include/asm/unistd_64.h). They are different on 32-bit x86, on ARM64 and on macOS.")}
      </p>
      <p>
        {tx(t, "asmFirst_figBody",
          "Step through the program. Then break it: each removable line shows what it was there for.")}
      </p>
      <CpuFigure t={t} programs={["hello"]} />
      <p>
        {tx(t, "asmFirst_rdxBody",
          "Remove mov rdx, len and nothing is printed. Linux starts a program with almost every register at zero, so rdx was 0: write was asked to send 0 bytes, and it did so, successfully. Nothing in assembly checks that you set up every argument.")}
      </p>

      <H2>{tx(t, "asmFirst_buildTitle", "Build and run")}</H2>
      <CodeBlock lang="bash" filename="build.sh" t={t}>{`nasm -f elf64 -g -F dwarf hello.asm -o hello.o   # assemble
ld hello.o -o hello                               # link
./hello                                           # run
echo $?                                           # exit status of the last command`}</CodeBlock>
      <CodeBlock lang="text" filename={tx(t, "asmFirst_output", "output")} t={t}>{`Hello, assembly!
0`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "asmFirst_hPart", "Part"), tx(t, "asmFirst_hMeans2", "What it means")]}
        rows={[
          ["-f elf64", tx(t, "asmFirst_b1", "The output format. ELF is the format of Linux object files and executables; elf64 is its 64-bit form. Windows would need win64, macOS macho64.")],
          ["-g -F dwarf", tx(t, "asmFirst_b2", "Add debug information in the DWARF format, so gdb can show your source lines.")],
          ["ld hello.o -o hello", tx(t, "asmFirst_b3", "Link the object file into an executable. No C library is linked, because the program never calls it.")],
          ["echo $?", tx(t, "asmFirst_b4", "The shell keeps the last program's exit status in $?. Change xor edi, edi to mov edi, 42, rebuild, and it prints 42.")],
        ]}
      />

      <H2>{tx(t, "asmFirst_noExitTitle", "If you forget to exit")}</H2>
      <p>
        {tx(t, "asmFirst_noExitBody",
          "In C, falling off the end of main returns into the C library, which calls exit for you. Here there is nothing to return to. Remove the last three lines in the figure and run it: the text is printed, then the program crashes.")}
      </p>
      <CodeBlock lang="text" filename={tx(t, "asmFirst_terminal", "terminal")} t={t}>{`$ ./hello
Hello, assembly!
Segmentation fault (core dumped)
$ echo $?
139`}</CodeBlock>
      <p>
        {tx(t, "asmFirst_noExitWhy",
          "The CPU does not know where your program ends. After the last syscall it fetches the next bytes, which are zeros. The bytes 00 00 happen to be a real instruction, add [rax], al: add al to the byte at the address in rax. rax holds 17, the value write returned. Address 17 is not part of the program's memory, so the CPU raises a fault, and the kernel ends the process with the signal SIGSEGV (segmentation violation, number 11). The shell reports 128 + 11 = 139.")}
      </p>

      <H2>{tx(t, "asmFirst_errTitle", "When a system call fails")}</H2>
      <p>
        {tx(t, "asmFirst_errBody",
          "A system call reports an error through rax: a result between −4095 and −1 is an error number with a minus sign. Ask write to use file descriptor 5, which is not open, and it returns −9, the code EBADF (bad file descriptor). Pass rax straight to exit to see it from the shell. The status keeps only its lowest 8 bits, so −9 shows up as 256 − 9 = 247.")}
      </p>
      <CodeBlock lang="nasm" filename="badfd.asm" t={t}>{`        mov     rax, 1
        mov     rdi, 5          ; not an open file
        mov     rsi, msg
        mov     rdx, len
        syscall                 ; rax = -9 (EBADF)
        mov     rdi, rax        ; exit status = that result
        mov     rax, 60
        syscall                 ; echo $? prints 247`}</CodeBlock>
      <p>
        {tx(t, "asmFirst_errC",
          "In C, the library turns that −9 into a return value of −1 and stores 9 in errno. Here you check rax yourself; the chapter on jumps and loops shows how to branch on it.")}
      </p>

      <H2>{tx(t, "asmFirst_gdbTitle", "Stepping through with gdb")}</H2>
      <p>
        {tx(t, "asmFirst_gdbBody",
          "gdb, the GNU debugger, runs a program one instruction at a time on the real CPU, the way the figure does:")}
      </p>
      <CodeBlock lang="bash" filename="gdb" t={t}>{`gdb ./hello
(gdb) set disassembly-flavor intel
(gdb) break _start          # stop before the first instruction
(gdb) run
(gdb) layout asm            # show the instructions, the next one highlighted
(gdb) stepi                 # run one instruction (si for short)
(gdb) info registers rax rdi rsi rdx
(gdb) x/s (char *) &msg     # examine the memory at msg as a string`}</CodeBlock>

      <H2>{tx(t, "asmFirst_osTitle", "Windows and macOS")}</H2>
      <p>
        {tx(t, "asmFirst_osBody",
          "The instructions are the same everywhere; what changes is how a program talks to the operating system. Windows does not promise stable system call numbers. A Windows program calls functions such as WriteFile and ExitProcess from kernel32.dll, following the Win64 calling convention, and is assembled with -f win64. macOS has system calls like Linux, but with other numbers (write is 0x2000004) and its own file format (-f macho64); Apple Silicon Macs are not x86 at all. This track sticks to Linux so every example runs the same way. The calling-convention chapter shows the Win64 version.")}
      </p>

      <H2>{tx(t, "asmFirst_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "asmFirst_try1", "Print two different lines with two write calls, then exit with status 3. Check it with echo $?.")}</li>
        <li>{tx(t, "asmFirst_try2", "Send the message to standard error (fd 2) and run ./hello > /dev/null. Does the line still appear? Why?")}</li>
        <li>{tx(t, "asmFirst_try3", "Move msg into a section .rodata and try to change its first letter with mov byte [msg], 'J'. Predict what happens, then run it.")}</li>
      </ol>

      <KeyIdeas t={t} id="asmFirst" items={[
        "A NASM program has sections: .text for code; .data, .rodata and .bss for data. Labels name addresses, db/dd/dq lay out bytes, equ names a number.",
        "Without the C library, the program starts at _start, which global makes visible to the linker.",
        "syscall asks the kernel: the number in rax, arguments in rdi, rsi, rdx, r10, r8, r9, the result back in rax. It overwrites rcx and r11.",
        "write is system call 1 and exit is 60. A negative result is an error code.",
        "Build with nasm -f elf64 and ld; echo $? shows the exit status.",
        "The CPU does not know where your code ends. Without an exit it runs whatever bytes follow, usually into a segmentation fault (status 139).",
      ]} />
    </Article>
  );
}
