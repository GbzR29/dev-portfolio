// src/lib/reference/opengl/families.ts
// Family pages: one page per prefix the lessons write with a star (glUniform*,
// glGen*, glBind*…). Each explains the pattern, how to read the rest of the
// name, and lists its members. A family's name is the bare prefix, so the
// lessons' "glUniform*" links here.
import type { RefEntry } from "../types";

export const familyEntries: RefEntry[] = [
  {
    name: "glUniform",
    category: "families",
    signature: "void glUniform{1|2|3|4}{f|i|ui}[v](GLint location, …);\nvoid glUniformMatrix{2|3|4}fv(GLint location, GLsizei count, GLboolean transpose, const GLfloat *value);",
    summary: {
      en: "Set a uniform of the program in use; the end of the name says how many values and of what type.",
      pt: "Definem um uniform do programa em uso; o fim do nome diz quantos valores e de que tipo.",
    },
    description: {
      en: "There is one glUniform function per shape of data, and the name spells the shape: a number (how many components), a letter (their type) and an optional v (passed through a pointer). Pick the one that matches the uniform's declaration in GLSL: float → glUniform1f, vec3 → glUniform3f or glUniform3fv, int and sampler2D → glUniform1i, mat4 → glUniformMatrix4fv.\n\nAll of them write to the program bound with glUseProgram. A mismatch between function and declaration (glUniform1f on an int) is GL_INVALID_OPERATION and the value is not changed, which is a frequent reason for a uniform that \"does nothing\".",
      pt: "Há uma função glUniform para cada forma de dado, e o nome soletra a forma: um número (quantos componentes), uma letra (o tipo deles) e um v opcional (passados por ponteiro). Escolha a que bate com a declaração do uniform no GLSL: float → glUniform1f, vec3 → glUniform3f ou glUniform3fv, int e sampler2D → glUniform1i, mat4 → glUniformMatrix4fv.\n\nTodas escrevem no programa ligado com glUseProgram. Uma diferença entre a função e a declaração (glUniform1f num int) é GL_INVALID_OPERATION e o valor não muda, um motivo frequente de uniform que \"não faz nada\".",
    },
    params: [],
    family: {
      members: ["glUniform1f", "glUniform1i", "glUniform2f", "glUniform3fv", "glUniform4f", "glUniformMatrix3fv", "glUniformMatrix4fv"],
      suffixes: [
        { part: "1 2 3 4", desc: { en: "Number of components: 1 = float/int, 3 = vec3, 4 = vec4.", pt: "Número de componentes: 1 = float/int, 3 = vec3, 4 = vec4." } },
        { part: "f", desc: { en: "float (GLSL float, vec2, vec3, vec4).", pt: "float (GLSL float, vec2, vec3, vec4)." } },
        { part: "i", desc: { en: "int (int, ivec*, bool, and every sampler).", pt: "int (int, ivec*, bool, e todo sampler)." } },
        { part: "ui", desc: { en: "unsigned int (uint, uvec*).", pt: "unsigned int (uint, uvec*)." } },
        { part: "v", desc: { en: "\"vector\": the values come through a pointer, with a count, so arrays can be set in one call.", pt: "\"vetor\": os valores vêm por um ponteiro, com uma contagem, assim arrays são definidos numa chamada." } },
        { part: "Matrix4fv", desc: { en: "A matrix (always by pointer, always float): Matrix2fv, Matrix3fv, Matrix4fv, also Matrix3x4fv and similar.", pt: "Uma matriz (sempre por ponteiro, sempre float): Matrix2fv, Matrix3fv, Matrix4fv, e também Matrix3x4fv e parecidas." } },
      ],
    },
    example: `glUseProgram(prog);
glUniform1f(glGetUniformLocation(prog, "uTime"), t);                  // float
glUniform3f(glGetUniformLocation(prog, "uColor"), 1.0f, 0.5f, 0.2f);  // vec3
glUniform1i(glGetUniformLocation(prog, "uTexture"), 0);               // sampler2D -> unit 0
glUniformMatrix4fv(glGetUniformLocation(prog, "uModel"), 1, GL_FALSE, glm::value_ptr(model));`,
    related: ["glGetUniformLocation", "glUseProgram", "glProgramUniform"],
  },
  {
    name: "glProgramUniform",
    category: "families",
    signature: "void glProgramUniform{1|2|3|4}{f|i|ui}[v](GLuint program, GLint location, …);",
    summary: {
      en: "The glUniform family with the program as first argument: no glUseProgram needed (GL 4.1).",
      pt: "A família glUniform com o programa como primeiro argumento: sem precisar de glUseProgram (GL 4.1).",
    },
    description: {
      en: "Every glUniform* has a glProgramUniform* twin with the same suffixes and one extra first parameter, the program. It sets the value directly in that program, whichever program is in use, the same idea as Direct State Access. Mixing the two families is fine: a uniform's value lives in its program, however it was set.",
      pt: "Todo glUniform* tem um gêmeo glProgramUniform* com os mesmos sufixos e um parâmetro a mais no começo, o programa. Ele define o valor direto naquele programa, qualquer que seja o programa em uso, a mesma ideia do Direct State Access. Misturar as duas famílias não tem problema: o valor de um uniform mora no seu programa, seja qual for o jeito de defini-lo.",
    },
    params: [],
    family: {
      members: ["glProgramUniform1f"],
      suffixes: [
        { part: "1f, 3fv, Matrix4fv…", desc: { en: "Read exactly like glUniform*: count, type, v for pointer.", pt: "Lidos exatamente como em glUniform*: quantidade, tipo, v de ponteiro." } },
      ],
    },
    example: `glProgramUniform1f(prog, glGetUniformLocation(prog, "uTime"), t);
glProgramUniformMatrix4fv(prog, locModel, 1, GL_FALSE, glm::value_ptr(model));`,
    related: ["glUniform", "glProgramUniform1f", "glUseProgram"],
  },
  {
    name: "glGen",
    category: "families",
    signature: "void glGen{Buffers|VertexArrays|Textures|Framebuffers|Renderbuffers|Queries}(GLsizei n, GLuint *ids);",
    summary: {
      en: "Reserve names (GLuint numbers) for new objects; the object itself appears at the first bind.",
      pt: "Reservam nomes (números GLuint) para objetos novos; o objeto em si aparece no primeiro bind.",
    },
    description: {
      en: "OpenGL objects are referred to by names: plain unsigned integers. glGen* hands out n unused ones, and 0 always means \"no object\". A freshly generated name is only reserved: the object is created the first time it is bound (glBindBuffer, glBindTexture…), and only then does it have a type.\n\nThat is why a DSA call on a name that was generated but never bound fails. The glCreate* family (GL 4.5) creates real objects at once and is the modern choice.",
      pt: "Objetos do OpenGL são identificados por nomes: inteiros sem sinal simples. glGen* entrega n nomes livres, e 0 sempre significa \"nenhum objeto\". Um nome recém-gerado só está reservado: o objeto é criado na primeira vez que é ligado (glBindBuffer, glBindTexture…), e só então ele tem um tipo.\n\nPor isso uma chamada DSA num nome gerado mas nunca ligado falha. A família glCreate* (GL 4.5) cria objetos de verdade na hora e é a escolha moderna.",
    },
    params: [],
    family: {
      members: ["glGenBuffers", "glGenVertexArrays", "glGenTextures", "glGenFramebuffers", "glGenRenderbuffers", "glGenQueries"],
      suffixes: [
        { part: "Buffers, Textures…", desc: { en: "The kind of object, always plural: the function can make several at once.", pt: "O tipo de objeto, sempre no plural: a função pode criar vários de uma vez." } },
        { part: "n, ids", desc: { en: "How many names, and the array that receives them (&id for one).", pt: "Quantos nomes, e o array que os recebe (&id para um só)." } },
      ],
    },
    example: `GLuint vbo, vao;
glGenBuffers(1, &vbo);        // name reserved
glGenVertexArrays(1, &vao);
glBindVertexArray(vao);       // VAO created here
glBindBuffer(GL_ARRAY_BUFFER, vbo);   // buffer created here`,
    related: ["glCreate", "glDelete", "glBind"],
  },
  {
    name: "glCreate",
    category: "families",
    signature: "void glCreate{Buffers|VertexArrays|Textures|Framebuffers|Renderbuffers}(GLsizei n, GLuint *ids);\nGLuint glCreateShader(GLenum type);\nGLuint glCreateProgram(void);",
    summary: {
      en: "Create objects that exist immediately, ready for DSA calls; shaders and programs are created this way too.",
      pt: "Criam objetos que já existem na hora, prontos para chamadas DSA; shaders e programas também são criados assim.",
    },
    description: {
      en: "The GL 4.5 versions of glGen* (same parameters) create the real object at once, so it can go straight into glNamedBufferStorage, glTextureStorage2D and the other DSA calls without ever being bound. glCreateTextures also takes the texture type, which glGenTextures could not know.\n\nglCreateShader and glCreateProgram are older and different: they make one object and return its name. They are listed here because the name looks the same.",
      pt: "As versões GL 4.5 de glGen* (mesmos parâmetros) criam o objeto de verdade na hora, assim ele pode ir direto para glNamedBufferStorage, glTextureStorage2D e as outras chamadas DSA sem nunca ser ligado. glCreateTextures também recebe o tipo da textura, que glGenTextures não tinha como saber.\n\nglCreateShader e glCreateProgram são mais antigas e diferentes: criam um objeto e devolvem o nome dele. Estão aqui porque o nome parece igual.",
    },
    params: [],
    family: {
      members: ["glCreateBuffers", "glCreateVertexArrays", "glCreateTextures", "glCreateFramebuffers", "glCreateRenderbuffers", "glCreateShader", "glCreateProgram"],
      suffixes: [
        { part: "Buffers, VertexArrays…", desc: { en: "Plural: n objects into an array, like glGen*.", pt: "Plural: n objetos num array, como glGen*." } },
        { part: "Shader, Program", desc: { en: "Singular: one object, returned as the result.", pt: "Singular: um objeto, devolvido como resultado." } },
      ],
    },
    example: `GLuint tex;
glCreateTextures(GL_TEXTURE_2D, 1, &tex);
glTextureStorage2D(tex, levels, GL_SRGB8_ALPHA8, w, h);`,
    related: ["glGen", "glDelete", "glCreateBuffers", "glCreateTextures"],
  },
  {
    name: "glDelete",
    category: "families",
    signature: "void glDelete{Buffers|VertexArrays|Textures|Framebuffers|Renderbuffers|Queries}(GLsizei n, const GLuint *ids);\nvoid glDeleteShader(GLuint shader);\nvoid glDeleteProgram(GLuint program);\nvoid glDeleteSync(GLsync sync);",
    summary: {
      en: "Free objects and their GPU memory; 0 and unknown names are ignored.",
      pt: "Liberam objetos e a memória deles na GPU; 0 e nomes desconhecidos são ignorados.",
    },
    description: {
      en: "A GLuint does not free its object by itself: forget glDelete* and the GPU memory stays used until the context is destroyed. Each object should have one owner in your code that deletes it once.\n\nSet the variable to 0 after deleting. glDelete* ignores 0, so a second delete is harmless, and any later use is an obvious bug instead of touching a recycled name that now belongs to another object.",
      pt: "Um GLuint não libera seu objeto sozinho: esqueça glDelete* e a memória da GPU continua ocupada até o contexto ser destruído. Cada objeto deveria ter um dono no seu código que o apaga uma vez.\n\nPonha a variável em 0 depois de apagar. glDelete* ignora 0, então um segundo delete não faz mal, e qualquer uso posterior vira um bug óbvio em vez de mexer num nome reciclado que agora pertence a outro objeto.",
    },
    params: [],
    family: {
      members: ["glDeleteBuffers", "glDeleteVertexArrays", "glDeleteTextures", "glDeleteShader", "glDeleteProgram", "glDeleteSync"],
      suffixes: [
        { part: "Buffers, Textures…", desc: { en: "Plural, with n and an array, mirroring glGen* / glCreate*.", pt: "Plural, com n e um array, espelhando glGen* / glCreate*." } },
        { part: "Shader, Program, Sync", desc: { en: "Singular: one object per call.", pt: "Singular: um objeto por chamada." } },
      ],
    },
    example: `glDeleteVertexArrays(1, &vao);
glDeleteBuffers(1, &vbo);
glDeleteProgram(program);
vao = vbo = program = 0;`,
    related: ["glGen", "glCreate"],
  },
  {
    name: "glBind",
    category: "families",
    signature: "void glBind{Buffer|Texture|Framebuffer|Renderbuffer}(GLenum target, GLuint name);\nvoid glBindVertexArray(GLuint array);\nvoid glBind{BufferBase|BufferRange|TextureUnit|ImageTexture|VertexBuffer}(GLuint index, …);",
    summary: {
      en: "Make an object the current one for a target or slot, so the following calls act on it or draws use it.",
      pt: "Tornam um objeto o atual de um target ou slot, assim as próximas chamadas agem nele ou os desenhos o usam.",
    },
    description: {
      en: "Classic OpenGL is a state machine: most functions do not take the object they act on, they act on whatever is bound. glBufferData changes the buffer bound to GL_ARRAY_BUFFER; glTexParameteri changes the texture bound to GL_TEXTURE_2D on the active unit. So binding has two jobs: choosing what to edit, and choosing what a draw uses.\n\nThe second kind of name ends in an index: glBindBufferBase(GL_UNIFORM_BUFFER, 2, ubo) and glBindTextureUnit(3, tex) put an object on a numbered slot that shaders read. Direct State Access removes the first job, editing, and leaves binding only for the second.",
      pt: "O OpenGL clássico é uma máquina de estados: a maioria das funções não recebe o objeto em que age, ela age no que estiver ligado. glBufferData muda o buffer ligado a GL_ARRAY_BUFFER; glTexParameteri muda a textura ligada a GL_TEXTURE_2D na unidade ativa. Então ligar tem dois papéis: escolher o que editar, e escolher o que um desenho usa.\n\nO segundo tipo de nome termina num índice: glBindBufferBase(GL_UNIFORM_BUFFER, 2, ubo) e glBindTextureUnit(3, tex) põem um objeto num slot numerado que os shaders leem. O Direct State Access elimina o primeiro papel, editar, e deixa o bind só para o segundo.",
    },
    params: [],
    family: {
      members: ["glBindBuffer", "glBindVertexArray", "glBindTexture", "glBindFramebuffer", "glBindRenderbuffer", "glBindBufferBase", "glBindBufferRange", "glBindTextureUnit", "glBindImageTexture", "glBindVertexBuffer"],
      suffixes: [
        { part: "(target, name)", desc: { en: "Bind to a target such as GL_ARRAY_BUFFER: the object to edit or use.", pt: "Liga a um target como GL_ARRAY_BUFFER: o objeto a editar ou usar." } },
        { part: "Base / Range / Unit", desc: { en: "Bind to a numbered slot that shaders read (binding = N in GLSL).", pt: "Liga a um slot numerado que os shaders leem (binding = N no GLSL)." } },
        { part: "0", desc: { en: "Binding name 0 unbinds: nothing is current any more.", pt: "Ligar o nome 0 desliga: nada fica atual." } },
      ],
    },
    example: `glBindBuffer(GL_ARRAY_BUFFER, vbo);          // choose what to edit
glBufferData(GL_ARRAY_BUFFER, size, data, GL_STATIC_DRAW);

glBindBufferBase(GL_UNIFORM_BUFFER, 0, ubo); // slot 0 for the shaders
glBindVertexArray(vao);                      // what the draw uses
glDrawArrays(GL_TRIANGLES, 0, 3);`,
    related: ["glGen", "glCreate", "glBindBuffer", "glBindTextureUnit"],
  },
  {
    name: "glGet",
    category: "families",
    signature: "void glGet{Integerv|Floatv|Booleanv|Doublev}(GLenum pname, T *data);\nvoid glGet{Shader|Program|QueryObject…}{iv|uiv|fv}(GLuint object, GLenum pname, T *params);",
    summary: {
      en: "Read state, limits or results back from OpenGL; the suffix says the type of what comes back.",
      pt: "Leem de volta do OpenGL estado, limites ou resultados; o sufixo diz o tipo do que volta.",
    },
    description: {
      en: "The getters come in two kinds: global queries (glGetIntegerv(GL_MAX_TEXTURE_SIZE, &n)) and queries about one object (glGetShaderiv(shader, GL_COMPILE_STATUS, &ok)). Strings and errors have their own: glGetString, glGetError.\n\nThey are cheap for limits read once at start-up, but can be slow in a frame. Some force the CPU to wait for the GPU (glGetBufferSubData, glGetQueryObject on a fresh query), and even simple ones make the driver synchronise its state. For anything you set yourself, keep your own copy instead of asking.",
      pt: "Os getters são de dois tipos: consultas globais (glGetIntegerv(GL_MAX_TEXTURE_SIZE, &n)) e consultas sobre um objeto (glGetShaderiv(shader, GL_COMPILE_STATUS, &ok)). Textos e erros têm os seus: glGetString, glGetError.\n\nSão baratos para limites lidos uma vez na inicialização, mas podem ser lentos dentro de um frame. Alguns obrigam a CPU a esperar a GPU (glGetBufferSubData, glGetQueryObject numa query recente), e até os simples fazem o driver sincronizar seu estado. Para tudo que você mesmo definiu, guarde sua própria cópia em vez de perguntar.",
    },
    params: [],
    family: {
      members: ["glGetIntegerv", "glGetString", "glGetError", "glGetShaderiv", "glGetShaderInfoLog", "glGetProgramiv", "glGetProgramInfoLog", "glGetUniformLocation", "glGetAttribLocation", "glGetUniformBlockIndex", "glGetBufferSubData", "glGetQueryObjectuiv", "glGetQueryObjectui64v"],
      suffixes: [
        { part: "iv", desc: { en: "Integer values through a pointer (\"integer vector\").", pt: "Valores inteiros por um ponteiro (\"integer vector\")." } },
        { part: "uiv / ui64v", desc: { en: "Unsigned 32-bit / 64-bit (timer results need 64).", pt: "Sem sinal de 32 / 64 bits (resultados de timer precisam de 64)." } },
        { part: "fv / Booleanv / Doublev", desc: { en: "Float, boolean or double values.", pt: "Valores float, booleanos ou double." } },
        { part: "InfoLog", desc: { en: "A text log (compile and link errors) copied into your char buffer.", pt: "Um log em texto (erros de compilação e link) copiado para o seu buffer de char." } },
      ],
    },
    example: `GLint maxTex = 0;
glGetIntegerv(GL_MAX_TEXTURE_SIZE, &maxTex);

GLint ok = 0;
glGetShaderiv(shader, GL_COMPILE_STATUS, &ok);`,
    related: ["glGetIntegerv", "glGetError", "glGetShaderiv", "glGetQueryObject"],
  },
  {
    name: "glGetQueryObject",
    category: "families",
    signature: "void glGetQueryObject{iv|uiv|i64v|ui64v}(GLuint id, GLenum pname, T *params);",
    summary: {
      en: "Read a query's availability or result; pick the suffix by the size of the result.",
      pt: "Leem a disponibilidade ou o resultado de uma query; escolha o sufixo pelo tamanho do resultado.",
    },
    description: {
      en: "The four versions differ only in the type written. Use uiv for availability and sample counts, ui64v for times in nanoseconds (32 bits overflow after about 4 seconds). Reading GL_QUERY_RESULT before the GPU has produced it makes the CPU wait, so check GL_QUERY_RESULT_AVAILABLE first or read queries a few frames old.",
      pt: "As quatro versões só diferem no tipo escrito. Use uiv para disponibilidade e contagens de amostras, ui64v para tempos em nanossegundos (32 bits estouram depois de uns 4 segundos). Ler GL_QUERY_RESULT antes de a GPU produzi-lo faz a CPU esperar, então verifique GL_QUERY_RESULT_AVAILABLE antes ou leia queries de alguns frames atrás.",
    },
    params: [],
    family: {
      members: ["glGetQueryObjectuiv", "glGetQueryObjectui64v"],
      suffixes: [
        { part: "uiv", desc: { en: "32-bit unsigned: availability, sample counts.", pt: "32 bits sem sinal: disponibilidade, contagem de amostras." } },
        { part: "ui64v", desc: { en: "64-bit unsigned: GPU times and timestamps.", pt: "64 bits sem sinal: tempos e timestamps da GPU." } },
      ],
    },
    example: `GLuint ready = 0;
glGetQueryObjectuiv(q, GL_QUERY_RESULT_AVAILABLE, &ready);
if (ready) { GLuint64 ns; glGetQueryObjectui64v(q, GL_QUERY_RESULT, &ns); }`,
    related: ["glBeginQuery", "glQueryCounter", "glGet"],
  },
  {
    name: "glTexSubImage",
    category: "families",
    signature: "void glTexSubImage{1D|2D|3D}(GLenum target, GLint level, offsets…, sizes…, GLenum format, GLenum type, const void *pixels);\nvoid glTextureSubImage{1D|2D|3D}(GLuint texture, …);\nvoid glCompressedTextureSubImage{1D|2D|3D}(GLuint texture, …, GLsizei imageSize, const void *data);",
    summary: {
      en: "Overwrite part of an existing texture; the number is the texture's dimensions, Texture instead of Tex means DSA.",
      pt: "Sobrescrevem parte de uma textura existente; o número são as dimensões da textura, Texture em vez de Tex significa DSA.",
    },
    description: {
      en: "All of them write pixels into storage that already exists, without reallocating. They differ in three ways that can be read from the name: 1D / 2D / 3D gives the number of offsets and sizes (a texture array counts as 3D, the layer being the third coordinate); glTexture… takes the texture ID instead of a bound target; Compressed… takes ready-made compressed blocks with their byte size instead of format and type.",
      pt: "Todas escrevem pixels num armazenamento que já existe, sem realocar. Elas diferem de três jeitos que dá para ler no nome: 1D / 2D / 3D dá o número de offsets e tamanhos (uma textura array conta como 3D, com a camada como terceira coordenada); glTexture… recebe o ID da textura em vez de um target ligado; Compressed… recebe blocos já comprimidos com o tamanho em bytes, em vez de format e type.",
    },
    params: [],
    family: {
      members: ["glTexSubImage2D", "glTextureSubImage2D", "glCompressedTextureSubImage2D"],
      suffixes: [
        { part: "1D / 2D / 3D", desc: { en: "Dimensions: x; x, y; or x, y, z (or layer).", pt: "Dimensões: x; x, y; ou x, y, z (ou camada)." } },
        { part: "Tex / Texture", desc: { en: "Bound target (classic) / texture ID (DSA, GL 4.5).", pt: "Target ligado (clássico) / ID da textura (DSA, GL 4.5)." } },
        { part: "Compressed", desc: { en: "Pre-compressed blocks (BC7, ASTC…).", pt: "Blocos já comprimidos (BC7, ASTC…)." } },
      ],
    },
    example: `glTexSubImage2D(GL_TEXTURE_2D, 0, x, y, w, h, GL_RGBA, GL_UNSIGNED_BYTE, pixels);
glTextureSubImage2D(tex, 0, x, y, w, h, GL_RGBA, GL_UNSIGNED_BYTE, pixels);   // same, by ID`,
    related: ["glTexImage2D", "glTexStorage2D", "glPixelStorei"],
  },
  {
    name: "glVertex",
    category: "legacy",
    deprecated: {
      en: "Immediate mode, removed from the core profile in OpenGL 3.2.",
      pt: "Immediate mode, removido do core profile no OpenGL 3.2.",
    },
    signature: "void glVertex{2|3|4}{f|d|i|s}[v](…);",
    summary: {
      en: "The old immediate-mode calls that sent one vertex at a time between glBegin and glEnd.",
      pt: "As antigas chamadas do immediate mode que enviavam um vértice por vez entre glBegin e glEnd.",
    },
    description: {
      en: "Old tutorials are full of glVertex3f, glColor3f and glNormal3f inside glBegin/glEnd. Every call crossed from the CPU to the driver, which is why a mesh of a million vertices was slow. In modern OpenGL vertices live in a buffer on the GPU, are described by glVertexAttribPointer, and are drawn with one glDrawArrays.",
      pt: "Tutoriais antigos estão cheios de glVertex3f, glColor3f e glNormal3f dentro de glBegin/glEnd. Cada chamada ia da CPU ao driver, por isso uma malha de um milhão de vértices era lenta. No OpenGL moderno os vértices ficam num buffer na GPU, são descritos por glVertexAttribPointer e desenhados com um glDrawArrays.",
    },
    params: [],
    family: {
      members: ["glVertex2f", "glVertex3f"],
      suffixes: [
        { part: "2 3 4", desc: { en: "Coordinates given: x y; x y z; x y z w.", pt: "Coordenadas dadas: x y; x y z; x y z w." } },
        { part: "f d i s", desc: { en: "float, double, int, short.", pt: "float, double, int, short." } },
      ],
    },
    example: `glBegin(GL_TRIANGLES);
    glVertex3f(-0.5f, -0.5f, 0.0f);
    glVertex3f( 0.5f, -0.5f, 0.0f);
    glVertex3f( 0.0f,  0.5f, 0.0f);
glEnd();`,
    related: ["glBegin", "glVertexAttribPointer", "glDrawArrays"],
  },
  {
    name: "glTranslate",
    category: "legacy",
    deprecated: {
      en: "Built-in matrix stack, removed from the core profile in OpenGL 3.2.",
      pt: "Pilha de matrizes embutida, removida do core profile no OpenGL 3.2.",
    },
    signature: "void glTranslate{f|d}(T x, T y, T z);\nvoid glRotate{f|d}(T angle, T x, T y, T z);\nvoid glScale{f|d}(T x, T y, T z);",
    summary: {
      en: "Old calls that multiplied OpenGL's built-in current matrix by a translation (and glRotate, glScale by a rotation or scale).",
      pt: "Chamadas antigas que multiplicavam a matriz atual embutida do OpenGL por uma translação (e glRotate, glScale por uma rotação ou escala).",
    },
    description: {
      en: "With glMatrixMode(GL_MODELVIEW) selected, each call multiplied the current matrix on the right, so the last call written applied first to the vertices. glRotatef took the angle in degrees. The modern equivalent builds the same matrices with GLM (glm::translate, glm::rotate in radians, glm::scale) and sends the result as a uniform.",
      pt: "Com glMatrixMode(GL_MODELVIEW) selecionado, cada chamada multiplicava a matriz atual pela direita, então a última chamada escrita era a primeira a agir nos vértices. glRotatef recebia o ângulo em graus. O equivalente moderno monta as mesmas matrizes com GLM (glm::translate, glm::rotate em radianos, glm::scale) e envia o resultado como uniform.",
    },
    params: [],
    family: { members: [] },
    example: `// Legacy                        // Modern (GLM)
glTranslatef(0, 0, -5);         // model = glm::translate(model, {0, 0, -5});
glRotatef(45, 0, 1, 0);         // model = glm::rotate(model, glm::radians(45.f), {0, 1, 0});`,
    related: ["glMatrixMode", "glUniformMatrix4fv", "glRotate"],
  },
  {
    name: "glRotate",
    category: "legacy",
    deprecated: {
      en: "Built-in matrix stack, removed from the core profile in OpenGL 3.2.",
      pt: "Pilha de matrizes embutida, removida do core profile no OpenGL 3.2.",
    },
    signature: "void glRotate{f|d}(T angle, T x, T y, T z);",
    summary: {
      en: "Old call that rotated the built-in current matrix by angle degrees around the axis (x, y, z).",
      pt: "Chamada antiga que girava a matriz atual embutida em angle graus em torno do eixo (x, y, z).",
    },
    description: {
      en: "Same story as glTranslate: it acted on the matrix selected with glMatrixMode, in degrees. Today: glm::rotate(model, glm::radians(angle), axis), sent to the shader with glUniformMatrix4fv.",
      pt: "Mesma história de glTranslate: agia na matriz escolhida com glMatrixMode, em graus. Hoje: glm::rotate(model, glm::radians(angle), eixo), enviada ao shader com glUniformMatrix4fv.",
    },
    params: [],
    family: { members: [] },
    example: `glRotatef(angle, 0.0f, 1.0f, 0.0f);   // legacy: spin around Y`,
    related: ["glTranslate", "glMatrixMode", "glUniformMatrix4fv"],
  },
  {
    name: "glLight",
    category: "legacy",
    deprecated: {
      en: "Fixed-function lighting, removed from the core profile in OpenGL 3.2.",
      pt: "Iluminação de função fixa, removida do core profile no OpenGL 3.2.",
    },
    signature: "void glLight{f|i}[v](GLenum light, GLenum pname, T param);",
    summary: {
      en: "Old fixed-function lighting: set up to 8 built-in lights (GL_LIGHT0…), computed per vertex by the driver.",
      pt: "Iluminação antiga de função fixa: configurava até 8 luzes embutidas (GL_LIGHT0…), calculadas por vértice pelo driver.",
    },
    description: {
      en: "Before shaders, OpenGL had one built-in lighting model: glEnable(GL_LIGHTING), glEnable(GL_LIGHT0), then glLightfv for position and colours. It was Blinn-Phong evaluated only at the vertices, so highlights on large triangles looked smeared. The lighting lessons write that model, and better ones, in a fragment shader, per pixel, with as many lights as you like.",
      pt: "Antes dos shaders, o OpenGL tinha um modelo de iluminação embutido: glEnable(GL_LIGHTING), glEnable(GL_LIGHT0), e depois glLightfv para posição e cores. Era Blinn-Phong calculado só nos vértices, por isso os brilhos em triângulos grandes pareciam borrados. As lições de iluminação escrevem esse modelo, e outros melhores, num fragment shader, por pixel, com quantas luzes você quiser.",
    },
    params: [],
    family: { members: [] },
    example: `// Legacy
glEnable(GL_LIGHTING);
glEnable(GL_LIGHT0);
GLfloat pos[] = { 1, 1, 1, 0 };
glLightfv(GL_LIGHT0, GL_POSITION, pos);`,
    related: ["glMatrixMode", "glBegin"],
  },
];
