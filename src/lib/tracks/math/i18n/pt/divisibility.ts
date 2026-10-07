// PT text for src/lib/tracks/math/chapters/divisibility.tsx. Keys match the tx() calls there; English is the fallback in the code.
// Only the interactive parts (in words, derivations, live formula) for now; the rest of the chapter still shows English.

const text: Record<string, string> = {
  mDiv_remWords: "Encaixe b em a quantas vezes inteiras der; essa contagem é o quociente, e o que sobra, menor que b, é o resto.",
  mDiv_liveRem: "Experimente: quociente e resto",
  mDiv_lvA: "dividendo a",
  mDiv_lvB: "divisor b",
  mDiv_liveRemNote: "Leve a abaixo de zero: o quociente desce para o inteiro menor seguinte, para que o resto continue entre 0 e b − 1. Com a = −17 e b = 5 você tem −17 = (−4) · 5 + 3.",
  mDiv_factWords: "Todo número inteiro maior que 1 é um produto de primos de um único jeito. Para contar os divisores dele, some um a cada expoente e multiplique.",
  mDiv_dEuclid: "Euclides com 1071 e 462",
  mDiv_dE1: "1071 = 2 × 462 + 147: troque o par pelo número menor e o resto",
  mDiv_dE2: "462 = 3 × 147 + 21",
  mDiv_dE3: "147 = 7 × 21 + 0: a divisão é exata",
  mDiv_dE4: "regra de parada mdc(a, 0) = a. Confira pelas fatorações: 1071 = 3² × 7 × 17 e 462 = 2 × 3 × 7 × 11 têm 3 × 7 = 21 em comum",
  mDiv_euclidWords: "Troque o par pelo número menor e o resto da divisão do maior por ele. Os divisores comuns não mudam. Quando o resto chega a 0, o outro número é o mdc.",
  mDiv_lcmWords: "Multiplique os dois números e divida pelo mdc deles, para que os fatores em comum não sejam contados duas vezes.",
  mDiv_congWords: "Dois números são congruentes módulo n quando deixam o mesmo resto na divisão por n, o que acontece exatamente quando a diferença entre eles é múltiplo de n.",
};

export default text;
