"use client";

import { useState } from "react";

type Mensaje = {
  rol: "usuario" | "asistente";
  contenido: string;
  citas?: string[];
  confianza?: number;
  herramientas?: string[];
};

const RESPUESTAS_DEMO: Record<string, Mensaje> = {
  "dosificacion": {
    rol: "asistente",
    contenido: "Para 10 m³ de concreto f'c=210 kg/cm² necesitas:\n\n• **95 sacos** de cemento (9.5 sacos/m³)\n• **5.0 m³** de arena\n• **7.5 m³** de piedra\n• **2,000 litros** de agua potable\n\nLa superficie curada requiere sellador 522-000 o 528-000. Curado húmedo mínimo 8 días.",
    citas: ["NG-01: Tabla dosificaciones", "NG-CURADO: Curado húmedo 8 días"],
    confianza: 95,
    herramientas: ["consultar_regla(NG-01)", "consultar_tabla(dosificaciones, 210)"],
  },
  "traslape": {
    rol: "asistente",
    contenido: "Traslape varilla **#4** con f'c=210 kg/cm²:\n\n• Longitud de traslape: **480 mm**\n• Peso por metro: 0.99 kg/m\n• Diámetro: Ø12.7 mm\n• Especificación: ASTM A615",
    citas: ["NE-ACERO-01: Tabla traslapes", "NG-05: Distancia mínima entre traslapes"],
    confianza: 95,
    herramientas: ["consultar_tabla(acero, #4)"],
  },
  "zinc": {
    rol: "asistente",
    contenido: "Área de techo zinc para Casa Terraba:\n\n• Área neta (A-03): **~135 m²**\n• Con traslape 15 cm (+13.6%): **153.4 m²**\n• Con desperdicio 10%: **168.7 m²**\n\nLámina zinc rectangular calibre #26. Traslape lateral 15 cm según notas de techo.",
    citas: ["NT-01: Traslape 15cm, calibre #26", "A-03: Planta de techos"],
    confianza: 88,
    herramientas: ["buscar_en_plano(arquitectura, techo)", "calcular_cantidad(ARQ-TECHO-ZINC)"],
  },
  "tomas": {
    rol: "asistente",
    contenido: "Altura de tomas en baño y cocina: **1.10 m** sobre el nivel de piso terminado (NPT).\n\nEsta norma aplica específicamente para tomas de corriente en áreas húmedas según regulación ARESEP.",
    citas: ["NE-19: Altura tomas baño/cocina 1.10 m"],
    confianza: 95,
    herramientas: ["consultar_regla(NE-19)"],
  },
  "mamposteria": {
    rol: "asistente",
    contenido: "Refuerzo de mampostería estándar:\n\n• **Horizontal:** 1#3 @ 40 cm\n• **Vertical:** 1#3 @ 60 cm\n• Acero estimado: ~0.4 kg/m²\n\nPara 80 m² de paredes: ~32 kg de acero de refuerzo.",
    citas: ["NG-17: Mampostería refuerzo horizontal 1#3@40, vertical 1#3@60"],
    confianza: 80,
    herramientas: ["consultar_regla(NG-17)", "calcular_cantidad(ARQ-MAMP)"],
  },
};

const SUGERENCIAS = [
  "¿Cuánto cemento necesito para 10 m³ de concreto 210?",
  "¿Cuál es el traslape de varilla #4?",
  "¿Cuánto zinc necesito para el techo?",
  "¿Altura de tomas en baño?",
  "¿Refuerzo de mampostería?",
];

function matchRespuesta(texto: string): Mensaje {
  const lower = texto.toLowerCase();
  if (lower.includes("cemento") || lower.includes("dosifica") || lower.includes("concreto") || lower.includes("sacos")) return RESPUESTAS_DEMO.dosificacion!;
  if (lower.includes("traslape") || lower.includes("varilla") || lower.includes("#4") || lower.includes("#3")) return RESPUESTAS_DEMO.traslape!;
  if (lower.includes("zinc") || lower.includes("techo") || lower.includes("cubierta")) return RESPUESTAS_DEMO.zinc!;
  if (lower.includes("toma") || lower.includes("altura") || lower.includes("baño")) return RESPUESTAS_DEMO.tomas!;
  if (lower.includes("mamposteria") || lower.includes("pared") || lower.includes("muro") || lower.includes("bloque")) return RESPUESTAS_DEMO.mamposteria!;

  return {
    rol: "asistente",
    contenido: "No encontré información específica para esa consulta en el CTK indexado.\n\n**Requiere validación humana.** Por favor reformule o consulte directamente las láminas del proyecto.",
    citas: [],
    confianza: 20,
    herramientas: ["buscar_en_plano(general, consulta)"],
  };
}

export default function ChatPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");

  function enviar(texto?: string) {
    const msg = texto || input;
    if (!msg.trim()) return;

    const userMsg: Mensaje = { rol: "usuario", contenido: msg };
    const respuesta = matchRespuesta(msg);

    setMensajes((prev) => [...prev, userMsg, respuesta]);
    setInput("");
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b bg-white">
        <h1 className="text-lg font-bold text-gray-900">Agente IA — Chat Live</h1>
        <p className="text-xs text-gray-500">Proyecto: Casa Terraba | 6 tools | Nunca responde sin citar fuente</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {mensajes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-lg font-semibold text-gray-700">Agente IA Admin</h2>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Consultas técnicas sobre el proyecto Casa Terraba. Toda respuesta cita fuente (regla, tabla, lámina).
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  onClick={() => enviar(s)}
                  className="text-xs bg-white border rounded-full px-3 py-1.5 text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensajes.map((m, i) => (
          <div key={i} className={`flex ${m.rol === "usuario" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-2xl rounded-xl px-4 py-3 ${
              m.rol === "usuario"
                ? "bg-blue-600 text-white"
                : "bg-white border shadow-sm"
            }`}>
              <div className={`text-sm whitespace-pre-line ${m.rol === "usuario" ? "text-white" : "text-gray-800"}`}>
                {m.contenido.split("**").map((part, j) =>
                  j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
                )}
              </div>

              {m.rol === "asistente" && m.herramientas && m.herramientas.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-400 mb-1">Tools invocadas:</div>
                  {m.herramientas.map((h, j) => (
                    <code key={j} className="text-xs bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded mr-1">{h}</code>
                  ))}
                </div>
              )}

              {m.rol === "asistente" && m.citas && m.citas.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-400 mb-1">Fuentes:</div>
                  {m.citas.map((c, j) => (
                    <span key={j} className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded mr-1 mb-1">{c}</span>
                  ))}
                </div>
              )}

              {m.rol === "asistente" && m.confianza !== undefined && (
                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
                  <span className="text-xs text-gray-400">Confianza:</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[120px]">
                    <div
                      className={`h-1.5 rounded-full ${m.confianza >= 80 ? "bg-green-500" : m.confianza >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${m.confianza}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-600">{m.confianza}%</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enviar()}
            placeholder="Pregunta sobre el proyecto Terraba..."
            className="flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => enviar()}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
