// PT text for the black-hole widgets (figures/blackhole). Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  // RayPathsFigure
  figBhRays_title: "Caminhos da luz perto de um buraco negro",
  figBhRays_captured: "cai",
  figBhRays_escaped: "escapa",
  figBhRays_orbiting: "ainda circulando",
  figBhRays_b: "impacto b",
  figBhRays_compare: "caminho de Newton também",
  figBhRays_defl: "deflexão",
  figBhRays_weak: "campo fraco",
  figBhRays_ps: "esfera de fótons",
  figBhRays_horizon: "horizonte rₛ",
  figBhRays_note: "Arraste o início do raio laranja para cima e para baixo. Longe do buraco, a curvatura bate com 2rₛ/b, o dobro do que a gravidade de Newton dá a uma partícula a velocidade c. Dentro de b_c ≈ 2,598 rₛ todo raio cai, e é por isso que a sombra é 2,6 vezes mais larga que o horizonte. Logo fora de b_c um raio se enrola em volta da esfera de fótons (tracejada, r = 1,5 rₛ) antes de sair, em qualquer direção.",

  // DopplerFigure
  figBhDop_title: "Beaming Doppler em volta de um anel",
  figBhDop_r: "raio do anel r",
  figBhDop_incl: "inclinação i",
  figBhDop_temp: "temperatura T",
  figBhDop_speed: "velocidade orbital",
  figBhDop_clock: "ritmo do relógio",
  figBhDop_ratio: "lado claro sobre lado escuro",
  figBhDop_obs: "para o observador",
  figBhDop_app: "aproximando",
  figBhDop_rec: "afastando",
  figBhDop_rest: "em repouso",
  figBhDop_note: "O gás da esquerda vem em direção ao observador e chega desviado para o azul e mais claro; o gás da direita se afasta, mais vermelho e mais escuro. Na borda interna, 3 rₛ, o gás anda a metade da velocidade da luz e o lado claro ofusca muitas vezes o escuro. De frente (i = 0) a órbita se move na transversal à linha de visada e só resta o relógio mais lento: o anel inteiro fica igualmente avermelhado. A última linha sob cada amostra é o seu brilho visível comparado com gás em repouso longe do buraco.",

  // BlackHoleLabFigure
  figBh_title: "Laboratório do buraco negro",
  figBh_reset: "reiniciar",
  figBh_bending: "curvatura",
  figBh_disk: "disco",
  figBh_grav: "redshift gravitacional",
  figBh_stars: "estrelas",
  figBh_grid: "grade do céu",
  figBh_shadow: "sombra",
  figBh_speed: "gás na borda interna",
  figBh_n0: "Arraste para orbitar, role ou faça pinça para dar zoom. A corcova sobre a sombra é o lado de trás do disco, com a sua luz curvada por cima do buraco; a borda fina e brilhante colada à sombra é luz que deu meia volta. Um lado do disco é mais claro e mais azul: o gás ali vem na sua direção.",
  figBh_n1: "Quantas vezes o caminho já tinha encontrado o disco quando recolheu esta luz. Laranja: a primeira vez, o que inclui o arco sobre a sombra, a face de cima do lado de trás vista com a luz curvada por cima do buraco. Verde-azulado: a segunda vez, luz que atravessou o gás uma vez e o encontrou de novo, como a face de baixo do lado de trás vista sob a sombra através do lado da frente. Magenta: três vezes ou mais.",
  figBh_n2: "A razão de frequências g = ν vista / ν emitida: azul onde a luz chega com mais energia do que saiu (g > 1), vermelho onde perdeu energia. Desligue o Doppler para ver só a gravidade, que avermelha o disco interno por igual.",
  figBh_n3: "Quantos passos de RK4 cada raio levou (branco = o limite de 400). Raios que raspam a esfera de fótons a circulam e levam mais; o passo cresce com r, então raios distantes são baratos.",
};

export default text;
