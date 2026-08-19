import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Donor } from "@/models/Donor";
import { User, UserRole } from "@/models/User";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }
    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN" && userRole !== "DONOR") {
      return NextResponse.json({ success: false, error: "Forbidden: Authorized access required." }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    // Search and filters
    const search = searchParams.get("search") || "";
    const bloodGroup = searchParams.get("bloodGroup") || "";
    const gender = searchParams.get("gender") || "";
    const status = searchParams.get("status") || "";
    const city = searchParams.get("city") || "";

    const query: any = {};
    if (userRole === "DONOR") {
      query.user = session.user.id;
    }

    // 1. Text Search Filter (on Donor schema or populated fields)
    if (search) {
      query.$or = [
        { donorId: { $regex: search, $options: "i" } },
        { "personalInformation.nationality": { $regex: search, $options: "i" } },
        { "personalInformation.address": { $regex: search, $options: "i" } },
        { "contactInformation.city": { $regex: search, $options: "i" } },
      ];
    }

    // 2. Exact match filters
    if (bloodGroup) query["personalInformation.bloodGroup"] = bloodGroup;
    if (gender) query["personalInformation.gender"] = gender;
    if (status) query.donationStatus = status;
    if (city) query["contactInformation.city"] = city;

    let donors = await Donor.find(query)
      .populate("user", "name email phone avatar status lastLogin createdAt")
      .sort({ createdAt: -1 });

    // 3. Post-populate search for User fields (name, email, phone)
    if (search) {
      const reg = new RegExp(search, "i");
      donors = donors.filter((d: any) => 
        d.donorId?.toLowerCase().includes(search.toLowerCase()) ||
        reg.test(d.user?.name || "") ||
        reg.test(d.user?.email || "") ||
        reg.test(d.user?.phone || "")
      );
    }

    return NextResponse.json({ success: true, donors });

  } catch (error: any) {
    console.error("Fetch donors error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }
    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN" && userRole !== "DONOR") {
      return NextResponse.json({ success: false, error: "Forbidden: Authorized access required." }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();

    // 1. Validate required user details
    const { name, email, phone, personalInformation, physicalAttributes } = body;
    if (!name || !email || !phone) {
      return NextResponse.json({ success: false, error: "Name, email, and phone are required." }, { status: 400 });
    }

    // 2. Find or create User
    let user;
    if (userRole === "DONOR") {
      user = await User.findById(session.user.id);
      if (!user) {
        return NextResponse.json({ success: false, error: "User profile not found." }, { status: 404 });
      }
      // Force name/email matching to session
      user.phone = phone || user.phone;
      await user.save();
    } else {
      user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        user = await User.create({
          name,
          email: email.toLowerCase(),
          phone,
          role: UserRole.DONOR,
          status: "ACTIVE",
          emailVerified: true
        });
      } else {
        user.role = UserRole.DONOR;
        user.phone = phone;
        await user.save();
      }
    }

    // Generate Donor ID
    const count = await Donor.countDocuments();
    const donorId = `DON-${new Date().getFullYear()}-${String(count + 1001).padStart(4, "0")}`;

    // 3. Create Donor profile
    const donor = await Donor.create({
      user: user._id,
      donorId,
      personalInformation: {
        dateOfBirth: personalInformation?.dateOfBirth ? new Date(personalInformation.dateOfBirth) : new Date("1998-01-01"),
        gender: personalInformation?.gender || "Male",
        bloodGroup: personalInformation?.bloodGroup || "O+",
        nationality: personalInformation?.nationality || "American",
        address: personalInformation?.address || "Please update address",
        maritalStatus: personalInformation?.maritalStatus || "Single",
      },
      physicalAttributes: {
        height: Number(physicalAttributes?.height) || 175,
        weight: Number(physicalAttributes?.weight) || 70,
        eyeColor: physicalAttributes?.eyeColor || "Brown",
        hairColor: physicalAttributes?.hairColor || "Black",
        skinTone: physicalAttributes?.skinTone || "Medium",
      },
      contactInformation: body.contactInformation || {
        emergencyContactName: "",
        emergencyContactPhone: "",
        city: "",
        state: "",
        country: "",
        pinCode: "",
      },
      medicalInformation: body.medicalInformation || {
        eligibility: true,
        hemoglobin: 14.5,
        bloodPressure: "120/80",
        allergies: "None",
        diseases: "None",
        medications: "None",
        medicalNotes: "N/A",
      },
      donationInformation: {
        totalDonations: 0,
        certificates: [],
      },
      donationStatus: "ACTIVE",
      approvalStatus: "APPROVED",
      tags: body.tags || ["Frozen"],
      createdBy: body.createdBy || "Admin Console",
    });

    return NextResponse.json({
      success: true,
      message: "Donor profile created successfully!",
      donor,
    });

  } catch (error: any) {
    console.error("Create donor error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }
    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN" && userRole !== "DONOR") {
      return NextResponse.json({ success: false, error: "Forbidden: Authorized access required." }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { donorId, name, email, phone, status, ...updateFields } = body;

    if (!donorId) {
      return NextResponse.json({ success: false, error: "Donor ID is required." }, { status: 400 });
    }

    // 1. Fetch donor and verify
    const donor = await Donor.findOne({ donorId });
    if (!donor) {
      return NextResponse.json({ success: false, error: "Donor record not found." }, { status: 404 });
    }

    // Ownership check for donors
    if (userRole === "DONOR" && donor.user.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden: You do not own this profile." }, { status: 403 });
    }

    // 2. Update linked User if name, email, phone or status are changed
    if (donor.user && (name || email || phone || status)) {
      const userUpdate: any = {};
      if (name) userUpdate.name = name;
      if (email) userUpdate.email = email.toLowerCase();
      if (phone) userUpdate.phone = phone;
      if (status) userUpdate.status = status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
      await User.findByIdAndUpdate(donor.user, userUpdate);
    }

    // 3. Update Donor record
    const finalUpdate: any = { ...updateFields };
    if (status) {
      finalUpdate.donationStatus = status;
      finalUpdate.approvalStatus = status === "ACTIVE" ? "APPROVED" : "REJECTED";
    }

    const updatedDonor = await Donor.findOneAndUpdate(
      { donorId },
      { $set: finalUpdate },
      { new: true }
    ).populate("user", "name email phone avatar status");

    return NextResponse.json({
      success: true,
      message: "Donor profile updated successfully!",
      donor: updatedDonor,
    });

  } catch (error: any) {
    console.error("Update donor error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }
    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required." }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const donorId = searchParams.get("donorId");

    if (!donorId) {
      return NextResponse.json({ success: false, error: "Donor ID is required." }, { status: 400 });
    }

    const donor = await Donor.findOne({ donorId });
    if (!donor) {
      return NextResponse.json({ success: false, error: "Donor record not found." }, { status: 404 });
    }

    // Delete linked User and Donor
    if (donor.user) {
      await User.findByIdAndDelete(donor.user);
    }
    await Donor.deleteOne({ donorId });

    return NextResponse.json({
      success: true,
      message: "Donor record and associated user login deleted successfully."
    });

  } catch (error: any) {
    console.error("Delete donor error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
