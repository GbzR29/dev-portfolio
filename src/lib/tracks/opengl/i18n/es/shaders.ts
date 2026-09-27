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
  ch04_uniformWarn: "glUniform* siempre escribe en el programa en uso en ese momento, así que llama antes a glUseProgram. Sin ningún programa en uso la llamada falla con GL_INVALID_OPERATION. Con otro programa en uso, escribe en ese, si por casualidad tiene un uniform en esa location. OpenGL 4.1 añadió glProgramUniform*, que recibe el programa como primer argumento y no necesita glUseProgram.",
  ch04_unusedWarn: "glGetUniformLocation devuelve −1 cuando el nombre no existe, y también cuando el uniform existe pero nunca se usa: el compilador elimina del programa los uniforms sin usar. Una llamada glUniform* con location −1 se ignora en silencio. Así, una errata, o un uniform cuyo único uso comentaste mientras probabas, parece simplemente que 'mi uniform no hace nada'. Al depurar, compara la location con −1.",
  ch04_classTip: "Buscar una location y llamar a glUniform* para cada valor enseguida se vuelve repetitivo. El capítulo Shader Class in C++, de la ruta de GLSL, envuelve la carga desde archivos, la compilación, el enlazado, las comprobaciones de errores y los setters de uniforms en una clase pequeña. Los capítulos siguientes de esta ruta usan ese estilo: shader.use(), luego shader.setMat4(\"model\", model), shader.setVec3(…) y así sucesivamente. Un setter que la clase aún no tiene, como setMat3, es una línea más con la misma forma.",
};

export default text;
