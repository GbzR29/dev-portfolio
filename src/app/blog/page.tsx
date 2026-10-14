
import type { Metadata } from "next";
import { getPosts } from "@/services/postService";
import BlogClientContent from "@/components/blog/BlogClientContent";

// app/blog/page.tsx
export const metadata: Metadata = {
  title: "Blog | Gabriel Carvalho",
  description:
    "Notes by Gabriel Carvalho on C++, computer graphics, game engines and writing: what I am building and learning.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const posts = await getPosts(); // Busca do MongoDB

  // O componente cliente recebe os posts do banco perfeitamente
  return <BlogClientContent initialPosts={posts} />;
}