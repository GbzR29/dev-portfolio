// src/lib/reference/opengl/shaders.ts
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

export const shaderEntries: RefEntry[] = [
  {
    name: "glCreateShader",
    category: "shaders",
    since: "GL 2.0",
    signature: "GLuint glCreateShader(GLenum shaderType);",
    summary: {
      en: "Creates an empty shader object of a given stage.",
      pt: "Cria um shader object vazio de um estágio específico.",
    },
    description: {
      en: "A shader object holds the source and compiled code of ONE stage (vertex, fragment…). The workflow is always: create → set source → compile → check errors → attach to a program → link.\n\nUnlike buffers, shaders are created directly with an ID return value, no glGen step.",
      pt: "Um shader object guarda o código-fonte e o código compilado de UM estágio (vertex, fragment…). O fluxo é sempre: criar → definir fonte → compilar → checar erros → anexar a um programa → linkar.\n\nDiferente dos buffers, shaders são criados direto com o ID como retorno, sem passo glGen.",
    },
    params: [
      {
        name: "shaderType", type: "GLenum",
        desc: { en: "Which pipeline stage this shader is for.", pt: "Para qual estágio do pipeline é este shader." },
        values: [
          { name: "GL_VERTEX_SHADER", desc: { en: "Runs once per vertex; outputs gl_Position.", pt: "Roda uma vez por vértice; escreve gl_Position." } },
          { name: "GL_FRAGMENT_SHADER", desc: { en: "Runs once per fragment (pixel candidate); outputs the color.", pt: "Roda uma vez por fragmento (candidato a pixel); escreve a cor." } },
          { name: "GL_GEOMETRY_SHADER", desc: { en: "Optional: can emit or discard whole primitives.", pt: "Opcional: pode emitir ou descartar primitivas inteiras." } },
          { name: "GL_TESS_CONTROL_SHADER / GL_TESS_EVALUATION_SHADER", desc: { en: "Optional tessellation stages (GL 4.0).", pt: "Estágios opcionais de tesselação (GL 4.0)." } },
          { name: "GL_COMPUTE_SHADER", desc: { en: "General GPU computation outside the graphics pipeline (GL 4.3).", pt: "Computação geral na GPU fora do pipeline gráfico (GL 4.3)." } },
        ],
      },
    ],
    returns: {
      en: "The new shader ID, or 0 if creation failed.",
      pt: "O ID do novo shader, ou 0 se a criação falhou.",
    },
    errors: [{ code: "GL_INVALID_ENUM", when: { en: "shaderType is not accepted.", pt: "shaderType não é aceito." } }],
    example: `GLuint vs = glCreateShader(GL_VERTEX_SHADER);
glShaderSource(vs, 1, &vertexSrc, nullptr);
glCompileShader(vs);`,
    related: ["glShaderSource", "glCompileShader", "glDeleteShader", "glCreateProgram"],
    khronos: `${KHR}glCreateShader.xhtml`,
  },
  {
    name: "glShaderSource",
    category: "shaders",
    since: "GL 2.0",
    signature: "void glShaderSource(GLuint shader, GLsizei count,\n                    const GLchar **string, const GLint *length);",
    summary: {
      en: "Gives a shader object its GLSL source code.",
      pt: "Entrega o código-fonte GLSL para um shader object.",
    },
    description: {
      en: "Copies the source text into the shader. Nothing is compiled yet. The source can be passed as several strings which are concatenated in order — handy to prepend a #version line or #define flags to a shared file.",
      pt: "Copia o texto do código para o shader. Nada é compilado ainda. O código pode ser passado como várias strings concatenadas em ordem — útil para colocar uma linha #version ou flags #define antes de um arquivo compartilhado.",
    },
    params: [
      { name: "shader", type: "GLuint", desc: { en: "Shader created with glCreateShader.", pt: "Shader criado com glCreateShader." } },
      { name: "count", type: "GLsizei", desc: { en: "Number of strings in the array.", pt: "Número de strings no array." } },
      { name: "string", type: "const GLchar **", desc: { en: "Array of pointers to source strings. For one string pass &src.", pt: "Array de ponteiros para as strings. Para uma string passe &src." } },
      { name: "length", type: "const GLint *", desc: { en: "Length of each string, or nullptr if they are null-terminated.", pt: "Tamanho de cada string, ou nullptr se forem terminadas em nulo." } },
    ],
    notes: [
      { en: "Do not pass a temporary: std::string(...).c_str() dies before the call returns. Keep the std::string alive in a variable.", pt: "Não passe um temporário: std::string(...).c_str() morre antes da chamada terminar. Mantenha a std::string viva em uma variável." },
    ],
    errors: [{ code: "GL_INVALID_VALUE", when: { en: "count is negative or shader is not a valid ID.", pt: "count é negativo ou shader não é um ID válido." } }],
    example: `std::string code = readFile("shader.vert");
const char* src = code.c_str();
glShaderSource(vs, 1, &src, nullptr);`,
    related: ["glCreateShader", "glCompileShader"],
    khronos: `${KHR}glShaderSource.xhtml`,
  },
  {
    name: "glCompileShader",
    category: "shaders",
    since: "GL 2.0",
    signature: "void glCompileShader(GLuint shader);",
    summary: {
      en: "Compiles the GLSL source stored in a shader object.",
      pt: "Compila o código GLSL guardado em um shader object.",
    },
    description: {
      en: "The driver's GLSL compiler turns your source into GPU code. The call itself never reports failure — a syntax error just leaves the shader in a failed state. You must ask with glGetShaderiv(GL_COMPILE_STATUS) and read the message with glGetShaderInfoLog.\n\nAlways check. Skipping it is why so many first triangles are silently black.",
      pt: "O compilador GLSL do driver transforma o código em instruções da GPU. A chamada em si nunca avisa falha — um erro de sintaxe só deixa o shader em estado de falha. Você precisa perguntar com glGetShaderiv(GL_COMPILE_STATUS) e ler a mensagem com glGetShaderInfoLog.\n\nSempre verifique. Pular isso é o motivo de tantos primeiros triângulos ficarem pretos sem explicação.",
    },
    params: [
      { name: "shader", type: "GLuint", desc: { en: "The shader to compile.", pt: "O shader a compilar." } },
    ],
    example: `glCompileShader(vs);
GLint ok = GL_FALSE;
glGetShaderiv(vs, GL_COMPILE_STATUS, &ok);
if (!ok) {
    char log[1024];
    glGetShaderInfoLog(vs, sizeof(log), nullptr, log);
    std::fprintf(stderr, "Vertex shader error:\\n%s\\n", log);
}`,
    related: ["glGetShaderiv", "glGetShaderInfoLog", "glShaderSource"],
    khronos: `${KHR}glCompileShader.xhtml`,
  },
  {
    name: "glGetShaderiv",
    category: "shaders",
    since: "GL 2.0",
    signature: "void glGetShaderiv(GLuint shader, GLenum pname, GLint *params);",
    summary: {
      en: "Queries a property of a shader — mainly whether it compiled.",
      pt: "Consulta uma propriedade de um shader — principalmente se ele compilou.",
    },
    params: [
      { name: "shader", type: "GLuint", desc: { en: "Shader to query.", pt: "Shader a consultar." } },
      {
        name: "pname", type: "GLenum",
        desc: { en: "Which property.", pt: "Qual propriedade." },
        values: [
          { name: "GL_COMPILE_STATUS", desc: { en: "GL_TRUE if the last compile succeeded.", pt: "GL_TRUE se a última compilação deu certo." } },
          { name: "GL_INFO_LOG_LENGTH", desc: { en: "Size of the compile log, including the null terminator.", pt: "Tamanho do log de compilação, incluindo o terminador nulo." } },
          { name: "GL_SHADER_TYPE", desc: { en: "The stage given to glCreateShader.", pt: "O estágio passado para glCreateShader." } },
          { name: "GL_DELETE_STATUS", desc: { en: "GL_TRUE if flagged for deletion.", pt: "GL_TRUE se marcado para deleção." } },
        ],
      },
      { name: "params", type: "GLint *", desc: { en: "Where the result is written.", pt: "Onde o resultado é escrito." } },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "shader is a program ID, not a shader.", pt: "shader é um ID de programa, não de shader." } },
    ],
    example: `GLint len = 0;
glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &len);
std::string log(len, '\\0');
glGetShaderInfoLog(shader, len, nullptr, log.data());`,
    related: ["glGetShaderInfoLog", "glCompileShader", "glGetProgramiv"],
    khronos: `${KHR}glGetShader.xhtml`,
  },
  {
    name: "glGetShaderInfoLog",
    category: "shaders",
    since: "GL 2.0",
    signature: "void glGetShaderInfoLog(GLuint shader, GLsizei maxLength,\n                        GLsizei *length, GLchar *infoLog);",
    summary: {
      en: "Reads the compiler's error and warning messages for a shader.",
      pt: "Lê as mensagens de erro e aviso do compilador para um shader.",
    },
    description: {
      en: "When compilation fails, this is where the explanation is — with line numbers, like \"0:12: 'vec' : undeclared identifier\". The format varies between vendors, but the line number is almost always there.",
      pt: "Quando a compilação falha, é aqui que está a explicação — com número de linha, como \"0:12: 'vec' : undeclared identifier\". O formato varia entre fabricantes, mas o número da linha quase sempre aparece.",
    },
    params: [
      { name: "shader", type: "GLuint", desc: { en: "Shader whose log to read.", pt: "Shader cujo log será lido." } },
      { name: "maxLength", type: "GLsizei", desc: { en: "Size of your infoLog buffer.", pt: "Tamanho do seu buffer infoLog." } },
      { name: "length", type: "GLsizei *", desc: { en: "Receives the number of characters written (optional, may be nullptr).", pt: "Recebe o número de caracteres escritos (opcional, pode ser nullptr)." } },
      { name: "infoLog", type: "GLchar *", desc: { en: "Buffer that receives the text.", pt: "Buffer que recebe o texto." } },
    ],
    example: `char log[1024];
glGetShaderInfoLog(shader, sizeof(log), nullptr, log);
std::fprintf(stderr, "%s\\n", log);`,
    related: ["glGetShaderiv", "glGetProgramInfoLog"],
    khronos: `${KHR}glGetShaderInfoLog.xhtml`,
  },
  {
    name: "glDeleteShader",
    category: "shaders",
    since: "GL 2.0",
    signature: "void glDeleteShader(GLuint shader);",
    summary: {
      en: "Deletes a shader object (once linked, the program no longer needs it).",
      pt: "Deleta um shader object (depois do link, o programa não precisa mais dele).",
    },
    description: {
      en: "After a successful glLinkProgram, the compiled code lives inside the program. The individual shader objects can be deleted right away to free memory. If a shader is still attached to a program, it is only flagged and actually deleted when detached.",
      pt: "Depois de um glLinkProgram bem-sucedido, o código compilado passa a viver dentro do programa. Os shader objects individuais podem ser deletados na hora para liberar memória. Se um shader ainda estiver anexado a um programa, ele só é marcado e é deletado de fato quando for desanexado.",
    },
    params: [
      { name: "shader", type: "GLuint", desc: { en: "Shader to delete. 0 is ignored.", pt: "Shader a deletar. 0 é ignorado." } },
    ],
    example: `glLinkProgram(program);
glDeleteShader(vs);
glDeleteShader(fs);`,
    related: ["glCreateShader", "glLinkProgram", "glDeleteProgram"],
    khronos: `${KHR}glDeleteShader.xhtml`,
  },
  {
    name: "glCreateProgram",
    category: "shaders",
    since: "GL 2.0",
    signature: "GLuint glCreateProgram(void);",
    summary: {
      en: "Creates an empty program object, which will link shaders into one pipeline.",
      pt: "Cria um program object vazio, que vai linkar os shaders em um pipeline só.",
    },
    description: {
      en: "A program is the complete set of shaders used together for drawing: at least a vertex and a fragment shader. You attach compiled shaders to it, link it, and then select it with glUseProgram before drawing.",
      pt: "Um programa é o conjunto completo de shaders usados juntos para desenhar: no mínimo um vertex e um fragment shader. Você anexa shaders compilados, faz o link e depois seleciona com glUseProgram antes de desenhar.",
    },
    params: [],
    returns: { en: "The new program ID, or 0 on failure.", pt: "O ID do novo programa, ou 0 em caso de falha." },
    example: `GLuint program = glCreateProgram();
glAttachShader(program, vs);
glAttachShader(program, fs);
glLinkProgram(program);`,
    related: ["glAttachShader", "glLinkProgram", "glUseProgram", "glDeleteProgram"],
    khronos: `${KHR}glCreateProgram.xhtml`,
  },
  {
    name: "glAttachShader",
    category: "shaders",
    since: "GL 2.0",
    signature: "void glAttachShader(GLuint program, GLuint shader);",
    summary: {
      en: "Adds a compiled shader to a program before linking.",
      pt: "Adiciona um shader compilado a um programa antes do link.",
    },
    params: [
      { name: "program", type: "GLuint", desc: { en: "Target program.", pt: "Programa de destino." } },
      { name: "shader", type: "GLuint", desc: { en: "Shader to attach. Only one shader per stage is normally attached.", pt: "Shader a anexar. Normalmente só um shader por estágio." } },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "shader is already attached to program.", pt: "shader já está anexado ao programa." } },
    ],
    example: `glAttachShader(program, vs);
glAttachShader(program, fs);`,
    related: ["glCreateProgram", "glLinkProgram"],
    khronos: `${KHR}glAttachShader.xhtml`,
  },
  {
    name: "glLinkProgram",
    category: "shaders",
    since: "GL 2.0",
    signature: "void glLinkProgram(GLuint program);",
    summary: {
      en: "Links the attached shaders into an executable program.",
      pt: "Linka os shaders anexados em um programa executável.",
    },
    description: {
      en: "Linking checks that the stages fit together: every `in` of the fragment shader must match an `out` of the vertex shader with the same name and type, uniforms with the same name must have the same type, and so on.\n\nLike compiling, it never fails loudly. Check glGetProgramiv(GL_LINK_STATUS) and read glGetProgramInfoLog.",
      pt: "O link verifica se os estágios se encaixam: cada `in` do fragment shader precisa corresponder a um `out` do vertex shader com o mesmo nome e tipo, uniforms com o mesmo nome precisam ter o mesmo tipo, e assim por diante.\n\nComo na compilação, ele nunca falha de forma visível. Verifique glGetProgramiv(GL_LINK_STATUS) e leia glGetProgramInfoLog.",
    },
    params: [
      { name: "program", type: "GLuint", desc: { en: "Program to link.", pt: "Programa a linkar." } },
    ],
    example: `glLinkProgram(program);
GLint ok = GL_FALSE;
glGetProgramiv(program, GL_LINK_STATUS, &ok);
if (!ok) {
    char log[1024];
    glGetProgramInfoLog(program, sizeof(log), nullptr, log);
    std::fprintf(stderr, "Link error:\\n%s\\n", log);
}`,
    related: ["glGetProgramiv", "glGetProgramInfoLog", "glUseProgram"],
    khronos: `${KHR}glLinkProgram.xhtml`,
  },
  {
    name: "glGetProgramiv",
    category: "shaders",
    since: "GL 2.0",
    signature: "void glGetProgramiv(GLuint program, GLenum pname, GLint *params);",
    summary: {
      en: "Queries a property of a program — mainly whether it linked.",
      pt: "Consulta uma propriedade de um programa — principalmente se ele linkou.",
    },
    params: [
      { name: "program", type: "GLuint", desc: { en: "Program to query.", pt: "Programa a consultar." } },
      {
        name: "pname", type: "GLenum",
        desc: { en: "Which property.", pt: "Qual propriedade." },
        values: [
          { name: "GL_LINK_STATUS", desc: { en: "GL_TRUE if the last link succeeded.", pt: "GL_TRUE se o último link deu certo." } },
          { name: "GL_INFO_LOG_LENGTH", desc: { en: "Size of the link log.", pt: "Tamanho do log de link." } },
          { name: "GL_ACTIVE_UNIFORMS", desc: { en: "Number of uniforms the compiler kept.", pt: "Número de uniforms que o compilador manteve." } },
          { name: "GL_VALIDATE_STATUS", desc: { en: "Result of glValidateProgram.", pt: "Resultado de glValidateProgram." } },
          { name: "GL_COMPUTE_WORK_GROUP_SIZE", desc: { en: "local_size of a compute program (3 ints).", pt: "local_size de um programa compute (3 ints)." } },
        ],
      },
      { name: "params", type: "GLint *", desc: { en: "Where the result is written.", pt: "Onde o resultado é escrito." } },
    ],
    example: `GLint ok;
glGetProgramiv(program, GL_LINK_STATUS, &ok);`,
    related: ["glLinkProgram", "glGetProgramInfoLog", "glGetShaderiv"],
    khronos: `${KHR}glGetProgram.xhtml`,
  },
  {
    name: "glGetProgramInfoLog",
    category: "shaders",
    since: "GL 2.0",
    signature: "void glGetProgramInfoLog(GLuint program, GLsizei maxLength,\n                         GLsizei *length, GLchar *infoLog);",
    summary: {
      en: "Reads the linker's error and warning messages for a program.",
      pt: "Lê as mensagens de erro e aviso do linker para um programa.",
    },
    description: {
      en: "Typical link errors: a varying declared `out` in the vertex shader but misspelled as `in` in the fragment shader, or a missing main() in one stage.",
      pt: "Erros de link típicos: uma variável declarada `out` no vertex shader mas escrita diferente como `in` no fragment shader, ou falta de main() em algum estágio.",
    },
    params: [
      { name: "program", type: "GLuint", desc: { en: "Program whose log to read.", pt: "Programa cujo log será lido." } },
      { name: "maxLength", type: "GLsizei", desc: { en: "Size of your buffer.", pt: "Tamanho do seu buffer." } },
      { name: "length", type: "GLsizei *", desc: { en: "Receives the characters written (optional).", pt: "Recebe os caracteres escritos (opcional)." } },
      { name: "infoLog", type: "GLchar *", desc: { en: "Buffer that receives the text.", pt: "Buffer que recebe o texto." } },
    ],
    example: `char log[1024];
glGetProgramInfoLog(program, sizeof(log), nullptr, log);`,
    related: ["glGetProgramiv", "glLinkProgram", "glGetShaderInfoLog"],
    khronos: `${KHR}glGetProgramInfoLog.xhtml`,
  },
  {
    name: "glUseProgram",
    category: "shaders",
    since: "GL 2.0",
    signature: "void glUseProgram(GLuint program);",
    summary: {
      en: "Selects the shader program used by the next draw calls.",
      pt: "Seleciona o shader program usado pelos próximos draws.",
    },
    description: {
      en: "From now on, every draw runs this program's shaders. It also decides which program glUniform* calls write to — uniforms are set on the CURRENT program.",
      pt: "A partir daqui, todo draw roda os shaders deste programa. Ele também define em qual programa as chamadas glUniform* escrevem — uniforms são definidos no programa ATUAL.",
    },
    params: [
      { name: "program", type: "GLuint", desc: { en: "A successfully linked program, or 0 for none.", pt: "Um programa linkado com sucesso, ou 0 para nenhum." } },
    ],
    notes: [
      { en: "Calling glUniform* before glUseProgram sets the uniform on the wrong program (or fails). With OpenGL 4.1+ glProgramUniform* avoids this.", pt: "Chamar glUniform* antes de glUseProgram define o uniform no programa errado (ou falha). No OpenGL 4.1+ glProgramUniform* evita isso." },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "program is not 0 and failed to link.", pt: "program não é 0 e falhou no link." } },
    ],
    example: `glUseProgram(program);
glUniformMatrix4fv(glGetUniformLocation(program, "model"), 1, GL_FALSE, &model[0][0]);
glBindVertexArray(vao);
glDrawArrays(GL_TRIANGLES, 0, 36);`,
    related: ["glLinkProgram", "glGetUniformLocation", "glDrawArrays"],
    khronos: `${KHR}glUseProgram.xhtml`,
  },
  {
    name: "glDeleteProgram",
    category: "shaders",
    since: "GL 2.0",
    signature: "void glDeleteProgram(GLuint program);",
    summary: {
      en: "Deletes a program object.",
      pt: "Deleta um program object.",
    },
    description: {
      en: "Frees the program. If it is currently in use it is only flagged and deleted when no longer in use. Put this in your Shader class destructor.",
      pt: "Libera o programa. Se estiver em uso, ele só é marcado e deletado quando deixar de ser usado. Coloque isso no destrutor da sua classe Shader.",
    },
    params: [
      { name: "program", type: "GLuint", desc: { en: "Program to delete. 0 is ignored.", pt: "Programa a deletar. 0 é ignorado." } },
    ],
    example: `Shader::~Shader() { glDeleteProgram(id); }`,
    related: ["glCreateProgram", "glDeleteShader"],
    khronos: `${KHR}glDeleteProgram.xhtml`,
  },
];
