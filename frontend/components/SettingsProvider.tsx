"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppSettings = {
  automaticDetection: boolean;
  scamAlerts: boolean;
  blockHighRiskLinks: boolean;
  alertSound: boolean;
  language: "English" | "Hindi" | "Marathi";
};

const DEFAULTS: AppSettings = {
  automaticDetection: true,
  scamAlerts: true,
  blockHighRiskLinks: true,
  alertSound: true,
  language: "English",
};

const Ctx = createContext<{
  settings: AppSettings;
  set: (patch: Partial<AppSettings>) => void;
  blocked: number[];
  block: (id: number) => void;
} | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [blocked, setBlocked] = useState<number[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("scamguard-settings");
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
      const b = localStorage.getItem("scamguard-blocked");
      if (b) setBlocked(JSON.parse(b));
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      settings,
      set: (patch: Partial<AppSettings>) => {
        setSettings((s) => {
          const next = { ...s, ...patch };
          localStorage.setItem("scamguard-settings", JSON.stringify(next));
          return next;
        });
      },
      blocked,
      block: (id: number) => {
        setBlocked((prev) => {
          const next = prev.includes(id) ? prev : [...prev, id];
          localStorage.setItem("scamguard-blocked", JSON.stringify(next));
          return next;
        });
      },
    }),
    [settings, blocked]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("SettingsProvider missing");
  return ctx;
}
