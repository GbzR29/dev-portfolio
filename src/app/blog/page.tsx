
import { getPosts } from "@/services/postService";
import BlogClientContent from "@/components/blog/BlogClientContent";

import Navbar from "@/components/navbar/Navbar"; 
import Footer from "@/components/footer/Footer";
import TriangleParticles from "@/components/particles/TriangleParticles";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Card from "@/components/ui/Card";
import { MyButton } from "@/components/ui/Button"; 
import { InputBox } from "@/components/ui/InputBox";

import { Mail } from "lucide-react";

const POSTS = [
  {
    id: 1,
    title: "Fractal Engine: Deep Dive",
    excerpt: "How to render complex fractals in real time by optimizing GPU usage with advanced shader programming techniques...",
    category: "Insights",
    date: "05 Fev, 2026",
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800"
  },
  {
    id: 2,
    title: "C++ Memory Management",
    excerpt: "Tips on how to manage memory efficiently in game engines, avoiding leaks and optimizing allocations...",
    category: "Tutorial",
    date: "01 Fev, 2026",
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800"
  },
  {
    id: 3,
    title: "OpenGL Performance Optimization",
    excerpt: "Advanced techniques for improving the performance of 3D applications, including instancing and level of detail...",
    category: "Technical",
    date: "28 Jan, 2026",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800"
  }
];

// app/blog/page.tsx
export default async function BlogPage() {
  const posts = await getPosts(); // Busca do MongoDB

  // O componente cliente recebe os posts do banco perfeitamente
  return <BlogClientContent initialPosts={posts} />;
}