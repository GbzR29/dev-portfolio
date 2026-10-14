// src/lib/reference/opengl/stencil.ts
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

const STENCIL_FUNCS = [
  { name: "GL_ALWAYS", desc: { en: "Always pass (default). Used while writing a mask.", pt: "Sempre passa (padrão). Usado enquanto se escreve uma máscara." } },
  { name: "GL_EQUAL", desc: { en: "Pass where the stored value equals ref: draw only inside the mask.", pt: "Passa onde o valor guardado é igual a ref: desenha só dentro da máscara." } },
  { name: "GL_NOTEQUAL", desc: { en: "Pass where it differs from ref: draw only outside the mask (outlines).", pt: "Passa onde é diferente de ref: desenha só fora da máscara (contornos)." } },
  { name: "GL_LESS / GL_LEQUAL / GL_GREATER / GL_GEQUAL", desc: { en: "Compare ref with the stored value, e.g. GL_LESS passes when ref < stored.", pt: "Comparam ref com o valor guardado; GL_LESS, por exemplo, passa quando ref < guardado." } },
  { name: "GL_NEVER", desc: { en: "Never pass.", pt: "Nunca passa." } },
];

const STENCIL_OPS = [
  { name: "GL_KEEP", desc: { en: "Leave the stored value as it is (default for all three).", pt: "Deixa o valor guardado como está (padrão nos três casos)." } },
  { name: "GL_REPLACE", desc: { en: "Write ref (from glStencilFunc). The usual way to paint a mask.", pt: "Escreve ref (de glStencilFunc). O jeito comum de pintar uma máscara." } },
  { name: "GL_ZERO", desc: { en: "Write 0.", pt: "Escreve 0." } },
  { name: "GL_INCR / GL_DECR", desc: { en: "Add or subtract 1, stopping at the maximum (255 with 8 bits) or at 0.", pt: "Soma ou subtrai 1, parando no máximo (255 com 8 bits) ou em 0." } },
  { name: "GL_INCR_WRAP / GL_DECR_WRAP", desc: { en: "Add or subtract 1, wrapping around (255 + 1 = 0). Shadow volumes count with these.", pt: "Soma ou subtrai 1, dando a volta (255 + 1 = 0). Shadow volumes contam com estes." } },
  { name: "GL_INVERT", desc: { en: "Flip every bit of the stored value.", pt: "Inverte todos os bits do valor guardado." } },
];

