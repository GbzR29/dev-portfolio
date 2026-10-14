// src/lib/reference/opengl/dsaFramebuffers.ts
// More of the "dsa" category: framebuffers and renderbuffers by ID — create,
// attach, choose draw buffers, check and clear.
import type { RefEntry } from "../types";
import { DSA_NOTE } from "./dsa";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

const ATTACHMENTS = [
  { name: "GL_COLOR_ATTACHMENTi", desc: { en: "Colour output number i (GL_COLOR_ATTACHMENT0, 1, …).", pt: "Saída de cor número i (GL_COLOR_ATTACHMENT0, 1, …)." } },
  { name: "GL_DEPTH_ATTACHMENT", desc: { en: "The depth buffer.", pt: "O depth buffer." } },
  { name: "GL_STENCIL_ATTACHMENT", desc: { en: "The stencil buffer.", pt: "O stencil buffer." } },
  { name: "GL_DEPTH_STENCIL_ATTACHMENT", desc: { en: "Both at once, for a GL_DEPTH24_STENCIL8 image.", pt: "Os dois de uma vez, para uma imagem GL_DEPTH24_STENCIL8." } },
];

export const dsaFramebufferEntries: RefEntry[] = [
  {
    name: "glCreateFramebuffers",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glCreateFramebuffers(GLsizei n, GLuint *framebuffers);",
    summary: {
      en: "Creates framebuffer objects that exist immediately, ready for glNamedFramebuffer* calls.",
      pt: "Cria framebuffer objects que já existem na hora, prontos para as chamadas glNamedFramebuffer*.",
    },
    description: {
      en: "The DSA replacement for glGenFramebuffers. A new framebuffer has no attachments, so it is incomplete until you attach at least one image; you never need to bind it to set it up, only to draw into it (glBindFramebuffer).",
      pt: "O substituto DSA de glGenFramebuffers. Um framebuffer novo não tem anexos, então fica incompleto até você anexar pelo menos uma imagem; nunca é preciso ligá-lo para configurá-lo, só para desenhar nele (glBindFramebuffer).",
    },
    params: [
      { name: "n", type: "GLsizei", desc: { en: "How many.", pt: "Quantos." } },
      { name: "framebuffers", type: "GLuint *", desc: { en: "Array receiving the IDs.", pt: "Array que recebe os IDs." } },
    ],
    notes: [DSA_NOTE, { en: "Delete with glDeleteFramebuffers; the attached textures are not deleted with it.", pt: "Apague com glDeleteFramebuffers; as texturas anexadas não são apagadas junto." }],
    example: `GLuint fbo;
glCreateFramebuffers(1, &fbo);
glNamedFramebufferTexture(fbo, GL_COLOR_ATTACHMENT0, colorTex, 0);`,
    related: ["glGenFramebuffers", "glNamedFramebufferTexture", "glNamedFramebufferRenderbuffer", "glCheckNamedFramebufferStatus", "glBindFramebuffer"],
    khronos: `${KHR}glCreateFramebuffers.xhtml`,
  },
  {
    name: "glCreateRenderbuffers",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glCreateRenderbuffers(GLsizei n, GLuint *renderbuffers);",
    summary: {
      en: "Creates renderbuffer objects (images you render into but never sample) without binding.",
      pt: "Cria renderbuffer objects (imagens em que se renderiza mas que nunca são lidas) sem bind.",
    },
    description: {
      en: "A renderbuffer is a framebuffer image that shaders cannot read. That makes it the natural home for a depth-stencil buffer you only need for testing. After creating it, give it storage with glNamedRenderbufferStorage.",
      pt: "Um renderbuffer é uma imagem de framebuffer que os shaders não podem ler. Por isso é o lugar natural para um depth-stencil buffer que só serve para os testes. Depois de criá-lo, dê a ele armazenamento com glNamedRenderbufferStorage.",
    },
    params: [
      { name: "n", type: "GLsizei", desc: { en: "How many.", pt: "Quantos." } },
      { name: "renderbuffers", type: "GLuint *", desc: { en: "Array receiving the IDs.", pt: "Array que recebe os IDs." } },
    ],
    notes: [DSA_NOTE],
    example: `GLuint rbo;
glCreateRenderbuffers(1, &rbo);
glNamedRenderbufferStorage(rbo, GL_DEPTH24_STENCIL8, w, h);`,
    related: ["glGenRenderbuffers", "glNamedRenderbufferStorage", "glNamedFramebufferRenderbuffer"],
    khronos: `${KHR}glCreateRenderbuffers.xhtml`,
  },
  {
    name: "glNamedRenderbufferStorage",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glNamedRenderbufferStorage(GLuint renderbuffer, GLenum internalformat,\n                                GLsizei width, GLsizei height);",
    summary: {
      en: "Allocates a renderbuffer's image: its format and size.",
      pt: "Aloca a imagem de um renderbuffer: formato e tamanho.",
    },
    description: {
      en: "The DSA form of glRenderbufferStorage. The size must match the other attachments of the framebuffer, normally the window size, so call it again (or recreate the renderbuffer) when the window is resized.",
      pt: "A forma DSA de glRenderbufferStorage. O tamanho precisa bater com os outros anexos do framebuffer, normalmente o tamanho da janela, então chame de novo (ou recrie o renderbuffer) quando a janela mudar de tamanho.",
    },
    params: [
      { name: "renderbuffer", type: "GLuint", desc: { en: "From glCreateRenderbuffers.", pt: "De glCreateRenderbuffers." } },
      {
        name: "internalformat", type: "GLenum",
        desc: { en: "Sized format of the image.", pt: "Formato com tamanho da imagem." },
        values: [
          { name: "GL_DEPTH24_STENCIL8", desc: { en: "24-bit depth + 8-bit stencil: the usual choice.", pt: "Profundidade de 24 bits + stencil de 8 bits: a escolha usual." } },
          { name: "GL_DEPTH_COMPONENT32F", desc: { en: "Float depth, for reversed Z.", pt: "Profundidade em float, para Z invertido." } },
          { name: "GL_RGBA8 / GL_RGBA16F", desc: { en: "A colour image you will only blit, never sample.", pt: "Uma imagem de cor que você só vai copiar (blit), nunca ler." } },
        ],
      },
      { name: "width", type: "GLsizei", desc: { en: "Width in pixels.", pt: "Largura em pixels." } },
      { name: "height", type: "GLsizei", desc: { en: "Height in pixels.", pt: "Altura em pixels." } },
    ],
    notes: [DSA_NOTE, { en: "For MSAA use glNamedRenderbufferStorageMultisample, with the same sample count on every attachment.", pt: "Para MSAA use glNamedRenderbufferStorageMultisample, com o mesmo número de amostras em todos os anexos." }],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "width or height is larger than GL_MAX_RENDERBUFFER_SIZE.", pt: "width ou height é maior que GL_MAX_RENDERBUFFER_SIZE." } },
      { code: "GL_INVALID_ENUM", when: { en: "internalformat is not a renderable format.", pt: "internalformat não é um formato renderizável." } },
    ],
    example: `glNamedRenderbufferStorage(rbo, GL_DEPTH24_STENCIL8, w, h);`,
    related: ["glRenderbufferStorage", "glCreateRenderbuffers", "glNamedFramebufferRenderbuffer"],
    khronos: `${KHR}glRenderbufferStorage.xhtml`,
  },
  {
    name: "glNamedFramebufferTexture",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glNamedFramebufferTexture(GLuint framebuffer, GLenum attachment,\n                               GLuint texture, GLint level);",
    summary: {
      en: "Attaches a texture to a framebuffer, so drawing into the framebuffer writes into the texture.",
      pt: "Anexa uma textura a um framebuffer, assim desenhar no framebuffer escreve na textura.",
    },
    description: {
      en: "This is how render-to-texture works: attach a texture as GL_COLOR_ATTACHMENT0, draw, then sample that texture in a later pass (post-processing, shadow maps, picking IDs).\n\nThere is no texture target parameter: the function takes the type from the texture. For a cubemap or an array texture it attaches every layer at once (a layered attachment, for a geometry shader that picks gl_Layer); to attach a single layer or face use glNamedFramebufferTextureLayer.",
      pt: "É assim que funciona o render-to-texture: anexe uma textura como GL_COLOR_ATTACHMENT0, desenhe e depois leia essa textura numa passada seguinte (pós-processamento, shadow maps, IDs de picking).\n\nNão há parâmetro de target da textura: a função tira o tipo da própria textura. Num cubemap ou textura array ela anexa todas as camadas de uma vez (um anexo em camadas, para um geometry shader que escolhe gl_Layer); para anexar uma só camada ou face use glNamedFramebufferTextureLayer.",
    },
    params: [
      { name: "framebuffer", type: "GLuint", desc: { en: "The framebuffer (not 0).", pt: "O framebuffer (não 0)." } },
      { name: "attachment", type: "GLenum", desc: { en: "Where to attach.", pt: "Onde anexar." }, values: ATTACHMENTS },
      { name: "texture", type: "GLuint", desc: { en: "The texture, or 0 to detach.", pt: "A textura, ou 0 para desanexar." } },
      { name: "level", type: "GLint", desc: { en: "Mip level to render into, usually 0.", pt: "Nível de mipmap em que renderizar, normalmente 0." } },
    ],
    notes: [
      DSA_NOTE,
      { en: "Do not sample a texture in the same draw that renders into it: the result is undefined (a feedback loop).", pt: "Não leia uma textura na mesma chamada de desenho que renderiza nela: o resultado é indefinido (um feedback loop)." },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "framebuffer is 0 or does not exist, or texture is not a valid texture.", pt: "framebuffer é 0 ou não existe, ou texture não é uma textura válida." } },
    ],
    example: `glNamedFramebufferTexture(fbo, GL_COLOR_ATTACHMENT0, colorTex, 0);
glNamedFramebufferTexture(fbo, GL_DEPTH_ATTACHMENT,  depthTex, 0);`,
    related: ["glFramebufferTexture2D", "glCreateFramebuffers", "glNamedFramebufferRenderbuffer", "glCheckNamedFramebufferStatus"],
    khronos: `${KHR}glFramebufferTexture.xhtml`,
  },
  {
    name: "glNamedFramebufferRenderbuffer",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glNamedFramebufferRenderbuffer(GLuint framebuffer, GLenum attachment,\n                                    GLenum renderbuffertarget, GLuint renderbuffer);",
    summary: {
      en: "Attaches a renderbuffer to a framebuffer, usually as its depth-stencil buffer.",
      pt: "Anexa um renderbuffer a um framebuffer, normalmente como depth-stencil buffer.",
    },
    description: {
      en: "The renderbuffer counterpart of glNamedFramebufferTexture. A post-processing framebuffer typically has a colour texture (read later) and a depth-stencil renderbuffer (only needed while drawing).",
      pt: "O equivalente para renderbuffer de glNamedFramebufferTexture. Um framebuffer de pós-processamento costuma ter uma textura de cor (lida depois) e um renderbuffer de depth-stencil (só necessário durante o desenho).",
    },
    params: [
      { name: "framebuffer", type: "GLuint", desc: { en: "The framebuffer.", pt: "O framebuffer." } },
      { name: "attachment", type: "GLenum", desc: { en: "Where to attach.", pt: "Onde anexar." }, values: ATTACHMENTS },
      { name: "renderbuffertarget", type: "GLenum", desc: { en: "Always GL_RENDERBUFFER.", pt: "Sempre GL_RENDERBUFFER." } },
      { name: "renderbuffer", type: "GLuint", desc: { en: "The renderbuffer, or 0 to detach.", pt: "O renderbuffer, ou 0 para desanexar." } },
    ],
    notes: [DSA_NOTE],
    errors: [
      { code: "GL_INVALID_ENUM", when: { en: "renderbuffertarget is not GL_RENDERBUFFER.", pt: "renderbuffertarget não é GL_RENDERBUFFER." } },
    ],
    example: `glNamedFramebufferRenderbuffer(fbo, GL_DEPTH_STENCIL_ATTACHMENT, GL_RENDERBUFFER, rbo);`,
    related: ["glFramebufferRenderbuffer", "glNamedRenderbufferStorage", "glNamedFramebufferTexture"],
    khronos: `${KHR}glFramebufferRenderbuffer.xhtml`,
  },
  {
    name: "glNamedFramebufferDrawBuffers",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glNamedFramebufferDrawBuffers(GLuint framebuffer, GLsizei n, const GLenum *bufs);",
    summary: {
      en: "Lists which colour attachments the fragment shader's outputs go to (multiple render targets).",
      pt: "Lista para quais anexos de cor vão as saídas do fragment shader (vários render targets).",
    },
    description: {
      en: "A fragment shader can write several outputs: layout(location = 0) out vec4 accum; layout(location = 1) out float reveal;. This list connects output location i to bufs[i]. By default only GL_COLOR_ATTACHMENT0 is enabled, so a second output is silently dropped until you list both.\n\nIt is a setting of the framebuffer, so set it once after attaching, not every frame.",
      pt: "Um fragment shader pode escrever várias saídas: layout(location = 0) out vec4 accum; layout(location = 1) out float reveal;. Esta lista liga a saída de location i a bufs[i]. Por padrão só GL_COLOR_ATTACHMENT0 está ativo, então uma segunda saída é descartada sem aviso até você listar as duas.\n\nÉ uma configuração do framebuffer: defina uma vez depois de anexar, não a cada frame.",
    },
    params: [
      { name: "framebuffer", type: "GLuint", desc: { en: "The framebuffer (0 = the window, which takes GL_BACK_LEFT and similar).", pt: "O framebuffer (0 = a janela, que aceita GL_BACK_LEFT e parecidos)." } },
      { name: "n", type: "GLsizei", desc: { en: "Number of entries, up to GL_MAX_DRAW_BUFFERS (at least 8).", pt: "Número de entradas, até GL_MAX_DRAW_BUFFERS (pelo menos 8)." } },
      { name: "bufs", type: "const GLenum *", desc: { en: "GL_COLOR_ATTACHMENTi or GL_NONE for each output location.", pt: "GL_COLOR_ATTACHMENTi ou GL_NONE para cada location de saída." } },
    ],
    notes: [DSA_NOTE],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "n is larger than GL_MAX_DRAW_BUFFERS.", pt: "n é maior que GL_MAX_DRAW_BUFFERS." } },
      { code: "GL_INVALID_OPERATION", when: { en: "The same attachment appears twice.", pt: "O mesmo anexo aparece duas vezes." } },
    ],
    example: `GLenum bufs[] = { GL_COLOR_ATTACHMENT0, GL_COLOR_ATTACHMENT1 };
glNamedFramebufferDrawBuffers(oitFbo, 2, bufs);`,
    related: ["glDrawBuffers", "glBlendFunci", "glNamedFramebufferTexture", "glClearNamedFramebufferfv"],
    khronos: `${KHR}glDrawBuffers.xhtml`,
  },
  {
    name: "glCheckNamedFramebufferStatus",
    category: "dsa",
    since: "GL 4.5",
    signature: "GLenum glCheckNamedFramebufferStatus(GLuint framebuffer, GLenum target);",
    summary: {
      en: "Tells whether a framebuffer is complete (ready to draw into) and, if not, why.",
      pt: "Diz se um framebuffer está completo (pronto para receber desenho) e, se não, por quê.",
    },
    description: {
      en: "Drawing into an incomplete framebuffer does nothing and raises GL_INVALID_FRAMEBUFFER_OPERATION. Check once after setting up the attachments; anything other than GL_FRAMEBUFFER_COMPLETE names the problem.",
      pt: "Desenhar num framebuffer incompleto não faz nada e gera GL_INVALID_FRAMEBUFFER_OPERATION. Verifique uma vez depois de configurar os anexos; qualquer resultado diferente de GL_FRAMEBUFFER_COMPLETE diz qual é o problema.",
    },
    params: [
      { name: "framebuffer", type: "GLuint", desc: { en: "The framebuffer to check.", pt: "O framebuffer a verificar." } },
      { name: "target", type: "GLenum", desc: { en: "GL_FRAMEBUFFER (or GL_DRAW_FRAMEBUFFER / GL_READ_FRAMEBUFFER).", pt: "GL_FRAMEBUFFER (ou GL_DRAW_FRAMEBUFFER / GL_READ_FRAMEBUFFER)." } },
    ],
    returns: {
      en: "GL_FRAMEBUFFER_COMPLETE, or the reason: GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT (an image without storage or of a format that cannot be rendered), GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT (nothing attached), GL_FRAMEBUFFER_INCOMPLETE_MULTISAMPLE (sample counts differ), GL_FRAMEBUFFER_UNSUPPORTED (this combination of formats is not supported by the driver).",
      pt: "GL_FRAMEBUFFER_COMPLETE, ou o motivo: GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT (uma imagem sem armazenamento ou num formato que não pode ser renderizado), GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT (nada anexado), GL_FRAMEBUFFER_INCOMPLETE_MULTISAMPLE (números de amostras diferentes), GL_FRAMEBUFFER_UNSUPPORTED (o driver não aceita esta combinação de formatos).",
    },
    notes: [DSA_NOTE],
    example: `if (glCheckNamedFramebufferStatus(fbo, GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE)
    std::cerr << "framebuffer incomplete\\n";`,
    related: ["glCheckFramebufferStatus", "glCreateFramebuffers", "glNamedFramebufferTexture"],
    khronos: `${KHR}glCheckFramebufferStatus.xhtml`,
  },
  {
    name: "glClearNamedFramebufferfv",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glClearNamedFramebufferfv(GLuint framebuffer, GLenum buffer, GLint drawbuffer,\n                               const GLfloat *value);",
    summary: {
      en: "Clears one attachment of a framebuffer to a value of your choice, without glClearColor.",
      pt: "Limpa um anexo de um framebuffer com o valor que você escolher, sem glClearColor.",
    },
    description: {
      en: "glClear clears every colour attachment to the same glClearColor. With several targets that is often wrong: weighted blended OIT needs its accumulation buffer cleared to 0 and its revealage buffer to 1. This function clears a single one, chosen by its index in the draw-buffer list, to the value given.",
      pt: "glClear limpa todos os anexos de cor com o mesmo glClearColor. Com vários targets isso costuma estar errado: a OIT weighted blended precisa do buffer de acumulação limpo com 0 e do de revealage com 1. Esta função limpa um só, escolhido pelo índice na lista de draw buffers, com o valor dado.",
    },
    params: [
      { name: "framebuffer", type: "GLuint", desc: { en: "The framebuffer, 0 for the window.", pt: "O framebuffer, 0 para a janela." } },
      {
        name: "buffer", type: "GLenum",
        desc: { en: "What to clear.", pt: "O que limpar." },
        values: [
          { name: "GL_COLOR", desc: { en: "One colour attachment; value points to 4 floats.", pt: "Um anexo de cor; value aponta para 4 floats." } },
          { name: "GL_DEPTH", desc: { en: "The depth buffer; value points to 1 float, drawbuffer must be 0.", pt: "O depth buffer; value aponta para 1 float, drawbuffer deve ser 0." } },
        ],
      },
      { name: "drawbuffer", type: "GLint", desc: { en: "For GL_COLOR, the index in the glNamedFramebufferDrawBuffers list (not the attachment enum).", pt: "Para GL_COLOR, o índice na lista de glNamedFramebufferDrawBuffers (não o enum do anexo)." } },
      { name: "value", type: "const GLfloat *", desc: { en: "The clear value.", pt: "O valor de limpeza." } },
    ],
    notes: [
      DSA_NOTE,
      { en: "Pick the suffix by the attachment's format: fv for float and normalized formats, uiv for unsigned integer (GL_R32UI), iv for signed integer.", pt: "Escolha o sufixo pelo formato do anexo: fv para formatos float e normalizados, uiv para inteiro sem sinal (GL_R32UI), iv para inteiro com sinal." },
    ],
    example: `const float zero[4] = { 0, 0, 0, 0 };
const float one[4]  = { 1, 1, 1, 1 };
glClearNamedFramebufferfv(oitFbo, GL_COLOR, 0, zero);  // accumulation
glClearNamedFramebufferfv(oitFbo, GL_COLOR, 1, one);   // revealage`,
    related: ["glClear", "glClearNamedFramebufferuiv", "glNamedFramebufferDrawBuffers", "glClearColor"],
    khronos: `${KHR}glClearBuffer.xhtml`,
  },
  {
    name: "glClearNamedFramebufferuiv",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glClearNamedFramebufferuiv(GLuint framebuffer, GLenum buffer, GLint drawbuffer,\n                                const GLuint *value);",
    summary: {
      en: "Clears an unsigned-integer colour attachment (an object-ID buffer, for example) to an integer value.",
      pt: "Limpa um anexo de cor de inteiros sem sinal (um buffer de IDs de objetos, por exemplo) com um valor inteiro.",
    },
    description: {
      en: "Integer textures like GL_R32UI hold exact whole numbers, which is what mouse picking needs: each object writes its ID, and reading the pixel under the cursor gives the object. glClearColor is a float and cannot clear them reliably; this clears to an exact integer, usually 0 for \"no object\".",
      pt: "Texturas de inteiros como GL_R32UI guardam números inteiros exatos, que é o que o picking com o mouse precisa: cada objeto escreve seu ID, e ler o pixel sob o cursor dá o objeto. glClearColor é float e não consegue limpá-las com segurança; esta limpa com um inteiro exato, normalmente 0 para \"nenhum objeto\".",
    },
    params: [
      { name: "framebuffer", type: "GLuint", desc: { en: "The framebuffer.", pt: "O framebuffer." } },
      { name: "buffer", type: "GLenum", desc: { en: "GL_COLOR (or GL_STENCIL with glClearNamedFramebufferiv).", pt: "GL_COLOR (ou GL_STENCIL com glClearNamedFramebufferiv)." } },
      { name: "drawbuffer", type: "GLint", desc: { en: "Index in the draw-buffer list.", pt: "Índice na lista de draw buffers." } },
      { name: "value", type: "const GLuint *", desc: { en: "4 unsigned integers (only the first is used by a one-channel format).", pt: "4 inteiros sem sinal (um formato de um canal usa só o primeiro)." } },
    ],
    notes: [DSA_NOTE],
    example: `const GLuint none[4] = { 0, 0, 0, 0 };
glClearNamedFramebufferuiv(idFbo, GL_COLOR, 0, none);`,
    related: ["glClearNamedFramebufferfv", "glReadPixels", "glNamedFramebufferTexture"],
    khronos: `${KHR}glClearBuffer.xhtml`,
  },
];
