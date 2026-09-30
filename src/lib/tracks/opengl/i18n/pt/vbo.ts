// PT text for src/lib/tracks/opengl/chapters/vbo.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  oglVbo_intro: "O pipeline começa com os dados de vértice, e até agora esses dados são um array C++ na memória do seu programa. O vertex shader não consegue ler um array C++: ele roda na GPU e lê de buffer objects, blocos de memória que o OpenGL gerencia e põe onde a GPU os lê mais rápido. Um Vertex Buffer Object (VBO) é um buffer object que guarda dados de vértice. Este capítulo explica por que os dados precisam mudar de lugar, o que exatamente é copiado, como criar, preencher, atualizar e apagar um VBO, e por que um VBO sozinho ainda não desenha nada.",

  oglVbo_whereTitle: "Onde os dados de vértice moram",
  oglVbo_whereBody: "Um computador com placa de vídeo dedicada tem duas memórias separadas. A RAM do sistema pertence à CPU; os seus arrays, vetores e objetos moram lá. A placa de vídeo tem memória própria, a VRAM (video RAM), soldada ao lado da GPU e feita para uma largura de banda enorme: a GPU consegue lê-la a centenas de gigabytes por segundo, porque milhares de núcleos de shader leem vértices e texturas em paralelo. As duas são ligadas pelo barramento PCIe, que é rápido para padrões do dia a dia, mas mais de dez vezes mais lento que a VRAM. Uma GPU integrada, embutida no processador, não tem VRAM: lê a RAM do sistema diretamente, dividindo-a, e a largura de banda dela, com a CPU.",
  oglVbo_whereAfter: "Então a pergunta não é só como entregar os vértices à GPU, mas onde eles devem ficar enquanto ela os lê a cada frame. Escolha um lugar e um tamanho de dados na figura e compare o custo de ler os dados uma vez por frame.",
  oglVbo_whereConclusion: "É para isso que serve um VBO. Você copia os dados para um buffer object uma vez, o driver o põe na VRAM (ou onde esta GPU ler mais rápido), e daí em diante o draw call de cada frame os lê de lá sem a CPU encostar neles. A cópia cruza o barramento uma vez; as leituras nunca.",

  oglVbo_bytesTitle: "O que é copiado: bytes",
  oglVbo_bytesBody: "Um buffer object guarda bytes e nada mais: não faz ideia de que são floats, nem de quais formam um vértice. O array do nosso triângulo tem 9 floats (3 vértices × 3 coordenadas), cada um com 4 bytes, então tem 36 bytes, e esses 36 bytes são exatamente o que o upload copia. sizeof(vertices) dá esse tamanho em bytes para um array de verdade. A figura mostra o array como os bytes que o buffer recebe, e o erro mais comum com sizeof.",

  oglVbo_createTitle: "Criando um VBO, passo a passo",
  oglVbo_s1Title: "1. Criar um buffer object",
  oglVbo_s1Body: "glGenBuffers(n, nomes) cria n nomes de buffer object e os escreve no array que você passa. Um nome é um GLuint, um número simples como 1; o buffer ainda não recebe armazenamento nenhum.",
  oglVbo_s2Title: "2. Vinculá-lo",
  oglVbo_s2Body: "Como o capítulo de configuração mostrou, o OpenGL é uma máquina de estados: as chamadas agem sobre o que estiver vinculado. glBindBuffer(GL_ARRAY_BUFFER, vbo) torna vbo o vertex buffer atual. GL_ARRAY_BUFFER é o ponto de vínculo (target) para dados de vértice; o mesmo buffer object poderia ser vinculado a outros targets, como GL_ELEMENT_ARRAY_BUFFER para índices (capítulo de EBO), porque o target descreve como ele está sendo usado, não o que ele é.",
  oglVbo_s3Title: "3. Alocar e preencher",
  oglVbo_s3Body: "glBufferData aloca armazenamento para o buffer vinculado e copia os seus dados para ele. Quando a função retorna, a cópia está feita: o seu array pode mudar ou ser liberado sem afetar o buffer.",
  oglVbo_tArg: "Argumento",
  oglVbo_tMeaning: "Significado",
  oglVbo_a1: "qual ponto de vínculo preencher. A chamada nunca nomeia o buffer em si; usa o que estiver vinculado a esse target.",
  oglVbo_a2: "o número de bytes a alocar, do tipo GLsizeiptr. Bytes, não floats nem vértices: 9 floats são 36 bytes.",
  oglVbo_a3: "um ponteiro para os bytes a copiar. nullptr aloca o armazenamento sem preenchê-lo, para ser preenchido depois.",
  oglVbo_a4: "uma dica de como os dados serão usados, para o driver escolher onde colocá-los (próxima seção).",
  oglVbo_vectorWarn: "Com std::vector<float> v, sizeof(v) é o tamanho do próprio objeto vector (normalmente 24 bytes: três ponteiros), não do conteúdo. Use v.size() * sizeof(float) para o tamanho e v.data() para o ponteiro. A mesma armadilha pega arrays passados a uma função, que chegam como ponteiros: aí sizeof dá 8.",

  oglVbo_usageTitle: "Dicas de uso",
  oglVbo_usageBody: "O argumento usage junta duas palavras. A primeira diz com que frequência o conteúdo vai mudar: STATIC (definido uma vez, usado muitas vezes), DYNAMIC (mudado repetidamente, usado muitas vezes) ou STREAM (definido uma vez, usado poucas vezes e depois substituído). A segunda diz quem lê os dados: DRAW (a GPU lê para desenhar, o caso comum), READ (a aplicação os lê de volta) ou COPY (a GPU lê para escrever em outros buffers da GPU). Dados de vértice quase sempre são um dos três abaixo.",
  oglVbo_tHint: "Dica",
  oglVbo_tWhen: "Quando usar",
  oglVbo_h1: "enviado uma vez, desenhado muitas vezes: geometria do cenário, modelos de personagens, qualquer coisa carregada de um arquivo",
  oglVbo_h2: "mudado de vez em quando e desenhado muitas vezes entre as mudanças: uma malha deformável, uma interface cujo layout muda",
  oglVbo_h3: "reescrito a cada frame e desenhado uma ou duas vezes: partículas, linhas de debug, texto gerado a cada frame",
  oglVbo_usageTip: "As dicas nunca mudam o que o programa faz, só o quão rápido ele pode rodar. Uma dica errada não é um erro; no pior caso o driver põe o buffer num lugar mais lento de atualizar ou de ler. Os drivers também observam como um buffer é realmente usado e podem movê-lo.",

  oglVbo_updateTitle: "Atualizando e apagando",
  oglVbo_updateBody: "glBufferData sempre aloca armazenamento novo, descartando o antigo. Para mudar alguns bytes de um buffer existente sem realocar, use glBufferSubData(target, offset, tamanho, dados), que sobrescreve tamanho bytes a partir do byte offset. O offset e o tamanho precisam ficar dentro do buffer. Chamar glBufferData com o mesmo tamanho e nullptr antes de reescrever tudo é um truque conhecido chamado orphaning: o driver pode entregar memória nova enquanto a GPU continua lendo o conteúdo antigo para frames ainda em andamento, em vez de esperar por ela. O capítulo Buffer Data cobre isso e o mapeamento a fundo.",

  oglVbo_workedTitle: "Exemplos resolvidos",
  oglVbo_w1: "1. Um modelo com 10 000 vértices, cada um com uma posição (3 floats), uma normal (3 floats) e uma coordenada de textura (2 floats): 8 floats × 4 bytes = 32 bytes por vértice, 10 000 × 32 = 320 000 bytes, cerca de 312,5 KiB (320 000 / 1024). Enviá-lo uma vez por um barramento PCIe a cerca de 25 GB/s leva 320 000 / 25 000 000 000 s ≈ 0,0000128 s, 12,8 microssegundos.",
  oglVbo_w2: "2. Uma cena grande com 100 MB de dados de vértice. Lida da VRAM a cerca de 450 GB/s, uma passada leva 0,1 / 450 s ≈ 0,22 ms. Lida pelo PCIe da RAM do sistema a cerca de 25 GB/s, leva 0,1 / 25 s = 4 ms, um quarto de um frame a 60 fps gasto só movendo vértices. Essa diferença é o motivo de dados que não mudam pertencerem a um VBO com GL_STATIC_DRAW.",
  oglVbo_w3: "3. Onde fica o z do vértice 1 no buffer do nosso triângulo? Cada vértice tem 3 floats = 12 bytes, então o vértice 1 começa no byte 12; z é o terceiro float dele, 2 × 4 = 8 bytes adiante, no byte 20. glBufferSubData(GL_ARRAY_BUFFER, 20, 4, &z) mudaria exatamente esse valor.",

  oglVbo_describeTitle: "Os bytes ainda precisam de uma descrição",
  oglVbo_describeBody: "O buffer agora guarda 36 bytes, mas o vertex shader pede um vec3 chamado aPos no location 0. Alguém precisa dizer que o location 0 recebe 3 floats por vértice, a partir do byte 0, com 12 bytes de um vértice ao próximo. Isso é o glVertexAttribPointer. Num contexto Core essa descrição precisa ficar guardada num Vertex Array Object, e sem um vinculado tanto a descrição quanto o draw call falham com GL_INVALID_OPERATION: o único sintoma é uma tela vazia. (Contextos Compatibility têm um VAO padrão embutido, e por isso muitos tutoriais antigos o pulam.) O próximo capítulo constrói o VAO e explica cada argumento do glVertexAttribPointer.",

  oglVbo_mistakesTitle: "Erros comuns",
  oglVbo_tMistake: "Erro",
  oglVbo_tFix: "O que acontece, e a correção",
  oglVbo_e1: "sizeof de um ponteiro ou de um std::vector",
  oglVbo_e1b: "8 ou 24 bytes são enviados em vez dos dados; o draw lê além do fim. Calcule quantidade × sizeof(elemento).",
  oglVbo_e2: "Passar a quantidade de vértices ou de floats como tamanho",
  oglVbo_e2b: "o tamanho é em bytes: 3 vértices de 3 floats são 36 bytes, não 3 nem 9.",
  oglVbo_e3: "glBufferData sem buffer vinculado",
  oglVbo_e3b: "GL_INVALID_OPERATION, nada é enviado. Vincule o buffer ao target antes.",
  oglVbo_e4: "Chamar glBufferData a cada frame para atualizar",
  oglVbo_e4b: "ele realoca toda vez. Aloque uma vez e atualize com glBufferSubData (ou faça orphaning de propósito, sabendo por quê).",
  oglVbo_e5: "Escrever além do fim com glBufferSubData",
  oglVbo_e5b: "offset + tamanho maior que o buffer gera GL_INVALID_VALUE e não escreve nada.",
  oglVbo_e6: "Esperar que uma mudança no array C++ chegue à GPU",
  oglVbo_e6b: "glBufferData fez uma cópia. Envie a mudança de novo.",
  oglVbo_e7: "Criar buffers antes de o contexto existir",
  oglVbo_e7b: "as funções ainda não foram carregadas e a chamada trava. Crie objetos GL só depois da janela, do contexto atual e do GLAD.",

  oglVbo_key0: "A GPU lê dados de vértice mais rápido da própria memória (VRAM); o barramento PCIe entre a RAM do sistema e a GPU é mais de dez vezes mais lento.",
  oglVbo_key1: "Um VBO é um buffer object com dados de vértice; enviá-lo uma vez deixa cada frame lê-lo sem a CPU.",
  oglVbo_key2: "Um buffer guarda só bytes: 3 vértices × 3 floats × 4 bytes = 36 bytes, e ele não sabe o que significam.",
  oglVbo_key3: "Crie com glGenBuffers, vincule a GL_ARRAY_BUFFER, aloque e copie com glBufferData(target, tamanho em bytes, dados, usage).",
  oglVbo_key4: "As dicas de uso (STATIC, DYNAMIC, STREAM × DRAW, READ, COPY) orientam o posicionamento mas nunca mudam o comportamento.",
  oglVbo_key5: "glBufferSubData muda parte de um buffer sem realocar; glDeleteBuffers o libera.",
  oglVbo_key6: "O layout dos bytes é descrito com glVertexAttribPointer, guardado num VAO; no Core nada desenha sem um.",
};

export default text;
