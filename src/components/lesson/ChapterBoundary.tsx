"use client";

import { Component, type ReactNode } from "react";

/**
 * Keeps a crash inside one chapter (usually an interactive figure) from taking
 * down the whole page. Shows a small notice with a retry button instead.
 * `resetKey` clears the error when it changes, e.g. on chapter navigation.
 */
export class ChapterBoundary extends Component<
  { children: ReactNode; resetKey?: string },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Chapter content crashed:", error);
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="my-8 rounded-xl border border-red-500/30 bg-red-500/5 p-5 space-y-3">
        <p className="text-sm font-semibold text-[var(--text-main)]">
          Something in this chapter failed to render.
        </p>
        <p className="text-xs font-mono text-[var(--text-muted)] break-words">{this.state.error.message}</p>
        <button
          onClick={() => this.setState({ error: null })}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-all"
        >
          Try again
        </button>
      </div>
    );
  }
}
