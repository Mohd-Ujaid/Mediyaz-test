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
  const { withHeader, attachments, sections, extraDocUrl, overrides } = await searchParams;

  await connectToDatabase();
  const registration = await DonorRegistration.findOne({ registrationId: id });

  if (!registration) {
    notFound();
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
    />
  );
}
