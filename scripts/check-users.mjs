import { MongoClient } from "mongodb";
import fs from "fs";

let uri = process.env.MONGODB_URI;
if (!uri && fs.existsSync(".env")) {
  const envContent = fs.readFileSync(".env", "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("MONGODB_URI=")) {
      uri = trimmed.slice("MONGODB_URI=".length).replace(/['"]/g, "").trim();
      break;
    }
  }
}

if (!uri) {
  console.error("MONGODB_URI not found");
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db();
const users = await db.collection("users").find({}).project({ email: 1, name: 1, role: 1, twoFactorEnabled: 1 }).toArray();
console.log("USERS_LIST:", JSON.stringify(users, null, 2));
await client.close();
