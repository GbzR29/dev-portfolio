// src/lib/i18n/glsl/glslTranslations.ts
// Shared GLSL lesson UI (callouts, pipeline and diagram labels). Chapter and
// widget text lives next to the code it translates — see src/lib/i18n/lessons.ts.

export const glslTranslations = {
  en: {
    glsl03_uvTitle:       "Normalizing to UV space",
    glsl03_uvBody:        "Raw pixel coordinates are rarely useful. Normalize them to [0,1] by dividing by the resolution. This makes your shader resolution-independent.",
  },
  pt: {
    glsl03_uvTitle:       "Normalizando para espaço UV",
    glsl03_uvBody:        "Coordenadas de pixel brutas raramente são úteis. Normalize-as para [0,1] dividindo pela resolução. Isso torna seu shader independente de resolução.",
  },
  es: {
    glsl03_uvTitle:       "Normalizando al espacio UV",
    glsl03_uvBody:        "Normaliza a [0,1] dividiendo por la resolución para hacer el shader independiente de resolución.",
  },
  zh: {
    glsl03_uvTitle:       "归一化到UV空间",
    glsl03_uvBody:        "除以分辨率归一化到[0,1]使着色器与分辨率无关。",
  },
};
