// ZH text for src/lib/tracks/opengl/chapters/shaders.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch04_intro: "着色器是在GPU上为每个顶点或像素运行的小程序。本章涵盖编写第一对着色器所需的一切。",
  ch04_basicsTitle: "GLSL基础",
  ch04_passingTitle: "在阶段间传递数据",
  ch04_passingBody: "数据通过限定符在管线中流动：",
  shaderTableHeader0: "限定符",
  shaderTableHeader1: "使用位置",
  shaderTableHeader2: "含义",
  shaderQualInVertex: "顶点着色器",
  shaderQualInMeaning: "来自VBO的数据（每个顶点一个值）",
  shaderQualOutMeaning: "传递给下一阶段的数据（已插值）",
  shaderQualInFrag: "片段着色器",
  shaderQualInFragMeaning: "接收来自顶点着色器的插值out",
  shaderQualBoth: "两者",
  shaderQualUniformMeaning: "从C++设置的值，对所有顶点和像素相同",
  ch04_colorExampleTitle: "颜色插值示例",
  ch04_colorExampleBody: "为每个顶点传递颜色，让OpenGL在三角形上插值，这是经典的彩虹三角形。",
  ch04_interpolationNote: "GPU光栅化时自动进行重心插值，每个像素获得三个顶点颜色的加权平均值，完全免费。",
  ch04_uniformTitle: "Uniform变量",
  ch04_uniformBody: "uniform是从C++设置的值，在绘制调用的所有顶点中保持不变。",
  ch04_uniformWarn: "设置uniform前必须调用glUseProgram。",
};

export default text;
