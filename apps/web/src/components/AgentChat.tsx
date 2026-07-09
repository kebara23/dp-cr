"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  rol: string;
  contenido: string;
  fuentesCitasJson?: Array<{ tipo: string; referencia: string; detalle?: string }>;
  confianza?: number;
  herramientasJson?: { fundamento?: string; requiereValidacion?: boolean };
}

export function AgentChat({ proyectoId }: { proyectoId: string }) {
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

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const pregunta = input.trim();
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
    "¿Dosificación concreto 210 para 10 m³?",
    "¿Altura tomas en baño?",
    "¿Carga total eléctrica?",
    "¿Área techo zinc con desperdicio?",
    "¿Conflicto curado concreto?",
  ];

  return (
    <div className="flex flex-col h-full border rounded-xl bg-white">
      <div className="p-3 border-b bg-slate-50 rounded-t-xl">
        <h3 className="font-semibold text-sm">Agente IA — Chat Live</h3>
        <p className="text-xs text-slate-500">Consultas técnicas con citas a reglas y tablas CTK</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[500px]">
        {mensajes.length === 0 && (
          <div className="text-center text-slate-400 text-sm py-8">
            <p>Pregunte sobre cantidades, especificaciones o normativa del proyecto.</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {sugerencias.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-100"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {mensajes.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.rol === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.rol === "user"
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.contenido}</p>
              {m.fuentesCitasJson && m.fuentesCitasJson.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200 text-xs">
                  <p className="font-medium text-slate-600">Fuentes:</p>
                  {m.fuentesCitasJson.map((f, i) => (
                    <span key={i} className="inline-block bg-white border rounded px-1.5 py-0.5 mr-1 mt-1">
                      [{f.tipo}] {f.referencia}
                    </span>
                  ))}
                  {m.confianza != null && (
                    <p className="mt-1 text-slate-500">
                      Confianza: {Math.round(m.confianza * 100)}%
                      {m.herramientasJson?.requiereValidacion && " — Requiere validación"}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-sm text-slate-400 animate-pulse">Analizando corpus...</div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={enviar} className="p-3 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregunte sobre planos, reglas, cantidades..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
