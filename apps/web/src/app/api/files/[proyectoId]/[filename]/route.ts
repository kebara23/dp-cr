import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@diego-porras/database";
import { requireSession } from "@/lib/auth";
import * as fs from "fs/promises";
import { getUploadPath, isRemoteUrl } from "@/lib/uploads";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ proyectoId: string; filename: string }> }
) {
  try {
    await requireSession();
    const { proyectoId, filename } = await params;

    // Prefer redirecting to Blob URL stored on the Lamina record
    const lamina = await prisma.lamina.findFirst({
      where: {
        proyectoId,
        OR: [
          { archivoUrl: { contains: filename } },
          { archivoNombre: filename },
        ],
      },
      select: { archivoUrl: true },
    });

    if (lamina?.archivoUrl && isRemoteUrl(lamina.archivoUrl)) {
      return NextResponse.redirect(lamina.archivoUrl);
    }

    // Legacy local disk fallback
    const filepath = getUploadPath(proyectoId, filename);
    const data = await fs.readFile(filepath);
    const ext = filename.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "pdf"
        ? "application/pdf"
        : ext === "png"
          ? "image/png"
          : ext === "jpg" || ext === "jpeg"
            ? "image/jpeg"
            : "application/octet-stream";

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }
}
