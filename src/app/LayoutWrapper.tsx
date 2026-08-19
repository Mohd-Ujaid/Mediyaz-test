"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ThemeProvider } from "@/components/theme-provider";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideLayout =
  pathname.startsWith("/donor/register/") &&
  pathname.endsWith("/print");



  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {!hideLayout && <Navbar />}

      <main className="flex-1">{children}</main>

      {!hideLayout && <Footer />}
    </ThemeProvider>
  );
}
