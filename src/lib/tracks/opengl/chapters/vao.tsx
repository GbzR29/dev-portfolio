"use client";

// OpenGL track — "VAOs".

import { CodeBlock, Callout, H2, VAODiagram } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function VAOContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch03_intro",
          "Every time you draw a mesh, OpenGL needs to know which buffer the vertex data lives in, and how that buffer is laid out. Without a VAO you would need to re-specify all of this before every draw call. A Vertex Array Object (VAO) records all of that state once so you can replay it with a single bind."
        )}
      </p>

      <H2>{tx(t, "ch03_whatTitle", "What a VAO stores")}</H2>
      <VAODiagram t={t} />
      <p>
        {tx(t, "ch03_whatAfter",
          "When a VAO is bound, every call to glVertexAttribPointer and glEnableVertexAttribArray is recorded inside it. The bound GL_ELEMENT_ARRAY_BUFFER (index buffer) is also stored. The GL_ARRAY_BUFFER binding itself is not stored directly, but the association between each attribute and its source buffer is."
        )}
      </p>

      <H2>{tx(t, "ch03_createTitle", "Creating and using a VAO")}</H2>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`// 1. Create and bind the VAO FIRST — before touching any VBO
unsigned int VAO;
glGenVertexArrays(1, &VAO);
glBindVertexArray(VAO);  // start recording

// 2. Set up the VBO as normal — the VAO records all of this
unsigned int VBO;
glGenBuffers(1, &VBO);
glBindBuffer(GL_ARRAY_BUFFER, VBO);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);

// 3. Unbind when setup is done
glBindVertexArray(0);`}</CodeBlock>

      <p>{tx(t, "ch03_renderLoop", "Now in the render loop, instead of re-specifying all of that, you just bind the VAO:")}</p>

      <CodeBlock lang="cpp" filename="render_loop.cpp" t={t}>{`while (!glfwWindowShouldClose(window)) {
    glClear(GL_COLOR_BUFFER_BIT);
    glUseProgram(shaderProgram);
    glBindVertexArray(VAO);          // replaces all the VBO setup
    glDrawArrays(GL_TRIANGLES, 0, 3);
    glfwSwapBuffers(window);
    glfwPollEvents();
}`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "ch03_goldenRule",
          "The golden rule: create your VAO before you set up your VBOs. If you bind the VBO first and the VAO after, the VAO will not have recorded the attribute pointers."
        )}
      </Callout>

      <H2>{tx(t, "ch03_interleavedTitle", "Interleaved vertex data")}</H2>
      <p>
        {tx(t, "ch03_interleavedBody",
          "Real vertices have more than just a position. A typical vertex has position, texture coordinates, and a normal vector, all packed together in a single buffer. The stride and offset arguments in glVertexAttribPointer handle this."
        )}
      </p>
      <CodeBlock lang="cpp" filename="interleaved.cpp" t={t}>{`// Layout: [X Y Z] [U V] [NX NY NZ] per vertex
int stride = 8 * sizeof(float);

// position: 3 floats at offset 0
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, stride, (void*)0);
glEnableVertexAttribArray(0);

// texcoord: 2 floats at offset 12
glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, stride, (void*)(3 * sizeof(float)));
glEnableVertexAttribArray(1);

// normal: 3 floats at offset 20
glVertexAttribPointer(2, 3, GL_FLOAT, GL_FALSE, stride, (void*)(5 * sizeof(float)));
glEnableVertexAttribArray(2);`}</CodeBlock>

    </article>
  );
}
