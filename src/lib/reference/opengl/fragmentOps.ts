// src/lib/reference/opengl/fragmentOps.ts
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

const BLEND_FACTORS = [
  { name: "GL_SRC_ALPHA", desc: { en: "The new fragment's alpha.", pt: "O alfa do fragmento novo." } },
  { name: "GL_ONE_MINUS_SRC_ALPHA", desc: { en: "1 − new alpha. Paired with GL_SRC_ALPHA it gives classic transparency.", pt: "1 − alfa novo. Junto com GL_SRC_ALPHA gera a transparência clássica." } },
  { name: "GL_ONE", desc: { en: "Factor 1 — keep full value. GL_ONE, GL_ONE = additive blending (fire, glow).", pt: "Fator 1 — mantém o valor inteiro. GL_ONE, GL_ONE = blending aditivo (fogo, brilho)." } },
  { name: "GL_ZERO", desc: { en: "Factor 0 — discard this term.", pt: "Fator 0 — descarta este termo." } },
  { name: "GL_DST_COLOR", desc: { en: "The color already in the framebuffer (multiply effects).", pt: "A cor que já está no framebuffer (efeitos de multiplicação)." } },
];

export const fragmentOpEntries: RefEntry[] = [
  {
    name: "glDepthFunc",
    category: "fragment-ops",
    since: "GL 1.0",
    signature: "void glDepthFunc(GLenum func);",
    summary: {
      en: "Chooses the comparison that decides whether a fragment passes the depth test.",
      pt: "Escolhe a comparação que decide se um fragmento passa no depth test.",
    },
    description: {
      en: "With GL_DEPTH_TEST enabled, every fragment's depth is compared with the value already stored in the depth buffer. If the comparison passes, the fragment is drawn (and its depth stored); otherwise it is discarded.\n\nThe default GL_LESS means \"closer wins\". You change it for special passes — GL_LEQUAL lets a skybox drawn at exactly depth 1.0 pass against a cleared buffer.",
      pt: "Com GL_DEPTH_TEST ligado, a profundidade de cada fragmento é comparada com o valor já guardado no depth buffer. Se a comparação passa, o fragmento é desenhado (e sua profundidade guardada); senão é descartado.\n\nO padrão GL_LESS significa \"o mais próximo vence\". Você muda para passadas especiais — GL_LEQUAL deixa uma skybox desenhada exatamente em profundidade 1.0 passar contra um buffer limpo.",
    },
    params: [
      {
        name: "func", type: "GLenum",
        desc: { en: "Comparison between the NEW fragment depth and the STORED depth.", pt: "Comparação entre a profundidade do fragmento NOVO e a GUARDADA." },
        values: [
          { name: "GL_LESS", desc: { en: "Pass if closer (default).", pt: "Passa se estiver mais perto (padrão)." } },
          { name: "GL_LEQUAL", desc: { en: "Pass if closer or equal — skyboxes, multi-pass rendering.", pt: "Passa se mais perto ou igual — skyboxes, renderização em várias passadas." } },
          { name: "GL_GREATER / GL_GEQUAL", desc: { en: "Reversed-Z setups.", pt: "Configurações com Z invertido." } },
          { name: "GL_ALWAYS / GL_NEVER", desc: { en: "Always / never pass.", pt: "Sempre / nunca passa." } },
          { name: "GL_EQUAL / GL_NOTEQUAL", desc: { en: "Exact matches (depth pre-pass).", pt: "Igualdade exata (depth pre-pass)." } },
        ],
      },
    ],
    example: `glDepthFunc(GL_LEQUAL);
drawSkybox();
glDepthFunc(GL_LESS);`,
    related: ["glEnable", "glDepthMask", "glClear"],
    khronos: `${KHR}glDepthFunc.xhtml`,
  },
  {
    name: "glDepthMask",
    category: "fragment-ops",
    since: "GL 1.0",
    signature: "void glDepthMask(GLboolean flag);",
    summary: {
      en: "Turns writing to the depth buffer on or off (testing still happens).",
      pt: "Liga ou desliga a escrita no depth buffer (o teste continua acontecendo).",
    },
    description: {
      en: "Depth testing and depth writing are separate. With glDepthMask(GL_FALSE) fragments are still tested against existing depth, but they do not update it.\n\nThe standard use is transparent objects: they must be hidden behind opaque walls (test), but must not hide what is behind them (no write).",
      pt: "Testar e escrever profundidade são coisas separadas. Com glDepthMask(GL_FALSE) os fragmentos continuam sendo testados contra a profundidade existente, mas não a atualizam.\n\nO uso padrão é em objetos transparentes: eles precisam ficar escondidos atrás de paredes opacas (teste), mas não podem esconder o que está atrás deles (sem escrita).",
    },
    params: [
      { name: "flag", type: "GLboolean", desc: { en: "GL_TRUE to write depth (default), GL_FALSE to keep it read-only.", pt: "GL_TRUE para escrever profundidade (padrão), GL_FALSE para deixar só leitura." } },
    ],
    notes: [
      { en: "glClear respects the mask: with depth writes off, GL_DEPTH_BUFFER_BIT does nothing. Always restore GL_TRUE at the end of the frame.", pt: "glClear respeita a máscara: com a escrita desligada, GL_DEPTH_BUFFER_BIT não faz nada. Sempre restaure GL_TRUE no fim do frame." },
    ],
    example: `drawOpaque();
glDepthMask(GL_FALSE);
drawTransparentSortedBackToFront();
glDepthMask(GL_TRUE);`,
    related: ["glDepthFunc", "glBlendFunc", "glClear"],
    khronos: `${KHR}glDepthMask.xhtml`,
  },
  {
    name: "glBlendFunc",
    category: "fragment-ops",
    since: "GL 1.0",
    signature: "void glBlendFunc(GLenum sfactor, GLenum dfactor);",
    summary: {
      en: "Sets how a new fragment's color is mixed with the color already in the framebuffer.",
      pt: "Define como a cor do fragmento novo é misturada com a cor que já está no framebuffer.",
    },
    description: {
      en: "With GL_BLEND enabled, the final color is:\n\nresult = source × sfactor + destination × dfactor\n\nwhere source is the fragment shader output and destination is what was already drawn. For normal transparency, sfactor = GL_SRC_ALPHA and dfactor = GL_ONE_MINUS_SRC_ALPHA: a 30% opaque fragment contributes 30% of its color and keeps 70% of what is behind.",
      pt: "Com GL_BLEND ligado, a cor final é:\n\nresultado = origem × sfactor + destino × dfactor\n\nonde origem é a saída do fragment shader e destino é o que já estava desenhado. Para transparência normal, sfactor = GL_SRC_ALPHA e dfactor = GL_ONE_MINUS_SRC_ALPHA: um fragmento 30% opaco contribui com 30% da sua cor e mantém 70% do que está atrás.",
    },
    params: [
      { name: "sfactor", type: "GLenum", desc: { en: "Multiplier for the NEW (source) color.", pt: "Multiplicador da cor NOVA (origem)." }, values: BLEND_FACTORS },
      { name: "dfactor", type: "GLenum", desc: { en: "Multiplier for the EXISTING (destination) color.", pt: "Multiplicador da cor EXISTENTE (destino)." }, values: BLEND_FACTORS },
    ],
    notes: [
      { en: "Order matters: draw opaque objects first, then transparent ones from farthest to nearest.", pt: "A ordem importa: desenhe objetos opacos primeiro, depois os transparentes do mais distante para o mais próximo." },
      { en: "Blending does nothing until glEnable(GL_BLEND).", pt: "O blending não faz nada até glEnable(GL_BLEND)." },
    ],
    example: `glEnable(GL_BLEND);
glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);`,
    related: ["glEnable", "glDepthMask"],
    khronos: `${KHR}glBlendFunc.xhtml`,
  },
  {
    name: "glCullFace",
    category: "fragment-ops",
    since: "GL 1.0",
    signature: "void glCullFace(GLenum mode);",
    summary: {
      en: "Chooses which faces are discarded when face culling is enabled.",
      pt: "Escolhe quais faces são descartadas quando o face culling está ligado.",
    },
    description: {
      en: "On a closed mesh, the triangles facing away from the camera are always hidden behind the ones facing it. Culling skips them before rasterization, saving roughly half the fragment work. Whether a triangle is front or back is decided by its winding (see glFrontFace).",
      pt: "Em uma malha fechada, os triângulos virados de costas para a câmera sempre ficam escondidos atrás dos que estão de frente. O culling pula esses triângulos antes da rasterização, economizando cerca de metade do trabalho com fragmentos. Se um triângulo é frente ou costas é decidido pela ordem dos vértices (veja glFrontFace).",
    },
    params: [
      {
        name: "mode", type: "GLenum",
        desc: { en: "Which side to discard.", pt: "Qual lado descartar." },
        values: [
          { name: "GL_BACK", desc: { en: "Discard back faces (default).", pt: "Descarta as faces de trás (padrão)." } },
          { name: "GL_FRONT", desc: { en: "Discard front faces — used in shadow passes to reduce peter-panning.", pt: "Descarta as faces da frente — usado em passadas de sombra para reduzir peter-panning." } },
          { name: "GL_FRONT_AND_BACK", desc: { en: "Discard all polygons (lines and points still draw).", pt: "Descarta todos os polígonos (linhas e pontos ainda desenham)." } },
        ],
      },
    ],
    example: `glEnable(GL_CULL_FACE);
glCullFace(GL_BACK);
glFrontFace(GL_CCW);`,
    related: ["glFrontFace", "glEnable"],
    khronos: `${KHR}glCullFace.xhtml`,
  },
  {
    name: "glFrontFace",
    category: "fragment-ops",
    since: "GL 1.0",
    signature: "void glFrontFace(GLenum mode);",
    summary: {
      en: "Defines which vertex order (winding) counts as a front-facing triangle.",
      pt: "Define qual ordem de vértices (winding) conta como triângulo de frente.",
    },
    description: {
      en: "After projection, a triangle's vertices appear on screen either counter-clockwise or clockwise. OpenGL uses this to tell front from back. The default is counter-clockwise (GL_CCW) — the convention of most modeling tools and of glTF.",
      pt: "Depois da projeção, os vértices de um triângulo aparecem na tela no sentido anti-horário ou horário. O OpenGL usa isso para distinguir frente de costas. O padrão é anti-horário (GL_CCW) — a convenção da maioria das ferramentas de modelagem e do glTF.",
    },
    params: [
      {
        name: "mode", type: "GLenum",
        desc: { en: "Winding of front faces.", pt: "Ordem das faces da frente." },
        values: [
          { name: "GL_CCW", desc: { en: "Counter-clockwise (default).", pt: "Anti-horário (padrão)." } },
          { name: "GL_CW", desc: { en: "Clockwise.", pt: "Horário." } },
        ],
      },
    ],
    notes: [
      { en: "A model that looks inside-out with culling on usually has the opposite winding — flip it here or in the exporter.", pt: "Um modelo que parece do avesso com culling ligado geralmente tem a ordem oposta — inverta aqui ou no exportador." },
    ],
    example: `glFrontFace(GL_CCW);`,
    related: ["glCullFace"],
    khronos: `${KHR}glFrontFace.xhtml`,
  },
  {
    name: "glPolygonMode",
    category: "fragment-ops",
    since: "GL 1.0",
    signature: "void glPolygonMode(GLenum face, GLenum mode);",
    summary: {
      en: "Draws polygons filled, as wireframe lines, or as points.",
      pt: "Desenha polígonos preenchidos, como linhas (wireframe) ou como pontos.",
    },
    description: {
      en: "A debugging favorite: GL_LINE shows the triangle edges of everything you draw, which makes it easy to see mesh density, broken indices or missing triangles.",
      pt: "Uma favorita para depuração: GL_LINE mostra as arestas dos triângulos de tudo que você desenha, o que facilita ver a densidade da malha, índices quebrados ou triângulos faltando.",
    },
    params: [
      { name: "face", type: "GLenum", desc: { en: "Must be GL_FRONT_AND_BACK in the core profile.", pt: "Deve ser GL_FRONT_AND_BACK no core profile." } },
      {
        name: "mode", type: "GLenum",
        desc: { en: "How to rasterize.", pt: "Como rasterizar." },
        values: [
          { name: "GL_FILL", desc: { en: "Filled triangles (default).", pt: "Triângulos preenchidos (padrão)." } },
          { name: "GL_LINE", desc: { en: "Wireframe.", pt: "Wireframe." } },
          { name: "GL_POINT", desc: { en: "Only vertices.", pt: "Só os vértices." } },
        ],
      },
    ],
    example: `glPolygonMode(GL_FRONT_AND_BACK, GL_LINE);  // wireframe on
drawScene();
glPolygonMode(GL_FRONT_AND_BACK, GL_FILL);  // back to normal`,
    related: ["glPolygonOffset"],
    khronos: `${KHR}glPolygonMode.xhtml`,
  },
  {
    name: "glPolygonOffset",
    category: "fragment-ops",
    since: "GL 1.1",
    signature: "void glPolygonOffset(GLfloat factor, GLfloat units);",
    summary: {
      en: "Pushes polygon depth values slightly, to avoid z-fighting and shadow acne.",
      pt: "Desloca levemente a profundidade dos polígonos, para evitar z-fighting e shadow acne.",
    },
    description: {
      en: "When two surfaces have almost the same depth (a decal on a wall, or a surface compared with its own shadow map), rounding makes them flicker — z-fighting. Polygon offset adds a small bias to the depth of what you draw next. The offset is factor × (depth slope of the polygon) + units × (smallest depth step).\n\nIt only applies after glEnable(GL_POLYGON_OFFSET_FILL).",
      pt: "Quando duas superfícies têm quase a mesma profundidade (um decalque em uma parede, ou uma superfície comparada com o próprio shadow map), o arredondamento faz elas piscarem — z-fighting. O polygon offset soma um pequeno viés à profundidade do que você desenhar em seguida. O deslocamento é factor × (inclinação de profundidade do polígono) + units × (menor passo de profundidade).\n\nSó é aplicado depois de glEnable(GL_POLYGON_OFFSET_FILL).",
    },
    params: [
      { name: "factor", type: "GLfloat", desc: { en: "Scales with how steep the polygon is relative to the camera. Typical: 1.0–4.0.", pt: "Escala com o quanto o polígono está inclinado em relação à câmera. Típico: 1.0–4.0." } },
      { name: "units", type: "GLfloat", desc: { en: "Constant offset in depth-buffer steps. Typical: 1.0–4.0.", pt: "Deslocamento constante em passos do depth buffer. Típico: 1.0–4.0." } },
    ],
    example: `// shadow pass
glEnable(GL_POLYGON_OFFSET_FILL);
glPolygonOffset(2.0f, 4.0f);
renderSceneDepthOnly();
glDisable(GL_POLYGON_OFFSET_FILL);`,
    related: ["glDepthFunc", "glEnable"],
    khronos: `${KHR}glPolygonOffset.xhtml`,
  },
];
