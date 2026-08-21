"use client";

import Link from "next/link";
import { Bell, Menu, Settings, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

const MOBILE = [
  { href: "/", label: "Home" },
  { href: "/alerts", label: "Alerts" },
  { href: "/activity", label: "Activity" },
  { href: "/settings", label: "Settings" },
  { href: "/analyze", label: "Scan message" },
];

export function TopBar() {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg p-2 text-navy hover:bg-slate-100 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-brand md:hidden" size={20} />
            <span className="text-lg font-bold text-navy">ScamGuard</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <Link href="/alerts" className="rounded-full p-2 hover:bg-slate-100" aria-label="Notifications">
            <Bell size={18} />
          </Link>
          <Link href="/settings" className="rounded-full p-2 hover:bg-slate-100" aria-label="Settings">
            <Settings size={18} />
          </Link>
        </div>
      </div>
      {open && (
        <nav className="border-t border-slate-100 bg-white px-4 py-2 md:hidden">
          {MOBILE.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2.5 text-sm font-semibold ${
                path === item.href ? "bg-brand/10 text-brand" : "text-navy hover:bg-slate-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
