import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@diego-porras/database";
import { chatMessageSchema } from "@diego-porras/shared";
import { procesarPregunta } from "@diego-porras/agent";
import { requireSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(["ADMIN"]);
    const { id } = await params;
    const conversaciones = await prisma.conversacionAgente.findMany({
      where: { proyectoId: id, userId: session.id },
      include: { mensajes: { orderBy: { createdAt: "asc" }, take: 50 } },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(conversaciones);
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
    const body = await req.json();
    const parsed = chatMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });
    }

    let conversacion = body.conversacionId
      ? await prisma.conversacionAgente.findUnique({ where: { id: body.conversacionId } })
      : null;

    if (!conversacion) {
      conversacion = await prisma.conversacionAgente.create({
        data: {
          proyectoId,
          userId: session.id,
          titulo: parsed.data.mensaje.slice(0, 50),
          contextoJson: {
            disciplina: parsed.data.disciplina,
            laminaCodigo: parsed.data.laminaCodigo,
          },
        },
      });
    }

    await prisma.mensajeAgente.create({
      data: {
        conversacionId: conversacion.id,
        rol: "user",
        contenido: parsed.data.mensaje,
      },
    });

    const factura = await prisma.facturaMixta.findFirst({
      where: { ronda: { proyectoId } },
      orderBy: { createdAt: "desc" },
      include: {
        lineas: { include: { lineaMaterial: true, ferreteria: true } },
      },
    });

    const preciosFerreteria =
      factura?.lineas.map((l) => ({
        descripcion: l.lineaMaterial.descripcion,
        unidad: l.lineaMaterial.unidad,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        subtotal: l.subtotal,
        ferreteria: l.ferreteria.nombre,
      })) ?? [];

    const respuesta = procesarPregunta(parsed.data.mensaje, { preciosFerreteria });

    const mensajeAgente = await prisma.mensajeAgente.create({
      data: {
        conversacionId: conversacion.id,
        rol: "assistant",
        contenido: respuesta.respuesta,
        fuentesCitasJson: respuesta.fuentes,
        confianza: respuesta.confianza,
        herramientasJson: {
          fundamento: respuesta.fundamento,
          requiereValidacion: respuesta.requiereValidacion,
          herramientas: respuesta.herramientas ?? [],
        },
      },
    });

    await prisma.auditoriaEvento.create({
      data: {
        accion: "CHAT_AGENTE",
        entidad: "ConversacionAgente",
        entidadId: conversacion.id,
        userId: session.id,
        proyectoId,
        detalleJson: {
          pregunta: parsed.data.mensaje,
          confianza: respuesta.confianza,
          fuentes: respuesta.fuentes.length,
        },
      },
    });

    return NextResponse.json({
      conversacionId: conversacion.id,
      mensaje: mensajeAgente,
      respuesta,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error en agente" }, { status: 500 });
  }
}
