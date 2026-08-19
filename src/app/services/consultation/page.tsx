import ServiceDetailPage from "../[serviceSlug]/page";

export default function ConsultationPage() {
  return <ServiceDetailPage params={Promise.resolve({ serviceSlug: "consultation" })} />;
}
