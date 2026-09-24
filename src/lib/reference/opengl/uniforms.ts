// src/lib/reference/opengl/uniforms.ts
import type { RefEntry, RefParam } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

const LOCATION: RefParam = {
  name: "location", type: "GLint",
  desc: {
    en: "Uniform location from glGetUniformLocation. -1 is silently ignored.",
    pt: "Location do uniform vinda de glGetUniformLocation. -1 é ignorado silenciosamente.",
  },
};

const UNIFORM_ERRORS = [
  { code: "GL_INVALID_OPERATION", when: {
    en: "No program in use, or the function's type/size does not match the uniform declared in GLSL.",
    pt: "Nenhum programa em uso, ou o tipo/tamanho da função não bate com o uniform declarado no GLSL.",
  } },
];

const UNIFORM_NOTE = {
  en: "Uniforms are written to the program currently selected with glUseProgram.",
  pt: "Os uniforms são escritos no programa selecionado no momento com glUseProgram.",
};

export const uniformEntries: RefEntry[] = [
  {
    name: "glGetUniformLocation",
    category: "uniforms",
    since: "GL 2.0",
    signature: "GLint glGetUniformLocation(GLuint program, const GLchar *name);",
    summary: {
      en: "Looks up the location (slot number) of a uniform variable by its GLSL name.",
      pt: "Busca a location (número do slot) de uma variável uniform pelo nome no GLSL.",
    },
    description: {
      en: "Uniforms are values that stay the same for a whole draw call — matrices, colors, time. To set one you need its location, an integer assigned by the linker. This function asks for it by name.\n\nLocations do not change until the program is re-linked, so look them up once and cache them instead of calling this every frame.",
      pt: "Uniforms são valores que ficam iguais durante um draw inteiro — matrizes, cores, tempo. Para definir um você precisa da location dele, um inteiro atribuído pelo linker. Esta função pergunta por ela pelo nome.\n\nAs locations não mudam até o programa ser linkado de novo, então busque uma vez e guarde em cache em vez de chamar todo frame.",
    },
    params: [
      { name: "program", type: "GLuint", desc: { en: "A linked program.", pt: "Um programa linkado." } },
      { name: "name", type: "const GLchar *", desc: { en: "Exact uniform name. Struct members and array elements use GLSL syntax: \"light.color\", \"lights[2].position\".", pt: "Nome exato do uniform. Membros de struct e elementos de array usam sintaxe GLSL: \"light.color\", \"lights[2].position\"." } },
    ],
    returns: {
      en: "The location, or -1 if no ACTIVE uniform has that name.",
      pt: "A location, ou -1 se nenhum uniform ATIVO tiver esse nome.",
    },
    notes: [
      { en: "-1 does not always mean a typo: the compiler removes uniforms that do not affect the output. An unused uniform returns -1 too.", pt: "-1 nem sempre é erro de digitação: o compilador remove uniforms que não afetam o resultado. Um uniform não usado também retorna -1." },
      { en: "With GLSL 4.30+ you can fix locations in the shader with layout(location = N) and skip the lookup.", pt: "Com GLSL 4.30+ você pode fixar locations no shader com layout(location = N) e pular a busca." },
    ],
    errors: [{ code: "GL_INVALID_OPERATION", when: { en: "program has not been linked successfully.", pt: "program não foi linkado com sucesso." } }],
    example: `// once, after linking
GLint uModel = glGetUniformLocation(program, "model");

// every frame
glUseProgram(program);
glUniformMatrix4fv(uModel, 1, GL_FALSE, glm::value_ptr(model));`,
    related: ["glUniform1i", "glUniform1f", "glUniformMatrix4fv", "glUseProgram"],
    khronos: `${KHR}glGetUniformLocation.xhtml`,
  },
  {
    name: "glUniform1i",
    category: "uniforms",
    since: "GL 2.0",
    signature: "void glUniform1i(GLint location, GLint v0);",
    summary: {
      en: "Sets an int, bool or sampler uniform — e.g. tells a sampler which texture unit to read.",
      pt: "Define um uniform int, bool ou sampler — ex.: diz a um sampler qual texture unit ler.",
    },
    description: {
      en: "The suffix of glUniform* encodes the type: 1i = one int. Besides plain ints and bools, this is how samplers are connected: a sampler2D uniform holds the NUMBER of the texture unit it reads from, so glUniform1i(loc, 2) means \"read from GL_TEXTURE2\".",
      pt: "O sufixo de glUniform* indica o tipo: 1i = um int. Além de ints e bools, é assim que samplers são conectados: um uniform sampler2D guarda o NÚMERO da texture unit que ele lê, então glUniform1i(loc, 2) significa \"leia de GL_TEXTURE2\".",
    },
    params: [
      LOCATION,
      { name: "v0", type: "GLint", desc: { en: "The value. For samplers: the texture unit index (0, 1, 2…), NOT the texture ID.", pt: "O valor. Para samplers: o índice da texture unit (0, 1, 2…), NÃO o ID da textura." } },
    ],
    notes: [
      UNIFORM_NOTE,
      { en: "Passing the texture ID instead of the unit number is a very common bug.", pt: "Passar o ID da textura em vez do número da unit é um bug muito comum." },
    ],
    errors: UNIFORM_ERRORS,
    example: `glUseProgram(program);
glUniform1i(glGetUniformLocation(program, "diffuseMap"),  0); // GL_TEXTURE0
glUniform1i(glGetUniformLocation(program, "specularMap"), 1); // GL_TEXTURE1`,
    related: ["glActiveTexture", "glUniform1f", "glGetUniformLocation"],
    khronos: `${KHR}glUniform.xhtml`,
  },
  {
    name: "glUniform1f",
    category: "uniforms",
    since: "GL 2.0",
    signature: "void glUniform1f(GLint location, GLfloat v0);",
    summary: {
      en: "Sets a float uniform.",
      pt: "Define um uniform float.",
    },
    description: {
      en: "Sets one float — typical uses are time for animations, a shininess exponent, or a mix factor.",
      pt: "Define um float — usos típicos são o tempo para animações, um expoente de brilho ou um fator de mistura.",
    },
    params: [
      LOCATION,
      { name: "v0", type: "GLfloat", desc: { en: "The value.", pt: "O valor." } },
    ],
    notes: [UNIFORM_NOTE],
    errors: UNIFORM_ERRORS,
    example: `glUniform1f(uTime, (float)glfwGetTime());`,
    related: ["glUniform1i", "glUniform3fv", "glGetUniformLocation"],
    khronos: `${KHR}glUniform.xhtml`,
  },
  {
    name: "glUniform3fv",
    category: "uniforms",
    since: "GL 2.0",
    signature: "void glUniform3fv(GLint location, GLsizei count, const GLfloat *value);",
    summary: {
      en: "Sets a vec3 uniform (or an array of them) from a pointer.",
      pt: "Define um uniform vec3 (ou um array deles) a partir de um ponteiro.",
    },
    description: {
      en: "The v suffix means \"vector\": values come from a pointer instead of separate arguments. With GLM you pass glm::value_ptr(v) or &v[0]. count lets you upload a whole vec3 array in one call.",
      pt: "O sufixo v significa \"vetor\": os valores vêm de um ponteiro em vez de argumentos separados. Com GLM você passa glm::value_ptr(v) ou &v[0]. count permite enviar um array inteiro de vec3 em uma chamada.",
    },
    params: [
      LOCATION,
      { name: "count", type: "GLsizei", desc: { en: "How many vec3 to set: 1 for a single vec3, N for an array.", pt: "Quantos vec3 definir: 1 para um vec3, N para um array." } },
      { name: "value", type: "const GLfloat *", desc: { en: "Pointer to 3 × count floats.", pt: "Ponteiro para 3 × count floats." } },
    ],
    notes: [UNIFORM_NOTE],
    errors: UNIFORM_ERRORS,
    example: `glm::vec3 lightPos(1.2f, 1.0f, 2.0f);
glUniform3fv(uLightPos, 1, glm::value_ptr(lightPos));`,
    related: ["glUniform4f", "glUniform1f", "glUniformMatrix4fv"],
    khronos: `${KHR}glUniform.xhtml`,
  },
  {
    name: "glUniform4f",
    category: "uniforms",
    since: "GL 2.0",
    signature: "void glUniform4f(GLint location, GLfloat v0, GLfloat v1, GLfloat v2, GLfloat v3);",
    summary: {
      en: "Sets a vec4 uniform from four separate floats.",
      pt: "Define um uniform vec4 a partir de quatro floats separados.",
    },
    params: [
      LOCATION,
      { name: "v0", type: "GLfloat", desc: { en: "x / r component.", pt: "Componente x / r." } },
      { name: "v1", type: "GLfloat", desc: { en: "y / g component.", pt: "Componente y / g." } },
      { name: "v2", type: "GLfloat", desc: { en: "z / b component.", pt: "Componente z / b." } },
      { name: "v3", type: "GLfloat", desc: { en: "w / a component.", pt: "Componente w / a." } },
    ],
    notes: [UNIFORM_NOTE],
    errors: UNIFORM_ERRORS,
    example: `float green = (std::sin(glfwGetTime()) / 2.0f) + 0.5f;
glUniform4f(uColor, 0.0f, green, 0.0f, 1.0f);`,
    related: ["glUniform3fv", "glGetUniformLocation"],
    khronos: `${KHR}glUniform.xhtml`,
  },
  {
    name: "glUniformMatrix3fv",
    category: "uniforms",
    since: "GL 2.0",
    signature: "void glUniformMatrix3fv(GLint location, GLsizei count,\n                        GLboolean transpose, const GLfloat *value);",
    summary: {
      en: "Sets a mat3 uniform — most often the normal matrix.",
      pt: "Define um uniform mat3 — na maioria das vezes a normal matrix.",
    },
    description: {
      en: "Normals must not be moved by translation and must stay perpendicular after non-uniform scaling. The fix is the normal matrix, transpose(inverse(mat3(model))), usually computed on the CPU and uploaded with this call.",
      pt: "Normais não podem ser afetadas por translação e precisam continuar perpendiculares depois de uma escala não uniforme. A solução é a normal matrix, transpose(inverse(mat3(model))), normalmente calculada na CPU e enviada com esta chamada.",
    },
    params: [
      LOCATION,
      { name: "count", type: "GLsizei", desc: { en: "Number of matrices (1 unless the uniform is an array).", pt: "Número de matrizes (1 a menos que o uniform seja um array)." } },
      { name: "transpose", type: "GLboolean", desc: { en: "GL_FALSE for GLM/column-major data.", pt: "GL_FALSE para dados GLM/column-major." } },
      { name: "value", type: "const GLfloat *", desc: { en: "Pointer to 9 × count floats.", pt: "Ponteiro para 9 × count floats." } },
    ],
    notes: [UNIFORM_NOTE],
    errors: UNIFORM_ERRORS,
    example: `glm::mat3 normalMatrix = glm::transpose(glm::inverse(glm::mat3(model)));
glUniformMatrix3fv(uNormalMatrix, 1, GL_FALSE, glm::value_ptr(normalMatrix));`,
    related: ["glUniformMatrix4fv"],
    khronos: `${KHR}glUniform.xhtml`,
  },
  {
    name: "glUniformMatrix4fv",
    category: "uniforms",
    since: "GL 2.0",
    signature: "void glUniformMatrix4fv(GLint location, GLsizei count,\n                        GLboolean transpose, const GLfloat *value);",
    summary: {
      en: "Sets a mat4 uniform — how model, view and projection matrices reach the shader.",
      pt: "Define um uniform mat4 — é assim que as matrizes model, view e projection chegam ao shader.",
    },
    description: {
      en: "Uploads one or more 4×4 float matrices. OpenGL and GLM both store matrices column by column (column-major), so with GLM transpose is always GL_FALSE and you pass glm::value_ptr(m).",
      pt: "Envia uma ou mais matrizes 4×4 de float. O OpenGL e o GLM guardam matrizes coluna por coluna (column-major), então com GLM transpose é sempre GL_FALSE e você passa glm::value_ptr(m).",
    },
    params: [
      LOCATION,
      { name: "count", type: "GLsizei", desc: { en: "Number of matrices. 1 for a single mat4; N for mat4 bones[N].", pt: "Número de matrizes. 1 para um mat4; N para mat4 bones[N]." } },
      { name: "transpose", type: "GLboolean", desc: { en: "GL_TRUE if your data is row-major. With GLM: GL_FALSE.", pt: "GL_TRUE se seus dados são row-major. Com GLM: GL_FALSE." } },
      { name: "value", type: "const GLfloat *", desc: { en: "Pointer to 16 × count floats.", pt: "Ponteiro para 16 × count floats." } },
    ],
    notes: [
      UNIFORM_NOTE,
      { en: "Sending the same projection and view to many programs? Put them in a uniform buffer instead.", pt: "Enviando a mesma projection e view para vários programas? Coloque-as em um uniform buffer." },
    ],
    errors: UNIFORM_ERRORS,
    example: `glm::mat4 projection = glm::perspective(glm::radians(45.0f), aspect, 0.1f, 100.0f);
glUniformMatrix4fv(uProjection, 1, GL_FALSE, glm::value_ptr(projection));`,
    related: ["glUniformMatrix3fv", "glGetUniformLocation", "glBindBufferBase"],
    khronos: `${KHR}glUniform.xhtml`,
  },
  {
    name: "glGetUniformBlockIndex",
    category: "uniforms",
    since: "GL 3.1",
    signature: "GLuint glGetUniformBlockIndex(GLuint program, const GLchar *uniformBlockName);",
    summary: {
      en: "Finds the index of a named uniform block inside a program.",
      pt: "Encontra o índice de um uniform block pelo nome dentro de um programa.",
    },
    description: {
      en: "A uniform block groups uniforms whose values come from a buffer (a UBO) instead of glUniform* calls. To connect a block to a binding point on older GLSL, you first need its index — that is what this returns. Then glUniformBlockBinding connects index → binding point.",
      pt: "Um uniform block agrupa uniforms cujos valores vêm de um buffer (um UBO) em vez de chamadas glUniform*. Para ligar um bloco a um binding point em GLSL mais antigo, primeiro você precisa do índice dele — é isso que esta função retorna. Depois glUniformBlockBinding conecta índice → binding point.",
    },
    params: [
      { name: "program", type: "GLuint", desc: { en: "Linked program.", pt: "Programa linkado." } },
      { name: "uniformBlockName", type: "const GLchar *", desc: { en: "Block name as declared in GLSL (the name before the braces).", pt: "Nome do bloco como declarado no GLSL (o nome antes das chaves)." } },
    ],
    returns: {
      en: "The block index, or GL_INVALID_INDEX if not found.",
      pt: "O índice do bloco, ou GL_INVALID_INDEX se não for encontrado.",
    },
    notes: [
      { en: "With GLSL 4.20+, layout(std140, binding = N) sets the binding in the shader and both calls become unnecessary.", pt: "Com GLSL 4.20+, layout(std140, binding = N) define o binding no shader e as duas chamadas deixam de ser necessárias." },
    ],
    example: `GLuint idx = glGetUniformBlockIndex(program, "Matrices");
glUniformBlockBinding(program, idx, 0);`,
    related: ["glUniformBlockBinding", "glBindBufferBase"],
    khronos: `${KHR}glGetUniformBlockIndex.xhtml`,
  },
  {
    name: "glUniformBlockBinding",
    category: "uniforms",
    since: "GL 3.1",
    signature: "void glUniformBlockBinding(GLuint program, GLuint uniformBlockIndex,\n                           GLuint uniformBlockBinding);",
    summary: {
      en: "Connects a uniform block of a program to a numbered binding point.",
      pt: "Conecta um uniform block de um programa a um binding point numerado.",
    },
    description: {
      en: "Picture a row of numbered sockets. A buffer is plugged into socket N with glBindBufferBase(GL_UNIFORM_BUFFER, N, ubo). A program's block reads from socket N after glUniformBlockBinding(program, blockIndex, N). Many programs can read the same socket, so one camera UBO serves every shader.",
      pt: "Imagine uma fileira de tomadas numeradas. Um buffer é plugado na tomada N com glBindBufferBase(GL_UNIFORM_BUFFER, N, ubo). O bloco de um programa lê da tomada N depois de glUniformBlockBinding(program, blockIndex, N). Vários programas podem ler a mesma tomada, então um único UBO de câmera atende todos os shaders.",
    },
    params: [
      { name: "program", type: "GLuint", desc: { en: "Linked program.", pt: "Programa linkado." } },
      { name: "uniformBlockIndex", type: "GLuint", desc: { en: "Index from glGetUniformBlockIndex.", pt: "Índice vindo de glGetUniformBlockIndex." } },
      { name: "uniformBlockBinding", type: "GLuint", desc: { en: "Binding point number (socket).", pt: "Número do binding point (tomada)." } },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "Index is not a valid block, or the binding is ≥ GL_MAX_UNIFORM_BUFFER_BINDINGS.", pt: "O índice não é um bloco válido, ou o binding é ≥ GL_MAX_UNIFORM_BUFFER_BINDINGS." } },
    ],
    example: `for (GLuint prog : { shaderRed, shaderGreen, shaderBlue }) {
    GLuint idx = glGetUniformBlockIndex(prog, "Matrices");
    glUniformBlockBinding(prog, idx, 0);
}
glBindBufferBase(GL_UNIFORM_BUFFER, 0, uboMatrices);`,
    related: ["glGetUniformBlockIndex", "glBindBufferBase", "glBindBufferRange"],
    khronos: `${KHR}glUniformBlockBinding.xhtml`,
  },
];
