const CAPITULOS = [
  {
    numero: "02",
    nombre: "Cimentaciones y concreto",
    lineas: [
      { partida: "EST-CONC-210", descripcion: "Concreto dosificado f'c=210 (fundaciones/vigas)", unidad: "m³", cantidad: 12.5, precioUnitario: 185000, fuente: "Q3-2026" },
    ],
  },
  {
    numero: "03",
    nombre: "Acero de refuerzo",
    lineas: [
      { partida: "EST-ACERO", descripcion: "Acero de refuerzo #4 incl. traslapes", unidad: "kg", cantidad: 850, precioUnitario: 1250, fuente: "Q3-2026" },
    ],
  },
  {
    numero: "04",
    nombre: "Paredes",
    lineas: [
      { partida: "ARQ-MAMP", descripcion: "Mampostería prefabricada incl. refuerzo", unidad: "m²", cantidad: 95, precioUnitario: 28500, fuente: "Q3-2026" },
    ],
  },
  {
    numero: "05",
    nombre: "Cubiertas",
    lineas: [
      { partida: "ARQ-TECHO-ZINC", descripcion: "Cubierta zinc #26 incl. traslape y desperdicio", unidad: "m²", cantidad: 168.7, precioUnitario: 12800, fuente: "Q3-2026" },
      { partida: "EST-PINT-PERF", descripcion: "Pintura anticorrosiva perfiles (4 manos)", unidad: "m²", cantidad: 45, precioUnitario: 8500, fuente: "Q3-2026" },
    ],
  },
  {
    numero: "06",
    nombre: "Puertas y ventanas",
    lineas: [
      { partida: "ARQ-VENT", descripcion: "Ventanas según cuadro A-09", unidad: "und", cantidad: 8, precioUnitario: 145000, fuente: "Q3-2026" },
    ],
  },
];

function formatCRC(n: number) {
  return "₡" + n.toLocaleString("es-CR");
}

export default function PresupuestoPage() {
  const subtotalGeneral = CAPITULOS.reduce(
    (sum, cap) => sum + cap.lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0), 0
  );
  const impuesto = subtotalGeneral * 0.13;
  const total = subtotalGeneral + impuesto;

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presupuesto / Cotización</h1>
          <p className="text-gray-500 mt-1">Casa Terraba — 6 partidas MVP, fuente precios Q3-2026</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            Exportar PDF
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            Publicar al cliente
          </button>
        </div>
      </div>

      {/* Capítulos */}
      <div className="mt-6 space-y-4">
        {CAPITULOS.map((cap) => {
          const subtotal = cap.lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
          return (
            <div key={cap.numero} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-b">
                <h3 className="font-semibold text-gray-900">{cap.numero} — {cap.nombre}</h3>
                <span className="font-bold text-gray-900">{formatCRC(subtotal)}</span>
              </div>
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500">
                  <tr>
                    <th className="text-left px-5 py-2 w-32">Partida</th>
                    <th className="text-left px-3 py-2">Descripción</th>
                    <th className="text-center px-3 py-2 w-16">Und</th>
                    <th className="text-right px-3 py-2 w-20">Cant</th>
                    <th className="text-right px-3 py-2 w-28">P. Unit</th>
                    <th className="text-right px-5 py-2 w-32">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {cap.lineas.map((l) => (
                    <tr key={l.partida} className="border-t border-gray-50 hover:bg-blue-50/30">
                      <td className="px-5 py-2.5 font-mono text-xs text-blue-600 font-bold">{l.partida}</td>
                      <td className="px-3 py-2.5 text-gray-700">{l.descripcion}</td>
                      <td className="px-3 py-2.5 text-center text-gray-500">{l.unidad}</td>
                      <td className="px-3 py-2.5 text-right font-medium">{l.cantidad}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{formatCRC(l.precioUnitario)}</td>
                      <td className="px-5 py-2.5 text-right font-bold">{formatCRC(l.cantidad * l.precioUnitario)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* Totales */}
      <div className="bg-white rounded-xl shadow-sm border p-5 mt-6 max-w-sm ml-auto">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium">{formatCRC(subtotalGeneral)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">IVA (13%)</span>
            <span className="font-medium">{formatCRC(impuesto)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t text-lg">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-blue-600">{formatCRC(total)}</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-400">
          Fuente precios: Q3-2026 | Validez: 30 días | Moneda: CRC (₡)
        </div>
      </div>
    </div>
  );
}
