// PT text for src/lib/tracks/opengl/chapters/vao.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch03_intro: "Toda vez que você desenha um mesh, o OpenGL precisa saber em qual buffer os dados de vértice estão e como esse buffer está organizado. Um VAO grava todo esse estado uma vez para que você possa repeti-lo com um único bind.",
  ch03_whatTitle: "O que um VAO armazena",
  ch03_whatAfter: "Quando um VAO está ligado, toda chamada a glVertexAttribPointer e glEnableVertexAttribArray é gravada dentro dele. O GL_ELEMENT_ARRAY_BUFFER (index buffer) ligado também é guardado. O binding de GL_ARRAY_BUFFER em si não é guardado diretamente, mas a associação entre cada atributo e seu buffer de origem é.",
  ch03_createTitle: "Criando e usando um VAO",
  ch03_renderLoop: "Agora no render loop, você apenas faz o bind do VAO:",
  ch03_goldenRule: "A regra que importa: o VAO precisa estar ligado quando você chama glVertexAttribPointer e glEnableVertexAttribArray, porque são essas as chamadas que ele grava. Criar o VBO ou preenchê-lo com glBufferData pode acontecer a qualquer momento, antes ou depois. Um VBO apenas ligado a GL_ARRAY_BUFFER não é gravado. O que fica guardado é o buffer que estava ligado no instante em que glVertexAttribPointer rodou, associado àquele atributo. Ligar o VAO primeiro, como acima, é simplesmente o jeito mais fácil de nunca errar isso.",
  ch03_interleavedTitle: "Dados de vértice intercalados",
  ch03_interleavedBody: "Vértices reais têm posição, coordenadas de textura e vetor normal, todos empacotados em um único buffer. Os argumentos stride e offset em glVertexAttribPointer lidam com isso.",
};

export default text;
