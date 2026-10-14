// src/lib/reference/opengl/bufferStorage.ts
// More of the "buffers" category: immutable storage and flushing mapped writes.
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

export const bufferStorageEntries: RefEntry[] = [
  {
    name: "glBufferStorage",
    category: "buffers",
    since: "GL 4.4",
    signature: "void glBufferStorage(GLenum target, GLsizeiptr size, const void *data, GLbitfield flags);",
    summary: {
      en: "Allocates immutable storage for the bound buffer: fixed size, with flags that say exactly how the CPU will use it.",
      pt: "Aloca armazenamento imutável para o buffer ligado: tamanho fixo, com flags que dizem exatamente como a CPU vai usá-lo.",
    },
    description: {
      en: "glBufferData can be called again at any time to resize, so the driver must always be ready to move the buffer. glBufferStorage gives that up: the size is final. In exchange you get the strongest feature of modern buffers, persistent mapping. Map the buffer once with GL_MAP_PERSISTENT_BIT and keep the pointer for the life of the program, writing each frame into a region the GPU is not reading (fences tell you which).\n\nWith flags = 0 the CPU can never touch the buffer again: the driver can put it in the fastest GPU memory. That suits static meshes.",
      pt: "glBufferData pode ser chamada de novo a qualquer momento para mudar o tamanho, então o driver precisa estar sempre pronto para mover o buffer. glBufferStorage abre mão disso: o tamanho é definitivo. Em troca você ganha o recurso mais forte dos buffers modernos, o mapeamento persistente. Mapeie o buffer uma vez com GL_MAP_PERSISTENT_BIT e guarde o ponteiro durante todo o programa, escrevendo a cada frame numa região que a GPU não está lendo (as fences dizem qual).\n\nCom flags = 0 a CPU nunca mais pode mexer no buffer: o driver pode colocá-lo na memória mais rápida da GPU. Isso serve para malhas estáticas.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "Where the buffer is bound: GL_ARRAY_BUFFER, GL_UNIFORM_BUFFER…", pt: "Onde o buffer está ligado: GL_ARRAY_BUFFER, GL_UNIFORM_BUFFER…" } },
      { name: "size", type: "GLsizeiptr", desc: { en: "Size in bytes, fixed forever.", pt: "Tamanho em bytes, fixo para sempre." } },
      { name: "data", type: "const void *", desc: { en: "Initial contents, or nullptr.", pt: "Conteúdo inicial, ou nullptr." } },
      {
        name: "flags", type: "GLbitfield",
        desc: { en: "What the CPU may do, combined with |. 0 = nothing.", pt: "O que a CPU pode fazer, combinado com |. 0 = nada." },
        values: [
          { name: "GL_DYNAMIC_STORAGE_BIT", desc: { en: "glBufferSubData is allowed.", pt: "glBufferSubData é permitida." } },
          { name: "GL_MAP_READ_BIT / GL_MAP_WRITE_BIT", desc: { en: "The buffer may be mapped for reading / writing.", pt: "O buffer pode ser mapeado para leitura / escrita." } },
          { name: "GL_MAP_PERSISTENT_BIT", desc: { en: "It may stay mapped while the GPU uses it.", pt: "Pode continuar mapeado enquanto a GPU o usa." } },
          { name: "GL_MAP_COHERENT_BIT", desc: { en: "CPU writes become visible to the GPU without a flush.", pt: "As escritas da CPU ficam visíveis à GPU sem flush." } },
        ],
      },
    ],
    notes: [
      { en: "Calling glBufferData or glBufferStorage again on the same buffer is an error; delete it and create a new one to resize.", pt: "Chamar glBufferData ou glBufferStorage de novo no mesmo buffer é um erro; para mudar o tamanho, apague e crie outro." },
      { en: "Mapping later must ask only for flags given here.", pt: "O mapeamento depois só pode pedir flags dadas aqui." },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "No buffer is bound to target, or its storage is already immutable.", pt: "Nenhum buffer ligado a target, ou o armazenamento dele já é imutável." } },
      { code: "GL_INVALID_VALUE", when: { en: "size is 0 or negative, or flags combine bits wrongly (COHERENT without PERSISTENT).", pt: "size é 0 ou negativo, ou flags combina bits de forma errada (COHERENT sem PERSISTENT)." } },
    ],
    example: `GLbitfield flags = GL_MAP_WRITE_BIT | GL_MAP_PERSISTENT_BIT | GL_MAP_COHERENT_BIT;
glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferStorage(GL_ARRAY_BUFFER, 3 * regionSize, nullptr, flags);
void *ptr = glMapBufferRange(GL_ARRAY_BUFFER, 0, 3 * regionSize, flags);   // keep forever`,
    related: ["glNamedBufferStorage", "glBufferData", "glMapBufferRange", "glFenceSync", "glFlushMappedBufferRange"],
    khronos: `${KHR}glBufferStorage.xhtml`,
  },
  {
    name: "glFlushMappedBufferRange",
    category: "buffers",
    since: "GL 3.0",
    signature: "void glFlushMappedBufferRange(GLenum target, GLintptr offset, GLsizeiptr length);",
    summary: {
      en: "Tells OpenGL which bytes of a mapped buffer you wrote, when the mapping is not coherent.",
      pt: "Diz ao OpenGL quais bytes de um buffer mapeado você escreveu, quando o mapeamento não é coerente.",
    },
    description: {
      en: "Writing through a mapped pointer may sit in CPU caches where the GPU cannot see it. Two ways to make it visible: map with GL_MAP_COHERENT_BIT (automatic, sometimes a little slower), or map with GL_MAP_FLUSH_EXPLICIT_BIT and call this for exactly the bytes you changed. Flushing only the region you touched can be cheaper than keeping the whole buffer coherent.",
      pt: "O que você escreve por um ponteiro mapeado pode ficar nos caches da CPU, onde a GPU não enxerga. Há dois jeitos de tornar visível: mapear com GL_MAP_COHERENT_BIT (automático, às vezes um pouco mais lento), ou mapear com GL_MAP_FLUSH_EXPLICIT_BIT e chamar esta função exatamente para os bytes que mudaram. Fazer flush só da região que você mexeu pode sair mais barato do que manter o buffer inteiro coerente.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "Where the mapped buffer is bound.", pt: "Onde o buffer mapeado está ligado." } },
      { name: "offset", type: "GLintptr", desc: { en: "Start of the written bytes, relative to the start of the MAPPED range (not of the buffer).", pt: "Início dos bytes escritos, relativo ao início da faixa MAPEADA (não do buffer)." } },
      { name: "length", type: "GLsizeiptr", desc: { en: "How many bytes.", pt: "Quantos bytes." } },
    ],
    notes: [
      { en: "The DSA form is glFlushMappedNamedBufferRange(buffer, offset, length).", pt: "A forma DSA é glFlushMappedNamedBufferRange(buffer, offset, length)." },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "The buffer is not mapped, or was not mapped with GL_MAP_FLUSH_EXPLICIT_BIT.", pt: "O buffer não está mapeado, ou não foi mapeado com GL_MAP_FLUSH_EXPLICIT_BIT." } },
      { code: "GL_INVALID_VALUE", when: { en: "The range goes outside the mapped range.", pt: "A faixa sai da faixa mapeada." } },
    ],
    example: `void *p = glMapBufferRange(GL_ARRAY_BUFFER, 0, size,
                           GL_MAP_WRITE_BIT | GL_MAP_FLUSH_EXPLICIT_BIT);
memcpy((char *)p + off, data, n);
glFlushMappedBufferRange(GL_ARRAY_BUFFER, off, n);
glUnmapBuffer(GL_ARRAY_BUFFER);`,
    related: ["glMapBufferRange", "glBufferStorage", "glUnmapBuffer"],
    khronos: `${KHR}glFlushMappedBufferRange.xhtml`,
  },
];
