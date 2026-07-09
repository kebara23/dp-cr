// Trazabilidad (principio no negociable #1): toda cantidad/precio/respuesta
// del agente cita su fuente. Tipo compartido por engine y agente.

export type TipoCita = "lamina" | "regla" | "tabla" | "cuadro" | "fuente_precio";

export interface Cita {
  tipo: TipoCita;
  codigo: string; // A-03, NG-01, "#4", V-3, "Q3-2026"
  detalle?: string;
  laminaId?: string;
  reglaId?: string;
  href?: string; // link clicable al visor
}

export interface ResultadoTrazable<T> {
  valor: T;
  formula?: string;
  citas: Cita[];
  requiereValidacion: boolean;
  confianza?: number; // 0..1
}

export const sinCitas = (): Cita[] => [];
