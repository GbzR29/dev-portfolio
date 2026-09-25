"use client";

// OpenGL track — "VBOs".

import { CodeBlock, Callout, H2, H3, VBOFlowDiagram, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function VBOContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch02_intro",
          "Your vertex data starts as a C++ array living in RAM. The GPU cannot access RAM directly, it can only read from its own memory (VRAM). A Vertex Buffer Object (VBO) is the mechanism OpenGL provides to copy that data from your CPU into the GPU, where the vertex shader can read it."
        )}
      </p>

      <H2>{tx(t, "ch02_flowTitle", "The data flow")}</H2>
      <VBOFlowDiagram t={t} />
      <p>
        {tx(t, "ch02_flowAfter",
          "You define the data, create a buffer on the GPU, upload the data to it with glBufferData, then issue a draw call. The GPU does the rest."
        )}
      </p>

      <H2>{tx(t, "ch02_stepTitle", "Creating a VBO step by step")}</H2>

      <H3>{tx(t, "ch02_step1Title", "Step 1: Generate the buffer")}</H3>
      <p>
        {tx(t, "ch02_step1Body",
          "Everything in OpenGL is identified by an integer ID. You ask OpenGL to create a buffer object and it gives you back an ID you use for all future operations on that buffer."
        )}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`unsigned int VBO;
glGenBuffers(1, &VBO);  // create 1 buffer, store its ID in VBO`}</CodeBlock>

      <H3>{tx(t, "ch02_step2Title", "Step 2: Bind the buffer")}</H3>
      <p>
        {tx(t, "ch02_step2Body",
          "OpenGL is a state machine. To operate on a buffer, you first bind it, which means make this the currently active buffer of this type. From this point on, any buffer operation will apply to the bound buffer."
        )}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`glBindBuffer(GL_ARRAY_BUFFER, VBO);`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "ch02_step2Callout",
          "OpenGL has multiple buffer targets. GL_ARRAY_BUFFER is for vertex data. You will also see GL_ELEMENT_ARRAY_BUFFER for index buffers when we cover indexed drawing later."
        )}
      </Callout>

      <H3>{tx(t, "ch02_step3Title", "Step 3: Upload the data")}</H3>
      <p>
        {tx(t, "ch02_step3Body",
          "Now you copy the vertex array from RAM to the GPU with glBufferData. The last argument is a hint to the driver about how often this data will change, which influences where the driver places the buffer in memory."
        )}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`float vertices[] = {
    -0.5f, -0.5f, 0.0f,
     0.5f, -0.5f, 0.0f,
     0.0f,  0.5f, 0.0f
};

glBufferData(
    GL_ARRAY_BUFFER,
    sizeof(vertices),
    vertices,
    GL_STATIC_DRAW
);`}</CodeBlock>

      <p>{tx(t, "ch02_step3TableIntro", "The three usage hints you need to know:")}</p>
      <LessonTable
        headers={[tx(t, "vboTableHeader0", "Hint"), tx(t, "vboTableHeader1", "When to use")]}
        rows={[
          ["GL_STATIC_DRAW",  tx(t, "vboStaticDesc",  "Data is set once, used many times. Good for static geometry like terrain or models.")],
          ["GL_DYNAMIC_DRAW", tx(t, "vboDynamicDesc", "Data is modified and used many times. Good for animated or procedural geometry.")],
          ["GL_STREAM_DRAW",  tx(t, "vboStreamDesc",  "Data is set once, used a few times. Good for per-frame particle systems.")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "ch02_usageHintTip",
          "These hints do not change the behavior of your program, they are just performance hints. The driver uses them to decide where in GPU memory to place the buffer. Getting them wrong will not break anything, but it may cause unnecessary memory transfers."
        )}
      </Callout>

      <H2>{tx(t, "ch02_interpretTitle", "Telling OpenGL how to interpret the data")}</H2>
      <p>
        {tx(t, "ch02_interpretBody",
          "The VBO is just a blob of bytes on the GPU. OpenGL does not know that your bytes represent three floats per vertex. You need to tell it using glVertexAttribPointer."
        )}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`// index=0, 3 components, float, no normalize, stride=12 bytes, offset=0
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "ch02_interpretWarn",
          "The first argument (0) must match the layout (location = 0) declaration in your vertex shader. If they do not match, the shader reads garbage data or nothing at all."
        )}
      </Callout>

      <H2>{tx(t, "ch02_fullTitle", "The full VBO setup in one place")}</H2>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`unsigned int VBO;
glGenBuffers(1, &VBO);
glBindBuffer(GL_ARRAY_BUFFER, VBO);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);

while (!glfwWindowShouldClose(window)) {
    glClear(GL_COLOR_BUFFER_BIT);
    glUseProgram(shaderProgram);
    glDrawArrays(GL_TRIANGLES, 0, 3);
    glfwSwapBuffers(window);
    glfwPollEvents();
}`}</CodeBlock>

      <H2>{tx(t, "ch02_nextTitle", "Why you should not stop here")}</H2>
      <p>
        {tx(t, "ch02_nextBody",
          "The code above works, but it has a problem: every frame you need to rebind the VBO and re-specify the vertex attribute layout. For a single triangle this is fine, but for a real scene with hundreds of meshes it becomes expensive and repetitive. The next chapter introduces Vertex Array Objects (VAOs), which let you record all the VBO bindings and attribute specifications once, then replay them with a single bind call."
        )}
      </p>

    </article>
  );
}
