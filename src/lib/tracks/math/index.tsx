// src/lib/tracks/math/index.tsx
"use client";

// The Math track: the mathematics behind computer graphics and game
// programming, from arithmetic and floating point upward, each topic with
// interactive figures.

import type { Chapter } from "@/lib/tracks/types";

const ARITHMETIC = "Arithmetic";
const ALGEBRA = "Algebra";
const GEOMETRY = "Geometry";
const TRIGONOMETRY = "Trigonometry";
const LINEAR_ALGEBRA = "Linear Algebra";
const CALCULUS = "Calculus";

export const mathChapters: Chapter[] = [
  { id: "number-line",         section: ARITHMETIC, title: "Numbers & the Number Line",    minRead: 16, load: () => import("./chapters/number-line").then((m) => m.NumberLineContent) },
  { id: "order-of-operations", section: ARITHMETIC, title: "Order of Operations",          minRead: 13, load: () => import("./chapters/order-of-operations").then((m) => m.OrderOfOperationsContent) },
  { id: "fractions",           section: ARITHMETIC, title: "Fractions & Decimals",         minRead: 19, load: () => import("./chapters/fractions").then((m) => m.FractionsContent) },
  { id: "ratios",              section: ARITHMETIC, title: "Ratios, Proportion & Percent", minRead: 16, load: () => import("./chapters/ratios").then((m) => m.RatiosContent) },
  { id: "divisibility",        section: ARITHMETIC, title: "Divisibility, Primes, GCD & LCM", minRead: 17, load: () => import("./chapters/divisibility").then((m) => m.DivisibilityContent) },
  { id: "powers",              section: ARITHMETIC, title: "Powers & Roots",               minRead: 17, load: () => import("./chapters/powers").then((m) => m.PowersContent) },
  { id: "bases",               section: ARITHMETIC, title: "Number Bases & Bits",          minRead: 16, load: () => import("./chapters/bases").then((m) => m.BasesContent) },
  { id: "numbers",             section: ARITHMETIC, title: "Integers & Floating Point",    minRead: 13, load: () => import("./chapters/numbers").then((m) => m.NumbersContent) },

  { id: "expressions",      section: ALGEBRA, title: "Expressions",               minRead: 15, load: () => import("./chapters/expressions").then((m) => m.ExpressionsContent) },
  { id: "linear-equations", section: ALGEBRA, title: "Linear Equations",          minRead: 17, load: () => import("./chapters/linear-equations").then((m) => m.LinearEquationsContent) },
  { id: "inequalities",     section: ALGEBRA, title: "Inequalities",              minRead: 15, load: () => import("./chapters/inequalities").then((m) => m.InequalitiesContent) },
  { id: "algebra",          section: ALGEBRA, title: "Functions & Graphs",        minRead: 17, load: () => import("./chapters/functions").then((m) => m.AlgebraContent) },
  { id: "linear-systems",   section: ALGEBRA, title: "Systems of Equations",      minRead: 16, load: () => import("./chapters/linear-systems").then((m) => m.LinearSystemsContent) },
  { id: "quadratics",       section: ALGEBRA, title: "Quadratics",                minRead: 19, load: () => import("./chapters/quadratics").then((m) => m.QuadraticsContent) },
  { id: "polynomials",      section: ALGEBRA, title: "Polynomials",               minRead: 18, load: () => import("./chapters/polynomials").then((m) => m.PolynomialsContent) },
  { id: "exponents",        section: ALGEBRA, title: "Exponents & Logarithms",    minRead: 13, load: () => import("./chapters/exponents").then((m) => m.ExpLogContent) },
  { id: "sequences",        section: ALGEBRA, title: "Sequences & Series",        minRead: 17, load: () => import("./chapters/sequences").then((m) => m.SequencesContent) },

  { id: "angles",          section: GEOMETRY, title: "Points, Lines & Angles",    minRead: 17, load: () => import("./chapters/angles").then((m) => m.AnglesContent) },
  { id: "triangles",       section: GEOMETRY, title: "Triangles & Congruence",    minRead: 18, load: () => import("./chapters/triangles").then((m) => m.TrianglesContent) },
  { id: "area",            section: GEOMETRY, title: "Perimeter & Area",          minRead: 18, load: () => import("./chapters/area").then((m) => m.AreaContent) },
  { id: "pythagoras",      section: GEOMETRY, title: "The Pythagorean Theorem",   minRead: 17, load: () => import("./chapters/pythagoras").then((m) => m.PythagorasContent) },
  { id: "similarity",      section: GEOMETRY, title: "Similarity & Scale",        minRead: 17, load: () => import("./chapters/similarity").then((m) => m.SimilarityContent) },
  { id: "circle",          section: GEOMETRY, title: "Circles & π",               minRead: 19, load: () => import("./chapters/circle").then((m) => m.CircleContent) },
  { id: "volumes",         section: GEOMETRY, title: "Volume & Surface Area",     minRead: 18, load: () => import("./chapters/volumes").then((m) => m.VolumesContent) },
  { id: "analytic",        section: GEOMETRY, title: "Coordinate Geometry & Conics", minRead: 20, load: () => import("./chapters/analytic").then((m) => m.AnalyticContent) },
  { id: "transformations", section: GEOMETRY, title: "Transformations",           minRead: 17, load: () => import("./chapters/transformations").then((m) => m.TransformationsContent) },

  { id: "trig",          section: TRIGONOMETRY, title: "Right-Triangle Trigonometry",  minRead: 18, load: () => import("./chapters/trig").then((m) => m.TrigContent) },
  { id: "unit-circle",   section: TRIGONOMETRY, title: "Radians & the Unit Circle",    minRead: 17, load: () => import("./chapters/unit-circle").then((m) => m.UnitCircleContent) },
  { id: "triangle-laws", section: TRIGONOMETRY, title: "Laws of Sines & Cosines",      minRead: 18, load: () => import("./chapters/triangle-laws").then((m) => m.TriangleLawsContent) },
  { id: "identities",    section: TRIGONOMETRY, title: "Identities & Rotation",        minRead: 17, load: () => import("./chapters/identities").then((m) => m.IdentitiesContent) },
  { id: "polar",         section: TRIGONOMETRY, title: "Polar Coordinates & atan2",    minRead: 16, load: () => import("./chapters/polar").then((m) => m.PolarContent) },
  { id: "waves",         section: TRIGONOMETRY, title: "Waves & Oscillation",          minRead: 17, load: () => import("./chapters/waves").then((m) => m.WavesContent) },

  { id: "vectors",   section: LINEAR_ALGEBRA, title: "Vectors",                   minRead: 13, load: () => import("./chapters/vectors").then((m) => m.VectorsContent) },
  { id: "dot",       section: LINEAR_ALGEBRA, title: "The Dot Product",           minRead: 14, load: () => import("./chapters/vectors").then((m) => m.DotContent) },
  { id: "cross",     section: LINEAR_ALGEBRA, title: "The Cross Product",         minRead: 14, load: () => import("./chapters/vectors").then((m) => m.CrossContent) },
  { id: "matrices",    section: LINEAR_ALGEBRA, title: "Matrices & Linear Maps",    minRead: 20, load: () => import("./chapters/matrices").then((m) => m.MatricesContent) },
  { id: "determinant", section: LINEAR_ALGEBRA, title: "The Determinant",           minRead: 18, load: () => import("./chapters/determinant").then((m) => m.DeterminantContent) },
  { id: "inverse",     section: LINEAR_ALGEBRA, title: "Inverses & Linear Systems", minRead: 19, load: () => import("./chapters/inverse").then((m) => m.InverseContent) },
  { id: "eigen",       section: LINEAR_ALGEBRA, title: "Eigenvalues & Eigenvectors", minRead: 18, load: () => import("./chapters/eigen").then((m) => m.EigenContent) },
  { id: "complex",     section: LINEAR_ALGEBRA, title: "Complex Numbers",           minRead: 19, load: () => import("./chapters/complex").then((m) => m.ComplexContent) },
  { id: "quaternions", section: LINEAR_ALGEBRA, title: "Quaternions & 3D Rotation", minRead: 20, load: () => import("./chapters/quaternions").then((m) => m.QuaternionsContent) },

  { id: "limits",           section: CALCULUS, title: "Limits & Continuity",         minRead: 19, load: () => import("./chapters/limits").then((m) => m.LimitsContent) },
  { id: "derivatives",      section: CALCULUS, title: "The Derivative",              minRead: 19, load: () => import("./chapters/derivatives").then((m) => m.DerivativesContent) },
  { id: "derivative-rules", section: CALCULUS, title: "Rules of Differentiation",    minRead: 20, load: () => import("./chapters/derivative-rules").then((m) => m.DerivativeRulesContent) },
  { id: "derivative-uses",  section: CALCULUS, title: "Using Derivatives",           minRead: 21, load: () => import("./chapters/derivative-uses").then((m) => m.DerivativeUsesContent) },
  { id: "integrals",        section: CALCULUS, title: "Integrals: Area by Strips",   minRead: 19, load: () => import("./chapters/integrals").then((m) => m.IntegralsContent) },
  { id: "ftc",              section: CALCULUS, title: "The Fundamental Theorem",     minRead: 18, load: () => import("./chapters/ftc").then((m) => m.FtcContent) },
];
