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
  title: "Mediyaz Art Bank | Clinical Operations & Administrative Portal",
  description: "Administrative portal for Mediyaz ART Bank clinical operations.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
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
