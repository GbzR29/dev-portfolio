// PT text for the Music widgets (src/components/lesson/figures/music/).
// Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  // ── PianoFigure ──
  figMus_pianoTitle: "Um piano para tocar",
  figMus_piano: "🎹 piano",
  figMus_synth: "〰 sintetizador",
  figMus_sine: "seno",
  figMus_triangle: "triângulo",
  figMus_square: "quadrada",
  figMus_saw: "dente-de-serra",
  figMus_loading: "carregando o piano (1,3 MB)…",
  figMus_loadError: "o piano não carregou — clique numa tecla para tentar de novo",
  figMus_pressKey: "aperte uma tecla",
  figMus_recording: "gravação",
  figMus_volume: "volume",
  figMus_noteMouse: "Clique ou arraste pelas teclas. Depois de um clique, o teclado do computador também toca: A S D F G H J K são as teclas brancas a partir de C3, e W E T Y U as pretas.",
  figMus_noteTouch: "Toque ou deslize pelas teclas; vários dedos tocam um acorde. No iPhone, desligue o modo silencioso para ouvir.",
  figMus_keyboardAria: "teclado de piano, de C3 a C6",
  figMus_pianoCredit: "Piano: Salamander Grand Piano, de Alexander Holm (CC-BY 3.0).",

  // ── AirFigure ──
  figMus_airTitle: "Um empurrão passado adiante pelo ar",
  figMus_vacuum: "tirar o ar",
  figMus_airF: "f (em câmera lenta)",
  figMus_airA: "força do empurrão A",
  figMus_airNote: "Siga a partícula vermelha: ela só balança para a frente e para trás em volta do seu lugar, mas os trechos apertados viajam até o ouvido. Aumente f e os trechos ficam mais próximos (λ = v/f). Depois tire o ar: o alto-falante continua se mexendo, mas nada chega ao ouvido. O som de verdade é algumas centenas de vezes mais rápido que isto.",
  figMus_speaker: "alto-falante",
  figMus_vacuumLabel: "vácuo: nada para empurrar",
  figMus_eardrum: "tímpano",
  figMus_crowded: "+ apertado",
  figMus_normal: "normal",
  figMus_sparse: "− espaçado",
  figMus_pressure: "pressão",

  // ── WaveFigure ──
  figMus_waveTitle: "Um tom puro: a pressão no seu ouvido ao longo do tempo",
  figMus_win10: "janela de 10 ms",
  figMus_win4: "4 períodos",
  figMus_freq: "frequência f",
  figMus_amp: "amplitude A",
  figMus_try: "teste:",
  figMus_cycles: "ciclos em 10 ms",
  figMus_waveNote: "Aperte ouvir e varra a frequência. Comece com o volume baixo: tons agudos soam mais fortes do que parecem. Abaixo de uns 60 Hz, alto-falantes de notebook e de celular quase não movem o ar, então você pode ver uma onda que não consegue ouvir. O topo da audição cai com a idade: a maioria dos adultos deixa de ouvir em algum ponto entre 14 e 17 kHz.",
  figMus_pAxis: "pressão (acima / abaixo do normal)",
  figMus_stop: "parar",
  figMus_listen: "ouvir",

  // ── LadderFigure ──
  figMus_ladderTitle: "Somar hertz contra multiplicar hertz",
  figMus_ladderAdd: "+110 Hz por degrau",
  figMus_ladderMul: "×2 por degrau",
  figMus_ladderPick: "toque a escada ou clique num ponto",
  figMus_rung: "degrau",
  figMus_fromPrev: "desde o degrau anterior",
  figMus_ladderNote: "Toque as duas escadas. A de +110 Hz tem espaços iguais em hertz, mas os seus passos soam cada vez menores: ×2, depois ×1,5, ×1,33, ×1,25, ×1,2. A de ×2 sai da régua de hertz, mas todo passo soa do mesmo tamanho: uma oitava. O seu ouvido mede razões.",
  figMus_rulerHz: "frequência em hertz: o que um medidor mede",
  figMus_rulerPitch: "altura: o que o seu ouvido ouve (toda oitava com a mesma largura)",
  figMus_playLadder: "tocar a escada",

  // ── OctaveFigure ──
  figMus_octTitle: "A mesma nota em quatro oitavas",
  figMus_octNote: "nota:",
  figMus_octEach: "cada uma ×2",
  figMus_octFigNote: "Toque subindo e depois juntas. Subindo, você ouve a mesma nota escalando. Juntas, as quatro se fundem num único som encorpado em vez de quatro separados. Olhe as linhas tracejadas: em cada uma delas, todas as ondas começam um novo ciclo no mesmo instante. Clique numa linha para ouvir uma nota sozinha.",
  figMus_octT1: "1 período da mais grave",
  figMus_octT2: "2 períodos",
  figMus_playUp: "tocar subindo",
  figMus_playTogether: "tocar juntas",

  // ── SemitoneFigure ──
  figMus_semiTitle: "Doze passos de A3 a A4",
  figMus_semiRatio: "razões iguais ×1,0595",
  figMus_semiDiff: "intervalos iguais +18,33 Hz",
  figMus_semiPick: "toque a sequência ou clique num passo",
  figMus_semiStep: "passo",
  figMus_semitones: "semitons",
  figMus_semiNote: "Toque as duas sequências. Com razões iguais, todo passo soa do mesmo tamanho, embora os intervalos em hertz cresçam de 13,1 para 24,7 Hz. Com intervalos iguais em hertz, os primeiros passos soam grandes demais e os últimos pequenos demais: as barras de baixo encolhem de 1,39 para 0,74 semitom.",
  figMus_semiHeard: "passo",
  figMus_semiHeard2: "ouvido",
  figMus_oneSemi: "1 semitom",
  figMus_playRun: "tocar as 13 notas",
};

export default text;
