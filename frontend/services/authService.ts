import { insforge, friendlyError, setAccessToken } from "@/lib/insforge";
import type { User } from "@/lib/types";

export async function signup(email: string, password: string, name?: string) {
  const { data, error } = await insforge.auth.signUp({
    email,
    password,
    name,
    redirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
  });
  if (error) throw new Error(friendlyError(error, "Could not create the account."));
  if (data?.accessToken) setAccessToken(data.accessToken);
  return data;
}

export async function login(email: string, password: string) {
  const { data, error } = await insforge.auth.signInWithPassword({ email, password });
  if (error) throw new Error(friendlyError(error, "Invalid email or password."));
  if (data?.accessToken) setAccessToken(data.accessToken);
  return data;
}

export async function logout() {
  await insforge.auth.signOut();
  setAccessToken(null);
}

export async function currentUser(): Promise<User | null> {
  const auth = insforge.auth as { refreshSession?: () => Promise<{ data?: { accessToken?: string; user?: User } | null }> };
  if (typeof auth.refreshSession === "function") {
    const refreshed = await auth.refreshSession();
    if (refreshed.data?.accessToken) setAccessToken(refreshed.data.accessToken);
    if (refreshed.data?.user) return refreshed.data.user;
  }
  const { data, error } = await insforge.auth.getCurrentUser();
  if (error || !data?.user) return null;
  return data.user as User;
}

export async function verifyEmailCode(email: string, otp: string) {
  const { data, error } = await insforge.auth.verifyEmail({ email, otp });
  if (error) throw new Error(friendlyError(error, "That code is invalid or expired."));
  if (data?.accessToken) setAccessToken(data.accessToken);
  return data;
}

export async function resendVerification(email: string) {
  const { data, error } = await insforge.auth.resendVerificationEmail({
    email,
    redirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
  });
  if (error) throw new Error(friendlyError(error, "Could not send the verification email."));
  return data;
}

export async function sendResetEmail(email: string) {
  const { data, error } = await insforge.auth.sendResetPasswordEmail({
    email,
    redirectTo: typeof window !== "undefined" ? `${window.location.origin}/forgot-password` : undefined,
  });
  if (error) throw new Error(friendlyError(error, "Could not send the reset email."));
  return data;
}

export async function confirmReset(email: string, code: string, newPassword: string) {
  const { data, error } = await insforge.auth.exchangeResetPasswordToken({ email, code });
  if (error) throw new Error(friendlyError(error, "That reset code is invalid or expired."));
  const token = data?.token;
  if (!token) throw new Error("Could not verify the reset code.");
  const reset = await insforge.auth.resetPassword({ newPassword, otp: token });
  if (reset.error) throw new Error(friendlyError(reset.error, "Could not reset the password."));
  return reset.data;
}
