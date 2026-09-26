"use client";

// ── Figure frame ──────────────────────────────────────────────────────────────
// The card every interactive figure sits in. On desktop it is only the border
// and background; on phones it also
//   • finds the figure's drawing (the "stage") and pins it under the navbar
//     while the reader works the controls below it — only when the drawing is
//     short enough to leave room for them;
//   • offers a fullscreen button: native fullscreen plus a landscape lock where
//     the browser allows it, a fixed overlay elsewhere (iPhone Safari);
//   • rewrites mouse-only hints ("scroll to zoom") on touch screens.
// The stage is found from the DOM, so figures need no extra markup: it is the
// largest canvas/svg, widened to its biggest ancestor that holds no controls.
// Styles live in globals.css under "Figure frame".

import { useCallback, useEffect, useRef, useState, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { STACKED, TOUCH } from "./media";

const FRAME = "relative my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm";
const CONTROLS = "input, select, textarea, button";

// ── Stage detection ───────────────────────────────────────────────────────────

/** A control floating over the drawing (a reload button, a badge) doesn't count. */
function floats(el: Element, within: Element) {
  for (let e: Element | null = el; e && e !== within; e = e.parentElement)
    if (getComputedStyle(e).position === "absolute") return true;
  return false;
}

const isControl = (c: Element, within: Element) => !c.hasAttribute("data-fs-btn") && !floats(c, within);

function holdsControls(el: Element) {
  return [...el.querySelectorAll(CONTROLS)].some(c => isControl(c, el));
}

function findStage(root: HTMLElement): HTMLElement | null {
  let best: Element | null = null;
  let bestArea = 120 * 90;                                  // ignore icons and swatches
  root.querySelectorAll("canvas, svg").forEach(el => {
    if (el.parentElement?.closest("svg") || el.closest("button")) return;
    const r = el.getBoundingClientRect();
    if (r.width * r.height > bestArea) { bestArea = r.width * r.height; best = el; }
  });
  if (!best) return null;
  let stage = best as HTMLElement;
  for (let p = stage.parentElement; p && p !== root; p = p.parentElement) {
    if (holdsControls(p)) break;
    stage = p;
  }
  return stage;
}

/** Pin only on stacked layouts, when the drawing leaves half the screen free and controls follow it. */
function pinnable(root: HTMLElement, stage: HTMLElement) {
  if (!window.matchMedia(STACKED).matches) return false;
  if (stage.getBoundingClientRect().height > window.innerHeight * 0.5) return false;
  return [...root.querySelectorAll(CONTROLS)].some(c =>
    !stage.contains(c) && isControl(c, root) &&
    (stage.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0);
}

// ── Touch hints ───────────────────────────────────────────────────────────────

const HINTS: [RegExp, string][] = [
  [/\b(?:scroll or pinch|pinch or scroll|scroll|wheel) to zoom\b/gi, "pinch to zoom"],
  [/\bscroll to (change fov|move closer)\b/gi, "pinch to $1"],
  [/\bwheel or two-finger pinch\b/gi, "two-finger pinch"],
  [/\bmiddle[- ](?:button|drag) pans\b/gi, "two fingers pan"],
  [/\bclick\b/g, "tap"],
  [/\bClick\b/g, "Tap"],
  [/\bhover\b/g, "touch"],
  [/\bHover\b/g, "Touch"],
];

function rewrite(node: Text) {
  if (node.parentElement?.closest("pre, code, textarea")) return;
  const s = node.nodeValue ?? "";
  let out = s;
  for (const [re, to] of HINTS) out = out.replace(re, to);
  if (out !== s) node.nodeValue = out;
}

function rewriteAll(root: Node) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) rewrite(n as Text);
}

// ── Component ─────────────────────────────────────────────────────────────────

type OrientationLock = ScreenOrientation & { lock?: (o: string) => Promise<void> };

export function FigureShell({ as = "figure", ref, className = "", fullscreen = true, children, ...rest }:
  HTMLAttributes<HTMLElement> & {
    as?: "figure" | "div";
    ref?: Ref<HTMLElement>;
    /** Off for figures with their own fullscreen mode (the shader playground). */
    fullscreen?: boolean;
    children: ReactNode;
  }) {
  const root = useRef<HTMLElement | null>(null);
  const [fs, setFs] = useState<null | "native" | "overlay">(null);

  const setRef = useCallback((el: HTMLElement | null) => {
    root.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  }, [ref]);

  // Stage: re-found whenever the frame changes size (content loaded, rotation, fullscreen)
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let frame = 0;
    const scan = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const old = el.querySelector("[data-stage]");
        const stage = findStage(el);
        if (old && old !== stage) old.removeAttribute("data-stage");
        if (!stage) return;
        const pin = pinnable(el, stage);
        stage.setAttribute("data-stage", pin ? "pin" : "");
        // A transparent stage would let the controls show through while pinned
        if (pin && getComputedStyle(stage).backgroundColor === "rgba(0, 0, 0, 0)") stage.style.backgroundColor = "var(--code-bg)";
      });
    };
    const ro = new ResizeObserver(scan);
    ro.observe(el);
    window.addEventListener("resize", scan);
    return () => { cancelAnimationFrame(frame); ro.disconnect(); window.removeEventListener("resize", scan); };
  }, []);

  // Touch hints, kept up to date as the figure re-renders its text
  useEffect(() => {
    const el = root.current;
    if (!el || !window.matchMedia(TOUCH).matches) return;
    rewriteAll(el);
    const mo = new MutationObserver(recs => {
      for (const r of recs) {
        if (r.type === "characterData") rewrite(r.target as Text);
        else r.addedNodes.forEach(rewriteAll);
      }
    });
    mo.observe(el, { subtree: true, childList: true, characterData: true });
    return () => mo.disconnect();
  }, []);

  // ── Fullscreen ──
  const enter = async () => {
    const el = root.current;
    if (!el) return;
    if (document.fullscreenEnabled && el.requestFullscreen) {
      try {
        await el.requestFullscreen({ navigationUI: "hide" });
        setFs("native");
        await (screen.orientation as OrientationLock).lock?.("landscape").catch(() => {});
        return;
      } catch { /* fall back to the overlay */ }
    }
    setFs("overlay");
  };
  const exit = () => {
    if (document.fullscreenElement === root.current) document.exitFullscreen().catch(() => {});
    setFs(null);
  };

  useEffect(() => {
    const onChange = () => { if (document.fullscreenElement !== root.current) setFs(f => (f === "native" ? null : f)); };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // The overlay owns the screen: no page scroll behind it, Esc closes it
  useEffect(() => {
    if (fs !== "overlay") return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFs(null); };
    window.addEventListener("keydown", onKey);
    return () => { html.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [fs]);

  const props = {
    ...rest,
    ref: setRef,
    "data-figure": "",
    "data-fs": fs ?? undefined,
    className: `${FRAME} ${className}`,
  };
  const body = (
    <>
      {children}
      {fullscreen && (
        <button type="button" data-fs-btn onClick={fs ? exit : enter}
          aria-label={fs ? "Exit fullscreen" : "Fullscreen"} title={fs ? "Exit fullscreen" : "Fullscreen"}>
          {fs ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      )}
    </>
  );
  return as === "div" ? <div {...props}>{body}</div> : <figure {...props}>{body}</figure>;
}