export const stencilEntries: RefEntry[] = [
  {
    name: "glStencilFunc",
    category: "stencil",
    since: "GL 1.0",
    signature: "void glStencilFunc(GLenum func, GLint ref, GLuint mask);",
    summary: {
      en: "Sets the stencil test: which fragments may be drawn, by comparing a reference value with the stencil buffer.",
      pt: "Define o stencil test: quais fragmentos podem ser desenhados, comparando um valor de referência com o stencil buffer.",
    },
    description: {
      en: "The stencil buffer stores a small integer per pixel (8 bits, 0 to 255). With GL_STENCIL_TEST enabled, every fragment runs this test before it is drawn:\n\n(ref & mask) func (stored & mask)\n\nIf the comparison is true the fragment goes on to the depth test; if not, it is thrown away. ref is also the value that GL_REPLACE writes (see glStencilOp).\n\nThe typical pattern has two passes: first draw an object with GL_ALWAYS and GL_REPLACE to paint 1s into the stencil buffer (a mask), then draw something else with GL_EQUAL or GL_NOTEQUAL to keep it inside or outside that mask.",
      pt: "O stencil buffer guarda um inteiro pequeno por pixel (8 bits, de 0 a 255). Com GL_STENCIL_TEST ligado, todo fragmento passa por este teste antes de ser desenhado:\n\n(ref & mask) func (guardado & mask)\n\nSe a comparação é verdadeira, o fragmento segue para o depth test; se não, é descartado. ref também é o valor que GL_REPLACE escreve (veja glStencilOp).\n\nO padrão típico tem duas passadas: primeiro desenhe um objeto com GL_ALWAYS e GL_REPLACE para pintar 1 no stencil buffer (uma máscara), depois desenhe outra coisa com GL_EQUAL ou GL_NOTEQUAL para mantê-la dentro ou fora dessa máscara.",
    },
    params: [
      { name: "func", type: "GLenum", desc: { en: "The comparison between ref and the stored value.", pt: "A comparação entre ref e o valor guardado." }, values: STENCIL_FUNCS },
      { name: "ref", type: "GLint", desc: { en: "The reference value, 0 to 255 with an 8-bit stencil buffer.", pt: "O valor de referência, de 0 a 255 com um stencil buffer de 8 bits." } },
      { name: "mask", type: "GLuint", desc: { en: "Bits compared: both sides are ANDed with it first. 0xFF compares all 8 bits.", pt: "Bits comparados: os dois lados passam por um AND com ela antes. 0xFF compara os 8 bits." } },
    ],
    notes: [
      { en: "Nothing happens until glEnable(GL_STENCIL_TEST), and the framebuffer needs a stencil buffer (GLFW gives 8 bits by default; an FBO needs a GL_DEPTH24_STENCIL8 attachment).", pt: "Nada acontece até glEnable(GL_STENCIL_TEST), e o framebuffer precisa ter stencil buffer (o GLFW dá 8 bits por padrão; um FBO precisa de um anexo GL_DEPTH24_STENCIL8)." },
      { en: "This mask only affects the test. The bits that get written are chosen by glStencilMask.", pt: "Esta máscara só afeta o teste. Os bits que são escritos são escolhidos por glStencilMask." },
    ],
    errors: [
      { code: "GL_INVALID_ENUM", when: { en: "func is not one of the eight comparisons.", pt: "func não é uma das oito comparações." } },
    ],
    example: `// pass 1: paint the object's pixels with 1
glStencilFunc(GL_ALWAYS, 1, 0xFF);
glStencilMask(0xFF);
drawObject();

// pass 2: a bigger copy only where the stencil is NOT 1 -> outline
glStencilFunc(GL_NOTEQUAL, 1, 0xFF);
glStencilMask(0x00);
drawObjectScaledUp();`,
    related: ["glStencilOp", "glStencilMask", "glClearStencil", "glEnable"],
    khronos: `${KHR}glStencilFunc.xhtml`,
  },
  {
    name: "glStencilOp",
    category: "stencil",
    since: "GL 1.0",
    signature: "void glStencilOp(GLenum sfail, GLenum dpfail, GLenum dppass);",
    summary: {
      en: "Says what happens to the stored stencil value in each of the three outcomes of the stencil and depth tests.",
      pt: "Diz o que acontece com o valor guardado no stencil em cada um dos três resultados do stencil test e do depth test.",
    },
    description: {
      en: "glStencilFunc decides whether a fragment passes; glStencilOp decides what is written into the stencil buffer as a side effect. There are three cases, one per parameter:\n\nsfail: the stencil test failed.\ndpfail: the stencil test passed but the depth test failed.\ndppass: both passed (or there is no depth test).\n\nThe default is GL_KEEP for all three, so the stencil buffer never changes. To paint a mask you usually set dppass to GL_REPLACE, so every pixel the object really covers gets the ref value.",
      pt: "glStencilFunc decide se um fragmento passa; glStencilOp decide o que é escrito no stencil buffer como efeito colateral. São três casos, um por parâmetro:\n\nsfail: o stencil test falhou.\ndpfail: o stencil test passou, mas o depth test falhou.\ndppass: os dois passaram (ou não há depth test).\n\nO padrão é GL_KEEP nos três, então o stencil buffer nunca muda. Para pintar uma máscara, normalmente se põe GL_REPLACE em dppass, assim cada pixel que o objeto cobre de verdade recebe o valor ref.",
    },
    params: [
      { name: "sfail", type: "GLenum", desc: { en: "Action when the stencil test fails.", pt: "Ação quando o stencil test falha." }, values: STENCIL_OPS },
      { name: "dpfail", type: "GLenum", desc: { en: "Action when the stencil test passes but the depth test fails.", pt: "Ação quando o stencil test passa mas o depth test falha." } },
      { name: "dppass", type: "GLenum", desc: { en: "Action when both tests pass.", pt: "Ação quando os dois testes passam." } },
    ],
    notes: [
      { en: "Writes still go through glStencilMask: with mask 0x00 none of these actions changes anything.", pt: "As escritas ainda passam por glStencilMask: com máscara 0x00 nenhuma destas ações muda nada." },
      { en: "To treat front and back faces differently (shadow volumes), use glStencilOpSeparate.", pt: "Para tratar faces da frente e de trás de forma diferente (shadow volumes), use glStencilOpSeparate." },
    ],
    errors: [
      { code: "GL_INVALID_ENUM", when: { en: "Any argument is not one of the eight actions.", pt: "Algum argumento não é uma das oito ações." } },
    ],
    example: `glEnable(GL_STENCIL_TEST);
glStencilOp(GL_KEEP, GL_KEEP, GL_REPLACE); // write ref where the object is drawn`,
    related: ["glStencilFunc", "glStencilOpSeparate", "glStencilMask"],
    khronos: `${KHR}glStencilOp.xhtml`,
  },
  {
    name: "glStencilMask",
    category: "stencil",
    since: "GL 1.0",
    signature: "void glStencilMask(GLuint mask);",
    summary: {
      en: "Chooses which bits of the stencil buffer can be written; 0x00 makes it read-only.",
      pt: "Escolhe quais bits do stencil buffer podem ser escritos; 0x00 deixa ele só para leitura.",
    },
    description: {
      en: "Each written stencil value is ANDed with this mask before it is stored. 0xFF (the default) lets every bit through; 0x00 freezes the buffer, so you can test against a mask without spoiling it.\n\nMasks with only some bits set let one stencil buffer hold several independent masks: 0x01 for one effect, 0x02 for another.",
      pt: "Cada valor escrito no stencil passa por um AND com esta máscara antes de ser guardado. 0xFF (o padrão) deixa todos os bits passarem; 0x00 congela o buffer, assim dá para testar contra uma máscara sem estragá-la.\n\nMáscaras com só alguns bits ligados permitem que um stencil buffer guarde várias máscaras independentes: 0x01 para um efeito, 0x02 para outro.",
    },
    params: [
      { name: "mask", type: "GLuint", desc: { en: "Bits that may be written. 0xFF = all (default), 0x00 = none.", pt: "Bits que podem ser escritos. 0xFF = todos (padrão), 0x00 = nenhum." } },
    ],
    notes: [
      { en: "glClear respects this mask too: set it back to 0xFF before clearing, or the stencil buffer is not fully cleared.", pt: "glClear também respeita esta máscara: volte para 0xFF antes de limpar, senão o stencil buffer não é limpo por inteiro." },
      { en: "Do not confuse it with the mask argument of glStencilFunc, which only selects the bits compared.", pt: "Não confunda com o argumento mask de glStencilFunc, que só escolhe os bits comparados." },
    ],
    example: `glStencilMask(0xFF);   // allow writes, so the clear works
glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT | GL_STENCIL_BUFFER_BIT);`,
    related: ["glStencilFunc", "glStencilOp", "glClear", "glDepthMask", "glColorMask"],
    khronos: `${KHR}glStencilMask.xhtml`,
  },
  {
    name: "glStencilOpSeparate",
    category: "stencil",
    since: "GL 2.0",
    signature: "void glStencilOpSeparate(GLenum face, GLenum sfail, GLenum dpfail, GLenum dppass);",
    summary: {
      en: "glStencilOp with separate actions for front-facing and back-facing triangles.",
      pt: "glStencilOp com ações separadas para triângulos de frente e de costas.",
    },
    description: {
      en: "Same three cases as glStencilOp, but only for the faces you name. The classic use is stencil shadow volumes: drawing the volume once with culling off, back faces increment and front faces decrement, so each pixel ends up counting how many volumes it is inside. A pixel with a count other than 0 is in shadow.\n\nIt saves drawing the volume twice with glCullFace in between.",
      pt: "Os mesmos três casos de glStencilOp, mas só para as faces que você indicar. O uso clássico são os stencil shadow volumes: desenhando o volume uma vez com culling desligado, as faces de trás somam e as da frente subtraem, e cada pixel termina contando em quantos volumes está dentro. Um pixel com contagem diferente de 0 está na sombra.\n\nIsso evita desenhar o volume duas vezes com glCullFace no meio.",
    },
    params: [
      {
        name: "face", type: "GLenum",
        desc: { en: "Which faces these actions apply to.", pt: "A quais faces estas ações se aplicam." },
        values: [
          { name: "GL_FRONT", desc: { en: "Front-facing triangles (see glFrontFace).", pt: "Triângulos de frente (veja glFrontFace)." } },
          { name: "GL_BACK", desc: { en: "Back-facing triangles.", pt: "Triângulos de costas." } },
          { name: "GL_FRONT_AND_BACK", desc: { en: "Both: the same as glStencilOp.", pt: "Os dois: igual a glStencilOp." } },
        ],
      },
      { name: "sfail", type: "GLenum", desc: { en: "Action when the stencil test fails.", pt: "Ação quando o stencil test falha." }, values: STENCIL_OPS },
      { name: "dpfail", type: "GLenum", desc: { en: "Action when the stencil passes but depth fails.", pt: "Ação quando o stencil passa mas a profundidade falha." } },
      { name: "dppass", type: "GLenum", desc: { en: "Action when both pass.", pt: "Ação quando os dois passam." } },
    ],
    notes: [
      { en: "Use the _WRAP versions for counting: with plain GL_DECR a count that dips below 0 would stick at 0 and break the sum.", pt: "Use as versões _WRAP para contar: com GL_DECR simples, uma contagem que descesse abaixo de 0 ficaria presa em 0 e quebraria a soma." },
    ],
    errors: [
      { code: "GL_INVALID_ENUM", when: { en: "face or any action is not an accepted value.", pt: "face ou alguma ação não é um valor aceito." } },
    ],
    example: `// z-fail shadow volume: count where the volume hides behind geometry
glDisable(GL_CULL_FACE);
glStencilOpSeparate(GL_BACK,  GL_KEEP, GL_INCR_WRAP, GL_KEEP);
glStencilOpSeparate(GL_FRONT, GL_KEEP, GL_DECR_WRAP, GL_KEEP);
drawShadowVolumes();`,
    related: ["glStencilOp", "glStencilFunc", "glCullFace", "glFrontFace"],
    khronos: `${KHR}glStencilOpSeparate.xhtml`,
  },
  {
    name: "glClearStencil",
    category: "stencil",
    since: "GL 1.0",
    signature: "void glClearStencil(GLint s);",
    summary: {
      en: "Sets the value glClear writes into the stencil buffer.",
      pt: "Define o valor que glClear escreve no stencil buffer.",
    },
    description: {
      en: "Like glClearColor for color, this only stores the value; glClear(GL_STENCIL_BUFFER_BIT) writes it into every pixel. The default is 0, which is what almost every technique expects.",
      pt: "Como glClearColor faz para a cor, isto só guarda o valor; glClear(GL_STENCIL_BUFFER_BIT) é que o escreve em todos os pixels. O padrão é 0, que é o que quase toda técnica espera.",
    },
    params: [
      { name: "s", type: "GLint", desc: { en: "The clear value, 0 by default (only the low 8 bits are kept with an 8-bit buffer).", pt: "O valor de limpeza, 0 por padrão (só os 8 bits de baixo ficam com um buffer de 8 bits)." } },
    ],
    notes: [
      { en: "The clear goes through glStencilMask: with mask 0x00 the stencil buffer is not cleared at all.", pt: "A limpeza passa por glStencilMask: com máscara 0x00 o stencil buffer não é limpo." },
    ],
    example: `glClearStencil(0);
glStencilMask(0xFF);
glClear(GL_STENCIL_BUFFER_BIT);`,
    related: ["glClear", "glStencilMask", "glClearColor", "glClearDepth"],
    khronos: `${KHR}glClearStencil.xhtml`,
  },
];
