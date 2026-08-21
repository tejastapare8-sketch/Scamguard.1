import { createClient } from "@insforge/sdk";

const url = process.env.NEXT_PUBLIC_INSFORGE_URL || "";
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || "";

export const insforge = createClient({
  baseUrl: url,
  anonKey,
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== "undefined") {
    if (token) sessionStorage.setItem("scamguard-access-token", token);
    else sessionStorage.removeItem("scamguard-access-token");
  }
}

export function getAccessToken() {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("scamguard-access-token");
  }
  return null;
}

export async function refreshAccessToken(): Promise<string | null> {
  const auth = insforge.auth as {
    getCurrentSession?: () => Promise<{ data?: { accessToken?: string | null } | null }>;
    getSession?: () => Promise<{ data?: { accessToken?: string | null } | null }>;
  };
  if (typeof auth.getCurrentSession === "function") {
    const { data } = await auth.getCurrentSession();
    const token = data?.accessToken || null;
    if (token) setAccessToken(token);
    return token;
  }
  if (typeof auth.getSession === "function") {
    const { data } = await auth.getSession();
    const token = data?.accessToken || null;
    if (token) setAccessToken(token);
    return token;
  }
  return getAccessToken();
}

export function friendlyError(err: unknown, fallback = "Something went wrong. Please try again.") {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  if (err instanceof Error && err.message) return err.message;
  const e = err as { message?: string; error?: string };
  return e.message || e.error || fallback;
}
