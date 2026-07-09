"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AgentChat } from "@/components/AgentChat";
import { LaminasUpload } from "@/components/LaminasUpload";
import { estadoBadgeClass } from "@/lib/lamina-status";

type Tab = "planos" | "ctk" | "metrado" | "presupuesto" | "publicar" | "agente";

interface Props {
  proyecto: {
    id: string;
    nombre: string;
    ubicacion: string | null;
    moneda: string;
    laminas: Array<{ id: string; codigo: string; nombre: string; disciplina: string; archivoUrl: string; estadoProcesamiento: string }>;
    documentosConocimiento: Array<{ id: string; titulo: string; estado: string; _count: { reglasTecnicas: number; filasTabla: number } }>;
    conflictos: Array<{ id: string; descripcion: string; estado: string; reglaA: { codigo: string }; reglaB: { codigo: string } }>;
    listasCantidades: Array<{ id: string; version: number; estado: string; lineas: Array<{ id: string; partidaCodigo: string; descripcion: string; unidad: string; cantidad: number; formulaAplicada: string | null }> }>;
    presupuestos: Array<{ id: string; total: number; tipo: string; estado: string; fuentePrecios: { nombre: string } }>;
  };
  reglas: Array<{ id: string; codigo: string; textoOriginal: string; disciplina: string; categoria: string }>;
  fuentes: Array<{ id: string; nombre: string }>;
}

