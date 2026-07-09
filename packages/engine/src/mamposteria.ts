import type { ResultadoTrazable, Cita } from "@dp/shared";

export interface CalculoMamposteria {
  area_m2: number;
  refuerzo_horizontal: string; // "1#3@40"
  refuerzo_vertical: string; // "1#3@60"
  kg_acero_estimado: number;
}

export function calcularMamposteria(area_m2: number): ResultadoTrazable<CalculoMamposteria> {
  // NG-17: 1#3@40 horizontal, 1#3@60 vertical
  // Estimación: ~0.4 kg/m² para la configuración estándar
  const acero_por_m2 = 0.4;
  const acero_total = area_m2 * acero_por_m2;

  return {
    valor: {
      area_m2,
      refuerzo_horizontal: "1#3@40",
      refuerzo_vertical: "1#3@60",
      kg_acero_estimado: acero_total,
    },
    formula: `${area_m2} m² × ${acero_por_m2} kg/m² (refuerzo estándar) = ${acero_total} kg`,
    citas: [
      { tipo: "regla", codigo: "NG-17", detalle: "Refuerzo horizontal 1#3@40, vertical 1#3@60" },
    ],
    requiereValidacion: false,
    confianza: 0.8,
  };
}
