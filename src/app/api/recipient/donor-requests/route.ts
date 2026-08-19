import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DonorRequest } from "@/models/DonorRequest";
import { Donor } from "@/models/Donor";
import { User } from "@/models/User";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

// GET: Fetch requests. If recipient, only returns their own. If admin, returns all.
export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }
    const userRole = (session.user as any).role;
    if (userRole !== "RECIPIENT" && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: Authorized access required." }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query: any = {};
    if (userRole === "RECIPIENT") {
      query.recipient = session.user.id;
    }

    const total = await DonorRequest.countDocuments(query);
    const rawRequests = await DonorRequest.find(query)
      .populate("recipient", "name email phone avatar")
      .populate({
        path: "donor",
        select: "donorId personalInformation physicalAttributes medicalInformation",
        populate: {
          path: "user",
          select: "name email avatar"
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Helper to calculate age
    const calculateAge = (dob: Date | string) => {
      if (!dob) return 0;
      const birth = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    // Sanitize populated donor info in requests
    const sanitizedRequests = rawRequests.map((requestDoc: any) => {
      const donor = requestDoc.donor;
      if (!donor) return requestDoc;

      const age = calculateAge(donor.personalInformation?.dateOfBirth);

      const sanitizedDonor = {
        _id: donor._id,
        donorId: donor.donorId,
        age,
        gender: donor.personalInformation?.gender || "Not Specified",
        bloodGroup: donor.personalInformation?.bloodGroup || "TBD",
        physicalAttributes: {
          height: donor.physicalAttributes?.height || 170,
          weight: donor.physicalAttributes?.weight || 65,
        },
        medicalInformation: {
          eligibility: donor.medicalInformation?.eligibility !== false,
        }
      };

      const reqObj = requestDoc.toObject();
      reqObj.donor = sanitizedDonor;
      return reqObj;
    });

    return NextResponse.json({ 
      success: true, 
      requests: sanitizedRequests,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        limit
      }
    });

  } catch (error: any) {
    console.error("Fetch donor requests error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST: Submit a request for a specific donor profile
export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    
    if (session) {
      const userRole = (session.user as any).role;
      if (!["RECIPIENT", "ADMIN", "SUPER_ADMIN", "DOCTOR", "STAFF", "RECEPTIONIST"].includes(userRole)) {
        return NextResponse.json({ success: false, error: "Forbidden: Unauthorized role." }, { status: 403 });
      }
    }

    await connectToDatabase();
    const { 
      donorId, 
      fullName, 
      email,
      age, 
      bloodGroup, 
      contactNumber, 
      medicalCondition = "", 
      message = "" 
    } = await req.json();

    if (!donorId || !fullName || !email || !age || !bloodGroup || !contactNumber) {
      return NextResponse.json({ success: false, error: "Patient name, email, age, blood group, and contact number are required." }, { status: 400 });
    }

    // Find the donor
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return NextResponse.json({ success: false, error: "Donor profile not found." }, { status: 404 });
    }

    if (donor.donationStatus !== "ACTIVE") {
      return NextResponse.json({ success: false, error: "Donor is no longer available for matching." }, { status: 400 });
    }

    // Check for existing pending request to avoid duplicates (only if user logged in)
    const existingRequest = session ? await DonorRequest.findOne({
      recipient: session.user.id,
      donor: donor._id,
      status: "PENDING"
    }) : null;

    if (existingRequest) {
      return NextResponse.json({
        success: false,
        error: "You already have a pending request for this donor profile."
      }, { status: 400 });
    }

    // Create donor request
    const donorRequest = await DonorRequest.create({
      recipient: session?.user?.id || null,
      donor: donor._id,
      fullName,
      email,
      age: Number(age),
      bloodGroup,
      contactNumber,
      medicalCondition,
      message,
      status: "PENDING"
    });

    return NextResponse.json({
      success: true,
      message: "Your donor request has been submitted successfully. The clinic will review availability and compatibility and contact you with the next steps.",
      request: donorRequest
    });

  } catch (error: any) {
    console.error("Create donor request error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update matching request status (Admin only)
export async function PUT(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }
    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: Authorized admin access required." }, { status: 403 });
    }

    await connectToDatabase();
    const { requestId, status } = await req.json();

    if (!requestId || !status) {
      return NextResponse.json({ success: false, error: "Request ID and Status are required." }, { status: 400 });
    }

    if (!["PENDING", "APPROVED", "REJECTED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status value." }, { status: 400 });
    }

    const donorRequest = await DonorRequest.findByIdAndUpdate(
      requestId,
      { status },
      { new: true, runValidators: false }
    );
    if (!donorRequest) {
      return NextResponse.json({ success: false, error: "Request not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Request status successfully updated to ${status}.`,
      request: donorRequest
    });

  } catch (error: any) {
    console.error("Update donor request error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
