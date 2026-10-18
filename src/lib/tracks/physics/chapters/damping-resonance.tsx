"use client";

// Oscillations & Waves 2: damping and resonance — the drag force −b v, the
// damped equation and its trial solution e^(rt), the three regimes
// (under, critical, over), the decay rate γ and the quality factor Q; driven
// oscillations: steady state at the driver's frequency, the amplitude and
// phase curves, the energy balance at resonance, the width of the peak, and
// resonance in the world (swings, radios, bridges, tuned mass dampers, and
// why Tacoma Narrows was not simple resonance).

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { DampingFigure } from "@/components/lesson/figures/physics/DampingFigure";
import { ResonanceFigure } from "@/components/lesson/figures/physics/ResonanceFigure";

const r = String.raw;
const num = (v: number, d = 1) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** How long a lightly damped oscillator rings: τ = 1/γ = 2Q/ω₀ = Q/(π f). */
const ringNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const tau = v.Q / (Math.PI * v.f), t60 = Math.log(1000) * tau;
  return {
    tex: r`\tau = \frac{Q}{\pi f} = \frac{${num(v.Q, 0)}}{\pi \times ${num(v.f, 0)}} = \amber{${num(tau, tau < 0.1 ? 4 : 2)}\ \text{s}}`,
    meter: Math.min(1, t60 / 20), meterLabel: `${tx(t, "phDamp_liveFade", "fades to a thousandth of its amplitude in")} ${num(t60, t60 < 1 ? 3 : 1)} s`,
  };
};

