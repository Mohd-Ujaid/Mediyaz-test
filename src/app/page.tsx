import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminRootPage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (session?.user) {
    const role = (session.user as any).role;
    if (["ADMIN", "SUPER_ADMIN"].includes(role)) {
      redirect("/dashboard");
    }
  }

  redirect("/login");
}
