import type { Metadata } from "next";
import { Geist, Geist_Mono, Spectral, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
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
  title: "Gabriel Carvalho",
  description: "Welcome to my online corner!",
};


export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {

  return (
    <html lang="pt-br">
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
