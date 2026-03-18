import clientPromise from "@/lib/db/mongo";
import { Post } from "@/types/post";

export async function getPosts(): Promise<Post[]> {
  try {
    const client = await clientPromise;
    const db = client.db("my_portfolio");

    // Buscamos os posts e ordenamos pela data (do mais novo para o mais antigo)
    const postsRaw = await db
      .collection("posts")
      .find({})
      .sort({ date: -1 })
      .toArray();

    return postsRaw.map((doc) => ({
      id: doc._id.toString(),
      title: doc.title,
      excerpt: doc.excerpt,
      category: doc.category,
      // ✅ Formata ISO ou string de forma segura
      date: doc.date
        ? new Date(doc.date).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        : "—",
      image: doc.image,
    })) as Post[];
  } catch (e) {
    console.error("Erro ao buscar posts:", e);
    return [];
  }
}