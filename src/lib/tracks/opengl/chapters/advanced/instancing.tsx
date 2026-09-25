// src/lib/tracks/opengl/chapters/advanced/instancing.tsx
"use client";

import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ── Instancing ───────────────────────────────────────────────────────────────

export function InstancingContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglInst_intro",
          "Drawing ten thousand asteroids with ten thousand draw calls is slow, and the bottleneck is not the GPU — it is the CPU-side validation and command submission per call. Instancing sends the geometry once and tells the GPU to draw it N times, with each copy pulling its own per-instance data from a buffer."
        )}
      </p>

      <H2>{tx(t, "oglInst_basicTitle", "The simplest form")}</H2>
      <CodeBlock lang="cpp" filename="instanced_draw.cpp" t={t}>{`glDrawArraysInstanced(GL_TRIANGLES, 0, 6, 100);
glDrawElementsInstanced(GL_TRIANGLES, indexCount, GL_UNSIGNED_INT, nullptr, 100);`}</CodeBlock>

      <CodeBlock lang="glsl" filename="offset.vert" t={t}>{`#version 460 core
layout (location = 0) in vec2 aPos;

uniform vec2 uOffsets[100];    // fine for 100, useless for 100000

void main() {
    gl_Position = vec4(aPos + uOffsets[gl_InstanceID], 0.0, 1.0);
}`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglInst_uniformWarn",
          "gl_InstanceID with a uniform array is the textbook example and it does not scale. Uniform storage is limited to a few thousand vec4s, and you hit that wall fast. Instance arrays are the real technique — everything below."
        )}
      </Callout>

      <H2>{tx(t, "oglInst_arraysTitle", "Instance arrays")}</H2>
      <p>
        {tx(t, "oglInst_arraysBody",
          "glVertexAttribDivisor changes how often an attribute advances. A divisor of 0 — the default — means advance per vertex. A divisor of 1 means advance once per instance, which turns a vertex attribute into per-instance data."
        )}
      </p>

      <CodeBlock lang="cpp" filename="instance_array.cpp" t={t}>{`// A full mat4 per instance: 64 bytes, so four consecutive vec4 attributes
std::vector<glm::mat4> models(100000);
// ... fill with transforms ...

unsigned int instanceVBO;
glGenBuffers(1, &instanceVBO);
glBindBuffer(GL_ARRAY_BUFFER, instanceVBO);
glBufferData(GL_ARRAY_BUFFER, models.size() * sizeof(glm::mat4),
             models.data(), GL_STATIC_DRAW);

glBindVertexArray(meshVAO);
for (unsigned i = 0; i < 4; ++i) {
    glEnableVertexAttribArray(3 + i);
    glVertexAttribPointer(3 + i, 4, GL_FLOAT, GL_FALSE, sizeof(glm::mat4),
                          (void*)(i * sizeof(glm::vec4)));
    glVertexAttribDivisor(3 + i, 1);      // ← advance once per INSTANCE
}
glBindVertexArray(0);`}</CodeBlock>

      <CodeBlock lang="glsl" filename="instanced.vert" t={t}>{`#version 460 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec2 aTexCoord;
layout (location = 3) in mat4 aInstanceModel;   // consumes locations 3,4,5,6

uniform mat4 uView;
uniform mat4 uProjection;

void main() {
    gl_Position = uProjection * uView * aInstanceModel * vec4(aPos, 1.0);
}`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "oglInst_mat4Note",
          "A mat4 attribute silently occupies four attribute locations, because a vertex attribute can be at most a vec4. Declaring it at location 3 means 4, 5 and 6 are taken too — put your next attribute at 7. Forgetting this produces geometry that reads garbage from an overlapping slot."
        )}
      </Callout>

      <H2>{tx(t, "oglInst_dynamicTitle", "Updating per frame")}</H2>
      <CodeBlock lang="cpp" filename="dynamic_instances.cpp" t={t}>{`// Allocate once with a dynamic hint
glBufferData(GL_ARRAY_BUFFER, capacity * sizeof(glm::mat4), nullptr, GL_DYNAMIC_DRAW);

// Then per frame, upload only what is actually visible
const auto visible = cullFrustum(allTransforms, camera);
glBindBuffer(GL_ARRAY_BUFFER, instanceVBO);
glBufferSubData(GL_ARRAY_BUFFER, 0, visible.size() * sizeof(glm::mat4), visible.data());
glDrawElementsInstanced(GL_TRIANGLES, indexCount, GL_UNSIGNED_INT,
                        nullptr, (GLsizei)visible.size());`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "oglInst_whenTip",
          "Instancing only helps when the draw call itself is the bottleneck — many copies of the same mesh with the same material. It does nothing for one huge mesh, and it cannot batch objects with different geometry. If the instances are heavy, combine it with frustum culling: drawing a hundred thousand instances that are all off screen is still a hundred thousand vertex shader invocations."
        )}
      </Callout>

    </article>
  );
}
