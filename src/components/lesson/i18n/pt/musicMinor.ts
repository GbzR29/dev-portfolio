// PT text for the Music minor-scale widgets (MinorScaleFigure, RelativeFigure,
// MinorQuizFigure). Keys match the tx() calls there.

const text: Record<string, string> = {
  // ── MinorScaleFigure ──
  figMus_mnTitle: "A escala menor em três formas",
  figMus_mnForm: "forma",
  figMus_mnNatural: "natural",
  figMus_mnHarmonic: "harmônica",
  figMus_mnMelodic: "melódica",
  figMus_mnMinor: "menor",
  figMus_mnRelative: "relativa maior",
  figMus_mnVsMajor: "mais baixos que em",
  figMus_mnSubtonic: "subtônica",
  figMus_mnAug: "1½",
  figMus_mnDownNat: "na descida, a menor melódica é a forma natural",
  figMus_mnSigOnly: "só a armadura: nenhum sinal a mais",
  figMus_mnSigns: "as notas elevadas são escritas ao lado da nota: elas não estão na armadura",
  figMus_mnPlayMajor: "tocar a maior da mesma tônica",
  figMus_mnAria: "teclado de piano: aperte uma tecla para montar a sua escala menor",
  figMus_mnNeckAria: "braço de violão: aperte uma nota para montar a sua escala menor",
  figMus_mnNote: "Comece no lá: as teclas brancas de lá a lá são a menor natural, tom, semitom, tom, tom, semitom, tom, tom. Comparados com a escala maior da mesma tônica, os graus 3, 6 e 7 ficam um semitom mais baixos (roxo). A sua 7ª fica um tom abaixo da tônica e não se inclina para ela, então a forma harmônica a eleva (âmbar): de novo uma sensível, mas agora os graus 6 e 7 ficam a um tom e meio, um espaço que se ouve. A forma melódica eleva também a 6ª na subida para alisar esse espaço, e na descida, onde não precisa de sensível, volta a ser a forma natural: toque descendo e veja os sinais sumirem. A armadura é a da menor natural, dividida com a relativa maior, então toda nota elevada é escrita ao lado da própria nota.",

  // ── RelativeFigure ──
  figMus_rlTitle: "Relativa e homônima menor",
  figMus_rlMajorKey: "tonalidade maior",
  figMus_rlRelative: "relativa menor",
  figMus_rlParallel: "homônima menor",
  figMus_rlSame: "mesmas notas, mesma armadura, outra casa",
  figMus_rlSameTonic: "mesma tônica",
  figMus_rlMoreFlats: "bemóis a mais (ou sustenidos a menos)",
  figMus_rlMinOnly: "menor",
  figMus_rlMajOnly: "maior",
  figMus_rlLegend: "azul: a tonalidade maior, tônica no quadro · tracejado roxo: a tonalidade menor, tônica preenchida",
  figMus_rlPlayMajor: "tocar a maior",
  figMus_rlPlayMinor: "tocar a menor",
  figMus_rlNote: "O quadro azul é a tonalidade maior, sete vizinhas na linha de quintas com a tônica em segundo lugar da esquerda. O quadro roxo é uma tonalidade menor natural, sete vizinhas com a tônica em quinto lugar da esquerda. Relativa: ponha a tônica menor no 6º grau da maior, três quintas à direita da tônica maior (dó → lá, uma terça menor abaixo no teclado). Os quadros coincidem: as mesmas sete notas, a mesma armadura, só a casa muda. Homônima: ponha a tônica menor na mesma nota da maior. O quadro dela desliza três lugares para a esquerda, então três notas saem pela direita e voltam abemolizadas pela esquerda: os graus 3, 6 e 7, três bemóis a mais. Toque as duas escalas e escute onde cada uma repousa.",

  // ── MinorQuizFigure ──
  figMus_mqTitle: "Prática: tonalidades menores",
  figMus_mqMajor: "maior",
  figMus_mqNatural: "menor natural",
  figMus_mqHarmonic: "menor harmônica",
  figMus_mqMelodic: "menor melódica",
  figMus_mqHear: "ouvir a escala",
  figMus_mqSig: "menor de uma armadura",
  figMus_mqRel: "tonalidades relativas",
  figMus_mqLvA: "maior ou menor",
  figMus_mqLvB: "+ harmônica",
  figMus_mqLvC: "+ melódica",
  figMus_mqAll: "as 15 tonalidades",
  figMus_mqWhichScale: "que escala foi essa?",
  figMus_mqWhichMinor: "que tonalidade menor tem esta armadura?",
  figMus_mqRelMinor: "a sua relativa menor?",
  figMus_mqRelMajor: "a sua relativa maior?",
  figMus_mqNote: "Ouvir: preste atenção primeiro na terceira nota, uma terça maior ou menor acima da primeira; depois no alto: a menor natural chega à oitava por um tom, a menor harmônica salta um tom e meio e depois se inclina, a menor melódica sobe lisa como o alto de uma escala maior. Armaduras: ache a tonalidade maior como no capítulo anterior, depois desça uma terça menor (três semitons, três letras contando as duas pontas): dois sustenidos é ré maior, então si menor. Ou direto: com sustenidos, a tônica menor fica um tom abaixo do último sustenido; com bemóis, uma terça maior acima do último bemol.",
};

export default text;
