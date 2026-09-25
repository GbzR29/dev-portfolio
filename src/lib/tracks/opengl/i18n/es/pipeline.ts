// ES text for src/lib/tracks/opengl/chapters/pipeline.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch01_intro: "OpenGL opera en espacio 3D, pero tu pantalla es una cuadrícula 2D de píxeles. El pipeline gráfico es la secuencia de pasos que transforma tus datos de vértice 3D en los píxeles de color que ves.",
  ch01_stagesTitle: "Los estágios",
  ch01_stagesBody: "El pipeline tiene etapas fijas (solo configurables) y etapas programables mediante shaders escritos en GLSL.",
  ch01_stagesNote: "Las dos etapas con las que más interactuarás son el Vertex Shader y el Fragment Shader.",
  ch01_ndcTitle: "Coordenadas de Dispositivo Normalizadas",
  ch01_ndcBody: "OpenGL usa un sistema de coordenadas llamado NDC donde cada eje va de -1.0 a +1.0. Cualquier vértice fuera de ese rango se recorta.",
  ch01_ndcAfter: "Así se ven los tres vértices de un triángulo simple en NDC:",
  ch01_ndcCallout: "NDC no es lo mismo que el espacio de pantalla. OpenGL convierte automáticamente las coordenadas NDC a píxeles usando las dimensiones del viewport de glViewport().",
  ch01_vertexShaderTitle: "El Vertex Shader",
  ch01_vertexShaderBody: "El vertex shader se ejecuta una vez por vértice. Su única tarea obligatoria es producir la posición final en clip-space a través de gl_Position.",
  ch01_fragmentShaderTitle: "El Fragment Shader",
  ch01_fragmentShaderBody: "Tras la rasterización, el fragment shader se ejecuta una vez por fragmento de píxel. Su trabajo es producir el color final del píxel.",
  ch01_colorTip: "Los colores en GLSL son floats de 0.0 a 1.0. Para convertir: divide tu valor RGB entre 255.",
  ch01_compileTitle: "Cómo se compilan los shaders",
  ch01_compileBody: "Los shaders se compilan en tiempo de ejecución por el driver de la GPU, no en tu CPU.",
  ch01_compileWarn: "Siempre comprueba errores de compilación del shader. Un error tipográfico producirá una pantalla negra sin avisar.",
  ch01_nextTitle: "Qué viene después",
  ch01_nextBody: "Necesitamos llevar los datos de vértice del CPU a la GPU. Ese es el trabajo de los Vertex Buffer Objects, el tema del próximo capítulo.",
};

export default text;
