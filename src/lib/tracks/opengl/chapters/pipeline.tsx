"use client";

// OpenGL track — "The Graphics Pipeline".

import { CodeBlock, Callout, H2, PipelineDiagram, NDCDiagram } from "@/components/lesson/LessonComponents";
import { InteractiveNDC2D } from "@/components/lesson/InteractiveNDC2D";
import { InteractiveNDC3D } from "@/components/lesson/InteractiveNDC3D";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function PipelineContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch01_intro",
          "OpenGL operates in 3D space, but your screen is a 2D grid of pixels. The graphics pipeline is the sequence of steps that transforms your 3D vertex data into the colored pixels you see. Understanding it is the single most important thing you can do before writing a single line of OpenGL code."
        )}
      </p>

      <H2>{tx(t, "ch01_stagesTitle", "The stages")}</H2>
      <p>
        {tx(t, "ch01_stagesBody",
          "The pipeline is made up of stages, some of which are fixed (you cannot change them, only configure them), and some of which are programmable via small programs called shaders, written in GLSL (OpenGL Shading Language)."
        )}
      </p>

      <PipelineDiagram t={t} />

      <p>
        {tx(t, "ch01_stagesNote",
          "The two stages you will interact with most are the Vertex Shader and the Fragment Shader. They are the minimum you need to write before drawing anything to the screen."
        )}
      </p>

      <H2>{tx(t, "ch01_ndcTitle", "Normalized Device Coordinates")}</H2>
      <p>
        {tx(t, "ch01_ndcBody",
          "OpenGL does not use pixel coordinates (0 to 800, 0 to 600). Instead, it defines a coordinate system called Normalized Device Coordinates (NDC) where every axis goes from -1.0 to +1.0. Any vertex outside this range is clipped and not drawn."
        )}
      </p>

      <NDCDiagram />

      <p>
        {tx(t, "ch01_ndcAfter",
          "This is what the three vertices of a simple triangle look like in NDC:"
        )}
      </p>

      <InteractiveNDC2D />

      <Callout type="tip" t={t}>
        {tx(t, "ch01_ndcInteractiveTip",
          "Drag any vertex on the canvas above, or click it to get an X/Y gizmo that moves it along a single axis. You can also type exact values in the coordinate fields. Notice how moving a point outside the [-1, 1] boundary clips it — the triangle edge disappears at the border. The CCW/CW indicator shows the winding order (covered in chapter 10)."
        )}
      </Callout>

      <H2>{tx(t, "ch01_ndc3dTitle", "NDC in 3D")}</H2>
      <p>
        {tx(t, "ch01_ndc3dBody",
          "In 3D, NDC is a cube: every axis from -1.0 to +1.0. Any vertex outside this cube on any axis is clipped and not drawn. The Z axis controls depth — Z = -1.0 is the near clip plane, Z = +1.0 is the far clip plane. Rotate the visualizer below to see how different shapes sit inside the NDC cube."
        )}
      </p>

      <InteractiveNDC3D />

      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`// Three vertices, each with 3 floats: X, Y, Z
float vertices[] = {
    -0.5f, -0.5f, 0.0f,   // bottom left
     0.5f, -0.5f, 0.0f,   // bottom right
     0.0f,  0.5f, 0.0f    // top center
};`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "ch01_ndcCallout",
          "NDC is not the same as screen space. After the vertex shader runs, OpenGL automatically converts NDC coordinates to screen pixels using the viewport dimensions you set with glViewport(). You do not do this conversion yourself."
        )}
      </Callout>

      <H2>{tx(t, "ch01_vertexShaderTitle", "The Vertex Shader")}</H2>
      <p>
        {tx(t, "ch01_vertexShaderBody",
          "The vertex shader runs once per vertex. Its only required job is to output the final clip-space position of the vertex through the built-in variable gl_Position. For now, we will pass the vertex position through unchanged."
        )}
      </p>

      <CodeBlock lang="glsl" filename="vertex.glsl" t={t}>{`#version 460 core

layout (location = 0) in vec3 aPos;

void main() {
    gl_Position = vec4(aPos.x, aPos.y, aPos.z, 1.0);
}`}</CodeBlock>

      <H2>{tx(t, "ch01_fragmentShaderTitle", "The Fragment Shader")}</H2>
      <p>
        {tx(t, "ch01_fragmentShaderBody",
          "After rasterization, the fragment shader runs once per pixel fragment. Its job is to output the final color of that pixel. The output variable can be named anything, but it must be declared as an out vec4."
        )}
      </p>

      <CodeBlock lang="glsl" filename="fragment.glsl" t={t}>{`#version 460 core

out vec4 FragColor;

void main() {
    FragColor = vec4(1.0f, 0.5f, 0.2f, 1.0f);
}`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "ch01_colorTip",
          "Colors in GLSL are represented as floats in the range 0.0 to 1.0, not 0 to 255. To convert: divide your RGB value by 255. So rgb(255, 128, 51) becomes vec4(1.0, 0.5, 0.2, 1.0)."
        )}
      </Callout>

      <H2>{tx(t, "ch01_compileTitle", "How shaders get compiled")}</H2>
      <p>
        {tx(t, "ch01_compileBody",
          "Shaders are not compiled on your CPU at build time. They are compiled at runtime by the GPU driver. The process looks like this:"
        )}
      </p>

      <CodeBlock lang="cpp" filename="shader_compile.cpp" t={t}>{`unsigned int vertexShader = glCreateShader(GL_VERTEX_SHADER);
glShaderSource(vertexShader, 1, &vertexShaderSource, NULL);
glCompileShader(vertexShader);

// Always check for compile errors
int success;
glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &success);
if (!success) {
    char infoLog[512];
    glGetShaderInfoLog(vertexShader, 512, NULL, infoLog);
    std::cerr << "Shader compile error: " << infoLog << std::endl;
}

unsigned int shaderProgram = glCreateProgram();
glAttachShader(shaderProgram, vertexShader);
glAttachShader(shaderProgram, fragmentShader);
glLinkProgram(shaderProgram);
glDeleteShader(vertexShader);
glDeleteShader(fragmentShader);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "ch01_compileWarn",
          "Always check for shader compile errors during development. A typo in your GLSL will silently produce a black screen without the error check. The error message from glGetShaderInfoLog tells you the exact line number that failed."
        )}
      </Callout>

      <H2>{tx(t, "ch01_nextTitle", "What comes next")}</H2>
      <p>
        {tx(t, "ch01_nextBody",
          "Now that you understand the pipeline stages, we need to actually get the vertex data from the CPU to the GPU. That is the job of Vertex Buffer Objects (VBOs), which is exactly what the next chapter covers."
        )}
      </p>

    </article>
  );
}
