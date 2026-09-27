// ES text for src/lib/tracks/opengl/chapters/vao.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch03_intro: "Cada vez que dibujas un mesh, OpenGL necesita saber en qué buffer están los datos. Un VAO graba todo ese estado una vez.",
  ch03_whatTitle: "Qué almacena un VAO",
  ch03_whatAfter: "Cuando un VAO está vinculado, cada llamada a glVertexAttribPointer y glEnableVertexAttribArray se graba en él.",
  ch03_createTitle: "Creando y usando un VAO",
  ch03_renderLoop: "En el render loop, solo haces el bind del VAO:",
  ch03_goldenRule: "La regla que importa: el VAO debe estar enlazado cuando llamas a glVertexAttribPointer y glEnableVertexAttribArray, porque esas son las llamadas que graba. Crear el VBO o llenarlo con glBufferData puede ocurrir en cualquier momento, antes o después. Un VBO simplemente enlazado a GL_ARRAY_BUFFER no se graba. Lo que se guarda es el buffer que estaba enlazado en el instante en que se ejecutó glVertexAttribPointer, asociado a ese atributo. Enlazar el VAO primero, como arriba, es simplemente la forma más fácil de no equivocarse nunca.",
  ch03_interleavedTitle: "Datos de vértice intercalados",
  ch03_interleavedBody: "Los vértices reales tienen posición, coordenadas de textura y normal, todo en un solo buffer.",
};

export default text;
