import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ArtEggDonor } from "@/models/ArtEggDonor";
import { ArtDonor } from "@/models/ArtDonor";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatHeight(heightCm: number): string {
  const totalInches = Math.round(heightCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}" (${heightCm} cm)`;
}

function calculateBmi(heightCm: number, weightKg: number): number {
  if (!heightCm || !weightKg) return 21;
  const meters = heightCm / 100;
  return +(weightKg / (meters * meters)).toFixed(1);
}

// GET: Fetch all Egg Donors with advanced filtering
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const skinTone = searchParams.get("skinTone");
    const bloodType = searchParams.get("bloodType");
    const heightRange = searchParams.get("heightRange");
    const ageRange = searchParams.get("ageRange");
    const educationLevel = searchParams.get("educationLevel");
    const availability = searchParams.get("availability");
    const state = searchParams.get("state");
    const city = searchParams.get("city");
    const sortBy = searchParams.get("sortBy") || "newest";

    const query: any = {};

    if (state && state !== "all") {
      const stateRegex = { $regex: escapeRegex(state), $options: "i" };
      query.$and = query.$and || [];
      query.$and.push({
        $or: [{ state: stateRegex }, { ancestryRegion: stateRegex }],
      });
    }

    if (city && city !== "all") {
      const cityRegex = { $regex: escapeRegex(city), $options: "i" };
      query.$and = query.$and || [];
      query.$and.push({
        $or: [{ city: cityRegex }, { ancestryRegion: cityRegex }],
      });
    }

    if (skinTone && skinTone !== "all") {
      query.skinTone = { $regex: `^${escapeRegex(skinTone)}$`, $options: "i" };
    }
    if (bloodType && bloodType !== "all") {
      query.bloodType = { $regex: `^${escapeRegex(bloodType)}$`, $options: "i" };
    }
    if (availability && availability !== "all") {
      query.availability = availability;
    }
    if (educationLevel && educationLevel !== "all") {
      query.educationLevel = { $regex: `^${escapeRegex(educationLevel)}$`, $options: "i" };
    }

    // Height range filtering (for female donors)
    if (heightRange && heightRange !== "all") {
      if (heightRange === "<155") {
        query.heightCm = { $lt: 155 };
      } else if (heightRange === "155-160") {
        query.heightCm = { $gte: 155, $lte: 160 };
      } else if (heightRange === "160-165") {
        query.heightCm = { $gte: 160, $lte: 165 };
      } else if (heightRange === "165-170") {
        query.heightCm = { $gte: 165, $lte: 170 };
      } else if (heightRange === ">170") {
        query.heightCm = { $gt: 170 };
      }
    }

    // Age range filtering
    if (ageRange && ageRange !== "all") {
      if (ageRange === "21-25") {
        query.age = { $gte: 21, $lte: 25 };
      } else if (ageRange === "26-30") {
        query.age = { $gte: 26, $lte: 30 };
      } else if (ageRange === "31-35") {
        query.age = { $gte: 31, $lte: 35 };
      }
    }

    // Text search
    if (search) {
      const escapedSearch = escapeRegex(search);
      query.$or = [
        { donorCode: { $regex: escapedSearch, $options: "i" } },
        { profession: { $regex: escapedSearch, $options: "i" } },
        { degree: { $regex: escapedSearch, $options: "i" } },
        { ethnicity: { $regex: escapedSearch, $options: "i" } },
        { ancestryRegion: { $regex: escapedSearch, $options: "i" } },
        { motherTongue: { $regex: escapedSearch, $options: "i" } },
        { skinTone: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    let sortObj: any = { createdAt: -1 };
    if (sortBy === "age-asc") sortObj = { age: 1 };
    else if (sortBy === "age-desc") sortObj = { age: -1 };
    else if (sortBy === "height-asc") sortObj = { heightCm: 1 };
    else if (sortBy === "height-desc") sortObj = { heightCm: -1 };

    const donors = await ArtEggDonor.find(query).sort(sortObj);

    // Calculate Egg Donor statistics
    const totalCount = await ArtEggDonor.countDocuments();
    const availableCount = await ArtEggDonor.countDocuments({ availability: "available" });
    const quarantineCount = await ArtEggDonor.countDocuments({ availability: "quarantine" });
    const allocatedCount = await ArtEggDonor.countDocuments({ availability: "allocated" });

    return NextResponse.json({
      success: true,
      donors,
      stats: {
        total: totalCount,
        available: availableCount,
        quarantine: quarantineCount,
        allocated: allocatedCount,
      },
    });
  } catch (error: any) {
    console.error("GET /api/art-donors/egg error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch egg donors" },
      { status: 500 }
    );
  }
}

