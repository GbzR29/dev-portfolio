// TEMPORARY (2026-10-10): a page to try the audio kit before the Music track
// has chapters. Delete once the first Music chapter uses the piano.

import type { Metadata } from "next";
import { MusicPianoFigure } from "@/components/lesson/figures/music/PianoFigure";

export const metadata: Metadata = { title: "Sound test", robots: { index: false } };

export default function SoundTestPage() {
  return (
    <div className="learn min-h-screen bg-[var(--bg)] text-[var(--text-main)]">
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold mb-2">Sound test</h1>
        <p className="text-sm text-[var(--text-muted)]">Audio kit check: piano samples and synth.</p>
        <MusicPianoFigure />
      </main>
    </div>
  );
}
