import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession, getTenantContext } from "@/lib/auth";
import { prisma } from "@diego-porras/database";
import { TablaComparativa } from "@/components/TablaComparativa";

export default async function CompararCotizacionesPage({
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
      ferreterias: {
        include: {
          cotizaciones: {
            include: { lineas: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!ronda) notFound();

  type Celda = {
    lineaCotizacionId: string;
    precioUnitario: number;
    matchConfianza: number | null;
    matchManual: boolean;
  } | null;

  const celdas: Record<string, Record<string, Celda>> = {};
  for (const m of ronda.lineasMaterial) {
    celdas[m.id] = {};
  }

  for (const f of ronda.ferreterias) {
    // Usar la cotización más reciente analizada (o la más reciente)
    const cot =
      f.cotizaciones.find((c) => c.estadoProcesamiento === "ANALIZADO") ??
      f.cotizaciones[0];
    if (!cot) continue;
    for (const linea of cot.lineas) {
      if (!linea.lineaMaterialId) continue;
      if (!celdas[linea.lineaMaterialId]) celdas[linea.lineaMaterialId] = {};
      const prev = celdas[linea.lineaMaterialId][f.id];
      if (!prev || linea.precioUnitario < prev.precioUnitario) {
        celdas[linea.lineaMaterialId][f.id] = {
          lineaCotizacionId: linea.id,
          precioUnitario: linea.precioUnitario,
          matchConfianza: linea.matchConfianza,
          matchManual: linea.matchManual,
        };
      }
    }
  }

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div>
        <Link
          href={`/admin/cotizaciones/${rondaId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Volver a ronda
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Comparación de cotizaciones
        </h1>
        <p className="text-gray-500 mt-1">
          {ronda.nombre} — {ronda.proyecto.nombre}
        </p>
      </div>

      {ronda.ferreterias.length === 0 ? (
        <div className="bg-white border rounded-xl p-10 text-center text-slate-400">
          Agregue ferreterías y suba cotizaciones para comparar.
        </div>
      ) : (
        <TablaComparativa
          proyectoId={ronda.proyectoId}
          rondaId={ronda.id}
          materiales={ronda.lineasMaterial.map((m) => ({
            id: m.id,
            descripcion: m.descripcion,
            unidad: m.unidad,
            cantidad: m.cantidad,
          }))}
          ferreterias={ronda.ferreterias.map((f) => ({
            id: f.id,
            nombre: f.nombre,
          }))}
          celdas={celdas}
        />
      )}
    </div>
  );
}