export function DampingResonanceContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "phDamp_intro",
          "The oscillators of the last chapter swing for ever. Real ones do not: a plucked string falls silent, a swing left alone comes to rest. Friction drains their energy. And real oscillators are rarely left alone: a child pumps a swing, the road shakes a car, the wind pushes a bridge. This chapter adds both effects. Together they explain why car suspensions are built the way they are, how a radio picks one station out of hundreds, and how a small push, given at the right rhythm, can build an enormous swing.")}
      </Lead>

      <Goals t={t} id="phDamp" items={[
        "Write the equation of a damped oscillator and recognise its three kinds of motion.",
        "Use the decay rate γ and the quality factor Q to say how fast an oscillation dies.",
        "Explain resonance: why a small periodic push builds a large swing, and what limits it.",
        "Read the amplitude and phase of a driven oscillator against the driving frequency.",
      ]} />

      <H2>{tx(t, "phDamp_dragTitle", "Friction that drains the energy")}</H2>
      <p>
        {tx(t, "phDamp_dragBody",
          "Put the block and spring in oil, or attach a damper to it: a piston that has to push oil through a small hole. The oil pushes back against the motion, and at modest speeds that force is proportional to the velocity, F = −b v, like the drag on a slow object in the forces chapter. The constant b, the damping coefficient, measures how thick the oil is (unit kg/s, so that b v is in newtons). Adding it to Newton's second law gives the equation of the damped oscillator.")}
      </p>
      <Equation label={tx(t, "phDamp_eqDamped", "The damped oscillator")}
        where={[
          [r`m`, tx(t, "phDamp_wM", "the mass (kg)")],
          [r`b`, tx(t, "phDamp_wB", "the damping coefficient (kg/s)")],
          [r`k`, tx(t, "phDamp_wK", "the spring constant (N/m)")],
          [r`\frac{dx}{dt},\ \frac{d^2x}{dt^2}`, tx(t, "phDamp_wD", "the velocity v and the acceleration a")],
        ]}
        words={tx(t, "phDamp_eqWords", "Mass times acceleration equals the spring's pull back plus the damper's drag against the motion.")}>
        {r`m\, \frac{d^2 x}{dt^2} = -k x - b\, \frac{dx}{dt}`}
      </Equation>
      <p>
        {tx(t, "phDamp_solBody",
          "Without b the answer was a cosine. With b, a good guess is an exponential, x = e^(rt), because the derivatives of an exponential are the same exponential times r. (The differential equations chapter of the Math track explains this method.) Substituting turns the equation into ordinary algebra.")}
      </p>
      <Derivation t={t} label={tx(t, "phDamp_eqChar", "Solving the damped oscillator")}
        steps={[
          { tex: r`x = e^{r t} \;\Rightarrow\; \frac{dx}{dt} = r\, e^{r t},\quad \frac{d^2x}{dt^2} = r^2 e^{r t}`, why: tx(t, "phDamp_s1", "each derivative of e^(rt) brings down one factor r") },
          { tex: r`m r^2 + b r + k = 0`, why: tx(t, "phDamp_s2", "substitute and divide by e^(rt), which is never zero") },
          { tex: r`r = -\gamma \pm \sqrt{\gamma^2 - \omega_0^2}, \qquad \gamma = \frac{b}{2m},\ \ \omega_0 = \sqrt{\frac{k}{m}}`, why: tx(t, "phDamp_s3", "the quadratic formula, written with the decay rate γ and the undamped angular frequency ω₀") },
          { tex: r`\green{\gamma < \omega_0:\ \ x = A\, e^{-\gamma t} \cos(\omega_d t + \varphi),\quad \omega_d = \sqrt{\omega_0^2 - \gamma^2}}`, why: tx(t, "phDamp_s4", "when the square root is of a negative number, the two roots combine into an oscillation inside a shrinking exponential") },
        ]} />
      <p>
        {tx(t, "phDamp_solBody2",
          "Read the light-damping answer piece by piece. The cosine is the oscillation, at the slightly lower angular frequency ω_d. The factor e^(−γt) is the envelope: every 1/γ seconds it shrinks to 1/e ≈ 37% of what it was (e = 2.718… is the base of natural exponentials). The energy goes as the square of the amplitude, so it decays twice as fast, as e^(−2γt). Where does it go? Into heat in the oil.")}
      </p>

      <H3>{tx(t, "phDamp_regTitle", "Three ways to come to rest")}</H3>
      <p>
        {tx(t, "phDamp_regBody",
          "The sign under the square root, γ² − ω₀², decides what kind of motion you get.")}
      </p>
      <LessonTable
        headers={[tx(t, "phDamp_tCase", "Case"), tx(t, "phDamp_tCond", "Condition"), tx(t, "phDamp_tMotion", "Motion"), tx(t, "phDamp_tWhere", "Where you meet it")]}
        rows={[
          [tx(t, "phDamp_c1", "underdamped"), "γ < ω₀", tx(t, "phDamp_c1m", "oscillates while the swings shrink"), tx(t, "phDamp_c1e", "a plucked string, a bell, a swing")],
          [tx(t, "phDamp_c2", "critically damped"), "γ = ω₀, b = 2√(k m)", tx(t, "phDamp_c2m", "returns as fast as possible without overshooting"), tx(t, "phDamp_c2e", "car shock absorbers, the needle of a meter")],
          [tx(t, "phDamp_c3", "overdamped"), "γ > ω₀", tx(t, "phDamp_c3m", "creeps back slowly, never crossing zero"), tx(t, "phDamp_c3e", "a door closer, a spoon sinking in honey")],
        ]}
      />
      <DampingFigure t={t} />
      <p>
        {tx(t, "phDamp_carBody",
          "A car is the classic case. Its body (say 1 000 kg) sits on springs with a total stiffness of about 40 000 N/m, so ω₀ = √40 = 6.3 rad/s, about one bounce per second. Without shock absorbers it would keep bouncing after every bump. Critical damping would need b = 2√(k m) = 12 600 kg/s. Real cars are tuned a little below that, slightly underdamped, which feels less harsh while still killing the bounce in about one cycle.")}
      </p>

      <H3>{tx(t, "phDamp_qTitle", "The quality factor")}</H3>
      <p>
        {tx(t, "phDamp_qBody",
          "For lightly damped oscillators, one number says how good they are at keeping going: the quality factor Q = ω₀ / 2γ. A high Q means little damping. A handy rule: after Q cycles the amplitude has fallen to e^(−π) ≈ 4% of where it started. Another view: Q is 2π times the energy stored divided by the energy lost in one cycle.")}
      </p>
      <LessonTable
        headers={[tx(t, "phDamp_tOsc", "Oscillator"), tx(t, "phDamp_tQ", "Q, roughly")]}
        rows={[
          [tx(t, "phDamp_o1", "car suspension (critically damped)"), "0.5"],
          [tx(t, "phDamp_o2", "a guitar string"), tx(t, "phDamp_o2q", "hundreds to a few thousand")],
          [tx(t, "phDamp_o3", "a steel tuning fork"), tx(t, "phDamp_o3q", "about a thousand or more")],
          [tx(t, "phDamp_o4", "a good pendulum clock"), tx(t, "phDamp_o4q", "about ten thousand")],
          [tx(t, "phDamp_o5", "the quartz crystal in a watch"), tx(t, "phDamp_o5q", "tens of thousands")],
        ]}
      />
      <LiveFormula label={tx(t, "phDamp_liveRing", "Try it: how long does it ring?")}
        tex={r`\tau = \frac{1}{\gamma} = \frac{2Q}{\omega_0} = \frac{Q}{\pi f}`}
        vars={[
          { id: "f", label: "f (Hz)", min: 1, max: 2000, step: 1, value: 440, fmt: v => `${num(v, 0)} Hz` },
          { id: "Q", label: "Q", min: 1, max: 10000, step: 1, value: 1000, fmt: v => num(v, 0) },
        ]}
        compute={ringNumbers(t)}
        note={tx(t, "phDamp_liveRingNote", "τ is the time for the amplitude to fall to 37%. A 440 Hz tuning fork with Q = 1 000 has τ = 0.72 s and is inaudible after about 5 s. The same Q at a lower frequency rings longer, because Q counts cycles, not seconds.")} />

      <H2>{tx(t, "phDamp_drivenTitle", "Driven oscillations")}</H2>
      <p>
        {tx(t, "phDamp_drivenBody",
          "Now push the block with a periodic force F₀ cos ωt, at an angular frequency ω that you choose. At first the motion is a mess: the block's own oscillation at ω_d mixes with the push. But that natural part is damped and dies out. What is left, the steady state, is an oscillation at the driver's frequency ω, not the block's own. Its amplitude depends strongly on how ω compares with ω₀.")}
      </p>
      <Equation label={tx(t, "phDamp_eqSteady", "The steady amplitude of a driven oscillator")}
        where={[
          [r`A(\omega)`, tx(t, "phDamp_wAw", "the amplitude once the start-up has died away (m)")],
          [r`F_0`, tx(t, "phDamp_wF0", "the size of the periodic push (N)")],
          [r`\omega`, tx(t, "phDamp_wW", "the driving angular frequency (rad/s)")],
          [r`\omega_0`, tx(t, "phDamp_wW0", "the natural angular frequency √(k/m)")],
          [r`\gamma`, tx(t, "phDamp_wG", "the decay rate b/2m (1/s)")],
          [r`\delta`, tx(t, "phDamp_wDelta", "the phase lag: how far the motion trails behind the push")],
        ]}
        note={tx(t, "phDamp_steadyNote", "Both formulas come from putting x = A cos(ωt − δ) into m a = −k x − b v + F₀ cos ωt and matching the cosine and sine parts. The denominator is smallest when ω = ω₀: that is resonance.")}>
        {r`A(\omega) = \frac{F_0 / m}{\sqrt{(\omega_0^2 - \omega^2)^2 + (2\gamma\omega)^2}} \qquad \tan\delta = \frac{2\gamma\omega}{\omega_0^2 - \omega^2}`}
      </Equation>
      <LessonTable
        headers={[tx(t, "phDamp_tDrive", "Driving"), tx(t, "phDamp_tAmp", "Amplitude"), tx(t, "phDamp_tLag", "Lag δ"), tx(t, "phDamp_tFeel", "What happens")]}
        rows={[
          ["ω ≪ ω₀", "≈ F₀ / k", "≈ 0°", tx(t, "phDamp_d1", "slow pushes: the spring simply follows the force, as if it were held")],
          ["ω = ω₀", "F₀ / (b ω₀) = Q · F₀/k", "90°", tx(t, "phDamp_d2", "resonance: the push is in step with the velocity and feeds energy every cycle")],
          ["ω ≫ ω₀", "≈ F₀ / (m ω²)", "≈ 180°", tx(t, "phDamp_d3", "fast pushes: inertia wins, the block barely moves and swings against the force")],
        ]}
      />
      <ResonanceFigure t={t} />

      <H3>{tx(t, "phDamp_whyTitle", "Why resonance builds up, and what stops it")}</H3>
      <p>
        {tx(t, "phDamp_whyBody",
          "Think of pushing a child on a swing. Push each time the swing moves away from you and every push adds energy. Push at a random moment and you sometimes help, sometimes brake. At resonance the lag is 90°, which means the force is largest exactly when the velocity is largest and in the same direction: the power F · v is never negative, and every cycle adds energy. The amplitude grows until the energy the damper takes out each cycle matches what the push puts in.")}
      </p>
      <Derivation t={t} label={tx(t, "phDamp_eqBalance", "The amplitude at resonance, from an energy balance")}
        steps={[
          { tex: r`x = A \sin\omega_0 t,\quad v = A\,\omega_0 \cos\omega_0 t,\quad F = F_0 \cos\omega_0 t`, why: tx(t, "phDamp_b1", "at resonance the motion lags the force by 90°, so the velocity is exactly in step with it") },
          { tex: r`\overline{P_{in}} = \overline{F\,v} = F_0 A\, \omega_0\, \overline{\cos^2} = \tfrac12 F_0 A\, \omega_0`, why: tx(t, "phDamp_b2", "average power put in; the average of cos² over a cycle is ½") },
          { tex: r`\overline{P_{out}} = \overline{b\, v^2} = \tfrac12\, b\, A^2 \omega_0^2`, why: tx(t, "phDamp_b3", "average power the damper turns into heat: force b v times speed v") },
          { tex: r`\green{A = \frac{F_0}{b\, \omega_0} = Q\, \frac{F_0}{k}}`, why: tx(t, "phDamp_b4", "set them equal; since F₀/k is the stretch the force would give if held still, the resonant amplitude is Q times that") },
        ]} />
      <p>
        {tx(t, "phDamp_whyBody2",
          "So a high-Q oscillator responds hugely, but only near its own frequency: the peak's width is about Δω ≈ 2γ = ω₀/Q. A radio receiver uses exactly this. Its tuning circuit (an electrical oscillator, coming in the electricity chapters) has a high Q, so it responds strongly to one station's frequency and hardly at all to the others. In the figure, with b = 0.6 kg/s the system has Q = 7.5: a 2 N push that would stretch the spring by 10 cm if held still swings it by 75 cm.")}
      </p>

      <H2>{tx(t, "phDamp_worldTitle", "Resonance in the world")}</H2>
      <LessonTable
        headers={[tx(t, "phDamp_tEx", "Example"), tx(t, "phDamp_tWhat", "What resonates")]}
        rows={[
          [tx(t, "phDamp_w1", "pumping a swing"), tx(t, "phDamp_w1m", "the swing as a pendulum; you push once per cycle")],
          [tx(t, "phDamp_w2", "tuning a radio"), tx(t, "phDamp_w2m", "an electrical oscillator matched to one station")],
          [tx(t, "phDamp_w3", "musical instruments"), tx(t, "phDamp_w3m", "the body of a guitar or violin resonates with the strings and makes them loud")],
          [tx(t, "phDamp_w4", "a singer breaking a wine glass"), tx(t, "phDamp_w4m", "the glass rings at one pitch with a high Q; a loud note held at exactly that pitch builds it up")],
          [tx(t, "phDamp_w5", "soldiers breaking step on bridges"), tx(t, "phDamp_w5m", "marching feet are a periodic push; the Broughton bridge near Manchester collapsed under marching soldiers in 1831")],
          [tx(t, "phDamp_w6", "London's Millennium Bridge, 2000"), tx(t, "phDamp_w6m", "a sideways sway near 1 Hz; walkers fell into step with it and pushed it further; dampers fixed it")],
        ]}
      />
      <p>
        {tx(t, "phDamp_tmdBody",
          "Engineers fight unwanted resonance by adding damping, or with a tuned mass damper: a second oscillator tuned to the same frequency, which swings against the building and soaks up its motion. Taipei 101 hangs a 660-tonne steel ball as a pendulum near its top for exactly that purpose.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "phDamp_tacoma", "The Tacoma Narrows bridge, which twisted itself apart in a steady 64 km/h wind in 1940, is often shown as an example of resonance. It was not simple resonance: a steady wind is not a periodic push. It was flutter, a self-excited oscillation: the twisting of the deck changed how the wind pushed on it, in a way that fed energy into the twist, a little like negative damping. Modern bridge decks are shaped and tested in wind tunnels to avoid it.")}
      </Callout>

      <H2>{tx(t, "phDamp_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "phDamp_ex1", "1. A 0.2 kg mass on an 80 N/m spring, with b = 0.4 kg/s. ω₀ = √400 = 20 rad/s, γ = 0.4/0.4 = 1 /s, so it is lightly damped: ω_d = √(400 − 1) = 19.97 rad/s, almost the same. Q = 20/2 = 10. The amplitude halves every ln 2/γ = 0.69 s.")}</p>
      <p>{tx(t, "phDamp_ex2", "2. For the same spring and mass, what b gives critical damping? b = 2√(k m) = 2√16 = 8 kg/s, twenty times the oil above.")}</p>
      <p>{tx(t, "phDamp_ex3", "3. Push that oscillator with F₀ = 0.5 N at ω = 20 rad/s. Held still, 0.5 N stretches the spring by 0.5/80 = 6.25 mm. At resonance A = Q × 6.25 mm = 6.25 cm. At ω = 10 rad/s instead, A = (0.5/0.2)/√((400 − 100)² + (2 × 10)²) = 2.5/300.7 = 8.3 mm, barely more than the static stretch.")}</p>
      <p>{tx(t, "phDamp_ex4", "4. A playground swing is a pendulum about 2.5 m long, so T = 2π√(2.5/9.81) = 3.2 s. To build up the swing, push once every 3.2 s, as it starts to move away from you.")}</p>
      <p>{tx(t, "phDamp_ex5", "5. A bell rings at 500 Hz and is still faintly audible after 10 s, having fallen to about a thousandth of its amplitude. ln 1000 = 6.9, so τ = 10/6.9 = 1.45 s and Q = π f τ ≈ 2 300.")}</p>

      <H2>{tx(t, "phDamp_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "phDamp_tWrong", "Wrong"), tx(t, "phDamp_tRight", "Right"), tx(t, "phDamp_tWhy", "Why")]}
        rows={[
          [tx(t, "phDamp_m1w", "resonance needs a big force"), tx(t, "phDamp_m1r", "it needs the right timing"), tx(t, "phDamp_m1", "a small push at ω₀ adds energy every cycle")],
          [tx(t, "phDamp_m2w", "a driven oscillator swings at its own frequency"), tx(t, "phDamp_m2r", "at the driver's frequency, once steady"), tx(t, "phDamp_m2", "its own motion is the part that dies away")],
          [tx(t, "phDamp_m3w", "more damping always settles faster"), tx(t, "phDamp_m3r", "critical damping is the fastest"), tx(t, "phDamp_m3", "an overdamped system creeps back slowly")],
          [tx(t, "phDamp_m4w", "at resonance the amplitude is infinite"), tx(t, "phDamp_m4r", "A = F₀ / (b ω₀)"), tx(t, "phDamp_m4", "damping limits it; only b = 0 gives unlimited growth")],
          [tx(t, "phDamp_m5w", "damping changes the period a lot"), tx(t, "phDamp_m5r", "ω_d ≈ ω₀ when damping is light"), tx(t, "phDamp_m5", "ω_d = √(ω₀² − γ²) and γ is small")],
          [tx(t, "phDamp_m6w", "Tacoma Narrows was simple resonance"), tx(t, "phDamp_m6r", "it was flutter"), tx(t, "phDamp_m6", "a steady wind is not a periodic push")],
        ]}
      />

      <KeyIdeas t={t} id="phDamp" items={[
        "Damping adds a force −b v; the damped oscillator obeys m a = −k x − b v.",
        "Light damping gives x = A e^(−γt) cos(ω_d t + φ) with γ = b/2m: the swings shrink by 1/e every 1/γ seconds.",
        "Critical damping, b = 2√(k m), returns fastest without overshooting; more damping is slower.",
        "The quality factor Q = ω₀/2γ counts how long an oscillator keeps going: about Q cycles to fall to 4%.",
        "A driven oscillator settles at the driver's frequency; its amplitude peaks at ω = ω₀, where it is Q times the static stretch.",
        "At resonance the push stays in step with the velocity, feeding energy each cycle until damping balances it.",
      ]} />
    </Article>
  );
}
