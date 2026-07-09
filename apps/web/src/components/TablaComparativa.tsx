"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Celda = {
  lineaCotizacionId: string;
  precioUnitario: number;
  matchConfianza: number | null;
  matchManual: boolean;
} | null;

export function TablaComparativa({
  proyectoId,
  rondaId,
  materiales,
  ferreterias,
  celdas,
}: {
  proyectoId: string;
  rondaId: string;
  materiales: Array<{ id: string; descripcion: string; unidad: string; cantidad: number }>;
  ferreterias: Array<{ id: string; nombre: string }>;
  celdas: Record<string, Record<string, Celda>>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<{
    lineaCotizacionId: string;
    materialId: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  async function asignarMatch(lineaCotizacionId: string, lineaMaterialId: string | null) {
    setSaving(true);
    await fetch(
      `/api/proyectos/${proyectoId}/cotizaciones/${rondaId}/lineas/${lineaCotizacionId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineaMaterialId }),
      }
    );
    setSaving(false);
    setEditing(null);
    router.refresh();
  }

  const totales = ferreterias.map((f) => {
    let total = 0;
    let completo = true;
    for (const m of materiales) {
      const celda = celdas[m.id]?.[f.id];
      if (!celda) {
        completo = false;
        continue;
      }
      total += m.cantidad * celda.precioUnitario;
    }
    return { ferreteriaId: f.id, total, completo };
  });

  return (
    <div className="overflow-x-auto bg-white border rounded-xl shadow-sm">
      <table className="w-full text-sm min-w-[800px]">
        <thead>
          <tr className="border-b bg-slate-50 text-left text-slate-500">
            <th className="px-3 py-2 sticky left-0 bg-slate-50">Material</th>
            <th className="px-3 py-2">Cant</th>
            {ferreterias.map((f) => (
              <th key={f.id} className="px-3 py-2">
                {f.nombre}
              </th>
            ))}
            <th className="px-3 py-2">Mejor</th>
          </tr>
        </thead>
        <tbody>
          {materiales.map((m) => {
            const precios = ferreterias
              .map((f) => celdas[m.id]?.[f.id]?.precioUnitario)
              .filter((p): p is number => typeof p === "number");
            const min = precios.length ? Math.min(...precios) : null;

            return (
              <tr key={m.id} className="border-b align-top">
                <td className="px-3 py-2 sticky left-0 bg-white">
                  <div className="font-medium">{m.descripcion}</div>
                  <div className="text-xs text-slate-400">{m.unidad}</div>
                </td>
                <td className="px-3 py-2">{m.cantidad}</td>
                {ferreterias.map((f) => {
                  const celda = celdas[m.id]?.[f.id] ?? null;
                  const isBest =
                    celda && min != null && celda.precioUnitario === min;
                  return (
                    <td
                      key={f.id}
                      className={`px-3 py-2 ${isBest ? "bg-emerald-50 font-semibold text-emerald-800" : ""}`}
                    >
                      {celda ? (
                        <div>
                          <div>₡{celda.precioUnitario.toLocaleString("es-CR")}</div>
                          <div className="text-[10px] text-slate-400">
                            conf. {Math.round((celda.matchConfianza ?? 0) * 100)}%
                            {celda.matchManual ? " · manual" : ""}
                          </div>
                          <button
                            className="text-[10px] text-blue-600 underline"
                            onClick={() =>
                              setEditing({
                                lineaCotizacionId: celda.lineaCotizacionId,
                                materialId: m.id,
                              })
                            }
                          >
                            Corregir match
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2 font-medium">
                  {min != null ? `₡${min.toLocaleString("es-CR")}` : "—"}
                </td>
              </tr>
            );
          })}
          <tr className="bg-slate-50 font-semibold">
            <td className="px-3 py-3" colSpan={2}>
              Total (si compra todo ahí)
            </td>
            {totales.map((t) => (
              <td key={t.ferreteriaId} className="px-3 py-3">
                {t.completo
                  ? `₡${Math.round(t.total).toLocaleString("es-CR")}`
                  : "Incompleto"}
              </td>
            ))}
            <td className="px-3 py-3">—</td>
          </tr>
        </tbody>
      </table>

      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-md space-y-3">
            <h3 className="font-semibold">Corregir match de material</h3>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              defaultValue={editing.materialId}
              id="match-select"
            >
              <option value="">Sin match</option>
              {materiales.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.descripcion}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1.5 text-sm"
                onClick={() => setEditing(null)}
              >
                Cancelar
              </button>
              <button
                disabled={saving}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50"
                onClick={() => {
                  const sel = document.getElementById(
                    "match-select"
                  ) as HTMLSelectElement;
                  asignarMatch(editing.lineaCotizacionId, sel.value || null);
                }}
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
