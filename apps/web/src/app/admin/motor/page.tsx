"use client";

import { useState } from "react";

type Resultado = {
  titulo: string;
  valores: Record<string, string | number>;
  formula: string;
  citas: string[];
  confianza: number;
};

function calcularDosificacion(fc: number, volumen: number): Resultado {
  const tablas: Record<number, { sacos: number; arena: number; piedra: number }> = {
    210: { sacos: 9.5, arena: 0.5, piedra: 0.75 },
    175: { sacos: 8.0, arena: 0.5, piedra: 0.75 },
    140: { sacos: 6.5, arena: 0.5, piedra: 0.75 },
  };
  const d = tablas[fc] || tablas[210]!;
  return {
    titulo: `Dosificación f'c=${fc} para ${volumen} m³`,
    valores: {
      "Cemento (sacos)": +(d.sacos * volumen).toFixed(1),
      "Arena (m³)": +(d.arena * volumen).toFixed(2),
      "Piedra (m³)": +(d.piedra * volumen).toFixed(2),
      "Agua (litros)": +(200 * volumen).toFixed(0),
    },
    formula: `${d.sacos} sacos/m³ × ${volumen} m³ = ${+(d.sacos * volumen).toFixed(1)} sacos`,
    citas: ["NG-01: Tabla dosificaciones"],
    confianza: 95,
  };
}

function calcularTraslape(barra: string, fc: number): Resultado {
  const traslapes: Record<string, Record<number, number>> = {
    "#3": { 210: 400, 175: 380, 140: 360 },
    "#4": { 210: 480, 175: 460, 140: 440 },
    "#5": { 210: 600, 175: 580, 140: 560 },
    "#6": { 210: 750, 175: 730, 140: 710 },
    "#7": { 210: 1050, 175: 1030, 140: 1010 },
  };
  const pesos: Record<string, number> = { "#3": 0.56, "#4": 0.99, "#5": 1.55, "#6": 2.24, "#7": 3.04 };
  const t = traslapes[barra]?.[fc] || 0;
  return {
    titulo: `Traslape ${barra} con f'c=${fc}`,
    valores: {
      "Longitud traslape (mm)": t,
      "Peso por metro (kg/m)": pesos[barra] || 0,
    },
    formula: `traslape_${barra}_fc${fc} = ${t} mm`,
    citas: ["NE-ACERO-01: Tabla traslapes", "NG-05: Distancia mínima traslapes"],
    confianza: 95,
  };
}

function calcularTecho(areaNeta: number): Resultado {
  const conTraslape = areaNeta * 1.136;
  const total = conTraslape * 1.10;
  return {
    titulo: `Techo zinc para ${areaNeta} m²`,
    valores: {
      "Área neta (m²)": areaNeta,
      "Con traslape 15cm (m²)": +conTraslape.toFixed(2),
      "Con desperdicio 10% (m²)": +total.toFixed(2),
    },
    formula: `${areaNeta} × 1.136 × 1.10 = ${total.toFixed(2)} m²`,
    citas: ["NT-01: Traslape 15cm, calibre #26", "A-03: Planta de techos"],
    confianza: 88,
  };
}

function calcularMamposteria(area: number): Resultado {
  const acero = area * 0.4;
  return {
    titulo: `Mampostería ${area} m²`,
    valores: {
      "Área (m²)": area,
      "Refuerzo horizontal": "1#3 @ 40 cm",
      "Refuerzo vertical": "1#3 @ 60 cm",
      "Acero estimado (kg)": +acero.toFixed(1),
    },
    formula: `${area} m² × 0.4 kg/m² = ${acero.toFixed(1)} kg`,
    citas: ["NG-17: Mampostería refuerzo estándar"],
    confianza: 80,
  };
}

function calcularPintura(area: number): Resultado {
  const galones = (area * 4) / 12;
  return {
    titulo: `Pintura perfiles ${area} m²`,
    valores: {
      "Área (m²)": area,
      "Manos": 4,
      "Rendimiento (m²/gal)": 12,
      "Galones totales": +galones.toFixed(1),
    },
    formula: `(${area} × 4 manos) / 12 m²/gal = ${galones.toFixed(1)} gal`,
    citas: ["NT-02: 4 manos pintura anticorrosiva E6011"],
    confianza: 85,
  };
}

