// ES text for src/lib/tracks/opengl/chapters/ebo.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch06_intro: "Cada quad son dos triángulos que comparten dos vértices. Sin índices los almacenas duplicados. Un EBO guarda una lista de índices para que cada vértice único exista una sola vez.",
  ch06_whyTitle: "El problema de la duplicación",
  ch06_whyBody: "Un quad tiene cuatro vértices. GL_TRIANGLES necesita seis vértices en total — dos están duplicados.",
  ch06_solutionTitle: "La solución con EBO",
  ch06_solutionBody: "Con un EBO almacenas cuatro vértices únicos y seis índices. La GPU consulta cada índice y ensambla triángulos sin duplicación.",
  ch06_createTitle: "Creando el EBO",
  ch06_createBody: "Un EBO se crea igual que un VBO, pero con GL_ELEMENT_ARRAY_BUFFER y vinculado mientras el VAO está activo.",
  ch06_eboWarn: "No desvincula el EBO antes del VAO. El VAO almacena el binding de GL_ELEMENT_ARRAY_BUFFER — desvincularlo primero lo borra.",
  ch06_drawTitle: "Dibujando con glDrawElements",
  ch06_drawBody: "Reemplaza glDrawArrays por glDrawElements. El segundo argumento es el número de índices, no de vértices.",
  ch06_wireframeTitle: "Modo wireframe para debug",
  ch06_wireframeBody: "Cambia a wireframe para verificar que tus índices forman los triángulos correctos.",
  ch06_nextTip: "Los EBOs son aún más valiosos con meshes 3D complejos. La mayoría de las librerías de carga (Assimp) producen geometría indexada por defecto.",
};

export default text;
