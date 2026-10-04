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
  } as Record<string, string>,
  sections: {
    Foundations: "Fundamentos",
    "Classic Machine Learning": "Machine learning clássico",
    "Neural Networks": "Redes neurais",
  } as Record<string, string>,
};

export default track;
