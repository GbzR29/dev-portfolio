// PT text for the Music score editor (src/components/lesson/figures/music/score/).
// Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  // ── ScoreEditorFigure ──
  figMus_seTitle: "Editor de partitura",
  figMus_sePlay: "tocar a partitura",
  figMus_seNext: "próxima",
  figMus_seRestWord: "pausa",
  figMus_seDotted: "pontuada",
  figMus_seBeats: "tempos",
  figMus_seCarried: "sinal vindo de antes no compasso",
  figMus_seEmpty: "partitura vazia",
  figMus_seBarsFull: "compassos completos",
  figMus_seBar: "compasso",
  figMus_seOf: "de",
  figMus_seCrosses: "uma nota passa da barra de compasso no compasso",
  figMus_seSplit: "dividir com uma ligadura",
  figMus_seBadTie: "uma ligadura une duas notas da mesma altura: esta não tem onde se segurar",
  figMus_seUndo: "desfazer",
  figMus_seRedo: "refazer",
  figMus_seDelete: "apagar",
  figMus_seDeleteLast: "apagar a última",
  figMus_seOde: "Ode à Alegria",
  figMus_seTwinkle: "Brilha, brilha",
  figMus_seCopied: "link copiado",
  figMus_seLink: "copiar um link",
  figMus_seTreble: "clave de sol",
  figMus_seBass: "clave de fá",
  figMus_seMetro: "metrônomo",
  figMus_seTempo: "andamento (♩/min)",
  figMus_seKeys: "Teclas (clique na partitura antes): A–G escrevem uma nota (C = dó … B = si), 3–7 escolhem semicolcheia … semibreve, . ponto, 0 pausa, t ligadura, ↑ ↓ movem a nota, ← → selecionam, Backspace apaga, Ctrl+Z desfaz, espaço toca.",
  figMus_seNote: "Escolha uma figura e clique no espaço tracejado no fim para escrevê-la, na altura em que clicar; ou toque no instrumento abaixo, que também escreve as teclas pretas e só põe sinais onde a regra da barra de compasso precisa. Clique numa nota para selecioná-la: a paleta, as setas e o instrumento passam a mudar essa nota, e um segundo clique nela a move. O editor conta cada compasso: uma nota que passa da barra fica vermelha, e o botão a divide em duas notas unidas por uma ligadura. As notas roxas não têm sinal próprio, mas soam sustenidas ou bemóis por causa de um sinal escrito antes no mesmo compasso. A sua partitura fica salva neste navegador, e o link a abre em qualquer lugar.",
  figMus_seAria: "editor de partitura: clique na partitura e depois digite as notas",
  figMus_seEmptyHint: "clique aqui para escrever a primeira nota",
  figMus_seKeysAria: "teclado que escreve notas na partitura",
  figMus_seNeckAria: "braço do violão que escreve notas na partitura",

  // ── Palette ──
  figMus_seNoSign: "sem sinal",
  figMus_seDot: "ponto (+ metade da figura)",
  figMus_seRest: "pausa em vez de nota",
  figMus_seTie: "ligar à próxima nota",
};

export default text;
