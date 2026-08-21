"use client";

import { Globe, Link2, Radio, Bell, Volume2 } from "lucide-react";
import { useSettings, AppSettings } from "@/components/SettingsProvider";

export default function SettingsPage() {
  const { settings, set } = useSettings();

  return (
    <div className="mx-auto max-w-lg">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center gap-2 bg-safe px-5 py-3.5 text-white">
          <span className="text-sm font-extrabold uppercase tracking-wider">Settings</span>
        </div>
        <div className="divide-y divide-slate-100">
          <ToggleRow
            icon={<Radio size={18} className="text-brand" />}
            label="Automatic Detection"
            checked={settings.automaticDetection}
            onChange={(v) => set({ automaticDetection: v })}
          />
          <ToggleRow
            icon={<Bell size={18} className="text-warn" />}
            label="Scam Alerts"
            checked={settings.scamAlerts}
            onChange={(v) => set({ scamAlerts: v })}
          />
          <ToggleRow
            icon={<Link2 size={18} className="text-safe" />}
            label="Block High-Risk Links"
            checked={settings.blockHighRiskLinks}
            onChange={(v) => set({ blockHighRiskLinks: v })}
          />
          <ToggleRow
            icon={<Volume2 size={18} className="text-violet-500" />}
            label="Alert Sound"
            checked={settings.alertSound}
            onChange={(v) => set({ alertSound: v })}
          />
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-50">
              <Globe size={18} className="text-slate-500" />
            </div>
            <div className="flex-1 text-sm font-semibold text-navy">Language</div>
            <select
              value={settings.language}
              onChange={(e) => set({ language: e.target.value as AppSettings["language"] })}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-navy"
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Marathi</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="text-sm font-bold text-navy">Tools</div>
        <p className="mt-1 text-xs text-slate-500">Open advanced scanners for messages, URLs, conversations and more.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ["/analyze", "Message scan"],
            ["/conversation", "Conversation"],
            ["/screenshot", "Screenshot / QR"],
            ["/url", "URL intel"],
            ["/transactions", "Transactions"],
            ["/history", "History"],
            ["/profile", "Profile"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-50">{icon}</div>
      <div className="flex-1 text-sm font-semibold text-navy">{label}</div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-safe" : "bg-slate-300"}`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
