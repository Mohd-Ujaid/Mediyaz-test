import ServiceDetailPage from "../[serviceSlug]/page";

export default function SpermDonationPage() {
  return <ServiceDetailPage params={Promise.resolve({ serviceSlug: "sperm-donation" })} />;
}
