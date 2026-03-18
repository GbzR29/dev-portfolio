// src/lib/tracks/opengl/chapters/01-pipeline.tsx

import { CodeBlock, Callout, IC, H2, H3, PipelineDiagram, NDCDiagram } from "@/components/lesson/LessonComponents";

export const PipelineChapter = (
  <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

    <p className="text-lg text-[var(--text-main)]">
      OpenGL operates in 3D space, but your screen is a 2D grid of pixels. The{" "}
      <strong className="text-white">graphics pipeline</strong> is the sequence of steps that
      transforms your 3D vertex data into the colored pixels you see. Understanding it is the
      single most important thing you can do before writing a single line of OpenGL code.
    </p>

    <H2>The stages</H2>

    <p>
      The pipeline is made up of stages, some of which are fixed (you cannot change them, only
      configure them), and some of which are programmable via small programs called{" "}
      <strong className="text-white">shaders</strong>, written in GLSL (OpenGL Shading Language).
    </p>

    <PipelineDiagram />

    <p>
      The two stages you will interact with most are the <strong className="text-white">Vertex Shader</strong>{" "}
      and the <strong className="text-white">Fragment Shader</strong>. They are the minimum you
      need to write before drawing anything to the screen.
    </p>

    <H2>Normalized Device Coordinates</H2>

    <p>
      OpenGL does not use pixel coordinates (0 to 800, 0 to 600). Instead, it defines a
      coordinate system called <strong className="text-white">Normalized Device Coordinates (NDC)</strong>{" "}
      where every axis goes from -1.0 to +1.0. Any vertex outside this range is clipped and
      not drawn.
    </p>

    <NDCDiagram />

    <p>
      This is what the three vertices of a simple triangle look like in NDC:
    </p>

    <CodeBlock lang="cpp" filename="main.cpp">{`// Three vertices, each with 3 floats: X, Y, Z
// We pass Z = 0.0 since we're working in 2D for now
float vertices[] = {
    -0.5f, -0.5f, 0.0f,   // bottom left
     0.5f, -0.5f, 0.0f,   // bottom right
     0.0f,  0.5f, 0.0f    // top center
};`}</CodeBlock>

    <Callout type="info">
      NDC is not the same as screen space. After the vertex shader runs, OpenGL automatically
      converts NDC coordinates to screen pixels using the viewport dimensions you set with{" "}
      <IC>glViewport()</IC>. You do not do this conversion yourself.
    </Callout>

    <H2>The Vertex Shader</H2>

    <p>
      The vertex shader runs once per vertex. Its only required job is to output the final
      clip-space position of the vertex through the built-in variable{" "}
      <IC>gl_Position</IC>. For now, we will pass the vertex position through unchanged.
    </p>

    <CodeBlock lang="glsl" filename="vertex.glsl">{`#version 460 core

// 'in' means this attribute comes FROM the VBO
// location = 0 matches the index we set in glVertexAttribPointer
layout (location = 0) in vec3 aPos;

void main() {
    // Pass position directly to clip space (no transformation yet)
    gl_Position = vec4(aPos.x, aPos.y, aPos.z, 1.0);
}`}</CodeBlock>

    <H2>The Fragment Shader</H2>

    <p>
      After rasterization, the fragment shader runs once per pixel fragment. Its job is to
      output the final color of that pixel. The output variable can be named anything, but
      it must be declared as an <IC>out vec4</IC>.
    </p>

    <CodeBlock lang="glsl" filename="fragment.glsl">{`#version 460 core

// This is the output color for the current pixel
out vec4 FragColor;

void main() {
    // RGBA: red=1.0, green=0.5, blue=0.2, alpha=1.0
    FragColor = vec4(1.0f, 0.5f, 0.2f, 1.0f);
}`}</CodeBlock>

    <Callout type="tip">
      Colors in GLSL are represented as floats in the range 0.0 to 1.0, not 0 to 255. To
      convert: divide your RGB value by 255. So <IC>rgb(255, 128, 51)</IC> becomes{" "}
      <IC>vec4(1.0, 0.5, 0.2, 1.0)</IC>.
    </Callout>

    <H2>How shaders get compiled</H2>

    <p>
      Shaders are not compiled on your CPU at build time. They are compiled at runtime by the
      GPU driver. The process looks like this:
    </p>

    <CodeBlock lang="cpp" filename="shader_compile.cpp">{`// 1. Create a shader object and give it the GLSL source code
unsigned int vertexShader = glCreateShader(GL_VERTEX_SHADER);
glShaderSource(vertexShader, 1, &vertexShaderSource, NULL);
glCompileShader(vertexShader);

// 2. Always check for compile errors — the GPU driver may reject your GLSL
int success;
glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &success);
if (!success) {
    char infoLog[512];
    glGetShaderInfoLog(vertexShader, 512, NULL, infoLog);
    std::cerr << "Shader compile error: " << infoLog << std::endl;
}

// 3. Link both shaders into a program
unsigned int shaderProgram = glCreateProgram();
glAttachShader(shaderProgram, vertexShader);
glAttachShader(shaderProgram, fragmentShader);
glLinkProgram(shaderProgram);

// 4. Shader objects are no longer needed after linking
glDeleteShader(vertexShader);
glDeleteShader(fragmentShader);`}</CodeBlock>

    <Callout type="warn">
      Always check for shader compile errors during development. A typo in your GLSL will
      silently produce a black screen without the error check. The error message from{" "}
      <IC>glGetShaderInfoLog</IC> tells you the exact line number that failed.
    </Callout>

    <H2>What comes next</H2>

    <p>
      Now that you understand the pipeline stages, we need to actually get the vertex data
      from the CPU to the GPU. That is the job of{" "}
      <strong className="text-white">Vertex Buffer Objects (VBOs)</strong>, which is exactly
      what the next chapter covers.
    </p>

  </article>
);