// PT text for src/lib/tracks/math/chapters/order-of-operations.tsx. Keys match the tx() calls there; English is the fallback in the code.
// Only the interactive parts (in words, derivations) for now; the rest of the chapter still shows English.

const text: Record<string, string> = {
  mOrd_lrWords: "Quando as operações estão no mesmo nível, faça-as na ordem em que você lê, da esquerda para a direita.",
  mOrd_powWords: "Menos três ao quadrado não é o mesmo que o quadrado de menos três: a potência vai só no 3, a não ser que parênteses façam de −3 a base.",
  mOrd_barWords: "Calcule tudo o que está acima da barra, depois tudo o que está abaixo, e só então divida.",
  mOrd_eqEx1: "Um passo por linha",
  mOrd_ex1a: "parênteses primeiro: 7 − 3 = 4",
  mOrd_ex1b: "depois a potência: 4² = 16",
  mOrd_ex1c: "depois × e ÷, da esquerda para a direita: 5 × 2 = 10, e 16 ÷ 8 = 2 seguido de 2 × 3 = 6",
  mOrd_ex1d: "por fim + e −, da esquerda para a direita: 20 − 10 = 10, depois 10 + 6 = 16",
  mOrd_eqNest: "O colchete mais de dentro primeiro, um passo por linha",
  mOrd_nest1: "o ( ) mais de dentro: 9 − 5 = 4",
  mOrd_nest2: "dentro do [ ], a potência primeiro: 4² = 16",
  mOrd_nest3: "termine o [ ]: 16 − 6 = 10",
  mOrd_nest4: "dentro do { }, × antes de +: 3 × 10 = 30, depois 2 + 30 = 32",
  mOrd_nest5: "fora: 32 ÷ 4 = 8, e por último a subtração 8 − 1 = 7",
};

export default text;
