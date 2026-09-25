"use client";

// OpenGL track — "EBO / Indexed Drawing".

import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function EBOContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch06_intro",
          "Every quad is two triangles that share two vertices. Without indices, you store those vertices twice — wasting VRAM and making mesh changes error-prone. An Element Buffer Object (EBO) stores a list of indices so each unique vertex lives exactly once."
        )}
      </p>

      <H2>{tx(t, "ch06_whyTitle", "The duplication problem")}</H2>
      <p>
        {tx(t, "ch06_whyBody",
          "A quad has four corners. GL_TRIANGLES expects three vertices per triangle, so without indices you pass six vertices total — two of which are duplicated."
        )}
      </p>
      <CodeBlock lang="cpp" filename="no_ebo.cpp" t={t}>{`// Without EBO — 6 vertices, only 4 are unique
float vertices[] = {
    // triangle 1
    -0.5f,  0.5f, 0.0f,  // 0 top-left
    -0.5f, -0.5f, 0.0f,  // 1 bottom-left
     0.5f, -0.5f, 0.0f,  // 2 bottom-right
    // triangle 2
    -0.5f,  0.5f, 0.0f,  // DUPLICATE of 0
     0.5f, -0.5f, 0.0f,  // DUPLICATE of 2
     0.5f,  0.5f, 0.0f,  // 3 top-right
};`}</CodeBlock>

      <H2>{tx(t, "ch06_solutionTitle", "The EBO solution")}</H2>
      <p>
        {tx(t, "ch06_solutionBody",
          "Store four unique vertices and a separate index list. The GPU reads each index, looks up the corresponding vertex, and assembles triangles without any data duplication."
        )}
      </p>
      <CodeBlock lang="cpp" filename="with_ebo.cpp" t={t}>{`float vertices[] = {
    -0.5f,  0.5f, 0.0f,   // 0 — top-left
    -0.5f, -0.5f, 0.0f,   // 1 — bottom-left
     0.5f, -0.5f, 0.0f,   // 2 — bottom-right
     0.5f,  0.5f, 0.0f,   // 3 — top-right
};

unsigned int indices[] = {
    0, 1, 2,   // bottom-left triangle
    0, 2, 3    // top-right triangle
};`}</CodeBlock>

      <H2>{tx(t, "ch06_createTitle", "Creating the EBO")}</H2>
      <p>
        {tx(t, "ch06_createBody",
          "An EBO is created exactly like a VBO. The only differences are the buffer target (GL_ELEMENT_ARRAY_BUFFER) and that the EBO must be bound while the VAO is active so the VAO records it."
        )}
      </p>
      <CodeBlock lang="cpp" filename="ebo_setup.cpp" t={t}>{`unsigned int VAO, VBO, EBO;
glGenVertexArrays(1, &VAO);
glGenBuffers(1, &VBO);
glGenBuffers(1, &EBO);

glBindVertexArray(VAO);  // start recording

glBindBuffer(GL_ARRAY_BUFFER, VBO);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);

// EBO — bind after VAO so it is recorded inside it
glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);

glBindVertexArray(0);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "ch06_eboWarn",
          "Do not unbind the EBO before unbinding the VAO. The VAO stores the GL_ELEMENT_ARRAY_BUFFER binding — unbinding the EBO first removes that association and the VAO will draw nothing."
        )}
      </Callout>

      <H2>{tx(t, "ch06_drawTitle", "Drawing with glDrawElements")}</H2>
      <p>
        {tx(t, "ch06_drawBody",
          "Replace glDrawArrays with glDrawElements. The second argument is the number of indices (not vertices). The last argument is the byte offset into the EBO — 0 to start from the beginning."
        )}
      </p>
      <CodeBlock lang="cpp" filename="render.cpp" t={t}>{`while (!glfwWindowShouldClose(window)) {
    glClear(GL_COLOR_BUFFER_BIT);
    glUseProgram(shaderProgram);
    glBindVertexArray(VAO);
    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
    // 6 indices total, type must match the index array type
    glfwSwapBuffers(window);
    glfwPollEvents();
}`}</CodeBlock>

      <H2>{tx(t, "ch06_wireframeTitle", "Debug tip: wireframe mode")}</H2>
      <p>
        {tx(t, "ch06_wireframeBody",
          "During development you can switch to wireframe to verify your indices are correct and both triangles share the right vertices."
        )}
      </p>
      <CodeBlock lang="cpp" filename="wireframe.cpp" t={t}>{`glPolygonMode(GL_FRONT_AND_BACK, GL_LINE);   // wireframe
// glPolygonMode(GL_FRONT_AND_BACK, GL_FILL); // restore filled (default)`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "ch06_nextTip",
          "EBOs become even more valuable with complex 3D meshes where sharing vertices saves thousands of bytes per mesh. Most mesh loading libraries (Assimp, tinyobjloader) output indexed geometry by default."
        )}
      </Callout>

    </article>
  );
}
