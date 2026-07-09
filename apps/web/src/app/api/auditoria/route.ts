import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@diego-porras/database";
import { requireSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireSession(["ADMIN"]);
    const proyectoId = req.nextUrl.searchParams.get("proyectoId");
    const eventos = await prisma.auditoriaEvento.findMany({
      where: proyectoId ? { proyectoId } : undefined,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(eventos);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}
