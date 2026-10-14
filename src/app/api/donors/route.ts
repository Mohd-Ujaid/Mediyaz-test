import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
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
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN" && userRole !== "STAFF" && userRole !== "DOCTOR") {
      return NextResponse.json({ success: false, error: "Forbidden: Authorized access required." }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const bloodGroup = searchParams.get("bloodGroup") || "";
    const status = searchParams.get("status") || "";
    const city = searchParams.get("city") || "";

    const query: any = {};
    if (bloodGroup) query["personalInfo.bloodGroup"] = bloodGroup;
    if (status) query.status = status;
    if (city) query["contactInfo.city"] = city;

    const escapeRegex = (s: string) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { registrationId: { $regex: safeSearch, $options: "i" } },
        { "personalInfo.fullName": { $regex: safeSearch, $options: "i" } },
        { "contactInfo.city": { $regex: safeSearch, $options: "i" } },
        { "contactInfo.mobileNumber": { $regex: safeSearch, $options: "i" } },
      ];
    }

    const [eggList, spermList] = await Promise.all([
      EggDonorRegistration.find(query).sort({ createdAt: -1 }).lean(),
      SpermDonorRegistration.find(query).sort({ createdAt: -1 }).lean(),
    ]);

    const normalizeDonor = (d: any, donorType: string) => ({
      _id: d._id,
      donorId: d.registrationId,
      donorType,
      personalInformation: {
        fullName: d.personalInfo?.fullName || "Donor",
        gender: donorType === "egg" ? "Female" : "Male",
        bloodGroup: d.personalInfo?.bloodGroup || "N/A",
        dateOfBirth: d.personalInfo?.dateOfBirth,
        nationality: "Indian",
        address: d.contactInfo?.currentAddress || "",
        maritalStatus: d.personalInfo?.maritalStatus || "",
      },
      physicalAttributes: {
        height: Number(d.personalInfo?.height) || 0,
        weight: Number(d.personalInfo?.weight) || 0,
        eyeColor: d.personalInfo?.eyeColor,
        hairColor: d.personalInfo?.hairColor,
        skinTone: d.personalInfo?.complexion,
      },
      contactInformation: {
        city: d.contactInfo?.city || "",
        state: d.contactInfo?.state || "",
        pinCode: d.contactInfo?.pincode || "",
      },
      donationStatus: d.status === "APPROVED" ? "ACTIVE" : d.status,
      approvalStatus: d.status,
      createdAt: d.createdAt,
    });

    const donors = [
      ...eggList.map((d: any) => normalizeDonor(d, "egg")),
      ...spermList.map((d: any) => normalizeDonor(d, "sperm")),
    ].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return NextResponse.json({ success: true, donors });

  } catch (error: any) {
    console.error("Fetch donors error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
