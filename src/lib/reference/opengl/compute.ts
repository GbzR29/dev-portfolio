// src/lib/reference/opengl/compute.ts
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

export const computeEntries: RefEntry[] = [
  {
    name: "glDispatchCompute",
    category: "compute",
    since: "GL 4.3",
    signature: "void glDispatchCompute(GLuint num_groups_x, GLuint num_groups_y, GLuint num_groups_z);",
    summary: {
      en: "Launches the current compute shader over a 3D grid of work groups.",
      pt: "Executa o compute shader atual sobre uma grade 3D de work groups.",
    },
    description: {
      en: "A compute shader runs as many small groups of invocations. The shader declares the group size (layout(local_size_x = 16, local_size_y = 16) in;), and this call says how many groups to launch in each dimension. Total invocations = groups × local size.\n\nTo process a 1920×1080 image with 16×16 groups, launch ceil(1920/16) × ceil(1080/16) groups.",
      pt: "Um compute shader roda como vários grupos pequenos de invocações. O shader declara o tamanho do grupo (layout(local_size_x = 16, local_size_y = 16) in;), e esta chamada diz quantos grupos lançar em cada dimensão. Total de invocações = grupos × tamanho local.\n\nPara processar uma imagem de 1920×1080 com grupos 16×16, lance ceil(1920/16) × ceil(1080/16) grupos.",
    },
    params: [
      { name: "num_groups_x", type: "GLuint", desc: { en: "Groups along X.", pt: "Grupos no eixo X." } },
      { name: "num_groups_y", type: "GLuint", desc: { en: "Groups along Y (1 for 1D work).", pt: "Grupos no eixo Y (1 para trabalho 1D)." } },
      { name: "num_groups_z", type: "GLuint", desc: { en: "Groups along Z (1 for 1D/2D work).", pt: "Grupos no eixo Z (1 para trabalho 1D/2D)." } },
    ],
    notes: [
      { en: "Round up with (n + size - 1) / size, and guard in the shader with if (id.x >= width) return; for the extra invocations.", pt: "Arredonde para cima com (n + size - 1) / size, e proteja no shader com if (id.x >= width) return; para as invocações sobrando." },
      { en: "Results are not guaranteed visible to later commands until you call glMemoryBarrier.", pt: "Não há garantia de que os resultados estejam visíveis para os próximos comandos até você chamar glMemoryBarrier." },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "No program with a compute shader is in use.", pt: "Nenhum programa com compute shader em uso." } },
      { code: "GL_INVALID_VALUE", when: { en: "A count exceeds GL_MAX_COMPUTE_WORK_GROUP_COUNT.", pt: "Uma contagem passa de GL_MAX_COMPUTE_WORK_GROUP_COUNT." } },
    ],
    example: `glUseProgram(blurProgram);
glBindImageTexture(0, output, 0, GL_FALSE, 0, GL_WRITE_ONLY, GL_RGBA16F);
glDispatchCompute((w + 15) / 16, (h + 15) / 16, 1);
glMemoryBarrier(GL_SHADER_IMAGE_ACCESS_BARRIER_BIT);`,
    related: ["glMemoryBarrier", "glBindImageTexture", "glBindBufferBase"],
    khronos: `${KHR}glDispatchCompute.xhtml`,
  },
  {
    name: "glMemoryBarrier",
    category: "compute",
    since: "GL 4.2",
    signature: "void glMemoryBarrier(GLbitfield barriers);",
    summary: {
      en: "Makes writes done by shaders visible to the commands that come after.",
      pt: "Torna visíveis as escritas feitas por shaders para os comandos seguintes.",
    },
    description: {
      en: "Normal rendering is ordered automatically, but shaders that write to images or SSBOs bypass that tracking. Without a barrier, the next draw may read old data.\n\nThe flag describes HOW the data will be read NEXT, not how it was written. After a compute shader writes an SSBO that is then used as vertex data, the flag is GL_VERTEX_ATTRIB_ARRAY_BARRIER_BIT.",
      pt: "A renderização normal é ordenada automaticamente, mas shaders que escrevem em images ou SSBOs escapam desse controle. Sem uma barreira, o próximo draw pode ler dados antigos.\n\nO flag descreve COMO os dados serão lidos EM SEGUIDA, não como foram escritos. Depois que um compute shader escreve um SSBO usado depois como dados de vértice, o flag é GL_VERTEX_ATTRIB_ARRAY_BARRIER_BIT.",
    },
    params: [
      {
        name: "barriers", type: "GLbitfield",
        desc: { en: "How the written data will be consumed, combined with |.", pt: "Como os dados escritos serão consumidos, combinado com |." },
        values: [
          { name: "GL_SHADER_IMAGE_ACCESS_BARRIER_BIT", desc: { en: "Read again through imageLoad/imageStore.", pt: "Lidos de novo via imageLoad/imageStore." } },
          { name: "GL_TEXTURE_FETCH_BARRIER_BIT", desc: { en: "Sampled as a texture (texture()).", pt: "Amostrados como textura (texture())." } },
          { name: "GL_SHADER_STORAGE_BARRIER_BIT", desc: { en: "Read by shaders as an SSBO.", pt: "Lidos por shaders como SSBO." } },
          { name: "GL_VERTEX_ATTRIB_ARRAY_BARRIER_BIT", desc: { en: "Used as vertex attributes.", pt: "Usados como atributos de vértice." } },
          { name: "GL_BUFFER_UPDATE_BARRIER_BIT", desc: { en: "Read back with glGetBufferSubData or mapping.", pt: "Lidos de volta com glGetBufferSubData ou mapeamento." } },
          { name: "GL_ALL_BARRIER_BITS", desc: { en: "Everything — simple, but may be slower.", pt: "Tudo — simples, mas pode ser mais lento." } },
        ],
      },
    ],
    example: `glDispatchCompute(groups, 1, 1);
glMemoryBarrier(GL_VERTEX_ATTRIB_ARRAY_BARRIER_BIT);
glBindVertexArray(particleVAO);
glDrawArrays(GL_POINTS, 0, particleCount);`,
    related: ["glDispatchCompute", "glGetBufferSubData", "glBindImageTexture"],
    khronos: `${KHR}glMemoryBarrier.xhtml`,
  },
  {
    name: "glBindImageTexture",
    category: "compute",
    since: "GL 4.2",
    signature: "void glBindImageTexture(GLuint unit, GLuint texture, GLint level, GLboolean layered,\n                        GLint layer, GLenum access, GLenum format);",
    summary: {
      en: "Binds a texture level as an image that shaders can read and write pixel by pixel.",
      pt: "Liga um nível de textura como image, que os shaders podem ler e escrever pixel a pixel.",
    },
    description: {
      en: "Samplers can only read, with filtering. Images give shaders raw read/write access to individual texels with imageLoad and imageStore — how a compute shader writes its output into a texture.\n\nImage units are separate from texture units; the shader declares layout(binding = N, rgba16f) uniform image2D img;",
      pt: "Samplers só leem, com filtragem. Images dão aos shaders acesso direto de leitura/escrita a texels individuais com imageLoad e imageStore — é assim que um compute shader escreve seu resultado em uma textura.\n\nImage units são separadas das texture units; o shader declara layout(binding = N, rgba16f) uniform image2D img;",
    },
    params: [
      { name: "unit", type: "GLuint", desc: { en: "Image unit — matches layout(binding = N).", pt: "Image unit — corresponde a layout(binding = N)." } },
      { name: "texture", type: "GLuint", desc: { en: "Texture to bind.", pt: "Textura a ligar." } },
      { name: "level", type: "GLint", desc: { en: "Mip level.", pt: "Nível de mipmap." } },
      { name: "layered", type: "GLboolean", desc: { en: "GL_TRUE to bind all layers of an array/cube/3D texture.", pt: "GL_TRUE para ligar todas as camadas de uma textura array/cube/3D." } },
      { name: "layer", type: "GLint", desc: { en: "Which layer when layered is GL_FALSE.", pt: "Qual camada quando layered é GL_FALSE." } },
      {
        name: "access", type: "GLenum",
        desc: { en: "What the shader will do.", pt: "O que o shader vai fazer." },
        values: [
          { name: "GL_READ_ONLY", desc: { en: "Only imageLoad.", pt: "Só imageLoad." } },
          { name: "GL_WRITE_ONLY", desc: { en: "Only imageStore.", pt: "Só imageStore." } },
          { name: "GL_READ_WRITE", desc: { en: "Both.", pt: "Os dois." } },
        ],
      },
      { name: "format", type: "GLenum", desc: { en: "Format used by the shader, must match the image declaration: GL_RGBA8, GL_RGBA16F, GL_R32F…", pt: "Formato usado pelo shader, deve bater com a declaração da image: GL_RGBA8, GL_RGBA16F, GL_R32F…" } },
    ],
    notes: [
      { en: "The texture must have immutable storage or be complete at that level; sRGB formats cannot be bound as images.", pt: "A textura precisa ter armazenamento imutável ou estar completa naquele nível; formatos sRGB não podem ser ligados como image." },
    ],
    example: `// GLSL: layout(binding = 0, rgba16f) uniform writeonly image2D outImage;
glBindImageTexture(0, outputTex, 0, GL_FALSE, 0, GL_WRITE_ONLY, GL_RGBA16F);`,
    related: ["glDispatchCompute", "glMemoryBarrier", "glTexStorage2D"],
    khronos: `${KHR}glBindImageTexture.xhtml`,
  },
];
