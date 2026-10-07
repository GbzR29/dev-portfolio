// PT text for the math widgets of the Algebra section (Arithmetic widgets are in math.ts).
// Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  // ── AlgebraTilesFigure ──
  figTiles_title: "Peças de álgebra",
  figTiles_like: "termos semelhantes",
  figTiles_dist: "distribuir",
  figTiles_foil: "dois parênteses",
  figTiles_uncollect: "como está escrito",
  figTiles_collect: "juntar ▶",
  figTiles_noteLike: "Cada barra azul é um x, cada quadrado verde é uma unidade, e uma peça vermelha tracejada é uma que é subtraída. Aperte juntar: as peças são separadas por tipo, e cada peça vermelha cancela uma peça do mesmo tipo, porque x − x = 0 e 1 − 1 = 0. O que sobra é a expressão simplificada. Uma barra x e um quadrado de unidade nunca se juntam: são coisas de tipos diferentes, como metros e segundos. Mova o controle de x: as duas formas sempre dão o mesmo número.",
  figTiles_noteDist: "Um retângulo de largura k e comprimento x + c tem área k(x + c). Corte-o onde o x termina e você obtém dois retângulos, k·x e k·c. A área total não mudou, então k(x + c) = kx + kc. Essa é a lei distributiva: o fator de fora dos parênteses multiplica todos os termos de dentro.",
  figTiles_noteFoil: "Um quadrado de lados x + a por x + b é cortado em quatro pedaços: x·x = x², b·x, a·x e a·b. Somá-los dá x² + (a + b)x + ab. Cada termo do primeiro parêntese encontra cada termo do segundo exatamente uma vez; é por isso que os dois pedaços do meio estão lá, e esquecê-los é o erro clássico (x + 3)² ≠ x² + 9.",
  figTiles_faded: "apagadas = pares cancelados",

  // ── BalanceFigure ──
  figBal_start: "a equação",
  figBal_both: "dos dois lados",
  figBal_title: "Uma equação é uma balança",
  figBal_guess: "teste x =",
  figBal_back: "◀ voltar",
  figBal_step: "passo de solução ▶",
  figBal_all: "todo x equilibra: infinitas soluções",
  figBal_none: "os x se cancelam e as constantes diferem: nenhum x consegue equilibrar",
  figBal_level: "nivelada: x =",
  figBal_isSol: "é a solução",
  figBal_solIs: "a solução é x =",
  // ── LinesFigure ──
  figLines_same: "mesma reta: infinitas soluções",
  figLines_parallel: "paralelas: nenhuma solução",
  figLines_one: "uma solução:",
  figLines_title: "Duas equações, duas retas",
  figLines_pCross: "se cruzam",
  figLines_pParallel: "paralelas",
  figLines_pSame: "mesma reta",
  figLines_note: "Arraste os quatro pontos para mover as duas retas. Todo ponto da reta azul satisfaz a primeira equação, todo ponto da reta rosa a segunda; o ponto verde, nas duas, é o único (x, y) que satisfaz as duas ao mesmo tempo. Deixe as retas paralelas e o determinante ad − bc vira 0: elas nunca se encontram, então não há solução. Ponha uma sobre a outra e todo ponto é compartilhado: infinitas soluções.",
  figLines_off: "o cruzamento está fora da grade",

  // ── CompleteSquareFigure ──
  figCSq_title: "Completando o quadrado",
  figCSq_split: "dividir a faixa",
  figCSq_fill: "pôr o canto",
  figCSq_note: "O quadrado roxo é x², a faixa azul é b·x. Divida a faixa em duas metades de b/2 e mova uma para baixo do quadrado: você obtém um L que é um quadrado grande de lado x + b/2 com um canto faltando. O canto que falta é (b/2)², então x² + bx é igual ao quadrado grande menos esse canto. Somar o canto aos dois lados de uma equação é exatamente o passo chamado completar o quadrado.",
  figCSq_missing: "← falta (b/2)²",

  // ── PolynomialFigure ──
  figPoly_title: "Um polinômio a partir das raízes",
  figPoly_d1: "grau 1",
  figPoly_lead: "a dominante",
  figPoly_ends: "pontas:",
  figPoly_double: "raiz dupla, encosta",
  figPoly_multi: "raiz de multiplicidade",
  figPoly_note: "Cada alça âmbar é uma raiz: arraste-a pelo eixo e a curva acompanha, sempre passando pelo zero ali, porque um fator (x − r) vira 0. Arraste duas raízes para o mesmo lugar: a curva agora encosta no eixo e volta em vez de cruzá-lo (uma raiz dupla). Mude o grau e o sinal de a para ver as pontas: um grau par manda as duas pontas para o mesmo lado, um grau ímpar as manda para lados opostos. A forma desenvolvida abaixo da fatorada é o mesmo polinômio multiplicado.",

  // ── SequenceFigure ──
  figSeq_title: "Sequências e suas somas",
  figSeq_arith: "aritmética",
  figSeq_geo: "geométrica",
  figSeq_sums: "soma acumulada",
  figSeq_noteArith: "Cada barra é um termo; cada uma é d a mais que a anterior, então os topos ficam sobre uma reta. A linha âmbar é o total acumulado a₁ + a₂ + … + aₙ. Ela se curva para cima porque cada termo novo é maior que o anterior (para d > 0), e seu valor depois de 12 termos é 12 vezes a média do primeiro e do último termo.",
  figSeq_noteGeo: "Cada barra é r vezes a anterior. Com r > 1 as barras explodem; com 0 < r < 1 elas encolhem em direção a zero e o total acumulado se estabiliza no limite verde a₁/(1 − r); com r negativo as barras alternam de sinal. Experimente r = 0,5 com a₁ = 1: as somas se aproximam de 2, o clássico 1 + ½ + ¼ + … = 2.",
  figSeq_limit: "limite",

  // ── InequalityFigure ──
  figIneq_title: "Resolvendo uma inequação",
  figIneq_flipped: "÷ um número negativo: o sinal se inverte",
  figIneq_kept: "÷ um número positivo: o sinal se mantém",
  figIneq_test: "teste x =",
  figIneq_true: "é verdadeiro",
  figIneq_false: "é falso",
  figIneq_note: "A semirreta âmbar é todo x que torna a inequação verdadeira. Arraste o ponto de teste pela reta: ele fica verde dentro da semirreta e vermelho fora, então você pode conferir a resposta em vez de confiar numa regra. Agora arraste a para baixo de zero. Dividir por um número negativo inverte a ordem da reta numérica (3 < 5, mas −3 > −5), então o sinal precisa se inverter, e a semirreta pula para o outro lado da fronteira. Uma extremidade vazia quer dizer que a própria fronteira é excluída (< ou >), uma cheia que ela é incluída (≤ ou ≥). Com a = 0 não sobra x: a afirmação então é sempre verdadeira ou nunca é.",
  figIneq_always: "a = 0: verdadeiro para todo x",
  figIneq_never: "a = 0: verdadeiro para nenhum x",

  figBal_note:"Cada caixa azul pesa x, os quadrados verdes pesam 1 e os quadrados vermelhos tracejados puxam para cima com 1 (um −1 é um balão). Mova o controle para testar valores de x: a barra pende para o lado mais pesado e só fica nivelada quando os dois lados têm o mesmo valor, que é exatamente o que a equação afirma. Depois aperte passo de solução: cada movimento faz a mesma coisa nos dois pratos, então uma balança nivelada continua nivelada, até sobrar um único x sozinho de um lado. Experimente o último exemplo: os x se cancelam e os pratos nunca conseguem se equilibrar.",
};

export default text;
