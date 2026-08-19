import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Donor } from "@/models/Donor";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    // Available donor search is public and de-identified

    await connectToDatabase();
    
    // Models are registered via imports
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const bloodGroup = searchParams.get("bloodGroup") || "";
    const gender = searchParams.get("gender") || "";
    const ageMin = parseInt(searchParams.get("ageMin") || "18");
    const ageMax = parseInt(searchParams.get("ageMax") || "60");

    // Fetch all active, approved donors (Sperm Donors - Male only)
    const query: any = {
      donationStatus: "ACTIVE",
      approvalStatus: "APPROVED",
      "personalInformation.gender": "Male"
    };

    if (bloodGroup) {
      query["personalInformation.bloodGroup"] = bloodGroup;
    }

    const rawDonors = await Donor.find(query).sort({ createdAt: -1 });

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

    // Filter and sanitize donor data
    const sanitizedDonors = rawDonors.map(donor => {
      const age = calculateAge(donor.personalInformation?.dateOfBirth);

      // Return sanitized object
      return {
        _id: donor._id,
        donorId: donor.donorId,
        age,
        gender: donor.personalInformation?.gender || "Not Specified",
        bloodGroup: donor.personalInformation?.bloodGroup || "TBD",
        nationality: donor.personalInformation?.nationality || "Indian",
        physicalAttributes: {
          height: donor.physicalAttributes?.height || 170,
          weight: donor.physicalAttributes?.weight || 65,
          eyeColor: donor.physicalAttributes?.eyeColor || "Brown",
          hairColor: donor.physicalAttributes?.hairColor || "Black",
          skinTone: donor.physicalAttributes?.skinTone || "Medium",
        },
        tags: donor.tags || [],
        updatedAt: donor.updatedAt || donor.createdAt,
        donationStatus: donor.donationStatus
      };
    }).filter(donor => {
      // Age filter
      if (donor.age < ageMin || donor.age > ageMax) return false;

      // Search filter (searches donorId or nationality)
      if (search) {
        const queryStr = search.toLowerCase();
        const matchesId = donor.donorId.toLowerCase().includes(queryStr);
        const matchesNationality = donor.nationality.toLowerCase().includes(queryStr);
        return matchesId || matchesNationality;
      }

      return true;
    });

    return NextResponse.json({ success: true, donors: sanitizedDonors });

  } catch (error: any) {
    console.error("Fetch available donors error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
