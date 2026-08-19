import mongoose, { Schema, Document } from "mongoose";

export interface IVerificationOtp extends Document {
  phone: string;
  code: string;
  sendAttempts: number;   // How many times OTP was sent (rate limiting)
  verifyAttempts: number; // How many wrong guesses made (brute-force protection)
  createdAt: Date;
}

const VerificationOtpSchema = new Schema<IVerificationOtp>({
  phone: { type: String, required: true },
  code: { type: String, required: true },
  sendAttempts: { type: Number, default: 1 },
  verifyAttempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 600 } // Auto-deleted after 10 minutes
});

// Index for fast phone lookups
VerificationOtpSchema.index({ phone: 1 });

export const VerificationOtp =
  mongoose.models?.VerificationOtp ||
  mongoose.model<IVerificationOtp>("VerificationOtp", VerificationOtpSchema);
