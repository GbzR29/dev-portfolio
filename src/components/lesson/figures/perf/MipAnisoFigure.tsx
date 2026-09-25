"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, type Vec3 } from "../../kit/gl/gl";
import { GLView, type Look } from "../../kit/gl/GLView";
import { pickTexture, loadOption } from "../../glsl/textures";

// ── What this figure shows ────────────────────────────────────────────────────
// A long textured floor seen at a grazing angle: the hardest case for texture
// filtering, because far away one pixel covers many texels, and more of them
// along the view direction than across it.
//   nearest / bilinear without mips — shimmering, moiré: undersampling
//   trilinear — mips remove the aliasing, but the footprint is assumed square,
//               so the distance turns to mush
//   anisotropic — several samples along the long axis of the footprint
// "colour the mips" replaces the texture with one where every mip level has
// its own colour, so you can see which level the hardware picks where.

const VS = `#version 300 es
layout(location = 0) in vec2 aPos;
uniform mat4 uView, uProjection;
uniform float uTiling;
out vec2 vUV;
void main() { vUV = aPos * uTiling; gl_Position = uProjection * uView * vec4(aPos.x * 60.0, 0.0, aPos.y * 60.0, 1.0); }`;
const FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uTex;
uniform float uBias;
out vec4 FragColor;
void main() { FragColor = vec4(texture(uTex, vUV, uBias).rgb, 1.0); }`;

const MODES = ["nearest, no mips", "bilinear, no mips", "trilinear", "anisotropic ×4", "anisotropic ×16"] as const;
const TEX_ID = pickTexture("mat:squareceramic-glossytiletexture-aqua-blue:albedo", "mat:squarestackedpavertexture-grey:albedo", "checker");

/** A 256² texture whose every mip level is filled by hand with its own colour (plus a grid). */
function colouredMips(gl: WebGL2RenderingContext) {
  const cols = [[230, 60, 60], [240, 150, 40], [230, 220, 60], [80, 200, 90], [60, 190, 220], [70, 110, 240], [160, 80, 230], [230, 90, 180], [255, 255, 255]];
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  for (let lvl = 0, sz = 256; sz >= 1; lvl++, sz >>= 1) {
    const d = new Uint8Array(sz * sz * 4), c = cols[Math.min(lvl, cols.length - 1)];
    for (let y = 0; y < sz; y++) for (let x = 0; x < sz; x++) {
      const line = sz >= 8 && (x % (sz / 4) === 0 || y % (sz / 4) === 0);
      d.set(line ? [30, 30, 30, 255] : [c[0], c[1], c[2], 255], (y * sz + x) * 4);
    }
    gl.texImage2D(gl.TEXTURE_2D, lvl, gl.RGBA8, sz, sz, 0, gl.RGBA, gl.UNSIGNED_BYTE, d);
  }
  return tex;
}

type Res = { prog: WebGLProgram; vao: WebGLVertexArrayObject; tex: WebGLTexture | null; mips: WebGLTexture; aniso: EXT_texture_filter_anisotropic | null; maxAniso: number };

export function MipAnisoFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0.25, pitch: -0.12, fov: 0.9 });
  const [mode, setMode] = useState(2);
  const [colour, setColour] = useState(false);
  const [tiling, setTiling] = useState(40);
  const [bias, setBias] = useState(0);
  const [maxAniso, setMaxAniso] = useState(0);

  const init = async (gl: WebGL2RenderingContext): Promise<Res> => {
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -1, 0.5, -1, 0.5, 0.3, -0.5, -1, 0.5, 0.3, -0.5, 0.3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    const m = aniso ? gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 0;
    setMaxAniso(m);
    let tex: WebGLTexture | null = null;
    try { tex = await loadOption(gl, TEX_ID); } catch { tex = null; }
    return { prog: compileProgram(gl, VS, FS), vao, tex, mips: colouredMips(gl), aniso, maxAniso: m };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    const tex = colour ? r.mips : r.tex ?? r.mips;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // The filtering mode is texture state: set it before drawing
    const minF = [gl.NEAREST, gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR, gl.LINEAR_MIPMAP_LINEAR, gl.LINEAR_MIPMAP_LINEAR][mode];
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minF);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mode === 0 ? gl.NEAREST : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    if (r.aniso) gl.texParameterf(gl.TEXTURE_2D, r.aniso.TEXTURE_MAX_ANISOTROPY_EXT, mode === 3 ? Math.min(4, r.maxAniso) : mode === 4 ? Math.min(16, r.maxAniso) : 1);

    const f = forwardFrom(look.yaw, look.pitch);
    const cam: Vec3 = [0, 1.2, 12];
    const V = mat4.lookAt(cam, [cam[0] + f[0], cam[1] + f[1], cam[2] + f[2]], [0, 1, 0]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0.55, 0.65, 0.78, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(r.prog);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.prog, "uView"), false, V);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.prog, "uProjection"), false, mat4.perspective(look.fov, size.aspect, 0.1, 200));
    gl.uniform1f(gl.getUniformLocation(r.prog, "uTiling"), tiling);
    gl.uniform1f(gl.getUniformLocation(r.prog, "uBias"), bias);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(gl.getUniformLocation(r.prog, "uTex"), 0);
    gl.bindVertexArray(r.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const notes = [
    tx(t, "figMip_nearestNote", "One texel per pixel, the one nearest to the pixel centre. Close up it looks blocky; far away, where a pixel covers dozens of texels, it picks an essentially random one, so the pattern turns to noise and moiré that crawls as you move the view."),
    tx(t, "figMip_bilinearNote", "Bilinear blends the four nearest texels, which smooths magnification but does nothing for minification. Four texels out of the dozens a far pixel covers is still a random sample. The distance still shimmers."),
    tx(t, "figMip_trilinearNote", "Mipmaps store the texture pre-filtered at 1/2, 1/4, 1/8… resolution. The hardware picks the level whose texels are about one pixel wide, and blends the two nearest levels (trilinear). The aliasing is gone, but the level is chosen for the longest side of the pixel's footprint. On a grazing floor that side runs along the view, so the texture blurs far more than needed across it."),
    tx(t, "figMip_aniso4Note", "Anisotropic filtering takes several trilinear samples along the long axis of the footprint and a finer mip level for the short axis. Detail comes back in the distance. With the mip colours on, each level's band is pushed much further away."),
    tx(t, "figMip_aniso16Note", "×16 recovers almost all the detail at grazing angles for a modest cost on modern GPUs, which is why games set it by default. The extension reports the maximum your GPU allows."),
  ];

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figMip_title", "Texture Filtering at a Grazing Angle")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figMip_hint", "drag to look around")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={look} onLook={l => setLook({ ...l, pitch: Math.max(-0.7, Math.min(0.05, l.pitch)) })} fovRange={[0.3, 1.4]}
          frame={[look, mode, colour, tiling, bias]} aspect={16 / 9} />
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          {MODES.map((m, i) => <button key={m} className={btn(mode === i)} onClick={() => setMode(i)} disabled={i >= 3 && !maxAniso}>{m}</button>)}
          <label className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)] ml-3">
            <input type="checkbox" checked={colour} onChange={e => setColour(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figMip_colour", "colour the mip levels")}
          </label>
        </div>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {([["tiling", tiling, setTiling, 4, 120, 1], ["LOD bias", bias, setBias, -3, 3, 0.1]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-16">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{notes[mode]} {maxAniso ? `(max anisotropy here: ×${maxAniso})` : ""}</p>
      </div>
    </figure>
  );
}
