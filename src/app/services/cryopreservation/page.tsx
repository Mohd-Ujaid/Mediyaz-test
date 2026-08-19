import ServiceDetailPage from "../[serviceSlug]/page";

export default function CryopreservationPage() {
  return <ServiceDetailPage params={Promise.resolve({ serviceSlug: "cryopreservation" })} />;
}
