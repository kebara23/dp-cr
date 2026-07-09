"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NuevoProyectoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/proyectos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: form.get("nombre"),
        ubicacion: form.get("ubicacion"),
        provincia: form.get("provincia"),
        canton: form.get("canton"),
        distrito: form.get("distrito"),
        propietario: form.get("propietario"),
        cedulaProp: form.get("cedulaProp"),
        planoCatastral: form.get("planoCatastral"),
        tipoObra: "RESIDENCIAL",
        moneda: "CRC",
      }),
    });
    const data = await res.json();
    if (res.ok) router.push(`/admin/proyectos/${data.id}`);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <Link href="/admin" className="text-sm text-primary">← Volver</Link>
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto mt-6 bg-white border rounded-xl p-6 space-y-4">
        <h1 className="text-xl font-bold">Nuevo proyecto</h1>
        {[
          ["nombre", "Nombre del proyecto", "Casa Residencial"],
          ["propietario", "Propietario", ""],
          ["cedulaProp", "Cédula propietario", ""],
          ["planoCatastral", "Plano catastral", ""],
          ["provincia", "Provincia", "Puntarenas"],
          ["canton", "Cantón", "Osa"],
          ["distrito", "Distrito", "Puerto Cortés"],
          ["ubicacion", "Ubicación", ""],
        ].map(([name, label, placeholder]) => (
          <div key={name}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <input
              name={name}
              placeholder={placeholder}
              className="w-full border rounded-lg px-3 py-2"
              required={name === "nombre"}
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear proyecto"}
        </button>
      </form>
    </div>
  );
}
