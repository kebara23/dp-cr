import { NextRequest, NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { prisma } from "@diego-porras/database";
import { requireSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(["SUPER_ADMIN"]);
    const { id } = await params;
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !["ADMIN", "CLIENTE"].includes(role)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "Email ya existe" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hash,
        role,
        tenantId: id,
      },
    });

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
