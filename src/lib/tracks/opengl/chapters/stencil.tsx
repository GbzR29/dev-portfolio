"use client";

// "Stencil Testing" (Advanced OpenGL): the stencil buffer, its test and ops, object outlines, and the other classic uses.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation, Tex } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "./lighting-advanced";
import { StencilOpsFigure } from "@/components/lesson/figures/advgl/StencilOpsFigure";
import { StencilOutlineFigure } from "@/components/lesson/figures/advgl/StencilOutlineFigure";

const r = String.raw;

export function StencilContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglSten_intro",
          "The depth buffer answers one fixed question per pixel: is this fragment closer than what is already there? The stencil buffer is a second per-pixel buffer, usually 8 bits, whose meaning is entirely up to you. You write small integers into it while drawing some objects, and later draws are allowed or rejected based on those values. Outlines, mirrors, portals, decals, shadow volumes and deferred light volumes are all built on it.")}
      </Lead>

      <H2>{tx(t, "oglSten_whereTitle", "Where the test sits")}</H2>
      <p>
        {tx(t, "oglSten_whereBody",
          "After the fragment shader, every fragment goes through the per-fragment tests in a fixed order: scissor, then stencil, then depth, then blending. The stencil and depth values live side by side, packed into one 32-bit word per pixel as GL_DEPTH24_STENCIL8. That is why the two tests are configured together, and why you attach them together to a framebuffer.")}
      </p>
      <CodeBlock lang="cpp" filename="stencil_setup.cpp" t={t}>{`// Default framebuffer: ask for the bits before creating the window
glfwWindowHint(GLFW_STENCIL_BITS, 8);

// Offscreen framebuffer: one packed depth + stencil attachment
glRenderbufferStorage(GL_RENDERBUFFER, GL_DEPTH24_STENCIL8, width, height);
glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_DEPTH_STENCIL_ATTACHMENT, GL_RENDERBUFFER, rbo);

glEnable(GL_STENCIL_TEST);
glStencilMask(0xFF);                       // needed for the clear below to reach the stencil
glClearStencil(0);
glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT | GL_STENCIL_BUFFER_BIT);`}</CodeBlock>

      <H2>{tx(t, "oglSten_testTitle", "The test: one comparison, three outcomes")}</H2>
      <p>
        {tx(t, "oglSten_testBody",
          "glStencilFunc sets a comparison between a reference value you choose and the value already in the buffer. Both sides are ANDed with a read mask first, so you can test individual bits:")}
      </p>
      <Equation label={tx(t, "oglSten_funcLabel", "glStencilFunc(func, ref, mask)")}
        where={[
          [r`\text{ref}`, tx(t, "oglSten_wRef", "the reference value, set per draw call")],
          [r`s`, tx(t, "oglSten_wS", "the value currently stored in the stencil buffer at this pixel")],
          [r`\text{mask}`, tx(t, "oglSten_wMask", "read mask — 0xFF compares all 8 bits; 0x01 only the lowest")],
          [r`\text{OP}`, tx(t, "oglSten_wOp", "NEVER, LESS, LEQUAL, GREATER, GEQUAL, EQUAL, NOTEQUAL or ALWAYS")],
        ]}
        note={tx(t, "oglSten_funcNote", "Note the order: the reference is on the left. GL_LESS passes when ref < stored, not the other way round, which trips everyone up at least once.")}>
        {r`\text{pass} \iff (\text{ref} \;\&\; \text{mask}) \;\;\text{OP}\;\; (s \;\&\; \text{mask})`}
      </Equation>
      <p>
        {tx(t, "oglSten_opsBody",
          "glStencilOp says what to write back in each of the three possible outcomes. A fragment can fail the stencil test, pass stencil but fail depth, or pass both:")}
      </p>
      <Equation label={tx(t, "oglSten_opLabel", "glStencilOp(sfail, dpfail, dppass)")}
        notes={[
          tx(t, "oglSten_opN1", "sfail: the stencil test failed. The fragment is discarded, but the stencil can still be updated."),
          tx(t, "oglSten_opN2", "dpfail: stencil passed, depth failed. Shadow volumes (z-fail) count exactly these."),
          tx(t, "oglSten_opN3", "dppass: both passed. The fragment is written; most recipes use this slot."),
        ]}>
        {r`s' = \begin{cases} \text{sfail}(s) & \text{stencil test fails} \\ \text{dpfail}(s) & \text{stencil passes, depth fails} \\ \text{dppass}(s) & \text{both pass} \end{cases} \qquad s_{\text{stored}} = (s' \;\&\; w) \;|\; (s \;\&\; \lnot w)`}
      </Equation>
      <p>
        {tx(t, "oglSten_writeMask", "The last part is the write mask ")}
        <Tex>{r`w`}</Tex>
        {tx(t, "oglSten_writeMask2", " from glStencilMask: only the bits set in it are changed. glStencilMask(0x00) freezes the buffer, so you can test against it without modifying it.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglSten_thOp", "Op"), tx(t, "oglSten_thWrites", "Writes"), tx(t, "oglSten_thUse", "Typical use")]}
        rows={[
          ["GL_KEEP", "s", tx(t, "oglSten_uKeep", "leave it alone (the default for all three)")],
          ["GL_ZERO", "0", tx(t, "oglSten_uZero", "clear a region while drawing")],
          ["GL_REPLACE", "ref", tx(t, "oglSten_uReplace", "mark pixels covered by an object")],
          ["GL_INCR / GL_DECR", "s ± 1, clamped to [0, 255]", tx(t, "oglSten_uIncr", "counting: overdraw, nested portals")],
          ["GL_INCR_WRAP / GL_DECR_WRAP", "s ± 1, wraps 255 ↔ 0", tx(t, "oglSten_uWrap", "shadow volumes, where +1 and −1 must cancel exactly")],
          ["GL_INVERT", "~s", tx(t, "oglSten_uInvert", "even/odd fills (concave polygons in one pass)")],
        ]}
      />
      <StencilOpsFigure t={t} />

      <H2>{tx(t, "oglSten_outlineTitle", "Recipe: object outlines")}</H2>
      <p>
        {tx(t, "oglSten_outlineBody",
          "The best-known use, and the one LearnOpenGL teaches. Mark the pixels the selected object covers, then draw a slightly larger copy of it in a flat colour wherever the mark is absent. Only a ring around the silhouette survives.")}
      </p>
      <CodeBlock lang="cpp" filename="outline.cpp" t={t}>{`glEnable(GL_DEPTH_TEST);
glEnable(GL_STENCIL_TEST);
glStencilOp(GL_KEEP, GL_KEEP, GL_REPLACE);     // on dppass, write ref

// 1. The rest of the scene: never touches the stencil
glStencilMask(0x00);
drawScene();

// 2. Selected objects, normally: stencil = 1 wherever they are visible
glStencilFunc(GL_ALWAYS, 1, 0xFF);
glStencilMask(0xFF);
drawSelected(litShader);

// 3. Enlarged copy, flat colour, only where stencil != 1
glStencilFunc(GL_NOTEQUAL, 1, 0xFF);
glStencilMask(0x00);
glDisable(GL_DEPTH_TEST);                      // outline visible even in front of walls
drawSelected(outlineShader);                   // enlarged in its vertex shader

// 4. Restore state, or the next frame's clear will not reach the stencil
glStencilMask(0xFF);
glStencilFunc(GL_ALWAYS, 0, 0xFF);
glEnable(GL_DEPTH_TEST);`}</CodeBlock>
      <p>
        {tx(t, "oglSten_enlargeBody",
          "How you enlarge the copy matters more than the stencil part. There are three common ways, and each fails differently:")}
      </p>
      <Equation label={tx(t, "oglSten_enlargeLabel", "Three ways to grow the silhouette")}
        where={[
          [r`k`, tx(t, "oglSten_wK", "scale factor, e.g. 1.05")],
          [r`\vN`, tx(t, "oglSten_wN", "vertex normal in world space")],
          [r`d`, tx(t, "oglSten_wD", "width in world units")],
          [r`\hat n_{clip}`, tx(t, "oglSten_wNc", "the normal projected to clip space, xy only, normalised")],
          [r`p_{px},\ (W, H)`, tx(t, "oglSten_wPx", "width in pixels, viewport size")],
        ]}
        note={tx(t, "oglSten_enlargeNote", "Multiplying by w in the clip-space version cancels the upcoming perspective divide, so the offset is exactly p pixels at any distance.")}>
        {r`\begin{aligned}
&\text{scale:} && p' = c + k\,(p - c) \\
&\text{normal, world:} && p' = p + d\,\vN \\
&\text{normal, screen:} && \text{clip}'_{xy} = \text{clip}_{xy} + \hat n_{clip}\,\frac{2\,p_{px}}{(W, H)}\,\text{clip}_w
\end{aligned}`}
      </Equation>
      <CodeBlock lang="glsl" filename="outline.vert" t={t}>{`uniform float outlinePx;        // e.g. 3.0
uniform vec2  viewport;         // framebuffer size in pixels

void main() {
    vec3 N    = normalize(mat3(model) * aSmoothNormal);   // smoothed, see below
    vec4 clip = projection * view * model * vec4(aPos, 1.0);
    vec2 n    = normalize((projection * view * vec4(N, 0.0)).xy);
    clip.xy  += n * outlinePx * 2.0 / viewport * clip.w;
    gl_Position = clip;
}`}</CodeBlock>
      <StencilOutlineFigure t={t} />
      <Callout type="tip" t={t}>
        {tx(t, "oglSten_smoothTip",
          "Hard-edged meshes like a cube have three normals at every corner, one per face. Extruding along them opens gaps at the corners. Games bake an averaged normal into a spare vertex attribute (a second normal, or the tangent slot) used only by the outline pass.")}
      </Callout>

      <H2>{tx(t, "oglSten_usesTitle", "Other classic uses")}</H2>
      <LessonTable
        headers={[tx(t, "oglSten_thTech", "Technique"), tx(t, "oglSten_thHow", "Stencil state"), tx(t, "oglSten_thIdea", "Idea")]}
        rows={[
          [tx(t, "oglSten_t1", "Mirrors & portals"), "ALWAYS/REPLACE, then EQUAL", tx(t, "oglSten_t1i", "draw the mirror's surface into the stencil only, then draw the reflected scene where stencil = 1. Nested portals use INCR and one ref per depth level.")],
          [tx(t, "oglSten_t2", "Decals on one surface"), "ref = surface id", tx(t, "oglSten_t2i", "floors write 1, walls 2; a floor decal is drawn with EQUAL 1 so it never spills onto a wall")],
          [tx(t, "oglSten_t3", "Shadow volumes"), "INCR_WRAP / DECR_WRAP", tx(t, "oglSten_t3i", "extrude silhouettes away from the light; count front faces +1 and back faces −1; non-zero = in shadow (Doom 3)")],
          [tx(t, "oglSten_t4", "Deferred light volumes"), "two-sided ops", tx(t, "oglSten_t4i", "mark only the pixels inside a light's sphere so the lighting shader runs nowhere else")],
          [tx(t, "oglSten_t5", "UI clipping masks"), "INCR per nested level", tx(t, "oglSten_t5i", "scroll views with rounded corners clip their children to any shape")],
          [tx(t, "oglSten_t6", "Overdraw debugging"), "ALWAYS/INCR", tx(t, "oglSten_t6i", "count writes per pixel, then colour the screen by count: a heatmap of wasted fill rate")],
        ]}
      />
      <Equation label={tx(t, "oglSten_volLabel", "Shadow volumes, z-fail (Carmack's reverse)")}
        where={[
          [r`n_{back},\ n_{front}`, tx(t, "oglSten_wNb", "back and front faces of shadow volumes whose depth test fails at this pixel")],
        ]}
        note={tx(t, "oglSten_volNote", "glStencilOpSeparate sets different ops for front and back faces, so both are counted in one pass with culling off. The z-fail form stays correct when the camera is inside a volume, which the simpler z-pass form does not.")}
        glsl="glStencilOpSeparate(GL_BACK, GL_KEEP, GL_INCR_WRAP, GL_KEEP);  glStencilOpSeparate(GL_FRONT, GL_KEEP, GL_DECR_WRAP, GL_KEEP);">
        {r`s = n_{back} - n_{front} \qquad \text{in shadow} \iff s \neq 0`}
      </Equation>
      <Callout type="info" t={t}>
        {tx(t, "oglSten_postNote",
          "Outlines can also be done as post-processing: render selected objects' IDs or depth to a texture, then run an edge filter (Sobel) over it, or a jump-flood pass for thick, smooth outlines of any width. That avoids smoothed normals entirely, at the cost of a fullscreen pass. Engines like Unity's URP and Unreal use variants of both.")}
      </Callout>
      <Callout type="warn" t={t}>
        {tx(t, "oglSten_pitfalls",
          "The classic bugs: glClear(GL_STENCIL_BUFFER_BIT) respects glStencilMask, so with the mask left at 0x00 the stencil is never cleared and last frame's outline leaks into this one. Stencil writes happen even with glColorMask off, which is useful, but also means an invisible draw can still corrupt the mask. A framebuffer with only GL_DEPTH_COMPONENT24 has no stencil at all: every test silently passes. And the stencil test runs before depth, so a fragment rejected by the stencil never updates the depth buffer.")}
      </Callout>

      <KeyIdeas t={t} id="oglSten" items={[
        "The stencil buffer is an 8-bit per-pixel scratchpad, packed with depth as D24S8; you decide what its values mean.",
        "glStencilFunc: pass if (ref & mask) OP (stored & mask), with ref on the left.",
        "glStencilOp(sfail, dpfail, dppass) chooses what to write for each outcome; glStencilMask chooses which bits may change.",
        "Outline = mark the object (ALWAYS/REPLACE), then draw an enlarged copy with NOTEQUAL; grow it in clip space for constant pixel width.",
        "Same machinery: mirrors, portals, decal masks, shadow volumes, light volumes, overdraw heatmaps.",
      ]} />
    </Article>
  );
}
