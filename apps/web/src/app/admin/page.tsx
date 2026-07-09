const PROYECTO = {
  nombre: "Casa Residencial Terraba",
  propietario: "Diana Cortés Sánchez",
  cedula: "4-1274-0380",
  catastro: "6-0022026-2025",
  ubicacion: "Puntarenas / Osa / Puerto Cortés",
  moneda: "CRC (₡)",
  tipoObra: "Residencial",
  folio: "6-016796-000",
  tomo: "23822",
  finca: "016",
};

const LAMINAS = [
  { codigo: "A-01", tipo: "Planta Arquitectónica", disciplina: "arquitectura", estado: "cargada" },
  { codigo: "A-03", tipo: "Planta de Techos", disciplina: "arquitectura", estado: "cargada" },
  { codigo: "A-09", tipo: "Agenda Ventanas/Puertas", disciplina: "arquitectura", estado: "cargada" },
  { codigo: "E-1", tipo: "Planta Eléctrica", disciplina: "electrico", estado: "cargada" },
  { codigo: "E-2", tipo: "Diagrama Unifilar", disciplina: "electrico", estado: "cargada" },
  { codigo: "EST-01", tipo: "Planta Fundaciones", disciplina: "estructura", estado: "cargada" },
  { codigo: "EST-02", tipo: "Estructural Paredes", disciplina: "estructura", estado: "cargada" },
  { codigo: "S-01", tipo: "Sanitario/Mecánico", disciplina: "sanitario_mecanico", estado: "cargada" },
];

const STATS = [
  { label: "Láminas", value: "8", detail: "4 disciplinas" },
  { label: "Reglas CTK", value: "30+", detail: "NG/NE/NM/NT" },
  { label: "Partidas motor", value: "6", detail: "MVP slice" },
  { label: "Estado", value: "Fase 0", detail: "Scaffolding" },
];

export default function AdminDashboard() {
  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="text-gray-500 mt-1">Proyecto: Casa Residencial Terraba — Puerto Cortés</p>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{s.value}</div>
            <div className="text-sm font-medium text-gray-900 mt-1">{s.label}</div>
            <div className="text-xs text-gray-400">{s.detail}</div>
          </div>
        ))}
      </div>

      {/* Project info */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h2 className="font-semibold text-gray-900 mb-3">Información del Proyecto</h2>
          <dl className="space-y-2 text-sm">
            {Object.entries(PROYECTO).map(([key, val]) => (
              <div key={key} className="flex">
                <dt className="w-32 text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1")}</dt>
                <dd className="text-gray-900 font-medium">{val}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Laminas overview */}
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h2 className="font-semibold text-gray-900 mb-3">Láminas del Proyecto</h2>
          <div className="space-y-1.5">
            {LAMINAS.map((l) => (
              <div key={l.codigo} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-600 w-16">{l.codigo}</span>
                  <span className="text-gray-700">{l.tipo}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  l.disciplina === "arquitectura" ? "bg-green-100 text-green-700" :
                  l.disciplina === "estructura" ? "bg-orange-100 text-orange-700" :
                  l.disciplina === "electrico" ? "bg-yellow-100 text-yellow-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {l.disciplina}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
