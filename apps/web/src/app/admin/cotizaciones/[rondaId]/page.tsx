import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession, getTenantContext } from "@/lib/auth";
import { prisma } from "@diego-porras/database";
import { CotizacionRondaActions } from "@/components/CotizacionRondaActions";

export default async function RondaCotizacionPage({
  params,
}: {
  params: Promise<{ rondaId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/");
  const tenant = await getTenantContext(session);
  if (tenant && !tenant.modulos.includes("COTIZACIONES_FERRETERIA")) redirect("/admin");

  const { rondaId } = await params;
  const ronda = await prisma.rondaCotizacion.findUnique({
    where: { id: rondaId },
    include: {
      proyecto: true,
      lineasMaterial: { orderBy: { createdAt: "asc" } },
      ferreterias: true,
      cotizaciones: {
        include: { ferreteria: true },
        orderBy: { createdAt: "desc" },
      },
      facturaMixta: true,
    },
  });

  if (!ronda) notFound();

  return (
    <div className="p-6 max-w-6xl space-y-6">
      <div>
        <Link href="/admin/cotizaciones" className="text-sm text-blue-600 hover:underline">
          ← Cotizaciones
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{ronda.nombre}</h1>
        <p className="text-gray-500 mt-1">
          {ronda.proyecto.nombre} — {ronda.estado} — {ronda.lineasMaterial.length} materiales
        </p>
      </div>

      <CotizacionRondaActions
        proyectoId={ronda.proyectoId}
        rondaId={ronda.id}
        ferreterias={ronda.ferreterias.map((f) => ({ id: f.id, nombre: f.nombre }))}
        materiales={ronda.lineasMaterial.map((m) => ({
          id: m.id,
          descripcion: m.descripcion,
        }))}
        hasFacturaMixta={!!ronda.facturaMixta}
      />

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-50 border-b font-semibold">
          Lista de materiales
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="px-4 py-2">Partida</th>
              <th className="px-4 py-2">Descripción</th>
              <th className="px-4 py-2">Und</th>
              <th className="px-4 py-2">Cantidad</th>
              <th className="px-4 py-2">Categoría</th>
            </tr>
          </thead>
          <tbody>
            {ronda.lineasMaterial.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="px-4 py-2 font-mono text-blue-600">
                  {m.origenPartida ?? "—"}
                </td>
                <td className="px-4 py-2">{m.descripcion}</td>
                <td className="px-4 py-2">{m.unidad}</td>
                <td className="px-4 py-2">{m.cantidad}</td>
                <td className="px-4 py-2 text-slate-500">{m.categoria ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ronda.cotizaciones.length > 0 && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-slate-50 border-b font-semibold">
            Cotizaciones recibidas
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="px-4 py-2">Ferretería</th>
                <th className="px-4 py-2">Archivo</th>
                <th className="px-4 py-2">Formato</th>
                <th className="px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ronda.cotizaciones.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="px-4 py-2">{c.ferreteria.nombre}</td>
                  <td className="px-4 py-2">
                    <a
                      href={c.archivoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {c.archivoNombre}
                    </a>
                  </td>
                  <td className="px-4 py-2 uppercase">{c.formato}</td>
                  <td className="px-4 py-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100">
                      {c.estadoProcesamiento}
                    </span>
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
