// ES text for src/lib/tracks/opengl/chapters/textures.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch07_intro: "Una textura es una imagen 2D en la VRAM de la GPU que el fragment shader puede muestrear por píxel.",
  ch07_uvTitle: "Coordenadas UV / de textura",
  ch07_uvBody: "Cada vértice lleva un par de floats (U, V) que indican qué parte de la textura mapea a ese punto. En OpenGL, (0,0) es abajo-izquierda y (1,1) es arriba-derecha.",
  ch07_loadTitle: "Cargando imagen con stb_image",
  ch07_loadBody: "stb_image.h es el cargador de imágenes estándar. Incluye la implementación una vez en un .cpp y llama a stbi_load.",
  ch07_createTitle: "Creando el objeto de textura",
  texWrapHeader0: "Modo de wrap",
  texWrapHeader1: "Comportamiento",
  texRepeat: "Repite la textura en mosaico. Por defecto y más común.",
  texClamp: "Estira el píxel del borde. Bueno para sprites de UI.",
  texMirror: "Repite pero espeja cada mosaico alterno.",
  ch07_shaderTitle: "Muestreando en el fragment shader",
  ch07_bindTitle: "Vinculando la textura antes de dibujar",
  ch07_unitsNote: "OpenGL soporta al menos 16 unidades de textura simultáneas. Activa una unidad, vincula la textura y dile al uniform sampler qué unidad usar.",
};

export default text;
