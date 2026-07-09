import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession, getTenantContext } from "@/lib/auth";
import { prisma } from "@diego-porras/database";

export default async function FacturaMixtaPage({
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
      facturaMixta: {
        include: {
          lineas: {
            include: { lineaMaterial: true, ferreteria: true },
            orderBy: { ferreteriaId: "asc" },
          },
        },
      },
    },
  });

  if (!ronda) notFound();
  const factura = ronda.facturaMixta;
  if (!factura) {
    return (
      <div className="p-6 max-w-4xl">
        <Link
          href={`/admin/cotizaciones/${rondaId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Volver
        </Link>
        <div className="mt-6 bg-white border rounded-xl p-10 text-center text-slate-400">
          Aún no hay factura mixta. Genérela desde la ronda.
        </div>
      </div>
    );
  }

  const porFerreteria = new Map<
    string,
    {
      nombre: string;
      lineas: typeof factura.lineas;
      subtotal: number;
    }
  >();

  for (const l of factura.lineas) {
    const key = l.ferreteriaId;
    const prev = porFerreteria.get(key) ?? {
      nombre: l.ferreteria.nombre,
      lineas: [],
      subtotal: 0,
    };
    prev.lineas.push(l);
    prev.subtotal += l.subtotal;
    porFerreteria.set(key, prev);
  }

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <Link
            href={`/admin/cotizaciones/${rondaId}`}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Volver a ronda
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Factura mixta</h1>
          <p className="text-gray-500 mt-1">
            {ronda.nombre} — compre cada ítem donde está más barato
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/proyectos/${ronda.proyectoId}/cotizaciones/${rondaId}/factura-mixta/export?formato=xlsx`}
            className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-sm"
          >
            Excel
          </a>
          <a
            href={`/api/proyectos/${ronda.proyectoId}/cotizaciones/${rondaId}/factura-mixta/export?formato=pdf`}
            className="bg-slate-700 text-white px-3 py-2 rounded-xl text-sm"
          >
            PDF
          </a>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500">Total optimizado</p>
          <p className="text-xl font-bold text-emerald-700">
            ₡{factura.totalOptimizado.toLocaleString("es-CR")}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500">Mejor ferretería única</p>
          <p className="text-xl font-bold">
            ₡{factura.totalMejorGlobal.toLocaleString("es-CR")}
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500">Ahorro estimado</p>
          <p className="text-2xl font-bold text-amber-700">
            ₡{factura.ahorroEstimado.toLocaleString("es-CR")}
          </p>
        </div>
      </div>

      {Array.from(porFerreteria.entries()).map(([id, grupo]) => (
        <div key={id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-slate-50 border-b flex justify-between">
            <span className="font-semibold">{grupo.nombre}</span>
            <span className="font-medium">
              ₡{Math.round(grupo.subtotal).toLocaleString("es-CR")}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="px-4 py-2">Material</th>
                <th className="px-4 py-2">Und</th>
                <th className="px-4 py-2">Cant</th>
                <th className="px-4 py-2">P. Unit</th>
                <th className="px-4 py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {grupo.lineas.map((l) => (
                <tr key={l.id} className="border-b">
                  <td className="px-4 py-2">{l.lineaMaterial.descripcion}</td>
                  <td className="px-4 py-2">{l.lineaMaterial.unidad}</td>
                  <td className="px-4 py-2">{l.cantidad}</td>
                  <td className="px-4 py-2">
                    ₡{l.precioUnitario.toLocaleString("es-CR")}
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    ₡{l.subtotal.toLocaleString("es-CR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
