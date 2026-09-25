import PrintViewer from "@/features/pdf-preview/components/PrintViewer";
import { connectToDatabase } from "@/lib/mongodb";
import { DonorRegistration } from "@/models/DonorRegistration";
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
  await import("@/models/Hospital");

  const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
  const findQuery = { $or: [{ registrationId: id }, ...(isMongoId ? [{ _id: id }] : [])] };

  let registration = null;
  try {
    const { EggDonorRegistration } = await import("@/models/EggDonorRegistration");
    registration = await EggDonorRegistration.findOne(findQuery).populate("assignedHospital");
  } catch {}

  if (!registration) {
    registration = await DonorRegistration.findOne(findQuery).populate("assignedHospital");
  }
  if (!registration) {
    const { SpermDonorRegistration } = await import("@/models/SpermDonorRegistration");
    registration = await SpermDonorRegistration.findOne(findQuery).populate("assignedHospital");
  }

  if (!registration) {
    notFound();
  }

  // Safety fallback: if assignedHospital is an unpopulated ID, fetch the document
  if (registration.assignedHospital && (typeof registration.assignedHospital === "string" || !registration.assignedHospital.name)) {
    try {
      const { Hospital } = await import("@/models/Hospital");
      const hosp = await Hospital.findById(registration.assignedHospital);
      if (hosp) registration.assignedHospital = hosp;
    } catch { /* ignore */ }
  }

  // Auto-generate incrementing fileNumber if not already assigned
  if (!registration.fileNumber) {
    const isSperm = registration.donorType === "sperm";
    try {
      const targetModel = isSperm
        ? (await import("@/models/SpermDonorRegistration")).SpermDonorRegistration || DonorRegistration
        : (await import("@/models/EggDonorRegistration")).EggDonorRegistration || DonorRegistration;

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
