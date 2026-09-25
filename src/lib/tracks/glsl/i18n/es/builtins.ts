// ES text for src/lib/tracks/glsl/chapters/builtins.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  glsl02_intro: "GLSL incluye una gran biblioteca de funciones integradas implementadas en hardware — más rápidas que cualquier código propio.",
  glsl02_mathTitle: "Funciones matemáticas",
  glsl02_mathBody: "Las funciones matemáticas principales operan por componentes en vectores.",
  glsl02_interpTitle: "Funciones de interpolación",
  glsl02_interpBody: "Las más usadas en GLSL. Controlan las transiciones entre estados.",
  glsl02_smoothstepNote: "smoothstep produce una transición suave en curva S. Úsalo para bordes suavizados y efectos de disolución.",
  glsl02_geoTitle: "Funciones geométricas",
  glsl02_geoBody: "Usadas en iluminación y ray marching. Operan en el vector completo.",
  glsl02_trigTitle: "Funciones trigonométricas",
  glsl02_trigBody: "Todas trabajan en radianos. Combina sin y cos para trayectorias circulares.",
};

export default text;
