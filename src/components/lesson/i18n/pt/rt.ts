// PT text for the rt widgets. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  figBvh_title: "Uma Bounding Volume Hierarchy",
  figBvh_hint: "arraste as duas pontas do raio",
  figBvh_box: "testes de caixa",
  figBvh_prim: "testes de primitiva",
  figBvh_total: "testes",
  figBvh_brute: "força bruta",
  figBvh_hits: "acertos",
  figBvh_note: "Os contornos coloridos são as caixas dos nós no nível escolhido: a raiz contém tudo, cada nível divide as caixas de um nó em duas metades ao longo do lado mais longo. As caixas brancas são os nós que o raio realmente abriu. Um raio que erra a caixa de um nó pula toda a subárvore de uma vez, então o custo cresce como log N em vez de N. Com 64 primitivas a economia é modesta. Com um milhão de triângulos é a diferença entre um quadro e uma hora.",
  figMC_title: "Monte Carlo — Integrando com Amostras Aleatórias",
  figMC_uni: "amostras uniformes",
  figMC_imp: "importance sampling",
  figMC_est: "estimativa",
  figMC_err: "erro",
  figMC_note: "Cada linha vertical é uma amostra: um x aleatório e o valor f(x). Com amostras uniformes, a estimativa é só a média de f(x). O gráfico mostra ela vagando em direção a 1, dentro de uma faixa que se estreita como 1/√N: quatro vezes mais amostras para metade do ruído. Troque para importance sampling: x é sorteado mais vezes onde f é grande, cada amostra é dividida pela probabilidade que tinha, e o mesmo N dá uma estimativa umas dez vezes mais próxima (σ cai de 0,48 para 0,05), o que exigiria cem vezes mais amostras uniformes.",
  figPath_title: "Um Path Tracer Progressivo — Cornell Box",
  figPath_hint: "arraste para girar · qualquer mudança reinicia a média",
  figPath_spp: "amostras / pixel",
  figPath_sampling: "amostragem",
  figPath_left: "esfera da esquerda",
  figPath_right: "esfera da direita",
  figPath_note: "Veja o ruído derreter conforme as amostras se acumulam. Coisas para testar: troque para amostragem uniforme e veja quanto mais devagar o ruído some. Desligue o next event estimation e diminua a luz: os caminhos agora precisam acertar uma luz minúscula por acaso, e a imagem fica granulada por muito mais tempo. Coloque os rebatimentos em 0 para só luz direta (sem sangramento de cor das paredes vermelha e verde), depois 1, 2… cada rebatimento adiciona mais uma geração de luz indireta.",
  figTree_title: "A Árvore de Raios — Um Pixel, Traçado",
  figTree_hint: "arraste o olho · mire com o slider",
  figTree_note: "Mire o raio na bola de vidro e aumente a profundidade: cada acerto no vidro se divide num raio refletido e num refratado, então a árvore dobra a cada nível. Raios que ficam dentro da bola além do ângulo crítico só podem refletir (reflexão interna total). A listagem mostra o peso de cada raio: a parcela de Fresnel que ele passa para o pixel. Ramos com pesos minúsculos são onde um renderer real para mais cedo.",
  figWhit_cost: "Raios traçados por pixel: azul é 1 (um raio primário que atingiu algo fosco), vermelho é 16 ou mais. O vidro dobra os raios a cada acerto, um refletido e um refratado, então a árvore cresce como 2^profundidade. Baixe a profundidade e veja as esferas de vidro esfriarem.",
  figWhit_note: "Cada pixel envia um raio. Numa superfície fosca ele para, depois de perguntar à luz se ela está visível (um shadow ray). O espelho adiciona um raio refletido. O vidro adiciona um raio refletido e um refratado, ponderados por Fresnel. Desligue cada recurso para ver o que ele acrescenta, e coloque a profundidade em 1 para ver um único rebatimento.",
  figWhit_title: "Um Ray Tracer de Whitted",
};

export default text;
