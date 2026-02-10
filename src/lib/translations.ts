export const translations = {
  en: {
    // Navbar
    navAbout: "About me",
    navProjects: "Projects",
    navBlog: "Blog",
    navLearn: "Learn",
    navContact: "Contact",

    // Hero
    heroTitle: "Gabriel Carvalho",
    heroSubtitle: "Engine Programmer • Game Developer • Fullstack",
    heroDescription: "I build systems from scratch. Engines, games and tools that actually work.",
    heroViewProjects: "View projects",
    heroContact: "Contact",
    heroMyCv: "My CV",

    // About Section
    aboutTitle: "About me",
    aboutPara1: "My interest in programming began in 2015 because I was captivated by the mechanics of interactive systems. I was never just interested in using software. I wanted to understand the intersection of logic and performance that makes a digital experience feel seamless.",
    aboutPara2: "Since making a full commitment to software and game development in 2023, I have focused on building a solid foundation in C++ and computer graphics. I use my personal projects as a way to explore complex areas like low level development. Working with OpenGL and SDL2 has been a rewarding way for me to practice system design and performance optimization.",
    aboutPara3: "These projects are where I go to satisfy my technical curiosity and challenge myself with problems from the ground up.",
    readMore: "Read more",
    readLess: "Read less",
  },

  pt: {
    // Navbar
    navAbout: "Sobre mim",
    navProjects: "Projetos",
    navBlog: "Blog",
    navLearn: "Aprender",
    navContact: "Contato",

    // Hero
    heroTitle: "Gabriel Carvalho",
    heroSubtitle: "Programador de Engine • Dev de Jogos • Fullstack",
    heroDescription: "Eu construo sistemas do zero. Engines, jogos e ferramentas que realmente funcionam.",
    heroViewProjects: "Ver projetos",
    heroContact: "Contato",
    heroMyCv: "Meu CV",

    // About Section
    aboutTitle: "Sobre mim",
    aboutPara1: "Meu interesse por programação começou em 2015, cativado pela mecânica de sistemas interativos. Nunca me interessei apenas em usar softwares; eu queria entender a interseção entre lógica e performance que faz uma experiência digital parecer fluida.",
    aboutPara2: "Desde que me comprometi totalmente com o desenvolvimento de software e jogos em 2023, foquei em construir uma base sólida em C++ e computação gráfica. Uso meus projetos pessoais para explorar áreas complexas como desenvolvimento de baixo nível. Trabalhar com OpenGL e SDL2 tem sido recompensador para praticar design de sistemas e otimização.",
    aboutPara3: "Estes projetos são onde satisfaço minha curiosidade técnica e me desafio com problemas do zero.",
    readMore: "Ler mais",
    readLess: "Ler menos",
  },

  es: {
    // Navbar
    navAbout: "Sobre mí",
    navProjects: "Proyectos",
    navBlog: "Blog",
    navLearn: "Aprender",
    navContact: "Contacto",

    // Hero
    heroTitle: "Gabriel Carvalho",
    heroSubtitle: "Programador de Motores • Dev de Juegos • Fullstack",
    heroDescription: "Construyo sistemas desde cero. Motores, juegos y herramientas que realmente funcionas.",
    heroViewProjects: "Ver proyectos",
    heroContact: "Contacto",
    heroMyCv: "Mi CV",

    // About Section
    aboutTitle: "Sobre mí",
    aboutPara1: "Mi interés por la programación comenzó en 2015, cautivado por la mecánica de los sistemas interactivos. Nunca me interesó solo usar software; quería entender la intersección entre la lógica y el rendimiento.",
    aboutPara2: "Desde que me comprometí totalmente con el desarrollo de software y juegos en 2023, me he centrado en construir una base sólida en C++ y gráficos por computadora.",
    aboutPara3: "Estos proyectos son donde satisfago mi curiosidad técnica y me desafío con problemas desde la raíz.",
    readMore: "Leer más",
    readLess: "Leer menos",
  },

  zh: {
    // Navbar
    navAbout: "关于我",
    navProjects: "项目",
    navBlog: "博客",
    navLearn: "学习",
    navContact: "联系",

    // Hero
    heroTitle: "加布里埃尔·卡瓦略",
    heroSubtitle: "引擎程序员 • 游戏开发 • 全栈",
    heroDescription: "我从零开始构建系统。真正起作用的引擎、游戏和工具。",
    heroViewProjects: "查看项目",
    heroContact: "联系我",
    heroMyCv: "简历",

    // About Section
    aboutTitle: "关于我",
    aboutPara1: "我对编程的兴趣始于2015年，因为我被交互系统的机制所吸引。我从不满足于仅仅使用软件，我想了解逻辑与性能的交汇点。",
    aboutPara2: "自2023年全身心投入软件和游戏开发以来，我一直专注于建立C++和计算机图形学的坚实基础。我利用个人项目探索底层开发等复杂领域。",
    aboutPara3: "在这些项目中，我满足了自己的技术好奇心，并从根本上挑战难题。",
    readMore: "阅读更多",
    readLess: "收起",
  }
};

export type Language = keyof typeof translations;