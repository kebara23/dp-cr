import * as fs from "fs/promises";
import * as path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function saveUploadedFile(
  proyectoId: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  await ensureUploadDir();
  const dir = path.join(UPLOAD_DIR, proyectoId);
  await fs.mkdir(dir, { recursive: true });
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filepath = path.join(dir, `${Date.now()}-${safeName}`);
  await fs.writeFile(filepath, buffer);
  return `/api/files/${proyectoId}/${path.basename(filepath)}`;
}

export function getUploadPath(proyectoId: string, filename: string): string {
  return path.join(UPLOAD_DIR, proyectoId, filename);
}
