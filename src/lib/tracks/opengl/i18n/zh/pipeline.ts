// ZH text for src/lib/tracks/opengl/chapters/pipeline.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch01_intro: "OpenGL在3D空间中运作，但屏幕是2D像素网格。图形管线是将3D顶点数据转换为屏幕像素的步骤序列，理解它是编写OpenGL代码前最重要的事情。",
  ch01_stagesTitle: "管线阶段",
  ch01_stagesBody: "管线由固定阶段（只能配置）和可编程阶段（通过GLSL着色器）组成。",
  ch01_stagesNote: "顶点着色器和片段着色器是你最常交互的两个阶段，也是绘制任何内容所需的最低要求。",
  ch01_ndcTitle: "标准化设备坐标",
  ch01_ndcBody: "OpenGL使用NDC坐标系，每个轴从-1.0到+1.0。超出范围的顶点会被裁剪。",
  ch01_ndcAfter: "简单三角形的三个顶点在NDC中的样子：",
  ch01_ndcCallout: "NDC不是屏幕空间。顶点着色器运行后，OpenGL自动将NDC坐标转换为像素，使用glViewport()设置的尺寸。",
  ch01_vertexShaderTitle: "顶点着色器",
  ch01_vertexShaderBody: "顶点着色器每个顶点运行一次，必须通过gl_Position输出最终位置。",
  ch01_fragmentShaderTitle: "片段着色器",
  ch01_fragmentShaderBody: "光栅化后，片段着色器每个像素片段运行一次，输出最终颜色，必须声明为out vec4。",
  ch01_colorTip: "GLSL中颜色用0.0到1.0的浮点数表示。转换：将RGB值除以255。",
  ch01_compileTitle: "着色器如何编译",
  ch01_compileBody: "着色器在运行时由GPU驱动编译，不是在构建时编译。",
  ch01_compileWarn: "开发时务必检查着色器编译错误。GLSL拼写错误会悄无声息地产生黑屏。glGetShaderInfoLog会告诉你失败的行号。",
  ch01_nextTitle: "接下来",
  ch01_nextBody: "现在理解了管线，需要将顶点数据从CPU传输到GPU，这就是VBO的工作。",
};

export default text;
