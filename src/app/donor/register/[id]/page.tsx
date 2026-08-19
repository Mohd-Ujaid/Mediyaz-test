import { RegistrationWizard } from "@/features/donor-registration/components/RegistrationWizard";
import { connectToDatabase } from "@/lib/mongodb";
import { DonorRegistration } from "@/models/DonorRegistration";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResumeRegistrationPage({ params }: PageProps) {
  const { id } = await params;
  
  await connectToDatabase();
  const registration = await DonorRegistration.findOne({ registrationId: id });
  
  if (!registration) {
    notFound();
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen py-6">
      <RegistrationWizard donorType={registration.donorType} draftId={id} />
    </div>
  );
}
