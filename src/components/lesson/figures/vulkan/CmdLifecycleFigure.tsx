"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The five states of a VkCommandBuffer and the calls that move it between
// them. Every button is a real API call; a call that is not allowed in the
// current state is answered the way the validation layer would answer it, and
// the state does not change. Two creation flags change the rules: the pool's
// RESET_COMMAND_BUFFER_BIT (may a buffer be reset on its own?) and the begin
// flag ONE_TIME_SUBMIT_BIT (does the buffer become invalid after one run?).

type State = "initial" | "recording" | "executable" | "pending" | "invalid";
type Act = "begin" | "draw" | "end" | "submit" | "finish" | "reset" | "poolReset";

const W = 600, H = 176, BW = 104, BH = 34;
const POS: Record<State, { x: number; y: number }> = {
  initial: { x: 14, y: 30 }, recording: { x: 164, y: 30 }, executable: { x: 314, y: 30 },
  pending: { x: 464, y: 30 }, invalid: { x: 314, y: 122 },
};
const COL: Record<State, string> = { initial: C.sky, recording: C.amber, executable: C.green, pending: C.purple, invalid: C.red };
const ARROWS: [State, State, string][] = [
  ["initial", "recording", "begin"], ["recording", "executable", "end"], ["executable", "pending", "submit"],
];

type Result = { next: State; ok: boolean; en: string; key: string };

function step(s: State, a: Act, resetFlag: boolean, oneTime: boolean): Result {
  const err = (key: string, en: string): Result => ({ next: s, ok: false, key, en });
  const ok = (next: State, key: string, en: string): Result => ({ next, ok: true, key, en });
  switch (a) {
    case "begin":
      if (s === "recording" || s === "pending") return err("eBeginBusy", "vkBeginCommandBuffer(): the command buffer is already recording or is pending on the GPU.");
      if (s !== "initial" && !resetFlag) return err("eBeginNoReset", "vkBeginCommandBuffer(): the buffer is not in the initial state, and its pool was created without RESET_COMMAND_BUFFER_BIT, so begin cannot reset it implicitly.");
      return ok("recording", s === "initial" ? "oBegin" : "oBeginReset", s === "initial" ? "Recording started." : "Implicit reset (the pool allows it), then recording started: the old commands are gone.");
    case "draw":
      if (s !== "recording") return err("eDraw", "vkCmdDraw(): the command buffer is not in the recording state. vkCmd* calls only record; they need a buffer between begin and end.");
      return ok("recording", "oDraw", "vkCmdDraw recorded. Nothing ran: the GPU has not seen this buffer yet.");
    case "end":
      if (s !== "recording") return err("eEnd", "vkEndCommandBuffer(): the command buffer is not in the recording state.");
      return ok("executable", "oEnd", "Recording finished. The buffer can now be submitted, as many times as you like unless ONE_TIME_SUBMIT was set.");
    case "submit":
      if (s === "pending") return err("eSubmitPending", "vkQueueSubmit2(): the command buffer is already pending, and it was not begun with SIMULTANEOUS_USE_BIT.");
      if (s !== "executable") return err("eSubmit", "vkQueueSubmit2(): the command buffer is not in the executable state. Only a finished recording can be submitted.");
      return ok("pending", "oSubmit", "Submitted: the GPU owns it now. Do not reset, re-record or free it until the fence says it is done.");
    case "finish":
      if (s !== "pending") return err("eFinish", "(nothing is running on the GPU)");
      return oneTime
        ? ok("invalid", "oFinishOne", "The GPU finished. It was begun with ONE_TIME_SUBMIT, so it is now invalid: it must be reset before its next use.")
        : ok("executable", "oFinish", "The GPU finished. The buffer is executable again and could be submitted once more.");
    case "reset":
      if (s === "pending") return err("eResetPending", "vkResetCommandBuffer(): the command buffer is pending. Wait for its fence first.");
      if (!resetFlag) return err("eResetFlag", "vkResetCommandBuffer(): the pool was created without RESET_COMMAND_BUFFER_BIT. Reset the whole pool instead.");
      return ok("initial", "oReset", "Reset: the recorded commands are discarded.");
    case "poolReset":
      if (s === "pending") return err("ePoolPending", "vkResetCommandPool(): a command buffer from this pool is still pending on the GPU.");
      return ok("initial", "oPoolReset", "The whole pool was reset: every buffer allocated from it is back in the initial state. This is the cheapest way to recycle buffers each frame.");
  }
}

const ACTS: [Act, string][] = [
  ["begin", "vkBeginCommandBuffer"], ["draw", "vkCmdDraw"], ["end", "vkEndCommandBuffer"], ["submit", "vkQueueSubmit2"],
  ["finish", "⏱ GPU done"], ["reset", "vkResetCommandBuffer"], ["poolReset", "vkResetCommandPool"],
];

