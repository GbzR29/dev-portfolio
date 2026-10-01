"use client";

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { useState, type ReactNode } from "react";
import { Figure, Btn, Row, C } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The same texture setup written twice: bind-to-edit on the left, DSA on the
// right. Line 3 calls loadIcon(), a helper from another file that creates a
// 64×64 icon texture and leaves it bound to GL_TEXTURE_2D. Switch the helper
// on and the bind-to-edit lines after it edit the icon instead of the albedo:
// the 1024×1024 upload no longer fits (GL_INVALID_VALUE, dropped), the filter
// lands on the icon, and the albedo renders black. The DSA lines name albedo
// in every call, so the helper changes nothing. "Helper restores the binding"
// shows the defensive fix bind-to-edit code needs instead.

type Tex = { storage: boolean; pixels: boolean; filter: string; mips: boolean };
type Result = { albedo: Tex; icon: Tex | null; errors: string[] };

const FRESH: Tex = { storage: false, pixels: false, filter: "NEAREST_MIPMAP_LINEAR", mips: false };
const ICON: Tex = { storage: true, pixels: true, filter: "LINEAR", mips: false };

function run(dsa: boolean, helper: boolean, restore: boolean): Result {
  const albedo: Tex = { ...FRESH, storage: true };     // line 2 runs before the helper
  if (!helper) return { albedo: { ...albedo, pixels: true, filter: "LINEAR_MIPMAP_LINEAR", mips: true }, icon: null, errors: [] };
  const icon = { ...ICON };
  if (dsa || restore) return { albedo: { ...albedo, pixels: true, filter: "LINEAR_MIPMAP_LINEAR", mips: true }, icon, errors: [] };
  // Bind-to-edit, binding stolen: lines 4–6 act on the icon.
  icon.filter = "LINEAR_MIPMAP_LINEAR";
  return { albedo, icon, errors: ["GL_INVALID_VALUE · glTexSubImage2D: 1024×1024 > 64×64"] };
}

const BIND = [
  "glBindTexture(GL_TEXTURE_2D, albedo);",
  "glTexStorage2D(GL_TEXTURE_2D, 11, …);",
  "loadIcon();",
  "glTexSubImage2D(GL_TEXTURE_2D, 0, …);",
  "glTexParameteri(GL_TEXTURE_2D, …);",
  "glGenerateMipmap(GL_TEXTURE_2D);",
];
const DSA = [
  "glCreateTextures(GL_TEXTURE_2D, 1, &albedo);",
  "glTextureStorage2D(albedo, 11, …);",
  "loadIcon();",
  "glTextureSubImage2D(albedo, 0, …);",
  "glTextureParameteri(albedo, …);",
  "glGenerateTextureMipmap(albedo);",
];

/** A tiny preview of what sampling the texture returns. */
function Swatch({ tex }: { tex: Tex }) {
  const ok = tex.storage && tex.pixels;
  return (
    <svg viewBox="0 0 32 32" className="w-10 h-10 rounded border border-[var(--border)] flex-shrink-0">
      <rect width={32} height={32} fill="#000" />
      {ok && Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x={(i % 4) * 8} y={Math.floor(i / 4) * 8} width={8} height={8}
          fill={(i + Math.floor(i / 4)) % 2 ? "#b45309" : "#f59e0b"} />
      ))}
    </svg>
  );
}

export function BindTargetFigure({ t }: { t?: TrackTranslations }) {
  const L = (k: string, en: string) => tx(t, `figBindTgt_${k}`, en);
  const [helper, setHelper] = useState(true);
  const [restore, setRestore] = useState(false);

  const yes = (b: boolean, good = true): ReactNode =>
    <span style={{ color: b === good ? C.green : C.red }}>{b ? "✓" : "✗"}</span>;

  const panel = (dsa: boolean) => {
    const lines = dsa ? DSA : BIND;
    const r = run(dsa, helper, restore);
    const stolen = helper && !dsa && !restore;
    return (
      <div className="p-3 min-w-0 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: dsa ? C.green : C.amber }}>
          {dsa ? L("dsa", "DSA") : L("bind", "bind-to-edit")}
        </p>
        <ol className="font-mono text-[10.5px] leading-relaxed overflow-x-auto">
          {lines.map((code, i) => {
            const off = i === 2 && !helper;
            const hit = stolen && i >= 3;
            return (
              <li key={i} className="px-1.5 rounded whitespace-nowrap"
                style={{ opacity: off ? 0.35 : 1, textDecoration: off ? "line-through" : undefined,
                  background: hit ? "color-mix(in srgb, #ef4444 14%, transparent)" : undefined,
                  color: i === 2 ? C.purple : "var(--text-main)" }}>
                <span className="select-none text-[var(--text-muted)] mr-2">{i + 1}</span>{code}
                {hit && <span className="ml-2" style={{ color: C.red }}>→ icon</span>}
              </li>
            );
          })}
        </ol>
        <div className="font-mono text-[10.5px] text-[var(--text-muted)]">
          GL_TEXTURE_2D {L("after", "after line 3")}: <span style={{ color: stolen ? C.red : C.fg }}>
            {helper && !restore ? "icon" : dsa ? L("none", "0 (none)") : "albedo"}</span>
        </div>
        <div className="flex gap-3 items-start">
          <Swatch tex={r.albedo} />
          <div className="font-mono text-[10.5px] leading-snug text-[var(--text-main)]">
            <div className="font-bold">albedo</div>
            <div>{L("storage", "storage")} {yes(r.albedo.storage)} · {L("pixels", "pixels")} {yes(r.albedo.pixels)} · mips {yes(r.albedo.mips)}</div>
            <div>MIN_FILTER <span style={{ color: r.albedo.filter === "LINEAR_MIPMAP_LINEAR" ? C.green : C.red }}>{r.albedo.filter}</span></div>
            {r.icon && <div className="mt-1 text-[var(--text-muted)]">icon: MIN_FILTER <span style={{ color: r.icon.filter === "LINEAR" ? C.fg : C.red }}>{r.icon.filter}</span></div>}
          </div>
        </div>
        <div className="font-mono text-[10px] min-h-[1.5em]" style={{ color: r.errors.length ? C.red : C.green }}>
          {r.errors.length ? r.errors.join(" · ") : L("noErr", "no errors")}
        </div>
      </div>
    );
  };

  return (
    <Figure
      title={L("title", "A helper call steals the binding")}
      controls={<Row>
        <Btn active={helper} onClick={() => setHelper(v => !v)}>{L("helper", "call loadIcon() on line 3")}</Btn>
        <Btn active={restore} onClick={() => setRestore(v => !v)}>{L("restore", "helper restores the binding")}</Btn>
      </Row>}
      note={L("note", "loadIcon() is three innocent lines in another file: glGenTextures, glBindTexture(GL_TEXTURE_2D, icon), glTexStorage2D. It leaves the icon bound, and the bind-to-edit code after it never names its texture, so lines 4–6 edit the icon. The upload fails with GL_INVALID_VALUE because 1024×1024 does not fit a 64×64 texture, and the filter quietly changes the icon. The albedo keeps its storage but no pixels: it samples black. Nothing crashes, and the bug appears only when someone adds the helper call. The fix in bind-to-edit style is for every helper to save and restore the binding (glGetIntegerv(GL_TEXTURE_BINDING_2D, …) costs a query each time); DSA needs no fix, because every call names albedo.")}
    >
      <div className="grid md:grid-cols-2 md:divide-x divide-[var(--border)]">
        {panel(false)}
        {panel(true)}
      </div>
    </Figure>
  );
}
