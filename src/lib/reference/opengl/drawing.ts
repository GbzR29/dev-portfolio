// src/lib/reference/opengl/drawing.ts
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

const MODE_VALUES = [
  { name: "GL_TRIANGLES", desc: { en: "Every 3 vertices form one triangle. The default choice.", pt: "Cada 3 vértices formam um triângulo. A escolha padrão." } },
  { name: "GL_TRIANGLE_STRIP", desc: { en: "Each new vertex forms a triangle with the previous two.", pt: "Cada vértice novo forma um triângulo com os dois anteriores." } },
  { name: "GL_TRIANGLE_FAN", desc: { en: "All triangles share the first vertex.", pt: "Todos os triângulos compartilham o primeiro vértice." } },
  { name: "GL_LINES / GL_LINE_STRIP / GL_LINE_LOOP", desc: { en: "Line segments.", pt: "Segmentos de linha." } },
  { name: "GL_POINTS", desc: { en: "One point per vertex.", pt: "Um ponto por vértice." } },
];

export const drawingEntries: RefEntry[] = [
  {
    name: "glDrawArrays",
    category: "drawing",
    since: "GL 1.1",
    signature: "void glDrawArrays(GLenum mode, GLint first, GLsizei count);",
    summary: {
      en: "Draws primitives by reading vertices in order from the bound VAO.",
      pt: "Desenha primitivas lendo os vértices em ordem a partir do VAO ligado.",
    },
    description: {
      en: "This is the moment the pipeline actually runs. The GPU takes count vertices starting at first, runs the vertex shader on each, groups them into primitives according to mode, rasterizes and runs the fragment shader.\n\nIt uses whatever is currently bound: the VAO, the shader program, textures and uniforms. If the result is a black screen, the problem is almost always in that state, not in this call.",
      pt: "Este é o momento em que o pipeline realmente roda. A GPU pega count vértices começando em first, roda o vertex shader em cada um, agrupa em primitivas conforme mode, rasteriza e roda o fragment shader.\n\nEla usa o que estiver ligado no momento: o VAO, o shader program, texturas e uniforms. Se o resultado for uma tela preta, o problema quase sempre está nesse estado, não nesta chamada.",
    },
    params: [
      { name: "mode", type: "GLenum", desc: { en: "How vertices are assembled into primitives.", pt: "Como os vértices são montados em primitivas." }, values: MODE_VALUES },
      { name: "first", type: "GLint", desc: { en: "Index of the first vertex to use.", pt: "Índice do primeiro vértice a usar." } },
      { name: "count", type: "GLsizei", desc: { en: "Number of VERTICES (not triangles). A triangle needs 3.", pt: "Número de VÉRTICES (não de triângulos). Um triângulo precisa de 3." } },
    ],
    notes: [
      { en: "Shared corners are duplicated: a quad needs 6 vertices. Use glDrawElements to reuse vertices.", pt: "Cantos compartilhados são duplicados: um quad precisa de 6 vértices. Use glDrawElements para reaproveitar vértices." },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "No VAO bound (core profile) or no valid program in use.", pt: "Nenhum VAO ligado (core profile) ou nenhum programa válido em uso." } },
      { code: "GL_INVALID_VALUE", when: { en: "count is negative.", pt: "count é negativo." } },
    ],
    example: `glUseProgram(shader);
glBindVertexArray(vao);
glDrawArrays(GL_TRIANGLES, 0, 3); // one triangle`,
    related: ["glDrawElements", "glDrawArraysInstanced", "glBindVertexArray", "glUseProgram"],
    khronos: `${KHR}glDrawArrays.xhtml`,
  },
  {
    name: "glDrawElements",
    category: "drawing",
    since: "GL 1.1",
    signature: "void glDrawElements(GLenum mode, GLsizei count, GLenum type, const void *indices);",
    summary: {
      en: "Draws primitives using an index buffer to choose which vertices to use.",
      pt: "Desenha primitivas usando um index buffer para escolher quais vértices usar.",
    },
    description: {
      en: "Instead of reading vertices in order, the GPU reads count indices from the element buffer stored in the bound VAO, and fetches the vertex each index points to. A cube needs only 8 unique vertices plus 36 small indices, instead of 36 full vertices.\n\nThe GPU also caches recently transformed vertices, so reused indices are nearly free.",
      pt: "Em vez de ler os vértices em ordem, a GPU lê count índices do element buffer guardado no VAO ligado, e busca o vértice que cada índice aponta. Um cubo precisa de só 8 vértices únicos mais 36 índices pequenos, em vez de 36 vértices completos.\n\nA GPU também guarda em cache vértices transformados recentemente, então índices repetidos saem quase de graça.",
    },
    params: [
      { name: "mode", type: "GLenum", desc: { en: "Primitive type.", pt: "Tipo de primitiva." }, values: MODE_VALUES },
      { name: "count", type: "GLsizei", desc: { en: "Number of INDICES to read.", pt: "Número de ÍNDICES a ler." } },
      {
        name: "type", type: "GLenum",
        desc: { en: "Type of each index in the element buffer.", pt: "Tipo de cada índice no element buffer." },
        values: [
          { name: "GL_UNSIGNED_INT", desc: { en: "32-bit — safe default.", pt: "32 bits — padrão seguro." } },
          { name: "GL_UNSIGNED_SHORT", desc: { en: "16-bit — up to 65 535 vertices, half the memory.", pt: "16 bits — até 65 535 vértices, metade da memória." } },
          { name: "GL_UNSIGNED_BYTE", desc: { en: "8-bit — up to 255 vertices.", pt: "8 bits — até 255 vértices." } },
        ],
      },
      { name: "indices", type: "const void *", desc: { en: "Byte offset into the element buffer, cast to void*. Usually 0.", pt: "Offset em bytes dentro do element buffer, convertido para void*. Normalmente 0." } },
    ],
    notes: [
      { en: "type must match the actual C++ type of your index array: unsigned int ↔ GL_UNSIGNED_INT.", pt: "type deve bater com o tipo C++ real do seu array de índices: unsigned int ↔ GL_UNSIGNED_INT." },
      { en: "If nothing is drawn, check that the EBO was bound while the VAO was bound.", pt: "Se nada for desenhado, verifique se o EBO foi ligado enquanto o VAO estava ligado." },
    ],
    errors: [
      { code: "GL_INVALID_ENUM", when: { en: "type is not one of the three unsigned types.", pt: "type não é um dos três tipos unsigned." } },
      { code: "GL_INVALID_OPERATION", when: { en: "No VAO bound, or no program in use.", pt: "Nenhum VAO ligado, ou nenhum programa em uso." } },
    ],
    example: `unsigned int indices[] = { 0, 1, 3,   1, 2, 3 }; // quad = 2 triangles
glBindVertexArray(vao);
glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo);
glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);

glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);`,
    related: ["glDrawArrays", "glDrawElementsInstanced", "glBindBuffer", "glBindVertexArray"],
    khronos: `${KHR}glDrawElements.xhtml`,
  },
  {
    name: "glDrawArraysInstanced",
    category: "drawing",
    since: "GL 3.1",
    signature: "void glDrawArraysInstanced(GLenum mode, GLint first, GLsizei count, GLsizei instancecount);",
    summary: {
      en: "Draws the same vertices many times in a single call.",
      pt: "Desenha os mesmos vértices várias vezes em uma única chamada.",
    },
    description: {
      en: "Behaves like glDrawArrays repeated instancecount times, but costs one call. Each repetition (instance) gets a different gl_InstanceID in the vertex shader, and attributes with a divisor advance per instance — that is where each copy gets its own position or color.\n\nUse it for grass, particles, crowds: anything with many copies of one mesh.",
      pt: "Funciona como glDrawArrays repetido instancecount vezes, mas custa uma chamada só. Cada repetição (instância) recebe um gl_InstanceID diferente no vertex shader, e atributos com divisor avançam por instância — é daí que cada cópia tira sua própria posição ou cor.\n\nUse para grama, partículas, multidões: qualquer coisa com muitas cópias de uma malha.",
    },
    params: [
      { name: "mode", type: "GLenum", desc: { en: "Primitive type (as in glDrawArrays).", pt: "Tipo de primitiva (como em glDrawArrays)." } },
      { name: "first", type: "GLint", desc: { en: "First vertex.", pt: "Primeiro vértice." } },
      { name: "count", type: "GLsizei", desc: { en: "Vertices per instance.", pt: "Vértices por instância." } },
      { name: "instancecount", type: "GLsizei", desc: { en: "How many instances to draw.", pt: "Quantas instâncias desenhar." } },
    ],
    example: `// Vertex shader: vec2 offset = offsets[gl_InstanceID];
glBindVertexArray(quadVAO);
glDrawArraysInstanced(GL_TRIANGLES, 0, 6, 100);`,
    related: ["glDrawElementsInstanced", "glVertexAttribDivisor", "glDrawArrays"],
    khronos: `${KHR}glDrawArraysInstanced.xhtml`,
  },
  {
    name: "glDrawElementsInstanced",
    category: "drawing",
    since: "GL 3.1",
    signature: "void glDrawElementsInstanced(GLenum mode, GLsizei count, GLenum type,\n                             const void *indices, GLsizei instancecount);",
    summary: {
      en: "Indexed version of instanced drawing — the usual way to draw many copies of a model.",
      pt: "Versão indexada do desenho instanciado — o jeito comum de desenhar muitas cópias de um modelo.",
    },
    description: {
      en: "Combines glDrawElements (reuse vertices through an index buffer) with instancing (repeat the whole mesh instancecount times). Loaded models are almost always indexed, so this is the call you will use for them.",
      pt: "Combina glDrawElements (reaproveitar vértices via index buffer) com instancing (repetir a malha inteira instancecount vezes). Modelos carregados quase sempre são indexados, então esta é a chamada que você vai usar com eles.",
    },
    params: [
      { name: "mode", type: "GLenum", desc: { en: "Primitive type.", pt: "Tipo de primitiva." } },
      { name: "count", type: "GLsizei", desc: { en: "Indices per instance.", pt: "Índices por instância." } },
      { name: "type", type: "GLenum", desc: { en: "Index type: GL_UNSIGNED_INT, GL_UNSIGNED_SHORT or GL_UNSIGNED_BYTE.", pt: "Tipo do índice: GL_UNSIGNED_INT, GL_UNSIGNED_SHORT ou GL_UNSIGNED_BYTE." } },
      { name: "indices", type: "const void *", desc: { en: "Byte offset into the element buffer.", pt: "Offset em bytes no element buffer." } },
      { name: "instancecount", type: "GLsizei", desc: { en: "Number of instances.", pt: "Número de instâncias." } },
    ],
    example: `glBindVertexArray(rockVAO);
glDrawElementsInstanced(GL_TRIANGLES, rockIndexCount, GL_UNSIGNED_INT, 0, 10000);`,
    related: ["glDrawArraysInstanced", "glVertexAttribDivisor", "glDrawElements"],
    khronos: `${KHR}glDrawElementsInstanced.xhtml`,
  },
];
