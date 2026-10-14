import { MongoClient, ObjectId } from "mongodb";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://mdujjaid0786_db_user:hGvZqnj32Bm3KOrc@cluster0.yvprhjr.mongodb.net/mediyaz";
const authSecret = process.env.BETTER_AUTH_SECRET || "your_32_character_secret_key";

async function main() {
  console.log("=== Mediyaz ART Bank: Complete Database Reset & Seed ===");
  console.log("Connecting to MongoDB...");
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();
    console.log("Connected to database:", db.databaseName);

    // 1. Drop all collections
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections to purge.`);
    for (const col of collections) {
      if (!col.name.startsWith("system.")) {
        await db.collection(col.name).drop();
        console.log(`  ✓ Dropped collection: ${col.name}`);
      }
    }

    // 2. Seed Super Admin via better-auth
    console.log("\n--> Seeding Super Administrator via better-auth...");
    const adminEmail = "admin@mediyaz.com";
    const adminPassword = "adminpassword";

    const auth = betterAuth({
      secret: authSecret,
      advanced: {
        cookiePrefix: "mediyaz-admin",
      },
      database: mongodbAdapter(db),
      user: {
        modelName: "users",
        additionalFields: {
          role: { type: "string", defaultValue: "RECIPIENT" },
          status: { type: "string", defaultValue: "ACTIVE" },
          department: { type: "string", defaultValue: "General" },
          permissions: { type: "string[]", defaultValue: ["READ_PORTAL"] },
        },
      },
      session: { modelName: "sessions" },
      account: { modelName: "accounts" },
      verification: { modelName: "verifications" },
      emailAndPassword: {
        enabled: true,
        autoSignIn: false,
      },
    });

    await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        password: adminPassword,
        name: "Mediyaz Super Admin",
      },
    });

    await db.collection("users").updateOne(
      { email: adminEmail },
      {
        $set: {
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          department: "Administration",
          permissions: ["*"],
          emailVerified: true,
        },
      }
    );

    console.log(`  ✓ Super Admin created: ${adminEmail}`);
    console.log(`  ✓ Password configured: ${adminPassword}`);

    // 3. Create clean indexes on Egg & Sperm donor registration collections
    console.log("\n--> Initializing clean schema indexes...");
    const eggCol = db.collection("eggdonorregistrations");
    await eggCol.createIndex({ registrationId: 1 }, { unique: true });
    await eggCol.createIndex({ "personalInfo.aadhaarNumber": 1 });
    await eggCol.createIndex({ "contactInfo.mobileNumber": 1 });
    await eggCol.createIndex({ status: 1 });
    await eggCol.createIndex({ createdAt: -1 });
    console.log("  ✓ Created indexes for eggdonorregistrations");

    const spermCol = db.collection("spermdonorregistrations");
    await spermCol.createIndex({ registrationId: 1 }, { unique: true });
    await spermCol.createIndex({ "personalInfo.aadhaarNumber": 1 });
    await spermCol.createIndex({ "contactInfo.mobileNumber": 1 });
    await spermCol.createIndex({ status: 1 });
    await spermCol.createIndex({ createdAt: -1 });
    console.log("  ✓ Created indexes for spermdonorregistrations");

    // Previous Donors index (for ART Act single lifetime donation compliance check)
    const prevCol = db.collection("previous_donors");
    await prevCol.createIndex({ "personalInfo.aadhaarNumber": 1 });
    await prevCol.createIndex({ "contactInfo.mobileNumber": 1 });
    console.log("  ✓ Created indexes for previous_donors");

    // Verification OTP index (with TTL of 15 minutes)
    const otpCol = db.collection("verificationotps");
    await otpCol.createIndex({ phone: 1 });
    await otpCol.createIndex({ createdAt: 1 }, { expireAfterSeconds: 900 });
    console.log("  ✓ Created indexes for verificationotps");

    console.log("\n=================================================");
    console.log(" DATABASE RESET AND CLEAN SEEDING SUCCESSFUL!    ");
    console.log(" Admin Portal Login:                             ");
    console.log(" Email:    admin@mediyaz.com                     ");
    console.log(" Password: adminpassword                         ");
    console.log("=================================================");
  } catch (error) {
    console.error("Reset failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
