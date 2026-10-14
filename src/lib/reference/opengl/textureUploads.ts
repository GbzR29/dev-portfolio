// src/lib/reference/opengl/textureUploads.ts
// More of the "textures" category: pixel layout, partial updates, 3D / array
// textures and deleting textures.
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

export const textureUploadEntries: RefEntry[] = [
  {
    name: "glPixelStorei",
    category: "textures",
    since: "GL 1.0",
    signature: "void glPixelStorei(GLenum pname, GLint param);",
    summary: {
      en: "Tells OpenGL how pixel rows are laid out in your memory, for uploads (unpack) and readbacks (pack).",
      pt: "Diz ao OpenGL como as linhas de pixels estão organizadas na sua memória, para envios (unpack) e leituras (pack).",
    },
    description: {
      en: "By default OpenGL assumes every row of your image starts on a 4-byte boundary (GL_UNPACK_ALIGNMENT = 4). An RGBA image always satisfies that. An RGB image 3 bytes per pixel, or a one-channel glyph, usually does not: a row of 101 RGB pixels is 303 bytes, OpenGL skips one byte to reach 304, and each row starts one byte later than the last. The texture comes out slanted diagonally, with colours shifting.\n\nSetting GL_UNPACK_ALIGNMENT to 1 says \"rows are packed tightly\", which is how stb_image and FreeType give you their data.",
      pt: "Por padrão o OpenGL supõe que cada linha da sua imagem começa num limite de 4 bytes (GL_UNPACK_ALIGNMENT = 4). Uma imagem RGBA sempre cumpre isso. Uma imagem RGB de 3 bytes por pixel, ou um glifo de um canal, geralmente não: uma linha de 101 pixels RGB tem 303 bytes, o OpenGL pula um byte para chegar a 304, e cada linha começa um byte depois da anterior. A textura sai inclinada na diagonal, com as cores trocando.\n\nDefinir GL_UNPACK_ALIGNMENT como 1 diz \"as linhas estão coladas\", que é como o stb_image e o FreeType entregam os dados.",
    },
    params: [
      {
        name: "pname", type: "GLenum",
        desc: { en: "Which setting.", pt: "Qual configuração." },
        values: [
          { name: "GL_UNPACK_ALIGNMENT", desc: { en: "Row alignment of data you upload (glTexImage2D, glTexSubImage2D): 1, 2, 4 or 8.", pt: "Alinhamento das linhas dos dados que você envia (glTexImage2D, glTexSubImage2D): 1, 2, 4 ou 8." } },
          { name: "GL_PACK_ALIGNMENT", desc: { en: "Row alignment of data you read back (glReadPixels).", pt: "Alinhamento das linhas dos dados que você lê de volta (glReadPixels)." } },
          { name: "GL_UNPACK_ROW_LENGTH", desc: { en: "Pixels per row of the whole source image, to upload a sub-rectangle of it.", pt: "Pixels por linha da imagem de origem inteira, para enviar um sub-retângulo dela." } },
        ],
      },
      { name: "param", type: "GLint", desc: { en: "The value: 1 is always safe for alignment.", pt: "O valor: 1 é sempre seguro para o alinhamento." } },
    ],
    notes: [
      { en: "It is global state that stays set; setting it to 1 once at start-up is harmless.", pt: "É estado global que continua valendo; definir 1 uma vez na inicialização não faz mal." },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "An alignment other than 1, 2, 4 or 8.", pt: "Um alinhamento diferente de 1, 2, 4 ou 8." } },
    ],
    example: `glPixelStorei(GL_UNPACK_ALIGNMENT, 1);   // tightly packed RGB / single-channel data
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB8, w, h, 0, GL_RGB, GL_UNSIGNED_BYTE, data);`,
    related: ["glTexImage2D", "glTexSubImage2D", "glReadPixels"],
    khronos: `${KHR}glPixelStore.xhtml`,
  },
  {
    name: "glTexSubImage2D",
    category: "textures",
    since: "GL 1.1",
    signature: "void glTexSubImage2D(GLenum target, GLint level, GLint xoffset, GLint yoffset,\n                     GLsizei width, GLsizei height,\n                     GLenum format, GLenum type, const void *pixels);",
    summary: {
      en: "Overwrites a rectangle of an existing texture's pixels, without reallocating it.",
      pt: "Sobrescreve um retângulo dos pixels de uma textura existente, sem realocá-la.",
    },
    description: {
      en: "glTexImage2D allocates storage (and can fill it); glTexSubImage2D only writes into storage that already exists. Use it to update textures that change: a video frame, a font atlas growing glyph by glyph, a paint canvas. It is also the way to fill textures made with glTexStorage2D, whose storage cannot be reallocated.\n\nThe texture bound to target on the active unit is the one written.",
      pt: "glTexImage2D aloca o armazenamento (e pode preenchê-lo); glTexSubImage2D só escreve num armazenamento que já existe. Use para atualizar texturas que mudam: um frame de vídeo, um atlas de fonte que cresce glifo a glifo, uma tela de pintura. É também o jeito de preencher texturas feitas com glTexStorage2D, cujo armazenamento não pode ser realocado.\n\nA textura escrita é a ligada a target na unidade ativa.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "GL_TEXTURE_2D, or a cubemap face (GL_TEXTURE_CUBE_MAP_POSITIVE_X + i).", pt: "GL_TEXTURE_2D, ou uma face de cubemap (GL_TEXTURE_CUBE_MAP_POSITIVE_X + i)." } },
      { name: "level", type: "GLint", desc: { en: "Mip level to write.", pt: "Nível de mipmap a escrever." } },
      { name: "xoffset, yoffset", type: "GLint", desc: { en: "Bottom-left corner of the region inside the texture.", pt: "Canto inferior esquerdo da região dentro da textura." } },
      { name: "width, height", type: "GLsizei", desc: { en: "Size of the region; it must fit inside the level.", pt: "Tamanho da região; precisa caber dentro do nível." } },
      { name: "format", type: "GLenum", desc: { en: "Channels of your data: GL_RGBA, GL_RGB, GL_RED…", pt: "Canais dos seus dados: GL_RGBA, GL_RGB, GL_RED…" } },
      { name: "type", type: "GLenum", desc: { en: "Type of each channel: GL_UNSIGNED_BYTE, GL_FLOAT…", pt: "Tipo de cada canal: GL_UNSIGNED_BYTE, GL_FLOAT…" } },
      { name: "pixels", type: "const void *", desc: { en: "Source data (or an offset into a bound GL_PIXEL_UNPACK_BUFFER).", pt: "Dados de origem (ou um offset num GL_PIXEL_UNPACK_BUFFER ligado)." } },
    ],
    notes: [
      { en: "After changing level 0, regenerate the mipmaps (glGenerateMipmap) or the far-away look keeps the old image.", pt: "Depois de mudar o nível 0, gere os mipmaps de novo (glGenerateMipmap), senão de longe a textura continua com a imagem antiga." },
      { en: "With a texture ID in hand, the DSA form glTextureSubImage2D avoids the bind.", pt: "Com o ID da textura em mãos, a forma DSA glTextureSubImage2D evita o bind." },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "The region goes outside the texture level.", pt: "A região sai do nível da textura." } },
      { code: "GL_INVALID_OPERATION", when: { en: "The level has no storage yet, or format/type do not suit its internal format.", pt: "O nível ainda não tem armazenamento, ou format/type não servem para o formato interno." } },
    ],
    example: `glBindTexture(GL_TEXTURE_2D, videoTex);
glTexSubImage2D(GL_TEXTURE_2D, 0, 0, 0, frameW, frameH, GL_RGBA, GL_UNSIGNED_BYTE, frame);`,
    related: ["glTexImage2D", "glTexStorage2D", "glTextureSubImage2D", "glPixelStorei", "glGenerateMipmap"],
    khronos: `${KHR}glTexSubImage2D.xhtml`,
  },
  {
    name: "glTexImage3D",
    category: "textures",
    since: "GL 1.2",
    signature: "void glTexImage3D(GLenum target, GLint level, GLint internalformat,\n                  GLsizei width, GLsizei height, GLsizei depth, GLint border,\n                  GLenum format, GLenum type, const void *data);",
    summary: {
      en: "Allocates (and optionally fills) a texture with depth: a 3D volume or an array of 2D layers.",
      pt: "Aloca (e opcionalmente preenche) uma textura com profundidade: um volume 3D ou um array de camadas 2D.",
    },
    description: {
      en: "glTexImage2D with one more dimension. What depth means depends on the target:\n\nGL_TEXTURE_3D: a true volume, filtered in all three directions. Used for colour-grading lookup tables, fog and cloud densities.\nGL_TEXTURE_2D_ARRAY: depth separate 2D layers of the same size, never blended into each other. The shader picks one with the third coordinate. Cascaded shadow maps keep every cascade in one, and a terrain can keep all its materials in one.",
      pt: "glTexImage2D com uma dimensão a mais. O que depth significa depende do target:\n\nGL_TEXTURE_3D: um volume de verdade, filtrado nas três direções. Usado em tabelas de correção de cor (LUT), densidades de neblina e nuvens.\nGL_TEXTURE_2D_ARRAY: depth camadas 2D separadas do mesmo tamanho, nunca misturadas entre si. O shader escolhe uma com a terceira coordenada. Os cascaded shadow maps guardam todas as cascatas numa só, e um terreno pode guardar todos os seus materiais numa só.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "GL_TEXTURE_3D or GL_TEXTURE_2D_ARRAY (also GL_TEXTURE_CUBE_MAP_ARRAY).", pt: "GL_TEXTURE_3D ou GL_TEXTURE_2D_ARRAY (também GL_TEXTURE_CUBE_MAP_ARRAY)." } },
      { name: "level", type: "GLint", desc: { en: "Mip level, 0 for the base.", pt: "Nível de mipmap, 0 para a base." } },
      { name: "internalformat", type: "GLint", desc: { en: "Sized GPU format: GL_RGBA8, GL_DEPTH_COMPONENT32F…", pt: "Formato na GPU com tamanho: GL_RGBA8, GL_DEPTH_COMPONENT32F…" } },
      { name: "width, height", type: "GLsizei", desc: { en: "Size of each slice or layer.", pt: "Tamanho de cada fatia ou camada." } },
      { name: "depth", type: "GLsizei", desc: { en: "Number of slices (3D) or layers (array).", pt: "Número de fatias (3D) ou camadas (array)." } },
      { name: "border", type: "GLint", desc: { en: "Must be 0.", pt: "Deve ser 0." } },
      { name: "format, type", type: "GLenum", desc: { en: "Layout and type of your data, as in glTexImage2D.", pt: "Organização e tipo dos seus dados, como em glTexImage2D." } },
      { name: "data", type: "const void *", desc: { en: "All slices one after another, or nullptr to only allocate.", pt: "Todas as fatias uma depois da outra, ou nullptr para só alocar." } },
    ],
    notes: [
      { en: "Fill single layers later with glTexSubImage3D, or render into them with glFramebufferTextureLayer.", pt: "Preencha camadas individuais depois com glTexSubImage3D, ou renderize nelas com glFramebufferTextureLayer." },
      { en: "glTexStorage3D allocates immutable storage with all mip levels, like glTexStorage2D does for 2D.", pt: "glTexStorage3D aloca armazenamento imutável com todos os níveis de mipmap, como glTexStorage2D faz para 2D." },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "A size is negative or larger than GL_MAX_3D_TEXTURE_SIZE / GL_MAX_ARRAY_TEXTURE_LAYERS, or border is not 0.", pt: "Um tamanho é negativo ou maior que GL_MAX_3D_TEXTURE_SIZE / GL_MAX_ARRAY_TEXTURE_LAYERS, ou border não é 0." } },
    ],
    example: `// one depth layer per shadow cascade
glBindTexture(GL_TEXTURE_2D_ARRAY, shadowArray);
glTexImage3D(GL_TEXTURE_2D_ARRAY, 0, GL_DEPTH_COMPONENT32F, size, size, cascades, 0,
             GL_DEPTH_COMPONENT, GL_FLOAT, nullptr);`,
    related: ["glTexImage2D", "glFramebufferTextureLayer", "glTexStorage2D", "glBindTexture"],
    khronos: `${KHR}glTexImage3D.xhtml`,
  },
  {
    name: "glDeleteTextures",
    category: "textures",
    since: "GL 1.1",
    signature: "void glDeleteTextures(GLsizei n, const GLuint *textures);",
    summary: {
      en: "Frees textures and their GPU memory; the names can be reused.",
      pt: "Libera texturas e a memória delas na GPU; os nomes podem ser reaproveitados.",
    },
    description: {
      en: "The counterpart of glGenTextures and glCreateTextures. Textures are usually the biggest users of video memory, so delete the ones you no longer need (when a level unloads, or at shutdown).\n\nA deleted texture that is still bound reverts that binding to 0, and one attached to the currently bound framebuffer is detached from it.",
      pt: "O par de glGenTextures e glCreateTextures. Texturas costumam ser as maiores consumidoras de memória de vídeo, então apague as que não usa mais (quando uma fase é descarregada, ou no encerramento).\n\nUma textura apagada que ainda está ligada faz aquele binding voltar a 0, e uma anexada ao framebuffer ligado é desanexada dele.",
    },
    params: [
      { name: "n", type: "GLsizei", desc: { en: "How many.", pt: "Quantas." } },
      { name: "textures", type: "const GLuint *", desc: { en: "The names; 0 and unknown names are silently ignored.", pt: "Os nomes; 0 e nomes desconhecidos são ignorados sem erro." } },
    ],
    notes: [
      { en: "Set your variable to 0 after deleting, so a later use is an obvious bug instead of reading a recycled name.", pt: "Ponha sua variável em 0 depois de apagar, assim um uso posterior vira um bug óbvio em vez de ler um nome reciclado." },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "n is negative.", pt: "n é negativo." } },
    ],
    example: `glDeleteTextures(1, &texture);
texture = 0;`,
    related: ["glGenTextures", "glCreateTextures", "glDeleteBuffers"],
    khronos: `${KHR}glDeleteTextures.xhtml`,
  },
];
