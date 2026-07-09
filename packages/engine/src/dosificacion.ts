import type { ResultadoTrazable } from "@diego-porras/shared";

const SACO_CEMENTO_KG = 42.5;

export function calcularDosificacion(
  fc: number,
  volumenM3: number,
  proporcion: { cemento: number; arena: number; piedra: number }
): {
  sacosCemento: number;
  m3Arena: number;
  m3Piedra: number;
  formula: string;
} {
  const totalPartes = proporcion.cemento + proporcion.arena + proporcion.piedra;
  const volCemento = (volumenM3 * proporcion.cemento) / totalPartes;
  const volArena = (volumenM3 * proporcion.arena) / totalPartes;
  const volPiedra = (volumenM3 * proporcion.piedra) / totalPartes;
  const sacos = Math.ceil((volCemento * 1400) / SACO_CEMENTO_KG);

  return {
    sacosCemento: sacos,
    m3Arena: Math.round(volArena * 100) / 100,
    m3Piedra: Math.round(volPiedra * 100) / 100,
    formula: `V=${volumenM3}m³ × ${proporcion.cemento}:${proporcion.arena}:${proporcion.piedra}`,
  };
}

export function calcularDosificacionTrazable(
  fc: number,
  volumenM3: number,
  proporcion: { cemento: number; arena: number; piedra: number } = { cemento: 1, arena: 2, piedra: 3 }
): ResultadoTrazable<ReturnType<typeof calcularDosificacion>> {
  const valor = calcularDosificacion(fc, volumenM3, proporcion);
  return {
    valor,
    formula: valor.formula,
    citas: [
      { tipo: "regla", codigo: "NG-01", detalle: "Tabla dosificaciones concreto" },
      { tipo: "tabla", codigo: `DOSIFICACION_CONCRETO/${fc}` },
    ],
    requiereValidacion: false,
    confianza: 0.95,
  };
}
