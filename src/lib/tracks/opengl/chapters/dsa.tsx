"use client";

// OpenGL track — "Bind-to-Edit vs DSA".

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function DSAContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch11_intro",
          "Every chapter so far used bind-to-edit: bind an object, modify it, unbind. OpenGL 4.5 introduced DSA — modify any object by its ID without binding. Both produce identical GPU behavior; only the CPU-side code differs."
        )}
      </p>

      <H2>{tx(t, "ch11_problemTitle", "The bind-to-edit problem")}</H2>
      <p>
        {tx(t, "ch11_problemBody",
          "Binding is implicit global state. glBindBuffer silently targets all subsequent buffer ops until you bind something else — easy to corrupt the wrong buffer."
        )}
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

      <H2>{tx(t, "ch11_dsaTitle", "DSA: operate by ID, no binding")}</H2>
      <p>
        {tx(t, "ch11_dsaBody",
          "DSA functions take the object ID as their first argument. No binding needed."
        )}
      </p>
      <CodeBlock lang="cpp" filename="dsa_buffer.cpp" t={t}>{`// DSA — OpenGL 4.5+
unsigned int VBO;
glCreateBuffers(1, &VBO);             // glCreate* instead of glGen*
// Note: glCreateBuffers initializes the object immediately.
// glGenBuffers just reserves an ID — it is not usable until bound.

glNamedBufferData(VBO,                // ← object ID, not a target enum
                  sizeof(data), data, GL_STATIC_DRAW);
// No binding needed. VBO is modified directly by its ID.`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "ch11_createVsGen",
          "glCreate* vs glGen*: glGen* only reserves an ID — the object is not initialized until first bound. glCreate* (DSA) reserves and initializes immediately."
        )}
      </Callout>

      <H2>{tx(t, "ch11_vaoTitle", "DSA for VAOs")}</H2>
      <p>
        {tx(t, "ch11_vaoBody",
          "VAO setup shows the biggest readability improvement with DSA. Instead of binding a chain of objects, you explicitly link them by ID."
        )}
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
unsigned int dVAO, dVBO;
glCreateVertexArrays(1, &dVAO);
glCreateBuffers(1, &dVBO);

// Upload data — no binding
glNamedBufferStorage(dVBO, sizeof(verts), verts, GL_DYNAMIC_STORAGE_BIT);

// Attach buffer to VAO at binding point 0
glVertexArrayVertexBuffer(
    dVAO,           // which VAO
    0,              // binding point index
    dVBO,           // which buffer
    0,              // offset into buffer (bytes)
    stride          // stride between vertices (bytes)
);

// Describe attribute 0: 3 floats, not normalized, offset 0 within vertex
glVertexArrayAttribFormat(dVAO, /*attrib*/0, /*size*/3, GL_FLOAT, GL_FALSE, /*relativeOffset*/0);

// Connect attrib 0 to binding point 0
glVertexArrayAttribBinding(dVAO, /*attrib*/0, /*bindingPoint*/0);

// Enable attrib 0
glEnableVertexArrayAttrib(dVAO, 0);

// Render — same as always
glBindVertexArray(dVAO);
glDrawArrays(GL_TRIANGLES, 0, 3);`}</CodeBlock>

      <H2>{tx(t, "ch11_comparisonTitle", "Side-by-side comparison")}</H2>
      <LessonTable
        headers={[tx(t, "ch11_compHeader0", "Operation"), tx(t, "ch11_compHeader1", "Bind-to-edit"), tx(t, "ch11_compHeader2", "DSA")]}
        rows={[
          [tx(t, "ch11_op1", "Create buffer"),      "glGenBuffers + glBindBuffer",    "glCreateBuffers"],
          [tx(t, "ch11_op2", "Upload data"),         "glBufferData (bound target)",    "glNamedBufferData (by ID)"],
          [tx(t, "ch11_op3", "Update partial data"), "glBufferSubData (bound target)", "glNamedBufferSubData (by ID)"],
          [tx(t, "ch11_op4", "Create texture"),      "glGenTextures + glBindTexture",  "glCreateTextures"],
          [tx(t, "ch11_op5", "Upload texture"),      "glTexImage2D (bound target)",    "glTextureStorage2D + glTextureSubImage2D"],
          [tx(t, "ch11_op6", "VAO attrib setup"),    "glVertexAttribPointer",          "glVertexArrayAttribFormat + Binding"],
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
        ]}
      />

      <Callout type="tip" t={t}>
        {tx(t, "ch11_extensionTip",
          "DSA was originally ARB_direct_state_access before becoming core in 4.5. On any GPU made after 2014, support is effectively universal."
        )}
      </Callout>

    </article>
  );
}
