import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@diego-porras/database";
import { requireSession, logAuditoria } from "@/lib/auth";
import { generarListaCantidadesDefault } from "@diego-porras/engine";
import { PARTIDAS_MVP } from "@diego-porras/shared";

const PARAMETROS_DEMO: Record<string, Record<string, number>> = {
  "02.01": { volumen: 12 },
  "03.01": { largo: 85, alto: 2.8 },
  "05.01": { largo: 13.4, ancho: 10.1, desperdicio: 10 },
  "05.05": { area: 120 },
  "06.02": { ancho: 1.5, alto: 1.4, cantidad: 4 },
  "07.01": { longitud: 45 },
  "07.03": { cantidad: 1 },
  "09.01": { cantidad: 1 },
  "09.04": { cantidad: 18 },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(["ADMIN"]);
    const { id } = await params;
    const listas = await prisma.listaCantidades.findMany({
      where: { proyectoId: id },
      include: { lineas: true, generador: { select: { name: true } } },
      orderBy: { version: "desc" },
    });
    return NextResponse.json(listas);
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

    const lastVersion = await prisma.listaCantidades.findFirst({
      where: { proyectoId },
      orderBy: { version: "desc" },
    });
    const version = (lastVersion?.version ?? 0) + 1;

    const parametros = body.parametros ?? PARAMETROS_DEMO;
    const resultados = generarListaCantidadesDefault(parametros);

    const lista = await prisma.listaCantidades.create({
      data: {
        proyectoId,
        version,
        estado: "BORRADOR",
        generadoPor: session.id,
        lineas: {
          create: resultados.map((r) => {
            const partida = PARTIDAS_MVP.find((p) => p.codigo === r.partidaCodigo);
            return {
              partidaCodigo: r.partidaCodigo,
              capitulo: partida?.capitulo ?? "00",
              descripcion: r.descripcion,
              unidad: r.unidad,
              cantidad: r.cantidad,
              formulaAplicada: r.formulaAplicada,
              reglasCtkIds: r.reglasCtkIds,
              estado: "CALCULADO",
            };
          }),
        },
      },
      include: { lineas: true },
    });

    await logAuditoria("GENERAR", "ListaCantidades", session.id, proyectoId, lista.id);

    return NextResponse.json(lista, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al generar metrado" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(["ADMIN"]);
    const { id: proyectoId } = await params;
    const body = await req.json();

    if (body.accion === "aprobar" && body.listaId) {
      const lista = await prisma.listaCantidades.update({
        where: { id: body.listaId },
        data: { estado: "APROBADO" },
      });
      await logAuditoria("APROBAR", "ListaCantidades", session.id, proyectoId, lista.id);
      return NextResponse.json(lista);
    }

    if (body.accion === "ajustar_linea" && body.lineaId) {
      const linea = await prisma.lineaCantidad.update({
        where: { id: body.lineaId },
        data: {
          cantidad: body.cantidad,
          notas: body.notas,
          estado: "AJUSTADO_MANUAL",
        },
      });
      return NextResponse.json(linea);
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}
