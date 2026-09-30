// app/page.tsx

import "@/styles/home.css";
import { getPosts } from "@/services/postService";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import Stack from "@/components/home/Stack";
import Now from "@/components/home/Now";
import RecentWriting from "@/components/home/RecentWriting";
import Contact from "@/components/home/Contact";
import HomeFooter from "@/components/home/HomeFooter";
import Reveal from "@/components/home/Reveal";

export const metadata = {
  title: "Gabriel Carvalho | C++ & graphics programmer",
  description:
    "C++ programmer working with computer graphics and game engines. Interactive courses on OpenGL, GLSL, C++ and math.",

  openGraph: {
    title: "Gabriel Carvalho | C++ & graphics programmer",
    description: "C++ programmer working with computer graphics and game engines.",
    url: "https://www.gabrielfrc.dev/",
    siteName: "gabrielfrc.dev",
    images: [
      {
        url: "/logo.png",
        width: 600,
        height: 315,
        alt: "Banner preview",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
};

export default async function Home() {
  const posts = (await getPosts()).slice(0, 3);

  return (
    <div className="home">
      <Hero />
      <main className="hm-in">
        <About />
        <Stack />
        <Now />
        <RecentWriting posts={posts} />
        <Contact />
        <HomeFooter />
      </main>
      <Reveal />
    </div>
  );
}
