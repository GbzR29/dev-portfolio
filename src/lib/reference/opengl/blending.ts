// src/lib/reference/opengl/blending.ts
// More of the "fragment-ops" category: the finer blending controls, the colour
// write mask and the depth range / clear value.
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

export const blendingEntries: RefEntry[] = [
  {
    name: "glBlendFuncSeparate",
    category: "fragment-ops",
    since: "GL 1.4",
    signature: "void glBlendFuncSeparate(GLenum srcRGB, GLenum dstRGB, GLenum srcAlpha, GLenum dstAlpha);",
    summary: {
      en: "glBlendFunc with one pair of factors for the colour channels and another for alpha.",
      pt: "glBlendFunc com um par de fatores para os canais de cor e outro para o alfa.",
    },
    description: {
      en: "glBlendFunc uses the same two factors for red, green, blue and alpha. That is fine on screen, where nobody looks at the stored alpha, but it goes wrong when you blend into a texture you will use later: with GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA the stored alpha becomes a² + d(1 − a), which is too small, and the texture comes out more transparent than it should.\n\nWith separate factors the colour blends as usual and the alpha accumulates coverage correctly:\n\nRGB = src × srcRGB + dst × dstRGB\nA = srcA × srcAlpha + dstA × dstAlpha",
      pt: "glBlendFunc usa os mesmos dois fatores para vermelho, verde, azul e alfa. Na tela isso funciona, porque ninguém olha o alfa guardado, mas dá errado quando você faz blending numa textura que vai usar depois: com GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA o alfa guardado vira a² + d(1 − a), que é pequeno demais, e a textura sai mais transparente do que deveria.\n\nCom fatores separados a cor mistura como de costume e o alfa acumula a cobertura corretamente:\n\nRGB = origem × srcRGB + destino × dstRGB\nA = origemA × srcAlpha + destinoA × dstAlpha",
    },
    params: [
      { name: "srcRGB", type: "GLenum", desc: { en: "Factor for the new colour.", pt: "Fator da cor nova." } },
      { name: "dstRGB", type: "GLenum", desc: { en: "Factor for the stored colour.", pt: "Fator da cor guardada." } },
      { name: "srcAlpha", type: "GLenum", desc: { en: "Factor for the new alpha. Usually GL_ONE.", pt: "Fator do alfa novo. Normalmente GL_ONE." } },
      { name: "dstAlpha", type: "GLenum", desc: { en: "Factor for the stored alpha. Usually GL_ONE_MINUS_SRC_ALPHA.", pt: "Fator do alfa guardado. Normalmente GL_ONE_MINUS_SRC_ALPHA." } },
    ],
    notes: [
      { en: "Premultiplied alpha (colour already multiplied by alpha in the shader or texture) uses GL_ONE, GL_ONE_MINUS_SRC_ALPHA for both pairs, so plain glBlendFunc is enough there.", pt: "Com alfa pré-multiplicado (cor já multiplicada pelo alfa no shader ou na textura) os dois pares são GL_ONE, GL_ONE_MINUS_SRC_ALPHA, então glBlendFunc simples basta." },
    ],
    errors: [
      { code: "GL_INVALID_ENUM", when: { en: "A factor is not an accepted value.", pt: "Um fator não é um valor aceito." } },
    ],
    example: `// transparent UI drawn into an offscreen texture
glEnable(GL_BLEND);
glBlendFuncSeparate(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA,  // colour
                    GL_ONE,       GL_ONE_MINUS_SRC_ALPHA); // alpha`,
    related: ["glBlendFunc", "glBlendEquation", "glBlendFunci"],
    khronos: `${KHR}glBlendFuncSeparate.xhtml`,
  },
  {
    name: "glBlendEquation",
    category: "fragment-ops",
    since: "GL 1.4",
    signature: "void glBlendEquation(GLenum mode);",
    summary: {
      en: "Chooses how the two blended terms are combined: added (default), subtracted, or the minimum or maximum.",
      pt: "Escolhe como os dois termos do blending são combinados: somados (padrão), subtraídos, ou o mínimo ou o máximo.",
    },
    description: {
      en: "glBlendFunc picks the two factors; this picks the operation between the two products. With S = source × sfactor and D = destination × dfactor:\n\nGL_FUNC_ADD: S + D\nGL_FUNC_SUBTRACT: S − D\nGL_FUNC_REVERSE_SUBTRACT: D − S\nGL_MIN / GL_MAX: the smaller or larger of source and destination, channel by channel (the factors are ignored).\n\nResults are clamped to [0, 1] in a normal 8-bit framebuffer.",
      pt: "glBlendFunc escolhe os dois fatores; esta escolhe a operação entre os dois produtos. Com S = origem × sfactor e D = destino × dfactor:\n\nGL_FUNC_ADD: S + D\nGL_FUNC_SUBTRACT: S − D\nGL_FUNC_REVERSE_SUBTRACT: D − S\nGL_MIN / GL_MAX: o menor ou o maior entre origem e destino, canal por canal (os fatores são ignorados).\n\nNum framebuffer comum de 8 bits os resultados ficam presos em [0, 1].",
    },
    params: [
      {
        name: "mode", type: "GLenum",
        desc: { en: "The operation.", pt: "A operação." },
        values: [
          { name: "GL_FUNC_ADD", desc: { en: "Add (default): transparency, additive glow.", pt: "Soma (padrão): transparência, brilho aditivo." } },
          { name: "GL_FUNC_REVERSE_SUBTRACT", desc: { en: "Stored minus new: darken what is behind (shadows painted on top, ink).", pt: "Guardado menos novo: escurece o que está atrás (sombras pintadas por cima, tinta)." } },
          { name: "GL_FUNC_SUBTRACT", desc: { en: "New minus stored.", pt: "Novo menos guardado." } },
          { name: "GL_MIN / GL_MAX", desc: { en: "Keep the darker or brighter value per channel.", pt: "Mantém o valor mais escuro ou mais claro por canal." } },
        ],
      },
    ],
    notes: [
      { en: "The equation stays set: return to GL_FUNC_ADD after a special pass, or later transparent objects blend strangely.", pt: "A equação continua valendo: volte para GL_FUNC_ADD depois de uma passada especial, senão os objetos transparentes seguintes misturam de um jeito estranho." },
      { en: "glBlendEquationSeparate takes one mode for colour and one for alpha.", pt: "glBlendEquationSeparate recebe um modo para a cor e outro para o alfa." },
    ],
    errors: [
      { code: "GL_INVALID_ENUM", when: { en: "mode is not one of the five operations.", pt: "mode não é uma das cinco operações." } },
    ],
    example: `glBlendFunc(GL_ONE, GL_ONE);
glBlendEquation(GL_FUNC_REVERSE_SUBTRACT); // darken
drawDarkDecal();
glBlendEquation(GL_FUNC_ADD);              // back to normal`,
    related: ["glBlendFunc", "glBlendFuncSeparate", "glEnable"],
    khronos: `${KHR}glBlendEquation.xhtml`,
  },
  {
    name: "glBlendFunci",
    category: "fragment-ops",
    since: "GL 4.0",
    signature: "void glBlendFunci(GLuint buf, GLenum sfactor, GLenum dfactor);",
    summary: {
      en: "glBlendFunc for one colour attachment only, when a shader writes to several at once.",
      pt: "glBlendFunc para um só anexo de cor, quando o shader escreve em vários ao mesmo tempo.",
    },
    description: {
      en: "With multiple render targets (glDrawBuffers), the fragment shader writes one output per attachment. glBlendFunc would give them all the same blending; glBlendFunci sets it for draw buffer number buf alone.\n\nWeighted blended order-independent transparency needs exactly this: an accumulation buffer that adds everything (GL_ONE, GL_ONE) next to a revealage buffer that multiplies (GL_ZERO, GL_ONE_MINUS_SRC_COLOR), in one draw call.",
      pt: "Com vários render targets (glDrawBuffers), o fragment shader escreve uma saída por anexo. glBlendFunc daria o mesmo blending a todos; glBlendFunci define o de um só, o draw buffer de número buf.\n\nA transparência independente de ordem do tipo weighted blended precisa exatamente disso: um buffer de acumulação que soma tudo (GL_ONE, GL_ONE) ao lado de um buffer de revealage que multiplica (GL_ZERO, GL_ONE_MINUS_SRC_COLOR), numa única chamada de desenho.",
    },
    params: [
      { name: "buf", type: "GLuint", desc: { en: "Index into the glDrawBuffers list (0 = the first output), not the attachment enum.", pt: "Índice na lista de glDrawBuffers (0 = a primeira saída), não o enum do anexo." } },
      { name: "sfactor", type: "GLenum", desc: { en: "Factor for the new colour, as in glBlendFunc.", pt: "Fator da cor nova, como em glBlendFunc." } },
      { name: "dfactor", type: "GLenum", desc: { en: "Factor for the stored colour.", pt: "Fator da cor guardada." } },
    ],
    notes: [
      { en: "Blending is switched per buffer too: glEnablei(GL_BLEND, buf).", pt: "O blending também é ligado por buffer: glEnablei(GL_BLEND, buf)." },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "buf is not below GL_MAX_DRAW_BUFFERS.", pt: "buf não é menor que GL_MAX_DRAW_BUFFERS." } },
      { code: "GL_INVALID_ENUM", when: { en: "A factor is not an accepted value.", pt: "Um fator não é um valor aceito." } },
    ],
    example: `// weighted blended OIT: two targets, two blend modes
glEnable(GL_BLEND);
glBlendFunci(0, GL_ONE,  GL_ONE);                  // accumulation
glBlendFunci(1, GL_ZERO, GL_ONE_MINUS_SRC_COLOR);  // revealage
drawTransparent();`,
    related: ["glBlendFunc", "glDrawBuffers", "glBlendFuncSeparate"],
    khronos: `${KHR}glBlendFunc.xhtml`,
  },
  {
    name: "glColorMask",
    category: "fragment-ops",
    since: "GL 1.0",
    signature: "void glColorMask(GLboolean red, GLboolean green, GLboolean blue, GLboolean alpha);",
    summary: {
      en: "Turns writing to each colour channel on or off; all GL_FALSE draws depth and stencil only.",
      pt: "Liga ou desliga a escrita em cada canal de cor; tudo GL_FALSE desenha só profundidade e stencil.",
    },
    description: {
      en: "The colour version of glDepthMask. Fragments are still shaded and tested, but the channels set to GL_FALSE are not changed in the framebuffer.\n\nThe main use is a depth pre-pass: draw the scene once with every channel off, so only the depth buffer is filled; then draw it again with glDepthFunc(GL_LEQUAL) (or GL_EQUAL) and the colour on. Each pixel's expensive lighting then runs once, for the visible surface only. Writing a stencil mask without touching the image is the other common case.",
      pt: "A versão de cor do glDepthMask. Os fragmentos continuam sendo calculados e testados, mas os canais em GL_FALSE não mudam no framebuffer.\n\nO uso principal é a depth pre-pass: desenhe a cena uma vez com todos os canais desligados, assim só o depth buffer é preenchido; depois desenhe de novo com glDepthFunc(GL_LEQUAL) (ou GL_EQUAL) e a cor ligada. A iluminação cara de cada pixel roda então uma vez só, para a superfície visível. Escrever uma máscara no stencil sem mexer na imagem é o outro caso comum.",
    },
    params: [
      { name: "red", type: "GLboolean", desc: { en: "GL_TRUE writes red (default).", pt: "GL_TRUE escreve o vermelho (padrão)." } },
      { name: "green", type: "GLboolean", desc: { en: "GL_TRUE writes green.", pt: "GL_TRUE escreve o verde." } },
      { name: "blue", type: "GLboolean", desc: { en: "GL_TRUE writes blue.", pt: "GL_TRUE escreve o azul." } },
      { name: "alpha", type: "GLboolean", desc: { en: "GL_TRUE writes alpha.", pt: "GL_TRUE escreve o alfa." } },
    ],
    notes: [
      { en: "glClear respects the mask: turn the channels back on before clearing the colour buffer.", pt: "glClear respeita a máscara: religue os canais antes de limpar o color buffer." },
      { en: "A depth-only pass still runs the fragment shader; use a cheap shader for it.", pt: "Uma passada só de profundidade ainda roda o fragment shader; use um shader barato para ela." },
    ],
    example: `// depth pre-pass
glColorMask(GL_FALSE, GL_FALSE, GL_FALSE, GL_FALSE);
drawScene(depthOnlyShader);
glColorMask(GL_TRUE, GL_TRUE, GL_TRUE, GL_TRUE);

glDepthFunc(GL_LEQUAL);
drawScene(litShader);`,
    related: ["glDepthMask", "glStencilMask", "glDepthFunc", "glClear"],
    khronos: `${KHR}glColorMask.xhtml`,
  },
  {
    name: "glDepthRange",
    category: "fragment-ops",
    since: "GL 1.0",
    signature: "void glDepthRange(GLdouble nearVal, GLdouble farVal);",
    summary: {
      en: "Maps the depth after projection (−1 to 1) to the values stored in the depth buffer (0 to 1 by default).",
      pt: "Mapeia a profundidade depois da projeção (−1 a 1) para os valores guardados no depth buffer (0 a 1 por padrão).",
    },
    description: {
      en: "After the perspective divide, z runs from −1 (near plane) to 1 (far plane). The viewport step turns that into the stored depth:\n\ndepth = nearVal + (z + 1) / 2 × (farVal − nearVal)\n\nWith the default 0 and 1, the near plane stores 0 and the far plane 1. A smaller range squeezes an object into part of the buffer: drawing a first-person weapon with glDepthRange(0, 0.1) puts it in front of everything else, so it never sinks into walls.",
      pt: "Depois da divisão de perspectiva, z vai de −1 (plano near) a 1 (plano far). A etapa de viewport transforma isso na profundidade guardada:\n\nprofundidade = nearVal + (z + 1) / 2 × (farVal − nearVal)\n\nCom o padrão 0 e 1, o plano near guarda 0 e o far guarda 1. Uma faixa menor espreme o objeto numa parte do buffer: desenhar a arma em primeira pessoa com glDepthRange(0, 0.1) a coloca na frente de todo o resto, e ela nunca afunda nas paredes.",
    },
    params: [
      { name: "nearVal", type: "GLdouble", desc: { en: "Stored depth for the near plane, 0 by default. Clamped to [0, 1].", pt: "Profundidade guardada para o plano near, 0 por padrão. Presa em [0, 1]." } },
      { name: "farVal", type: "GLdouble", desc: { en: "Stored depth for the far plane, 1 by default. Clamped to [0, 1].", pt: "Profundidade guardada para o plano far, 1 por padrão. Presa em [0, 1]." } },
    ],
    notes: [
      { en: "nearVal may be larger than farVal, which reverses the depth order; for a proper reversed-Z setup use glClipControl (GL 4.5) with a float depth buffer instead.", pt: "nearVal pode ser maior que farVal, o que inverte a ordem de profundidade; para um reversed-Z de verdade use glClipControl (GL 4.5) com um depth buffer em float." },
      { en: "glDepthRangef is the same with GLfloat arguments (GL 4.1, and the only form in OpenGL ES).", pt: "glDepthRangef é igual, com argumentos GLfloat (GL 4.1, e a única forma no OpenGL ES)." },
    ],
    example: `drawWorld();

glDepthRange(0.0, 0.1);   // weapon always in front
drawWeapon();
glDepthRange(0.0, 1.0);`,
    related: ["glViewport", "glDepthFunc", "glClearDepth"],
    khronos: `${KHR}glDepthRange.xhtml`,
  },
  {
    name: "glClearDepth",
    category: "fragment-ops",
    since: "GL 1.0",
    signature: "void glClearDepth(GLdouble depth);",
    summary: {
      en: "Sets the value glClear writes into the depth buffer (1.0, the far plane, by default).",
      pt: "Define o valor que glClear escreve no depth buffer (1.0, o plano far, por padrão).",
    },
    description: {
      en: "With the default glDepthFunc(GL_LESS), the buffer must start at the farthest value, 1.0, so that anything drawn is closer and passes. You only change it when you reverse the depth test: with GL_GREATER (reversed Z), clear to 0.0 instead.\n\nThe pair has to agree. Clearing to 0.0 with GL_LESS left on makes every fragment fail, and only the background is visible.",
      pt: "Com o padrão glDepthFunc(GL_LESS), o buffer precisa começar no valor mais distante, 1.0, para que qualquer coisa desenhada esteja mais perto e passe. Você só muda quando inverte o depth test: com GL_GREATER (Z invertido), limpe com 0.0.\n\nOs dois precisam combinar. Limpar com 0.0 deixando GL_LESS faz todo fragmento falhar, e só o fundo aparece.",
    },
    params: [
      { name: "depth", type: "GLdouble", desc: { en: "The clear value, clamped to [0, 1]. Default 1.0.", pt: "O valor de limpeza, preso em [0, 1]. Padrão 1.0." } },
    ],
    notes: [
      { en: "The clear respects glDepthMask: with depth writes off, the depth buffer is not cleared.", pt: "A limpeza respeita glDepthMask: com a escrita de profundidade desligada, o depth buffer não é limpo." },
    ],
    example: `// reversed Z
glClearDepth(0.0);
glDepthFunc(GL_GREATER);
glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);`,
    related: ["glClear", "glDepthFunc", "glDepthMask", "glClearStencil"],
    khronos: `${KHR}glClearDepth.xhtml`,
  },
];