const CALCULADORAS = [
  { id: "dosificacion", label: "Dosificación concreto", icon: "🏗️" },
  { id: "traslape", label: "Traslape acero", icon: "🔩" },
  { id: "techo", label: "Techo zinc", icon: "🏠" },
  { id: "mamposteria", label: "Mampostería", icon: "🧱" },
  { id: "pintura", label: "Pintura perfiles", icon: "🎨" },
];

export default function MotorPage() {
  const [activa, setActiva] = useState("dosificacion");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});

  function calcular() {
    switch (activa) {
      case "dosificacion":
        setResultado(calcularDosificacion(Number(inputs.fc || 210), Number(inputs.volumen || 10)));
        break;
      case "traslape":
        setResultado(calcularTraslape(inputs.barra || "#4", Number(inputs.fc || 210)));
        break;
      case "techo":
        setResultado(calcularTecho(Number(inputs.area || 135)));
        break;
      case "mamposteria":
        setResultado(calcularMamposteria(Number(inputs.area || 80)));
        break;
      case "pintura":
        setResultado(calcularPintura(Number(inputs.area || 45)));
        break;
    }
  }

  function renderInputs() {
    switch (activa) {
      case "dosificacion":
        return (
          <>
            <InputField label="f'c (kg/cm²)" name="fc" placeholder="210" inputs={inputs} setInputs={setInputs} />
            <InputField label="Volumen (m³)" name="volumen" placeholder="10" inputs={inputs} setInputs={setInputs} />
          </>
        );
      case "traslape":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barra</label>
              <select
                value={inputs.barra || "#4"}
                onChange={(e) => setInputs({ ...inputs, barra: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {["#3", "#4", "#5", "#6", "#7"].map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <InputField label="f'c (kg/cm²)" name="fc" placeholder="210" inputs={inputs} setInputs={setInputs} />
          </>
        );
      case "techo":
      case "mamposteria":
      case "pintura":
        return <InputField label="Área (m²)" name="area" placeholder={activa === "techo" ? "135" : activa === "mamposteria" ? "80" : "45"} inputs={inputs} setInputs={setInputs} />;
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900">Motor de Metrado</h1>
      <p className="text-gray-500 mt-1">6 partidas MVP — cálculo con trazabilidad 100%</p>

      <div className="flex gap-2 mt-6">
        {CALCULADORAS.map((c) => (
          <button
            key={c.id}
            onClick={() => { setActiva(c.id); setResultado(null); setInputs({}); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activa === c.id ? "bg-blue-600 text-white" : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6">
        {/* Inputs */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Parámetros</h3>
          <div className="space-y-4">
            {renderInputs()}
          </div>
          <button
            onClick={calcular}
            className="mt-6 w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Calcular
          </button>
        </div>

        {/* Resultado */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          {resultado ? (
            <>
              <h3 className="font-semibold text-gray-900 mb-3">{resultado.titulo}</h3>
              <dl className="space-y-2">
                {Object.entries(resultado.valores).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                    <dt className="text-gray-500">{k}</dt>
                    <dd className="font-bold text-gray-900">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs font-medium text-gray-500 mb-1">Fórmula</div>
                <code className="text-xs text-gray-700">{resultado.formula}</code>
              </div>

              <div className="mt-3">
                <div className="text-xs font-medium text-gray-500 mb-1">Fuentes citadas</div>
                {resultado.citas.map((c, i) => (
                  <span key={i} className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded mr-1 mb-1">{c}</span>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="text-xs text-gray-500">Confianza:</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${resultado.confianza}%` }} />
                </div>
                <div className="text-xs font-bold text-gray-700">{resultado.confianza}%</div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Ingrese parámetros y presione Calcular
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InputField({ label, name, placeholder, inputs, setInputs }: {
  label: string; name: string; placeholder: string;
  inputs: Record<string, string>; setInputs: (v: Record<string, string>) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        value={inputs[name] || ""}
        onChange={(e) => setInputs({ ...inputs, [name]: e.target.value })}
        placeholder={placeholder}
        className="w-full border rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );
}
