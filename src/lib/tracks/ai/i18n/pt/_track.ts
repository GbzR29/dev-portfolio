// PT chapter titles and section names for the ai track (see ai/index.tsx).

const track = {
  titles: {
    "what-is-ai": "O que é IA? Aprender com dados",
    data: "Dados, atributos e vetores",
    "linear-regression": "Regressão linear",
    "gradient-descent": "Descida do gradiente",
    "logistic-regression": "Regressão logística e classificação",
    generalisation: "Generalização: overfitting, validação e métricas",
    "k-nearest-neighbours": "k-vizinhos mais próximos",
    "decision-trees": "Árvores de decisão",
    "k-means": "Agrupamento k-means",
    perceptron: "O perceptron",
    mlp: "Perceptrons multicamadas",
    backpropagation: "Retropropagação (backpropagation)",
    training: "Treinamento: inicialização e otimizadores",
    regularisation: "Regularização: weight decay, dropout e parada antecipada",
    cnn: "Redes neurais convolucionais",
    embeddings: "Embeddings: palavras como vetores",
    rnn: "Redes neurais recorrentes e LSTMs",
    attention: "Atenção",
    transformers: "Transformers e grandes modelos de linguagem",
    "game-search": "Busca em jogos: minimax e alfa-beta",
    mcts: "Busca em árvore Monte Carlo",
    "bandits-mdps": "Bandits e processos de decisão de Markov",
    "q-learning": "Q-learning e aprendizado por reforço profundo",
    "game-ai": "IA em jogos: máquinas de estados, árvores de comportamento e steering",
  } as Record<string, string>,
  sections: {
    Foundations: "Fundamentos",
    "Classic Machine Learning": "Machine learning clássico",
    "Neural Networks": "Redes neurais",
    "Deep Learning": "Aprendizado profundo",
    "Reinforcement Learning & Game AI": "Aprendizado por reforço e IA para jogos",
  } as Record<string, string>,
};

export default track;
