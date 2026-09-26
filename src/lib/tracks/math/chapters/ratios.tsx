"use client";

// Arithmetic 4: ratios, rates and proportion (direct and inverse), percent,
// percentage change and why successive changes multiply, and the fraction-of-
// the-way idea behind interpolation and changes of scale.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
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
          "A fraction answers \"how much of a whole?\". A ratio answers \"how much of one thing for each amount of another?\": flour per egg in a recipe, kilometres per hour, width per height of a screen. Percentages are ratios with 100 as the reference, and the fraction-of-the-way idea behind them is the same one behind converting a temperature from Celsius to Fahrenheit or a test score into a grade. This chapter covers them together because they are one idea seen from different sides.")}
      </Lead>

      <H2>{tx(t, "mRat_ratioTitle", "Ratios")}</H2>
      <p>
        {tx(t, "mRat_ratioBody",
          "A ratio compares two amounts by division. If a class has 12 students and 4 computers, the ratio of students to computers is 12 : 4, read \"12 to 4\", and it means 12/4 = 3 students for every computer. Like a fraction, a ratio can be simplified by dividing both sides by the same number (12 : 4 = 3 : 1) without changing what it says. The order matters: computers to students is 4 : 12 = 1 : 3.")}
      </p>
      <Equation label={tx(t, "mRat_eqRatio", "A ratio and the shares it makes")}
        where={[
          [r`a : b`, tx(t, "mRat_wRatio", "the ratio of a to b; its value is a/b")],
          [r`\tfrac{a}{a + b}`, tx(t, "mRat_wShare", "the share of the total that is a. A ratio a : b splits a whole into a + b equal parts, a of them on one side")],
        ]}
        note={tx(t, "mRat_eqRatioNote", "Example: two partners split a profit of 100 in the ratio 3 : 2. There are 3 + 2 = 5 parts of 100/5 = 20 each, so they get 3 × 20 = 60 and 2 × 20 = 40. Check: 60 + 40 = 100 and 60 : 40 = 3 : 2. A common error is to treat 3 : 2 as 3/2 of the total; the shares are 3/5 and 2/5.")}>
        {r`a : b = \frac{a}{b} \qquad \text{share of } a = \frac{a}{a + b}`}
      </Equation>
      <p>
        {tx(t, "mRat_aspect",
          "Screens, photos and paper sizes are described by aspect ratios, width : height. A television with 1920 × 1080 points has ratio 1920 : 1080; the gcd of the two numbers is 120, so it simplifies to 16 : 9, about 1.78 (a screen 1.78 times as wide as it is tall). 1280 × 720 is also 16 : 9, which is why one enlarges to the other without distortion: both sides are multiplied by the same factor, 1.5. Stretching the sides by different factors squashes every circle into an ellipse.")}
      </p>

      <H2>{tx(t, "mRat_rateTitle", "Rates and units")}</H2>
      <p>
        {tx(t, "mRat_rateBody",
          "A rate is a ratio between quantities with different units: 300 metres in 60 seconds is a speed of 300/60 = 5 metres per second (m/s). \"Per\" means \"divided by\". A unit rate is a rate for one unit of the second quantity, which is what makes rates comparable: 5 m/s is faster than 280 m in 60 s = 4.67 m/s. Units behave like numbers in fractions: they multiply and cancel. Speed × time = (m/s) × s = m, a distance.")}
      </p>
      <Equation label={tx(t, "mRat_eqRate", "Units cancel like factors")}
        where={[
          [r`v`, tx(t, "mRat_wV", "a speed in metres per second")],
          [r`\Delta t`, tx(t, "mRat_wDt", "a time interval, in seconds (Δ, the Greek letter delta, means \"change in\")")],
          [r`\Delta x`, tx(t, "mRat_wDx", "the distance covered in that interval, in metres")],
        ]}
        note={tx(t, "mRat_eqRateNote", "The same cancelling converts units. A fraction whose top and bottom are the same amount, such as 1000 m / 1 km or 1 h / 3600 s, equals 1, so multiplying by it changes the units but not the quantity. 90 km/h × (1000 m / 1 km) × (1 h / 3600 s): km cancels km, h cancels h, and what is left is 90 × 1000 / 3600 m/s = 25 m/s. Choose each factor so the unit you want to remove sits on the opposite side. Checking that the units come out right catches many errors.")}>
        {r`\Delta x = v \cdot \Delta t \qquad \frac{\text{m}}{\text{s}} \cdot \text{s} = \text{m}`}
      </Equation>

      <H2>{tx(t, "mRat_propTitle", "Proportion")}</H2>
      <p>
        {tx(t, "mRat_propBody",
          "Two quantities are directly proportional when their ratio stays the same: double one and the other doubles. The cost of pencils at 3 each is proportional to how many you buy. A proportion is an equation saying two ratios are equal, and when one of the four numbers is unknown, cross-multiplication finds it. Quantities are inversely proportional when their product stays the same: double one and the other halves. The time a trip takes is inversely proportional to your speed; the number of days a job takes is inversely proportional to the number of workers (if they all work at the same pace).")}
      </p>
      <Equation label={tx(t, "mRat_eqProp", "Direct and inverse proportion")}
        where={[
          [r`k`, tx(t, "mRat_wK", "the constant of proportionality: the unit rate (price per pencil), or the fixed product (distance = speed × time)")],
          [r`y = k\,x`, tx(t, "mRat_wDirect", "direct: y/x = k is constant; the graph is a straight line through the origin")],
          [r`y = k / x`, tx(t, "mRat_wInverse", "inverse: x · y = k is constant; as x grows, y shrinks toward 0 but never reaches it")],
        ]}
        note={tx(t, "mRat_eqPropNote", "Solving a proportion: 3 notebooks cost 45; what do 7 cost? 3/45 = 7/x, and cross-multiplying gives 3x = 45 · 7 = 315, so x = 315/3 = 105. Or find the unit rate first, 45/3 = 15 each, then 7 × 15 = 105: the same thing in two steps. Inverse: 4 painters finish a house in 6 days, so the job is 4 × 6 = 24 painter-days. 8 painters need 24/8 = 3 days and 3 painters need 24/3 = 8 days: more workers, fewer days, product fixed.")}>
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
        note={tx(t, "mRat_eqChangeNote", "Undoing a change needs the reciprocal factor, not the opposite percentage: after −20 % (× 0.8), getting back needs × 1/0.8 = × 1.25, a 25 % increase. Also distinguish percentages from percentage points: an interest rate going from 10 % to 15 % is up 5 percentage points, but up 50 % relative to where it was (5 is half of 10).")}>
        {r`\text{new} = \text{old}\,(1 + p_1)(1 + p_2) \qquad \text{change} = \frac{\text{new} - \text{old}}{\text{old}}`}
      </Equation>

      <RatioFigure t={t} />

      <H2>{tx(t, "mRat_lerpTitle", "Fraction of the way: interpolation and scales")}</H2>
      <p>
        {tx(t, "mRat_lerpBody",
          "A very useful ratio is \"what fraction of the way from a to b is x?\". Write it t: 0 at a, 1 at b, 0.5 halfway, which is exactly a percentage written as a decimal. Going forward, from t to a value, is linear interpolation: the point t of the way from c to d. Going backward, from a value to t, is the inverse step. Chaining them converts any scale into any other with the same zero-to-full pattern: Celsius into Fahrenheit, a raw test score into a mark out of 10, a length on a map into a real distance.")}
      </p>
      <Equation label={tx(t, "mRat_eqLerp", "Fraction of the way, and changing scale")}
        where={[
          [r`a, b`, tx(t, "mRat_wAB", "the input range. b − a is its length")],
          [r`t`, tx(t, "mRat_wT", "the fraction of the way from a to b. x − a is how far x has come from a; dividing by the whole length b − a turns that into a fraction")],
          [r`c, d`, tx(t, "mRat_wCD", "the output range. The ranges may point in opposite directions (c > d), which flips the mapping")],
        ]}
        note={tx(t, "mRat_eqLerpNote", "Example: a test is scored 0 to 120 and must be turned into a mark from 0 to 10. A score of 30 is t = (30 − 0)/(120 − 0) = 0.25 of the way, and the mark is 0 + 0.25 × (10 − 0) = 2.5. Values outside [a, b] give t outside [0, 1]: the formula still works but extrapolates beyond the scale. If a = b the range has no length and the formula divides by zero, so a and b must differ.")}>
        {r`t = \frac{x - a}{b - a} \qquad y = c + t\,(d - c) = c + \frac{x - a}{b - a}(d - c)`}
      </Equation>
      <Equation label={tx(t, "mRat_eqTemp", "Celsius to Fahrenheit as a change of scale")}
        notes={[
          tx(t, "mRat_temp1", "the two scales share two fixed points: water freezes at 0 °C = 32 °F and boils at 100 °C = 212 °F. So a = 0, b = 100, c = 32, d = 212"),
          tx(t, "mRat_temp2", "fraction of the way from freezing to boiling: t = (C − 0)/(100 − 0) = C/100"),
          tx(t, "mRat_temp3", "the same fraction of the Fahrenheit gap, 212 − 32 = 180 degrees, added to 32. 180/100 = 1.8"),
          tx(t, "mRat_temp4", "check with 37 °C: 32 + 1.8 × 37 = 32 + 66.6 = 98.6 °F, normal body temperature"),
        ]}>
        {r`F = 32 + \frac{C - 0}{100 - 0}\,(212 - 32) = 32 + 1.8\,C`}
      </Equation>

      <H2>{tx(t, "mRat_exTitle", "Worked examples")}</H2>
      <H3>{tx(t, "mRat_ex1T", "Stacking discounts")}</H3>
      <p>
        {tx(t, "mRat_ex1",
          "A coat is 20 % off, and the till takes a further 30 % off the reduced price. The discounts do not add up to 50 %: the second one is 30 % of an already reduced price. The price factors multiply: (1 − 0.2)(1 − 0.3) = 0.8 × 0.7 = 0.56, so you pay 56 % of the original and the total discount is 1 − 0.56 = 0.44 = 44 %. On a price of 150: 150 × 0.8 = 120, then 120 × 0.7 = 84, and 84/150 = 0.56. No number of successive discounts ever reaches 100 %.")}
      </p>
      <H3>{tx(t, "mRat_ex2T", "Recovering the original price")}</H3>
      <p>
        {tx(t, "mRat_ex2",
          "A jacket costs 68 after a 15 % discount. The sale price is 1 − 0.15 = 0.85 of the original, so the original is 68/0.85 = 80. Adding 15 % back to 68 gives 68 × 1.15 = 78.2, which is wrong: the 15 % was taken of 80, not of 68. Check: 80 × 0.85 = 68.")}
      </p>
      <H3>{tx(t, "mRat_ex3T", "Enlarging a picture")}</H3>
      <p>
        {tx(t, "mRat_ex3",
          "A 64 cm × 48 cm poster is to be reprinted 80 cm wide. The scale factor is 80/64 = 1.25, so the height must be 48 × 1.25 = 60 cm to keep the ratio 4 : 3 (64 : 48 and 80 : 60 both simplify to 4 : 3). Any other height would stretch the picture.")}
      </p>

      <H2>{tx(t, "mRat_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mRat_tWrong", "Wrong"), tx(t, "mRat_tRight", "Right"), tx(t, "mRat_tWhy", "Why")]}
        rows={[
          ["+10 %, −10 % = 0 %", "× 1.1 × 0.9 = −1 %", tx(t, "mRat_m1", "each percentage is of a different amount; factors multiply")],
          ["20 % + 30 % = 50 %", "1 − 0.8 × 0.7 = 44 %", tx(t, "mRat_m2", "the second reduction applies to what is left after the first")],
          ["90 km/h = 90 m/s", "90 km/h = 25 m/s", tx(t, "mRat_m3", "both units change: × 1000 m per km and ÷ 3600 s per hour")],
          ["3 : 2 of 100 = 150", "60 and 40", tx(t, "mRat_m4", "a ratio a : b splits the total into a + b parts")],
          ["10 % → 15 % is +5 %", tx(t, "mRat_m5r", "+5 points, +50 %"), tx(t, "mRat_m5", "percentage points are a difference; percent change is relative")],
          [tx(t, "mRat_m6w", "stretch a photo to fill any screen"), "s = min(sw/pw, sh/ph)", tx(t, "mRat_m6", "one scale for both axes keeps the aspect ratio")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "mRat_tip", "When a formula mixes quantities, write the units next to the numbers and check that they cancel into the unit you expect. Metres per second times seconds must give metres; if you get metres per second squared, a time factor is missing or doubled.")}
      </Callout>

      <KeyIdeas t={t} id="mRat" items={[
        "A ratio a : b compares by division; a is the share a/(a + b) of the total.",
        "Rates carry units, and units cancel like factors: speed × time = distance. Convert units by multiplying by fractions equal to 1, such as 1000 m / 1 km.",
        "Direct proportion keeps y/x constant; inverse proportion keeps x · y constant.",
        "p % = p/100. Part = p × whole; percentage = part / whole; whole = part / p.",
        "A change of p multiplies by (1 + p); successive changes multiply, they do not add.",
        "t = (x − a)/(b − a) is the fraction of the way; interpolation and scale conversions (°C to °F) are built on it.",
      ]} />
    </Article>
  );
}
