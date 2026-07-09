"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  rol: string;
  contenido: string;
  fuentesCitasJson?: Array<{ tipo: string; referencia: string; detalle?: string }>;
  confianza?: number;
  herramientasJson?: {
    fundamento?: string;
    requiereValidacion?: boolean;
    herramientas?: string[];
  };
}

export function AgentChat({
  proyectoId,
  variant = "compact",
}: {
  proyectoId: string;
  variant?: "compact" | "full";
}) {
  const [mensajes, setMensajes] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversacionId, setConversacionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/proyectos/${proyectoId}/agente`)
      .then((r) => r.json())
      .then((data) => {
        if (data[0]?.mensajes) {
          setMensajes(data[0].mensajes);
          setConversacionId(data[0].id);
        }
      });
  }, [proyectoId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  async function enviar(texto?: string) {
    const pregunta = (texto ?? input).trim();
    if (!pregunta || loading) return;

    setInput("");
    setLoading(true);

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      rol: "user",
      contenido: pregunta,
    };
    setMensajes((m) => [...m, userMsg]);

    const res = await fetch(`/api/proyectos/${proyectoId}/agente`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje: pregunta, conversacionId }),
    });

    const data = await res.json();
    if (res.ok) {
      setConversacionId(data.conversacionId);
      setMensajes((m) => [...m, data.mensaje]);
    }
    setLoading(false);
  }

  const sugerencias = [
    "¿Cuánto cemento necesito para 10 m³ de concreto 210?",
    "¿Cuál es el traslape de varilla #4?",
    "¿Cuánto zinc necesito para el techo?",
    "¿Cuánto mide toda la construcción?",
    "¿Altura de tomas en baño?",
  ];

  const confPct = (c?: number) => Math.round((c ?? 0) * (c && c <= 1 ? 100 : 1));

  return (
    <div
      className={`flex flex-col border rounded-xl bg-white ${
        variant === "full" ? "h-full" : "h-full"
      }`}
    >
      {variant === "compact" && (
        <div className="p-3 border-b bg-slate-50 rounded-t-xl">
          <h3 className="font-semibold text-sm">Agente IA — Chat Live</h3>
          <p className="text-xs text-slate-500">Consultas técnicas con citas a reglas y tablas CTK</p>
        </div>
      )}

      <div
        className={`flex-1 overflow-y-auto p-4 space-y-4 ${
          variant === "full" ? "min-h-0" : "min-h-[300px] max-h-[500px]"
        }`}
      >
        {mensajes.length === 0 && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🤖</div>
            <h2 className="text-lg font-semibold text-gray-700">Agente IA Admin</h2>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Toda respuesta cita fuente (regla, tabla, lámina) y muestra confianza.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {sugerencias.map((s) => (
                <button
                  key={s}
                  onClick={() => enviar(s)}
                  className="text-xs bg-white border rounded-full px-3 py-1.5 text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensajes.map((m) => {
          const isUser = m.rol === "user";
          const conf = confPct(m.confianza);
          const tools = m.herramientasJson?.herramientas ?? [];
          return (
            <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-2xl rounded-xl px-4 py-3 ${
                  isUser ? "bg-blue-600 text-white" : "bg-white border shadow-sm"
                }`}
              >
                <div
                  className={`text-sm whitespace-pre-line ${
                    isUser ? "text-white" : "text-gray-800"
                  }`}
                >
                  {m.contenido.split("**").map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
                  )}
                </div>

                {!isUser && tools.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-400 mb-1">Tools invocadas:</div>
                    {tools.map((h, j) => (
                      <code
                        key={j}
                        className="text-xs bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded mr-1"
                      >
                        {h}
                      </code>
                    ))}
                  </div>
                )}

                {!isUser && m.fuentesCitasJson && m.fuentesCitasJson.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-400 mb-1">Fuentes:</div>
                    {m.fuentesCitasJson.map((c, j) => (
                      <span
                        key={j}
                        className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded mr-1 mb-1"
                      >
                        {c.referencia}
                        {c.detalle ? `: ${c.detalle.slice(0, 60)}` : ""}
                      </span>
                    ))}
                  </div>
                )}

                {!isUser && m.confianza != null && (
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
                    <span className="text-xs text-gray-400">Confianza:</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[120px]">
                      <div
                        className={`h-1.5 rounded-full ${
                          conf >= 80 ? "bg-green-500" : conf >= 50 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                        style={{ width: `${conf}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-600">{conf}%</span>
                    {m.herramientasJson?.requiereValidacion && (
                      <span className="text-xs text-amber-600">Requiere validación</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="text-sm text-slate-400 animate-pulse">Analizando corpus CTK...</div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t bg-white rounded-b-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviar();
          }}
          className="flex gap-2 max-w-3xl mx-auto"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunte sobre el proyecto..."
            className="flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
