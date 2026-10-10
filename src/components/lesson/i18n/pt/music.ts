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

  // ── HarmonicSeriesFigure ──
  figMus_hsTitle: "A série harmônica numa corda",
  figMus_hsHarm: "harmônico",
  figMus_hsPick: "clique numa linha, suba a série ou toque as oito juntas",
  figMus_hsNote: "Cada linha é um jeito de a corda vibrar, milhares de vezes mais devagar. Os pontos são os nós, pontos que nunca se mexem. O modo n encaixa n meias-ondas, então vibra n vezes mais rápido: 110, 220, 330… Hz. Suba a série e você ouve um toque de corneta; toque as oito juntas e elas se fundem numa nota só, A2. A coluna ¢ é a distância até a tecla do piano mais próxima, em cents (capítulo 2).",
  figMus_hsClimb: "subir a série",
  figMus_hsAll: "as oito juntas",

  // ── HarmonicBuilderFigure ──
  figMus_hbTitle: "Monte um timbre com harmônicos",
  figMus_hbRecipes: "receitas:",
  figMus_hb_sine: "senoide",
  figMus_hb_square: "quadrada",
  figMus_hb_saw: "dente-de-serra",
  figMus_hb_tri: "triangular",
  figMus_hb_nofund: "sem fundamental",
  figMus_hbClear: "zerar",
  figMus_hbShuffle: "embaralhar fases",
  figMus_hbAlign: "alinhar as fases de novo",
  figMus_hbOn: "harmônicos ligados",
  figMus_hbRepeats: "repete",
  figMus_hbTimes: "vezes por segundo",
  figMus_hbNoteMouse: "Arraste as barras para cima e para baixo.",
  figMus_hbNoteTouch: "Deslize o dedo para cima e para baixo nas barras.",
  figMus_hbNote: "Aperte ouvir e troque de receita: mesma altura, cor diferente. Teste \"embaralhar fases\": a onda muda completamente de formato, mas soa quase igual. Teste \"sem fundamental\": a barra de 220 Hz sumiu, mas a onda ainda se repete 220 vezes por segundo e você ainda ouve A3.",
  figMus_hbBars: "amplitude de cada harmônico (arraste)",
  figMus_hbWave: "a soma: pressão ao longo de dois períodos (2 × 4,55 ms)",

  // ── SpectrumFigure ──
  figMus_spTitle: "Espectro ao vivo: os harmônicos dentro de uma nota",
  figMus_spPress: "segure uma tecla e veja os picos",
  figMus_spLines: "linhas tracejadas em",
  figMus_spNoteMouse: "Segure uma tecla (clique, ou as teclas A S D F… depois de um clique).",
  figMus_spNoteTouch: "Segure uma tecla.",
  figMus_spNote: "Todo pico cai numa linha tracejada: o som é feito de múltiplos inteiros de f. Compare o piano com a onda quadrada (só as linhas ímpares) e com a senoide (um pico só). Toque uma tecla mais aguda e as linhas se afastam, porque ficam a f de distância umas das outras.",
  figMus_spAxis: "dB abaixo da frequência mais forte",
  figMus_spAria: "teclado de piano, de C3 a C5",
};

export default text;
