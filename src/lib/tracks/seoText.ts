// src/lib/tracks/seoText.ts
// Per-track wording for search results, written around what people type
// ("opengl tutorial", "tutorial de opengl"), not around the track's display
// name ("OpenGL 4.6"). `title` heads the track page; `short` ends each lesson
// title ("Vertex Buffer Objects | OpenGL Tutorial").

import type { UrlLang } from "./urls";

type Wording = { title: string; short: string };

const SEO_TEXT: Record<string, Record<UrlLang, Wording>> = {
  opengl: {
    en: { title: "OpenGL Tutorial: Learn Modern OpenGL in C++", short: "OpenGL Tutorial" },
    pt: { title: "Tutorial de OpenGL: aprenda OpenGL moderno em C++", short: "Tutorial de OpenGL" },
  },
  glsl: {
    en: { title: "GLSL Shader Tutorial: Learn Shaders from Scratch", short: "GLSL Tutorial" },
    pt: { title: "Tutorial de GLSL: aprenda shaders do zero", short: "Tutorial de GLSL" },
  },
  vulkan: {
    en: { title: "Vulkan Tutorial: Learn Vulkan in C++ Step by Step", short: "Vulkan Tutorial" },
    pt: { title: "Tutorial de Vulkan: aprenda Vulkan em C++ passo a passo", short: "Tutorial de Vulkan" },
  },
  cpp: {
    en: { title: "C and C++ Tutorial: Pointers, Memory, RAII and Templates", short: "C/C++ Tutorial" },
    pt: { title: "Curso de C e C++: ponteiros, memória, RAII e templates", short: "Curso de C/C++" },
  },
  asm: {
    en: { title: "x86-64 Assembly Tutorial: Learn NASM Step by Step", short: "Assembly Tutorial" },
    pt: { title: "Tutorial de Assembly x86-64: aprenda NASM passo a passo", short: "Tutorial de Assembly" },
  },
  sdl3: {
    en: { title: "SDL3 Tutorial: Windows, Input and 2D Rendering in C++", short: "SDL3 Tutorial" },
    pt: { title: "Tutorial de SDL3: janelas, input e renderização 2D em C++", short: "Tutorial de SDL3" },
  },
  gamedev: {
    en: { title: "Game Development Techniques: Game Loops, Collisions and Noise", short: "Game Dev Tutorial" },
    pt: { title: "Técnicas de desenvolvimento de jogos: game loop, colisões e ruído", short: "Desenvolvimento de jogos" },
  },
  math: {
    en: { title: "Math from Scratch: Algebra, Trigonometry, Linear Algebra and Calculus", short: "Math from Scratch" },
    pt: { title: "Matemática do zero: álgebra, trigonometria, álgebra linear e cálculo", short: "Matemática do zero" },
  },
  algorithms: {
    en: { title: "Algorithms and Data Structures in C++, Step by Step", short: "Algorithms in C++" },
    pt: { title: "Algoritmos e estruturas de dados em C++, passo a passo", short: "Algoritmos em C++" },
  },
  ai: {
    en: { title: "AI from Scratch in C++: Machine Learning and Neural Networks", short: "AI from Scratch" },
    pt: { title: "IA do zero em C++: machine learning e redes neurais", short: "IA do zero" },
  },
  music: {
    en: { title: "Music Theory from Scratch: Notes, Intervals, Scales and Chords", short: "Music Theory" },
    pt: { title: "Teoria musical do zero: notas, intervalos, escalas e acordes", short: "Teoria musical" },
  },
};

export function seoWording(trackId: string, trackTitle: string, lang: UrlLang): Wording {
  return SEO_TEXT[trackId]?.[lang] ?? { title: trackTitle, short: trackTitle };
}

/** Sentences shared by the generated descriptions. */
export const SEO_COPY = {
  en: {
    free: "(free, interactive)",
    lesson: (title: string, n: number, total: number, course: string, section?: string) =>
      `${title}: lesson ${n} of ${total} of the free interactive ${course} course${section ? ` (${section})` : ""}. ` +
      "Every step explained, with live figures you can play with.",
    learnTitle: "Free interactive courses: OpenGL, GLSL, Vulkan, C++, math and AI",
    learnDesc:
      "Free interactive courses in graphics programming and the math behind it: OpenGL, GLSL shaders, Vulkan, modern C++, SDL3, game dev, algorithms, AI and music theory. Every step explained, with live figures.",
    learn: "Learn",
  },
  pt: {
    free: "(grátis e interativo)",
    lesson: (title: string, n: number, total: number, course: string, section?: string) =>
      `${title}: lição ${n} de ${total} do curso interativo e gratuito de ${course}${section ? ` (${section})` : ""}. ` +
      "Cada passo explicado, com figuras interativas para explorar.",
    learnTitle: "Cursos interativos e gratuitos: OpenGL, GLSL, Vulkan, C++, matemática e IA",
    learnDesc:
      "Cursos interativos e gratuitos de programação gráfica e da matemática por trás dela: OpenGL, shaders GLSL, Vulkan, C++ moderno, SDL3, desenvolvimento de jogos, algoritmos, IA e teoria musical. Cada passo explicado, com figuras interativas.",
    learn: "Aprender",
  },
} as const;
