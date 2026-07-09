import type { ResultadoTrazable, Cita } from "@dp/shared";

interface DosificacionConcreto {
  cemento_sacos: number;
  arena_m3: number;
  piedra_m3: number;
  agua_litros: number;
}

export function calcularDosificacion(
  fc: number, // f'c en kg/cm²
  volumen_m3: number
): ResultadoTrazable<DosificacionConcreto> {
  // Tabla dosificaciones (NG-01)
  const dosificaciones: Record<number, { sacos_por_m3: number; arena: number; piedra: number; agua: number }> = {
    210: { sacos_por_m3: 9.5, arena: 0.5, piedra: 0.75, agua: 200 },
    175: { sacos_por_m3: 8.0, arena: 0.5, piedra: 0.75, agua: 195 },
    140: { sacos_por_m3: 6.5, arena: 0.5, piedra: 0.75, agua: 185 },
  };

  const dosis = dosificaciones[fc];
  if (!dosis) {
    return {
      valor: { cemento_sacos: 0, arena_m3: 0, piedra_m3: 0, agua_litros: 0 },
      citas: [{ tipo: "regla", codigo: "NG-01", detalle: `f'c=${fc} no encontrada en tabla` }],
      requiereValidacion: true,
      confianza: 0.2,
    };
  }

  const resultado: DosificacionConcreto = {
    cemento_sacos: dosis.sacos_por_m3 * volumen_m3,
    arena_m3: dosis.arena * volumen_m3,
    piedra_m3: dosis.piedra * volumen_m3,
    agua_litros: dosis.agua * volumen_m3,
  };

  const citas: Cita[] = [
    {
      tipo: "regla",
      codigo: "NG-01",
      detalle: `Dosificación f'c=${fc}`,
    },
  ];

  return {
    valor: resultado,
    formula: `sacos = ${dosis.sacos_por_m3} × ${volumen_m3} m³`,
    citas,
    requiereValidacion: false,
    confianza: 0.95,
  };
}
