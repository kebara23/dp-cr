"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/laminas", label: "Láminas", icon: "📐" },
  { href: "/admin/ctk", label: "CTK", icon: "📚" },
  { href: "/admin/motor", label: "Motor Metrado", icon: "🔧" },
  { href: "/admin/presupuesto", label: "Presupuesto", icon: "💰" },
  { href: "/admin/chat", label: "Agente IA", icon: "🤖" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-700">
          <Link href="/" className="text-xl font-bold">DP-CR</Link>
          <p className="text-xs text-gray-400 mt-1">Admin Console</p>
        </div>
        <nav className="flex-1 p-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
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
        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-500">Proyecto activo</div>
          <div className="text-sm font-medium mt-1">Casa Terraba</div>
          <div className="text-xs text-gray-400">Puerto Cortés, Osa</div>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 overflow-auto">
        {children}
      </main>
    </div>
  );
}
