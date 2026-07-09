"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NuevaRondaCotizacion({
  proyectoId,
  listas,
}: {
  proyectoId: string;
  listas: Array<{ id: string; version: number; estado: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [listaId, setListaId] = useState(listas[0]?.id ?? "");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function crear() {
    if (!listaId) {
      setError("Seleccione una lista de cantidades");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/proyectos/${proyectoId}/cotizaciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listaCantidadesId: listaId,
        nombre: nombre || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Error al crear ronda");
      return;
    }
    const ronda = await res.json();
    setOpen(false);
    router.push(`/admin/cotizaciones/${ronda.id}`);
    router.refresh();
  }

  if (listas.length === 0) {
    return (
      <button
        disabled
        className="bg-slate-200 text-slate-500 px-4 py-2 rounded-xl text-sm cursor-not-allowed"
      >
        Sin lista de cantidades
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700"
      >
        Nueva ronda
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-lg p-4 z-20 space-y-3">
          <div>
            <label className="text-xs text-slate-500">Nombre</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              placeholder="Cotización materiales"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Lista de cantidades</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              value={listaId}
              onChange={(e) => setListaId(e.target.value)}
            >
              {listas.map((l) => (
                <option key={l.id} value={l.id}>
                  v{l.version} — {l.estado}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-sm text-slate-600"
            >
              Cancelar
            </button>
            <button
              onClick={crear}
              disabled={loading}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
