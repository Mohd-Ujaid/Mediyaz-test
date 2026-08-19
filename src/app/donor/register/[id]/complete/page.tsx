import { RegistrationComplete } from "@/features/donor-registration/components/RegistrationComplete";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RegisterCompletePage({ params }: PageProps) {
  const { id } = await params;
  return <RegistrationComplete id={id} />;
}
