"use client";

import { useEffect, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Label } from "../../kit/svg";

// ── What this figure shows ────────────────────────────────────────────────────
// Laying out a line of text by hand, the way a renderer does with FreeType.
// Every glyph is placed at the pen position; the pen then moves right by the
// glyph's advance (plus the pair's kerning). The glyph's ink box sits at an
// offset from the pen (the bearing) and can stick out below the baseline.
// All metrics are measured from the real font with canvas measureText, and
// every glyph is drawn at the position computed here, not by the browser.

const FONTS = { serif: "Georgia, 'Times New Roman', serif", sans: "Arial, Helvetica, sans-serif", mono: "'Courier New', monospace" } as const;
type FontKey = keyof typeof FONTS;
type Glyph = { ch: string; pen: number; adv: number; kern: number; left: number; right: number; asc: number; desc: number };

export function GlyphMetricsFigure({ t }: { t?: TrackTranslations }) {
  const [text, setText] = useState("AVo Typography");
  const [font, setFont] = useState<FontKey>("serif");
  const [kerning, setKerning] = useState(true);
  const [boxes, setBoxes] = useState(true);
  const [sel, setSel] = useState(1);
  const [layout, setLayout] = useState<{ glyphs: Glyph[]; ascent: number; descent: number; total: number } | null>(null);
  const SIZE = 64;

  useEffect(() => {
    const c = document.createElement("canvas").getContext("2d");
    if (!c) return;
    c.font = `${SIZE}px ${FONTS[font]}`;
    const m = (s: string) => c.measureText(s);
    const chars = [...text];
    const glyphs: Glyph[] = [];
    let pen = 0;
    chars.forEach((ch, i) => {
      const g = m(ch);
      // kerning with the next glyph: width of the pair minus the two widths
      const next = chars[i + 1];
      const kern = next ? m(ch + next).width - g.width - m(next).width : 0;
      glyphs.push({ ch, pen, adv: g.width, kern, left: -g.actualBoundingBoxLeft, right: g.actualBoundingBoxRight, asc: g.actualBoundingBoxAscent, desc: g.actualBoundingBoxDescent });
      pen += g.width + (kerning ? kern : 0);
    });
    const f = m("Hg");
    setLayout({ glyphs, ascent: f.fontBoundingBoxAscent ?? SIZE * 0.8, descent: f.fontBoundingBoxDescent ?? SIZE * 0.2, total: pen });
  }, [text, font, kerning]);

  const W = 600, H = 220, BASE = 140, X0 = 24;
  const scale = layout ? Math.min(1, (W - 2 * X0) / Math.max(1, layout.total)) : 1;
  const X = (x: number) => X0 + x * scale, Y = (y: number) => BASE - y * scale;
  const g = layout?.glyphs[Math.min(sel, (layout?.glyphs.length ?? 1) - 1)];
  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figGlyph_title", "Glyph Metrics — Laying Out a Line by Hand")}
        </span>
        <div className="flex gap-1.5">{(Object.keys(FONTS) as FontKey[]).map(f => <button key={f} className={btn(font === f)} onClick={() => setFont(f)}>{f}</button>)}</div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label="Glyph metrics">
          {layout && <>
            <line x1={0} y1={Y(layout.ascent)} x2={W} y2={Y(layout.ascent)} stroke="#a855f7" strokeDasharray="4 3" opacity={0.6} />
            <line x1={0} y1={Y(0)} x2={W} y2={Y(0)} stroke="#22c55e" strokeWidth={1.2} />
            <line x1={0} y1={Y(-layout.descent)} x2={W} y2={Y(-layout.descent)} stroke="#a855f7" strokeDasharray="4 3" opacity={0.6} />
            <text x={W - 4} y={Y(layout.ascent) - 3} textAnchor="end" fontSize="8" fontFamily="monospace" fill="#a855f7">ascender</text>
            <text x={W - 4} y={Y(0) - 3} textAnchor="end" fontSize="8" fontFamily="monospace" fill="#22c55e">baseline</text>
            <text x={W - 4} y={Y(-layout.descent) + 10} textAnchor="end" fontSize="8" fontFamily="monospace" fill="#a855f7">descender</text>
            {layout.glyphs.map((gl, i) => (
              <g key={i} onPointerEnter={() => setSel(i)} style={{ cursor: "pointer" }}>
                {boxes && gl.ch.trim() && <rect x={X(gl.pen + gl.left)} y={Y(gl.asc)} width={(gl.right - gl.left) * scale} height={(gl.asc + gl.desc) * scale}
                  fill={i === sel ? "#3b82f6" : "transparent"} fillOpacity={0.12} stroke={i === sel ? "#3b82f6" : "var(--code-muted)"} strokeWidth={0.8} strokeDasharray={i === sel ? "" : "2 2"} />}
                <rect x={X(gl.pen)} y={Y(layout.ascent)} width={Math.max(2, gl.adv * scale)} height={(layout.ascent + layout.descent) * scale} fill="transparent" />
                <text x={X(gl.pen)} y={Y(0)} fontSize={SIZE * scale} fontFamily={FONTS[font]} fill="var(--code-text)" style={{ fontKerning: "none" }}>{gl.ch === " " ? " " : gl.ch}</text>
                <circle cx={X(gl.pen)} cy={Y(0)} r={2.4} fill="#f59e0b" />
              </g>
            ))}
            {g && <>
              <line x1={X(g.pen)} y1={Y(-layout.descent) + 16} x2={X(g.pen + g.adv)} y2={Y(-layout.descent) + 16} stroke="#f59e0b" strokeWidth={1.4} markerEnd="" />
              <line x1={X(g.pen)} y1={Y(-layout.descent) + 12} x2={X(g.pen)} y2={Y(-layout.descent) + 20} stroke="#f59e0b" />
              <line x1={X(g.pen + g.adv)} y1={Y(-layout.descent) + 12} x2={X(g.pen + g.adv)} y2={Y(-layout.descent) + 20} stroke="#f59e0b" />
              <Label x={X(g.pen)} y={Y(-layout.descent) + 34} size={8} color="#f59e0b">{`advance ${g.adv.toFixed(1)}px`}</Label>
            </>}
          </>}
        </svg>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 min-w-0">
          <input value={text} onChange={e => setText(e.target.value.slice(0, 24))} spellCheck={false}
            className="w-full bg-[var(--code-bg)] border border-[var(--code-border)] rounded px-2 py-1 font-mono text-[12px] text-[var(--code-text)] outline-none focus:border-[var(--primary)]" />
          <div className="flex gap-4 flex-wrap text-[10px] font-mono text-[var(--text-muted)]">
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={kerning} onChange={e => setKerning(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figGlyph_kern", "apply kerning")}</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={boxes} onChange={e => setBoxes(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figGlyph_boxes", "ink boxes")}</label>
          </div>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {tx(t, "figGlyph_note", "Amber dots are pen positions on the baseline. Hover a glyph to read its metrics. Its ink box (blue) starts bearing-x from the pen and rises bearing-y above the baseline; the pen then moves right by the advance, which includes the glyph's spacing. Turn kerning off and look at \"AV\" and \"To\": the pairs spread apart, because the font's kerning table normally pulls them together by a few pixels.")}
          </p>
        </div>
        {g && (
          <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--code-text)] min-w-[200px]">
            <div>glyph &lsquo;<span className="text-[var(--primary)]">{g.ch}</span>&rsquo; (U+{g.ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")})</div>
            <div>pen x = {g.pen.toFixed(1)}</div>
            <div>bearing x = {g.left.toFixed(1)}</div>
            <div>bearing y = {g.asc.toFixed(1)}</div>
            <div>size = {(g.right - g.left).toFixed(1)} × {(g.asc + g.desc).toFixed(1)}</div>
            <div>advance = {g.adv.toFixed(1)}</div>
            <div className={g.kern ? "text-amber-400" : ""}>kern with next = {g.kern.toFixed(1)}</div>
          </div>
        )}
      </div>
    </figure>
  );
}
