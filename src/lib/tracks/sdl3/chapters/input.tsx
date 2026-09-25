"use client";

// SDL3 track — "Events & Input".

import { TrackTranslations } from "@/lib/tracks/types";
import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";

export function InputContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "sdl04_intro",
          "SDL delivers everything the user does as an SDL_Event: a tagged union where the type field tells you which member is valid. The distinction that trips up every newcomer is events versus state — events tell you something changed, state tells you what is true right now, and gameplay needs both."
        )}
      </p>

      <H2>{tx(t, "sdl04_loopTitle", "The event union")}</H2>

      <CodeBlock lang="cpp" filename="events.cpp" t={t}>{`SDL_Event e;
while (SDL_PollEvent(&e)) {
    switch (e.type) {
        case SDL_EVENT_QUIT:
            running = false;
            break;

        case SDL_EVENT_KEY_DOWN:
            if (e.key.repeat) break;          // ignore auto-repeat
            if (e.key.key == SDLK_SPACE) jump();
            break;

        case SDL_EVENT_MOUSE_MOTION:
            camera.yaw   += e.motion.xrel * sensitivity;
            camera.pitch -= e.motion.yrel * sensitivity;
            break;

        case SDL_EVENT_MOUSE_BUTTON_DOWN:
            if (e.button.button == SDL_BUTTON_LEFT) shoot();
            break;

        case SDL_EVENT_MOUSE_WHEEL:
            zoom += e.wheel.y;                // float in SDL3
            break;

        case SDL_EVENT_WINDOW_RESIZED:
            onResize(e.window.data1, e.window.data2);
            break;

        case SDL_EVENT_GAMEPAD_ADDED:
            openGamepad(e.gdevice.which);
            break;
    }
}`}</CodeBlock>

      <H2>{tx(t, "sdl04_scanTitle", "Scancode versus keycode")}</H2>
      <p>
        {tx(t, "sdl04_scanBody",
          "A scancode is a physical key position; a keycode is the character that key produces under the user's layout. On an AZERTY keyboard the key where W sits on QWERTY produces Z. Movement must use scancodes, or French players cannot walk forward. Shortcuts and text should use keycodes, so Ctrl+Z is wherever the user's Z actually is."
        )}
      </p>

      <CodeBlock lang="cpp" filename="keys.cpp" t={t}>{`// Events give you both
if (e.type == SDL_EVENT_KEY_DOWN) {
    SDL_Scancode physical = e.key.scancode;   // SDL_SCANCODE_W — always that key
    SDL_Keycode  logical  = e.key.key;        // SDLK_Z on AZERTY
}

// Polled state: "is it held down right now?" — this is what movement needs
const bool* keys = SDL_GetKeyboardState(nullptr);   // const bool* in SDL3
glm::vec2 dir{0.0f};
if (keys[SDL_SCANCODE_W]) dir.y -= 1.0f;
if (keys[SDL_SCANCODE_S]) dir.y += 1.0f;
if (keys[SDL_SCANCODE_A]) dir.x -= 1.0f;
if (keys[SDL_SCANCODE_D]) dir.x += 1.0f;
if (dir != glm::vec2{0.0f}) player.pos += glm::normalize(dir) * speed * dt;`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "sdl04_stateTip",
          "The rule of thumb: use events for things that happen once (jump, shoot, open a menu) and polled state for things that are continuous (walking, aiming, holding a trigger). Driving movement from key-down events gives you the operating system's key-repeat delay in the middle of your controls."
        )}
      </Callout>

      <H2>{tx(t, "sdl04_mouseTitle", "Mouse modes")}</H2>

      <CodeBlock lang="cpp" filename="mouse.cpp" t={t}>{`// Relative mode: hides the cursor, locks it to the window, and reports only
// deltas — the correct mode for a first-person camera
SDL_SetWindowRelativeMouseMode(window, true);

float mx, my;
SDL_MouseButtonFlags buttons = SDL_GetMouseState(&mx, &my);   // floats in SDL3
if (buttons & SDL_BUTTON_LMASK) { /* left held */ }`}</CodeBlock>

      <H2>{tx(t, "sdl04_padTitle", "Gamepads")}</H2>
      <p>
        {tx(t, "sdl04_padBody",
          "SDL_Gamepad is the high-level API: it maps any recognized controller onto the Xbox layout, so you write SDL_GAMEPAD_BUTTON_SOUTH once and it works on a DualSense, a Switch Pro controller and an Xbox pad. The low-level SDL_Joystick API exists for flight sticks and racing wheels that do not fit that layout."
        )}
      </p>

      <CodeBlock lang="cpp" filename="gamepad.cpp" t={t}>{`// Hotplug — never enumerate once at startup and assume it stays valid
case SDL_EVENT_GAMEPAD_ADDED:
    pad = SDL_OpenGamepad(e.gdevice.which);
    break;
case SDL_EVENT_GAMEPAD_REMOVED:
    SDL_CloseGamepad(pad);
    pad = nullptr;
    break;

// Axes are Sint16: -32768..32767. Always apply a deadzone.
if (pad) {
    float lx = SDL_GetGamepadAxis(pad, SDL_GAMEPAD_AXIS_LEFTX) / 32767.0f;
    float ly = SDL_GetGamepadAxis(pad, SDL_GAMEPAD_AXIS_LEFTY) / 32767.0f;

    glm::vec2 stick{lx, ly};
    const float len = glm::length(stick);
    if (len < 0.20f) stick = {0.0f, 0.0f};              // radial deadzone
    else stick = glm::normalize(stick) * ((len - 0.20f) / 0.80f);

    if (SDL_GetGamepadButton(pad, SDL_GAMEPAD_BUTTON_SOUTH)) jump();

    SDL_RumbleGamepad(pad, 0x8000, 0x4000, 200);        // low, high, ms
}`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "sdl04_deadzoneWarn",
          "Apply the deadzone to the stick's length, not to each axis separately. Per-axis deadzones produce a square dead area, so diagonal input near the centre behaves differently from cardinal input — players feel it as the stick sticking to the axes."
        )}
      </Callout>

      <H2>{tx(t, "sdl04_textTitle", "Text input")}</H2>

      <CodeBlock lang="cpp" filename="text.cpp" t={t}>{`// SDL3 scopes text input to a window, and it is off by default
SDL_StartTextInput(window);

case SDL_EVENT_TEXT_INPUT:
    buffer += e.text.text;      // UTF-8, already composed by the IME
    break;

SDL_StopTextInput(window);`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "sdl04_textNote",
          "Never build text from key-down events. SDL_EVENT_TEXT_INPUT is the only path that handles keyboard layouts, dead keys, and input method editors for Chinese, Japanese and Korean correctly — the event gives you finished UTF-8 characters, not keystrokes."
        )}
      </Callout>

    </article>
  );
}
