"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Two commands in one command buffer: A writes a resource, B reads it. The
// GPU overlaps commands freely, so without a barrier B's stages can run while
// A is still writing. A VkDependencyInfo barrier says which stages of A must
// finish (srcStageMask) before which stages of B may start (dstStageMask),
// and which writes must be flushed (srcAccessMask) and made visible to which
// reads (dstAccessMask). The timeline is recomputed for the masks chosen:
// stages of B before the dst stage still overlap A; the rest waits.

type Sc = "sample" | "copy" | "compute";
type Opt = "exact" | "all" | "wrong";

const GFX = ["VERTEX_ATTRIBUTE_INPUT", "VERTEX_SHADER", "FRAGMENT_SHADER", "COLOR_ATTACHMENT_OUTPUT"];
const SHORT: Record<string, string> = {
  VERTEX_ATTRIBUTE_INPUT: "vertex input", VERTEX_SHADER: "vertex shader", FRAGMENT_SHADER: "fragment shader",
  COLOR_ATTACHMENT_OUTPUT: "colour output", COPY: "copy", COMPUTE_SHADER: "compute shader",
};
/** The label drawn inside each stage box; the legend under the drawing spells them out. */
const ABBR: Record<string, string> = {
  VERTEX_ATTRIBUTE_INPUT: "VI", VERTEX_SHADER: "VS", FRAGMENT_SHADER: "FS", COLOR_ATTACHMENT_OUTPUT: "OUT", COPY: "COPY", COMPUTE_SHADER: "CS",
};

const SCEN: Record<Sc, {
  a: string[]; writer: string; wAccess: string; reader: string; rAccess: string; wrongSrc: string; lateDst: string; layout?: [string, string];
}> = {
  sample: { a: GFX, writer: "COLOR_ATTACHMENT_OUTPUT", wAccess: "COLOR_ATTACHMENT_WRITE", reader: "FRAGMENT_SHADER", rAccess: "SHADER_SAMPLED_READ",
    wrongSrc: "FRAGMENT_SHADER", lateDst: "COLOR_ATTACHMENT_OUTPUT", layout: ["COLOR_ATTACHMENT_OPTIMAL", "SHADER_READ_ONLY_OPTIMAL"] },
  copy: { a: ["COPY"], writer: "COPY", wAccess: "TRANSFER_WRITE", reader: "VERTEX_ATTRIBUTE_INPUT", rAccess: "VERTEX_ATTRIBUTE_READ",
    wrongSrc: "NONE", lateDst: "VERTEX_SHADER" },
  compute: { a: ["COMPUTE_SHADER"], writer: "COMPUTE_SHADER", wAccess: "SHADER_STORAGE_WRITE", reader: "VERTEX_SHADER", rAccess: "SHADER_STORAGE_READ",
    wrongSrc: "NONE", lateDst: "FRAGMENT_SHADER" },
};

const W = 620, X0 = 70, UNIT = 44, STAGE = 3, ROW = 30;
const YA = 26, YB = 26 + ROW + 22;

/**
 * Start time of each of B's stages. B would start one unit after A, one stage
 * after another; stage `d` (the dstStageMask) and everything after it may not
 * start before `waitEnd` (when A's srcStageMask stages finish).
 */
function scheduleB(d: number, waitEnd: number) {
  const out: number[] = [];
  GFX.forEach((_, i) => {
    const natural = i === 0 ? 1 : out[i - 1] + STAGE;
    out.push(i === d ? Math.max(natural, waitEnd) : natural);
  });
  return out;
}

