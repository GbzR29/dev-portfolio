// src/lib/tracks/music/index.tsx

// The Music track: music from the ground up, every idea heard. Sound itself
// first (pitch, timbre, loudness), then rhythm, notes and the staff, scales and
// harmony. The widgets play through the audio kit (components/lesson/kit/audio).

import type { Chapter } from "@/lib/tracks/types";

const SOUND = "Sound";
const RHYTHM = "Rhythm";
const NOTES = "Notes";
const SCALES = "Scales";

export const musicChapters: Chapter[] = [
  { id: "what-is-sound", section: SOUND, title: "What Is Sound?", minRead: 14, load: () => import("./chapters/what-is-sound").then((m) => m.WhatIsSoundContent) },
  { id: "pitch", section: SOUND, title: "Pitch and Frequency", minRead: 16, load: () => import("./chapters/pitch").then((m) => m.PitchContent) },
  { id: "timbre", section: SOUND, title: "Timbre and Harmonics", minRead: 17, load: () => import("./chapters/timbre").then((m) => m.TimbreContent) },
  { id: "loudness", section: SOUND, title: "Loudness and the Envelope", minRead: 18, load: () => import("./chapters/loudness").then((m) => m.LoudnessContent) },
  { id: "pulse", section: RHYTHM, title: "Pulse and Tempo", minRead: 16, load: () => import("./chapters/pulse").then((m) => m.PulseContent) },
  { id: "durations", section: RHYTHM, title: "Note Durations", minRead: 17, load: () => import("./chapters/durations").then((m) => m.DurationsContent) },
  { id: "meter", section: RHYTHM, title: "Meter and Time Signatures", minRead: 18, load: () => import("./chapters/meter").then((m) => m.MeterContent) },
  { id: "syncopation", section: RHYTHM, title: "Syncopation", minRead: 18, load: () => import("./chapters/syncopation").then((m) => m.SyncopationContent) },
  { id: "note-names", section: NOTES, title: "Note Names and the Keyboard", minRead: 17, load: () => import("./chapters/note-names").then((m) => m.NoteNamesContent) },
  { id: "staff", section: NOTES, title: "The Staff and Clefs", minRead: 17, load: () => import("./chapters/staff").then((m) => m.StaffContent) },
  { id: "accidentals", section: NOTES, title: "Sharps, Flats and Naturals", minRead: 18, load: () => import("./chapters/accidentals").then((m) => m.AccidentalsContent) },
  { id: "temperament", section: NOTES, title: "Equal Temperament", minRead: 19, load: () => import("./chapters/temperament").then((m) => m.TemperamentContent) },
  { id: "intervals", section: SCALES, title: "Intervals", minRead: 19, load: () => import("./chapters/intervals").then((m) => m.IntervalsContent) },
  { id: "major-scale", section: SCALES, title: "The Major Scale", minRead: 19, load: () => import("./chapters/major-scale").then((m) => m.MajorScaleContent) },
  { id: "minor-scale", section: SCALES, title: "Minor Scales", minRead: 19, load: () => import("./chapters/minor-scale").then((m) => m.MinorScaleContent) },
];
