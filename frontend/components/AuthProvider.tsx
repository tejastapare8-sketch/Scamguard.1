"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import { refreshAccessToken, setAccessToken } from "@/lib/insforge";
import * as authService from "@/services/authService";

type AuthCtx = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<{ requireEmailVerification?: boolean }>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

const PUBLIC = ["/login", "/signup", "/forgot-password", "/verify-email"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshAccessToken();
        const u = await authService.currentUser();
        if (!cancelled) setUser(u);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authService.login(email, password);
    setUser((data?.user as User) || (await authService.currentUser()));
    router.replace("/");
  }, [router]);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    const data = await authService.signup(email, password, name);
    if (data?.requireEmailVerification) {
      router.replace(`/verify-email?email=${encodeURIComponent(email)}`);
      return { requireEmailVerification: true };
    }
    if (data?.user) setUser(data.user as User);
    router.replace("/");
    return { requireEmailVerification: false };
  }, [router]);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setAccessToken(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      logout,
    }),
    [user, isLoading, login, signup, logout]
  );

  const publicPage = PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (isLoading) return;
    if (!user && !publicPage) router.replace("/login");
    if (user && (pathname === "/login" || pathname === "/signup")) router.replace("/");
  }, [isLoading, user, publicPage, pathname, router]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-page text-sm font-semibold text-slate-500">
        Checking session…
      </div>
    );
  }

  if (!user && !publicPage) {
    return (
      <div className="grid min-h-screen place-items-center bg-page text-sm font-semibold text-slate-500">
        Redirecting to sign in…
      </div>
    );
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}

export { PUBLIC as PUBLIC_PATHS };
