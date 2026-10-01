// src/lib/tracks/opengl/chapters/compute.tsx
"use client";

// Compute shaders (explanation pass 2026-10-01, split out of tooling.tsx):
// the two-level execution model and how the built-in IDs relate
// (DispatchFigure), limits, writing an image (glBindImageTexture argument by
// argument), the 1921×1080 rounding worked through, memory barriers by
// consumer, shared memory + barrier() with a parallel reduction, SSBOs drawn
// as vertices, choices and mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { DispatchFigure } from "@/components/lesson/figures/advgl/DispatchFigure";

const r = String.raw;

// ── Compute Shaders ──────────────────────────────────────────────────────────

export function ComputeContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglCompute_intro",
          "Every shader so far sat inside the rasterization pipeline: it received vertices or fragments and had to produce geometry or colour. A compute shader has no pipeline around it. You dispatch a grid of threads, they read and write buffers and images, and that is the whole model. It is how particle simulation, culling, physics and image processing move onto the GPU.")}
      </Lead>

      <H2>{tx(t, "oglCompute_modelTitle", "The execution model")}</H2>
      <p>
        {tx(t, "oglCompute_modelBody",
          "Work is organized in two levels. You dispatch work groups; each work group runs a fixed number of invocations declared in the shader. Invocations inside a group can share memory and synchronize with each other. Invocations in different groups cannot — they may not even run at the same time.")}
      </p>
      <p>
        {tx(t, "oglCompute_modelBody2",
          "The shader fixes the size of a group with layout (local_size_x = 16, local_size_y = 16) in: 256 invocations arranged as a 16 × 16 square. The C++ side only chooses how many groups to launch, with glDispatchCompute(x, y, z). Each invocation then finds out which one it is from built-in variables, and the one you use most is assembled from the others:")}
      </p>
      <Equation label={tx(t, "oglCompute_idLabel", "The global ID of an invocation")}
        where={[
          [r`\text{gl\_WorkGroupID}`, tx(t, "oglCompute_wGroup", "which group, from (0,0,0) to the dispatch size − 1")],
          [r`\text{gl\_WorkGroupSize}`, tx(t, "oglCompute_wSize", "the local_size declared in the shader, e.g. (16, 16, 1)")],
          [r`\text{gl\_LocalInvocationID}`, tx(t, "oglCompute_wLocal", "the position inside the group, from (0,0,0) to the size − 1")],
        ]}>
        {r`\text{gl\_GlobalInvocationID} = \text{gl\_WorkGroupID} \cdot \text{gl\_WorkGroupSize} + \text{gl\_LocalInvocationID}`}
      </Equation>

      <LessonTable
        headers={[tx(t, "oglCompute_h0", "Built-in"), tx(t, "oglCompute_h1", "Meaning")]}
        rows={[
          ["gl_GlobalInvocationID",  tx(t, "oglCompute_b1", "Unique index across the whole dispatch. Usually your data index.")],
          ["gl_LocalInvocationID",   tx(t, "oglCompute_b2", "Index within the work group. Used to address shared memory.")],
          ["gl_LocalInvocationIndex", tx(t, "oglCompute_b5", "The local ID flattened to one number: z·sx·sy + y·sx + x.")],
          ["gl_WorkGroupID",         tx(t, "oglCompute_b3", "Which work group this invocation belongs to.")],
          ["gl_NumWorkGroups",       tx(t, "oglCompute_b4", "The dispatch dimensions you passed to glDispatchCompute.")],
        ]}
      />

      <DispatchFigure t={t} />

      <p>
        {tx(t, "oglCompute_limitsBody",
          "The limits are generous but real. A group may hold at most GL_MAX_COMPUTE_WORK_GROUP_INVOCATIONS invocations, at least 1024, with per-axis maxima of at least 1024, 1024 and 64. A dispatch may launch at least 65 535 groups along each axis. Shared memory per group is at least 32 KB (GL_MAX_COMPUTE_SHARED_MEMORY_SIZE).")}
      </p>

      <H2>{tx(t, "oglCompute_writeTitle", "Writing into a texture")}</H2>
      <CodeBlock lang="glsl" filename="gradient.comp" t={t}>{`#version 460 core

layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;
layout (rgba32f, binding = 0) uniform writeonly image2D uOutput;

uniform float uTime;

void main() {
    ivec2 texel = ivec2(gl_GlobalInvocationID.xy);
    ivec2 size  = imageSize(uOutput);

    // A dispatch is rounded up, so the last group runs past the edge
    if (texel.x >= size.x || texel.y >= size.y) return;

    vec2 uv = vec2(texel) / vec2(size);
    vec3 color = 0.5 + 0.5 * cos(uTime + uv.xyx + vec3(0.0, 2.0, 4.0));

    imageStore(uOutput, texel, vec4(color, 1.0));
}`}</CodeBlock>
      <p>
        {tx(t, "oglCompute_imageBody",
          "An image2D is a texture accessed without a sampler: no filtering, no mipmap selection, no normalized coordinates. imageStore writes one texel at an integer address, imageLoad reads one. The rgba32f qualifier must match the texture's format, because the shader has to know how to encode the value; writeonly promises the shader never reads it, which lets the compiler skip work. binding = 0 is an image unit, a separate set of slots from texture units.")}
      </p>

      <CodeBlock lang="cpp" filename="dispatch.cpp" t={t}>{`// The texture must be complete and use an image-compatible format.
// Immutable storage guarantees both, which is why it is the recommended way
unsigned int tex;
glCreateTextures(GL_TEXTURE_2D, 1, &tex);
glTextureStorage2D(tex, 1, GL_RGBA32F, W, H);    // 1 level: complete by construction
glTextureParameteri(tex, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
glTextureParameteri(tex, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

glUseProgram(computeProgram);
//                unit tex level layered layer access         format
glBindImageTexture(0,   tex, 0,    GL_FALSE, 0,  GL_WRITE_ONLY, GL_RGBA32F);

// Round UP — 1920/16 is exact, but 1921 would lose a column without the +15
glDispatchCompute((W + 15) / 16, (H + 15) / 16, 1);

// Wait for the writes to be visible to the next stage
glMemoryBarrier(GL_TEXTURE_FETCH_BARRIER_BIT);   // the next pass samples it with texture()

// Now sample it like any other texture
glUseProgram(drawProgram);
glBindTextureUnit(0, tex);`}</CodeBlock>
      <p>
        {tx(t, "oglCompute_bindBody",
          "glBindImageTexture puts mip level 0 of the texture on image unit 0. layered = GL_FALSE with layer 0 means a single 2D image (for an array or cube map, GL_TRUE exposes all layers). The access argument repeats the promise of writeonly, and the format says how texels are interpreted; it must be compatible with the texture's internal format.")}
      </p>

      <H3>{tx(t, "oglCompute_workedTitle", "Worked example: rounding up the dispatch")}</H3>
      <p>
        {tx(t, "oglCompute_workedBody",
          "A 1921 × 1080 image with 16 × 16 groups. Integer division rounds down, so 1921 / 16 = 120 groups would cover only 1920 columns. Adding 15 first turns the division into a round-up: (1921 + 15) / 16 = 121, and (1080 + 15) / 16 = 68 (1080 / 16 = 67.5). The dispatch runs 121 × 16 = 1936 by 68 × 16 = 1088 invocations, 2 106 368 in total, for 2 074 680 pixels. The other 31 688, about 1.5%, fail the bounds check and return at once. Without that check they would write outside the image; imageStore ignores out-of-range writes, but an SSBO write past the end of the array would corrupt memory.")}
      </p>

      <Callout type="warn" t={t}>
        {tx(t, "oglCompute_barrierWarn",
          "glMemoryBarrier is not optional and forgetting it is the defining compute-shader bug. The dispatch is asynchronous: without a barrier the next draw may read the texture before the compute writes have landed, and the result is a flickering or one-frame-stale image that looks intermittent and hardware-dependent. Pick the barrier bits matching how you will read the data.")}
      </Callout>
      <p>
        {tx(t, "oglCompute_bitsBody",
          "The bits name the consumer: how the data written by shaders before the barrier will be read after it. Writing an image and then sampling it needs the texture-fetch bit, not the image-access bit, because texture() goes through a different cache.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglCompute_bH0", "Next, the data is read as…"), tx(t, "oglCompute_bH1", "Barrier bit")]}
        rows={[
          [tx(t, "oglCompute_bb1", "a texture, with texture() or texelFetch"), "GL_TEXTURE_FETCH_BARRIER_BIT"],
          [tx(t, "oglCompute_bb2", "an image, with imageLoad / imageStore"), "GL_SHADER_IMAGE_ACCESS_BARRIER_BIT"],
          [tx(t, "oglCompute_bb3", "a storage buffer in another shader"), "GL_SHADER_STORAGE_BARRIER_BIT"],
          [tx(t, "oglCompute_bb4", "vertex attributes"), "GL_VERTEX_ATTRIB_ARRAY_BARRIER_BIT"],
          [tx(t, "oglCompute_bb5", "indirect draw or dispatch parameters"), "GL_COMMAND_BARRIER_BIT"],
          [tx(t, "oglCompute_bb6", "the CPU, via glGetBufferSubData or a mapping"), "GL_BUFFER_UPDATE_BARRIER_BIT"],
        ]}
      />

      <H2>{tx(t, "oglCompute_sharedTitle", "Shared memory and barrier()")}</H2>
      <p>
        {tx(t, "oglCompute_sharedBody",
          "Variables declared shared exist once per work group, in fast on-chip memory, and every invocation of the group can read and write them. That is what makes cooperation possible: a group can load a tile of data once and let every invocation read its neighbours, or combine many values into one. barrier() is the meeting point: no invocation of the group continues past it until all of them have reached it. memoryBarrierShared() before it makes sure the shared writes are visible when they continue.")}
      </p>
      <CodeBlock lang="glsl" filename="reduce.comp" t={t}>{`#version 460 core
layout (local_size_x = 256) in;

layout (std430, binding = 0) readonly  buffer In  { float values[];  };
layout (std430, binding = 1) writeonly buffer Out { float partial[]; };

shared float tile[256];                  // one per group, 1 KB

void main() {
    uint lid = gl_LocalInvocationID.x;
    uint gid = gl_GlobalInvocationID.x;

    // Out-of-range invocations load 0 instead of returning: all 256 must reach barrier()
    tile[lid] = gid < values.length() ? values[gid] : 0.0;
    memoryBarrierShared();
    barrier();

    for (uint s = 128; s > 0; s >>= 1) {     // 128, 64, 32, … 1: 8 steps
        if (lid < s) tile[lid] += tile[lid + s];
        memoryBarrierShared();
        barrier();                           // outside the if: every invocation reaches it
    }
    if (lid == 0) partial[gl_WorkGroupID.x] = tile[0];
}`}</CodeBlock>
      <p>
        {tx(t, "oglCompute_reduceBody",
          "Step by step: after loading, the 256 values sit in tile. In the first step the lower 128 invocations each add the value 128 places above theirs, so tile[0..127] holds 128 sums of pairs. The next step halves again, 64 sums of four values, and so on: after log₂ 256 = 8 steps tile[0] holds the sum of the whole group, and invocation 0 writes it out. Summing 1 000 000 values takes ⌈1 000 000 / 256⌉ = 3907 groups, giving 3907 partial sums; a second dispatch reduces those to ⌈3907 / 256⌉ = 16, and a third to 1. Each loop iteration has a barrier, because step k reads values written by other invocations in step k − 1.")}
      </p>

      <H2>{tx(t, "oglCompute_ssboTitle", "SSBOs — the real workhorse")}</H2>
      <p>
        {tx(t, "oglCompute_ssboBody",
          "Shader storage buffers are readable and writable from the shader, can be hundreds of megabytes, and support a runtime-sized trailing array. They are how you keep a particle system, a culling result or a spatial grid entirely on the GPU.")}
      </p>

      <CodeBlock lang="glsl" filename="particles.comp" t={t}>{`#version 460 core
layout (local_size_x = 256) in;

struct Particle {
    vec4 position;    // vec4, not vec3 — std430 still aligns vec3 to 16
    vec4 velocity;
};

layout (std430, binding = 0) buffer Particles {
    Particle particles[];      // runtime-sized: no length needed
};

uniform float uDt;

void main() {
    uint i = gl_GlobalInvocationID.x;
    if (i >= particles.length()) return;   // no barrier() in this shader, so returning is fine

    particles[i].velocity.y -= 9.81 * uDt;                     // gravity, m/s²
    particles[i].position    += particles[i].velocity * uDt;   // with the NEW velocity

    if (particles[i].position.y < 0.0) {
        particles[i].position.y = 0.0;
        particles[i].velocity.y *= -0.6;    // bounce, keeping 60% of the speed
    }
}`}</CodeBlock>
      <p>
        {tx(t, "oglCompute_particleBody",
          "Updating the velocity first and then moving with the new velocity is semi-implicit Euler, the same integrator as the Game Dev track's physics chapters; it stays stable where updating the position first would slowly gain energy. particles.length() is the number of whole Particle structs in the bound range, worked out from the buffer size, so the shader needs no count uniform. Each Particle is 2 × 16 = 32 bytes in std430, exactly the size of a C++ struct of two glm::vec4.")}
      </p>

      <CodeBlock lang="cpp" filename="ssbo.cpp" t={t}>{`// Once at startup
unsigned int ssbo;
glCreateBuffers(1, &ssbo);
glNamedBufferStorage(ssbo, particles.size() * sizeof(Particle), particles.data(), 0);
glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 0, ssbo);   // binding = 0

// The same buffer is also the vertex input: positions are the first 16 bytes of each Particle
glVertexArrayVertexBuffer(particleVAO, 0, ssbo, 0, sizeof(Particle));   // stride 32
glVertexArrayAttribFormat(particleVAO, 0, 4, GL_FLOAT, GL_FALSE, 0);
glVertexArrayAttribBinding(particleVAO, 0, 0);
glEnableVertexArrayAttrib(particleVAO, 0);

// Every frame
glUseProgram(computeProgram);
glProgramUniform1f(computeProgram, glGetUniformLocation(computeProgram, "uDt"), dt);
glDispatchCompute((particleCount + 255) / 256, 1, 1);
glMemoryBarrier(GL_VERTEX_ATTRIB_ARRAY_BARRIER_BIT);   // next, it is read as vertices

glUseProgram(drawProgram);
glBindVertexArray(particleVAO);
glDrawArrays(GL_POINTS, 0, particleCount);              // the data never leaves the GPU`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "oglCompute_sizeTip",
          "Make the local size a multiple of the hardware's wavefront width: 32 on NVIDIA, 64 on AMD. 64 or 256 is a safe default that wastes no lanes on either. A local size of 1 runs at a fraction of the throughput because most lanes in every wavefront sit idle.")}
      </Callout>

      <Callout type="info" t={t}>
        {tx(t, "oglCompute_readbackNote",
          "Reading results back to the CPU with glGetBufferSubData stalls the pipeline: it waits for the GPU to finish everything. If you must read back, do it into a persistently mapped buffer and read it one or two frames later. Better still, keep the data on the GPU — the particle example above never touches the CPU after upload.")}
      </Callout>

      <H2>{tx(t, "oglCompute_choicesTitle", "Choices in the code")}</H2>
      <LessonTable
        headers={[tx(t, "oglCompute_tChoice", "Choice"), tx(t, "oglCompute_tReason", "Reason")]}
        rows={[
          [tx(t, "oglCompute_c1", "16 × 16 groups for images"), tx(t, "oglCompute_c1b", "256 invocations, a multiple of 32 and 64, and square tiles keep neighbouring texels in the same group and cache.")],
          [tx(t, "oglCompute_c2", "256 × 1 for buffers"), tx(t, "oglCompute_c2b", "the data is one-dimensional; consecutive invocations read consecutive elements, which the memory system merges into few transactions.")],
          [tx(t, "oglCompute_c3", "(n + size − 1) / size groups plus a bounds check"), tx(t, "oglCompute_c3b", "covers any size without a remainder pass; the check costs one comparison.")],
          [tx(t, "oglCompute_c4", "readonly / writeonly qualifiers"), tx(t, "oglCompute_c4b", "tell the compiler which accesses cannot happen, so it can skip caches and reorder freely.")],
          [tx(t, "oglCompute_c5", "rgba32f image"), tx(t, "oglCompute_c5b", "simplest to reason about; rgba16f halves memory and bandwidth and is enough for colour.")],
        ]}
      />

      <H2>{tx(t, "oglCompute_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglCompute_tMistake", "Mistake"), tx(t, "oglCompute_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglCompute_e1", "No glMemoryBarrier, or the wrong bit"), tx(t, "oglCompute_e1b", "stale or half-written data that flickers and differs between GPUs. Choose the bit by how the data is read next.")],
          [tx(t, "oglCompute_e2", "W / 16 groups instead of (W + 15) / 16"), tx(t, "oglCompute_e2b", "the last partial group is never launched: a strip of unprocessed pixels on the right or top edge.")],
          [tx(t, "oglCompute_e3", "return before barrier() for out-of-range invocations"), tx(t, "oglCompute_e3b", "barrier() must be reached by every invocation of the group; otherwise the behaviour is undefined, often a hang. Load a neutral value and let them continue.")],
          [tx(t, "oglCompute_e4", "Image format qualifier different from the texture's format"), tx(t, "oglCompute_e4b", "values are encoded wrongly: garbage colours. Match rgba32f with GL_RGBA32F, rgba8 with GL_RGBA8.")],
          [tx(t, "oglCompute_e5", "vec3 in an std430 struct mirrored as glm::vec3"), tx(t, "oglCompute_e5b", "std430 aligns vec3 to 16, glm to 4; from the second member on, every particle is misread. Use vec4.")],
          [tx(t, "oglCompute_e6", "Mipmap filter on a 1-level texture used as an image"), tx(t, "oglCompute_e6b", "the texture is incomplete: stores have no effect and sampling returns black. Use immutable storage and a non-mipmap filter.")],
        ]}
      />

      <KeyIdeas t={t} id="oglCompute" items={[
        "A dispatch launches groups; the shader fixes the group size with local_size.",
        "gl_GlobalInvocationID = gl_WorkGroupID × gl_WorkGroupSize + gl_LocalInvocationID.",
        "Round the group count up with (n + size − 1) / size and bounds-check in the shader.",
        "glMemoryBarrier's bits name how the data is read next.",
        "shared memory plus barrier() lets a group cooperate; every invocation must reach each barrier().",
        "An SSBO can be written by compute and read as vertices without ever leaving the GPU.",
      ]} />
    </Article>
  );
}
