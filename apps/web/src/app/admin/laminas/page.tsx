import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getActiveProyecto, getTenantContext } from "@/lib/auth";
import { prisma } from "@diego-porras/database";
import { DISCIPLINA_COLORS, DISCIPLINA_BORDER } from "@/lib/modules";
import { LaminasUpload } from "@/components/LaminasUpload";

export default async function LaminasPage() {
  const session = await getSession();
  if (!session) redirect("/");
  const tenant = await getTenantContext(session);
  if (tenant && !tenant.modulos.includes("LAMINAS")) redirect("/admin");

  const proyecto = await getActiveProyecto(session);
  if (!proyecto) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Cree un proyecto primero.</p>
        <Link href="/admin/proyectos/nuevo" className="text-blue-600 text-sm">
          + Nuevo proyecto
        </Link>
      </div>
    );
  }

  const laminas = await prisma.lamina.findMany({
    where: { proyectoId: proyecto.id },
    orderBy: { codigo: "asc" },
  });

  const disciplinas = Array.from(new Set(laminas.map((l) => l.disciplina)));

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Láminas del Proyecto</h1>
          <p className="text-gray-500 mt-1">
            {proyecto.nombre} — {laminas.length} láminas, {disciplinas.length} disciplinas
          </p>
        </div>
        <LaminasUpload
          proyectoId={proyecto.id}
          nextCodigo={`A-${String(laminas.length + 1).padStart(2, "0")}`}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-xs px-3 py-1.5 rounded-full bg-gray-900 text-white">
          Todas ({laminas.length})
        </span>
        {disciplinas.map((d) => (
          <span
            key={d}
            className={`text-xs px-3 py-1.5 rounded-full ${DISCIPLINA_COLORS[d] ?? "bg-slate-100"}`}
          >
            {d.toLowerCase()} ({laminas.filter((l) => l.disciplina === d).length})
          </span>
        ))}
      </div>

      <div className="space-y-3">
        {laminas.map((l) => (
          <div
            key={l.id}
            className={`bg-white border rounded-xl p-4 border-l-4 shadow-sm ${
              DISCIPLINA_BORDER[l.disciplina] ?? "border-l-slate-300"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-blue-600">{l.codigo}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      DISCIPLINA_COLORS[l.disciplina] ?? "bg-slate-100"
                    }`}
                  >
                    {l.disciplina.toLowerCase()}
                  </span>
                  {l.escala && (
                    <span className="text-xs text-gray-400">Escala {l.escala}</span>
                  )}
                </div>
                <p className="font-medium text-gray-900">{l.nombre}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Rev. {l.revision} — {l.estadoProcesamiento}
                </p>
              </div>
              <a
                href={l.archivoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Ver
              </a>
            </div>
          </div>
        ))}
        {laminas.length === 0 && (
          <p className="text-center text-slate-400 py-12">
            Sin láminas. Suba planos PDF del proyecto.
          </p>
        )}
      </div>
    </div>
  );
}
