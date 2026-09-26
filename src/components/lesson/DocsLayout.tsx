// src/components/lesson/DocsLayout.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import Navbar from "@/components/navbar/Navbar";

/**
 * Documentation-style shell shared by lesson and reference pages.
 *
 *   ┌──────────┬──────────────────────────────┬─────────┐
 *   │ left rail│   centered reading column    │  right  │
 *   │ (edge)   │                              │  rail   │
 *   └──────────┴──────────────────────────────┴─────────┘
 *
 * Both rails are pinned to the viewport edges and scroll independently.
 * On `lg` and up the left rail can be collapsed to a thin strip, which widens
 * the reading column; the choice is remembered per viewer.
 * Below `lg` the left rail becomes a drawer opened by a floating button.
 */

// Navbar is sticky, h-20 plus a 1px border.
const RAIL = "sticky top-[81px] h-[calc(100vh-81px)] overscroll-contain";
const STORAGE_KEY = "docs-rail-collapsed";

export function DocsLayout({
  left, right, children, drawerTitle, drawerKey, backHref, backLabel = "Back",
}: {
  left: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  /** Label for the mobile drawer header and its opening button. */
  drawerTitle: string;
  /** The drawer closes whenever this value changes (e.g. the active chapter). */
  drawerKey?: string;
  /** Where the rail's back arrow goes. Without it, the arrow uses browser history. */
  backHref?: string;
  backLabel?: string;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  // Transitions stay off until the saved state is applied, so a collapsed rail
  // does not visibly animate shut on every page load.
  const [animate, setAnimate] = useState(false);

  useEffect(() => setIsDrawerOpen(false), [drawerKey]);

  // The floating button shrinks to its icon while it would sit on a figure's controls.
  const [overFigure, setOverFigure] = useState(false);
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const band = window.innerHeight - 96;            // the strip the button occupies
      setOverFigure([...document.querySelectorAll("[data-figure]")].some(f => {
        const r = f.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > band;
      }));
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(check); };
    const late = setTimeout(schedule, 600);            // the chapter's figures load lazily
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(late);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [drawerKey]);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(STORAGE_KEY) === "1"); } catch { /* storage blocked */ }
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const toggleRail = () => {
    setCollapsed(c => {
      try { localStorage.setItem(STORAGE_KEY, c ? "0" : "1"); } catch { /* ignore */ }
      return !c;
    });
  };

  const railBtn = "p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-low)] transition-colors";
  const backButton = (withLabel: boolean) => {
    const inner = (
      <>
        <ArrowLeft size={15} className="flex-shrink-0" />
        {withLabel && <span className="text-xs font-medium truncate">{backLabel}</span>}
      </>
    );
    const cls = `${railBtn} flex items-center gap-2 min-w-0`;
    return backHref
      ? <Link href={backHref} className={cls} title={backLabel} aria-label={backLabel}>{inner}</Link>
      : <button onClick={() => history.back()} className={cls} title={backLabel} aria-label={backLabel}>{inner}</button>;
  };

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
        {/* ── Left rail — pinned to the viewport edge, collapsible ─────── */}
        <aside
          className={`hidden lg:flex flex-col flex-shrink-0 border-r border-[var(--border)] bg-[var(--card)] overflow-hidden ${RAIL} ${
            animate ? "transition-[width] duration-300 ease-out" : ""
          } ${collapsed ? "w-14" : "w-72 xl:w-80"}`}
        >
          {/* Rail header: back + collapse */}
          <div className={`flex items-center gap-2 border-b border-[var(--separator)] flex-shrink-0 ${
            collapsed ? "flex-col py-3 px-2" : "justify-between px-4 py-2.5"
          }`}>
            {collapsed ? (
              <>
                <button onClick={toggleRail} className={railBtn} title="Expand sidebar" aria-label="Expand sidebar">
                  <PanelLeftOpen size={16} />
                </button>
                {backButton(false)}
              </>
            ) : (
              <>
                {backButton(true)}
                <button onClick={toggleRail} className={railBtn} title="Collapse sidebar" aria-label="Collapse sidebar">
                  <PanelLeftClose size={16} />
                </button>
              </>
            )}
          </div>

          {/* Content keeps its full width while the rail animates, and fades out */}
          <div
            className={`flex-1 overflow-y-auto overflow-x-hidden ${animate ? "transition-opacity duration-200" : ""} ${
              collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
            aria-hidden={collapsed}
          >
            <div className="w-72 xl:w-80">{left}</div>
          </div>
        </aside>

        {/* ── Reading column ───────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <main
            className={`mx-auto w-full px-5 sm:px-8 lg:px-10 pt-10 lg:pt-14 pb-32 ${
              animate ? "transition-[max-width] duration-300 ease-out" : ""
            } ${collapsed ? "max-w-[64rem]" : "max-w-[56rem]"}`}
          >
            {children}
          </main>
        </div>

        {/* ── Right rail ───────────────────────────────────────────────── */}
        {right && (
          <aside className={`hidden xl:block w-64 2xl:w-72 flex-shrink-0 border-l border-[var(--separator)] px-6 py-14 overflow-y-auto ${RAIL}`}>
            {right}
          </aside>
        )}
      </div>

      {/* ── Mobile FAB — opens drawer ─────────────────────────────────── */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className={`fixed bottom-6 z-30 lg:hidden flex items-center gap-2 bg-[var(--primary)] text-white text-sm font-semibold rounded-full shadow-lg shadow-[var(--primary)]/25 hover:opacity-90 transition-opacity ${
          overFigure ? "right-4 p-3" : "left-6 px-4 py-2.5"
        }`}
        aria-label={drawerTitle}
        title={drawerTitle}
      >
        <BookOpen size={overFigure ? 18 : 15} />
        {!overFigure && drawerTitle}
      </button>
    </div>
  );
}
