// src/lib/i18n/learning/learningTranslations.ts

export const learningTranslations = {
  en: {
    // ── Learn page ──────────────────────────────────────────────────────────
    learnTitle:   "Learn the",
    learnEngine:  "Engine.",
    learnSubtitle:
      "Free, practical tutorials on C++, OpenGL, Vulkan and game engine architecture — written from a developer who builds these systems from scratch.",

    // Track cards
    lessons:      "lessons",
    startTrack:   "Start →",
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
      "Dive into Vulkan's explicit GPU control: command buffers, render passes, synchronization, and pipeline objects. Not for the faint of heart.",
    trackSdlDesc:
      "Build real applications with SDL3: window management, input handling, audio, and a complete 2D rendering loop using C++.",

    // AI banner
    aiTitle: "AI-powered learning assistant — coming soon",
    aiDesc:
      "Ask any question about C++, graphics APIs, or engine architecture and get answers tailored to the content you're studying.",
    notifyMe: "Notify me",

    // ── Lesson page ─────────────────────────────────────────────────────────
    lessonChapters:   "Chapters",
    lessonOn:         "on",
    lessonPrev:       "← Previous",
    lessonNext:       "Next →",
    lessonBackToLearn:"← Back to modules",
    lessonMinRead:    "min read",
    lessonProgress:   "Progress",

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
    learnTitle:   "Aprenda a",
    learnEngine:  "Engine.",
    learnSubtitle:
      "Tutoriais práticos e gratuitos sobre C++, OpenGL, Vulkan e arquitetura de game engines — escritos por quem constrói esses sistemas do zero.",

    lessons:      "lições",
    startTrack:   "Começar →",
    beginner:     "Iniciante",
    intermediate: "Intermediário",
    advanced:     "Avançado",
    begAdv:       "Iniciante → Avançado",

    trackCppDesc:
      "Domine o C++ moderno desde a base: gerenciamento de memória, RAII, templates, move semantics e os padrões que alimentam game engines de alta performance.",
    trackOpenglDesc:
      "Entenda o pipeline completo do OpenGL: vertex buffers, shaders, texturas, framebuffers e compute shaders — com código C++ prático.",
    trackVulkanDesc:
      "Mergulhe no controle explícito de GPU com Vulkan: command buffers, render passes, sincronização e objetos de pipeline. Não é para iniciantes.",
    trackSdlDesc:
      "Construa aplicações reais com SDL3: gerenciamento de janelas, input, áudio e um loop de renderização 2D completo em C++.",

    aiTitle: "Assistente de aprendizado com IA — em breve",
    aiDesc:
      "Faça qualquer pergunta sobre C++, APIs gráficas ou arquitetura de engines e receba respostas adaptadas ao conteúdo que você está estudando.",
    notifyMe: "Notifique-me",

    // ── Lesson page ─────────────────────────────────────────────────────────
    lessonChapters:    "Capítulos",
    lessonOn:          "em",
    lessonPrev:        "← Anterior",
    lessonNext:        "Próximo →",
    lessonBackToLearn: "← Voltar aos módulos",
    lessonMinRead:     "min de leitura",
    lessonProgress:    "Progresso",

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
    learnTitle:   "Aprende el",
    learnEngine:  "Motor.",
    learnSubtitle:
      "Tutoriales prácticos y gratuitos sobre C++, OpenGL, Vulkan y arquitectura de motores de juegos — escritos por quien construye estos sistemas desde cero.",

    lessons:      "lecciones",
    startTrack:   "Comenzar →",
    beginner:     "Principiante",
    intermediate: "Intermedio",
    advanced:     "Avanzado",
    begAdv:       "Principiante → Avanzado",

    trackCppDesc:
      "Domina C++ moderno desde la base: gestión de memoria, RAII, plantillas, move semantics y los patrones que impulsan motores de juegos de alto rendimiento.",
    trackOpenglDesc:
      "Comprende el pipeline completo de OpenGL: vertex buffers, shaders, texturas, framebuffers y compute shaders — con código C++ práctico.",
    trackVulkanDesc:
      "Sumérgete en el control explícito de GPU con Vulkan: command buffers, render passes, sincronización y objetos de pipeline. No apto para principiantes.",
    trackSdlDesc:
      "Construye aplicaciones reales con SDL3: gestión de ventanas, entrada, audio y un bucle de renderizado 2D completo en C++.",

    aiTitle: "Asistente de aprendizaje con IA — próximamente",
    aiDesc:
      "Haz cualquier pregunta sobre C++, APIs gráficas o arquitectura de motores y recibe respuestas adaptadas al contenido que estás estudiando.",
    notifyMe: "Notificarme",

    lessonChapters:    "Capítulos",
    lessonOn:          "en",
    lessonPrev:        "← Anterior",
    lessonNext:        "Siguiente →",
    lessonBackToLearn: "← Volver a módulos",
    lessonMinRead:     "min de lectura",
    lessonProgress:    "Progreso",

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
    learnTitle:   "学习",
    learnEngine:  "引擎。",
    learnSubtitle:
      "关于C++、OpenGL、Vulkan和游戏引擎架构的免费实用教程——由从零开始构建这些系统的开发者编写。",

    lessons:      "课时",
    startTrack:   "开始 →",
    beginner:     "入门",
    intermediate: "中级",
    advanced:     "高级",
    begAdv:       "入门 → 高级",

    trackCppDesc:
      "从零掌握现代C++：内存管理、RAII、模板、移动语义，以及驱动高性能游戏引擎的设计模式。",
    trackOpenglDesc:
      "深入理解完整的OpenGL管线：顶点缓冲、着色器、纹理、帧缓冲和计算着色器——通过实践C++代码。",
    trackVulkanDesc:
      "深入Vulkan的显式GPU控制：命令缓冲区、渲染通道、同步和管线对象。专为有经验的开发者准备。",
    trackSdlDesc:
      "使用SDL3构建真实应用：窗口管理、输入处理、音频和完整的2D渲染循环，全部用C++实现。",

    aiTitle: "AI学习助手——即将推出",
    aiDesc:
      "提出关于C++、图形API或引擎架构的任何问题，获得针对您所学内容量身定制的答案。",
    notifyMe: "通知我",

    lessonChapters:    "章节",
    lessonOn:          "在",
    lessonPrev:        "← 上一节",
    lessonNext:        "下一节 →",
    lessonBackToLearn: "← 返回模块",
    lessonMinRead:     "分钟阅读",
    lessonProgress:    "进度",
  },
};