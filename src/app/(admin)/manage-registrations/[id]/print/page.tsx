import PrintViewer from "@/features/pdf-preview/components/PrintViewer";
import { connectToDatabase } from "@/lib/mongodb";
import { notFound } from "next/navigation";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    withHeader?: string;
    attachments?: string;
    sections?: string;
    extraDocUrl?: string;
    // Flattened overrides passed as JSON string
    overrides?: string;
    affidavitType?: string;
  }>;
}

export default async function PrintRegistrationPage({
  params,
  searchParams,
}: PageProps) {
  console.log(">>> PRINT REGISTRATION PAGE HIT:", await params);

  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session) {
    return <div className="p-8 text-center text-red-500 font-bold">Unauthorized. Please log in as Administrator.</div>;
  }

  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "STAFF") {
    return <div className="p-8 text-center text-red-500 font-bold">Forbidden: Access Denied.</div>;
  }

  const { id } = await params;
  const { withHeader, attachments, sections, extraDocUrl, overrides, affidavitType } = await searchParams;

  await connectToDatabase();
  // Ensure Hospital model is registered for populate
  try {
    await import("@/models/Hospital");
  } catch {}

  const cleanId = decodeURIComponent(id || "").trim();
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(cleanId);
  const escapedId = cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const caseInsensitiveRegex = new RegExp(`^${escapedId}$`, "i");

  const findQuery: any = {
    $or: [
      { registrationId: cleanId },
      { registrationId: caseInsensitiveRegex },
      { donorId: cleanId },
      { donorId: caseInsensitiveRegex },
      { fileNumber: cleanId },
      { fileNumber: caseInsensitiveRegex },
      ...(isMongoId ? [{ _id: cleanId }] : []),
    ],
  };

  let registration: any = null;

  // 1. Check EggDonorRegistration first
  try {
    const { EggDonorRegistration } = await import("@/models/EggDonorRegistration");
    registration = await EggDonorRegistration.findOne(findQuery);
  } catch (err) {
    console.warn("Error finding in EggDonorRegistration:", err);
  }

  // 2. Check SpermDonorRegistration
  if (!registration) {
    try {
      const { SpermDonorRegistration } = await import("@/models/SpermDonorRegistration");
      registration = await SpermDonorRegistration.findOne(findQuery);
    } catch (err) {
      console.warn("Error finding in SpermDonorRegistration:", err);
    }
  }

  // 3. Fallback check other donor models (ArtDonor, ArtEggDonor, ArtSpermDonor, PreviousDonor)
  if (!registration) {
    try {
      const { ArtEggDonor } = await import("@/models/ArtEggDonor");
      registration = await ArtEggDonor.findOne(findQuery);
    } catch {}
  }
  if (!registration) {
    try {
      const { ArtSpermDonor } = await import("@/models/ArtSpermDonor");
      registration = await ArtSpermDonor.findOne(findQuery);
    } catch {}
  }
  if (!registration) {
    try {
      const { ArtDonor } = await import("@/models/ArtDonor");
      registration = await ArtDonor.findOne(findQuery);
    } catch {}
  }
  if (!registration) {
    try {
      const { PreviousDonor } = await import("@/models/PreviousDonor");
      registration = await PreviousDonor.findOne(findQuery);
    } catch {}
  }

  if (!registration) {
    console.error(`[PrintRegistrationPage] Registration not found for query ID: "${cleanId}"`);
    notFound();
  }

  // Safety fallback: safely populate assignedHospital without failing if populate errors
  if (registration.assignedHospital) {
    try {
      const { Hospital } = await import("@/models/Hospital");
      if (typeof registration.assignedHospital === "string" || isMongoId) {
        const hosp = await Hospital.findById(registration.assignedHospital).lean();
        if (hosp) registration.assignedHospital = hosp;
      } else if (typeof registration.populate === "function") {
        await registration.populate("assignedHospital").catch(() => null);
      }
    } catch (err) {
      console.warn("Safe hospital populate skipped:", err);
    }
  }

  // Auto-generate incrementing fileNumber if not already assigned
  if (!registration.fileNumber) {
    const isSperm = registration.donorType === "sperm";
    try {
      const targetModel = isSperm
        ? (await import("@/models/SpermDonorRegistration")).SpermDonorRegistration
        : (await import("@/models/EggDonorRegistration")).EggDonorRegistration;

      const countBefore = await targetModel.countDocuments({
        donorType: isSperm ? "sperm" : "egg",
        createdAt: { $lte: registration.createdAt || new Date() },
      });
      const prefix = isSperm ? "MAB/SD" : "MAB/ED";
      const seq = Math.max(1, countBefore);
      const generatedFileNum = `${prefix}/${String(seq).padStart(3, "0")}`;

      registration.fileNumber = generatedFileNum;
      await registration.save();
    } catch (e) {
      console.warn("Could not persist fileNumber:", e);
    }
  }

  // Fallback for egg donor documents.affidavit across collections
  const isEgg = registration.donorType === "egg" || registration.registrationId?.startsWith("MED-ED") || registration.registrationId?.startsWith("EGG-");
  if (isEgg && !registration.documents?.affidavit?.url && !registration.affidavit?.url) {
    try {
      const { EggDonorRegistration } = await import("@/models/EggDonorRegistration");
      const eggRec = await EggDonorRegistration.findOne(findQuery).select("documents.affidavit affidavit").lean();
      const aff = eggRec?.documents?.affidavit || eggRec?.affidavit;
      if (aff?.url) {
        if (!registration.documents) registration.documents = {};
        registration.documents.affidavit = aff;
        registration.affidavit = aff;
      }
    } catch { /* ignore */ }
  }

  const plainRegistration = JSON.parse(JSON.stringify(registration));
  const parsedWithHeader = withHeader === "true";
  const parsedAttachments = attachments ? attachments.split(",") : [];
  const parsedSections = sections ? sections.split(",").filter(Boolean) : [];
  const parsedExtraDocUrl = extraDocUrl || undefined;
  let parsedOverrides: Record<string, any> = {};
  try {
    if (overrides) parsedOverrides = JSON.parse(decodeURIComponent(overrides));
  } catch { /* ignore bad JSON */ }

  return (
    <PrintViewer
      registration={plainRegistration}
      withHeader={parsedWithHeader}
      attachments={parsedAttachments}
      sections={parsedSections}
      extraDocUrl={parsedExtraDocUrl}
      overrides={parsedOverrides}
      affidavitType={affidavitType}
    />
  );
}
