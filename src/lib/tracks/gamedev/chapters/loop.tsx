"use client";

// "Core Loop & Time": the game loop, delta time, the fixed timestep with an
// accumulator, interpolation and the spiral of death.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "../../opengl/chapters/lighting-advanced";
import { LoopFigure } from "@/components/lesson/figures/gamedev/LoopFigure";
import { JumpFigure } from "@/components/lesson/figures/gamedev/JumpFigure";

const r = String.raw;

export function GameLoopContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "gdLoop_intro",
          "A film is a fixed sequence of pictures. A game has to invent every picture as it goes, because it depends on what the player just did. The part of the program that does this is the game loop: read the input, advance the world a little, draw it, and start again, dozens or hundreds of times per second, until the player quits. Almost everything else in this track runs inside that loop, so it is worth getting its timing exactly right.")}
      </Lead>

      <H2>{tx(t, "gdLoop_simpleTitle", "The simplest loop")}</H2>
      <p>
        {tx(t, "gdLoop_simpleBody",
          "The shortest possible game loop has three calls. processInput reads the keyboard, mouse and gamepad. update moves the world forward: characters walk, bullets fly, timers count down. render draws the current state of the world into an image and shows it. Each pass through the loop produces one frame, and the number of frames per second (FPS) is how many passes the computer manages.")}
      </p>
      <CodeBlock lang="cpp" filename="loop_v1.cpp" t={t}>{`while (running) {
    processInput();   // what did the player do since last frame?
    update();         // move the world forward one "tick"
    render();         // draw the world as it is now
}`}</CodeBlock>
      <p>
        {tx(t, "gdLoop_simpleProblem",
          "The problem is hidden in update. If it moves a character 2 pixels per call, the character's speed is 2 pixels per frame, and the number of frames per second depends on the machine. On a computer that runs the loop 30 times per second the character crosses a 1920-pixel screen in 32 seconds; on one that runs it 240 times per second it takes 4 seconds. Many 1980s PC games worked exactly like this and became unplayably fast on newer machines, which is why some PCs had a \"turbo\" button that slowed the processor down.")}
      </p>

      <H2>{tx(t, "gdLoop_dtTitle", "Delta time: move by time, not by frame")}</H2>
      <p>
        {tx(t, "gdLoop_dtBody",
          "The fix is to measure how much real time passed since the previous frame, and move things by speed × time. That elapsed time is called delta time, dt (\"delta\" is the Greek letter used for \"a change in\"). Speeds are then written in units per second, and a character at 200 pixels per second covers 200 pixels every second, whether that second was split into 30 frames or 240.")}
      </p>
      <Equation label={tx(t, "gdLoop_eqDt", "Moving with delta time")}
        where={[
          [r`x_n`, tx(t, "gdLoop_wXn", "the position after frame n")],
          [r`v`, tx(t, "gdLoop_wV", "the velocity, in units per second (pixels per second, metres per second…)")],
          [r`\Delta t`, tx(t, "gdLoop_wDt", "the real time between the start of the previous frame and the start of this one, in seconds. At 60 FPS it is about 1/60 ≈ 0.0167 s")],
        ]}
        note={tx(t, "gdLoop_eqDtNote", "Check the units: (units / second) × seconds = units. If the units of an update line do not work out like this, the line is frame-rate dependent.")}>
        {r`x_{n+1} = x_n + v\,\Delta t`}
      </Equation>
      <p>
        {tx(t, "gdLoop_clockBody",
          "In C++ the clock to use is std::chrono::steady_clock. \"Steady\" means it only ever moves forward at a constant rate; the wall clock (system_clock) can jump when the user or the network changes the time, which would produce a negative or enormous dt.")}
      </p>
      <CodeBlock lang="cpp" filename="loop_v2.cpp" t={t}>{`using Clock = std::chrono::steady_clock;
auto previous = Clock::now();

while (running) {
    auto now = Clock::now();
    double dt = std::chrono::duration<double>(now - previous).count();  // seconds
    previous = now;

    processInput();
    update(dt);       // every movement inside is "rate × dt"
    render();
}

void update(double dt) {
    player.x += player.speed * dt;           // speed in units per second
    cooldown -= dt;                          // timers count real seconds
}`}</CodeBlock>

      <H3>{tx(t, "gdLoop_dtLimitsTitle", "Why delta time is not the end of the story")}</H3>
      <p>
        {tx(t, "gdLoop_dtLimitsBody",
          "For constant velocity, x + v·dt is exact at any dt. Most game physics is not constant velocity: gravity changes the velocity every instant, springs pull harder the further they stretch, friction depends on speed. The update then approximates a smooth curve by a sequence of straight steps, and the size of the steps changes the answer. The figure integrates one jump, with the same initial speed and gravity, at five different frame rates.")}
      </p>

      <JumpFigure t={t} />

      <Equation label={tx(t, "gdLoop_eqPeak", "Peak height of a stepped jump")}
        where={[
          [r`v_0`, tx(t, "gdLoop_wV0", "the upward speed when the jump starts (8 m/s in the figure)")],
          [r`g`, tx(t, "gdLoop_wG", "gravity's acceleration (20 m/s² in the figure; many platformers use more than Earth's 9.81 m/s² because it feels snappier)")],
          [r`\tfrac{v_0^2}{2g}`, tx(t, "gdLoop_wExact", "the exact peak: the height where the kinetic energy ½v₀² has all turned into potential energy g·h")],
          [r`\pm\tfrac{v_0\,\Delta t}{2}`, tx(t, "gdLoop_wErr", "the error of the stepping. Explicit Euler (+) moves with the old, larger velocity and overshoots; semi-implicit Euler (−) moves with the new, smaller velocity and undershoots. Both errors grow in proportion to Δt")],
        ]}
        note={tx(t, "gdLoop_eqPeakNote", "With v₀ = 8 and Δt = 1/10 s the error is 0.4 m, a quarter of the jump. At 1/144 s it is 2.8 cm. The error never disappears, it just shrinks with the step, so a game whose step depends on the frame rate has jump heights that depend on the frame rate.")}>
        {r`h_{\text{peak}} \approx \frac{v_0^2}{2g} \pm \frac{v_0\,\Delta t}{2}`}
      </Equation>
      <p>
        {tx(t, "gdLoop_dtProblems",
          "So a variable dt brings three problems. The results depend on the frame rate: players on fast machines jump differently, and speedrunners find tricks that only work at 30 FPS. The simulation is not reproducible: the same inputs give different outcomes, which breaks replays, lockstep multiplayer and bug reports (\"it only happens sometimes\"). And one long frame, when the game loads a file or the OS takes the CPU for 300 ms, produces one gigantic step in which objects fly through walls or springs explode.")}
      </p>

      <H2>{tx(t, "gdLoop_fixedTitle", "The fixed timestep")}</H2>
      <p>
        {tx(t, "gdLoop_fixedBody",
          "The standard solution, popularised by Glenn Fiedler's article \"Fix Your Timestep!\", separates the two clocks. The simulation always advances in steps of exactly the same size h, for example 1/60 s. Rendering happens whenever the display is ready. A variable called the accumulator stores real time that has passed but has not been simulated yet: every frame adds the frame's dt to it, then as many whole steps of h as fit are taken out of it and simulated. Whatever is left, less than one step, waits for the next frame.")}
      </p>
      <CodeBlock lang="cpp" filename="fixed_timestep.cpp" t={t}>{`const double h = 1.0 / 60.0;        // the physics step: never changes
double accumulator = 0.0;
auto previous = Clock::now();

while (running) {
    auto now = Clock::now();
    double frameTime = std::chrono::duration<double>(now - previous).count();
    previous = now;
    frameTime = std::min(frameTime, 0.25);   // see "the spiral of death" below

    accumulator += frameTime;                // real time we owe the simulation
    processInput();

    while (accumulator >= h) {               // pay it back in whole steps
        previousState = currentState;        // keep the last state for interpolation
        simulate(currentState, h);           // always the same h: deterministic
        accumulator -= h;
    }

    double alpha = accumulator / h;          // how far we are into the next step, 0..1
    render(lerp(previousState, currentState, alpha));
}`}</CodeBlock>
      <p>
        {tx(t, "gdLoop_fixedWalk",
          "Follow one frame at 50 FPS with h = 1/30 s. The frame took 20 ms, so the accumulator goes from, say, 10 ms to 30 ms. 30 ms is less than one step (33.3 ms), so the inner loop runs zero times and the 30 ms stays in the accumulator. The next frame adds 20 ms: 50 ms, one step fits, 16.7 ms remain. Over a whole second the inner loop runs exactly 30 times, but unevenly: some frames get one step, some get none. The figure below runs this loop live.")}
      </p>

      <LoopFigure t={t} />

      <H2>{tx(t, "gdLoop_interpTitle", "Interpolating the leftover")}</H2>
      <p>
        {tx(t, "gdLoop_interpBody",
          "In the red lane of the figure, the object is drawn where the last completed step left it. When a frame gets no step, the object does not move on screen; when it gets two, it jumps twice as far. The eye reads this uneven motion as stutter, even though the simulation is perfectly regular. The fix is to draw the object between its last two simulated states, at the fraction of a step the accumulator has already covered.")}
      </p>
      <Equation label={tx(t, "gdLoop_eqAlpha", "State to render")}
        where={[
          [r`S_{\text{prev}},\ S_{\text{curr}}`, tx(t, "gdLoop_wStates", "the states after the second-to-last and the last simulated step. They are exactly h seconds apart")],
          [r`A`, tx(t, "gdLoop_wAcc", "the accumulator after the inner loop: real time already passed but not yet simulated, 0 ≤ A < h")],
          [r`\alpha`, tx(t, "gdLoop_wAlpha", "the blend factor. α = 0 draws the previous state, α = 1 the current one")],
        ]}
        note={tx(t, "gdLoop_eqAlphaNote", "The rendered state is always a little in the past: with interpolation, the screen shows the world as it was exactly h seconds ago (for 60 Hz, 16.7 ms). That delay is constant, so motion is smooth. The alternative, extrapolating forward from S_curr with the velocity, has no delay but guesses wrong whenever something changes direction, so objects poke into walls for a frame.")}>
        {r`S_{\text{render}} = S_{\text{prev}} + \alpha\,(S_{\text{curr}} - S_{\text{prev}}), \qquad \alpha = \frac{A}{h}`}
      </Equation>
      <p>
        {tx(t, "gdLoop_interpWhat",
          "Only what is drawn needs interpolating: positions, rotations (with slerp for quaternions, see the Math track) and the camera. Game logic never reads the interpolated state; it only lives between the simulation and the renderer. Objects that teleport (respawns, portals) should set both states to the new position, otherwise they visibly slide there for one step.")}
      </p>

      <H2>{tx(t, "gdLoop_spiralTitle", "The spiral of death")}</H2>
      <p>
        {tx(t, "gdLoop_spiralBody",
          "Suppose one simulation step costs more real time than it simulates: simulating 16.7 ms of game takes 20 ms of CPU. Then every frame the accumulator grows faster than the inner loop drains it, the next frame needs even more steps, which take even longer, and the game freezes as it tries to catch up forever. The same happens briefly after any long hitch. Two guards stop it: clamp the frame time before adding it (0.25 s in the code above, which means the game runs in slow motion instead of freezing if it falls far behind) and optionally cap the number of steps per frame. Try the hitch button in the figure: the 300 ms frame is clamped to 250 ms, and the loop catches up with several steps in one frame.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "gdLoop_spiralWarn", "The clamp is a safety net, not a fix. If the simulation regularly costs more than h, the game is too slow for the chosen step: simulate less, optimise, or pick a larger h.")}
      </Callout>

      <H2>{tx(t, "gdLoop_whatTitle", "What goes where")}</H2>
      <p>
        {tx(t, "gdLoop_whatBody",
          "Engines expose both clocks. Unity calls them Update (once per rendered frame, variable Time.deltaTime) and FixedUpdate (fixed Time.fixedDeltaTime, 0.02 s by default). Godot has _process and _physics_process. The rule of thumb: anything that affects the outcome of the game goes in the fixed step, anything that only affects how it looks can run per frame.")}
      </p>
      <LessonTable
        headers={[tx(t, "gdLoop_tFixed", "Fixed step (h)"), tx(t, "gdLoop_tFrame", "Per frame (variable dt)")]}
        rows={[
          [tx(t, "gdLoop_r1a", "movement, gravity, forces, collisions"), tx(t, "gdLoop_r1b", "rendering, with interpolation")],
          [tx(t, "gdLoop_r2a", "gameplay timers that decide outcomes (cooldowns, buffs)"), tx(t, "gdLoop_r2b", "camera smoothing, UI animation, tweens")],
          [tx(t, "gdLoop_r3a", "AI decisions, networking ticks"), tx(t, "gdLoop_r3b", "cosmetic particles, animation blending")],
          [tx(t, "gdLoop_r4a", "anything that must replay identically"), tx(t, "gdLoop_r4b", "reading raw input (queue it for the next fixed step)")],
        ]}
      />
      <p>
        {tx(t, "gdLoop_inputBody",
          "Input needs care. If the button state is read once per frame but used in the fixed step, a quick tap can land in a frame with zero steps and be lost, or in a frame with two steps and be applied twice. Record \"pressed this frame\" events and let the next fixed step consume them.")}
      </p>

      <H3>{tx(t, "gdLoop_hTitle", "Choosing h")}</H3>
      <p>
        {tx(t, "gdLoop_hBody",
          "Smaller steps are more accurate and handle faster objects, but cost more CPU. 60 Hz is the usual default. Racing games and fighting games often use 120 Hz or more for precise contacts; strategy games and MMOs with thousands of units may use 10–30 Hz and interpolate heavily. A step that divides the display rate evenly (60 Hz physics on a 60 Hz screen) gives exactly one step per frame most of the time, but interpolation makes any combination look smooth.")}
      </p>

      <H2>{tx(t, "gdLoop_pitTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "gdLoop_tSym", "Symptom"), tx(t, "gdLoop_tCause", "Cause"), tx(t, "gdLoop_tFix", "Fix")]}
        rows={[
          [tx(t, "gdLoop_b1", "Game speed changes with the monitor"), tx(t, "gdLoop_c1", "movement in units per frame"), tx(t, "gdLoop_f1", "multiply every rate by dt (or use a fixed step)")],
          [tx(t, "gdLoop_b2", "Jumps or physics differ between machines"), tx(t, "gdLoop_c2", "physics integrated with a variable dt"), tx(t, "gdLoop_f2", "fixed timestep with accumulator")],
          [tx(t, "gdLoop_b3", "Smooth FPS counter, jittery motion"), tx(t, "gdLoop_c3", "fixed step rendered without interpolation"), tx(t, "gdLoop_f3", "keep the previous state and blend by α")],
          [tx(t, "gdLoop_b4", "Freeze after loading, then everything fast-forwards"), tx(t, "gdLoop_c4", "one enormous frame time fed to the accumulator"), tx(t, "gdLoop_f4", "clamp frameTime; reset the clock after loading")],
          [tx(t, "gdLoop_b5", "Double jumps / missed taps"), tx(t, "gdLoop_c5", "per-frame input read inside the fixed step"), tx(t, "gdLoop_f5", "queue input events; consume them once per step")],
          [tx(t, "gdLoop_b6", "Time drifts after hours of play"), tx(t, "gdLoop_c6", "float accumulator or float total time losing precision"), tx(t, "gdLoop_f6", "use double, or count steps as an integer tick number")],
        ]}
      />

      <H2>{tx(t, "gdLoop_trackTitle", "How this track is organised")}</H2>
      <p>
        {tx(t, "gdLoop_trackBody",
          "This track collects the techniques that sit between \"I can draw a triangle\" and \"I shipped a game\": the maths of motion and feel, procedural generation, collision detection, physics, AI and the programming patterns that keep a growing codebase manageable. Each chapter explains the idea, derives the formulas term by term, lets you play with it in an interactive figure, and ends with C++ code you can drop into an engine.")}
      </p>
      <LessonTable
        headers={[tx(t, "gdLoop_tSection", "Section"), tx(t, "gdLoop_tTopics", "Topics")]}
        rows={[
          [tx(t, "gdLoop_s1", "Core Loop & Time"), tx(t, "gdLoop_s1t", "the game loop, delta time, fixed timestep, interpolation")],
          [tx(t, "gdLoop_s2", "Motion & Game Feel"), tx(t, "gdLoop_s2t", "lerp, easing, tweens, frame-rate independent smoothing, springs, screen shake")],
          [tx(t, "gdLoop_s3", "Procedural Generation"), tx(t, "gdLoop_s3t", "PRNGs, seeds, hashing, distributions, Poisson disk, Perlin noise, fBm terrain")],
          [tx(t, "gdLoop_s4", "Collision Detection"), tx(t, "gdLoop_s4t", "circles, AABBs, MTV, tunnelling and swept tests, the Separating Axis Theorem")],
          [tx(t, "gdLoop_s5", "Architecture & Patterns"), tx(t, "gdLoop_s5t", "object pools, free lists, generational handles")],
          [tx(t, "gdLoop_s6", "Coming next"), tx(t, "gdLoop_s6t", "physics (integrators, rigid bodies, impulses, Verlet ropes), broad phase (spatial hash, quadtree), pathfinding (A*, flow fields), steering and flocking, state machines and behaviour trees, ECS, clean code for games, cellular automata and wave function collapse")],
        ]}
      />

      <KeyIdeas t={t} id="gdLoop" items={[
        "A game is a loop: input → update → render, once per frame.",
        "Rates are per second; multiply them by dt so speed does not depend on FPS.",
        "Integrated physics still depends on dt: a fixed step h makes it identical on every machine.",
        "The accumulator stores unsimulated time; the inner loop pays it back in whole steps.",
        "Render lerp(previous, current, α = accumulator / h) to hide uneven step counts.",
        "Clamp the frame time so a long hitch cannot start the spiral of death.",
      ]} />
    </Article>
  );
}
