import ServiceDetailPage from "../[serviceSlug]/page";

export default function SpermBankingPage() {
  return <ServiceDetailPage params={Promise.resolve({ serviceSlug: "sperm-banking" })} />;
}
