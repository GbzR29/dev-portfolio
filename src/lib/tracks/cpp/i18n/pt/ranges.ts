// PT text for src/lib/tracks/cpp/chapters/ranges.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cppRng_intro: "O HUD de um jogo quer os nomes dos três primeiros inimigos vivos a menos de 50 metros. Como laço, isso é um for com dois ifs, um contador e um break, e a pergunta fica enterrada na mecânica. Com os algoritmos do C++98 é pior: copy_if para um vetor, transform para outro, depois cortar para três, com begin() e end() escritos seis vezes. Os ranges, que chegaram no C++20, deixam você escrever a pergunta do jeito que ela soa: os inimigos, filtrados, trocados por nomes, os três primeiros. Este capítulo mostra como isso funciona, por que faz menos trabalho do que o laço que você esperaria, e onde pode morder.",
  cppRng_goal0: "Explicar o que são um par de iteradores e um intervalo semiaberto.",
  cppRng_goal1: "Chamar algoritmos de ranges em contêineres inteiros, com projeções.",
  cppRng_goal2: "Montar um pipeline preguiçoso com views e prever quais elementos ele lê.",
  cppRng_goal3: "Transformar uma view de volta num contêiner, e evitar views penduradas.",

  cppRng_oldTitle: "A mesma pergunta, de três jeitos",
  cppRng_oldBody: "O laço é rápido mas difícil de ler: você precisa rodá-lo de cabeça para ver o que ele calcula. Os algoritmos dizem o que fazem, mas alocam dois vetores e conferem os mil inimigos, quando três bastavam. A versão com ranges se lê como a frase e, como a figura abaixo vai mostrar, para assim que tem três nomes. Antes das views, porém, o vocabulário em que elas se apoiam.",

  cppRng_itTitle: "Iteradores e intervalos semiabertos",
  cppRng_itBody: "Um iterador é um objeto que marca uma posição numa sequência: *it lê o elemento ali, ++it avança para o próximo. Para um vector, é um invólucro fino em volta de um ponteiro. v.begin() é a posição do primeiro elemento e v.end() é a posição logo depois do último, onde nada pode ser lido. Juntos descrevem um intervalo semiaberto, escrito [begin, end): begin está incluído, end não.",
  cppRng_hPiece: "Peça",
  cppRng_hMeans: "O que significa",
  cppRng_i1: "O elemento na posição, como *p para um ponteiro.",
  cppRng_i2: "Ir para a próxima posição.",
  cppRng_i3: "Ainda não passou do último elemento: o laço pode continuar.",
  cppRng_i4: "Semiaberto: um intervalo vazio é simplesmente begin == end, e o número de elementos é end − begin. Nenhum caso especial.",
  cppRng_itBug: "Todo algoritmo clássico recebe um par de iteradores, então toda chamada repete o contêiner duas vezes, e nada confere se os dois iteradores pertencem ao mesmo contêiner. Um range é qualquer coisa que tenha begin() e end(): um vector, uma string, um array, ou uma view. Passar um objeto em vez de dois elimina o erro.",

  cppRng_algoTitle: "Algoritmos de ranges",
  cppRng_algoBody: "Todo algoritmo de <algorithm> tem um gêmeo no namespace std::ranges que recebe o próprio range. A maioria também recebe uma projeção: uma função aplicada a cada elemento antes da comparação. &Enemy::hp é um ponteiro para membro e, usado como projeção, quer dizer \"olhe para e.hp\". Ele substitui o lambda que você escrevia só para dizer qual campo comparar.",
  cppRng_hArg: "Argumento",
  cppRng_a1: "O range: o vector inteiro, sem par begin/end.",
  cppRng_a2: "A comparação, deixada no padrão: std::ranges::less, que é a < b. As chaves constroem uma com valor padrão.",
  cppRng_a3: "A projeção: comparar e.hp em vez do Enemy inteiro. Qualquer função ou lambda também serve.",
  cppRng_a4: "No find, o valor procurado. Ele é comparado com o nome projetado, não com o Enemy.",

  cppRng_viewTitle: "Views: olhar sem copiar",
  cppRng_viewBody: "Uma view é um range que não é dono dos seus elementos. std::views::filter(v, is_even) não monta um vetor novo: monta um objeto pequeno que lembra de v e de is_even, e produz os elementos pares quando alguém o percorre. Copiar uma view é barato, e criar uma não faz trabalho nenhum. As views ficam em <ranges>, e std::views é um nome curto para std::ranges::views.",
  cppRng_pipeBody: "O | aqui não é um ou bit a bit. Para ranges, a biblioteca o sobrecarrega para que r | f(x) signifique f(r, x): o que está à esquerda vira o primeiro argumento. Ele se lê da esquerda para a direita como um pipe do shell do Unix, em que a saída de uma etapa flui para a próxima. Cada | embrulha a view à sua esquerda numa nova, então p é uma view take de uma view transform de uma view filter de v.",

  cppRng_lazyTitle: "Preguiçosa: nada acontece até o laço pedir",
  cppRng_lazyBody: "Quando o laço for roda, ele pede a p o primeiro elemento. p pede à view abaixo dela, que pede à de baixo, até chegar a v. O filtro lê elementos até um passar, o transform o eleva ao quadrado, e só esse valor sobe até o laço. Então o laço pede o próximo. Isso se chama puxar, e é por isso que as views são chamadas de preguiçosas: nenhum elemento é lido ou calculado antes de alguém precisar dele. Siga passo a passo abaixo, depois troque para a versão ansiosa, que é o código C++98 com um vetor por etapa.",
  cppRng_lazyAfter: "Dois detalhes da figura merecem um segundo olhar. Primeiro, o filter lê um elemento a mais do que você talvez esperasse: depois do terceiro valor, o laço chama ++it antes de conferir se terminou, e o ++ do filter já procura o próximo par. O take só para depois disso. Segundo, square roda exatamente três vezes, porque o transform trabalha quando um elemento é lido, não quando passa por ele. O código ansioso eleva os cinco pares ao quadrado e depois joga dois fora.",
  cppRng_orderWarn: "A ordem das etapas faz parte do significado. v | take(3) | filter(is_even) é \"os pares entre os três primeiros\", não \"os três primeiros pares\". Leia um pipeline em voz alta da esquerda para a direita antes de confiar nele.",

  cppRng_catalogTitle: "As views que vale conhecer",
  cppRng_hView: "View",
  cppRng_hDoes: "O que entrega",
  cppRng_hSince: "Desde",
  cppRng_r1: "Só os elementos para os quais pred devolve true.",
  cppRng_r2: "f(x) para cada elemento x, calculado quando é lido.",
  cppRng_r3: "Os n primeiros elementos / tudo depois dos n primeiros.",
  cppRng_r4: "Os elementos do começo até pred devolver false pela primeira vez.",
  cppRng_r5: "Os elementos do último ao primeiro.",
  cppRng_r6: "Os números a, a+1, …, b−1, inventados na hora. iota(a) nunca termina.",
  cppRng_r7: "A primeira / segunda parte de cada par, por exemplo as chaves de um std::map.",
  cppRng_r8: "Os pedaços de um range entre separadores, por exemplo as palavras de uma string.",
  cppRng_r9: "Pares (índice, elemento): o índice que o for de range nunca deu.",
  cppRng_r10: "Tuplas (a[i], b[i]), parando no range mais curto.",
  cppRng_r11: "Grupos de n lado a lado / toda janela de n vizinhos.",
  cppRng_r12: "Achata um range de ranges num só, com um separador entre eles no join_with.",
  cppRng_catalogAfter: "auto [i, e] é um structured binding: desempacota o par em dois nomes (o capítulo de Tipos de vocabulário trata disso). Com chunk(3), a lista 0 1 2 2 1 3 vira os grupos (0 1 2) e (2 1 3), um triângulo cada. Com slide(3), as amostras 4 6 8 10 dão as janelas (4 6 8) e (6 8 10), então o laço imprime 6 e 8.",

  cppRng_toTitle: "De volta a um contêiner: ranges::to",
  cppRng_toBody: "Uma view calcula seus elementos de novo a cada percurso e depende de a origem continuar viva. Quando você precisa guardar o resultado, armazená-lo ou percorrê-lo muitas vezes, materialize: ranges::to roda o pipeline uma vez e preenche um contêiner de verdade. Você só nomeia o template do contêiner; o tipo do elemento, std::string aqui, é deduzido da view. Antes do C++23 você escrevia o laço com push_back à mão.",

  cppRng_trapsTitle: "Onde as views mordem",
  cppRng_dangleTitle: "Resultados que apontam para um temporário morto",
  cppRng_dangleBody: "Um algoritmo de ranges chamado num contêiner temporário não devolve um iterador para dentro dele, já que o contêiner está prestes a ser destruído. Devolve std::ranges::dangling, um tipo vazio que não pode ser desreferenciado, e o bug vira erro de compilação. Mandar um temporário para dentro de uma view é seguro desde uma correção do C++20: a view move o vector para dentro de si (uma owning_view). O que a biblioteca não consegue ver é uma view que sobrevive a um contêiner com nome, como uma função que devolve uma view do seu próprio vector local.",
  cppRng_constTitle: "Uma view filter não pode ser percorrida por const&",
  cppRng_constBody: "O begin() do filter precisa procurar o primeiro elemento que passa, e ele guarda a resposta para que um segundo percurso não procure de novo. Guardar muda a view, então begin() não é const, e uma view const não pode ser percorrida. Receba views como auto&& (qualquer range, const ou não) ou por valor, o que é barato para uma view. A resposta guardada tem uma segunda consequência: não mude elementos através de um filter de modo que deixem de passar nele, porque o começo guardado pode ficar errado.",
  cppRng_debugTitle: "Builds de debug lentos",
  cppRng_debugBody: "Com -O2, o compilador expande cada etapa no lugar e o pipeline vira o laço que você teria escrito à mão. Com -O0, cada etapa continua sendo uma chamada de função de verdade, muitas vezes várias por elemento, e um pipeline costuma ficar várias vezes mais lento do que o laço. Isso pesa para um jogo que precisa rodar a 60 quadros por segundo num build de debug. Mantenha simples os laços mais quentes de cada quadro se os seus builds de debug ficarem lentos demais, e use views no resto.",

  cppRng_tryTitle: "Experimente",
  cppRng_try1: "Imprima os quadrados dos números ímpares de 1 a 19 com iota, filter e transform, sem contêiner nenhum.",
  cppRng_try2: "Acrescente, antes do filter, um transform que imprime \"read x\" no pipeline da figura. Conte as linhas e compare com os contadores da figura. Depois explique por que os elementos que passam aparecem duas vezes.",
  cppRng_try3: "Ordene um vector de inimigos por distância com uma chamada a ranges::sort e uma projeção, depois por nome em ordem inversa usando std::ranges::greater{} como comparação.",
  cppRng_try4: "Divida a string \"wood,stone,,iron\" em ',' com views::split e imprima cada pedaço entre colchetes. Quantos pedaços saem, e por quê?",

  cppRng_key0: "Um range é qualquer coisa com begin() e end(); [begin, end) inclui begin e exclui end.",
  cppRng_key1: "Os algoritmos de std::ranges recebem o range inteiro, e as projeções dizem para qual parte de cada elemento olhar.",
  cppRng_key2: "Uma view não é dona de nada e não faz trabalho ao ser criada; r | f(x) significa f(r, x).",
  cppRng_key3: "Views são preguiçosas: o laço puxa um elemento por vez, e os elementos depois do último necessário nunca são lidos.",
  cppRng_key4: "A ordem das etapas muda o significado; leia o pipeline em voz alta da esquerda para a direita.",
  cppRng_key5: "Materialize com ranges::to quando precisar guardar o resultado, e nunca deixe uma view sobreviver ao contêiner que ela olha.",
};

export default text;
