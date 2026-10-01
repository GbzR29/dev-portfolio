"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, Figure, Readout, Row, Slider, Sliders, C, useVisible } from "@/components/lesson/kit/figure";
import { GLView, useAnimationTime, type Look } from "@/components/lesson/kit/gl/GLView";

// ── What this figure shows ────────────────────────────────────────────────────
// The chapter's triangle, drawn live with WebGL 2 from a VBO + VAO laid out
// exactly as in the VAO chapter (location 0 = position, 1 = colour). Both
// shaders are editable and recompile as you type; compile and link errors
// appear with the driver's own message. Two uniforms are always available:
// uTime (seconds) and uTint (a colour from the slider). WebGL 2 speaks
// GLSL ES 3.00, so the sources start with "#version 300 es" and a precision
// line instead of "#version 460 core"; everything else is the same language.
// The fragment presets use "precision highp float": the vertex shader's
// default is already highp, and a uniform declared in both shaders (uTime)
// must have the same precision in both, or the program fails to link.

// `why` marks the presets that fail on purpose and says how to fix them.
type Preset = { key: string; en: string; vs: string; fs: string; why?: string };

const VS_COLOUR = `#version 300 es
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aColor;

out vec3 vColor;          // interpolated for the fragment shader

void main() {
    gl_Position = vec4(aPos, 1.0);
    vColor = aColor;
}`;
const FS_COLOUR = `#version 300 es
precision highp float;

in vec3 vColor;           // same name and type as the vertex shader's out
out vec4 FragColor;

void main() {
    FragColor = vec4(vColor, 1.0);
}`;
const PRESETS: Preset[] = [
  { key: "pColour", en: "colour per vertex", vs: VS_COLOUR, fs: FS_COLOUR },
  {
    key: "pUniform", en: "uniform tint", vs: VS_COLOUR, fs: `#version 300 es
precision highp float;

in vec3 vColor;
uniform vec3 uTint;       // same for every fragment, set from C++ (the slider)
out vec4 FragColor;

void main() {
    FragColor = vec4(uTint, 1.0);
}`,
  },
  {
    key: "pTime", en: "animate with uTime", vs: `#version 300 es
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aColor;
uniform float uTime;      // seconds since the figure started
out vec3 vColor;

void main() {
    float s = 0.75 + 0.25 * sin(uTime * 2.0);         // scale between 0.5 and 1
    gl_Position = vec4(aPos.xy * s, aPos.z, 1.0);
    vColor = aColor;
}`, fs: `#version 300 es
precision highp float;

in vec3 vColor;
uniform float uTime;
out vec4 FragColor;

void main() {
    float pulse = 0.5 + 0.5 * sin(uTime * 3.0);        // 0..1
    FragColor = vec4(mix(vColor, vec3(1.0), pulse * 0.5), 1.0);
}`,
  },
  {
    key: "pFlip", en: "flip in the vertex shader", vs: `#version 300 es
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aColor;
out vec3 vColor;

void main() {
    // Negate y: the triangle turns upside down. The buffer did not change.
    gl_Position = vec4(aPos.x, -aPos.y, aPos.z, 1.0);
    vColor = aColor.bgr;                               // swizzle: swap red and blue
}`, fs: FS_COLOUR,
  },
  {
    key: "pCompile", en: "compile error", vs: VS_COLOUR, fs: `#version 300 es
precision highp float;

in vec3 vColor;
out vec4 FragColor;

void main() {
    FragColor = vec4(vColor, 1.0)     // missing semicolon
}`,
    why: "This preset fails on purpose: the FragColor line has no semicolon at the end. The compiler stops and the log names the line. Add the ; and the triangle comes back.",
  },
  {
    key: "pLink", en: "link error", vs: VS_COLOUR, fs: `#version 300 es
precision highp float;

in vec3 vColour;          // British spelling: no matching "out" in the vertex shader
out vec4 FragColor;

void main() {
    FragColor = vec4(vColour, 1.0);
}`,
    why: "This preset fails on purpose: each shader compiles alone, but the fragment shader reads \"vColour\" and the vertex shader writes \"vColor\". Linking connects outs to ins by name, so it finds no match. Rename both uses to vColor and it links.",
  },
];

