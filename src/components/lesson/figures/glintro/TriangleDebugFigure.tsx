"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The Hello Triangle program as a list of its essential calls. Untick any of
// them and the window on the right shows what the real program would do: a
// crash, a window with only the clear colour, a frozen window, a triangle on
// garbage, or, for a few calls, no visible difference at all (yet). The first
// fatal omission decides; the messages explain each one, with the GL error
// the debug callback would report.

type Effect = "crash" | "nowindow" | "clear" | "black" | "noise" | "blank" | "frozen" | "fine";
type Call = { code: string; key: string; effect: Effect; en: string; group: "init" | "setup" | "loop" };

const CALLS: Call[] = [
  { group: "init", code: "glfwInit();", key: "init", effect: "nowindow", en: "GLFW is not initialised, so glfwCreateWindow returns nullptr and the program has no window at all." },
  { group: "init", code: "glfwWindowHint(… 4, 6, CORE_PROFILE);", key: "hints", effect: "fine", en: "No visible change on Windows and Linux: the driver hands out its default context, usually a Compatibility one of the newest version. On macOS the default is legacy OpenGL 2.1, and the #version 460 shaders fail to compile." },
  { group: "init", code: "glfwMakeContextCurrent(window);", key: "current", effect: "crash", en: "No context is current, so GLAD cannot load any function (gladLoadGLLoader returns 0) and the first gl call jumps through a null pointer: crash." },
  { group: "init", code: "gladLoadGLLoader(glfwGetProcAddress);", key: "glad", effect: "crash", en: "Every OpenGL function pointer is still null. The first call, glViewport, crashes the program." },
  { group: "init", code: "glViewport(0, 0, 800, 600);", key: "viewport", effect: "fine", en: "No visible change: the viewport starts out as the window's initial size. It goes wrong only after a resize, or on a high-DPI screen where the framebuffer is larger than 800 × 600." },
  { group: "setup", code: "glCompileShader(vs); glCompileShader(fs);", key: "compile", effect: "clear", en: "The shaders are never compiled, so glLinkProgram fails. glUseProgram then rejects the program (GL_INVALID_OPERATION) and the draw call draws nothing: only the clear colour." },
  { group: "setup", code: "glLinkProgram(program);", key: "link", effect: "clear", en: "An unlinked program cannot be used: glUseProgram raises GL_INVALID_OPERATION and nothing is drawn." },
  { group: "setup", code: "glBindVertexArray(vao);   // setup", key: "vaoSetup", effect: "clear", en: "No VAO is bound while the attributes are described: in a Core context glVertexAttribPointer and glEnableVertexAttribArray fail with GL_INVALID_OPERATION, and the VAO stays empty." },
  { group: "setup", code: "glBindBuffer(GL_ARRAY_BUFFER, vbo);", key: "bindVbo", effect: "clear", en: "No buffer is bound: glBufferData fails (GL_INVALID_OPERATION) and the attribute records buffer 0, so the draw call has nothing to read and fails too." },
  { group: "setup", code: "glBufferData(GL_ARRAY_BUFFER, …);", key: "data", effect: "clear", en: "The buffer exists but has no storage. Reading 3 vertices from a 0-byte buffer is out of range, which is undefined; in practice nothing is drawn." },
  { group: "setup", code: "glVertexAttribPointer(0, 3, GL_FLOAT, …);", key: "pointer", effect: "clear", en: "Attribute 0 is enabled but has no buffer or format recorded, so the draw call fails with GL_INVALID_OPERATION." },
  { group: "setup", code: "glEnableVertexAttribArray(0);", key: "enable", effect: "clear", en: "Attribute 0 stays disabled, so every vertex receives the constant (0, 0, 0, 1): all three land on the same point and the triangle has no area. No error at all, just nothing on screen." },
  { group: "loop", code: "glClearColor(0.06f, 0.07f, 0.1f, 1.0f);", key: "clearColor", effect: "black", en: "The clear colour keeps its default, black. The triangle still draws." },
  { group: "loop", code: "glClear(GL_COLOR_BUFFER_BIT);", key: "clear", effect: "noise", en: "The back buffer is never cleared, so each frame is drawn over whatever the buffer held: often garbage, or older frames. The triangle appears on top of it." },
  { group: "loop", code: "glUseProgram(program);", key: "use", effect: "clear", en: "No program is in use, so glDrawArrays fails with GL_INVALID_OPERATION: only the clear colour." },
  { group: "loop", code: "glBindVertexArray(vao);   // draw", key: "vaoDraw", effect: "clear", en: "The setup ended with glBindVertexArray(0), so at draw time no VAO is bound and glDrawArrays fails with GL_INVALID_OPERATION." },
  { group: "loop", code: "glDrawArrays(GL_TRIANGLES, 0, 3);", key: "draw", effect: "clear", en: "Nothing asks for the triangle to be drawn: only the clear colour." },
  { group: "loop", code: "glfwSwapBuffers(window);", key: "swap", effect: "blank", en: "Everything is drawn into the back buffer, which is never shown. The window keeps its initial contents, usually white or black." },
  { group: "loop", code: "glfwPollEvents();", key: "poll", effect: "frozen", en: "Events are never processed: the picture appears, but the operating system soon marks the window as not responding, and the close button does nothing." },
];

const W = 300, H = 230, WX = 10, WY = 10, WW = 280, WH = 200;

