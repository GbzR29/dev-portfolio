// src/lib/reference/opengl/dsa.ts
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

const DSA_NOTE = {
  en: "Direct State Access (GL 4.5): the object is passed as a parameter, so nothing needs to be bound and no global state is disturbed.",
  pt: "Direct State Access (GL 4.5): o objeto é passado como parâmetro, então nada precisa estar ligado e nenhum estado global é alterado.",
};

export const dsaEntries: RefEntry[] = [
  {
    name: "glCreateBuffers",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glCreateBuffers(GLsizei n, GLuint *buffers);",
    summary: {
      en: "Creates buffer objects that exist immediately — no bind needed.",
      pt: "Cria buffer objects que já existem na hora — sem precisar de bind.",
    },
    description: {
      en: "The DSA replacement for glGenBuffers. glGen only reserves a name and the object appears at the first bind; glCreate creates the real object right away, so it can be passed straight to glNamedBuffer* functions.",
      pt: "O substituto DSA de glGenBuffers. glGen só reserva um nome e o objeto aparece no primeiro bind; glCreate cria o objeto real na hora, então ele pode ir direto para as funções glNamedBuffer*.",
    },
    params: [
      { name: "n", type: "GLsizei", desc: { en: "How many buffers.", pt: "Quantos buffers." } },
      { name: "buffers", type: "GLuint *", desc: { en: "Array receiving the IDs.", pt: "Array que recebe os IDs." } },
    ],
    notes: [DSA_NOTE],
    example: `GLuint vbo;
glCreateBuffers(1, &vbo);
glNamedBufferStorage(vbo, sizeof(vertices), vertices, 0);`,
    related: ["glGenBuffers", "glNamedBufferStorage", "glNamedBufferData"],
    khronos: `${KHR}glCreateBuffers.xhtml`,
  },
  {
    name: "glNamedBufferData",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glNamedBufferData(GLuint buffer, GLsizeiptr size, const void *data, GLenum usage);",
    summary: {
      en: "glBufferData without binding: (re)allocates a buffer's storage by ID.",
      pt: "glBufferData sem bind: (re)aloca o armazenamento de um buffer pelo ID.",
    },
    params: [
      { name: "buffer", type: "GLuint", desc: { en: "The buffer to allocate.", pt: "O buffer a alocar." } },
      { name: "size", type: "GLsizeiptr", desc: { en: "Size in bytes.", pt: "Tamanho em bytes." } },
      { name: "data", type: "const void *", desc: { en: "Initial data or nullptr.", pt: "Dados iniciais ou nullptr." } },
      { name: "usage", type: "GLenum", desc: { en: "GL_STATIC_DRAW, GL_DYNAMIC_DRAW, GL_STREAM_DRAW… (same as glBufferData).", pt: "GL_STATIC_DRAW, GL_DYNAMIC_DRAW, GL_STREAM_DRAW… (igual a glBufferData)." } },
    ],
    notes: [DSA_NOTE, { en: "If the size never changes, prefer glNamedBufferStorage.", pt: "Se o tamanho nunca muda, prefira glNamedBufferStorage." }],
    example: `glNamedBufferData(vbo, sizeof(vertices), vertices, GL_STATIC_DRAW);`,
    related: ["glBufferData", "glNamedBufferStorage", "glNamedBufferSubData"],
    khronos: `${KHR}glBufferData.xhtml`,
  },
  {
    name: "glNamedBufferStorage",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glNamedBufferStorage(GLuint buffer, GLsizeiptr size, const void *data, GLbitfield flags);",
    summary: {
      en: "Allocates IMMUTABLE storage for a buffer — fixed size, explicit usage flags.",
      pt: "Aloca armazenamento IMUTÁVEL para um buffer — tamanho fixo, flags de uso explícitas.",
    },
    description: {
      en: "Unlike glBufferData, the size can never change afterwards. In exchange you state precisely what you will do with it (flags), instead of a vague usage hint. With flags = 0 the buffer can only be modified by the GPU — perfect for static meshes.",
      pt: "Diferente de glBufferData, o tamanho nunca pode mudar depois. Em troca você declara exatamente o que vai fazer com ele (flags), em vez de uma dica vaga de uso. Com flags = 0 o buffer só pode ser modificado pela GPU — perfeito para malhas estáticas.",
    },
    params: [
      { name: "buffer", type: "GLuint", desc: { en: "Buffer to allocate (created with glCreateBuffers).", pt: "Buffer a alocar (criado com glCreateBuffers)." } },
      { name: "size", type: "GLsizeiptr", desc: { en: "Size in bytes, fixed forever.", pt: "Tamanho em bytes, fixo para sempre." } },
      { name: "data", type: "const void *", desc: { en: "Initial contents or nullptr.", pt: "Conteúdo inicial ou nullptr." } },
      {
        name: "flags", type: "GLbitfield",
        desc: { en: "What the CPU may do with the buffer, combined with |. 0 = nothing.", pt: "O que a CPU pode fazer com o buffer, combinado com |. 0 = nada." },
        values: [
          { name: "GL_DYNAMIC_STORAGE_BIT", desc: { en: "Allows glNamedBufferSubData updates.", pt: "Permite atualizações com glNamedBufferSubData." } },
          { name: "GL_MAP_READ_BIT / GL_MAP_WRITE_BIT", desc: { en: "Allows mapping for reading / writing.", pt: "Permite mapear para leitura / escrita." } },
          { name: "GL_MAP_PERSISTENT_BIT", desc: { en: "The mapping may stay open while the GPU uses the buffer.", pt: "O mapeamento pode continuar aberto enquanto a GPU usa o buffer." } },
          { name: "GL_MAP_COHERENT_BIT", desc: { en: "Writes become visible without explicit flushes.", pt: "Escritas ficam visíveis sem flushes explícitos." } },
        ],
      },
    ],
    notes: [DSA_NOTE],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "The buffer already has immutable storage.", pt: "O buffer já tem armazenamento imutável." } },
    ],
    example: `glCreateBuffers(1, &ubo);
glNamedBufferStorage(ubo, sizeof(CameraData), nullptr, GL_DYNAMIC_STORAGE_BIT);`,
    related: ["glCreateBuffers", "glNamedBufferSubData", "glNamedBufferData"],
    khronos: `${KHR}glBufferStorage.xhtml`,
  },
  {
    name: "glNamedBufferSubData",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glNamedBufferSubData(GLuint buffer, GLintptr offset, GLsizeiptr size, const void *data);",
    summary: {
      en: "glBufferSubData without binding: overwrites part of a buffer by ID.",
      pt: "glBufferSubData sem bind: sobrescreve parte de um buffer pelo ID.",
    },
    params: [
      { name: "buffer", type: "GLuint", desc: { en: "Buffer to update.", pt: "Buffer a atualizar." } },
      { name: "offset", type: "GLintptr", desc: { en: "Start in bytes.", pt: "Início em bytes." } },
      { name: "size", type: "GLsizeiptr", desc: { en: "Bytes to write.", pt: "Bytes a escrever." } },
      { name: "data", type: "const void *", desc: { en: "Source data.", pt: "Dados de origem." } },
    ],
    notes: [
      DSA_NOTE,
      { en: "Immutable buffers need GL_DYNAMIC_STORAGE_BIT for this to work.", pt: "Buffers imutáveis precisam de GL_DYNAMIC_STORAGE_BIT para isso funcionar." },
    ],
    example: `glNamedBufferSubData(ubo, 0, sizeof(CameraData), &camera);`,
    related: ["glBufferSubData", "glNamedBufferStorage"],
    khronos: `${KHR}glBufferSubData.xhtml`,
  },
  {
    name: "glCreateVertexArrays",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glCreateVertexArrays(GLsizei n, GLuint *arrays);",
    summary: {
      en: "Creates VAOs that can be configured without binding them.",
      pt: "Cria VAOs que podem ser configurados sem fazer bind.",
    },
    description: {
      en: "The DSA VAO API also separates two ideas that glVertexAttribPointer mixes: the attribute FORMAT (what a vec3 at offset 12 looks like) and the buffer BINDING (which buffer and stride to read from). This makes switching buffers cheap and code clearer.",
      pt: "A API DSA de VAO também separa duas ideias que glVertexAttribPointer mistura: o FORMATO do atributo (como é um vec3 no offset 12) e o BINDING de buffer (de qual buffer e com qual stride ler). Isso barateia a troca de buffers e deixa o código mais claro.",
    },
    params: [
      { name: "n", type: "GLsizei", desc: { en: "How many VAOs.", pt: "Quantos VAOs." } },
      { name: "arrays", type: "GLuint *", desc: { en: "Array receiving the IDs.", pt: "Array que recebe os IDs." } },
    ],
    notes: [DSA_NOTE],
    example: `GLuint vao;
glCreateVertexArrays(1, &vao);
glVertexArrayVertexBuffer(vao, 0, vbo, 0, sizeof(Vertex));
glVertexArrayElementBuffer(vao, ebo);`,
    related: ["glVertexArrayVertexBuffer", "glVertexArrayAttribFormat", "glVertexArrayAttribBinding", "glEnableVertexArrayAttrib"],
    khronos: `${KHR}glCreateVertexArrays.xhtml`,
  },
  {
    name: "glVertexArrayVertexBuffer",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glVertexArrayVertexBuffer(GLuint vaobj, GLuint bindingindex, GLuint buffer,\n                               GLintptr offset, GLsizei stride);",
    summary: {
      en: "Plugs a vertex buffer into a numbered binding slot of a VAO.",
      pt: "Conecta um vertex buffer a um slot de binding numerado de um VAO.",
    },
    description: {
      en: "A VAO has several buffer binding slots. This puts a buffer in one of them, together with where the data starts and the stride between vertices. Attributes are then connected to the slot with glVertexArrayAttribBinding.",
      pt: "Um VAO tem vários slots de binding de buffer. Esta função coloca um buffer em um deles, junto com onde os dados começam e o stride entre vértices. Os atributos são então conectados ao slot com glVertexArrayAttribBinding.",
    },
    params: [
      { name: "vaobj", type: "GLuint", desc: { en: "The VAO.", pt: "O VAO." } },
      { name: "bindingindex", type: "GLuint", desc: { en: "Binding slot number (NOT an attribute location).", pt: "Número do slot de binding (NÃO é uma location de atributo)." } },
      { name: "buffer", type: "GLuint", desc: { en: "Vertex buffer.", pt: "Vertex buffer." } },
      { name: "offset", type: "GLintptr", desc: { en: "Byte offset of the first vertex in the buffer.", pt: "Offset em bytes do primeiro vértice no buffer." } },
      { name: "stride", type: "GLsizei", desc: { en: "Bytes between consecutive vertices. Unlike the old API, 0 does NOT mean tightly packed.", pt: "Bytes entre vértices consecutivos. Diferente da API antiga, 0 NÃO significa compactado." } },
    ],
    notes: [DSA_NOTE],
    example: `glVertexArrayVertexBuffer(vao, 0, vbo, 0, sizeof(Vertex));`,
    related: ["glVertexArrayAttribBinding", "glVertexArrayAttribFormat", "glCreateVertexArrays"],
    khronos: `${KHR}glBindVertexBuffer.xhtml`,
  },
  {
    name: "glVertexArrayAttribFormat",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glVertexArrayAttribFormat(GLuint vaobj, GLuint attribindex, GLint size,\n                               GLenum type, GLboolean normalized, GLuint relativeoffset);",
    summary: {
      en: "Describes the format of one attribute inside a vertex — without saying which buffer.",
      pt: "Descreve o formato de um atributo dentro de um vértice — sem dizer qual buffer.",
    },
    params: [
      { name: "vaobj", type: "GLuint", desc: { en: "The VAO.", pt: "O VAO." } },
      { name: "attribindex", type: "GLuint", desc: { en: "Attribute location, as layout(location = N).", pt: "Location do atributo, como layout(location = N)." } },
      { name: "size", type: "GLint", desc: { en: "Components: 1–4.", pt: "Componentes: 1–4." } },
      { name: "type", type: "GLenum", desc: { en: "Component type, e.g. GL_FLOAT.", pt: "Tipo do componente, ex.: GL_FLOAT." } },
      { name: "normalized", type: "GLboolean", desc: { en: "Normalize integer types to 0–1 / -1–1.", pt: "Normalizar tipos inteiros para 0–1 / -1–1." } },
      { name: "relativeoffset", type: "GLuint", desc: { en: "Offset of this attribute inside ONE vertex — offsetof(Vertex, member).", pt: "Offset deste atributo dentro de UM vértice — offsetof(Vertex, membro)." } },
    ],
    notes: [DSA_NOTE],
    example: `glVertexArrayAttribFormat(vao, 0, 3, GL_FLOAT, GL_FALSE, offsetof(Vertex, pos));
glVertexArrayAttribFormat(vao, 1, 2, GL_FLOAT, GL_FALSE, offsetof(Vertex, uv));`,
    related: ["glVertexArrayAttribBinding", "glEnableVertexArrayAttrib", "glVertexAttribPointer"],
    khronos: `${KHR}glVertexAttribFormat.xhtml`,
  },
  {
    name: "glVertexArrayAttribBinding",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glVertexArrayAttribBinding(GLuint vaobj, GLuint attribindex, GLuint bindingindex);",
    summary: {
      en: "Says which buffer binding slot an attribute reads from.",
      pt: "Diz de qual slot de binding de buffer um atributo lê.",
    },
    description: {
      en: "The link between the two halves of the DSA vertex setup: attribute attribindex (format from glVertexArrayAttribFormat) takes its data from slot bindingindex (buffer from glVertexArrayVertexBuffer). Interleaved vertices put all attributes on slot 0.",
      pt: "A ligação entre as duas metades da configuração DSA de vértices: o atributo attribindex (formato vindo de glVertexArrayAttribFormat) pega seus dados do slot bindingindex (buffer vindo de glVertexArrayVertexBuffer). Vértices intercalados colocam todos os atributos no slot 0.",
    },
    params: [
      { name: "vaobj", type: "GLuint", desc: { en: "The VAO.", pt: "O VAO." } },
      { name: "attribindex", type: "GLuint", desc: { en: "Attribute location.", pt: "Location do atributo." } },
      { name: "bindingindex", type: "GLuint", desc: { en: "Buffer binding slot.", pt: "Slot de binding do buffer." } },
    ],
    notes: [DSA_NOTE],
    example: `glVertexArrayAttribBinding(vao, 0, 0);
glVertexArrayAttribBinding(vao, 1, 0);`,
    related: ["glVertexArrayVertexBuffer", "glVertexArrayAttribFormat"],
    khronos: `${KHR}glVertexAttribBinding.xhtml`,
  },
  {
    name: "glEnableVertexArrayAttrib",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glEnableVertexArrayAttrib(GLuint vaobj, GLuint index);",
    summary: {
      en: "Enables an attribute of a specific VAO, without binding it.",
      pt: "Ativa um atributo de um VAO específico, sem fazer bind.",
    },
    params: [
      { name: "vaobj", type: "GLuint", desc: { en: "The VAO.", pt: "O VAO." } },
      { name: "index", type: "GLuint", desc: { en: "Attribute location to enable.", pt: "Location do atributo a ativar." } },
    ],
    notes: [DSA_NOTE],
    example: `glEnableVertexArrayAttrib(vao, 0);
glEnableVertexArrayAttrib(vao, 1);`,
    related: ["glEnableVertexAttribArray", "glVertexArrayAttribFormat"],
    khronos: `${KHR}glEnableVertexAttribArray.xhtml`,
  },
  {
    name: "glCreateTextures",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glCreateTextures(GLenum target, GLsizei n, GLuint *textures);",
    summary: {
      en: "Creates textures of a given type immediately — no bind needed.",
      pt: "Cria texturas de um tipo específico na hora — sem precisar de bind.",
    },
    description: {
      en: "Because the object is created on the spot, its type (target) is given here instead of at the first bind. The texture can then be allocated with glTextureStorage2D and filled with glTextureSubImage2D, all by ID.",
      pt: "Como o objeto é criado na hora, o tipo (target) é informado aqui em vez de no primeiro bind. A textura pode então ser alocada com glTextureStorage2D e preenchida com glTextureSubImage2D, tudo pelo ID.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "Texture type: GL_TEXTURE_2D, GL_TEXTURE_CUBE_MAP…", pt: "Tipo da textura: GL_TEXTURE_2D, GL_TEXTURE_CUBE_MAP…" } },
      { name: "n", type: "GLsizei", desc: { en: "How many textures.", pt: "Quantas texturas." } },
      { name: "textures", type: "GLuint *", desc: { en: "Array receiving the IDs.", pt: "Array que recebe os IDs." } },
    ],
    notes: [DSA_NOTE, { en: "To use it for drawing, bind to a unit with glBindTextureUnit(unit, tex) — no glActiveTexture needed.", pt: "Para usar no desenho, ligue a uma unit com glBindTextureUnit(unit, tex) — sem glActiveTexture." }],
    example: `GLuint tex;
glCreateTextures(GL_TEXTURE_2D, 1, &tex);
glTextureStorage2D(tex, levels, GL_SRGB8_ALPHA8, w, h);
glTextureSubImage2D(tex, 0, 0, 0, w, h, GL_RGBA, GL_UNSIGNED_BYTE, pixels);
glGenerateTextureMipmap(tex);`,
    related: ["glTextureStorage2D", "glTextureSubImage2D", "glGenTextures"],
    khronos: `${KHR}glCreateTextures.xhtml`,
  },
  {
    name: "glTextureStorage2D",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glTextureStorage2D(GLuint texture, GLsizei levels, GLenum internalformat,\n                        GLsizei width, GLsizei height);",
    summary: {
      en: "Allocates immutable storage for a texture by ID (DSA glTexStorage2D).",
      pt: "Aloca armazenamento imutável para uma textura pelo ID (glTexStorage2D em DSA).",
    },
    params: [
      { name: "texture", type: "GLuint", desc: { en: "Texture from glCreateTextures.", pt: "Textura vinda de glCreateTextures." } },
      { name: "levels", type: "GLsizei", desc: { en: "Number of mip levels.", pt: "Número de níveis de mipmap." } },
      { name: "internalformat", type: "GLenum", desc: { en: "Sized format: GL_RGBA8, GL_SRGB8_ALPHA8, GL_RGBA16F, GL_DEPTH_COMPONENT32F…", pt: "Formato com tamanho: GL_RGBA8, GL_SRGB8_ALPHA8, GL_RGBA16F, GL_DEPTH_COMPONENT32F…" } },
      { name: "width", type: "GLsizei", desc: { en: "Width of level 0.", pt: "Largura do nível 0." } },
      { name: "height", type: "GLsizei", desc: { en: "Height of level 0.", pt: "Altura do nível 0." } },
    ],
    notes: [DSA_NOTE],
    example: `int levels = 1 + (int)std::floor(std::log2(std::max(w, h)));
glTextureStorage2D(tex, levels, GL_SRGB8_ALPHA8, w, h);`,
    related: ["glTexStorage2D", "glTextureSubImage2D", "glCreateTextures"],
    khronos: `${KHR}glTexStorage2D.xhtml`,
  },
  {
    name: "glTextureSubImage2D",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glTextureSubImage2D(GLuint texture, GLint level, GLint xoffset, GLint yoffset,\n                         GLsizei width, GLsizei height,\n                         GLenum format, GLenum type, const void *pixels);",
    summary: {
      en: "Uploads pixels into a region of an existing texture by ID.",
      pt: "Envia pixels para uma região de uma textura existente pelo ID.",
    },
    params: [
      { name: "texture", type: "GLuint", desc: { en: "Target texture (already allocated).", pt: "Textura de destino (já alocada)." } },
      { name: "level", type: "GLint", desc: { en: "Mip level to write.", pt: "Nível de mipmap a escrever." } },
      { name: "xoffset", type: "GLint", desc: { en: "Left edge of the region.", pt: "Borda esquerda da região." } },
      { name: "yoffset", type: "GLint", desc: { en: "Bottom edge of the region.", pt: "Borda de baixo da região." } },
      { name: "width", type: "GLsizei", desc: { en: "Region width.", pt: "Largura da região." } },
      { name: "height", type: "GLsizei", desc: { en: "Region height.", pt: "Altura da região." } },
      { name: "format", type: "GLenum", desc: { en: "Channel layout of your data: GL_RGB, GL_RGBA, GL_RED…", pt: "Organização dos canais dos seus dados: GL_RGB, GL_RGBA, GL_RED…" } },
      { name: "type", type: "GLenum", desc: { en: "Channel type of your data: GL_UNSIGNED_BYTE, GL_FLOAT…", pt: "Tipo dos canais dos seus dados: GL_UNSIGNED_BYTE, GL_FLOAT…" } },
      { name: "pixels", type: "const void *", desc: { en: "Source pixels.", pt: "Pixels de origem." } },
    ],
    notes: [DSA_NOTE],
    example: `glTextureSubImage2D(tex, 0, 0, 0, w, h, GL_RGBA, GL_UNSIGNED_BYTE, pixels);`,
    related: ["glTextureStorage2D", "glTexImage2D"],
    khronos: `${KHR}glTexSubImage2D.xhtml`,
  },
];
