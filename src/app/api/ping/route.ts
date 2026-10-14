import clientPromise from "@/lib/db/mongo";

export const dynamic = "force-dynamic";

// Health check: 200 when MongoDB answers within 5 s, 503 otherwise (never a crash).
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 5000));
    const client = await Promise.race([clientPromise, timeout]);
    await Promise.race([client.db("my_portfolio").command({ ping: 1 }), timeout]);
    return Response.json({ ok: true }, { headers });
  } catch (e) {
    console.error("Ping failed:", e);
    return Response.json({ ok: false }, { status: 503, headers });
  }
}