export function TriangleDebugFigure({ t }: { t?: TrackTranslations }) {
  const [off, setOff] = useState<Set<string>>(new Set());
  const toggle = (k: string) => setOff(s => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  const missing = CALLS.filter(c => off.has(c.key));
  const fatal = missing.find(c => c.effect === "crash" || c.effect === "nowindow" || c.effect === "blank");
  const has = (e: Effect) => missing.some(c => c.effect === e);
  const triangle = !fatal && !has("clear");
  const bg = has("black") ? "#000000" : "#10121a";
  const status = !missing.length ? "ok" : fatal ? fatal.effect : triangle ? (has("frozen") ? "frozen" : "partial") : "clear";
  const statusText: Record<string, [string, string, string]> = {
    ok: ["figGlDbg_ok", "Hello, triangle.", C.green],
    crash: ["figGlDbg_crash", "The program crashes.", C.red],
    nowindow: ["figGlDbg_nowindow", "No window is created.", C.red],
    blank: ["figGlDbg_blank", "The window never shows what was drawn.", C.red],
    clear: ["figGlDbg_nothing", "Nothing is drawn: the classic empty screen.", C.red],
    frozen: ["figGlDbg_frozen", "The picture is there, but the window is not responding.", C.amber],
    partial: ["figGlDbg_partial", "The triangle still appears, but something is off.", C.amber],
  };
  const [sk, sen, scol] = statusText[status];

  return (
    <Figure
      title={tx(t, "figGlDbg_title", "Hello Triangle, one call at a time")}
      head={<Btn onClick={() => setOff(new Set())}>{tx(t, "figGlDbg_reset", "restore all")}</Btn>}
      controls={<>
        <p className="text-[13px] font-semibold" style={{ color: scol }}>{tx(t, sk, sen)}</p>
        {missing.length > 0 && (
          <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-[var(--text-main)]">
            {missing.map(c => <li key={c.key}><code className="text-[11px] text-[var(--primary)]">{c.code}</code> — {tx(t, `figGlDbg_${c.key}`, c.en)}</li>)}
          </ul>
        )}
      </>}
      note={tx(t, "figGlDbg_note", "Untick calls to remove them from the program. Most mistakes produce no crash and no message, only an empty window: the call fails with a GL error that nobody reads. That is why the Debugging chapter's debug callback is worth setting up on day one. Two calls can go missing with no visible effect, which is exactly why they are easy to forget.")}
    >
      <div className="grid md:grid-cols-[1fr_auto] gap-2 p-3 items-start">
        <div className="font-mono text-[11.5px] leading-relaxed">
          {(["init", "setup", "loop"] as const).map(g => (
            <div key={g} className="mb-2">
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-0.5">
                {g === "init" ? tx(t, "figGlDbg_gInit", "window and context") : g === "setup" ? tx(t, "figGlDbg_gSetup", "setup, once") : tx(t, "figGlDbg_gLoop", "every frame")}
              </p>
              {CALLS.filter(c => c.group === g).map(c => (
                <label key={c.key} className="flex items-center gap-2 cursor-pointer px-1 rounded hover:bg-[var(--primary-low)]">
                  <input type="checkbox" checked={!off.has(c.key)} onChange={() => toggle(c.key)} className="accent-[var(--primary)]" />
                  <span style={{ color: off.has(c.key) ? "var(--text-muted)" : "var(--text-main)", textDecoration: off.has(c.key) ? "line-through" : undefined }}>{c.code}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full md:w-[300px] h-auto" role="img">
          {status === "nowindow"
            ? <T x={W / 2} y={H / 2} size={10} anchor="middle" color={C.red}>{tx(t, "figGlDbg_noWin", "(no window)")}</T>
            : <>
              <rect x={WX} y={WY} width={WW} height={WH + 18} rx={6} fill="#2a2d37" />
              <T x={WX + 10} y={WY + 13} size={8.5} color="#e5e7eb">Hello Triangle{status === "frozen" ? tx(t, "figGlDbg_notResp", " (Not Responding)") : ""}</T>
              <rect x={WX} y={WY + 18} width={WW} height={WH} fill={status === "blank" ? "#f4f4f5" : status === "crash" ? "#10121a" : bg} />
              {has("noise") && !fatal && Array.from({ length: 140 }, (_, i) => (
                <rect key={i} x={WX + ((i * 73) % WW)} y={WY + 18 + ((i * 37) % WH)} width={6 + (i % 5) * 3} height={3} fill={["#7c3aed", "#0ea5e9", "#f59e0b", "#22c55e"][i % 4]} opacity={0.5} />
              ))}
              {triangle && <polygon points={`${WX + WW * 0.25},${WY + 18 + WH * 0.75} ${WX + WW * 0.75},${WY + 18 + WH * 0.75} ${WX + WW * 0.5},${WY + 18 + WH * 0.25}`} fill="#3882ff" />}
              {status === "crash" && <T x={WX + WW / 2} y={WY + 18 + WH / 2} size={10} anchor="middle" color={C.red} bold>{tx(t, "figGlDbg_segv", "Segmentation fault")}</T>}
              {status === "frozen" && <rect x={WX} y={WY + 18} width={WW} height={WH} fill="#ffffff" opacity={0.35} />}
            </>}
        </svg>
      </div>
    </Figure>
  );
}
