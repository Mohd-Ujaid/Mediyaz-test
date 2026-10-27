import { MongoClient, ObjectId } from "mongodb";
import fs from "fs";

if (!process.env.MONGODB_URI && fs.existsSync(".env")) {
  const envContent = fs.readFileSync(".env", "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    const val = rest.join("=").replace(/^['"]|['"]$/g, "").trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://mdujjaid0786_db_user:hGvZqnj32Bm3KOrc@cluster0.yvprhjr.mongodb.net/mediyaz";

async function main() {
  console.log("Connecting to MongoDB Atlas...");
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  console.log("=== PHASE 1: DATABASE CLEANSING ===");

  // 1. Drop orphaned duplicate collections
  const collections = (await db.listCollections().toArray()).map(c => c.name);
  if (collections.includes("eggdonorregistrations")) {
    await db.collection("eggdonorregistrations").drop();
    console.log("✓ Dropped legacy orphaned collection: eggdonorregistrations");
  }
  if (collections.includes("spermdonorregistrations")) {
    await db.collection("spermdonorregistrations").drop();
    console.log("✓ Dropped legacy orphaned collection: spermdonorregistrations");
  }

  // 2. Remove garbage hospital record "cverver"
  const deleteResult = await db.collection("hospitals").deleteMany({
    $or: [
      { name: { $regex: /^cverver$/i } },
      { shortName: { $regex: /^cverver$/i } }
    ]
  });
  console.log(`✓ Deleted dummy/garbage hospitals: ${deleteResult.deletedCount}`);

  // 3. Fix missing contactInfo.mobileNumber in seeded donor registrations
  const defaultPhones = [
    { regId: "MED-ED-2026-9001", phone: "9811234561" },
    { regId: "MED-ED-2026-9002", phone: "9811234562" },
    { regId: "MED-ED-2026-9004", phone: "9811234563" },
    { regId: "MED-ED-2026-9005", phone: "9811234564" },
    { regId: "MED-SD-2026-9003", phone: "9811234565" },
    { regId: "MED-SD-2026-9006", phone: "9811234566" },
  ];

  for (const item of defaultPhones) {
    await db.collection("egg_donor_registrations").updateOne(
      { registrationId: item.regId, $or: [{ "contactInfo.mobileNumber": { $exists: false } }, { "contactInfo.mobileNumber": null }, { "contactInfo.mobileNumber": "" }] },
      { $set: { "contactInfo.mobileNumber": item.phone } }
    );
    await db.collection("sperm_donor_registrations").updateOne(
      { registrationId: item.regId, $or: [{ "contactInfo.mobileNumber": { $exists: false } }, { "contactInfo.mobileNumber": null }, { "contactInfo.mobileNumber": "" }] },
      { $set: { "contactInfo.mobileNumber": item.phone } }
    );
  }
  console.log("✓ Normalized mobile numbers for seeded test donors");

  // 4. Ensure donor "babita" has a donorId if missing
  await db.collection("egg_donor_registrations").updateOne(
    { registrationId: "MED-ED-2026-59611478", donorId: { $in: [null, undefined, ""] } },
    { $set: { donorId: "MED-ED-2026-1002" } }
  );
  console.log("✓ Assigned donorId to unassigned verified donor");

  await client.close();
  console.log("=== PHASE 1 COMPLETED SUCCESSFULLY ===");
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
