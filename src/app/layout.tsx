import type { Metadata } from "next";
import { Geist, Geist_Mono, Spectral, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { SITE_URL } from "@/lib/tracks/urls";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


// Home + book page type family (see src/styles/home.css)
const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});


export const metadata: Metadata = {
  // Relative canonical / Open Graph URLs resolve against the public domain
  metadataBase: new URL(SITE_URL),
  title: "Gabriel Carvalho",
  description:
    "Gabriel Carvalho, C++ and graphics programmer. Free interactive courses on OpenGL, GLSL, Vulkan, C++ and math, and a science-fiction novel in progress.",
};


export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${spectral.variable} ${plexSans.variable} ${plexMono.variable} antialiased`}>

        <LanguageProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </LanguageProvider>

        <Analytics />

      </body>
    </html>
  );
}