const VERTS = new Float32Array([
  -0.6, -0.55, 0, 1, 0.27, 0.27,
  0.65, -0.45, 0, 0.13, 0.77, 0.37,
  0.0, 0.65, 0, 0.23, 0.51, 0.96,
]);

type Res = { vao: WebGLVertexArrayObject; prog: WebGLProgram | null; src: string; err: string | null };
type Status = { ok: boolean; stage: "vertex" | "fragment" | "link" | null; log: string };

function compile(gl: WebGL2RenderingContext, vs: string, fs: string): { prog: WebGLProgram | null; status: Status } {
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const v = shader(gl.VERTEX_SHADER, vs), f = shader(gl.FRAGMENT_SHADER, fs);
  const fail = (stage: Status["stage"], log: string) => {
    gl.deleteShader(v); gl.deleteShader(f);
    return { prog: null, status: { ok: false, stage, log: log.trim() } };
  };
  if (!gl.getShaderParameter(v, gl.COMPILE_STATUS)) return fail("vertex", gl.getShaderInfoLog(v) ?? "");
  if (!gl.getShaderParameter(f, gl.COMPILE_STATUS)) return fail("fragment", gl.getShaderInfoLog(f) ?? "");
  const p = gl.createProgram()!;
  gl.attachShader(p, v); gl.attachShader(p, f);
  gl.linkProgram(p);
  gl.deleteShader(v); gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(p) ?? "";
    gl.deleteProgram(p);
    return { prog: null, status: { ok: false, stage: "link", log: log.trim() } };
  }
  return { prog: p, status: { ok: true, stage: null, log: "" } };
}

const LOOK: Look = { yaw: 0, pitch: 0, fov: 1 };

