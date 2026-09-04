// src/lib/tracks/opengl/chapters/tooling.tsx
"use client";

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ── Debugging OpenGL ─────────────────────────────────────────────────────────

export function DebuggingContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglDebug_intro",
          "OpenGL fails silently. A wrong enum, a buffer bound to the wrong target, a uniform set on the wrong program — none of it throws, none of it prints anything, and the result is a black screen with no information. This chapter is about making the API tell you what went wrong, because doing that once is worth more than any amount of staring at shader code."
        )}
      </p>

      <H2>{tx(t, "oglDebug_callbackTitle", "The debug callback")}</H2>
      <p>
        {tx(t, "oglDebug_callbackBody",
          "OpenGL 4.3 added a proper debug output: you register one function and the driver calls it with a human-readable message whenever something is wrong, deprecated, or merely slow. This replaces the old habit of sprinkling glGetError everywhere, and it reports far more than glGetError ever could."
        )}
      </p>

      <CodeBlock lang="cpp" filename="debug.cpp" t={t}>{`void APIENTRY glDebugOutput(GLenum source, GLenum type, unsigned int id,
                            GLenum severity, GLsizei /*length*/,
                            const char* message, const void* /*userParam*/) {
    // 131169/131185/131218/131204 are chatty NVIDIA buffer-allocation notices
    if (id == 131169 || id == 131185 || id == 131218 || id == 131204) return;

    const char* sev =
        severity == GL_DEBUG_SEVERITY_HIGH         ? "HIGH"   :
        severity == GL_DEBUG_SEVERITY_MEDIUM       ? "MEDIUM" :
        severity == GL_DEBUG_SEVERITY_LOW          ? "LOW"    : "NOTE";

    std::cerr << "[GL " << sev << "] (" << id << ") " << message << std::endl;

    if (severity == GL_DEBUG_SEVERITY_HIGH) {
        assert(false && "OpenGL error — check the call stack");
    }
}

// After the context is created and GLAD has loaded:
int flags = 0;
glGetIntegerv(GL_CONTEXT_FLAGS, &flags);
if (flags & GL_CONTEXT_FLAG_DEBUG_BIT) {
    glEnable(GL_DEBUG_OUTPUT);
    glEnable(GL_DEBUG_OUTPUT_SYNCHRONOUS);   // callback fires ON the offending call
    glDebugMessageCallback(glDebugOutput, nullptr);
    glDebugMessageControl(GL_DONT_CARE, GL_DONT_CARE, GL_DONT_CARE, 0, nullptr, GL_TRUE);
}`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "oglDebug_syncTip",
          "GL_DEBUG_OUTPUT_SYNCHRONOUS is the part that matters. Without it the driver may report the error much later, from another thread, with a useless call stack. With it, a breakpoint inside the callback lands directly on the gl call that caused the problem. It costs performance, so enable it in debug builds only."
        )}
      </Callout>

      <Callout type="warn" t={t}>
        {tx(t, "oglDebug_contextWarn",
          "The callback only works on a debug context. You must request GLFW_OPENGL_DEBUG_CONTEXT before creating the window — the check against GL_CONTEXT_FLAGS above tells you whether you actually got one, since the driver is allowed to refuse."
        )}
      </Callout>

      <H2>{tx(t, "oglDebug_labelsTitle", "Naming your objects")}</H2>
      <CodeBlock lang="cpp" filename="labels.cpp" t={t}>{`// Turns "Buffer 7" into "terrain VBO" in every error message and in RenderDoc
glObjectLabel(GL_BUFFER,       vbo,     -1, "terrain VBO");
glObjectLabel(GL_VERTEX_ARRAY, vao,     -1, "terrain VAO");
glObjectLabel(GL_PROGRAM,      program, -1, "terrain shader");
glObjectLabel(GL_TEXTURE,      albedo,  -1, "terrain albedo");

// Group draw calls into named regions in the capture timeline
glPushDebugGroup(GL_DEBUG_SOURCE_APPLICATION, 0, -1, "Shadow pass");
renderShadows();
glPopDebugGroup();`}</CodeBlock>

      <H2>{tx(t, "oglDebug_blackTitle", "The black screen checklist")}</H2>
      <p>
        {tx(t, "oglDebug_blackBody",
          "When nothing renders and the debug output is quiet, work down this list in order. It catches the overwhelming majority of cases."
        )}
      </p>

      <LessonTable
        headers={[tx(t, "oglDebug_c0", "Check"), tx(t, "oglDebug_c1", "How")]}
        rows={[
          [tx(t, "oglDebug_k1", "Did the shader compile and link?"),  tx(t, "oglDebug_v1", "glGetShaderiv / glGetProgramiv plus the info log. Never skip this.")],
          [tx(t, "oglDebug_k2", "Is the VAO bound at draw time?"),    tx(t, "oglDebug_v2", "Core profile draws nothing with VAO 0 bound.")],
          [tx(t, "oglDebug_k3", "Is the geometry in view?"),          tx(t, "oglDebug_v3", "Hardcode gl_Position to a known NDC triangle. If that draws, the problem is your matrices.")],
          [tx(t, "oglDebug_k4", "Is it facing away?"),                tx(t, "oglDebug_v4", "glDisable(GL_CULL_FACE). If it appears, the winding order is wrong.")],
          [tx(t, "oglDebug_k5", "Is it behind the near plane?"),      tx(t, "oglDebug_v5", "Move the camera back, or widen the frustum.")],
          [tx(t, "oglDebug_k6", "Is it black rather than absent?"),   tx(t, "oglDebug_v6", "Output a constant red from the fragment shader. Red means lighting; still nothing means geometry.")],
          [tx(t, "oglDebug_k7", "Is the texture actually bound?"),    tx(t, "oglDebug_v7", "An unbound sampler2D reads black. Check glActiveTexture and the sampler uniform value.")],
          [tx(t, "oglDebug_k8", "Is depth testing eating it?"),       tx(t, "oglDebug_v8", "Is GL_DEPTH_BUFFER_BIT in your glClear?")],
        ]}
      />

      <CodeBlock lang="cpp" filename="shader_checks.cpp" t={t}>{`bool checkCompile(unsigned int shader, const char* name) {
    int ok = 0;
    glGetShaderiv(shader, GL_COMPILE_STATUS, &ok);
    if (!ok) {
        int len = 0;
        glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &len);
        std::string log(len, '\\0');
        glGetShaderInfoLog(shader, len, nullptr, log.data());
        std::cerr << name << " compile failed:\\n" << log << std::endl;
    }
    return ok;
}

bool checkLink(unsigned int program) {
    int ok = 0;
    glGetProgramiv(program, GL_LINK_STATUS, &ok);
    if (!ok) {
        int len = 0;
        glGetProgramiv(program, GL_INFO_LOG_LENGTH, &len);
        std::string log(len, '\\0');
        glGetProgramInfoLog(program, len, nullptr, log.data());
        std::cerr << "link failed:\\n" << log << std::endl;
    }
    return ok;
}`}</CodeBlock>

      <H2>{tx(t, "oglDebug_toolsTitle", "Tools")}</H2>
      <LessonTable
        headers={[tx(t, "oglDebug_t0", "Tool"), tx(t, "oglDebug_t1", "What it gives you")]}
        rows={[
          ["RenderDoc",       tx(t, "oglDebug_w1", "Capture a frame and step through every draw call: bound state, buffer contents, textures, and the output after each one. The single most valuable graphics tool there is.")],
          ["Nsight / Radeon GPU Profiler", tx(t, "oglDebug_w2", "Vendor profilers. Where the GPU time actually goes, per stage.")],
          ["glslangValidator", tx(t, "oglDebug_w3", "Validates GLSL at build time instead of at runtime. Put it in CI.")],
          ["apitrace",        tx(t, "oglDebug_w4", "Records every GL call to a file and replays it. Good for bugs that only reproduce on someone else's machine.")],
        ]}
      />

      <Callout type="tip" t={t}>
        {tx(t, "oglDebug_renderdocTip",
          "Learn RenderDoc before you need it. Capturing a working frame and reading through the pipeline state teaches you more about how OpenGL actually behaves than any article — and once a bug appears, you are already fluent in the tool that finds it in two minutes."
        )}
      </Callout>

    </article>
  );
}

