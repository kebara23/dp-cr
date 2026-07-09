import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@diego-porras/database";
import { fuentePrecioSchema } from "@diego-porras/shared";
import { requireSession } from "@/lib/auth";

export async function GET() {
  try {
    await requireSession(["ADMIN"]);
    const fuentes = await prisma.fuentePrecio.findMany({
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
    });
    const reglas = await prisma.reglaMetrado.findMany({ where: { activo: true } });
    return NextResponse.json({ fuentes, reglas });
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession(["ADMIN"]);
    const body = await req.json();

    if (body.tipo === "fuente") {
      const parsed = fuentePrecioSchema.safeParse(body.data);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      }
      const fuente = await prisma.fuentePrecio.create({
        data: {
          ...parsed.data,
          vigenciaDesde: new Date(parsed.data.vigenciaDesde),
          vigenciaHasta: parsed.data.vigenciaHasta ? new Date(parsed.data.vigenciaHasta) : null,
        },
      });
      return NextResponse.json(fuente, { status: 201 });
    }

    if (body.tipo === "import_csv" && body.fuenteId && body.items) {
      const items = body.items as Array<{
        codigo: string;
        descripcion: string;
        unidad: string;
        precioUnitario: number;
        categoria: string;
      }>;
      await prisma.itemPrecio.createMany({
        data: items.map((i) => ({ ...i, fuenteId: body.fuenteId })),
      });
      return NextResponse.json({ imported: items.length });
    }

    if (body.tipo === "regla_metrado") {
      const regla = await prisma.reglaMetrado.create({ data: body.data });
      return NextResponse.json(regla, { status: 201 });
    }

    return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
