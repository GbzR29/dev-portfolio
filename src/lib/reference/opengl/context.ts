// src/lib/reference/opengl/context.ts
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

const CAPABILITIES = [
  { name: "GL_DEPTH_TEST", desc: { en: "Hide fragments behind closer ones using the depth buffer.", pt: "Esconde fragmentos atrás de outros mais próximos usando o depth buffer." } },
  { name: "GL_BLEND", desc: { en: "Mix fragment colors with what is already in the framebuffer (transparency).", pt: "Mistura a cor do fragmento com o que já está no framebuffer (transparência)." } },
  { name: "GL_CULL_FACE", desc: { en: "Skip triangles facing away from the camera.", pt: "Descarta triângulos virados de costas para a câmera." } },
  { name: "GL_STENCIL_TEST", desc: { en: "Accept or reject fragments using the stencil buffer.", pt: "Aceita ou rejeita fragmentos usando o stencil buffer." } },
  { name: "GL_SCISSOR_TEST", desc: { en: "Only draw inside the rectangle set by glScissor.", pt: "Só desenha dentro do retângulo definido por glScissor." } },
  { name: "GL_POLYGON_OFFSET_FILL", desc: { en: "Apply the depth offset from glPolygonOffset.", pt: "Aplica o deslocamento de profundidade de glPolygonOffset." } },
  { name: "GL_FRAMEBUFFER_SRGB", desc: { en: "Convert linear colors to sRGB when writing to an sRGB framebuffer.", pt: "Converte cores lineares para sRGB ao escrever em um framebuffer sRGB." } },
  { name: "GL_MULTISAMPLE", desc: { en: "Use MSAA when the framebuffer has multiple samples (on by default).", pt: "Usa MSAA quando o framebuffer tem várias amostras (ligado por padrão)." } },
  { name: "GL_DEBUG_OUTPUT / GL_DEBUG_OUTPUT_SYNCHRONOUS", desc: { en: "Send driver messages to the debug callback (synchronously = on the calling thread, right away).", pt: "Envia mensagens do driver para o callback de debug (síncrono = na mesma thread, na hora)." } },
  { name: "GL_PROGRAM_POINT_SIZE", desc: { en: "Let the vertex shader set gl_PointSize.", pt: "Deixa o vertex shader definir gl_PointSize." } },
];

