// ES text for src/lib/tracks/glsl/chapters/sdf.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  glsl04_intro: "Una SDF devuelve la distancia de un punto a la superficie más cercana. Negativo = dentro, positivo = fuera, cero = en el borde.",
  glsl04_conceptTitle: "El concepto",
  glsl04_conceptBody: "Muestrea la SDF en la UV actual. Si es negativo dibuja el color de la forma; usa smoothstep para anti-aliasing.",
  glsl04_circleTitle: "SDF: Círculo",
  glsl04_circleBody: "La SDF más simple: length(p) - r.",
  glsl04_boxTitle: "SDF: Rectángulo",
  glsl04_boxBody: "La SDF exacta de caja usa operaciones por componente. b es el medio-tamaño.",
  glsl04_combineTitle: "Combinando formas",
  glsl04_combineBody: "Min/max de SDFs dan unión/intersección/sustracción.",
  glsl04_combineWarn: "smin mezcla formas suavemente con un parámetro k. Así se hacen metaballs.",
};

export default text;
