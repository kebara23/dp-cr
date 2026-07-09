import { prisma } from "@diego-porras/database";

type PublishEvent = {
  type: "publicacion_actualizada";
  proyectoId: string;
  publicacionId: string;
  timestamp: string;
};

const listeners = new Map<string, Set<(event: PublishEvent) => void>>();

export function subscribeProyecto(proyectoId: string, callback: (event: PublishEvent) => void) {
  if (!listeners.has(proyectoId)) listeners.set(proyectoId, new Set());
  listeners.get(proyectoId)!.add(callback);
  return () => listeners.get(proyectoId)?.delete(callback);
}

export function emitPublicacion(proyectoId: string, publicacionId: string) {
  const event: PublishEvent = {
    type: "publicacion_actualizada",
    proyectoId,
    publicacionId,
    timestamp: new Date().toISOString(),
  };
  listeners.get(proyectoId)?.forEach((cb) => cb(event));
}

export async function getPublicacionActiva(proyectoId: string) {
  return prisma.publicacionCliente.findFirst({
    where: { proyectoId, activa: true },
    include: {
      presupuesto: { include: { lineas: true } },
      publicador: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
