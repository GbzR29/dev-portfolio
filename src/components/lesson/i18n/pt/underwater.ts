// PT text for the underwater widgets (figures/underwater). Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  figUnder_title: "Laboratório Subaquático",
  figUnder_camNote: "Abaixo de 0 a câmera está debaixo d'água. Suba-a acima da superfície para trocar para a visão do Laboratório de Água da mesma cena.",
  figUnder_below: "debaixo d'água",
  figUnder_above: "acima da água",
  figUnder_vis: "visibilidade",
  figUnder_hint: "arraste para olhar · role para dar zoom · a visibilidade é onde a cor mais limpa cai para 5% (3 / σt)",
  figUnder_n0: "Olhe para cima: o céu fica espremido num disco claro acima de você, a janela de Snell, e em volta dela a superfície é um espelho da água de baixo. Olhe para o lado: a água se dissolve na sua própria cor. Desligue os termos para ver o que cada um acrescenta.",
  figUnder_n1: "Verde: a luz do ar atravessa a superfície (amarelo onde o Fresnel já reflete boa parte dela). Vermelho: o raio encontra a superfície a mais de 48,6° da normal e é refletido por inteiro. As ondas inclinam a normal, então a borda da janela ondula.",
  figUnder_n2: "Só a luz que a água espalha em direção ao olho, sem as superfícies. As listras claras são as cáusticas vistas de lado: luz do sol concentrada pelas cristas, iluminando as partículas no caminho para baixo.",
  figUnder_n3: "A intensidade da cáustica no fundo: o inverso de quanto um feixe fino de luz do sol é esticado no caminho para baixo. O padrão é filtrado para o tamanho do pixel, então ao longe ele cai para a média em vez de cintilar.",
  figSnell_title: "A janela de Snell",
  figSnell_angle: "ângulo na água",
  figSnell_none: "nenhum (RIT)",
  figSnell_window: "a janela",
  figSnell_air: "ar  n = 1,000",
  figSnell_water: "água  n = 1,333",
  figSnell_off: "(o raio encontra a superfície fora do desenho)",
  figSnell_eye: "olho",
  figSnell_plot: "refletido (de baixo)",
  figSnell_note: "Os raios fracos são o céu, a cada 15° de horizonte a horizonte. A refração curva cada um em direção à vertical, então os 180° de céu chegam ao olho dentro de um cone de só 97°: um disco claro acima de você cujo diâmetro é 2,27 vezes a profundidade do olho. Um raio que encontra a superfície a mais que o ângulo crítico θc = arcsen(1/1,333) não consegue sair e é refletido por inteiro (reflexão interna total, RIT). Mesmo dentro da janela, a reflexão de Fresnel sobe rápido perto da borda.",
};

export default text;
