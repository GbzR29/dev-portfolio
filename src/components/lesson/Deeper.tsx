"use client";

// ── Deeper ──────────────────────────────────────────────────────────────────
// An optional "go deeper" block inside a chapter: history, a longer proof, a
// side road the main line does not need. In the clean look it starts closed as
// one bar (label, title, reading time) and opens in place; a "fold back" link
// at its end closes it again. The text stays in the page while closed
// (hidden="until-found"), so the browser's find-in-page still reaches it and
// opens the block. Outside the clean look it is simply shown open.
// Styles: learn.css "Deeper".

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { useLessonLook } from "./look";

/** Words read per minute for the time shown on the closed bar. */
const WORDS_PER_MIN = 200;
/** Matches the grid-rows transition in learn.css. */
const CLOSE_MS = 380;

export function Deeper({ t, title, children }: { t?: TrackTranslations; title: string; children: ReactNode }) {
  const { clean } = useLessonLook();
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const bodyId = useId();
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState(0);
  const label = tx(t, "deeper", "Go deeper");

  // Reading time from the words inside (figures and formulas count little)
  useEffect(() => {
    const words = bodyRef.current?.textContent?.trim().split(/\s+/).length ?? 0;
    setMinutes(Math.max(1, Math.round(words / WORDS_PER_MIN)));
  }, [children]);

  // Closed: hide the body until find-in-page reaches it (after the close
  // animation); opened by a find match through "beforematch"
  useEffect(() => {
    const el = bodyRef.current;
    if (!el || !clean) return;
    if (open) { el.removeAttribute("hidden"); return; }
    const id = window.setTimeout(() => el.setAttribute("hidden", "until-found"), CLOSE_MS);
    const onMatch = () => setOpen(true);
    el.addEventListener("beforematch", onMatch);
    return () => { window.clearTimeout(id); el.removeEventListener("beforematch", onMatch); };
  }, [open, clean]);

  // Folding back from the end: keep the bar on screen
  const foldBack = () => {
    setOpen(false);
    const head = rootRef.current;
    if (head && head.getBoundingClientRect().top < 0) {
      requestAnimationFrame(() => head.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  const icon = (
    <span className="deeper-icon" aria-hidden="true">
      {/* three layers, the top one lifted: a level below the surface */}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 1.8 14.2 5 8 8.2 1.8 5z" />
        <path d="M1.8 8.1 8 11.3l6.2-3.2" />
        <path d="M1.8 11.2 8 14.4l6.2-3.2" />
      </svg>
    </span>
  );

  if (!clean) {
    return (
      <div data-wide="" className="deeper" data-open="">
        <div className="deeper-head">
          {icon}
          <span className="deeper-titles">
            <span className="deeper-label font-mono">{label}</span>
            <span className="deeper-title font-display">{title}</span>
          </span>
        </div>
        <div className="deeper-body"><div className="deeper-inner">{children}</div></div>
      </div>
    );
  }

  return (
    <div ref={rootRef} data-wide="" className="deeper scroll-mt-[calc(var(--nav-h,81px)+24px)]" data-open={open ? "" : undefined}>
      <button
        type="button"
        className="deeper-head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
      >
        {icon}
        <span className="deeper-titles">
          <span className="deeper-label font-mono">{label}</span>
          <span className="deeper-title font-display">{title}</span>
        </span>
        <span className="deeper-meta font-mono">
          {minutes > 0 && tx(t, "deeperMin", "{n} min").replace("{n}", String(minutes))}
          <svg className="deeper-chevron" width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </span>
      </button>
      <div className="deeper-fold">
        <div id={bodyId} ref={bodyRef} className="deeper-body">
          <div className="deeper-inner">{children}</div>
          <button type="button" className="deeper-back font-mono" onClick={foldBack}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 10l4-4 4 4" />
            </svg>
            {tx(t, "deeperFold", "fold back")}
          </button>
        </div>
      </div>
    </div>
  );
}
