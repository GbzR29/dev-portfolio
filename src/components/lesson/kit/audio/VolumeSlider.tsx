"use client";

// ── Volume slider ─────────────────────────────────────────────────────────────
// The page's master volume (kit/audio/context.ts) as a figure slider. Every
// widget that sounds shows one, so the reader can turn a loud tone down where
// they are looking.

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Slider } from "@/components/lesson/kit/figure";
import { getVolume, setVolume } from "./context";

export function VolumeSlider({ t }: { t?: TrackTranslations }) {
  const [vol, setVol] = useState(getVolume);
  return (
    <Slider label={tx(t, "figMus_volume", "volume")} value={vol} min={0} max={1} step={0.01}
      onChange={v => { setVol(v); setVolume(v); }} fmt={v => `${Math.round(v * 100)} %`} />
  );
}
