import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getActiveProyecto, getTenantContext } from "@/lib/auth";
import { prisma } from "@diego-porras/database";
import { PresupuestoActions } from "@/components/PresupuestoActions";

export default async function PresupuestoPage() {
  const session = await getSession();
  if (!session) redirect("/");
  const tenant = await getTenantContext(session);
  if (tenant && !tenant.modulos.includes("PRESUPUESTO")) redirect("/admin");

  const proyecto = await getActiveProyecto(session);
  if (!proyecto) {
    return <div className="p-6 text-slate-500">Cree un proyecto primero.</div>;
  }

  const presupuestos = await prisma.presupuesto.findMany({
    where: { proyectoId: proyecto.id },
    include: {
      lineas: { orderBy: { capitulo: "asc" } },
      fuentePrecios: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const listas = await prisma.listaCantidades.findMany({
    where: { proyectoId: proyecto.id },
    orderBy: { version: "desc" },
  });

  const fuentes = await prisma.fuentePrecio.findMany({ where: { activo: true } });
  const activo = presupuestos[0] ?? null;

  const porCapitulo = new Map<string, NonNullable<typeof activo>["lineas"]>();
  if (activo) {
    for (const linea of activo.lineas) {
      const arr = porCapitulo.get(linea.capitulo) ?? [];
      arr.push(linea);
      porCapitulo.set(linea.capitulo, arr);
    }
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presupuesto / Cotización</h1>
          <p className="text-gray-500 mt-1">
            {proyecto.nombre}
            {activo ? ` — ${activo.lineas.length} partidas, ${activo.fuentePrecios.nombre}` : ""}
          </p>
        </div>
        <PresupuestoActions
          proyectoId={proyecto.id}
          listaId={listas[0]?.id}
          fuenteId={fuentes[0]?.id}
          presupuestoId={activo?.id}
        />
      </div>

      {!activo ? (
        <div className="bg-white border rounded-xl p-12 text-center text-slate-400">
          <p className="mb-2">No hay cotización generada.</p>
          <p className="text-sm">
            {listas.length === 0
              ? "Primero genere una lista de cantidades en el workspace del proyecto."
              : "Presione Generar cotización para crear el presupuesto."}
          </p>
          <Link
            href={`/admin/proyectos/${proyecto.id}`}
            className="inline-block mt-4 text-blue-600 text-sm hover:underline"
          >
            Ir al workspace →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500">Subtotal</p>
              <p className="text-xl font-bold">₡{activo.subtotal.toLocaleString("es-CR")}</p>
            </div>
            <div className="bg-white border rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500">Impuestos</p>
              <p className="text-xl font-bold">₡{activo.impuestos.toLocaleString("es-CR")}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-2xl font-bold text-blue-700">
                ₡{activo.total.toLocaleString("es-CR")}
              </p>
            </div>
          </div>

          {Array.from(porCapitulo.entries()).map(([cap, lineas]) => {
            const sub = lineas.reduce((s, l) => s + l.subtotal, 0);
            return (
              <div key={cap} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-slate-50 border-b flex justify-between">
                  <span className="font-semibold">Capítulo {cap}</span>
                  <span className="font-medium">₡{sub.toLocaleString("es-CR")}</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="px-4 py-2">Partida</th>
                      <th className="px-4 py-2">Descripción</th>
                      <th className="px-4 py-2">Und</th>
                      <th className="px-4 py-2">Cant</th>
                      <th className="px-4 py-2">P. Unit</th>
                      <th className="px-4 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.map((l) => (
                      <tr key={l.id} className="border-b">
                        <td className="px-4 py-2 font-mono text-blue-600">{l.partidaCodigo}</td>
                        <td className="px-4 py-2">{l.descripcion}</td>
                        <td className="px-4 py-2">{l.unidad}</td>
                        <td className="px-4 py-2 text-slate-500">{l.cantidad}</td>
                        <td className="px-4 py-2">₡{l.precioUnitario.toLocaleString("es-CR")}</td>
                        <td className="px-4 py-2 text-right font-medium">
                          ₡{l.subtotal.toLocaleString("es-CR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
