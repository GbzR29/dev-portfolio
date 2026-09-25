"use client";

// OpenGL track — "Legacy & Modern OpenGL".

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function LegacyContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch00_intro",
          "OpenGL was created in 1992. Over 30 years it went through three eras: Immediate Mode (obsolete), Retained Mode transition, and Modern Core Profile — which this track teaches. Understanding why the old way was abandoned explains every design decision in the modern API."
        )}
      </p>

      <H2>{tx(t, "ch00_historyTitle", "A brief history of OpenGL versions")}</H2>
      <LessonTable
        headers={["Version", "Year", "Key addition"]}
        rows={[
          ["1.0",  "1992", tx(t, "ch00_v10",  "Immediate Mode — glBegin/glEnd, fixed-function pipeline")],
          ["2.0",  "2004", tx(t, "ch00_v20",  "GLSL shaders introduced — but still optional, legacy intact")],
          ["3.0",  "2008", tx(t, "ch00_v30",  "Immediate Mode marked deprecated")],
          ["3.2",  "2009", tx(t, "ch00_v32",  "Core Profile introduced — a clean break from legacy")],
          ["4.5",  "2014", tx(t, "ch00_v45",  "Direct State Access (DSA) — no more blind binding")],
          ["4.6",  "2017", tx(t, "ch00_v46",  "Current version — SPIR-V shaders, last major release")],
        ]}
      />

      <Callout type="info" t={t}>
        {tx(t, "ch00_vulkanNote",
          "Vulkan and Metal are successors for maximum GPU control. Modern OpenGL 4.6 is still the right choice for learning — it exposes core concepts without Vulkan's 800-line boilerplate."
        )}
      </Callout>

      <H2>{tx(t, "ch00_immediateTitle", "Immediate Mode — how it worked")}</H2>
      <p>
        {tx(t, "ch00_immediateBody",
          "In OpenGL 1.x you submitted vertex data one call at a time, between glBegin and glEnd. Every vertex was its own function call crossing the CPU-GPU boundary."
        )}
      </p>
      <CodeBlock lang="cpp" filename="legacy_immediate.cpp" t={t}>{`// OpenGL 1.x — Immediate Mode (DO NOT USE)
// This was removed in Core Profile 3.2

glBegin(GL_TRIANGLES);
  glColor3f(1.0f, 0.0f, 0.0f);        // set color for next vertex
  glVertex3f(-0.5f, -0.5f, 0.0f);     // v0

  glColor3f(0.0f, 1.0f, 0.0f);
  glVertex3f( 0.5f, -0.5f, 0.0f);     // v1

  glColor3f(0.0f, 0.0f, 1.0f);
  glVertex3f( 0.0f,  0.5f, 0.0f);     // v2
glEnd();`}</CodeBlock>

      <H2>{tx(t, "ch00_whyBadTitle", "Why Immediate Mode was abandoned")}</H2>
      <p>{tx(t, "ch00_whyBadBody", "The problems were architectural, not superficial:")}</p>
      <ul className="space-y-3 ml-1">
        {[
          [tx(t, "ch00_bad1title", "CPU-GPU bottleneck"), tx(t, "ch00_bad1body", "Every glVertex3f call crosses the CPU-GPU boundary. 1 million vertices = 1 million function calls. The bus was the bottleneck, not the GPU.")],
          [tx(t, "ch00_bad2title", "Zero parallelism"), tx(t, "ch00_bad2body", "The GPU can process thousands of vertices in parallel, but immediate mode fed them one at a time. 99% of GPU potential was wasted.")],
          [tx(t, "ch00_bad3title", "Fixed-function pipeline"), tx(t, "ch00_bad3body", "Lighting and blending were hardcoded into the driver. No custom math, no custom effects.")],
          [tx(t, "ch00_bad4title", "Stateful color model"), tx(t, "ch00_bad4body", "glColor3f set a global 'current color'. Forgetting to set it before a vertex silently used the last color — notoriously hard bugs.")],
        ].map(([title, body], i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-md bg-red-500/10 border border-red-500/25 flex items-center justify-center font-mono text-[9px] font-bold text-red-400 mt-0.5">
              {i+1}
            </span>
            <span>
              <strong className="text-[var(--text-main)] text-sm">{title}. </strong>
              {body}
            </span>
          </li>
        ))}
      </ul>

      <H2>{tx(t, "ch00_coreTitle", "Core Profile vs Compatibility Profile")}</H2>
      <p>
        {tx(t, "ch00_coreBody",
          "OpenGL 3.2 split into two modes. You choose which at context creation (GLFW window hints)."
        )}
      </p>
      <LessonTable
        headers={[tx(t, "ch00_profileHeader0", "Profile"), tx(t, "ch00_profileHeader1", "Legacy API"), tx(t, "ch00_profileHeader2", "Use case")]}
        rows={[
          [tx(t, "ch00_coreLabel",   "Core"),          tx(t, "ch00_coreHasLegacy",   "Removed"),   tx(t, "ch00_coreUse",   "New projects — everything in this track")],
          [tx(t, "ch00_compatLabel", "Compatibility"), tx(t, "ch00_compatHasLegacy", "Available"), tx(t, "ch00_compatUse", "Maintaining old codebases only")],
        ]}
      />
      <CodeBlock lang="cpp" filename="core_profile.cpp" t={t}>{`// GLFW: request a Core Profile context (required for modern OpenGL)
glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 6);
glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);  // ← this is the key line
// GLFW_OPENGL_COMPAT_PROFILE would enable legacy code — avoid it`}</CodeBlock>

      <H2>{tx(t, "ch00_modernTitle", "Modern OpenGL: the core ideas")}</H2>
      <p>
        {tx(t, "ch00_modernBody",
          "Three principles replace Immediate Mode:"
        )}
      </p>
      <LessonTable
        headers={[tx(t, "ch00_modernHeader0", "Old way"), tx(t, "ch00_modernHeader1", "Modern way"), tx(t, "ch00_modernHeader2", "Why")]}
        rows={[
          [tx(t, "ch00_old1", "glVertex per vertex"), tx(t, "ch00_new1", "VBO — upload all at once"), tx(t, "ch00_why1", "One bus transfer instead of N")],
          [tx(t, "ch00_old2", "Fixed lighting model"), tx(t, "ch00_new2", "GLSL fragment shader"), tx(t, "ch00_why2", "Programmable — any math you want")],
          [tx(t, "ch00_old3", "glColor / global state"), tx(t, "ch00_new3", "Vertex attributes + uniforms"), tx(t, "ch00_why3", "Explicit, per-draw, no hidden state")],
        ]}
      />

      <Callout type="tip" t={t}>
        {tx(t, "ch00_gluNote",
          "GLU functions like gluPerspective and gluLookAt were companion helpers for Immediate Mode. In modern OpenGL they are replaced by GLM — the same math as proper mat4 objects you pass as uniforms."
        )}
      </Callout>

    </article>
  );
}
