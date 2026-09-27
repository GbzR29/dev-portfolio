// src/lib/tracks/opengl/chapters/advanced/ubo.tsx
"use client";

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ── Uniform Buffer Objects ───────────────────────────────────────────────────

export function UBOContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglUbo_intro",
          "Uniforms belong to a program. Ten shaders that all need the view and projection matrices means ten glUniformMatrix4fv calls every frame with identical data. A uniform buffer object stores that data once in GPU memory and binds it to a binding point that any number of shaders can read from."
        )}
      </p>

      <H2>{tx(t, "oglUbo_blockTitle", "Declaring a block")}</H2>
      <CodeBlock lang="glsl" filename="shared.glsl" t={t}>{`#version 460 core

layout (std140, binding = 0) uniform Matrices {
    mat4 uProjection;   // offset   0
    mat4 uView;         // offset  64
};                      // total  128 bytes

// The members are used exactly like ordinary uniforms — no prefix.
void main() { gl_Position = uProjection * uView * uModel * vec4(aPos, 1.0); }`}</CodeBlock>

      <H2>{tx(t, "oglUbo_std140Title", "std140 and its padding rules")}</H2>
      <p>
        {tx(t, "oglUbo_std140Body",
          "std140 guarantees a layout you can predict from the C++ side, at the cost of padding. Every member starts at an offset that is a multiple of its alignment. The rule that catches everyone: a vec3 is 12 bytes but must start on a 16-byte boundary, like a vec4. A single float may fill the 4 bytes left after it, but another vec3 may not. In C++ a glm::vec3 only needs 4-byte alignment, so a naive struct packs members tighter than GLSL expects, and every member after the first mismatch is read from the wrong place."
        )}
      </p>

      <LessonTable
        headers={[tx(t, "oglUbo_h0", "Type"), tx(t, "oglUbo_h1", "Size"), tx(t, "oglUbo_h2", "Alignment")]}
        rows={[
          ["float / int / bool", "4",  "4"],
          ["vec2",               "8",  "8"],
          ["vec3",               "12", tx(t, "oglUbo_a3", "16 — a following float may use the last 4 bytes")],
          ["vec4",               "16", "16"],
          ["mat4",               "64", tx(t, "oglUbo_a5", "16 per column")],
          [tx(t, "oglUbo_t6", "array of anything"), "—", tx(t, "oglUbo_a6", "Each element rounded up to 16")],
        ]}
      />

      <CodeBlock lang="cpp" filename="std140_struct.cpp" t={t}>{`// GLSL side
layout (std140, binding = 1) uniform Light {
    vec3  position;    // offset  0 (12 bytes)
    float intensity;   // offset 12 — a float fits in the gap after a vec3
    vec3  color;       // offset 16 — a vec3 must start on a multiple of 16
    vec3  direction;   // offset 32 — NOT 28: 28 is not a multiple of 16
};

// WRONG — glm::vec3 only needs 4-byte alignment, so direction lands at 28
struct BadLight {
    glm::vec3 position; float intensity;
    glm::vec3 color;
    glm::vec3 direction;               // C++ offset 28, GLSL reads offset 32
};

// RIGHT — mirror the padding explicitly, and check it at compile time
struct LightBlock {
    glm::vec3 position;  float intensity;   //  0, 12
    glm::vec3 color;     float _pad0;       // 16, 28
    glm::vec3 direction; float _pad1;       // 32, 44
};
static_assert(offsetof(LightBlock, direction) == 32, "std140 layout mismatch");
static_assert(sizeof(LightBlock) == 48, "std140 layout mismatch");`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "oglUbo_vec4Tip",
          "The practical rule: only ever put vec4s and mat4s in a uniform block, and pack scalars into the spare w components. It wastes a few bytes and saves you from an entire class of silent misalignment bugs that show up as one shader reading another's data."
        )}
      </Callout>

      <H2>{tx(t, "oglUbo_bindTitle", "Creating and binding")}</H2>
      <CodeBlock lang="cpp" filename="ubo.cpp" t={t}>{`unsigned int ubo;
glGenBuffers(1, &ubo);
glBindBuffer(GL_UNIFORM_BUFFER, ubo);
glBufferData(GL_UNIFORM_BUFFER, 2 * sizeof(glm::mat4), nullptr, GL_DYNAMIC_DRAW);
glBindBuffer(GL_UNIFORM_BUFFER, 0);

// Attach the buffer to binding point 0 — the same 0 as in the shader layout
glBindBufferRange(GL_UNIFORM_BUFFER, 0, ubo, 0, 2 * sizeof(glm::mat4));

// Once per frame, for every shader at once
glBindBuffer(GL_UNIFORM_BUFFER, ubo);
glBufferSubData(GL_UNIFORM_BUFFER, 0,                  sizeof(glm::mat4), &projection[0][0]);
glBufferSubData(GL_UNIFORM_BUFFER, sizeof(glm::mat4),  sizeof(glm::mat4), &view[0][0]);
glBindBuffer(GL_UNIFORM_BUFFER, 0);`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "oglUbo_legacyNote",
          "layout(binding = 0) in the shader requires GLSL 4.20 or later. On older versions you look the block up by name and assign the binding from C++: glUniformBlockBinding(program, glGetUniformBlockIndex(program, \"Matrices\"), 0). Targeting 4.6, the layout qualifier is simpler and removes a step that is easy to forget."
        )}
      </Callout>

      <Callout type="tip" t={t}>
        {tx(t, "oglUbo_ssboTip",
          "A UBO is only guaranteed 16 KB (GL_MAX_UNIFORM_BLOCK_SIZE, commonly 64 KB) and its arrays need a size known at compile time. When you need more — thousands of lights, a bone palette, arbitrary-length arrays — the answer is a shader storage buffer object. SSBOs are far larger, can end in a runtime-sized array, are writable from the shader, and can use the tighter std430 layout, where arrays of floats and vec2s are no longer padded to 16 bytes per element (a vec3 is still aligned to 16)."
        )}
      </Callout>

    </article>
  );
}
