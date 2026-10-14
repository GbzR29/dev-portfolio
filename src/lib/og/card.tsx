// src/lib/og/card.tsx
// The link-preview image (Open Graph, 1200×630) of every page: the Home's
// light "lab notebook" look — grid paper, petrol ink, Spectral titles, Plex
// Mono labels — with the track's colour as a stripe on the left. Pages call
// the builders in ./cards.ts; this file only draws.

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// Home light-theme tokens (src/styles/home.css)
const BG = "#f1f1eb";
const INK = "#1d2427";
const MUTED = "#6a7275";
const ACCENT = "#2e6166";
const LINE = "#d8dad2";
const GRID = "rgba(46, 97, 102, 0.07)";

export interface OgCard {
  /** Small mono line above the title ("learn / OpenGL 4.6"). */
  eyebrow: string;
  title: string;
  /** Mono title (function names) instead of Spectral. */
  monoTitle?: boolean;
  /** One line under the title ("lesson 4 of 70 · 10 min read"). */
  detail?: string;
  /** Right side of the footer ("free interactive course"). */
  footer: string;
  /** Stripe colour; the site's petrol by default. */
  accent?: string;
}

// Fonts and logo are read once per server instance
let assets: Promise<{ spectral: Buffer; mono: Buffer; logo: string }> | undefined;
function loadAssets() {
  assets ??= Promise.all([
    readFile(join(process.cwd(), "src/assets/fonts/Spectral-Regular.ttf")),
    readFile(join(process.cwd(), "src/assets/fonts/IBMPlexMono-Regular.ttf")),
    readFile(join(process.cwd(), "src/app/icon.png")),
  ]).then(([spectral, mono, logo]) => ({
    spectral, mono, logo: `data:image/png;base64,${logo.toString("base64")}`,
  }));
  return assets;
}

/** Long titles get smaller type so they still fit in three lines. */
function titleSize(title: string, mono: boolean): number {
  const n = title.length * (mono ? 1.25 : 1);
  if (n <= 24) return 88;
  if (n <= 44) return 74;
  if (n <= 70) return 62;
  return 52;
}

export async function renderOgCard(card: OgCard): Promise<ImageResponse> {
  const { spectral, mono, logo } = await loadAssets();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative",
          backgroundColor: BG,
          backgroundImage: `linear-gradient(${GRID} 1px, transparent 1px), linear-gradient(90deg, ${GRID} 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
          padding: "60px 72px 52px 92px",
          fontFamily: "Plex Mono",
          color: INK,
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 16, backgroundColor: card.accent ?? ACCENT }} />

        <div style={{ display: "flex", fontSize: 26, color: ACCENT, letterSpacing: 0.5 }}>{card.eyebrow}</div>

        <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              fontFamily: card.monoTitle ? "Plex Mono" : "Spectral",
              fontSize: titleSize(card.title, !!card.monoTitle),
              lineHeight: 1.08,
              letterSpacing: card.monoTitle ? 0 : -0.5,
            }}
          >
            {card.title}
          </div>
        </div>

        {card.detail && (
          <div style={{ display: "flex", fontSize: 25, color: MUTED, marginBottom: 30 }}>{card.detail}</div>
        )}

        <div
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            borderTop: `2px solid ${LINE}`, paddingTop: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse draws plain <img> */}
            <img src={logo} width={44} height={44} alt="" />
            <span style={{ fontFamily: "Spectral", fontSize: 30, marginLeft: 16 }}>gabrielfrc.dev</span>
          </div>
          <span style={{ fontSize: 22, color: MUTED }}>{card.footer}</span>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Spectral", data: spectral, style: "normal", weight: 400 },
        { name: "Plex Mono", data: mono, style: "normal", weight: 400 },
      ],
    },
  );
}
