// PT text for src/lib/tracks/glsl/chapters/sdf.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  glsl04_intro: "Uma Signed Distance Function (SDF) é uma função que retorna a distância de um ponto até a superfície mais próxima de uma forma. Valores negativos estão dentro da forma, positivos estão fora, e zero é exatamente na borda.",
  glsl04_conceptTitle: "O conceito",
  glsl04_conceptBody: "Para renderizar uma forma: amostre a SDF na posição UV atual. Se o resultado for negativo (dentro), produza a cor da forma. Use smoothstep para anti-aliasing da transição de borda.",
  glsl04_circleTitle: "SDF: Círculo",
  glsl04_circleBody: "A SDF mais simples. A distância de um ponto a um círculo de raio r centralizado na origem é simplesmente length(p) - r.",
  glsl04_boxTitle: "SDF: Retângulo",
  glsl04_boxBody: "A SDF exata de caixa usa operações por componente. b é o meio-tamanho da caixa, então b de (0.3, 0.2) faz uma caixa de 0.6 de largura e 0.4 de altura.",
  glsl04_combineTitle: "Combinando formas",
  glsl04_combineBody: "Como as SDFs retornam distâncias, você pode combiná-las com matemática simples — sem API especial necessária.",
  glsl04_combineWarn: "A união suave (smin) mescla duas formas suavemente em sua fronteira. O parâmetro k controla o raio de mesclagem. É assim que blobs orgânicos e metaballs são feitos.",
  glsl04_exploreTitle: "Explorando campos de distância",
  glsl04_exploreBody: "O shader abaixo pinta o próprio campo de distância: laranja por fora, azul por dentro, uma faixa a cada 0,04 unidade e branco na superfície. Clique e arraste para posicionar uma sonda. O círculo amarelo tem raio |d|, o maior círculo em volta do ponto que não toca nenhuma superfície. Esse círculo é o que torna os SDFs tão úteis: antisserrilhamento, contornos, brilhos, sombras e raymarching, todos o leem.",
  glsl04_opsLabel: "Operações sobre uma distância",
  glsl04_wD: "a distância com sinal de uma forma",
  glsl04_wRW: "um raio de arredondamento, a meia espessura de uma casca",
  glsl04_opsNote: "O arredondamento e a casca (onion) são exatos para qualquer SDF exato. A união com min é exata fora das duas formas, mas só um limite dentro delas. Interseção e subtração dão limites, ainda seguros para o raymarching, não distâncias exatas.",
  glsl04_sminLabel: "Mínimo suave (polinomial)",
  glsl04_wK: "raio de mistura: a que distância as formas começam a se fundir",
  glsl04_sminNote: "Onde as duas distâncias diferem em mais que k, h é 0 ou 1 e smin devolve o min simples. Dentro dessa faixa, ele subtrai uma pequena quantidade parabólica, que preenche o vinco entre as formas. O resultado são junções orgânicas, arredondadas, a cara de todo personagem esculpido com SDFs.",
  glsl04_aaTip: "fwidth(d) é a variação de d ao longo de um pixel, então smoothstep(-w, w, d) com w = fwidth(d) dá uma borda de exatamente um pixel de largura em qualquer zoom, rotação ou resolução. Renderizadores de texto usam o mesmo truque com atlas de fontes em SDF (Valve, 2007), para que os glifos fiquem nítidos em qualquer tamanho a partir de uma única textura pequena.",
  glsl04_key0: "Um SDF devolve a distância com sinal: negativa dentro, zero na superfície, positiva fora.",
  glsl04_key1: "|d| é o raio do maior círculo vazio em volta do ponto.",
  glsl04_key2: "Arredonde com d − r, esvazie com |d| − w, combine com min/max, misture com smin.",
  glsl04_key3: "Antisserrilhe qualquer SDF com smoothstep(−w, w, d), w = fwidth(d).",
};

export default text;
