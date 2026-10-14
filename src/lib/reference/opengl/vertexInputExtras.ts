// src/lib/reference/opengl/vertexInputExtras.ts
// Integer attributes, the separate-format vertex buffer binding, and looking
// up an attribute's location.
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

export const vertexInputExtraEntries: RefEntry[] = [
  {
    name: "glVertexAttribIPointer",
    category: "vertex-arrays",
    since: "GL 3.0",
    signature: "void glVertexAttribIPointer(GLuint index, GLint size, GLenum type,\n                            GLsizei stride, const void *pointer);",
    summary: {
      en: "glVertexAttribPointer for integer attributes: the values reach the shader as ints, not converted to float.",
      pt: "glVertexAttribPointer para atributos inteiros: os valores chegam ao shader como int, sem virar float.",
    },
    description: {
      en: "glVertexAttribPointer always delivers floats: an int 3 in the buffer arrives as 3.0 (or as 0.0118 if normalized). For data that must stay an exact integer, such as the bone indices of a skinned mesh used to index an array of matrices, that conversion is wrong. glVertexAttribIPointer (note the I) keeps them as integers, and the shader declares the input as int, ivec4, uint or uvec4.",
      pt: "glVertexAttribPointer sempre entrega floats: um int 3 no buffer chega como 3.0 (ou como 0.0118 se normalizado). Para dados que precisam continuar inteiros exatos, como os índices de ossos de uma malha com skinning usados para indexar um array de matrizes, essa conversão está errada. glVertexAttribIPointer (repare no I) mantém os inteiros, e o shader declara a entrada como int, ivec4, uint ou uvec4.",
    },
    params: [
      { name: "index", type: "GLuint", desc: { en: "Attribute location, as layout(location = N) in the shader.", pt: "Location do atributo, como layout(location = N) no shader." } },
      { name: "size", type: "GLint", desc: { en: "Components per vertex: 1 to 4.", pt: "Componentes por vértice: 1 a 4." } },
      { name: "type", type: "GLenum", desc: { en: "An integer type only: GL_INT, GL_UNSIGNED_INT, GL_SHORT, GL_UNSIGNED_BYTE…", pt: "Só tipos inteiros: GL_INT, GL_UNSIGNED_INT, GL_SHORT, GL_UNSIGNED_BYTE…" } },
      { name: "stride", type: "GLsizei", desc: { en: "Bytes from one vertex to the next.", pt: "Bytes de um vértice ao próximo." } },
      { name: "pointer", type: "const void *", desc: { en: "Byte offset of this attribute inside a vertex.", pt: "Offset em bytes deste atributo dentro de um vértice." } },
    ],
    notes: [
      { en: "Using the float version with an ivec4 input is the classic skinning bug: indices arrive as garbage and the mesh explodes.", pt: "Usar a versão float com uma entrada ivec4 é o bug clássico de skinning: os índices chegam como lixo e a malha explode." },
      { en: "There is no normalized argument: integers are never normalized here.", pt: "Não há argumento normalized: aqui os inteiros nunca são normalizados." },
    ],
    errors: [
      { code: "GL_INVALID_ENUM", when: { en: "type is a float type such as GL_FLOAT.", pt: "type é um tipo float, como GL_FLOAT." } },
      { code: "GL_INVALID_VALUE", when: { en: "index ≥ GL_MAX_VERTEX_ATTRIBS or size outside 1–4.", pt: "index ≥ GL_MAX_VERTEX_ATTRIBS ou size fora de 1–4." } },
    ],
    example: `// GLSL: layout(location = 3) in ivec4 aBoneIds;
glVertexAttribIPointer(3, 4, GL_INT, sizeof(SkinnedVertex),
                       (void *)offsetof(SkinnedVertex, boneIds));
glEnableVertexAttribArray(3);`,
    related: ["glVertexAttribPointer", "glEnableVertexAttribArray", "glVertexArrayAttribFormat"],
    khronos: `${KHR}glVertexAttribPointer.xhtml`,
  },
  {
    name: "glBindVertexBuffer",
    category: "vertex-arrays",
    since: "GL 4.3",
    signature: "void glBindVertexBuffer(GLuint bindingindex, GLuint buffer, GLintptr offset, GLsizei stride);",
    summary: {
      en: "Puts a buffer on a binding point of the bound VAO; the attribute formats are described separately.",
      pt: "Coloca um buffer num ponto de binding do VAO ligado; os formatos dos atributos são descritos à parte.",
    },
    description: {
      en: "glVertexAttribPointer mixes two things in one call: the attribute's format (3 floats at offset 12) and the buffer it reads from. GL 4.3 split them. glVertexAttribFormat describes the format once, glVertexAttribBinding connects the attribute to a binding point, and glBindVertexBuffer says which buffer that binding point reads.\n\nThe gain: drawing the same vertex layout from another buffer is one call, glBindVertexBuffer, with no need to repeat every attribute. Renderers that batch many meshes switch buffers this way.",
      pt: "glVertexAttribPointer mistura duas coisas numa chamada: o formato do atributo (3 floats no offset 12) e o buffer de onde ele lê. O GL 4.3 separou as duas. glVertexAttribFormat descreve o formato uma vez, glVertexAttribBinding liga o atributo a um ponto de binding, e glBindVertexBuffer diz qual buffer aquele ponto de binding lê.\n\nO ganho: desenhar o mesmo layout de vértice a partir de outro buffer é uma chamada, glBindVertexBuffer, sem repetir cada atributo. Renderizadores que agrupam muitas malhas trocam de buffer assim.",
    },
    params: [
      { name: "bindingindex", type: "GLuint", desc: { en: "The binding point (0, 1, …), up to GL_MAX_VERTEX_ATTRIB_BINDINGS.", pt: "O ponto de binding (0, 1, …), até GL_MAX_VERTEX_ATTRIB_BINDINGS." } },
      { name: "buffer", type: "GLuint", desc: { en: "The vertex buffer.", pt: "O vertex buffer." } },
      { name: "offset", type: "GLintptr", desc: { en: "Byte offset of the first vertex in the buffer.", pt: "Offset em bytes do primeiro vértice no buffer." } },
      { name: "stride", type: "GLsizei", desc: { en: "Bytes from one vertex to the next (must be given; 0 does not mean tightly packed here).", pt: "Bytes de um vértice ao próximo (precisa ser informado; aqui 0 não significa colado)." } },
    ],
    notes: [
      { en: "It affects the currently bound VAO. The DSA form glVertexArrayVertexBuffer takes the VAO as an argument.", pt: "Afeta o VAO ligado no momento. A forma DSA glVertexArrayVertexBuffer recebe o VAO como argumento." },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "No VAO is bound.", pt: "Nenhum VAO ligado." } },
      { code: "GL_INVALID_VALUE", when: { en: "bindingindex is too large, or offset/stride is negative.", pt: "bindingindex grande demais, ou offset/stride negativo." } },
    ],
    example: `glBindVertexArray(vao);           // format already set up once
glBindVertexBuffer(0, meshA, 0, sizeof(Vertex));
glDrawArrays(GL_TRIANGLES, 0, countA);
glBindVertexBuffer(0, meshB, 0, sizeof(Vertex));
glDrawArrays(GL_TRIANGLES, 0, countB);`,
    related: ["glVertexArrayVertexBuffer", "glVertexAttribPointer", "glVertexArrayAttribFormat", "glVertexArrayAttribBinding"],
    khronos: `${KHR}glBindVertexBuffer.xhtml`,
  },
  {
    name: "glGetAttribLocation",
    category: "shaders",
    since: "GL 2.0",
    signature: "GLint glGetAttribLocation(GLuint program, const GLchar *name);",
    summary: {
      en: "Asks a linked program which location the linker gave a vertex input; -1 if it does not exist.",
      pt: "Pergunta a um programa linkado qual location o linker deu a uma entrada de vértice; -1 se ela não existir.",
    },
    description: {
      en: "If the vertex shader does not say layout(location = N), the linker picks the locations itself, and the C++ side has to ask for them by name before calling glVertexAttribPointer.\n\nWriting layout(location = N) in the shader is simpler and safer: the numbers are fixed and visible in both places, so this function is mostly found in older code. It returns -1 when the name is wrong, or when the input exists but is never used and the compiler removed it.",
      pt: "Se o vertex shader não diz layout(location = N), o linker escolhe as locations sozinho, e o lado C++ precisa perguntá-las pelo nome antes de chamar glVertexAttribPointer.\n\nEscrever layout(location = N) no shader é mais simples e seguro: os números ficam fixos e visíveis nos dois lugares, por isso esta função aparece mais em código antigo. Ela devolve -1 quando o nome está errado, ou quando a entrada existe mas nunca é usada e o compilador a removeu.",
    },
    params: [
      { name: "program", type: "GLuint", desc: { en: "A successfully linked program.", pt: "Um programa linkado com sucesso." } },
      { name: "name", type: "const GLchar *", desc: { en: "The input's name in the vertex shader, e.g. \"aPos\".", pt: "O nome da entrada no vertex shader, por exemplo \"aPos\"." } },
    ],
    returns: {
      en: "The location (0, 1, …), or -1 if there is no active input with that name.",
      pt: "A location (0, 1, …), ou -1 se não houver entrada ativa com esse nome.",
    },
    notes: [
      { en: "Never pass -1 on to glVertexAttribPointer or glEnableVertexAttribArray: as a GLuint it becomes 4294967295 and raises GL_INVALID_VALUE.", pt: "Nunca passe -1 adiante para glVertexAttribPointer ou glEnableVertexAttribArray: como GLuint vira 4294967295 e gera GL_INVALID_VALUE." },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "program has not been linked successfully.", pt: "program não foi linkado com sucesso." } },
    ],
    example: `GLint posLoc = glGetAttribLocation(program, "aPos");
if (posLoc >= 0) {
    glVertexAttribPointer(posLoc, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void *)0);
    glEnableVertexAttribArray(posLoc);
}`,
    related: ["glGetUniformLocation", "glVertexAttribPointer", "glLinkProgram"],
    khronos: `${KHR}glGetAttribLocation.xhtml`,
  },
];
