// src/lib/db/mongo.ts
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

// Warn instead of crash — lets the app run without DB in dev
if (!uri) {
  console.warn("⚠️  MONGODB_URI not set. Database features will be disabled.");
}

let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}

if (uri) {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    const client = new MongoClient(uri);
    clientPromise = client.connect();
  }
} else {
  // Return a promise that never resolves — getPosts() will catch the timeout
  clientPromise = new Promise(() => {});
}

export default clientPromise;