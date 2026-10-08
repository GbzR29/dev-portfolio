"use client";

// OpenGL track — "First Shaders": what a shader is and how it runs; the
// anatomy of a GLSL shader; types, constructors and component-wise maths;
// swizzling (figure); passing data between stages (in/out, matching rules,
// interpolation, flat); the live editable triangle (figure); uniforms and the
// glUniform family; the C++ side (compileShader/makeProgram line by line and
// where they go in main.cpp; helpers that return a GLuint: ownership, 0 as
// failure, copied names, a table of helpers); a worked interpolation example;
// the code-along checkpoint (the whole main.cpp so far); common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { SwizzleFigure } from "@/components/lesson/figures/glintro/SwizzleFigure";
import { TriangleShaderFigure } from "@/components/lesson/figures/glintro/TriangleShaderFigure";

export function ShadersContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglSh_intro",
          "The buffer and the vertex array deliver each vertex's position and colour. What happens to them next is up to two small programs you write: the vertex shader and the fragment shader. They are written in GLSL, the OpenGL Shading Language, which looks like C with vector and matrix types built in. This chapter teaches enough GLSL to write both shaders with confidence: its types and the way it works on whole vectors at once, how values travel from one stage to the next, and how your C++ program passes values in. A live editor lets you change the shaders and see the triangle respond.")}
      </Lead>

      <Goals t={t} id="oglSh" items={[
        "Write a vertex shader and a fragment shader in GLSL.",
        "Pass data from one stage to the next.",
        "Set uniforms from C++.",
        "Compile and link shaders, and read their error messages.",
      ]} />

      <H2>{tx(t, "oglSh_whatTitle", "What a shader is")}</H2>
      <p>
        {tx(t, "oglSh_whatBody2",
          "A shader is a function that the GPU calls many times in parallel. The vertex shader runs once per vertex. The fragment shader runs once per fragment.")}
      </p>
      <p>
        {tx(t, "oglSh_whatInv",
          "Each of those calls is called an invocation. It gets its own inputs and produces its own outputs. Invocations cannot talk to each other, and they remember nothing from one frame to the next. That isolation is what lets thousands of them run at the same time.")}
      </p>
      <p>
        {tx(t, "oglSh_whatCompile",
          "You do not compile shaders ahead of time, as you do with C++. As the Pipeline chapter explained, the driver compiles the GLSL text while your program runs, for the GPU that is installed.")}
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
        {tx(t, "oglSh_passBody2",
          "The vertex shader's out variables are connected to the fragment shader's in variables when the program is linked. The link matches them by name and type: an out vec3 vColor feeds an in vec3 vColor.")}
      </p>
      <p>
        {tx(t, "oglSh_passInterp",
          "The value does not arrive unchanged. Between the two shaders, the rasterizer interpolates each output across the triangle. A fragment receives a blend of the three vertices' values, weighted by how close it is to each vertex. Those weights are the barycentric weights of the Pipeline chapter.")}
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
        {tx(t, "oglSh_uniformBody2",
          "A uniform is a global variable of the shader that your C++ code sets. It stays constant for a whole draw call: every vertex and every fragment sees the same value.")}
      </p>
      <p>
        {tx(t, "oglSh_uniformUse",
          "Use uniforms for anything shared by the whole draw: the time, a tint colour, and later (from the Transformations section on) the matrices that place a model in the world.")}
      </p>
      <p>
        {tx(t, "oglSh_uniformSteps",
          "Setting a uniform takes two steps. First, ask the linked program for the uniform's location, by name. Then write a value at that location with the glUniform function that matches the uniform's type.")}
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
        {tx(t, "oglSh_cppBody2",
          "Compiling and linking were covered in the Pipeline chapter. In your main.cpp, step 4a still does it inline: about 30 lines, with the same checks written twice. Two small functions remove the repetition.")}
      </p>
      <p>
        {tx(t, "oglSh_cppWhere",
          "Where they go: above main, after the two shader strings. Then step 4a shrinks to a single call, as the checkpoint at the end of this chapter shows.")}
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
        std::cerr << (type == GL_VERTEX_SHADER ? "Vertex" : "Fragment")
                  << " shader error: " << log << "\\n";
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
        std::cerr << "Program link error: " << log << "\\n";
    }
    glDeleteShader(vs);            // the program keeps its own copy
    glDeleteShader(fs);
    return p;
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglSh_tRetLine", "Line"), tx(t, "oglSh_tRetDoes", "What it does")]}
        rows={[
          ["glCreateShader(type)", tx(t, "oglSh_cl1", "creates an empty shader object of that type (GL_VERTEX_SHADER or GL_FRAGMENT_SHADER) and returns its name.")],
          ["glShaderSource(s, 1, &src, nullptr)", tx(t, "oglSh_cl2", "hands the GLSL text to the driver: 1 piece of text, ending at its '\\0' (nullptr instead of a list of lengths). The Pipeline chapter explains each argument.")],
          ["glCompileShader(s)", tx(t, "oglSh_cl3", "the driver compiles the text into code for your GPU.")],
          ["glGetShaderiv(s, GL_COMPILE_STATUS, &ok)", tx(t, "oglSh_cl4", "asks whether it worked. ok becomes 1 (GL_TRUE) or 0 (GL_FALSE).")],
          ["glGetShaderInfoLog(s, sizeof log, nullptr, log)", tx(t, "oglSh_cl5", "copies the compiler's message into log, at most sizeof log = 1024 bytes. The message names the line of the error.")],
          ["glAttachShader + glLinkProgram", tx(t, "oglSh_cl6", "put both shaders into one program and link them. Linking connects each out of the vertex shader to the in with the same name in the fragment shader.")],
          ["glGetProgramiv / glGetProgramInfoLog", tx(t, "oglSh_cl7", "the same two checks for the link step, on the program instead of a shader.")],
          ["glDeleteShader(vs)", tx(t, "oglSh_cl8", "the linked program keeps the compiled code, so the shader objects are no longer needed.")],
        ]}
      />

      <H3>{tx(t, "oglSh_retTitle", "Functions that return a GLuint")}</H3>
      <p>
        {tx(t, "oglSh_retBody",
          "compileShader and makeProgram follow one pattern that works for every kind of OpenGL object. The function creates the object, sets it up and returns its name. The caller gets back a single GLuint and does not need to know the steps behind it.")}
      </p>
      <p>
        {tx(t, "oglSh_retOwner",
          "Whoever holds the returned name owns the object: they must delete it when it is no longer needed. Inside makeProgram, the shaders vs and fs belong to the function, so it deletes them before returning. The program p is handed to the caller, which deletes it with glDeleteProgram at the end of main (Drawing the Triangle chapter).")}
      </p>
      <p>
        {tx(t, "oglSh_retZero",
          "Because 0 is never a valid name, a function can return 0 to mean \"it failed\". The helpers above only print the error and return the broken object anyway. A stricter makeProgram cleans up and returns 0, and the caller checks it:")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`GLuint makeProgram(const char* vsSrc, const char* fsSrc) {
    // ... compile, attach, link and read GL_LINK_STATUS into ok, as above ...
    glDeleteShader(vs);            // not needed any more, whether linking worked or not
    glDeleteShader(fs);
    if (!ok) {
        glDeleteProgram(p);        // free the half-made program
        return 0;                  // 0 = "no program"
    }
    return p;
}

// In main, step 4a (after gladLoadGLLoader, before the render loop):
GLuint shaderProgram = makeProgram(vertexShaderSource, fragmentShaderSource);
if (shaderProgram == 0) return 1;  // stop instead of looping over a black window`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglSh_tRetLine", "Line"), tx(t, "oglSh_tRetDoes", "What it does")]}
        rows={[
          ["glDeleteShader(vs)", tx(t, "oglSh_r1", "runs on both paths. After linking, the shader objects are no longer needed, success or not.")],
          ["glDeleteProgram(p); return 0;", tx(t, "oglSh_r2", "on failure, frees the program that did not link and reports it with the one name that is never valid.")],
          ["if (shaderProgram == 0) return 1;", tx(t, "oglSh_r3", "the caller decides what failure means. Here main quits with an error code; the error itself was already printed.")],
        ]}
      />

      <p>
        {tx(t, "oglSh_retCopy",
          "A GLuint is only a label, like a ticket number. Copying it does not copy the object. After GLuint a = makeProgram(…); GLuint b = a; both variables name the same program. If you delete it through a, b still holds the number, but the object is gone. Using b is now an error, and the driver may later hand the same number to a new object, so b quietly names something else. Keep one clear owner per name, and set the variable to 0 after deleting: glDelete* ignores 0, so a second delete then does no harm.")}
      </p>
      <p>
        {tx(t, "oglSh_retMore",
          "The same pattern builds the rest of a small renderer. Each helper hides several calls behind one name:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglSh_tHelper", "Helper"), tx(t, "oglSh_tReturns", "Returns"), tx(t, "oglSh_tHides", "Calls it hides")]}
        rows={[
          ["GLuint compileShader(type, src)", tx(t, "oglSh_h1r", "a shader name"), tx(t, "oglSh_h1", "create, source, compile, read the log")],
          ["GLuint makeProgram(vs, fs)", tx(t, "oglSh_h2r", "a program name"), tx(t, "oglSh_h2", "compile both shaders, attach, link, check, delete the shaders")],
          ["GLuint makeBuffer(data, bytes)", tx(t, "oglSh_h3r", "a buffer name"), tx(t, "oglSh_h3", "glGenBuffers, glBindBuffer, glBufferData (VBO chapter)")],
          ["GLuint loadTexture(path)", tx(t, "oglSh_h4r", "a texture name"), tx(t, "oglSh_h4", "read the image file, create, bind, upload, build mipmaps (Textures chapter)")],
          ["Mesh makeMesh(vertices, indices)", tx(t, "oglSh_h5r", "a struct with several names (vao, vbo, ebo) and the index count"), tx(t, "oglSh_h5", "everything in the VAO and EBO chapters. When one thing needs several objects, return a small struct instead of a single GLuint.")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "oglSh_retRaii", "A GLuint does not delete its object by itself: forget glDelete* and the GPU memory leaks until the context closes; copy the name and there are two owners. C++ can solve both with a small class that deletes the object in its destructor (RAII). For a first program, helpers that return a GLuint plus one clean-up block at the end of main are enough.")}
      </Callout>

      <H2>{tx(t, "oglSh_soFarTitle", "Your main.cpp so far")}</H2>
      <p>
        {tx(t, "oglSh_soFarBody",
          "The whole file at the end of this chapter. Compared with the VAO chapter's version, two things changed, both marked NEW. The two helpers sit above main, with the strict makeProgram that returns 0 on failure. Step 4a, which was about 30 lines, is now two. The shaders themselves did not change: the VAO chapter already made them pass the colour along.")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp" t={t}>{`#include <glad/glad.h>      // MUST come before glfw3.h
#include <GLFW/glfw3.h>
#include <iostream>

// ── Shaders (unchanged since the VAO chapter) ───────────────────────────────
const char* vertexShaderSource = R"(#version 460 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aColor;
out vec3 vColor;
void main() {
    gl_Position = vec4(aPos, 1.0);
    vColor = aColor;
})";

const char* fragmentShaderSource = R"(#version 460 core
in vec3 vColor;
out vec4 FragColor;
void main() {
    FragColor = vec4(vColor, 1.0);
})";

