"use client";

// C Foundations 7: input, output and files — the three standard streams,
// redirection and pipes, stderr; fopen modes, the FILE object and fclose;
// reading lines with fgets and parsing with strtol, the feof trap; writing and
// buffering (fflush); binary files with fwrite/fread and why raw structs are
// not portable; errno, perror and checking every return value.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { MemoryBoxFigure } from "@/components/lesson/figures/c/MemoryBoxFigure";

export function CIoFilesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cIo_intro",
          "A program that cannot read or write is a closed box. C talks to the outside world through streams: sequences of bytes that flow in or out, one after another. The keyboard, the terminal, a file on disk and the output of another program all look like streams, and the same handful of functions from <stdio.h> work on every one of them. This idea came straight from Unix, where \"everything is a file\". This chapter covers the three streams every program starts with, then files: opening them, reading and writing text and binary data, and noticing when something fails.")}
      </Lead>

      <Goals t={t} id="cIo" items={[
        "Use stdin, stdout and stderr, and redirect them from the shell.",
        "Open, read, write and close a file, checking every step.",
        "Read a text file line by line and turn its text into numbers.",
        "Explain output buffering and when to call fflush.",
        "Save and load binary data, knowing why raw structs are not portable.",
      ]} />

      <H2>{tx(t, "cIo_streamsTitle", "Three streams are already open")}</H2>
      <LessonTable
        headers={[tx(t, "cIo_hStream", "Stream"), tx(t, "cIo_hIs", "What it is"), tx(t, "cIo_hUse", "Written by")]}
        rows={[
          ["stdin", tx(t, "cIo_s1", "standard input: the keyboard, unless redirected"), "scanf, fgets(buf, n, stdin), getchar"],
          ["stdout", tx(t, "cIo_s2", "standard output: the terminal, unless redirected"), "printf, puts, putchar"],
          ["stderr", tx(t, "cIo_s3", "standard error: also the terminal, but a separate channel for messages"), "fprintf(stderr, …), perror"],
        ]}
      />
      <p>
        {tx(t, "cIo_redirBody",
          "The shell can connect these streams to files or to other programs without the program knowing. That is why errors belong on stderr: when the normal output is sent to a file, the errors still reach the screen.")}
      </p>
      <CodeBlock lang="bash" filename="shell.sh" t={t}>{`./scores < input.txt          # stdin reads from input.txt
./scores > report.txt         # stdout goes to report.txt; stderr still shows
./scores 2> errors.log        # stderr goes to errors.log
./scores | sort -n | head -3  # a pipe: stdout of one becomes stdin of the next`}</CodeBlock>

      <H2>{tx(t, "cIo_openTitle", "Opening and closing a file")}</H2>
      <p>
        {tx(t, "cIo_openBody",
          "fopen(path, mode) opens a file and returns a FILE *, a pointer to a structure the library allocates to track the open file: the operating system's handle for it, the current position and a buffer. Every function that works on the file takes that pointer. fclose releases all of it. The mode string says what you intend to do.")}
      </p>
      <LessonTable
        headers={[tx(t, "cIo_hMode", "Mode"), tx(t, "cIo_hMeaning", "Meaning"), tx(t, "cIo_hMissing", "If the file does not exist")]}
        rows={[
          ["\"r\"", tx(t, "cIo_m1", "read"), tx(t, "cIo_m1x", "fails: returns NULL")],
          ["\"w\"", tx(t, "cIo_m2", "write, erasing what was there"), tx(t, "cIo_m2x", "creates it")],
          ["\"a\"", tx(t, "cIo_m3", "append: write at the end"), tx(t, "cIo_m3x", "creates it")],
          ["\"r+\"", tx(t, "cIo_m4", "read and write, keeping the contents"), tx(t, "cIo_m4x", "fails")],
          ["\"rb\", \"wb\"", tx(t, "cIo_m5", "binary: bytes pass through unchanged (matters on Windows, where text mode converts \\n to \\r\\n)"), tx(t, "cIo_m5x", "as above")],
        ]}
      />
      <p>
        {tx(t, "cIo_figBody",
          "A FILE is a resource like a malloc'd block: it must be given back. Step through the program, then remove the fclose and see what the summary says.")}
      </p>
      <MemoryBoxFigure t={t} programs={["file"]} />

      <H2>{tx(t, "cIo_readTitle", "Reading text line by line")}</H2>
      <p>
        {tx(t, "cIo_readBody",
          "fgets(buf, size, f) reads one line into buf, at most size − 1 characters, and adds the '\\0'. It keeps the '\\n' if the whole line fitted. It returns NULL at the end of the file or on an error, which makes it a natural loop condition. To turn the text into numbers, use strtol or strtod: unlike atoi, they tell you where the number ended, so you can detect text that was not a number at all.")}
      </p>
      <CodeBlock lang="c" filename="scores.c" t={t}>{`#include <errno.h>
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char **argv) {
    if (argc != 2) {
        fprintf(stderr, "usage: %s FILE\\n", argv[0]);
        return 1;
    }
    FILE *f = fopen(argv[1], "r");
    if (f == NULL) {
        perror(argv[1]);                 // e.g. "scores.txt: No such file or directory"
        return 1;
    }

    char line[256];
    long total = 0;
    int lineNo = 0;
    while (fgets(line, sizeof line, f) != NULL) {   // NULL: end of file or error
        lineNo++;
        char *end;
        errno = 0;
        long v = strtol(line, &end, 10);            // base 10; end = first char not used
        if (end == line || errno == ERANGE) {
            fprintf(stderr, "line %d: not a number\\n", lineNo);
            continue;
        }
        total += v;
    }
    if (ferror(f)) perror("read");
    fclose(f);
    printf("total: %ld\\n", total);
    return 0;
}`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "cIo_feofWarn",
          "Do not loop with while (!feof(f)). feof only becomes true after a read has already failed, so the loop body runs one extra time with stale data. Loop on the return value of the read itself, as above.")}
      </Callout>

      <H2>{tx(t, "cIo_writeTitle", "Writing, and the buffer in between")}</H2>
      <p>
        {tx(t, "cIo_writeBody",
          "fprintf(f, …) works like printf into a file, and fputs(s, f) writes a string. Neither goes straight to the disk. Asking the operating system to write is slow compared with copying bytes in memory, so stdio collects output in the FILE's buffer and writes it out in large pieces. The buffer is written (flushed) when it is full, when you call fflush(f) or fclose(f), and when the program ends normally. Output to a terminal is also flushed at every '\\n'; output to a file or a pipe is not.")}
      </p>
      <CodeBlock lang="c" filename="log.c" t={t}>{`FILE *log = fopen("game.log", "a");
fprintf(log, "level %d loaded\\n", level);
fflush(log);              // make sure this line is on disk before risky code runs

printf("Saving... ");     // no \\n: may sit in the buffer and appear late
fflush(stdout);           // show it now
save_game();`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "cIo_crashNote",
          "If the program crashes, whatever is still in a buffer is lost. That is why the last lines of a log often seem to be missing after a crash, and why stderr is unbuffered by default.")}
      </Callout>

      <H2>{tx(t, "cIo_binTitle", "Binary files")}</H2>
      <p>
        {tx(t, "cIo_binBody",
          "fwrite(ptr, size, count, f) copies count items of size bytes from memory to the file, unchanged; fread does the reverse. Both return how many whole items they managed, so a short count means the end of the file or an error. Binary files are compact and quick to load, which is why games use them for save files and assets.")}
      </p>
      <CodeBlock lang="c" filename="save.c" t={t}>{`#include <stdint.h>

typedef struct {
    uint32_t magic;       // "SAVE": tells our files apart from anything else
    uint32_t version;
    int32_t  level, hp;
    float    x, y;
} SaveGame;

int save(const char *path, const SaveGame *s) {
    FILE *f = fopen(path, "wb");
    if (!f) return 0;
    size_t n = fwrite(s, sizeof *s, 1, f);   // 1 item of sizeof(SaveGame) bytes
    return fclose(f) == 0 && n == 1;         // fclose can fail too: the final flush
}

int load(const char *path, SaveGame *s) {
    FILE *f = fopen(path, "rb");
    if (!f) return 0;
    size_t n = fread(s, sizeof *s, 1, f);
    fclose(f);
    return n == 1 && s->magic == 0x45564153u;   // "SAVE" read as a little-endian uint32
}`}</CodeBlock>
      <H3>{tx(t, "cIo_portTitle", "Why a raw struct is not a file format")}</H3>
      <p>
        {tx(t, "cIo_portBody",
          "Writing a struct in one go copies its memory layout, and that layout depends on the machine and compiler: the size of each type, the padding between fields, and the byte order (little-endian on x86 and ARM, big-endian on some others). A file written by one build may not load in another. Fixed-width types such as uint32_t, a magic number, a version field, and no pointers in the struct cover most cases. For files that must travel between very different machines, write each field separately in a fixed byte order.")}
      </p>

      <H2>{tx(t, "cIo_errTitle", "When things go wrong: errno")}</H2>
      <p>
        {tx(t, "cIo_errBody",
          "Most library functions report failure through their return value, and leave the reason in a global integer called errno (from <errno.h>). perror(\"text\") prints your text followed by the reason in words; strerror(errno) returns the same words as a string. Read errno right after the failing call, since the next call may change it.")}
      </p>
      <LessonTable
        headers={[tx(t, "cIo_hFn", "Function"), tx(t, "cIo_hFail", "Signals failure by")]}
        rows={[
          ["fopen", "NULL"],
          ["fgets", tx(t, "cIo_f2", "NULL (end of file or error: ferror(f) tells which)")],
          ["fread, fwrite", tx(t, "cIo_f3", "returning fewer items than asked")],
          ["fprintf, fputs, fclose", tx(t, "cIo_f4", "a negative value or EOF")],
          ["strtol, strtod", tx(t, "cIo_f5", "end pointer unchanged, or errno set to ERANGE")],
        ]}
      />

      <H2>{tx(t, "cIo_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cIo_try1", "Write a tiny version of cat: print every file named on the command line, and report missing ones on stderr with perror.")}</li>
        <li>{tx(t, "cIo_try2", "Count the lines, words and bytes of a file, like the Unix tool wc.")}</li>
        <li>{tx(t, "cIo_try3", "Save the SaveGame struct, then load it and print it. Change one field's type, rebuild, and try loading the old file. What does the version field let you do?")}</li>
      </ol>

      <KeyIdeas t={t} id="cIo" items={[
        "Every program starts with stdin, stdout and stderr; errors go to stderr so redirection does not hide them.",
        "fopen returns a FILE * or NULL; every opened file needs exactly one fclose.",
        "Loop on the return value of fgets or fread, never on feof. Parse numbers with strtol, which reports bad input.",
        "Output is buffered: it reaches the file when the buffer fills, on fflush or on fclose.",
        "Binary files are fast but tied to the layout of the data: use fixed-width types, a magic number and a version.",
        "Check every return value; errno and perror explain the failure.",
      ]} />
    </Article>
  );
}
