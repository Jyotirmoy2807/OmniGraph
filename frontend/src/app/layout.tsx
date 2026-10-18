import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "OmniGraph — Enterprise AI Governance Fabric",
  description: "Zero-Shot Multi-Tenant Enterprise AI Agent & Governance Platform Powered by FalkorDB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className="h-full font-sans bg-slate-50 text-slate-900 antialiased overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
        {children}
      </body>
    </html>
  );
}