// ── Compute Shaders ──────────────────────────────────────────────────────────

export function ComputeContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglCompute_intro",
          "Every shader so far sat inside the rasterization pipeline: it received vertices or fragments and had to produce geometry or colour. A compute shader has no pipeline around it. You dispatch a grid of threads, they read and write buffers and images, and that is the whole model. It is how particle simulation, culling, physics and image processing move onto the GPU."
        )}
      </p>

      <H2>{tx(t, "oglCompute_modelTitle", "The execution model")}</H2>
      <p>
        {tx(t, "oglCompute_modelBody",
          "Work is organized in two levels. You dispatch work groups; each work group runs a fixed number of invocations declared in the shader. Invocations inside a group can share memory and synchronize with each other. Invocations in different groups cannot — they may not even run at the same time."
        )}
      </p>

      <LessonTable
        headers={[tx(t, "oglCompute_h0", "Built-in"), tx(t, "oglCompute_h1", "Meaning")]}
        rows={[
          ["gl_GlobalInvocationID",  tx(t, "oglCompute_b1", "Unique index across the whole dispatch. Usually your data index.")],
          ["gl_LocalInvocationID",   tx(t, "oglCompute_b2", "Index within the work group. Used to address shared memory.")],
          ["gl_WorkGroupID",         tx(t, "oglCompute_b3", "Which work group this invocation belongs to.")],
          ["gl_NumWorkGroups",       tx(t, "oglCompute_b4", "The dispatch dimensions you passed to glDispatchCompute.")],
        ]}
      />

      <H2>{tx(t, "oglCompute_writeTitle", "Writing into a texture")}</H2>
      <CodeBlock lang="glsl" filename="gradient.comp" t={t}>{`#version 460 core

layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;
layout (rgba32f, binding = 0) uniform image2D uOutput;

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

      <CodeBlock lang="cpp" filename="dispatch.cpp" t={t}>{`// The texture must be created with an immutable, image-compatible format
unsigned int tex;
glGenTextures(1, &tex);
glBindTexture(GL_TEXTURE_2D, tex);
glTexStorage2D(GL_TEXTURE_2D, 1, GL_RGBA32F, W, H);   // NOT glTexImage2D
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

glUseProgram(computeProgram);
glBindImageTexture(0, tex, 0, GL_FALSE, 0, GL_WRITE_ONLY, GL_RGBA32F);

// Round UP — 1920/16 is exact, but 1921 would lose a column without the +15
glDispatchCompute((W + 15) / 16, (H + 15) / 16, 1);

// Wait for the writes to be visible to the next stage
glMemoryBarrier(GL_SHADER_IMAGE_ACCESS_BARRIER_BIT | GL_TEXTURE_FETCH_BARRIER_BIT);

// Now sample it like any other texture
glUseProgram(drawProgram);
glBindTexture(GL_TEXTURE_2D, tex);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglCompute_barrierWarn",
          "glMemoryBarrier is not optional and forgetting it is the defining compute-shader bug. The dispatch is asynchronous: without a barrier the next draw may read the texture before the compute writes have landed, and the result is a flickering or one-frame-stale image that looks intermittent and hardware-dependent. Pick the barrier bits matching how you will read the data."
        )}
      </Callout>

      <H2>{tx(t, "oglCompute_ssboTitle", "SSBOs — the real workhorse")}</H2>
      <p>
        {tx(t, "oglCompute_ssboBody",
          "Shader storage buffers are readable and writable from the shader, can be hundreds of megabytes, and support a runtime-sized trailing array. They are how you keep a particle system, a culling result or a spatial grid entirely on the GPU."
        )}
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
    if (i >= particles.length()) return;

    particles[i].velocity.y -= 9.81 * uDt;
    particles[i].position    += particles[i].velocity * uDt;

    if (particles[i].position.y < 0.0) {
        particles[i].position.y = 0.0;
        particles[i].velocity.y *= -0.6;    // bounce
    }
}`}</CodeBlock>

      <CodeBlock lang="cpp" filename="ssbo.cpp" t={t}>{`unsigned int ssbo;
