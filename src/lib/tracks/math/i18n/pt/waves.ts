// PT text for src/lib/tracks/math/chapters/waves.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  mTrig_waveTitle: "Ondas",
  mTrig_waveBody: "Desenrole o círculo unitário ao longo do tempo e a altura do ponto que gira traça uma senoide: o movimento de vaivém mais suave possível. Quatro números lhe dão forma, os mesmos quatro das transformações de função do capítulo de funções e gráficos: amplitude (quão longe), frequência (com que frequência), fase (em que ponto do ciclo começa) e deslocamento (em torno de qual valor).",
  mTrig_eqWave: "Uma senoide",
  mTrig_wA: "a amplitude: a onda vai de C − A a C + A",
  mTrig_wF: "a frequência em ciclos por segundo (Hz). O período, a duração de um ciclo, é T = 1/f",
  mTrig_wOmega: "a frequência angular ω, em radianos por segundo: converte segundos num ângulo para que um período seja uma volta completa",
  mTrig_wPhi: "a fase: uma vantagem inicial ao longo do ciclo, em radianos. Dar um φ diferente a cada objeto impede que uma fileira de moedas flutuantes se mova em sincronia",
  mTrig_wC: "o deslocamento: a linha central",
  mTrig_waveUses: "Os usos estão em todo lugar: um item flutuante balança com A = 0,1 m e f = 0,5 Hz, uma luz de alerta pulsa o brilho, um ciclo de dia e noite conduz a altura do sol com período de 20 minutos, superfícies de água somam várias senoides de direções e frequências diferentes (as ondas de Gerstner da trilha de GLSL), e um personagem parado respira escalando o peito. Somar senoides com frequências sem relação entre si dá um movimento que nunca se repete de forma visível, uma alternativa barata ao ruído.",
  mTrig_timeTip: "sin(tempo · ω) com um tempo em float que só cresce perde precisão depois de horas: em tempo = 100 000 s, o float tem resolução de cerca de 8 ms, e ondas rápidas engasgam. Em vez disso, dê a volta na fase: fase = fmod(fase + ω·dt, 2π).",
};

export default text;
