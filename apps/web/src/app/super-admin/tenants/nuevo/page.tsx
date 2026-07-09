"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const MODULOS = [
  "LAMINAS",
  "CTK",
  "MOTOR_METRADO",
  "PRESUPUESTO",
  "AGENTE_IA",
  "PORTAL_CLIENTE",
  "AUDITORIA",
  "MANAGEMENT",
] as const;

export default function NuevoTenantPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [modulos, setModulos] = useState<string[]>(["LAMINAS", "CTK", "PRESUPUESTO", "PORTAL_CLIENTE"]);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminPassword, setAdminPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggle(m: string) {
    setModulos((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/super-admin/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        slug: slug || nombre.toLowerCase().replace(/\s+/g, "-"),
        modulos,
        adminEmail,
        adminName,
        adminPassword,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al crear tenant");
      setLoading(false);
      return;
    }
    router.push(`/super-admin/tenants/${data.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Nuevo tenant / cliente</h1>
      <form onSubmit={submit} className="bg-white border rounded-xl p-6 space-y-4 shadow-sm">
        <label className="block text-sm">
          Nombre del cliente
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
            }}
            required
          />
        </label>
        <label className="block text-sm">
          Slug
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </label>

        <div>
          <p className="text-sm font-medium mb-2">Módulos aprobados</p>
          <div className="grid grid-cols-2 gap-2">
            {MODULOS.map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2">
                <input type="checkbox" checked={modulos.includes(m)} onChange={() => toggle(m)} />
                {m}
              </label>
            ))}
          </div>
        </div>

        <hr />
        <p className="text-sm font-medium">Admin inicial del tenant</p>
        <label className="block text-sm">
          Nombre
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Email
          <input
            type="email"
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Contraseña
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear tenant"}
        </button>
      </form>
    </div>
  );
}
