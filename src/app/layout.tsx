import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron, Kanit, Ubuntu } from "next/font/google";
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


// Configuração das fontes
const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
});

const kanit = Kanit({
  subsets: ['latin'],
  weight: ['400', '700'], // Peso normal e bold
  variable: '--font-kanit',
});

const ubuntu = Ubuntu({
  subsets: ['latin'],
  weight: ['400', '700'], // Peso normal e bold
  variable: '--font-ubuntu',
});


export const metadata: Metadata = {
  title: "Gabriel Carvalho",
  description: "Welcome to my online corner!",
};


export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {

  return (
    <html lang="pt-br">
      <body className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${kanit.variable} ${ubuntu.variable} antialiased`}>

        <LanguageProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </LanguageProvider>
        
      </body>
    </html>
  );
}
