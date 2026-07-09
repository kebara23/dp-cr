export function estadoBadgeClass(estado: string): string {
  switch (estado) {
    case "ANALIZADO":
    case "VALIDADO":
      return "bg-emerald-100 text-emerald-800";
    case "PROCESANDO":
      return "bg-amber-100 text-amber-800";
    case "ERROR":
      return "bg-red-100 text-red-800";
    case "PENDIENTE":
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function motivoFromMeta(metadataJson: unknown): string | undefined {
  if (!metadataJson || typeof metadataJson !== "object") return undefined;
  const m = (metadataJson as { motivo?: unknown }).motivo;
  return typeof m === "string" ? m : undefined;
}
