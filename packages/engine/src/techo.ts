import type { ResultadoTrazable, Cita } from "@dp/shared";

export interface CalculoTecho {
  area_neta_m2: number;
  traslape_pct: number;
  desperdicio_pct: number;
  area_total_m2: number;
}

export function calcularAreaTechoZinc(area_neta_m2: number): ResultadoTrazable<CalculoTecho> {
  // NT-01: traslape 15 cm, desperdicio 10%
  // Traslape aumenta el área en función del ancho de la lámina (asumimos 1.10 m de ancho útil)
  // 15 cm traslape = ~13.6% área adicional
  const traslape_pct = 13.6;
  const desperdicio_pct = 10;

  const con_traslape = area_neta_m2 * (1 + traslape_pct / 100);
  const area_total = con_traslape * (1 + desperdicio_pct / 100);

  const resultado: CalculoTecho = {
    area_neta_m2,
    traslape_pct,
    desperdicio_pct,
    area_total_m2: area_total,
  };

  return {
    valor: resultado,
    formula: `(${area_neta_m2} m² × 1.136 traslape × 1.10 desperdicio) = ${area_total.toFixed(2)} m²`,
    citas: [
      { tipo: "regla", codigo: "NT-01", detalle: "Traslape 15 cm, calibre #26" },
      { tipo: "lamina", codigo: "A-03", detalle: "Área neta de techo" },
    ],
    requiereValidacion: false,
    confianza: 0.88,
  };
}
