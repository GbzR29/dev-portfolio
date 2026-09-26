// PT text for src/lib/tracks/math/chapters/polar.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  mTrig_polarTitle: "Das coordenadas de volta aos ângulos: atan2",
  mTrig_polarBody: "A pergunta inversa é pelo menos tão comum: o mouse está em (x, y) em relação à torreta; para que ângulo ela deve apontar? As funções inversas asin, acos e atan devolvem ângulos, mas cada uma cobre só metade do círculo. atan(y/x) é a armadilha clássica: y/x é igual para (1, 1) e (−1, −1), então não distingue direções opostas, e divide por zero para cima. atan2(y, x) recebe as duas coordenadas separadas, olha os seus sinais para descobrir o quadrante e devolve o ângulo completo em (−π, π].",
  mTrig_eqPolar: "Coordenadas polares",
  mTrig_wR: "a distância até a origem (o comprimento do vetor)",
  mTrig_wPolarTheta: "o ângulo a partir do eixo x positivo, via atan2; repare na ordem dos argumentos, y primeiro",
  mTrig_wrapWarn: "Ângulos dão a volta: 350° e −10° são a mesma direção, e a diferença entre 350° e 10° é 20°, não 340°. Sempre leve uma diferença para (−π, π] antes de usá-la para girar, interpolar ou comparar, senão os objetos giram pelo caminho mais longo.",
  mTrig_tSym: "Sintoma",
  mTrig_tCause: "Causa",
  mTrig_tFix: "Correção",
  mTrig_b2: "A torreta mira ao contrário de um dos lados",
  mTrig_c2: "atan(y/x) em vez de atan2(y, x)",
  mTrig_f2: "atan2, com y primeiro",
  mTrig_b3: "O objeto gira pelo caminho mais longo",
  mTrig_c3: "diferença de ângulos crua",
  mTrig_f3: "leve a diferença para (−π, π]",
  mTrig_b4: "NaN vindo de acos ou asin",
  mTrig_c4: "argumento um pouco fora de [−1, 1] depois do arredondamento",
  mTrig_f4: "limite o argumento antes",
};

export default text;
