"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AppSettings } from "@/lib/types";
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from "@/services/settingsService";
import { useAuth } from "@/components/AuthProvider";

const Ctx = createContext<{
  settings: AppSettings;
  set: (patch: Partial<AppSettings>) => void;
  blocked: string[];
  block: (id: string | number) => void;
  saving: boolean;
  error: string | null;
} | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadSettings()
      .then(setSettings)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load settings."));
  }, [isAuthenticated]);

  const persist = async (next: AppSettings) => {
    setSaving(true);
    setError(null);
    try {
      await saveSettings(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  const value = useMemo(
    () => ({
      settings,
      saving,
      error,
      set: (patch: Partial<AppSettings>) => {
        setSettings((s) => {
          const next = { ...s, ...patch };
          void persist(next);
          return next;
        });
      },
      blocked: settings.blockedIds || [],
      block: (id: string | number) => {
        const sid = String(id);
        setSettings((s) => {
          const blockedIds = s.blockedIds.includes(sid) ? s.blockedIds : [...s.blockedIds, sid];
          const next = { ...s, blockedIds };
          void persist(next);
          return next;
        });
      },
    }),
    [settings, saving, error]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("SettingsProvider missing");
  return ctx;
}