glGenBuffers(1, &ssbo);
glBindBuffer(GL_SHADER_STORAGE_BUFFER, ssbo);
glBufferData(GL_SHADER_STORAGE_BUFFER, particles.size() * sizeof(Particle),
             particles.data(), GL_DYNAMIC_DRAW);
glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 0, ssbo);   // binding = 0

glUseProgram(computeProgram);
glUniform1f(glGetUniformLocation(computeProgram, "uDt"), dt);
glDispatchCompute((particleCount + 255) / 256, 1, 1);
glMemoryBarrier(GL_SHADER_STORAGE_BARRIER_BIT | GL_VERTEX_ATTRIB_ARRAY_BARRIER_BIT);

// The same buffer can be bound as a vertex buffer — the data never leaves the GPU
glBindBuffer(GL_ARRAY_BUFFER, ssbo);
glDrawArraysInstanced(GL_POINTS, 0, 1, particleCount);`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "oglCompute_sizeTip",
          "Make the local size a multiple of the hardware's wavefront width: 32 on NVIDIA, 64 on AMD. 64 or 256 is a safe default that wastes no lanes on either. A local size of 1 runs at a fraction of the throughput because most lanes in every wavefront sit idle."
        )}
      </Callout>

      <Callout type="info" t={t}>
        {tx(t, "oglCompute_readbackNote",
          "Reading results back to the CPU with glGetBufferSubData stalls the pipeline: it waits for the GPU to finish everything. If you must read back, do it into a persistently mapped buffer and read it one or two frames later. Better still, keep the data on the GPU — the particle example above never touches the CPU after upload."
        )}
      </Callout>

    </article>
  );
}
