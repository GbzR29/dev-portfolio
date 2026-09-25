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
          "std140 guarantees a layout you can predict from the C++ side, at the cost of aggressive padding. The rule that catches everyone: a vec3 is aligned and padded to 16 bytes, exactly like a vec4. Mirroring a GLSL block with a naive C++ struct is where UBO bugs come from."
        )}
      </p>

      <LessonTable
        headers={[tx(t, "oglUbo_h0", "Type"), tx(t, "oglUbo_h1", "Size"), tx(t, "oglUbo_h2", "Alignment")]}
        rows={[
          ["float / int / bool", "4",  "4"],
          ["vec2",               "8",  "8"],
          ["vec3",               "12", tx(t, "oglUbo_a3", "16 — padded")],
          ["vec4",               "16", "16"],
          ["mat4",               "64", tx(t, "oglUbo_a5", "16 per column")],
          [tx(t, "oglUbo_t6", "array of anything"), "—", tx(t, "oglUbo_a6", "Each element rounded up to 16")],
        ]}
      />

      <CodeBlock lang="cpp" filename="std140_struct.cpp" t={t}>{`// WRONG — 28 bytes in C++, but GLSL expects 48
struct BadLights { glm::vec3 position; float intensity; glm::vec3 color; };

// RIGHT — mirror the padding explicitly, and static_assert it
struct alignas(16) LightBlock {
    glm::vec3 position;  float _pad0;
    glm::vec3 color;     float intensity;   // packs into the padding slot
};
static_assert(sizeof(LightBlock) == 32, "std140 layout mismatch");`}</CodeBlock>

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
          "A UBO is limited to roughly 16 KB and its size is fixed at compile time. When you need more — thousands of lights, a bone palette, arbitrary-length arrays — the answer is a shader storage buffer object. SSBOs are larger, dynamically sized, writable from the shader, and use the tighter std430 layout where a vec3 array is not padded to 16."
        )}
      </Callout>

    </article>
  );
}
