// PT text for src/lib/tracks/math/chapters/ratios.tsx. Keys match the tx() calls there; English is the fallback in the code.
// Only the interactive parts (in words, derivations, live formula) for now; the rest of the chapter still shows English.

const text: Record<string, string> = {
  mRat_ratioWords: "Uma razão a : b divide o todo em a + b partes iguais; a delas vão para um lado, então a parte desse lado é a de a + b.",
  mRat_pctWords: "A parte é a porcentagem do todo. Sabendo dois entre parte, porcentagem e todo, você acha o terceiro: multiplique para achar a parte, divida para achar os outros dois.",
  mRat_chgWords: "Cada variação multiplica a quantidade por um mais a porcentagem, então duas variações multiplicam a quantidade pelos dois fatores. A variação em porcentagem é sempre medida em relação ao ponto de partida.",
  mRat_lerpWords: "Primeiro descubra quanto do caminho da sua faixa x já andou, como uma fração t. Depois ande a mesma fração do caminho na faixa nova.",
  mRat_eqTemp: "Celsius para Fahrenheit como mudança de escala",
  mRat_temp1: "as duas escalas têm dois pontos fixos em comum: a água congela a 0 °C = 32 °F e ferve a 100 °C = 212 °F. Então a = 0, b = 100, c = 32, d = 212",
  mRat_temp2: "fração do caminho do congelamento à fervura: t = (C − 0)/(100 − 0) = C/100",
  mRat_temp3: "a mesma fração do intervalo Fahrenheit, 212 − 32 = 180 graus, somada a 32. 180/100 = 1,8",
  mRat_temp4: "confira com 37 °C: 32 + 1,8 × 37 = 32 + 66,6 = 98,6 °F, a temperatura normal do corpo",
  mRat_liveTemp: "Experimente: qualquer temperatura",
  mRat_liveTempNote: "Abaixo de 0 °C a fração t é negativa e acima de 100 °C passa de 1: a fórmula extrapola além dos dois pontos fixos, e aqui isso está certo. Ache a única temperatura que marca o mesmo número nas duas escalas.",
};

export default text;
