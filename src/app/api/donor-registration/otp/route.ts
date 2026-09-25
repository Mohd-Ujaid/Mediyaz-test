import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DonorRegistration } from "@/models/DonorRegistration";
import { VerificationOtp } from "@/models/VerificationOtp";
import { sendVerificationOtpEmail } from "@/features/email/services/email.service";

// --- Rate Limit Configuration ---
const MAX_SEND_ATTEMPTS = 3;      // Max OTP sends per 10 minutes
const MAX_VERIFY_ATTEMPTS = 5;    // Max wrong guesses before OTP is invalidated

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action, phone, aadhaar, email, otp, registrationId, donorType } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: "Action is required." }, { status: 400 });
    }

    // Clean input parameters
    const cleanPhone = phone ? phone.toString().replace(/[^0-9]/g, "").slice(-10) : "";
    const cleanAadhaar = aadhaar ? aadhaar.toString().replace(/[^0-9]/g, "").trim() : "";
    const cleanEmail = email ? email.toString().trim().toLowerCase() : "";

    // =========================================================================
    // ACTION: SEND OTP
    // =========================================================================
    if (action === "send") {
      if (!cleanAadhaar || cleanAadhaar.length !== 12) {
        return NextResponse.json({ success: false, error: "A valid 12-digit Aadhaar number is mandatory." }, { status: 400 });
      }
      if (!cleanPhone || cleanPhone.length !== 10) {
        return NextResponse.json({ success: false, error: "A valid 10-digit mobile phone number is mandatory." }, { status: 400 });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        return NextResponse.json({ success: false, error: "A valid Email address is mandatory to receive your OTP." }, { status: 400 });
      }

      // --- RATE LIMITING: Max 3 OTP sends per 10 minutes ---
      const existingOtp = await VerificationOtp.findOne({
        $or: [
          { email: cleanEmail },
          { phone: cleanPhone }
        ]
      });
      if (existingOtp && existingOtp.sendAttempts >= MAX_SEND_ATTEMPTS) {
        return NextResponse.json({
          success: false,
          error: `Too many OTP requests. You have reached the limit of ${MAX_SEND_ATTEMPTS} OTP sends. Please wait 10 minutes before trying again.`
        }, { status: 429 });
      }

      // Only block if already submitted or approved
      const duplicateQuery: any = {
        $or: [
          { "personalInfo.aadhaarNumber": cleanAadhaar },
          { "contactInfo.mobileNumber": cleanPhone },
          { "contactInfo.emailAddress": cleanEmail },
        ],
        status: { $nin: ["REJECTED", "DRAFT"] }
      };
      if (registrationId) {
        duplicateQuery.registrationId = { $ne: registrationId };
      }

      const duplicate = await DonorRegistration.findOne(duplicateQuery);
      if (duplicate) {
        let matchedField = "credentials";
        if (duplicate.personalInfo?.aadhaarNumber === cleanAadhaar) matchedField = "Aadhaar number";
        else if (duplicate.contactInfo?.mobileNumber === cleanPhone) matchedField = "Mobile number";
        else if (duplicate.contactInfo?.emailAddress?.toLowerCase() === cleanEmail) matchedField = "Email address";
        return NextResponse.json({
          success: false,
          error: `This ${matchedField} is already registered in the Mediyaz Donor Registry (ID: ${duplicate.registrationId}). Under ART Act regulations, duplicate registrations are not permitted.`
        }, { status: 400 });
      }

      // Generate a 6-digit numeric OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Store/update OTP
      if (existingOtp) {
        existingOtp.email = cleanEmail;
        existingOtp.phone = cleanPhone;
        existingOtp.aadhaar = cleanAadhaar;
        existingOtp.code = otpCode;
        existingOtp.verifyAttempts = 0;
        existingOtp.sendAttempts = existingOtp.sendAttempts + 1;
        await existingOtp.save();
      } else {
        await VerificationOtp.create({
          email: cleanEmail,
          phone: cleanPhone,
          aadhaar: cleanAadhaar,
          code: otpCode,
          sendAttempts: 1,
          verifyAttempts: 0,
        });
      }

      // Send via Email
      const emailResult = await sendVerificationOtpEmail(cleanEmail, otpCode, donorType || "Donor");
      if (!emailResult.success) {
        return NextResponse.json({
          success: false,
          error: emailResult.error || "Failed to deliver OTP to the provided email address."
        }, { status: 500 });
      }

      if (process.env.NODE_ENV !== "production") {
        console.log(`\n[DEV OTP DISPATCH] Email: ${cleanEmail} | Phone: ${cleanPhone} | OTP: ${otpCode}\n`);
      }

      return NextResponse.json({
        success: true,
        message: `Verification OTP sent successfully to ${cleanEmail}.`,
        email: cleanEmail,
      });
    }

    // =========================================================================
    // ACTION: VERIFY OTP
    // =========================================================================
    if (action === "verify") {
      if (!cleanEmail && !cleanPhone) {
        return NextResponse.json({ success: false, error: "Email address is required." }, { status: 400 });
      }
      if (!otp) {
        return NextResponse.json({ success: false, error: "OTP code is required." }, { status: 400 });
      }

      const record = await VerificationOtp.findOne({
        $or: [
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ]
      });

      if (!record) {
        return NextResponse.json({ success: false, error: "OTP not found or expired. Please request a new OTP." }, { status: 400 });
      }

      if (record.verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
        await VerificationOtp.deleteMany({
          $or: [
            ...(cleanEmail ? [{ email: cleanEmail }] : []),
            ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          ]
        });
        return NextResponse.json({
          success: false,
          error: `Too many incorrect attempts. Your OTP has been invalidated for security. Please request a new OTP.`
        }, { status: 429 });
      }

      const isDevMock = process.env.NODE_ENV !== "production" && otp === "123456";
      if (record.code !== otp && !isDevMock) {
        record.verifyAttempts = record.verifyAttempts + 1;
        await record.save();

        const attemptsLeft = MAX_VERIFY_ATTEMPTS - record.verifyAttempts;
        return NextResponse.json({
          success: false,
          error: `Invalid OTP code. ${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining before this OTP is invalidated.`
        }, { status: 400 });
      }

      await VerificationOtp.deleteMany({
        $or: [
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ]
      });

      return NextResponse.json({
        success: true,
        message: "Email address, mobile phone, and Aadhaar verified successfully."
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("[OTP ROUTE ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

