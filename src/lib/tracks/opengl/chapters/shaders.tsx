"use client";

// OpenGL track — "First Shaders": what a shader is and how it runs; the
// anatomy of a GLSL shader; types, constructors and component-wise maths;
// swizzling (figure); passing data between stages (in/out, matching rules,
// interpolation, flat); the live editable triangle (figure); uniforms and the
// glUniform family; the C++ side; a worked interpolation example; common
// mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { SwizzleFigure } from "@/components/lesson/figures/glintro/SwizzleFigure";
import { TriangleShaderFigure } from "@/components/lesson/figures/glintro/TriangleShaderFigure";

export function ShadersContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglSh_intro",
          "The buffer and the vertex array deliver each vertex's position and colour. What happens to them next is up to two small programs you write: the vertex shader and the fragment shader. They are written in GLSL, the OpenGL Shading Language, which looks like C with vector and matrix types built in. This chapter teaches enough GLSL to write both shaders with confidence: its types and the way it works on whole vectors at once, how values travel from one stage to the next, and how your C++ program passes values in. A live editor lets you change the shaders and see the triangle respond.")}
      </Lead>

      <H2>{tx(t, "oglSh_whatTitle", "What a shader is")}</H2>
      <p>
        {tx(t, "oglSh_whatBody",
          "A shader is a function the GPU calls many times in parallel, once per item: the vertex shader once per vertex, the fragment shader once per fragment. Each call, called an invocation, gets its own inputs and produces its own outputs, and invocations cannot talk to each other or remember anything from one frame to the next. This is what lets thousands of them run at the same time. As the Pipeline chapter explained, the driver compiles the GLSL source when your program runs, for the GPU that is installed.")}
      </p>
      <p>{tx(t, "oglSh_anatomyBody", "Every shader has the same parts:")}</p>
      <CodeBlock lang="glsl" filename="vertex.glsl" t={t}>{`#version 460 core                         // 1. the GLSL version, always the first line

layout (location = 0) in vec3 aPos;       // 2. inputs: one value per vertex (attributes)
layout (location = 1) in vec3 aColor;

uniform float uScale;                     // 3. uniforms: one value for the whole draw call

out vec3 vColor;                          // 4. outputs: passed on to the next stage

void main() {                             // 5. main: runs once per invocation
    gl_Position = vec4(aPos * uScale, 1.0);   // built-in output of the vertex shader
    vColor = aColor;
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglSh_tPart", "Part"), tx(t, "oglSh_tMeaning", "Meaning")]}
        rows={[
          ["#version 460 core", tx(t, "oglSh_p1", "which GLSL version the source is written in; 460 matches OpenGL 4.6, core the Core profile. It must be the very first line (only comments and blank lines may come before it).")],
          ["in", tx(t, "oglSh_p2", "an input. In the vertex shader it is a vertex attribute read from a buffer; in the fragment shader it is a value interpolated from the vertex shader's outputs.")],
          ["uniform", tx(t, "oglSh_p3", "a value set from C++ that is the same for every invocation of a draw call: a colour, the time, a transformation matrix.")],
          ["out", tx(t, "oglSh_p4", "an output. From the vertex shader it goes to the rasterizer to be interpolated; from the fragment shader it is the colour written to the framebuffer.")],
          ["gl_Position", tx(t, "oglSh_p5", "a built-in output the vertex shader must write: the clip-space position (Pipeline chapter). Built-in variables start with gl_.")],
        ]}
      />

      <H2>{tx(t, "oglSh_typesTitle", "Types and vector maths")}</H2>
      <p>
        {tx(t, "oglSh_typesBody",
          "GLSL has the scalar types float, int, uint and bool; vectors of 2, 3 or 4 of them (vec2, vec3, vec4 for floats; ivec, uvec and bvec for the others); and square matrices mat2, mat3, mat4. Textures add sampler types, in the Textures chapter. Vectors and matrices are built with constructors that accept any mix of pieces adding up to the right count, and arithmetic works on whole vectors, one component at a time.")}
      </p>
      <CodeBlock lang="glsl" filename="types.glsl" t={t}>{`float f = 1.0;                    // write 1.0, not 1: some GLSL versions refuse to convert
vec3  c = vec3(1.0, 0.5, 0.2);    // three floats
vec3  g = vec3(0.5);              // one value fills all three: (0.5, 0.5, 0.5)
vec4  p = vec4(c, 1.0);           // a vec3 plus one float = four components
mat4  m = mat4(1.0);              // 1.0 on the diagonal: the identity matrix

vec3 sum  = c + g;                // (1.5, 1.0, 0.7): component by component
vec3 half = c * 0.5;              // every component times 0.5
vec3 prod = c * g;                // (0.5, 0.25, 0.1): also component by component
float d   = dot(c, g);            // 0.5 + 0.25 + 0.1 = 0.85: the dot product
vec3 mixd = mix(c, g, 0.25);      // 75% c + 25% g (linear interpolation)`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "oglSh_mulNote", "Multiplying two vectors with * multiplies matching components; it is not the dot or cross product, which have their own functions, dot() and cross(). The GLSL track lists the built-in functions (mix, clamp, smoothstep, length, normalize…) with a plot of each.")}
      </Callout>

      <H3>{tx(t, "oglSh_swizzleTitle", "Swizzling")}</H3>
      <p>
        {tx(t, "oglSh_swizzleBody",
          "The components of a vector are named: x, y, z, w, or equally r, g, b, a for colours, or s, t, p, q for texture coordinates. Writing several names after the dot builds a new vector from those components, in that order. This is called swizzling, and it is how shaders take a vector apart and reassemble it without any loops.")}
      </p>

      <SwizzleFigure t={t} />

      <H2>{tx(t, "oglSh_passTitle", "Passing data between stages")}</H2>
      <p>
        {tx(t, "oglSh_passBody",
          "The vertex shader's out variables and the fragment shader's in variables are connected by name and type when the program is linked. Between the two, the rasterizer interpolates each output across the triangle, so a fragment receives a blend of the three vertices' values, weighted by how close it is to each (the barycentric weights of the Pipeline chapter).")}
      </p>
      <LessonTable
        headers={[tx(t, "oglSh_tQual", "Qualifier"), tx(t, "oglSh_tWhere", "In"), tx(t, "oglSh_tDoes", "Meaning")]}
        rows={[
          ["in", tx(t, "oglSh_q1", "vertex shader"), tx(t, "oglSh_q1b", "a vertex attribute, one value per vertex, from the buffer through the VAO")],
          ["out", tx(t, "oglSh_q1", "vertex shader"), tx(t, "oglSh_q2b", "a value handed to the rasterizer, which interpolates it for every fragment")],
          ["in", tx(t, "oglSh_q3", "fragment shader"), tx(t, "oglSh_q3b", "the interpolated value; its name and type must match a vertex shader out")],
          ["out", tx(t, "oglSh_q3", "fragment shader"), tx(t, "oglSh_q4b", "the colour written to the framebuffer")],
          ["uniform", tx(t, "oglSh_q5", "both"), tx(t, "oglSh_q5b", "a value from C++, the same for every vertex and fragment of the draw call")],
          ["flat", tx(t, "oglSh_q5", "both"), tx(t, "oglSh_q6b", "placed before in/out, turns interpolation off: every fragment gets one vertex's value (the last vertex of the triangle, by default). Integer outputs must be flat.")],
        ]}
      />
      <p>{tx(t, "oglSh_pairBody", "Here is the pair that draws the colour-per-vertex triangle, followed by the same pair running live.")}</p>
      <CodeBlock lang="glsl" filename="vertex_color.glsl" t={t}>{`#version 460 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aColor;

out vec3 vColor;               // to the rasterizer

void main() {
    gl_Position = vec4(aPos, 1.0);
    vColor = aColor;
}`}</CodeBlock>
      <CodeBlock lang="glsl" filename="fragment_color.glsl" t={t}>{`#version 460 core
in  vec3 vColor;               // interpolated: same name and type as the out above
out vec4 FragColor;

void main() {
    FragColor = vec4(vColor, 1.0);
}`}</CodeBlock>

      <TriangleShaderFigure t={t} />

      <H3>{tx(t, "oglSh_workedTitle", "Worked example: one interpolated fragment")}</H3>
      <p>
        {tx(t, "oglSh_worked",
          "Vertex 0 is red, (1.0, 0.27, 0.27); vertex 1 is green, (0.13, 0.77, 0.37). A fragment exactly halfway along the edge between them has barycentric weights 0.5, 0.5 and 0 (the third vertex is on the other side). Its vColor is 0.5 · (1.0, 0.27, 0.27) + 0.5 · (0.13, 0.77, 0.37) + 0 · (blue) = (0.565, 0.52, 0.32): a dull olive, exactly the colour you see midway along the bottom edge of the live triangle. A fragment at the centroid gets a third of each vertex.")}
      </p>

      <H2>{tx(t, "oglSh_uniformTitle", "Uniforms")}</H2>
      <p>
        {tx(t, "oglSh_uniformBody",
          "A uniform is a global variable of the shader that your C++ code sets and that stays constant for a whole draw call: the same value for every vertex and every fragment. Use uniforms for anything that is shared, such as the time, a tint colour, or (from the Transformations section on) the matrices that place a model in the world. Setting one takes two steps: find its location in the linked program by name, then write a value there with the glUniform function that matches its type.")}
      </p>
      <CodeBlock lang="glsl" filename="uniform.glsl" t={t}>{`#version 460 core
out vec4 FragColor;
uniform vec4 uColor;           // set from C++

void main() {
    FragColor = uColor;
}`}</CodeBlock>
      <CodeBlock lang="cpp" filename="set_uniform.cpp" t={t}>{`glUseProgram(shaderProgram);                                  // must be the program in use
GLint loc = glGetUniformLocation(shaderProgram, "uColor");   // -1 if not found
glUniform4f(loc, 1.0f, 0.5f, 0.2f, 1.0f);                     // 4 floats for a vec4

// In the render loop, a value that changes every frame:
glUniform1f(glGetUniformLocation(shaderProgram, "uTime"), (float)glfwGetTime());`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglSh_tFn", "Function"), tx(t, "oglSh_tFor", "For a uniform of type")]}
        rows={[
          ["glUniform1f / 2f / 3f / 4f", tx(t, "oglSh_u1", "float, vec2, vec3, vec4, with the values as separate arguments")],
          ["glUniform3fv (loc, count, ptr)", tx(t, "oglSh_u2", "the same from an array in memory, such as glm::value_ptr(v); count is how many vec3s")],
          ["glUniform1i", tx(t, "oglSh_u3", "int, bool, and sampler (the texture unit number, Textures chapter)")],
          ["glUniformMatrix4fv (loc, count, transpose, ptr)", tx(t, "oglSh_u4", "mat4; transpose = GL_FALSE for GLM's column-major matrices (Transformations chapter)")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "oglSh_useWarn", "glUniform* always writes to the program currently in use, so call glUseProgram first. With no program in use the call fails with GL_INVALID_OPERATION; with a different program in use it writes into that one instead. OpenGL 4.1 added glProgramUniform*, which names the program explicitly and needs no glUseProgram.")}
      </Callout>
      <Callout type="warn" t={t}>
        {tx(t, "oglSh_unusedWarn", "glGetUniformLocation returns −1 when the name does not exist, and also when the uniform exists but is never used: the compiler removes unused uniforms. A glUniform* call with location −1 is silently ignored. So a typo, or a uniform whose only use you commented out while testing, just looks like \"my value has no effect\", with no error at all.")}
      </Callout>
      <Callout type="tip" t={t}>
        {tx(t, "oglSh_classTip", "Looking up a location and calling glUniform* for every value quickly gets repetitive. The GLSL track's Shader Class chapter wraps loading from files, compiling, linking, the error checks and the uniform setters into one small class. Later chapters of this track use that style: shader.use(), then shader.setMat4(\"model\", model).")}
      </Callout>

      <H2>{tx(t, "oglSh_cppTitle", "The C++ side, together")}</H2>
      <p>
        {tx(t, "oglSh_cppBody",
          "Compiling and linking were covered in the Pipeline chapter. Wrapped in a helper, and combined with the VAO from the previous chapter, the setup for the coloured triangle is short. The locations used by glVertexAttribPointer (0 and 1) are the same numbers as the shader's layout(location = …).")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`GLuint compileShader(GLenum type, const char* src) {
    GLuint s = glCreateShader(type);
    glShaderSource(s, 1, &src, nullptr);
    glCompileShader(s);
    GLint ok = 0;
    glGetShaderiv(s, GL_COMPILE_STATUS, &ok);
    if (!ok) {
        char log[1024];
        glGetShaderInfoLog(s, sizeof log, nullptr, log);
        std::fprintf(stderr, "%s shader:\\n%s\\n", type == GL_VERTEX_SHADER ? "vertex" : "fragment", log);
    }
    return s;
}

GLuint makeProgram(const char* vsSrc, const char* fsSrc) {
    GLuint vs = compileShader(GL_VERTEX_SHADER, vsSrc);
    GLuint fs = compileShader(GL_FRAGMENT_SHADER, fsSrc);
    GLuint p = glCreateProgram();
    glAttachShader(p, vs);
    glAttachShader(p, fs);
    glLinkProgram(p);
    GLint ok = 0;
    glGetProgramiv(p, GL_LINK_STATUS, &ok);
    if (!ok) {
        char log[1024];
        glGetProgramInfoLog(p, sizeof log, nullptr, log);
        std::fprintf(stderr, "link:\\n%s\\n", log);
    }
    glDeleteShader(vs);            // the program keeps its own copy
    glDeleteShader(fs);
    return p;
}`}</CodeBlock>

      <H2>{tx(t, "oglSh_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglSh_tMistake", "Mistake"), tx(t, "oglSh_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglSh_e1", "Anything before #version"), tx(t, "oglSh_e1b", "a compile error: the version line must come first. Watch for a stray blank character when loading from a file with a byte-order mark.")],
          [tx(t, "oglSh_e2", "An out and an in with different names or types"), tx(t, "oglSh_e2b", "a link error (or, on some drivers, a silent 0). Keep the pair identical; the live figure's link-error preset shows the message.")],
          [tx(t, "oglSh_e3", "Writing 1 where a float is expected"), tx(t, "oglSh_e3b", "GLSL 4.60 converts it, GLSL ES and older versions refuse. Write 1.0 and your shaders work everywhere.")],
          [tx(t, "oglSh_e4", "Expecting * on two vectors to be a dot product"), tx(t, "oglSh_e4b", "it multiplies component by component. Use dot(a, b) or cross(a, b).")],
          [tx(t, "oglSh_e5", "Setting a uniform before glUseProgram"), tx(t, "oglSh_e5b", "it goes to another program, or fails. Use the program first, or use glProgramUniform*.")],
          [tx(t, "oglSh_e6", "A uniform that \"does nothing\""), tx(t, "oglSh_e6b", "its location is −1: a typo, or the compiler removed it because it is unused. Print the location once.")],
          [tx(t, "oglSh_e7", "Not writing gl_Position"), tx(t, "oglSh_e7b", "the position is undefined and the triangle lands anywhere or nowhere. Every vertex shader path must write it.")],
        ]}
      />

      <KeyIdeas t={t} id="oglSh" items={[
        "A shader is a function the GPU runs in parallel, once per vertex or per fragment, with no memory shared between invocations.",
        "A shader has a #version line, in inputs, uniforms, out outputs and main(); the vertex shader must write gl_Position.",
        "GLSL has vectors (vec2–vec4) and matrices (mat2–mat4) built in; arithmetic works component by component, and dot, cross and mix are functions.",
        "Swizzles like v.bgr or v.xy pick components by name; one name set per swizzle, and no repeats when writing.",
        "Vertex shader outs connect to fragment shader ins by name and type, and are interpolated across the triangle; flat turns that off.",
        "Uniforms carry per-draw values from C++: glGetUniformLocation, then the matching glUniform* on the program in use.",
        "A location of −1 means the uniform is missing or unused, and writes to it are silently ignored.",
      ]} />
    </Article>
  );
}
