// PT text for src/lib/tracks/opengl/chapters/models.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  oglModel_intro: "Todo array de vértices até aqui foi digitado à mão. Assets de verdade saem do Blender ou do Maya como OBJ, FBX ou glTF, e escrever um parser para cada um não é um bom uso do seu tempo. O Assimp lê cerca de quarenta formatos e devolve todos numa única estrutura de dados uniforme, que é o único motivo de alguém tolerar o formato FBX.",
  oglModel_structTitle: "Como o Assimp estrutura um arquivo",
  oglModel_structBody: "Um aiScene é a raiz. Ele possui um array plano de malhas e um array plano de materiais, mais uma árvore de nós. Cada nó carrega uma transformação e uma lista de índices no array de malhas — então uma malha é guardada uma vez e pode ser instanciada por vários nós. Você percorre a árvore para preservar a hierarquia que o artista construiu.",
  oglModel_h0: "Tipo do Assimp",
  oglModel_h1: "Contém",
  oglModel_s1: "A raiz. mMeshes, mMaterials e mRootNode.",
  oglModel_s2: "Uma transformação, índices em mMeshes e nós filhos.",
  oglModel_s3: "Posições, normais, até 8 conjuntos de UV, tangentes, faces, um índice de material.",
  oglModel_s4: "Os índices de uma primitiva. Com aiProcess_Triangulate, sempre três.",
  oglModel_s5: "Caminhos de textura por tipo semântico, mais propriedades escalares.",
  oglModel_importTitle: "Importando",
  oglModel_lifetimeWarn: "O aiScene pertence ao Importer. Quando o Importer sai de escopo, a cena inteira é liberada, inclusive todo ponteiro que você guardou para dentro dela. Copie o que precisar para as suas próprias estruturas antes de o Importer morrer — esse é, disparado, o crash mais comum com o Assimp.",
  oglModel_flipTip: "Se as suas texturas saem de cabeça para baixo, aiProcess_FlipUVs é a chave. Se você também chamou stbi_set_flip_vertically_on_load(true), inverteu duas vezes e voltou ao ponto de partida — escolha exatamente uma.",
  oglModel_meshTitle: "Uma Mesh que é dona dos seus buffers na GPU",
  oglModel_offsetofNote: "offsetof mais sizeof(Vertex) como stride é todo o truque por trás dos atributos intercalados: você descreve o layout da struct ao OpenGL uma vez e nunca calcula um deslocamento em bytes à mão. Acrescente um campo a Vertex e todos os deslocamentos se atualizam sozinhos.",
  oglModel_walkTitle: "Percorrendo a árvore de nós",
  oglModel_nullWarn: "Proteja todo canal opcional. mTextureCoords[0] é nulo num modelo sem UVs, mNormals é nulo quando o exportador as omitiu, e as tangentes só existem se você pediu aiProcess_CalcTangentSpace. Desreferenciá-los sem verificar funciona no modelo com que você testou e quebra no próximo.",
  oglModel_cacheTitle: "Fazendo cache das texturas",
  oglModel_cacheBody: "Um modelo com trinta malhas muitas vezes compartilha um único atlas entre todas. Sem cache, você decodifica e envia o mesmo PNG trinta vezes, o que transforma um carregamento rápido num lento e desperdiça trinta vezes a VRAM. Use o caminho do arquivo como chave do cache.",
  oglModel_formatTip: "Prefira glTF 2.0 em trabalhos novos. É o único formato popular com uma especificação precisa, guarda parâmetros de material PBR nativamente, e a sua variante binária carrega sem nenhum parsing de texto. OBJ não tem esqueleto nem PBR; FBX é proprietário, e cada exportador discorda sobre unidades e orientação dos eixos.",
};

export default text;
