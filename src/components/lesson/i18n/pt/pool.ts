// PT text for the pool widgets (figures/pool). Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  figPool_title: "Laboratório da Piscina",
  figPool_calm: "acalmar a água",
  figPool_dropBall: "soltar a bola",
  figPool_rain: "chuva",
  figPool_mosaic: "pastilhas",
  figPool_gravity: "gravidade",
  figPool_sub: "bola submersa",
  figPool_hint: "uma bola menos densa que a água (abaixo de 1×) flutua com essa fração de si submersa",
  figPool_n0: "Clique ou arraste na água para fazer ondas. Arraste a bola para levantá-la, afundá-la ou arremessá-la; solte e ela volta a flutuar. Arraste fora da piscina para girar a câmera, role para dar zoom. A rede clara no fundo e nas paredes é a luz do sol concentrada pelas ondas.",
  figPool_n1: "A altura simulada: vermelho acima do nível de repouso, azul abaixo. Veja um anel se espalhar, refletir nas paredes e interferir consigo mesmo. O controle de amortecimento define por quanto tempo ele vibra.",
  figPool_n2: "O mapa de cáusticas como a piscina o recebe: a malha da água projetada ao longo dos raios de sol refratados, cada triângulo tão claro quanto a sua área encolheu. A sombra da bola faz parte dele.",
  figString_title: "A regra de atualização, em uma dimensão",
  figString_c2: "C² = c²Δt²/Δx²",
  figString_damp: "amortecimento",
  figString_reset: "reiniciar",
  figString_unstable: "instável: C² > 1",
  figString_stable: "estável: C² ≤ 1",
  figString_speed: "velocidade",
  figString_cells: "células por passo",
  figString_note: "Clique na fileira para soltar um calombo. Cada calombo se divide em duas metades que se afastam a √C² células por passo e batem nas pontas. Passe C² de 1 e aparece um zigue-zague de uma célula de largura que cresce, seja qual for o amortecimento: cada passo agora passa do ponto mais que o anterior. Em 2D cada célula tem quatro vizinhos em vez de dois, e o limite é C² ≤ 0,5.",
  figString_blown: "explodiu: clique para recomeçar",
};

export default text;
