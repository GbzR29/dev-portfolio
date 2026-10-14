// src/lib/reference/opengl/framebufferExtras.ts
// More of the "framebuffers" category: several outputs, layered and per-layer
// attachments, multisample storage, copying (blit) and reading pixels back.
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

export const framebufferExtraEntries: RefEntry[] = [
  {
    name: "glDrawBuffers",
    category: "framebuffers",
    since: "GL 2.0",
    signature: "void glDrawBuffers(GLsizei n, const GLenum *bufs);",
    summary: {
      en: "Connects the fragment shader's outputs to colour attachments of the bound framebuffer (multiple render targets).",
      pt: "Liga as saídas do fragment shader aos anexos de cor do framebuffer ligado (vários render targets).",
    },
    description: {
      en: "Output location i of the fragment shader goes to bufs[i]. A deferred renderer's G-buffer writes position, normal and albedo in one pass:\n\nlayout(location = 0) out vec3 gPosition;\nlayout(location = 1) out vec3 gNormal;\nlayout(location = 2) out vec4 gAlbedoSpec;\n\nand glDrawBuffers lists GL_COLOR_ATTACHMENT0, 1 and 2. Without it only attachment 0 receives anything.\n\nThe list is stored in the framebuffer currently bound to GL_DRAW_FRAMEBUFFER, so call it while that framebuffer is bound, once, during setup.",
      pt: "A saída de location i do fragment shader vai para bufs[i]. O G-buffer de um renderizador deferred escreve posição, normal e albedo numa só passada:\n\nlayout(location = 0) out vec3 gPosition;\nlayout(location = 1) out vec3 gNormal;\nlayout(location = 2) out vec4 gAlbedoSpec;\n\ne glDrawBuffers lista GL_COLOR_ATTACHMENT0, 1 e 2. Sem ela só o anexo 0 recebe alguma coisa.\n\nA lista fica guardada no framebuffer ligado a GL_DRAW_FRAMEBUFFER, então chame com esse framebuffer ligado, uma vez, na configuração.",
    },
    params: [
      { name: "n", type: "GLsizei", desc: { en: "Number of entries, up to GL_MAX_DRAW_BUFFERS (at least 8).", pt: "Número de entradas, até GL_MAX_DRAW_BUFFERS (pelo menos 8)." } },
      { name: "bufs", type: "const GLenum *", desc: { en: "GL_COLOR_ATTACHMENTi or GL_NONE for each output location.", pt: "GL_COLOR_ATTACHMENTi ou GL_NONE para cada location de saída." } },
    ],
    notes: [
      { en: "The DSA form, glNamedFramebufferDrawBuffers, takes the framebuffer as an argument and needs no bind.", pt: "A forma DSA, glNamedFramebufferDrawBuffers, recebe o framebuffer como argumento e não precisa de bind." },
      { en: "glClear clears every listed attachment to the same colour; to clear them to different values use glClearBufferfv (or glClearNamedFramebufferfv).", pt: "glClear limpa todos os anexos listados com a mesma cor; para limpar com valores diferentes use glClearBufferfv (ou glClearNamedFramebufferfv)." },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "n is larger than GL_MAX_DRAW_BUFFERS.", pt: "n é maior que GL_MAX_DRAW_BUFFERS." } },
      { code: "GL_INVALID_OPERATION", when: { en: "An attachment is listed twice, or a value is invalid for the bound framebuffer.", pt: "Um anexo aparece duas vezes, ou um valor é inválido para o framebuffer ligado." } },
    ],
    example: `glBindFramebuffer(GL_FRAMEBUFFER, gBuffer);
GLenum attachments[3] = { GL_COLOR_ATTACHMENT0, GL_COLOR_ATTACHMENT1, GL_COLOR_ATTACHMENT2 };
glDrawBuffers(3, attachments);`,
    related: ["glNamedFramebufferDrawBuffers", "glDrawBuffer", "glFramebufferTexture2D", "glBlendFunci"],
    khronos: `${KHR}glDrawBuffers.xhtml`,
  },
  {
    name: "glFramebufferTexture",
    category: "framebuffers",
    since: "GL 3.2",
    signature: "void glFramebufferTexture(GLenum target, GLenum attachment, GLuint texture, GLint level);",
    summary: {
      en: "Attaches a whole texture to a framebuffer; a cubemap or array texture is attached with all its layers.",
      pt: "Anexa uma textura inteira a um framebuffer; um cubemap ou textura array é anexado com todas as camadas.",
    },
    description: {
      en: "Unlike glFramebufferTexture2D there is no texture-target argument. For a plain 2D texture the two are the same. For a cubemap or array texture this makes a layered attachment: one draw can reach every face, and a geometry shader chooses which by writing gl_Layer.\n\nThat is how an omnidirectional (point-light) shadow map is drawn in one pass: the geometry shader emits each triangle six times, once per cube face.",
      pt: "Diferente de glFramebufferTexture2D, não há argumento de target da textura. Para uma textura 2D simples as duas são iguais. Para um cubemap ou textura array esta cria um anexo em camadas: uma chamada de desenho alcança todas as faces, e um geometry shader escolhe qual escrevendo gl_Layer.\n\nÉ assim que um shadow map omnidirecional (de luz pontual) é desenhado numa passada só: o geometry shader emite cada triângulo seis vezes, uma por face do cubo.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "GL_FRAMEBUFFER, GL_DRAW_FRAMEBUFFER or GL_READ_FRAMEBUFFER.", pt: "GL_FRAMEBUFFER, GL_DRAW_FRAMEBUFFER ou GL_READ_FRAMEBUFFER." } },
      { name: "attachment", type: "GLenum", desc: { en: "GL_COLOR_ATTACHMENTi, GL_DEPTH_ATTACHMENT…", pt: "GL_COLOR_ATTACHMENTi, GL_DEPTH_ATTACHMENT…" } },
      { name: "texture", type: "GLuint", desc: { en: "The texture, or 0 to detach.", pt: "A textura, ou 0 para desanexar." } },
      { name: "level", type: "GLint", desc: { en: "Mip level, usually 0.", pt: "Nível de mipmap, normalmente 0." } },
    ],
    notes: [
      { en: "If one attachment is layered, all of them must be, or the framebuffer is incomplete (GL_FRAMEBUFFER_INCOMPLETE_LAYER_TARGETS).", pt: "Se um anexo é em camadas, todos precisam ser, senão o framebuffer fica incompleto (GL_FRAMEBUFFER_INCOMPLETE_LAYER_TARGETS)." },
    ],
    example: `// point-light shadows: depth cubemap, all 6 faces in one pass
glBindFramebuffer(GL_FRAMEBUFFER, depthFbo);
glFramebufferTexture(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, depthCubemap, 0);
glDrawBuffer(GL_NONE);
glReadBuffer(GL_NONE);`,
    related: ["glFramebufferTexture2D", "glFramebufferTextureLayer", "glNamedFramebufferTexture", "glDrawBuffer"],
    khronos: `${KHR}glFramebufferTexture.xhtml`,
  },
  {
    name: "glFramebufferTextureLayer",
    category: "framebuffers",
    since: "GL 3.0",
    signature: "void glFramebufferTextureLayer(GLenum target, GLenum attachment, GLuint texture,\n                               GLint level, GLint layer);",
    summary: {
      en: "Attaches one single layer of an array (or 3D) texture to a framebuffer.",
      pt: "Anexa uma única camada de uma textura array (ou 3D) a um framebuffer.",
    },
    description: {
      en: "An array texture holds several same-sized images under one ID. This attaches just one of them, so you can render into each layer in turn. Cascaded shadow maps keep all cascades in one GL_TEXTURE_2D_ARRAY and loop: attach layer i, set cascade i's light matrix, draw the scene.",
      pt: "Uma textura array guarda várias imagens do mesmo tamanho sob um ID. Esta função anexa só uma delas, para você renderizar em cada camada por vez. Os cascaded shadow maps guardam todas as cascatas num GL_TEXTURE_2D_ARRAY e fazem um laço: anexa a camada i, define a matriz de luz da cascata i, desenha a cena.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "GL_FRAMEBUFFER, GL_DRAW_FRAMEBUFFER or GL_READ_FRAMEBUFFER.", pt: "GL_FRAMEBUFFER, GL_DRAW_FRAMEBUFFER ou GL_READ_FRAMEBUFFER." } },
      { name: "attachment", type: "GLenum", desc: { en: "GL_COLOR_ATTACHMENTi, GL_DEPTH_ATTACHMENT…", pt: "GL_COLOR_ATTACHMENTi, GL_DEPTH_ATTACHMENT…" } },
      { name: "texture", type: "GLuint", desc: { en: "An array, 3D or cubemap-array texture.", pt: "Uma textura array, 3D ou cubemap array." } },
      { name: "level", type: "GLint", desc: { en: "Mip level.", pt: "Nível de mipmap." } },
      { name: "layer", type: "GLint", desc: { en: "Which layer (for a cubemap array: layer = 6 × cube + face).", pt: "Qual camada (num cubemap array: camada = 6 × cubo + face)." } },
    ],
    notes: [
      { en: "Switching the attachment between draws is cheap; there is no need for one framebuffer per layer.", pt: "Trocar o anexo entre chamadas de desenho é barato; não é preciso um framebuffer por camada." },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "layer is out of range for the texture.", pt: "layer está fora da faixa da textura." } },
      { code: "GL_INVALID_OPERATION", when: { en: "texture is not an array, 3D or cubemap-array texture.", pt: "texture não é uma textura array, 3D ou cubemap array." } },
    ],
    example: `for (int i = 0; i < cascades; ++i) {
    glFramebufferTextureLayer(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, shadowArray, 0, i);
    glClear(GL_DEPTH_BUFFER_BIT);
    drawSceneDepth(lightMatrix[i]);
}`,
    related: ["glFramebufferTexture", "glFramebufferTexture2D", "glBindFramebuffer"],
    khronos: `${KHR}glFramebufferTextureLayer.xhtml`,
  },
  {
    name: "glRenderbufferStorageMultisample",
    category: "framebuffers",
    since: "GL 3.0",
    signature: "void glRenderbufferStorageMultisample(GLenum target, GLsizei samples, GLenum internalformat,\n                                      GLsizei width, GLsizei height);",
    summary: {
      en: "Allocates a renderbuffer with several samples per pixel, for MSAA in your own framebuffer.",
      pt: "Aloca um renderbuffer com várias amostras por pixel, para MSAA no seu próprio framebuffer.",
    },
    description: {
      en: "Multisample anti-aliasing stores several coverage samples per pixel, so triangle edges get partial coverage instead of a hard step. The window's framebuffer can ask for it at creation (glfwWindowHint(GLFW_SAMPLES, 4)); an off-screen framebuffer, for HDR or post-processing, needs multisample attachments made with this function.\n\nA multisample image cannot be sampled like a normal texture. When the frame is drawn, resolve it into a normal framebuffer with glBlitFramebuffer, which averages the samples of each pixel.",
      pt: "O anti-aliasing por multisample guarda várias amostras de cobertura por pixel, assim as bordas dos triângulos ganham cobertura parcial em vez de um degrau seco. O framebuffer da janela pode pedir isso na criação (glfwWindowHint(GLFW_SAMPLES, 4)); um framebuffer fora da tela, para HDR ou pós-processamento, precisa de anexos multisample feitos com esta função.\n\nUma imagem multisample não pode ser lida como uma textura comum. Quando o frame estiver desenhado, resolva-a num framebuffer normal com glBlitFramebuffer, que tira a média das amostras de cada pixel.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "Always GL_RENDERBUFFER (the bound one).", pt: "Sempre GL_RENDERBUFFER (o ligado)." } },
      { name: "samples", type: "GLsizei", desc: { en: "Samples per pixel: 4 is the usual choice, at most GL_MAX_SAMPLES.", pt: "Amostras por pixel: 4 é a escolha usual, no máximo GL_MAX_SAMPLES." } },
      { name: "internalformat", type: "GLenum", desc: { en: "GL_RGBA8, GL_RGBA16F (HDR), GL_DEPTH24_STENCIL8…", pt: "GL_RGBA8, GL_RGBA16F (HDR), GL_DEPTH24_STENCIL8…" } },
      { name: "width", type: "GLsizei", desc: { en: "Width in pixels.", pt: "Largura em pixels." } },
      { name: "height", type: "GLsizei", desc: { en: "Height in pixels.", pt: "Altura em pixels." } },
    ],
    notes: [
      { en: "Every attachment of the framebuffer needs the same sample count, or it is incomplete (GL_FRAMEBUFFER_INCOMPLETE_MULTISAMPLE).", pt: "Todos os anexos do framebuffer precisam do mesmo número de amostras, senão ele fica incompleto (GL_FRAMEBUFFER_INCOMPLETE_MULTISAMPLE)." },
      { en: "Memory grows with the samples: a 4× 1080p RGBA16F target is about 66 MB.", pt: "A memória cresce com as amostras: um target RGBA16F 1080p com 4× tem cerca de 66 MB." },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "samples is larger than GL_MAX_SAMPLES, or the size is too large.", pt: "samples é maior que GL_MAX_SAMPLES, ou o tamanho é grande demais." } },
    ],
    example: `glBindRenderbuffer(GL_RENDERBUFFER, msColor);
glRenderbufferStorageMultisample(GL_RENDERBUFFER, 4, GL_RGBA16F, width, height);
glBindRenderbuffer(GL_RENDERBUFFER, msDepth);
glRenderbufferStorageMultisample(GL_RENDERBUFFER, 4, GL_DEPTH24_STENCIL8, width, height);`,
    related: ["glRenderbufferStorage", "glBlitFramebuffer", "glFramebufferRenderbuffer", "glNamedRenderbufferStorage"],
    khronos: `${KHR}glRenderbufferStorageMultisample.xhtml`,
  },
  {
    name: "glBlitFramebuffer",
    category: "framebuffers",
    since: "GL 3.0",
    signature: "void glBlitFramebuffer(GLint srcX0, GLint srcY0, GLint srcX1, GLint srcY1,\n                       GLint dstX0, GLint dstY0, GLint dstX1, GLint dstY1,\n                       GLbitfield mask, GLenum filter);",
    summary: {
      en: "Copies a rectangle of pixels from the read framebuffer to the draw framebuffer, scaling and resolving MSAA on the way.",
      pt: "Copia um retângulo de pixels do framebuffer de leitura para o de desenho, redimensionando e resolvendo o MSAA no caminho.",
    },
    description: {
      en: "Source and destination are the framebuffers bound to GL_READ_FRAMEBUFFER and GL_DRAW_FRAMEBUFFER (0 means the window). Three everyday uses:\n\nMSAA resolve: copy a multisample framebuffer into a normal one of the same size; each pixel becomes the average of its samples.\nCopying depth: bring a G-buffer's depth into the window's framebuffer, so forward-rendered objects are hidden correctly behind deferred ones.\nScaling: render at a lower resolution and stretch it to the window.",
      pt: "Origem e destino são os framebuffers ligados a GL_READ_FRAMEBUFFER e GL_DRAW_FRAMEBUFFER (0 é a janela). Três usos do dia a dia:\n\nResolver MSAA: copiar um framebuffer multisample para um normal do mesmo tamanho; cada pixel vira a média das suas amostras.\nCopiar a profundidade: trazer a profundidade de um G-buffer para o framebuffer da janela, assim objetos desenhados em forward ficam escondidos corretamente atrás dos de deferred.\nRedimensionar: renderizar numa resolução menor e esticar para a janela.",
    },
    params: [
      { name: "srcX0, srcY0, srcX1, srcY1", type: "GLint", desc: { en: "Source rectangle corners (X1, Y1 exclusive).", pt: "Cantos do retângulo de origem (X1, Y1 exclusivos)." } },
      { name: "dstX0, dstY0, dstX1, dstY1", type: "GLint", desc: { en: "Destination rectangle. A different size scales; swapped corners flip.", pt: "Retângulo de destino. Um tamanho diferente redimensiona; cantos trocados espelham." } },
      {
        name: "mask", type: "GLbitfield",
        desc: { en: "Which buffers to copy, combined with |.", pt: "Quais buffers copiar, combinados com |." },
        values: [
          { name: "GL_COLOR_BUFFER_BIT", desc: { en: "The read buffer to every draw buffer.", pt: "O read buffer para todos os draw buffers." } },
          { name: "GL_DEPTH_BUFFER_BIT", desc: { en: "Depth (needs GL_NEAREST and matching formats).", pt: "Profundidade (exige GL_NEAREST e formatos iguais)." } },
          { name: "GL_STENCIL_BUFFER_BIT", desc: { en: "Stencil (needs GL_NEAREST).", pt: "Stencil (exige GL_NEAREST)." } },
        ],
      },
      { name: "filter", type: "GLenum", desc: { en: "GL_NEAREST or GL_LINEAR, used when the sizes differ. Depth and stencil allow only GL_NEAREST.", pt: "GL_NEAREST ou GL_LINEAR, usado quando os tamanhos diferem. Profundidade e stencil só aceitam GL_NEAREST." } },
    ],
    notes: [
      { en: "When the source is multisample, both rectangles must be the same size: resolve first, scale in a second blit.", pt: "Quando a origem é multisample, os dois retângulos precisam ter o mesmo tamanho: resolva primeiro, redimensione num segundo blit." },
      { en: "The DSA form is glBlitNamedFramebuffer(readFbo, drawFbo, …), with no binds.", pt: "A forma DSA é glBlitNamedFramebuffer(readFbo, drawFbo, …), sem binds." },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "Multisample source with different rectangle sizes, depth/stencil formats that differ, or GL_LINEAR with depth or stencil.", pt: "Origem multisample com retângulos de tamanhos diferentes, formatos de profundidade/stencil diferentes, ou GL_LINEAR com profundidade ou stencil." } },
      { code: "GL_INVALID_FRAMEBUFFER_OPERATION", when: { en: "The read or draw framebuffer is incomplete.", pt: "O framebuffer de leitura ou de desenho está incompleto." } },
    ],
    example: `// resolve 4x MSAA into the post-processing framebuffer
glBindFramebuffer(GL_READ_FRAMEBUFFER, msaaFbo);
glBindFramebuffer(GL_DRAW_FRAMEBUFFER, resolveFbo);
glBlitFramebuffer(0, 0, width, height, 0, 0, width, height,
                  GL_COLOR_BUFFER_BIT, GL_NEAREST);`,
    related: ["glBindFramebuffer", "glRenderbufferStorageMultisample", "glReadBuffer", "glDrawBuffer"],
    khronos: `${KHR}glBlitFramebuffer.xhtml`,
  },
  {
    name: "glReadPixels",
    category: "framebuffers",
    since: "GL 1.0",
    signature: "void glReadPixels(GLint x, GLint y, GLsizei width, GLsizei height,\n                  GLenum format, GLenum type, void *data);",
    summary: {
      en: "Copies pixels from the read framebuffer back to the CPU (or into a pixel buffer object).",
      pt: "Copia pixels do framebuffer de leitura de volta para a CPU (ou para um pixel buffer object).",
    },
    description: {
      en: "Reads a rectangle from the read buffer of the framebuffer bound to GL_READ_FRAMEBUFFER: screenshots, or the object ID under the mouse in picking.\n\nTwo things to know. The origin is the bottom-left corner, but window coordinates start at the top, so flip y: height − 1 − mouseY. And a plain call stalls: the CPU waits until the GPU has finished every pending draw. To avoid that, bind a buffer to GL_PIXEL_PACK_BUFFER first; data then becomes a byte offset into it, the call returns at once, and you map the buffer a frame later (or after a fence signals).",
      pt: "Lê um retângulo do read buffer do framebuffer ligado a GL_READ_FRAMEBUFFER: capturas de tela, ou o ID do objeto sob o mouse no picking.\n\nDuas coisas a saber. A origem é o canto inferior esquerdo, mas as coordenadas da janela começam em cima, então inverta y: height − 1 − mouseY. E uma chamada simples trava: a CPU espera a GPU terminar todos os desenhos pendentes. Para evitar isso, ligue antes um buffer a GL_PIXEL_PACK_BUFFER; data passa a ser um offset em bytes dentro dele, a chamada volta na hora, e você mapeia o buffer um frame depois (ou quando uma fence sinalizar).",
    },
    params: [
      { name: "x, y", type: "GLint", desc: { en: "Bottom-left corner of the rectangle.", pt: "Canto inferior esquerdo do retângulo." } },
      { name: "width, height", type: "GLsizei", desc: { en: "Size of the rectangle (1, 1 for a single pixel).", pt: "Tamanho do retângulo (1, 1 para um pixel só)." } },
      {
        name: "format", type: "GLenum",
        desc: { en: "Channels to return.", pt: "Canais a devolver." },
        values: [
          { name: "GL_RGBA / GL_RGB", desc: { en: "Colour, for screenshots.", pt: "Cor, para capturas de tela." } },
          { name: "GL_RED_INTEGER", desc: { en: "One integer channel, for ID buffers (GL_R32UI).", pt: "Um canal inteiro, para buffers de ID (GL_R32UI)." } },
          { name: "GL_DEPTH_COMPONENT", desc: { en: "The depth value.", pt: "O valor de profundidade." } },
        ],
      },
      { name: "type", type: "GLenum", desc: { en: "Type of each value: GL_UNSIGNED_BYTE, GL_FLOAT, GL_UNSIGNED_INT…", pt: "Tipo de cada valor: GL_UNSIGNED_BYTE, GL_FLOAT, GL_UNSIGNED_INT…" } },
      { name: "data", type: "void *", desc: { en: "Destination memory, or a byte offset when a GL_PIXEL_PACK_BUFFER is bound.", pt: "Memória de destino, ou um offset em bytes quando há um GL_PIXEL_PACK_BUFFER ligado." } },
    ],
    notes: [
      { en: "Rows are padded to GL_PACK_ALIGNMENT (4 bytes by default): reading GL_RGB rows of odd width needs glPixelStorei(GL_PACK_ALIGNMENT, 1) or a bigger buffer.", pt: "As linhas são completadas até GL_PACK_ALIGNMENT (4 bytes por padrão): ler linhas GL_RGB de largura ímpar exige glPixelStorei(GL_PACK_ALIGNMENT, 1) ou um buffer maior." },
      { en: "Reading a whole 1080p frame synchronously costs milliseconds; one pixel through a PBO costs almost nothing.", pt: "Ler um frame 1080p inteiro de forma síncrona custa milissegundos; um pixel por um PBO custa quase nada." },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "format/type do not suit the read buffer (e.g. GL_RGBA with an integer texture), or the pack buffer is too small.", pt: "format/type não servem para o read buffer (por exemplo GL_RGBA com uma textura de inteiros), ou o pack buffer é pequeno demais." } },
      { code: "GL_INVALID_FRAMEBUFFER_OPERATION", when: { en: "The read framebuffer is incomplete.", pt: "O framebuffer de leitura está incompleto." } },
    ],
    example: `// picking: the object ID under the mouse, without stalling
glBindFramebuffer(GL_READ_FRAMEBUFFER, idFbo);
glBindBuffer(GL_PIXEL_PACK_BUFFER, pbo);
glReadPixels(mx, height - 1 - my, 1, 1, GL_RED_INTEGER, GL_UNSIGNED_INT, nullptr);
GLsync fence = glFenceSync(GL_SYNC_GPU_COMMANDS_COMPLETE, 0);`,
    related: ["glReadBuffer", "glBindFramebuffer", "glFenceSync", "glMapBufferRange", "glClearNamedFramebufferuiv"],
    khronos: `${KHR}glReadPixels.xhtml`,
  },
];
