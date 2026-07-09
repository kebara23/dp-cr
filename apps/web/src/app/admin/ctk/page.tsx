const REGLAS = [
  { codigo: "NG-01", texto: "Concreto dosificado según tabla de mezclas. Usar agua potable. Sellador 522-000/528-000.", categoria: "mezcla", disciplina: "estructura", partidas: ["EST-CONC-210"] },
  { codigo: "NG-03", texto: "Recubrimiento: zapatas 50 mm, vigas/columnas 30 mm, losas/muros 25 mm.", categoria: "recubrimiento", disciplina: "estructura", partidas: ["EST-CONC-210", "EST-ACERO"] },
  { codigo: "NG-05", texto: "Distancia mínima entre traslapes de acero según tabla de varillas.", categoria: "traslape", disciplina: "estructura", partidas: ["EST-ACERO"] },
  { codigo: "NG-17", texto: "Mampostería: refuerzo horizontal 1#3@40 cm, vertical 1#3@60 cm.", categoria: "mamposteria", disciplina: "arquitectura", partidas: ["ARQ-MAMP"] },
  { codigo: "NG-CURADO", texto: "Curado húmedo mínimo 8 días (norma indica 28 días para resistencia total).", categoria: "proceso", disciplina: "estructura", partidas: ["EST-CONC-210"] },
  { codigo: "NE-13", texto: "Colores conductores: negro/rojo/azul (fases), blanco (neutro), verde (tierra).", categoria: "electrico", disciplina: "electrico", partidas: [] },
  { codigo: "NE-19", texto: "Altura de tomas en baño/cocina: 1.10 m sobre NPT.", categoria: "electrico", disciplina: "electrico", partidas: [] },
  { codigo: "NE-25", texto: "Resistencia máxima sistema de tierra: ≤5 Ω.", categoria: "electrico", disciplina: "electrico", partidas: [] },
  { codigo: "NT-01", texto: "Cubierta zinc rectangular #26. Traslape 15 cm. Desperdicio 10%.", categoria: "techo", disciplina: "arquitectura", partidas: ["ARQ-TECHO-ZINC"] },
  { codigo: "NT-02", texto: "Pintura anticorrosiva perfiles techo: 4 manos. Electrodo E6011. Perfil A-570-33.", categoria: "techo", disciplina: "estructura", partidas: ["EST-PINT-PERF"] },
  { codigo: "NM-04", texto: "Pendiente mínima aguas negras: 1.5–2%.", categoria: "sanitario", disciplina: "sanitario_mecanico", partidas: [] },
  { codigo: "NM-07", texto: "Tubería sanitaria principal: Ø100 mm (4 pulgadas).", categoria: "sanitario", disciplina: "sanitario_mecanico", partidas: [] },
  { codigo: "NM-12", texto: "Capacidad fosa séptica: 1100 litros mínimo.", categoria: "sanitario", disciplina: "sanitario_mecanico", partidas: [] },
];

const TABLAS = [
  { tabla: "dosificaciones", clave: "210", valores: "9.5 sacos/m³, 0.5 m³ arena, 0.75 m³ piedra" },
  { tabla: "dosificaciones", clave: "175", valores: "8.0 sacos/m³, 0.5 m³ arena, 0.75 m³ piedra" },
  { tabla: "dosificaciones", clave: "140", valores: "6.5 sacos/m³, 0.5 m³ arena, 0.75 m³ piedra" },
  { tabla: "acero", clave: "#3", valores: "Ø9.5mm, 0.56 kg/m, traslape 400mm (f'c=210)" },
  { tabla: "acero", clave: "#4", valores: "Ø12.7mm, 0.99 kg/m, traslape 480mm (f'c=210)" },
  { tabla: "acero", clave: "#5", valores: "Ø15.9mm, 1.55 kg/m, traslape 600mm (f'c=210)" },
  { tabla: "acero", clave: "#6", valores: "Ø19.1mm, 2.24 kg/m, traslape 750mm (f'c=210)" },
  { tabla: "acero", clave: "#7", valores: "Ø22.2mm, 3.04 kg/m, traslape 1050mm (f'c=210)" },
];

const DISCIPLINA_COLORS: Record<string, string> = {
  estructura: "bg-orange-100 text-orange-700",
  arquitectura: "bg-green-100 text-green-700",
  electrico: "bg-yellow-100 text-yellow-700",
  sanitario_mecanico: "bg-blue-100 text-blue-700",
};

export default function CtkPage() {
  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900">Conocimiento Técnico (CTK)</h1>
      <p className="text-gray-500 mt-1">Pack CR-RESIDENCIAL-V1 — {REGLAS.length} reglas, {TABLAS.length} filas de tabla</p>

      {/* Reglas */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Reglas Técnicas</h2>
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 w-24">Código</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Texto</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 w-28">Categoría</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 w-36">Disciplina</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 w-36">Partidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {REGLAS.map((r) => (
                <tr key={r.codigo} className="hover:bg-blue-50/50">
                  <td className="px-4 py-2.5 font-mono font-bold text-blue-600">{r.codigo}</td>
                  <td className="px-4 py-2.5 text-gray-700">{r.texto}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{r.categoria}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${DISCIPLINA_COLORS[r.disciplina] || "bg-gray-100 text-gray-600"}`}>
                      {r.disciplina}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">
                    {r.partidas.length > 0 ? r.partidas.join(", ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tablas */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Tablas de Referencia</h2>
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 w-36">Tabla</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 w-20">Clave</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Valores</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {TABLAS.map((t) => (
                <tr key={`${t.tabla}-${t.clave}`} className="hover:bg-blue-50/50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{t.tabla}</td>
                  <td className="px-4 py-2.5 font-mono font-bold text-orange-600">{t.clave}</td>
                  <td className="px-4 py-2.5 text-gray-700">{t.valores}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Jerarquía */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Jerarquía Normativa</h2>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-3 text-sm">
            <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-medium">ARESEP/ICE/NEC</span>
            <span className="text-gray-400">{">"}</span>
            <span className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg font-medium">CFIA</span>
            <span className="text-gray-400">{">"}</span>
            <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-medium">Notas del proyecto</span>
            <span className="text-gray-400">{">"}</span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-medium">Pack global</span>
          </div>
          <p className="text-xs text-gray-500 mt-3">Conflictos: aplica prioridad mayor. Si ambiguo, marca requiere_validacion_humana.</p>
        </div>
      </div>
    </div>
  );
}
