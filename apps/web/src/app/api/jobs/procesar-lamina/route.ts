import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@diego-porras/database";
import { procesarLamina } from "@/lib/procesar-lamina";

export const maxDuration = 60;

/**
 * Async job: download lamina from Blob URL and extract/classify text.
 * Auth: CRON_SECRET bearer, or same-origin internal call with x-job-secret.
 */
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET || process.env.JWT_SECRET;
    const auth = req.headers.get("authorization");
    const jobSecret = req.headers.get("x-job-secret");
    const authorized =
      (secret && auth === `Bearer ${secret}`) ||
      (secret && jobSecret === secret) ||
      process.env.NODE_ENV === "development";

    if (!authorized) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const laminaId = body.laminaId as string | undefined;
    if (!laminaId) {
      return NextResponse.json({ error: "laminaId requerido" }, { status: 400 });
    }

    const lamina = await prisma.lamina.findUnique({ where: { id: laminaId } });
    if (!lamina) {
      return NextResponse.json({ error: "Lámina no encontrada" }, { status: 404 });
    }

    await procesarLamina(laminaId);

    const updated = await prisma.lamina.findUnique({
      where: { id: laminaId },
      include: { _count: { select: { elementos: true, documentosConocimiento: true } } },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Error en job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
