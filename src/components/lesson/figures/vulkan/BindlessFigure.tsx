"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// One bindless descriptor set: a binding with an array of 16 combined image
// samplers, of which the first 10 have been written. Four objects are drawn;
// each passes a texture index in its push constant (click an object to
// change it). The rules the validation layer enforces are applied live:
// without PARTIALLY_BOUND every element must be written; with it, empty
// elements are allowed as long as no draw reads one. The slider compares the
// commands a frame records with one set per material and with bindless.

const SLOTS = 16, WRITTEN = 10;
const SWATCH = ["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#14b8a6", "#0ea5e9", "#3b82f6", "#a855f7", "#ec4899", "#f97316"];
const SW = 34, AX = 20, AY = 40, OBJ_Y = 150, OBJ = 46;
const fmt = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");   // same in every language and on the server

function Swatch({ x, y, s, k }: { x: number; y: number; s: number; k: number }) {
  const col = SWATCH[k % SWATCH.length], dir = k % 3;
  return (
    <g>
      <rect x={x} y={y} width={s} height={s} rx={3} fill={col} fillOpacity={0.85} />
      {[0.25, 0.5, 0.75].map(f => dir === 0
        ? <line key={f} x1={x + f * s} y1={y + 2} x2={x + f * s} y2={y + s - 2} stroke="#fff" strokeOpacity={0.45} strokeWidth={1.4} />
        : dir === 1
          ? <line key={f} x1={x + 2} y1={y + f * s} x2={x + s - 2} y2={y + f * s} stroke="#fff" strokeOpacity={0.45} strokeWidth={1.4} />
          : <circle key={f} cx={x + f * s} cy={y + f * s} r={s * 0.08} fill="#fff" fillOpacity={0.55} />)}
    </g>
  );
}

export function BindlessFigure({ t }: { t?: TrackTranslations }) {
  const [partial, setPartial] = useState(true);
  const [idx, setIdx] = useState([0, 3, 6, 8]);
  const [objects, setObjects] = useState(2000);
  const L = (k: string, en: string) => tx(t, `figVkBind_${k}`, en);

  const slotX = (i: number) => AX + i * (SW + 3.5);
  const objX = (o: number) => 70 + o * 140;
  const bad = idx.map((k, o) => (k >= WRITTEN ? o : -1)).filter(o => o >= 0);
  const unboundError = !partial;
  const classic = 1 + 3 * objects, bindless = 2 + 2 * objects;

  return (
    <Figure
      title={L("title", "One array of every texture, indexed per draw")}
      head={<Btn active={partial} onClick={() => setPartial(v => !v)}>{partial ? "☑" : "☐"} PARTIALLY_BOUND</Btn>}
      controls={<>
        <Row>
          <div className="flex-1 min-w-[220px]"><Slider label={L("objects", "objects / frame")} value={objects} min={1} max={10000} step={1} onChange={setObjects} fmt={v => `${v}`} width="w-28" /></div>
        </Row>
        <Row>
          <Readout color={C.amber}>{L("classic", "one set per material")}: {fmt(classic)} {L("calls", "commands")}</Readout>
          <Readout color={C.green}>{L("bindless", "bindless")}: {fmt(bindless)} {L("calls", "commands")}</Readout>
        </Row>
        {unboundError && <p className="text-[12.5px] leading-relaxed" style={{ color: C.red }}>{L("errUnbound", "Validation error at the first draw: descriptors 10 to 15 of binding 0 were never written. Without PARTIALLY_BOUND every element of the array must hold a valid descriptor whenever a draw could use the set, whether the shader reads it or not.")}</p>}
        {!unboundError && bad.length > 0 && <p className="text-[12.5px] leading-relaxed" style={{ color: C.red }}>{L("errRead", "Object {o} reads element {k}, which holds no descriptor. PARTIALLY_BOUND allows empty elements only if nothing reads them; this read is undefined behaviour: garbage texels, or a GPU crash (VK_ERROR_DEVICE_LOST). GPU-assisted validation can catch it.").replace("{o}", String(bad[0] + 1)).replace("{k}", String(idx[bad[0]]))}</p>}
        {!unboundError && bad.length === 0 && <p className="text-[12.5px] leading-relaxed" style={{ color: C.green }}>{L("ok", "Valid: the empty elements are never read. The set is bound once per frame; each draw only pushes its index.")}</p>}
      </>}
      note={L("note", "The top row is binding 0 of the bindless set, an array of combined image samplers; element i holds texture i, and the dashed ones were never written (room for textures loaded later). Each object's push constant carries textureIndex, and the fragment shader samples textures[pc.textureIndex]. Click an object to change its index. The counts assume one vkCmdDrawIndexed and one vkCmdPushConstants per object; the classic path also rebinds a material set per object, the bindless path binds its set once.")}
    >
      <svg viewBox="0 0 640 230" className="w-full h-auto" role="img">
        <T x={AX} y={AY - 12} size={9} bold color={C.fg}>layout(set = 1, binding = 0) uniform sampler2D textures[]</T>
        {Array.from({ length: SLOTS }, (_, i) => (
          <g key={i}>
            {i < WRITTEN ? <Swatch x={slotX(i)} y={AY} s={SW} k={i} />
              : <rect x={slotX(i)} y={AY} width={SW} height={SW} rx={3} fill="none" stroke={unboundError ? C.red : "#64748b"} strokeDasharray="3 2" />}
            <T x={slotX(i) + SW / 2} y={AY + SW + 11} size={7.5} anchor="middle">{i}</T>
          </g>
        ))}
        {idx.map((k, o) => {
          const empty = k >= WRITTEN, x = objX(o);
          return (
            <g key={o} style={{ cursor: "pointer" }} onClick={() => setIdx(v => v.map((w, j) => (j === o ? (w + 1) % SLOTS : w)))}>
              <path d={`M${x + OBJ / 2} ${OBJ_Y} C ${x + OBJ / 2} ${OBJ_Y - 30}, ${slotX(k) + SW / 2} ${AY + SW + 40}, ${slotX(k) + SW / 2} ${AY + SW + 14}`}
                fill="none" stroke={empty ? C.red : C.sky} strokeWidth={1.3} strokeDasharray={empty ? "4 3" : undefined} />
              {empty
                ? <g><rect x={x} y={OBJ_Y} width={OBJ} height={OBJ} rx={4} fill={C.red} fillOpacity={0.2} stroke={C.red} /><T x={x + OBJ / 2} y={OBJ_Y + OBJ / 2 + 5} size={16} anchor="middle" color={C.red} bold>?</T></g>
                : <Swatch x={x} y={OBJ_Y} s={OBJ} k={k} />}
              <rect x={x - 4} y={OBJ_Y - 4} width={OBJ + 8} height={OBJ + 8} rx={6} fill="transparent" stroke="none" />
              <T x={x + OBJ / 2} y={OBJ_Y + OBJ + 13} size={8} anchor="middle" color={C.fg}>{L("object", "object")} {o + 1}</T>
              <T x={x + OBJ / 2} y={OBJ_Y + OBJ + 24} size={7.5} anchor="middle" color={empty ? C.red : C.sky}>textureIndex = {k}</T>
            </g>
          );
        })}
      </svg>
    </Figure>
  );
}
