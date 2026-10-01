// src/lib/tracks/opengl/chapters/advanced/instancing.tsx
"use client";

// Instancing (explanation pass 2026-10-01): what a draw call costs the CPU,
// gl_InstanceID and the uniform-array limit, instance arrays and the divisor
// formula (DivisorFigure), the mat4-as-four-vec4 layout, a worked asteroid
// ring, per-frame updates with orphaning, what instancing does not fix,
// choices and mistakes.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { DivisorFigure } from "@/components/lesson/figures/advgl/DivisorFigure";

const r = String.raw;

// ── Instancing ───────────────────────────────────────────────────────────────

export function InstancingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglInst_intro",
          "Drawing ten thousand asteroids with ten thousand draw calls is slow, and the bottleneck is not the GPU — it is the CPU-side validation and command submission per call. Instancing sends the geometry once and tells the GPU to draw it N times, with each copy pulling its own per-instance data from a buffer.")}
      </Lead>

      <H2>{tx(t, "oglInst_costTitle", "What a draw call costs")}</H2>
      <p>
        {tx(t, "oglInst_costBody",
          "A draw call is cheap for the GPU and expensive for the driver. Before anything reaches the GPU, the driver checks that the bound VAO, program, textures and framebuffer form a valid combination, translates the state you changed since the last call into hardware commands, makes sure every buffer and texture involved is resident in GPU memory, and appends the result to a command buffer. That is typically a few microseconds of CPU time per call, whether the mesh has twelve triangles or twelve thousand. While the CPU is busy doing this, the GPU often sits idle waiting for work.")}
      </p>

      <H2>{tx(t, "oglInst_basicTitle", "The simplest form")}</H2>
      <CodeBlock lang="cpp" filename="instanced_draw.cpp" t={t}>{`//                     mode          first count instancecount
glDrawArraysInstanced(GL_TRIANGLES, 0,    6,    100);
glDrawElementsInstanced(GL_TRIANGLES, indexCount, GL_UNSIGNED_INT, nullptr, 100);`}</CodeBlock>
      <p>
        {tx(t, "oglInst_basicBody",
          "The instanced draws take the same arguments as glDrawArrays and glDrawElements plus one: instancecount, how many copies to draw. The GPU runs the vertex shader for every vertex of every copy, and inside it the built-in gl_InstanceID says which copy this is, from 0 to instancecount − 1. Without anything else, all copies land in the same place. The first way to tell them apart is to index an array with gl_InstanceID:")}
      </p>
      <CodeBlock lang="glsl" filename="offset.vert" t={t}>{`#version 460 core
layout (location = 0) in vec2 aPos;

uniform vec2 uOffsets[100];    // fine for 100, useless for 100000

void main() {
    gl_Position = vec4(aPos + uOffsets[gl_InstanceID], 0.0, 1.0);
}`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglInst_uniformWarn2",
          "gl_InstanceID with a uniform array is the textbook example and it does not scale. A vertex shader is only guaranteed 1024 uniform components, 256 vec4s: with a mat4 per instance that is 64 instances, minus whatever else the shader needs. Drivers give more, but nowhere near ten thousand. Instance arrays are the real technique — everything below.")}
      </Callout>

      <H2>{tx(t, "oglInst_arraysTitle", "Instance arrays")}</H2>
      <p>
        {tx(t, "oglInst_arraysBody",
          "glVertexAttribDivisor changes how often an attribute advances. A divisor of 0 — the default — means advance per vertex. A divisor of 1 means advance once per instance, which turns a vertex attribute into per-instance data.")}
      </p>
      <Equation label={tx(t, "oglInst_fetchLabel", "Which element an attribute reads")}
        where={[
          [r`\text{gl\_VertexID}`, tx(t, "oglInst_wVid", "the vertex being processed, inside the mesh")],
          [r`\text{gl\_InstanceID}`, tx(t, "oglInst_wIid", "the copy being drawn, 0 to instancecount − 1")],
          [r`d`, tx(t, "oglInst_wD", "the divisor: how many consecutive instances share one element")],
          [r`b`, tx(t, "oglInst_wB", "baseInstance, 0 unless you draw with a *BaseInstance call; it shifts where per-instance reading starts")],
          [r`\lfloor\cdot\rfloor`, tx(t, "oglInst_wFloor", "integer division: instances 0 and 1 with d = 2 both give 0")],
        ]}>
        {r`\text{element} = \begin{cases} \text{gl\_VertexID} & d = 0 \\[4pt] \left\lfloor \dfrac{\text{gl\_InstanceID}}{d} \right\rfloor + b & d \ge 1 \end{cases}`}
      </Equation>

      <DivisorFigure t={t} />

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
      <p>
        {tx(t, "oglInst_loopBody",
          "Read the loop with the numbers in. The stride is sizeof(glm::mat4) = 64 bytes: from one instance's matrix to the next. The offset is i × 16 bytes: column i inside that matrix, because GLM stores matrices column by column (column-major), exactly as GLSL builds a mat4 from four column vectors. So location 3 reads bytes 0–15 of each matrix (column 0), location 4 bytes 16–31, and so on. The divisor of 1 goes on each of the four locations; the VAO records all of it, including which buffer was bound when glVertexAttribPointer ran.")}
      </p>

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
          "A mat4 attribute silently occupies four attribute locations, because a vertex attribute can be at most a vec4. Declaring it at location 3 means 4, 5 and 6 are taken too — put your next attribute at 7. Forgetting this produces geometry that reads garbage from an overlapping slot.")}
      </Callout>

      <CodeBlock lang="cpp" filename="instance_array_dsa.cpp" t={t}>{`// The same with DSA: the divisor belongs to the binding point, not the attribute
glVertexArrayVertexBuffer(vao, 1, instanceVBO, 0, sizeof(glm::mat4));
glVertexArrayBindingDivisor(vao, 1, 1);           // binding 1 advances per instance
for (unsigned i = 0; i < 4; ++i) {
    glVertexArrayAttribFormat(vao, 3 + i, 4, GL_FLOAT, GL_FALSE, i * sizeof(glm::vec4));
    glVertexArrayAttribBinding(vao, 3 + i, 1);
    glEnableVertexArrayAttrib(vao, 3 + i);
}`}</CodeBlock>

      <H2>{tx(t, "oglInst_workedTitle", "Worked example: an asteroid ring")}</H2>
      <p>
        {tx(t, "oglInst_workedIntro",
          "A ring of 10 000 asteroids around a planet, all the same rock mesh of 600 vertices, each with its own position, rotation and scale.")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "oglInst_w1", "One draw per asteroid: a glUniformMatrix4fv and a glDrawElements each, 20 000 calls per frame. At about 5 µs of driver time per draw that is 50 ms, so the frame rate cannot exceed 1000 / 50 = 20 fps, however fast the GPU is.")}</li>
        <li>{tx(t, "oglInst_w2", "Instanced: one glDrawElementsInstanced with instancecount 10 000. The matrices live in a buffer: 10 000 × 64 bytes = 640 000 bytes, 625 KiB, uploaded once if the ring does not move.")}</li>
        <li>{tx(t, "oglInst_w3", "If every asteroid moves each frame, the whole buffer is re-uploaded: 625 KiB × 60 frames = about 37.5 MB per second, a tiny fraction of what the PCIe bus carries (several GB per second).")}</li>
        <li>{tx(t, "oglInst_w4", "The GPU work does not change: the vertex shader still runs 600 × 10 000 = 6 million times in both versions. Instancing removed 19 999 draw calls of CPU overhead, not a single vertex.")}</li>
      </ol>
      <p>
        {tx(t, "oglInst_workedRead",
          "That last point is the whole story. If the frame was CPU-bound on draw submission, instancing makes it fast. If it was GPU-bound on vertices or pixels, instancing changes nothing, and the fix is fewer vertices (level of detail) or fewer instances (culling).")}
      </p>

      <H2>{tx(t, "oglInst_dynamicTitle", "Updating per frame")}</H2>
      <CodeBlock lang="cpp" filename="dynamic_instances.cpp" t={t}>{`// Allocate once with a dynamic hint
glBufferData(GL_ARRAY_BUFFER, capacity * sizeof(glm::mat4), nullptr, GL_DYNAMIC_DRAW);

// Then per frame, upload only what is actually visible
const auto visible = cullFrustum(allTransforms, camera);
glBindBuffer(GL_ARRAY_BUFFER, instanceVBO);
glBufferData(GL_ARRAY_BUFFER, capacity * sizeof(glm::mat4), nullptr, GL_DYNAMIC_DRAW); // orphan
glBufferSubData(GL_ARRAY_BUFFER, 0, visible.size() * sizeof(glm::mat4), visible.data());
glDrawElementsInstanced(GL_TRIANGLES, indexCount, GL_UNSIGNED_INT,
                        nullptr, (GLsizei)visible.size());`}</CodeBlock>
      <p>
        {tx(t, "oglInst_orphanBody",
          "The second glBufferData with nullptr is called orphaning. The GPU may still be drawing the previous frame from this buffer, and overwriting memory it is reading would force the driver to wait. Re-specifying the storage tells the driver you no longer need the old contents: it hands you fresh memory at once and frees the old block when the GPU is done with it. The capacity is fixed and the instance count varies, so only the visible part is uploaded and drawn.")}
      </p>

      <H2>{tx(t, "oglInst_limitsTitle", "What instancing does not fix")}</H2>
      <Callout type="tip" t={t}>
        {tx(t, "oglInst_whenTip",
          "Instancing only helps when the draw call itself is the bottleneck — many copies of the same mesh with the same material. It does nothing for one huge mesh, and it cannot batch objects with different geometry. If the instances are heavy, combine it with frustum culling: drawing a hundred thousand instances that are all off screen is still a hundred thousand vertex shader invocations.")}
      </Callout>
      <p>
        {tx(t, "oglInst_limitsBody",
          "Different meshes in one call need indirect drawing (glMultiDrawElementsIndirect, Performance chapter), where a buffer holds one small command per mesh. Very small meshes, such as a 4-vertex particle quad, can also run below full speed on some GPUs, because work from different instances is not always packed together efficiently; particle systems often expand quads from gl_VertexID in a single non-instanced draw instead.")}
      </p>

      <H2>{tx(t, "oglInst_choicesTitle", "Choices in the code")}</H2>
      <LessonTable
        headers={[tx(t, "oglInst_tData", "Per-instance data"), tx(t, "oglInst_tBytes", "Bytes"), tx(t, "oglInst_tWhen", "When")]}
        rows={[
          ["mat4", "64", tx(t, "oglInst_d1", "any transform, including shear and non-uniform scale; simplest")],
          [tx(t, "oglInst_d2n", "vec3 position + quaternion + float scale"), "32", tx(t, "oglInst_d2", "rigid objects with uniform scale; the shader rebuilds the rotation")],
          [tx(t, "oglInst_d3n", "vec4: position + uniform scale"), "16", tx(t, "oglInst_d3", "grass, particles, debris that never rotates or rotates by a hash of gl_InstanceID")],
          [tx(t, "oglInst_d4n", "+ vec4 colour or material index"), "+16 / +4", tx(t, "oglInst_d4", "variation per copy without a second draw")],
        ]}
      />

      <H2>{tx(t, "oglInst_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglInst_tMistake", "Mistake"), tx(t, "oglInst_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglInst_e1", "Forgetting glVertexAttribDivisor"), tx(t, "oglInst_e1b", "the matrix advances per vertex: each vertex of the mesh reads a different instance's columns and the geometry explodes into shards. Set divisor 1 on all four locations.")],
          [tx(t, "oglInst_e2", "Divisor set on location 3 only"), tx(t, "oglInst_e2b", "column 0 is per instance, columns 1–3 per vertex: sheared, stretched copies. Loop over 3 + i.")],
          [tx(t, "oglInst_e3", "Next attribute at location 4 after a mat4 at 3"), tx(t, "oglInst_e3b", "overlaps column 1 of the matrix. Use location 7.")],
          [tx(t, "oglInst_e4", "Indexing your own array with gl_InstanceID under a *BaseInstance draw"), tx(t, "oglInst_e4b", "gl_InstanceID ignores baseInstance while instance attributes honour it, so the two disagree. Add gl_BaseInstance (GLSL 4.60) yourself.")],
          [tx(t, "oglInst_e5", "instancecount 0"), tx(t, "oglInst_e5b", "nothing is drawn and no error is raised, typically after culling removed everything; harmless, but check it when debugging an empty screen.")],
          [tx(t, "oglInst_e6", "glBufferSubData every frame without orphaning"), tx(t, "oglInst_e6b", "the driver may stall until the GPU finishes the previous frame's draw. Orphan first, or use a persistently mapped ring buffer.")],
        ]}
      />

      <KeyIdeas t={t} id="oglInst" items={[
        "A draw call costs CPU time no matter how small the mesh; instancing turns N calls into one.",
        "gl_InstanceID numbers the copies; uniform arrays indexed by it run out after a few dozen mat4s.",
        "An attribute with divisor d reads element ⌊gl_InstanceID / d⌋ + baseInstance.",
        "A mat4 attribute is four vec4 locations with stride 64 and offsets 0, 16, 32, 48.",
        "Instancing removes CPU overhead, not GPU work: the vertex shader runs vertices × instances times.",
        "Orphan a per-frame instance buffer so the upload never waits for the GPU.",
      ]} />
    </Article>
  );
}
