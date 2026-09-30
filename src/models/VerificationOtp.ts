import mongoose, { Schema, Document } from "mongoose";

export interface IVerificationOtp extends Document {
  phone: string;
  email?: string;
  aadhaar?: string;
  code: string;
  sendAttempts: number;   // How many times OTP was sent (rate limiting)
  verifyAttempts: number; // How many wrong guesses made (brute-force protection)
  createdAt: Date;
}

const VerificationOtpSchema = new Schema<IVerificationOtp>({
  phone: { type: String, required: true },
  email: { type: String, default: "", lowercase: true, trim: true },
  aadhaar: { type: String, default: "" },
  code: { type: String, required: true },
  sendAttempts: { type: Number, default: 1 },
  verifyAttempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 600 } // Auto-deleted after 10 minutes
});

// Indexes for fast phone and email lookups
VerificationOtpSchema.index({ phone: 1 });
VerificationOtpSchema.index({ email: 1 });

export const VerificationOtp =
  mongoose.models?.VerificationOtp ||
  mongoose.model<IVerificationOtp>("VerificationOtp", VerificationOtpSchema);

