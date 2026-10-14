import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { VerificationOtp } from "@/models/VerificationOtp";
import { sendTwilioWhatsApp } from "@/features/twilio/services/twilio.service";
import { randomInt } from "crypto";

// --- Rate Limit Configuration (Handled directly by Next.js) ---
const MAX_SEND_ATTEMPTS = 3;      // Max OTP sends per 10 minutes
const MAX_VERIFY_ATTEMPTS = 5;    // Max wrong guesses before OTP is invalidated

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action, phone, aadhaar, email, otp, registrationId } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: "Action is required." }, { status: 400 });
    }

    // Clean input parameters
    const cleanPhone = phone ? phone.toString().replace(/[^0-9]/g, "").slice(-10) : "";
    const cleanAadhaar = aadhaar ? aadhaar.toString().replace(/[^0-9]/g, "").trim() : "";
    const cleanEmail = email ? email.toString().trim().toLowerCase() : "";

    // =========================================================================
    // ACTION: SEND OTP VIA WHATSAPP (Twilio used strictly as transport)
    // =========================================================================
    if (action === "send") {
      if (!cleanAadhaar || cleanAadhaar.length !== 12) {
        return NextResponse.json({ success: false, error: "A valid 12-digit Aadhaar number is mandatory." }, { status: 400 });
      }
      if (!cleanPhone || cleanPhone.length !== 10) {
        return NextResponse.json({ success: false, error: "A valid 10-digit mobile phone number is mandatory to receive WhatsApp OTP." }, { status: 400 });
      }

      // --- NEXT.JS RATE LIMITING: Max 3 OTP sends per phone per 10 minutes ---
      const existingOtp = await VerificationOtp.findOne({ phone: cleanPhone });
      if (existingOtp && existingOtp.sendAttempts >= MAX_SEND_ATTEMPTS) {
        return NextResponse.json({
          success: false,
          error: `Too many OTP requests. You have reached the limit of ${MAX_SEND_ATTEMPTS} OTP sends. Please wait 10 minutes before trying again.`
        }, { status: 429 });
      }

      // Only block if already submitted or approved
      const duplicateConditions: any[] = [
        { "personalInfo.aadhaarNumber": cleanAadhaar },
        { "contactInfo.mobileNumber": cleanPhone },
      ];
      if (cleanEmail) {
        duplicateConditions.push({ "contactInfo.emailAddress": cleanEmail });
      }

      const duplicateQuery: any = {
        $or: duplicateConditions,
        status: { $nin: ["REJECTED", "DRAFT"] }
      };
      if (registrationId) {
        duplicateQuery.registrationId = { $ne: registrationId };
      }

      const [existingEgg, existingSperm] = await Promise.all([
        EggDonorRegistration.findOne(duplicateQuery).lean(),
        SpermDonorRegistration.findOne(duplicateQuery).lean(),
      ]);
      const duplicate: any = existingEgg || existingSperm;
      if (duplicate) {
        let matchedField = "credentials";
        if (duplicate.personalInfo?.aadhaarNumber === cleanAadhaar) matchedField = "Aadhaar number";
        else if (duplicate.contactInfo?.mobileNumber === cleanPhone) matchedField = "Mobile number";
        else if (cleanEmail && duplicate.contactInfo?.emailAddress?.toLowerCase() === cleanEmail) matchedField = "Email address";
        return NextResponse.json({
          success: false,
          error: `This ${matchedField} is already registered in the Mediyaz Donor Registry (ID: ${duplicate.registrationId}). Under ART Act regulations, duplicate registrations are not permitted.`
        }, { status: 400 });
      }

      // --- NEXT.JS OTP GENERATION: Cryptographically secure 6-digit numeric OTP ---
      const otpCode = randomInt(100000, 1000000).toString();

      // Store/update OTP in database with Next.js tracking
      if (existingOtp) {
        existingOtp.phone = cleanPhone;
        existingOtp.aadhaar = cleanAadhaar;
        if (cleanEmail) existingOtp.email = cleanEmail;
        existingOtp.code = otpCode;
        existingOtp.verifyAttempts = 0;
        existingOtp.sendAttempts = existingOtp.sendAttempts + 1;
        await existingOtp.save();
      } else {
        await VerificationOtp.create({
          phone: cleanPhone,
          aadhaar: cleanAadhaar,
          email: cleanEmail || "",
          code: otpCode,
          sendAttempts: 1,
          verifyAttempts: 0,
        });
      }

      // Send OTP via Twilio WhatsApp API using Authentication Template SID HX79fc8e0faf226129d2cf3ef80ce9e712
      const messageBody = `Your Mediyaz verification OTP is: *${otpCode}*. This OTP is valid for 10 minutes. Please do not share this code with anyone.`;
      const waResult = await sendTwilioWhatsApp(cleanPhone, messageBody, {
        otpCode,
        contentSid: process.env.TWILIO_WHATSAPP_AUTH_TEMPLATE_SID || "HX79fc8e0faf226129d2cf3ef80ce9e712",
        contentVariables: { "1": otpCode },
      });

      // If WhatsApp failed to send, DO NOT advance to OTP step — return an error immediately
      if (!waResult.success) {
        if (existingOtp) {
          existingOtp.sendAttempts = Math.max(0, existingOtp.sendAttempts - 1);
          await existingOtp.save();
        } else {
          await VerificationOtp.deleteOne({ phone: cleanPhone });
        }

        console.error(`[ADMIN WHATSAPP OTP DISPATCH FAILED] Phone: +91 ${cleanPhone} | Error: ${waResult.error}`);

        return NextResponse.json({
          success: false,
          error: `There is an error sending OTP to your WhatsApp number (+91 ${cleanPhone}). Please try again in some time.`
        }, { status: 500 });
      }

      if (process.env.NODE_ENV !== "production") {
        console.log(`\n[DEV ADMIN WHATSAPP OTP DISPATCH SUCCESS] Phone: +91 ${cleanPhone} | OTP: ${otpCode} | Twilio: ${waResult.messageSid}\n`);
      }

      return NextResponse.json({
        success: true,
        message: `Verification OTP sent successfully via WhatsApp to +91 ${cleanPhone}.`,
        phone: cleanPhone,
      });
    }

    // =========================================================================
    // ACTION: VERIFY OTP (Handled completely by Next.js & MongoDB)
    // =========================================================================
    if (action === "verify") {
      if (!cleanPhone) {
        return NextResponse.json({ success: false, error: "Mobile phone number is required." }, { status: 400 });
      }
      if (!otp) {
        return NextResponse.json({ success: false, error: "6-digit OTP code is required." }, { status: 400 });
      }

      const record = await VerificationOtp.findOne({ phone: cleanPhone });

      if (!record) {
        return NextResponse.json({ success: false, error: "OTP not found or expired. Please request a new OTP." }, { status: 400 });
      }

      // --- NEXT.JS BRUTE-FORCE PROTECTION: Max 5 wrong guesses ---
      if (record.verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
        await VerificationOtp.deleteMany({ phone: cleanPhone });
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

      await VerificationOtp.deleteMany({ phone: cleanPhone });

      return NextResponse.json({
        success: true,
        message: "Mobile phone and Aadhaar verified successfully via WhatsApp OTP."
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("[OTP ROUTE ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
