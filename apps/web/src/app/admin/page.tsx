import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@diego-porras/database";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "ADMIN") redirect("/cliente");

  const proyectos = await prisma.proyecto.findMany({
    where: { adminId: session.id },
    include: { _count: { select: { laminas: true, listasCantidades: true, presupuestos: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Admin Console</h1>
          <p className="text-sm text-slate-500">{session.name}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/management" className="text-sm text-primary hover:underline">
            Management
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-sm text-slate-500 hover:text-slate-700">
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Proyectos</h2>
          <Link
            href="/admin/proyectos/nuevo"
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Nuevo proyecto
          </Link>
        </div>

        <div className="grid gap-4">
          {proyectos.map((p) => (
            <Link
              key={p.id}
              href={`/admin/proyectos/${p.id}`}
              className="block bg-white border rounded-xl p-5 hover:shadow-md transition"
            >
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold">{p.nombre}</h3>
                  <p className="text-sm text-slate-500">{p.ubicacion ?? `${p.canton}, ${p.provincia}`}</p>
                  {p.propietario && (
                    <p className="text-xs text-slate-400 mt-1">Prop: {p.propietario}</p>
                  )}
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p>{p._count.laminas} láminas</p>
                  <p>{p._count.listasCantidades} metrados</p>
                  <p>{p._count.presupuestos} presupuestos</p>
                </div>
              </div>
            </Link>
          ))}
          {proyectos.length === 0 && (
            <p className="text-center text-slate-400 py-12">No hay proyectos. Cree uno nuevo o ejecute el seed.</p>
          )}
        </div>
      </main>
    </div>
  );
}
