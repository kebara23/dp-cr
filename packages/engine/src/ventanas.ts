import type { ResultadoTrazable, Cita } from "@dp/shared";

export function calcularVentanasDesdeAgenda(
  cantidad: number,
  area_unitaria_m2: number,
  codigo_cuadro: string
): ResultadoTrazable<{ cantidad: number; area_total_m2: number }> {
  // Desde cuadro A-09. Si es V-3, area ~2.1 m² (1.50×1.40)
  const area_total = cantidad * area_unitaria_m2;

  return {
    valor: { cantidad, area_total_m2: area_total },
    formula: `${cantidad} und × ${area_unitaria_m2} m²/und = ${area_total} m²`,
    citas: [
      { tipo: "cuadro", codigo: codigo_cuadro, detalle: "Cantidad y área unitaria" },
      { tipo: "lamina", codigo: "A-09", detalle: "Agenda de ventanas" },
    ],
    requiereValidacion: true,
    confianza: 0.75,
  };
}
