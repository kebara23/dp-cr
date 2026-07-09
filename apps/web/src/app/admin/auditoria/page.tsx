import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@diego-porras/database";

export default async function AuditoriaPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/");

  const eventos = await prisma.auditoriaEvento.findMany({
    include: { user: { select: { name: true } }, proyecto: { select: { nombre: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <Link href="/admin/management" className="text-sm text-primary">← Management</Link>
      <h1 className="text-xl font-bold mt-4 mb-6">Auditoría</h1>
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-slate-500">
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Usuario</th>
              <th className="px-4 py-2">Acción</th>
              <th className="px-4 py-2">Entidad</th>
              <th className="px-4 py-2">Proyecto</th>
            </tr>
          </thead>
          <tbody>
            {eventos.map((e) => (
              <tr key={e.id} className="border-b">
                <td className="px-4 py-2">{new Date(e.createdAt).toLocaleString("es-CR")}</td>
                <td className="px-4 py-2">{e.user?.name ?? "—"}</td>
                <td className="px-4 py-2 font-mono text-xs">{e.accion}</td>
                <td className="px-4 py-2">{e.entidad}</td>
                <td className="px-4 py-2">{e.proyecto?.nombre ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
