// ES text for src/lib/tracks/glsl/chapters/fragcoord.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  glsl03_intro: "gl_FragCoord da acceso a la posición del píxel. Con un uniform de resolución, es la base para efectos de pantalla completa.",
  glsl03_fragcoordTitle: "gl_FragCoord",
  glsl03_fragcoordBody: "gl_FragCoord.xy da la posición del píxel con (0,0) en la esquina inferior izquierda.",
  glsl03_centeredTitle: "Centrado y corrección de aspecto",
  glsl03_centeredBody: "Centra en [-1,+1] y corrige el aspecto para que círculos y cuadrados luzcan correctos.",
  glsl03_timeTitle: "Animando con tiempo",
  glsl03_timeBody: "Un uniform float que aumenta cada frame, combinado con sin/cos, crea animaciones en bucle.",
  glsl03_patternTip: "El patrón de ShaderToy centra el sistema, corrige el aspecto y da [-aspecto,aspecto] en X y [-1,1] en Y.",
};

export default text;
