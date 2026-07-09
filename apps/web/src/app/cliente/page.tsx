"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ClientPortalLive } from "@/components/ClientPortalLive";

interface PublicacionData {
  publicacion: {
    mensajeAdmin: string | null;
    nivelDetalle: string;
    createdAt: string;
    proyecto: { nombre: string; ubicacion: string | null; moneda: string };
    presupuesto: {
      total: number;
      subtotal: number;
      impuestos: number;
      lineas: Array<{
        capitulo: string;
        descripcion: string;
        cantidad: number;
        unidad: string;
        precioUnitario?: number;
        subtotal: number;
      }>;
      fuentePrecios: { nombre: string };
    } | null;
  } | null;
  timeline: Array<{
    id: string;
    mensajeAdmin: string | null;
    createdAt: string;
    activa: boolean;
    publicador: { name: string };
  }>;
}

export default function ClientePortalPage() {
  const [data, setData] = useState<PublicacionData | null>(null);
  const [proyectoId, setProyectoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async (id: string) => {
    const res = await fetch(`/api/proyectos/${id}/publicacion`);
    if (res.ok) {
      const json = await res.json();
      setData(json);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch("/api/proyectos")
      .then((r) => r.json())
      .then((proyectos) => {
        if (proyectos[0]?.id) {
          setProyectoId(proyectos[0].id);
          cargar(proyectos[0].id);
        } else {
          setLoading(false);
        }
      });
  }, [cargar]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Cargando portal...</div>;
  }

  const pub = data?.publicacion;
  const nivel = pub?.nivelDetalle ?? "RESUMEN";
  const lineas = pub?.presupuesto?.lineas ?? [];
  const porCapitulo = new Map<string, typeof lineas>();
  for (const l of lineas) {
    const arr = porCapitulo.get(l.capitulo) ?? [];
    arr.push(l);
    porCapitulo.set(l.capitulo, arr);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Portal Cliente</h1>
          <p className="text-sm text-slate-500">Vista de solo lectura — tiempo real</p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="text-sm text-slate-500 hover:underline">
            Salir
          </button>
        </form>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {proyectoId && (
          <ClientPortalLive proyectoId={proyectoId} onUpdate={() => cargar(proyectoId)} />
        )}

        {!pub ? (
          <div className="bg-white border rounded-xl p-12 text-center text-slate-400">
            <p>El ingeniero aún no ha publicado información de su proyecto.</p>
          </div>
        ) : (
          <>
            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{pub.proyecto.nombre}</h2>
                  <p className="text-slate-500">{pub.proyecto.ubicacion}</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Publicado · {nivel}
                </span>
              </div>
              {pub.mensajeAdmin && (
                <p className="mt-4 bg-blue-50 text-blue-800 p-3 rounded-lg text-sm">
                  {pub.mensajeAdmin}
                </p>
              )}
            </div>

            {pub.presupuesto && (
              <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Resumen de cotización</h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500">Subtotal</p>
                    <p className="text-lg font-bold">
                      ₡{pub.presupuesto.subtotal.toLocaleString("es-CR")}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500">Impuestos</p>
                    <p className="text-lg font-bold">
                      ₡{pub.presupuesto.impuestos.toLocaleString("es-CR")}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-2xl font-bold text-blue-700">
                      ₡{pub.presupuesto.total.toLocaleString("es-CR")}
                    </p>
                  </div>
                </div>

                {(nivel === "INTERMEDIO" || nivel === "DETALLADO") && (
                  <div className="space-y-4">
                    {Array.from(porCapitulo.entries()).map(([cap, items]) => {
                      const sub = items.reduce((s, l) => s + l.subtotal, 0);
                      return (
                        <div key={cap} className="border rounded-xl overflow-hidden">
                          <div className="px-4 py-2 bg-slate-50 flex justify-between text-sm font-medium">
                            <span>Capítulo {cap}</span>
                            <span>₡{sub.toLocaleString("es-CR")}</span>
                          </div>
                          {nivel === "DETALLADO" && (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b text-left text-slate-500">
                                  <th className="px-4 py-2">Descripción</th>
                                  <th className="px-4 py-2">Cant.</th>
                                  <th className="px-4 py-2 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((l, i) => (
                                  <tr key={i} className="border-b">
                                    <td className="px-4 py-2">{l.descripcion}</td>
                                    <td className="px-4 py-2">
                                      {l.cantidad} {l.unidad}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                      ₡{l.subtotal.toLocaleString("es-CR")}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {nivel === "RESUMEN" && (
                  <p className="text-xs text-slate-400">
                    Vista resumen: totales publicados. El detalle interno no está visible.
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-4">
                  Fuente precios: {pub.presupuesto.fuentePrecios.nombre}
                </p>
              </div>
            )}

            {data?.timeline && data.timeline.length > 0 && (
              <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Historial de actualizaciones</h3>
                <div className="space-y-3">
                  {data.timeline.map((t) => (
                    <div key={t.id} className="flex gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0" />
                      <div>
                        <p className="text-slate-600">
                          {t.mensajeAdmin ?? "Actualización publicada"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(t.createdAt).toLocaleString("es-CR")} — {t.publicador.name}
                          {t.activa && " (activa)"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
