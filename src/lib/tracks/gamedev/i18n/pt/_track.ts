// PT chapter titles and section names for the gamedev track (see gamedev/index.tsx).

const track = {
  titles: {
    "game-loop": "O game loop e o passo de tempo fixo",
    easing: "Lerp, easing e tweening",
    springs: "Molas e tremor de tela",
    random: "Aleatoriedade, seeds e hashing",
    perlin: "Ruído de Perlin e terreno fractal",
    collision: "Formas de colisão e sobreposição",
    sat: "Teorema do eixo separador",
    "object-pool": "Object pools e handles",
  } as Record<string, string>,
  sections: {
    "Core Loop & Time": "Loop principal e tempo",
    "Motion & Game Feel": "Movimento e game feel",
    "Procedural Generation": "Geração procedural",
    "Collision Detection": "Detecção de colisão",
    "Architecture & Patterns": "Arquitetura e padrões",
  } as Record<string, string>,
};

export default track;
