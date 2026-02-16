import clientPromise from "../lib/db/mongo";

export async function getUsers() {
  const client = await clientPromise;
  const db = client.db("my_portfolio");
  return await db.collection("users").find({}).toArray();
}