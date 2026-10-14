import { MongoClient } from "mongodb";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://mdujjaid0786_db_user:hGvZqnj32Bm3KOrc@cluster0.yvprhjr.mongodb.net/mediyaz";
const authSecret = process.env.BETTER_AUTH_SECRET || "your_32_character_secret_key";

async function main() {
  const args = process.argv.slice(2);
  const email = (args[0] || "admin@mediyaz.com").toLowerCase().trim();
  const password = args[1] || "adminpassword";
  const role = (args[2] || "SUPER_ADMIN").toUpperCase().trim();
  const name = args[3] || (role === "SUPER_ADMIN" ? "Mediyaz Super Admin" : "Mediyaz Administrator");

  console.log("=== Mediyaz Administrator Account Creator ===");
  console.log(`Target Email:    ${email}`);
  console.log(`Target Role:     ${role}`);
  console.log(`Target Name:     ${name}`);

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  const auth = betterAuth({
    secret: authSecret,
    advanced: { cookiePrefix: "mediyaz-admin" },
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

  const existing = await db.collection("users").findOne({ email });

  if (existing) {
    console.log(`User ${email} already exists. Updating role and password...`);
    // Delete old account credential to re-create clean password
    await db.collection("accounts").deleteMany({ userId: existing._id, providerId: "credential" });
    await db.collection("accounts").deleteMany({ accountId: existing._id.toString(), providerId: "credential" });

    // Use Better Auth internal hash
    const { hashPassword } = await import("better-auth/crypto");
    const passwordHash = await hashPassword(password);

    await db.collection("accounts").insertOne({
      accountId: existing._id.toString(),
      providerId: "credential",
      userId: existing._id,
      password: passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.collection("users").updateOne(
      { _id: existing._id },
      {
        $set: {
          name,
          role,
          status: "ACTIVE",
          department: role === "SUPER_ADMIN" ? "Administration" : "Management",
          permissions: role === "SUPER_ADMIN" ? ["*"] : ["VIEW_DASHBOARD", "VIEW_REGISTRATIONS", "VIEW_REG_CHECKS", "VIEW_USERS"],
          emailVerified: true,
          updatedAt: new Date(),
        },
      }
    );
    console.log(`✓ User ${email} password and role (${role}) updated successfully!`);
  } else {
    console.log(`Registering new account via Better-Auth...`);
    const signup = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (!signup?.user?.id) {
      throw new Error("Better Auth registration failed.");
    }

    await db.collection("users").updateOne(
      { email },
      {
        $set: {
          role,
          status: "ACTIVE",
          department: role === "SUPER_ADMIN" ? "Administration" : "Management",
          permissions: role === "SUPER_ADMIN" ? ["*"] : ["VIEW_DASHBOARD", "VIEW_REGISTRATIONS", "VIEW_REG_CHECKS", "VIEW_USERS"],
          emailVerified: true,
          updatedAt: new Date(),
        },
      }
    );
    console.log(`✓ Account ${email} created successfully with role ${role}!`);
  }

  // Verify login
  console.log("Verifying credentials...");
  const signInRes = await auth.api.signInEmail({
    body: {
      email,
      password,
    },
  });

  if (signInRes?.user) {
    console.log(`✓ Verification PASSED! User ID: ${signInRes.user.id}, Role: ${signInRes.user.role}`);
    console.log(`\nYou can now log in at http://localhost:3000/login with:`);
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
  } else {
    console.warn("Sign in verification returned no user object.");
  }

  await client.close();
}

main().catch((err) => {
  console.error("Failed to create admin:", err);
  process.exit(1);
});
