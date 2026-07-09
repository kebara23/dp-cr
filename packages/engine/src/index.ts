import { PARTIDAS_MVP } from "@diego-porras/shared";
import type { MetradoInput, MetradoResult } from "@diego-porras/shared";

const SACO_CEMENTO_KG = 42.5;
const DENSIDAD_ACERO = 7850;

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

export function calcularTraslape(
  barra: string,
  longitudTotalM: number,
  traslapeM: number,
  areaCm2: number
): { longitudAdicionalM: number; pesoKg: number; formula: string } {
  const numBarras = Math.ceil(longitudTotalM / 6);
  const numTraslapes = Math.max(0, numBarras - 1);
  const longitudAdicional = numTraslapes * traslapeM;
  const pesoTotal = (longitudTotalM + longitudAdicional) * areaCm2 * 0.01 * DENSIDAD_ACERO / 1000;

  return {
    longitudAdicionalM: Math.round(longitudAdicional * 100) / 100,
    pesoKg: Math.round(pesoTotal * 100) / 100,
    formula: `L=${longitudTotalM}m + ${numTraslapes} traslapes × ${traslapeM}m, #${barra}`,
  };
}

export function calcularAreaConDesperdicio(areaM2: number, desperdicioPct: number): number {
  return Math.round(areaM2 * (1 + desperdicioPct / 100) * 100) / 100;
}

export function ejecutarMetrado(input: MetradoInput): MetradoResult | null {
  const partida = PARTIDAS_MVP.find((p) => p.codigo === input.partidaCodigo);
  if (!partida) return null;

  const d = input.parametros;
  const coef = input.coefDesperdicio ?? 1;
  let cantidad = 0;
  let formula = "";

  switch (input.partidaCodigo) {
    case "02.01":
      cantidad = (d.volumen ?? 0) * coef;
      formula = `Volumen=${d.volumen}m³`;
      break;
    case "03.01":
      cantidad = (d.largo ?? 0) * (d.alto ?? 0) * coef;
      formula = `${d.largo}m × ${d.alto}m`;
      break;
    case "05.01":
      cantidad = calcularAreaConDesperdicio((d.largo ?? 0) * (d.ancho ?? 0), d.desperdicio ?? 10);
      formula = `${d.largo}m × ${d.ancho}m + ${d.desperdicio ?? 10}% desperdicio`;
      break;
    case "06.02":
      cantidad = (d.ancho ?? 0) * (d.alto ?? 0) * (d.cantidad ?? 1);
      formula = `${d.ancho}m × ${d.alto}m × ${d.cantidad ?? 1} und`;
      break;
    case "07.01":
    case "07.02":
    case "09.02":
    case "09.03":
      cantidad = (d.longitud ?? 0) * coef;
      formula = `Longitud=${d.longitud}ml`;
      break;
    default:
      cantidad = (d.cantidad ?? d.area ?? d.volumen ?? d.longitud ?? 0) * coef;
      formula = `Parámetros: ${JSON.stringify(d)}`;
  }

  return {
    partidaCodigo: partida.codigo,
    descripcion: partida.descripcion,
    unidad: partida.unidad,
    cantidad: Math.round(cantidad * 100) / 100,
    formulaAplicada: formula,
    reglasCtkIds: [],
  };
}

export function generarListaCantidadesDefault(parametros: Record<string, Record<string, number>>): MetradoResult[] {
  const resultados: MetradoResult[] = [];

  for (const [partidaCodigo, params] of Object.entries(parametros)) {
    const r = ejecutarMetrado({ partidaCodigo, parametros: params });
    if (r && r.cantidad > 0) resultados.push(r);
  }

  return resultados;
}

export function calcularPresupuesto(
  lineas: Array<{ partidaCodigo: string; descripcion: string; unidad: string; cantidad: number }>,
  precios: Map<string, { precio: number; fuente: string }>,
  margenPct: number,
  impuestoPct: number
): {
  lineas: Array<{ partidaCodigo: string; descripcion: string; unidad: string; cantidad: number; precioUnitario: number; subtotal: number; fuente: string }>;
  subtotal: number;
  impuestos: number;
  total: number;
} {
  const lineasPresupuesto = lineas.map((l) => {
    const precio = precios.get(l.partidaCodigo) ?? { precio: 0, fuente: "sin fuente" };
    const subtotal = l.cantidad * precio.precio;
    return {
      ...l,
      precioUnitario: precio.precio,
      subtotal: Math.round(subtotal * 100) / 100,
      fuente: precio.fuente,
    };
  });

  const subtotal = lineasPresupuesto.reduce((s, l) => s + l.subtotal, 0);
  const conMargen = subtotal * (1 + margenPct / 100);
  const impuestos = conMargen * (impuestoPct / 100);
  const total = conMargen + impuestos;

  return {
    lineas: lineasPresupuesto,
    subtotal: Math.round(subtotal * 100) / 100,
    impuestos: Math.round(impuestos * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
