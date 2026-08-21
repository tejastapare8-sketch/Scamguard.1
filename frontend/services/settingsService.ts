import { insforge, friendlyError } from "@/lib/insforge";
import type { AppSettings, Profile } from "@/lib/types";

export const DEFAULT_SETTINGS: AppSettings = {
  automaticDetection: true,
  scamAlerts: true,
  blockHighRiskLinks: true,
  alertSound: true,
  language: "English",
  blockedIds: [],
};

export async function loadSettings(): Promise<AppSettings> {
  const { data, error } = await insforge.database.from("user_settings").select("settings").maybeSingle();
  if (error) throw new Error(friendlyError(error, "Could not load settings."));
  const raw = (data?.settings || {}) as Partial<AppSettings>;
  return { ...DEFAULT_SETTINGS, ...raw, blockedIds: raw.blockedIds || [] };
}

export async function saveSettings(settings: AppSettings) {
  const { data: userData } = await insforge.auth.getCurrentUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error("Please sign in again.");
  const { data: existing } = await insforge.database
    .from("user_settings")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!existing) {
    const { error } = await insforge.database.from("user_settings").insert([{ user_id: userId, settings }]);
    if (error) throw new Error(friendlyError(error, "Could not save settings."));
    return;
  }
  const { error } = await insforge.database.from("user_settings").update({ settings }).eq("user_id", userId);
  if (error) throw new Error(friendlyError(error, "Could not save settings."));
}

export async function loadProfile(): Promise<Profile | null> {
  const { data, error } = await insforge.database.from("profiles").select("*").maybeSingle();
  if (error) throw new Error(friendlyError(error, "Could not load profile."));
  return (data as Profile) || null;
}

export async function updateProfile(patch: { full_name?: string; avatar_url?: string | null }) {
  const { data: userData } = await insforge.auth.getCurrentUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error("Please sign in again.");
  const { data: existing } = await insforge.database.from("profiles").select("id").eq("user_id", userId).maybeSingle();
  if (!existing) {
    const { error } = await insforge.database.from("profiles").insert([{ user_id: userId, ...patch }]);
    if (error) throw new Error(friendlyError(error, "Could not update profile."));
  } else {
    const { error } = await insforge.database.from("profiles").update(patch).eq("user_id", userId);
    if (error) throw new Error(friendlyError(error, "Could not update profile."));
  }
  await insforge.auth.setProfile({
    name: patch.full_name,
    avatar_url: patch.avatar_url,
  });
}

export async function uploadAvatar(file: File) {
  const { data: userData } = await insforge.auth.getCurrentUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error("Please sign in again.");
  if (!file.type.startsWith("image/")) throw new Error("Please choose a PNG, JPG, or WEBP image.");
  if (file.size > 4 * 1024 * 1024) throw new Error("Avatar must be under 4 MB.");
  const path = `${userId}/avatar/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
  const { data, error } = await insforge.storage.from("screenshots").upload(path, file);
  if (error || !data) throw new Error(friendlyError(error, "Could not upload the image."));
  return { url: data.url, key: data.key };
}
