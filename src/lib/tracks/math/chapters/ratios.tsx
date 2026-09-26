"use client";

// Arithmetic 4: ratios, rates and proportion (direct and inverse), percent,
// percentage change and why successive changes multiply, and the fraction-of-
// the-way idea behind lerp, inverse lerp and remapping.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { RatioFigure } from "@/components/lesson/figures/math/RatioFigure";

const r = String.raw;

export function RatiosContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mRat_intro",
          "A fraction answers \"how much of a whole?\". A ratio answers \"how much of one thing for each amount of another?\": pixels per metre, damage per second, width per height. Percentages are ratios with 100 as the reference, and the fraction-of-the-way idea behind them is the same one behind lerp, progress bars, health bars and every remapping of one range onto another. This chapter covers them together because they are one idea seen from different sides.")}
      </Lead>

      <H2>{tx(t, "mRat_ratioTitle", "Ratios")}</H2>
      <p>
        {tx(t, "mRat_ratioBody",
          "A ratio compares two amounts by division. If a level has 12 enemies and 4 health packs, the ratio of enemies to packs is 12 : 4, read \"12 to 4\", and it means 12/4 = 3 enemies for every pack. Like a fraction, a ratio can be simplified by dividing both sides by the same number (12 : 4 = 3 : 1) without changing what it says. The order matters: packs to enemies is 4 : 12 = 1 : 3.")}
      </p>
      <Equation label={tx(t, "mRat_eqRatio", "A ratio and the shares it makes")}
        where={[
          [r`a : b`, tx(t, "mRat_wRatio", "the ratio of a to b; its value is a/b")],
          [r`\tfrac{a}{a + b}`, tx(t, "mRat_wShare", "the share of the total that is a. A ratio a : b splits a whole into a + b equal parts, a of them on one side")],
        ]}
        note={tx(t, "mRat_eqRatioNote", "Example: loot split 3 : 2 between two players, 100 gold in total. There are 3 + 2 = 5 parts of 100/5 = 20 gold, so the players get 60 and 40. A common error is to treat 3 : 2 as 3/2 of the total; the shares are 3/5 and 2/5.")}>
        {r`a : b = \frac{a}{b} \qquad \text{share of } a = \frac{a}{a + b}`}
      </Equation>
      <p>
        {tx(t, "mRat_aspect",
          "Screens and textures are described by aspect ratios, width : height. 1920 × 1080 has ratio 1920 : 1080; the gcd of the two numbers is 120, so it simplifies to 16 : 9, about 1.78 (a screen 1.78 times as wide as it is tall). 1280 × 720 is also 16 : 9, which is why it scales to 1920 × 1080 without distortion: both sides are multiplied by the same factor, 1.5. A projection matrix needs this number, and getting it wrong squashes every circle into an ellipse.")}
      </p>

      <H2>{tx(t, "mRat_rateTitle", "Rates and units")}</H2>
      <p>
        {tx(t, "mRat_rateBody",
          "A rate is a ratio between quantities with different units: 300 metres in 60 seconds is a speed of 300/60 = 5 metres per second (m/s). \"Per\" means \"divided by\". A unit rate is a rate for one unit of the second quantity, which is what makes rates comparable: 5 m/s is faster than 280 m in 60 s = 4.67 m/s. Units behave like numbers in fractions: they multiply and cancel. Speed × time = (m/s) × s = m, a distance.")}
      </p>
      <Equation label={tx(t, "mRat_eqRate", "Units cancel like factors")}
        where={[
          [r`v`, tx(t, "mRat_wV", "a speed in metres per second")],
          [r`\Delta t`, tx(t, "mRat_wDt", "the time a frame takes, in seconds (Δ, the Greek letter delta, means \"change in\")")],
          [r`\Delta x`, tx(t, "mRat_wDx", "how far to move this frame, in metres")],
        ]}
        note={tx(t, "mRat_eqRateNote", "This is why games multiply speeds by the frame time. Moving 5 units per frame is a rate in units per frame, and it makes the game twice as fast at 120 FPS as at 60. Moving 5 × Δt per frame is a rate in units per second: at 60 FPS Δt = 1/60 and each frame moves 1/12 unit; at 120 FPS each frame moves half that, and after one second both have moved exactly 5. Checking that the units of a formula come out right catches many bugs before they run.")}>
        {r`\Delta x = v \cdot \Delta t \qquad \frac{\text{m}}{\text{s}} \cdot \text{s} = \text{m}`}
      </Equation>

      <H2>{tx(t, "mRat_propTitle", "Proportion")}</H2>
      <p>
        {tx(t, "mRat_propBody",
          "Two quantities are directly proportional when their ratio stays the same: double one and the other doubles. The cost of arrows at 3 gold each is proportional to how many you buy. A proportion is an equation saying two ratios are equal, and when one of the four numbers is unknown, cross-multiplication finds it. Quantities are inversely proportional when their product stays the same: double one and the other halves. The time to cross a room is inversely proportional to your speed; frame time is inversely proportional to frame rate.")}
      </p>
      <Equation label={tx(t, "mRat_eqProp", "Direct and inverse proportion")}
        where={[
          [r`k`, tx(t, "mRat_wK", "the constant of proportionality: the unit rate (gold per arrow), or the fixed product (distance = speed × time)")],
          [r`y = k\,x`, tx(t, "mRat_wDirect", "direct: y/x = k is constant; the graph is a straight line through the origin")],
          [r`y = k / x`, tx(t, "mRat_wInverse", "inverse: x · y = k is constant; as x grows, y shrinks toward 0 but never reaches it")],
        ]}
        note={tx(t, "mRat_eqPropNote", "Solving a proportion: 3 potions cost 45 gold; what do 7 cost? 3/45 = 7/x, and cross-multiplying gives 3x = 45 · 7 = 315, so x = 105. Or find the unit rate first, 45/3 = 15 gold each, then 7 × 15 = 105: the same thing in two steps. Inverse: at 60 FPS a frame lasts 1000/60 ≈ 16.7 ms; at 144 FPS it lasts 1000/144 ≈ 6.9 ms, because FPS × frame time = 1000 ms.")}>
        {r`\frac{a}{b} = \frac{c}{x} \;\Rightarrow\; x = \frac{b\,c}{a} \qquad y = k\,x \qquad y = \frac{k}{x}`}
      </Equation>

      <H2>{tx(t, "mRat_pctTitle", "Percent")}</H2>
      <p>
        {tx(t, "mRat_pctBody",
          "Percent means \"per hundred\". 35 % is the ratio 35 : 100, the fraction 35/100 and the decimal 0.35: three names for one number. Choosing 100 as the common reference makes quantities easy to compare, whatever their original size. In calculations always convert to the decimal first: divide by 100, which moves the point two places left.")}
      </p>
      <Equation label={tx(t, "mRat_eqPct", "The three percentage questions")}
        where={[
          [r`p`, tx(t, "mRat_wP", "the percentage as a decimal: 35 % → p = 0.35, 150 % → p = 1.5, 0.5 % → p = 0.005")],
          [r`W`, tx(t, "mRat_wW", "the whole, the reference amount that counts as 100 %")],
          [r`P`, tx(t, "mRat_wPart", "the part, the amount that is p of the whole")],
        ]}
        notes={[
          tx(t, "mRat_q1", "part: what is 35 % of 80? P = 0.35 × 80 = 28"),
          tx(t, "mRat_q2", "percentage: 28 is what percent of 80? p = 28/80 = 0.35 = 35 %"),
          tx(t, "mRat_q3", "whole: 28 is 35 % of what? W = 28/0.35 = 80"),
        ]}>
        {r`P = p \cdot W \qquad p = \frac{P}{W} \qquad W = \frac{P}{p}`}
      </Equation>

      <H3>{tx(t, "mRat_chgTitle", "Percentage change")}</H3>
      <p>
        {tx(t, "mRat_chgBody",
          "An increase of p percent adds p of the original amount, so the new amount is old + p · old = old × (1 + p). A decrease uses a negative p: 20 % off is × (1 − 0.2) = × 0.8. The change as a percentage is always measured against the old value. Because each change multiplies, two changes in a row multiply too, and percentages do not simply add: +50 % then −50 % is × 1.5 × 0.5 = × 0.75, a 25 % loss. The second percentage is taken of a different, already changed, amount.")}
      </p>
      <Equation label={tx(t, "mRat_eqChange", "Changes multiply")}
        where={[
          [r`1 + p`, tx(t, "mRat_wFactor", "the growth factor of a change p: 1.2 for +20 %, 0.8 for −20 %")],
          [r`\frac{\text{new} - \text{old}}{\text{old}}`, tx(t, "mRat_wRel", "the relative change: the difference as a fraction of where you started")],
        ]}
        note={tx(t, "mRat_eqChangeNote", "Undoing a change needs the reciprocal factor, not the opposite percentage: after −20 % (× 0.8), getting back needs × 1/0.8 = × 1.25, a 25 % increase. Also distinguish percentages from percentage points: a hit chance going from 10 % to 15 % is up 5 percentage points, but up 50 % relative to where it was.")}>
        {r`\text{new} = \text{old}\,(1 + p_1)(1 + p_2) \qquad \text{change} = \frac{\text{new} - \text{old}}{\text{old}}`}
      </Equation>

      <RatioFigure t={t} />

      <H2>{tx(t, "mRat_lerpTitle", "Fraction of the way: lerp and remap")}</H2>
      <p>
        {tx(t, "mRat_lerpBody",
          "The most used ratio in game code is \"what fraction of the way from a to b are we?\". Write it t: 0 at a, 1 at b, 0.5 halfway, which is exactly a percentage written as a decimal. Going forward, from t to a position, is linear interpolation, lerp. Going backward, from a position to t, is inverse lerp. Chaining them maps any range onto any other: a distance onto a volume, a health value onto a bar width, a temperature onto a colour.")}
      </p>
      <Equation label={tx(t, "mRat_eqLerp", "Lerp, inverse lerp and remap")}
        where={[
          [r`a, b`, tx(t, "mRat_wAB", "the input range. b − a is its length")],
          [r`t`, tx(t, "mRat_wT", "the fraction of the way from a to b. x − a is how far x has come from a; dividing by the whole length b − a turns that into a fraction")],
          [r`c, d`, tx(t, "mRat_wCD", "the output range. The ranges may point in opposite directions (c > d), which flips the mapping")],
        ]}
        note={tx(t, "mRat_eqLerpNote", "Example: health 30 out of 120, drawn as a bar 200 pixels wide. t = (30 − 0)/(120 − 0) = 0.25, and the bar width is 0 + 0.25 × (200 − 0) = 50 px. Values outside [a, b] give t outside [0, 1] and extrapolate; clamp t when that is not wanted. If a = b the range has no length and inverse lerp divides by zero: guard it.")}>
        {r`t = \frac{x - a}{b - a} \qquad \operatorname{lerp}(c, d, t) = c + t\,(d - c) \qquad y = c + \frac{x - a}{b - a}(d - c)`}
      </Equation>
      <CodeBlock lang="cpp" filename="ratio.hpp" t={t}>{`#include <algorithm>   // std::min, std::clamp

float lerp(float a, float b, float t)       { return a + t * (b - a); }
float invLerp(float a, float b, float x)    { return (x - a) / (b - a); }    // a != b
float remap(float a, float b, float c, float d, float x) {
    float t = std::clamp(invLerp(a, b, x), 0.f, 1.f);   // drop the clamp to extrapolate
    return lerp(c, d, t);
}

float applyPercent(float v, float pct)      { return v * (1.f + pct / 100.f); }  // +20 → ×1.2
float percentChange(float from, float to)   { return (to - from) / from * 100.f; }

// Fit a picture into a screen without distortion: one scale for both axes
float fitScale(float picW, float picH, float scrW, float scrH) {
    return std::min(scrW / picW, scrH / picH);          // max(...) fills the screen and crops instead
}

float volume = remap(2.f, 10.f, 1.f, 0.f, distanceToEnemy);   // loud when close, silent far away`}</CodeBlock>

      <H2>{tx(t, "mRat_exTitle", "Worked examples")}</H2>
      <H3>{tx(t, "mRat_ex1T", "Stacking damage reduction")}</H3>
      <p>
        {tx(t, "mRat_ex1",
          "Armour blocks 20 % of damage and a shield blocks 30 %. Blocked percentages do not add up to 50 %: the shield blocks 30 % of what got through the armour. What gets through is multiplied: (1 − 0.2)(1 − 0.3) = 0.8 × 0.7 = 0.56, so 56 % of the damage lands and the total reduction is 44 %. Multiplicative stacking is popular in game design for exactly this reason: no number of reductions ever reaches 100 %.")}
      </p>
      <H3>{tx(t, "mRat_ex2T", "Recovering the original price")}</H3>
      <p>
        {tx(t, "mRat_ex2",
          "An item costs 68 gold after a 15 % discount. The sale price is 0.85 of the original, so the original is 68/0.85 = 80 gold. Adding 15 % back to 68 gives 78.2, which is wrong: the 15 % was taken of 80, not of 68.")}
      </p>
      <H3>{tx(t, "mRat_ex3T", "Scaling a sprite sheet")}</H3>
      <p>
        {tx(t, "mRat_ex3",
          "A 64 × 48 sprite must be displayed 80 pixels wide. The scale factor is 80/64 = 1.25, so the height must be 48 × 1.25 = 60 pixels to keep the ratio 4 : 3. Scaling the height to anything else would stretch the art.")}
      </p>

      <H2>{tx(t, "mRat_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mRat_tWrong", "Wrong"), tx(t, "mRat_tRight", "Right"), tx(t, "mRat_tWhy", "Why")]}
        rows={[
          ["+10 %, −10 % = 0 %", "× 1.1 × 0.9 = −1 %", tx(t, "mRat_m1", "each percentage is of a different amount; factors multiply")],
          ["20 % + 30 % = 50 %", "1 − 0.8 × 0.7 = 44 %", tx(t, "mRat_m2", "the second reduction applies to what is left after the first")],
          ["x += 5; // per frame", "x += 5 * dt;", tx(t, "mRat_m3", "a per-frame rate changes with the frame rate; use a per-second rate times Δt")],
          ["3 : 2 of 100 = 150", "60 and 40", tx(t, "mRat_m4", "a ratio a : b splits the total into a + b parts")],
          ["10 % → 15 % is +5 %", tx(t, "mRat_m5r", "+5 points, +50 %"), tx(t, "mRat_m5", "percentage points are a difference; percent change is relative")],
          [tx(t, "mRat_m6w", "stretch to fill any screen"), "s = min(sw/pw, sh/ph)", tx(t, "mRat_m6", "one scale for both axes keeps the aspect ratio")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "mRat_tip", "When a formula mixes quantities, write the units next to the numbers and check that they cancel into the unit you expect. Metres per second times seconds must give metres; if you get metres per second squared, a Δt is missing or doubled.")}
      </Callout>

      <KeyIdeas t={t} id="mRat" items={[
        "A ratio a : b compares by division; a is the share a/(a + b) of the total.",
        "Rates carry units, and units cancel like factors: speed × time = distance. Move by v · Δt, never by a fixed step per frame.",
        "Direct proportion keeps y/x constant; inverse proportion keeps x · y constant.",
        "p % = p/100. Part = p × whole; percentage = part / whole; whole = part / p.",
        "A change of p multiplies by (1 + p); successive changes multiply, they do not add.",
        "t = (x − a)/(b − a) is the fraction of the way; lerp, inverse lerp and remap all use it.",
      ]} />
    </Article>
  );
}
