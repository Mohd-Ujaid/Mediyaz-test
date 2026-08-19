import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mediyaz";

let client: MongoClient;

if (process.env.NODE_ENV === "development") {
  if (!(global as any)._mongoClient) {
    (global as any)._mongoClient = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });
  }
  client = (global as any)._mongoClient;
} else {
  client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 2000,
    maxPoolSize: 10,
    minPoolSize: 1,
  });
}

const db = client.db();


const authSecret = process.env.BETTER_AUTH_SECRET;
if (!authSecret) {
  throw new Error(
    "CRITICAL: BETTER_AUTH_SECRET environment variable is not set. " +
    "The application cannot start securely without it. Add it to your .env.local file."
  );
}

export const auth = betterAuth({
    secret: authSecret,

    database: mongodbAdapter(db),
    user: {
        modelName: "users",
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "RECIPIENT",
            },
            status: {
                type: "string",
                required: false,
                defaultValue: "ACTIVE",
            },
            department: {
                type: "string",
                required: false,
                defaultValue: "General",
            },
            permissions: {
                type: "string[]",
                required: false,
                defaultValue: ["READ_PORTAL"],
            },
            avatar: {
                type: "string",
                required: false,
            }
        }
    },
    session: {
        modelName: "sessions",
    },
    account: {
        modelName: "accounts",
    },
    verification: {
        modelName: "verifications",
    },
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        sendResetPassword: async ({ user, url }) => {
            // Import here to avoid circular dependencies
            const { sendEmail } = await import("@/features/email/services/email.service");
            await sendEmail({
                to: user.email,
                subject: "Mediyaz Portal: Password Reset Request",
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
                        <h2 style="color: #0f172a; margin-bottom: 16px;">Password Reset Request</h2>
                        <p style="color: #475569; margin-bottom: 16px;">
                            Hello ${user.name},<br/><br/>
                            We received a request to reset the password for your Mediyaz clinical portal account.
                        </p>
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${url}" style="background-color: #2F4F57; color: #ffffff; font-weight: bold; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block;">
                                Reset My Password
                            </a>
                        </div>
                        <p style="color: #94a3b8; font-size: 12px;">
                            This link expires in 1 hour. If you did not request a password reset, please ignore this email — your account remains secure.
                        </p>
                        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
                            — Mediyaz Clinical Operations Team
                        </p>
                    </div>
                `,
            });
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
    },
});