export function ProyectoWorkspace({ proyecto, reglas, fuentes }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("agente");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function generarMetrado() {
    setLoading(true);
    await fetch(`/api/proyectos/${proyecto.id}/metrado`, { method: "POST", body: JSON.stringify({}) });
    setLoading(false);
    router.refresh();
  }

  async function generarPresupuesto() {
    const lista = proyecto.listasCantidades[0];
    const fuente = fuentes[0];
    if (!lista || !fuente) {
      setMensaje("Necesita lista de cantidades y fuente de precios");
      return;
    }
    setLoading(true);
    await fetch(`/api/proyectos/${proyecto.id}/presupuesto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listaCantidadesId: lista.id,
        fuentePreciosId: fuente.id,
        tipo: "COTIZACION_CLIENTE",
        margen: 15,
        impuestos: 13,
      }),
    });
    setLoading(false);
    router.refresh();
  }

  async function publicar() {
    const presupuesto = proyecto.presupuestos[0];
    setLoading(true);
    await fetch(`/api/proyectos/${proyecto.id}/publicacion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        presupuestoId: presupuesto?.id,
        nivelDetalle: "RESUMEN",
        mensajeAdmin: "Cotización actualizada disponible para su revisión.",
        elementosVisibles: { resumen: true, capitulos: true, cantidades: false, planos: false, cotizacion: true },
      }),
    });
    setMensaje("Publicado al cliente");
    setLoading(false);
    router.refresh();
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "agente", label: "Agente IA" },
    { id: "planos", label: "Planos" },
    { id: "ctk", label: "CTK" },
    { id: "metrado", label: "Metrado" },
    { id: "presupuesto", label: "Presupuesto" },
    { id: "publicar", label: "Publicar" },
  ];

  return (
    <div>
      <div className="flex gap-1 border-b mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-slate-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {mensaje && (
        <div className="mb-4 bg-blue-50 text-blue-800 text-sm px-3 py-2 rounded-lg">{mensaje}</div>
      )}

      {tab === "agente" && (
        <div className="h-[600px]">
          <AgentChat proyectoId={proyecto.id} />
        </div>
      )}

      {tab === "planos" && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <LaminasUpload
              proyectoId={proyecto.id}
              nextCodigo={`A-${String(proyecto.laminas.length + 1).padStart(2, "0")}`}
            />
            {loading && <span className="text-sm text-slate-400">Procesando...</span>}
          </div>
          <div className="grid gap-3">
            {proyecto.laminas.map((l) => (
              <div key={l.id} className="bg-white border rounded-lg p-4 flex justify-between">
                <div>
                  <span className="font-mono text-sm font-medium">{l.codigo}</span>
                  <p className="text-sm">{l.nombre}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">{l.disciplina}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estadoBadgeClass(l.estadoProcesamiento)}`}
                    >
                      {l.estadoProcesamiento}
                    </span>
                  </div>
                </div>
                <a href={l.archivoUrl} target="_blank" className="text-sm text-primary hover:underline">
                  Ver
                </a>
              </div>
            ))}
            {proyecto.laminas.length === 0 && (
              <p className="text-slate-400 text-sm">Sin láminas. Suba planos PDF del proyecto.</p>
            )}
          </div>
        </div>
      )}

      {tab === "ctk" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Documentos de conocimiento</h3>
            <div className="space-y-2">
              {proyecto.documentosConocimiento.map((d) => (
                <div key={d.id} className="bg-white border rounded-lg p-3 text-sm">
                  <p className="font-medium">{d.titulo}</p>
                  <p className="text-slate-500">{d._count.reglasTecnicas} reglas, {d._count.filasTabla} filas tabla — {d.estado}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Reglas técnicas ({reglas.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {reglas.slice(0, 20).map((r) => (
                <div key={r.id} className="bg-white border rounded-lg p-3 text-sm">
                  <span className="font-mono text-primary">{r.codigo}</span>
                  <p className="text-slate-600 mt-1 line-clamp-2">{r.textoOriginal}</p>
                </div>
              ))}
            </div>
            {proyecto.conflictos.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2 text-amber-700">Conflictos CTK</h3>
                {proyecto.conflictos.map((c) => (
                  <div key={c.id} className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm mb-2">
                    <p>{c.reglaA.codigo} vs {c.reglaB.codigo}</p>
                    <p className="text-slate-600">{c.descripcion}</p>
                    <span className="text-xs text-amber-700">{c.estado}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "metrado" && (
        <div className="space-y-4">
          <button
            onClick={generarMetrado}
            disabled={loading}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            Generar lista de cantidades
          </button>
          {proyecto.listasCantidades.map((lista) => (
            <div key={lista.id} className="bg-white border rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b flex justify-between">
                <span className="font-medium">Versión {lista.version} — {lista.estado}</span>
                <span className="text-sm text-slate-500">{lista.lineas.length} partidas</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="px-4 py-2">Partida</th>
                    <th className="px-4 py-2">Descripción</th>
                    <th className="px-4 py-2">Cant.</th>
                    <th className="px-4 py-2">Unidad</th>
                    <th className="px-4 py-2">Fórmula</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.lineas.map((l) => (
                    <tr key={l.id} className="border-b">
                      <td className="px-4 py-2 font-mono">{l.partidaCodigo}</td>
                      <td className="px-4 py-2">{l.descripcion}</td>
                      <td className="px-4 py-2">{l.cantidad}</td>
                      <td className="px-4 py-2">{l.unidad}</td>
                      <td className="px-4 py-2 text-xs text-slate-400">{l.formulaAplicada}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {tab === "presupuesto" && (
        <div className="space-y-4">
          <button
            onClick={generarPresupuesto}
            disabled={loading}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            Generar cotización
          </button>
          {proyecto.presupuestos.map((p) => (
            <div key={p.id} className="bg-white border rounded-xl p-5">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{p.tipo.replace("_", " ")}</p>
                  <p className="text-sm text-slate-500">Fuente: {p.fuentePrecios.nombre}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">₡{p.total.toLocaleString("es-CR")}</p>
                  <p className="text-sm text-slate-500">{p.estado}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "publicar" && (
        <div className="bg-white border rounded-xl p-6 max-w-lg">
          <h3 className="font-semibold mb-4">Publicar al cliente</h3>
          <p className="text-sm text-slate-600 mb-4">
            El cliente verá la cotización y resumen en su portal en tiempo real.
          </p>
          <button
            onClick={publicar}
            disabled={loading || proyecto.presupuestos.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            Publicar cotización actual
          </button>
        </div>
      )}
    </div>
  );
}
