import { MongoClient } from "mongodb";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

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

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("FATAL ERROR: MONGODB_URI environment variable is required.");
  process.exit(1);
}
const authSecret = process.env.BETTER_AUTH_SECRET;
if (!authSecret) {
  console.error("FATAL ERROR: BETTER_AUTH_SECRET environment variable is required.");
  process.exit(1);
}

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

  if (role === "SUPER_ADMIN") {
    const existingSuperAdmin = await db.collection("users").findOne({ role: "SUPER_ADMIN" });
    if (existingSuperAdmin && existingSuperAdmin.email !== email) {
      console.error(`\n❌ SECURITY ERROR: Strictly ONLY ONE Super Administrator is allowed in the system.`);
      console.error(`An active Super Admin already exists with email: ${existingSuperAdmin.email}`);
      console.error(`To transfer root authority or update credentials, use the existing email or perform an ownership transfer.`);
      await client.close();
      process.exit(1);
    }
  }

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
          permissions:
            role === "SUPER_ADMIN"
              ? ["*"]
              : [
                  "VIEW_DASHBOARD",
                  "VIEW_ANALYTICS",
                  "VIEW_REGISTRATIONS",
                  "CREATE_REGISTRATIONS",
                  "EDIT_REGISTRATIONS",
                  "APPROVE_REGISTRATIONS",
                  "ASSIGN_REGISTRATIONS",
                  "EXPORT_REGISTRATIONS",
                  "VIEW_HOSPITALS",
                  "MANAGE_HOSPITALS",
                  "VIEW_INVOICES",
                  "MANAGE_INVOICES",
                  "VIEW_LEDGER",
                  "MANAGE_LEDGER",
                  "VIEW_EMPLOYEES",
                  "MANAGE_EMPLOYEES",
                  "VIEW_USERS",
                  "MANAGE_USERS",
                  "MANAGE_CMS",
                  "VIEW_REG_CHECKS",
                ],
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
          permissions:
            role === "SUPER_ADMIN"
              ? ["*"]
              : [
                  "VIEW_DASHBOARD",
                  "VIEW_ANALYTICS",
                  "VIEW_REGISTRATIONS",
                  "CREATE_REGISTRATIONS",
                  "EDIT_REGISTRATIONS",
                  "APPROVE_REGISTRATIONS",
                  "ASSIGN_REGISTRATIONS",
                  "EXPORT_REGISTRATIONS",
                  "VIEW_HOSPITALS",
                  "MANAGE_HOSPITALS",
                  "VIEW_INVOICES",
                  "MANAGE_INVOICES",
                  "VIEW_LEDGER",
                  "MANAGE_LEDGER",
                  "VIEW_EMPLOYEES",
                  "MANAGE_EMPLOYEES",
                  "VIEW_USERS",
                  "MANAGE_USERS",
                  "MANAGE_CMS",
                  "VIEW_REG_CHECKS",
                ],
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
