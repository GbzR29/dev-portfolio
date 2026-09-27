// PT text for src/lib/tracks/opengl/chapters/triangle.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch05_intro: "Agora você tem todas as peças. Este capítulo as une para renderizar um triângulo funcional, o tradicional Hello World da programação gráfica.",
  ch05_fullTitle: "O programa completo",
  ch05_blackScreenTip: "Se você vê só a cor de fundo e nenhum erro, as causas mais comuns são: nenhum VAO estava ligado quando glVertexAttribPointer rodou (ou na hora do draw), o layout location do shader não bate com o índice do atributo, o shader falhou ao compilar ou linkar (verifique os dois logs, como no código acima), ou os vértices estão fora do intervalo [-1, 1] das NDC.",
  ch05_windingWarn: "A ordem dos vértices no array não é arbitrária — ela define o winding order da face. Por padrão o OpenGL considera frontais os triângulos em sentido anti-horário (CCW). O capítulo Face Winding & Culling explica por que isso importa.",
  ch05_nextTitle: "O que tentar em seguida",
  ch05_nextBody: "Agora que o triângulo funciona, tente: mudar a cor modificando o fragment shader, adicionar um segundo triângulo expandindo o array de vértices, e tentar passar uma cor por vértice como mostrado no capítulo de Shaders.",
};

export default text;
