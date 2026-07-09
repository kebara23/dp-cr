import type { ResultadoTrazable } from "@diego-porras/shared";

export function calcularMamposteria(areaM2: number): ResultadoTrazable<{
  area_m2: number;
  refuerzo_horizontal: string;
  refuerzo_vertical: string;
  acero_kg: number;
}> {
  const acero_kg = Math.round(areaM2 * 0.4 * 10) / 10;
  return {
    valor: {
      area_m2: areaM2,
      refuerzo_horizontal: "1#3 @ 40 cm",
      refuerzo_vertical: "1#3 @ 60 cm",
      acero_kg,
    },
    formula: `${areaM2} m² × 0.4 kg/m² = ${acero_kg} kg`,
    citas: [{ tipo: "regla", codigo: "NG-17", detalle: "Mampostería refuerzo estándar" }],
    requiereValidacion: false,
    confianza: 0.8,
  };
}
