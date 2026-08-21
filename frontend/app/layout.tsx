import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { SettingsProvider } from "@/components/SettingsProvider";

const sans = Nunito_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ScamGuard — Dashboard",
  description: "AI-powered financial scam, phishing and fraud detection",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} font-sans antialiased`}>
        <SettingsProvider>
          <div className="flex min-h-screen bg-page">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <TopBar />
              <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
            </div>
          </div>
        </SettingsProvider>
      </body>
    </html>
  );
}
