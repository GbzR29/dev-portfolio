// PT text for src/lib/tracks/opengl/chapters/vbo.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch02_intro: "Seus dados de vértice começam como um array C++ na RAM, em memória que pertence ao seu programa. O vertex shader não consegue ler um array C++. Ele lê de buffer objects gerenciados pelo OpenGL, colocados onde o driver achar mais rápido: normalmente na memória da própria GPU (VRAM) numa placa dedicada, ou numa região compartilhada da RAM do sistema numa GPU integrada. Um Vertex Buffer Object (VBO) é esse tipo de buffer. Você copia seu array para ele uma vez e, a partir daí, a GPU o lê diretamente, sem nenhum trabalho por vértice na CPU.",
  ch02_flowTitle: "O fluxo de dados",
  ch02_flowAfter: "Você define os dados, cria um buffer na GPU, faz o upload com glBufferData e emite um draw call. A GPU faz o resto.",
  ch02_stepTitle: "Criando um VBO passo a passo",
  ch02_step1Title: "Passo 1: Gerar o buffer",
  ch02_step1Body: "Tudo em OpenGL é identificado por um ID inteiro. Você pede ao OpenGL que crie um buffer e ele retorna um ID para operações futuras.",
  ch02_step2Title: "Passo 2: Fazer o bind do buffer",
  ch02_step2Body: "OpenGL é uma máquina de estados. Para operar em um buffer, você primeiro faz o bind dele, tornando-o o buffer ativo daquele tipo.",
  ch02_step2Callout: "GL_ARRAY_BUFFER é para dados de vértice. Você também verá GL_ELEMENT_ARRAY_BUFFER para index buffers quando cobrirmos desenho indexado.",
  ch02_step3Title: "Passo 3: Fazer o upload dos dados",
  ch02_step3Body: "Você copia o array de vértices da RAM para a GPU com glBufferData. O último argumento é uma dica para o driver sobre a frequência de mudança dos dados.",
  ch02_step3TableIntro: "Os três hints de uso que você precisa conhecer:",
  vboTableHeader0: "Hint",
  vboTableHeader1: "Quando usar",
  vboStaticDesc: "Dados definidos uma vez, usados muitas vezes. Bom para geometria estática como terrenos e modelos.",
  vboDynamicDesc: "Dados modificados e usados muitas vezes. Bom para geometria animada ou procedural.",
  vboStreamDesc: "Dados definidos uma vez, usados poucas vezes. Bom para sistemas de partículas por frame.",
  ch02_usageHintTip: "Essas dicas não mudam o comportamento do seu programa, são só dicas de desempenho. O driver as usa para decidir em que parte da memória da GPU colocar o buffer. Errá-las não quebra nada, mas pode causar transferências de memória desnecessárias.",
  ch02_interpretTitle: "Dizendo ao OpenGL como interpretar os dados",
  ch02_interpretBody: "O VBO é apenas um bloco de bytes na GPU. O OpenGL não sabe que seus bytes representam três floats por vértice. Você precisa informá-lo usando glVertexAttribPointer.",
  ch02_interpretWarn: "O primeiro argumento (0) deve corresponder à declaração layout (location = 0) no seu vertex shader. Se não corresponderem, o shader lê dados inválidos.",
  ch02_fullTitle: "O setup completo do VBO em um só lugar",
  ch02_nextTitle: "Por que você não deve parar aqui",
  ch02_nextBody: "O código acima está completo no que diz respeito ao buffer, mas no Core profile ele ainda não desenha nada. O layout de atributos que você descreve com glVertexAttribPointer precisa ser guardado em algum lugar, e no Core esse lugar tem de ser um Vertex Array Object (VAO). Sem nenhum VAO ligado, as chamadas de atributo e o draw call falham com GL_INVALID_OPERATION, e o único sintoma é uma tela vazia. (Os antigos contextos de compatibilidade tinham um VAO padrão embutido, por isso muitos tutoriais antigos o pulam.) O próximo capítulo adiciona o VAO. De bônus, ele grava o layout inteiro uma vez, e desenhar uma malha depois passa a exigir um único bind em vez de descrever cada atributo de novo.",
};

export default text;
