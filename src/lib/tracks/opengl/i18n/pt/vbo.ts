// PT text for src/lib/tracks/opengl/chapters/vbo.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch02_intro: "Seus dados de vértice começam como um array C++ na RAM. A GPU não consegue acessar a RAM diretamente, ela só pode ler da sua própria memória (VRAM). Um VBO é o mecanismo que o OpenGL fornece para copiar esses dados do CPU para a GPU.",
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
  ch02_nextBody: "O código acima funciona, mas tem um problema: a cada quadro você precisa religar o VBO e especificar de novo o layout dos atributos de vértice. Para um único triângulo tudo bem, mas para uma cena real com centenas de malhas isso fica caro e repetitivo. O próximo capítulo apresenta os Vertex Array Objects (VAOs), que permitem gravar todos os bindings de VBO e especificações de atributos uma vez e depois reproduzi-los com uma única chamada de bind.",
};

export default text;
