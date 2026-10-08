// src/lib/tracks/opengl/chapters/tooling.tsx
"use client";

// Debugging OpenGL. (Compute Shaders moved to compute.tsx on 2026-10-01.)

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import { Goals } from "@/components/lesson/Prose";
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

      <Goals t={t} id="oglDebug" items={[
        "Turn on the debug callback and read its messages.",
        "Check for errors with glGetError when there is no debug output.",
        "Name your OpenGL objects so tools show them clearly.",
        "Work through the black-screen checklist.",
      ]} />

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

      <H2>{tx(t, "oglDebug_getErrorTitle", "Without debug output: glGetError")}</H2>
      <p>
        {tx(t, "oglDebug_getErrorBody",
          "Debug output needs OpenGL 4.3 or the KHR_debug extension. macOS stops at 4.1, and some older drivers lack it, so there glGetError is all you have. Each context keeps a set of error flags. A failing call sets a flag and is otherwise ignored: it changes no state (only GL_OUT_OF_MEMORY may leave things undefined). glGetError returns one set flag and clears it, and GL_NO_ERROR once none are left. Two consequences follow. An error is reported by the next glGetError, however many calls later that is, so the culprit may be far away. And several flags can be set at once, so call it in a loop until it returns GL_NO_ERROR."
        )}
      </p>
      <LessonTable
        headers={[tx(t, "oglDebug_eH0", "Error"), tx(t, "oglDebug_eH1", "Typical cause")]}
        rows={[
          ["GL_INVALID_ENUM",                  tx(t, "oglDebug_eE1", "an enum that is not allowed for this parameter, e.g. a mipmap filter as GL_TEXTURE_MAG_FILTER")],
          ["GL_INVALID_VALUE",                 tx(t, "oglDebug_eE2", "a number out of range: a negative size, an attribute index ≥ GL_MAX_VERTEX_ATTRIBS")],
          ["GL_INVALID_OPERATION",             tx(t, "oglDebug_eE3", "the call is not allowed in the current state: drawing with no VAO bound, glUniform with no program in use")],
          ["GL_INVALID_FRAMEBUFFER_OPERATION", tx(t, "oglDebug_eE4", "drawing into or reading from an incomplete framebuffer")],
          ["GL_OUT_OF_MEMORY",                 tx(t, "oglDebug_eE5", "an allocation failed; the state of the object involved is undefined")],
        ]}
      />
      <CodeBlock lang="cpp" filename="check_error.hpp" t={t}>{`GLenum glCheckError_(const char* file, int line) {
    GLenum code, last = GL_NO_ERROR;
    while ((code = glGetError()) != GL_NO_ERROR) {      // drain every set flag
        const char* name = "UNKNOWN";
        switch (code) {
            case GL_INVALID_ENUM:                  name = "INVALID_ENUM"; break;
            case GL_INVALID_VALUE:                 name = "INVALID_VALUE"; break;
            case GL_INVALID_OPERATION:             name = "INVALID_OPERATION"; break;
            case GL_INVALID_FRAMEBUFFER_OPERATION: name = "INVALID_FRAMEBUFFER_OPERATION"; break;
            case GL_OUT_OF_MEMORY:                 name = "OUT_OF_MEMORY"; break;
        }
        std::cerr << "GL " << name << " at " << file << ":" << line << '\\n';
        last = code;
    }
    return last;
}
// A macro, so __FILE__ and __LINE__ are those of the call site
#define glCheckError() glCheckError_(__FILE__, __LINE__)

// Usage: narrow down the culprit by moving the check closer to it
glBindTexture(GL_TEXTURE_2D, tex);
glCheckError();`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "oglDebug_getErrorTip",
          "glGetError is slow: before it can answer, the driver has to catch up on every call issued before it. Modern drivers process your calls on a thread of their own, so each check makes your thread wait for that one. Keep the checks in debug builds only (wrap the macro in #ifndef NDEBUG), and to find an error start with one check per frame, then move it closer to the suspect until it pins down a single call."
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
