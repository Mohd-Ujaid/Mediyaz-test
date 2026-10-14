import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DonorRequest } from "@/models/DonorRequest";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      requests: rawRequests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error("Fetch donor requests error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Submit a new request for a donor
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

    const donor = await SpermDonorRegistration.findById(donorId) || await EggDonorRegistration.findById(donorId);
    if (!donor) {
      return NextResponse.json({ success: false, error: "Donor profile not found." }, { status: 404 });
    }

    const existingRequest = session ? await DonorRequest.findOne({
      recipient: session.user.id,
      donor: donor._id,
      status: "PENDING"
    }) : null;

    if (existingRequest) {
      return NextResponse.json({ success: false, error: "You already have a pending request for this donor profile." }, { status: 400 });
    }

    const newRequest = await DonorRequest.create({
      recipient: session ? session.user.id : undefined,
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
      message: "Donor consultation inquiry submitted successfully. The clinical team will contact you shortly.",
      request: newRequest
    }, { status: 201 });

  } catch (error: any) {
    console.error("Create donor request error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
