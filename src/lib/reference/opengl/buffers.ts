// src/lib/reference/opengl/buffers.ts
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

export const bufferEntries: RefEntry[] = [
  {
    name: "glGenBuffers",
    category: "buffers",
    since: "GL 1.5",
    signature: "void glGenBuffers(GLsizei n, GLuint *buffers);",
    summary: {
      en: "Reserves names (IDs) for new buffer objects.",
      pt: "Reserva nomes (IDs) para novos buffer objects.",
    },
    description: {
      en: "A buffer object is a block of memory owned by the GPU driver. glGenBuffers does not allocate that memory yet — it only hands you unused integer IDs that you will later use to refer to buffers.\n\nThe buffer only really comes into existence the first time you bind the ID with glBindBuffer. Think of it as taking a numbered ticket: the number is yours, but nothing is stored under it until you use it.",
      pt: "Um buffer object é um bloco de memória gerenciado pelo driver da GPU. glGenBuffers ainda não aloca essa memória — ele só te entrega IDs inteiros livres que você vai usar depois para se referir aos buffers.\n\nO buffer só passa a existir de verdade na primeira vez que você faz bind desse ID com glBindBuffer. Pense como pegar uma senha numerada: o número é seu, mas nada fica guardado nele até você usá-lo.",
    },
    params: [
      { name: "n", type: "GLsizei", desc: { en: "How many IDs to generate.", pt: "Quantos IDs gerar." } },
      {
        name: "buffers", type: "GLuint *",
        desc: {
          en: "Pointer to an array with room for n values; the IDs are written here.",
          pt: "Ponteiro para um array com espaço para n valores; os IDs são escritos aqui.",
        },
      },
    ],
    notes: [
      { en: "ID 0 is never returned — it is reserved to mean \"no buffer\".", pt: "O ID 0 nunca é retornado — ele é reservado para significar \"nenhum buffer\"." },
      { en: "In OpenGL 4.5+ prefer glCreateBuffers, which creates the object immediately without needing a bind.", pt: "No OpenGL 4.5+ prefira glCreateBuffers, que cria o objeto imediatamente sem precisar de bind." },
    ],
    errors: [{ code: "GL_INVALID_VALUE", when: { en: "n is negative.", pt: "n é negativo." } }],
    example: `GLuint vbo;
glGenBuffers(1, &vbo);          // just an ID for now
glBindBuffer(GL_ARRAY_BUFFER, vbo); // now the buffer exists`,
    related: ["glBindBuffer", "glBufferData", "glDeleteBuffers", "glCreateBuffers"],
    khronos: `${KHR}glGenBuffers.xhtml`,
  },
  {
    name: "glBindBuffer",
    category: "buffers",
    since: "GL 1.5",
    signature: "void glBindBuffer(GLenum target, GLuint buffer);",
    summary: {
      en: "Makes a buffer the current one for a given target, so later buffer calls act on it.",
      pt: "Torna um buffer o atual para um target, para que as próximas chamadas de buffer atuem nele.",
    },
    description: {
      en: "OpenGL is a state machine: most functions do not take the object they operate on as a parameter. Instead, you first \"bind\" the object to a slot (the target), and every later call that uses that slot affects whatever is bound there.\n\nglBindBuffer puts a buffer into one of those slots. After glBindBuffer(GL_ARRAY_BUFFER, vbo), a call like glBufferData(GL_ARRAY_BUFFER, ...) uploads data into vbo.",
      pt: "O OpenGL é uma máquina de estados: a maioria das funções não recebe como parâmetro o objeto em que atua. Em vez disso, você primeiro faz \"bind\" do objeto em um slot (o target), e toda chamada seguinte que usa esse slot afeta o que estiver ligado lá.\n\nglBindBuffer coloca um buffer em um desses slots. Depois de glBindBuffer(GL_ARRAY_BUFFER, vbo), uma chamada como glBufferData(GL_ARRAY_BUFFER, ...) envia dados para o vbo.",
    },
    params: [
      {
        name: "target", type: "GLenum",
        desc: { en: "Which slot to bind to. It defines how the buffer will be used.", pt: "Em qual slot fazer o bind. Define como o buffer será usado." },
        values: [
          { name: "GL_ARRAY_BUFFER", desc: { en: "Vertex attributes (positions, colors, UVs…).", pt: "Atributos de vértice (posições, cores, UVs…)." } },
          { name: "GL_ELEMENT_ARRAY_BUFFER", desc: { en: "Indices for glDrawElements. This binding is stored in the current VAO.", pt: "Índices para glDrawElements. Esse bind fica salvo no VAO atual." } },
          { name: "GL_UNIFORM_BUFFER", desc: { en: "Uniform blocks shared between shaders.", pt: "Blocos de uniforms compartilhados entre shaders." } },
          { name: "GL_SHADER_STORAGE_BUFFER", desc: { en: "Read/write storage for shaders (GL 4.3).", pt: "Armazenamento leitura/escrita para shaders (GL 4.3)." } },
          { name: "GL_COPY_READ_BUFFER / GL_COPY_WRITE_BUFFER", desc: { en: "Scratch slots for buffer-to-buffer copies.", pt: "Slots auxiliares para cópias entre buffers." } },
        ],
      },
      {
        name: "buffer", type: "GLuint",
        desc: { en: "The buffer ID, or 0 to unbind whatever is in the slot.", pt: "O ID do buffer, ou 0 para desfazer o bind do slot." },
      },
    ],
    notes: [
      { en: "Never unbind GL_ELEMENT_ARRAY_BUFFER while a VAO is bound — the VAO remembers it, and unbinding erases the index buffer from the VAO.", pt: "Nunca desfaça o bind de GL_ELEMENT_ARRAY_BUFFER com um VAO ligado — o VAO guarda esse bind, e desligar apaga o index buffer do VAO." },
      { en: "GL_ARRAY_BUFFER is NOT stored in the VAO; what is stored is the buffer captured by each glVertexAttribPointer call.", pt: "GL_ARRAY_BUFFER NÃO é salvo no VAO; o que fica salvo é o buffer capturado por cada chamada de glVertexAttribPointer." },
    ],
    errors: [
      { code: "GL_INVALID_ENUM", when: { en: "target is not an accepted value.", pt: "target não é um valor aceito." } },
      { code: "GL_INVALID_VALUE", when: { en: "buffer was never returned by glGenBuffers.", pt: "buffer nunca foi retornado por glGenBuffers." } },
    ],
    example: `glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
glBindBuffer(GL_ARRAY_BUFFER, 0); // optional: unbind`,
    related: ["glGenBuffers", "glBufferData", "glBindVertexArray", "glBindBufferBase"],
    khronos: `${KHR}glBindBuffer.xhtml`,
  },
  {
    name: "glBufferData",
    category: "buffers",
    since: "GL 1.5",
    signature: "void glBufferData(GLenum target, GLsizeiptr size, const void *data, GLenum usage);",
    summary: {
      en: "Allocates GPU memory for the bound buffer and optionally copies data into it.",
      pt: "Aloca memória na GPU para o buffer ligado e, opcionalmente, copia dados para ela.",
    },
    description: {
      en: "This is how data leaves your C++ arrays and reaches the GPU. It (re)allocates the storage of the buffer bound to target with exactly size bytes, and copies size bytes from data into it.\n\nCalling it again on the same buffer throws the old storage away and allocates a new one — useful to resize, but expensive if done every frame. To update part of an existing buffer, use glBufferSubData.",
      pt: "É assim que os dados saem dos seus arrays em C++ e chegam à GPU. Ele (re)aloca o armazenamento do buffer ligado ao target com exatamente size bytes, e copia size bytes de data para lá.\n\nChamar de novo no mesmo buffer descarta o armazenamento antigo e aloca um novo — útil para redimensionar, mas caro se feito todo frame. Para atualizar parte de um buffer existente, use glBufferSubData.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "Slot whose bound buffer receives the data (e.g. GL_ARRAY_BUFFER).", pt: "Slot cujo buffer ligado recebe os dados (ex.: GL_ARRAY_BUFFER)." } },
      { name: "size", type: "GLsizeiptr", desc: { en: "Size in BYTES. Use sizeof(array) for static arrays or count * sizeof(T) for vectors.", pt: "Tamanho em BYTES. Use sizeof(array) para arrays estáticos ou count * sizeof(T) para vectors." } },
      { name: "data", type: "const void *", desc: { en: "Pointer to the source data, or nullptr to only allocate (contents undefined).", pt: "Ponteiro para os dados de origem, ou nullptr para só alocar (conteúdo indefinido)." } },
      {
        name: "usage", type: "GLenum",
        desc: { en: "A hint about how often you will change and use the data. The driver uses it to decide where to place the memory.", pt: "Uma dica de com que frequência você vai alterar e usar os dados. O driver usa isso para decidir onde colocar a memória." },
        values: [
          { name: "GL_STATIC_DRAW", desc: { en: "Set once, drawn many times (meshes).", pt: "Definido uma vez, desenhado muitas vezes (malhas)." } },
          { name: "GL_DYNAMIC_DRAW", desc: { en: "Changed often, drawn many times.", pt: "Alterado com frequência, desenhado muitas vezes." } },
          { name: "GL_STREAM_DRAW", desc: { en: "Set once, drawn a few times (per-frame data).", pt: "Definido uma vez, desenhado poucas vezes (dados por frame)." } },
        ],
      },
    ],
    notes: [
      { en: "Classic bug: sizeof(pointer) or sizeof(std::vector) instead of the data size. For a vector use v.size() * sizeof(v[0]).", pt: "Bug clássico: sizeof(ponteiro) ou sizeof(std::vector) em vez do tamanho dos dados. Para vector use v.size() * sizeof(v[0])." },
      { en: "The data is copied during the call, so your CPU array can be freed right after.", pt: "Os dados são copiados durante a chamada, então seu array na CPU pode ser liberado logo depois." },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "No buffer is bound to target.", pt: "Nenhum buffer está ligado ao target." } },
      { code: "GL_OUT_OF_MEMORY", when: { en: "The GPU could not allocate size bytes.", pt: "A GPU não conseguiu alocar size bytes." } },
    ],
    example: `float vertices[] = {
    -0.5f, -0.5f, 0.0f,
     0.5f, -0.5f, 0.0f,
     0.0f,  0.5f, 0.0f,
};
glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);`,
    related: ["glBindBuffer", "glBufferSubData", "glNamedBufferData", "glNamedBufferStorage"],
    khronos: `${KHR}glBufferData.xhtml`,
  },
  {
    name: "glBufferSubData",
    category: "buffers",
    since: "GL 1.5",
    signature: "void glBufferSubData(GLenum target, GLintptr offset, GLsizeiptr size, const void *data);",
    summary: {
      en: "Overwrites part of an already allocated buffer.",
      pt: "Sobrescreve parte de um buffer já alocado.",
    },
    description: {
      en: "Unlike glBufferData, this never reallocates. It copies size bytes from data into the bound buffer, starting offset bytes from its beginning. The buffer must already be big enough.\n\nIt is the usual way to update per-frame data such as a uniform buffer with the camera matrices.",
      pt: "Diferente de glBufferData, esta função nunca realoca. Ela copia size bytes de data para o buffer ligado, começando offset bytes a partir do início. O buffer já precisa ter tamanho suficiente.\n\nÉ o jeito comum de atualizar dados por frame, como um uniform buffer com as matrizes da câmera.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "Slot whose bound buffer is updated.", pt: "Slot cujo buffer ligado é atualizado." } },
      { name: "offset", type: "GLintptr", desc: { en: "Where to start writing, in bytes from the start of the buffer.", pt: "Onde começar a escrever, em bytes a partir do início do buffer." } },
      { name: "size", type: "GLsizeiptr", desc: { en: "How many bytes to write.", pt: "Quantos bytes escrever." } },
      { name: "data", type: "const void *", desc: { en: "Source data on the CPU.", pt: "Dados de origem na CPU." } },
    ],
    notes: [
      { en: "offset + size must not exceed the size given to glBufferData.", pt: "offset + size não pode passar do tamanho dado a glBufferData." },
      { en: "If the GPU is still reading the buffer from a previous draw, the driver may stall until it finishes.", pt: "Se a GPU ainda estiver lendo o buffer de um draw anterior, o driver pode travar até ela terminar." },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "offset or size is negative, or offset + size is larger than the buffer.", pt: "offset ou size é negativo, ou offset + size é maior que o buffer." } },
      { code: "GL_INVALID_OPERATION", when: { en: "No buffer bound, or the buffer is immutable without GL_DYNAMIC_STORAGE_BIT.", pt: "Nenhum buffer ligado, ou o buffer é imutável sem GL_DYNAMIC_STORAGE_BIT." } },
    ],
    example: `// Update the view matrix (bytes 64..127) of a camera UBO
glBindBuffer(GL_UNIFORM_BUFFER, uboCamera);
glBufferSubData(GL_UNIFORM_BUFFER, 64, sizeof(glm::mat4), glm::value_ptr(view));`,
    related: ["glBufferData", "glNamedBufferSubData", "glGetBufferSubData"],
    khronos: `${KHR}glBufferSubData.xhtml`,
  },
  {
    name: "glMapBuffer",
    category: "buffers",
    since: "GL 1.5",
    signature: "void *glMapBuffer(GLenum target, GLenum access);",
    summary: {
      en: "Returns a CPU pointer through which you can read or write a whole buffer.",
      pt: "Devolve um ponteiro na CPU pelo qual você lê ou escreve um buffer inteiro.",
    },
    description: {
      en: "Instead of preparing data in your own array and copying it with glBufferSubData, you write straight into the buffer's storage through the returned pointer. That saves a copy when you generate the data yourself.\n\nThe buffer stays mapped until glUnmapBuffer. While it is mapped it cannot be used for drawing, and after unmapping the pointer must not be used again.",
      pt: "Em vez de preparar os dados num array seu e copiá-los com glBufferSubData, você escreve direto no armazenamento do buffer pelo ponteiro devolvido. Isso poupa uma cópia quando você mesmo gera os dados.\n\nO buffer fica mapeado até glUnmapBuffer. Enquanto estiver mapeado ele não pode ser usado para desenhar, e depois de desmapear o ponteiro não pode mais ser usado.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "Slot whose bound buffer is mapped.", pt: "Slot cujo buffer ligado é mapeado." } },
      {
        name: "access", type: "GLenum", desc: { en: "What you will do through the pointer.", pt: "O que você vai fazer pelo ponteiro." },
        values: [
          { name: "GL_WRITE_ONLY", desc: { en: "Write only — the fastest; the old contents never have to be copied to you.", pt: "Só escrita — o mais rápido; o conteúdo antigo nunca precisa ser copiado para você." } },
          { name: "GL_READ_ONLY", desc: { en: "Read only.", pt: "Só leitura." } },
          { name: "GL_READ_WRITE", desc: { en: "Both.", pt: "As duas coisas." } },
        ],
      },
    ],
    returns: { en: "The pointer, or NULL on failure.", pt: "O ponteiro, ou NULL em caso de falha." },
    notes: [
      { en: "Writing through a GL_READ_ONLY mapping, or reading through GL_WRITE_ONLY, is undefined behaviour.", pt: "Escrever por um mapeamento GL_READ_ONLY, ou ler por um GL_WRITE_ONLY, é comportamento indefinido." },
      { en: "If the GPU is still using the buffer, mapping waits for it. For per-frame data prefer glMapBufferRange with explicit flags.", pt: "Se a GPU ainda estiver usando o buffer, mapear espera por ela. Para dados por frame prefira glMapBufferRange com flags explícitas." },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "No buffer bound, or the buffer is already mapped.", pt: "Nenhum buffer ligado, ou o buffer já está mapeado." } },
    ],
    example: `glBindBuffer(GL_ARRAY_BUFFER, vbo);
auto* dst = static_cast<Vertex*>(glMapBuffer(GL_ARRAY_BUFFER, GL_WRITE_ONLY));
generateTerrain(dst, count);
glUnmapBuffer(GL_ARRAY_BUFFER);`,
    related: ["glMapBufferRange", "glUnmapBuffer", "glBufferSubData"],
    khronos: `${KHR}glMapBuffer.xhtml`,
  },
  {
    name: "glMapBufferRange",
    category: "buffers",
    since: "GL 3.0",
    signature: "void *glMapBufferRange(GLenum target, GLintptr offset, GLsizeiptr length, GLbitfield access);",
    summary: {
      en: "Maps part of a buffer, with flags that say exactly what may happen to its old contents.",
      pt: "Mapeia parte de um buffer, com flags que dizem exatamente o que pode acontecer com o conteúdo antigo.",
    },
    description: {
      en: "Like glMapBuffer, but for a byte range, and with access bits instead of a single enum. The extra bits let you promise things the driver cannot know: that the old data in the range can be thrown away, or that you will not touch memory the GPU is still reading.\n\nIt is the building block of every efficient streaming scheme; the Buffer Streaming & Sync chapter shows how to combine it with fences.",
      pt: "Como glMapBuffer, mas para um intervalo de bytes e com bits de acesso em vez de um único enum. Os bits extras deixam você prometer coisas que o driver não tem como saber: que os dados antigos do intervalo podem ser descartados, ou que você não vai tocar na memória que a GPU ainda está lendo.\n\nÉ a peça básica de todo esquema de streaming eficiente; o capítulo Buffer Streaming & Sync mostra como combiná-lo com fences.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "Slot whose bound buffer is mapped.", pt: "Slot cujo buffer ligado é mapeado." } },
      { name: "offset", type: "GLintptr", desc: { en: "First byte of the range.", pt: "Primeiro byte do intervalo." } },
      { name: "length", type: "GLsizeiptr", desc: { en: "Number of bytes to map.", pt: "Número de bytes a mapear." } },
      {
        name: "access", type: "GLbitfield", desc: { en: "Bitwise OR of access flags.", pt: "OU bit a bit de flags de acesso." },
        values: [
          { name: "GL_MAP_WRITE_BIT / GL_MAP_READ_BIT", desc: { en: "What you will do through the pointer (at least one is required).", pt: "O que você vai fazer pelo ponteiro (pelo menos um é obrigatório)." } },
          { name: "GL_MAP_INVALIDATE_RANGE_BIT", desc: { en: "The old contents of the range may be discarded.", pt: "O conteúdo antigo do intervalo pode ser descartado." } },
          { name: "GL_MAP_INVALIDATE_BUFFER_BIT", desc: { en: "The old contents of the whole buffer may be discarded.", pt: "O conteúdo antigo do buffer inteiro pode ser descartado." } },
          { name: "GL_MAP_UNSYNCHRONIZED_BIT", desc: { en: "Do not wait for the GPU — you guarantee it is not using this range.", pt: "Não espere pela GPU — você garante que ela não está usando esse intervalo." } },
          { name: "GL_MAP_FLUSH_EXPLICIT_BIT", desc: { en: "You will report the written sub-ranges yourself with glFlushMappedBufferRange.", pt: "Você mesmo vai informar os sub-intervalos escritos com glFlushMappedBufferRange." } },
        ],
      },
    ],
    returns: { en: "A pointer to the start of the range, or NULL on failure.", pt: "Um ponteiro para o início do intervalo, ou NULL em caso de falha." },
    notes: [
      { en: "The invalidate bits cannot be combined with GL_MAP_READ_BIT.", pt: "Os bits de invalidação não podem ser combinados com GL_MAP_READ_BIT." },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "offset or length is negative, or the range goes past the end of the buffer.", pt: "offset ou length é negativo, ou o intervalo passa do fim do buffer." } },
      { code: "GL_INVALID_OPERATION", when: { en: "The buffer is already mapped, neither read nor write was requested, or the flags contradict each other.", pt: "O buffer já está mapeado, não foi pedida nem leitura nem escrita, ou as flags se contradizem." } },
    ],
    example: `glBindBuffer(GL_ARRAY_BUFFER, vbo);
void* p = glMapBufferRange(GL_ARRAY_BUFFER, 0, bytes,
                           GL_MAP_WRITE_BIT | GL_MAP_INVALIDATE_BUFFER_BIT);
std::memcpy(p, vertices.data(), bytes);
glUnmapBuffer(GL_ARRAY_BUFFER);`,
    related: ["glMapBuffer", "glUnmapBuffer", "glBufferSubData"],
    khronos: `${KHR}glMapBufferRange.xhtml`,
  },
  {
    name: "glUnmapBuffer",
    category: "buffers",
    since: "GL 1.5",
    signature: "GLboolean glUnmapBuffer(GLenum target);",
    summary: {
      en: "Ends a mapping and gives the buffer back to OpenGL.",
      pt: "Encerra um mapeamento e devolve o buffer ao OpenGL.",
    },
    description: {
      en: "After this call the pointer from glMapBuffer or glMapBufferRange is invalid, and the buffer can be used for drawing again.",
      pt: "Depois desta chamada o ponteiro de glMapBuffer ou glMapBufferRange fica inválido, e o buffer pode voltar a ser usado para desenhar.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "Slot whose bound buffer is unmapped.", pt: "Slot cujo buffer ligado é desmapeado." } },
    ],
    returns: {
      en: "GL_TRUE normally. GL_FALSE if the contents became corrupt while mapped (rare, e.g. after a display mode change) — upload the data again.",
      pt: "GL_TRUE normalmente. GL_FALSE se o conteúdo se corrompeu enquanto estava mapeado (raro, por exemplo após uma troca de modo de vídeo) — envie os dados de novo.",
    },
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "The buffer is not mapped.", pt: "O buffer não está mapeado." } },
    ],
    related: ["glMapBuffer", "glMapBufferRange"],
    khronos: `${KHR}glMapBuffer.xhtml`,
  },
  {
    name: "glCopyBufferSubData",
    category: "buffers",
    since: "GL 3.1",
    signature: "void glCopyBufferSubData(GLenum readTarget, GLenum writeTarget, GLintptr readOffset, GLintptr writeOffset, GLsizeiptr size);",
    summary: {
      en: "Copies bytes from one buffer to another on the GPU.",
      pt: "Copia bytes de um buffer para outro na GPU.",
    },
    description: {
      en: "The data never passes through the CPU. The two buffers are named by the targets they are bound to; because two buffers cannot share one target, OpenGL provides GL_COPY_READ_BUFFER and GL_COPY_WRITE_BUFFER, which exist only for copies and never disturb the bindings your draws use.\n\nTypical uses: growing a buffer while keeping its contents, duplicating a mesh, and moving data from a staging buffer into its final place.",
      pt: "Os dados nunca passam pela CPU. Os dois buffers são indicados pelos targets aos quais estão ligados; como dois buffers não podem dividir um target, o OpenGL oferece GL_COPY_READ_BUFFER e GL_COPY_WRITE_BUFFER, que existem só para cópias e nunca atrapalham os bindings que seus draws usam.\n\nUsos típicos: aumentar um buffer mantendo o conteúdo, duplicar uma malha e mover dados de um staging buffer para o lugar definitivo.",
    },
    params: [
      { name: "readTarget", type: "GLenum", desc: { en: "Slot of the source buffer (usually GL_COPY_READ_BUFFER).", pt: "Slot do buffer de origem (normalmente GL_COPY_READ_BUFFER)." } },
      { name: "writeTarget", type: "GLenum", desc: { en: "Slot of the destination buffer (usually GL_COPY_WRITE_BUFFER).", pt: "Slot do buffer de destino (normalmente GL_COPY_WRITE_BUFFER)." } },
      { name: "readOffset", type: "GLintptr", desc: { en: "First byte to read.", pt: "Primeiro byte a ler." } },
      { name: "writeOffset", type: "GLintptr", desc: { en: "First byte to write.", pt: "Primeiro byte a escrever." } },
      { name: "size", type: "GLsizeiptr", desc: { en: "Number of bytes to copy.", pt: "Número de bytes a copiar." } },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "A range goes past the end of its buffer, or source and destination overlap within the same buffer.", pt: "Um intervalo passa do fim do seu buffer, ou origem e destino se sobrepõem no mesmo buffer." } },
      { code: "GL_INVALID_OPERATION", when: { en: "No buffer is bound to one of the targets, or one of them is mapped.", pt: "Não há buffer ligado a um dos targets, ou um deles está mapeado." } },
    ],
    example: `glBindBuffer(GL_COPY_READ_BUFFER,  oldVbo);
glBindBuffer(GL_COPY_WRITE_BUFFER, biggerVbo);
glCopyBufferSubData(GL_COPY_READ_BUFFER, GL_COPY_WRITE_BUFFER, 0, 0, oldSize);`,
    related: ["glBufferSubData", "glBufferData", "glMapBufferRange"],
    khronos: `${KHR}glCopyBufferSubData.xhtml`,
  },
  {
    name: "glGetBufferSubData",
    category: "buffers",
    since: "GL 1.5",
    signature: "void glGetBufferSubData(GLenum target, GLintptr offset, GLsizeiptr size, void *data);",
    summary: {
      en: "Copies bytes from a GPU buffer back into CPU memory.",
      pt: "Copia bytes de um buffer da GPU de volta para a memória da CPU.",
    },
    description: {
      en: "The reverse of glBufferSubData: it reads size bytes starting at offset from the bound buffer into data. Mostly used to read results produced by compute shaders or transform feedback.\n\nThe call waits until the GPU has finished every command that writes to the buffer, so it can be slow — avoid it in the middle of a frame.",
      pt: "O inverso de glBufferSubData: lê size bytes a partir de offset do buffer ligado para data. Usado principalmente para ler resultados de compute shaders ou transform feedback.\n\nA chamada espera a GPU terminar todos os comandos que escrevem no buffer, então pode ser lenta — evite no meio de um frame.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "Slot whose bound buffer is read.", pt: "Slot cujo buffer ligado é lido." } },
      { name: "offset", type: "GLintptr", desc: { en: "First byte to read.", pt: "Primeiro byte a ler." } },
      { name: "size", type: "GLsizeiptr", desc: { en: "Number of bytes to read.", pt: "Número de bytes a ler." } },
      { name: "data", type: "void *", desc: { en: "Destination in CPU memory, at least size bytes.", pt: "Destino na memória da CPU, com pelo menos size bytes." } },
    ],
    notes: [
      { en: "After a compute shader writes to an SSBO, call glMemoryBarrier(GL_BUFFER_UPDATE_BARRIER_BIT) before reading it back.", pt: "Depois que um compute shader escreve em um SSBO, chame glMemoryBarrier(GL_BUFFER_UPDATE_BARRIER_BIT) antes de ler de volta." },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "The range is outside the buffer.", pt: "O intervalo está fora do buffer." } },
    ],
    example: `std::vector<float> result(count);
glMemoryBarrier(GL_BUFFER_UPDATE_BARRIER_BIT);
glBindBuffer(GL_SHADER_STORAGE_BUFFER, ssbo);
glGetBufferSubData(GL_SHADER_STORAGE_BUFFER, 0, count * sizeof(float), result.data());`,
    related: ["glBufferSubData", "glMemoryBarrier", "glDispatchCompute"],
    khronos: `${KHR}glGetBufferSubData.xhtml`,
  },
  {
    name: "glDeleteBuffers",
    category: "buffers",
    since: "GL 1.5",
    signature: "void glDeleteBuffers(GLsizei n, const GLuint *buffers);",
    summary: {
      en: "Destroys buffer objects and frees their GPU memory.",
      pt: "Destrói buffer objects e libera a memória deles na GPU.",
    },
    description: {
      en: "Releases the IDs and the storage of n buffers. If a deleted buffer is currently bound, it is unbound (the slot goes back to 0).\n\nIn C++ this belongs in a destructor: an RAII wrapper around the buffer ID makes leaks impossible.",
      pt: "Libera os IDs e o armazenamento de n buffers. Se um buffer deletado estiver ligado, o bind é desfeito (o slot volta para 0).\n\nEm C++ isso pertence a um destrutor: um wrapper RAII em volta do ID torna vazamentos impossíveis.",
    },
    params: [
      { name: "n", type: "GLsizei", desc: { en: "Number of buffers to delete.", pt: "Número de buffers a deletar." } },
      { name: "buffers", type: "const GLuint *", desc: { en: "Array of IDs. Zeros and unknown IDs are silently ignored.", pt: "Array de IDs. Zeros e IDs desconhecidos são ignorados silenciosamente." } },
    ],
    notes: [
      { en: "Deleting requires a valid OpenGL context — do it before destroying the window.", pt: "Deletar exige um contexto OpenGL válido — faça isso antes de destruir a janela." },
    ],
    errors: [{ code: "GL_INVALID_VALUE", when: { en: "n is negative.", pt: "n é negativo." } }],
    example: `glDeleteBuffers(1, &vbo);
glDeleteBuffers(1, &ebo);`,
    related: ["glGenBuffers", "glCreateBuffers", "glDeleteVertexArrays"],
    khronos: `${KHR}glDeleteBuffers.xhtml`,
  },
  {
    name: "glBindBufferBase",
    category: "buffers",
    since: "GL 3.0",
    signature: "void glBindBufferBase(GLenum target, GLuint index, GLuint buffer);",
    summary: {
      en: "Connects a whole buffer to a numbered binding point that shaders read from.",
      pt: "Conecta um buffer inteiro a um binding point numerado que os shaders leem.",
    },
    description: {
      en: "Uniform buffers and shader storage buffers are not attached to a program directly. Instead there is a numbered list of binding points per target; the shader says \"my block uses binding 2\" and your C++ code puts a buffer at binding 2.\n\nglBindBufferBase fills one of those numbered points with the entire buffer. It also binds the buffer to the generic target, like glBindBuffer would.",
      pt: "Uniform buffers e shader storage buffers não são ligados diretamente ao programa. Existe uma lista numerada de binding points por target; o shader diz \"meu bloco usa o binding 2\" e o seu código C++ coloca um buffer no binding 2.\n\nglBindBufferBase preenche um desses pontos numerados com o buffer inteiro. Ele também faz o bind no target genérico, como glBindBuffer faria.",
    },
    params: [
      {
        name: "target", type: "GLenum",
        desc: { en: "Which list of binding points.", pt: "Qual lista de binding points." },
        values: [
          { name: "GL_UNIFORM_BUFFER", desc: { en: "Uniform blocks (read-only, small).", pt: "Uniform blocks (somente leitura, pequenos)." } },
          { name: "GL_SHADER_STORAGE_BUFFER", desc: { en: "SSBOs (read/write, large).", pt: "SSBOs (leitura/escrita, grandes)." } },
          { name: "GL_ATOMIC_COUNTER_BUFFER", desc: { en: "Atomic counters.", pt: "Contadores atômicos." } },
          { name: "GL_TRANSFORM_FEEDBACK_BUFFER", desc: { en: "Transform feedback output.", pt: "Saída de transform feedback." } },
        ],
      },
      { name: "index", type: "GLuint", desc: { en: "Binding point number — must match layout(binding = N) in the shader.", pt: "Número do binding point — deve bater com layout(binding = N) no shader." } },
      { name: "buffer", type: "GLuint", desc: { en: "Buffer to attach.", pt: "Buffer a conectar." } },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "index is greater than or equal to the maximum number of binding points for target.", pt: "index é maior ou igual ao número máximo de binding points do target." } },
    ],
    example: `// GLSL: layout(std140, binding = 0) uniform Camera { mat4 projection; mat4 view; };
glBindBufferBase(GL_UNIFORM_BUFFER, 0, uboCamera);`,
    related: ["glBindBufferRange", "glUniformBlockBinding", "glBindBuffer"],
    khronos: `${KHR}glBindBufferBase.xhtml`,
  },
  {
    name: "glBindBufferRange",
    category: "buffers",
    since: "GL 3.0",
    signature: "void glBindBufferRange(GLenum target, GLuint index, GLuint buffer, GLintptr offset, GLsizeiptr size);",
    summary: {
      en: "Connects only a slice of a buffer to a numbered binding point.",
      pt: "Conecta só um pedaço de um buffer a um binding point numerado.",
    },
    description: {
      en: "Same idea as glBindBufferBase, but the shader only sees size bytes starting at offset. This lets one big buffer hold data for many objects, each draw pointing a binding at a different slice.",
      pt: "Mesma ideia de glBindBufferBase, mas o shader só enxerga size bytes a partir de offset. Isso permite que um buffer grande guarde dados de vários objetos, com cada draw apontando o binding para um pedaço diferente.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "GL_UNIFORM_BUFFER, GL_SHADER_STORAGE_BUFFER, etc.", pt: "GL_UNIFORM_BUFFER, GL_SHADER_STORAGE_BUFFER, etc." } },
      { name: "index", type: "GLuint", desc: { en: "Binding point number.", pt: "Número do binding point." } },
      { name: "buffer", type: "GLuint", desc: { en: "Buffer to attach.", pt: "Buffer a conectar." } },
      { name: "offset", type: "GLintptr", desc: { en: "Start of the slice in bytes.", pt: "Início do pedaço em bytes." } },
      { name: "size", type: "GLsizeiptr", desc: { en: "Size of the slice in bytes.", pt: "Tamanho do pedaço em bytes." } },
    ],
    notes: [
      { en: "For uniform buffers, offset must be a multiple of GL_UNIFORM_BUFFER_OFFSET_ALIGNMENT (often 256). Query it with glGetIntegerv.", pt: "Para uniform buffers, offset deve ser múltiplo de GL_UNIFORM_BUFFER_OFFSET_ALIGNMENT (geralmente 256). Consulte com glGetIntegerv." },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "size ≤ 0, or offset is not correctly aligned.", pt: "size ≤ 0, ou offset não está alinhado corretamente." } },
    ],
    example: `GLint align = 0;
glGetIntegerv(GL_UNIFORM_BUFFER_OFFSET_ALIGNMENT, &align);
// Object i lives at i * align inside one big UBO
glBindBufferRange(GL_UNIFORM_BUFFER, 1, uboObjects, i * align, sizeof(ObjectData));`,
    related: ["glBindBufferBase", "glGetIntegerv"],
    khronos: `${KHR}glBindBufferRange.xhtml`,
  },
];
