"use client";

import { FormEvent, useEffect, useState } from "react";
import { loadProfile, updateProfile, uploadAvatar } from "@/services/settingsService";
import { useAuth } from "@/components/AuthProvider";

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    loadProfile()
      .then((p) => {
        setName(p?.full_name || user?.profile?.name || "");
        setAvatar(p?.avatar_url || user?.profile?.avatar_url || null);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load profile."));
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      await updateProfile({ full_name: name.trim(), avatar_url: avatar });
      setOk("Profile saved.");
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Could not save profile.");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const up = await uploadAvatar(file);
      setAvatar(up.url);
      await updateProfile({ full_name: name.trim(), avatar_url: up.url });
      setOk("Photo updated.");
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Could not upload the photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h1 className="text-2xl font-extrabold text-navy">Profile</h1>
      <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-slate-100">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-xs text-slate-400">No photo</div>
            )}
          </div>
          <label className="text-sm font-semibold text-brand">
            Upload photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
          </label>
        </div>
        <label className="block text-sm font-semibold text-navy">
          Full name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"
          />
        </label>
        {err && <p className="text-sm text-danger">{err}</p>}
        {ok && <p className="text-sm text-safe">{ok}</p>}
        <button type="submit" disabled={busy} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white">
          {busy ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
