// src/lib/reference/opengl/queries.ts
// "sync" category, part 2: query objects — GPU timers, occlusion queries and
// conditional rendering.
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

const QUERY_TARGETS = [
  { name: "GL_TIME_ELAPSED", desc: { en: "GPU time between begin and end, in nanoseconds.", pt: "Tempo da GPU entre begin e end, em nanossegundos." } },
  { name: "GL_SAMPLES_PASSED", desc: { en: "How many samples passed the depth test.", pt: "Quantas amostras passaram no depth test." } },
  { name: "GL_ANY_SAMPLES_PASSED / _CONSERVATIVE", desc: { en: "Just whether any did (0 or 1); the conservative one may say 1 when unsure, and is faster.", pt: "Só se alguma passou (0 ou 1); a conservative pode dizer 1 na dúvida, e é mais rápida." } },
  { name: "GL_PRIMITIVES_GENERATED", desc: { en: "Primitives that left the geometry stage.", pt: "Primitivas que saíram do estágio de geometria." } },
];

export const queryEntries: RefEntry[] = [
  {
    name: "glGenQueries",
    category: "sync",
    since: "GL 1.5",
    signature: "void glGenQueries(GLsizei n, GLuint *ids);",
    summary: {
      en: "Reserves names for query objects, which ask the GPU to measure something (time, visible samples).",
      pt: "Reserva nomes para query objects, que pedem à GPU para medir algo (tempo, amostras visíveis).",
    },
    description: {
      en: "A query is a question you ask the GPU while it works: how long did this take, did any pixel of this box survive the depth test. The answer arrives later, usually a frame or two, because the GPU runs behind the CPU. So you keep a small ring of queries (3 or 4) and read the oldest one each frame.",
      pt: "Uma query é uma pergunta que você faz à GPU enquanto ela trabalha: quanto tempo isto levou, algum pixel desta caixa sobreviveu ao depth test. A resposta chega depois, normalmente um ou dois frames, porque a GPU roda atrás da CPU. Por isso você mantém um pequeno anel de queries (3 ou 4) e lê a mais antiga a cada frame.",
    },
    params: [
      { name: "n", type: "GLsizei", desc: { en: "How many.", pt: "Quantas." } },
      { name: "ids", type: "GLuint *", desc: { en: "Array receiving the names.", pt: "Array que recebe os nomes." } },
    ],
    notes: [
      { en: "The DSA form glCreateQueries(target, n, ids) creates the objects at once and fixes their target.", pt: "A forma DSA glCreateQueries(target, n, ids) cria os objetos na hora e fixa o target deles." },
      { en: "Free them with glDeleteQueries.", pt: "Libere com glDeleteQueries." },
    ],
    example: `const int N = 4;
GLuint q[N];
glGenQueries(N, q);`,
    related: ["glBeginQuery", "glQueryCounter", "glGetQueryObjectui64v"],
    khronos: `${KHR}glGenQueries.xhtml`,
  },
  {
    name: "glBeginQuery",
    category: "sync",
    since: "GL 1.5",
    signature: "void glBeginQuery(GLenum target, GLuint id);",
    summary: {
      en: "Starts measuring: everything drawn until glEndQuery is counted (or timed) by query id.",
      pt: "Começa a medir: tudo o que for desenhado até glEndQuery é contado (ou cronometrado) pela query id.",
    },
    description: {
      en: "Wrap the work you want to measure between glBeginQuery and glEndQuery with the same target. Only one query per target can be active at a time, so timer queries cannot be nested; for nested or many timings use pairs of glQueryCounter timestamps instead.\n\nAn occlusion query draws something cheap (an object's bounding box, with colour and depth writes off) and counts how many samples pass the depth test. Zero means the real object is completely hidden and need not be drawn.",
      pt: "Envolva o trabalho que quer medir entre glBeginQuery e glEndQuery com o mesmo target. Só uma query por target pode estar ativa por vez, então timer queries não podem ser aninhadas; para medições aninhadas ou muitas use pares de timestamps com glQueryCounter.\n\nUma occlusion query desenha algo barato (a caixa envolvente de um objeto, com a escrita de cor e profundidade desligada) e conta quantas amostras passam no depth test. Zero significa que o objeto real está totalmente escondido e não precisa ser desenhado.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "What to measure.", pt: "O que medir." }, values: QUERY_TARGETS },
      { name: "id", type: "GLuint", desc: { en: "The query (from glGenQueries).", pt: "A query (de glGenQueries)." } },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "A query of that target is already active, or id is in use with another target.", pt: "Já há uma query desse target ativa, ou id está em uso com outro target." } },
    ],
    example: `glBeginQuery(GL_TIME_ELAPSED, q[frame % N]);
drawScene();
glEndQuery(GL_TIME_ELAPSED);`,
    related: ["glEndQuery", "glGenQueries", "glGetQueryObjectui64v", "glBeginConditionalRender"],
    khronos: `${KHR}glBeginQuery.xhtml`,
  },
  {
    name: "glEndQuery",
    category: "sync",
    since: "GL 1.5",
    signature: "void glEndQuery(GLenum target);",
    summary: {
      en: "Stops the active query of that target; its result will be available a little later.",
      pt: "Encerra a query ativa daquele target; o resultado fica disponível um pouco depois.",
    },
    description: {
      en: "Note that it takes the target, not the query id: there is only one active query per target. Right after the call the result is usually not ready; check GL_QUERY_RESULT_AVAILABLE before reading it, or read a query from a few frames ago.",
      pt: "Repare que ela recebe o target, não o id da query: só há uma query ativa por target. Logo depois da chamada o resultado normalmente não está pronto; verifique GL_QUERY_RESULT_AVAILABLE antes de ler, ou leia uma query de alguns frames atrás.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "The same target given to glBeginQuery.", pt: "O mesmo target passado a glBeginQuery." } },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "No query of that target is active.", pt: "Não há query desse target ativa." } },
    ],
    example: `glEndQuery(GL_ANY_SAMPLES_PASSED_CONSERVATIVE);`,
    related: ["glBeginQuery", "glGetQueryObjectuiv"],
    khronos: `${KHR}glBeginQuery.xhtml`,
  },
  {
    name: "glQueryCounter",
    category: "sync",
    since: "GL 3.3",
    signature: "void glQueryCounter(GLuint id, GLenum target);",
    summary: {
      en: "Records the GPU clock at the moment the GPU reaches this point in the command stream.",
      pt: "Registra o relógio da GPU no momento em que a GPU chega neste ponto da fila de comandos.",
    },
    description: {
      en: "A timestamp instead of an interval. Put one before and one after a section and subtract the two results: the GPU time of that section in nanoseconds. Unlike GL_TIME_ELAPSED, timestamps can be nested and overlapped freely, so a profiler can mark every pass of the frame (shadows, G-buffer, lighting, post) with one counter each.",
      pt: "Um carimbo de tempo em vez de um intervalo. Coloque um antes e um depois de um trecho e subtraia os dois resultados: o tempo de GPU daquele trecho em nanossegundos. Diferente de GL_TIME_ELAPSED, timestamps podem ser aninhados e sobrepostos à vontade, assim um profiler pode marcar cada passada do frame (sombras, G-buffer, iluminação, pós) com um contador cada.",
    },
    params: [
      { name: "id", type: "GLuint", desc: { en: "The query that receives the time.", pt: "A query que recebe o tempo." } },
      { name: "target", type: "GLenum", desc: { en: "Always GL_TIMESTAMP.", pt: "Sempre GL_TIMESTAMP." } },
    ],
    errors: [
      { code: "GL_INVALID_ENUM", when: { en: "target is not GL_TIMESTAMP.", pt: "target não é GL_TIMESTAMP." } },
    ],
    example: `glQueryCounter(t[0], GL_TIMESTAMP);
drawShadows();
glQueryCounter(t[1], GL_TIMESTAMP);
// frames later: shadowsNs = time(t[1]) - time(t[0])`,
    related: ["glGetQueryObjectui64v", "glBeginQuery", "glGenQueries"],
    khronos: `${KHR}glQueryCounter.xhtml`,
  },
  {
    name: "glGetQueryObjectuiv",
    category: "sync",
    since: "GL 1.5",
    signature: "void glGetQueryObjectuiv(GLuint id, GLenum pname, GLuint *params);",
    summary: {
      en: "Reads a query's state or result as a 32-bit number; mostly used to ask whether the result is ready yet.",
      pt: "Lê o estado ou o resultado de uma query como número de 32 bits; usada principalmente para saber se o resultado já está pronto.",
    },
    description: {
      en: "With GL_QUERY_RESULT_AVAILABLE it answers immediately: 1 if the result is ready, 0 if not. With GL_QUERY_RESULT it returns the result, but if the GPU has not got there yet it waits, and that wait is a full CPU–GPU stall. So check availability first, or only read queries that are a few frames old.",
      pt: "Com GL_QUERY_RESULT_AVAILABLE ela responde na hora: 1 se o resultado está pronto, 0 se não. Com GL_QUERY_RESULT ela devolve o resultado, mas se a GPU ainda não chegou lá ela espera, e essa espera é uma parada completa entre CPU e GPU. Por isso verifique a disponibilidade antes, ou só leia queries de alguns frames atrás.",
    },
    params: [
      { name: "id", type: "GLuint", desc: { en: "The query.", pt: "A query." } },
      {
        name: "pname", type: "GLenum",
        desc: { en: "What to read.", pt: "O que ler." },
        values: [
          { name: "GL_QUERY_RESULT_AVAILABLE", desc: { en: "1 if the result is ready (never waits).", pt: "1 se o resultado está pronto (nunca espera)." } },
          { name: "GL_QUERY_RESULT", desc: { en: "The result (waits if it is not ready).", pt: "O resultado (espera se não estiver pronto)." } },
          { name: "GL_QUERY_RESULT_NO_WAIT", desc: { en: "The result if ready, otherwise params is left unchanged (GL 4.4).", pt: "O resultado se estiver pronto, senão params fica como estava (GL 4.4)." } },
        ],
      },
      { name: "params", type: "GLuint *", desc: { en: "Where the value is written.", pt: "Onde o valor é escrito." } },
    ],
    notes: [
      { en: "A time in nanoseconds overflows 32 bits after about 4.3 seconds; read timer results with glGetQueryObjectui64v.", pt: "Um tempo em nanossegundos estoura 32 bits depois de cerca de 4,3 segundos; leia resultados de timer com glGetQueryObjectui64v." },
    ],
    example: `GLuint ready = 0;
glGetQueryObjectuiv(oldest, GL_QUERY_RESULT_AVAILABLE, &ready);
if (ready) { /* read it with glGetQueryObjectui64v */ }`,
    related: ["glGetQueryObjectui64v", "glBeginQuery", "glEndQuery"],
    khronos: `${KHR}glGetQueryObject.xhtml`,
  },
  {
    name: "glGetQueryObjectui64v",
    category: "sync",
    since: "GL 3.3",
    signature: "void glGetQueryObjectui64v(GLuint id, GLenum pname, GLuint64 *params);",
    summary: {
      en: "Reads a query result as a 64-bit number: the form to use for GPU times in nanoseconds.",
      pt: "Lê o resultado de uma query como número de 64 bits: a forma para tempos de GPU em nanossegundos.",
    },
    description: {
      en: "The same as glGetQueryObjectuiv with a 64-bit result, which timer and timestamp queries need. Divide by 1e6 for milliseconds. The same rule applies: GL_QUERY_RESULT waits if the result is not ready, so read queries from a ring a few frames behind.",
      pt: "O mesmo que glGetQueryObjectuiv com resultado de 64 bits, que as queries de timer e timestamp precisam. Divida por 1e6 para ter milissegundos. Vale a mesma regra: GL_QUERY_RESULT espera se o resultado não estiver pronto, então leia queries de um anel alguns frames atrás.",
    },
    params: [
      { name: "id", type: "GLuint", desc: { en: "The query.", pt: "A query." } },
      { name: "pname", type: "GLenum", desc: { en: "GL_QUERY_RESULT (or _AVAILABLE, _NO_WAIT).", pt: "GL_QUERY_RESULT (ou _AVAILABLE, _NO_WAIT)." } },
      { name: "params", type: "GLuint64 *", desc: { en: "Where the value is written.", pt: "Onde o valor é escrito." } },
    ],
    example: `// ring of N timer queries: read the one issued N-1 frames ago
GLuint oldest = q[(frame + 1) % N];
GLuint64 ns = 0;
glGetQueryObjectui64v(oldest, GL_QUERY_RESULT, &ns);
double gpuMs = ns / 1e6;`,
    related: ["glGetQueryObjectuiv", "glQueryCounter", "glBeginQuery"],
    khronos: `${KHR}glGetQueryObject.xhtml`,
  },
  {
    name: "glBeginConditionalRender",
    category: "sync",
    since: "GL 3.0",
    signature: "void glBeginConditionalRender(GLuint id, GLenum mode);",
    summary: {
      en: "Skips the following draws on the GPU if an occlusion query found no visible samples, with no CPU readback.",
      pt: "Pula os desenhos seguintes na GPU se uma occlusion query não achou amostras visíveis, sem leitura pela CPU.",
    },
    description: {
      en: "The occlusion-culling trick without the stall. Draw a bounding box inside an occlusion query, then wrap the real object in glBeginConditionalRender / glEndConditionalRender with that query. The GPU itself decides: if the box had no visible samples, the draws inside are dropped. The CPU never waits for the answer.",
      pt: "O truque de occlusion culling sem a parada. Desenhe uma caixa envolvente dentro de uma occlusion query, depois envolva o objeto real em glBeginConditionalRender / glEndConditionalRender com essa query. A própria GPU decide: se a caixa não teve amostras visíveis, os desenhos de dentro são descartados. A CPU nunca espera pela resposta.",
    },
    params: [
      { name: "id", type: "GLuint", desc: { en: "An occlusion query (GL_SAMPLES_PASSED or GL_ANY_SAMPLES_PASSED…) that has ended.", pt: "Uma occlusion query (GL_SAMPLES_PASSED ou GL_ANY_SAMPLES_PASSED…) já encerrada." } },
      {
        name: "mode", type: "GLenum",
        desc: { en: "What to do if the result is not ready yet.", pt: "O que fazer se o resultado ainda não estiver pronto." },
        values: [
          { name: "GL_QUERY_WAIT", desc: { en: "The GPU waits for the result, then decides.", pt: "A GPU espera o resultado e depois decide." } },
          { name: "GL_QUERY_NO_WAIT", desc: { en: "If not ready, draw anyway (never wrong, sometimes wasted).", pt: "Se não estiver pronto, desenha mesmo assim (nunca erra, às vezes desperdiça)." } },
          { name: "GL_QUERY_BY_REGION_WAIT / _NO_WAIT", desc: { en: "Same, letting the GPU decide per screen region.", pt: "Igual, deixando a GPU decidir por região da tela." } },
        ],
      },
    ],
    notes: [
      { en: "Conditional rendering skips draws and clears, but not state changes; nested conditional rendering is not allowed.", pt: "A renderização condicional pula desenhos e limpezas, mas não mudanças de estado; não é permitido aninhar." },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "Conditional rendering is already active, or the query is still running or is not an occlusion query.", pt: "Já há renderização condicional ativa, ou a query ainda está rodando ou não é occlusion query." } },
    ],
    example: `glColorMask(GL_FALSE, GL_FALSE, GL_FALSE, GL_FALSE);
glDepthMask(GL_FALSE);
glBeginQuery(GL_ANY_SAMPLES_PASSED_CONSERVATIVE, o.query);
drawBoundingBox(o);
glEndQuery(GL_ANY_SAMPLES_PASSED_CONSERVATIVE);
glColorMask(GL_TRUE, GL_TRUE, GL_TRUE, GL_TRUE);
glDepthMask(GL_TRUE);

glBeginConditionalRender(o.query, GL_QUERY_NO_WAIT);
drawObject(o);
glEndConditionalRender();`,
    related: ["glEndConditionalRender", "glBeginQuery", "glColorMask"],
    khronos: `${KHR}glBeginConditionalRender.xhtml`,
  },
  {
    name: "glEndConditionalRender",
    category: "sync",
    since: "GL 3.0",
    signature: "void glEndConditionalRender(void);",
    summary: {
      en: "Ends the block started by glBeginConditionalRender; later draws run normally.",
      pt: "Encerra o bloco iniciado por glBeginConditionalRender; os desenhos seguintes rodam normalmente.",
    },
    description: {
      en: "Closes the conditional block. Keep the block short, usually the draws of one object, so each object can be culled on its own.",
      pt: "Fecha o bloco condicional. Mantenha o bloco curto, normalmente os desenhos de um objeto, para cada objeto poder ser descartado sozinho.",
    },
    params: [],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "No conditional rendering is active.", pt: "Não há renderização condicional ativa." } },
    ],
    example: `glBeginConditionalRender(query, GL_QUERY_NO_WAIT);
drawObject();
glEndConditionalRender();`,
    related: ["glBeginConditionalRender", "glBeginQuery"],
    khronos: `${KHR}glBeginConditionalRender.xhtml`,
  },
];
