// src/lib/tracks/opengl/chapters/advanced/ubo.tsx
"use client";

// Uniform Buffer Objects (explanation pass 2026-10-01): why per-program
// uniforms repeat work, blocks and instance names, binding points as the
// meeting place, the std140 rules as one formula plus a table (Std140Figure),
// a block worked through in std140 / std430 / C++, creating and binding,
// many objects in one buffer and the offset alignment, choices and mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { UBO_ALIGNS, UBO_OFFSET_ALIGNS, nextOffsetNumbers, strideNumbers } from "@/lib/tracks/opengl/live/ubo";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Std140Figure } from "@/components/lesson/figures/advgl/Std140Figure";

const r = String.raw;

// ── Uniform Buffer Objects ───────────────────────────────────────────────────

export function UBOContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglUbo_intro",
          "Uniforms belong to a program. Ten shaders that all need the view and projection matrices means ten glUniformMatrix4fv calls every frame with identical data. A uniform buffer object stores that data once in GPU memory and binds it to a binding point that any number of shaders can read from.")}
      </Lead>

      <Goals t={t} id="oglUbo" items={[
        "Share uniforms between shaders with a uniform block.",
        "Connect blocks and buffers through binding points.",
        "Lay out the block by the std140 padding rules.",
      ]} />

      <H2>{tx(t, "oglUbo_whyTitle", "What plain uniforms repeat")}</H2>
      <p>
        {tx(t, "oglUbo_whyBody",
          "A plain uniform lives inside one program object, so the same value has to be set again in every program that uses it. With 10 programs and 2 camera matrices that is 20 glUniformMatrix4fv calls per frame, 20 × 64 = 1280 bytes sent to say 128 bytes of information, plus a glUseProgram before each batch because glUniform* writes to the current program. Add a light list, the time and the exposure, and every new shader must remember to receive all of them. A uniform buffer turns this around: the data lives in one buffer, written once per frame, and each program only declares that it reads it.")}
      </p>

      <H2>{tx(t, "oglUbo_blockTitle", "Declaring a block")}</H2>
      <CodeBlock lang="glsl" filename="shared.glsl" t={t}>{`#version 460 core

layout (std140, binding = 0) uniform Matrices {
    mat4 uProjection;   // offset   0
    mat4 uView;         // offset  64
};                      // total  128 bytes

// The members are used exactly like ordinary uniforms — no prefix.
void main() { gl_Position = uProjection * uView * uModel * vec4(aPos, 1.0); }

// With an instance name the members need a prefix instead:
// layout (std140, binding = 0) uniform Matrices { mat4 projection; mat4 view; } cam;
// ... cam.projection * cam.view ...`}</CodeBlock>
      <p>
        {tx(t, "oglUbo_blockBody",
          "Three names are involved. Matrices is the block name, the one C++ uses to find the block. The members are what the shader reads. An optional instance name after the closing brace (cam) groups the members under a prefix, which avoids clashes when two blocks have a member called color. std140 picks the memory layout, and binding = 0 picks the binding point.")}
      </p>

      <H2>{tx(t, "oglUbo_pointsTitle", "Binding points")}</H2>
      <p>
        {tx(t, "oglUbo_pointsBody",
          "A binding point is a numbered slot in the context, like a texture unit. Both sides connect to it independently: each program says \"my block Matrices reads from point 0\" (the layout qualifier), and the C++ code says \"point 0 holds this buffer, from byte 0 to byte 128\" (glBindBufferRange). Neither side knows the other. Switching programs keeps the buffer in place, so one upload per frame serves every shader that declares the block at point 0.")}
      </p>

      <H2>{tx(t, "oglUbo_std140Title", "std140 and its padding rules")}</H2>
      <p>
        {tx(t, "oglUbo_std140Body",
          "std140 guarantees a layout you can predict from the C++ side, at the cost of padding. Every member starts at an offset that is a multiple of its alignment. The rule that catches everyone: a vec3 is 12 bytes but must start on a 16-byte boundary, like a vec4. A single float may fill the 4 bytes left after it, but another vec3 may not. In C++ a glm::vec3 only needs 4-byte alignment, so a naive struct packs members tighter than GLSL expects, and every member after the first mismatch is read from the wrong place.")}
      </p>
      <Equation label={tx(t, "oglUbo_offLabel", "Where the next member starts")}
        where={[
          [r`o_{\text{end}}`, tx(t, "oglUbo_wEnd", "the first free byte after the previous member (its offset + its size)")],
          [r`a`, tx(t, "oglUbo_wA", "the new member's alignment, from the table below")],
          [r`\lceil\cdot\rceil`, tx(t, "oglUbo_wCeil", "round up: the smallest multiple of a that is not before o_end")],
        ]}
        words={tx(t, "oglUbo_offWords", "Start where the previous member ended. If that byte is not a multiple of the new member's alignment, skip forward to the next multiple. The skipped bytes are padding.")}>
        {r`o_{\text{next}} = \left\lceil \frac{o_{\text{end}}}{a} \right\rceil a`}
      </Equation>
      <LiveFormula label={tx(t, "oglUbo_liveNext", "Try it: where does the next member start?")}
        tex={r`o_{\text{next}} = \left\lceil \frac{o_{\text{end}}}{a} \right\rceil a`}
        vars={[
          { id: "end", label: <>o<sub>end</sub></>, min: 0, max: 96, step: 4, value: 28, fmt: v => String(v) },
          { id: "ai", label: "a", min: 0, max: 2, step: 1, value: 2, fmt: v => String(UBO_ALIGNS[v]) },
        ]}
        compute={nextOffsetNumbers(t)}
        note={tx(t, "oglUbo_liveNextNote", "28 is where the Light block's color ends. A float (a = 4) could start right there; a vec3 (a = 16) jumps to 32, which is why direction sits at 32 and not 28. When o_end is already a multiple of a, the padding is 0.")} />

      <LessonTable
        headers={[tx(t, "oglUbo_h0", "Type"), tx(t, "oglUbo_h1", "Size"), tx(t, "oglUbo_h2", "Alignment")]}
        rows={[
          ["float / int / bool", "4",  "4"],
          ["vec2",               "8",  "8"],
          ["vec3",               "12", tx(t, "oglUbo_a3", "16 — a following float may use the last 4 bytes")],
          ["vec4",               "16", "16"],
          ["mat3",               "48", tx(t, "oglUbo_a7", "16; each of the 3 columns padded to a vec4")],
          ["mat4",               "64", tx(t, "oglUbo_a5", "16 per column")],
          [tx(t, "oglUbo_t6", "array of anything"), tx(t, "oglUbo_s6", "count × 16 or more"), tx(t, "oglUbo_a6", "Each element rounded up to 16")],
          [tx(t, "oglUbo_t8", "struct"), tx(t, "oglUbo_s8", "rounded up to 16"), tx(t, "oglUbo_a8", "16, and so is the member after it")],
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

      <Std140Figure t={t} />

      <H3>{tx(t, "oglUbo_workedTitle", "Worked example: a per-frame block")}</H3>
      <p>
        {tx(t, "oglUbo_workedIntro",
          "The Frame preset in the figure: float time; vec3 camPos; float exposure; vec2 jitter; mat3 normalMat; float weights[3]. Apply the formula member by member in std140:")}
      </p>
      <Derivation t={t} label={tx(t, "oglUbo_frameDer", "The Frame block, member by member")}
        steps={[
          { full: true, tex: r`\text{time}: \quad o = 0, \quad \text{end} = 0 + 4 = 4`,
            why: tx(t, "oglUbo_w1", "time: alignment 4, offset 0, ends at 4.") },
          { full: true, tex: r`\text{camPos}: \quad o = \lceil 4/16 \rceil \cdot 16 = 16, \quad \text{end} = 16 + 12 = 28`,
            why: tx(t, "oglUbo_w2", "camPos: alignment 16, so ⌈4/16⌉ × 16 = 16. Bytes 4–15 are padding; it ends at 28.") },
          { full: true, tex: r`\text{exposure}: \quad o = \lceil 28/4 \rceil \cdot 4 = 28, \quad \text{end} = 32`,
            why: tx(t, "oglUbo_w3", "exposure: alignment 4, 28 is a multiple of 4, so it takes 28–31, filling the vec3's spare slot.") },
          { full: true, tex: r`\text{jitter}: \quad o = \lceil 32/8 \rceil \cdot 8 = 32, \quad \text{end} = 32 + 8 = 40`,
            why: tx(t, "oglUbo_w4", "jitter: alignment 8, offset 32, ends at 40.") },
          { full: true, tex: r`\text{normalMat}: \quad o = \lceil 40/16 \rceil \cdot 16 = 48, \quad \text{end} = 48 + 3 \cdot 16 = 96`,
            why: tx(t, "oglUbo_w5", "normalMat: alignment 16, so 48 (bytes 40–47 padding); 3 columns × 16 = 48 bytes, ends at 96.") },
          { full: true, tex: r`\text{weights[3]}: \quad o = \lceil 96/16 \rceil \cdot 16 = 96, \quad \text{end} = 96 + 3 \cdot 16 = 144`,
            why: tx(t, "oglUbo_w6", "weights[3]: each element is rounded up to 16, so 3 × 16 = 48 bytes from 96, ends at 144.") },
        ]} />
      <p>
        {tx(t, "oglUbo_workedRead",
          "144 bytes for 4 + 12 + 4 + 8 + 36 + 12 = 76 bytes of data: 68 bytes, almost half, are padding. In std430 (storage buffers only) the array packs to 12 bytes and the block shrinks to 112. A plain C++ struct of glm types packs everything to 76 bytes, so from camPos on every offset differs from what the shader reads. Rewriting the block as six vec4s (camPos in one, time, exposure and jitter packed into another, the normal matrix as three, the weights in the sixth) gives 96 bytes with identical offsets in all three layouts.")}
      </p>

      <Callout type="tip" t={t}>
        {tx(t, "oglUbo_vec4Tip",
          "The practical rule: only ever put vec4s and mat4s in a uniform block, and pack scalars into the spare w components. It wastes a few bytes and saves you from an entire class of silent misalignment bugs that show up as one shader reading another's data.")}
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
      <p>
        {tx(t, "oglUbo_bindBody",
          "glBindBufferRange(target, index, buffer, offset, size) puts bytes offset to offset + size of the buffer on binding point index. glBindBufferBase(target, index, buffer) is the same with the whole buffer. Notice the two different kinds of binding in the code: glBindBuffer(GL_UNIFORM_BUFFER, …) is the ordinary bind-to-edit slot used by glBufferSubData, while glBindBufferRange writes to the indexed binding point the shaders read. Unbinding the first does not disturb the second.")}
      </p>

      <Callout type="info" t={t}>
        {tx(t, "oglUbo_legacyNote",
          "layout(binding = 0) in the shader requires GLSL 4.20 or later. On older versions you look the block up by name and assign the binding from C++: glUniformBlockBinding(program, glGetUniformBlockIndex(program, \"Matrices\"), 0). Targeting 4.6, the layout qualifier is simpler and removes a step that is easy to forget.")}
      </Callout>

      <H3>{tx(t, "oglUbo_manyTitle", "Many objects in one buffer")}</H3>
      <p>
        {tx(t, "oglUbo_manyBody",
          "Per-object data (a model matrix and a colour, 80 bytes) can also live in one big buffer, with glBindBufferRange pointing the block at a different slice before each draw. The catch is GL_UNIFORM_BUFFER_OFFSET_ALIGNMENT: the offset you pass must be a multiple of it, and it is often 256. So each object's slice starts 256 bytes after the previous one, not 80. For 1000 objects that is 256 000 bytes, 250 KiB, of which 80 000 are data. Query the value instead of assuming it.")}
      </p>
      <LiveFormula label={tx(t, "oglUbo_liveStride", "Try it: how far apart are the slices?")}
        tex={r`\text{stride} = \left\lceil \frac{s}{A} \right\rceil A`}
        vars={[
          { id: "s", label: "s", min: 16, max: 512, step: 16, value: 80, fmt: v => `${v} B` },
          { id: "ai", label: "A", min: 0, max: 2, step: 1, value: 2, fmt: v => String(UBO_OFFSET_ALIGNS[v]) },
          { id: "n", label: tx(t, "oglUbo_liveN", "objects"), min: 100, max: 5000, step: 100, value: 1000, fmt: v => String(v) },
        ]}
        where={[
          [r`s`, tx(t, "oglUbo_wS", "the size of one object's block in bytes, sizeof(ObjectBlock)")],
          [r`A`, tx(t, "oglUbo_wAlign", "GL_UNIFORM_BUFFER_OFFSET_ALIGNMENT: 256 on many desktop GPUs, 64 or 16 on others")],
        ]}
        compute={strideNumbers(t)}
        note={tx(t, "oglUbo_liveStrideNote", "80 bytes with A = 256 gives the 250 KiB of the text, under a third of it data. With A = 16 the stride is 80 and nothing is wasted. Grow the block to 256 bytes and even A = 256 wastes nothing: pack more per object instead of fighting the alignment.")} />
      <CodeBlock lang="cpp" filename="ubo_ring.cpp" t={t}>{`GLint align = 0;
glGetIntegerv(GL_UNIFORM_BUFFER_OFFSET_ALIGNMENT, &align);       // e.g. 256
const GLsizeiptr stride = (sizeof(ObjectBlock) + align - 1) / align * align;   // 80 → 256

for (size_t i = 0; i < objects.size(); ++i)
    std::memcpy(staging.data() + i * stride, &objects[i].block, sizeof(ObjectBlock));
glBufferSubData(GL_UNIFORM_BUFFER, 0, objects.size() * stride, staging.data());

for (size_t i = 0; i < objects.size(); ++i) {
    glBindBufferRange(GL_UNIFORM_BUFFER, 2, ubo, i * stride, sizeof(ObjectBlock));
    drawMesh(objects[i].mesh);
}`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "oglUbo_ssboTip",
          "A UBO is only guaranteed 16 KB (GL_MAX_UNIFORM_BLOCK_SIZE, commonly 64 KB) and its arrays need a size known at compile time. When you need more — thousands of lights, a bone palette, arbitrary-length arrays — the answer is a shader storage buffer object. SSBOs are far larger, can end in a runtime-sized array, are writable from the shader, and can use the tighter std430 layout, where arrays of floats and vec2s are no longer padded to 16 bytes per element (a vec3 is still aligned to 16).")}
      </Callout>

      <H2>{tx(t, "oglUbo_choicesTitle", "Choices in the code")}</H2>
      <LessonTable
        headers={[tx(t, "oglUbo_tChoice", "Choice"), tx(t, "oglUbo_tReason", "Reason")]}
        rows={[
          [tx(t, "oglUbo_c1", "std140, not shared or packed"), tx(t, "oglUbo_c1b", "the only uniform-block layout whose offsets are fixed by the spec, so C++ can mirror it without querying each member.")],
          [tx(t, "oglUbo_c2", "binding = N in the shader"), tx(t, "oglUbo_c2b", "the connection is visible where the block is declared, and no C++ call per program can be forgotten.")],
          [tx(t, "oglUbo_c3", "one block per update frequency"), tx(t, "oglUbo_c3b", "per frame (camera, time), per pass (light list), per object (model matrix): each is uploaded only when it changes.")],
          [tx(t, "oglUbo_c4", "static_assert on offsetof and sizeof"), tx(t, "oglUbo_c4b", "a layout mismatch becomes a compile error instead of a lighting bug found weeks later.")],
          [tx(t, "oglUbo_c5", "GL_DYNAMIC_DRAW"), tx(t, "oglUbo_c5b", "a hint that the contents change often and are only read by the GPU; it does not change behaviour, only where the driver may place the memory.")],
        ]}
      />

      <H2>{tx(t, "oglUbo_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglUbo_tMistake", "Mistake"), tx(t, "oglUbo_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglUbo_e1", "Different binding numbers in the shader and in glBindBufferRange"), tx(t, "oglUbo_e1b", "the block reads whatever is on its point, often nothing, so zeros: a black or invisible object. Keep the numbers in one shared header or enum.")],
          [tx(t, "oglUbo_e2", "glm::mat3 in the C++ struct"), tx(t, "oglUbo_e2b", "36 bytes in C++, 48 in std140; everything after it shifts. Send a mat4, or three vec4s.")],
          [tx(t, "oglUbo_e3", "bool in the C++ struct"), tx(t, "oglUbo_e3b", "C++ bool is usually 1 byte, GLSL bool is 4. Use int or uint on both sides.")],
          [tx(t, "oglUbo_e4", "float weights[8] mirrored as float[8] in C++"), tx(t, "oglUbo_e4b", "std140 gives each element 16 bytes (128 total), C++ 4 (32 total). Declare vec4 weights[2] instead.")],
          [tx(t, "oglUbo_e5", "glBindBufferRange offset not a multiple of the alignment"), tx(t, "oglUbo_e5b", "GL_INVALID_VALUE and the binding is not changed, so the previous object's data is used. Round the stride up as shown.")],
          [tx(t, "oglUbo_e6", "A block the shader never uses"), tx(t, "oglUbo_e6b", "the compiler removes it; glGetUniformBlockIndex returns GL_INVALID_INDEX and code that assumed it exists breaks. Check the index.")],
        ]}
      />

      <KeyIdeas t={t} id="oglUbo" items={[
        "A UBO holds shared uniforms once; every program that declares the block reads the same buffer.",
        "Shader and C++ meet at a numbered binding point, each side connecting on its own.",
        "In std140 each member starts at the next multiple of its alignment: vec3 aligns to 16, arrays and mat3 columns take 16 per element.",
        "A plain glm struct is packed tighter than std140; mirror the padding and static_assert the offsets.",
        "Per-object slices must start at multiples of GL_UNIFORM_BUFFER_OFFSET_ALIGNMENT, often 256.",
        "vec4s and mat4s only is the layout that cannot go wrong.",
      ]} />
    </Article>
  );
}
