import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@diego-porras/database";
import { ProyectoWorkspace } from "@/components/ProyectoWorkspace";

export default async function ProyectoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/");

  const { id } = await params;
  const proyecto = await prisma.proyecto.findUnique({
    where: { id },
    include: {
      laminas: true,
      documentosConocimiento: {
        include: { _count: { select: { reglasTecnicas: true, filasTabla: true } } },
      },
      conflictos: { include: { reglaA: true, reglaB: true } },
      listasCantidades: {
        include: { lineas: true },
        orderBy: { version: "desc" },
        take: 3,
      },
      presupuestos: {
        include: { fuentePrecios: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
  });

  if (!proyecto || proyecto.adminId !== session.id) redirect("/admin");

  const reglas = await prisma.reglaTecnica.findMany({
    where: { documento: { proyectoId: id } },
    orderBy: { codigo: "asc" },
  });

  const fuentes = await prisma.fuentePrecio.findMany({ where: { activo: true } });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4">
        <Link href="/admin" className="text-sm text-primary hover:underline">← Proyectos</Link>
        <h1 className="text-xl font-bold mt-1">{proyecto.nombre}</h1>
        <p className="text-sm text-slate-500">{proyecto.ubicacion}</p>
      </header>
      <main className="max-w-6xl mx-auto p-6">
        <ProyectoWorkspace proyecto={proyecto} reglas={reglas} fuentes={fuentes} />
      </main>
    </div>
  );
}
