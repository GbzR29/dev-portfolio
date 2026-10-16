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
  } as Record<string, string>,
  sections: {
    Foundations: "Fundamentos",
    "Classic Machine Learning": "Machine learning clássico",
    "Neural Networks": "Redes neurais",
    "Deep Learning": "Aprendizado profundo",
  } as Record<string, string>,
};

export default track;
