// PT text for the river widgets (figures/river). Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  // FlowPhasesFigure
  figFlowPh_title: "Levando uma textura pelo fluxo",
  figFlowPh_restart: "reiniciar o tempo",
  figFlowPh_arrows: "setas do fluxo",
  figFlowPh_water: "ondulações + espuma",
  figFlowPh_drift: "maior deriva",
  figFlowPh_noCycle: "sem ciclo: t cresce para sempre",
  figFlowPh_n0: "Cada ponto lê a textura em p − v·t. Onde o fluxo é uniforme, isso é uma rolagem simples, mas em volta da pedra pontos vizinhos andam com velocidades diferentes, e as suas coordenadas de textura se afastam para sempre: o padrão se desfaz em estrias cada vez mais finas. Aperte 'reiniciar o tempo' para ver como começou.",
  figFlowPh_n1: "Reiniciar a cada T segundos: p − v·fract(t/T)·T. O estiramento nunca passa de um ciclo, mas a cada reinício o padrão inteiro salta de volta.",
  figFlowPh_n2: "Duas cópias meio ciclo defasadas, cada uma apagada no seu próprio reinício: o gráfico mostra os seus pesos, que sempre somam 1. Os saltos somem. Com o deslocamento em 0 ainda se vê a imagem inteira pulsar em sincronia; aumente-o e cada ponto cicla no seu próprio momento.",

  // RiverLabFigure
  figRiver_title: "Laboratório do Rio",
  figRiver_view_rapids: "corredeiras",
  figRiver_view_lake: "lago",
  figRiver_view_aerial: "aérea",
  figRiver_paint: "pintar o fluxo",
  figRiver_reset: "restaurar o fluxo",
  figRiver_rocks: "pedras no fluxo",
  figRiver_method: "método",
  figRiver_rapids: "corredeiras",
  figRiver_lake: "lago",
  figRiver_n0: "Arraste para orbitar, arraste com o botão direito (ou com shift) para mover, role para aproximar. As ondulações e a espuma seguem o flow map: rápidas e agitadas nas corredeiras, rasgadas em esteiras brancas atrás das pedras, quase paradas no lago, onde o vale aparece na água.",
  figRiver_n1: "O flow map: a matiz é a direção, o brilho a velocidade. As corredeiras são claras; o lago, com doze vezes a seção transversal, é quase preto. Cada pedra divide a correnteza, mais rápida nos lados, com uma esteira lenta atrás.",
  figRiver_n2: "As coordenadas de textura em que as ondulações são lidas, como um tabuleiro: laranja para uma fase, azul para a outra. Mude o método para 'scroll' e veja os quadrados se esticarem sem fim onde o fluxo varia.",
  figRiver_n3: "Só a espuma: o flow map diz onde e quanto (esteiras, a água acumulada contra as pedras, água rápida), e a textura de espuma carregada dá a ela a forma de teia.",
  figRiver_paintHint: "arraste sobre a água: a correnteza vira para seguir o seu traço (pincel de 2,5 m, 1,6 m/s)",
};

export default text;
