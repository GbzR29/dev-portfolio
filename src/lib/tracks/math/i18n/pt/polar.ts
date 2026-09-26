// PT text for src/lib/tracks/math/chapters/polar.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  mTrig_polarTitle: "Das coordenadas de volta aos ângulos: atan2",
  mTrig_polarBody: "A pergunta inversa é pelo menos tão comum: um barco está em (x, y) em relação ao porto; em que direção ele está? As funções inversas arcsen, arccos e arctg devolvem ângulos, mas cada uma cobre só metade do círculo. arctg(y/x) é a armadilha clássica: y/x é igual para (1, 1) e (−1, −1), então não distingue direções opostas, e divide por zero para cima. A solução é manter as duas coordenadas separadas e olhar os seus sinais para descobrir o quadrante. O ângulo completo que isso dá, em (−π, π], se escreve atan2(y, x), \"o arco tangente de dois argumentos\"; calculadoras e programas usam o mesmo nome.",
  mTrig_eqPolar: "Coordenadas polares",
  mTrig_wR: "a distância até a origem (o comprimento do vetor)",
  mTrig_wPolarTheta: "o ângulo a partir do eixo x positivo, via atan2; repare na ordem dos argumentos, y primeiro",
  mTrig_wrapWarn: "Ângulos dão a volta: 350° e −10° são a mesma direção, e a diferença entre 350° e 10° é 20°, não 340°. Sempre leve uma diferença para (−π, π] antes de usá-la para girar, interpolar ou comparar, senão o giro vai pelo caminho mais longo.",
  mTrig_tSym: "Sintoma",
  mTrig_tCause: "Causa",
  mTrig_tFix: "Correção",
  mTrig_c3: "diferença de ângulos crua",
  mTrig_f3: "leve a diferença para (−π, π]",
};

export default text;
