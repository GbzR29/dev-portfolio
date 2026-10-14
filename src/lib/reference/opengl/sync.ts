// src/lib/reference/opengl/sync.ts
// "sync" category, part 1: fences and glFinish — knowing when the GPU is done.
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

export const syncEntries: RefEntry[] = [
  {
    name: "glFenceSync",
    category: "sync",
    since: "GL 3.2",
    signature: "GLsync glFenceSync(GLenum condition, GLbitfield flags);",
    summary: {
      en: "Drops a marker into the command stream that becomes signalled when the GPU has executed everything before it.",
      pt: "Coloca um marcador na fila de comandos que fica sinalizado quando a GPU executou tudo o que veio antes dele.",
    },
    description: {
      en: "OpenGL calls return long before the GPU runs them; the CPU is usually a frame or two ahead. A fence is how you find out that the GPU has caught up to a point: insert one after the commands you care about, and later ask glClientWaitSync whether it is signalled.\n\nTwo common uses: before the CPU overwrites a region of a persistently mapped buffer (wait for the fence placed after the draw that read it), and before mapping a pixel buffer filled by glReadPixels.",
      pt: "As chamadas do OpenGL voltam muito antes de a GPU executá-las; a CPU costuma estar um ou dois frames à frente. Uma fence é como você descobre que a GPU alcançou um ponto: insira uma depois dos comandos que importam e depois pergunte a glClientWaitSync se ela já foi sinalizada.\n\nDois usos comuns: antes de a CPU sobrescrever uma região de um buffer mapeado de forma persistente (espere a fence colocada depois do desenho que o leu), e antes de mapear um pixel buffer preenchido por glReadPixels.",
    },
    params: [
      { name: "condition", type: "GLenum", desc: { en: "Always GL_SYNC_GPU_COMMANDS_COMPLETE.", pt: "Sempre GL_SYNC_GPU_COMMANDS_COMPLETE." } },
      { name: "flags", type: "GLbitfield", desc: { en: "Must be 0.", pt: "Deve ser 0." } },
    ],
    returns: {
      en: "A GLsync handle (an opaque pointer), or 0 on error. Delete it with glDeleteSync when done.",
      pt: "Um handle GLsync (um ponteiro opaco), ou 0 em caso de erro. Apague com glDeleteSync quando terminar.",
    },
    notes: [
      { en: "A fence is used once: after it signals, delete it and create a new one for the next frame.", pt: "Uma fence serve uma vez: depois que ela sinaliza, apague e crie outra para o próximo frame." },
    ],
    errors: [
      { code: "GL_INVALID_ENUM", when: { en: "condition is not GL_SYNC_GPU_COMMANDS_COMPLETE.", pt: "condition não é GL_SYNC_GPU_COMMANDS_COMPLETE." } },
      { code: "GL_INVALID_VALUE", when: { en: "flags is not 0.", pt: "flags não é 0." } },
    ],
    example: `drawWithRegion(k);                     // GPU reads region k
fence[k] = glFenceSync(GL_SYNC_GPU_COMMANDS_COMPLETE, 0);`,
    related: ["glClientWaitSync", "glDeleteSync", "glFinish", "glMapNamedBufferRange"],
    khronos: `${KHR}glFenceSync.xhtml`,
  },
  {
    name: "glClientWaitSync",
    category: "sync",
    since: "GL 3.2",
    signature: "GLenum glClientWaitSync(GLsync sync, GLbitfield flags, GLuint64 timeout);",
    summary: {
      en: "Makes the CPU wait (up to a timeout) until a fence is signalled, or just checks it with timeout 0.",
      pt: "Faz a CPU esperar (até um limite de tempo) que uma fence seja sinalizada, ou só verifica com timeout 0.",
    },
    description: {
      en: "Blocks the calling thread until the fence signals or timeout nanoseconds pass. With a ring of three regions the fence is almost always signalled already, so the wait costs nothing; if it is not, the wait is the right thing to do, because the GPU is still reading the memory you want to change.\n\nWith timeout 0 it does not wait at all: a cheap way to poll, for example to check whether a readback is ready before mapping it.",
      pt: "Bloqueia a thread até a fence sinalizar ou passarem timeout nanossegundos. Com um anel de três regiões a fence quase sempre já está sinalizada, então a espera não custa nada; se não estiver, esperar é o certo, porque a GPU ainda está lendo a memória que você quer mudar.\n\nCom timeout 0 ela não espera: um jeito barato de consultar, por exemplo para saber se uma leitura de volta está pronta antes de mapear.",
    },
    params: [
      { name: "sync", type: "GLsync", desc: { en: "The fence from glFenceSync.", pt: "A fence de glFenceSync." } },
      { name: "flags", type: "GLbitfield", desc: { en: "GL_SYNC_FLUSH_COMMANDS_BIT (recommended) or 0.", pt: "GL_SYNC_FLUSH_COMMANDS_BIT (recomendado) ou 0." } },
      { name: "timeout", type: "GLuint64", desc: { en: "Maximum wait in nanoseconds (1'000'000 = 1 ms). 0 = just check.", pt: "Espera máxima em nanossegundos (1'000'000 = 1 ms). 0 = só verificar." } },
    ],
    returns: {
      en: "GL_ALREADY_SIGNALED (it was done before the call), GL_CONDITION_SATISFIED (it became done during the wait), GL_TIMEOUT_EXPIRED (still not done), or GL_WAIT_FAILED (an error).",
      pt: "GL_ALREADY_SIGNALED (já estava pronta antes da chamada), GL_CONDITION_SATISFIED (ficou pronta durante a espera), GL_TIMEOUT_EXPIRED (ainda não terminou) ou GL_WAIT_FAILED (um erro).",
    },
    notes: [
      { en: "Without GL_SYNC_FLUSH_COMMANDS_BIT the fence may still be sitting in a driver queue that was never sent to the GPU, and the wait can last until the timeout.", pt: "Sem GL_SYNC_FLUSH_COMMANDS_BIT a fence pode estar parada numa fila do driver que nunca foi enviada à GPU, e a espera pode durar até o timeout." },
      { en: "glWaitSync is the GPU-side version: it makes the GPU, not the CPU, wait (useful between two contexts).", pt: "glWaitSync é a versão do lado da GPU: faz a GPU, não a CPU, esperar (útil entre dois contextos)." },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "sync is not a fence, or flags has unknown bits.", pt: "sync não é uma fence, ou flags tem bits desconhecidos." } },
    ],
    example: `if (fence[k]) {
    while (glClientWaitSync(fence[k], GL_SYNC_FLUSH_COMMANDS_BIT, 1'000'000) == GL_TIMEOUT_EXPIRED) {}
    glDeleteSync(fence[k]);
}
memcpy(mapped + k * regionSize, data, regionSize);   // safe now`,
    related: ["glFenceSync", "glDeleteSync", "glMapNamedBufferRange"],
    khronos: `${KHR}glClientWaitSync.xhtml`,
  },
  {
    name: "glDeleteSync",
    category: "sync",
    since: "GL 3.2",
    signature: "void glDeleteSync(GLsync sync);",
    summary: {
      en: "Frees a fence created by glFenceSync.",
      pt: "Libera uma fence criada por glFenceSync.",
    },
    description: {
      en: "Fences are small but not free; creating one per frame without deleting it leaks driver memory. Delete a fence once you have waited for it. Deleting one that has not signalled yet is allowed: it is freed when the GPU reaches it.",
      pt: "Fences são pequenas, mas não de graça; criar uma por frame sem apagar vaza memória do driver. Apague a fence depois de esperar por ela. Apagar uma que ainda não sinalizou é permitido: ela é liberada quando a GPU chegar nela.",
    },
    params: [
      { name: "sync", type: "GLsync", desc: { en: "The fence (0 is silently ignored).", pt: "A fence (0 é ignorado sem erro)." } },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "sync is neither 0 nor a fence.", pt: "sync não é 0 nem uma fence." } },
    ],
    example: `glDeleteSync(fence[k]);
fence[k] = nullptr;`,
    related: ["glFenceSync", "glClientWaitSync"],
    khronos: `${KHR}glDeleteSync.xhtml`,
  },
  {
    name: "glFinish",
    category: "sync",
    since: "GL 1.0",
    signature: "void glFinish(void);",
    summary: {
      en: "Blocks the CPU until the GPU has completely executed every command issued so far.",
      pt: "Bloqueia a CPU até a GPU executar completamente todos os comandos enviados até agora.",
    },
    description: {
      en: "The blunt instrument: CPU and GPU stop overlapping until everything is done. That kills the parallelism that keeps frames fast, so it does not belong in a render loop.\n\nIt is still handy in two places: crude timing while learning (glFinish before reading the clock makes the time include the GPU's work), and isolating a crash or corruption to a specific draw while debugging. For real GPU timings use timer queries; for waiting on specific work use fences.",
      pt: "O instrumento bruto: CPU e GPU param de trabalhar em paralelo até tudo terminar. Isso mata o paralelismo que mantém os frames rápidos, então não pertence a um laço de renderização.\n\nAinda é útil em dois lugares: medições grosseiras enquanto se aprende (glFinish antes de ler o relógio faz o tempo incluir o trabalho da GPU) e, na depuração, isolar um travamento ou corrupção numa chamada de desenho específica. Para tempos reais da GPU use timer queries; para esperar um trabalho específico use fences.",
    },
    params: [],
    notes: [
      { en: "glFlush only sends the queued commands to the GPU without waiting; glFinish sends and waits.", pt: "glFlush só envia os comandos da fila à GPU sem esperar; glFinish envia e espera." },
    ],
    example: `auto t0 = clock::now();
drawScene();
glFinish();                         // include the GPU's work in the time
auto ms = elapsedMs(t0);`,
    related: ["glFenceSync", "glBeginQuery", "glQueryCounter"],
    khronos: `${KHR}glFinish.xhtml`,
  },
];
