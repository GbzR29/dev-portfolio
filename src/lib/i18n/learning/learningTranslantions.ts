// src/lib/i18n/learning/learningTranslations.ts

export const learningTranslations = {
  en: {
    // ── Learn page ──────────────────────────────────────────────────────────

    // Track cards
    beginner:     "Beginner",
    intermediate: "Intermediate",
    advanced:     "Advanced",
    begAdv:       "Beginner → Advanced",

    // Track descriptions
    trackCppDesc:
      "Master modern C++ from the ground up: memory management, RAII, templates, move semantics, and the patterns that power performant game engines.",
    trackOpenglDesc:
      "Understand the full OpenGL pipeline: vertex buffers, shaders, textures, framebuffers, and compute shaders — through hands-on C++ code.",
    trackVulkanDesc:
      "Vulkan 1.3 from an empty window to a textured 3D scene: instance and devices, swapchain, pipelines, command buffers, synchronization, memory and descriptors — the explicit GPU API, every object explained.",
    trackSdlDesc:
      "Build real applications with SDL3: window management, input handling, audio, and a complete 2D rendering loop using C++.",
    trackGameDevDesc:
      "Game loops and fixed timesteps, easing and springs, randomness and Perlin noise, collision detection and the patterns behind fast game code — with interactive figures.",
    trackMathDesc:
      "Mathematics from the ground up: arithmetic, algebra, geometry, trigonometry, linear algebra and calculus, worked by hand — every formula explained, every idea interactive.",
    trackAlgoDesc:
      "Algorithms and data structures built from scratch in C++: memory and Big-O, recursion, sorting and searching, lists, hash tables, trees, heaps and graphs — every step traced in an interactive figure.",

    // AI banner

    // ── Lesson page ─────────────────────────────────────────────────────────
    lessonChapters:   "Chapters",
    lessonMinRead:    "min read",
    lessonCreated:    "created",
    lessonUpdated:    "updated",
    lessonProgress:   "Progress",

    // ── Redesign (2026-09) ──────────────────────────────────────────────
    trackName_cpp: "Modern C++",
    trackName_opengl: "OpenGL 4.6",
    trackName_glsl: "GLSL",
    trackName_sdl3: "SDL3",
    trackName_gamedev: "Game Dev",
    trackName_math: "Math",
    trackName_algorithms: "Algorithms",
    trackName_vulkan: "Vulkan",
    learnCrumb: "learn",
    lessonChapterOf: "chapter {n} of {total}",
    lessonOnThisPage: "On this page",
    lessonPrevShort: "previous",
    lessonNextShort: "next",
    lessonTrackDone: "track complete",
    lessonAllTracks: "All tracks",
    learnEyebrow: "learn · {lessons} lessons in {tracks} tracks",
    learnHeroTitle: "Learn from scratch",
    learnLead: "Hand-written courses on graphics, C++, game development and math. Every formula is explained term by term, and the figures run in your browser.",
    learnResume: "where you left off:",
    learnTracks: "Tracks",
    learnContinue: "Continue →",
    learnStart: "Start →",
    learnReference: "reference",
    learnLessonsN: "{n} lessons",
    learnSectionsN: "{n} sections",
    learnReadN: "read: {n}",
    learnPlannedN: "{n} lessons planned",
    learnSoon: "coming soon",
    learnInPrep: "in preparation",
    learnHowTitle: "How the lessons work",
    learnHow1Title: "Every term explained",
    learnHow1Body: "No formula appears without saying what each letter means, where each constant comes from and why each step is allowed.",
    learnHow2Title: "Figures you can move",
    learnHow2Body: "Drag points, move sliders and rotate 3D scenes. The figures run in the browser, on phones too.",
    learnHow3Title: "Your progress stays here",
    learnHow3Body: "Lessons you have read are marked in this browser, with no account and no sign-up.",
    modeRead: "reading", modeFocus: "focus", modeTitle: "Reading mode",
    focusIntro: "Introduction", focusStepOf: "{n} of {total}",
    focusBack: "back", focusNext: "continue", focusNextChapter: "next lesson",
    focusHintKeys: "← → move between steps", focusHintSwipe: "swipe sideways to move between steps",

    // ── Function reference ──────────────────────────────────────────────
    refTitle:             "Function reference",
    refSidebarHint:       "Every function used in the track, with parameters and examples",
    refIntro:             "Every function used in the lessons, explained one by one: what it does, what each parameter means, which values it accepts, common mistakes and a short example.",
    refOpenDocs:          "Open full documentation",
    refUsedInChapter:     "Functions used in this chapter",
    refUsedInChapterHint: "Click any function to see its parameters, accepted values, common mistakes and an example.",
    refSeeAll:            "Full reference →",
    refBackToLessons:     "Back to lessons",
    refFilter:            "Filter functions…",
    refSearch:            "Search by name or description…",
    refNoMatch:           "No function matches.",
    refCategories:        "Categories",
    refFunctions:         "functions",
    refOnThisPage:        "On this page",
    refSignature:         "Signature",
    refDescription:       "How it works",
    refParameters:        "Parameters",
    refAcceptedValues:    "Common values",
    refReturns:           "Return value",
    refNotes:             "Tips & pitfalls",
    refErrors:            "Errors",
    refErrorsHint:        "When the call is invalid it does nothing and sets an error, which glGetError returns:",
    refExample:           "Example",
    refUsedIn:            "Used in lessons",
    refRelated:           "Related",
    refDeprecated:        "Removed from the core profile.",
    refKhronos:           "Official Khronos documentation",
  },

  pt: {
    // ── Learn page ──────────────────────────────────────────────────────────

    beginner:     "Iniciante",
    intermediate: "Intermediário",
    advanced:     "Avançado",
    begAdv:       "Iniciante → Avançado",

    trackCppDesc:
      "Domine o C++ moderno desde a base: gerenciamento de memória, RAII, templates, move semantics e os padrões que alimentam game engines de alta performance.",
    trackOpenglDesc:
      "Entenda o pipeline completo do OpenGL: vertex buffers, shaders, texturas, framebuffers e compute shaders — com código C++ prático.",
    trackVulkanDesc:
      "Vulkan 1.3 de uma janela vazia até uma cena 3D texturizada: instance e dispositivos, swapchain, pipelines, command buffers, sincronização, memória e descritores — a API explícita de GPU, cada objeto explicado.",
    trackSdlDesc:
      "Construa aplicações reais com SDL3: gerenciamento de janelas, input, áudio e um loop de renderização 2D completo em C++.",
    trackGameDevDesc:
      "Game loop e timestep fixo, easing e molas, aleatoriedade e Perlin noise, detecção de colisão e os padrões por trás de código de jogo rápido — com figuras interativas.",
    trackMathDesc:
      "Matemática desde a base: aritmética, álgebra, geometria, trigonometria, álgebra linear e cálculo, feitos à mão — cada fórmula explicada, cada ideia interativa.",
    trackAlgoDesc:
      "Algoritmos e estruturas de dados construídos do zero em C++: memória e Big-O, recursão, ordenação e busca, listas, tabelas hash, árvores, heaps e grafos — cada passo acompanhado numa figura interativa.",


    // ── Lesson page ─────────────────────────────────────────────────────────
    lessonChapters:    "Capítulos",
    lessonMinRead:     "min de leitura",
    lessonCreated:     "criado em",
    lessonUpdated:     "atualizado em",
    lessonProgress:    "Progresso",

    // ── Redesign (2026-09) ──────────────────────────────────────────────
    trackName_cpp: "C++ moderno",
    trackName_opengl: "OpenGL 4.6",
    trackName_glsl: "GLSL",
    trackName_sdl3: "SDL3",
    trackName_gamedev: "Game Dev",
    trackName_math: "Matemática",
    trackName_algorithms: "Algoritmos",
    trackName_vulkan: "Vulkan",
    learnCrumb: "aprender",
    lessonChapterOf: "capítulo {n} de {total}",
    lessonOnThisPage: "Nesta página",
    lessonPrevShort: "anterior",
    lessonNextShort: "próxima",
    lessonTrackDone: "trilha concluída",
    lessonAllTracks: "Todas as trilhas",
    learnEyebrow: "aprender · {lessons} aulas em {tracks} trilhas",
    learnHeroTitle: "Aprender do zero",
    learnLead: "Cursos escritos à mão sobre gráficos, C++, desenvolvimento de jogos e matemática. Cada fórmula é explicada termo a termo, e as figuras rodam no seu navegador.",
    learnResume: "de onde você parou:",
    learnTracks: "Trilhas",
    learnContinue: "Continuar →",
    learnStart: "Começar →",
    learnReference: "referência",
    learnLessonsN: "{n} aulas",
    learnSectionsN: "{n} seções",
    learnReadN: "lidas: {n}",
    learnPlannedN: "{n} aulas planejadas",
    learnSoon: "em breve",
    learnInPrep: "em preparação",
    learnHowTitle: "Como as aulas funcionam",
    learnHow1Title: "Cada termo explicado",
    learnHow1Body: "Nenhuma fórmula aparece sem dizer o que cada letra significa, de onde vem cada constante e por que cada passo é permitido.",
    learnHow2Title: "Figuras que você mexe",
    learnHow2Body: "Arraste pontos, mova sliders e gire cenas 3D. As figuras rodam no navegador, também no celular.",
    learnHow3Title: "Seu progresso fica aqui",
    learnHow3Body: "As aulas lidas ficam marcadas neste navegador, sem conta e sem cadastro.",
    modeRead: "leitura", modeFocus: "foco", modeTitle: "Modo de leitura",
    focusIntro: "Introdução", focusStepOf: "{n} de {total}",
    focusBack: "voltar", focusNext: "continuar", focusNextChapter: "próxima aula",
    focusHintKeys: "← → para mudar de passo", focusHintSwipe: "deslize para os lados para mudar de passo",

    // ── Function reference ──────────────────────────────────────────────
    refTitle:             "Referência de funções",
    refSidebarHint:       "Todas as funções usadas na trilha, com parâmetros e exemplos",
    refIntro:             "Todas as funções usadas nas lições, explicadas uma a uma: o que fazem, o que significa cada parâmetro, quais valores aceitam, erros comuns e um exemplo curto.",
    refOpenDocs:          "Abrir documentação completa",
    refUsedInChapter:     "Funções usadas neste capítulo",
    refUsedInChapterHint: "Clique em qualquer função para ver os parâmetros, valores aceitos, erros comuns e um exemplo.",
    refSeeAll:            "Referência completa →",
    refBackToLessons:     "Voltar às lições",
    refFilter:            "Filtrar funções…",
    refSearch:            "Buscar por nome ou descrição…",
    refNoMatch:           "Nenhuma função encontrada.",
    refCategories:        "Categorias",
    refFunctions:         "funções",
    refOnThisPage:        "Nesta página",
    refSignature:         "Assinatura",
    refDescription:       "Como funciona",
    refParameters:        "Parâmetros",
    refAcceptedValues:    "Valores comuns",
    refReturns:           "Valor de retorno",
    refNotes:             "Dicas e armadilhas",
    refErrors:            "Erros",
    refErrorsHint:        "Quando a chamada é inválida ela não faz nada e registra um erro, que glGetError retorna:",
    refExample:           "Exemplo",
    refUsedIn:            "Usada nas lições",
    refRelated:           "Relacionadas",
    refDeprecated:        "Removida do core profile.",
    refKhronos:           "Documentação oficial da Khronos",
  },

  es: {
    // ── Learn page ──────────────────────────────────────────────────────────

    beginner:     "Principiante",
    intermediate: "Intermedio",
    advanced:     "Avanzado",
    begAdv:       "Principiante → Avanzado",

    trackCppDesc:
      "Domina C++ moderno desde la base: gestión de memoria, RAII, plantillas, move semantics y los patrones que impulsan motores de juegos de alto rendimiento.",
    trackOpenglDesc:
      "Comprende el pipeline completo de OpenGL: vertex buffers, shaders, texturas, framebuffers y compute shaders — con código C++ práctico.",
    trackVulkanDesc:
      "Vulkan 1.3 desde una ventana vacía hasta una escena 3D texturizada: instancia y dispositivos, swapchain, pipelines, command buffers, sincronización, memoria y descriptores — la API explícita de GPU, cada objeto explicado.",
    trackSdlDesc:
      "Construye aplicaciones reales con SDL3: gestión de ventanas, entrada, audio y un bucle de renderizado 2D completo en C++.",
    trackGameDevDesc:
      "Game loop y timestep fijo, easing y muelles, aleatoriedad y ruido Perlin, detección de colisiones y los patrones detrás del código de juego rápido — con figuras interactivas.",
    trackMathDesc:
      "Matemáticas desde la base: aritmética, álgebra, geometría, trigonometría, álgebra lineal y cálculo, hechos a mano — cada fórmula explicada, cada idea interactiva.",
    trackAlgoDesc:
      "Algoritmos y estructuras de datos construidos desde cero en C++: memoria y Big-O, recursión, ordenación y búsqueda, listas, tablas hash, árboles, heaps y grafos — cada paso seguido en una figura interactiva.",


    lessonChapters:    "Capítulos",
    lessonMinRead:     "min de lectura",
    lessonCreated:     "creado el",
    lessonUpdated:     "actualizado el",
    lessonProgress:    "Progreso",

    // ── Redesign (2026-09) ──────────────────────────────────────────────
    trackName_cpp: "C++ moderno",
    trackName_opengl: "OpenGL 4.6",
    trackName_glsl: "GLSL",
    trackName_sdl3: "SDL3",
    trackName_gamedev: "Game Dev",
    trackName_math: "Matemáticas",
    trackName_algorithms: "Algoritmos",
    trackName_vulkan: "Vulkan",
    learnCrumb: "aprender",
    lessonChapterOf: "capítulo {n} de {total}",
    lessonOnThisPage: "En esta página",
    lessonPrevShort: "anterior",
    lessonNextShort: "siguiente",
    lessonTrackDone: "curso completado",
    lessonAllTracks: "Todos los cursos",
    learnEyebrow: "aprender · {lessons} lecciones en {tracks} cursos",
    learnHeroTitle: "Aprender desde cero",
    learnLead: "Cursos escritos a mano sobre gráficos, C++, desarrollo de juegos y matemáticas. Cada fórmula se explica término a término, y las figuras se ejecutan en tu navegador.",
    learnResume: "donde lo dejaste:",
    learnTracks: "Cursos",
    learnContinue: "Continuar →",
    learnStart: "Empezar →",
    learnReference: "referencia",
    learnLessonsN: "{n} lecciones",
    learnSectionsN: "{n} secciones",
    learnReadN: "leídas: {n}",
    learnPlannedN: "{n} lecciones planeadas",
    learnSoon: "próximamente",
    learnInPrep: "en preparación",
    learnHowTitle: "Cómo funcionan las lecciones",
    learnHow1Title: "Cada término explicado",
    learnHow1Body: "Ninguna fórmula aparece sin decir qué significa cada letra, de dónde sale cada constante y por qué cada paso está permitido.",
    learnHow2Title: "Figuras que puedes mover",
    learnHow2Body: "Arrastra puntos, mueve deslizadores y gira escenas 3D. Las figuras se ejecutan en el navegador, también en el móvil.",
    learnHow3Title: "Tu progreso se queda aquí",
    learnHow3Body: "Las lecciones leídas quedan marcadas en este navegador, sin cuenta ni registro.",
    modeRead: "lectura", modeFocus: "enfoque", modeTitle: "Modo de lectura",
    focusIntro: "Introducción", focusStepOf: "{n} de {total}",
    focusBack: "atrás", focusNext: "continuar", focusNextChapter: "siguiente lección",
    focusHintKeys: "← → para cambiar de paso", focusHintSwipe: "desliza hacia los lados para cambiar de paso",

    // ── Function reference ──────────────────────────────────────────────
    refTitle:             "Referencia de funciones",
    refSidebarHint:       "Todas las funciones usadas en la ruta, con parámetros y ejemplos",
    refIntro:             "Todas las funciones usadas en las lecciones, explicadas una a una: qué hacen, qué significa cada parámetro, qué valores aceptan, errores comunes y un ejemplo corto.",
    refOpenDocs:          "Abrir documentación completa",
    refUsedInChapter:     "Funciones usadas en este capítulo",
    refUsedInChapterHint: "Haz clic en cualquier función para ver sus parámetros, valores aceptados, errores comunes y un ejemplo.",
    refSeeAll:            "Referencia completa →",
    refBackToLessons:     "Volver a las lecciones",
    refFilter:            "Filtrar funciones…",
    refSearch:            "Buscar por nombre o descripción…",
    refNoMatch:           "Ninguna función coincide.",
    refCategories:        "Categorías",
    refFunctions:         "funciones",
    refOnThisPage:        "En esta página",
    refSignature:         "Firma",
    refDescription:       "Cómo funciona",
    refParameters:        "Parámetros",
    refAcceptedValues:    "Valores comunes",
    refReturns:           "Valor de retorno",
    refNotes:             "Consejos y trampas",
    refErrors:            "Errores",
    refErrorsHint:        "Cuando la llamada es inválida no hace nada y registra un error, que glGetError devuelve:",
    refExample:           "Ejemplo",
    refUsedIn:            "Usada en las lecciones",
    refRelated:           "Relacionadas",
    refDeprecated:        "Eliminada del core profile.",
    refKhronos:           "Documentación oficial de Khronos",
  },

  zh: {
    // ── Learn page ──────────────────────────────────────────────────────────

    beginner:     "入门",
    intermediate: "中级",
    advanced:     "高级",
    begAdv:       "入门 → 高级",

    trackCppDesc:
      "从零掌握现代C++：内存管理、RAII、模板、移动语义，以及驱动高性能游戏引擎的设计模式。",
    trackOpenglDesc:
      "深入理解完整的OpenGL管线：顶点缓冲、着色器、纹理、帧缓冲和计算着色器——通过实践C++代码。",
    trackVulkanDesc:
      "Vulkan 1.3：从空窗口到带纹理的 3D 场景——实例与设备、交换链、管线、命令缓冲区、同步、内存与描述符。显式 GPU API，每个对象都有讲解。",
    trackSdlDesc:
      "使用SDL3构建真实应用：窗口管理、输入处理、音频和完整的2D渲染循环，全部用C++实现。",
    trackGameDevDesc:
      "游戏循环与固定时间步长、缓动与弹簧、随机数与Perlin噪声、碰撞检测，以及高效游戏代码背后的设计模式——配有交互式图示。",
    trackMathDesc:
      "从零开始的数学：算术、代数、几何、三角学、线性代数与微积分，全部手算推导——每个公式都有解释，每个概念都可交互。",
    trackAlgoDesc:
      "用 C++ 从零实现算法与数据结构：内存与大 O、递归、排序与查找、链表、哈希表、树、堆和图——每一步都能在交互图中逐步查看。",


    lessonChapters:    "章节",
    lessonMinRead:     "分钟阅读",
    lessonCreated:     "创建于",
    lessonUpdated:     "更新于",
    lessonProgress:    "进度",

    // ── Redesign (2026-09) ──────────────────────────────────────────────
    trackName_cpp: "现代 C++",
    trackName_opengl: "OpenGL 4.6",
    trackName_glsl: "GLSL",
    trackName_sdl3: "SDL3",
    trackName_gamedev: "游戏开发",
    trackName_math: "数学",
    trackName_algorithms: "算法",
    trackName_vulkan: "Vulkan",
    learnCrumb: "学习",
    lessonChapterOf: "第 {n} 章，共 {total} 章",
    lessonOnThisPage: "本页内容",
    lessonPrevShort: "上一节",
    lessonNextShort: "下一节",
    lessonTrackDone: "课程完成",
    lessonAllTracks: "全部课程",
    learnEyebrow: "学习 · {tracks} 门课程，共 {lessons} 节",
    learnHeroTitle: "从零开始学",
    learnLead: "手写的图形学、C++、游戏开发与数学课程。每个公式都逐项讲解，交互图示直接在浏览器中运行。",
    learnResume: "上次读到：",
    learnTracks: "课程",
    learnContinue: "继续 →",
    learnStart: "开始 →",
    learnReference: "参考",
    learnLessonsN: "{n} 节",
    learnSectionsN: "{n} 个部分",
    learnReadN: "已读 {n}",
    learnPlannedN: "计划 {n} 节",
    learnSoon: "即将推出",
    learnInPrep: "准备中",
    learnHowTitle: "课程如何进行",
    learnHow1Title: "每一项都讲清楚",
    learnHow1Body: "每个公式都会说明每个字母的含义、每个常数的来源，以及每一步为何成立。",
    learnHow2Title: "可以动手的图示",
    learnHow2Body: "拖动点、移动滑块、旋转 3D 场景。图示在浏览器中运行，手机上也可以。",
    learnHow3Title: "进度保存在本地",
    learnHow3Body: "已读的课程会标记在此浏览器中，无需账号，无需注册。",
    modeRead: "阅读", modeFocus: "专注", modeTitle: "阅读模式",
    focusIntro: "引言", focusStepOf: "{n} / {total}",
    focusBack: "返回", focusNext: "继续", focusNextChapter: "下一节",
    focusHintKeys: "← → 切换步骤", focusHintSwipe: "左右滑动切换步骤",
  },
};