import { notFound } from "next/navigation";
import { prisma } from "@diego-porras/database";
import { TenantModulosForm } from "@/components/TenantModulosForm";
import { TenantUsuarioForm } from "@/components/TenantUsuarioForm";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      modulos: { orderBy: { modulo: "asc" } },
      usuarios: { orderBy: { createdAt: "asc" } },
      proyectos: { select: { id: true, nombre: true, ubicacion: true } },
    },
  });
  if (!tenant) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{tenant.nombre}</h1>
        <p className="text-slate-500 text-sm">
          {tenant.slug} · {tenant.activo ? "activo" : "inactivo"}
        </p>
      </div>

      <section className="bg-white border rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold mb-4">Módulos aprobados</h2>
        <p className="text-sm text-slate-500 mb-4">
          El Admin de este tenant solo verá en su sidebar los módulos activos.
        </p>
        <TenantModulosForm
          tenantId={tenant.id}
          modulos={tenant.modulos.map((m) => ({ modulo: m.modulo, activo: m.activo }))}
        />
      </section>

      <section className="bg-white border rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold mb-4">Usuarios</h2>
        <div className="space-y-2 mb-6">
          {tenant.usuarios.map((u) => (
            <div key={u.id} className="flex justify-between text-sm border-b py-2">
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-slate-500">{u.email}</p>
              </div>
              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full h-fit">{u.role}</span>
            </div>
          ))}
        </div>
        <TenantUsuarioForm tenantId={tenant.id} />
      </section>

      <section className="bg-white border rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold mb-4">Proyectos ({tenant.proyectos.length})</h2>
        {tenant.proyectos.length === 0 ? (
          <p className="text-sm text-slate-400">Sin proyectos aún.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {tenant.proyectos.map((p) => (
              <li key={p.id} className="border-b py-2">
                <span className="font-medium">{p.nombre}</span>
                {p.ubicacion && <span className="text-slate-500"> — {p.ubicacion}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
