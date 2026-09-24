// src/lib/reference/opengl/vertexArrays.ts
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

export const vertexArrayEntries: RefEntry[] = [
  {
    name: "glGenVertexArrays",
    category: "vertex-arrays",
    since: "GL 3.0",
    signature: "void glGenVertexArrays(GLsizei n, GLuint *arrays);",
    summary: {
      en: "Reserves names (IDs) for new vertex array objects (VAOs).",
      pt: "Reserva nomes (IDs) para novos vertex array objects (VAOs).",
    },
    description: {
      en: "A VAO is a small object that remembers how to read your vertex buffers: which buffer each attribute comes from, its format, stride and offset, plus which index buffer to use.\n\nWithout a VAO you would repeat every glVertexAttribPointer call before each draw. With one, you configure once and later just bind the VAO. In the core profile a VAO must be bound to draw anything.",
      pt: "Um VAO é um objeto pequeno que lembra como ler seus vertex buffers: de qual buffer vem cada atributo, seu formato, stride e offset, e qual index buffer usar.\n\nSem VAO você repetiria cada chamada de glVertexAttribPointer antes de cada draw. Com ele, você configura uma vez e depois só faz bind do VAO. No core profile é obrigatório ter um VAO ligado para desenhar qualquer coisa.",
    },
    params: [
      { name: "n", type: "GLsizei", desc: { en: "How many IDs to generate.", pt: "Quantos IDs gerar." } },
      { name: "arrays", type: "GLuint *", desc: { en: "Array receiving the new IDs.", pt: "Array que recebe os novos IDs." } },
    ],
    errors: [{ code: "GL_INVALID_VALUE", when: { en: "n is negative.", pt: "n é negativo." } }],
    example: `GLuint vao;
glGenVertexArrays(1, &vao);
glBindVertexArray(vao);`,
    related: ["glBindVertexArray", "glDeleteVertexArrays", "glCreateVertexArrays"],
    khronos: `${KHR}glGenVertexArrays.xhtml`,
  },
  {
    name: "glBindVertexArray",
    category: "vertex-arrays",
    since: "GL 3.0",
    signature: "void glBindVertexArray(GLuint array);",
    summary: {
      en: "Makes a VAO current: it records vertex setup calls and is used by draw calls.",
      pt: "Torna um VAO o atual: ele grava as chamadas de configuração de vértices e é usado pelos draws.",
    },
    description: {
      en: "Binding a VAO has two roles. While you set things up, every glVertexAttribPointer, glEnableVertexAttribArray and GL_ELEMENT_ARRAY_BUFFER bind is recorded into it. When you draw, the GPU reads vertices exactly as the bound VAO describes.\n\nA typical frame is therefore: bind VAO → draw → bind next VAO → draw.",
      pt: "Fazer bind de um VAO tem dois papéis. Durante a configuração, cada glVertexAttribPointer, glEnableVertexAttribArray e bind de GL_ELEMENT_ARRAY_BUFFER é gravado nele. Na hora do draw, a GPU lê os vértices exatamente como o VAO ligado descreve.\n\nUm frame típico é então: bind VAO → draw → bind próximo VAO → draw.",
    },
    params: [
      { name: "array", type: "GLuint", desc: { en: "VAO ID, or 0 to unbind.", pt: "ID do VAO, ou 0 para desfazer o bind." } },
    ],
    notes: [
      { en: "Drawing with VAO 0 in the core profile produces GL_INVALID_OPERATION and nothing on screen.", pt: "Desenhar com o VAO 0 no core profile gera GL_INVALID_OPERATION e nada aparece na tela." },
      { en: "Bind the VAO BEFORE binding the element buffer, otherwise the index buffer is not recorded.", pt: "Faça bind do VAO ANTES do element buffer, senão o index buffer não é gravado." },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "array is not 0 and was never returned by glGenVertexArrays.", pt: "array não é 0 e nunca foi retornado por glGenVertexArrays." } },
    ],
    example: `glBindVertexArray(vao);
glDrawArrays(GL_TRIANGLES, 0, 3);
glBindVertexArray(0);`,
    related: ["glGenVertexArrays", "glVertexAttribPointer", "glDrawArrays", "glDrawElements"],
    khronos: `${KHR}glBindVertexArray.xhtml`,
  },
  {
    name: "glDeleteVertexArrays",
    category: "vertex-arrays",
    since: "GL 3.0",
    signature: "void glDeleteVertexArrays(GLsizei n, const GLuint *arrays);",
    summary: {
      en: "Destroys VAOs. The buffers they reference are NOT deleted.",
      pt: "Destrói VAOs. Os buffers que eles referenciam NÃO são deletados.",
    },
    description: {
      en: "Deletes n vertex array objects. A VAO only stores configuration, so deleting it does not free the vertex or index buffers — delete those separately with glDeleteBuffers.",
      pt: "Deleta n vertex array objects. Um VAO só guarda configuração, então deletá-lo não libera os vertex ou index buffers — delete esses separadamente com glDeleteBuffers.",
    },
    params: [
      { name: "n", type: "GLsizei", desc: { en: "Number of VAOs.", pt: "Número de VAOs." } },
      { name: "arrays", type: "const GLuint *", desc: { en: "IDs to delete; 0 and unknown IDs are ignored.", pt: "IDs a deletar; 0 e IDs desconhecidos são ignorados." } },
    ],
    errors: [{ code: "GL_INVALID_VALUE", when: { en: "n is negative.", pt: "n é negativo." } }],
    example: `glDeleteVertexArrays(1, &vao);
glDeleteBuffers(1, &vbo);`,
    related: ["glGenVertexArrays", "glDeleteBuffers"],
    khronos: `${KHR}glDeleteVertexArrays.xhtml`,
  },
  {
    name: "glVertexAttribPointer",
    category: "vertex-arrays",
    since: "GL 2.0",
    signature:
      "void glVertexAttribPointer(GLuint index, GLint size, GLenum type,\n                           GLboolean normalized, GLsizei stride, const void *pointer);",
    summary: {
      en: "Describes how one vertex attribute is laid out inside the currently bound GL_ARRAY_BUFFER.",
      pt: "Descreve como um atributo de vértice está organizado dentro do GL_ARRAY_BUFFER ligado.",
    },
    description: {
      en: "Your vertex buffer is just bytes; the GPU does not know that the first 12 bytes are a position and the next 8 are a UV. This function tells it, one attribute at a time.\n\nFor attribute index, it says: read size components of type type, skip stride bytes to get from one vertex to the next, and start pointer bytes into the buffer. It also captures WHICH buffer is bound to GL_ARRAY_BUFFER right now and stores it in the VAO.\n\nThe index matches layout(location = N) in the vertex shader.",
      pt: "Seu vertex buffer é só um monte de bytes; a GPU não sabe que os primeiros 12 bytes são uma posição e os próximos 8 são um UV. Esta função explica isso, um atributo por vez.\n\nPara o atributo index, ela diz: leia size componentes do tipo type, pule stride bytes para ir de um vértice ao próximo, e comece pointer bytes dentro do buffer. Ela também captura QUAL buffer está ligado em GL_ARRAY_BUFFER naquele momento e guarda isso no VAO.\n\nO index corresponde a layout(location = N) no vertex shader.",
    },
    params: [
      { name: "index", type: "GLuint", desc: { en: "Attribute location, same as layout(location = N) in GLSL.", pt: "Location do atributo, igual a layout(location = N) no GLSL." } },
      { name: "size", type: "GLint", desc: { en: "Components per vertex: 1, 2, 3 or 4 (e.g. 3 for a vec3 position).", pt: "Componentes por vértice: 1, 2, 3 ou 4 (ex.: 3 para uma posição vec3)." } },
      {
        name: "type", type: "GLenum",
        desc: { en: "Data type of each component in the buffer.", pt: "Tipo de dado de cada componente no buffer." },
        values: [
          { name: "GL_FLOAT", desc: { en: "32-bit float — the most common.", pt: "float de 32 bits — o mais comum." } },
          { name: "GL_UNSIGNED_BYTE", desc: { en: "0–255, typically colors (use normalized = GL_TRUE).", pt: "0–255, normalmente cores (use normalized = GL_TRUE)." } },
          { name: "GL_INT / GL_SHORT / GL_HALF_FLOAT", desc: { en: "Other compact formats.", pt: "Outros formatos compactos." } },
        ],
      },
      { name: "normalized", type: "GLboolean", desc: { en: "For integer types: GL_TRUE maps them to 0–1 (or -1–1). Ignored for floats — pass GL_FALSE.", pt: "Para tipos inteiros: GL_TRUE mapeia para 0–1 (ou -1–1). Ignorado para floats — passe GL_FALSE." } },
      { name: "stride", type: "GLsizei", desc: { en: "Bytes from the start of one vertex to the start of the next. 0 means \"tightly packed\".", pt: "Bytes do início de um vértice até o início do próximo. 0 significa \"sem espaço entre eles\"." } },
      { name: "pointer", type: "const void *", desc: { en: "Byte offset of this attribute inside a vertex, cast to void*. Not a real pointer!", pt: "Offset em bytes deste atributo dentro de um vértice, convertido para void*. Não é um ponteiro de verdade!" } },
    ],
    notes: [
      { en: "The attribute stays disabled until you call glEnableVertexAttribArray(index).", pt: "O atributo fica desativado até você chamar glEnableVertexAttribArray(index)." },
      { en: "For integer attributes used as int/ivec in GLSL use glVertexAttribIPointer, otherwise they are converted to float.", pt: "Para atributos inteiros usados como int/ivec no GLSL use glVertexAttribIPointer, senão eles viram float." },
      { en: "Use offsetof(Vertex, member) to compute pointer safely when vertices are a struct.", pt: "Use offsetof(Vertex, membro) para calcular pointer com segurança quando os vértices são uma struct." },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "index ≥ GL_MAX_VERTEX_ATTRIBS, size not in 1–4, or stride negative.", pt: "index ≥ GL_MAX_VERTEX_ATTRIBS, size fora de 1–4, ou stride negativo." } },
      { code: "GL_INVALID_OPERATION", when: { en: "No VAO bound, or no GL_ARRAY_BUFFER bound while pointer is non-zero.", pt: "Nenhum VAO ligado, ou nenhum GL_ARRAY_BUFFER ligado com pointer diferente de zero." } },
    ],
    example: `struct Vertex { glm::vec3 pos; glm::vec2 uv; };

glBindVertexArray(vao);
glBindBuffer(GL_ARRAY_BUFFER, vbo);

// location 0: vec3 position
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, pos));
glEnableVertexAttribArray(0);

// location 1: vec2 uv
glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, uv));
glEnableVertexAttribArray(1);`,
    related: ["glEnableVertexAttribArray", "glBindVertexArray", "glVertexAttribDivisor", "glVertexArrayAttribFormat"],
    khronos: `${KHR}glVertexAttribPointer.xhtml`,
  },
  {
    name: "glEnableVertexAttribArray",
    category: "vertex-arrays",
    since: "GL 2.0",
    signature: "void glEnableVertexAttribArray(GLuint index);",
    summary: {
      en: "Turns on reading a vertex attribute from its buffer.",
      pt: "Liga a leitura de um atributo de vértice a partir do seu buffer.",
    },
    description: {
      en: "Attributes start disabled. A disabled attribute gives the shader a constant value (by default 0,0,0,1) instead of per-vertex data. Forgetting this call is one of the most common reasons for a black or invisible mesh.\n\nThe enabled/disabled state is stored in the bound VAO.",
      pt: "Atributos começam desativados. Um atributo desativado entrega ao shader um valor constante (por padrão 0,0,0,1) em vez de dados por vértice. Esquecer esta chamada é um dos motivos mais comuns para uma malha preta ou invisível.\n\nO estado ativado/desativado fica guardado no VAO ligado.",
    },
    params: [
      { name: "index", type: "GLuint", desc: { en: "Attribute location to enable.", pt: "Location do atributo a ativar." } },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "No VAO is bound.", pt: "Nenhum VAO ligado." } },
      { code: "GL_INVALID_VALUE", when: { en: "index ≥ GL_MAX_VERTEX_ATTRIBS.", pt: "index ≥ GL_MAX_VERTEX_ATTRIBS." } },
    ],
    example: `glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);`,
    related: ["glVertexAttribPointer", "glEnableVertexArrayAttrib"],
    khronos: `${KHR}glEnableVertexAttribArray.xhtml`,
  },
  {
    name: "glVertexAttribDivisor",
    category: "vertex-arrays",
    since: "GL 3.3",
    signature: "void glVertexAttribDivisor(GLuint index, GLuint divisor);",
    summary: {
      en: "Makes an attribute advance per instance instead of per vertex (for instancing).",
      pt: "Faz um atributo avançar por instância em vez de por vértice (para instancing).",
    },
    description: {
      en: "Normally the GPU reads the next value of every attribute for every vertex. With a divisor of 1, the attribute only advances once per instance — so all vertices of instance 0 see the first value, all of instance 1 see the second, and so on.\n\nThat is how you give each of 10 000 instanced asteroids its own model matrix or color while sharing a single mesh.",
      pt: "Normalmente a GPU lê o próximo valor de cada atributo para cada vértice. Com divisor 1, o atributo só avança uma vez por instância — então todos os vértices da instância 0 veem o primeiro valor, todos da instância 1 veem o segundo, e assim por diante.\n\nÉ assim que você dá a cada um de 10 000 asteroides instanciados sua própria matriz de modelo ou cor, compartilhando uma única malha.",
    },
    params: [
      { name: "index", type: "GLuint", desc: { en: "Attribute location.", pt: "Location do atributo." } },
      { name: "divisor", type: "GLuint", desc: { en: "0 = per vertex (default). N = advance once every N instances.", pt: "0 = por vértice (padrão). N = avança uma vez a cada N instâncias." } },
    ],
    notes: [
      { en: "A mat4 attribute occupies 4 consecutive locations; set the divisor on all four.", pt: "Um atributo mat4 ocupa 4 locations consecutivas; defina o divisor nas quatro." },
    ],
    errors: [{ code: "GL_INVALID_VALUE", when: { en: "index ≥ GL_MAX_VERTEX_ATTRIBS.", pt: "index ≥ GL_MAX_VERTEX_ATTRIBS." } }],
    example: `// mat4 instance matrix at locations 3..6
for (int i = 0; i < 4; ++i) {
    glEnableVertexAttribArray(3 + i);
    glVertexAttribPointer(3 + i, 4, GL_FLOAT, GL_FALSE, sizeof(glm::mat4),
                          (void*)(i * sizeof(glm::vec4)));
    glVertexAttribDivisor(3 + i, 1);
}
glDrawElementsInstanced(GL_TRIANGLES, indexCount, GL_UNSIGNED_INT, 0, amount);`,
    related: ["glDrawArraysInstanced", "glDrawElementsInstanced", "glVertexAttribPointer"],
    khronos: `${KHR}glVertexAttribDivisor.xhtml`,
  },
];
