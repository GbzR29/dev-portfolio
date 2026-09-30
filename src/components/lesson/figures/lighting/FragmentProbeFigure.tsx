"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Slider, Sliders, C, f2 } from "@/components/lesson/kit/figure";
import { drawPhongSphere, rgbCss, type PhongMaterial, type RGB } from "./sphere";
import { MATERIALS } from "./MaterialsFigure";

// ── What this figure shows ────────────────────────────────────────────────────
// One fragment of the material shader, computed by hand. Click anywhere on
// the sphere: the table lists every value the fragment shader computes there,
// in order: the normal N, the directions to the light L and to the eye V,
// the two dot products, the specular power, the three terms (light colour ⊙
// material colour ⊙ factor), their sum, and the clamp to 1 that happens when
// the result is written to an 8-bit framebuffer.

type V3 = [number, number, number];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const nrm = (v: V3): V3 => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const vs = (v: number[], d = 2) => `(${v.map(x => f2(x, d)).join(", ")})`;

const CORAL: PhongMaterial & { name: string } = { name: "coral", ambient: [1, 0.5, 0.31], diffuse: [1, 0.5, 0.31], specular: [0.5, 0.5, 0.5], shininess: 32 };
const PICK: Record<string, PhongMaterial & { name: string }> = {
  coral: CORAL,
  gold: MATERIALS.find(m => m.name === "gold")!,
  chrome: MATERIALS.find(m => m.name === "chrome")!,
  rubber: MATERIALS.find(m => m.name === "black rubber")!,
};
type MKey = "coral" | "gold" | "chrome" | "rubber";
const SIZE = 220;

