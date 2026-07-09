import type { ResultadoTrazable, Cita } from "@dp/shared";

export function calcularPinturaPerfiles(area_perfiles_m2: number): ResultadoTrazable<{ area_m2: number; manos: number; cantidad_galones: number }> {
  // NT-02: 4 manos de pintura anticorrosiva
  // Rendimiento: ~12 m²/galón por mano
  const manos = 4;
  const rendimiento_por_mano = 12; // m²/gal
  const galones_totales = (area_perfiles_m2 * manos) / rendimiento_por_mano;

  return {
    valor: {
      area_m2: area_perfiles_m2,
      manos,
      cantidad_galones: galones_totales,
    },
    formula: `(${area_perfiles_m2} m² × ${manos} manos) / ${rendimiento_por_mano} m²/gal = ${galones_totales.toFixed(1)} gal`,
    citas: [
      { tipo: "regla", codigo: "NT-02", detalle: "4 manos pintura anticorrosiva electrodo E6011" },
      { tipo: "lamina", codigo: "EST-01", detalle: "Area de perfiles a pintar" },
    ],
    requiereValidacion: false,
    confianza: 0.85,
  };
}
