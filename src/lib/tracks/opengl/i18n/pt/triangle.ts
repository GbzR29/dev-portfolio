// PT text for src/lib/tracks/opengl/chapters/triangle.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch05_intro: "Agora você tem todas as peças. Este capítulo as une para renderizar um triângulo funcional, o tradicional Hello World da programação gráfica.",
  ch05_fullTitle: "O programa completo",
  ch05_blackScreenTip: "Se você ver uma tela preta sem erros, as causas mais comuns são: o VAO foi vinculado depois do setup do VBO, o location do shader não corresponde ao índice do attribute pointer, ou o viewport não foi configurado com glViewport.",
  ch05_windingWarn: "A ordem dos vértices no seu array não é arbitrária — ela define a ordem de winding da face. Por padrão, o OpenGL espera winding counter-clockwise (CCW) para faces frontais. O capítulo 10 explica por que isso importa para o culling de faces.",
  ch05_nextTitle: "O que tentar em seguida",
  ch05_nextBody: "Agora que o triângulo funciona, tente: mudar a cor modificando o fragment shader, adicionar um segundo triângulo expandindo o array de vértices, e tentar passar uma cor por vértice como mostrado no capítulo de Shaders.",
};

export default text;
