"use client";

// GLSL track — "Shader Class in C++".

import type { TrackTranslations } from "@/lib/tracks/types";
import { tx } from "@/lib/tracks/tx";
import { Goals } from "@/components/lesson/Prose";
import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";

export function ShaderClassContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "glsl06_intro",
          "Embedding shader source in C++ string literals works for small examples, but breaks down quickly for real projects. A dedicated Shader class that loads, compiles, and manages GLSL files makes iterating on shaders dramatically faster."
        )}
      </p>

      <Goals t={t} id="glsl06" items={[
        "Load shaders from files instead of string literals.",
        "Write a Shader class that compiles, links and reports errors.",
        "Set uniforms through it and draw a frame.",
        "Reload shaders while the program is running.",
      ]} />

      {/* ── The problem─────────────────────────────────────────── */}
      <H2>{tx(t, "glsl06_problemTitle", "The problem with string literals")}</H2>
      <p>{tx(t, "glsl06_problemBody2", "When GLSL lives inside a C++ string, three things go wrong. First, every tweak to a colour or a constant means recompiling and relinking the C++ program, which can take seconds or minutes, instead of the milliseconds the GPU driver needs to compile the shader itself. Second, the editor sees one long string, so you lose GLSL syntax highlighting, autocompletion and error squiggles. Third, the driver's error messages report line numbers inside the shader, which you then have to map by hand to lines inside a C++ string full of quotes and \\n escapes.")}</p>
      <p>{tx(t, "glsl06_problemFix", "The fix is to keep each shader stage in its own text file (shader.vert, shader.frag), read the file at run time, and hand the text to OpenGL. The C++ program never changes when the shader changes, and that is what later makes hot reload possible.")}</p>

      {/* ── Interface ───────────────────────────────────────────── */}
      <H2>{tx(t, "glsl06_classTitle", "Shader class interface")}</H2>
      <p>{tx(t, "glsl06_classBody2", "The class wraps one OpenGL program object. A program is the linked result of several shader stages, and OpenGL identifies it by an unsigned integer, the ID. The class needs four things: a constructor that takes the two file paths and builds the program, use() to make it the active program, setters that upload uniform values, and a destructor (here del()) that frees the GPU object.")}</p>
      <CodeBlock lang="cpp" filename="Shader.h" t={t}>{`#pragma once
#include <glad/glad.h>
#include <glm/glm.hpp>
#include <string>

class Shader {
public:
    unsigned int ID = 0;   // 0 = "no program" in OpenGL

    // Returns ID 0 (and prints the log) if compiling or linking fails.
    Shader(const char* vertexPath, const char* fragmentPath);

    void use() const { glUseProgram(ID); }
    void del() const { glDeleteProgram(ID); }
    bool ok()  const { return ID != 0; }

    // Uniform setters — the program must be active (use()) first
    void setInt  (const std::string& name, int   v) const;
    void setFloat(const std::string& name, float v) const;
    void setVec3 (const std::string& name, const glm::vec3& v) const;
    void setMat4 (const std::string& name, const glm::mat4& v) const;

private:
    static unsigned int compile(unsigned int type, const std::string& src,
                                const char* path);
    static bool check(unsigned int id, bool isProgram, const char* label);
};`}</CodeBlock>
      <p>{tx(t, "glsl06_classWhy", "Two details matter. The ID starts at 0 because 0 is OpenGL's \"no program\" value: glUseProgram(0) simply unbinds, so a failed shader can never point at garbage. And ok() lets the caller ask whether the build succeeded, which the hot-reload code below depends on.")}</p>

      {/* ── Implementation ──────────────────────────────────────── */}
      <H2>{tx(t, "glsl06_implTitle", "Implementation")}</H2>
      <p>{tx(t, "glsl06_implBody", "The constructor follows the same five steps as the hand-written version in the OpenGL track: read each file into a string, create a shader object per stage, give it the source, compile it, then attach both stages to a new program and link. Each step can fail, so each result is checked before going on.")}</p>
      <CodeBlock lang="cpp" filename="Shader.cpp" t={t}>{`#include "Shader.h"
#include <glm/gtc/type_ptr.hpp>
#include <fstream>
#include <sstream>
#include <iostream>

// Load file → string ("" if the file cannot be opened)
static std::string readFile(const char* path) {
    std::ifstream file(path);
    if (!file) { std::cerr << "Cannot open shader: " << path << "\\n"; return ""; }
    std::stringstream ss;
    ss << file.rdbuf();
    return ss.str();
}

Shader::Shader(const char* vertPath, const char* fragPath) {
    unsigned int vs = compile(GL_VERTEX_SHADER,   readFile(vertPath), vertPath);
    unsigned int fs = compile(GL_FRAGMENT_SHADER, readFile(fragPath), fragPath);

    if (vs && fs) {
        unsigned int prog = glCreateProgram();
        glAttachShader(prog, vs);
        glAttachShader(prog, fs);
        glLinkProgram(prog);
        if (check(prog, true, "link")) ID = prog;
        else glDeleteProgram(prog);
    }
    glDeleteShader(vs);   // deleting 0 is a no-op
    glDeleteShader(fs);   // the program keeps its own copy of the code
}

unsigned int Shader::compile(unsigned int type, const std::string& src,
                             const char* path) {
    if (src.empty()) return 0;
    unsigned int id = glCreateShader(type);
    const char* c   = src.c_str();
    glShaderSource(id, 1, &c, nullptr);
    glCompileShader(id);
    if (check(id, false, path)) return id;
    glDeleteShader(id);
    return 0;
}

bool Shader::check(unsigned int id, bool isProgram, const char* label) {
    int ok = 0; char log[1024];
    if (isProgram) {
        glGetProgramiv(id, GL_LINK_STATUS, &ok);
        if (!ok) glGetProgramInfoLog(id, sizeof log, nullptr, log);
    } else {
        glGetShaderiv(id, GL_COMPILE_STATUS, &ok);
        if (!ok) glGetShaderInfoLog(id, sizeof log, nullptr, log);
    }
    if (!ok) std::cerr << label << ":\\n" << log << "\\n";
    return ok != 0;
}

// Uniform setters — must call use() before calling these
void Shader::setInt(const std::string& n, int v) const {
    glUniform1i(glGetUniformLocation(ID, n.c_str()), v);
}
void Shader::setFloat(const std::string& n, float v) const {
    glUniform1f(glGetUniformLocation(ID, n.c_str()), v);
}
void Shader::setVec3(const std::string& n, const glm::vec3& v) const {
    glUniform3fv(glGetUniformLocation(ID, n.c_str()), 1, glm::value_ptr(v));
}
void Shader::setMat4(const std::string& n, const glm::mat4& v) const {
    glUniformMatrix4fv(glGetUniformLocation(ID, n.c_str()), 1, GL_FALSE, glm::value_ptr(v));
}`}</CodeBlock>
      <p>{tx(t, "glsl06_setterBody", "Each setter does two calls. glGetUniformLocation asks the program where the uniform called name lives and returns an integer slot, or -1 if no such uniform exists (or the compiler removed it because it is unused). glUniform* then writes the value into that slot of the currently active program, which is why use() must come first. The suffix tells the type: 1f is one float, 1i one int, 3fv a pointer to 3 floats, Matrix4fv a pointer to 16 floats. In glUniform3fv(loc, 1, ptr), the 1 is how many vec3s to upload (more than 1 for arrays). In glUniformMatrix4fv the GL_FALSE means \"do not transpose\": GLM already stores matrices column by column, the layout OpenGL expects. value_ptr returns a pointer to the first float.")}</p>
      <p>{tx(t, "glsl06_logBody", "When a compile fails, the log names the file you passed in and gives a driver message such as 0:12(5): error: 'colr' undeclared. The format varies by vendor, but the pattern is usually source-string:line(column). Here the source string is always 0 because we pass one string, and line 12 is line 12 of shader.frag, which is exactly where your editor jumps.")}</p>

      {/* ── Worked example ──────────────────────────────────────── */}
      <H2>{tx(t, "glsl06_exampleTitle", "Worked example: one frame")}</H2>
      <p>{tx(t, "glsl06_exampleBody", "Building the shader once at start-up and using it every frame looks like this. The time uniform makes the colour pulse, so you can see uniforms reaching the GPU.")}</p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`Shader sh("shaders/pulse.vert", "shaders/pulse.frag");
if (!sh.ok()) return 1;            // log already printed

while (!glfwWindowShouldClose(win)) {
    glClear(GL_COLOR_BUFFER_BIT);
    sh.use();                                       // 1. activate
    sh.setFloat("uTime", (float)glfwGetTime());     // 2. upload uniforms
    sh.setVec3 ("uTint", glm::vec3(1.0f, 0.5f, 0.2f));
    glBindVertexArray(vao);
    glDrawArrays(GL_TRIANGLES, 0, 3);               // 3. draw
    glfwSwapBuffers(win);
    glfwPollEvents();
}
sh.del();`}</CodeBlock>
      <CodeBlock lang="glsl" filename="shaders/pulse.frag" t={t}>{`#version 330 core
uniform float uTime;
uniform vec3  uTint;
out vec4 FragColor;
void main() {
    float k = 0.5 + 0.5 * sin(uTime * 2.0);   // 0..1, one pulse per π seconds
    FragColor = vec4(uTint * k, 1.0);
}`}</CodeBlock>
      <p>{tx(t, "glsl06_exampleNumbers", "Follow the numbers at uTime = 0.785 s: uTime·2 = 1.571 (≈ π/2), sin of that is 1, so k = 0.5 + 0.5·1 = 1 and the pixel is the full tint (1, 0.5, 0.2). At uTime = 2.356 s the angle is 4.712 (≈ 3π/2), sin = −1, k = 0 and the pixel is black. The 0.5 + 0.5·sin trick remaps sine's −1..1 range to 0..1, and the factor 2.0 sets the speed: one full cycle every 2π/2 = π ≈ 3.14 seconds.")}</p>

      {/* ── Hot reload ──────────────────────────────────────────── */}
      <H2>{tx(t, "glsl06_hotreloadTitle", "Hot reload pattern")}</H2>
      <p>{tx(t, "glsl06_hotreloadBody2", "Hot reload means rebuilding the program while the app runs, as soon as you save a shader file. Once a frame, ask the file system for the last-modified time of both files (a cheap metadata query, no reading). If either changed, build a fresh Shader. If the fresh one is ok(), delete the old program and adopt the new ID; if it failed, delete nothing and keep drawing with the old program. Everything stays on the render thread, because an OpenGL context belongs to the thread that made it current, so compiling on another thread would need a second shared context.")}</p>
      <CodeBlock lang="cpp" filename="hot_reload.cpp" t={t}>{`#include <filesystem>
namespace fs = std::filesystem;

struct ShaderWatcher {
    Shader&     shader;
    std::string vertPath, fragPath;
    fs::file_time_type vertMod{}, fragMod{};

    void update() {
        std::error_code ec;                          // editors briefly lock / delete files
        auto v = fs::last_write_time(vertPath, ec); if (ec) return;
        auto f = fs::last_write_time(fragPath, ec); if (ec) return;
        if (v == vertMod && f == fragMod) return;    // nothing changed
        vertMod = v; fragMod = f;

        Shader fresh(vertPath.c_str(), fragPath.c_str());
        if (!fresh.ok()) {                           // log already printed
            std::cerr << "Reload failed — keeping previous shader\\n";
            return;
        }
        shader.del();                                // free the old program
        shader.ID = fresh.ID;                        // adopt the new one
        std::cout << "Shader reloaded OK\\n";
    }
};

// In your render loop, before drawing:
// watcher.update();`}</CodeBlock>
      <p>{tx(t, "glsl06_hotreloadNotes", "The std::error_code overload matters: many editors save by writing a temporary file and renaming it, so for a moment the shader file may not exist, and the throwing overload would crash the app. Note too that uniform values belong to a program object, so a fresh program starts with all uniforms at zero; the loop above re-sets them every frame, which hides this. Uniforms you set only once at start-up (texture units, for example) must be set again after a reload.")}</p>

      <Callout type="warn" t={t}>
        {tx(t, "glsl06_errorTip",
          "Always keep the old shader program if recompilation fails — a broken shader should not crash your app. Print the error to stderr with the filename and line number, and continue rendering with the previous working program."
        )}
      </Callout>

      {/* ── Choices ─────────────────────────────────────────────── */}
      <H2>{tx(t, "glsl06_choicesTitle", "Design choices")}</H2>
      <LessonTable
        headers={[tx(t, "glsl06_thChoice", "Choice"), tx(t, "glsl06_thWhen", "When it fits"), tx(t, "glsl06_thCost", "Cost")]}
        rows={[
          [tx(t, "glsl06_ch1a", "Strings in C++"), tx(t, "glsl06_ch1b", "Tiny demos, single-file samples"), tx(t, "glsl06_ch1c", "Rebuild per tweak, no highlighting")],
          [tx(t, "glsl06_ch2a", "Files loaded at run time"), tx(t, "glsl06_ch2b", "Development, any real project"), tx(t, "glsl06_ch2c", "Files must ship next to the executable")],
          [tx(t, "glsl06_ch3a", "Files embedded at build time"), tx(t, "glsl06_ch3b", "Release builds"), tx(t, "glsl06_ch3c", "Needs a build step (e.g. a CMake script that writes a header)")],
          [tx(t, "glsl06_ch4a", "Cache uniform locations"), tx(t, "glsl06_ch4b", "Many setter calls per frame"), tx(t, "glsl06_ch4c", "A map per shader; must be cleared on reload")],
        ]}
      />
      <p>{tx(t, "glsl06_cacheBody", "On caching: glGetUniformLocation is a string lookup inside the driver. For a few calls per frame it does not matter. With thousands, store the result in a std::unordered_map<std::string, int> the first time each name is asked for, and clear the map whenever the program ID changes, because locations are only valid for the program that produced them.")}</p>

      {/* ── Mistakes ────────────────────────────────────────────── */}
      <H2>{tx(t, "glsl06_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "glsl06_thSymptom", "Symptom"), tx(t, "glsl06_thCause", "Cause"), tx(t, "glsl06_thFix", "Fix")]}
        rows={[
          [tx(t, "glsl06_m1a", "\"Cannot open shader\" though the file exists"), tx(t, "glsl06_m1b", "Relative path resolved from the working directory, not the executable's folder"), tx(t, "glsl06_m1c", "Set the IDE's working directory, or build paths from the executable location")],
          [tx(t, "glsl06_m2a", "Uniform has no effect, no error"), tx(t, "glsl06_m2b", "Name misspelled or uniform unused, so location is -1 (silently ignored)"), tx(t, "glsl06_m2c", "Print a warning in the setter when the location is -1")],
          [tx(t, "glsl06_m3a", "GL_INVALID_OPERATION on glUniform"), tx(t, "glsl06_m3b", "Setter called before use(), or with the wrong type"), tx(t, "glsl06_m3c", "Call use() first; match the GLSL type (1i for int and samplers)")],
          [tx(t, "glsl06_m4a", "Black screen after editing"), tx(t, "glsl06_m4b", "Failed build replaced the working program with ID 0"), tx(t, "glsl06_m4c", "Swap only when ok() is true, as in the watcher")],
          [tx(t, "glsl06_m5a", "Textures vanish after a reload"), tx(t, "glsl06_m5b", "Sampler uniforms set once at start-up; the new program has them at 0"), tx(t, "glsl06_m5c", "Re-run the one-time uniform setup after each successful reload")],
        ]}
      />

      <p>{tx(t, "glsl06_summary", "In short: files instead of strings, one class that owns the program ID, checked compile and link with readable logs, setters that state their type, and a watcher that only swaps in a program that built successfully. Every later chapter in this track assumes a class like this, so its shaders can be edited live.")}</p>

    </article>
  );
}
