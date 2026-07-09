import type { ResultadoTrazable } from "@diego-porras/shared";

const DENSIDAD_ACERO = 7850;

export function calcularTraslape(
  barra: string,
  longitudTotalM: number,
  traslapeM: number,
  areaCm2: number
): { longitudAdicionalM: number; pesoKg: number; formula: string } {
  const numBarras = Math.ceil(longitudTotalM / 6);
  const numTraslapes = Math.max(0, numBarras - 1);
  const longitudAdicional = numTraslapes * traslapeM;
  const pesoTotal = ((longitudTotalM + longitudAdicional) * areaCm2 * 0.01 * DENSIDAD_ACERO) / 1000;

  return {
    longitudAdicionalM: Math.round(longitudAdicional * 100) / 100,
    pesoKg: Math.round(pesoTotal * 100) / 100,
    formula: `L=${longitudTotalM}m + ${numTraslapes} traslapes × ${traslapeM}m, #${barra}`,
  };
}

export function calcularTraslapeTrazable(
  barra: string,
  longitudTotalM: number,
  traslapeM: number,
  areaCm2: number
): ResultadoTrazable<ReturnType<typeof calcularTraslape>> {
  const valor = calcularTraslape(barra, longitudTotalM, traslapeM, areaCm2);
  return {
    valor,
    formula: valor.formula,
    citas: [
      { tipo: "regla", codigo: "NG-05", detalle: "Distancia mínima entre traslapes" },
      { tipo: "tabla", codigo: `ACERO_REFUERZO/#${barra}` },
    ],
    requiereValidacion: false,
    confianza: 0.88,
  };
}
