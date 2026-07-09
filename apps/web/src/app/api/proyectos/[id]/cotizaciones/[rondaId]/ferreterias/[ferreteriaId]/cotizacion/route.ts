import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@diego-porras/database";
import { requireSession, logAuditoria } from "@/lib/auth";
import { procesarCotizacion } from "@/lib/procesar-cotizacion";

export const maxDuration = 60;

function detectarFormato(nombre: string, contentType?: string): string {
  const n = nombre.toLowerCase();
  if (n.endsWith(".xlsx") || n.endsWith(".xls")) return "xlsx";
  if (n.endsWith(".pdf") || contentType?.includes("pdf")) return "pdf";
  if (n.endsWith(".png") || contentType?.includes("png")) return "png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg") || contentType?.includes("jpeg"))
    return "jpg";
  return "pdf";
}

export async function POST(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; rondaId: string; ferreteriaId: string }> }
) {
  try {
    const session = await requireSession(["ADMIN"]);
    const { id: proyectoId, rondaId, ferreteriaId } = await params;
    const body = await req.json();

    const ferreteria = await prisma.ferreteria.findFirst({
      where: { id: ferreteriaId, rondaId, ronda: { proyectoId } },
    });
    if (!ferreteria) {
      return NextResponse.json({ error: "Ferretería no encontrada" }, { status: 404 });
    }

    if (!body.archivoUrl || !body.archivoNombre) {
      return NextResponse.json(
        { error: "archivoUrl y archivoNombre requeridos" },
        { status: 400 }
      );
    }

    const formato =
      body.formato || detectarFormato(body.archivoNombre, body.contentType);

    const cotizacion = await prisma.cotizacionFerreteria.create({
      data: {
        rondaId,
        ferreteriaId,
        archivoUrl: body.archivoUrl,
        archivoNombre: body.archivoNombre,
        formato,
        moneda: body.moneda ?? "CRC",
        estadoProcesamiento: "PENDIENTE",
      },
    });

    await logAuditoria(
      "SUBIR",
      "CotizacionFerreteria",
      session.id,
      proyectoId,
      cotizacion.id,
      { formato, ferreteriaId }
    );

    after(async () => {
      try {
        await procesarCotizacion(cotizacion.id);
      } catch (e) {
        console.error("after procesarCotizacion", e);
      }
    });

    return NextResponse.json(cotizacion, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al registrar cotización" }, { status: 500 });
  }
}
