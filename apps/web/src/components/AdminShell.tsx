"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ALL_NAV_ITEMS } from "@/lib/modules";

interface Props {
  children: React.ReactNode;
  tenantName?: string;
  proyectoNombre?: string;
  proyectoUbicacion?: string;
  modulos: string[];
  userName?: string;
}

export function AdminShell({
  children,
  tenantName = "DP-CR",
  proyectoNombre,
  proyectoUbicacion,
  modulos,
  userName,
}: Props) {
  const pathname = usePathname();
  const navItems = ALL_NAV_ITEMS.filter(
    (item) => item.modulo === null || modulos.includes(item.modulo)
  );

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-700">
          <Link href="/admin" className="text-xl font-bold">
            {tenantName}
          </Link>
          <p className="text-xs text-gray-400 mt-1">Admin Console</p>
          {userName && <p className="text-xs text-gray-500 mt-0.5">{userName}</p>}
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white font-medium"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-700 space-y-3">
          {proyectoNombre ? (
            <div>
              <div className="text-xs text-gray-500">Proyecto activo</div>
              <div className="text-sm font-medium mt-1">{proyectoNombre}</div>
              {proyectoUbicacion && (
                <div className="text-xs text-gray-400">{proyectoUbicacion}</div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-500">Sin proyecto activo</div>
          )}
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-xs text-gray-400 hover:text-white">
              Salir
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 overflow-auto">{children}</main>
    </div>
  );
}