export function CmdLifecycleFigure({ t }: { t?: TrackTranslations }) {
  const [state, setState] = useState<State>("initial");
  const [draws, setDraws] = useState(0);
  const [resetFlag, setResetFlag] = useState(true);
  const [oneTime, setOneTime] = useState(true);
  const [msg, setMsg] = useState<Result | null>(null);

  const act = (a: Act) => {
    const r = step(state, a, resetFlag, oneTime);
    setMsg(r);
    if (!r.ok) return;
    if (a === "draw") setDraws(d => d + 1);
    if (r.next === "initial" || (a === "begin" && state !== "initial")) setDraws(0);
    setState(r.next);
  };
  const restart = (reset: boolean, one: boolean) => { setResetFlag(reset); setOneTime(one); setState("initial"); setDraws(0); setMsg(null); };

  const box = (s: State) => {
    const p = POS[s], on = s === state;
    return (
      <g key={s}>
        <rect x={p.x} y={p.y} width={BW} height={BH} rx={7} fill={COL[s]} fillOpacity={on ? 0.28 : 0.06} stroke={COL[s]} strokeWidth={on ? 2.2 : 1} />
        <T x={p.x + BW / 2} y={p.y + 21} size={10} anchor="middle" bold={on} color={on ? C.fg : C.muted}>{tx(t, `figVkCmd_s_${s}`, s)}</T>
      </g>
    );
  };

  return (
    <Figure
      title={tx(t, "figVkCmd_title", "The life of a command buffer")}
      head={<>
        <Btn active={resetFlag} onClick={() => restart(!resetFlag, oneTime)}>RESET_COMMAND_BUFFER_BIT</Btn>
        <Btn active={oneTime} onClick={() => restart(resetFlag, !oneTime)}>ONE_TIME_SUBMIT_BIT</Btn>
      </>}
      controls={<>
        <Row>{ACTS.map(([a, label]) => <Btn key={a} onClick={() => act(a)}>{a === "finish" ? tx(t, "figVkCmd_gpuDone", label) : label}</Btn>)}</Row>
        <Row><Readout>{tx(t, "figVkCmd_recorded", "recorded draws")}: {draws}</Readout></Row>
        {msg && (
          <p className="text-[12.5px] leading-relaxed font-mono" style={{ color: msg.ok ? C.green : C.red }}>
            {msg.ok || msg.key === "eFinish" ? "" : "Validation Error: "}{tx(t, `figVkCmd_${msg.key}`, msg.en)}
          </p>
        )}
      </>}
      note={tx(t, "figVkCmd_note", "Click the calls in any order. A fresh buffer is initial; begin makes it recording, vkCmd* calls append commands, end makes it executable, and a submit hands it to the GPU (pending) until the work finishes. Try drawing before begin, resetting while pending, or submitting twice: those are the bugs the validation layer catches. The two flags at the top are chosen at creation, so changing one starts over: without RESET_COMMAND_BUFFER_BIT on the pool a buffer can only be recycled by resetting the whole pool, and with ONE_TIME_SUBMIT_BIT a buffer that ran once is invalid until it is reset. Our frame loop uses both: it re-records the same buffer every frame.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <defs>
          <marker id="vkcmd-arrow" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={C.axis} />
          </marker>
        </defs>
        {ARROWS.map(([a, b, label]) => (
          <g key={a}>
            <line x1={POS[a].x + BW} y1={POS[a].y + BH / 2} x2={POS[b].x - 2} y2={POS[b].y + BH / 2} stroke={C.axis} strokeWidth={1.3} markerEnd="url(#vkcmd-arrow)" />
            <T x={(POS[a].x + BW + POS[b].x) / 2} y={POS[a].y + BH / 2 - 6} size={8} anchor="middle">{label}</T>
          </g>
        ))}
        {/* pending → executable (or invalid) when the GPU finishes */}
        <path d={`M${POS.pending.x + BW / 2} ${POS.pending.y + BH} Q ${POS.pending.x + BW / 2} ${POS.pending.y + BH + 34} ${POS.executable.x + BW - 10} ${POS.executable.y + BH + 2}`}
          fill="none" stroke={C.axis} strokeWidth={1.3} markerEnd="url(#vkcmd-arrow)" />
        <T x={POS.pending.x + BW / 2 + 4} y={POS.pending.y + BH + 30} size={8}>{tx(t, "figVkCmd_done", "GPU done")}</T>
        <line x1={POS.pending.x + BW / 2} y1={POS.pending.y + BH} x2={POS.invalid.x + BW + 2} y2={POS.invalid.y + BH / 2} stroke={C.axis} strokeWidth={1.3} strokeDasharray="4 3" markerEnd="url(#vkcmd-arrow)" />
        <T x={POS.invalid.x + BW + 10} y={POS.invalid.y + BH / 2 + 16} size={8}>{tx(t, "figVkCmd_doneOne", "done, if ONE_TIME")}</T>
        {/* any state except pending → initial on reset */}
        <path d={`M${POS.invalid.x} ${POS.invalid.y + BH / 2} L ${POS.initial.x + BW / 2} ${POS.invalid.y + BH / 2} L ${POS.initial.x + BW / 2} ${POS.initial.y + BH + 2}`}
          fill="none" stroke={C.axis} strokeWidth={1.3} strokeDasharray="4 3" markerEnd="url(#vkcmd-arrow)" />
        <T x={POS.initial.x + BW / 2 + 6} y={POS.invalid.y + BH / 2 - 6} size={8}>{tx(t, "figVkCmd_resetArrow", "reset (buffer or pool)")}</T>
        {(Object.keys(POS) as State[]).map(box)}
      </svg>
    </Figure>
  );
}