export function TriangleShaderFigure({ t }: { t?: TrackTranslations }) {
  const [preset, setPreset] = useState(0);
  const [vs, setVs] = useState(PRESETS[0].vs);
  const [fs, setFs] = useState(PRESETS[0].fs);
  const [src, setSrc] = useState({ vs: PRESETS[0].vs, fs: PRESETS[0].fs });   // debounced
  const [hue, setHue] = useState(0.08);
  const [status, setStatus] = useState<Status>({ ok: true, stage: null, log: "" });
  const statusRef = useRef(status); statusRef.current = status;
  const vis = useVisible<HTMLElement>();
  const usesTime = /uTime/.test(src.vs + src.fs);
  const time = useAnimationTime(usesTime && vis.on);

  useEffect(() => {
    const id = setTimeout(() => setSrc({ vs, fs }), 350);
    return () => clearTimeout(id);
  }, [vs, fs]);

  const pick = (i: number) => { setPreset(i); setVs(PRESETS[i].vs); setFs(PRESETS[i].fs); setSrc({ vs: PRESETS[i].vs, fs: PRESETS[i].fs }); };
  const tint = hsl(hue);
  const shown = PRESETS[preset];
  const why = shown.why && vs === shown.vs && fs === shown.fs ? shown.why : null;   // only while the preset is unedited

  const init = (gl: WebGL2RenderingContext): Res => {
    const vao = gl.createVertexArray()!;
    const buf = gl.createBuffer()!;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, VERTS, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
    gl.enableVertexAttribArray(1);
    gl.bindVertexArray(null);
    return { vao, prog: null, src: "", err: null };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number }) => {
    const key = src.vs + "\u0000" + src.fs;
    if (r.src !== key) {
      if (r.prog) gl.deleteProgram(r.prog);
      const { prog, status: st } = compile(gl, src.vs, src.fs);
      r.prog = prog; r.src = key;
      const cur = statusRef.current;
      if (cur.ok !== st.ok || cur.log !== st.log) queueMicrotask(() => setStatus(st));
    }
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0.063, 0.071, 0.102, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!r.prog) return;
    gl.useProgram(r.prog);
    const uT = gl.getUniformLocation(r.prog, "uTime");
    if (uT) gl.uniform1f(uT, time);
    const uC = gl.getUniformLocation(r.prog, "uTint");
    if (uC) gl.uniform3f(uC, tint[0], tint[1], tint[2]);
    gl.bindVertexArray(r.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  };

  const area = "w-full h-56 font-mono text-[11.5px] leading-snug p-3 rounded-lg bg-[var(--code-bg)] border border-[var(--border)] text-[var(--text-main)] resize-y whitespace-pre overflow-auto";
  return (
    <Figure
      title={tx(t, "figGlShader_title", "Edit the shaders, see the triangle")}
      head={<>{PRESETS.map((p, i) => <Btn key={p.key} active={i === preset} onClick={() => pick(i)}>{tx(t, `figGlShader_${p.key}`, p.en)}</Btn>)}</>}
      controls={<>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">vertex shader</span>
            <textarea spellCheck={false} wrap="off" value={vs} onChange={e => setVs(e.target.value)} className={area} />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">fragment shader</span>
            <textarea spellCheck={false} wrap="off" value={fs} onChange={e => setFs(e.target.value)} className={area} />
          </label>
        </div>
        <Sliders>
          <Slider label="uTint" value={hue} min={0} max={1} step={0.01} onChange={setHue}
            fmt={() => "#" + tint.map(c => Math.round(c * 255).toString(16).padStart(2, "0")).join("")} width="w-12" />
        </Sliders>
        <Row>
          <Readout color={status.ok ? C.green : C.red}>
            {status.ok ? tx(t, "figGlShader_ok", "compiled and linked") : status.stage === "link" ? tx(t, "figGlShader_linkErr", "link error") : `${status.stage} shader: ${tx(t, "figGlShader_compileErr", "compile error")}`}
          </Readout>
          {usesTime && <Readout>uTime = {time.toFixed(1)} s</Readout>}
        </Row>
        {!status.ok && <pre className="text-[11px] font-mono whitespace-pre-wrap p-2 rounded bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.3)]" style={{ color: C.red }}>{status.log || "(no log)"}</pre>}
        {!status.ok && why && <p className="text-[12px] text-[var(--text-muted)]">{tx(t, `figGlShader_${shown.key}Why`, why)}</p>}
      </>}
      note={tx(t, "figGlShader_note", "This is real GLSL running on your GPU through WebGL 2, which uses GLSL ES 3.00: \"#version 300 es\" instead of \"#version 460 core\", and a precision line in the fragment shader. Everything else is the language of this chapter. Try the presets, then edit: change the output colour, multiply a coordinate, swizzle aColor.gbr. When a shader fails, nothing is drawn and the log names the line, exactly as glGetShaderInfoLog would in your C++ program. The last two presets fail on purpose, so you can see a compile error and a link error. uTime and uTint are uniforms the figure sets every frame, like glUniform calls. The precision line says \"highp\" because the vertex shader is highp by default, and a uniform used in both shaders (like uTime) must have the same precision in both; with \"mediump\" the link fails with \"precisions of uniform differ\". Desktop GLSL (#version 460 core) has no such rule.")}
    >
      <div ref={vis.ref as React.Ref<HTMLDivElement>} className="p-2">
        <GLView<Res> init={init} draw={draw} look={LOOK} frame={[src, hue, usesTime ? time : 0]} aspect={16 / 9} />
      </div>
    </Figure>
  );
}

/** A saturated colour from a hue in 0..1, as linear-ish RGB for the uniform. */
function hsl(h: number): [number, number, number] {
  const k = (n: number) => (n + h * 12) % 12;
  const f = (n: number) => 0.5 - 0.45 * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)];
}
