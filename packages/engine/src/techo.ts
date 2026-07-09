import type { ResultadoTrazable } from "@diego-porras/shared";

export function calcularAreaConDesperdicio(areaM2: number, desperdicioPct: number): number {
  return Math.round(areaM2 * (1 + desperdicioPct / 100) * 100) / 100;
}

export function calcularAreaTechoZinc(areaNetaM2: number): ResultadoTrazable<{
  area_neta_m2: number;
  traslape_pct: number;
  desperdicio_pct: number;
  area_total_m2: number;
}> {
  const traslape_pct = 13.6;
  const desperdicio_pct = 10;
  const conTraslape = areaNetaM2 * (1 + traslape_pct / 100);
  const area_total_m2 = Math.round(conTraslape * (1 + desperdicio_pct / 100) * 100) / 100;

  return {
    valor: {
      area_neta_m2: areaNetaM2,
      traslape_pct,
      desperdicio_pct,
      area_total_m2,
    },
    formula: `(${areaNetaM2} m² × 1.136 traslape × 1.10 desperdicio) = ${area_total_m2} m²`,
    citas: [
      { tipo: "regla", codigo: "NT-01", detalle: "Traslape 15 cm, calibre #26" },
      { tipo: "lamina", codigo: "A-03", detalle: "Área neta de techo" },
    ],
    requiereValidacion: false,
    confianza: 0.88,
  };
}
