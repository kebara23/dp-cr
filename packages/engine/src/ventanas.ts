import type { ResultadoTrazable } from "@diego-porras/shared";

export function calcularVentanasDesdeAgenda(
  cantidad: number,
  areaUnitariaM2: number,
  codigoCuadro: string
): ResultadoTrazable<{ cantidad: number; area_total_m2: number }> {
  const area_total_m2 = Math.round(cantidad * areaUnitariaM2 * 100) / 100;
  return {
    valor: { cantidad, area_total_m2 },
    formula: `${cantidad} und × ${areaUnitariaM2} m²/und = ${area_total_m2} m²`,
    citas: [
      { tipo: "cuadro", codigo: codigoCuadro, detalle: "Cantidad y área unitaria" },
      { tipo: "lamina", codigo: "A-09", detalle: "Agenda de ventanas" },
    ],
    requiereValidacion: true,
    confianza: 0.75,
  };
}
