import { redirect } from "next/navigation";
import { getSession, getTenantContext, getActiveProyecto } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role === "SUPER_ADMIN") redirect("/super-admin");
  if (session.role === "CLIENTE") redirect("/cliente");
  if (session.role !== "ADMIN") redirect("/");

  const tenant = await getTenantContext(session);
  const proyecto = await getActiveProyecto(session);

  return (
    <AdminShell
      tenantName={tenant?.nombre ?? "DP-CR"}
      proyectoNombre={proyecto?.nombre}
      proyectoUbicacion={proyecto?.ubicacion ?? undefined}
      modulos={tenant?.modulos ?? []}
      userName={session.name}
    >
      {children}
    </AdminShell>
  );
}
