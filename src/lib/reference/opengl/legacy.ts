// src/lib/reference/opengl/legacy.ts
import type { RefEntry } from "../types";

const DEPRECATED = {
  en: "Part of the legacy immediate mode, removed from the core profile in OpenGL 3.2. Shown here only so you can recognize it in old tutorials — use VBOs and VAOs instead.",
  pt: "Faz parte do antigo immediate mode, removido do core profile no OpenGL 3.2. Aparece aqui só para você reconhecê-lo em tutoriais antigos — use VBOs e VAOs.",
};

export const legacyEntries: RefEntry[] = [
  {
    name: "glBegin",
    category: "legacy",
    since: "GL 1.0",
    deprecated: DEPRECATED,
    signature: "void glBegin(GLenum mode);",
    summary: {
      en: "Starts sending vertices one by one from the CPU (immediate mode).",
      pt: "Começa a enviar vértices um por um a partir da CPU (immediate mode).",
    },
    description: {
      en: "In immediate mode, each vertex was a separate function call between glBegin and glEnd. For a mesh with a million vertices that is millions of calls from CPU to driver every frame — the bottleneck that buffers were invented to remove. In modern OpenGL the same data lives in a VBO on the GPU and one draw call renders it.",
      pt: "No immediate mode, cada vértice era uma chamada de função separada entre glBegin e glEnd. Para uma malha com um milhão de vértices são milhões de chamadas da CPU ao driver por frame — o gargalo que os buffers foram criados para eliminar. No OpenGL moderno os mesmos dados ficam em um VBO na GPU e um único draw renderiza tudo.",
    },
    params: [
      { name: "mode", type: "GLenum", desc: { en: "Primitive type: GL_TRIANGLES, GL_QUADS (also removed), GL_LINES…", pt: "Tipo de primitiva: GL_TRIANGLES, GL_QUADS (também removido), GL_LINES…" } },
    ],
    example: `// Legacy — does not work in a core profile context
glBegin(GL_TRIANGLES);
    glColor3f(1, 0, 0); glVertex3f(-0.5f, -0.5f, 0);
    glColor3f(0, 1, 0); glVertex3f( 0.5f, -0.5f, 0);
    glColor3f(0, 0, 1); glVertex3f( 0.0f,  0.5f, 0);
glEnd();`,
    related: ["glEnd", "glVertex3f", "glDrawArrays", "glBufferData"],
  },
  {
    name: "glEnd",
    category: "legacy",
    since: "GL 1.0",
    deprecated: DEPRECATED,
    signature: "void glEnd(void);",
    summary: {
      en: "Finishes a glBegin block and draws the vertices sent inside it.",
      pt: "Encerra um bloco glBegin e desenha os vértices enviados dentro dele.",
    },
    params: [],
    example: `glBegin(GL_LINES);
    glVertex3f(0, 0, 0);
    glVertex3f(1, 1, 0);
glEnd();`,
    related: ["glBegin"],
  },
  {
    name: "glVertex3f",
    category: "legacy",
    since: "GL 1.0",
    deprecated: DEPRECATED,
    signature: "void glVertex3f(GLfloat x, GLfloat y, GLfloat z);",
    summary: {
      en: "Emits one vertex position inside a glBegin/glEnd block.",
      pt: "Emite a posição de um vértice dentro de um bloco glBegin/glEnd.",
    },
    description: {
      en: "The vertex takes whatever color, normal and texture coordinate were set last. Today the positions go into a vertex buffer and are described with glVertexAttribPointer.",
      pt: "O vértice usa a última cor, normal e coordenada de textura definidas. Hoje as posições vão para um vertex buffer e são descritas com glVertexAttribPointer.",
    },
    params: [
      { name: "x", type: "GLfloat", desc: { en: "X coordinate.", pt: "Coordenada X." } },
      { name: "y", type: "GLfloat", desc: { en: "Y coordinate.", pt: "Coordenada Y." } },
      { name: "z", type: "GLfloat", desc: { en: "Z coordinate.", pt: "Coordenada Z." } },
    ],
    example: `glVertex3f(0.0f, 0.5f, 0.0f);`,
    related: ["glBegin", "glColor3f", "glVertexAttribPointer"],
  },
  {
    name: "glColor3f",
    category: "legacy",
    since: "GL 1.0",
    deprecated: DEPRECATED,
    signature: "void glColor3f(GLfloat red, GLfloat green, GLfloat blue);",
    summary: {
      en: "Sets the current color used by the following glVertex calls.",
      pt: "Define a cor atual usada pelas próximas chamadas de glVertex.",
    },
    description: {
      en: "In modern OpenGL, per-vertex color is just another vertex attribute in your buffer, and a constant color is a uniform (glUniform4f).",
      pt: "No OpenGL moderno, a cor por vértice é só mais um atributo de vértice no seu buffer, e uma cor constante é um uniform (glUniform4f).",
    },
    params: [
      { name: "red", type: "GLfloat", desc: { en: "Red, 0–1.", pt: "Vermelho, 0–1." } },
      { name: "green", type: "GLfloat", desc: { en: "Green, 0–1.", pt: "Verde, 0–1." } },
      { name: "blue", type: "GLfloat", desc: { en: "Blue, 0–1.", pt: "Azul, 0–1." } },
    ],
    example: `glColor3f(1.0f, 0.5f, 0.2f);`,
    related: ["glVertex3f", "glUniform4f"],
  },
];
