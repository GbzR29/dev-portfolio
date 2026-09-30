"use client";

// OpenGL track — "The Graphics Pipeline": why a pipeline (massively parallel
// stages); the stages, fixed or programmable, and who writes each; one
// triangle through every stage (figure); the vertex shader; clip space, w and
// NDC (2D and 3D figures); primitive assembly and clipping; the viewport
// transform, with a worked example; rasterization, pixel centres, fragments
// and barycentric interpolation (figure); the fragment shader; per-fragment
// operations; how shaders are compiled and linked; counting the work; common
// mistakes.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { InteractiveNDC2D } from "@/components/lesson/figures/ndc/InteractiveNDC2D";
import { InteractiveNDC3D } from "@/components/lesson/figures/ndc/InteractiveNDC3D";
import { PipelineWalkFigure } from "@/components/lesson/figures/glintro/PipelineWalkFigure";
import { RasterFigure } from "@/components/lesson/figures/glintro/RasterFigure";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";

const r = String.raw;

export function PipelineContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglPipe_intro",
          "Your program describes a scene as numbers: the corners of triangles, their colours, their texture coordinates. The screen is a grid of pixels. The graphics pipeline is the fixed sequence of steps the GPU applies to turn the first into the second, and every OpenGL call you will ever make either feeds this pipeline or configures one of its steps. This chapter follows a single triangle through every step, with real numbers at each one, so that the rest of the track always has a place to put each new idea.")}
      </Lead>

      <H2>{tx(t, "oglPipe_whyTitle", "Why a pipeline")}</H2>
      <p>
        {tx(t, "oglPipe_whyBody",
          "A pipeline is an assembly line: each stage does one job and hands its result to the next. The GPU is built this way because the jobs are the same for every vertex and every pixel, and the vertices and pixels do not depend on each other. So each stage runs on thousands of items at the same time. A modern GPU has thousands of small cores; while the vertex stage processes one batch of vertices, the rasterizer turns earlier triangles into pixels and the fragment stage colours pixels of earlier triangles still. The price of this speed is rigidity: a vertex shader cannot look at other vertices, a fragment shader cannot see the neighbouring pixel's result, and data flows in one direction only.")}
      </p>

      <H2>{tx(t, "oglPipe_stagesTitle", "The stages")}</H2>
      <p>
        {tx(t, "oglPipe_stagesBody",
          "Some stages are fixed-function: built into the hardware, you can only configure them with OpenGL calls. Others are programmable: you supply a small program, a shader, written in GLSL (the OpenGL Shading Language). Two shaders are required for any drawing, the vertex shader and the fragment shader; the others are optional and appear much later in the track.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglPipe_tStage", "Stage"), tx(t, "oglPipe_tKind", "Kind"), tx(t, "oglPipe_tJob", "Job")]}
        rows={[
          [tx(t, "oglPipe_st1", "Vertex fetch"), tx(t, "oglPipe_fixed", "fixed"), tx(t, "oglPipe_st1b", "reads each vertex's attributes from your buffers, as described by the vertex array object (VBO and VAO chapters)")],
          [tx(t, "oglPipe_st2", "Vertex shader"), tx(t, "oglPipe_prog", "programmable, required"), tx(t, "oglPipe_st2b", "once per vertex: computes its position on screen and any values to pass on")],
          [tx(t, "oglPipe_st3", "Tessellation, geometry shader"), tx(t, "oglPipe_opt", "programmable, optional"), tx(t, "oglPipe_st3b", "create or change primitives on the GPU (Geometry Shader and Tessellation chapters)")],
          [tx(t, "oglPipe_st4", "Primitive assembly, clipping"), tx(t, "oglPipe_fixed", "fixed"), tx(t, "oglPipe_st4b", "groups vertices into triangles, lines or points, and cuts away what lies outside the visible volume")],
          [tx(t, "oglPipe_st5", "Viewport transform"), tx(t, "oglPipe_fixed", "fixed"), tx(t, "oglPipe_st5b", "maps the −1…+1 coordinates to window pixels, as set by glViewport")],
          [tx(t, "oglPipe_st6", "Rasterization"), tx(t, "oglPipe_fixed", "fixed"), tx(t, "oglPipe_st6b", "finds the pixels each triangle covers and makes a fragment for each, with interpolated values")],
          [tx(t, "oglPipe_st7", "Fragment shader"), tx(t, "oglPipe_prog", "programmable, required"), tx(t, "oglPipe_st7b", "once per fragment: computes its colour")],
          [tx(t, "oglPipe_st8", "Per-fragment operations"), tx(t, "oglPipe_fixed", "fixed"), tx(t, "oglPipe_st8b", "scissor, stencil and depth tests, then blending, decide whether and how each fragment is written into the framebuffer")],
        ]}
      />
      <p>
        {tx(t, "oglPipe_walkIntro",
          "Step through the stages with a concrete triangle. One of its vertices lies outside the visible area on purpose, and a grey box is already in the framebuffer, so that clipping and the depth test have something to do.")}
      </p>

      <PipelineWalkFigure t={t} />

      <H2>{tx(t, "oglPipe_vsTitle", "The vertex shader")}</H2>
      <p>
        {tx(t, "oglPipe_vsBody",
          "The vertex shader runs once for every vertex of every draw call, and each run sees only its own vertex. Its inputs are the vertex's attributes, declared with in; here one attribute, the position, arrives at location 0 (the VAO chapter connects that number to a buffer). Its one required job is to write the vertex's final position to the built-in variable gl_Position, a vec4: four floats x, y, z and w. For now we pass the position through unchanged and set w to 1.0; the Transformations section will multiply it by matrices here to move, rotate and project the model.")}
      </p>
      <CodeBlock lang="glsl" filename="vertex.glsl" t={t}>{`#version 460 core                         // GLSL 4.60, Core profile

layout (location = 0) in vec3 aPos;       // attribute 0: the position, 3 floats

void main() {
    gl_Position = vec4(aPos, 1.0);        // x, y, z from the buffer, w = 1
}`}</CodeBlock>

      <H2>{tx(t, "oglPipe_ndcTitle", "Clip space, w and normalized device coordinates")}</H2>
      <p>
        {tx(t, "oglPipe_ndcBody",
          "The position written to gl_Position is in clip space. After the vertex shader, the GPU divides x, y and z by w (the perspective divide), which gives normalized device coordinates, NDC. In NDC the visible region is the same for every window: x from −1 (left edge) to +1 (right edge), y from −1 (bottom) to +1 (top), z from −1 (near) to +1 (far). Anything outside is clipped away. With w = 1 the division changes nothing, so for now the numbers you put in the buffer are NDC directly. Later, the projection matrix will set w to the distance from the camera, and the division by w is what makes far things small.")}
      </p>
      <Equation label={tx(t, "oglPipe_eqDivide", "The perspective divide")}
        where={[
          [r`x_c, y_c, z_c, w_c`, tx(t, "oglPipe_wClip", "the clip-space position the vertex shader wrote to gl_Position")],
          [r`x_n, y_n, z_n`, tx(t, "oglPipe_wNdc", "normalized device coordinates, visible when each is between −1 and +1")],
        ]}
        note={tx(t, "oglPipe_eqDivideNote", "With w = 1 (this chapter) NDC equals the vertex shader's x, y, z.")}>
        {r`(x_n,\ y_n,\ z_n) = \left(\frac{x_c}{w_c},\ \frac{y_c}{w_c},\ \frac{z_c}{w_c}\right)`}
      </Equation>
      <p>
        {tx(t, "oglPipe_ndc2dBody",
          "Why not pixels? Because the program then does not need to know the window's size: the same vertices fill the same fraction of any window, and the viewport step converts to pixels at the very end. Drag the vertices of this triangle; a point outside the square is clipped.")}
      </p>

      <InteractiveNDC2D t={t} />

      <Callout type="tip" t={t}>
        {tx(t, "oglPipe_ndcTip",
          "Drag any vertex, or click it to get an X/Y gizmo that moves it along one axis; you can also type exact values. Moving a point past ±1 clips the triangle at the border. The CCW/CW indicator shows the winding order, which the Face Winding & Culling chapter explains.")}
      </Callout>
      <p>
        {tx(t, "oglPipe_ndc3dBody",
          "In 3D, NDC is a cube: every axis from −1 to +1. Rotate the view below to see shapes sitting inside it; the z coordinate becomes the depth used by the depth test.")}
      </p>

      <InteractiveNDC3D t={t} />

      <H2>{tx(t, "oglPipe_assemblyTitle", "Primitive assembly and clipping")}</H2>
      <p>
        {tx(t, "oglPipe_assemblyBody",
          "The vertices now have to be joined. The mode passed to the draw call says how: GL_TRIANGLES takes them three at a time (vertices 0, 1, 2 form a triangle, then 3, 4, 5, …), GL_LINES two at a time, GL_POINTS one at a time. Strip and fan modes reuse vertices between neighbours, and the EBO chapter shows a more flexible way to share them. Each primitive is then clipped against the visible volume: a triangle entirely inside passes untouched, one entirely outside is dropped, and one crossing the border is cut, which can turn it into a polygon that is split back into triangles, as the green vertex in the walkthrough showed. The pipeline can also discard triangles facing away from the camera at this point (face culling, in its own chapter).")}
      </p>

      <H2>{tx(t, "oglPipe_viewportTitle", "The viewport transform")}</H2>
      <p>
        {tx(t, "oglPipe_viewportBody",
          "glViewport(x, y, width, height) tells OpenGL which rectangle of the window to draw into, in pixels, with the origin at the bottom-left corner. The GPU maps NDC to that rectangle with a scale and an offset:")}
      </p>
      <Equation label={tx(t, "oglPipe_eqViewport", "NDC to window coordinates")}
        where={[
          [r`x_n,\ y_n,\ z_n`, tx(t, "oglPipe_wN", "the NDC position, each from −1 to +1")],
          [r`x_0,\ y_0`, tx(t, "oglPipe_wOrigin", "the viewport's bottom-left corner in pixels, the first two arguments of glViewport (usually 0, 0)")],
          [r`W,\ H`, tx(t, "oglPipe_wSize", "the viewport's width and height in pixels")],
          [r`x_w,\ y_w`, tx(t, "oglPipe_wWin", "the window position in pixels, measured from the bottom-left corner")],
          [r`z_w`, tx(t, "oglPipe_wDepth", "the depth written to the depth buffer, from 0 (near) to 1 (far) with the default glDepthRange")],
        ]}
        note={tx(t, "oglPipe_eqViewportNote", "Adding 1 moves the range −1…+1 to 0…2, halving gives 0…1, and multiplying by the size gives pixels.")}>
        {r`x_w = x_0 + \frac{x_n + 1}{2}\,W, \qquad y_w = y_0 + \frac{y_n + 1}{2}\,H, \qquad z_w = \frac{z_n + 1}{2}`}
      </Equation>
      <p>
        {tx(t, "oglPipe_viewportWorked",
          "Worked example. An 800 × 600 window with glViewport(0, 0, 800, 600) and a vertex at NDC (0.5, −0.5, 0). x_w = 0 + (0.5 + 1) / 2 · 800 = 0.75 · 800 = 600. y_w = 0 + (−0.5 + 1) / 2 · 600 = 0.25 · 600 = 150, that is 150 pixels up from the bottom. z_w = (0 + 1) / 2 = 0.5. The centre of NDC, (0, 0), always lands in the centre of the viewport, (400, 300).")}
      </p>

      <H2>{tx(t, "oglPipe_rasterTitle", "Rasterization: from triangles to fragments")}</H2>
      <p>
        {tx(t, "oglPipe_rasterBody",
          "Rasterization decides which pixels a triangle covers. The rule is precise: a pixel is covered when its centre, the point half a pixel in from its corner, lies inside the triangle. For each covered pixel the rasterizer creates a fragment: a candidate for that pixel, carrying its position, its depth and every value the vertex shader passed on, interpolated between the three vertices. A fragment is not yet a pixel; later stages may still throw it away. Drag the triangle and click pixels to see the test and the interpolation at work.")}
      </p>

      <RasterFigure t={t} />

      <p>
        {tx(t, "oglPipe_baryBody",
          "The interpolation uses barycentric weights. Each vertex gets a weight equal to the area of the small triangle opposite it (formed by the pixel centre and the other two vertices), divided by the area of the whole triangle. A centre on top of a vertex gives that vertex weight 1 and the others 0; the centroid gives each one third. Any value the vertex shader outputs is blended with these weights:")}
      </p>
      <Equation label={tx(t, "oglPipe_eqBary", "Interpolating a vertex output across a triangle")}
        where={[
          [r`a_0, a_1, a_2`, tx(t, "oglPipe_wA", "the value (a colour, a texture coordinate…) at vertices 0, 1 and 2")],
          [r`\lambda_i`, tx(t, "oglPipe_wLambda", "the barycentric weight of vertex i: area of the sub-triangle opposite vertex i divided by the triangle's area; every λᵢ is between 0 and 1 inside the triangle")],
          [r`a`, tx(t, "oglPipe_wResult", "the value the fragment shader receives for this fragment")],
        ]}
        note={tx(t, "oglPipe_eqBaryNote", "The weights always add up to 1, so a value that is the same at all three vertices stays exactly that value. In 3D the GPU also corrects the weights for perspective, so textures do not bend on surfaces seen at an angle.")}>
        {r`a = \lambda_0 a_0 + \lambda_1 a_1 + \lambda_2 a_2, \qquad \lambda_0 + \lambda_1 + \lambda_2 = 1`}
      </Equation>

      <H2>{tx(t, "oglPipe_fsTitle", "The fragment shader")}</H2>
      <p>
        {tx(t, "oglPipe_fsBody",
          "The fragment shader runs once for every fragment and computes its colour. It declares its result with out: here a vec4 called FragColor, whose name is up to you. This one ignores its inputs and paints every fragment orange; the First Shaders chapter passes a colour from the vertex shader and lets rasterization interpolate it, as in the figure above.")}
      </p>
      <CodeBlock lang="glsl" filename="fragment.glsl" t={t}>{`#version 460 core

out vec4 FragColor;                       // the colour this fragment will have

void main() {
    FragColor = vec4(1.0, 0.5, 0.2, 1.0); // red, green, blue, alpha
}`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "oglPipe_colorTip", "Colours in GLSL are floats from 0.0 to 1.0, not integers from 0 to 255. To convert, divide by 255: rgb(255, 128, 51) is vec4(1.0, 0.502, 0.2, 1.0). The fourth component, alpha, is opacity; it matters only once blending is enabled.")}
      </Callout>

      <H2>{tx(t, "oglPipe_opsTitle", "Per-fragment operations")}</H2>
      <p>
        {tx(t, "oglPipe_opsBody",
          "Before a fragment's colour reaches the framebuffer it passes a series of fixed tests, each switched on with glEnable and configured with its own calls. A fragment that fails any test is discarded. In order: the scissor test (is it inside a rectangle you chose?), the stencil test (does the stencil buffer allow it? Stencil Testing chapter), the depth test (is it nearer than what is already there? Depth Testing chapter), and finally blending, which combines its colour with the colour already in the framebuffer instead of replacing it (Blending chapter). All four are off by default, so for now every fragment simply replaces what is there, and whatever is drawn last ends up on top.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "oglPipe_earlyNote", "The order above is the logical one. When the fragment shader cannot change the outcome, GPUs run the depth test before the fragment shader (early depth testing) so that hidden fragments are never shaded. The Depth Testing chapter explains when this is possible.")}
      </Callout>

      <H2>{tx(t, "oglPipe_compileTitle", "How shaders get compiled")}</H2>
      <p>
        {tx(t, "oglPipe_compileBody",
          "Shaders are not compiled by your C++ compiler at build time. Your program hands the GLSL source text to the driver while it runs, and the driver compiles it on the CPU into the machine code of the GPU that is actually installed. That is why the same program runs on NVIDIA, AMD and Intel cards. Compiling and linking are two separate steps, and each can fail on its own:")}
      </p>
      <CodeBlock lang="cpp" filename="shader_compile.cpp" t={t}>{`unsigned int vertexShader = glCreateShader(GL_VERTEX_SHADER);
glShaderSource(vertexShader, 1, &vertexShaderSource, NULL);   // hand over the text
glCompileShader(vertexShader);                                // GLSL → GPU code

int success;
glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &success);    // did it compile?
if (!success) {
    char infoLog[512];
    glGetShaderInfoLog(vertexShader, 512, NULL, infoLog);     // the error, with line number
    std::cerr << "Shader compile error: " << infoLog << std::endl;
}
// ... the same for fragmentShader ...

unsigned int shaderProgram = glCreateProgram();
glAttachShader(shaderProgram, vertexShader);
glAttachShader(shaderProgram, fragmentShader);
glLinkProgram(shaderProgram);                                 // connect the stages

// Linking can fail too (e.g. an 'in' with no matching 'out'): check it separately
glGetProgramiv(shaderProgram, GL_LINK_STATUS, &success);
if (!success) {
    char infoLog[512];
    glGetProgramInfoLog(shaderProgram, 512, NULL, infoLog);
    std::cerr << "Program link error: " << infoLog << std::endl;
}
glDeleteShader(vertexShader);     // the program keeps what it needs
glDeleteShader(fragmentShader);`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "oglPipe_compileWarn", "Always check for compile and link errors during development. A typo in GLSL produces no C++ error at all; without the check you just get a black screen. The info log names the exact line that failed.")}
      </Callout>

      <H2>{tx(t, "oglPipe_countTitle", "Counting the work")}</H2>
      <p>
        {tx(t, "oglPipe_countBody",
          "A useful habit is to estimate how often each shader runs. Draw one triangle that covers the whole of a 1920 × 1080 window: the vertex shader runs 3 times, the fragment shader 1920 × 1080 = 2 073 600 times, once per covered pixel. Draw a detailed model of 100 000 vertices that fills a small corner of 200 × 200 pixels: the vertex shader runs 100 000 times, the fragment shader about 40 000 times. So the cost of a fragment shader grows with the screen area covered, and the cost of a vertex shader with the vertex count. When a frame is slow, this tells you where to look first.")}
      </p>

      <H2>{tx(t, "oglPipe_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglPipe_tMistake", "Mistake"), tx(t, "oglPipe_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglPipe_e1", "Giving vertex positions in pixels"), tx(t, "oglPipe_e1b", "a vertex at (400, 300) is far outside −1…+1 and gets clipped: nothing appears. Use NDC now, and matrices later.")],
          [tx(t, "oglPipe_e2", "Setting w to 0"), tx(t, "oglPipe_e2b", "the perspective divide by zero puts the vertex at infinity; the triangle vanishes or smears across the screen. Use w = 1.0 until the projection chapter.")],
          [tx(t, "oglPipe_e3", "Expecting y to grow downwards"), tx(t, "oglPipe_e3b", "in NDC and window coordinates y grows upwards, from the bottom-left corner, unlike most 2D and UI libraries.")],
          [tx(t, "oglPipe_e4", "Thinking a fragment is a pixel"), tx(t, "oglPipe_e4b", "several triangles can produce fragments for the same pixel; tests and blending decide which one, if any, ends up in it.")],
          [tx(t, "oglPipe_e5", "Not checking compile and link status"), tx(t, "oglPipe_e5b", "a GLSL error gives a silent black screen. Check both, and print the info log.")],
          [tx(t, "oglPipe_e6", "Forgetting glViewport after a resize"), tx(t, "oglPipe_e6b", "NDC is still mapped to the old rectangle, so the picture is squashed or cut off. Update it in the framebuffer-size callback.")],
        ]}
      />

      <KeyIdeas t={t} id="oglPipe" items={[
        "The pipeline is a fixed sequence of stages running in parallel over thousands of vertices and pixels; data flows one way.",
        "Only the vertex and fragment shaders are required programmable stages; the rest are fixed-function and only configured.",
        "The vertex shader runs once per vertex and must write gl_Position; dividing by w gives NDC, where the visible range is −1 to +1 on every axis.",
        "Primitive assembly groups vertices by the draw mode; clipping cuts away everything outside the visible volume.",
        "The viewport transform maps NDC to pixels: x_w = x₀ + (x_n + 1) / 2 · W, with y measured up from the bottom.",
        "Rasterization makes a fragment for every pixel whose centre is inside the triangle, with values interpolated by barycentric weights that sum to 1.",
        "The fragment shader runs once per fragment and outputs a colour; scissor, stencil and depth tests and blending then decide what is written.",
        "Shaders are compiled by the driver at run time; always check the compile and link status.",
      ]} />
    </Article>
  );
}
