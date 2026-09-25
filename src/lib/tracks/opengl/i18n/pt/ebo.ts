// PT text for src/lib/tracks/opengl/chapters/ebo.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch06_intro: "Todo quad é dois triângulos que compartilham dois vértices. Sem índices, você armazena esses vértices duas vezes — desperdiçando VRAM. Um EBO armazena uma lista de índices para que cada vértice único exista exatamente uma vez.",
  ch06_whyTitle: "O problema da duplicação",
  ch06_whyBody: "Um quad tem quatro cantos. GL_TRIANGLES espera três vértices por triângulo, então sem índices você passa seis vértices — dois duplicados.",
  ch06_solutionTitle: "A solução com EBO",
  ch06_solutionBody: "Com um EBO, você armazena quatro vértices únicos e uma lista separada de seis índices. A GPU lê cada índice, busca o vértice e monta os triângulos sem duplicação.",
  ch06_createTitle: "Criando o EBO",
  ch06_createBody: "Um EBO é criado exatamente como um VBO. As diferenças são o alvo (GL_ELEMENT_ARRAY_BUFFER) e que ele deve ser vinculado enquanto o VAO está ativo para que o VAO o grave.",
  ch06_eboWarn: "Não desvincule o EBO antes de desvincular o VAO. O VAO armazena o binding do GL_ELEMENT_ARRAY_BUFFER — desvinculá-lo antes remove essa associação e o VAO não desenhará nada.",
  ch06_drawTitle: "Desenhando com glDrawElements",
  ch06_drawBody: "Substitua glDrawArrays por glDrawElements. O segundo argumento é o número de índices (não de vértices). O último argumento é o offset em bytes no EBO.",
  ch06_wireframeTitle: "Dica de debug: modo wireframe",
  ch06_wireframeBody: "Durante o desenvolvimento você pode mudar para wireframe para verificar se seus índices estão corretos e os dois triângulos compartilham os vértices certos.",
  ch06_nextTip: "EBOs tornam-se ainda mais valiosos com meshes 3D complexos. A maioria das bibliotecas de carregamento de meshes (Assimp, tinyobjloader) produz geometria indexada por padrão.",
};

export default text;
