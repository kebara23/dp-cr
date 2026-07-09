"use client";

import { useEffect, useState } from "react";

interface Props {
  proyectoId: string;
  onUpdate?: () => void;
}

export function ClientPortalLive({ proyectoId, onUpdate }: Props) {
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  useEffect(() => {
    const es = new EventSource(`/api/proyectos/${proyectoId}/events`);
    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "publicacion_actualizada") {
        setLastEvent(data.timestamp);
        onUpdate?.();
      }
    };
    return () => es.close();
  }, [proyectoId, onUpdate]);

  if (!lastEvent) return null;

  return (
    <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-3 py-2 rounded-lg">
      Actualización recibida en tiempo real — {new Date(lastEvent).toLocaleString("es-CR")}
    </div>
  );
}
