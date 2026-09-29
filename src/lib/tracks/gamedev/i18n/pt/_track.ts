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
    integration: "Integradores: Euler, Verlet e RK4",
    "collision-response": "Resposta a colisão e impulsos",
    "rigid-body": "Corpos rígidos 2D: rotação e torque",
    platformer: "Game feel de plataforma: pulos, coyote time e buffer",
    "object-pool": "Object pools e handles",
  } as Record<string, string>,
  sections: {
    "Core Loop & Time": "Loop principal e tempo",
    "Motion & Game Feel": "Movimento e game feel",
    "Procedural Generation": "Geração procedural",
    "Collision Detection": "Detecção de colisão",
    Physics: "Física",
    "Architecture & Patterns": "Arquitetura e padrões",
  } as Record<string, string>,
};

export default track;
