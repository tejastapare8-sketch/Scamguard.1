import { insforge, friendlyError } from "@/lib/insforge";
import { api, AnalysisResult } from "@/lib/api";

const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX = 8 * 1024 * 1024;

export async function uploadScreenshot(file: File) {
  const { data: userData } = await insforge.auth.getCurrentUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error("Please sign in again.");
  if (!ALLOWED.includes(file.type)) throw new Error("Unsupported file type. Use PNG, JPG, or WEBP.");
  if (file.size < 32) throw new Error("That file is empty or unreadable.");
  if (file.size > MAX) throw new Error("File is too large. Use an image under 8 MB.");
  const safeName = file.name.replace(/[^\w.\-]+/g, "_") || "screenshot.png";
  const path = `${userId}/${crypto.randomUUID()}/${safeName}`;
  const { data, error } = await insforge.storage.from("screenshots").upload(path, file);
  if (error || !data) throw new Error(friendlyError(error, "File upload failed."));
  return { key: data.key, url: data.url, size: data.size, mimeType: data.mimeType, name: safeName };
}

export async function analyzeScreenshot(opts: {
  file: File | null;
  text: string;
  sender?: string;
  storage?: { key: string; url: string; size?: number; mimeType?: string; name?: string };
}): Promise<AnalysisResult> {
  const fd = new FormData();
  fd.set("text", opts.text);
  if (opts.sender) fd.set("sender", opts.sender);
  if (opts.file) fd.set("file", opts.file);
  if (opts.storage) {
    fd.set("storage_path", opts.storage.key);
    fd.set("storage_url", opts.storage.url);
    fd.set("file_name", opts.storage.name || opts.file?.name || "screenshot");
    fd.set("mime_type", opts.storage.mimeType || opts.file?.type || "");
    fd.set("file_size", String(opts.storage.size || opts.file?.size || 0));
  }
  return api<AnalysisResult>("/api/analyze/screenshot", { method: "POST", body: fd });
}
