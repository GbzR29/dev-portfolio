// ZH text for src/lib/tracks/glsl/chapters/noise.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  glsl05_intro: "噪声是程序化纹理、地形生成和有机效果的基础。GLSL没有内置噪声函数，需用hash函数自行实现。",
  glsl05_hashTitle: "Hash函数",
  glsl05_hashBody: "Hash函数将值映射到伪随机数。GLSL中使用点积+sin+fract从vec2生成伪随机浮点数。",
  glsl05_valueNoiseTitle: "值噪声",
  glsl05_valueNoiseBody: "在网格上的随机值之间插值，产生云和地形中的平滑斑状外观。",
  glsl05_fbmTitle: "分形布朗运动(fBm)",
  glsl05_fbmBody: "叠加多个频率递增、振幅递减的噪声八度，产生云、山脉和火焰的自然自相似外观。",
  glsl05_fbmTip: "每个八度频率×2，振幅×0.5。4-6个八度通常足够，更多会有收益递减和走样问题。",
};

export default text;
