import type { ResultadoTrazable, Cita } from "@dp/shared";

export interface CalculoAcero {
  cantidad_kg: number;
  cantidad_varillas: number;
  traslape_mm: number;
  peso_total_kg: number;
}

export function calcularTraslapeAcero(
  barra: string, // "#3", "#4", "#5"
  fc: number
): ResultadoTrazable<number> {
  // Tabla traslapes (NE-ACERO-01 + NG-05)
  const traslapes: Record<string, Record<number, number>> = {
    "#3": { 210: 400, 175: 380, 140: 360 },
    "#4": { 210: 480, 175: 460, 140: 440 },
    "#5": { 210: 600, 175: 580, 140: 560 },
    "#6": { 210: 750, 175: 730, 140: 710 },
    "#7": { 210: 1050, 175: 1030, 140: 1010 },
  };

  const tabla = traslapes[barra];
  if (!tabla) {
    return {
      valor: 0,
      citas: [{ tipo: "tabla", codigo: "acero", detalle: `Barra ${barra} no encontrada` }],
      requiereValidacion: true,
      confianza: 0.1,
    };
  }

  const longitud = (tabla[fc] || tabla[210] || 0) as number;
  return {
    valor: longitud,
    formula: `traslape_${barra}_fc${fc} = ${longitud} mm (tabla NE-ACERO-01)`,
    citas: [
      { tipo: "tabla", codigo: "acero", detalle: `${barra} f'c=${fc}` },
      { tipo: "regla", codigo: "NG-05", detalle: "Distancia mínima entre traslapes" },
    ],
    requiereValidacion: false,
    confianza: 0.95,
  };
}

export function calcularPesoAcero(
  barra: string,
  cantidad_varillas: number,
  longitud_por_varilla_m: number
): ResultadoTrazable<number> {
  const pesos_por_metro: Record<string, number> = {
    "#3": 0.56,
    "#4": 0.99,
    "#5": 1.55,
    "#6": 2.24,
    "#7": 3.04,
  };

  const peso_por_m = pesos_por_metro[barra];
  if (!peso_por_m) {
    return {
      valor: 0,
      citas: [{ tipo: "tabla", codigo: "acero", detalle: `Barra ${barra} desconocida` }],
      requiereValidacion: true,
      confianza: 0,
    };
  }

  const total_m = cantidad_varillas * longitud_por_varilla_m;
  const peso_total = total_m * peso_por_m;

  return {
    valor: peso_total,
    formula: `${cantidad_varillas} × ${longitud_por_varilla_m} m × ${peso_por_m} kg/m = ${peso_total} kg`,
    citas: [
      { tipo: "tabla", codigo: "acero", detalle: `${barra}: ${peso_por_m} kg/m` },
      { tipo: "regla", codigo: "NE-ACERO-01", detalle: "Especificación ASTM A615" },
    ],
    requiereValidacion: false,
    confianza: 0.95,
  };
}
