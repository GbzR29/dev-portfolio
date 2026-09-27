// PT text for the water widgets. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  figShore_title: "Laboratório de Praia e Chuva",
  figWater_real: "realista",
  figWater_toon: "estilizado",
  figWater_view: "visão",
  figShore_hint: "arraste para girar · role para se aproximar",
  figWater_title: "Laboratório de Água",
  figWater_terms: "termos",
  figWater_quality: "qualidade",
  figWater_hint: "arraste para olhar · role para dar zoom · os presets lagoa e estilizado têm uma praia à direita (+X)",
  figWater_n0: "Uma malha de anéis ao redor da câmera, movida pelas ondas no vertex shader. Cada pixel mistura o que a superfície reflete e o que ela deixa passar, na proporção de Fresnel. Desligue termos para ver o que cada um acrescenta.",
  figWater_n1: "A normal exata a partir das tangentes de Gerstner, mais pequenas ondulações que só existem na normal. As cores são os componentes x, y, z da normal mapeados em vermelho, verde e azul.",
  figWater_n2: "J mede quanto um pedaço da superfície calma é esticado (J > 1, branco) ou comprimido (J < 1, cinza) pelo movimento horizontal de Gerstner. Vermelho: J < 0, a superfície dobrou sobre si mesma. É ali que as ondas quebram, então é ali que vai a espuma.",
  figWater_n3: "O comprimento de água que o raio refratado atravessa antes de chegar ao fundo. Beer–Lambert transforma isso em cor: quanto maior o caminho, mais vermelho e verde são absorvidos.",
  figWater_n4: "A luz do sol atravessando uma superfície curva converge sob as cristas e se espalha sob os vales. O brilho é o inverso de quanto a área de um feixe pequeno muda na descida, um determinante do Jacobiano do mapa de refração.",
  figWater_n5: "O Fresnel de Schlick para a água: só 2% de reflexão olhando reto para baixo, subindo até 100% em ângulos rasantes. Por isso o mar distante é um espelho do céu e a água aos seus pés é transparente.",
};

export default text;
