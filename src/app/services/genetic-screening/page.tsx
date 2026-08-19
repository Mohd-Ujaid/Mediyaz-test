import ServiceDetailPage from "../[serviceSlug]/page";

export default function GeneticScreeningPage() {
  return <ServiceDetailPage params={Promise.resolve({ serviceSlug: "genetic-screening" })} />;
}
