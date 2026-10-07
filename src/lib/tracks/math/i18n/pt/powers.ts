// PT text for src/lib/tracks/math/chapters/powers.tsx. Keys match the tx() calls there; English is the fallback in the code.
// Only the interactive parts (in words, derivations) for now; the rest of the chapter still shows English.

const text: Record<string, string> = {
  mPow_powWords: "b elevado a n significa n cópias de b multiplicadas entre si.",
  mPow_lawsWords: "Com a mesma base, multiplicar soma os expoentes e dividir subtrai. Uma potência de potência multiplica os expoentes, e uma potência de um produto dá o expoente a cada fator.",
  mPow_dNeg: "Por que b⁰ = 1 e b⁻ⁿ = 1/bⁿ: mantendo a lei do quociente",
  mPow_dN1: "escreva o expoente 0 como n − n, para qualquer n inteiro",
  mPow_dN2: "lei do quociente, lida de trás para a frente: subtrair expoentes é dividir potências",
  mPow_dN3: "um número (diferente de 0) dividido por ele mesmo dá 1",
  mPow_dN4: "o mesmo truque com 0 − n: então um expoente negativo tem de significar o inverso, se as leis devem continuar valendo",
  mPow_rootWords: "A raiz quadrada de x é o número não negativo cujo quadrado é x: o lado de um quadrado de área x.",
  mPow_heronWords: "O próximo palpite é a média entre o palpite atual e x dividido por ele. Um dos dois é grande demais e o outro pequeno demais, então a média fica mais perto.",
  mPow_eqSquaring: "2¹⁰ elevando ao quadrado",
  mPow_sq1: "10 = 8 + 2, então 2¹⁰ = 2⁸ · 2²",
  mPow_sq2: "eleve ao quadrado repetidamente: 2² = 4, 4² = 16 = 2⁴, 16² = 256 = 2⁸",
  mPow_sq3: "multiplique as partes de que precisa: 256 × 4 = 1024",
};

export default text;
