import Link from "next/link";
import { prisma } from "@diego-porras/database";

export default async function SuperAdminPage() {
  const tenants = await prisma.tenant.findMany({
    include: {
      modulos: true,
      _count: { select: { usuarios: true, proyectos: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tenants / Clientes</h1>
          <p className="text-slate-500 text-sm mt-1">
            Apruebe módulos por cliente. Solo verán lo que usted active.
          </p>
        </div>
        <Link
          href="/super-admin/tenants/nuevo"
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          + Nuevo tenant
        </Link>
      </div>

      <div className="grid gap-4">
        {tenants.map((t) => {
          const activos = t.modulos.filter((m) => m.activo);
          return (
            <Link
              key={t.id}
              href={`/super-admin/tenants/${t.id}`}
              className="block bg-white border rounded-xl p-5 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-lg">{t.nombre}</h2>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        t.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {t.activo ? "activo" : "inactivo"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">slug: {t.slug}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {activos.map((m) => (
                      <span
                        key={m.id}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                      >
                        {m.modulo}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p>{t._count.usuarios} usuarios</p>
                  <p>{t._count.proyectos} proyectos</p>
                  <p>{activos.length}/{t.modulos.length} módulos</p>
                </div>
              </div>
            </Link>
          );
        })}
        {tenants.length === 0 && (
          <p className="text-center text-slate-400 py-12">No hay tenants. Cree el primero.</p>
        )}
      </div>
    </div>
  );
}
