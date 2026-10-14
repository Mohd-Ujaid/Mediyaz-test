import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const bloodGroup = searchParams.get("bloodGroup") || "";
    const ageMin = parseInt(searchParams.get("ageMin") || "18");
    const ageMax = parseInt(searchParams.get("ageMax") || "60");

    const query: any = {
      status: { $in: ["APPROVED", "FILE_COMPLETED", "DOCUMENTS_VERIFIED"] },
    };

    if (bloodGroup) {
      query["personalInfo.bloodGroup"] = bloodGroup;
    }

    const rawDonors = await SpermDonorRegistration.find(query).sort({ createdAt: -1 }).lean();

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

    const sanitizedDonors = rawDonors.map((donor: any) => {
      const age = calculateAge(donor.personalInfo?.dateOfBirth);

      return {
        _id: donor._id,
        donorId: donor.registrationId,
        age,
        gender: "Male",
        bloodGroup: donor.personalInfo?.bloodGroup || "TBD",
        nationality: "Indian",
        physicalAttributes: {
          height: Number(donor.personalInfo?.height) || 170,
          weight: Number(donor.personalInfo?.weight) || 65,
          eyeColor: donor.personalInfo?.eyeColor || "Brown",
          hairColor: donor.personalInfo?.hairColor || "Black",
          skinTone: donor.personalInfo?.complexion || "Medium",
        },
        tags: [],
        updatedAt: donor.updatedAt || donor.createdAt,
        donationStatus: "ACTIVE",
      };
    }).filter((donor: any) => {
      if (donor.age > 0 && (donor.age < ageMin || donor.age > ageMax)) return false;

      if (search) {
        const s = search.toLowerCase();
        return donor.donorId.toLowerCase().includes(s) || donor.bloodGroup.toLowerCase().includes(s);
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      donors: sanitizedDonors,
      total: sanitizedDonors.length,
    });
  } catch (error: any) {
    console.error("Recipient available donors error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
