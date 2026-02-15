import clientPromise from "../db/mongo";

export async function getUsers() {
  const client = await clientPromise;
  return client.db().collection("users").find().toArray();
}
