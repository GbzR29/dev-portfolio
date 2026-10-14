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
    description: {
      en: "Closes the block opened by glBegin; the vertices sent in between are assembled into the primitives glBegin asked for. Inside the block only vertex calls were allowed (glVertex, glColor, glNormal, glTexCoord); anything else was an error. Modern code replaces the whole block with one glDrawArrays over a vertex buffer.",
      pt: "Fecha o bloco aberto por glBegin; os vértices enviados no meio são montados nas primitivas que glBegin pediu. Dentro do bloco só eram permitidas chamadas de vértice (glVertex, glColor, glNormal, glTexCoord); qualquer outra coisa era erro. Código moderno troca o bloco inteiro por um glDrawArrays sobre um vertex buffer.",
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
  {
    name: "glVertex2f",
    category: "legacy",
    since: "GL 1.0",
    deprecated: DEPRECATED,
    signature: "void glVertex2f(GLfloat x, GLfloat y);",
    summary: {
      en: "glVertex3f for 2D: emits a vertex at (x, y) with z = 0.",
      pt: "glVertex3f em 2D: emite um vértice em (x, y) com z = 0.",
    },
    description: {
      en: "The suffix tells the shape of the arguments, a naming scheme modern OpenGL kept: 2f = two floats, 3f = three floats, 3fv = a pointer to three floats. glUniform2f follows the same rule.",
      pt: "O sufixo diz a forma dos argumentos, um padrão de nomes que o OpenGL moderno manteve: 2f = dois floats, 3f = três floats, 3fv = um ponteiro para três floats. glUniform2f segue a mesma regra.",
    },
    params: [
      { name: "x", type: "GLfloat", desc: { en: "X coordinate.", pt: "Coordenada X." } },
      { name: "y", type: "GLfloat", desc: { en: "Y coordinate.", pt: "Coordenada Y." } },
    ],
    example: `glBegin(GL_TRIANGLES);
    glVertex2f(-0.5f, -0.5f);
    glVertex2f( 0.5f, -0.5f);
    glVertex2f( 0.0f,  0.5f);
glEnd();`,
    related: ["glVertex3f", "glBegin", "glUniform2f"],
  },
  {
    name: "glEnableClientState",
    category: "legacy",
    since: "GL 1.1",
    deprecated: DEPRECATED,
    signature: "void glEnableClientState(GLenum cap);",
    summary: {
      en: "Turned on one of the fixed vertex arrays (positions, colours, normals…) of old OpenGL.",
      pt: "Ligava um dos vertex arrays fixos (posições, cores, normais…) do OpenGL antigo.",
    },
    description: {
      en: "Between immediate mode and modern attributes, OpenGL 1.1 had vertex arrays with fixed roles: GL_VERTEX_ARRAY, GL_COLOR_ARRAY, GL_NORMAL_ARRAY, GL_TEXTURE_COORD_ARRAY. Each was turned on with this call and described with glVertexPointer, glColorPointer and so on. Today every attribute is generic: glEnableVertexAttribArray(location) plus glVertexAttribPointer, and the shader decides what each one means.",
      pt: "Entre o immediate mode e os atributos modernos, o OpenGL 1.1 tinha vertex arrays com papéis fixos: GL_VERTEX_ARRAY, GL_COLOR_ARRAY, GL_NORMAL_ARRAY, GL_TEXTURE_COORD_ARRAY. Cada um era ligado com esta chamada e descrito com glVertexPointer, glColorPointer e assim por diante. Hoje todo atributo é genérico: glEnableVertexAttribArray(location) mais glVertexAttribPointer, e o shader decide o que cada um significa.",
    },
    params: [
      { name: "cap", type: "GLenum", desc: { en: "GL_VERTEX_ARRAY, GL_COLOR_ARRAY, GL_NORMAL_ARRAY or GL_TEXTURE_COORD_ARRAY.", pt: "GL_VERTEX_ARRAY, GL_COLOR_ARRAY, GL_NORMAL_ARRAY ou GL_TEXTURE_COORD_ARRAY." } },
    ],
    example: `glEnableClientState(GL_VERTEX_ARRAY);
glVertexPointer(3, GL_FLOAT, 0, positions);
glDrawArrays(GL_TRIANGLES, 0, 3);`,
    related: ["glVertexPointer", "glEnableVertexAttribArray", "glVertexAttribPointer"],
  },
  {
    name: "glVertexPointer",
    category: "legacy",
    since: "GL 1.1",
    deprecated: DEPRECATED,
    signature: "void glVertexPointer(GLint size, GLenum type, GLsizei stride, const void *pointer);",
    summary: {
      en: "Described the fixed position array of old OpenGL; the ancestor of glVertexAttribPointer.",
      pt: "Descrevia o array fixo de posições do OpenGL antigo; o ancestral de glVertexAttribPointer.",
    },
    description: {
      en: "The parameters are almost the same as glVertexAttribPointer's (size, type, stride, pointer), minus the location: there was only one position array. Often pointer was CPU memory, copied to the GPU on every draw, which is exactly the cost VBOs removed.",
      pt: "Os parâmetros são quase os mesmos de glVertexAttribPointer (size, type, stride, pointer), sem a location: só havia um array de posições. Muitas vezes pointer era memória da CPU, copiada para a GPU a cada desenho, que é justamente o custo que os VBOs eliminaram.",
    },
    params: [
      { name: "size", type: "GLint", desc: { en: "Coordinates per vertex: 2, 3 or 4.", pt: "Coordenadas por vértice: 2, 3 ou 4." } },
      { name: "type", type: "GLenum", desc: { en: "GL_FLOAT, GL_DOUBLE, GL_INT or GL_SHORT.", pt: "GL_FLOAT, GL_DOUBLE, GL_INT ou GL_SHORT." } },
      { name: "stride", type: "GLsizei", desc: { en: "Bytes between vertices, 0 = packed.", pt: "Bytes entre vértices, 0 = colados." } },
      { name: "pointer", type: "const void *", desc: { en: "CPU array, or an offset into a bound buffer.", pt: "Array na CPU, ou um offset num buffer ligado." } },
    ],
    example: `glVertexPointer(3, GL_FLOAT, 0, positions);`,
    related: ["glEnableClientState", "glVertexAttribPointer"],
  },
  {
    name: "glMatrixMode",
    category: "legacy",
    since: "GL 1.0",
    deprecated: DEPRECATED,
    signature: "void glMatrixMode(GLenum mode);",
    summary: {
      en: "Chose which built-in matrix stack (model-view or projection) the old matrix calls changed.",
      pt: "Escolhia qual pilha de matrizes embutida (model-view ou projeção) as chamadas antigas de matriz alteravam.",
    },
    description: {
      en: "Old OpenGL kept the matrices itself. glMatrixMode(GL_PROJECTION) then glFrustum or glOrtho set the camera lens; glMatrixMode(GL_MODELVIEW) then glTranslatef, glRotatef and glScalef moved objects. Modern OpenGL has none of this: you build the matrices yourself (usually with GLM) and send them to the shader with glUniformMatrix4fv, where gl_Position = projection * view * model * position.",
      pt: "O OpenGL antigo guardava as matrizes ele mesmo. glMatrixMode(GL_PROJECTION) e depois glFrustum ou glOrtho definiam a lente da câmera; glMatrixMode(GL_MODELVIEW) e depois glTranslatef, glRotatef e glScalef moviam os objetos. O OpenGL moderno não tem nada disso: você monta as matrizes (normalmente com GLM) e as envia ao shader com glUniformMatrix4fv, onde gl_Position = projection * view * model * position.",
    },
    params: [
      { name: "mode", type: "GLenum", desc: { en: "GL_MODELVIEW, GL_PROJECTION or GL_TEXTURE.", pt: "GL_MODELVIEW, GL_PROJECTION ou GL_TEXTURE." } },
    ],
    example: `// Legacy
glMatrixMode(GL_MODELVIEW);
glLoadIdentity();
glTranslatef(0.0f, 0.0f, -5.0f);
glRotatef(angle, 0.0f, 1.0f, 0.0f);`,
    related: ["glUniformMatrix4fv", "glBegin"],
  },
];
