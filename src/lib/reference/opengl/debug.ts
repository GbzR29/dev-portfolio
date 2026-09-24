// src/lib/reference/opengl/debug.ts
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

export const debugEntries: RefEntry[] = [
  {
    name: "glDebugMessageCallback",
    category: "debug",
    since: "GL 4.3",
    signature: "void glDebugMessageCallback(GLDEBUGPROC callback, const void *userParam);",
    summary: {
      en: "Registers a function the driver calls with a readable message whenever something goes wrong.",
      pt: "Registra uma função que o driver chama com uma mensagem legível sempre que algo dá errado.",
    },
    description: {
      en: "The best debugging tool OpenGL has. Instead of polling glGetError, the driver calls your function with a message such as \"GL_INVALID_OPERATION in glDrawElements: no element buffer bound\", plus performance warnings.\n\nIt needs a debug context (glfwWindowHint(GLFW_OPENGL_DEBUG_CONTEXT, GL_TRUE)) and glEnable(GL_DEBUG_OUTPUT). Add GL_DEBUG_OUTPUT_SYNCHRONOUS and the callback runs inside the failing call, so a breakpoint shows the exact line in the call stack.",
      pt: "A melhor ferramenta de depuração do OpenGL. Em vez de ficar consultando glGetError, o driver chama sua função com uma mensagem como \"GL_INVALID_OPERATION in glDrawElements: no element buffer bound\", além de avisos de desempenho.\n\nPrecisa de um contexto de debug (glfwWindowHint(GLFW_OPENGL_DEBUG_CONTEXT, GL_TRUE)) e de glEnable(GL_DEBUG_OUTPUT). Adicione GL_DEBUG_OUTPUT_SYNCHRONOUS e o callback roda dentro da chamada que falhou, então um breakpoint mostra a linha exata na pilha de chamadas.",
    },
    params: [
      { name: "callback", type: "GLDEBUGPROC", desc: { en: "Your function: void APIENTRY fn(GLenum source, GLenum type, GLuint id, GLenum severity, GLsizei length, const GLchar* message, const void* userParam).", pt: "Sua função: void APIENTRY fn(GLenum source, GLenum type, GLuint id, GLenum severity, GLsizei length, const GLchar* message, const void* userParam)." } },
      { name: "userParam", type: "const void *", desc: { en: "Any pointer you want passed back to the callback (e.g. your renderer), or nullptr.", pt: "Qualquer ponteiro que você queira receber de volta no callback (ex.: seu renderer), ou nullptr." } },
    ],
    notes: [
      { en: "Forgetting APIENTRY on the callback compiles but crashes on 32-bit Windows.", pt: "Esquecer APIENTRY no callback compila, mas trava no Windows 32 bits." },
      { en: "Some drivers are chatty: filter notifications with glDebugMessageControl.", pt: "Alguns drivers falam demais: filtre as notificações com glDebugMessageControl." },
    ],
    example: `void APIENTRY onGlDebug(GLenum source, GLenum type, GLuint id, GLenum severity,
                        GLsizei, const GLchar* message, const void*) {
    std::fprintf(stderr, "[GL] %s\\n", message);
}

glEnable(GL_DEBUG_OUTPUT);
glEnable(GL_DEBUG_OUTPUT_SYNCHRONOUS);
glDebugMessageCallback(onGlDebug, nullptr);`,
    related: ["glDebugMessageControl", "glObjectLabel", "glGetError"],
    khronos: `${KHR}glDebugMessageCallback.xhtml`,
  },
  {
    name: "glDebugMessageControl",
    category: "debug",
    since: "GL 4.3",
    signature: "void glDebugMessageControl(GLenum source, GLenum type, GLenum severity,\n                           GLsizei count, const GLuint *ids, GLboolean enabled);",
    summary: {
      en: "Filters which debug messages reach the callback.",
      pt: "Filtra quais mensagens de debug chegam ao callback.",
    },
    description: {
      en: "Each parameter narrows the filter; GL_DONT_CARE matches everything. The usual setup is to silence GL_DEBUG_SEVERITY_NOTIFICATION messages (buffer placement info, etc.) so real errors stand out.",
      pt: "Cada parâmetro restringe o filtro; GL_DONT_CARE aceita tudo. A configuração comum é silenciar as mensagens GL_DEBUG_SEVERITY_NOTIFICATION (informações de alocação de buffer, etc.) para que os erros reais se destaquem.",
    },
    params: [
      { name: "source", type: "GLenum", desc: { en: "Origin: GL_DEBUG_SOURCE_API, _SHADER_COMPILER, _APPLICATION… or GL_DONT_CARE.", pt: "Origem: GL_DEBUG_SOURCE_API, _SHADER_COMPILER, _APPLICATION… ou GL_DONT_CARE." } },
      { name: "type", type: "GLenum", desc: { en: "Kind: GL_DEBUG_TYPE_ERROR, _PERFORMANCE, _DEPRECATED_BEHAVIOR… or GL_DONT_CARE.", pt: "Tipo: GL_DEBUG_TYPE_ERROR, _PERFORMANCE, _DEPRECATED_BEHAVIOR… ou GL_DONT_CARE." } },
      {
        name: "severity", type: "GLenum",
        desc: { en: "Importance, or GL_DONT_CARE.", pt: "Importância, ou GL_DONT_CARE." },
        values: [
          { name: "GL_DEBUG_SEVERITY_HIGH", desc: { en: "Errors and undefined behavior.", pt: "Erros e comportamento indefinido." } },
          { name: "GL_DEBUG_SEVERITY_MEDIUM", desc: { en: "Serious performance warnings.", pt: "Avisos sérios de desempenho." } },
          { name: "GL_DEBUG_SEVERITY_LOW", desc: { en: "Minor issues.", pt: "Problemas menores." } },
          { name: "GL_DEBUG_SEVERITY_NOTIFICATION", desc: { en: "Informational noise.", pt: "Ruído informativo." } },
        ],
      },
      { name: "count", type: "GLsizei", desc: { en: "Number of specific message IDs in ids (0 = all).", pt: "Número de IDs específicos em ids (0 = todos)." } },
      { name: "ids", type: "const GLuint *", desc: { en: "Specific message IDs, or nullptr.", pt: "IDs específicos de mensagem, ou nullptr." } },
      { name: "enabled", type: "GLboolean", desc: { en: "GL_TRUE to enable matching messages, GL_FALSE to mute them.", pt: "GL_TRUE para ativar as mensagens que casam, GL_FALSE para silenciá-las." } },
    ],
    example: `glDebugMessageControl(GL_DONT_CARE, GL_DONT_CARE, GL_DEBUG_SEVERITY_NOTIFICATION,
                      0, nullptr, GL_FALSE);`,
    related: ["glDebugMessageCallback"],
    khronos: `${KHR}glDebugMessageControl.xhtml`,
  },
  {
    name: "glObjectLabel",
    category: "debug",
    since: "GL 4.3",
    signature: "void glObjectLabel(GLenum identifier, GLuint name, GLsizei length, const char *label);",
    summary: {
      en: "Gives an OpenGL object a human-readable name for debug messages and tools.",
      pt: "Dá a um objeto OpenGL um nome legível para mensagens de debug e ferramentas.",
    },
    description: {
      en: "Messages and tools like RenderDoc will say \"texture 'Brick albedo'\" instead of \"texture 17\". It costs nothing at runtime, so label everything you create.",
      pt: "As mensagens e ferramentas como o RenderDoc vão dizer \"texture 'Brick albedo'\" em vez de \"texture 17\". Não custa nada em tempo de execução, então dê nome a tudo que você criar.",
    },
    params: [
      { name: "identifier", type: "GLenum", desc: { en: "Object type: GL_BUFFER, GL_TEXTURE, GL_PROGRAM, GL_SHADER, GL_VERTEX_ARRAY, GL_FRAMEBUFFER…", pt: "Tipo do objeto: GL_BUFFER, GL_TEXTURE, GL_PROGRAM, GL_SHADER, GL_VERTEX_ARRAY, GL_FRAMEBUFFER…" } },
      { name: "name", type: "GLuint", desc: { en: "The object's ID.", pt: "O ID do objeto." } },
      { name: "length", type: "GLsizei", desc: { en: "Label length, or -1 if null-terminated.", pt: "Tamanho do nome, ou -1 se terminado em nulo." } },
      { name: "label", type: "const char *", desc: { en: "The name.", pt: "O nome." } },
    ],
    notes: [
      { en: "With the old glGen* API the object must have been bound once before it can be labeled.", pt: "Com a API antiga glGen* o objeto precisa ter sido ligado uma vez antes de receber um nome." },
    ],
    example: `glObjectLabel(GL_TEXTURE, albedo, -1, "Brick albedo");
glObjectLabel(GL_BUFFER, vbo, -1, "Cube VBO");`,
    related: ["glPushDebugGroup", "glDebugMessageCallback"],
    khronos: `${KHR}glObjectLabel.xhtml`,
  },
  {
    name: "glPushDebugGroup",
    category: "debug",
    since: "GL 4.3",
    signature: "void glPushDebugGroup(GLenum source, GLuint id, GLsizei length, const char *message);",
    summary: {
      en: "Opens a named section of commands, shown as a collapsible group in RenderDoc and similar tools.",
      pt: "Abre uma seção nomeada de comandos, exibida como grupo recolhível no RenderDoc e ferramentas parecidas.",
    },
    description: {
      en: "Wrap each pass of your frame (\"Shadow pass\", \"G-buffer\", \"Bloom\") in a push/pop pair. When you capture a frame, the hundreds of calls become a tidy tree.",
      pt: "Envolva cada passada do seu frame (\"Shadow pass\", \"G-buffer\", \"Bloom\") em um par push/pop. Quando você capturar um frame, as centenas de chamadas viram uma árvore organizada.",
    },
    params: [
      { name: "source", type: "GLenum", desc: { en: "Use GL_DEBUG_SOURCE_APPLICATION.", pt: "Use GL_DEBUG_SOURCE_APPLICATION." } },
      { name: "id", type: "GLuint", desc: { en: "Any number of your choice.", pt: "Qualquer número de sua escolha." } },
      { name: "length", type: "GLsizei", desc: { en: "Message length, or -1 if null-terminated.", pt: "Tamanho da mensagem, ou -1 se terminada em nulo." } },
      { name: "message", type: "const char *", desc: { en: "Group name.", pt: "Nome do grupo." } },
    ],
    notes: [
      { en: "Every push needs a matching glPopDebugGroup — a small RAII struct makes that automatic.", pt: "Todo push precisa de um glPopDebugGroup correspondente — uma pequena struct RAII torna isso automático." },
    ],
    example: `glPushDebugGroup(GL_DEBUG_SOURCE_APPLICATION, 0, -1, "Shadow pass");
renderShadowMap();
glPopDebugGroup();`,
    related: ["glPopDebugGroup", "glObjectLabel"],
    khronos: `${KHR}glPushDebugGroup.xhtml`,
  },
  {
    name: "glPopDebugGroup",
    category: "debug",
    since: "GL 4.3",
    signature: "void glPopDebugGroup(void);",
    summary: {
      en: "Closes the section opened by the last glPushDebugGroup.",
      pt: "Fecha a seção aberta pelo último glPushDebugGroup.",
    },
    params: [],
    errors: [
      { code: "GL_STACK_UNDERFLOW", when: { en: "Called without a matching push.", pt: "Chamada sem um push correspondente." } },
    ],
    example: `struct GlDebugScope {
    explicit GlDebugScope(const char* name) {
        glPushDebugGroup(GL_DEBUG_SOURCE_APPLICATION, 0, -1, name);
    }
    ~GlDebugScope() { glPopDebugGroup(); }
};`,
    related: ["glPushDebugGroup"],
    khronos: `${KHR}glPopDebugGroup.xhtml`,
  },
];
