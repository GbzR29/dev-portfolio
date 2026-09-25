// ES text for src/lib/tracks/glsl/chapters/types.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  glsl01_intro: "GLSL tiene un sistema de tipos más rico que C++ en un área: tipos vectoriales y matriciales integrados que mapean directamente a registros de GPU.",
  glsl01_scalarsTitle: "Tipos escalares",
  glsl01_scalarsBody: "GLSL tiene cuatro tipos escalares. float es el más usado. Los enteros son limitados en hardware antiguo.",
  glsl01_vectorsTitle: "Tipos vectoriales",
  glsl01_vectorsBody: "Los vectores son los tipos más importantes: vec2, vec3, vec4 para posiciones, colores, direcciones y UVs.",
  glsl01_swizzleTitle: "Swizzling",
  glsl01_swizzleBody: "El swizzling reordena y selecciona componentes en una expresión. Puedes usar .xyzw, .rgba o .stpq — son alias equivalentes.",
  glsl01_constructorsTitle: "Constructores",
  glsl01_constructorsBody: "Los vectores se construyen llamando al tipo como función. Un escalar llena todos los componentes: vec3(1.0) crea (1.0, 1.0, 1.0).",
  glsl01_matricesTitle: "Matrices",
  glsl01_matricesBody: "mat4 es una matriz 4×4 column-major. mat4(1.0) crea una matriz identidad.",
  glsl01_castingTitle: "Conversión de tipos",
  glsl01_castingBody: "GLSL no tiene conversiones implícitas. Debes convertir explícitamente: float(myInt), int(myFloat).",
};

export default text;
