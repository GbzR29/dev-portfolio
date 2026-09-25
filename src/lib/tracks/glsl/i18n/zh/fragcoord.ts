// ZH text for src/lib/tracks/glsl/chapters/fragcoord.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  glsl03_intro: "片段着色器通过gl_FragCoord访问像素屏幕位置，结合分辨率uniform可实现全屏着色器效果。",
  glsl03_fragcoordTitle: "gl_FragCoord",
  glsl03_fragcoordBody: "gl_FragCoord.xy给出窗口坐标中的像素位置，(0,0)在左下角，z分量是[0,1]中的深度值。",
  glsl03_centeredTitle: "居中和宽高比校正",
  glsl03_centeredBody: "将坐标中心化到[-1,+1]并校正宽高比，确保圆形看起来是圆的。",
  glsl03_timeTitle: "用时间制作动画",
  glsl03_timeBody: "传入每帧递增的float uniform，与sin/cos结合创建循环动画。",
  glsl03_patternTip: "ShaderToy标准设置居中坐标系并用高度校正宽高比，X范围约[-宽高比,宽高比]，Y范围[-1,1]。",
};

export default text;
