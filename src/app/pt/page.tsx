// app/pt/page.tsx
// The Home in Portuguese (/pt): the same page, with its own indexable URL and
// metadata. LanguageProvider reads the /pt prefix and renders it in PT.

import type { Metadata } from "next";
import { languageAlternates } from "@/lib/site";
import Home from "../page";

const title = "Gabriel Carvalho | Programador C++ e computação gráfica";
const description =
  "Programador C++ que trabalha com computação gráfica e motores de jogo. Cursos interativos e gratuitos de OpenGL, GLSL, Vulkan, C++ e matemática.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/pt", languages: languageAlternates("/") },
  openGraph: { title, description, url: "/pt", siteName: "gabrielfrc.dev", locale: "pt_BR", type: "website" },
};

export default Home;
