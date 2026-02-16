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
      // Aqui transformamos o _id do Mongo na string 'id' que seu código espera
      id: doc._id.toString(), 
      title: doc.title,
      excerpt: doc.excerpt,
      category: doc.category,
      date: doc.date, // Se salvou como string, ele mantém. Se salvou como Date, use .toLocaleDateString()
      image: doc.image,
    })) as Post[];
  } catch (e) {
    console.error("Erro ao buscar posts:", e);
    return [];
  }
}