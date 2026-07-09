import { put } from "@vercel/blob";
import * as fs from "fs/promises";
import * as path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

function safeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

/**
 * Persists an uploaded file.
 * - Production / when BLOB_READ_WRITE_TOKEN is set → Vercel Blob
 * - Local fallback without token → disk under apps/web/uploads
 */
export async function saveUploadedFile(
  proyectoId: string,
  filename: string,
  buffer: Buffer,
  contentType?: string
): Promise<string> {
  const safeName = safeFilename(filename);
  const key = `laminas/${proyectoId}/${Date.now()}-${safeName}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(key, buffer, {
      access: "public",
      contentType: contentType || guessContentType(filename),
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  // Local filesystem fallback (dev without Blob token)
  await ensureUploadDir();
  const dir = path.join(UPLOAD_DIR, proyectoId);
  await fs.mkdir(dir, { recursive: true });
  const filepath = path.join(dir, `${Date.now()}-${safeName}`);
  await fs.writeFile(filepath, buffer);
  return `/api/files/${proyectoId}/${path.basename(filepath)}`;
}

export function getUploadPath(proyectoId: string, filename: string): string {
  return path.join(UPLOAD_DIR, proyectoId, filename);
}

export function isRemoteUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function guessContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return "application/octet-stream";
}
