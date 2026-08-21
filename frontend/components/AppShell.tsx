"use client";

import { usePathname } from "next/navigation";
import { AuthProvider, PUBLIC_PATHS } from "@/components/AuthProvider";
import { SettingsProvider } from "@/components/SettingsProvider";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ShellBody>{children}</ShellBody>
      </SettingsProvider>
    </AuthProvider>
  );
}

function ShellBody({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicPage = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (publicPage) {
    return <div className="min-h-screen bg-page">{children}</div>;
  }
  return (
    <div className="flex min-h-screen bg-page">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
