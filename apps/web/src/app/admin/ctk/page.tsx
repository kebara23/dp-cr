import { redirect } from "next/navigation";
import { getSession, getActiveProyecto, getTenantContext } from "@/lib/auth";
import { prisma } from "@diego-porras/database";
import { DISCIPLINA_COLORS } from "@/lib/modules";

export default async function CtkPage() {
  const session = await getSession();
  if (!session) redirect("/");
  const tenant = await getTenantContext(session);
  if (tenant && !tenant.modulos.includes("CTK")) redirect("/admin");

  const proyecto = await getActiveProyecto(session);
  if (!proyecto) {
    return <div className="p-6 text-slate-500">Cree un proyecto primero.</div>;
  }

  const docs = await prisma.documentoConocimiento.findMany({
    where: { proyectoId: proyecto.id },
    include: { _count: { select: { reglasTecnicas: true, filasTabla: true } } },
  });

  const reglas = await prisma.reglaTecnica.findMany({
    where: { documento: { proyectoId: proyecto.id } },
    orderBy: { codigo: "asc" },
    take: 50,
  });

  const conflictos = await prisma.conflictoConocimiento.findMany({
    where: { proyectoId: proyecto.id },
    include: { reglaA: true, reglaB: true },
  });

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900">Conocimiento Técnico (CTK)</h1>
      <p className="text-gray-500 mt-1">
        Pack CR-RESIDENCIAL-V1 — {reglas.length} reglas, {docs.reduce((s, d) => s + d._count.filasTabla, 0)} filas de tabla
      </p>

      <div className="grid lg:grid-cols-3 gap-4 mt-6 mb-8">
        {docs.map((d) => (
          <div key={d.id} className="bg-white border rounded-xl p-4 shadow-sm">
            <p className="font-medium text-sm">{d.titulo}</p>
            <p className="text-xs text-gray-500 mt-1">
              {d._count.reglasTecnicas} reglas, {d._count.filasTabla} filas — {d.estado}
            </p>
          </div>
        ))}
      </div>

      <h2 className="font-semibold mb-3">Reglas Técnicas</h2>
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm mb-8">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Texto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Disciplina</th>
            </tr>
          </thead>
          <tbody>
            {reglas.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3 font-mono text-blue-600 font-medium">{r.codigo}</td>
                <td className="px-4 py-3 text-gray-700 max-w-md">{r.textoOriginal}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {r.categoria.toLowerCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      DISCIPLINA_COLORS[r.disciplina] ?? "bg-slate-100"
                    }`}
                  >
                    {r.disciplina.toLowerCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {conflictos.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3 text-amber-700">Conflictos CTK</h2>
          <div className="space-y-2">
            {conflictos.map((c) => (
              <div
                key={c.id}
                className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm"
              >
                <p className="font-medium">
                  {c.reglaA.codigo} vs {c.reglaB.codigo}
                </p>
                <p className="text-slate-600 mt-1">{c.descripcion}</p>
                <span className="text-xs text-amber-700 mt-2 inline-block">{c.estado}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
