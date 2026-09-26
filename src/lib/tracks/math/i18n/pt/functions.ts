// PT text for src/lib/tracks/math/chapters/functions.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  mAlg_fnTitle: "Funções",
  mAlg_fnBody: "Uma função é uma regra que transforma cada entrada em exatamente uma saída: f(x) = x² transforma 3 em 9. O conjunto de entradas permitidas é o domínio (√x só aceita x ≥ 0 entre os reais), e o conjunto de saídas que ela pode produzir é a imagem (x² nunca produz negativos). O seu gráfico é o conjunto de todos os pontos (x, f(x)), desenhado como uma curva. O dia a dia está cheio de funções: o preço do correio em função do peso, a altura de uma bola lançada em função do tempo, a temperatura em função da hora. Pensar nelas como curvas que você pode ver e remodelar as torna muito mais fáceis de entender.",
  mAlg_eqLine: "Funções lineares",
  mAlg_wM: "a inclinação: quanto y muda quando x aumenta 1. Entre dois pontos, é a subida sobre o avanço, (y₂ − y₁)/(x₂ − x₁)",
  mAlg_wB: "o intercepto: o valor em x = 0, onde a reta cruza o eixo y",
  mAlg_eqLineNote: "Uma reta que passa por dois pontos (x₁, y₁) e (x₂, y₂) é y = y₁ + m(x − x₁). Leia assim: \"comece em y₁ e some a inclinação vezes o quanto x andou a partir de x₁\".",
  mAlg_transTitle: "Movendo e esticando gráficos",
  mAlg_transBody: "Raramente você precisa de uma função totalmente nova; precisa de uma conhecida movida ou esticada até o lugar certo. Quatro números fazem tudo isso. Dois agem na saída (fora de f), dois na entrada (dentro de f). Os de fora se comportam como você espera. Os de dentro se comportam ao contrário, porque mudam qual entrada f enxerga: para ver o que f normalmente mostra em 0, a entrada precisa ser c, então subtrair c move o gráfico para a direita.",
  mAlg_eqTrans: "As quatro transformações",
  mAlg_wA: "escala vertical: multiplica toda saída. a = 2 dobra as alturas; a < 0 vira o gráfico de cabeça para baixo",
  mAlg_wBh: "escala horizontal: multiplica a entrada, então b = 2 faz as coisas acontecerem duas vezes mais rápido (metade da largura); b < 0 espelha da esquerda para a direita",
  mAlg_wC: "deslocamento horizontal: o gráfico se move c para a direita",
  mAlg_wD: "deslocamento vertical: o gráfico sobe d",
  mAlg_compTitle: "Composição e inversas",
  mAlg_eqInv: "Invertendo uma função linear",
  mAlg_wFwd: "a função direta",
  mAlg_wBack: "isolar x dá a inversa: desfaça o + b, depois desfaça o × m",
};

export default text;