export const contextEntries: RefEntry[] = [
  {
    name: "glViewport",
    category: "context",
    since: "GL 1.0",
    signature: "void glViewport(GLint x, GLint y, GLsizei width, GLsizei height);",
    summary: {
      en: "Sets which rectangle of the window the rendered image is mapped to.",
      pt: "Define em qual retângulo da janela a imagem renderizada é colocada.",
    },
    description: {
      en: "After the vertex shader, positions are in normalized device coordinates (NDC), from -1 to 1 on each axis. The viewport is the final step that turns them into pixel coordinates: -1 becomes x, +1 becomes x + width.\n\nYou usually set it once to the full framebuffer size, and again every time the window is resized.",
      pt: "Depois do vertex shader, as posições estão em coordenadas normalizadas (NDC), de -1 a 1 em cada eixo. O viewport é o passo final que converte isso em pixels: -1 vira x, +1 vira x + width.\n\nNormalmente você define uma vez com o tamanho inteiro do framebuffer, e de novo sempre que a janela é redimensionada.",
    },
    params: [
      { name: "x", type: "GLint", desc: { en: "Left edge in pixels, from the LEFT of the window.", pt: "Borda esquerda em pixels, a partir da ESQUERDA da janela." } },
      { name: "y", type: "GLint", desc: { en: "Bottom edge in pixels, from the BOTTOM of the window (OpenGL's origin is bottom-left).", pt: "Borda de baixo em pixels, a partir de BAIXO da janela (a origem do OpenGL é embaixo à esquerda)." } },
      { name: "width", type: "GLsizei", desc: { en: "Width in pixels.", pt: "Largura em pixels." } },
      { name: "height", type: "GLsizei", desc: { en: "Height in pixels.", pt: "Altura em pixels." } },
    ],
    notes: [
      { en: "On high-DPI screens the framebuffer is bigger than the window: use glfwGetFramebufferSize, not the window size.", pt: "Em telas de alta densidade o framebuffer é maior que a janela: use glfwGetFramebufferSize, não o tamanho da janela." },
      { en: "When rendering into a framebuffer object of a different size (e.g. a shadow map), set the viewport to that size and restore it afterwards.", pt: "Ao renderizar em um framebuffer object de outro tamanho (ex.: shadow map), ajuste o viewport para esse tamanho e restaure depois." },
    ],
    errors: [{ code: "GL_INVALID_VALUE", when: { en: "width or height is negative.", pt: "width ou height é negativo." } }],
    example: `void framebufferSizeCallback(GLFWwindow*, int w, int h) {
    glViewport(0, 0, w, h);
}
glfwSetFramebufferSizeCallback(window, framebufferSizeCallback);`,
    related: ["glClear", "glBindFramebuffer"],
    khronos: `${KHR}glViewport.xhtml`,
  },
  {
    name: "glClearColor",
    category: "context",
    since: "GL 1.0",
    signature: "void glClearColor(GLfloat red, GLfloat green, GLfloat blue, GLfloat alpha);",
    summary: {
      en: "Chooses the color glClear will fill the color buffer with.",
      pt: "Escolhe a cor com que glClear vai preencher o color buffer.",
    },
    description: {
      en: "This only stores a color in the context state — it does not clear anything by itself. The next glClear(GL_COLOR_BUFFER_BIT) uses it. Since it is state, you can set it once at startup.",
      pt: "Isso só guarda uma cor no estado do contexto — não limpa nada sozinho. O próximo glClear(GL_COLOR_BUFFER_BIT) usa essa cor. Como é estado, você pode definir uma vez só na inicialização.",
    },
    params: [
      { name: "red", type: "GLfloat", desc: { en: "Red, 0.0 to 1.0.", pt: "Vermelho, de 0.0 a 1.0." } },
      { name: "green", type: "GLfloat", desc: { en: "Green, 0.0 to 1.0.", pt: "Verde, de 0.0 a 1.0." } },
      { name: "blue", type: "GLfloat", desc: { en: "Blue, 0.0 to 1.0.", pt: "Azul, de 0.0 a 1.0." } },
      { name: "alpha", type: "GLfloat", desc: { en: "Alpha, usually 1.0.", pt: "Alfa, normalmente 1.0." } },
    ],
    notes: [
      { en: "Values are floats between 0 and 1, not 0–255. Divide by 255 if you copy a color from a picker.", pt: "Os valores são floats entre 0 e 1, não 0–255. Divida por 255 se copiar uma cor de um seletor." },
    ],
    example: `glClearColor(0.1f, 0.1f, 0.12f, 1.0f); // dark grey
// every frame:
glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);`,
    related: ["glClear"],
    khronos: `${KHR}glClearColor.xhtml`,
  },
  {
    name: "glClear",
    category: "context",
    since: "GL 1.0",
    signature: "void glClear(GLbitfield mask);",
    summary: {
      en: "Resets the chosen buffers of the current framebuffer (color, depth, stencil).",
      pt: "Reinicia os buffers escolhidos do framebuffer atual (cor, profundidade, stencil).",
    },
    description: {
      en: "Called at the start of every frame so the new image does not draw on top of the old one. Each buffer is filled with its clear value: the color from glClearColor, depth 1.0 (the far plane) and stencil 0 by default.\n\nClearing is very cheap on modern GPUs — often cheaper than not clearing — so always clear what you use.",
      pt: "Chamado no início de cada frame para que a imagem nova não seja desenhada por cima da antiga. Cada buffer é preenchido com seu valor de limpeza: a cor de glClearColor, profundidade 1.0 (o plano distante) e stencil 0 por padrão.\n\nLimpar é muito barato em GPUs modernas — muitas vezes mais barato que não limpar — então sempre limpe o que você usa.",
    },
    params: [
      {
        name: "mask", type: "GLbitfield",
        desc: { en: "Which buffers to clear, combined with |.", pt: "Quais buffers limpar, combinados com |." },
        values: [
          { name: "GL_COLOR_BUFFER_BIT", desc: { en: "Color attachments.", pt: "Attachments de cor." } },
          { name: "GL_DEPTH_BUFFER_BIT", desc: { en: "Depth buffer — required when depth testing is on.", pt: "Depth buffer — obrigatório com o depth test ligado." } },
          { name: "GL_STENCIL_BUFFER_BIT", desc: { en: "Stencil buffer.", pt: "Stencil buffer." } },
        ],
      },
    ],
    notes: [
      { en: "Forgetting GL_DEPTH_BUFFER_BIT with depth testing enabled usually shows only the first frame, or nothing at all.", pt: "Esquecer GL_DEPTH_BUFFER_BIT com o depth test ligado geralmente mostra só o primeiro frame, ou nada." },
      { en: "glDepthMask(GL_FALSE) also blocks clearing the depth buffer — re-enable it before glClear.", pt: "glDepthMask(GL_FALSE) também impede a limpeza do depth buffer — reative antes de glClear." },
    ],
    errors: [{ code: "GL_INVALID_VALUE", when: { en: "mask has bits other than the three above.", pt: "mask tem bits além dos três acima." } }],
    example: `while (!glfwWindowShouldClose(window)) {
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    // ... draw ...
    glfwSwapBuffers(window);
    glfwPollEvents();
}`,
    related: ["glClearColor", "glDepthMask", "glBindFramebuffer"],
    khronos: `${KHR}glClear.xhtml`,
  },
  {
    name: "glEnable",
    category: "context",
    since: "GL 1.0",
    signature: "void glEnable(GLenum cap);",
    summary: {
      en: "Switches on a fixed-function feature such as depth testing, blending or face culling.",
      pt: "Liga um recurso fixo do pipeline, como depth test, blending ou face culling.",
    },
    description: {
      en: "Many pipeline stages that are not shaders — depth test, blending, culling… — are toggled with glEnable/glDisable. They stay in that state until you change them, for every following draw.\n\nMost are off by default. A 3D scene without glEnable(GL_DEPTH_TEST) draws triangles in submission order, so far objects can appear on top of near ones.",
      pt: "Várias etapas do pipeline que não são shaders — depth test, blending, culling… — são ligadas e desligadas com glEnable/glDisable. Elas ficam nesse estado até você mudar, para todos os draws seguintes.\n\nA maioria começa desligada. Uma cena 3D sem glEnable(GL_DEPTH_TEST) desenha triângulos na ordem em que foram enviados, então objetos distantes podem aparecer na frente dos próximos.",
    },
    params: [
      { name: "cap", type: "GLenum", desc: { en: "The capability to enable.", pt: "O recurso a ligar." }, values: CAPABILITIES },
    ],
    errors: [{ code: "GL_INVALID_ENUM", when: { en: "cap is not a known capability.", pt: "cap não é um recurso conhecido." } }],
    example: `glEnable(GL_DEPTH_TEST);
glEnable(GL_CULL_FACE);
glEnable(GL_BLEND);
glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);`,
    related: ["glDisable", "glDepthFunc", "glBlendFunc", "glCullFace"],
    khronos: `${KHR}glEnable.xhtml`,
  },
  {
    name: "glDisable",
    category: "context",
    since: "GL 1.0",
    signature: "void glDisable(GLenum cap);",
    summary: {
      en: "Switches off a feature previously turned on with glEnable.",
      pt: "Desliga um recurso que foi ligado com glEnable.",
    },
    description: {
      en: "The counterpart of glEnable. Common pattern: disable a feature for one special pass and enable it again afterwards — for example, disabling depth testing to draw a full-screen post-processing quad.",
      pt: "O oposto de glEnable. Padrão comum: desligar um recurso para uma passada especial e ligar de novo depois — por exemplo, desligar o depth test para desenhar o quad de pós-processamento na tela inteira.",
    },
    params: [
      { name: "cap", type: "GLenum", desc: { en: "The capability to disable (same values as glEnable).", pt: "O recurso a desligar (mesmos valores de glEnable)." }, values: CAPABILITIES },
    ],
    errors: [{ code: "GL_INVALID_ENUM", when: { en: "cap is not a known capability.", pt: "cap não é um recurso conhecido." } }],
    example: `glDisable(GL_DEPTH_TEST);   // screen quad must not be depth-tested
drawScreenQuad();
glEnable(GL_DEPTH_TEST);`,
    related: ["glEnable"],
    khronos: `${KHR}glEnable.xhtml`,
  },
  {
    name: "glGetString",
    category: "context",
    since: "GL 1.0",
    signature: "const GLubyte *glGetString(GLenum name);",
    summary: {
      en: "Returns text describing the driver: version, GPU name, vendor, GLSL version.",
      pt: "Retorna um texto que descreve o driver: versão, nome da GPU, fabricante, versão do GLSL.",
    },
    description: {
      en: "Useful right after creating the context, to log which GPU and OpenGL version you actually got. On laptops with two GPUs, this is how you find out the program is running on the integrated one.",
      pt: "Útil logo depois de criar o contexto, para registrar qual GPU e versão do OpenGL você realmente recebeu. Em notebooks com duas GPUs, é assim que você descobre que o programa está rodando na integrada.",
    },
    params: [
      {
        name: "name", type: "GLenum",
        desc: { en: "Which string to return.", pt: "Qual texto retornar." },
        values: [
          { name: "GL_VERSION", desc: { en: "e.g. \"4.6.0 NVIDIA 551.23\".", pt: "ex.: \"4.6.0 NVIDIA 551.23\"." } },
          { name: "GL_RENDERER", desc: { en: "GPU name.", pt: "Nome da GPU." } },
          { name: "GL_VENDOR", desc: { en: "Driver vendor.", pt: "Fabricante do driver." } },
          { name: "GL_SHADING_LANGUAGE_VERSION", desc: { en: "Highest supported GLSL version.", pt: "Maior versão de GLSL suportada." } },
        ],
      },
    ],
    returns: {
      en: "A static, null-terminated string owned by the driver. Do not free it. Returns nullptr if there is no current context.",
      pt: "Uma string estática terminada em nulo, pertencente ao driver. Não libere. Retorna nullptr se não houver contexto atual.",
    },
    errors: [{ code: "GL_INVALID_ENUM", when: { en: "name is not accepted.", pt: "name não é aceito." } }],
    example: `std::printf("GPU:    %s\\n", glGetString(GL_RENDERER));
std::printf("OpenGL: %s\\n", glGetString(GL_VERSION));`,
    related: ["glGetIntegerv"],
    khronos: `${KHR}glGetString.xhtml`,
  },
  {
    name: "glGetIntegerv",
    category: "context",
    since: "GL 1.0",
    signature: "void glGetIntegerv(GLenum pname, GLint *data);",
    summary: {
      en: "Reads an integer piece of state or a hardware limit.",
      pt: "Lê um estado inteiro ou um limite do hardware.",
    },
    description: {
      en: "The generic query for integer values. Use it to ask the driver about limits (how many texture units, the maximum texture size) or about current state (which framebuffer is bound, the current viewport).\n\nSome values have several components — GL_VIEWPORT writes 4 integers — so data must have room for all of them.",
      pt: "A consulta genérica para valores inteiros. Use para perguntar ao driver sobre limites (quantas texture units, tamanho máximo de textura) ou sobre o estado atual (qual framebuffer está ligado, o viewport atual).\n\nAlguns valores têm vários componentes — GL_VIEWPORT escreve 4 inteiros — então data precisa ter espaço para todos.",
    },
    params: [
      {
        name: "pname", type: "GLenum",
        desc: { en: "The value to query.", pt: "O valor a consultar." },
        values: [
          { name: "GL_MAX_TEXTURE_IMAGE_UNITS", desc: { en: "Texture units available to the fragment shader (≥ 16).", pt: "Texture units disponíveis para o fragment shader (≥ 16)." } },
          { name: "GL_MAX_TEXTURE_SIZE", desc: { en: "Largest width/height of a 2D texture.", pt: "Maior largura/altura de uma textura 2D." } },
          { name: "GL_MAX_VERTEX_ATTRIBS", desc: { en: "Number of vertex attribute locations (≥ 16).", pt: "Número de locations de atributos (≥ 16)." } },
          { name: "GL_UNIFORM_BUFFER_OFFSET_ALIGNMENT", desc: { en: "Required alignment for glBindBufferRange offsets.", pt: "Alinhamento exigido para offsets de glBindBufferRange." } },
          { name: "GL_VIEWPORT", desc: { en: "Current viewport as 4 ints.", pt: "Viewport atual como 4 ints." } },
          { name: "GL_MAJOR_VERSION / GL_MINOR_VERSION", desc: { en: "Context version as numbers.", pt: "Versão do contexto como números." } },
          { name: "GL_MAX_COMPUTE_WORK_GROUP_COUNT", desc: { en: "Use glGetIntegeri_v with index 0–2.", pt: "Use glGetIntegeri_v com índice 0–2." } },
        ],
      },
      { name: "data", type: "GLint *", desc: { en: "Where the result is written.", pt: "Onde o resultado é escrito." } },
    ],
    notes: [
      { en: "Queries that read state can force the CPU to wait for the driver. Fine at startup, avoid in hot loops.", pt: "Consultas de estado podem fazer a CPU esperar o driver. Tudo bem na inicialização, evite em loops frequentes." },
    ],
    errors: [{ code: "GL_INVALID_ENUM", when: { en: "pname is not accepted.", pt: "pname não é aceito." } }],
    example: `GLint units = 0;
glGetIntegerv(GL_MAX_TEXTURE_IMAGE_UNITS, &units);

GLint viewport[4];
glGetIntegerv(GL_VIEWPORT, viewport);`,
    related: ["glGetString", "glBindBufferRange"],
    khronos: `${KHR}glGet.xhtml`,
  },
  {
    name: "glGetError",
    category: "context",
    since: "GL 1.0",
    signature: "GLenum glGetError(void);",
    summary: {
      en: "Returns (and clears) the oldest error flag recorded by previous calls.",
      pt: "Retorna (e limpa) o erro mais antigo registrado por chamadas anteriores.",
    },
    description: {
      en: "OpenGL functions do not return error codes. When a call is invalid it is ignored and an error flag is set. glGetError reads that flag and resets it, so you must call it in a loop until it returns GL_NO_ERROR to empty all pending errors.\n\nIt tells you THAT something failed, not WHERE. On OpenGL 4.3+ the debug callback (glDebugMessageCallback) is far more useful.",
      pt: "As funções do OpenGL não retornam códigos de erro. Quando uma chamada é inválida ela é ignorada e um flag de erro é marcado. glGetError lê esse flag e o zera, então é preciso chamar em loop até retornar GL_NO_ERROR para esvaziar todos os erros pendentes.\n\nEla diz QUE algo falhou, não ONDE. No OpenGL 4.3+ o callback de debug (glDebugMessageCallback) é muito mais útil.",
    },
    params: [],
    returns: {
      en: "GL_NO_ERROR, or one of: GL_INVALID_ENUM, GL_INVALID_VALUE, GL_INVALID_OPERATION, GL_INVALID_FRAMEBUFFER_OPERATION, GL_OUT_OF_MEMORY, GL_STACK_OVERFLOW, GL_STACK_UNDERFLOW.",
      pt: "GL_NO_ERROR, ou um de: GL_INVALID_ENUM, GL_INVALID_VALUE, GL_INVALID_OPERATION, GL_INVALID_FRAMEBUFFER_OPERATION, GL_OUT_OF_MEMORY, GL_STACK_OVERFLOW, GL_STACK_UNDERFLOW.",
    },
    notes: [
      { en: "Each call can stall the pipeline. Wrap it in a debug-only macro instead of shipping it.", pt: "Cada chamada pode travar o pipeline. Coloque em uma macro só de debug em vez de deixar na versão final." },
    ],
    example: `#define GL_CHECK(x) do { x; \\
    for (GLenum e; (e = glGetError()) != GL_NO_ERROR;) \\
        std::fprintf(stderr, "GL error 0x%X at %s:%d\\n", e, __FILE__, __LINE__); \\
} while (0)

GL_CHECK(glBindTexture(GL_TEXTURE_2D, tex));`,
    related: ["glDebugMessageCallback"],
    khronos: `${KHR}glGetError.xhtml`,
  },
];
