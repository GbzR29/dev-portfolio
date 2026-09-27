// PT chapter titles and section names for the algorithms track (see algorithms/index.tsx).

const track = {
  titles: {
    memory: "Memória, arrays e ponteiros",
    complexity: "Contando passos: Big-O",
    recursion: "Recursão e a pilha de chamadas",
    searching: "Busca linear e busca binária",
    "elementary-sorts": "Ordenações elementares",
    "merge-sort": "Merge sort",
    quicksort: "Quicksort",
    "linear-sorts": "Além das comparações: ordenações lineares",
    "dynamic-array": "Arrays dinâmicos",
    "linked-list": "Listas encadeadas",
    stacks: "Pilhas",
    queues: "Filas e deques",
    "hash-table": "Tabelas hash",
    trees: "Árvores e percursos",
    bst: "Árvores binárias de busca",
    "balanced-trees": "Árvores balanceadas: AVL e rubro-negra",
    heaps: "Heaps e filas de prioridade",
    tries: "Tries",
    greedy: "Algoritmos gulosos",
    "dynamic-programming": "Programação dinâmica",
    graphs: "Grafos e suas representações",
    "graph-traversal": "Busca em largura e em profundidade",
    "shortest-paths": "Caminhos mínimos",
    mst: "Árvores geradoras mínimas e union-find",
  } as Record<string, string>,
  sections: {
    Foundations: "Fundamentos",
    "Searching & Sorting": "Busca e ordenação",
    "Linear Structures": "Estruturas lineares",
    Trees: "Árvores",
    "Algorithm Design": "Projeto de algoritmos",
    Graphs: "Grafos",
  } as Record<string, string>,
};

export default track;
