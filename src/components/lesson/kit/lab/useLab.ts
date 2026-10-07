"use client";

// ── A lab's open state, its URL and the viewer's progress ─────────────────────
// Opening a lab adds ?lab=<id> to the URL with history.pushState, so the
// browser's back button (a phone's, above all) closes the lab instead of
// leaving the lesson, and a link that carries ?lab=<id> opens it directly.
// The goals met and whether the lab was finished are kept per viewer in
// localStorage; storage may be blocked, so every access is guarded.

import { useCallback, useEffect, useRef, useState } from "react";

export type LabProgress = { reached: number[]; done: boolean };

const EMPTY: LabProgress = { reached: [], done: false };
const key = (id: string) => `lab:${id}`;
const labInUrl = () => new URLSearchParams(window.location.search).get("lab");

function loadProgress(id: string): LabProgress {
  try {
    const v = JSON.parse(localStorage.getItem(key(id)) ?? "null");
    if (v && Array.isArray(v.reached)) return { reached: v.reached.filter(Number.isInteger), done: !!v.done };
  } catch { /* storage blocked or corrupt: start fresh */ }
  return EMPTY;
}

function saveProgress(id: string, p: LabProgress) {
  try { localStorage.setItem(key(id), JSON.stringify(p)); } catch { /* storage blocked */ }
}

/** `id` names the lab in the URL and in storage: keep it stable, e.g. "markov-walk". */
export function useLab(id: string) {
  const [open, setOpen] = useState(false);
  const [progress, setProgressState] = useState<LabProgress>(EMPTY);
  const pushed = useRef(false);

  useEffect(() => {
    setProgressState(loadProgress(id));
    // A link to this lab: open it, with its figure behind it for when it closes
    if (labInUrl() === id) {
      setOpen(true);
      document.querySelector(`[data-lab-for="${id}"]`)?.scrollIntoView({ block: "center" });
    }
    const onPop = () => {
      const here = labInUrl() === id;
      if (!here) pushed.current = false;
      setOpen(here);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [id]);

  const show = useCallback(() => {
    if (labInUrl() !== id) {
      const url = new URL(window.location.href);
      url.searchParams.set("lab", id);
      window.history.pushState(null, "", url);
      pushed.current = true;
    }
    setOpen(true);
  }, [id]);

  const hide = useCallback(() => {
    setOpen(false);
    // Undo our own history entry; a lab opened from a link just drops the parameter
    if (pushed.current) { pushed.current = false; window.history.back(); return; }
    const url = new URL(window.location.href);
    url.searchParams.delete("lab");
    window.history.replaceState(null, "", url);
  }, []);

  const setProgress = useCallback((p: LabProgress) => { setProgressState(p); saveProgress(id, p); }, [id]);

  return { id, open, show, hide, progress, setProgress };
}

export type LabHandle = ReturnType<typeof useLab>;
