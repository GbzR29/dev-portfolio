// ZH text for src/lib/tracks/glsl/chapters/shader-class.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  glsl06_intro: "将着色器源码嵌入C++字符串字面量在小示例中可行，但在实际项目中很快就会崩溃。专用Shader类让着色器迭代更快。",
  glsl06_problemTitle: "字符串字面量的问题",
  glsl06_problemBody: "每次调整GLSL都需要重新编译C++，失去IDE语法高亮，代码难以阅读。",
  glsl06_classTitle: "Shader类接口",
  glsl06_classBody: "最小Shader类需要：接受文件路径的构造函数、use()方法和uniform设置辅助方法。",
  glsl06_implTitle: "实现",
  glsl06_hotreloadTitle: "热重载模式",
  glsl06_hotreloadBody: "监视着色器文件的修改时间，变化时在后台线程重新编译并原子性地交换程序ID。",
  glsl06_errorTip: "重新编译失败时保留旧着色器程序——损坏的着色器不应崩溃应用。将错误打印到stderr并继续使用之前的程序。",
};

export default text;
