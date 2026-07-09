"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PresupuestoActions({
  proyectoId,
  listaId,
  fuenteId,
  presupuestoId,
}: {
  proyectoId: string;
  listaId?: string;
  fuenteId?: string;
  presupuestoId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function generar() {
    if (!listaId || !fuenteId) {
      setMsg("Necesita lista de cantidades y fuente de precios");
      return;
    }
    setLoading(true);
    await fetch(`/api/proyectos/${proyectoId}/presupuesto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listaCantidadesId: listaId,
        fuentePreciosId: fuenteId,
        tipo: "COTIZACION_CLIENTE",
        margen: 15,
        impuestos: 13,
      }),
    });
    setLoading(false);
    router.refresh();
  }

  async function publicar() {
    if (!presupuestoId) return;
    if (!confirm("¿Publicar cotización actual al portal del cliente?")) return;
    setLoading(true);
    await fetch(`/api/proyectos/${proyectoId}/publicacion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        presupuestoId,
        nivelDetalle: "RESUMEN",
        mensajeAdmin: "Cotización actualizada disponible para su revisión.",
        elementosVisibles: {
          resumen: true,
          capitulos: true,
          cantidades: false,
          planos: false,
          cotizacion: true,
        },
      }),
    });
    setMsg("Publicado al cliente");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          onClick={generar}
          disabled={loading || !listaId}
          className="border bg-white px-4 py-2 rounded-xl text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          Generar cotización
        </button>
        <button
          onClick={publicar}
          disabled={loading || !presupuestoId}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          Publicar al cliente
        </button>
      </div>
      {msg && <p className="text-xs text-green-700">{msg}</p>}
    </div>
  );
}
