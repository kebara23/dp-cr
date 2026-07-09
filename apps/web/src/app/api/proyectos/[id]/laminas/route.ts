import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@diego-porras/database";
import { laminaSchema } from "@diego-porras/shared";
import { classifyLaminaContent } from "@diego-porras/ctk";
import { requireSession, logAuditoria } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/uploads";

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(["ADMIN"]);
    const { id: proyectoId } = await params;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const metadata = formData.get("metadata") as string | null;

    if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });

    const meta = metadata ? JSON.parse(metadata) : {};
    const parsed = laminaSchema.safeParse(meta);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const archivoUrl = await saveUploadedFile(proyectoId, file.name, buffer);

    const classified = classifyLaminaContent(file.name, file.name);

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
        archivoNombre: file.name,
        estadoProcesamiento: "PENDIENTE",
        metadataJson: { classified, size: file.size },
      },
    });

    await logAuditoria("UPLOAD", "Lamina", session.id, proyectoId, lamina.id, {
      codigo: lamina.codigo,
    });

    return NextResponse.json(lamina, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al subir" }, { status: 500 });
  }
}