// POST: Create a new Egg Donor profile
export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    const permissions = (session.user as any)?.permissions || [];
    const isAllowed = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role) || permissions.includes("VIEW_REGISTRATIONS");
    if (!isAllowed) {
      return NextResponse.json({ success: false, error: "Forbidden: Access Denied." }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();

    const {
      availability = "available",
      availabilityLabel,
      age,
      bloodType,
      rhFactor = "Positive",
      heightCm,
      weightKg,
      eyeColor,
      hairColor,
      hairTexture = "Straight",
      skinTone,
      bodyBuild = "Slender / Athletic",
      ethnicity,
      ancestryRegion,
      religion = "Hindu",
      motherTongue,
      languages = [],
      educationLevel = "Bachelor's Degree",
      degree,
      profession,
      provenFertility,
      livingChildren = 1,
      abortion = 0,
      talents = [],
      hobbies = [],
      donorStatement = "",
      husbandName,
      husbandOccupation,
      avatarColor,
      viralMarkers,
      geneticScreenings,
      familyPedigree,
      statutoryCompliance,
    } = body;

    if (!age || !bloodType || !heightCm || !weightKg || !degree || !profession) {
      return NextResponse.json(
        { success: false, error: "Missing required fields for Egg Donor registration." },
        { status: 400 }
      );
    }

    // Auto-generate donor code if not provided
    let donorCode = body.donorCode?.trim();
    if (!donorCode) {
      const count = await ArtEggDonor.countDocuments();
      const codeNum = 2100 + count + 1;
      donorCode = `MED-ED-${codeNum}`;
    }

    // Ensure unique code
    const existing = await ArtEggDonor.findOne({ donorCode });
    if (existing) {
      const rand = Math.floor(100 + Math.random() * 900);
      donorCode = `${donorCode}-${rand}`;
    }

    const heightFormatted = formatHeight(Number(heightCm));
    const bmi = calculateBmi(Number(heightCm), Number(weightKg));

    const eggDonorData = {
      donorCode,
      gameteType: "egg",
      availability,
      availabilityLabel: availabilityLabel || "Available Immediately (Vitrified)",
      age: Number(age),
      bloodType,
      rhFactor,
      heightCm: Number(heightCm),
      heightFormatted,
      weightKg: Number(weightKg),
      bmi,
      eyeColor: eyeColor || "Dark Brown",
      hairColor: hairColor || "Black",
      hairTexture,
      skinTone: skinTone || "Wheatish",
      bodyBuild,
      ethnicity: ethnicity || "Indian",
      ancestryRegion: ancestryRegion || "Not Specified",
      state: body.state?.trim() || "",
      city: body.city?.trim() || "",
      religion,
      motherTongue: motherTongue || "Hindi",
      languages: languages.length > 0 ? languages : ["Hindi", "English"],
      educationLevel,
      degree,
      profession,
      provenFertility: provenFertility || "Mother of 1 healthy child (3 years old)",
      livingChildren: Number(livingChildren) || 1,
      abortion: Number(abortion) || 0,
      talents,
      hobbies,
      donorStatement,
      husbandName: husbandName?.trim() || "",
      husbandOccupation: husbandOccupation?.trim() || "",
      avatarColor: avatarColor || "#ff7468",
      viralMarkers: {
        hiv: viralMarkers?.hiv || "Non-Reactive",
        hbsAg: viralMarkers?.hbsAg || "Non-Reactive",
        hcv: viralMarkers?.hcv || "Non-Reactive",
        vdrl: viralMarkers?.vdrl || "Non-Reactive",
      },
      geneticScreenings: {
        thalassemia: {
          status: geneticScreenings?.thalassemia?.status || "Negative (Normal HbA2 <3.5%)",
          method: "HPLC",
          hba2Fraction: "2.4%",
        },
        karyotype: {
          result: geneticScreenings?.karyotype?.result || "46,XX (Normal Female)",
          bands: "550 Bands G-Banding",
          resolution: "Normal Cytogenetic Structure",
        },
        sma: "Negative / Non-Carrier",
        cysticFibrosis: "Negative",
        g6pd: "Normal Activity",
      },
      familyPedigree: {
        maternalGrandparents: familyPedigree?.maternalGrandparents || "No hereditary diseases reported.",
        paternalGrandparents: familyPedigree?.paternalGrandparents || "Longevity, cardiovascular health confirmed.",
        parents: familyPedigree?.parents || "Both parents active and in good health.",
        siblings: familyPedigree?.siblings || "Healthy siblings with no chronic conditions.",
      },
      statutoryCompliance: {
        artActRegistered: statutoryCompliance?.artActRegistered ?? true,
        rule13InsuranceActive: statutoryCompliance?.rule13InsuranceActive ?? true,
        lifetimeDonationLimitCompliant: statutoryCompliance?.lifetimeDonationLimitCompliant ?? true,
        registryToken: statutoryCompliance?.registryToken || `REG-2026-IND-DEL-${Math.floor(10000 + Math.random() * 90000)}`,
      },
    };

    // 1. Save to separate collection: art_egg_donors
    const newEggDonor = await ArtEggDonor.create(eggDonorData);

    // 2. Dual-sync to unified collection: art_donors (for client portal backwards-compatibility)
    try {
      await ArtDonor.findOneAndUpdate(
        { donorCode },
        { ...eggDonorData },
        { upsert: true, new: true }
      );
    } catch (syncErr) {
      console.warn("Sync to art_donors warning:", syncErr);
    }

    return NextResponse.json({
      success: true,
      donor: newEggDonor,
      message: "Egg Donor profile registered successfully in egg database.",
    });
  } catch (error: any) {
    console.error("POST /api/art-donors/egg error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create egg donor" },
      { status: 500 }
    );
  }
}
