import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@diego-porras/database";
import { laminaSchema } from "@diego-porras/shared";
import { requireSession, logAuditoria } from "@/lib/auth";
import { procesarLamina } from "@/lib/procesar-lamina";

export const maxDuration = 30;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const laminas = await prisma.lamina.findMany({
      where: { proyectoId: id },
      include: { _count: { select: { elementos: true } } },
      orderBy: { codigo: "asc" },
    });
    return NextResponse.json(laminas);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}

/**
 * Register a lamina after client-side Blob upload.
 * Body: { archivoUrl, archivoNombre, tamano?, metadata }
 * Processing runs async via after() so the response stays fast.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(["ADMIN"]);
    const { id: proyectoId } = await params;
    const body = await req.json();

    const archivoUrl = body.archivoUrl as string | undefined;
    const archivoNombre = body.archivoNombre as string | undefined;
    const tamano = typeof body.tamano === "number" ? body.tamano : undefined;
    const meta = body.metadata ?? {};

    if (!archivoUrl || !archivoNombre) {
      return NextResponse.json(
        { error: "archivoUrl y archivoNombre son requeridos" },
        { status: 400 }
      );
    }

    const parsed = laminaSchema.safeParse(meta);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const lamina = await prisma.lamina.create({
      data: {
        proyectoId,
        codigo: parsed.data.codigo,
        nombre: parsed.data.nombre,
        disciplina: parsed.data.disciplina,
        tipo: parsed.data.tipo,
        escala: parsed.data.escala,
        revision: parsed.data.revision,
        archivoUrl,
        archivoNombre,
        estadoProcesamiento: "PENDIENTE",
        metadataJson: {
          size: tamano,
          source: "client-blob-upload",
        },
      },
    });

    await logAuditoria("UPLOAD", "Lamina", session.id, proyectoId, lamina.id, {
      codigo: lamina.codigo,
      estado: "PENDIENTE",
    });

    // Fire-and-forget processing after response is sent
    after(async () => {
      try {
        await procesarLamina(lamina.id);
      } catch (e) {
        console.error("Background procesarLamina failed:", e);
      }
    });

    return NextResponse.json(lamina, { status: 201 });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Error al registrar lámina";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
