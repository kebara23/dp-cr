"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { upload } from "@vercel/blob/client";

function safeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function CotizacionRondaActions({
  proyectoId,
  rondaId,
  ferreterias,
  materiales,
  hasFacturaMixta,
}: {
  proyectoId: string;
  rondaId: string;
  ferreterias: Array<{ id: string; nombre: string }>;
  materiales: Array<{ id: string; descripcion: string }>;
  hasFacturaMixta: boolean;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [ferreteriaId, setFerreteriaId] = useState(ferreterias[0]?.id ?? "");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [facturaBusy, setFacturaBusy] = useState(false);

  async function crearFerreteria() {
    if (!nombre.trim()) return;
    setBusy(true);
    setMsg("");
    const res = await fetch(
      `/api/proyectos/${proyectoId}/cotizaciones/${rondaId}/ferreterias`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
      }
    );
    setBusy(false);
    if (!res.ok) {
      setMsg("Error al crear ferretería");
      return;
    }
    const f = await res.json();
    setNombre("");
    setFerreteriaId(f.id);
    setMsg(`Ferretería ${f.nombre} creada`);
    router.refresh();
  }

  async function onFile(file: File | null) {
    if (!file || !ferreteriaId) {
      setMsg("Seleccione ferretería y archivo");
      return;
    }
    setBusy(true);
    setMsg("Subiendo...");
    try {
      const pathname = `cotizaciones/${proyectoId}/${rondaId}/${Date.now()}-${safeFilename(file.name)}`;
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
        multipart: file.size > 4 * 1024 * 1024,
        contentType: file.type || undefined,
      });

      const res = await fetch(
        `/api/proyectos/${proyectoId}/cotizaciones/${rondaId}/ferreterias/${ferreteriaId}/cotizacion`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            archivoUrl: blob.url,
            archivoNombre: file.name,
            contentType: file.type,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al registrar");
      }
      setMsg("Cotización registrada. Procesando...");
      setTimeout(() => router.refresh(), 1500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error de subida");
    } finally {
      setBusy(false);
    }
  }

  async function generarFacturaMixta() {
    setFacturaBusy(true);
    setMsg("");
    const res = await fetch(
      `/api/proyectos/${proyectoId}/cotizaciones/${rondaId}/factura-mixta`,
      { method: "POST" }
    );
    setFacturaBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error ?? "Error al generar factura mixta");
      return;
    }
    setMsg("Factura mixta generada");
    router.push(`/admin/cotizaciones/${rondaId}/factura-mixta`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <a
          href={`/api/proyectos/${proyectoId}/cotizaciones/${rondaId}/export?formato=xlsx`}
          className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-sm"
        >
          Descargar Excel
        </a>
        <a
          href={`/api/proyectos/${proyectoId}/cotizaciones/${rondaId}/export?formato=pdf`}
          className="bg-slate-700 text-white px-3 py-2 rounded-xl text-sm"
        >
          Descargar PDF
        </a>
        <a
          href={`/admin/cotizaciones/${rondaId}/comparar`}
          className="border border-blue-300 text-blue-700 px-3 py-2 rounded-xl text-sm"
        >
          Comparar
        </a>
        <button
          onClick={generarFacturaMixta}
          disabled={facturaBusy || materiales.length === 0}
          className="bg-amber-600 text-white px-3 py-2 rounded-xl text-sm disabled:opacity-50"
        >
          {facturaBusy
            ? "Generando..."
            : hasFacturaMixta
              ? "Regenerar factura mixta"
              : "Generar factura mixta"}
        </button>
        {hasFacturaMixta && (
          <a
            href={`/admin/cotizaciones/${rondaId}/factura-mixta`}
            className="border px-3 py-2 rounded-xl text-sm"
          >
            Ver factura mixta
          </a>
        )}
      </div>

      <div className="bg-white border rounded-xl p-4 grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium mb-2">Agregar ferretería</p>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              placeholder="Nombre ferretería"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <button
              onClick={crearFerreteria}
              disabled={busy}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              Agregar
            </button>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Subir cotización (PDF / PNG / Excel)</p>
          <div className="flex gap-2 items-center">
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={ferreteriaId}
              onChange={(e) => setFerreteriaId(e.target.value)}
            >
              {ferreterias.length === 0 && <option value="">Sin ferreterías</option>}
              {ferreterias.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls"
              disabled={busy || !ferreteriaId}
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </div>
        </div>
      </div>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </div>
  );
}
