"use client";

import { useState } from "react";

const LAMINAS = [
  { codigo: "A-01", nombre: "Planta Arquitectónica Nivel 0+00m", disciplina: "arquitectura", escala: "1:50", tipo: "arquitectura", contenido: "Planta distribución: sala-cocina (33.12 m²), habitación 1 (9.60 m²), habitación 2 (9.18 m²), habitación 3 (14.56 m²), baño (5.92 m²), pasillo (5.70 m²), patio. Ejes 1-5 / A-D." },
  { codigo: "A-03", nombre: "Planta de Techos y Fachadas", disciplina: "arquitectura", escala: "1:50", tipo: "arquitectura", contenido: "Cubierta zinc rectangular #26. Fachadas sur/este. Zinc HG rectangular en 2E. Precinta 30cm. Tapichel altura 2.50m. Corona 2.00m." },
  { codigo: "A-09", nombre: "Agenda Ventanas, Puertas y Acabados", disciplina: "arquitectura", escala: "1:50", tipo: "tabla", contenido: "Ventanas V-1 (1.50×1.40m), V-2, V-3. Puertas P-1, P-2. Cuadro acabados: piso, cielo, paredes. Tabla de áreas por espacio." },
  { codigo: "E-1", nombre: "Planta Eléctrica", disciplina: "electrico", escala: "1:50", tipo: "electrico", contenido: "Distribución circuitos, tomas, apagadores, luminarias. Centro de carga T-A: 23,050 W total." },
  { codigo: "E-2", nombre: "Diagrama Unifilar + Notas Eléctricas", disciplina: "electrico", escala: "indicada", tipo: "notas", contenido: "26 notas ARESEP. NE-13 colores, NE-19 altura tomas 1.10m, NE-25 tierra ≤5Ω. Tabla resumen kVA." },
  { codigo: "EST-01", nombre: "Planta Fundaciones", disciplina: "estructura", escala: "1:50", tipo: "estructura", contenido: "Fundaciones: dados 40×40×60, columnas C1/C2/C3. Baldosas prefabricadas 1.0m-1.80m. Bloques presfabricados. Notas generales 17 puntos." },
  { codigo: "EST-02", nombre: "Estructural Paredes / Cortes", disciplina: "estructura", escala: "1:40", tipo: "estructura", contenido: "Secciones A-A, B-B, C-C, D-D. Cerchas C1-C4. Vigas 0.13×0.20m. Prefabricados 0.12×0.14×0.25. Isométrico 3D." },
  { codigo: "S-01", nombre: "Sanitario / Mecánico", disciplina: "sanitario_mecanico", escala: "1:50", tipo: "sanitario_mecanico", contenido: "Red agua potable, aguas negras/jabonosas. Fosa séptica 1100L. Tubería principal Ø100mm. Notas mecánicas CFIA 13 puntos." },
];

const DISCIPLINAS = ["todas", "arquitectura", "estructura", "electrico", "sanitario_mecanico"] as const;

const DISCIPLINA_STYLES: Record<string, { bg: string; badge: string }> = {
  arquitectura: { bg: "border-l-green-500", badge: "bg-green-100 text-green-700" },
  estructura: { bg: "border-l-orange-500", badge: "bg-orange-100 text-orange-700" },
  electrico: { bg: "border-l-yellow-500", badge: "bg-yellow-100 text-yellow-700" },
  sanitario_mecanico: { bg: "border-l-blue-500", badge: "bg-blue-100 text-blue-700" },
};

export default function LaminasPage() {
  const [filtro, setFiltro] = useState<string>("todas");

  const laminasFiltradas = filtro === "todas"
    ? LAMINAS
    : LAMINAS.filter((l) => l.disciplina === filtro);

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Láminas del Proyecto</h1>
          <p className="text-gray-500 mt-1">Casa Terraba — {LAMINAS.length} láminas, 4 disciplinas</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Subir lámina
        </button>
      </div>

      <div className="flex gap-2 mt-6">
        {DISCIPLINAS.map((d) => (
          <button
            key={d}
            onClick={() => setFiltro(d)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              filtro === d ? "bg-gray-900 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {d === "todas" ? "Todas" : d.replace("_", " ")}
            {d !== "todas" && (
              <span className="ml-1 text-gray-400">
                ({LAMINAS.filter((l) => l.disciplina === d).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 mt-6">
        {laminasFiltradas.map((l) => {
          const style = DISCIPLINA_STYLES[l.disciplina] || { bg: "border-l-gray-500", badge: "bg-gray-100 text-gray-600" };
          return (
            <div key={l.codigo} className={`bg-white rounded-xl shadow-sm border border-l-4 ${style.bg} p-5 hover:shadow-md transition-shadow`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-bold text-blue-600">{l.codigo}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${style.badge}`}>
                      {l.disciplina.replace("_", " ")}
                    </span>
                    <span className="text-xs text-gray-400">Escala {l.escala}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mt-1">{l.nombre}</h3>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{l.contenido}</p>
                </div>
                <div className="ml-4 flex flex-col items-end gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500">Rev. A</span>
                  <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-600">cargada</span>
                </div>
              </div>
            </div>
          );
        })}
        {laminasFiltradas.length === 0 && (
          <div className="text-center py-12 text-gray-400">No hay láminas para esta disciplina</div>
        )}
      </div>
    </div>
  );
}
