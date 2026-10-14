import LedgerPrintViewer from "@/features/ledger/components/LedgerPrintViewer";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

interface PageProps {
  searchParams: Promise<{
    type?: string;
    hospitalId?: string;
    status?: string;
    donorType?: string;
    search?: string;
    branch?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function LedgerPrintPage({ searchParams }: PageProps) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Unauthorized. Please log in as Administrator.
      </div>
    );
  }

  const { type, hospitalId, status, donorType, search, branch, startDate, endDate } = await searchParams;
  const ledgerType = (type === "donor" ? "donor" : "clinic") as "clinic" | "donor";

  return (
    <LedgerPrintViewer
      type={ledgerType}
      hospitalId={hospitalId}
      status={status}
      donorType={donorType}
      search={search}
      branch={branch}
      startDate={startDate}
      endDate={endDate}
    />
  );
}
