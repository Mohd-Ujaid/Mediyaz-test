"use client";

import { ThemeProvider } from "@/components/theme-provider";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex-1 flex flex-col min-h-0 w-full">{children}</div>
    </ThemeProvider>
  );
}
