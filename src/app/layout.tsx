import type { Metadata } from "next";
import { Spectral, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// The site's type family (see src/styles/home.css and sitemenu.css)
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
    "Gabriel Carvalho, C++ and graphics programmer. A science-fiction novel in progress, a blog, and free interactive courses at From Scratch Lab.",
};


export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {

  return (
    <html lang="en">
      <body className={`${spectral.variable} ${plexSans.variable} ${plexMono.variable} antialiased`}>

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
