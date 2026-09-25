// ES text for src/lib/tracks/glsl/chapters/shader-class.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  glsl06_intro: "Los string literals para shaders requieren recompilación de C++ con cada cambio. Una clase Shader que carga archivos hace la iteración mucho más rápida.",
  glsl06_problemTitle: "El problema con los string literals",
  glsl06_problemBody: "Sin sintaxis GLSL en el editor y recompilación lenta. Cargar desde archivos lo resuelve.",
  glsl06_classTitle: "Interfaz de la clase Shader",
  glsl06_classBody: "Constructor con rutas, método use() y helpers para uniforms.",
  glsl06_implTitle: "Implementación",
  glsl06_hotreloadTitle: "Patrón de hot reload",
  glsl06_hotreloadBody: "Observa el tiempo de modificación del archivo. Al cambiar, recompila en segundo plano e intercambia el programa.",
  glsl06_errorTip: "Mantén el programa anterior si falla la recompilación. Imprime el error con nombre de archivo y línea.",
};

export default text;
