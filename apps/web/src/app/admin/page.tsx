import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getTenantContext, getActiveProyecto } from "@/lib/auth";
import { prisma } from "@diego-porras/database";
import { DISCIPLINA_COLORS } from "@/lib/modules";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const tenant = await getTenantContext(session);
  const proyecto = await getActiveProyecto(session);

  const proyectos = await prisma.proyecto.findMany({
    where: session.tenantId ? { tenantId: session.tenantId } : { adminId: session.id },
    include: {
      _count: { select: { laminas: true, listasCantidades: true, presupuestos: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const reglasCount = proyecto
    ? await prisma.reglaTecnica.count({
        where: { documento: { proyectoId: proyecto.id } },
      })
    : 0;

  const laminas = proyecto
    ? await prisma.lamina.findMany({
        where: { proyectoId: proyecto.id },
        orderBy: { codigo: "asc" },
        take: 12,
      })
    : [];

  const stats = [
    {
      label: "Láminas",
      value: String(proyecto?._count.laminas ?? 0),
      detail: "planos cargados",
    },
    {
      label: "Reglas CTK",
      value: String(reglasCount),
      detail: "pack indexado",
    },
    {
      label: "Metrados",
      value: String(proyecto?._count.listasCantidades ?? 0),
      detail: "listas generadas",
    },
    {
      label: "Presupuestos",
      value: String(proyecto?._count.presupuestos ?? 0),
      detail: "cotizaciones",
    },
  ];

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {proyecto
              ? `Proyecto: ${proyecto.nombre}${proyecto.ubicacion ? ` — ${proyecto.ubicacion}` : ""}`
              : "Seleccione o cree un proyecto"}
          </p>
          {tenant && (
            <p className="text-xs text-gray-400 mt-1">Tenant: {tenant.nombre}</p>
          )}
        </div>
        <Link
          href="/admin/proyectos/nuevo"
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700"
        >
          + Nuevo proyecto
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{s.value}</div>
            <div className="text-sm font-medium text-gray-900 mt-1">{s.label}</div>
            <div className="text-xs text-gray-400">{s.detail}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {proyecto && (
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <h2 className="font-semibold text-gray-900 mb-3">Información del Proyecto</h2>
            <dl className="space-y-2 text-sm">
              {[
                ["Nombre", proyecto.nombre],
                ["Propietario", proyecto.propietario],
                ["Cédula", proyecto.cedulaProp],
                ["Catastro", proyecto.planoCatastral],
                ["Ubicación", proyecto.ubicacion],
                ["Moneda", proyecto.moneda],
                ["Tipo obra", proyecto.tipoObra],
              ].map(([k, v]) =>
                v ? (
                  <div key={k as string} className="flex">
                    <dt className="w-32 text-gray-500">{k}</dt>
                    <dd className="text-gray-900 font-medium">{v as string}</dd>
                  </div>
                ) : null
              )}
            </dl>
            <Link
              href={`/admin/proyectos/${proyecto.id}`}
              className="inline-block mt-4 text-sm text-blue-600 hover:underline"
            >
              Abrir workspace completo →
            </Link>
          </div>
        )}

        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h2 className="font-semibold text-gray-900 mb-3">Láminas del Proyecto</h2>
          {laminas.length === 0 ? (
            <p className="text-sm text-gray-400">
              Sin láminas.{" "}
              <Link href="/admin/laminas" className="text-blue-600 hover:underline">
                Subir planos
              </Link>
            </p>
          ) : (
            <div className="space-y-1.5">
              {laminas.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-600 w-16">{l.codigo}</span>
                    <span className="text-gray-700 truncate max-w-[180px]">{l.nombre}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      DISCIPLINA_COLORS[l.disciplina] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {l.disciplina.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Todos los proyectos</h2>
        <div className="grid gap-3">
          {proyectos.map((p) => (
            <Link
              key={p.id}
              href={`/admin/proyectos/${p.id}`}
              className="block bg-white border rounded-xl p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold">{p.nombre}</h3>
                  <p className="text-sm text-slate-500">
                    {p.ubicacion ?? `${p.canton}, ${p.provincia}`}
                  </p>
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
            <p className="text-center text-slate-400 py-8">No hay proyectos. Cree uno nuevo.</p>
          )}
        </div>
      </div>
    </div>
  );
}
