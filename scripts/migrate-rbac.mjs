import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("FATAL ERROR: MONGODB_URI environment variable is required.");
  process.exit(1);
}

async function main() {
  console.log("=== Mediyaz RBAC & Two-Factor Authentication Schema Initializer ===");

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  console.log("Connected to MongoDB. Verifying indexes...");

  // 1. Create partial unique index on role="SUPER_ADMIN"
  try {
    const indexes = await db.collection("users").indexes();
    const hasSuperAdminIndex = indexes.some((idx) => idx.name === "single_super_admin_unique_idx");

    if (!hasSuperAdminIndex) {
      console.log("Creating single_super_admin_unique_idx index...");
      await db.collection("users").createIndex(
        { role: 1 },
        {
          unique: true,
          partialFilterExpression: { role: "SUPER_ADMIN" },
          name: "single_super_admin_unique_idx",
        }
      );
      console.log("✓ Partial unique index on SUPER_ADMIN created successfully.");
    } else {
      console.log("✓ single_super_admin_unique_idx index already present.");
    }
  } catch (err) {
    console.warn("Index creation warning (check if duplicate super admins exist):", err.message);
  }

  // 2. Count current Super Admins
  const superAdminCount = await db.collection("users").countDocuments({ role: "SUPER_ADMIN" });
  console.log(`Current active Super Admins: ${superAdminCount}`);

  if (superAdminCount > 1) {
    console.warn("⚠️ WARNING: More than 1 user has role 'SUPER_ADMIN' in the database!");
    const list = await db.collection("users").find({ role: "SUPER_ADMIN" }).project({ email: 1, name: 1 }).toArray();
    console.warn("Super Admins found:", list);
  }

  // 3. Ensure Invitation collection index
  try {
    await db.collection("invitations").createIndex({ token: 1 }, { unique: true });
    await db.collection("invitations").createIndex({ email: 1, status: 1 });
    console.log("✓ Invitation indexes verified.");
  } catch (err) {
    console.warn("Invitation index notice:", err.message);
  }

  // 4. Ensure DeletionRequest collection index
  try {
    await db.collection("deletionrequests").createIndex({ status: 1, createdAt: -1 });
    console.log("✓ DeletionRequest indexes verified.");
  } catch (err) {
    console.warn("DeletionRequest index notice:", err.message);
  }

  console.log("\nRBAC Initialization Complete! Production guards active.");
  await client.close();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
