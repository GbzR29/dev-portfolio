// PT text for src/lib/tracks/math/chapters/sequences.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  mAlg_sumTitle: "Somas: lendo o Σ",
  mAlg_sumBody: "A letra grega sigma maiúscula, Σ, é uma abreviação de um loop que soma. Embaixo dela ficam a variável do loop e onde ela começa; em cima, onde ela para; à direita, o que somar a cada vez. Duas somas têm formas fechadas que vale conhecer. A série aritmética 1 + 2 + … + n: juntar o primeiro e o último termo (1 + n), o segundo e o penúltimo (2 + n − 1) e assim por diante dá n/2 pares valendo n + 1. A série geométrica, em que cada termo é r vezes o anterior, aparece no ruído fractal (cada oitava tem gain vezes a amplitude da anterior), no crescimento composto e na suavização exponencial da trilha de Game Dev.",
  mAlg_eqSums: "Notação sigma e duas formas fechadas",
  mAlg_wArith: "a série aritmética: n(n + 1)/2. O total de XP dos níveis 1…100, a 1 XP × nível, é 5050",
  mAlg_wGeo: "a série geométrica: (1 − rⁿ)/(1 − r) para r ≠ 1. Multiplique a soma S por r e subtraia: S − rS = 1 − rⁿ, porque todos os termos do meio se cancelam",
  mAlg_wInf: "o limite da série geométrica quando n → ∞, se |r| < 1. Com r = ½: 1 + ½ + ¼ + … = 2. É por isso que o fBm com gain 0,5 nunca passa do dobro da sua primeira oitava",
};

export default text;
