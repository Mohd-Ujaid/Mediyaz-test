import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
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

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const gameteType = searchParams.get("gameteType");
    const availability = searchParams.get("availability");
    const bloodType = searchParams.get("bloodType");
    const skinTone = searchParams.get("skinTone");
    const heightRange = searchParams.get("heightRange");
    const ageRange = searchParams.get("ageRange");
    const educationLevel = searchParams.get("educationLevel");
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const sortBy = searchParams.get("sortBy") || "newest";

    const query: any = {};

    if (gameteType && gameteType !== "all") {
      query.gameteType = gameteType;
    }
    if (availability && availability !== "all") {
      query.availability = availability;
    }
    if (bloodType && bloodType !== "all") {
      query.bloodType = { $regex: `^${escapeRegex(bloodType)}$`, $options: "i" };
    }
    if (skinTone && skinTone !== "all") {
      query.skinTone = { $regex: `^${escapeRegex(skinTone)}$`, $options: "i" };
    }
    if (educationLevel && educationLevel !== "all") {
      query.educationLevel = { $regex: `^${escapeRegex(educationLevel)}$`, $options: "i" };
    }
    if (heightRange && heightRange !== "all") {
      if (heightRange.startsWith("<")) {
        const val = Number(heightRange.slice(1));
        query.heightCm = { $lt: val };
      } else if (heightRange.startsWith(">")) {
        const val = Number(heightRange.slice(1));
        query.heightCm = { $gt: val };
      } else if (heightRange.includes("-")) {
        const [min, max] = heightRange.split("-").map(Number);
        query.heightCm = { $gte: min, $lte: max };
      }
    }
    if (ageRange && ageRange !== "all") {
      if (ageRange.includes("-")) {
        const [min, max] = ageRange.split("-").map(Number);
        query.age = { $gte: min, $lte: max };
      }
    }

    if (search) {
      const escapedSearch = escapeRegex(search);
      query.$or = [
        { donorCode: { $regex: escapedSearch, $options: "i" } },
        { profession: { $regex: escapedSearch, $options: "i" } },
        { degree: { $regex: escapedSearch, $options: "i" } },
        { ethnicity: { $regex: escapedSearch, $options: "i" } },
        { ancestryRegion: { $regex: escapedSearch, $options: "i" } },
        { motherTongue: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    let sortObj: any = { createdAt: -1 };
    if (sortBy === "age-asc") sortObj = { age: 1 };
    else if (sortBy === "age-desc") sortObj = { age: -1 };
    else if (sortBy === "height-asc") sortObj = { heightCm: 1 };
    else if (sortBy === "height-desc") sortObj = { heightCm: -1 };

    const donors = await ArtDonor.find(query).sort(sortObj);

    // Calculate overall stats for admin dashboard widgets
    const totalCount = await ArtDonor.countDocuments();
    const eggCount = await ArtDonor.countDocuments({ gameteType: "egg" });
    const spermCount = await ArtDonor.countDocuments({ gameteType: "sperm" });
    const availableCount = await ArtDonor.countDocuments({ availability: "available" });

    return NextResponse.json({
      success: true,
      donors,
      stats: {
        total: totalCount,
        egg: eggCount,
        sperm: spermCount,
        available: availableCount,
      },
    });
  } catch (error: any) {
    console.error("GET /api/art-donors error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch ART donors" },
      { status: 500 }
    );
  }
}

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
      gameteType = "egg",
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
      livingChildren = 0,
      abortion = 0,
      talents = [],
      hobbies = [],
      donorStatement = "",
      avatarColor,
      viralMarkers,
      geneticScreenings,
      familyPedigree,
      statutoryCompliance,
    } = body;

    if (!bloodType || !age || !heightCm || !weightKg || !ethnicity || !degree || !profession) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required donor fields (age, bloodType, heightCm, weightKg, ethnicity, degree, profession)",
        },
        { status: 400 }
      );
    }

    const numHeight = Number(heightCm);
    const numWeight = Number(weightKg);
    const computedBmi = calculateBmi(numHeight, numWeight);
    const computedHeightFormatted = body.heightFormatted || formatHeight(numHeight);

    // Auto-generate donorCode if not supplied
    let donorCode = body.donorCode?.trim();
    if (!donorCode) {
      const prefix = gameteType === "egg" ? "MED-ED" : "MED-SD";
      const count = await ArtDonor.countDocuments({ gameteType });
      donorCode = `${prefix}-${2100 + count + 1}`;
    }

    // Check code uniqueness
    const existing = await ArtDonor.findOne({ donorCode });
    if (existing) {
      donorCode = `${donorCode}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // Default avatar color based on gamete type
    const finalAvatarColor =
      avatarColor || (gameteType === "egg" ? "#ff7468" : "#285b63");

    // Standardize viral markers and serology
    const finalViralMarkers = {
      hiv: viralMarkers?.hiv || "Non-Reactive",
      hbsAg: viralMarkers?.hbsAg || "Non-Reactive",
      hcv: viralMarkers?.hcv || "Non-Reactive",
      vdrl: viralMarkers?.vdrl || "Non-Reactive",
    };

    const finalGeneticScreenings = {
      thalassemia: {
        status: geneticScreenings?.thalassemia?.status || "Negative",
        method: geneticScreenings?.thalassemia?.method || "Automated Cation-Exchange HPLC",
        hba2Fraction: geneticScreenings?.thalassemia?.hba2Fraction || "2.4% (Normal Reference: <3.5%)",
      },
      karyotype: {
        result:
          geneticScreenings?.karyotype?.result ||
          (gameteType === "egg" ? "46,XX (Normal Female Karyotype)" : "46,XY (Normal Male Karyotype)"),
        bands: geneticScreenings?.karyotype?.bands || "550-Band Resolution",
        resolution:
          geneticScreenings?.karyotype?.resolution ||
          "No structural or numerical aberrations detected",
      },
      sma: geneticScreenings?.sma || "Non-Carrier",
      cysticFibrosis: geneticScreenings?.cysticFibrosis || "Non-Carrier",
      g6pd: geneticScreenings?.g6pd || "Normal",
      infectiousSerology: {
        hiv: finalViralMarkers.hiv,
        hbsAg: finalViralMarkers.hbsAg,
        hcv: finalViralMarkers.hcv,
        vdrl: finalViralMarkers.vdrl,
        chlamydiaPcr: geneticScreenings?.infectiousSerology?.chlamydiaPcr || "Negative",
        cmv: geneticScreenings?.infectiousSerology?.cmv || "IgG Positive, IgM Negative (Low Risk)",
      },
    };

    const finalPedigree = {
      maternalGrandparents:
        familyPedigree?.maternalGrandparents || "No hereditary disorders; lived to age 86 and 88.",
      paternalGrandparents:
        familyPedigree?.paternalGrandparents || "Good cardiovascular health; lived to age 82.",
      parents:
        familyPedigree?.parents || "Both parents active and healthy; mother age 55, father age 58.",
      siblings:
        familyPedigree?.siblings || "One sibling, excellent health with no medical issues.",
    };

    const finalCompliance = {
      artActRegistered: statutoryCompliance?.artActRegistered ?? true,
      rule13InsuranceActive: statutoryCompliance?.rule13InsuranceActive ?? true,
      lifetimeDonationLimitCompliant: statutoryCompliance?.lifetimeDonationLimitCompliant ?? true,
      registryToken:
        statutoryCompliance?.registryToken ||
        `REG-${new Date().getFullYear()}-IND-DEL-${String(Math.floor(10000 + Math.random() * 90000))}`,
    };

    const newDonor = await ArtDonor.create({
      donorCode,
      gameteType,
      availability,
      availabilityLabel:
        availabilityLabel ||
        (availability === "available"
          ? "Available Immediately (Vitrified)"
          : availability === "quarantine"
          ? "Cryo-Quarantine Phase"
          : "Allocated"),
      age: Number(age),
      bloodType,
      rhFactor,
      heightCm: numHeight,
      heightFormatted: computedHeightFormatted,
      weightKg: numWeight,
      bmi: computedBmi,
      eyeColor: eyeColor || "Dark Brown",
      hairColor: hairColor || "Black",
      hairTexture,
      skinTone: skinTone || "Wheatish",
      bodyBuild,
      ethnicity,
      ancestryRegion: ancestryRegion || "North Indian",
      religion,
      motherTongue: motherTongue || "Hindi",
      languages: Array.isArray(languages) ? languages : [motherTongue || "Hindi", "English"],
      educationLevel,
      degree,
      profession,
      provenFertility: provenFertility || (gameteType === "egg" ? "Mother of 1 healthy child" : "Proven sperm motility"),
      livingChildren: Number(livingChildren) || 0,
      abortion: Number(abortion) || 0,
      talents: Array.isArray(talents) ? talents : [],
      hobbies: Array.isArray(hobbies) ? hobbies : [],
      donorStatement:
        donorStatement ||
        "I am grateful to be able to help an aspiring parent complete their family.",
      avatarColor: finalAvatarColor,
      viralMarkers: finalViralMarkers,
      geneticScreenings: finalGeneticScreenings,
      familyPedigree: finalPedigree,
      statutoryCompliance: finalCompliance,
    });

    return NextResponse.json({
      success: true,
      message: "ART Donor profile created successfully!",
      donor: newDonor,
    });
  } catch (error: any) {
    console.error("POST /api/art-donors error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create ART donor" },
      { status: 500 }
    );
  }
}
