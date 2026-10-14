// src/lib/reference/opengl/drawingAdvanced.ts
// More of the "drawing" category: base instance, indirect and multi-draw
// commands (the GPU-driven path), and tessellation patches.
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

const ELEMENTS_CMD = `struct DrawElementsIndirectCommand {
    GLuint count;          // indices to draw
    GLuint instanceCount;  // copies (0 = skip this draw)
    GLuint firstIndex;     // first index in the element buffer
    GLint  baseVertex;     // added to every index
    GLuint baseInstance;   // first instance for per-instance attributes
};`;

export const drawingAdvancedEntries: RefEntry[] = [
  {
    name: "glDrawArraysInstancedBaseInstance",
    category: "drawing",
    since: "GL 4.2",
    signature: "void glDrawArraysInstancedBaseInstance(GLenum mode, GLint first, GLsizei count,\n                                       GLsizei instancecount, GLuint baseinstance);",
    summary: {
      en: "Instanced glDrawArrays whose per-instance attributes start at element baseinstance instead of 0.",
      pt: "glDrawArrays com instâncias cujos atributos por instância começam no elemento baseinstance em vez de 0.",
    },
    description: {
      en: "Per-instance attributes (divisor 1) normally read element 0 for the first instance. With baseinstance = 100 they read element 100, 101, … So many groups of instances can share one big per-instance buffer, each draw pointing at its own slice, with no rebinding between draws.",
      pt: "Os atributos por instância (divisor 1) normalmente leem o elemento 0 na primeira instância. Com baseinstance = 100 eles leem o elemento 100, 101, … Assim vários grupos de instâncias podem dividir um grande buffer por instância, cada chamada apontando para a sua fatia, sem refazer bindings entre as chamadas.",
    },
    params: [
      { name: "mode", type: "GLenum", desc: { en: "Primitive type, e.g. GL_TRIANGLES.", pt: "Tipo de primitiva, por exemplo GL_TRIANGLES." } },
      { name: "first", type: "GLint", desc: { en: "First vertex.", pt: "Primeiro vértice." } },
      { name: "count", type: "GLsizei", desc: { en: "Vertices per instance.", pt: "Vértices por instância." } },
      { name: "instancecount", type: "GLsizei", desc: { en: "Number of instances.", pt: "Número de instâncias." } },
      { name: "baseinstance", type: "GLuint", desc: { en: "Offset added when fetching per-instance attributes.", pt: "Deslocamento somado ao buscar atributos por instância." } },
    ],
    notes: [
      { en: "gl_InstanceID in the shader still counts from 0; the offset is in gl_BaseInstance (GL 4.6).", pt: "gl_InstanceID no shader continua contando a partir de 0; o deslocamento está em gl_BaseInstance (GL 4.6)." },
    ],
    example: `// trees use instances 0..299 of the shared buffer, rocks 300..419
glDrawArraysInstancedBaseInstance(GL_TRIANGLES, 0, treeVerts, 300, 0);
glDrawArraysInstancedBaseInstance(GL_TRIANGLES, treeVerts, rockVerts, 120, 300);`,
    related: ["glDrawArraysInstanced", "glVertexAttribDivisor", "glMultiDrawElementsIndirect"],
    khronos: `${KHR}glDrawArraysInstancedBaseInstance.xhtml`,
  },
  {
    name: "glDrawArraysIndirect",
    category: "drawing",
    since: "GL 4.0",
    signature: "void glDrawArraysIndirect(GLenum mode, const void *indirect);",
    summary: {
      en: "glDrawArrays whose counts are read from a GPU buffer, so a shader can decide how much to draw.",
      pt: "glDrawArrays cujas contagens são lidas de um buffer na GPU, assim um shader pode decidir quanto desenhar.",
    },
    description: {
      en: "Instead of passing count and instance count as arguments, you put them in a buffer bound to GL_DRAW_INDIRECT_BUFFER:\n\nstruct { GLuint count, instanceCount, first, baseInstance; };\n\nThe point is who writes them. A compute shader that simulates particles knows how many are alive; it writes that number into the command, and the draw uses it without the CPU ever reading it back (which would stall).",
      pt: "Em vez de passar count e o número de instâncias como argumentos, você os coloca num buffer ligado a GL_DRAW_INDIRECT_BUFFER:\n\nstruct { GLuint count, instanceCount, first, baseInstance; };\n\nA graça está em quem escreve. Um compute shader que simula partículas sabe quantas estão vivas; ele escreve esse número no comando, e o desenho o usa sem a CPU nunca precisar lê-lo de volta (o que travaria).",
    },
    params: [
      { name: "mode", type: "GLenum", desc: { en: "Primitive type.", pt: "Tipo de primitiva." } },
      { name: "indirect", type: "const void *", desc: { en: "Byte offset of the command inside the GL_DRAW_INDIRECT_BUFFER, cast to a pointer.", pt: "Offset em bytes do comando dentro do GL_DRAW_INDIRECT_BUFFER, convertido para ponteiro." } },
    ],
    notes: [
      { en: "Between the compute dispatch and the draw, call glMemoryBarrier(GL_COMMAND_BARRIER_BIT) so the draw sees the new counts.", pt: "Entre o dispatch do compute e o desenho, chame glMemoryBarrier(GL_COMMAND_BARRIER_BIT) para o desenho ver as contagens novas." },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "No buffer bound to GL_DRAW_INDIRECT_BUFFER, or the command goes past its end.", pt: "Nenhum buffer ligado a GL_DRAW_INDIRECT_BUFFER, ou o comando passa do fim dele." } },
    ],
    example: `glDispatchCompute(groups, 1, 1);               // writes alive count into cmdBuffer
glMemoryBarrier(GL_COMMAND_BARRIER_BIT);
glBindBuffer(GL_DRAW_INDIRECT_BUFFER, cmdBuffer);
glDrawArraysIndirect(GL_POINTS, nullptr);`,
    related: ["glDrawArrays", "glMultiDrawElementsIndirect", "glMemoryBarrier", "glDispatchCompute"],
    khronos: `${KHR}glDrawArraysIndirect.xhtml`,
  },
  {
    name: "glMultiDrawElementsIndirect",
    category: "drawing",
    since: "GL 4.3",
    signature: "void glMultiDrawElementsIndirect(GLenum mode, GLenum type, const void *indirect,\n                                 GLsizei drawcount, GLsizei stride);",
    summary: {
      en: "Runs many indexed draws, each described by a command in a GPU buffer, in one call.",
      pt: "Executa muitos desenhos indexados, cada um descrito por um comando num buffer da GPU, numa só chamada.",
    },
    description: {
      en: "The core of a GPU-driven renderer. Put every mesh's vertices and indices in shared buffers, write one command per object into a GL_DRAW_INDIRECT_BUFFER, and a single call draws them all:\n\n" + ELEMENTS_CMD + "\n\nThe CPU cost becomes one call instead of thousands. A culling compute shader can set instanceCount to 0 for objects outside the view, and the shader tells draws apart with gl_DrawID to fetch each object's matrix and material.",
      pt: "O núcleo de um renderizador guiado pela GPU. Ponha os vértices e índices de todas as malhas em buffers compartilhados, escreva um comando por objeto num GL_DRAW_INDIRECT_BUFFER, e uma única chamada desenha todos:\n\n" + ELEMENTS_CMD + "\n\nO custo na CPU vira uma chamada em vez de milhares. Um compute shader de culling pode pôr instanceCount em 0 nos objetos fora da visão, e o shader distingue os desenhos com gl_DrawID para buscar a matriz e o material de cada objeto.",
    },
    params: [
      { name: "mode", type: "GLenum", desc: { en: "Primitive type.", pt: "Tipo de primitiva." } },
      { name: "type", type: "GLenum", desc: { en: "Index type: GL_UNSIGNED_INT or GL_UNSIGNED_SHORT.", pt: "Tipo dos índices: GL_UNSIGNED_INT ou GL_UNSIGNED_SHORT." } },
      { name: "indirect", type: "const void *", desc: { en: "Byte offset of the first command in the indirect buffer.", pt: "Offset em bytes do primeiro comando no indirect buffer." } },
      { name: "drawcount", type: "GLsizei", desc: { en: "Number of commands.", pt: "Número de comandos." } },
      { name: "stride", type: "GLsizei", desc: { en: "Bytes between commands; 0 = tightly packed (20 bytes each).", pt: "Bytes entre comandos; 0 = colados (20 bytes cada)." } },
    ],
    notes: [
      { en: "gl_DrawID (GL 4.6, or ARB_shader_draw_parameters) gives the index of the current command in the shader.", pt: "gl_DrawID (GL 4.6, ou ARB_shader_draw_parameters) dá ao shader o índice do comando atual." },
      { en: "All draws share the same VAO, program and textures; use bindless textures or texture arrays to vary materials.", pt: "Todos os desenhos dividem o mesmo VAO, programa e texturas; use texturas bindless ou texture arrays para variar os materiais." },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "No indirect buffer bound, or the commands go past its end.", pt: "Nenhum indirect buffer ligado, ou os comandos passam do fim dele." } },
      { code: "GL_INVALID_VALUE", when: { en: "drawcount is negative, or stride is not a multiple of 4.", pt: "drawcount é negativo, ou stride não é múltiplo de 4." } },
    ],
    example: `glBindVertexArray(sharedVao);
glBindBuffer(GL_DRAW_INDIRECT_BUFFER, cmdBuffer);
glMultiDrawElementsIndirect(GL_TRIANGLES, GL_UNSIGNED_INT, nullptr,
                            GLsizei(cmds.size()), 0);`,
    related: ["glDrawElements", "glMultiDrawElementsIndirectCount", "glDrawArraysIndirect", "glDrawElementsInstanced"],
    khronos: `${KHR}glMultiDrawElementsIndirect.xhtml`,
  },
  {
    name: "glMultiDrawElementsIndirectCount",
    category: "drawing",
    since: "GL 4.6",
    signature: "void glMultiDrawElementsIndirectCount(GLenum mode, GLenum type, const void *indirect,\n                                      GLintptr drawcount, GLsizei maxdrawcount, GLsizei stride);",
    summary: {
      en: "glMultiDrawElementsIndirect where the number of draws is also read from a GPU buffer.",
      pt: "glMultiDrawElementsIndirect em que o número de desenhos também é lido de um buffer da GPU.",
    },
    description: {
      en: "With glMultiDrawElementsIndirect the CPU still passes drawcount. Here a culling shader can compact the visible objects' commands to the front of the buffer and write how many there are; the draw reads that count from the buffer bound to GL_PARAMETER_BUFFER. Nothing about the visible set goes back to the CPU.",
      pt: "Com glMultiDrawElementsIndirect a CPU ainda passa drawcount. Aqui um shader de culling pode juntar os comandos dos objetos visíveis no começo do buffer e escrever quantos são; o desenho lê essa contagem do buffer ligado a GL_PARAMETER_BUFFER. Nada sobre o conjunto visível volta para a CPU.",
    },
    params: [
      { name: "mode, type", type: "GLenum", desc: { en: "As in glMultiDrawElementsIndirect.", pt: "Como em glMultiDrawElementsIndirect." } },
      { name: "indirect", type: "const void *", desc: { en: "Offset of the first command.", pt: "Offset do primeiro comando." } },
      { name: "drawcount", type: "GLintptr", desc: { en: "Byte OFFSET of a GLuint count in the GL_PARAMETER_BUFFER (not the count itself).", pt: "OFFSET em bytes de um GLuint de contagem no GL_PARAMETER_BUFFER (não a contagem em si)." } },
      { name: "maxdrawcount", type: "GLsizei", desc: { en: "Upper limit, in case the count in the buffer is larger.", pt: "Limite superior, caso a contagem no buffer seja maior." } },
      { name: "stride", type: "GLsizei", desc: { en: "Bytes between commands; 0 = tightly packed.", pt: "Bytes entre comandos; 0 = colados." } },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "No buffer bound to GL_PARAMETER_BUFFER or GL_DRAW_INDIRECT_BUFFER.", pt: "Nenhum buffer ligado a GL_PARAMETER_BUFFER ou GL_DRAW_INDIRECT_BUFFER." } },
      { code: "GL_INVALID_VALUE", when: { en: "drawcount is not a multiple of 4.", pt: "drawcount não é múltiplo de 4." } },
    ],
    example: `glBindBuffer(GL_DRAW_INDIRECT_BUFFER, visibleCmds);
glBindBuffer(GL_PARAMETER_BUFFER, visibleCount);
glMultiDrawElementsIndirectCount(GL_TRIANGLES, GL_UNSIGNED_INT, nullptr,
                                 0, maxObjects, 0);`,
    related: ["glMultiDrawElementsIndirect", "glMemoryBarrier", "glDispatchCompute"],
    khronos: `${KHR}glMultiDrawElementsIndirect.xhtml`,
  },
  {
    name: "glPatchParameteri",
    category: "drawing",
    since: "GL 4.0",
    signature: "void glPatchParameteri(GLenum pname, GLint value);",
    summary: {
      en: "Sets how many vertices make one patch, the primitive that tessellation shaders work on.",
      pt: "Define quantos vértices formam um patch, a primitiva com que os shaders de tesselação trabalham.",
    },
    description: {
      en: "With tessellation shaders in the program you draw with mode GL_PATCHES, and the vertices are grouped into patches of this size instead of triangles. A terrain made of quads uses 4; a curved surface from a 4×4 Bézier grid uses 16. The tessellation control shader receives exactly that many vertices in gl_in.",
      pt: "Com shaders de tesselação no programa você desenha com o modo GL_PATCHES, e os vértices são agrupados em patches deste tamanho em vez de triângulos. Um terreno feito de quads usa 4; uma superfície curva de uma grade de Bézier 4×4 usa 16. O tessellation control shader recebe exatamente esse número de vértices em gl_in.",
    },
    params: [
      { name: "pname", type: "GLenum", desc: { en: "GL_PATCH_VERTICES.", pt: "GL_PATCH_VERTICES." } },
      { name: "value", type: "GLint", desc: { en: "Vertices per patch: default 3, up to GL_MAX_PATCH_VERTICES (at least 32).", pt: "Vértices por patch: padrão 3, até GL_MAX_PATCH_VERTICES (pelo menos 32)." } },
    ],
    notes: [
      { en: "Drawing GL_PATCHES without tessellation shaders, or GL_TRIANGLES with them, is GL_INVALID_OPERATION.", pt: "Desenhar GL_PATCHES sem shaders de tesselação, ou GL_TRIANGLES com eles, é GL_INVALID_OPERATION." },
      { en: "count in the draw call should be a multiple of the patch size.", pt: "O count da chamada de desenho deve ser múltiplo do tamanho do patch." },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "value is 0 or larger than GL_MAX_PATCH_VERTICES.", pt: "value é 0 ou maior que GL_MAX_PATCH_VERTICES." } },
    ],
    example: `glPatchParameteri(GL_PATCH_VERTICES, 4);   // one quad per patch
glDrawArrays(GL_PATCHES, 0, 4 * patchCount);`,
    related: ["glDrawArrays", "glDrawElements"],
    khronos: `${KHR}glPatchParameter.xhtml`,
  },
];
