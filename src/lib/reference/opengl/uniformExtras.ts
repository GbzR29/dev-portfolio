// src/lib/reference/opengl/uniformExtras.ts
// More of the "uniforms" category: vec2 uniforms and setting a uniform of a
// program that is not in use.
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

export const uniformExtraEntries: RefEntry[] = [
  {
    name: "glUniform2f",
    category: "uniforms",
    since: "GL 2.0",
    signature: "void glUniform2f(GLint location, GLfloat v0, GLfloat v1);",
    summary: {
      en: "Sets a vec2 uniform of the program in use from two floats, such as the screen resolution.",
      pt: "Define um uniform vec2 do programa em uso a partir de dois floats, como a resolução da tela.",
    },
    description: {
      en: "The name says what it takes: 2 values of type f (float), so it fits a uniform declared vec2. The same pattern names the whole family: glUniform1i (one int), glUniform3f (vec3), glUniform4fv (an array of vec4 by pointer), glUniformMatrix4fv (mat4).\n\nThe classic use is uResolution in a fragment shader, so gl_FragCoord.xy / uResolution gives coordinates from 0 to 1 whatever the window size.",
      pt: "O nome diz o que ela recebe: 2 valores do tipo f (float), então serve para um uniform declarado vec2. O mesmo padrão dá nome à família toda: glUniform1i (um int), glUniform3f (vec3), glUniform4fv (um array de vec4 por ponteiro), glUniformMatrix4fv (mat4).\n\nO uso clássico é uResolution num fragment shader, assim gl_FragCoord.xy / uResolution dá coordenadas de 0 a 1 seja qual for o tamanho da janela.",
    },
    params: [
      { name: "location", type: "GLint", desc: { en: "From glGetUniformLocation; -1 is silently ignored.", pt: "De glGetUniformLocation; -1 é ignorado sem erro." } },
      { name: "v0", type: "GLfloat", desc: { en: "The x component.", pt: "O componente x." } },
      { name: "v1", type: "GLfloat", desc: { en: "The y component.", pt: "O componente y." } },
    ],
    notes: [
      { en: "It writes to the program bound with glUseProgram, so call glUseProgram first (or use glProgramUniform2f).", pt: "Ela escreve no programa ligado com glUseProgram, então chame glUseProgram antes (ou use glProgramUniform2f)." },
      { en: "The suffix must match the declaration: glUniform2f on an ivec2 or a vec3 raises GL_INVALID_OPERATION and changes nothing.", pt: "O sufixo precisa bater com a declaração: glUniform2f num ivec2 ou num vec3 gera GL_INVALID_OPERATION e não muda nada." },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "No program in use, or the uniform is not a vec2.", pt: "Nenhum programa em uso, ou o uniform não é vec2." } },
    ],
    example: `glUseProgram(prog);
glUniform2f(glGetUniformLocation(prog, "uResolution"), (float)width, (float)height);`,
    related: ["glUniform1f", "glUniform4f", "glUniform3fv", "glGetUniformLocation", "glProgramUniform1f"],
    khronos: `${KHR}glUniform.xhtml`,
  },
  {
    name: "glProgramUniform1f",
    category: "uniforms",
    since: "GL 4.1",
    signature: "void glProgramUniform1f(GLuint program, GLint location, GLfloat v0);",
    summary: {
      en: "Sets a float uniform of any program, without making it the program in use.",
      pt: "Define um uniform float de qualquer programa, sem torná-lo o programa em uso.",
    },
    description: {
      en: "glUniform* always writes to the program bound with glUseProgram, which forces a bind just to set a value. The glProgramUniform* family takes the program as its first argument, the same idea as Direct State Access. Every glUniform variant has one: glProgramUniform1i, glProgramUniform3fv, glProgramUniformMatrix4fv…\n\nHandy for a compute program's time step, or for setting up several programs' uniforms at load time.",
      pt: "glUniform* sempre escreve no programa ligado com glUseProgram, o que obriga um bind só para definir um valor. A família glProgramUniform* recebe o programa como primeiro argumento, a mesma ideia do Direct State Access. Toda variante de glUniform tem a sua: glProgramUniform1i, glProgramUniform3fv, glProgramUniformMatrix4fv…\n\nÚtil para o passo de tempo de um programa compute, ou para configurar uniforms de vários programas no carregamento.",
    },
    params: [
      { name: "program", type: "GLuint", desc: { en: "The program that owns the uniform.", pt: "O programa dono do uniform." } },
      { name: "location", type: "GLint", desc: { en: "From glGetUniformLocation on that same program.", pt: "De glGetUniformLocation nesse mesmo programa." } },
      { name: "v0", type: "GLfloat", desc: { en: "The value.", pt: "O valor." } },
    ],
    notes: [
      { en: "Locations belong to a program: a location from one program means nothing in another.", pt: "Locations pertencem a um programa: a location de um programa não significa nada em outro." },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "program is not a linked program, or the uniform is not a float.", pt: "program não é um programa linkado, ou o uniform não é float." } },
    ],
    example: `glProgramUniform1f(computeProgram, glGetUniformLocation(computeProgram, "uDt"), dt);
glUseProgram(computeProgram);
glDispatchCompute(groups, 1, 1);`,
    related: ["glUniform1f", "glUseProgram", "glGetUniformLocation", "glUniform2f"],
    khronos: `${KHR}glProgramUniform.xhtml`,
  },
];
