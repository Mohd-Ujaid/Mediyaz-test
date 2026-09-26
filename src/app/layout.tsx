import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// import { ThemeProvider } from "@/components/theme-provider";
// import { Navbar } from "@/components/layout/navbar";
// import { Footer } from "@/components/layout/footer";
import LayoutWrapper from "./LayoutWrapper";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mediyaz Art Bank | Premium International Fertility & Sperm Bank Platform",
  description: "Enterprise-level reproductive healthcare, cryogenic sperm banking, and specialist fertility platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.className} min-h-screen flex flex-col bg-background antialiased selection:bg-primary selection:text-white`}>
        <TooltipProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </TooltipProvider>
      </body>
    </html>
  );
}
