// PT text for src/lib/tracks/math/chapters/bases.tsx. Keys match the tx() calls there; English is the fallback in the code.
// Only the interactive parts (in words, live formula) for now; the rest of the chapter still shows English.

const text: Record<string, string> = {
  mBase_placeWords: "Multiplique cada dígito pela base elevada à posição dele, contando as posições a partir de 0 na direita, e some tudo.",
  mBase_livePlace: "Experimente: qualquer número em qualquer base",
  mBase_lvN: "número",
  mBase_lvB: "base B",
  mBase_livePlaceNote: "Cada dígito fica entre 0 e B − 1; acima de 9 eles são escritos de A a F. Ponha a base em 10 para ver os valores de posição de sempre, e em 16 para ver o quanto o número encurta.",
  mBase_rangeWords: "Com n dígitos na base B você escreve B elevado a n números diferentes, de 0 até um a menos que isso.",
  mBase_sixtyWords: "Para transformar um tempo em horas, some os minutos divididos por 60 e os segundos divididos por 3600.",
};

export default text;
