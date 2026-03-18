// app/learn/[trackPath]/page.tsx  (LessonPage)
"use client";

import Navbar from "@/components/navbar/Navbar";
import Card from "@/components/ui/Card";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, BookOpen, ArrowLeft, Clock, CheckCircle2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Chapter {
  id: string;
  title: string;
  minRead?: number;
}

interface TrackData {
  title: string;
  chapters: Chapter[];
  renderContent: (chapterId: string) => React.ReactNode;
}

// ─── Code block ───────────────────────────────────────────────────────────────
// Simple styled code block — no syntax highlighter dep needed for static content.

function CodeBlock({ children, lang = "cpp" }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 my-6 group">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
          <span className="ml-2 font-mono text-[11px] text-[var(--text-muted)]">{lang}</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-[10px] font-mono text-[var(--text-muted)] hover:text-white transition-colors px-2 py-1 rounded border border-transparent hover:border-white/10"
        >
          {copied ? "✓ copied" : "copy"}
        </button>
      </div>
      {/* Code */}
      <pre className="p-5 overflow-x-auto bg-[#0d1117] text-sm leading-relaxed">
        <code className="font-mono text-[#e6edf3]">{children}</code>
      </pre>
    </div>
  );
}

// ─── Callout ──────────────────────────────────────────────────────────────────

function Callout({ type = "info", children }: { type?: "info" | "warn" | "tip"; children: React.ReactNode }) {
  const config = {
    info: { border: "border-blue-500/30", bg: "bg-blue-500/5", label: "NOTE", color: "text-blue-400" },
    warn: { border: "border-yellow-500/30", bg: "bg-yellow-500/5", label: "WARNING", color: "text-yellow-400" },
    tip:  { border: "border-green-500/30",  bg: "bg-green-500/5",  label: "TIP",     color: "text-green-400"  },
  }[type];

  return (
    <div className={`my-6 p-4 rounded-xl border ${config.border} ${config.bg}`}>
      <span className={`font-mono text-[10px] font-bold uppercase tracking-widest ${config.color} block mb-1`}>
        {config.label}
      </span>
      <div className="text-[var(--text-muted)] text-sm leading-relaxed">{children}</div>
    </div>
  );
}

// ─── Track content data ───────────────────────────────────────────────────────

