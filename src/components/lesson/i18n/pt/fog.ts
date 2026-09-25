// PT text for the fog widgets. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  figFogL_m0: "Sem neblina: a cena como a câmera a veria em ar perfeitamente limpo. Os morros distantes mantêm todo o contraste, e o olho os lê como recortes planos.",
  figFogL_m1: "Linear: a visibilidade cai em linha reta de 2 m até 1/densidade. É simples de dirigir artisticamente, mas tem um início e um fim duros, e nada físico por trás.",
  figFogL_m2: "Exponencial: um meio uniforme, visibilidade e^(−ρd). Cada metro remove a mesma fração de luz. Preenche todo o espaço, incluindo o ar acima da sua cabeça.",
  figFogL_m3: "Exp²: e^(−(ρd)²) mantém as coisas próximas nítidas e depois fecha rápido.",
  figFogL_m4: "Neblina de altura: a densidade ρ·e^(−(y−H)/s) é densa lá embaixo e afina para cima, então o céu fica limpo enquanto os vales se enchem. Sua integral ao longo de um raio tem forma fechada.",
  figFogL_m5: "Camada rasteira: densidade constante até a altura H, depois um topo exponencial suave de espessura s. Acima da camada o ar é limpo. Suba a câmera acima de H para vê-la por cima.",
  figFogL_m6: "Bruma: a camada rasteira com ruído 3D se movendo na densidade, que nenhuma forma fechada consegue integrar, então o shader marcha o raio por ela em 40 passos. O sol ilumina cada passo, atenuado pela neblina entre ele e o sol.",
  figFogL_title: "Laboratório de Neblina",
  figFogL_mode: "neblina",
  figWater_view: "visão",
  figFogL_hint: "arraste para olhar · as alturas são medidas a partir do fundo do vale",
};

export default text;
