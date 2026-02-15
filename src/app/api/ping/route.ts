import clientPromise from "@/lib/db/mongo";

export async function GET() {
  const client = await clientPromise;

  const db = client.db("admin");
  await db.command({ ping: 1 });

  return Response.json({ ok: true });
}
