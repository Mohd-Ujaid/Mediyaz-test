import ServiceDetailPage from "../[serviceSlug]/page";

export default function IVFSupportPage() {
  return <ServiceDetailPage params={Promise.resolve({ serviceSlug: "ivf-support" })} />;
}
