// PT text for src/lib/tracks/opengl/chapters/pipeline.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch01_intro: "O OpenGL opera em espaço 3D, mas sua tela é uma grade 2D de pixels. O pipeline gráfico é a sequência de etapas que transforma os dados de vértice 3D nos pixels coloridos que você vê. Entendê-lo é a coisa mais importante que você pode fazer antes de escrever uma única linha de código OpenGL.",
  ch01_stagesTitle: "Os estágios",
  ch01_stagesBody: "O pipeline é composto de estágios: alguns são fixos (você não pode alterá-los, apenas configurá-los) e outros são programáveis através de pequenos programas chamados shaders, escritos em GLSL.",
  ch01_stagesNote: "Os dois estágios com que você mais vai interagir são o Vertex Shader e o Fragment Shader. Eles são o mínimo que você precisa escrever antes de desenhar qualquer coisa na tela.",
  ch01_ndcTitle: "Coordenadas de Dispositivo Normalizadas",
  ch01_ndcBody: "O OpenGL não usa coordenadas de pixel. Em vez disso, define um sistema chamado NDC onde cada eixo vai de -1.0 a +1.0. Qualquer vértice fora desse intervalo é cortado e não é desenhado.",
  ch01_ndcAfter: "Veja como os três vértices de um triângulo simples ficam em NDC:",
  ch01_ndcInteractiveTip: "Arraste qualquer vértice na tela acima, ou clique nele para ver um gizmo X/Y que o move em um único eixo. Você também pode digitar valores exatos nos campos de coordenada. Note como mover um ponto para fora do limite [-1, 1] faz o clipping — a borda do triângulo desaparece na fronteira. O indicador CCW/CW mostra a ordem de winding (coberta no capítulo 10).",
  ch01_ndc3dTitle: "NDC em 3D",
  ch01_ndc3dBody: "Em 3D, o NDC é um cubo: todos os eixos de -1.0 a +1.0. Qualquer vértice fora desse cubo em qualquer eixo é cortado. Rotacione o visualizador abaixo para ver como diferentes formas ficam dentro do cubo NDC.",
  ch01_ndcCallout: "NDC não é o mesmo que espaço de tela. Após o vertex shader executar, o OpenGL converte automaticamente as coordenadas NDC para pixels usando as dimensões do viewport definidas em glViewport(). Você não faz essa conversão manualmente.",
  ch01_vertexShaderTitle: "O Vertex Shader",
  ch01_vertexShaderBody: "O vertex shader executa uma vez por vértice. Sua única tarefa obrigatória é produzir a posição final do vértice no espaço de clip através da variável embutida gl_Position.",
  ch01_fragmentShaderTitle: "O Fragment Shader",
  ch01_fragmentShaderBody: "Após a rasterização, o fragment shader executa uma vez por fragmento de pixel. Seu trabalho é produzir a cor final daquele pixel. A variável de saída deve ser declarada como out vec4.",
  ch01_colorTip: "Cores em GLSL são representadas como floats no intervalo 0.0 a 1.0, não 0 a 255. Para converter: divida o valor RGB por 255. Então rgb(255, 128, 51) vira vec4(1.0, 0.5, 0.2, 1.0).",
  ch01_compileTitle: "Como os shaders são compilados",
  ch01_compileBody: "Shaders não são compilados no CPU em tempo de build. Eles são compilados em tempo de execução pelo driver da GPU.",
  ch01_compileWarn: "Sempre verifique erros de compilação do shader durante o desenvolvimento. Um erro de digitação no GLSL produzirá silenciosamente uma tela preta. A mensagem de glGetShaderInfoLog indica exatamente o número da linha que falhou.",
  ch01_nextTitle: "O que vem a seguir",
  ch01_nextBody: "Agora que você entende os estágios do pipeline, precisamos levar os dados de vértice do CPU para a GPU. Esse é o papel dos Vertex Buffer Objects (VBOs), que é exatamente o que o próximo capítulo cobre.",
};

export default text;
