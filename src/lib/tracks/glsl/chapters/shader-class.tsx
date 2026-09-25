"use client";

// GLSL track — "Shader Class in C++".

import type { TrackTranslations } from "@/lib/tracks/types";
import { tx } from "@/lib/tracks/tx";
import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";

export function ShaderClassContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "glsl06_intro",
          "Embedding shader source in C++ string literals works for small examples, but breaks down quickly for real projects. A dedicated Shader class that loads, compiles, and manages GLSL files makes iterating on shaders dramatically faster."
        )}
      </p>

      <H2>{tx(t, "glsl06_problemTitle", "The problem with string literals")}</H2>
      <p>{tx(t, "glsl06_problemBody", "Shader source in string literals requires a recompile of your C++ every time you tweak GLSL. You lose IDE syntax highlighting, and the code becomes hard to read. Loading from files fixes all of this.")}</p>

      <H2>{tx(t, "glsl06_classTitle", "Shader class interface")}</H2>
      <p>{tx(t, "glsl06_classBody", "A minimal Shader class needs: a constructor that takes file paths, a use() method to bind it, and uniform setter helpers. The implementation compiles vertex and fragment shaders and links them into a program.")}</p>
      <CodeBlock lang="cpp" filename="Shader.h" t={t}>{`#pragma once
#include <glad/glad.h>
#include <glm/glm.hpp>
#include <string>

class Shader {
public:
    unsigned int ID;

    Shader(const char* vertexPath, const char* fragmentPath);

    void use() const { glUseProgram(ID); }
    void del() const { glDeleteProgram(ID); }

    // Uniform setters
    void setBool (const std::string& name, bool  v) const;
    void setInt  (const std::string& name, int   v) const;
    void setFloat(const std::string& name, float v) const;
    void setVec2 (const std::string& name, glm::vec2 v) const;
    void setVec3 (const std::string& name, glm::vec3 v) const;
    void setMat4 (const std::string& name, glm::mat4 v) const;

private:
    static unsigned int compile(unsigned int type, const std::string& src);
    static void checkErrors(unsigned int id, bool isProgram);
};`}</CodeBlock>

      <H2>{tx(t, "glsl06_implTitle", "Implementation")}</H2>
      <CodeBlock lang="cpp" filename="Shader.cpp" t={t}>{`#include "Shader.h"
#include <glm/gtc/type_ptr.hpp>
#include <fstream>
#include <sstream>
#include <iostream>

// Load file → string
static std::string readFile(const char* path) {
    std::ifstream file(path);
    if (!file) { std::cerr << "Cannot open shader: " << path << "\\n"; return ""; }
    std::stringstream ss;
    ss << file.rdbuf();
    return ss.str();
}

Shader::Shader(const char* vertPath, const char* fragPath) {
    unsigned int vs = compile(GL_VERTEX_SHADER,   readFile(vertPath));
    unsigned int fs = compile(GL_FRAGMENT_SHADER, readFile(fragPath));

    ID = glCreateProgram();
    glAttachShader(ID, vs);
    glAttachShader(ID, fs);
    glLinkProgram(ID);
    checkErrors(ID, true);

    glDeleteShader(vs);
    glDeleteShader(fs);
}

unsigned int Shader::compile(unsigned int type, const std::string& src) {
    unsigned int id = glCreateShader(type);
    const char* c   = src.c_str();
    glShaderSource(id, 1, &c, nullptr);
    glCompileShader(id);
    checkErrors(id, false);
    return id;
}

void Shader::checkErrors(unsigned int id, bool isProgram) {
    int  ok; char log[1024];
    if (isProgram) {
        glGetProgramiv(id, GL_LINK_STATUS, &ok);
        if (!ok) { glGetProgramInfoLog(id, 1024, nullptr, log); std::cerr << "LINK: " << log; }
    } else {
        glGetShaderiv(id, GL_COMPILE_STATUS, &ok);
        if (!ok) { glGetShaderInfoLog(id, 1024, nullptr, log); std::cerr << "COMPILE: " << log; }
    }
}

// Uniform setters — must call use() before calling these
void Shader::setFloat(const std::string& n, float v) const {
    glUniform1f(glGetUniformLocation(ID, n.c_str()), v);
}
void Shader::setVec3(const std::string& n, glm::vec3 v) const {
    glUniform3fv(glGetUniformLocation(ID, n.c_str()), 1, glm::value_ptr(v));
}
void Shader::setMat4(const std::string& n, glm::mat4 v) const {
    glUniformMatrix4fv(glGetUniformLocation(ID, n.c_str()), 1, GL_FALSE, glm::value_ptr(v));
}`}</CodeBlock>

      <H2>{tx(t, "glsl06_hotreloadTitle", "Hot reload pattern")}</H2>
      <p>{tx(t, "glsl06_hotreloadBody", "Watch the shader file's modification time. When it changes, recompile in a background thread and swap the program ID atomically. This lets you tweak shaders and see results instantly without restarting the app.")}</p>
      <CodeBlock lang="cpp" filename="hot_reload.cpp" t={t}>{`#include <filesystem>
#include <chrono>

struct ShaderWatcher {
    Shader*   shader;
    std::string vertPath, fragPath;
    std::filesystem::file_time_type lastMod;

    void update() {
        auto t = std::filesystem::last_write_time(vertPath);
        if (t != lastMod) {
            lastMod = t;
            unsigned int oldID = shader->ID;
            try {
                Shader fresh(vertPath.c_str(), fragPath.c_str());
                glDeleteProgram(oldID);
                shader->ID = fresh.ID;
                std::cout << "Shader reloaded OK\\n";
            } catch (...) {
                std::cerr << "Reload failed — keeping previous shader\\n";
            }
        }
    }
};

// In your render loop:
// watcher.update();  // polls every frame (cheap — just stat() the file)`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "glsl06_errorTip",
          "Always keep the old shader program if recompilation fails — a broken shader should not crash your app. Print the error to stderr with the filename and line number, and continue rendering with the previous working program."
        )}
      </Callout>

    </article>
  );
}
