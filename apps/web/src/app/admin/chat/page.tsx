import { redirect } from "next/navigation";
import { getSession, getActiveProyecto, getTenantContext } from "@/lib/auth";
import { AgentChat } from "@/components/AgentChat";

export default async function ChatPage() {
  const session = await getSession();
  if (!session) redirect("/");
  const tenant = await getTenantContext(session);
  if (tenant && !tenant.modulos.includes("AGENTE_IA")) redirect("/admin");

  const proyecto = await getActiveProyecto(session);
  if (!proyecto) {
    return <div className="p-6 text-slate-500">Cree un proyecto primero.</div>;
  }

  return (
    <div className="h-[calc(100vh-0px)] flex flex-col">
      <div className="p-4 border-b bg-white">
        <h1 className="text-lg font-bold text-gray-900">Agente IA — Chat Live</h1>
        <p className="text-xs text-gray-500">
          Proyecto: {proyecto.nombre} | Tools CTK | Nunca responde sin citar fuente
        </p>
      </div>
      <div className="flex-1 min-h-0 p-4">
        <div className="h-full max-w-4xl mx-auto">
          <AgentChat proyectoId={proyecto.id} variant="full" />
        </div>
      </div>
    </div>
  );
}
