import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserRole } from "@/models/User";
import { Donor } from "@/models/Donor";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { sendWelcomeEmail } from "@/features/email/services/email.service";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, email, password, phone, role } = body;

    // 1. Validation
    if (!name || !email || !password || !phone || !role) {
      return NextResponse.json(
        { success: false, error: "All fields (name, email, password, phone, role) are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // 2. Duplicate Checks
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: "Email address is already registered." },
        { status: 400 }
      );
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return NextResponse.json(
        { success: false, error: "Phone number is already registered." },
        { status: 400 }
      );
    }

    // 3. Register via Better Auth
    const reqHeaders = await headers();
    const authResult = await auth.api.signUpEmail({
      headers: reqHeaders,
      body: {
        email: email.toLowerCase(),
        password,
        name,
      },
    });

    if (!authResult || !authResult.user) {
      return NextResponse.json(
        { success: false, error: "Authentication registration failed." },
        { status: 500 }
      );
    }

    // 4. Update role and details in User collection
    const userRole = role === "DONOR" ? UserRole.DONOR : UserRole.RECIPIENT;
    const updatedUser = await User.findByIdAndUpdate(
      authResult.user.id,
      {
        role: userRole,
        phone,
        status: "ACTIVE",
        emailVerified: false,
      },
      { new: true }
    );

    // 5. Create Donor Profile if selected role is DONOR
    if (userRole === UserRole.DONOR) {
      const donorCount = await Donor.countDocuments();
      const donorId = `DON-${new Date().getFullYear()}-${String(donorCount + 1001).padStart(4, "0")}`;
      await Donor.create({
        user: authResult.user.id,
        donorId,
        personalInformation: {
          dateOfBirth: new Date("1998-01-01"),
          gender: "Male",
          bloodGroup: "O+",
          nationality: "American",
          address: "Please update profile address",
          maritalStatus: "Single",
        },
        physicalAttributes: {
          height: 175,
          weight: 70,
          eyeColor: "Brown",
          hairColor: "Black",
          skinTone: "Medium",
        },
        medicalInformation: {
          eligibility: true,
          hemoglobin: 14.5,
          bloodPressure: "120/80",
          allergies: "None",
          diseases: "None",
          medications: "None",
          medicalNotes: "Self-declared healthy donor.",
        },
        donationInformation: {
          totalDonations: 0,
          certificates: [],
        },
        donationStatus: "PENDING",
        approvalStatus: "PENDING",
        createdBy: "Self Registration",
      });
    }

    // 6. Trigger welcome email notification (in try-catch so it doesn't crash signup if SMTP fails)
    try {
      await sendWelcomeEmail(email, name);
    } catch (emailErr) {
      console.error("Failed to send welcome email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Account registered successfully!",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
      },
    });

  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}
