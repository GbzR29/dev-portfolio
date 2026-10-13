// PT text for the Music tuning widgets (BeatsFigure, FifthsSpiralFigure, TuningFigure).
// Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  // ── BeatsFigure ──
  figMus_btTitle: "Batimentos: dois sons que quase concordam",
  figMus_btUnison: "uníssono 1:1",
  figMus_btOctave: "oitava 2:1",
  figMus_btFifth: "quinta 3:2",
  figMus_btFourth: "quarta 4:3",
  figMus_btMajor3: "terça maior 5:4",
  figMus_btMinor3: "terça menor 6:5",
  figMus_btOff: "nota de cima desviada",
  figMus_btPure: "pura",
  figMus_btEqual: "temperamento igual",
  figMus_btNone: "sem batimentos: pura",
  figMus_btPerSec: "batimentos por segundo",
  figMus_btSum: "os dois harmônicos que se encontram, somados, em 4 segundos",
  figMus_btPlay: "segurar as duas notas",
  figMus_btNote: "Segure a quinta e desvie alguns cents: aparece um uá-uá lento, mais rápido quanto mais longe você vai. Esse pulso são dois harmônicos, um de cada som, que deveriam cair na mesma frequência e erram. Intervalos puros não têm batimentos, e por isso soam tão parados. Agora aperte temperamento igual: a quinta do piano bate menos de uma vez por segundo, a terça maior quase nove vezes por segundo aqui (e mais rápido no agudo). Acima de uns 15 batimentos por segundo o pulso vira um zumbido áspero.",

  // ── FifthsSpiralFigure ──
  figMus_spTitle: "Doze quintas quase fecham o círculo",
  figMus_spPure: "quintas puras 3:2",
  figMus_spTempered: "quintas do piano 700 ¢",
  figMus_spN: "quintas empilhadas (n)",
  figMus_spKey: "tecla",
  figMus_spDrift: "quanto cada nota passa da sua tecla",
  figMus_spComma: "si♯ erra o dó pela coma pitagórica",
  figMus_spEach: "cada quinta pura soma 1,96 ¢",
  figMus_spZero: "toda nota na sua tecla: o círculo fecha",
  figMus_spClimb: "subir as quintas",
  figMus_spClash: "última nota com a sua tecla do piano",
  figMus_spNote: "Cada quinta pura sobe 701,96 cents; voltar por oitavas inteiras mantém toda nota dentro de uma oitava, o círculo. As teclas ficam a 100 cents uma da outra, então cada quinta cai 1,96 cent mais longe da sua tecla que a anterior. Depois de 12 quintas a corrente chega ao si♯, que deveria ser o dó de novo, mas erra por 23,46 cents: toque-o com a sua tecla do piano e ouça o batimento. Mude para as quintas do piano: cada quinta cede 1,96 cent e o círculo fecha exatamente.",

  // ── TuningFigure ──
  figMus_tuTitle: "O mesmo acorde em cinco afinações",
  figMus_tuPyth: "pitagórica",
  figMus_tuMean: "mesotônica",
  figMus_tuJust: "justa (em dó)",
  figMus_tuWell: "Werckmeister III",
  figMus_tuEqual: "igual",
  figMus_tuMajor: "maior",
  figMus_tuThird: "terça",
  figMus_tuFifth: "quinta",
  figMus_tuBps: "bat./s",
  figMus_tuKeys: "cada tecla comparada à do piano, em cents",
  figMus_tuChords: "o acorde maior de cada nota, distância do puro",
  figMus_tuThirdRow: "terça",
  figMus_tuFifthRow: "quinta",
  figMus_tuTour: "tocar os doze acordes",
  figMus_tuNote: "Clique numa célula para ouvir aquele acorde maior, ou faça a volta pelos doze. A mesotônica deixa os acordes perto de dó mais doces que os do piano (terças puras), mas quatro deles ficam inutilizáveis, e a quinta sol♯–mi♭ uiva: o lobo. A afinação pitagórica tem quintas puras e terças ásperas em todo lugar. A justa é perfeita em dó e desmorona longe dele. A de Werckmeister dá a toda tonalidade um acorde usável, cada um um pouco diferente. O temperamento igual deixa todo acorde exatamente igual: nunca puro, nunca ruim.",
};

export default text;
