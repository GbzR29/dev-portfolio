"use client";

// OpenGL track — "Legacy & Modern OpenGL": what OpenGL is (a specification
// implemented by drivers); the version history with an interactive timeline;
// immediate mode, what each call did and why it was abandoned (call cost,
// resending data, fixed function, implicit state), with a cost figure and a
// worked example; fixed-function vs programmable; Core vs Compatibility
// profiles and macOS; the modern principles; OpenGL's relatives today (ES,
// WebGL, Vulkan); common misconceptions.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { GLTimelineFigure } from "@/components/lesson/figures/glintro/GLTimelineFigure";
import { ImmediateCostFigure } from "@/components/lesson/figures/glintro/ImmediateCostFigure";

export function LegacyContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglLeg_intro",
          "OpenGL is more than thirty years old, and tutorials, books and forum answers from every one of those years are still online. Many of them teach a style that no longer exists in modern OpenGL: glBegin, glVertex, built-in lighting. This chapter explains what OpenGL is, how it changed and why, so that you can recognise old code when you meet it, and so that the design of the modern API, which the rest of this track teaches, makes sense instead of looking like needless ceremony.")}
      </Lead>

      <H2>{tx(t, "oglLeg_whatTitle", "What OpenGL actually is")}</H2>
      <p>
        {tx(t, "oglLeg_whatBody",
          "OpenGL is a specification: a long document, maintained by the Khronos Group (an industry consortium), that lists C functions such as glDrawArrays and describes exactly what each must do. It is not a library anyone downloads. Each GPU vendor writes the code that implements the specification for its own hardware and ships it inside the graphics driver. When your program calls glDrawArrays, it is calling into NVIDIA's, AMD's, Intel's or Apple's driver, which translates the request into commands for that particular GPU. This is why the same program runs on very different hardware, why the chapter on setup has to look the functions up at run time, and why bugs sometimes appear on one vendor's driver and not another's.")}
      </p>
      <p>
        {tx(t, "oglLeg_versionsBody",
          "The specification has versions. Each version adds features, and a driver advertises the highest version it implements; a program asks for a version when it creates its context (next chapter). OpenGL started in 1992 at Silicon Graphics as an open version of their own IRIS GL, and its last version, 4.6, came out in 2017. Explore the timeline: each version changed which parts of the pipeline you could program and how vertex data reached the GPU.")}
      </p>

      <GLTimelineFigure t={t} />

      <H2>{tx(t, "oglLeg_immTitle", "Immediate mode: how OpenGL 1.0 drew a triangle")}</H2>
      <p>
        {tx(t, "oglLeg_immBody",
          "The original API sent geometry one vertex at a time. glBegin names the kind of primitive to build (here triangles: every three vertices form one), glEnd closes the batch, and between them each vertex is a function call. The calls that set attributes, such as glColor3f, do not attach to a vertex directly: they change the current colour, a piece of global state, and glVertex3f then emits a vertex that takes whatever the current colour, normal and texture coordinate are at that moment.")}
      </p>
      <CodeBlock lang="cpp" filename="legacy_immediate.cpp" t={t}>{`// OpenGL 1.x, immediate mode. Does not exist in a Core profile context.
glBegin(GL_TRIANGLES);                  // start a batch: every 3 vertices = 1 triangle
  glColor3f(1.0f, 0.0f, 0.0f);          // current colour := red
  glVertex3f(-0.5f, -0.5f, 0.0f);       // emit vertex 0 with the current colour

  glColor3f(0.0f, 1.0f, 0.0f);          // current colour := green
  glVertex3f( 0.5f, -0.5f, 0.0f);       // vertex 1

  glColor3f(0.0f, 0.0f, 1.0f);          // current colour := blue
  glVertex3f( 0.0f,  0.5f, 0.0f);       // vertex 2
glEnd();                                // end of the batch`}</CodeBlock>
      <p>
        {tx(t, "oglLeg_immEasy",
          "It is easy to read, and for a few triangles it is fine. That is why it survived in teaching material for so long. The problems appear when the scene grows.")}
      </p>

      <H2>{tx(t, "oglLeg_whyTitle", "Why it was abandoned")}</H2>
      <LessonTable
        headers={[tx(t, "oglLeg_tProblem", "Problem"), tx(t, "oglLeg_tExplain", "What went wrong")]}
        rows={[
          [tx(t, "oglLeg_p1", "One call per attribute per vertex"), tx(t, "oglLeg_p1b", "a mesh with a million vertices and four attributes (position, colour, texture coordinate, normal) costs four million function calls, every frame, on one CPU thread. The driver gathered the vertices into buffers, so they did not cross to the GPU one by one, but the calls themselves were the bottleneck.")],
          [tx(t, "oglLeg_p2", "Nothing stayed on the GPU"), tx(t, "oglLeg_p2b", "a level that never changes was still sent from scratch every frame, because glBegin/glEnd keep nothing between frames. Display lists (1.0) could record a batch for replay, vertex arrays (1.1) cut the calls to one per draw, and vertex buffer objects (1.5) finally let the data live in memory the driver owns, usually on the GPU. That last path is the only one left in modern OpenGL.")],
          [tx(t, "oglLeg_p3", "Fixed-function pipeline"), tx(t, "oglLeg_p3b", "transforming vertices, lighting and texturing were built-in functions with switches and parameters. You could turn on up to 8 lights and choose their colours, but the lighting formula itself (per-vertex Gouraud shading) was fixed. Any effect the designers had not foreseen, such as per-pixel lighting, toon shading or shadows, needed tricks or was impossible.")],
          [tx(t, "oglLeg_p4", "Hidden, global state"), tx(t, "oglLeg_p4b", "the current colour, the current matrices and the enabled switches were global. Forgetting to set the colour before a vertex silently reused the last one, and a function that enabled lighting could change how unrelated code drew. Bugs appeared far from their cause.")],
        ]}
      />
      <p>
        {tx(t, "oglLeg_costBody",
          "The first two problems are easy to quantify. The figure counts, for the same mesh drawn three ways, the function calls made in one frame and the vertex bytes handed to the driver every second.")}
      </p>

      <ImmediateCostFigure t={t} />

      <H3>{tx(t, "oglLeg_workedTitle", "Worked example")}</H3>
      <p>
        {tx(t, "oglLeg_worked",
          "A character model with 100 000 vertices, each with a position (3 floats), a colour (3 floats), a texture coordinate (2 floats) and a normal (3 floats): 3 + 3 + 2 + 3 = 11 floats of 4 bytes, 44 bytes per vertex. In immediate mode one frame costs 100 000 × 4 = 400 000 attribute calls plus glBegin and glEnd. At about 25 nanoseconds per call that is 400 000 × 25 ns = 10 000 000 ns = 10 ms, more than half of the 16.7 ms a 60 fps frame may take, for one model, before anything else happens. The data sent is 100 000 × 44 = 4 400 000 bytes per frame, 4.4 MB × 60 = 264 MB every second. With a VBO the same 4.4 MB are uploaded once when the model loads, and each frame sends one draw command of a few bytes.")}
      </p>

      <H2>{tx(t, "oglLeg_progTitle", "From fixed function to shaders")}</H2>
      <p>
        {tx(t, "oglLeg_progBody",
          "OpenGL 2.0 (2004) introduced GLSL, the OpenGL Shading Language: small programs, written in a C-like language and run on the GPU, that replace two fixed stages. A vertex shader runs once for every vertex and decides where it ends up on screen; a fragment shader runs once for every pixel a triangle covers and decides its colour. Instead of choosing among built-in lighting options, you write the formula. Everything in the Lighting sections of this track, from Phong to PBR, is only possible because of this change. Later versions made more stages programmable (geometry, tessellation) and added compute shaders, but some stages stay fixed in every API to this day: turning triangles into pixels (rasterization), the depth and stencil tests, and blending. You configure those, you do not program them.")}
      </p>

      <H2>{tx(t, "oglLeg_coreTitle", "Core and Compatibility profiles")}</H2>
      <p>
        {tx(t, "oglLeg_coreBody",
          "For a few years both worlds coexisted: a 2.x program could mix glBegin with shaders. OpenGL 3.0 (2008) marked the old functions as deprecated, 3.1 removed them, and 3.2 (2009) settled the split into two profiles, chosen when the context is created:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglLeg_tProfile", "Profile"), tx(t, "oglLeg_tLegacy", "Legacy API"), tx(t, "oglLeg_tUse", "Use it for")]}
        rows={[
          [tx(t, "oglLeg_coreLabel", "Core"), tx(t, "oglLeg_coreHas", "removed: calling glBegin is an error, and drawing requires shaders, buffers and a vertex array object"), tx(t, "oglLeg_coreUse", "every new program, and everything in this track")],
          [tx(t, "oglLeg_compatLabel", "Compatibility"), tx(t, "oglLeg_compatHas", "still available, mixed with the modern API"), tx(t, "oglLeg_compatUse", "keeping old programs running. Not available on macOS, which offers either legacy 2.1 or a Core context")],
        ]}
      />
      <CodeBlock lang="cpp" filename="core_profile.cpp" t={t}>{`// GLFW: ask for a 4.6 Core profile context (the next chapter explains every line)
glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 6);
glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);   // no legacy API`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "oglLeg_macNote", "macOS stops at OpenGL 4.1 Core: Apple deprecated OpenGL in 2018 and never implemented 4.2 or later. Chapters that need 4.3 or newer (the debug callback, compute shaders, direct state access) say so, and the setup chapter shows how to request 4.1 there.")}
      </Callout>

      <H2>{tx(t, "oglLeg_modernTitle", "The modern way, in one table")}</H2>
      <p>{tx(t, "oglLeg_modernBody", "Each legacy habit has a modern replacement, and each replacement is a chapter of this section:")}</p>
      <LessonTable
        headers={[tx(t, "oglLeg_tOld", "Legacy"), tx(t, "oglLeg_tNew", "Modern"), tx(t, "oglLeg_tWhy", "Why it is better")]}
        rows={[
          [tx(t, "oglLeg_old1", "glVertex per vertex, every frame"), tx(t, "oglLeg_new1", "a vertex buffer object, uploaded once"), tx(t, "oglLeg_why1", "the data stays in GPU memory; a frame sends only commands")],
          [tx(t, "oglLeg_old2", "vertex format implied by the calls"), tx(t, "oglLeg_new2", "a vertex array object describing the buffer's layout"), tx(t, "oglLeg_why2", "the layout is set up once and bound with one call")],
          [tx(t, "oglLeg_old3", "built-in lighting and texturing"), tx(t, "oglLeg_new3", "vertex and fragment shaders in GLSL"), tx(t, "oglLeg_why3", "any formula you can write, running on the GPU")],
          [tx(t, "oglLeg_old4", "current colour, current matrix"), tx(t, "oglLeg_new4", "vertex attributes and uniforms declared in the shader"), tx(t, "oglLeg_why4", "every input is named and explicit")],
          [tx(t, "oglLeg_old5", "glRotate, glTranslate, gluPerspective"), tx(t, "oglLeg_new5", "matrices computed with GLM and passed as uniforms"), tx(t, "oglLeg_why5", "the maths is yours, visible and testable (Transformations section)")],
        ]}
      />

      <H2>{tx(t, "oglLeg_familyTitle", "OpenGL's family today")}</H2>
      <p>
        {tx(t, "oglLeg_familyBody",
          "OpenGL is finished but not dead: 4.6 is supported by every desktop driver on Windows and Linux, and it remains the gentlest way to learn how GPUs draw. Its relatives carry the same ideas elsewhere. OpenGL ES is the trimmed version for phones and embedded devices. WebGL brings OpenGL ES to the browser: WebGL 2, which every live figure on this site uses, is OpenGL ES 3.0, so the shaders you see running here are nearly the GLSL you will write. Vulkan, from the same Khronos Group, and its peers Direct3D 12 and Metal, are the lower-level successors that hand the driver's work to the application; the Vulkan track starts where this one leaves off.")}
      </p>

      <H2>{tx(t, "oglLeg_mythsTitle", "Common misconceptions")}</H2>
      <LessonTable
        headers={[tx(t, "oglLeg_tMyth", "Misconception"), tx(t, "oglLeg_tReality", "Reality")]}
        rows={[
          [tx(t, "oglLeg_e1", "\"OpenGL is a library I install\""), tx(t, "oglLeg_e1b", "it is a specification; the implementation comes with the GPU driver. What you install are helpers: a window library, a function loader, a maths library.")],
          [tx(t, "oglLeg_e2", "\"A tutorial with glBegin is just simpler\""), tx(t, "oglLeg_e2b", "it teaches an API that a Core context rejects. If code uses glBegin, glMatrixMode, glLight or gluPerspective, it is legacy; look for a modern source.")],
          [tx(t, "oglLeg_e3", "\"Shaders replaced the whole fixed pipeline\""), tx(t, "oglLeg_e3b", "rasterization, the depth and stencil tests and blending are still fixed-function and only configurable, in OpenGL and in every newer API.")],
          [tx(t, "oglLeg_e4", "\"Immediate mode sent every vertex straight to the GPU\""), tx(t, "oglLeg_e4b", "the driver buffered them; the cost was the millions of CPU function calls and resending unchanged data every frame.")],
          [tx(t, "oglLeg_e5", "\"OpenGL is obsolete, learn Vulkan first\""), tx(t, "oglLeg_e5b", "Vulkan assumes you already know what a pipeline, a buffer and a shader are. OpenGL teaches those with far less code; the concepts transfer directly.")],
        ]}
      />

      <KeyIdeas t={t} id="oglLeg" items={[
        "OpenGL is a specification from the Khronos Group; each GPU vendor implements it inside its driver.",
        "Immediate mode (glBegin/glVertex/glEnd) made one call per attribute per vertex and resent everything every frame.",
        "Vertex arrays (1.1) and vertex buffer objects (1.5) cut the calls and let data stay on the GPU; VBOs are the only path left.",
        "GLSL (2.0) made the vertex and fragment stages programmable; rasterization, depth and stencil tests and blending remain fixed-function.",
        "3.0 deprecated the old API, 3.1 removed it, and 3.2 split contexts into Core and Compatibility profiles; this track uses Core.",
        "macOS stops at 4.1 Core, so features from 4.3 onwards are unavailable there.",
        "WebGL 2 is OpenGL ES 3.0 in the browser, and Vulkan is the lower-level successor.",
      ]} />
    </Article>
  );
}
