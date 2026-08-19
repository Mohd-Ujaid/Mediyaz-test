import PrintableRegistrationViewer from "@/features/pdf-preview/components/PrintableRegistrationViewer";
import { connectToDatabase } from "@/lib/mongodb";
import { DonorRegistration } from "@/models/DonorRegistration";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintRegistrationPage({ params }: PageProps) {
  const { id } = await params;

  await connectToDatabase();
  const registration = await DonorRegistration.findOne({ registrationId: id });

  if (!registration) {
    notFound();
  }

  // Convert mongoose model to plain JS object to pass safely to client component
  const plainRegistration = JSON.parse(JSON.stringify(registration));

  return (
    <PrintableRegistrationViewer
      registration={plainRegistration}
      qrCodeUrl={plainRegistration.qrCodeUrl ?? ""}
    />
  );
}