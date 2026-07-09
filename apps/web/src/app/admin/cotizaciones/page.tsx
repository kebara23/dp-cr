import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getActiveProyecto, getTenantContext } from "@/lib/auth";
import { prisma } from "@diego-porras/database";
import { NuevaRondaCotizacion } from "@/components/NuevaRondaCotizacion";

export default async function CotizacionesPage() {
  const session = await getSession();
  if (!session) redirect("/");
  const tenant = await getTenantContext(session);
  if (tenant && !tenant.modulos.includes("COTIZACIONES_FERRETERIA")) redirect("/admin");

  const proyecto = await getActiveProyecto(session);
  if (!proyecto) {
    return <div className="p-6 text-slate-500">Cree un proyecto primero.</div>;
  }

  const [rondas, listas] = await Promise.all([
    prisma.rondaCotizacion.findMany({
      where: { proyectoId: proyecto.id },
      include: {
        _count: { select: { lineasMaterial: true, ferreterias: true, cotizaciones: true } },
        facturaMixta: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.listaCantidades.findMany({
      where: { proyectoId: proyecto.id },
      orderBy: { version: "desc" },
    }),
  ]);

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cotizaciones Ferreterías</h1>
          <p className="text-gray-500 mt-1">
            {proyecto.nombre} — lista de materiales, comparación y factura mixta
          </p>
        </div>
        <NuevaRondaCotizacion
          proyectoId={proyecto.id}
          listas={listas.map((l) => ({
            id: l.id,
            version: l.version,
            estado: l.estado,
          }))}
        />
      </div>

      {rondas.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center text-slate-400">
          <p className="mb-2">No hay rondas de cotización.</p>
          <p className="text-sm">
            {listas.length === 0
              ? "Primero genere una lista de cantidades en el workspace del proyecto."
              : "Cree una ronda a partir de una lista de cantidades para exportar materiales a ferreterías."}
          </p>
          <Link
            href={`/admin/proyectos/${proyecto.id}`}
            className="inline-block mt-4 text-blue-600 text-sm hover:underline"
          >
            Ir al workspace →
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500 bg-slate-50">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Materiales</th>
                <th className="px-4 py-3">Ferreterías</th>
                <th className="px-4 py-3">Cotizaciones</th>
                <th className="px-4 py-3">Factura mixta</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rondas.map((r) => (
                <tr key={r.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{r.nombre}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                      {r.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">{r._count.lineasMaterial}</td>
                  <td className="px-4 py-3">{r._count.ferreterias}</td>
                  <td className="px-4 py-3">{r._count.cotizaciones}</td>
                  <td className="px-4 py-3">
                    {r.facturaMixta ? (
                      <span className="text-green-700 text-xs font-medium">
                        Ahorro ₡{r.facturaMixta.ahorroEstimado.toLocaleString("es-CR")}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/cotizaciones/${r.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Abrir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
