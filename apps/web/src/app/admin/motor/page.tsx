"use client";

import { useState } from "react";
import {
  calcularDosificacionTrazable,
  calcularTraslapeTrazable,
  calcularAreaTechoZinc,
  calcularMamposteria,
  calcularPinturaPerfiles,
} from "@diego-porras/engine";

type Resultado = {
  titulo: string;
  valores: Record<string, string | number>;
  formula: string;
  citas: string[];
  confianza: number;
};

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
      case "dosificacion": {
        const r = calcularDosificacionTrazable(
          Number(inputs.fc || 210),
          Number(inputs.volumen || 10)
        );
        setResultado({
          titulo: `Dosificación f'c=${inputs.fc || 210} para ${inputs.volumen || 10} m³`,
          valores: {
            "Cemento (sacos)": r.valor.sacosCemento,
            "Arena (m³)": r.valor.m3Arena,
            "Piedra (m³)": r.valor.m3Piedra,
          },
          formula: r.formula,
          citas: r.citas.map((c) => `${c.codigo}: ${c.detalle ?? c.tipo}`),
          confianza: Math.round(r.confianza * 100),
        });
        break;
      }
      case "traslape": {
        const barra = inputs.barra || "4";
        const r = calcularTraslapeTrazable(barra, Number(inputs.longitud || 10), 0.7, 1.27);
        setResultado({
          titulo: `Traslape #${barra}`,
          valores: {
            "Longitud adicional (m)": r.valor.longitudAdicionalM,
            "Peso estimado (kg)": r.valor.pesoKg,
          },
          formula: r.formula,
          citas: r.citas.map((c) => `${c.codigo}: ${c.detalle ?? c.tipo}`),
          confianza: Math.round(r.confianza * 100),
        });
        break;
      }
      case "techo": {
        const r = calcularAreaTechoZinc(Number(inputs.area || 135.34));
        setResultado({
          titulo: `Techo zinc`,
          valores: {
            "Área neta (m²)": r.valor.area_neta_m2,
            "Con traslape (m²)": +(r.valor.area_neta_m2 * 1.136).toFixed(2),
            "Con desperdicio (m²)": r.valor.area_total_m2,
          },
          formula: r.formula,
          citas: r.citas.map((c) => `${c.codigo}: ${c.detalle ?? c.tipo}`),
          confianza: Math.round(r.confianza * 100),
        });
        break;
      }
      case "mamposteria": {
        const r = calcularMamposteria(Number(inputs.area || 80));
        setResultado({
          titulo: `Mampostería`,
          valores: {
            "Área (m²)": r.valor.area_m2,
            "Refuerzo horizontal": r.valor.refuerzo_horizontal,
            "Refuerzo vertical": r.valor.refuerzo_vertical,
            "Acero (kg)": r.valor.acero_kg,
          },
          formula: r.formula,
          citas: r.citas.map((c) => `${c.codigo}: ${c.detalle ?? c.tipo}`),
          confianza: Math.round(r.confianza * 100),
        });
        break;
      }
      case "pintura": {
        const r = calcularPinturaPerfiles(Number(inputs.area || 50));
        setResultado({
          titulo: `Pintura perfiles`,
          valores: {
            "Área (m²)": r.valor.area_m2,
            Manos: r.valor.manos,
            "Galones": r.valor.galones,
          },
          formula: r.formula,
          citas: r.citas.map((c) => `${c.codigo}: ${c.detalle ?? c.tipo}`),
          confianza: Math.round(r.confianza * 100),
        });
        break;
      }
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900">Motor de Metrado</h1>
      <p className="text-gray-500 mt-1">Cálculo con trazabilidad 100% — engine real</p>

      <div className="flex flex-wrap gap-2 mt-6 mb-6">
        {CALCULADORAS.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setActiva(c.id);
              setResultado(null);
            }}
            className={`px-4 py-2 rounded-full text-sm border transition ${
              activa === c.id
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 hover:bg-blue-50"
            }`}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Parámetros</h2>
          {activa === "dosificacion" && (
            <div className="space-y-3">
              <label className="block text-sm">
                f&apos;c (kg/cm²)
                <input
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={inputs.fc ?? "210"}
                  onChange={(e) => setInputs({ ...inputs, fc: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Volumen (m³)
                <input
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={inputs.volumen ?? "10"}
                  onChange={(e) => setInputs({ ...inputs, volumen: e.target.value })}
                />
              </label>
            </div>
          )}
          {activa === "traslape" && (
            <div className="space-y-3">
              <label className="block text-sm">
                Barra (#)
                <input
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={inputs.barra ?? "4"}
                  onChange={(e) => setInputs({ ...inputs, barra: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Longitud (m)
                <input
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={inputs.longitud ?? "10"}
                  onChange={(e) => setInputs({ ...inputs, longitud: e.target.value })}
                />
              </label>
            </div>
          )}
          {(activa === "techo" || activa === "mamposteria" || activa === "pintura") && (
            <label className="block text-sm">
              Área (m²)
              <input
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={inputs.area ?? (activa === "techo" ? "135.34" : "80")}
                onChange={(e) => setInputs({ ...inputs, area: e.target.value })}
              />
            </label>
          )}
          <button
            onClick={calcular}
            className="mt-4 w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700"
          >
            Calcular
          </button>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Resultado</h2>
          {!resultado ? (
            <p className="text-sm text-gray-400">Ingrese parámetros y presione Calcular</p>
          ) : (
            <div className="space-y-4">
              <p className="font-medium">{resultado.titulo}</p>
              <dl className="space-y-2 text-sm">
                {Object.entries(resultado.valores).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b pb-1">
                    <dt className="text-gray-500">{k}</dt>
                    <dd className="font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-xs text-gray-500 font-mono bg-slate-50 p-2 rounded">
                {resultado.formula}
              </p>
              <div>
                <p className="text-xs text-gray-400 mb-1">Fuentes:</p>
                {resultado.citas.map((c) => (
                  <span
                    key={c}
                    className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded mr-1 mb-1"
                  >
                    {c}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Confianza:</span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[120px]">
                  <div
                    className={`h-1.5 rounded-full ${
                      resultado.confianza >= 80
                        ? "bg-green-500"
                        : resultado.confianza >= 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${resultado.confianza}%` }}
                  />
                </div>
                <span className="text-xs font-bold">{resultado.confianza}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
