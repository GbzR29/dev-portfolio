// PT text for src/lib/tracks/math/chapters/sequences.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  mAlg_sumTitle: "Somas: lendo o Σ",
  mAlg_sumBody: "A letra grega sigma maiúscula, Σ, é uma abreviação de “some tudo isto”. Embaixo dela ficam a variável do índice e onde ela começa; em cima, onde ela para; à direita, o que somar a cada vez. Duas somas têm formas fechadas que vale conhecer. A série aritmética 1 + 2 + … + n: juntar o primeiro e o último termo (1 + n), o segundo e o penúltimo (2 + n − 1) e assim por diante dá n/2 pares valendo n + 1. A série geométrica, em que cada termo é r vezes o anterior, aparece no crescimento composto, nas metades repetidas e nas bolas que quicam.",
  mAlg_eqSums: "Notação sigma e duas formas fechadas",
  mAlg_wArith: "a série aritmética: n(n + 1)/2. Uma pilha de toras com 1 no topo, 2 abaixo, … 20 na base tem 20 · 21/2 = 210 toras",
  mAlg_wGeo: "a série geométrica: (1 − rⁿ)/(1 − r) para r ≠ 1. Multiplique a soma S por r e subtraia: S − rS = 1 − rⁿ, porque todos os termos do meio se cancelam",
  mAlg_wInf: "o limite da série geométrica quando n → ∞, se |r| < 1. Com r = ½: 1 + ½ + ¼ + … = 2. Cada termo é metade do anterior, e juntos nunca passam do dobro do primeiro",
};

export default text;
