import { NextRequest, NextResponse } from "next/server";
import { prisma, Modulo } from "@diego-porras/database";
import { requireSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(["SUPER_ADMIN"]);
    const { id } = await params;
    const body = await req.json();
    const modulos = body.modulos as Array<{ modulo: Modulo; activo: boolean }>;

    for (const m of modulos) {
      await prisma.tenantModulo.upsert({
        where: { tenantId_modulo: { tenantId: id, modulo: m.modulo } },
        update: { activo: m.activo },
        create: { tenantId: id, modulo: m.modulo, activo: m.activo },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
