"use client";

// Probability & Statistics 1: descriptive statistics — population and
// sample, kinds of variables; frequency tables, bar charts and histograms
// (bin width, density scale, shapes); centre: mean, median, mode, weighted
// mean from a frequency table, resistance to outliers; spread: range,
// quartiles and IQR, sample variance with n − 1, standard deviation, the
// shortcut formula, a full hand calculation; five-number summary, box plot,
// 1.5·IQR fences; z-scores and percentiles; linear changes of units;
// Simpson's paradox.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { DescriptiveFigure } from "@/components/lesson/figures/math/DescriptiveFigure";

const r = String.raw;

export function DescriptiveStatsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mDesc_intro",
          "Statistics starts with data: a list of numbers someone measured, such as test scores, heights or waiting times, and the wish to understand them. The first step is to describe them honestly: draw them, find their centre, measure their spread and spot anything unusual. Everything here needs only arithmetic. The rest of this section then goes the other way, from a model such as a fair die to the data it should produce, and the ideas you meet here (mean, spread, histogram) come back there with probabilities in place of frequencies. Some tools, like the median and the box plot, are worth having because they stay reliable when a few values are strange.")}
      </Lead>

      <H2>{tx(t, "mDesc_dataTitle", "Data, populations and samples")}</H2>
      <p>
        {tx(t, "mDesc_dataBody",
          "The population is the whole group we care about: every voter in a country, every bolt a factory makes. Usually we can only measure a sample, a part of it, and the sampling chapter will ask what a sample says about its population. Here we only describe the sample itself. Each measured property is a variable. Categorical variables sort individuals into groups (eye colour, blood type); numerical ones are counts (children in a family) or measurements (height, time). What makes sense depends on the kind: an average eye colour means nothing, but the most common one does.")}
      </p>

      <H2>{tx(t, "mDesc_freqTitle", "Frequency tables and histograms")}</H2>
      <p>
        {tx(t, "mDesc_freqBody",
          "The first summary is a count. Twenty families report how many children they have:")}
      </p>
      <LessonTable
        headers={[tx(t, "mDesc_tChildren", "children x"), "0", "1", "2", "3", "4", tx(t, "mDesc_tTotal", "total")]}
        rows={[
          [tx(t, "mDesc_tFreq", "frequency f"), "4", "7", "6", "2", "1", "20"],
          [tx(t, "mDesc_tRel", "relative frequency f/n"), "0.20", "0.35", "0.30", "0.10", "0.05", "1"],
          [tx(t, "mDesc_tCum", "cumulative"), "0.20", "0.55", "0.85", "0.95", "1.00", ""],
        ]}
      />
      <p>
        {tx(t, "mDesc_freqRel",
          "The relative frequencies are never negative and always add to 1; the cumulative row climbs to 1. (Probabilities will follow exactly the same two rules in the coming chapters.) A bar chart draws them. For measurements, where hardly any two values are equal, first group the values into intervals called bins, such as 60–70, 70–80, and draw a bar over each bin: a histogram. If the bins have different widths, the bar's height must be relative frequency divided by width, so that areas, not heights, carry the proportions. This is called the density scale, and it returns in the random-variables chapter.")}
      </p>
      <p>
        {tx(t, "mDesc_shape",
          "The shape of a histogram is the first thing to read. Symmetric: the two sides mirror each other (heights). Skewed to the right: a long tail of large values (incomes, waiting times, house prices). Skewed to the left: a tail of small values (the age at retirement, scores on an easy test). Bimodal: two humps, which often means two different groups were mixed together, such as the heights of men and women.")}
      </p>

      <H2>{tx(t, "mDesc_centreTitle", "The centre: mean, median and mode")}</H2>
      <Equation label={tx(t, "mDesc_eqMean", "Sample mean")}
        where={[
          [r`x_1, \dots, x_n`, tx(t, "mDesc_wXs", "the n data values")],
          [r`\bar x`, tx(t, "mDesc_wBar", "the mean, read \"x bar\": the total divided by the count")],
          [r`\sum f_j x_j / n`, tx(t, "mDesc_wWeighted", "the same mean from a frequency table: each value times how often it occurs")],
        ]}
        note={tx(t, "mDesc_meanNote", "Dividing by n is the same as weighting each distinct value by its relative frequency f/n, so the mean is a weighted average of the distinct values. It is also the balance point of the data: the deviations xᵢ − x̄ add to zero. (The expectation chapter builds E[X] the same way, with probabilities as the weights.)")}>
        {r`\bar x = \frac{x_1 + x_2 + \dots + x_n}{n} = \frac1n \sum_{i=1}^{n} x_i`}
      </Equation>
      <p>
        {tx(t, "mDesc_familyMean",
          "For the families: x̄ = (0 · 4 + 1 · 7 + 2 · 6 + 3 · 2 + 4 · 1)/20 = 29/20 = 1.45 children.")}
      </p>
      <p>
        {tx(t, "mDesc_median",
          "The median is the middle value once the data are sorted: half the data lie at or below it and half at or above it. With n values, it is the value in position (n + 1)/2. If n is odd that is a single value; if n is even it falls between two values, and the median is their average. For the 20 families, positions 10 and 11 are both 1 (the sorted list has four 0s, then seven 1s in positions 5 to 11), so the median is 1. The mode is the most frequent value, also 1 here; it is the only one of the three that works for categorical data.")}
      </p>
      <H3>{tx(t, "mDesc_resistTitle", "Mean versus median")}</H3>
      <p>
        {tx(t, "mDesc_resistBody",
          "Ten people work in a small office. Nine earn 2000 a month and the owner earns 50 000. The mean salary is (9 · 2000 + 50 000)/10 = 6800, which describes nobody. The median is 2000. The mean uses the size of every value, so one extreme value drags it; the median only uses the order, so it is resistant: the owner could earn a million and it would not move. In a right-skewed distribution the mean lies to the right of the median, in a left-skewed one to the left, and in a symmetric one they coincide. That is why house prices and incomes are usually reported by their median.")}
      </p>

      <H2>{tx(t, "mDesc_spreadTitle", "Spread: range, quartiles and standard deviation")}</H2>
      <p>
        {tx(t, "mDesc_rangeBody",
          "The range, maximum minus minimum, is the simplest measure of spread but depends only on the two most extreme values. The quartiles do better. Q1, the lower quartile, is the median of the lower half of the sorted data; Q3 is the median of the upper half (when n is odd, the middle value belongs to neither half). So a quarter of the data lie below Q1, a quarter above Q3, and the middle half between them. Their distance IQR = Q3 − Q1, the interquartile range, is the width of the middle half. Different books and calculators split the halves slightly differently, which can change the quartiles a little for small data sets; the idea is the same.")}
      </p>
      <Equation label={tx(t, "mDesc_eqVar", "Sample variance and standard deviation")}
        where={[
          [r`x_i - \bar x`, tx(t, "mDesc_wDev", "the deviation of each value from the mean")],
          [r`n - 1`, tx(t, "mDesc_wN1", "the divisor: one less than the number of values (see below)")],
          [r`s^2,\ s`, tx(t, "mDesc_wS", "the sample variance and the sample standard deviation, in the units of x")],
          [r`\sum x_i^2 - n\bar x^2`, tx(t, "mDesc_wShort", "the shortcut for the sum of squared deviations: add up the squares, then subtract n times the squared mean (checked in the worked example below)")],
        ]}
        note={tx(t, "mDesc_n1Note", "Why n − 1? The mean x̄ was computed from the same data, and it is the point that makes the sum of squared deviations as small as possible; the deviations from the true population mean would on average be a little larger. Dividing by n − 1 instead of n exactly compensates, so that s² is right on average (the sampling chapter proves it). Another way to say it: the n deviations add to 0, so only n − 1 of them are free; the last one is determined by the others.")}>
        {r`s^2 = \frac{1}{n-1} \sum_{i=1}^{n} (x_i - \bar x)^2 = \frac{\sum x_i^2 - n\bar x^2}{n-1} \qquad s = \sqrt{s^2}`}
      </Equation>
      <H3>{tx(t, "mDesc_handTitle", "A full calculation by hand")}</H3>
      <p>
        {tx(t, "mDesc_handIntro",
          "Nine test scores, already sorted: 52, 61, 64, 68, 70, 73, 75, 81, 95. Their total is 639, so x̄ = 639/9 = 71. The median is the 5th value, 70. Lay out the deviations in a table:")}
      </p>
      <LessonTable
        headers={["xᵢ", "52", "61", "64", "68", "70", "73", "75", "81", "95", tx(t, "mDesc_tSum", "sum")]}
        rows={[
          ["xᵢ − 71", "−19", "−10", "−7", "−3", "−1", "2", "4", "10", "24", "0"],
          ["(xᵢ − 71)²", "361", "100", "49", "9", "1", "4", "16", "100", "576", "1216"],
        ]}
      />
      <p>
        {tx(t, "mDesc_handEnd",
          "The deviations add to 0, a useful check. s² = 1216/8 = 152 and s = √152 ≈ 12.3 points. The shortcut agrees: Σxᵢ² = 46 585, and 46 585 − 9 · 71² = 46 585 − 45 369 = 1216. For the quartiles, leave out the median: the lower half 52, 61, 64, 68 has median Q1 = (61 + 64)/2 = 62.5; the upper half 73, 75, 81, 95 has Q3 = (75 + 81)/2 = 78. IQR = 15.5.")}
      </p>

      <DescriptiveFigure t={t} />

      <H2>{tx(t, "mDesc_boxTitle", "The five-number summary and the box plot")}</H2>
      <p>
        {tx(t, "mDesc_boxBody",
          "Minimum, Q1, median, Q3, maximum: 52, 62.5, 70, 78, 95 for the test scores. A box plot draws them: a box from Q1 to Q3 with a line at the median, and whiskers out to the smallest and largest values that are not outliers. The usual rule marks as a possible outlier any value more than 1.5 IQR beyond the box. Here the fences are 62.5 − 1.5 · 15.5 = 39.25 and 78 + 23.25 = 101.25, so no score is flagged. Had the top score been 150, it would lie beyond the upper fence and be drawn as a separate dot, while the median and quartiles would stay exactly the same. The mean would jump by (150 − 95)/9 ≈ 6.1 points.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "mDesc_outlierWarn", "An outlier is a question, not an error to delete. It might be a typo (a height of 1.75 recorded as 175), or the most interesting person in the data. Check it, and if you leave it out, say so.")}
      </Callout>

      <H2>{tx(t, "mDesc_zTitle", "Relative standing: z-scores and percentiles")}</H2>
      <p>
        {tx(t, "mDesc_zBody",
          "The z-score z = (x − x̄)/s says how many standard deviations a value lies from the mean (random variables will use the same idea). The 95 in the test has z = (95 − 71)/12.3 ≈ 1.95; the 52 has z ≈ −1.54. A percentile says what share of the data lie below a value: the median is the 50th percentile, Q1 and Q3 are roughly the 25th and 75th. A child \"in the 90th percentile for height\" is taller than about 90% of children of the same age.")}
      </p>
      <p>
        {tx(t, "mDesc_unitsBody",
          "Changing units is a linear transformation y = ax + b, and the summaries follow it in a simple way: every measure of centre (mean, median, quartiles) becomes a · (old) + b, and every measure of spread (range, IQR, s) is multiplied by |a| and ignores b. Temperatures with mean 20 °C and s = 5 °C become 68 °F and 9 °F. Adding 5 bonus points to every test score raises the mean and median by 5 and leaves s and the IQR unchanged.")}
      </p>

      <H2>{tx(t, "mDesc_simpsonTitle", "Simpson's paradox: when grouping reverses a comparison")}</H2>
      <p>
        {tx(t, "mDesc_simpsonBody",
          "A classic study compared two treatments for kidney stones. Split by the size of the stone:")}
      </p>
      <LessonTable
        headers={["", tx(t, "mDesc_tSmall", "small stones"), tx(t, "mDesc_tLarge", "large stones"), tx(t, "mDesc_tAll", "all patients")]}
        rows={[
          [tx(t, "mDesc_tA", "treatment A"), "81/87 = 93%", "192/263 = 73%", "273/350 = 78%"],
          [tx(t, "mDesc_tB", "treatment B"), "234/270 = 87%", "55/80 = 69%", "289/350 = 83%"],
        ]}
      />
      <p>
        {tx(t, "mDesc_simpsonEnd",
          "A succeeds more often for small stones and for large stones, yet less often overall. There is no arithmetic error. The overall rates are weighted averages of the group rates, and the weights differ: A was mostly given to hard, large-stone cases (263 of its 350), B mostly to easy, small-stone cases (270 of 350). Pooling the groups compares A on hard cases with B on easy ones. The lesson: before comparing totals, ask whether the groups being compared are mixed in different proportions.")}
      </p>

      <H2>{tx(t, "mDesc_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mDesc_ex1", "1. Data 3, 7, 7, 8, 10, 13: mean 48/6 = 8; median (7 + 8)/2 = 7.5; mode 7; range 10. Deviations −5, −1, −1, 0, 2, 5, squares add to 56, s² = 56/5 = 11.2, s ≈ 3.35.")}</p>
      <p>{tx(t, "mDesc_ex2", "2. The same data: lower half 3, 7, 7 gives Q1 = 7; upper half 8, 10, 13 gives Q3 = 10; IQR = 3. Fences 2.5 and 14.5: no outliers.")}</p>
      <p>{tx(t, "mDesc_ex3", "3. A class's mean mark is 60 with 25 students; another class of 15 has mean 72. The combined mean is (25 · 60 + 15 · 72)/40 = 64.5, not (60 + 72)/2 = 66.")}</p>
      <p>{tx(t, "mDesc_ex4", "4. Every value in a data set is doubled and then 3 is subtracted: a mean of 10 becomes 17, a median of 9 becomes 15, s = 4 becomes 8, IQR = 5 becomes 10.")}</p>
      <p>{tx(t, "mDesc_ex5", "5. Five values have mean 12; four of them are 10, 11, 13 and 15. The fifth is 5 · 12 − 49 = 11.")}</p>

      <H2>{tx(t, "mDesc_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mDesc_tWrong", "Wrong"), tx(t, "mDesc_tRight", "Right"), tx(t, "mDesc_tWhy", "Why")]}
        rows={[
          [tx(t, "mDesc_m1w", "median of unsorted data"), tx(t, "mDesc_m1r", "sort first"), tx(t, "mDesc_m1", "the median is the middle of the order, not of the list as written")],
          [tx(t, "mDesc_m2w", "average of two group means"), tx(t, "mDesc_m2r", "weight by group sizes"), tx(t, "mDesc_m2", "a mean of means ignores how many values each one stands for")],
          [tx(t, "mDesc_m3w", "s² with divisor n for a sample"), "n − 1", tx(t, "mDesc_m3", "dividing by n underestimates the population variance on average")],
          [tx(t, "mDesc_m4w", "the mean as the typical value of skewed data"), tx(t, "mDesc_m4r", "report the median too"), tx(t, "mDesc_m4", "a long tail drags the mean away from most of the data")],
          [tx(t, "mDesc_m5w", "histogram heights = frequencies with unequal bins"), tx(t, "mDesc_m5r", "height = frequency ÷ width"), tx(t, "mDesc_m5", "the eye reads area, and wide bins would look too important")],
          [tx(t, "mDesc_m6w", "pooled totals settle a comparison"), tx(t, "mDesc_m6r", "compare within groups first"), tx(t, "mDesc_m6", "Simpson's paradox: different group mixes can reverse the result")],
        ]}
      />

      <KeyIdeas t={t} id="mDesc" items={[
        "Relative frequencies of data behave like a pmf; a histogram is the data's density picture, with area as proportion.",
        "The mean x̄ = Σxᵢ/n is the balance point; the median is the middle of the sorted data and resists outliers.",
        "Skewed right: mean > median. Symmetric: mean ≈ median.",
        "Quartiles split the sorted data in four; IQR = Q3 − Q1 is the width of the middle half.",
        "s² = Σ(xᵢ − x̄)²/(n − 1); s has the units of the data; the deviations always add to 0.",
        "The five-number summary gives a box plot; values more than 1.5 IQR beyond the box are possible outliers.",
        "Under y = ax + b, centres transform like the values; spreads are multiplied by |a|.",
        "Pooling groups with different mixes can reverse a comparison (Simpson's paradox).",
      ]} />
    </Article>
  );
}