export function BarrierFigure({ t }: { t?: TrackTranslations }) {
  const [sc, setSc] = useState<Sc>("sample");
  const [src, setSrc] = useState<Opt>("exact");
  const [dst, setDst] = useState<Opt>("exact");
  const [srcAcc, setSrcAcc] = useState(true);
  const [dstAcc, setDstAcc] = useState(true);
  const [layoutOk, setLayoutOk] = useState(true);
  const s = SCEN[sc];
  const L = (k: string, en: string) => tx(t, `figVkBar_${k}`, en);

  const srcStage = src === "exact" ? s.writer : src === "all" ? "ALL_COMMANDS" : s.wrongSrc;
  const dstStage = dst === "exact" ? s.reader : dst === "all" ? "ALL_COMMANDS" : s.lateDst;

  // ── Schedule: A runs from 0; B would naturally start one unit later ──
  // A single copy or dispatch is drawn as one long stage (a big job)
  const aSpan = s.a.length === 1 ? 2 * STAGE : STAGE;
  const aEnd = (name: string) => (s.a.indexOf(name) + 1) * aSpan;
  const writerEnd = aEnd(s.writer);
  const waitEnd = srcStage === "ALL_COMMANDS" ? s.a.length * aSpan : srcStage === "NONE" ? 0 : s.a.includes(srcStage) ? aEnd(srcStage) : 0;
  const bStart = scheduleB(dstStage === "ALL_COMMANDS" ? 0 : GFX.indexOf(dstStage), waitEnd);
  const execRace = bStart[GFX.indexOf(s.reader)] < writerEnd;
  const bEnd = bStart[GFX.length - 1] + STAGE;
  const naturalEnd = scheduleB(GFX.length, 0)[GFX.length - 1] + STAGE;
  const idealEnd = scheduleB(GFX.indexOf(s.reader), writerEnd)[GFX.length - 1] + STAGE;

  const problems: string[] = [];
  if (execRace) problems.push(src === "wrong"
    ? L("pSrc", "Execution race: srcStageMask does not include the stage that writes, so nothing waits for the write to finish. B reads while A is still writing (red).")
    : L("pDst", "Execution race: dstStageMask names a stage after the one that reads, so the read is not held back. B's reader stage overlaps A's write (red)."));
  if (!srcAcc) problems.push(L("pSrcAcc", "srcAccessMask is NONE: the write is not made available. It may still sit in a cache the reader cannot see, so B can read stale data even though the timing is right."));
  if (!dstAcc) problems.push(L("pDstAcc", "dstAccessMask is NONE: the data is not made visible to the reader's caches. Same result: stale data, intermittently, on some GPUs."));
  if (s.layout && !layoutOk) problems.push(L("pLayout", "The image stays in COLOR_ATTACHMENT_OPTIMAL, but sampling needs SHADER_READ_ONLY_OPTIMAL. The validation layer reports the layout mismatch; the GPU may read compressed data it cannot decode."));
  const over = !problems.length && (src === "all" || dst === "all");

  const bar = (x0: number, y: number, st: number, span: number, color: string, red = false) => (
    <g>
      <rect x={x0 + (st / STAGE) * UNIT} y={y} width={(span / STAGE) * UNIT - 2} height={ROW - 6} rx={3} fill={red ? C.red : color} fillOpacity={red ? 0.45 : 0.22} stroke={red ? C.red : color} />
    </g>
  );
  const unitX = (u: number) => X0 + (u / STAGE) * UNIT;

  const code = [
    `VkImageMemoryBarrier2 b{ VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2 };`.replace("Image", s.layout ? "Image" : "Buffer").replace("IMAGE", s.layout ? "IMAGE" : "BUFFER"),
    `b.srcStageMask  = VK_PIPELINE_STAGE_2_${srcStage}${srcStage === "NONE" ? "" : "_BIT"};`,
    `b.srcAccessMask = ${srcAcc ? `VK_ACCESS_2_${s.wAccess}_BIT` : "VK_ACCESS_2_NONE"};`,
    `b.dstStageMask  = VK_PIPELINE_STAGE_2_${dstStage}_BIT;`,
    `b.dstAccessMask = ${dstAcc ? `VK_ACCESS_2_${s.rAccess}_BIT` : "VK_ACCESS_2_NONE"};`,
    ...(s.layout ? [`b.oldLayout     = VK_IMAGE_LAYOUT_${s.layout[0]};`, `b.newLayout     = VK_IMAGE_LAYOUT_${layoutOk ? s.layout[1] : s.layout[0]};`] : []),
  ];

  const H = YB + ROW + 44;
  const legend = [...new Set([...s.a, ...GFX])].map(n => `${ABBR[n]} ${SHORT[n]}`).join(" · ");
  return (
    <Figure
      title={L("title", "A pipeline barrier, stage by stage")}
      head={<Choice value={sc} onChange={v => { setSc(v); setSrc("exact"); setDst("exact"); setSrcAcc(true); setDstAcc(true); setLayoutOk(true); }}
        options={[["sample", L("scSample", "render → sample")], ["copy", L("scCopy", "copy → vertex fetch")], ["compute", L("scCompute", "compute → vertex shader")]] as const} />}
      controls={<>
        <Row><span className="text-[10px] font-mono text-[var(--text-muted)] w-28">srcStageMask</span>
          <Choice value={src} onChange={setSrc} options={[["exact", SHORT[s.writer]], ["all", "ALL_COMMANDS"], ["wrong", s.wrongSrc === "NONE" ? "NONE" : SHORT[s.wrongSrc]]] as const} /></Row>
        <Row><span className="text-[10px] font-mono text-[var(--text-muted)] w-28">dstStageMask</span>
          <Choice value={dst} onChange={setDst} options={[["exact", SHORT[s.reader]], ["all", "ALL_COMMANDS"], ["wrong", SHORT[s.lateDst]]] as const} /></Row>
        <Row><span className="text-[10px] font-mono text-[var(--text-muted)] w-28">access masks</span>
          <Choice value={srcAcc ? "y" : "n"} onChange={v => setSrcAcc(v === "y")} options={[["y", s.wAccess], ["n", "src NONE"]] as const} />
          <Choice value={dstAcc ? "y" : "n"} onChange={v => setDstAcc(v === "y")} options={[["y", s.rAccess], ["n", "dst NONE"]] as const} /></Row>
        {s.layout && <Row><span className="text-[10px] font-mono text-[var(--text-muted)] w-28">newLayout</span>
          <Choice value={layoutOk ? "y" : "n"} onChange={v => setLayoutOk(v === "y")} options={[["y", s.layout[1]], ["n", L("unchanged", "unchanged")]] as const} /></Row>}
        <pre className="text-[10.5px] leading-[1.5] font-mono p-3 rounded-lg bg-[var(--code-bg)] border border-[var(--border)] overflow-x-auto text-[var(--text-main)]">{code.join("\n")}</pre>
        <Row><Readout>{L("stall", "B finishes at")} t = {bEnd} ({L("ideal", "exact masks")}: {idealEnd}, {L("none", "no barrier")}: {naturalEnd})</Readout></Row>
        {problems.length
          ? problems.map((p, i) => <p key={i} className="text-[12.5px] leading-relaxed" style={{ color: C.red }}>{p}</p>)
          : <p className="text-[12.5px] leading-relaxed" style={{ color: over ? C.amber : C.green }}>
              {over ? L("over", "Correct, but broader than needed: ALL_COMMANDS waits for (or blocks) every stage, so more of B sits idle than the dependency requires. Fine while learning; costly when it is in every pass.")
                : L("good", "Correct and tight: only the stage that reads waits, and only for the stage that writes. B's earlier stages still overlap A.")}
            </p>}
      </>}
      note={L("note", "Each box is one pipeline stage of a command, and time runs to the right. Without a barrier, B starts right behind A and its stages overlap A's. The barrier draws a line: the stages of B from dstStageMask on may not start until the stages of A in srcStageMask have finished. That is the execution dependency. The access masks add the memory dependency: the writes are flushed from the writer's caches (available) and the reader's caches are invalidated (visible). You need both. Getting the timing right is not enough if the data stays in the wrong cache, and on many desktop GPUs a missing access mask happens to work, until it doesn't.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <T x={8} y={YA + 16} size={9} bold color={C.fg}>A</T>
        <T x={22} y={YA + 16} size={7.5}>{L("writes", "writes")}</T>
        <T x={8} y={YB + 16} size={9} bold color={C.fg}>B</T>
        <T x={22} y={YB + 16} size={7.5}>{L("reads", "reads")}</T>
        {s.a.map((n, i) => {
          const st = i * aSpan, w = n === s.writer;
          return (
            <g key={`a${n}`}>
              {bar(X0, YA, st, aSpan, w ? C.amber : C.sky)}
              <T x={(unitX(st) + unitX(st + aSpan)) / 2 - 1} y={YA + 16} size={8.5} anchor="middle" color={C.fg} bold={w}>{ABBR[n]}</T>
            </g>
          );
        })}
        {GFX.map((n, i) => {
          const st = bStart[i], r = n === s.reader, red = r && execRace;
          return (
            <g key={`b${n}`}>
              {bar(X0, YB, st, STAGE, r ? C.green : C.sky, red)}
              <T x={unitX(st) + (UNIT - 2) / 2} y={YB + 16} size={8.5} anchor="middle" color={C.fg} bold={r}>{ABBR[n]}</T>
            </g>
          );
        })}
        {srcStage !== "NONE" && waitEnd > 0 && (
          <g>
            <line x1={unitX(waitEnd)} y1={YA - 12} x2={unitX(waitEnd)} y2={YB + ROW - 4} stroke={C.purple} strokeWidth={1.8} strokeDasharray="5 3" />
            <T x={unitX(waitEnd) + 4} y={YB - 6} size={7.5} color={C.purple} bold>{L("barrier", "barrier")}</T>
          </g>
        )}
        {Array.from({ length: 28 }, (_, u) => u).filter(u => u % 3 === 0).map(u => (
          <T key={u} x={unitX(u)} y={H - 20} size={7} anchor="middle">t={u}</T>
        ))}
        <T x={8} y={H - 5} size={7.5}>{legend}</T>
      </svg>
    </Figure>
  );
}