const TRACK_DATA: Record<string, TrackData> = {
  "C++": {
    title: "Modern C++",
    chapters: [
      { id: "memory", title: "Memory Management",  minRead: 8  },
      { id: "raii",   title: "RAII & Smart Pointers", minRead: 6 },
      { id: "templates", title: "Templates",        minRead: 10 },
      { id: "move",   title: "Move Semantics",      minRead: 7  },
    ],
    renderContent: (chapterId) => {
      if (chapterId === "memory") {
        return (
          <article className="space-y-6 text-[var(--text-muted)] leading-relaxed">
            <p className="text-lg text-[var(--text-main)]">
              In C++, you are responsible for every byte you allocate. There is no garbage collector,
              no safety net — and that is exactly what makes it powerful.
            </p>

            <h2 className="text-2xl font-bold text-[var(--text-main)] pt-2">The Stack vs. The Heap</h2>
            <p>
              When you declare a local variable, it lives on the <strong className="text-white">stack</strong>.
              The stack is fast, automatically managed, and limited in size. When you use{" "}
              <code className="bg-white/5 px-1.5 py-0.5 rounded text-blue-300 font-mono text-sm">new</code>,
              you allocate on the <strong className="text-white">heap</strong> — persistent, larger, but manual.
            </p>

            <CodeBlock lang="cpp">{`// Stack allocation — automatic lifetime
int x = 42;         // freed when scope ends

// Heap allocation — manual lifetime
int* y = new int(42);
// ... use y ...
delete y;           // YOU must free this
y = nullptr;        // prevent dangling pointer`}</CodeBlock>

            <Callout type="warn">
              Forgetting <code className="font-mono text-sm">delete</code> causes a memory leak.
              Calling <code className="font-mono text-sm">delete</code> twice causes undefined behavior.
              Modern C++ solves both with smart pointers.
            </Callout>

            <h2 className="text-2xl font-bold text-[var(--text-main)] pt-2">Smart Pointers</h2>
            <p>
              Since C++11, the standard library provides smart pointers that own their memory and
              free it automatically when they go out of scope. You should almost never call{" "}
              <code className="bg-white/5 px-1.5 py-0.5 rounded text-blue-300 font-mono text-sm">delete</code> manually.
            </p>

            <CodeBlock lang="cpp">{`#include <memory>

// unique_ptr — single owner, freed on destruction
auto mesh = std::make_unique<Mesh>("cube.obj");
mesh->Draw();
// freed automatically when 'mesh' leaves scope

// shared_ptr — reference counted, freed when last owner is gone
auto texture = std::make_shared<Texture>("diffuse.png");
auto copy    = texture; // ref count = 2
// freed when both 'texture' and 'copy' are gone`}</CodeBlock>

            <Callout type="tip">
              Default to <code className="font-mono text-sm">unique_ptr</code>.
              Only use <code className="font-mono text-sm">shared_ptr</code> when shared ownership is genuinely required.
              <code className="font-mono text-sm">shared_ptr</code> has overhead from its reference counter.
            </Callout>
          </article>
        );
      }
      return (
        <p className="text-[var(--text-muted)]">
          This chapter is being written. Check back soon.
        </p>
      );
    },
  },

  "OpenGL": {
    title: "OpenGL 4.6",
    chapters: [
      { id: "pipeline", title: "The Graphics Pipeline", minRead: 7  },
      { id: "vbo",      title: "Vertex Buffer Objects",  minRead: 9  },
      { id: "vao",      title: "Vertex Array Objects",   minRead: 6  },
      { id: "shaders",  title: "First Shaders",          minRead: 10 },
      { id: "draw",     title: "Drawing the Triangle",   minRead: 5  },
    ],
    renderContent: (chapterId) => {
      if (chapterId === "pipeline") {
        return (
          <article className="space-y-6 text-[var(--text-muted)] leading-relaxed">
            <p className="text-lg text-[var(--text-main)]">
              OpenGL operates in 3D space, but your monitor is a 2D grid of pixels. The{" "}
              <strong className="text-white">graphics pipeline</strong> is the sequence of steps
              that transforms your 3D vertex data into the pixels you see on screen.
            </p>

            <h2 className="text-2xl font-bold text-[var(--text-main)] pt-2">Pipeline Overview</h2>
            <p>
              The pipeline has both <strong className="text-white">fixed-function</strong> stages (handled by the GPU driver)
              and <strong className="text-white">programmable</strong> stages where you write GLSL shaders.
            </p>

            <Card padding="lg" className="border border-white/10 bg-white/[0.02] !bg-opacity-5 my-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center text-xs font-mono">
                {["Vertex Data", "Vertex Shader", "Rasterization", "Fragment Shader", "Output"].map((stage, i, arr) => (
                  <div key={stage} className="flex items-center gap-3">
                    <div className={`px-3 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider
                      ${i === 1 || i === 3
                        ? "bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]"
                        : "bg-white/5 border-white/10 text-[var(--text-muted)]"
                      }`}
                    >
                      {stage}
                      {(i === 1 || i === 3) && (
                        <div className="text-[8px] opacity-60 mt-0.5 normal-case tracking-normal font-normal">programmable</div>
                      )}
                    </div>
                    {i < arr.length - 1 && <ChevronRight size={14} className="text-white/20 flex-shrink-0 hidden sm:block" />}
                  </div>
                ))}
              </div>
            </Card>

            <h2 className="text-2xl font-bold text-[var(--text-main)] pt-2">Vertex Data</h2>
            <p>
              Everything starts with vertices — points in 3D space. OpenGL uses a
              normalized coordinate system where every visible coordinate is between{" "}
              <code className="bg-white/5 px-1.5 py-0.5 rounded text-blue-300 font-mono text-sm">-1.0</code> and{" "}
              <code className="bg-white/5 px-1.5 py-0.5 rounded text-blue-300 font-mono text-sm">1.0</code> on each axis.
            </p>

            <CodeBlock lang="cpp">{`// A triangle: 3 vertices, each with X, Y, Z
float vertices[] = {
    -0.5f, -0.5f, 0.0f,   // bottom left
     0.5f, -0.5f, 0.0f,   // bottom right
     0.0f,  0.5f, 0.0f,   // top center
};`}</CodeBlock>

            <Callout type="info">
              These coordinates are in <strong>Normalized Device Coordinates (NDC)</strong>.
              Before reaching the fragment shader, vertices are transformed through Model,
              View, and Projection matrices — but for now, we work directly in NDC.
            </Callout>
          </article>
        );
      }
      return <p className="text-[var(--text-muted)]">This chapter is being written. Check back soon.</p>;
    },
  },
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  chapters,
  activeId,
  onSelect,
  t,
}: {
  chapters: Chapter[];
  activeId: string;
  onSelect: (id: string) => void;
  t: any;
}) {
  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="lg:sticky lg:top-28 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] px-1 mb-3">
          {t.lessonChapters}
        </p>
        <nav className="space-y-0.5">
          {chapters.map((ch, i) => {
            const isActive = ch.id === activeId;
            return (
              <button
                key={ch.id}
                onClick={() => onSelect(ch.id)}
                className={`
                  w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl
                  transition-all duration-200 group
                  ${isActive
                    ? "bg-[var(--primary)]/10 text-white border border-[var(--primary)]/20"
                    : "text-[var(--text-muted)] hover:bg-white/[0.04] hover:text-white border border-transparent"
                  }
                `}
              >
                {/* Index / check */}
                <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold font-mono transition-colors
                  ${isActive ? "bg-[var(--primary)] text-white" : "bg-white/5 text-[var(--text-muted)] group-hover:bg-white/10"}`}
                >
                  {i + 1}
                </span>
                <span className="text-sm leading-snug flex-1">{ch.title}</span>
                {ch.minRead && (
                  <span className="flex-shrink-0 flex items-center gap-1 text-[9px] font-mono text-[var(--text-muted)] opacity-60">
                    <Clock size={9} />{ch.minRead}m
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useLanguage();
  const trackPath = params?.trackPath ? decodeURIComponent(params.trackPath as string) : "";
  const currentTrack = TRACK_DATA[trackPath];

  const [activeChapter, setActiveChapter] = useState<string>("");

  useEffect(() => {
    if (currentTrack && !activeChapter) {
      setActiveChapter(currentTrack.chapters[0].id);
    }
  }, [currentTrack, activeChapter]);

  useEffect(() => {
    if (!currentTrack && trackPath !== "undefined") {
      router.push("/status?type=development&from=learn");
    }
  }, [currentTrack, router, trackPath]);

  if (!currentTrack || !activeChapter) return null;

  const currentIndex = currentTrack.chapters.findIndex((c) => c.id === activeChapter);
  const currentChapterData = currentTrack.chapters[currentIndex];
  const prevChapter = currentTrack.chapters[currentIndex - 1];
  const nextChapter = currentTrack.chapters[currentIndex + 1];
  const progress = Math.round(((currentIndex + 1) / currentTrack.chapters.length) * 100);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 lg:px-10 pt-28 pb-24">

        {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono mb-8">
          <Link href="/learn" className="hover:text-white transition-colors flex items-center gap-1.5">
            <ArrowLeft size={12} />
            {t.lessonBackToLearn.replace("← ", "")}
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <span>{currentTrack.title}</span>
          <ChevronRight size={12} className="opacity-40" />
          <span className="text-white">{currentChapterData?.title}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <Sidebar
            chapters={currentTrack.chapters}
            activeId={activeChapter}
            onSelect={setActiveChapter}
            t={t}
          />

          {/* ── Main content ─────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">

            {/* Chapter header */}
            <header className="mb-10 pb-8 border-b border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-[10px] text-[var(--primary)] uppercase tracking-[0.25em]">
                  {currentTrack.title}
                </span>
                <span className="text-white/20 text-xs">·</span>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">
                  {t.lessonProgress}: {progress}%
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
                {currentChapterData?.title}
              </h1>

              <div className="flex items-center gap-4">
                {/* Progress bar */}
                <div className="flex-1 max-w-xs h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {currentChapterData?.minRead && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono">
                    <Clock size={12} />
                    {currentChapterData.minRead} {t.lessonMinRead}
                  </div>
                )}
              </div>
            </header>

            {/* Lesson content */}
            <div className="prose-custom">
              {currentTrack.renderContent(activeChapter)}
            </div>

            {/* ── Prev / Next navigation ───────────────────────────────── */}
            <div className="flex items-center justify-between mt-16 pt-8 border-t border-white/10 gap-4">
              {prevChapter ? (
                <button
                  onClick={() => setActiveChapter(prevChapter.id)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-[var(--text-muted)] hover:border-[var(--primary)]/40 hover:text-white transition-all text-sm group"
                >
                  <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                  <div className="text-left">
                    <div className="text-[9px] font-mono uppercase tracking-widest opacity-60 mb-0.5">{t.lessonPrev}</div>
                    <div className="font-medium">{prevChapter.title}</div>
                  </div>
                </button>
              ) : <div />}

              {nextChapter ? (
                <button
                  onClick={() => setActiveChapter(nextChapter.id)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-[var(--text-muted)] hover:border-[var(--primary)]/40 hover:text-white transition-all text-sm group text-right ml-auto"
                >
                  <div className="text-right">
                    <div className="text-[9px] font-mono uppercase tracking-widest opacity-60 mb-0.5">{t.lessonNext}</div>
                    <div className="font-medium">{nextChapter.title}</div>
                  </div>
                  <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-green-500/20 bg-green-500/5 text-green-400 text-sm ml-auto">
                  <CheckCircle2 size={15} />
                  <span className="font-medium">Track complete!</span>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}