export const ALL_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊", modulo: null as string | null },
  { href: "/admin/laminas", label: "Láminas", icon: "📐", modulo: "LAMINAS" },
  { href: "/admin/ctk", label: "CTK", icon: "📚", modulo: "CTK" },
  { href: "/admin/motor", label: "Motor Metrado", icon: "🔧", modulo: "MOTOR_METRADO" },
  { href: "/admin/presupuesto", label: "Presupuesto", icon: "💰", modulo: "PRESUPUESTO" },
  { href: "/admin/cotizaciones", label: "Cotizaciones", icon: "🧾", modulo: "COTIZACIONES_FERRETERIA" },
  { href: "/admin/chat", label: "Agente IA", icon: "🤖", modulo: "AGENTE_IA" },
  { href: "/admin/auditoria", label: "Auditoría", icon: "📋", modulo: "AUDITORIA" },
  { href: "/admin/management", label: "Management", icon: "⚙️", modulo: "MANAGEMENT" },
] as const;

export const DISCIPLINA_COLORS: Record<string, string> = {
  ARQUITECTURA: "bg-green-100 text-green-700",
  ESTRUCTURA: "bg-orange-100 text-orange-700",
  ELECTRICO: "bg-yellow-100 text-yellow-700",
  SANITARIO_MECANICO: "bg-blue-100 text-blue-700",
  GENERAL: "bg-slate-100 text-slate-700",
  arquitectura: "bg-green-100 text-green-700",
  estructura: "bg-orange-100 text-orange-700",
  electrico: "bg-yellow-100 text-yellow-700",
  sanitario_mecanico: "bg-blue-100 text-blue-700",
};

export const DISCIPLINA_BORDER: Record<string, string> = {
  ARQUITECTURA: "border-l-green-500",
  ESTRUCTURA: "border-l-orange-500",
  ELECTRICO: "border-l-yellow-500",
  SANITARIO_MECANICO: "border-l-blue-500",
  GENERAL: "border-l-slate-400",
};
