// PT text for src/lib/tracks/math/chapters/unit-circle.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  mTrig_radTitle: "Graus e radianos",
  mTrig_radBody: "Graus dividem uma volta completa em 360 partes, um número de que os babilônios gostavam porque ele se divide certinho por muitos outros. Radianos medem um ângulo pelo arco que ele recorta de um círculo: o comprimento do arco dividido pelo raio. Num círculo de raio 1, um ângulo de θ radianos recorta um arco de comprimento exatamente θ. Uma volta completa é o perímetro inteiro, 2π ≈ 6,283 radianos. Toda função trigonométrica em C++, GLSL e qualquer outra linguagem de programação recebe radianos, e os radianos deixam o cálculo de seno e cosseno limpo (para ângulos pequenos, sen θ ≈ θ só vale em radianos).",
  mTrig_eqRad: "Radianos",
  mTrig_wTheta: "o ângulo em radianos",
  mTrig_wS: "o comprimento do arco entre os dois lados do ângulo",
  mTrig_wRho: "o raio do círculo. Como s cresce proporcionalmente a ρ, a razão não depende do tamanho do círculo",
  mTrig_eqRadNote: "Valores úteis: 90° = π/2, 180° = π, 360° = 2π, 1 rad ≈ 57,3°. Mantenha os ângulos em radianos dentro do código e converta só nas bordas (interface, arquivos de fase).",
  mTrig_unitTitle: "O círculo unitário",
  mTrig_unitBody: "Triângulos só dão ângulos até 90°. O círculo unitário estende as definições para todo ângulo. Coloque um círculo de raio 1 na origem e ande no sentido anti-horário a partir do ponto (1, 0) por um ângulo θ. O ponto a que você chega tem coordenadas (cos θ, sen θ). Para ângulos abaixo de 90°, isso é a definição do triângulo com hip = 1; para ângulos maiores ou negativos, simplesmente continua a volta no círculo, com sinais que seguem o quadrante.",
  mTrig_dirBody: "O uso mais comum em jogos sai direto daí: uma direção no ângulo θ é o vetor (cos θ, sen θ), de comprimento 1. Um sprite virado para 30° se move ao longo de (cos 30°, sen 30°) · velocidade. Os pontos de um círculo de raio R em volta de um centro c são c + R(cos θ, sen θ), que é como você posiciona inimigos em anel, desenha um círculo com segmentos de reta ou faz uma lua orbitar.",
};

export default text;
