// ES text for src/lib/tracks/opengl/chapters/shaders.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch04_intro: "Los shaders son pequeños programas en la GPU para cada vértice o píxel. Este capítulo cubre todo lo necesario para tu primer par de shaders.",
  ch04_basicsTitle: "Fundamentos de GLSL",
  ch04_passingTitle: "Pasando datos entre etapas",
  ch04_passingBody: "Los datos fluyen por el pipeline usando calificadores:",
  shaderTableHeader0: "Calificador",
  shaderTableHeader1: "Usado en",
  shaderTableHeader2: "Significado",
  shaderQualInVertex: "vertex shader",
  shaderQualInMeaning: "Dato proveniente del VBO (un valor por vértice)",
  shaderQualOutMeaning: "Dato enviado al siguiente estágio (interpolado)",
  shaderQualInFrag: "fragment shader",
  shaderQualInFragMeaning: "Recibe el out interpolado del vertex shader",
  shaderQualBoth: "ambos",
  shaderQualUniformMeaning: "Valor establecido desde C++, igual para todos los vértices y píxeles",
  ch04_colorExampleTitle: "Ejemplo de interpolación de color",
  ch04_colorExampleBody: "Vamos a pasar un color por vértice y dejar que OpenGL lo interpole en el triángulo.",
  ch04_interpolationNote: "La GPU interpola automáticamente los colores usando interpolación baricéntrica. No necesitas escribir código para esto.",
  ch04_uniformTitle: "Uniforms",
  ch04_uniformBody: "Un uniform es un valor definido desde C++ que permanece igual para todos los vértices del draw call.",
  ch04_uniformWarn: "Debes llamar a glUseProgram antes de definir uniforms.",
};

export default text;
