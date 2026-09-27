// ES text for src/lib/tracks/opengl/chapters/transformations.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch08_intro: "Todo lo dibujado hasta ahora está en coordenadas NDC fijas. Para mover, rotar y escalar objetos necesitas matrices. GLM es la librería header-only que espeja los tipos matemáticos de GLSL.",
  ch08_glmTitle: "Añadiendo GLM al proyecto",
  ch08_mvpTitle: "Las matrices MVP",
  ch08_mvpBody: "Cada vértice pasa por tres transformaciones. Cada una es una matriz 4×4 multiplicadas en orden inverso: gl_Position = Proyección × Vista × Modelo × vértice.",
  mvpHeader0: "Matriz",
  mvpHeader1: "Propósito",
  mvpHeader2: "Función GLM",
  mvpModel: "Coloca el objeto en el espacio mundo (translate/rotate/scale)",
  mvpView: "Simula una cámara — transforma al espacio de cámara",
  mvpProjection: "Aplica perspectiva — los objetos lejanos aparecen más pequeños",
  ch08_modelTitle: "Matriz Model — colocando objetos",
  ch08_modelBody: "Comienza con identidad y aplica transformaciones. Escala primero, luego rota, luego translada.",
  ch08_viewTitle: "Matriz View — cámara",
  ch08_viewBody: "glm::lookAt recibe posición de cámara, punto de mira y dirección arriba.",
  ch08_projTitle: "Matriz de proyección — perspectiva",
  ch08_projBody: "glm::perspective crea un frustum. Argumentos: FOV vertical, relación de aspecto, planos near y far.",
  ch08_nearWarn: "Nunca pongas el plano near en 0. Sustituye n = 0 en la matriz de abajo y la tercera fila queda (0, 0, −1, 0): z_clip = −z = w, así que tras la división todos los puntos caen en z_ndc = 1 y el depth buffer ya no puede distinguir nada. Incluso un near pequeño y positivo sale caro, porque la precisión de profundidad se concentra justo delante de la cámara. Aléjalo tanto como la escena permita (0.1 es un valor habitual); el capítulo Depth Testing muestra por qué.",
  ch08_shaderTitle: "Aplicando MVP en el vertex shader",
  ch08_animTip: "Para animar rotación, multiplica el ángulo por glfwGetTime() cada frame.",
};

export default text;
