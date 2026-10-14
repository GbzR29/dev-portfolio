// src/lib/reference/opengl/dsaBuffers.ts
// More of the "dsa" category: index buffer and instancing divisor of a VAO,
// mapping and copying buffers, all by ID.
import type { RefEntry } from "../types";
import { DSA_NOTE } from "./dsa";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

export const dsaBufferEntries: RefEntry[] = [
  {
    name: "glVertexArrayElementBuffer",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glVertexArrayElementBuffer(GLuint vaobj, GLuint buffer);",
    summary: {
      en: "Gives a VAO its index buffer (EBO), the one glDrawElements reads.",
      pt: "Dá a um VAO o seu index buffer (EBO), o que glDrawElements lê.",
    },
    description: {
      en: "The index buffer is part of the VAO's state. The old way stored it implicitly: whatever was bound to GL_ELEMENT_ARRAY_BUFFER while the VAO was bound. This sets it explicitly, so the classic bug of binding the EBO before (or after) the VAO cannot happen.",
      pt: "O index buffer faz parte do estado do VAO. O jeito antigo o guardava de forma implícita: o que estivesse ligado a GL_ELEMENT_ARRAY_BUFFER enquanto o VAO estava ligado. Esta função o define de forma explícita, então o bug clássico de ligar o EBO antes (ou depois) do VAO não acontece.",
    },
    params: [
      { name: "vaobj", type: "GLuint", desc: { en: "The VAO (from glCreateVertexArrays).", pt: "O VAO (de glCreateVertexArrays)." } },
      { name: "buffer", type: "GLuint", desc: { en: "The buffer with the indices, or 0 to remove it.", pt: "O buffer com os índices, ou 0 para removê-lo." } },
    ],
    notes: [DSA_NOTE],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "vaobj or buffer is not an existing object.", pt: "vaobj ou buffer não é um objeto existente." } },
    ],
    example: `glVertexArrayVertexBuffer(vao, 0, vbo, 0, sizeof(Vertex));
glVertexArrayElementBuffer(vao, ebo);
// later
glBindVertexArray(vao);
glDrawElements(GL_TRIANGLES, indexCount, GL_UNSIGNED_INT, nullptr);`,
    related: ["glCreateVertexArrays", "glVertexArrayVertexBuffer", "glDrawElements", "glBindBuffer"],
    khronos: `${KHR}glVertexArrayElementBuffer.xhtml`,
  },
  {
    name: "glVertexArrayBindingDivisor",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glVertexArrayBindingDivisor(GLuint vaobj, GLuint bindingindex, GLuint divisor);",
    summary: {
      en: "Makes a vertex buffer binding advance once per instance instead of once per vertex (instancing).",
      pt: "Faz um binding de vertex buffer avançar uma vez por instância em vez de uma vez por vértice (instancing).",
    },
    description: {
      en: "With divisor 0 (the default) the binding moves to the next element for every vertex. With divisor 1 it moves once per instance, so every vertex of instance 5 reads element 5: one model matrix, colour or offset per copy. With 2 it moves every two instances, and so on.\n\nIt applies to a buffer binding point, not to an attribute: every attribute that reads from that binding (glVertexArrayAttribBinding) becomes per-instance.",
      pt: "Com divisor 0 (o padrão) o binding avança para o próximo elemento a cada vértice. Com divisor 1 avança uma vez por instância, então todo vértice da instância 5 lê o elemento 5: uma matriz de modelo, cor ou deslocamento por cópia. Com 2 avança a cada duas instâncias, e assim por diante.\n\nVale para um ponto de binding de buffer, não para um atributo: todo atributo que lê daquele binding (glVertexArrayAttribBinding) passa a ser por instância.",
    },
    params: [
      { name: "vaobj", type: "GLuint", desc: { en: "The VAO.", pt: "O VAO." } },
      { name: "bindingindex", type: "GLuint", desc: { en: "The binding point (the one used in glVertexArrayVertexBuffer).", pt: "O ponto de binding (o usado em glVertexArrayVertexBuffer)." } },
      { name: "divisor", type: "GLuint", desc: { en: "0 = per vertex, 1 = per instance, n = every n instances.", pt: "0 = por vértice, 1 = por instância, n = a cada n instâncias." } },
    ],
    notes: [
      DSA_NOTE,
      { en: "A mat4 attribute takes 4 locations (one vec4 each); give all 4 the same binding, and that binding the divisor.", pt: "Um atributo mat4 ocupa 4 locations (um vec4 cada); dê o mesmo binding às 4, e o divisor a esse binding." },
    ],
    example: `// binding 0 = per-vertex mesh, binding 1 = per-instance offsets
glVertexArrayVertexBuffer(vao, 1, offsetsVbo, 0, sizeof(glm::vec2));
glVertexArrayAttribFormat(vao, 2, 2, GL_FLOAT, GL_FALSE, 0);
glVertexArrayAttribBinding(vao, 2, 1);
glEnableVertexArrayAttrib(vao, 2);
glVertexArrayBindingDivisor(vao, 1, 1);`,
    related: ["glVertexAttribDivisor", "glVertexArrayAttribBinding", "glDrawArraysInstanced", "glDrawElementsInstanced"],
    khronos: `${KHR}glVertexBindingDivisor.xhtml`,
  },
  {
    name: "glMapNamedBufferRange",
    category: "dsa",
    since: "GL 4.5",
    signature: "void *glMapNamedBufferRange(GLuint buffer, GLintptr offset, GLsizeiptr length,\n                            GLbitfield access);",
    summary: {
      en: "Gives the CPU a pointer into part of a buffer's memory, by ID.",
      pt: "Dá à CPU um ponteiro para parte da memória de um buffer, pelo ID.",
    },
    description: {
      en: "The DSA form of glMapBufferRange. Instead of copying data in with glNamedBufferSubData, you write (or read) through the returned pointer directly.\n\nWith storage created by glNamedBufferStorage using GL_MAP_PERSISTENT_BIT, the buffer can stay mapped forever: map once at start-up and write each frame into a region the GPU is not reading, protected by fences (glFenceSync). That is the fastest way to stream data every frame.",
      pt: "A forma DSA de glMapBufferRange. Em vez de copiar os dados com glNamedBufferSubData, você escreve (ou lê) direto pelo ponteiro devolvido.\n\nCom armazenamento criado por glNamedBufferStorage usando GL_MAP_PERSISTENT_BIT, o buffer pode ficar mapeado para sempre: mapeie uma vez na inicialização e escreva a cada frame numa região que a GPU não está lendo, protegida por fences (glFenceSync). É o jeito mais rápido de enviar dados todo frame.",
    },
    params: [
      { name: "buffer", type: "GLuint", desc: { en: "The buffer.", pt: "O buffer." } },
      { name: "offset", type: "GLintptr", desc: { en: "First byte to map.", pt: "Primeiro byte a mapear." } },
      { name: "length", type: "GLsizeiptr", desc: { en: "Number of bytes.", pt: "Número de bytes." } },
      {
        name: "access", type: "GLbitfield",
        desc: { en: "What you will do, combined with |.", pt: "O que você vai fazer, combinado com |." },
        values: [
          { name: "GL_MAP_WRITE_BIT / GL_MAP_READ_BIT", desc: { en: "Write into it / read from it.", pt: "Escrever nele / ler dele." } },
          { name: "GL_MAP_INVALIDATE_RANGE_BIT", desc: { en: "The old contents can be thrown away: no wait for the GPU to finish with them.", pt: "O conteúdo antigo pode ser descartado: sem esperar a GPU terminar de usá-lo." } },
          { name: "GL_MAP_PERSISTENT_BIT | GL_MAP_COHERENT_BIT", desc: { en: "Stay mapped while the GPU uses the buffer, with writes visible without a flush (the storage needs the same flags).", pt: "Fica mapeado enquanto a GPU usa o buffer, com escritas visíveis sem flush (o armazenamento precisa das mesmas flags)." } },
          { name: "GL_MAP_FLUSH_EXPLICIT_BIT", desc: { en: "You say which parts changed with glFlushMappedNamedBufferRange.", pt: "Você diz quais partes mudaram com glFlushMappedNamedBufferRange." } },
        ],
      },
    ],
    returns: {
      en: "A pointer to the mapped bytes, or nullptr on error.",
      pt: "Um ponteiro para os bytes mapeados, ou nullptr em caso de erro.",
    },
    notes: [
      DSA_NOTE,
      { en: "Never keep using a non-persistent pointer after glUnmapNamedBuffer, and never read from a pointer mapped only for writing: it can be uncached memory and very slow.", pt: "Nunca continue usando um ponteiro não persistente depois de glUnmapNamedBuffer, e nunca leia de um ponteiro mapeado só para escrita: pode ser memória sem cache e muito lenta." },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "The range goes outside the buffer.", pt: "A faixa sai do buffer." } },
      { code: "GL_INVALID_OPERATION", when: { en: "The buffer is already mapped, or access asks for something the storage flags do not allow.", pt: "O buffer já está mapeado, ou access pede algo que as flags do armazenamento não permitem." } },
    ],
    example: `GLbitfield flags = GL_MAP_WRITE_BIT | GL_MAP_PERSISTENT_BIT | GL_MAP_COHERENT_BIT;
glNamedBufferStorage(buf, 3 * regionSize, nullptr, flags);
char *ptr = (char *)glMapNamedBufferRange(buf, 0, 3 * regionSize, flags);
// each frame: write into ptr + frame % 3 * regionSize`,
    related: ["glMapBufferRange", "glUnmapNamedBuffer", "glNamedBufferStorage", "glNamedBufferSubData"],
    khronos: `${KHR}glMapBufferRange.xhtml`,
  },
  {
    name: "glUnmapNamedBuffer",
    category: "dsa",
    since: "GL 4.5",
    signature: "GLboolean glUnmapNamedBuffer(GLuint buffer);",
    summary: {
      en: "Ends a mapping made with glMapNamedBufferRange, so the GPU can use the buffer again.",
      pt: "Termina um mapeamento feito com glMapNamedBufferRange, assim a GPU pode usar o buffer de novo.",
    },
    description: {
      en: "While a buffer is mapped (without the persistent flag), drawing with it is an error. Unmapping hands it back to the GPU, and the pointer becomes invalid.",
      pt: "Enquanto um buffer está mapeado (sem a flag persistente), desenhar com ele é um erro. Desmapear devolve o buffer à GPU, e o ponteiro deixa de valer.",
    },
    params: [
      { name: "buffer", type: "GLuint", desc: { en: "The mapped buffer.", pt: "O buffer mapeado." } },
    ],
    returns: {
      en: "GL_TRUE normally. GL_FALSE in the rare case the contents were lost while mapped (for example a display mode change); then upload the data again.",
      pt: "GL_TRUE normalmente. GL_FALSE no caso raro de o conteúdo se perder durante o mapeamento (por exemplo, uma mudança de modo de vídeo); então envie os dados de novo.",
    },
    notes: [DSA_NOTE],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "The buffer is not mapped.", pt: "O buffer não está mapeado." } },
    ],
    example: `void *p = glMapNamedBufferRange(pbo, 0, size, GL_MAP_READ_BIT);
memcpy(pixels, p, size);
glUnmapNamedBuffer(pbo);`,
    related: ["glMapNamedBufferRange", "glUnmapBuffer"],
    khronos: `${KHR}glUnmapBuffer.xhtml`,
  },
  {
    name: "glCopyNamedBufferSubData",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glCopyNamedBufferSubData(GLuint readBuffer, GLuint writeBuffer, GLintptr readOffset,\n                              GLintptr writeOffset, GLsizeiptr size);",
    summary: {
      en: "Copies bytes from one buffer to another on the GPU, by ID, without passing through the CPU.",
      pt: "Copia bytes de um buffer para outro na GPU, pelo ID, sem passar pela CPU.",
    },
    description: {
      en: "The DSA form of glCopyBufferSubData. The copy happens in GPU memory, in order with the other commands. Two common uses: growing a buffer (create a bigger one, copy the old contents, delete the old one), and moving data from a CPU-visible staging buffer into a fast GPU-only one.",
      pt: "A forma DSA de glCopyBufferSubData. A cópia acontece na memória da GPU, em ordem com os outros comandos. Dois usos comuns: aumentar um buffer (crie um maior, copie o conteúdo antigo, apague o antigo) e mover dados de um staging buffer visível à CPU para um buffer rápido só da GPU.",
    },
    params: [
      { name: "readBuffer", type: "GLuint", desc: { en: "Source buffer.", pt: "Buffer de origem." } },
      { name: "writeBuffer", type: "GLuint", desc: { en: "Destination buffer (may be the same, if the ranges do not overlap).", pt: "Buffer de destino (pode ser o mesmo, se as faixas não se sobrepuserem)." } },
      { name: "readOffset", type: "GLintptr", desc: { en: "First source byte.", pt: "Primeiro byte de origem." } },
      { name: "writeOffset", type: "GLintptr", desc: { en: "First destination byte.", pt: "Primeiro byte de destino." } },
      { name: "size", type: "GLsizeiptr", desc: { en: "Bytes to copy.", pt: "Bytes a copiar." } },
    ],
    notes: [DSA_NOTE],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "A range goes outside its buffer, or the ranges overlap in the same buffer.", pt: "Uma faixa sai do seu buffer, ou as faixas se sobrepõem no mesmo buffer." } },
      { code: "GL_INVALID_OPERATION", when: { en: "Either buffer is mapped (without the persistent flag).", pt: "Algum dos buffers está mapeado (sem a flag persistente)." } },
    ],
    example: `// grow a buffer: old contents into a bigger one
GLuint bigger;
glCreateBuffers(1, &bigger);
glNamedBufferStorage(bigger, newSize, nullptr, GL_DYNAMIC_STORAGE_BIT);
glCopyNamedBufferSubData(old, bigger, 0, 0, oldSize);
glDeleteBuffers(1, &old);`,
    related: ["glCopyBufferSubData", "glNamedBufferStorage", "glCreateBuffers"],
    khronos: `${KHR}glCopyBufferSubData.xhtml`,
  },
];
