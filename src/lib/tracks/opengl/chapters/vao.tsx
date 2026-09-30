"use client";

// OpenGL track — "Vertex Array Objects": the gap between bytes and shader
// inputs; glVertexAttribPointer argument by argument and the address formula
// (worked example); the live layout editor (figure); interleaved vs separate
// layouts; normalized and integer attributes; what a VAO stores and what it
// does not, step by step (figure); creating, using and drawing several meshes;
// the golden rule; a DSA preview; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { VertexLayoutFigure } from "@/components/lesson/figures/glintro/VertexLayoutFigure";
import { VaoRecordFigure } from "@/components/lesson/figures/glintro/VaoRecordFigure";

const r = String.raw;

export function VAOContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglVao_intro",
          "The VBO holds your vertices as raw bytes. The vertex shader asks for named, typed inputs: a vec3 aPos at location 0, a vec3 aColor at location 1. Something has to connect the two by saying where in the bytes each input's values are and how to read them. That description is the vertex layout, and the object that stores it is the Vertex Array Object (VAO). This chapter explains every number in the description, lets you break it on purpose to see what each one does, and shows exactly what a VAO remembers, so that drawing a mesh becomes a single bind.")}
      </Lead>

      <H2>{tx(t, "oglVao_inputsTitle", "From bytes to shader inputs")}</H2>
      <p>
        {tx(t, "oglVao_inputsBody",
          "Each input of the vertex shader declared with in is a vertex attribute, and layout(location = n) gives it a number, its location. For every vertex, the GPU's vertex fetch stage reads each enabled attribute's values from a buffer and hands them to the shader. Our triangle now carries a colour per vertex, so the shader has two attributes:")}
      </p>
      <CodeBlock lang="glsl" filename="vertex.glsl" t={t}>{`#version 460 core
layout (location = 0) in vec3 aPos;     // attribute 0: 3 floats
layout (location = 1) in vec3 aColor;   // attribute 1: 3 floats

out vec3 vColor;                        // passed on, interpolated (Pipeline chapter)

void main() {
    gl_Position = vec4(aPos, 1.0);
    vColor = aColor;
}`}</CodeBlock>
      <p>
        {tx(t, "oglVao_interleavedBody",
          "The buffer stores the vertices interleaved: all of vertex 0's data, then all of vertex 1's, and so on. Each vertex is x, y, z, r, g, b: 6 floats, 24 bytes.")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`float vertices[] = {
//    x      y     z      r     g     b
    -0.6f, -0.55f, 0.0f,  1.0f, 0.27f, 0.27f,   // vertex 0, bytes  0..23
     0.65f, -0.45f, 0.0f, 0.13f, 0.77f, 0.37f,  // vertex 1, bytes 24..47
     0.0f,  0.65f, 0.0f,  0.23f, 0.51f, 0.96f,  // vertex 2, bytes 48..71
};`}</CodeBlock>

      <H2>{tx(t, "oglVao_pointerTitle", "glVertexAttribPointer, argument by argument")}</H2>
      <p>{tx(t, "oglVao_pointerBody", "One call describes one attribute. For the position:")}</p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`glVertexAttribPointer(
    0,                   // index: the shader's layout(location = 0)
    3,                   // size: 3 components (x, y, z)
    GL_FLOAT,            // type of each component in the buffer
    GL_FALSE,            // normalized: convert integers to 0..1? (not for floats)
    6 * sizeof(float),   // stride: 24 bytes from one vertex to the next
    (void*)0);           // offset of the first component, in bytes, as a pointer
glEnableVertexAttribArray(0);   // attributes are disabled until enabled`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglVao_tArg", "Argument"), tx(t, "oglVao_tMeaning", "Meaning")]}
        rows={[
          ["index", tx(t, "oglVao_a1", "the attribute location, matching layout(location = …) in the shader. Every GPU supports at least 16 (GL_MAX_VERTEX_ATTRIBS).")],
          ["size", tx(t, "oglVao_a2", "how many components per vertex, 1 to 4. If it is smaller than the shader's type, the missing components are filled with 0 for y and z and 1 for w.")],
          ["type", tx(t, "oglVao_a3", "how each component is stored in the buffer: GL_FLOAT (4 bytes), GL_UNSIGNED_BYTE (1), GL_SHORT (2), GL_INT (4), GL_HALF_FLOAT (2), and so on.")],
          ["normalized", tx(t, "oglVao_a4", "for integer types only: GL_TRUE maps the integer range to 0…1 (unsigned) or −1…1 (signed), so the byte 255 arrives as 1.0. GL_FALSE converts the number as is (255 becomes 255.0).")],
          ["stride", tx(t, "oglVao_a5", "bytes from the start of one vertex's value to the start of the next vertex's. 0 is a special value meaning \"tightly packed\": size × the type's size, as if nothing else were in between.")],
          ["pointer", tx(t, "oglVao_a6", "despite its type, a byte offset into the bound GL_ARRAY_BUFFER, where the first vertex's value starts. It is cast to void* for historical reasons: before buffers existed it really was a pointer into your memory.")],
        ]}
      />
      <p>
        {tx(t, "oglVao_formulaBody",
          "Together, these say exactly which bytes the GPU reads. For vertex number i, component k of an attribute is at:")}
      </p>
      <Equation label={tx(t, "oglVao_eqAddr", "Where the vertex fetcher reads")}
        where={[
          [r`\text{offset}`, tx(t, "oglVao_wOffset", "the last argument: where vertex 0's value starts, in bytes from the start of the buffer")],
          [r`i`, tx(t, "oglVao_wI", "the vertex number, 0 for the first vertex of the draw")],
          [r`\text{stride}`, tx(t, "oglVao_wStride", "the distance in bytes between consecutive vertices (size × type size if 0 was passed)")],
          [r`k`, tx(t, "oglVao_wK", "the component: 0 for x or r, 1 for y or g, 2 for z or b, 3 for w or a")],
          [r`s`, tx(t, "oglVao_wS", "the size in bytes of one component of the given type: 4 for GL_FLOAT")],
        ]}
        note={tx(t, "oglVao_eqAddrNote", "It is the array-indexing formula base + i · size from the Algorithms track, with the stride playing the role of the element size and the offset picking a field inside each element.")}>
        {r`\text{byte} = \text{offset} + i \cdot \text{stride} + k \cdot s`}
      </Equation>
      <p>
        {tx(t, "oglVao_worked",
          "Worked example. The colour attribute has offset 12 (it follows 3 position floats) and stride 24. The green component (k = 1) of vertex 2 is at 12 + 2 · 24 + 1 · 4 = 12 + 48 + 4 = 64, the 17th float (64 / 4 = 16, counting from 0), which is indeed 0.51 in the array. The x of vertex 1 (position offset 0, k = 0) is at 0 + 1 · 24 + 0 = 24, float number 6, which holds 0.65. Try a wrong stride of 12 and the same formula sends vertex 1's position to byte 12: the colour of vertex 0.")}
      </p>
      <p>
        {tx(t, "oglVao_figIntro",
          "The figure performs exactly this fetch for both attributes and renders what arrives. Start from the correct layout, then use the presets or the sliders to break it.")}
      </p>

      <VertexLayoutFigure t={t} />

      <H3>{tx(t, "oglVao_layoutsTitle", "Interleaved or separate")}</H3>
      <p>
        {tx(t, "oglVao_layoutsBody",
          "Interleaving is not the only option. The same data can be stored as all positions first and then all colours ([x y z x y z x y z][r g b r g b r g b]), in one buffer or in two. Then each attribute is tightly packed: stride 12 for both, offset 0 for the position and 36 (3 vertices × 12 bytes) for the colour. Both layouts are correct; they differ in speed and convenience.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglVao_tLayout", "Layout"), tx(t, "oglVao_tGood", "Good for"), tx(t, "oglVao_tCost", "Cost")]}
        rows={[
          [tx(t, "oglVao_l1", "Interleaved: [xyzrgb][xyzrgb]…"), tx(t, "oglVao_l1b", "drawing: one vertex's attributes are neighbours in memory, so the fetch reads one contiguous chunk per vertex"), tx(t, "oglVao_l1c", "updating one attribute (say, only positions) touches the whole buffer")],
          [tx(t, "oglVao_l2", "Separate: [xyz xyz…][rgb rgb…]"), tx(t, "oglVao_l2b", "updating one attribute often (animated positions, fixed colours), and passes that need only positions, such as shadow maps"), tx(t, "oglVao_l2c", "one more stream to fetch per vertex")],
        ]}
      />
      <CodeBlock lang="cpp" filename="separate.cpp" t={t}>{`// [x y z] × 3, then [r g b] × 3 in the same buffer: each attribute tightly packed
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)(9 * sizeof(float)));  // byte 36`}</CodeBlock>

      <H3>{tx(t, "oglVao_compactTitle", "Smaller attributes: normalized bytes")}</H3>
      <p>
        {tx(t, "oglVao_compactBody",
          "A colour does not need 32-bit floats. Stored as four unsigned bytes (red, green, blue, alpha from 0 to 255) with normalized = GL_TRUE, it arrives in the shader as a vec4 of 0…1 values, exactly as if it had been floats. The vertex shrinks from 12 + 12 = 24 bytes to 12 + 4 = 16, a third less memory and bandwidth for the same picture. Integer data that must stay integer, such as bone indices for skeletal animation, uses glVertexAttribIPointer instead (note the I) and an int or ivec input in the shader.")}
      </p>
      <CodeBlock lang="cpp" filename="compact.cpp" t={t}>{`struct Vertex { float pos[3]; uint8_t rgba[4]; };             // 16 bytes
glVertexAttribPointer(0, 3, GL_FLOAT,         GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, pos));
glVertexAttribPointer(1, 4, GL_UNSIGNED_BYTE, GL_TRUE,  sizeof(Vertex), (void*)offsetof(Vertex, rgba));
// 255 → 1.0, 128 → 0.502, 0 → 0.0 in the shader's vec4 aColor`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "oglVao_offsetofTip", "Describing a C++ struct with sizeof(Vertex) as the stride and offsetof(Vertex, field) as each offset keeps the numbers correct even if you add fields or the compiler inserts padding (the Algorithms track's memory chapter explains padding).")}
      </Callout>

      <H2>{tx(t, "oglVao_whatTitle", "What a VAO stores")}</H2>
      <p>
        {tx(t, "oglVao_whatBody",
          "All of these descriptions have to live somewhere, and that is the Vertex Array Object. While a VAO is bound, glVertexAttribPointer and glEnableVertexAttribArray write into it, and so does binding an element buffer. Later, binding the VAO again restores the whole layout in one call. Step through the setup and watch which calls change the VAO and which only change the context.")}
      </p>

      <VaoRecordFigure t={t} />

      <LessonTable
        headers={[tx(t, "oglVao_tStored", "Stored in the VAO"), tx(t, "oglVao_tNotStored", "Not stored in the VAO")]}
        rows={[
          [tx(t, "oglVao_st1", "per attribute: enabled or not, size, type, normalized, stride, offset"), tx(t, "oglVao_ns1", "the GL_ARRAY_BUFFER binding itself")],
          [tx(t, "oglVao_st2", "per attribute: the buffer bound to GL_ARRAY_BUFFER when glVertexAttribPointer ran"), tx(t, "oglVao_ns2", "the shader program (glUseProgram), uniforms and textures")],
          [tx(t, "oglVao_st3", "the GL_ELEMENT_ARRAY_BUFFER binding (the index buffer)"), tx(t, "oglVao_ns3", "the contents of the buffers: those live in the buffers, and the VAO only points at them")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "oglVao_goldenRule", "The rule that matters: the VAO must be bound when you call glVertexAttribPointer and glEnableVertexAttribArray, and the right VBO must be bound to GL_ARRAY_BUFFER at the moment of glVertexAttribPointer, because that is when the VAO captures it. Creating the VBO and filling it with glBufferData can happen before or after, with or without the VAO bound.")}
      </Callout>

      <H2>{tx(t, "oglVao_useTitle", "Creating and using VAOs")}</H2>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`GLuint vao, vbo;
glGenVertexArrays(1, &vao);
glGenBuffers(1, &vbo);

glBindVertexArray(vao);                       // start recording into vao
glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);
glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)(3 * sizeof(float)));
glEnableVertexAttribArray(1);
glBindVertexArray(0);                         // done; unbinding protects it from later calls`}</CodeBlock>
      <p>
        {tx(t, "oglVao_manyBody",
          "A program usually has one VAO per mesh, each with its own buffers and layout. Drawing then becomes: pick the shader, bind the mesh's VAO, draw. Switching meshes is one bind instead of re-describing every attribute.")}
      </p>
      <CodeBlock lang="cpp" filename="render_loop.cpp" t={t}>{`while (!glfwWindowShouldClose(window)) {
    glClear(GL_COLOR_BUFFER_BIT);
    glUseProgram(shaderProgram);

    glBindVertexArray(triangleVao);           // layout + buffer of mesh 1
    glDrawArrays(GL_TRIANGLES, 0, 3);

    glBindVertexArray(quadVao);               // layout + buffer of mesh 2
    glDrawArrays(GL_TRIANGLES, 0, 6);

    glfwSwapBuffers(window);
    glfwPollEvents();
}
// At shutdown: glDeleteVertexArrays(1, &triangleVao); ... then the buffers.`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "oglVao_dsaNote", "OpenGL 4.5's Direct State Access splits the same information more cleanly: glVertexArrayAttribFormat describes an attribute's format, glVertexArrayVertexBuffer attaches a buffer with its stride, and nothing has to be bound while you set it up. The DSA chapter rewrites this setup that way.")}
      </Callout>

      <H2>{tx(t, "oglVao_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglVao_tMistake", "Mistake"), tx(t, "oglVao_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglVao_e1", "No VAO bound in a Core context"), tx(t, "oglVao_e1b", "glVertexAttribPointer, glEnableVertexAttribArray and glDrawArrays fail with GL_INVALID_OPERATION; the screen stays empty. Create and bind a VAO first.")],
          [tx(t, "oglVao_e2", "Stride of one attribute instead of the whole vertex"), tx(t, "oglVao_e2b", "with interleaved data, every attribute's stride is the full vertex size (24 here). Using 12 reads the colours as positions.")],
          [tx(t, "oglVao_e3", "Stride 0 with interleaved data"), tx(t, "oglVao_e3b", "0 means tightly packed (size × type size), not \"none\". Pass the real vertex size.")],
          [tx(t, "oglVao_e4", "Offset as a number of floats"), tx(t, "oglVao_e4b", "offsets are in bytes: the colour after 3 floats starts at (void*)(3 * sizeof(float)), not (void*)3.")],
          [tx(t, "oglVao_e5", "Forgetting glEnableVertexAttribArray"), tx(t, "oglVao_e5b", "the attribute is not read; the shader gets a constant (usually 0, 0, 0, 1). Enable every attribute you describe.")],
          [tx(t, "oglVao_e6", "Index not matching the shader's location"), tx(t, "oglVao_e6b", "the data goes to a location the shader does not read, and the shader's input gets the constant. Keep the numbers in one place, or query glGetAttribLocation.")],
          [tx(t, "oglVao_e7", "Wrong VBO bound at glVertexAttribPointer"), tx(t, "oglVao_e7b", "the attribute reads a different buffer forever. Bind the VBO right before describing the attributes that use it.")],
          [tx(t, "oglVao_e8", "Leaving a VAO bound after setup"), tx(t, "oglVao_e8b", "later code that binds an element buffer or describes attributes silently changes this mesh. Unbind with glBindVertexArray(0) when done.")],
        ]}
      />

      <KeyIdeas t={t} id="oglVao" items={[
        "Vertex attributes are the shader's in variables; their locations connect them to buffer data.",
        "glVertexAttribPointer(index, size, type, normalized, stride, offset) describes one attribute; glEnableVertexAttribArray switches it on.",
        "Component k of vertex i is read at byte offset + i · stride + k · (type size); stride 0 means tightly packed.",
        "Interleaved layouts use the whole vertex size as every attribute's stride; separate layouts use each attribute's own size and a larger offset.",
        "Normalized integer types (colours as 4 bytes) and glVertexAttribIPointer (true integers) save memory and bandwidth.",
        "A VAO stores each attribute's format, enabled state and source buffer, plus the element buffer binding, but not the GL_ARRAY_BUFFER binding, the program or textures.",
        "The buffer an attribute reads is captured when glVertexAttribPointer runs, with the VAO bound.",
        "One VAO per mesh turns drawing into: use program, bind VAO, draw.",
      ]} />
    </Article>
  );
}
