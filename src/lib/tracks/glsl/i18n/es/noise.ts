// ES text for src/lib/tracks/glsl/chapters/noise.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  glsl05_intro: "El ruido es la base de texturas procedurales y efectos orgánicos. GLSL no tiene función de ruido integrada, se escribe con funciones hash.",
  glsl05_hashTitle: "Función hash",
  glsl05_hashBody: "Mapea un valor a un número pseudo-aleatorio usando dot + sin + fract.",
  glsl05_valueNoiseTitle: "Ruido de valor",
  glsl05_valueNoiseBody: "Interpola entre valores aleatorios en una cuadrícula. Produce el aspecto suave de nubes.",
  glsl05_fbmTitle: "Movimiento Browniano Fraccional (fBm)",
  glsl05_fbmBody: "Capas de ruido a frecuencias y amplitudes crecientes/decrecientes. Produce montañas, nubes y fuego.",
  glsl05_fbmTip: "Cada octava multiplica frecuencia ×2 y amplitud ×0.5. 4-6 octavas suelen ser suficientes.",
};

export default text;
