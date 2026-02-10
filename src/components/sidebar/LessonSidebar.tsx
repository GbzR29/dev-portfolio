// components/learn/LessonSidebar.tsx
export function LessonSidebar({ chapters }: { chapters: { title: string, id: string }[] }) {
  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="sticky top-32 space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 px-4">
          Chapters
        </h4>
        {chapters.map((chapter) => (
          <button
            key={chapter.id}
            className="w-full text-left px-4 py-2 rounded-xl text-sm transition-all hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] border border-transparent active:border-[var(--primary)]/20"
          >
            {chapter.title}
          </button>
        ))}
      </div>
    </aside>
  );
}