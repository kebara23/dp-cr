import type { ResultadoTrazable } from "@diego-porras/shared";

export function calcularPinturaPerfiles(areaM2: number): ResultadoTrazable<{
  area_m2: number;
  manos: number;
  rendimiento_m2_gal: number;
  galones: number;
}> {
  const manos = 4;
  const rendimiento = 12;
  const galones = Math.round(((areaM2 * manos) / rendimiento) * 10) / 10;
  return {
    valor: {
      area_m2: areaM2,
      manos,
      rendimiento_m2_gal: rendimiento,
      galones,
    },
    formula: `(${areaM2} × ${manos} manos) / ${rendimiento} m²/gal = ${galones} gal`,
    citas: [{ tipo: "regla", codigo: "NET-02", detalle: "4 manos pintura anticorrosiva" }],
    requiereValidacion: false,
    confianza: 0.85,
  };
}
