import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@diego-porras/database";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "SUPER_ADMIN") redirect("/admin");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
        <div>
          <Link href="/super-admin" className="text-xl font-bold">
            DP-CR Super Admin
          </Link>
          <p className="text-xs text-gray-400 mt-0.5">Gestión multi-tenant · {session.name}</p>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/super-admin/tenants/nuevo" className="text-sm text-blue-300 hover:text-white">
            + Nuevo tenant
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-sm text-gray-400 hover:text-white">
              Salir
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  );
}
