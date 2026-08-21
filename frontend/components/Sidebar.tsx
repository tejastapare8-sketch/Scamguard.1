"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bell, Home, Settings, ShieldCheck } from "lucide-react";

const NAV = [
  { href: "/", label: "Home", icon: Home, idle: "text-sky-300", active: "bg-brand" },
  { href: "/alerts", label: "Alerts", icon: Bell, idle: "text-red-400", active: "bg-danger" },
  { href: "/activity", label: "Activity", icon: Activity, idle: "text-emerald-400", active: "bg-safe" },
  { href: "/settings", label: "Settings", icon: Settings, idle: "text-violet-300", active: "bg-violet-500" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hidden w-[232px] shrink-0 flex-col bg-navy text-white md:flex">
      <div className="flex items-center gap-2.5 px-6 py-7">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10">
          <ShieldCheck className="text-sky-300" size={20} />
        </div>
        <span className="text-lg font-bold tracking-tight">ScamGuard</span>
      </div>
      <nav className="space-y-2 px-4">
        {NAV.map((item) => {
          const active = path === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                active ? `${item.active} text-white shadow-md` : "text-slate-200 hover:bg-white/10"
              }`}
            >
              <Icon size={18} className={active ? "text-white" : item.idle} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-6 py-6 text-[11px] leading-relaxed text-slate-400">
        Automatic scam detection for SMS, email, UPI &amp; links.
      </div>
    </aside>
  );
}
