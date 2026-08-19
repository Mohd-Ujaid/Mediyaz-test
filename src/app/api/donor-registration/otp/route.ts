import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DonorRegistration } from "@/models/DonorRegistration";
import { VerificationOtp } from "@/models/VerificationOtp";
import { sendTwilioWhatsApp } from "@/features/twilio/services/twilio.service";

// --- Rate Limit Configuration ---
const MAX_SEND_ATTEMPTS = 3;      // Max OTP sends per 10 minutes per phone number
const MAX_VERIFY_ATTEMPTS = 5;    // Max wrong guesses before OTP is invalidated

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action, phone, aadhaar, otp, registrationId } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: "Action is required." }, { status: 400 });
    }

    // Clean input parameters
    const cleanPhone = phone ? phone.replace(/[^0-9+]/g, "") : "";
    const cleanAadhaar = aadhaar ? aadhaar.replace(/[^0-9]/g, "") : "";

    // =========================================================================
    // ACTION: SEND OTP
    // =========================================================================
    if (action === "send") {
      if (!cleanPhone || cleanPhone.length < 10) {
        return NextResponse.json({ success: false, error: "Valid mobile phone number is required." }, { status: 400 });
      }
      if (!cleanAadhaar || cleanAadhaar.length !== 12) {
        return NextResponse.json({ success: false, error: "A valid 12-digit Aadhaar number is required." }, { status: 400 });
      }

      // --- RATE LIMITING: Max 3 OTP sends per phone per 10 minutes ---
      const existingOtp = await VerificationOtp.findOne({ phone: cleanPhone });
      if (existingOtp && existingOtp.sendAttempts >= MAX_SEND_ATTEMPTS) {
        return NextResponse.json({
          success: false,
          error: `Too many OTP requests. You have reached the limit of ${MAX_SEND_ATTEMPTS} OTP sends. Please wait 10 minutes before trying again.`
        }, { status: 429 });
      }

      // Check if Aadhaar is already registered in the system (status !== REJECTED)
      // If registrationId is provided, ignore the record matching this registrationId (to allow resuming)
      const duplicateQuery: any = {
        "personalInfo.aadhaarNumber": cleanAadhaar,
        status: { $ne: "REJECTED" }
      };
      if (registrationId) {
        duplicateQuery.registrationId = { $ne: registrationId };
      }

      const duplicate = await DonorRegistration.findOne(duplicateQuery);
      if (duplicate) {
        return NextResponse.json({
          success: false,
          error: "This Aadhaar number is already registered in the Mediyaz Donor Registry. You cannot register again."
        }, { status: 400 });
      }

      // Generate a 6-digit numeric OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Store/update OTP — increment sendAttempts if record exists, create fresh if not
      if (existingOtp) {
        existingOtp.code = otpCode;
        existingOtp.verifyAttempts = 0; // Reset verify attempts on resend
        existingOtp.sendAttempts = existingOtp.sendAttempts + 1;
        await existingOtp.save();
      } else {
        await VerificationOtp.create({
          phone: cleanPhone,
          code: otpCode,
          sendAttempts: 1,
          verifyAttempts: 0,
        });
      }

      // Send via Twilio WhatsApp
      const messageBody = `Your Mediyaz OTP verification code is: *${otpCode}*. It is valid for 5 minutes. Do not share this code with anyone.`;
      const waResult = await sendTwilioWhatsApp(cleanPhone, messageBody);

      // Print OTP in server console ONLY in development mode (never log Aadhaar in production)
      if (process.env.NODE_ENV !== "production") {
        console.log(`\n[DEV OTP DISPATCH] Phone: ${cleanPhone} | OTP: ${otpCode} | Simulated: ${!!waResult.simulated}\n`);
      }

      return NextResponse.json({
        success: true,
        message: "Verification OTP sent successfully via WhatsApp.",
        simulated: !!waResult.simulated
      });
    }

    // =========================================================================
    // ACTION: VERIFY OTP
    // =========================================================================
    if (action === "verify") {
      if (!cleanPhone) {
        return NextResponse.json({ success: false, error: "Phone number is required." }, { status: 400 });
      }
      if (!otp) {
        return NextResponse.json({ success: false, error: "OTP code is required." }, { status: 400 });
      }

      const record = await VerificationOtp.findOne({ phone: cleanPhone });

      // No OTP record exists (expired or never sent)
      if (!record) {
        return NextResponse.json({ success: false, error: "OTP not found or expired. Please request a new OTP." }, { status: 400 });
      }

      // --- BRUTE-FORCE PROTECTION: Max 5 wrong guesses ---
      if (record.verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
        // Invalidate the OTP entirely after too many wrong attempts
        await VerificationOtp.deleteMany({ phone: cleanPhone });
        return NextResponse.json({
          success: false,
          error: `Too many incorrect attempts. Your OTP has been invalidated for security. Please request a new OTP.`
        }, { status: 429 });
      }

      // Check if OTP matches
      if (record.code !== otp) {
        // Increment wrong attempt count
        record.verifyAttempts = record.verifyAttempts + 1;
        await record.save();

        const attemptsLeft = MAX_VERIFY_ATTEMPTS - record.verifyAttempts;
        return NextResponse.json({
          success: false,
          error: `Invalid OTP code. ${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining before this OTP is invalidated.`
        }, { status: 400 });
      }

      // OTP matched — delete the record (one-time use)
      await VerificationOtp.deleteMany({ phone: cleanPhone });

      return NextResponse.json({
        success: true,
        message: "Mobile phone and Aadhaar verified successfully."
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("[OTP ROUTE ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
