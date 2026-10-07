// PT text for src/lib/tracks/math/chapters/fractions.tsx. Keys match the tx() calls there; English is the fallback in the code.
// Only the interactive parts (in words, derivations, live formula) for now; the rest of the chapter still shows English.

const text: Record<string, string> = {
  mFrac_defWords: "Corte o inteiro em b partes iguais e pegue a delas. É a mesma quantidade que a dividido por b, e b nunca pode ser zero.",
  mFrac_cmpWords: "Para comparar duas frações, multiplique cada numerador pelo denominador da outra fração. O produto maior pertence à fração maior.",
  mFrac_liveCmp: "Experimente: compare duas frações",
  mFrac_liveCmpNote: "O parêntese à direita reescreve as duas frações sobre o menor denominador comum, que é o que os dois produtos fazem em segredo. Experimente 13/20 contra 21/32, as notas do exemplo resolvido mais abaixo.",
  mFrac_addWords: "Reescreva as duas frações para que as fatias tenham o mesmo tamanho, depois some quantas fatias você tem. Os denominadores nunca são somados.",
  mFrac_mulWords: "Em cima vezes em cima, embaixo vezes embaixo. Tomar uma fração de uma fração dá um pedaço de um pedaço.",
  mFrac_divWords: "Para dividir por uma fração, vire-a de cabeça para baixo e multiplique.",
  mFrac_eqRep: "Deslocando a parte que se repete",
  mFrac_rep1: "chame o número de x: x = 0,272727…",
  mFrac_rep2: "o bloco \"27\" tem 2 dígitos, então multiplique por 10² = 100: 100x = 27,272727…",
  mFrac_rep3: "subtraia a primeira linha da segunda: as caudas infinitas são idênticas e se cancelam, sobrando 99x = 27",
  mFrac_rep4: "divida: x = 27/99 = 3/11. O mesmo truque mostra que 0,999… = 9/9 = 1 exatamente: são dois nomes para o mesmo número",
  mFrac_eqMixed: "2¾ + 1⅚",
  mFrac_mix1: "transforme cada número misto numa fração imprópria: 2¾ são 2 inteiros de 4 quartos mais 3, 2 × 4 + 3 = 11 quartos; 1⅚ é 1 × 6 + 5 = 11 sextos",
  mFrac_mix2: "denominador comum: mmc(4, 6) = 12. Multiplique 11/4 em cima e embaixo por 3, e 11/6 por 2",
  mFrac_mix3: "some os numeradores: 33 + 22 = 55 doze avos",
  mFrac_mix4: "de volta a número misto: 55 ÷ 12 = 4 resto 7, então 4 inteiros e 7/12. Confira: 4 × 12 + 7 = 55",
};

export default text;
