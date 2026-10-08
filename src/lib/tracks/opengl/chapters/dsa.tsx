"use client";

// OpenGL track — "Bind-to-Edit vs DSA" (explanation pass 2026-10-01): why
// edit-through-a-bind-point breaks (BindTargetFigure), DSA by ID, glCreate*
// vs glGen*, immutable storage and its flags, textures (mip level count,
// glBindTextureUnit), VAOs split into format and binding (VertexBindingFigure),
// edit vs use, a worked trace, choices and mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { BindTargetFigure } from "@/components/lesson/figures/advgl/BindTargetFigure";
import { VertexBindingFigure } from "@/components/lesson/figures/advgl/VertexBindingFigure";

const r = String.raw;

export function DSAContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "ch11_intro",
          "Every chapter so far used bind-to-edit: bind an object, modify it, unbind. OpenGL 4.5 introduced Direct State Access (DSA): modify any object by its ID, without binding it. Both produce identical GPU behaviour; only the CPU-side code differs, and with it a whole class of bugs.")}
      </Lead>

      <Goals t={t} id="ch11" items={[
        "Explain the bugs that binding an object just to edit it causes.",
        "Create and edit buffers, textures and VAOs with DSA, without binding them.",
        "Choose between DSA and the classic style.",
      ]} />

      <H2>{tx(t, "ch11_problemTitle", "The bind-to-edit problem")}</H2>
      <p>
        {tx(t, "ch11_problemBody2",
          "The context has bind points: one GL_ARRAY_BUFFER slot, one GL_TEXTURE_2D slot per texture unit, one current VAO, and so on. An edit function such as glBufferData or glTexParameteri does not take an object. It takes a target, and acts on whatever object is in that slot right now. So the meaning of a line depends on every line that ran before it, including lines in other files and in libraries. Insert one glBindBuffer somewhere earlier and a later glBufferData silently writes into a different buffer, with no error, because the call is still perfectly valid.")}
      </p>
      <CodeBlock lang="cpp" filename="bind_to_edit.cpp" t={t}>{`// Traditional bind-to-edit — what we have used so far
unsigned int VBO;
glGenBuffers(1, &VBO);
glBindBuffer(GL_ARRAY_BUFFER, VBO);  // ← sets global state
glBufferData(GL_ARRAY_BUFFER,        // ← "which buffer?" — whichever is bound
             sizeof(data), data, GL_STATIC_DRAW);

// A month later, someone inserts a glBindBuffer here
// and your glBufferData silently corrupts the wrong buffer.
// This is a real class of bug in large OpenGL codebases.`}</CodeBlock>
      <p>
        {tx(t, "ch11_problemFig",
          "The figure below runs a realistic version: a texture setup interrupted by a helper that creates an icon and leaves it bound. Switch the helper on and off and compare the two columns.")}
      </p>

      <BindTargetFigure t={t} />

      <H2>{tx(t, "ch11_dsaTitle", "DSA: operate by ID, no binding")}</H2>
      <p>
        {tx(t, "ch11_dsaBody2",
          "DSA functions take the object's ID as their first argument, where the old ones took a target. The naming is regular: glBufferData becomes glNamedBufferData, glTexParameteri becomes glTextureParameteri, glFramebufferTexture becomes glNamedFramebufferTexture. Nothing is read from a bind point and nothing is written to one, so a call means the same thing wherever it appears.")}
      </p>
      <CodeBlock lang="cpp" filename="dsa_buffer.cpp" t={t}>{`// DSA — OpenGL 4.5+
unsigned int VBO;
glCreateBuffers(1, &VBO);             // glCreate* instead of glGen*

glNamedBufferStorage(VBO,             // ← object ID, not a target enum
                     sizeof(data), data,
                     GL_DYNAMIC_STORAGE_BIT);  // allow glNamedBufferSubData later
// No binding needed. VBO is modified directly by its ID.

glNamedBufferSubData(VBO, 0, sizeof(firstVertex), &firstVertex);  // update 32 bytes`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "ch11_createVsGen2",
          "glCreate* vs glGen*: glGen* only reserves a name, a number nobody else will get. The object behind it does not exist until the first glBind* creates it, and a DSA call on a name that was never bound fails with GL_INVALID_OPERATION. glCreate* reserves the name and creates the object at once, ready for DSA calls. For textures it also fixes the target: glCreateTextures(GL_TEXTURE_2D, …) makes a 2D texture forever.")}
      </Callout>

      <H3>{tx(t, "ch11_storageTitle", "Immutable storage")}</H3>
      <p>
        {tx(t, "ch11_storageBody",
          "The example used glNamedBufferStorage rather than glNamedBufferData. Storage allocates the buffer once, at a fixed size: it can never be resized or reallocated, only its contents change. In exchange the driver knows the object will not move, and you state up front how it will be used. The last argument is a set of flags. With 0 the contents can only be changed by the GPU (copies, compute writes). GL_DYNAMIC_STORAGE_BIT allows glNamedBufferSubData from the CPU. GL_MAP_WRITE_BIT and GL_MAP_READ_BIT allow mapping the buffer into CPU memory, and GL_MAP_PERSISTENT_BIT keeps it mapped while the GPU uses it. Textures have the same idea: glTextureStorage2D allocates every mip level at once, with a fixed format and size.")}
      </p>

      <H2>{tx(t, "ch11_texTitle", "Textures with DSA")}</H2>
      <CodeBlock lang="cpp" filename="dsa_texture.cpp" t={t}>{`unsigned int tex;
glCreateTextures(GL_TEXTURE_2D, 1, &tex);          // the target is fixed here, at creation

int levels = 1 + (int)std::floor(std::log2(std::max(w, h)));   // 1024×1024 → 11
glTextureStorage2D(tex, levels, GL_RGBA8, w, h);   // allocate every level, once
glTextureSubImage2D(tex, 0, 0, 0, w, h,            // fill level 0 from offset (0,0)
                    GL_RGBA, GL_UNSIGNED_BYTE, pixels);

glTextureParameteri(tex, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
glTextureParameteri(tex, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
glTextureParameteri(tex, GL_TEXTURE_WRAP_S, GL_REPEAT);
glTextureParameteri(tex, GL_TEXTURE_WRAP_T, GL_REPEAT);
glGenerateTextureMipmap(tex);                      // levels 1..10 computed from level 0

// At draw time: one call instead of glActiveTexture + glBindTexture
glBindTextureUnit(3, tex);                         // the sampler uniform holds 3`}</CodeBlock>
      <Equation label={tx(t, "ch11_levelsLabel", "How many mip levels")}
        where={[
          [r`w,\ h`, tx(t, "ch11_wWH", "width and height of level 0, in texels")],
          [r`\log_2`, tx(t, "ch11_wLog", "how many times the size can be halved: each level is half the previous one")],
          [r`\lfloor\cdot\rfloor`, tx(t, "ch11_wFloor", "round down; a 300-texel side halves 8 whole times (300 → 150 → … → 1)")],
          [r`+1`, tx(t, "ch11_wPlus", "level 0 itself, the full-size image")],
        ]}>
        {r`\text{levels} = \lfloor \log_2 \max(w, h) \rfloor + 1`}
      </Equation>
      <p>
        {tx(t, "ch11_levelsBody",
          "For 1024×1024: log₂ 1024 = 10, so 11 levels, from 1024 down to 1×1. For 300×200: log₂ 300 ≈ 8.23, rounded down to 8, so 9 levels. Asking for more levels than that is GL_INVALID_OPERATION. Asking for 1 level is allowed and means no mipmaps, which is right for a framebuffer attachment or a UI texture that is never minified.")}
      </p>

      <H2>{tx(t, "ch11_vaoTitle", "DSA for VAOs")}</H2>
      <p>
        {tx(t, "ch11_vaoBody2",
          "VAO setup shows the biggest change. glVertexAttribPointer did two jobs in one call: it described an attribute's format (3 floats at offset 12) and it captured whichever buffer was bound to GL_ARRAY_BUFFER. The DSA functions, which reuse the vertex-binding model of OpenGL 4.3, split these apart. An attribute has a format and points at a binding point. A binding point holds a buffer, an offset, a stride and a divisor.")}
      </p>
      <CodeBlock lang="cpp" filename="dsa_vao.cpp" t={t}>{`// ── Traditional (what you have been using) ───────────────────────────────────
unsigned int VAO, VBO;
glGenVertexArrays(1, &VAO); glGenBuffers(1, &VBO);
glBindVertexArray(VAO);                                    // bind VAO
  glBindBuffer(GL_ARRAY_BUFFER, VBO);                      // bind VBO inside VAO
  glBufferData(GL_ARRAY_BUFFER, sizeof(verts), verts, GL_STATIC_DRAW);
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, stride, (void*)0);
  glEnableVertexAttribArray(0);
glBindVertexArray(0);


// ── DSA equivalent ────────────────────────────────────────────────────────────
unsigned int dVAO, dVBO, dEBO;
glCreateVertexArrays(1, &dVAO);
glCreateBuffers(1, &dVBO);
glCreateBuffers(1, &dEBO);

// Upload data — no binding
glNamedBufferStorage(dVBO, sizeof(verts),   verts,   0);   // 0: never changed by the CPU
glNamedBufferStorage(dEBO, sizeof(indices), indices, 0);

// Attach buffer to VAO at binding point 0
glVertexArrayVertexBuffer(
    dVAO,           // which VAO
    0,              // binding point index
    dVBO,           // which buffer
    0,              // offset into buffer (bytes)
    stride          // stride between vertices (bytes) — 0 is NOT "tightly packed" here
);
glVertexArrayElementBuffer(dVAO, dEBO);   // the index buffer, also by ID

// Describe attribute 0: 3 floats, not normalized, offset 0 within vertex
glVertexArrayAttribFormat(dVAO, /*attrib*/0, /*size*/3, GL_FLOAT, GL_FALSE, /*relativeOffset*/0);

// Connect attrib 0 to binding point 0
glVertexArrayAttribBinding(dVAO, /*attrib*/0, /*bindingPoint*/0);

// Enable attrib 0
glEnableVertexArrayAttrib(dVAO, 0);

// Render — binding to USE is still needed
glBindVertexArray(dVAO);
glDrawElements(GL_TRIANGLES, indexCount, GL_UNSIGNED_INT, nullptr);`}</CodeBlock>

      <VertexBindingFigure t={t} />

      <p>
        {tx(t, "ch11_splitWhy",
          "Why split them? Because in a real renderer the format changes rarely and the buffer changes constantly. A hundred meshes that share the layout position + normal + UV can share one VAO: drawing each is one glVertexArrayVertexBuffer and one glVertexArrayElementBuffer, with no attribute re-described. With glVertexAttribPointer you either keep a hundred VAOs or repeat every attribute call per mesh.")}
      </p>

      <H2>{tx(t, "ch11_useTitle", "Editing vs using")}</H2>
      <p>
        {tx(t, "ch11_useBody",
          "DSA removes binding to edit, not binding to use. A draw call still reads the current VAO, the current program, the current framebuffer and the textures on each unit, because that is how you tell it what to draw with. The difference is that those binds now happen in one place, right before the draw, instead of being scattered through setup code where they leak.")}
      </p>
      <LessonTable
        headers={[tx(t, "ch11_uH0", "Still bound before drawing"), tx(t, "ch11_uH1", "Call")]}
        rows={[
          [tx(t, "ch11_u1", "vertex layout and buffers"), "glBindVertexArray(vao)"],
          [tx(t, "ch11_u2", "shaders"), "glUseProgram(program)"],
          [tx(t, "ch11_u3", "render target"), "glBindFramebuffer(GL_FRAMEBUFFER, fbo)"],
          [tx(t, "ch11_u4", "textures, per unit"), "glBindTextureUnit(unit, tex)"],
          [tx(t, "ch11_u5", "uniform / storage buffers, per binding point"), "glBindBufferBase(GL_UNIFORM_BUFFER, i, ubo)"],
        ]}
      />
      <CodeBlock lang="cpp" filename="dsa_family.cpp" t={t}>{`// Framebuffers
glCreateFramebuffers(1, &fbo);
glCreateRenderbuffers(1, &rbo);
glNamedRenderbufferStorage(rbo, GL_DEPTH24_STENCIL8, w, h);
glNamedFramebufferTexture(fbo, GL_COLOR_ATTACHMENT0, colorTex, 0);
glNamedFramebufferRenderbuffer(fbo, GL_DEPTH_STENCIL_ATTACHMENT, GL_RENDERBUFFER, rbo);
if (glCheckNamedFramebufferStatus(fbo, GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE) { /* … */ }

// Uniforms without glUseProgram (OpenGL 4.1, the same idea)
glProgramUniform1f(program, glGetUniformLocation(program, "uTime"), time);`}</CodeBlock>

      <H2>{tx(t, "ch11_workedTitle", "Worked example: tracing the helper bug")}</H2>
      <p>
        {tx(t, "ch11_workedIntro",
          "Follow the bind-to-edit column of the figure with the helper on, one line at a time, writing down what the GL_TEXTURE_2D slot of unit 0 holds.")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "ch11_w1", "glBindTexture(GL_TEXTURE_2D, albedo): the slot holds albedo.")}</li>
        <li>{tx(t, "ch11_w2", "glTexStorage2D: albedo gets 11 levels of RGBA8. Level 0 is 1024 × 1024 × 4 bytes = 4 MiB; the whole chain is about 4/3 of that, 5.33 MiB, because each level is a quarter of the one before (1 + 1/4 + 1/16 + … → 4/3). The memory exists but holds no image yet.")}</li>
        <li>{tx(t, "ch11_w3", "loadIcon() creates a 64 × 64 texture and binds it: the slot now holds icon. The caller cannot see this.")}</li>
        <li>{tx(t, "ch11_w4", "glTexSubImage2D(GL_TEXTURE_2D, …, 1024, 1024, …) acts on icon. A 1024 × 1024 region does not fit in 64 × 64, so it fails with GL_INVALID_VALUE and is ignored. Albedo stays empty.")}</li>
        <li>{tx(t, "ch11_w5", "glTexParameteri sets icon's minification filter. Valid, silent, wrong object.")}</li>
        <li>{tx(t, "ch11_w6", "glGenerateMipmap acts on icon, which has one level: nothing to generate.")}</li>
      </ol>
      <p>
        {tx(t, "ch11_workedRead",
          "End result: one error that only debug output would show, an icon with a changed filter, and an albedo whose contents were never written, so it samples black. Note that the bug is in neither file alone: the setup code is correct, the helper is correct, only their order is wrong. In the DSA column the same six lines name albedo each time, and the helper's bind is irrelevant.")}
      </p>

      <H2>{tx(t, "ch11_comparisonTitle", "Side-by-side comparison")}</H2>
      <LessonTable
        headers={[tx(t, "ch11_compHeader0", "Operation"), tx(t, "ch11_compHeader1", "Bind-to-edit"), tx(t, "ch11_compHeader2", "DSA")]}
        rows={[
          [tx(t, "ch11_op1", "Create buffer"),      "glGenBuffers + glBindBuffer",    "glCreateBuffers"],
          [tx(t, "ch11_op2", "Upload data"),         "glBufferData (bound target)",    "glNamedBufferStorage / glNamedBufferData (by ID)"],
          [tx(t, "ch11_op3", "Update partial data"), "glBufferSubData (bound target)", "glNamedBufferSubData (by ID)"],
          [tx(t, "ch11_op4", "Create texture"),      "glGenTextures + glBindTexture",  "glCreateTextures"],
          [tx(t, "ch11_op5", "Upload texture"),      "glTexImage2D (bound target)",    "glTextureStorage2D + glTextureSubImage2D"],
          [tx(t, "ch11_op7", "Texture parameters"),  "glTexParameteri (bound target)", "glTextureParameteri"],
          [tx(t, "ch11_op8", "Bind texture for drawing"), "glActiveTexture + glBindTexture", "glBindTextureUnit"],
          [tx(t, "ch11_op6", "VAO attrib setup"),    "glVertexAttribPointer",          "glVertexArrayAttribFormat + AttribBinding + VertexBuffer"],
          [tx(t, "ch11_op9", "Index buffer"),        "glBindBuffer(GL_ELEMENT_ARRAY_BUFFER) inside the bound VAO", "glVertexArrayElementBuffer"],
          [tx(t, "ch11_op10", "Framebuffer attachment"), "glFramebufferTexture2D (bound FBO)", "glNamedFramebufferTexture"],
        ]}
      />

      <H2>{tx(t, "ch11_whenTitle", "When to use which")}</H2>
      <LessonTable
        headers={[tx(t, "ch11_whenHeader0", "Situation"), tx(t, "ch11_whenHeader1", "Recommended")]}
        rows={[
          [tx(t, "ch11_when1", "Learning OpenGL concepts"),          tx(t, "ch11_whenRec1", "Bind-to-edit — most tutorials use it, easier to find help")],
          [tx(t, "ch11_when2", "New project, OpenGL 4.5+ available"), tx(t, "ch11_whenRec2", "DSA — cleaner, safer, easier to debug")],
          [tx(t, "ch11_when3", "Maintaining existing codebase"),      tx(t, "ch11_whenRec3", "Bind-to-edit — don't mix styles in the same file")],
          [tx(t, "ch11_when4", "Need OpenGL 3.3 compatibility"),      tx(t, "ch11_whenRec4", "Bind-to-edit — DSA requires 4.5+")],
          [tx(t, "ch11_when5", "macOS"),                              tx(t, "ch11_whenRec5", "Bind-to-edit — Apple's OpenGL stops at 4.1")],
        ]}
      />

      <H2>{tx(t, "ch11_choicesTitle", "Choices in the code")}</H2>
      <LessonTable
        headers={[tx(t, "ch11_tChoice", "Choice"), tx(t, "ch11_tReason", "Reason")]}
        rows={[
          [tx(t, "ch11_c1", "glCreate* everywhere"), tx(t, "ch11_c1b", "the object exists immediately, so every DSA call is valid from the next line on; no bind needed to bring it to life.")],
          [tx(t, "ch11_c2", "*Storage instead of *Data"), tx(t, "ch11_c2b", "fixed size and format, allocated once; the driver can place it optimally and you cannot accidentally reallocate it mid-frame.")],
          [tx(t, "ch11_c3", "flags 0 for static meshes"), tx(t, "ch11_c3b", "a mesh uploaded once never needs CPU writes; saying so lets the driver keep it in fast GPU-only memory.")],
          [tx(t, "ch11_c4", "one VAO per vertex layout"), tx(t, "ch11_c4b", "formats are described once; switching meshes is just glVertexArrayVertexBuffer + glVertexArrayElementBuffer.")],
          [tx(t, "ch11_c5", "all draw-time binds together, right before the draw"), tx(t, "ch11_c5b", "no bind outlives its purpose, so no later code can be surprised by it.")],
        ]}
      />

      <H2>{tx(t, "ch11_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "ch11_tMistake", "Mistake"), tx(t, "ch11_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "ch11_e1", "glGenBuffers, then glNamedBufferData without ever binding"), tx(t, "ch11_e1b", "GL_INVALID_OPERATION: the name was reserved but the object never created. Use glCreateBuffers.")],
          [tx(t, "ch11_e2", "Stride 0 in glVertexArrayVertexBuffer"), tx(t, "ch11_e2b", "unlike glVertexAttribPointer, 0 means \"every vertex reads the same bytes\", not \"tightly packed\". Pass the real stride.")],
          [tx(t, "ch11_e3", "glNamedBufferSubData on storage created with flags 0"), tx(t, "ch11_e3b", "GL_INVALID_OPERATION. Add GL_DYNAMIC_STORAGE_BIT for buffers the CPU updates.")],
          [tx(t, "ch11_e4", "Calling glTextureStorage2D twice to resize"), tx(t, "ch11_e4b", "immutable storage cannot change: GL_INVALID_OPERATION. Delete the texture and create a new one.")],
          [tx(t, "ch11_e5", "Forgetting glVertexArrayElementBuffer"), tx(t, "ch11_e5b", "with no bind there is nothing to capture the index buffer; glDrawElements finds none and draws nothing (GL_INVALID_OPERATION in the core profile).")],
          [tx(t, "ch11_e6", "Using the ...EXT functions from EXT_direct_state_access"), tx(t, "ch11_e6b", "an older, different extension with other names and rules (glNamedBufferDataEXT). Use the core 4.5 functions without suffix.")],
        ]}
      />

      <Callout type="tip" t={t}>
        {tx(t, "ch11_extensionTip",
          "DSA was originally ARB_direct_state_access before becoming core in 4.5. On any GPU made after 2014, support is effectively universal.")}
      </Callout>

      <KeyIdeas t={t} id="ch11" items={[
        "Bind-to-edit calls act on whatever is in a global slot; DSA calls name the object.",
        "glCreate* creates the object at once; glGen* only reserves a name.",
        "*Storage allocates once, at a fixed size; the flags say how the CPU may touch it.",
        "A texture of side n has ⌊log₂ n⌋ + 1 mip levels: 1024 → 11.",
        "DSA VAOs split the attribute format from the buffer binding, so one VAO serves every mesh with the same layout.",
        "DSA removes binding to edit, not binding to draw.",
      ]} />
    </Article>
  );
}
