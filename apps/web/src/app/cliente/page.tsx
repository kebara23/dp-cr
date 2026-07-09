const RESUMEN = {
  proyecto: "Casa Residencial Terraba",
  propietario: "Diana Cortés Sánchez",
  ubicacion: "Puntarenas, Osa, Puerto Cortés",
  estado: "En cotización",
  ultimaActualizacion: "8 julio 2026, 14:30",
};

const CAPITULOS_PUBLICADOS = [
  { nombre: "02 — Cimentaciones y concreto", subtotal: 2312500 },
  { nombre: "03 — Acero de refuerzo", subtotal: 1062500 },
  { nombre: "04 — Paredes", subtotal: 2707500 },
  { nombre: "05 — Cubiertas", subtotal: 2541960 },
  { nombre: "06 — Puertas y ventanas", subtotal: 1160000 },
];

const TIMELINE = [
  { fecha: "8 jul 2026", evento: "Cotización preliminar publicada (6 partidas MVP)", tipo: "publicacion" },
  { fecha: "7 jul 2026", evento: "8 láminas del proyecto cargadas y validadas", tipo: "laminas" },
  { fecha: "5 jul 2026", evento: "Proyecto creado en plataforma", tipo: "proyecto" },
];

function formatCRC(n: number) {
  return "₡" + n.toLocaleString("es-CR");
}

export default function ClientePortal() {
  const subtotal = CAPITULOS_PUBLICADOS.reduce((s, c) => s + c.subtotal, 0);
  const iva = subtotal * 0.13;
  const total = subtotal + iva;

  return (
    <div className="space-y-6">
      {/* Resumen proyecto */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold text-gray-900">{RESUMEN.proyecto}</h2>
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <span className="text-gray-500">Propietario:</span>
            <span className="ml-2 font-medium text-gray-900">{RESUMEN.propietario}</span>
          </div>
          <div>
            <span className="text-gray-500">Ubicación:</span>
            <span className="ml-2 font-medium text-gray-900">{RESUMEN.ubicacion}</span>
          </div>
          <div>
            <span className="text-gray-500">Estado:</span>
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{RESUMEN.estado}</span>
          </div>
          <div>
            <span className="text-gray-500">Última actualización:</span>
            <span className="ml-2 font-medium text-gray-900">{RESUMEN.ultimaActualizacion}</span>
          </div>
        </div>
      </div>

      {/* Cotización resumen (sin detalle MO) */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Cotización Preliminar</h2>
          <p className="text-xs text-gray-500">6 partidas principales — precios Q3-2026</p>
        </div>
        <div className="divide-y">
          {CAPITULOS_PUBLICADOS.map((c) => (
            <div key={c.nombre} className="px-6 py-3 flex justify-between text-sm">
              <span className="text-gray-700">{c.nombre}</span>
              <span className="font-medium text-gray-900">{formatCRC(c.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium">{formatCRC(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">IVA (13%)</span>
            <span className="font-medium">{formatCRC(iva)}</span>
          </div>
          <div className="flex justify-between text-lg pt-2 border-t">
            <span className="font-bold">Total</span>
            <span className="font-bold text-blue-600">{formatCRC(total)}</span>
          </div>
          <p className="text-xs text-gray-400 pt-1">Validez: 30 días | Moneda: CRC (₡)</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Timeline</h2>
        <div className="space-y-4">
          {TIMELINE.map((t, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-20 text-xs text-gray-500 pt-0.5 flex-shrink-0">{t.fecha}</div>
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">{t.evento}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