// ── Shader helpers ──────────────────────────────── >>> NEW in this chapter
GLuint compileShader(GLenum type, const char* src) {
    GLuint s = glCreateShader(type);
    glShaderSource(s, 1, &src, nullptr);
    glCompileShader(s);
    GLint ok = 0;
    glGetShaderiv(s, GL_COMPILE_STATUS, &ok);
    if (!ok) {
        char log[1024];
        glGetShaderInfoLog(s, sizeof log, nullptr, log);
        std::cerr << (type == GL_VERTEX_SHADER ? "Vertex" : "Fragment")
                  << " shader error: " << log << "\\n";
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
        std::cerr << "Program link error: " << log << "\\n";
    }
    glDeleteShader(vs);
    glDeleteShader(fs);
    if (!ok) {
        glDeleteProgram(p);
        return 0;                   // 0 = "no program"
    }
    return p;
}
//                                                 <<< end of NEW

void framebufferSizeCallback(GLFWwindow*, int width, int height) {
    glViewport(0, 0, width, height);
}

int main() {
    // ── 1. Window library and context ────────────────────────────────────────
    if (!glfwInit()) return 1;
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 6);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    GLFWwindow* window = glfwCreateWindow(1280, 720, "GLApp", nullptr, nullptr);
    if (!window) { glfwTerminate(); return 1; }
    glfwMakeContextCurrent(window);
    glfwSwapInterval(1);

    // ── 2. Load the OpenGL functions (no gl* call before this) ───────────────
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) return 1;

    // ── 3. Viewport, now and on every resize ─────────────────────────────────
    int fbw, fbh;
    glfwGetFramebufferSize(window, &fbw, &fbh);
    glViewport(0, 0, fbw, fbh);
    glfwSetFramebufferSizeCallback(window, framebufferSizeCallback);

    // ── 4. One-time setup ────────────────────────────────────────────────────
    // 4a. Shaders → program                         >>> NEW: one call
    GLuint shaderProgram = makeProgram(vertexShaderSource, fragmentShaderSource);
    if (shaderProgram == 0) { glfwTerminate(); return 1; }

    // 4b. Vertex data → VAO + VBO (unchanged)
    float vertices[] = {
    //    x      y      z     r     g     b
        -0.6f, -0.55f, 0.0f, 1.0f, 0.27f, 0.27f,   // vertex 0
         0.65f,-0.45f, 0.0f, 0.13f,0.77f, 0.37f,   // vertex 1
         0.0f,  0.65f, 0.0f, 0.23f,0.51f, 0.96f,   // vertex 2
    };
    GLuint vao, vbo;
    glGenVertexArrays(1, &vao);
    glGenBuffers(1, &vbo);

    glBindVertexArray(vao);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);
    glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)(3 * sizeof(float)));
    glEnableVertexAttribArray(1);
    glBindVertexArray(0);

    // ── 5. The render loop ───────────────────────────────────────────────────
    while (!glfwWindowShouldClose(window)) {
        if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
            glfwSetWindowShouldClose(window, true);

        glClearColor(0.06f, 0.07f, 0.10f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        // ... draw (Drawing the Triangle chapter) ...

        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // ── 6. Clean up ──────────────────────────────────────────────────────────
    glDeleteVertexArrays(1, &vao);
    glDeleteBuffers(1, &vbo);
    glDeleteProgram(shaderProgram);
    glfwTerminate();
    return 0;
}`}</CodeBlock>
      <p>
        {tx(t, "oglSh_soFarRun",
          "Run it: still only the clear colour, as before. The difference shows when something is wrong. Delete a semicolon in a shader and run again: the console prints the driver's message with the line number, and the program closes instead of showing an empty window.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "oglSh_soFarUniform", "Uniforms are not in the file yet, because the triangle does not need one. A uniform that a shader declares but C++ never sets reads as 0, which would make a tint uniform paint the triangle black. Exercise 3 of the next chapter adds a uTime uniform and sets it every frame.")}
      </Callout>

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
        "Helpers that create an object and return its GLuint name hide the setup; the holder owns and deletes it, 0 means failure, and copying a name never copies the object.",
      ]} />
    </Article>
  );
}
