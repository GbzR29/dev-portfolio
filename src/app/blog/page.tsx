
import { getPosts } from "@/services/postService";
import BlogClientContent from "@/components/blog/BlogClientContent";

// app/blog/page.tsx
export default async function BlogPage() {
  const posts = await getPosts(); // Busca do MongoDB

  // O componente cliente recebe os posts do banco perfeitamente
  return <BlogClientContent initialPosts={posts} />;
}