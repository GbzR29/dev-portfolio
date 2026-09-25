// PT text for src/lib/tracks/glsl/chapters/fragcoord.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  glsl03_intro: "O fragment shader tem acesso à posição do pixel na tela através de gl_FragCoord. Combinado com um uniform de resolução, isso dá a base para escrever efeitos que cobrem a tela inteira.",
  glsl03_fragcoordTitle: "gl_FragCoord",
  glsl03_fragcoordBody: "gl_FragCoord.xy dá a posição do pixel em coordenadas de janela, onde (0,0) é o canto inferior esquerdo. O componente z é o valor de profundidade em [0,1].",
  glsl03_uvVisTitle: "Vendo o UV, um fragmento por vez",
  glsl03_uvVisBody: "O widget abaixo roda um fragment shader de verdade. Reduza a resolução para poucos fragmentos e passe o mouse sobre eles: cada quadrado é uma chamada de main(), com seu próprio gl_FragCoord. Dividindo por uResolution você obtém o UV, e o shader transforma esse UV em cor. Troque os presets para ver centralização, repetição com fract(), coordenadas polares e tempo, ou edite o código direto.",
  glsl03_uvVisTip: "gl_FragCoord aponta para o centro do fragmento, então o do canto inferior esquerdo é (0.5, 0.5), não (0, 0). Ler o UV como cor (vermelho = u, verde = v) também é como se depura um shader: quando algo parece errado, jogue o valor suspeito na cor de saída e confira.",
  glsl03_centeredTitle: "Centralização e correção de proporção",
  glsl03_centeredBody: "Para a maioria dos efeitos você quer um sistema de coordenadas centralizado em [-1, +1]. A correção de proporção garante que círculos pareçam redondos independente das dimensões da janela.",
  glsl03_timeTitle: "Animando com tempo",
  glsl03_timeBody: "Passe um uniform float que aumenta a cada frame (normalmente em segundos). Combine com sin/cos para criar animações oscilantes em loop.",
  glsl03_patternTip: "O padrão uv = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y é o setup padrão do ShaderToy. Ele centraliza o sistema de coordenadas, corrige a proporção usando a altura e dá um intervalo de [-aspecto, aspecto] em X e [-1, 1] em Y.",
};

export default text;
