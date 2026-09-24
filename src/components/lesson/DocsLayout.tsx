// src/components/lesson/DocsLayout.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { BookOpen, X } from "lucide-react";
import Navbar from "@/components/navbar/Navbar";

/**
 * Documentation-style shell shared by lesson and reference pages.
 *
 *   ┌──────────┬──────────────────────────────┬─────────┐
 *   │ left rail│   centered reading column    │  right  │
 *   │ (edge)   │   (max ~72ch)                │  rail   │
 *   └──────────┴──────────────────────────────┴─────────┘
 *
 * Both rails are pinned to the viewport edges and scroll independently.
 * Below `lg` the left rail becomes a drawer opened by a floating button.
 */

// Navbar is sticky, h-20 plus a 1px border.
const RAIL = "sticky top-[81px] h-[calc(100vh-81px)] overflow-y-auto overscroll-contain";

export function DocsLayout({
  left, right, children, drawerTitle, drawerKey,
}: {
  left: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  /** Label for the mobile drawer header and its opening button. */
  drawerTitle: string;
  /** The drawer closes whenever this value changes (e.g. the active chapter). */
  drawerKey?: string;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => setIsDrawerOpen(false), [drawerKey]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)]">
      <Navbar />

      {/* ── Mobile drawer ──────────────────────────────────────────── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-[var(--bg)] border-r border-[var(--border)] overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-5 pt-6 pb-3 border-b border-[var(--separator)]">
              <span className="text-sm font-semibold text-[var(--text-main)]">{drawerTitle}</span>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--primary-low)] transition-colors"
                aria-label="Close"
              >
                <X size={16} className="text-[var(--text-muted)]" />
              </button>
            </div>
            {left}
          </aside>
        </div>
      )}

      <div className="flex items-start">
        {/* ── Left rail — pinned to the viewport edge ─────────────────── */}
        <aside className={`hidden lg:block w-72 xl:w-80 flex-shrink-0 border-r border-[var(--border)] bg-[var(--card)] ${RAIL}`}>
          {left}
        </aside>

        {/* ── Reading column ───────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <main className="mx-auto w-full max-w-3xl px-5 sm:px-8 lg:px-12 pt-10 lg:pt-14 pb-32">
            {children}
          </main>
        </div>

        {/* ── Right rail ───────────────────────────────────────────────── */}
        {right && (
          <aside className={`hidden xl:block w-64 2xl:w-72 flex-shrink-0 border-l border-[var(--separator)] px-6 py-14 ${RAIL}`}>
            {right}
          </aside>
        )}
      </div>

      {/* ── Mobile FAB — opens drawer ─────────────────────────────────── */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed bottom-6 left-6 z-30 lg:hidden flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-full shadow-lg shadow-[var(--primary)]/25 hover:opacity-90 transition-opacity"
        aria-label={drawerTitle}
      >
        <BookOpen size={15} />
        {drawerTitle}
      </button>
    </div>
  );
}