export function FragmentProbeFigure({ t }: { t?: TrackTranslations }) {
  const [mk, setMk] = useState<MKey>("coral");
  const [az, setAz] = useState(-30);
  const [bright, setBright] = useState(false);
  const [probe, setProbe] = useState<[number, number]>([-0.16, 0.25]);    // sphere-space x, y in [−1, 1]; starts at the edge of the highlight
  const ref = useRef<HTMLCanvasElement>(null);
  const L_ = (k: string, en: string) => tx(t, `figFrag_${k}`, en);

  const mat = PICK[mk];
  const r = (az * Math.PI) / 180;
  const Ldir = nrm([Math.sin(r) * 0.8, 0.55, Math.cos(r) * 0.8]);
  // the chapter's light: ambient 0.2, diffuse 0.5, specular 1.0 — or the table's all-1.0 light
  const light = bright
    ? { ambient: [1, 1, 1] as RGB, diffuse: [1, 1, 1] as RGB, specular: [1, 1, 1] as RGB }
    : { ambient: [0.2, 0.2, 0.2] as RGB, diffuse: [0.5, 0.5, 0.5] as RGB, specular: [1, 1, 1] as RGB };

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    drawPhongSphere(cv, mat, { dir: Ldir, ...light });
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const rad = SIZE / 2 - 1.5;
    const cx = SIZE / 2 + probe[0] * rad, cy = SIZE / 2 - probe[1] * rad;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000"; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, 2 * Math.PI); ctx.stroke();
    ctx.strokeStyle = "#fff"; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 2 * Math.PI); ctx.stroke();
  });

  const click = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - b.left) / b.width) * 2 - 1, y = -(((e.clientY - b.top) / b.height) * 2 - 1);
    if (x * x + y * y < 0.98) setProbe([x, y]);
  };

  // ── the fragment shader, step by step ──
  const Nv = nrm([probe[0], probe[1], Math.sqrt(Math.max(0, 1 - probe[0] ** 2 - probe[1] ** 2))]);
  const V: V3 = [0, 0, 1];
  const ndl = dot(Nv, Ldir);
  const diff = Math.max(ndl, 0);
  const R: V3 = [2 * ndl * Nv[0] - Ldir[0], 2 * ndl * Nv[1] - Ldir[1], 2 * ndl * Nv[2] - Ldir[2]];   // reflect(−L, N)
  const rdv = dot(R, V);
  const spec = ndl > 0 ? Math.pow(Math.max(rdv, 0), mat.shininess) : 0;
  const amb = light.ambient.map((l, i) => l * mat.ambient[i]);
  const dif = light.diffuse.map((l, i) => l * mat.diffuse[i] * diff);
  const spc = light.specular.map((l, i) => l * mat.specular[i] * spec);
  const sum = amb.map((a, i) => a + dif[i] + spc[i]);
  const clipped = sum.some(v => v > 1);

  const row = (label: string, value: string, note?: string, color?: string) => (
    <tr className="border-b border-[var(--border)]/50 last:border-0">
      <td className="py-1 pr-3 font-mono text-[10.5px] text-[var(--text-muted)] whitespace-nowrap">{label}</td>
      <td className="py-1 pr-3 font-mono text-[10.5px] whitespace-nowrap" style={{ color: color ?? "var(--text-main)" }}>{value}</td>
      <td className="py-1 text-[10.5px] text-[var(--text-muted)]">{note}</td>
    </tr>
  );

  return (
    <Figure
      title={L_("title", "Inside one fragment")}
      head={<Choice value={mk} onChange={setMk} options={[["coral", L_("coral", "coral (this chapter)")], ["gold", "gold"], ["chrome", "chrome"], ["rubber", L_("rubber", "black rubber")]] as const} />}
      controls={<>
        <Sliders>
          <Slider label={L_("light", "light direction")} value={az} min={-80} max={80} step={1} onChange={setAz} fmt={v => `${v}°`} />
        </Sliders>
        <Row>
          <Choice value={bright ? "b" : "d"} onChange={v => setBright(v === "b")} options={[["d", L_("dim", "light 0.2 / 0.5 / 1.0")], ["b", L_("bright", "light 1.0 / 1.0 / 1.0")]] as const} />
          <Readout>α = {mat.shininess.toFixed(1)}</Readout>
        </Row>
      </>}
      note={L_("note", "Click the sphere to move the probed fragment. The eye looks straight at the sphere, so V = (0, 0, 1) everywhere. N·L is the cosine between the normal and the light: 1 facing the light, 0 at the terminator, negative behind (then max(…, 0) keeps the diffuse term at 0). R is the light direction mirrored about the normal, and (R·V)^α shows how fast the highlight falls off: with α = 32, R·V = 0.95 already gives only 0.19, and 0.9 gives 0.034. Switch to the brighter light and probe the highlight on gold: the sum exceeds 1 in some channels and is clipped when stored, which flattens the highlight.")}
    >
      <div className="grid md:grid-cols-[auto_1fr] gap-0">
        <div className="p-4 flex items-center justify-center md:border-r border-b md:border-b-0 border-[var(--border)]">
          <canvas ref={ref} width={SIZE} height={SIZE} onClick={click} className="w-48 h-48 cursor-crosshair" aria-label="sphere" />
        </div>
        <div className="p-3 overflow-x-auto">
          <table className="w-full">
            <tbody>
              {row("N", vs(Nv), L_("rN", "surface normal at the fragment (unit length)"))}
              {row("L", vs(Ldir), L_("rL", "direction from the fragment to the light"))}
              {row("N·L", f2(ndl, 3), ndl < 0 ? L_("rBehind", "negative: facing away, diffuse = 0") : L_("rNdl", "cosine of the angle: the diffuse factor"), ndl < 0 ? C.red : undefined)}
              {row("R", vs(R), L_("rR", "reflect(−L, N) = 2(N·L)N − L"))}
              {row("R·V", f2(rdv, 3), L_("rRdv", "how close the mirror direction is to the eye"))}
              {row("(R·V)^α", f2(spec, 4), L_("rSpec", "the specular factor"))}
              {row(L_("amb", "ambient"), vs(amb, 3), "La ⊙ ka")}
              {row(L_("dif", "diffuse"), vs(dif, 3), `Ld ⊙ kd · ${f2(diff, 3)}`)}
              {row(L_("spc", "specular"), vs(spc, 3), `Ls ⊙ ks · ${f2(spec, 4)}`)}
              <tr>
                <td className="py-1.5 pr-3 font-mono text-[10.5px] font-bold text-[var(--text-main)]">{L_("sum", "sum")}</td>
                <td className="py-1.5 pr-3 font-mono text-[10.5px] whitespace-nowrap" style={{ color: clipped ? C.red : C.green }}>{vs(sum, 3)}</td>
                <td className="py-1.5 text-[10.5px] text-[var(--text-muted)]">
                  <span className="inline-block w-4 h-4 align-middle rounded-sm border border-[var(--border)] mr-2" style={{ background: rgbCss(sum as RGB) }} />
                  {clipped ? L_("clip", "above 1: clipped when written") : L_("noClip", "all channels ≤ 1")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Figure>
  );
}
