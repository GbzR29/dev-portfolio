// src/lib/reference/opengl/rasterization.ts
// More of the "fragment-ops" category: point and line size, and per-sample
// shading under MSAA.
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

export const rasterizationEntries: RefEntry[] = [
  {
    name: "glPointSize",
    category: "fragment-ops",
    since: "GL 1.0",
    signature: "void glPointSize(GLfloat size);",
    summary: {
      en: "Sets the diameter in pixels of points drawn with GL_POINTS (when the shader does not set it).",
      pt: "Define o diâmetro em pixels dos pontos desenhados com GL_POINTS (quando o shader não o define).",
    },
    description: {
      en: "A GL_POINTS draw makes one square of size × size pixels per vertex. The default, 1, is a single pixel and hard to see, so lessons that show vertices as points set it larger.\n\nThere are two sources for the size. If glEnable(GL_PROGRAM_POINT_SIZE) is on, the vertex shader writes gl_PointSize per vertex (for particles that shrink with distance). If it is off, this fixed value is used.",
      pt: "Um desenho GL_POINTS faz um quadrado de size × size pixels por vértice. O padrão, 1, é um único pixel e difícil de ver, por isso as lições que mostram vértices como pontos aumentam o valor.\n\nO tamanho pode vir de dois lugares. Se glEnable(GL_PROGRAM_POINT_SIZE) estiver ligado, o vertex shader escreve gl_PointSize por vértice (para partículas que diminuem com a distância). Se estiver desligado, vale este valor fixo.",
    },
    params: [
      { name: "size", type: "GLfloat", desc: { en: "Diameter in pixels, greater than 0. Default 1.", pt: "Diâmetro em pixels, maior que 0. Padrão 1." } },
    ],
    notes: [
      { en: "Points are squares; for round ones, discard fragments in the fragment shader where length(gl_PointCoord − 0.5) > 0.5.", pt: "Os pontos são quadrados; para ficarem redondos, descarte no fragment shader os fragmentos onde length(gl_PointCoord − 0.5) > 0.5." },
      { en: "The largest size depends on the GPU (GL_POINT_SIZE_RANGE).", pt: "O maior tamanho depende da GPU (GL_POINT_SIZE_RANGE)." },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "size is 0 or negative.", pt: "size é 0 ou negativo." } },
    ],
    example: `glPointSize(10.0f);
glDrawArrays(GL_POINTS, 0, 3);   // three visible dots`,
    related: ["glDrawArrays", "glLineWidth", "glPolygonMode"],
    khronos: `${KHR}glPointSize.xhtml`,
  },
  {
    name: "glLineWidth",
    category: "fragment-ops",
    since: "GL 1.0",
    signature: "void glLineWidth(GLfloat width);",
    summary: {
      en: "Sets the width in pixels of lines; in the core profile only 1.0 is guaranteed to work.",
      pt: "Define a largura em pixels das linhas; no core profile só 1.0 tem garantia de funcionar.",
    },
    description: {
      en: "Applies to GL_LINES draws and to wireframe from glPolygonMode(GL_LINE). The catch: wide lines are deprecated in the core profile. A forward-compatible context (always the case on macOS) rejects any width above 1.0 with GL_INVALID_VALUE, and many drivers clamp it to 1 anyway.\n\nFor thick lines that work everywhere, draw each segment as a thin quad of two triangles, built on the CPU or in a geometry shader.",
      pt: "Vale para desenhos GL_LINES e para o wireframe de glPolygonMode(GL_LINE). O problema: linhas largas são obsoletas no core profile. Um contexto forward-compatible (sempre o caso no macOS) recusa qualquer largura acima de 1.0 com GL_INVALID_VALUE, e muitos drivers limitam a 1 de qualquer jeito.\n\nPara linhas grossas que funcionem em todo lugar, desenhe cada segmento como um quad fino de dois triângulos, montado na CPU ou num geometry shader.",
    },
    params: [
      { name: "width", type: "GLfloat", desc: { en: "Width in pixels, default 1.", pt: "Largura em pixels, padrão 1." } },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "width ≤ 0, or > 1 in a forward-compatible core context.", pt: "width ≤ 0, ou > 1 num contexto core forward-compatible." } },
    ],
    example: `glPolygonMode(GL_FRONT_AND_BACK, GL_LINE);
glLineWidth(1.0f);   // the only width every core context accepts`,
    related: ["glPolygonMode", "glPointSize"],
    khronos: `${KHR}glLineWidth.xhtml`,
  },
  {
    name: "glMinSampleShading",
    category: "fragment-ops",
    since: "GL 4.0",
    signature: "void glMinSampleShading(GLfloat value);",
    summary: {
      en: "Under MSAA, makes the fragment shader run for a share of the samples (1.0 = every sample), smoothing aliasing inside triangles too.",
      pt: "Com MSAA, faz o fragment shader rodar para uma parte das amostras (1.0 = todas), suavizando o serrilhado também dentro dos triângulos.",
    },
    description: {
      en: "Plain MSAA runs the fragment shader once per pixel and copies the result to every covered sample, so only triangle edges get smoother. Aliasing that comes from the shader itself (thin specular highlights, alpha-tested foliage, sharp procedural patterns) stays.\n\nWith glEnable(GL_SAMPLE_SHADING) and glMinSampleShading(1.0), the shader runs once per sample: in effect supersampling, with the matching cost (4× MSAA means up to 4× the fragment work). Values between 0 and 1 ask for at least that fraction of the samples.",
      pt: "O MSAA comum roda o fragment shader uma vez por pixel e copia o resultado para todas as amostras cobertas, então só as bordas dos triângulos ficam mais suaves. O serrilhado que vem do próprio shader (brilhos especulares finos, folhagem com alpha test, padrões procedurais nítidos) continua.\n\nCom glEnable(GL_SAMPLE_SHADING) e glMinSampleShading(1.0), o shader roda uma vez por amostra: na prática é supersampling, com o custo correspondente (MSAA 4× significa até 4× o trabalho de fragmentos). Valores entre 0 e 1 pedem pelo menos aquela fração das amostras.",
    },
    params: [
      { name: "value", type: "GLfloat", desc: { en: "Fraction of samples to shade, 0 to 1 (clamped).", pt: "Fração das amostras a calcular, de 0 a 1 (presa)." } },
    ],
    notes: [
      { en: "It does nothing unless GL_SAMPLE_SHADING is enabled and the framebuffer is multisampled.", pt: "Não faz nada a menos que GL_SAMPLE_SHADING esteja ligado e o framebuffer seja multisample." },
      { en: "A shader that reads gl_SampleID or uses the sample qualifier is run per sample automatically.", pt: "Um shader que lê gl_SampleID ou usa o qualificador sample já roda por amostra automaticamente." },
    ],
    example: `glEnable(GL_MULTISAMPLE);
glEnable(GL_SAMPLE_SHADING);
glMinSampleShading(1.0);   // shade every sample`,
    related: ["glRenderbufferStorageMultisample", "glEnable", "glBlitFramebuffer"],
    khronos: `${KHR}glMinSampleShading.xhtml`,
  },
];
