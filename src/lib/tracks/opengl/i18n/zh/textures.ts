// ZH text for src/lib/tracks/opengl/chapters/textures.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch07_intro: "纹理是存储在GPU显存中的2D图像，片段着色器可以逐像素采样。顶点数据只能给出纯色，纹理在不增加几何体的情况下提供细节和真实感。",
  ch07_uvTitle: "UV / 纹理坐标",
  ch07_uvBody: "每个顶点携带一对浮点数(U,V)，告诉GPU纹理的哪个部分映射到该顶点。OpenGL中(0,0)是左下，(1,1)是右上。",
  ch07_loadTitle: "使用stb_image加载图像",
  ch07_loadBody: "stb_image.h是OpenGL项目的标准单头文件图像加载器。在一个.cpp中包含实现，调用stbi_load获取像素数据。",
  ch07_createTitle: "创建纹理对象",
  texWrapHeader0: "环绕模式",
  texWrapHeader1: "行为",
  texRepeat: "平铺纹理，默认且最常见。",
  texClamp: "拉伸边缘像素，适合UI精灵。",
  texMirror: "平铺但交替镜像。",
  ch07_shaderTitle: "在片段着色器中采样",
  ch07_bindTitle: "绘制前绑定纹理",
  ch07_unitsNote: "OpenGL支持至少16个同时纹理单元(GL_TEXTURE0到GL_TEXTURE15)。激活单元，绑定纹理，告诉uniform sampler使用哪个单元。",
};

export default text;
